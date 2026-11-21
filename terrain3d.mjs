export function projectTerrain(x,y,z,w,h,camera){let c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),rx=(x-(camera.size||256)/2)*c-(y-(camera.size||256)/2)*s,ry=(x-(camera.size||256)/2)*s+(y-(camera.size||256)/2)*c,scale=terrainScale(w,h,camera);return{x:w/2+(camera.panX||0)+rx*scale,y:h*.57+(camera.panY||0)+ry*Math.sin(camera.pitch)*scale-(z-62)*.65*Math.cos(camera.pitch)*scale,depth:ry*Math.cos(camera.pitch)+(z-62)*.65*Math.sin(camera.pitch)};}
export function renderTerrain(c,w,h,heights,color,sea,water,camera,step=3,woodland=null){c.clearRect(0,0,w,h);if(!w||!h)return;const n=Math.sqrt(heights.length),cells=[];for(let y=0;y<n-1;y+=step)for(let x=0;x<n-1;x+=step){let x2=Math.min(n-1,x+step),y2=Math.min(n-1,y+step);const p=(xx,yy)=>{let z=heights[yy*n+xx];return projectTerrain(xx,yy,water?Math.max(sea,z):z,w,h,camera)};let vertices=[p(x,y),p(x2,y),p(x2,y2),p(x,y2)];cells.push({vertices,uv:[[x,y],[x2,y],[x2,y2],[x,y2]],textured:!!woodland?.image&&[y*n+x,y*n+x2,y2*n+x,y2*n+x2,Math.floor((y+y2)/2)*n+Math.floor((x+x2)/2)].some(i=>woodland.mask[i]>0),depth:vertices.reduce((a,b)=>a+b.depth,0),i:Math.floor((y+y2)/2)*n+Math.floor((x+x2)/2)});}cells.sort((a,b)=>a.depth-b.depth);for(let cell of cells){let v=cell.vertices,rgb=color(cell.i);c.fillStyle=c.strokeStyle=`rgb(${rgb.map(Math.round).join(',')})`;c.lineWidth=.45;for(let indices of[[0,1,2],[0,2,3]]){c.beginPath();c.moveTo(v[indices[0]].x,v[indices[0]].y);c.lineTo(v[indices[1]].x,v[indices[1]].y);c.lineTo(v[indices[2]].x,v[indices[2]].y);c.closePath();c.fill();c.stroke();if(cell.textured)textureTriangle(c,woodland.image,indices.map(i=>cell.uv[i].map(v=>(v+.5)*woodland.image.width/n)),indices.map(i=>v[i]));}}}

