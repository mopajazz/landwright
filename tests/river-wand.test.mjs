import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wandDab,erodeStep,settleSediment,drainToSea} from '../river-wand.mjs';
import {createPouredWater} from '../water-dropper.mjs';

// a slope falling east into the sea at x≈105
const slope=n=>{const h=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)h[y*n+x]=120-x*.55;return h;};
function draw(h,n,{from=10,to=60,y=64,erode=true,depth=.75}={}){
 const poured=createPouredWater(n),stroke={pre:h.slice(),reach:new Float32Array(n*n),sediment:new Float32Array(n*n)};
 for(let x=from;x<=to;x++){wandDab(h,poured.depth,n,x,y,3,{depth,flow:60,stroke,floor:20,ceiling:190});for(let s=0;s<3;s++){poured.step(h);if(erode)erodeStep(h,poured.depth,stroke.sediment,n,{floor:20,sea:62});drainToSea(poured.depth,h,n,{sea:62});}}
 settleSediment(h,stroke.sediment,190,{sea:62});return {poured,stroke};
}

test('a dab carves a bounded groove and releases water at the brush',()=>{const n=64,h=new Float32Array(n*n).fill(80),poured=createPouredWater(n),stroke={pre:h.slice(),reach:new Float32Array(n*n),sediment:new Float32Array(n*n)};
 for(let k=0;k<200;k++)wandDab(h,poured.depth,n,32,32,4,{depth:.75,stroke,floor:20,ceiling:190});
 let deepest=0;for(const v of h)deepest=Math.max(deepest,80-v);assert.ok(Math.abs(deepest-.75)<1e-6,'held carving stops at the per-stroke depth');
 assert.ok(poured.depth[32*n+32]>0);
 const dry=createPouredWater(n);wandDab(h,dry.depth,n,32,32,4,{flow:0,stroke,floor:20,ceiling:190});assert.equal(dry.depth[32*n+32],0,'Water 0% carves without adding water');});

test('flowing water deepens the drawn channel and carries sediment to a delta at the coast',()=>{const n=128,base=slope(n);
 const eroded=base.slice();draw(eroded,n);const carvedOnly=base.slice();draw(carvedOnly,n,{erode:false});
 const along=(h,x0,x1)=>{let s=0;for(let x=x0;x<=x1;x++)s+=base[64*n+x]-h[64*n+x];return s;};
 assert.ok(along(eroded,15,55)>along(carvedOnly,15,55)+1,'erosion deepens the channel beyond the brush cut');
 let delta=0;for(let x=95;x<115;x++)for(let y=58;y<=70;y++)delta=Math.max(delta,eroded[y*n+x]-base[y*n+x]);assert.ok(delta>.3,'sediment builds up where the river meets the sea');
 for(let x=95;x<115;x++)for(let y=58;y<=70;y++)if(base[y*n+x]<62)assert.ok(eroded[y*n+x]<=62-.2+1e-6||eroded[y*n+x]<=base[y*n+x]+1e-6,'deltas stay just below sea level');
 // ground far from the river is untouched
 for(let y=0;y<40;y++)for(let x=0;x<n;x++)assert.equal(eroded[y*n+x],base[y*n+x]);});

test('erosion never digs below the seabed floor, and without moving water nothing erodes',()=>{const n=64,h=new Float32Array(n*n);for(let i=0;i<h.length;i++)h[i]=21+(i%n)*.01;
 const water=new Float32Array(n*n).fill(3),sediment=new Float32Array(n*n);for(let k=0;k<500;k++)erodeStep(h,water,sediment,n,{floor:20,sea:10});for(const v of h)assert.ok(v>=20-1e-9);
 const still=new Float32Array(n*n).fill(80),copy=still.slice();erodeStep(still,new Float32Array(n*n),new Float32Array(n*n),n,{floor:20,sea:62});assert.deepEqual(still,copy);});

test('the sea absorbs water so rivers can run out',()=>{const n=32,h=new Float32Array(n*n).fill(40),water=new Float32Array(n*n).fill(1);for(let k=0;k<20;k++)drainToSea(water,h,n,{sea:62});assert.ok(water.every(v=>v===0));
 const land=new Float32Array(n*n).fill(80),w2=new Float32Array(n*n).fill(1);drainToSea(w2,land,n,{sea:62});assert.ok(w2.every(v=>v===1),'water on land is kept');});

test('the channel is graded downhill along the stroke, through a rise, but holding still does not dig',()=>{
 const n=96,h=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)h[y*n+x]=100-x*.3+(x>40&&x<48?3:0);// a slope with a 3-block ridge across it
 const water=new Float32Array(n*n),stroke={pre:h.slice(),reach:new Float32Array(n*n),sediment:new Float32Array(n*n)};
 for(let x=10;x<=80;x++)wandDab(h,water,n,x,48,3,{depth:1,flow:0,stroke,floor:20,ceiling:190});
 for(let x=11;x<=80;x++)assert.ok(h[48*n+x]<=h[48*n+x-1]+1e-6,`bed never rises along the stroke (x=${x})`);
 const still=new Float32Array(n*n).fill(80),s2={pre:still.slice(),reach:new Float32Array(n*n),sediment:new Float32Array(n*n)};
 for(let k=0;k<300;k++)wandDab(still,new Float32Array(n*n),n,48,48,3,{depth:1,flow:0,stroke:s2,floor:20,ceiling:190});
 let deepest=0;for(const v of still)deepest=Math.max(deepest,80-v);assert.ok(deepest<=1+1e-6,`holding still stays within the carve depth (${deepest})`);});

