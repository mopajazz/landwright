import {MATERIALS} from './brushes.mjs?v=1.6.0';
import {validShape} from './shapes.mjs?v=1.6.0';
export const defaultLayers=()=>({surface:{visible:true,locked:false},landmarks:{visible:true,locked:false},shapes:{visible:true,locked:false},elevation:{visible:true,locked:false}});
export function brushDelta(e){if(typeof e.deltaY==='number')return e.shiftKey?(e.deltaY<0?1:e.deltaY>0?-1:0):0;let key=e.key?.toLowerCase();return key==='w'?(e.shiftKey?10:1):key==='s'?-(e.shiftKey?10:1):0;}
export const resizeBrush=(size,delta)=>Math.max(4,Math.min(120,size+delta));
export function normalizeProject(s,n){
 const explicitSize=n!==undefined;n=n??s?.size??256;
 const bad=()=>{throw Error('Invalid project')},finite=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
 if(!explicitSize&&![128,192,256].includes(n))bad();
 if(!s||![1,2,3].includes(s.version)||!Array.isArray(s.heights)||s.heights.length!==n*n||!s.heights.every(v=>finite(v,0,255))||!Array.isArray(s.paint)||s.paint.length!==n*n||!s.paint.every(v=>Number.isInteger(v)&&v>=0&&v<=6)||!finite(s.sea,10,150))bad();
 let marks=s.marks??[],shapes=s.shapes??[];
 if(!Array.isArray(marks)||marks.length>3000||!marks.every(m=>m&&['tree','mountain','town'].includes(m.type)&&finite(m.x,0,n-Number.EPSILON)&&m.x<n&&finite(m.y,0,n)&&m.y<n&&finite(m.size,2,40)&&(m.opacity===undefined||finite(m.opacity,0,1))))bad();
 if(!Array.isArray(shapes)||shapes.length>500||!shapes.every(x=>validShape(x,n))||shapes.reduce((count,x)=>count+x.points.length,0)>100000)bad();
 let layers=defaultLayers();for(let key of Object.keys(layers))if(s.layers?.[key])for(let flag of['visible','locked']){if(typeof s.layers[key][flag]!=='boolean')bad();layers[key][flag]=s.layers[key][flag];}
 let paintColors,paintAlpha;
 if(s.version===3){if(!Array.isArray(s.paintColors)||s.paintColors.length!==n*n*3||!s.paintColors.every(v=>Number.isInteger(v)&&v>=0&&v<=255)||!Array.isArray(s.paintAlpha)||s.paintAlpha.length!==n*n||!s.paintAlpha.every(v=>finite(v,0,1)))bad();paintColors=[...s.paintColors];paintAlpha=[...s.paintAlpha];}
 else{paintColors=Array(n*n*3).fill(0);paintAlpha=s.paint.map(v=>v?1:0);s.paint.forEach((v,i)=>{if(v)for(let k=0;k<3;k++)paintColors[i*3+k]=MATERIALS[v-1][2][k];});}
 return{version:3,size:n,name:String(s.name||'Untitled world').slice(0,80),heights:[...s.heights],paint:[...s.paint],paintColors,paintAlpha,sea:s.sea,water:s.water!==false,shade:s.shade!==false,marks:marks.map(m=>({type:m.type,x:m.x,y:m.y,size:m.size,opacity:m.opacity??1})),shapes:structuredClone(shapes),layers};
}
