import{test}from'node:test';import assert from'node:assert/strict';
const model=await import('../editor.mjs');
test('Inkarnate sizing supports W/S, shift increments, wheel and clamps',()=>{assert.equal(model.brushDelta({key:'w'}),1);assert.equal(model.brushDelta({key:'s'}),-1);assert.equal(model.brushDelta({key:'W',shiftKey:true}),10);assert.equal(model.brushDelta({key:'S',shiftKey:true}),-10);assert.equal(model.brushDelta({shiftKey:true,deltaY:-10}),1);assert.equal(model.brushDelta({deltaY:10}),0);assert.equal(model.resizeBrush(4,-10),4);assert.equal(model.resizeBrush(120,10),120);});
test('legacy projects migrate and new layer objects roundtrip',()=>{let old={version:1,name:'Old world',heights:Array(16).fill(100),paint:Array(16).fill(0),sea:62};let s=model.normalizeProject(old,4);assert.deepEqual(s.marks,[]);assert.equal(s.layers.surface.visible,true);s.marks.push({type:'tree',x:2,y:2,size:9,opacity:1});s.layers.surface.locked=true;assert.deepEqual(model.normalizeProject(JSON.parse(JSON.stringify(s)),4),s);});
test('malformed projects reject invalid landmarks before mutation',()=>{let s={version:2,name:'Bad',heights:Array(16).fill(100),paint:Array(16).fill(0),sea:62,marks:[{type:'script',x:2,y:2,size:9}]};assert.throws(()=>model.normalizeProject(s,4));});
test('old painted cells migrate to fully opaque material colors',()=>{let old={version:2,heights:Array(16).fill(100),paint:Array(16).fill(4),sea:62};let s=model.normalizeProject(old,4);assert.equal(s.version,9);assert.equal(s.paintAlpha[0],1);assert.deepEqual(s.paintColors.slice(0,3),[53,94,67]);assert.ok(s.layers.shapes.visible);assert.deepEqual(model.normalizeProject(s,4),s);});
test('v3 rejects invalid paint opacity and invalid drawing coordinates',()=>{let s=model.normalizeProject({version:1,heights:Array(16).fill(100),paint:Array(16).fill(0),sea:62},4);s.paintAlpha[0]=2;assert.throws(()=>model.normalizeProject(s,4));s.paintAlpha[0]=0;s.shapes=[{type:'line',x1:-1,y1:1,x2:2,y2:2,color:'#ffffff',width:1,opacity:1,filled:false,points:[]}];assert.throws(()=>model.normalizeProject(s,4));});
test('route projects retain local river profiles and reject malformed profiles before loading',()=>{let s=model.normalizeProject({version:1,heights:Array(16).fill(100),paint:Array(16).fill(0),sea:62},4);s.version=4;s.routes=[{type:'river',width:2,depth:4,opacity:1,points:[{x:1,y:1,level:95},{x:2,y:2,level:90}]}];assert.deepEqual(model.normalizeProject(s,4).routes,s.routes);s.routes[0].points[1].level=99;assert.throws(()=>model.normalizeProject(s,4),/Invalid project/);});
test('the shared route workload budget rejects many individually valid expensive rivers',async()=>{const r=await import('../routes.mjs');let s=model.normalizeProject({version:1,heights:Array(256*256).fill(100),paint:Array(256*256).fill(0),sea:62});let route={type:'river',width:32,depth:4,opacity:1,points:[{x:0,y:0,level:99},{x:255,y:255,level:90}]};assert.equal(r.validRoute(route,256),true);s.routes=Array.from({length:20},()=>structuredClone(route));assert.throws(()=>model.normalizeProject(s),/Invalid project/);});
test('v4 preserves optional river taper and still accepts old uniform river records',()=>{let s=model.normalizeProject({version:1,heights:Array(16).fill(100),paint:Array(16).fill(0),sea:62},4),river={type:'river',width:2,depth:4,opacity:1,points:[{x:1,y:1,level:99},{x:2,y:2,level:98}]};s.routes=[river];assert.equal(model.normalizeProject(s,4).routes[0].taper,undefined);river.taper=true;assert.equal(model.normalizeProject(s,4).routes[0].taper,true);river.taper='yes';assert.throws(()=>model.normalizeProject(s,4),/Invalid project/);});
test('schema7 migrates every original palette RGB without guessing texture identity',()=>{const colors=[[111,143,79],[193,173,127],[133,135,124],[53,94,67],[221,226,215],[137,112,79]],s=model.normalizeProject({version:2,heights:Array(16).fill(80),paint:Array.from({length:16},(_,i)=>i%6+1),sea:62},4);assert.equal(s.version,9);assert.equal(s.surfaceMaterials,'');for(let i=0;i<16;i++)assert.deepEqual(s.paintColors.slice(i*3,i*3+3),colors[i%6]);const bad={...s,version:6,paint:[...s.paint]};bad.paint[0]=7;assert.throws(()=>model.normalizeProject(bad,4));});


test('retired settlement data is omitted while old maps retain terrain paint forests and rivers',()=>{const n=128,s=model.normalizeProject({version:2,size:n,heights:Array(n*n).fill(80),paint:Array(n*n).fill(0),sea:62});const old={...s,version:8,settlements:[{id:'old-village',kind:'village',x:64,y:64,scale:1,rotation:0,seed:42,name:'Old Village'}],marks:[{type:'town',x:30,y:30,size:9,opacity:1},{type:'tree',x:50,y:50,size:9,opacity:1}],layers:{...s.layers,settlements:{visible:true,locked:false}}};const clean=model.normalizeProject(old);assert.equal(clean.version,9);assert.equal(Object.hasOwn(clean,'settlements'),false);assert.equal(Object.hasOwn(clean.layers,'settlements'),false);assert.deepEqual(clean.marks,[old.marks[1]]);for(const field of['heights','paint','paintColors','paintAlpha','forest','routes','surfaceMaterials'])assert.deepEqual(clean[field],s[field]);assert.deepEqual(model.normalizeProject(JSON.parse(JSON.stringify(clean))),clean);});

test('512-square projects round-trip through schema 9 without losing the last cell',async()=>{
 const size=512,cells=size*size;
 const heights=Array(cells).fill(80),paint=Array(cells).fill(0);
 heights[cells-1]=123;
 const project=model.normalizeProject({version:1,size,heights,paint,sea:62});
 const {encodeMaterialCoverage,decodeMaterialCoverage}=await import('../material-paint.mjs');
 const weights=new Uint8Array(cells*8);
 weights[weights.length-1]=255;
 project.paintAlpha[cells-1]=1;
 project.surfaceMaterials=encodeMaterialCoverage(weights);
 const restored=model.normalizeProject(JSON.parse(JSON.stringify(project)));
 assert.equal(decodeMaterialCoverage(restored.surfaceMaterials,size).at(-1),255);
 assert.equal(restored.version,9);
 assert.equal(restored.size,size);
 assert.equal(restored.heights[cells-1],123);
 assert.equal(restored.paintColors.length,cells*3);
});
