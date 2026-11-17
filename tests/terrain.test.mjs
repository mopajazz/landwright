import {test} from 'node:test';
import assert from 'node:assert/strict';
const {generate,stroke}=await import('../terrain.mjs');
test('generation is deterministic and contains land and sea',()=>{let a=generate(128,42),b=generate(128,42);assert.deepEqual(a,b);assert.ok(a.some(h=>h<62));assert.ok(a.some(h=>h>140));});
test('brush raises locally and respects map bounds',()=>{let a=new Float32Array(64*64).fill(100);stroke(a,64,32,32,8,10,'raise');assert.ok(a[32*64+32]>100);assert.equal(a[0],100);stroke(a,64,0,0,8,10,'lower');assert.ok(a[0]<100);assert.ok(a.every(Number.isFinite));});
test('smoothing reduces a spike without touching distant cells',()=>{let a=new Float32Array(32*32).fill(80);a[16*32+16]=200;stroke(a,32,16,16,5,5,'smooth');assert.ok(a[16*32+16]<200);assert.equal(a[0],80);});
test('flatten converges toward the target and elevation clamps',()=>{let a=new Float32Array(32*32).fill(100);stroke(a,32,16,16,5,10,'flatten',150);assert.ok(a[16*32+16]>100&&a[16*32+16]<150);for(let i=0;i<30;i++)stroke(a,32,0,0,8,30,'lower');assert.equal(a[0],0);});
