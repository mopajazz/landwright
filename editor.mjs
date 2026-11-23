import {DEFAULT_FLOOR,DEFAULT_CEILING,validHeightRange} from './terrain.mjs?v=2.11.1';
import {MAX_WATER_DROPS} from './water-dropper.mjs?v=2.11.1';
import{validateMaterialCoverage}from'./material-paint.mjs?v=2.11.1';
import{validRoute,routeWork,PROJECT_WORK_LIMIT}from'./routes.mjs?v=2.11.1';
import {LEGACY_MATERIAL_COLORS} from './brushes.mjs?v=2.11.1';
import {validShape} from './shapes.mjs?v=2.11.1';
export const isWorldSize = size => [128, 192, 256, 512].includes(size);
export const defaultLayers=()=>({surface:{visible:true,locked:false},landmarks:{visible:true,locked:false},shapes:{visible:true,locked:false},elevation:{visible:true,locked:false},rivers:{visible:true,locked:false},forests:{visible:true,locked:false}});
export function brushDelta(e){if(typeof e.deltaY==='number')return e.shiftKey?(e.deltaY<0?1:e.deltaY>0?-1:0):0;let key=e.key?.toLowerCase();return key==='w'?(e.shiftKey?10:1):key==='s'?-(e.shiftKey?10:1):0;}
export const resizeBrush=(size,delta)=>Math.max(4,Math.min(120,size+delta));
export function normalizeProject(s,n){
 const explicitSize=n!==undefined;n=n??s?.size??256;
 const bad=()=>{throw Error('Invalid project')},finite=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
 if(!explicitSize&&!isWorldSize(n))bad();
 if(!s||![1,2,3,4,5,6,7,8,9].includes(s.version)||!Array.isArray(s.heights)||s.heights.length!==n*n||!s.heights.every(v=>finite(v,0,255))||!Array.isArray(s.paint)||s.paint.length!==n*n||!s.paint.every(v=>Number.isInteger(v)&&v>=0&&v<=(s.version>=7?9:6))||!finite(s.sea,10,150))bad();
 let forest=s.version>=5?s.forest:Array(n*n).fill(0);if(!Array.isArray(forest)||forest.length!==n*n||!forest.every(v=>finite(v,0,1)))bad();
 let marks=s.marks??[],shapes=s.shapes??[];
 if(!Array.isArray(marks)||marks.length>3000||!marks.every(m=>m&&['tree','mountain','town'].includes(m.type)&&finite(m.x,0,n-Number.EPSILON)&&m.x<n&&finite(m.y,0,n)&&m.y<n&&finite(m.size,2,40)&&(m.opacity===undefined||finite(m.opacity,0,1))))bad();
 if(!Array.isArray(shapes)||shapes.length>500||!shapes.every(x=>validShape(x,n))||shapes.reduce((count,x)=>count+x.points.length,0)>100000)bad();
 let routes=s.routes??[];if(!Array.isArray(routes)||routes.length>64||!routes.every(r=>validRoute(r,n))||routes.reduce((sum,r)=>sum+r.points.length,0)>32768||routes.reduce((sum,r)=>sum+routeWork(r),0)>PROJECT_WORK_LIMIT)bad();
 const waterDrops=s.waterDrops??[];
 if(!Array.isArray(waterDrops)||waterDrops.length>MAX_WATER_DROPS||!waterDrops.every(drop=>
  drop&&Number.isInteger(drop.cell)&&drop.cell>=0&&drop.cell<n*n&&finite(drop.level,0,255)))bad();
 const pouredWater=s.pouredWater??[];
 if(!Array.isArray(pouredWater)||pouredWater.length>n*n||!pouredWater.every((entry,i)=>
  Array.isArray(entry)&&entry.length===2&&Number.isInteger(entry[0])&&entry[0]>=0&&entry[0]<n*n&&
  (!i||entry[0]>pouredWater[i-1][0])&&finite(entry[1],.00001,1e8)))bad();
 let layers=defaultLayers();for(let key of Object.keys(layers))if(s.layers?.[key])for(let flag of['visible','locked']){if(typeof s.layers[key][flag]!=='boolean')bad();layers[key][flag]=s.layers[key][flag];}
 let paintColors,paintAlpha;
 if(s.version>=3){if(!Array.isArray(s.paintColors)||s.paintColors.length!==n*n*3||!s.paintColors.every(v=>Number.isInteger(v)&&v>=0&&v<=255)||!Array.isArray(s.paintAlpha)||s.paintAlpha.length!==n*n||!s.paintAlpha.every(v=>finite(v,0,1)))bad();paintColors=[...s.paintColors];paintAlpha=[...s.paintAlpha];}
 else{paintColors=Array(n*n*3).fill(0);paintAlpha=s.paint.map(v=>v?1:0);s.paint.forEach((v,i)=>{if(v)for(let k=0;k<3;k++)paintColors[i*3+k]=LEGACY_MATERIAL_COLORS[v-1][k];});}
 let surfaceMaterials=s.version>=7?s.surfaceMaterials:'';validateMaterialCoverage(surfaceMaterials,n,paintAlpha);
 const floor=s.floor??DEFAULT_FLOOR,ceiling=s.ceiling??DEFAULT_CEILING;if(!validHeightRange(floor,ceiling))bad();
const springs=s.springs??[];if(!Array.isArray(springs)||springs.length>64||!springs.every(e=>Array.isArray(e)&&e.length===2&&Number.isInteger(e[0])&&e[0]>=0&&e[0]<n*n&&Number.isFinite(e[1])&&e[1]>0&&e[1]<=100))bad();
return{version:9,floor,ceiling,...(springs.length?{springs:springs.map(e=>e.slice())}:{}),...(pouredWater.length?{pouredWater:pouredWater.map(entry=>entry.slice())}:{}),...(waterDrops.length?{waterDrops:waterDrops.map(({cell,level})=>({cell,level}))}:{}),surfaceMaterials,forest:[...forest],routes:structuredClone(routes),size:n,name:String(s.name||'Untitled world').slice(0,80),heights:[...s.heights],paint:[...s.paint],paintColors,paintAlpha,sea:s.sea,water:s.water!==false,shade:s.shade!==false,marks:marks.filter(m=>m.type!=='town').map(m=>({type:m.type,x:m.x,y:m.y,size:m.size,opacity:m.opacity??1})),shapes:structuredClone(shapes),layers};
}
