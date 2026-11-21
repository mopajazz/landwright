import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startWalk,moveWalk} from '../walk.mjs';

test('Walk starts on the nearest dry cell and follows terrain within the world',()=>{
 const n=8,ground=new Float32Array(n*n).fill(30),surface=new Float32Array(n*n).fill(62);
 ground[4*n+4]=surface[4*n+4]=80;
 const walk=startWalk(ground,surface);
 assert.equal(walk.x,4);
 assert.equal(walk.y,4);
 assert.equal(walk.eye,80*.65+1.7);
 walk.yaw=0;
 for(let i=0;i<80;i++)moveWalk(walk,1,0,.05,surface);
 assert.ok(walk.x<n-1);
 assert.equal(walk.y,4);
 assert.ok(Math.abs(walk.eye-(62*.65+1.7))<.001);
});
