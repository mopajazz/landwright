// River wand: draw a river and watch it carve. A stroke lowers the ground a
// little under the brush and releases water; while the stroke is held, moving
// water erodes its bed and carries sediment downstream, dropping it where the
// flow slows (fans, deltas, marshy flats). Everything here works on the
// authoritative bed and the poured-water depth field; nothing is derived-only.
import {heightStroke} from './terrain.mjs?v=2.11.1';

export const WAND_DEFAULTS={depth:1.5,water:60},MAX_SPRINGS=64;
const EROSION=.06,MAX_CUT=.05,FAST=.04,SETTLE=.5,WET=.02;

// One dab: carve under the brush (bounded per stroke, like Lower) and add water
// at the center. `stroke` holds {pre, reach} for the whole gesture.
export function wandDab(heights,water,n,cx,cy,r,{depth=WAND_DEFAULTS.depth,flow=WAND_DEFAULTS.water,stroke,floor,ceiling,preset='soft'}){
 heightStroke(heights,n,cx,cy,r,{dir:-1,budget:depth,pre:stroke.pre,reach:stroke.reach,floor,ceiling,preset});
 const x=Math.round(cx),y=Math.round(cy);if(x<0||y<0||x>=n||y>=n)return;
 gradeChannel(heights,n,x,y,r,stroke,{floor,limit:Math.max(6,depth*4)});
 // water scales with brush area so wide strokes are not starved
 water[y*n+x]+=flow/100*.35*Math.max(1,r*.5);
}

// Keep the drawn channel running downhill along the stroke: each new point's
// bed is held a little below the previous one, cutting through rises (at most
// `limit` below the ground there before the stroke), so the water follows the
// line you drew instead of spilling over the lower bank. Cuts are feathered
// across the channel so the sides stay smooth.
const GRADE_DROP=.08;
function gradeChannel(heights,n,x,y,r,stroke,{floor=0,limit=6}){
 const c=y*n+x,inner=Math.max(1.5,r*.55);
 // grade only as the stroke moves on; holding still must not dig a pit
 if(stroke.lastCell!==undefined&&Math.hypot(x-stroke.lastCell%n,y-Math.floor(stroke.lastCell/n))<1)return;
 if(stroke.lastBed!==undefined){
  const target=Math.max(floor,stroke.pre[c]-limit,stroke.lastBed-GRADE_DROP);
  if(heights[c]>target)for(let yy=Math.max(0,Math.floor(y-inner));yy<=Math.min(n-1,Math.ceil(y+inner));yy++)for(let xx=Math.max(0,Math.floor(x-inner));xx<=Math.min(n-1,Math.ceil(x+inner));xx++){
   const d=Math.hypot(xx-x,yy-y)/inner;if(d>1)continue;const i=yy*n+xx,goal=target+(heights[c]-target)*d*d;if(heights[i]>goal)heights[i]=Math.max(floor,goal);}
 }
 stroke.lastBed=heights[c];stroke.lastCell=c;
}

// One erosion step while the stroke is held. Water moving downhill lowers its
// bed in proportion to depth and surface drop; the material is carried to the
// lowest neighbor and deposited where the surface flattens or meets the sea.
let incomingBuffer=new Float32Array(0);
export function erodeStep(heights,water,sediment,n,{floor=0,sea=62,ocean=null}){
 if(incomingBuffer.length!==heights.length)incomingBuffer=new Float32Array(heights.length);
 const incoming=incomingBuffer;incoming.fill(0);let moved=false;
 for(let i=0;i<heights.length;i++){
  const w=water[i],carried=sediment[i];if(w<WET&&carried<=0)continue;
  const x=i%n,surface=heights[i]+w;let low=-1,drop=0;
  for(const j of [x>0?i-1:-1,x<n-1?i+1:-1,i>=n?i-n:-1,i<heights.length-n?i+n:-1]){if(j<0)continue;const d=surface-(heights[j]+water[j]);if(d>drop){drop=d;low=j;}}
  const inSea=ocean?ocean[i]>.95:heights[i]<sea;
  if(w>=WET&&drop>FAST&&!inSea&&low>=0){
   const cut=Math.min(MAX_CUT,EROSION*Math.min(w,2)*drop,Math.max(0,heights[i]-floor));
   if(cut>0){heights[i]-=cut;incoming[low]+=cut;moved=true;}
  }
  if(carried>0){
   if(inSea||drop<=FAST||low<0){
    // settle where flow is slow, at a dead end, or in the sea up to just below sea level
    const room=inSea?Math.max(0,sea-.2-heights[i]):Infinity,settle=Math.min(carried*SETTLE,room);
    heights[i]+=settle;sediment[i]-=settle;
    if(sediment[i]>0&&low>=0){incoming[low]+=sediment[i]*.5;sediment[i]*=.5;}
   }else{incoming[low]+=carried;sediment[i]=0;}
   moved=true;
  }
 }
 for(let i=0;i<heights.length;i++)if(incoming[i])sediment[i]+=incoming[i];
 return moved;
}

