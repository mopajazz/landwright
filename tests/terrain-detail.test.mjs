import test from 'node:test';
import assert from 'node:assert/strict';
import {packTerrainDetail} from '../terrain-detail.mjs';

test('detail texture preserves fractional relief, canopy and visible inland water',()=>{
  const bed=Float32Array.of(41.5,200.25);
  const data=packTerrainDetail(bed,Float32Array.of(.5,1),Float32Array.of(43,-1),true);
  assert.deepEqual([...data],[41,128,128,255,200,64,255,0]);
  assert.equal(packTerrainDetail(bed,null,Float32Array.of(43,-1),false)[3],0);
  assert.deepEqual([...bed],[41.5,200.25]);
});
