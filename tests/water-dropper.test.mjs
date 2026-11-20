import test from 'node:test';
import assert from 'node:assert/strict';
import * as water from '../water-dropper.mjs';

test('a drop fills connected low ground at one surface level without carving',()=>{
  const n=8, bed=new Float32Array(n*n).fill(80), seed=3*n+3;
  bed[seed]=40;bed[seed+1]=42;bed[seed+n]=30;bed[seed+2]=44;
  const before=bed.slice(), field=new Float32Array(n*n).fill(-1);
  const fill=water.createBasinFill(n);
  assert.ok(fill(bed,seed,44,field));
  assert.equal(field[seed],44);
  assert.equal(field[seed+1],44);
  assert.equal(field[seed+n],44);
  assert.equal(field[seed+2],-1);
  assert.deepEqual(bed,before);
});

test('a drop in an open drainage path leaves the water field untouched',()=>{
  const n=8, bed=new Float32Array(n*n).fill(80), field=new Float32Array(n*n).fill(-1);
  for(let x=0;x<5;x++)bed[3*n+x]=40;
  assert.equal(water.createBasinFill(n)(bed,3*n+4,45,field),false);
  assert.ok(field.every(v=>v===-1));
});
