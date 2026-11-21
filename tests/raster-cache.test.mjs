import test from 'node:test';
import assert from 'node:assert/strict';
import {rasterFrame} from '../raster-cache.mjs';
test('local raster invalidation stays bounded, unchanged frames skip pixels, and resized maps discard caches',()=>{
 const cache={},field=new Float32Array(128*128),first=rasterFrame(cache,128,512,[field]);
 assert.deepEqual(first.bounds,{x0:0,y0:0,x1:512,y1:512});
 field[64*128+64]=1;const edit=rasterFrame(cache,128,512,[field]);
 assert.equal(edit.data,first.data);assert.ok((edit.bounds.x1-edit.bounds.x0)*(edit.bounds.y1-edit.bounds.y0)<512*512/100);
 const same=rasterFrame(cache,128,512,[field]);assert.equal(same.bounds.x1,0);
 assert.notEqual(rasterFrame(cache,192,768,[new Float32Array(192*192)]).data,first.data);
});

test('compatible frames retain backing storage for canvas writes and comparison fields',()=>{
 const allocations=[],cache={allocate(size){const data=new Uint8ClampedArray(size*size*4);allocations.push(data);return data;}};
 const field=new Float32Array(16);
 const first=rasterFrame(cache,4,16,[field]),previous=cache.fields[0];
 field[5]=1;
 const next=rasterFrame(cache,4,16,[field]);
 assert.equal(first.data,allocations[0]);
 assert.equal(next.data,first.data);
 assert.equal(cache.fields[0],previous);
 assert.equal(previous[5],1);
 assert.equal(allocations.length,1);
});
