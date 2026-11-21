import {sampleTerrain} from './terrain3d.mjs?v=2.9.2-walk.1';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function startWalk(heights,surface){
 const n=Math.sqrt(heights.length),center=(n-1)/2;
 let nearest=Infinity,x=center,y=center;
 for(let i=0;i<heights.length;i++){
  if(surface[i]>heights[i]+.01)continue;
  const px=i%n,py=Math.floor(i/n),distance=(px-center)**2+(py-center)**2;
  if(distance<nearest){nearest=distance;x=px;y=py;}
 }
 return {x,y,yaw:nearest===Infinity?Math.PI/4:Math.atan2(center-y,center-x),pitch:-.08,eye:sampleTerrain(x,y,surface,0,false)*.65+1.7};
}
export function moveWalk(walk,forward,side,seconds,surface){
 const n=Math.sqrt(surface.length),speed=14*clamp(seconds,0,.05)/Math.max(1,Math.hypot(forward,side));
 const c=Math.cos(walk.yaw),s=Math.sin(walk.yaw);
 walk.x=clamp(walk.x+(forward*c-side*s)*speed,.1,n-1.1);
 walk.y=clamp(walk.y+(forward*s+side*c)*speed,.1,n-1.1);
 const eye=sampleTerrain(walk.x,walk.y,surface,0,false)*.65+1.7;
 walk.eye=Math.max(eye,walk.eye+(eye-walk.eye)*Math.min(1,seconds*12));
}
