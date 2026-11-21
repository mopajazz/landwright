import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startWalk,moveWalk} from '../walk.mjs';

import {verticalScale} from '../terrain3d.mjs';
test('Walk starts on the nearest dry cell and follows terrain within the world',()=>{
 const n=8,ground=new Float32Array(n*n).fill(30),surface=new Float32Array(n*n).fill(62);
 ground[4*n+4]=surface[4*n+4]=80;
 const walk=startWalk(ground,surface);
 assert.equal(walk.x,4);
 assert.equal(walk.y,4);
 assert.equal(walk.eye,80*verticalScale(n)+1.7+14);assert.equal(walk.flying,true,'arrives hovering');
 for(let i=0;i<100;i++)moveWalk(walk,0,0,.05,surface,-1);
 assert.equal(walk.flying,false);
 walk.yaw=0;
 for(let i=0;i<80;i++)moveWalk(walk,1,0,.05,surface);
 assert.ok(walk.x<n-1);
 assert.equal(walk.y,4);
 assert.ok(Math.abs(walk.eye-(62*verticalScale(n)+1.7))<.001);
});

import {generate,fitHeightRange} from '../terrain.mjs';
test('Walk starts on lowland at the edge of the land, facing inland, not on the summit',()=>{
 const n=128,h=fitHeightRange(generate(n,42,{shape:'island'})),surface=Float32Array.from(h,v=>Math.max(v,62));
 const walk=startWalk(h,surface),i=Math.round(walk.y)*n+Math.round(walk.x);
 let peak=0,dry=[];for(let j=0;j<h.length;j++)if(h[j]>=62){peak=Math.max(peak,h[j]);dry.push(h[j]);}dry.sort((a,b)=>a-b);
 assert.ok(h[i]>=62,'starts on dry ground');assert.ok(h[i]<=dry[Math.floor(dry.length*.25)]+1e-6,'starts on lowland');assert.ok(h[i]<peak-20,'not on the summit');
 // facing inland: a few steps forward is not lower than the start
 let ahead=0;for(let k=1;k<=12;k++){const x=Math.round(walk.x+Math.cos(walk.yaw)*k),y=Math.round(walk.y+Math.sin(walk.yaw)*k);ahead=Math.max(ahead,h[y*n+x]);}
 assert.ok(ahead>=h[i],'looks toward higher ground');});
test('Space flies up and holds altitude, Shift descends, landing returns to walking',()=>{
 const n=64,surface=new Float32Array(n*n).fill(80),walk=startWalk(surface,surface),ground=80*verticalScale(n)+1.7;
 for(let k=0;k<200;k++)moveWalk(walk,0,0,.05,surface,-1);assert.equal(walk.flying,false,'Shift lands from the starting hover');assert.ok(Math.abs(walk.eye-ground)<1e-9);
 for(let k=0;k<20;k++)moveWalk(walk,0,0,.05,surface,1);
 assert.ok(walk.flying);const high=walk.eye;assert.ok(high>ground+10,'rose about 12 blocks per second');
 for(let k=0;k<20;k++)moveWalk(walk,1,0,.05,surface,0);
 assert.ok(Math.abs(walk.eye-high)<1e-9,'hovers while moving without input');
 for(let k=0;k<200;k++)moveWalk(walk,0,0,.05,surface,-1);
 assert.ok(Math.abs(walk.eye-ground)<1e-9,'never sinks below eye height');assert.equal(walk.flying,false,'landed');
 // flying over a hill pushes the camera up rather than through it
 const hill=new Float32Array(n*n).fill(80);for(let y=0;y<n;y++)for(let x=40;x<n;x++)hill[y*n+x]=200;
 const w2={x:30,y:32,yaw:0,pitch:0,eye:ground+1,flying:true};for(let k=0;k<60;k++)moveWalk(w2,1,0,.05,hill,0);
 assert.ok(w2.eye>=200*verticalScale(n)+1.7-1e-9);
 // ceiling
 for(let k=0;k<2000;k++)moveWalk(w2,0,0,.05,hill,1);assert.ok(w2.eye<=255*verticalScale(n)+60+1e-9);});
