import{MATERIALS,blendPaint}from'./brushes.mjs?v=2.0.0';
export const ROUTE_WORK_LIMIT=8000000,PROJECT_WORK_LIMIT=32000000;
export function routeWork(r){let samples=1;for(let i=1;i<r.points.length;i++)samples+=Math.max(1,Math.ceil(Math.hypot(r.points[i].x-r.points[i-1].x,r.points[i].y-r.points[i-1].y)*2));return samples*(Math.ceil(r.width*1.5)+3)**2;}
const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
export function validRoute(r,n){return !!r&&['path','river'].includes(r.type)&&finite(r.width,2,32)&&finite(r.opacity,0,1)&&Array.isArray(r.points)&&r.points.length>=2&&r.points.length<=4096&&r.points.every((p,i)=>p&&finite(p.x,0,n-1)&&finite(p.y,0,n-1)&&(r.type!=='river'||finite(p.level,0,255)&&(!i||p.level<=r.points[i-1].level)))&&(r.type==='path'?[2,3,6].includes(r.material):finite(r.depth,1,16))&&routeWork(r)<=ROUTE_WORK_LIMIT;}
export function makeRoute(type,controls,options,heights,n){
 if(!Array.isArray(controls)||controls.length<2||controls.length>512||!controls.every(p=>p&&finite(p.x,0,n-1)&&finite(p.y,0,n-1)))return null;
 let points=[],length=0;const clamp=v=>Math.max(0,Math.min(n-1,v));
 for(let i=0;i<controls.length-1;i++){let a=controls[Math.max(0,i-1)],b=controls[i],c=controls[i+1],d=controls[Math.min(controls.length-1,i+2)],steps=Math.max(1,Math.ceil(Math.hypot(c.x-b.x,c.y-b.y)*1.5));
  for(let j=0;j<steps;j++){if(points.length>=4095)return null;let t=j/steps;const axis=k=>clamp(.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t));let p={x:axis('x'),y:axis('y')};if(points.length)length+=Math.hypot(p.x-points.at(-1).x,p.y-points.at(-1).y);points.push(p);}
 }
 points.push({...controls.at(-1)});length+=Math.hypot(points.at(-1).x-points.at(-2).x,points.at(-1).y-points.at(-2).y);if(length<1)return null;
 let route={type,width:options.width,opacity:type==='river'?1:options.opacity,points};
 if(type==='path')route.material=options.material;else{route.depth=options.depth;let previous=255;for(let p of points){let ground=heights[Math.round(p.y)*n+Math.round(p.x)];p.level=Math.max(0,Math.min(previous,ground-.5));previous=p.level;}}
 return validRoute(route,n)?route:null;
}
// One coverage value per cell prevents repeated samples from increasing opacity.
function footprint(route,n,extent=1){let distance=new Float32Array(n*n).fill(Infinity),levels=new Float32Array(n*n),radius=route.width/2;
 const dab=p=>{let reach=radius*extent;for(let y=Math.max(0,Math.floor(p.y-reach));y<=Math.min(n-1,Math.ceil(p.y+reach));y++)for(let x=Math.max(0,Math.floor(p.x-reach));x<=Math.min(n-1,Math.ceil(p.x+reach));x++){let d=Math.hypot(x-p.x,y-p.y)/radius,i=y*n+x;if(d<=extent&&d<distance[i]){distance[i]=d;levels[i]=p.level??0;}}};
 dab(route.points[0]);for(let i=1;i<route.points.length;i++){let a=route.points[i-1],b=route.points[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2));for(let j=1;j<=steps;j++){let t=j/steps;dab({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,level:(a.level??0)+((b.level??0)-(a.level??0))*t});}}
 return{distance,levels};
}
export function applyRoute(route,heights,paint,colors,alpha,n){let {distance,levels}=footprint(route,n,route.type==='river'?1.5:1);
 for(let i=0;i<distance.length;i++){let d=distance[i];if(!Number.isFinite(d))continue;if(route.type==='path'){let amount=Math.min(1,(1-d)*4)*route.opacity;if(amount<=0)continue;blendPaint(colors,alpha,i,MATERIALS[route.material-1][2],amount);paint[i]=route.material;}else{let target=levels[i]-route.depth*(.25+.75*Math.max(0,1-d*d)),weight=d<=1?1:Math.max(0,(1.5-d)*2);heights[i]=Math.max(0,Math.min(heights[i],heights[i]+(target-heights[i])*weight));}}
}
export function riverField(routes,n){let field=new Float32Array(n*n).fill(-1);for(let route of routes){if(route.type!=='river')continue;let {distance,levels}=footprint(route,n);for(let i=0;i<field.length;i++)if(distance[i]<=1)field[i]=Math.max(field[i],levels[i]);}return field;}
export function routeTouches(route,x,y,radius){for(let i=1;i<route.points.length;i++){let a=route.points[i-1],b=route.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<=radius+route.width/2)return true;}return false;}
export function waterSurface(heights,field,enabled){if(!enabled)return heights;let a=heights.slice();for(let i=0;i<a.length;i++)if(field[i]>a[i])a[i]=field[i];return a;}
