// River wand: draw a river and watch it carve. A stroke lowers the ground a
// little under the brush and releases water; while the stroke is held, moving
// water erodes its bed and carries sediment downstream, dropping it where the
// flow slows (fans, deltas, marshy flats). Everything here works on the
// authoritative bed and the poured-water depth field; nothing is derived-only.
import {heightStroke} from './terrain.mjs?v=2.15.0';

// Every River stroke releases the same small amount of water: enough to show
// which way the channel runs, never enough to flood a meadow. More water is a
// deliberate act with the droplet.
export const WAND_DEFAULTS={depth:1.5,water:15},STROKE_WATER=WAND_DEFAULTS.water,MAX_SPRINGS=64;
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
export function feedTrail(water,trail,flow){if(!trail.length)return;const each=flow/100*.10/trail.length;for(const i of trail)water[i]+=each;}
// A short-lived spring keeps a stroke flowing after release. Its remaining
// supply is saved so reopening a project cannot replenish a spent spring.
export const springSupply=rate=>rate/50;
export function feedSprings(water,springs){
 let fed=false;
 for(const spring of springs){
  const dose=Math.min(spring.remaining,spring.rate/100*.025);
  if(dose<=0)continue;
  water[spring.cell]+=dose;
  spring.remaining-=dose;
  fed=true;
 }
 return fed;
}
// Shift + River: dry an area. Removes springs and standing water under the brush.
export function dryArea(water,springs,n,cx,cy,r){const r2=r*r;for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(n-1,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(n-1,Math.ceil(cx+r));x++)if((x-cx)**2+(y-cy)**2<=r2)water[y*n+x]=0;
 return springs.filter(({cell})=>((cell%n)-cx)**2+(Math.floor(cell/n)-cy)**2>r2);}
// Add a spring at the start of a finished stroke, replacing any spring within
// two cells, and keep at most MAX_SPRINGS.
export function addSpring(springs,cell,rate,n){if(rate<=0)return springs;const x=cell%n,y=Math.floor(cell/n);const kept=springs.filter(s=>((s.cell%n)-x)**2+(Math.floor(s.cell/n)-y)**2>4);kept.push({cell,rate,remaining:springSupply(rate)});return kept.slice(-MAX_SPRINGS);}


// The creek a stroke leaves behind: its trail becomes a river route record
// (the same kind older maps use) whose water sits CREEK_FILL above the carved
// bed and never rises downstream. Static water shows the course and, with
// Living World, its direction; it cannot spread, so one pass never floods.
// Extra flow comes from the droplet.
export const CREEK_FILL=.35,TRIM_LIMIT=6;
function trimDisc(h,n,x,y,r,bed){for(let yy=Math.max(0,Math.floor(y-r));yy<=Math.min(n-1,Math.ceil(y+r));yy++)for(let xx=Math.max(0,Math.floor(x-r));xx<=Math.min(n-1,Math.ceil(x+r));xx++){const d=Math.hypot(xx-x,yy-y)/r;if(d>1)continue;const i=yy*n+xx,goal=bed+(h[i]-bed)*d*d;if(h[i]>goal)h[i]=goal;}}
export function creekRoute(trail,heights,n,{diameter=8,depth=1.5}={}){
 if(trail.length<3)return null;const points=[];let level=Infinity;
 // Trim bumps so the creek is continuous: where the bed rises above the water
 // arriving from upstream (a scour upstream or settled sediment), lower the
 // channel's center to just under that water, feathered across the creek's
 // width and by at most TRIM_LIMIT. Part of the same stroke for undo.
 const half=Math.max(1,Math.min(16,Math.round(diameter*.6))/2);
 for(const c of trail){const x=c%n,y=Math.floor(c/n);
  if(level<Infinity&&heights[c]+CREEK_FILL>level){const want=level-CREEK_FILL-.02;if(heights[c]-want<=TRIM_LIMIT)trimDisc(heights,n,x,y,half,want);}
  level=Math.min(level,heights[c]+CREEK_FILL);
  if(points.length&&Math.hypot(x-points.at(-1).x,y-points.at(-1).y)<1.5)continue;// thin the trail; `level` keeps falling for later points
  points.push({x,y,level:Math.max(0,Math.min(255,level))});}
 for(let i=1;i<points.length;i++)points[i].level=Math.min(points[i].level,points[i-1].level);
 if(points.length<2)return null;
 const every=Math.ceil(points.length/4096),sampled=every>1?points.filter((p,i)=>i%every===0||i===points.length-1):points;
 return {type:'river',width:Math.max(2,Math.min(32,Math.round(diameter*.6))),opacity:1,depth:Math.max(1,Math.min(16,depth)),points:sampled};}
