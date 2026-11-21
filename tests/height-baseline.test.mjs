import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generate,heightStroke,fitHeightRange,maxSlope,validHeightRange,DEFAULT_FLOOR,DEFAULT_CEILING} from '../terrain.mjs';
import {verticalScale} from '../terrain3d.mjs';
import {normalizeProject} from '../editor.mjs';

const range=a=>{let lo=Infinity,hi=-Infinity;for(const v of a){if(v<lo)lo=v;if(v>hi)hi=v;}return[lo,hi];};
const flat=(n,h)=>new Float32Array(n*n).fill(h);
const run=(a,n,dabs,opts)=>{const pre=a.slice(),reach=new Float32Array(n*n);for(const [x,y,r] of dabs)heightStroke(a,n,x,y,r,{pre,reach,...opts});return a;};

test('3D proportions are the same at every map size',()=>{
 assert.equal(verticalScale(512),.65);
 for(const n of [128,192,256,512])assert.ok(Math.abs(verticalScale(n)*512/n-.65)<1e-12);
 // the tallest possible peak above sea level is the same fraction of map width everywhere
 const fraction=n=>(DEFAULT_CEILING-62)*verticalScale(n)/n;
 assert.ok(Math.abs(fraction(128)-fraction(512))<1e-12);});

test('a held Raise adds at most its budget, scrubbing cannot stack, and separate strokes build',()=>{
 const n=128,a=flat(n,80);run(a,n,Array.from({length:400},()=>[64,64,12]),{dir:1,budget:3});
 assert.ok(Math.abs(range(a)[1]-83)<1e-6,'held stroke reaches exactly the budget');
 run(a,n,Array.from({length:400},()=>[64,64,12]),{dir:1,budget:3});
 assert.ok(Math.abs(range(a)[1]-86)<1e-6,'a second stroke builds on the first');
 const b=flat(n,80);run(b,n,Array.from({length:400},()=>[64,64,12]),{dir:-1,budget:2.5});
 assert.ok(Math.abs(range(b)[0]-77.5)<1e-6,'Lower mirrors Raise');});

test('Raise and Lower ease into the range and never pass it',()=>{
 const n=128,a=flat(n,185);run(a,n,Array.from({length:600},()=>[64,64,20]),{dir:1,budget:20});
 assert.ok(range(a)[1]<=DEFAULT_CEILING+1e-9);assert.ok(range(a)[1]>DEFAULT_CEILING-.5,'still reaches the ceiling');
 const b=flat(n,24);run(b,n,Array.from({length:600},()=>[64,64,20]),{dir:-1,budget:20});
 assert.ok(range(b)[0]>=DEFAULT_FLOOR-1e-9);
 // terrain already above a lowered ceiling is not pulled down by Raise
 const c=flat(n,200);run(c,n,[[64,64,10]],{dir:1,budget:5,ceiling:150});assert.equal(range(c)[1],200);});

test('strokes cannot create needles steeper than the slope limit, and leave existing cliffs alone',()=>{
 for(const n of [128,256,512]){const a=flat(n,80);run(a,n,Array.from({length:300},()=>[n/2,n/2,2]),{dir:1,budget:20});
  let steepest=0;for(let y=0;y<n;y++)for(let x=0;x<n-1;x++)steepest=Math.max(steepest,Math.abs(a[y*n+x]-a[y*n+x+1]));
  assert.ok(steepest<=maxSlope(n)+1e-6,`n=${n}: ${steepest} > ${maxSlope(n)}`);}
 const n=64,a=flat(n,80);for(let x=0;x<n;x++)a[10*n+x]=150;// an existing wall
 run(a,n,[[20,10,3]],{dir:-1,budget:1});assert.ok(a[10*n+5]===150&&a[10*n+40]===150,'cells outside the brush keep their cliff');});

test('generated worlds are fitted into the range without disturbing terrain inside it',()=>{
 for(const n of [128,256])for(const shape of ['island','continent','atoll']){const a=fitHeightRange(generate(n,42,{shape,relief:1.4}));const [lo,hi]=range(a);assert.ok(lo>=DEFAULT_FLOOR-1e-9&&hi<=DEFAULT_CEILING+1e-9,`${shape} ${n}: ${lo}..${hi}`);}
 const a=generate(128,7,{shape:'island',relief:.6}),copy=a.slice();fitHeightRange(a);
 for(let i=0;i<a.length;i++)if(copy[i]>=DEFAULT_FLOOR+24&&copy[i]<=DEFAULT_CEILING-24)assert.equal(a[i],copy[i]);
 // ordering is preserved, so ridges stay ridges
 const b=Float32Array.from([10,15,100,200,230,250]);fitHeightRange(b);for(let i=1;i<b.length;i++)assert.ok(b[i]>b[i-1]);});

test('projects carry a validated height range; older files get the defaults',()=>{
 const n=128,base={version:9,size:n,name:'t',heights:Array(n*n).fill(80),paint:Array(n*n).fill(0),paintColors:Array(3*n*n).fill(0),paintAlpha:Array(n*n).fill(0),surfaceMaterials:'',forest:Array(n*n).fill(0),sea:62,routes:[],marks:[],shapes:[]};
 const old=normalizeProject(base);assert.equal(old.floor,DEFAULT_FLOOR);assert.equal(old.ceiling,DEFAULT_CEILING);
 const custom=normalizeProject({...base,floor:5,ceiling:240});assert.equal(custom.floor,5);assert.equal(custom.ceiling,240);
 for(const bad of [{floor:-1,ceiling:190},{floor:20,ceiling:256},{floor:100,ceiling:120},{floor:20.5,ceiling:190},{floor:130,ceiling:200}])assert.throws(()=>normalizeProject({...base,...bad}));
 assert.ok(validHeightRange(0,255));assert.ok(!validHeightRange(0,29));});
