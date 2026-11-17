import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generate} from '../terrain.mjs';
test('shape presets produce distinct, deterministic, bounded landscapes',()=>{const names=['island','archipelago','continent','atoll','blank'];const maps=names.map(shape=>generate(128,42,{shape}));assert.equal(new Set(maps.map(a=>Array.from(a).join(','))).size,5);for(let i=0;i<names.length;i++){assert.deepEqual(maps[i],generate(128,42,{shape:names[i]}));assert.ok(maps[i].every(v=>Number.isFinite(v)&&v>=0&&v<=255));}assert.ok(maps[4].every(v=>v===30));});
test('atoll has a flooded center and elevated ring',()=>{const a=generate(128,42,{shape:'atoll'});assert.ok(a[64*128+64]<62);let land=0;for(let i=0;i<a.length;i++)if(a[i]>62)land++;assert.ok(land>1500&&land<10000);});
test('relief changes heights while preserving deterministic generation',()=>{assert.notDeepEqual(generate(64,5,{relief:.4}),generate(64,5,{relief:1.4}));});
