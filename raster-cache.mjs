// Derived raster storage only. Compare cell inputs, then repaint the affected
// pixel rectangle plus interpolation/shadow neighbors at the original resolution.
export function rasterFrame(cache,n,width,fields,key=''){
 const reuse=cache?.n===n&&cache.width===width&&cache.key===key&&cache.fields.length===fields.length;
 const data=reuse?cache.data:new Uint8ClampedArray(width*width*4);
 let minX=n,minY=n,maxX=-1,maxY=-1;
 if(reuse){
  for(let f=0;f<fields.length;f++){
   const field=fields[f],previous=cache.fields[f],stride=field.length/(n*n);
   for(let i=0;i<field.length;i++)if(field[i]!==previous[i]){
    const cell=Math.floor(i/stride),x=cell%n,y=Math.floor(cell/n);
    minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
   }
  }
 }
 const bounds=!reuse?{x0:0,y0:0,x1:width,y1:width}:maxX<0?{x0:0,y0:0,x1:0,y1:0}:{
  x0:Math.max(0,Math.floor((minX-2)*width/n)),y0:Math.max(0,Math.floor((minY-2)*width/n)),
  x1:Math.min(width,Math.ceil((maxX+3)*width/n)),y1:Math.min(width,Math.ceil((maxY+3)*width/n))
 };
 if(cache)Object.assign(cache,{n,width,key,data,fields:fields.map(field=>field.slice())});
 return{data,bounds};
}