// When the stroke ends, whatever is still in suspension settles in place; in
// the sea it can build up to just below sea level and the rest washes out.
export function settleSediment(heights,sediment,ceiling=255,{sea=-Infinity}={}){for(let i=0;i<heights.length;i++)if(sediment[i]>0){const top=heights[i]<sea?Math.max(heights[i],sea-.2):ceiling;heights[i]=Math.min(top,heights[i]+sediment[i]);sediment[i]=0;}}

// The open sea absorbs water that reaches it, so rivers can run out.
export function drainToSea(water,heights,n,{sea=62,ocean=null}){let any=false;for(let i=0;i<water.length;i++){if(water[i]<=0)continue;if(ocean?ocean[i]>.95:heights[i]<sea-1){water[i]*=.35;if(water[i]<.005)water[i]=0;any=true;}}return any;}

// While a stroke is held, the whole drawn trail stays wet so the channel fills
// as you draw and erosion works along all of it, not only under the cursor.
export function feedTrail(water,trail,flow){if(!trail.length)return;const each=flow/100*.6/Math.sqrt(trail.length);for(const i of trail)water[i]+=each;}
// Springs keep a river flowing after the stroke: each feeds water at its rate
// (Water %) every simulation tick. The sea and map edge drain it, so rivers
// reach a steady flow; where water cannot leave it fills hollows into lakes.
export function feedSprings(water,springs){for(const {cell,rate} of springs)water[cell]+=rate/100*.5;}
// Shift + River: dry an area. Removes springs and standing water under the brush.
export function dryArea(water,springs,n,cx,cy,r){const r2=r*r;for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(n-1,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(n-1,Math.ceil(cx+r));x++)if((x-cx)**2+(y-cy)**2<=r2)water[y*n+x]=0;
 return springs.filter(({cell})=>((cell%n)-cx)**2+(Math.floor(cell/n)-cy)**2>r2);}
// Add a spring at the start of a finished stroke, replacing any spring within
// two cells, and keep at most MAX_SPRINGS.
export function addSpring(springs,cell,rate,n){if(rate<=0)return springs;const x=cell%n,y=Math.floor(cell/n);const kept=springs.filter(s=>((s.cell%n)-x)**2+(Math.floor(s.cell/n)-y)**2>4);kept.push({cell,rate});return kept.slice(-MAX_SPRINGS);}

// Meander: swing the carving point to either side of the drawn stroke along a
// smooth two-frequency wave, so even a straight drag makes winding bends.
// `state` keeps the stroke's smoothed direction and arc length.
export function meanderPoint(state,p,r,amount,n){
 if(state.prev){const dx=p.x-state.prev.x,dy=p.y-state.prev.y,len=Math.hypot(dx,dy);
  if(len>1e-6){state.arc+=len;const ux=dx/len,uy=dy/len;if(!state.dir)state.dir={x:ux,y:uy};else{const mx=state.dir.x*.85+ux*.15,my=state.dir.y*.85+uy*.15,ml=Math.hypot(mx,my)||1;state.dir={x:mx/ml,y:my/ml};}}}
 state.prev={x:p.x,y:p.y};
 if(!(amount>0)||!state.dir)return {x:p.x,y:p.y};
 const full=amount*Math.max(5,r*2.5),wavelength=Math.max(28,r*12,full*8),amp=full*Math.min(1,state.arc/(wavelength*.5)),a=state.arc/wavelength*Math.PI*2+state.phase;
 const off=amp*(Math.sin(a)+.35*Math.sin(a*2.3+1.7))/1.35;
 return {x:Math.max(0,Math.min(n-1,p.x-state.dir.y*off)),y:Math.max(0,Math.min(n-1,p.y+state.dir.x*off))};}
