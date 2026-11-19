import test from 'node:test';
import assert from 'node:assert/strict';
import {createReactiveWater} from '../reactive-water.mjs';

function landscape() {
  // A shoreline on the left, separated from an interior basin by a ridge.
  // Indices are rows of an 8x8 grid; all heights are above sea level except
  // the open water and the isolated basin.
  const n = 8, heights = new Float32Array(n * n).fill(80);
  for (let y = 0; y < n; y++) for (let x = 0; x < 2; x++) heights[y*n+x] = 40;
  for (let y = 2; y < 6; y++) for (let x = 4; x < 7; x++) heights[y*n+x] = 40;
  return {n, heights};
}
test('isolated sub-sea-level basin remains dry until channel connects', () => {
  const {n,heights} = landscape(), model = createReactiveWater(n);
  model.initialize(heights,62);
  assert.equal(model.connected[3*n+5],0);
  assert.equal(model.coverage[3*n+5],0);
  heights[3*n+2] = heights[3*n+3] = 40;
  model.setTerrain(heights,62);
  assert.equal(model.connected[3*n+5],1);
  assert.equal(model.coverage[3*n+5],0);
  for (let i=0;i<80;i++) model.advance(.1);
  assert.equal(model.coverage[3*n+5],1);
  assert.equal(model.coverage[0],1);
});
test('a mountain depression stays dry without an edge-connected source', () => {
  const n=8, heights=new Float32Array(n*n).fill(80);
  heights[3*n+3]=40;
  const model=createReactiveWater(n);
  model.initialize(heights,62);
  assert.equal(model.connected[3*n+3],0);
  assert.equal(model.coverage[3*n+3],0);
});
test('sea-level changes, water toggle and reset never edit source heights', () => {
  const {n,heights}=landscape(), original=Array.from(heights);
  const model=createReactiveWater(n);
  model.initialize(heights,62);
  model.setTerrain(heights,30);
  model.advance(.1);
  assert.equal(model.connected.some(Boolean),false);
  model.initialize(heights,62,false);
  assert.equal(model.connected.some(Boolean),false);
  assert.deepEqual(Array.from(heights),original);
  model.reset();
  assert.equal(model.coverage.some(Boolean),false);
});
test('newly cut channels produce deterministic and bounded coverage', () => {
  const {n,heights}=landscape();
  heights[3*n+2]=heights[3*n+3]=40;
  const a=createReactiveWater(n),b=createReactiveWater(n);
  a.initialize(heights,62);
  b.initialize(heights,62);
  heights[3*n+4]=80;
  a.setTerrain(heights,62);b.setTerrain(heights,62);
  for(let i=0;i<12;i++){a.advance(.1);b.advance(.1);}
  assert.deepEqual(Array.from(a.coverage),Array.from(b.coverage));
  assert.ok(a.coverage.every(x=>x>=0&&x<=1));
});
