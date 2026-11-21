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

import {meanderPoint} from '../river-wand.mjs';
test('meander bends a straight stroke into smooth alternating curves, scaled by the setting and starting at the cursor',()=>{
 const swing=amount=>{const st={arc:0,prev:null,dir:null,phase:1},offs=[];for(let x=20;x<=230;x+=2)offs.push(meanderPoint(st,{x,y:128},5,amount,256).y-128);return offs;};
 assert.ok(swing(0).every(v=>v===0),'0% follows the stroke exactly');
 const mid=swing(.4),full=swing(1),peak=a=>Math.max(...a.map(Math.abs));
 assert.ok(peak(mid)>3&&peak(full)>peak(mid)*2,'amplitude grows with the setting');
 assert.ok(Math.abs(full[0])<.5,'starts at the cursor so the spring stays put');
 let sides=0;for(let i=1;i<full.length;i++)if(Math.sign(full[i])&&Math.sign(full[i-1])&&Math.sign(full[i])!==Math.sign(full[i-1]))sides++;assert.ok(sides>=4,'bends alternate sides');
 for(let i=1;i<full.length;i++)assert.ok(Math.abs(full[i]-full[i-1])<5*.6,'consecutive dabs overlap, so the carved channel is continuous');});

test('the channel is graded downhill along the stroke, through a rise, but holding still does not dig',()=>{
 const n=96,h=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)h[y*n+x]=100-x*.3+(x>40&&x<48?3:0);// a slope with a 3-block ridge across it
 const water=new Float32Array(n*n),stroke={pre:h.slice(),reach:new Float32Array(n*n),sediment:new Float32Array(n*n)};
 for(let x=10;x<=80;x++)wandDab(h,water,n,x,48,3,{depth:1,flow:0,stroke,floor:20,ceiling:190});
 for(let x=11;x<=80;x++)assert.ok(h[48*n+x]<=h[48*n+x-1]+1e-6,`bed never rises along the stroke (x=${x})`);
 const still=new Float32Array(n*n).fill(80),s2={pre:still.slice(),reach:new Float32Array(n*n),sediment:new Float32Array(n*n)};
 for(let k=0;k<300;k++)wandDab(still,new Float32Array(n*n),n,48,48,3,{depth:1,flow:0,stroke:s2,floor:20,ceiling:190});
 let deepest=0;for(const v of still)deepest=Math.max(deepest,80-v);assert.ok(deepest<=1+1e-6,`holding still stays within the carve depth (${deepest})`);});
