import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTHEN_MATERIALS,renderEarthen} from '../earthen.mjs';
import {MATERIAL_IDS} from '../material-paint.mjs';

function scene(id=1){
  const n=16, size=n*n;
  const weights=new Uint8Array(size*8), baseColors=new Uint8ClampedArray(size*4);
  for(let i=0;i<size;i++){weights[i*8+MATERIAL_IDS.indexOf(id)]=255;baseColors.set([125,125,125,255],i*4);}
  return {n,resolution:64,heights:new Float32Array(size).fill(90),sea:30,rawRiverWater:new Float32Array(size).fill(-1),riverWater:new Float32Array(size).fill(-1),paintAlpha:new Float32Array(size).fill(1),weights,baseColors};
}
test('eight distinct deterministic spatial textures preserve authoritative arrays',()=>{
  const signatures=new Set();
  for(const material of EARTHEN_MATERIALS){
    const s=scene(material.id), before=structuredClone(s);
    const {width,height,data}=renderEarthen(s);
    assert.equal(width,64);assert.equal(height,64);assert.equal(data.length,64*64*4);
    assert.ok(new Set(data.filter((_,i)=>i%4===0)).size>3);
    assert.ok(data.every((v,i)=>i%4!==3||v===255));
    assert.deepEqual(data,renderEarthen(s).data);assert.deepEqual(s,before);
    signatures.add(Buffer.from(data).toString('base64'));
  }
  assert.equal(signatures.size,8);
});
test('legacy, diagnostics and visible water preserve the composite',()=>{
  const s=scene(), expected=s.baseColors;
  s.resolution=s.n;
  for(const view of ['height','biome']) assert.deepEqual(renderEarthen({...s,view}).data,expected);
  assert.deepEqual(renderEarthen({...s,sea:100}).data,expected);
  assert.deepEqual(renderEarthen({...s,riverWater:new Float32Array(256).fill(100)}).data,expected);
  s.weights.fill(0);
  assert.deepEqual(renderEarthen(s).data,expected);
  assert.notDeepEqual(renderEarthen({...s,surfaceVisible:false}).data,expected);
});
test('hidden river still darkens mud, and raw relief changes scree',()=>{
  const s=scene(9), dry=renderEarthen({...s,water:false}).data;
  s.rawRiverWater.fill(100);
  const wet=renderEarthen({...s,water:false}).data;
  assert.ok(wet.reduce((a,b)=>a+b)<dry.reduce((a,b)=>a+b));
  const t=scene(8), flat=renderEarthen(t).data;
  for(let i=0;i<t.heights.length;i++) t.heights[i]+=Math.abs(i%16-8)*3;
  assert.notDeepEqual(renderEarthen(t).data,flat);
});
test('bilinear coverage mixes pigment linearly and world samples agree across resolutions',()=>{
  const a=scene(1), b=scene(7);
  const grass=renderEarthen(a).data, clay=renderEarthen(b).data;
  for(let i=0;i<256;i++){
    a.weights[i*8]=128;
    a.weights[i*8+MATERIAL_IDS.indexOf(7)]=127;
  }
  const blend=renderEarthen(a).data;
  for(let i=0;i<blend.length;i++) assert.ok(Math.abs(blend[i]-(grass[i]*128+clay[i]*127)/255)<=1);
  const full=renderEarthen({...a,resolution:48}).data;
  const active=renderEarthen({...a,resolution:16}).data;
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const hi=((3*y+1)*48+3*x+1)*4,lo=(y*16+x)*4;
    assert.deepEqual(active.slice(lo,lo+4),full.slice(hi,hi+4));
  }
  const half=scene(1);
  for(let i=0;i<256;i++) if(i%16>=8) half.weights.set(b.weights.subarray(i*8,i*8+8),i*8);
  const edge=renderEarthen(half).data;
  for(const x of [30,31,32,33]){
    const offset=(32*64+x)*4;
    const t=(x+.5)/4-.5-7;
    for(let k=0;k<3;k++)assert.ok(Math.abs(edge[offset+k]-mixByte(grass[offset+k],clay[offset+k],t))<=1);
  }
});
function mixByte(a,b,t){return a+(b-a)*t;}
test('cached full-resolution terrain stays identical to a fresh render across local and global edits',()=>{
  const cache={},s=scene(7);
  const check=()=>{const incremental=renderEarthen({...s,cache}),fresh=renderEarthen(s);assert.deepEqual(incremental.data,fresh.data);assert.equal(incremental.width,64);return incremental;};
  const initial=check(),buffer=initial.data; s.heights[120]+=9;s.baseColors[120*4]=190;
  assert.equal(check().data,buffer,'local edits retain the high-resolution buffer');
  s.weights.fill(0,120*8,121*8);s.paintAlpha[120]=0;check();s.sea=95;check();s.water=false;check();s.view='height';check();s.view='terrain';check();
});
