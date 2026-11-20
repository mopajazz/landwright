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

test('edits to isolated ground do not restart an in-flight front', () => {
  const {n,heights}=landscape(), model=createReactiveWater(n,{cellsPerSecond:4});
  model.initialize(heights,62);
  heights[3*n+2]=heights[3*n+3]=40;
  model.setTerrain(heights,62);
  for(let frame=0;frame<20;frame++){
    heights[6*n+3]=frame%2?40:80;
    model.setTerrain(heights,62);
    model.advance(.1);
  }
  assert.equal(model.coverage[3*n+5],1);
});

test('raised ground and disabled water clear coverage immediately', () => {
  const {n,heights}=landscape(), model=createReactiveWater(n);
  model.initialize(heights,62);
  heights[n+1]=90;
  model.setTerrain(heights,62);
  assert.equal(model.coverage[n+1],0);
  model.setTerrain(heights,62,false);
  assert.equal(model.coverage.some(Boolean),false);
  assert.equal(model.active,false);
});

test('ocean raster and surface reveal the basin while retaining authored river height', async () => {
  const {writeOceanSurface}=await import('../reactive-water.mjs');
  assert.equal(typeof writeOceanSurface,'function');
  const bed=Float32Array.of(40,40,40,80), riverSurface=Float32Array.of(40,40,58,80);
  const rgba=new Uint8ClampedArray(16), surface=new Float32Array(4);
  writeOceanSurface(bed,riverSurface,62,Float32Array.of(0,.5,.5,1),rgba,surface);
  assert.deepEqual(Array.from(surface),[40,51,58,80]);
  assert.deepEqual([rgba[3],rgba[7],rgba[11],rgba[15]],[0,128,0,0]);
  assert.deepEqual(Array.from(bed),[40,40,40,80]);
});

test('closing a channel drains the disconnected basin while the coast stays wet', () => {
  const {n,heights}=landscape(), model=createReactiveWater(n);
  const cut=3*n+2, basin=3*n+5;
  heights[cut]=heights[cut+1]=40;
  model.initialize(heights,62);
  heights[cut]=80;
  model.setTerrain(heights,62);
  assert.equal(model.connected[basin],0);
  assert.equal(model.coverage[basin],1);
  model.advance(.1);
  assert.equal(model.coverage[basin],.5);
  model.advance(.1);
  assert.equal(model.coverage[basin],0);
  assert.equal(model.coverage[0],1);
  assert.equal(model.active,false);
});

test('a continuous widening stroke does not postpone the existing front', () => {
  const n=32, heights=new Float32Array(n*n).fill(80);
  for(let y=0;y<n;y++)heights[y*n]=40;
  for(let x=2;x<16;x++)heights[16*n+x]=40;
  const model=createReactiveWater(n,{cellsPerSecond:8});
  model.initialize(heights,62);
  heights[16*n+1]=40;
  model.setTerrain(heights,62);
  for(let frame=0;frame<30;frame++){
    heights[frame*n+1]=40;
    model.setTerrain(heights,62);
    model.advance(.1);
  }
  assert.equal(model.coverage[16*n+15],1);
});

test('the first open channel cell starts filling in the first animation frame', () => {
  const {n,heights}=landscape(), model=createReactiveWater(n);
  model.initialize(heights,62);
  heights[3*n+2]=heights[3*n+3]=40;
  model.setTerrain(heights,62);
  model.advance(1/30);
  assert.ok(model.coverage[3*n+2]>0);
  assert.equal(model.coverage[3*n+3],0);
});

test('an unrelated coastal removal does not restart a basin front', () => {
  const n=24, heights=new Float32Array(n*n).fill(80);
  for(let y=0;y<n;y++)heights[y*n]=40;
  for(let x=2;x<16;x++)heights[8*n+x]=40;
  const model=createReactiveWater(n);
  model.initialize(heights,62);
  heights[8*n+1]=40;
  for(let frame=0;frame<120;frame++){
    heights[20]=frame%2?40:80;
    model.setTerrain(heights,62);
    model.advance(1/30);
  }
  assert.equal(model.coverage[8*n+15],1);
});
