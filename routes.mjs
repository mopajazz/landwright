import{applyMaterialCoverage}from'./material-paint.mjs?v=2.9.1';
import{MATERIALS,blendPaint}from'./brushes.mjs?v=2.9.1';
export const ROUTE_WORK_LIMIT=8000000,PROJECT_WORK_LIMIT=32000000;
export function routeWork(r){let samples=1;for(let i=1;i<r.points.length;i++)samples+=Math.max(1,Math.ceil(Math.hypot(r.points[i].x-r.points[i-1].x,r.points[i].y-r.points[i-1].y)*2));return samples*(Math.ceil(r.width*1.5)+3)**2;}
const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
export function validRoute(r,n){return !!r&&['path','river'].includes(r.type)&&finite(r.width,2,32)&&finite(r.opacity,0,1)&&Array.isArray(r.points)&&r.points.length>=2&&r.points.length<=4096&&r.points.every((p,i)=>p&&finite(p.x,0,n-1)&&finite(p.y,0,n-1)&&(r.type!=='river'||finite(p.level,0,255)&&(!i||p.level<=r.points[i-1].level)))&&(r.type==='path'?[2,3,6].includes(r.material):finite(r.depth,1,16)&&(r.taper===undefined||typeof r.taper==='boolean'))&&routeWork(r)<=ROUTE_WORK_LIMIT;}
export function routeFractions(points){let a=new Float64Array(points.length),total=0;for(let i=1;i<points.length;i++){total+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);a[i]=total;}if(total)for(let i=1;i<a.length;i++)a[i]/=total;return a;}
export function routeRadius(route,t){return Math.max(route.type==='river'&&route.taper===true?.75:0,route.width/2*(route.type==='river'&&route.taper===true?.25+.75*t:1));}
function meanderPoints(points,width,amount,n){if(!amount)return;let fractions=routeFractions(points),source=points.map(p=>({...p})),seed=Math.sin(source[0].x*127.1+source[0].y*311.7)*43758.5453,phase=(seed-Math.floor(seed))*Math.PI*2,total=0;for(let i=1;i<source.length;i++)total+=Math.hypot(source[i].x-source[i-1].x,source[i].y-source[i-1].y);for(let i=1;i<points.length-1;i++){let t=fractions[i],a=source[i-1],b=source[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,offset=Math.sin(t*total/Math.max(8,width*4)*Math.PI*2+phase)*Math.sin(Math.PI*t)**2*(.8+.2*Math.sin(t*Math.PI*2+phase))*width/2*amount;points[i].x=Math.max(0,Math.min(n-1,source[i].x-dy/len*offset));points[i].y=Math.max(0,Math.min(n-1,source[i].y+dx/len*offset));}}
export function reflowRivers(routes,heights,n){return routes.map(route=>{if(route.type!=='river')return route;let previous=255;return{...route,points:route.points.map(p=>{let level=Math.max(0,Math.min(previous,heights[Math.round(p.y)*n+Math.round(p.x)]-.5));previous=level;return{...p,level};})};});}
export function makeRoute(type,controls,options,heights,n){
 if(!Array.isArray(controls)||controls.length<2||controls.length>512||!controls.every(p=>p&&finite(p.x,0,n-1)&&finite(p.y,0,n-1)))return null;
 let points=[],length=0;const clamp=v=>Math.max(0,Math.min(n-1,v));
 for(let i=0;i<controls.length-1;i++){let a=controls[Math.max(0,i-1)],b=controls[i],c=controls[i+1],d=controls[Math.min(controls.length-1,i+2)],steps=Math.max(1,Math.ceil(Math.hypot(c.x-b.x,c.y-b.y)*1.5));
  for(let j=0;j<steps;j++){if(points.length>=4095)return null;let t=j/steps;const axis=k=>clamp(.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t));let p={x:axis('x'),y:axis('y')};if(points.length)length+=Math.hypot(p.x-points.at(-1).x,p.y-points.at(-1).y);points.push(p);}
 }
 points.push({...controls.at(-1)});length+=Math.hypot(points.at(-1).x-points.at(-2).x,points.at(-1).y-points.at(-2).y);if(length<1)return null;
 if(type==='river'){if(options.meander!==undefined&&!finite(options.meander,0,1))return null;meanderPoints(points,options.width,options.meander??0,n);}
 let route={type,width:options.width,opacity:type==='river'?1:options.opacity,points};
 if(type==='path')route.material=options.material;else{route.depth=options.depth;route.taper=options.taper===true;let previous=255;for(let p of points){let ground=heights[Math.round(p.y)*n+Math.round(p.x)];p.level=Math.max(0,Math.min(previous,ground-.5));previous=p.level;}}
 return validRoute(route,n)?route:null;
}
// One coverage value per cell prevents repeated samples from increasing opacity.
function footprint(route,n,extent=1){let distance=new Float32Array(n*n).fill(Infinity),levels=new Float32Array(n*n),fractions=routeFractions(route.points);
 const dab=(p,t)=>{let radius=routeRadius(route,t),reach=radius*extent;for(let y=Math.max(0,Math.floor(p.y-reach));y<=Math.min(n-1,Math.ceil(p.y+reach));y++)for(let x=Math.max(0,Math.floor(p.x-reach));x<=Math.min(n-1,Math.ceil(p.x+reach));x++){let d=Math.hypot(x-p.x,y-p.y)/radius,i=y*n+x;if(d<=extent&&d<distance[i]){distance[i]=d;levels[i]=p.level??0;}}};
 dab(route.points[0],0);for(let i=1;i<route.points.length;i++){let a=route.points[i-1],b=route.points[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2));for(let j=1;j<=steps;j++){let t=j/steps;dab({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,level:(a.level??0)+((b.level??0)-(a.level??0))*t},fractions[i-1]+(fractions[i]-fractions[i-1])*t);}}
 return{distance,levels};
}
export function applyRoute(route,heights,paint,colors,alpha,n,coverage=null){let {distance,levels}=footprint(route,n,route.type==='river'?1.5:1);
 for(let i=0;i<distance.length;i++){let d=distance[i];if(!Number.isFinite(d))continue;if(route.type==='path'){let amount=Math.min(1,(1-d)*4)*route.opacity;if(amount<=0)continue;blendPaint(colors,alpha,i,MATERIALS[route.material-1][2],amount);paint[i]=route.material;if(coverage)applyMaterialCoverage(coverage,i,{id:route.material,amount,alpha:alpha[i]});}else{let target=levels[i]-route.depth*(.25+.75*Math.max(0,1-d*d)),weight=d<=1?1:Math.max(0,(1.5-d)*2);heights[i]=Math.max(0,Math.min(heights[i],heights[i]+(target-heights[i])*weight));}}
}
export function riverField(routes,n){let field=new Float32Array(n*n).fill(-1);for(let route of routes){if(route.type!=='river')continue;let {distance,levels}=footprint(route,n);for(let i=0;i<field.length;i++)if(distance[i]<=1)field[i]=Math.max(field[i],levels[i]);}return field;}
export function routeTouches(route,x,y,radius){let fractions=routeFractions(route.points);for(let i=1;i<route.points.length;i++){let a=route.points[i-1],b=route.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<=radius+routeRadius(route,fractions[i-1]+(fractions[i]-fractions[i-1])*t))return true;}return false;}
export function waterSurface(heights,field,enabled){if(!enabled)return heights;let a=heights.slice();for(let i=0;i<a.length;i++)if(field[i]>a[i])a[i]=field[i];return a;}

// Cached by the editor; reuse the same bounded raster footprint as Path paint.
export function pathField(routes,n){let mask=new Uint8Array(n*n);for(let r of routes){if(r.type!=='path'||!r.opacity)continue;let {distance}=footprint(r,n);for(let i=0;i<mask.length;i++)if(distance[i]<=1)mask[i]=1;}return mask;}
