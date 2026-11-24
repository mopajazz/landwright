import{brushWeight}from'./brushes.mjs?v=2.12.1';
import{verticalScale}from'./terrain3d.mjs?v=2.12.1';
export function generate(n,seed=42,{shape="island",relief=1}={}){if(shape==='flat')return new Float32Array(n*n).fill(80);let hash=(x,y)=>{let v=Math.sin(x*127.1+y*311.7+seed*0.79)*43758.5453;return v-Math.floor(v)};let noise=(x,y)=>{let a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(a,b)*(1-u)+hash(a+1,b)*u)*(1-v)+(hash(a,b+1)*(1-u)+hash(a+1,b+1)*u)*v};let data=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){let u=x/n*2-1,v=y/n*2-1;let angle=Math.atan2(v,u),radius=Math.hypot(u*1.04,v);let coast=.74+.09*Math.sin(angle*3+1)+.05*Math.sin(angle*7);let f=noise(x/n*4,y/n*4)*.55+noise(x/n*9,y/n*9)*.27+noise(x/n*22,y/n*22)*.12+noise(x/n*60,y/n*60)*.06;let mask=coast-radius;
if(shape==='continent')mask=.85-Math.hypot(u*.72+.13,v*.91)+.12*Math.sin(v*7+u*3);
if(shape==='archipelago'){mask=.22-Math.hypot(u+.06,v-.02);for(let j=0;j<6;j++){let a=j*Math.PI/3+seed*.1,cx=Math.cos(a)*(.63+(j%2)*.07),cy=Math.sin(a)*(.63+(j%2)*.07);mask=Math.max(mask,.17+(j%3)*.022-Math.hypot(u-cx,v-cy));}mask*=1.7;}
if(shape==='atoll')mask=.16-Math.abs(radius-(.55+.04*Math.sin(angle*5)));
let z=62+mask*155+(f-.48)*155;
if(shape==='archipelago')z=62+mask*155+(f-.48)*70;
if(shape==='atoll')z=62+mask*250+(f-.48)*60;
if(shape==='blank')z=30;else if(z>62)z=62+(z-62)*relief;
data[y*n+x]=Math.max(10,Math.min(250,z));}return data;}
export function stroke(a,n,cx,cy,r,p,tool,target=100,{preserveBoundary=true,preset='soft'}={}){let original=tool==='smooth'?a.slice():a;for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(n,cy+r);y++)for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(n,cx+r);x++){let d=Math.hypot(x-cx,y-cy)/r;if(d>=1)continue;let i=y*n+x,w=brushWeight(x,y,cx,cy,r,preset);if(tool==='smooth'){let sum=0,c=0;for(let yy=Math.max(0,y-2);yy<=Math.min(n-1,y+2);yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(n-1,x+2);xx++){sum+=original[yy*n+xx];c++;}a[i]+=(sum/c-a[i])*w*p/15;}else if(tool==='flatten'){if(preserveBoundary)w*=Math.min(1,x/4,y/4,(n-1-x)/4,(n-1-y)/4);a[i]+=(target-a[i])*w*p/30;}else a[i]+=w*p*(tool==='lower'?-1:1);a[i]=Math.max(0,Math.min(255,a[i]));}}

// ---------------------------------------------------------------------------
// Height baseline. Every world has a soft working range inside the hard 0..255
// limits. Raise/Lower slow down near it and never cross it.
export const DEFAULT_FLOOR=20,DEFAULT_CEILING=190,FLOOR_MAX=120,CEILING_MIN=100,MIN_RANGE=30;
export function validHeightRange(floor,ceiling){return Number.isInteger(floor)&&Number.isInteger(ceiling)&&floor>=0&&floor<=FLOOR_MAX&&ceiling>=CEILING_MIN&&ceiling<=255&&ceiling-floor>=MIN_RANGE;}
// Steepest slope a stroke may create, in height units per cell: about 50° as
// drawn in 3D, whatever the map size.
export const maxSlope=n=>1.2/verticalScale(n);
// Raise (dir 1) or Lower (dir -1) with a per-stroke budget in height units.
// `pre` is the terrain before the stroke and `reach` the strongest footprint
// weight each cell has received this stroke, so holding or scrubbing can never
// add more than budget × footprint, much like paint opacity per stroke.
export function heightStroke(a,n,cx,cy,r,{dir=1,budget=3,pre,reach,floor=DEFAULT_FLOOR,ceiling=DEFAULT_CEILING,preset='soft'}={}){
 const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(n-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(n-1,Math.ceil(cy+r)),rate=Math.min(1,.2+1.5/Math.max(1,r)),soft=14;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let w=brushWeight(x,y,cx,cy,r,preset);if(!w)continue;let i=y*n+x;if(w>reach[i])reach[i]=w;
  let goal=pre[i]+dir*budget*reach[i],h=a[i];
  if(dir>0){if(h>=ceiling||h>=goal)continue;goal=Math.min(goal,ceiling);let ease=Math.max(.08,Math.min(1,(ceiling-h)/soft));a[i]=Math.min(goal,h+budget*w*rate*ease);}
  else{if(h<=floor||h<=goal)continue;goal=Math.max(goal,floor);let ease=Math.max(.08,Math.min(1,(h-floor)/soft));a[i]=Math.max(goal,h-budget*w*rate*ease);}}
 limitSlope(a,n,x0,y0,x1,y1,dir,pre);}
