import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wandDab,erodeStep,settleSediment,drainToSea} from '../river-wand.mjs';
import {createPouredWater} from '../water-dropper.mjs';

// a slope falling east into the sea at x≈105
const slope=n=>{const h=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)h[y*n+x]=120-x*.55;return h;};
function draw(h,n,{from=10,to=60,y=64,erode=true,depth=.75}={}){
 const poured=createPouredWater(n),stroke={pre:h.slice(),reach:new Float32Array(n*n),sediment:new Float32Array(n*n)};
 for(let x=from;x<=to;x++){wandDab(h,poured.depth,n,x,y,3,{depth,stroke,floor:20,ceiling:190});for(let s=0;s<3;s++){poured.step(h);if(erode)erodeStep(h,poured.depth,stroke.sediment,n,{floor:20,sea:62});drainToSea(poured.depth,h,n,{sea:62});}}
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
