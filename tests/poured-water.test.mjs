import test from 'node:test';
import assert from 'node:assert/strict';
import {createPouredWater} from '../water-dropper.mjs';

test('a finite pour moves downhill, preserves the bed, and pools in closed ground',()=>{
 const n=7, bed=new Float32Array(n*n).fill(90), upper=3*n+2, lower=upper+1;
 bed[upper]=20;bed[lower]=10;
 const flow=createPouredWater(n);
 flow.depth[upper]=5;
 for(let i=0;i<160;i++)flow.step(bed);
 assert.ok(flow.depth[upper]<.001);
 assert.ok(Math.abs(flow.depth[lower]-5)<.001);
 assert.equal(bed[upper],20);
 assert.equal(bed[lower],10);
});

test('water crosses a rim only after the pool reaches it, and drains at the edge',()=>{
 const n=7, bed=new Float32Array(n*n).fill(100), pool=3*n+3;
 bed[pool]=10;bed[pool+1]=12;bed[pool+2]=9;bed[pool+3]=8;
 const flow=createPouredWater(n);
 flow.depth[pool]=1;
 flow.step(bed);
 assert.equal(flow.depth[pool+1],0);
 flow.depth[pool]=10;
 for(let i=0;i<200;i++)flow.step(bed);
 assert.ok(flow.depth[pool]<3);
 assert.ok(flow.depth.reduce((a,b)=>a+b,0)<3);
});
