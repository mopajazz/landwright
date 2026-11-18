import test from 'node:test';
import assert from 'node:assert/strict';
import { MATERIAL_IDS, encodeMaterialCoverage, decodeMaterialCoverage, validateMaterialCoverage, applyMaterialCoverage } from '../material-paint.mjs';

test('canonical compact roundtrip, including a full map', () => {
  assert.deepEqual(MATERIAL_IDS, [1,2,3,5,6,7,8,9]);
  const bytes = new Uint8Array(256*256*8);
  assert.equal(encodeMaterialCoverage(bytes), '');
  bytes[bytes.length-1] = 255;
  const encoded = encodeMaterialCoverage(bytes);
  assert.equal(encoded.length, 699052);
  assert.deepEqual(decodeMaterialCoverage(encoded,256), bytes);
  assert.deepEqual(decodeMaterialCoverage('',1), new Uint8Array(8));
});
test('coverage rejects malformed, noncanonical, oversized and inconsistent rows', () => {
  for (const input of [null, 'A', 'AAAA','AAAAAAAAAAA==','AAAAAAAAAA!=','AAAAAAAAAAB=', 'AAAAAAA AAAA=', 'A'.repeat(10000)])
    assert.throws(() => decodeMaterialCoverage(input,1), /Invalid project/);
  const encoded = encodeMaterialCoverage(Uint8Array.of(100,29,0,0,0,0,0,0));
  validateMaterialCoverage(encoded,1,[.5]);
  for (const alpha of [[.4], [0], [], [NaN]]) assert.throws(() => validateMaterialCoverage(encoded,1,alpha), /Invalid project/);
});
test('coverage respects opacity snapshots, accumulated strokes, erase and alpha cap', () => {
  const bytes = new Uint8Array(16);
  const initial = Uint8Array.of(0,100,0,0,0,0,0,0);
  const args = {id:1,amount:.5,initial};
  applyMaterialCoverage(bytes,1,args);
  assert.deepEqual([...bytes.slice(8,10)], [128,50]);
  applyMaterialCoverage(bytes,1,args);
  assert.deepEqual([...bytes.slice(8,10)], [128,50]);
  assert.equal(initial[1],100);
  applyMaterialCoverage(bytes,1,{id:1,amount:.5});
  assert.deepEqual([...bytes.slice(8,10)], [192,25]);
  applyMaterialCoverage(bytes,1,{id:4,amount:.5,erase:true,alpha:.2});
  assert.equal(bytes.reduce((a,b)=>a+b),51);
  applyMaterialCoverage(bytes,0,{id:4,amount:1});
  assert.equal(bytes[0],0);
});
