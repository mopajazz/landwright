import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTHEN_MATERIALS, renderEarthen} from '../earthen.mjs';
import {MATERIAL_IDS, encodeProjectMaterials, loadProjectMaterials} from '../material-paint.mjs';
import {biomeCell} from '../biome-paint.mjs';

test('new materials produce distinct textured pixels at four samples per block',()=>{
  const n=16;
  const render=id=>{
    assert.ok(EARTHEN_MATERIALS.some(material=>material.id===id));
    const weights=new Uint8Array(n*n*MATERIAL_IDS.length);
    const baseColors=new Uint8ClampedArray(n*n*4);
    for(let i=0;i<n*n;i++){
      weights[i*MATERIAL_IDS.length+MATERIAL_IDS.indexOf(id)]=255;
      baseColors.set([125,125,125,255],i*4);
    }
    const {data}=renderEarthen({n,resolution:n*4,sea:62,heights:new Float32Array(n*n).fill(90),
      paintAlpha:new Float32Array(n*n).fill(1),weights,baseColors});
    assert.ok(new Set(data.filter((_,i)=>i%4===0)).size>10);
    return data;
  };
  assert.notDeepEqual(render(10),render(11));
  assert.notDeepEqual(render(11),render(12));
});

test('legacy material coverage migrates and extended coverage roundtrips',()=>{
  const weights=loadProjectMaterials(btoa(String.fromCharCode(255,0,0,0,0,0,0,0)),1,9);
  assert.deepEqual([...weights],[255,0,0,0,0,0,0,0,0,0,0]);
  assert.equal(encodeProjectMaterials(weights).version,9);
  weights[0]=0;
  weights[10]=255;
  const project=encodeProjectMaterials(weights);
  assert.equal(project.version,10);
  assert.deepEqual(loadProjectMaterials(project.surfaceMaterials,1,10),weights);
});

test('biomes vary pigments and density with terrain',()=>{
  const flat=biomeCell('jungle',14,28,85,0,1);
  const cliff=biomeCell('jungle',14,28,85,1,0);
  assert.ok(flat.density>.7);
  assert.ok(cliff.density<.1);
  assert.notEqual(flat.material,cliff.material);
  assert.equal(biomeCell('volcanic',14,28,72,0,1).material,11);
  assert.equal(biomeCell('alpine',14,28,210,0,1).material,5);
});
