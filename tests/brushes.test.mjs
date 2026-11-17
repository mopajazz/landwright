import{test}from'node:test';import assert from'node:assert/strict';import{brushWeight}from'../brushes.mjs';
test('Hard Round has uniform coverage with a crisp circular edge',()=>{assert.equal(brushWeight(0,0,0,0,10,'hard'),1);assert.equal(brushWeight(9,0,0,0,10,'hard'),1);assert.equal(brushWeight(10,0,0,0,10,'hard'),0);});