test('a spring runs out instead of continuously filling a closed basin',async()=>{
 const {addSpring,feedSprings}=await import('../river-wand.mjs');
 const water=new Float64Array(64), springs=addSpring([],27,100,8);
 const supply=springs[0].remaining;
 assert.ok(supply>0&&supply<=2);
 for(let i=0;i<1000;i++)feedSprings(water,springs);
 assert.ok(Math.abs(water[27]-supply)<1e-9);
 assert.equal(feedSprings(water,springs),false);
});

import {feedSprings,feedTrail,addSpring,STROKE_WATER} from '../river-wand.mjs';
// A short mountain creek beside a meadow, separated by a low bank, driven the
// way the app drives it: dabs while dragging, simulation ticks of three flow
// steps, trail water while held, and a short-lived spring after release.
function creekWorld(n=128){const h=new Float32Array(n*n);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){let v;
  if(x<62)v=130-x*.5;                    // mountain slope falling west → east
  else if(x<=63)v=130-61*.5+.6;          // a low lip at the foot of the slope
  else v=130-61*.5-1;                    // the meadow: flat, a block below the slope's foot
  h[y*n+x]=v;}return h;}
function tick(h,poured,springs,n,stroke){if(springs.length){feedSprings(poured.depth,springs);}if(stroke)feedTrail(poured.depth,stroke.trail,STROKE_WATER);
 for(let s=0;s<3;s++){poured.step(h);if(stroke)erodeStep(h,poured.depth,stroke.sediment,n,{floor:20,sea:62});drainToSea(poured.depth,h,n,{sea:62});}}
function drawCreek(h,n,poured){let springs=[];const stroke={pre:h.slice(),reach:new Float32Array(n*n),sediment:new Float32Array(n*n),trail:[]};
 for(let x=10;x<=60;x++){wandDab(h,poured.depth,n,x,56,3,{depth:1.5,flow:STROKE_WATER,stroke,floor:20,ceiling:190});const c=56*n+x;if(!stroke.trail.includes(c))stroke.trail.push(c);if(x%3===0)tick(h,poured,springs,n,stroke);}
 settleSediment(h,stroke.sediment,190,{sea:62});springs=addSpring(springs,stroke.trail[0],STROKE_WATER,n);return springs;}
const wetIn=(poured,n,x0,x1,y0,y1,t=.02)=>{let c=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(poured.depth[y*n+x]>t)c++;return c;};

test('one River pass makes a readable creek that stays behind a low lip; flooding the meadow takes a deliberate pour',()=>{
 const n=128,h=creekWorld(n),before=h.slice(),poured=createPouredWater(n);let springs=drawCreek(h,n,poured);
 // readable: the channel is cut along the stroke and carries water at release
 let cut=0;for(let x=12;x<=58;x++)if(before[56*n+x]-h[56*n+x]>.5)cut++;assert.ok(cut>=40,`channel cut along the stroke (${cut}/47)`);
 assert.ok(wetIn(poured,n,10,70,54,58)>=20,'water shows the channel');
 // the stroke's water and its short-lived spring run their course without topping the bank
 for(let k=0;k<400;k++)tick(h,poured,springs,n,null);
 assert.equal(wetIn(poured,n,66,110,40,72),0,'the meadow beyond the lip stays dry after one pass');
 assert.ok(springs.every(s=>s.remaining<=1e-9),'the spring is spent');
 // a deliberate pour with the droplet floods the meadow
 for(let k=0;k<300;k++){poured.depth[56*n+20]+=1.2;tick(h,poured,[],n,null);}
 assert.ok(wetIn(poured,n,66,110,40,72)>50,`a deliberate pour down the creek tops the lip and floods the meadow (${wetIn(poured,n,66,110,40,72)})`);});

import {creekRoute,CREEK_FILL} from '../river-wand.mjs';
test('the creek a stroke leaves is continuous and runs downhill, even past a bump in the bed',()=>{
 const n=64,h=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)h[y*n+x]=100-x*.4;
 h[32*n+20]-=1.5;h[32*n+30]+=1;// a scour, then a bump of settled sediment
 const trail=[];for(let x=5;x<=55;x++)trail.push(32*n+x);
 const creek=creekRoute(trail,h,n,{diameter:6,depth:1.5});
 assert.equal(creek.type,'river');assert.ok(creek.width>=2&&creek.width<=32);
 for(let i=1;i<creek.points.length;i++)assert.ok(creek.points[i].level<=creek.points[i-1].level,'never rises');
 for(const p of creek.points)assert.ok(p.level>h[p.y*n+p.x]+.01,`water shows at every point (x=${p.x})`);
 for(const p of creek.points)assert.ok(p.level<=h[p.y*n+p.x]+CREEK_FILL+.05,'and stays a thin film (feathered trims can lower a neighbor by a few hundredths)');});
