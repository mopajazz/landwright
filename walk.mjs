import {sampleTerrain,verticalScale} from './terrain3d.mjs?v=2.11.2';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const EYE_HEIGHT=1.7,FLY_SPEED=12,FLY_CEILING=60,START_HOVER=14;
const groundEye=(walk,surface,n)=>sampleTerrain(walk.x,walk.y,surface,0,false)*verticalScale(n)+EYE_HEIGHT;

// Start on open lowland at the edge of the main landmass, facing inland, so the
// first view looks across the land instead of into the side of a summit.
export function startWalk(heights,surface){
 const n=Math.sqrt(heights.length),dry=[];
 for(let i=0;i<heights.length;i++)if(surface[i]<=heights[i]+.01)dry.push(i);
 if(!dry.length){const c=(n-1)/2;return {x:c,y:c,yaw:Math.PI/4,pitch:-.08,eye:sampleTerrain(c,c,surface,0,false)*verticalScale(n)+EYE_HEIGHT,flying:false};}
 let cx=0,cy=0;for(const i of dry){cx+=i%n;cy+=Math.floor(i/n);}cx/=dry.length;cy/=dry.length;
 // Lowland: the lowest quarter of dry ground, away from steep slopes.
 const sorted=dry.map(i=>heights[i]).sort((a,b)=>a-b),low=sorted[Math.floor((sorted.length-1)*.25)];
 const gentle=i=>{const x=i%n,y=Math.floor(i/n);let steep=0;for(const j of [x>0?i-1:i,x<n-1?i+1:i,y>0?i-n:i,y<n-1?i+n:i])steep=Math.max(steep,Math.abs(heights[i]-heights[j]));return steep<=2;};
 let best=-1,bestDistance=Infinity;
 for(const i of dry){if(heights[i]>low+1e-6||!gentle(i))continue;const d=(i%n-cx)**2+(Math.floor(i/n)-cy)**2;if(d<bestDistance){bestDistance=d;best=i;}}
 if(best<0)for(const i of dry){const d=(i%n-cx)**2+(Math.floor(i/n)-cy)**2;if(d<bestDistance){bestDistance=d;best=i;}}
 const x=best%n,y=Math.floor(best/n),facing=Math.hypot(cx-x,cy-y)>1?Math.atan2(cy-y,cx-x):Math.PI/4;
 // Arrive hovering a little above the ground so the first view is a landscape;
 // Shift lands.
 return {x,y,yaw:facing,pitch:-.14,eye:sampleTerrain(x,y,surface,0,false)*verticalScale(n)+EYE_HEIGHT+START_HOVER,flying:true};
}

// forward/side/rise are -1..1. Rise > 0 flies up (Space), < 0 descends (Shift).
// While flying the camera holds its altitude; landing (descending to eye
// height) returns to walking, where the camera follows the ground.
export function moveWalk(walk,forward,side,seconds,surface,rise=0){
 const n=Math.sqrt(surface.length),dt=clamp(seconds,0,.05),speed=14*dt/Math.max(1,Math.hypot(forward,side));
 const c=Math.cos(walk.yaw),s=Math.sin(walk.yaw);
 walk.x=clamp(walk.x+(forward*c-side*s)*speed,.1,n-1.1);
 walk.y=clamp(walk.y+(forward*s+side*c)*speed,.1,n-1.1);
 const ground=groundEye(walk,surface,n),ceiling=255*verticalScale(n)+FLY_CEILING;
 if(rise>0)walk.flying=true;
 if(walk.flying){
  walk.eye=clamp(walk.eye+rise*FLY_SPEED*dt,ground,ceiling);
  if(rise<0&&walk.eye<=ground+1e-6)walk.flying=false;
 }else walk.eye=Math.max(ground,walk.eye+(ground-walk.eye)*Math.min(1,dt*12));
}