export function terrainScale(w,h,camera){return Math.max(.1,Math.min((w-50)/365,(h-100)/290))*camera.zoom*256/Math.max(256,camera.size??256);}
export function sampleTerrain(x,y,heights,sea,water){let n=Math.sqrt(heights.length);let ix=Math.max(0,Math.min((n-2),Math.floor(x))),iy=Math.max(0,Math.min((n-2),Math.floor(y))),u=Math.max(0,Math.min(1,x-ix)),v=Math.max(0,Math.min(1,y-iy));let a=heights[iy*n+ix],b=heights[iy*n+ix+1],c=heights[(iy+1)*n+ix],d=heights[(iy+1)*n+ix+1];if(water){a=Math.max(sea,a);b=Math.max(sea,b);c=Math.max(sea,c);d=Math.max(sea,d);}return u>=v?a+(b-a)*u+(d-b)*v:a+(d-c)*u+(c-a)*v;}
// Traverse heightfield cells front-to-back and intersect the exact rendered triangles.
// This also catches needle-like summits at grazing angles without ray-march gaps.
export function pickTerrain(sx,sy,w,h,camera,heights,sea,water){
 const n=Math.sqrt(heights.length),scale=terrainScale(w,h,camera),rx=(sx-w/2-(camera.panX||0))/scale,sv=(sy-h*.57-(camera.panY||0))/scale,c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),sp=Math.sin(camera.pitch),cp=Math.cos(camera.pitch);
 const ry=(sv+(260-62)*.65*cp)/sp,ox=n/2+rx*c+ry*s,oy=n/2-rx*s+ry*c,dx=-.65*cp/sp*s,dy=-.65*cp/sp*c;
 let enter=0,exit=260;
 for(let [o,d] of [[ox,dx],[oy,dy]]){if(Math.abs(d)<1e-12){if(o<0||o>(n-1))return null;}else{let a=-o/d,b=((n-1)-o)/d;enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));}}
 if(enter>exit)return null;
 let ix=Math.max(0,Math.min((n-2),Math.floor(ox+dx*(enter+1e-7)))),iy=Math.max(0,Math.min((n-2),Math.floor(oy+dy*(enter+1e-7))));
 const height=i=>water?Math.max(sea,heights[i]):heights[i];
 for(let count=0;count<2*n-3&&ix>=0&&iy>=0&&ix<(n-1)&&iy<(n-1);count++){
  let tx=Math.abs(dx)<1e-12?Infinity:(ix+(dx>0?1:0)-ox)/dx,ty=Math.abs(dy)<1e-12?Infinity:(iy+(dy>0?1:0)-oy)/dy,end=Math.min(exit,tx,ty),i=iy*n+ix,a=height(i),b=height(i+1),c=height(i+n),d=height(i+n+1),nearest=Infinity;
  for(let first of[true,false]){let gx=first?b-a:d-c,gy=first?d-b:c-a,constant=a+gx*(ox-ix)+gy*(oy-iy)-260,gradient=gx*dx+gy*dy+1;
   if(Math.abs(gradient)<1e-12)continue;let t=-constant/gradient;if(t<enter-1e-6||t>end+1e-6)continue;let u=ox+dx*t-ix,v=oy+dy*t-iy;
   if(u>=-1e-6&&u<=1.000001&&v>=-1e-6&&v<=1.000001&&(first?u>=v-1e-6:u<=v+1e-6))nearest=Math.min(nearest,t);
  }
  if(Number.isFinite(nearest))return{x:Math.max(0,Math.min((n-1),ox+dx*nearest)),y:Math.max(0,Math.min((n-1),oy+dy*nearest))};
  if(end>=exit-1e-8)break;if(tx<=ty+1e-8)ix+=dx>0?1:-1;if(ty<=tx+1e-8)iy+=dy>0?1:-1;enter=end;
 }
 return null;
}
export function createFrameScheduler(render,request=globalThis.requestAnimationFrame??(fn=>setTimeout(fn,16))){let pending=false;return()=>{if(pending)return;pending=true;request(time=>{pending=false;render(time);});};}

// Affine texture mapping preserves canopy detail on the lightweight fallback mesh.
function textureTriangle(c,image,uv,p){let ux=uv[1][0]-uv[0][0],uy=uv[1][1]-uv[0][1],vx=uv[2][0]-uv[0][0],vy=uv[2][1]-uv[0][1],det=ux*vy-vx*uy;if(Math.abs(det)<1e-9)return;let dx=p[1].x-p[0].x,dy=p[1].y-p[0].y,ex=p[2].x-p[0].x,ey=p[2].y-p[0].y,a=(dx*vy-ex*uy)/det,b=(dy*vy-ey*uy)/det,d=(ey*ux-dy*vx)/det,k=(ex*ux-dx*vx)/det;c.save();c.beginPath();c.moveTo(p[0].x,p[0].y);c.lineTo(p[1].x,p[1].y);c.lineTo(p[2].x,p[2].y);c.closePath();c.clip();c.transform(a,b,k,d,p[0].x-a*uv[0][0]-k*uv[0][1],p[0].y-b*uv[0][0]-d*uv[0][1]);c.drawImage(image,0,0);c.restore();}
