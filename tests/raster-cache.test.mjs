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
