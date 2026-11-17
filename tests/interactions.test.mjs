import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
// Real DOM events and application state; canvas methods are stubbed because these
// tests verify editing/history behavior, not raster rendering or PNG encoding.
const dom=new JSDOM(await fs.readFile(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test/'});
const w=dom.window,doc=w.document,$=id=>doc.getElementById(id);let blobs=[],symbols=0;
const canvasContext=new Proxy({createImageData:(x,y)=>({data:new Uint8ClampedArray(x*y*4)}),getImageData:(x,y,a,b)=>({data:new Uint8ClampedArray(a*b*4)}),translate:()=>{symbols++;}},{get:(o,k)=>k in o?o[k]:()=>{}});
w.HTMLCanvasElement.prototype.getContext=()=>canvasContext;
w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(new Blob(['image']));};
w.HTMLCanvasElement.prototype.setPointerCapture=()=>{};
w.HTMLAnchorElement.prototype.click=()=>{};
for(let id of['map','preview']){Object.defineProperty($(id),'clientWidth',{value:id==='map'?1024:224});Object.defineProperty($(id),'clientHeight',{value:id==='map'?768:165});}
Object.assign(globalThis,{document:doc,localStorage:w.localStorage,devicePixelRatio:1,ResizeObserver:class{observe(){}}});
const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
URL.createObjectURL=b=>{blobs.push(b);return'blob:test'};URL.revokeObjectURL=()=>{};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(value){this.open=false;if(value!==undefined)this.returnValue=value;this.dispatchEvent(new w.Event('close'));};
await import('../app.mjs');
async function state(){blobs=[];$('save').click();return JSON.parse(await blobs[0].text());}
function key(key,more={}){doc.body.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,...more}));}
function pointer(type,x=512,y=380){$('map')['on'+type](new w.MouseEvent(type,{clientX:x,clientY:y,button:0,bubbles:true}));}
function clickTool(t){doc.querySelector(`[data-tool="${t}"]`).click();}
after(()=>{URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;});
test('resizing keys preserve active tool, and shift-wheel does not zoom',()=>{key('s');assert.equal($('size').value,'41');assert.ok(doc.querySelector('[data-tool="raise"]').classList.contains('selected'));key('W',{shiftKey:true});assert.equal($('size').value,'51');let zoom=$('zoomtext').textContent;$('map').dispatchEvent(new w.WheelEvent('wheel',{deltaY:-10,shiftKey:true,bubbles:true,cancelable:true}));assert.equal($('size').value,'52');assert.equal($('zoomtext').textContent,zoom);});
test('rejected JSON import preserves redo and project',async()=>{pointer('pointerdown');pointer('pointerup');$('undo').click();assert.equal($('redo').disabled,false);let before=await state();Object.defineProperty($('file'),'files',{configurable:true,value:[{name:'bad.json',size:5,text:async()=>'{"version":2}'}]});await $('file').onchange();assert.equal($('redo').disabled,false);assert.deepEqual(await state(),before);});
test('switching tools during a stroke cannot edit locked relief',async()=>{doc.querySelector('[data-layer="elevation"][data-action="locked"]').click();let before=await state();clickTool('paint');pointer('pointerdown');key('r');pointer('pointermove',530,390);pointer('pointerup');assert.deepEqual((await state()).heights,before.heights);doc.querySelector('[data-layer="elevation"][data-action="locked"]').click();});
test('water toggle clears redo and can be independently undone',async()=>{clickTool('raise');pointer('pointerdown');pointer('pointerup');$('undo').click();assert.equal($('redo').disabled,false);const before=await state();$('water').click();assert.equal($('redo').disabled,true);$('undo').click();assert.equal((await state()).water,before.water);});
test('typing a name forms one undo group',async()=>{let before=await state();$('worldname').focus();$('worldname').value='The';$('worldname').dispatchEvent(new w.Event('input'));$('worldname').value='The Reach';$('worldname').dispatchEvent(new w.Event('input'));$('worldname').blur();assert.equal($('redo').disabled,true);$('undo').click();assert.equal((await state()).name,before.name);$('redo').click();assert.equal((await state()).name,'The Reach');});
test('landmarks save and undo, and hidden landmarks do not enter map export',async()=>{let before=await state();clickTool('stamp');pointer('pointerdown',550,400);pointer('pointerup',550,400);let placed=await state();assert.equal(placed.marks.length,before.marks.length+1);$('undo').click();assert.equal((await state()).marks.length,before.marks.length);$('redo').click();assert.equal((await state()).marks.length,placed.marks.length);symbols=0;$('export-map').click();assert.ok(symbols>0);doc.querySelector('[data-layer="landmarks"][data-action="visible"]').click();symbols=0;$('export-map').click();assert.equal(symbols,0);});
test('Escape after reopening New world preserves project',async()=>{$('new').click();$('newdialog').returnValue='generate';$('newdialog').dispatchEvent(new w.Event('close'));const before=await state();$('new').click();$('newdialog').dispatchEvent(new w.Event('close'));assert.equal($('newdialog').returnValue,'');assert.deepEqual(await state(),before);});
// JSDOM does not implement dialog methods; this only models returnValue/event wiring.