// Pull back only what this stroke added (or removed) where it created a slope
// steeper than maxSlope. Pre-existing cliffs are left alone.
function limitSlope(a,n,x0,y0,x1,y1,dir,pre,m=maxSlope(n)){x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);x1=Math.min(n-1,x1+1);y1=Math.min(n-1,y1+1);
 for(let pass=0;pass<3;pass++)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let i=y*n+x,h=a[i];if(dir>0?h<=pre[i]:h>=pre[i])continue;
  let lo=Infinity,hi=-Infinity;if(x>0){lo=Math.min(lo,a[i-1]);hi=Math.max(hi,a[i-1]);}if(x<n-1){lo=Math.min(lo,a[i+1]);hi=Math.max(hi,a[i+1]);}if(y>0){lo=Math.min(lo,a[i-n]);hi=Math.max(hi,a[i-n]);}if(y<n-1){lo=Math.min(lo,a[i+n]);hi=Math.max(hi,a[i+n]);}
  if(dir>0&&h>lo+m)a[i]=Math.max(pre[i],lo+m);else if(dir<0&&h<hi-m)a[i]=Math.min(pre[i],hi-m);}}
// Raise/Lower with a percentage Strength (v2.11.1). Each dab adds
// strength/100 × 3 × footprint weight, so repeated strokes keep building, as
// before v2.10. It still eases into the height range and never passes it, and a
// loose spike guard (about 68° in 3D) stops single-cell needles; ordinary
// strokes never reach it. `pre` is the terrain before the stroke, so cliffs
// that already existed are left alone.
export const spikeSlope=n=>2.5/verticalScale(n);
export function strengthStroke(a,n,cx,cy,r,{dir=1,strength=8,pre,floor=DEFAULT_FLOOR,ceiling=DEFAULT_CEILING,preset='soft'}={}){
 const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(n-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(n-1,Math.ceil(cy+r)),p=strength/100*3,soft=14;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const w=brushWeight(x,y,cx,cy,r,preset);if(!w)continue;const i=y*n+x,h=a[i];
  if(dir>0){if(h>=ceiling)continue;a[i]=Math.min(ceiling,h+w*p*Math.max(.08,Math.min(1,(ceiling-h)/soft)));}
  else{if(h<=floor)continue;a[i]=Math.max(floor,h-w*p*Math.max(.08,Math.min(1,(h-floor)/soft)));}}
 if(pre)limitSlope(a,n,x0,y0,x1,y1,dir,pre,spikeSlope(n));}

// Knock down walls and spikes one or two cells thick, and fill pits and slots
// one or two cells wide the same way (raised to the lower neighbor - limit). A cell is one when it
// stands more than `limit` above both of its neighbors along either axis (x or
// y); it is lowered to that pair's higher neighbor + limit. A pair of cells is
// a two-cell wall when both stand more than `limit` above the cells either
// side of the pair. Ridges three or more cells thick and one-sided cliffs
// never match. Repeats until nothing changes (at
// most `passes`). Returns the number of cells changed.
const EPS=1e-3;// heights are Float32: ignore rounding so a second run is a no-op
export function removeSpikes(a,n,{limit=spikeSlope(n),x0=0,y0=0,x1=n-1,y1=n-1,passes=6}={}){
 x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(n-1,x1);y1=Math.min(n-1,y1);const changed=new Set();
 for(let pass=0;pass<passes;pass++){let any=false;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*n+x,h=a[i];let cap=Infinity;
   if(x>0&&x<n-1){const m=Math.max(a[i-1],a[i+1]);if(h>m+limit+EPS)cap=Math.min(cap,m+limit);}
   if(y>0&&y<n-1){const m=Math.max(a[i-n],a[i+n]);if(h>m+limit+EPS)cap=Math.min(cap,m+limit);}
   // the mirror case: pits one cell wide are raised to the lower neighbor - limit
   let floorTo=-Infinity;
   if(x>0&&x<n-1){const m=Math.min(a[i-1],a[i+1]);if(h<m-limit-EPS)floorTo=Math.max(floorTo,m-limit);}
   if(y>0&&y<n-1){const m=Math.min(a[i-n],a[i+n]);if(h<m-limit-EPS)floorTo=Math.max(floorTo,m-limit);}
   if(cap<h){a[i]=cap;changed.add(i);any=true;}else if(floorTo>h){a[i]=floorTo;changed.add(i);any=true;}}
  // walls two cells thick: both cells stand more than limit above the cells
  // either side of the pair
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*n+x;
   for(const [step,ok] of [[1,x>0&&x<n-2],[n,y>0&&y<n-2]]){if(!ok)continue;const out=Math.max(a[i-step],a[i+2*step]),top=out+limit;
    if(a[i]>top+EPS&&a[i+step]>top+EPS){a[i]=top;a[i+step]=top;changed.add(i);changed.add(i+step);any=true;continue;}
    const rim=Math.min(a[i-step],a[i+2*step]),bottom=rim-limit;
    if(a[i]<bottom-EPS&&a[i+step]<bottom-EPS){a[i]=bottom;a[i+step]=bottom;changed.add(i);changed.add(i+step);any=true;}}}
  if(!any)break;}
 return changed.size;}

// Fit generated terrain into the working range. If peaks exceed the ceiling,
// the band from (ceiling - soft) to the highest peak is compressed linearly
// into (ceiling - soft)..ceiling; the seabed is treated the same way. Shapes
// stay continuous and ordered; terrain already inside the range is untouched.
export function fitHeightRange(a,floor=DEFAULT_FLOOR,ceiling=DEFAULT_CEILING,soft=24){const top=ceiling-soft,bottom=floor+soft;
 let max=-Infinity,min=Infinity;for(const v of a){if(v>max)max=v;if(v<min)min=v;}
 for(let i=0;i<a.length;i++){let v=a[i];
  if(max>ceiling&&v>top)v=top+(v-top)*(ceiling-top)/(max-top);
  if(min<floor&&v<bottom)v=bottom-(bottom-v)*(bottom-floor)/(bottom-min);
  a[i]=v;}return a;}
