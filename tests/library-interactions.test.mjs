import{test}from'node:test';
import assert from'node:assert/strict';
import{fakeIndexedDB}from'./support/fake-indexeddb.mjs';
import{bootApp,legacyProject}from'./support/boot-app.mjs';
import{openLibrary}from'../library.mjs';

// One app, booted with a single-slot save from v2.12 and a working browser database.
const idb=fakeIndexedDB();
const t=await bootApp({indexedDB:idb,storage:{'worldpainter-project':JSON.stringify(legacyProject('Old Harbour'))},tag:'library'});
const{w,doc,$,app,blobs,settle,key,card,menu}=t;
const lib=()=>app.libraryState(),active=()=>lib().worlds.filter(x=>!x.deleted),byName=name=>lib().worlds.find(x=>x.name===name);
async function stored(id){return(await openLibrary(idb)).load(id);}

test('the single browser save moves into the library on first run',async()=>{
 assert.equal(lib().persistent,true);
 assert.equal(active().length,1);assert.equal(active()[0].name,'Old Harbour');assert.equal(lib().currentId,active()[0].id);
 assert.equal(w.localStorage.getItem('worldpainter-project'),null,'the old slot is cleared once the library has it');
 assert.equal(w.localStorage.getItem('landwright-current'),lib().currentId);
 assert.equal((await stored(lib().currentId)).name,'Old Harbour');assert.ok(active()[0].thumb?.startsWith('data:image/'));
});

test('the header offers Worlds; Download, Export map, New world and Import are gone from the editor',()=>{
 for(const id of['save','export','exportdialog','backup-world'])assert.equal($(id),null,id);
 assert.ok($('worlds').classList.contains('primary'));assert.equal($('worlds').closest('header')!==null,true);
 assert.ok($('library').contains($('new')),'New world lives in the library');assert.ok($('library').contains($('open')),'Import lives in the library');
});

test('Ctrl+O and the Worlds button open the library; Escape and Back return to the open world',()=>{
 key('o',{ctrlKey:true});assert.equal($('library').open,true);
 assert.ok(card(lib().currentId).classList.contains('is-current'));assert.match(card(lib().currentId).textContent,/Open now/);
 assert.match($('library-back-label').textContent,/Old Harbour/);
 $('library').dispatchEvent(new w.Event('cancel',{cancelable:true}));assert.equal($('library').open,false);
 $('worlds').click();assert.equal($('library').open,true);$('library-back').click();assert.equal($('library').open,false);
});

test('creating a world from the library adds it beside the first and opens it',async()=>{
 const first=lib().currentId;$('worlds').click();$('new').click();assert.equal($('newdialog').open,true);
 $('newname').value='Saltmarsh';$('world-size').value='128';doc.querySelector('[data-shape="flat"]').click();$('newdialog').close('generate');await settle();
 assert.equal($('library').open,false,'the new world opens in the editor');
 assert.equal($('worldname').value,'Saltmarsh');assert.notEqual(lib().currentId,first);assert.equal(active().length,2);
 assert.equal((await stored(first)).name,'Old Harbour','the first world is untouched');assert.equal((await stored(lib().currentId)).name,'Saltmarsh');
});

test('edits autosave to the open world only, and Ctrl+S saves immediately',async()=>{
 $('water').click();key('s',{ctrlKey:true});await settle();
 assert.equal((await stored(lib().currentId)).water,false);assert.equal((await stored(byName('Old Harbour').id)).water,true);
 assert.equal($('save-badge').textContent,'Saved in browser');
});

test('opening another world saves the current one, swaps the editor and starts a fresh history',async()=>{
 const salt=lib().currentId,harbour=byName('Old Harbour').id;assert.equal($('undo').disabled,false);
 $('worlds').click();card(harbour).querySelector('.world-open').click();await settle();
 assert.equal(lib().currentId,harbour);assert.equal($('worldname').value,'Old Harbour');assert.equal($('undo').disabled,true);assert.equal($('library').open,false);
 assert.equal((await stored(salt)).water,false);assert.equal(w.localStorage.getItem('landwright-current'),harbour);
});

test('rename from the menu updates the card, header and stored project',async()=>{
 const id=lib().currentId;await menu(id,'rename');const input=card(id).querySelector('.world-rename');assert.ok(input);
 input.value='Old Harbour Bay';input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await settle();
 assert.equal($('worldname').value,'Old Harbour Bay');assert.equal(card(id).querySelector('.world-name').textContent,'Old Harbour Bay');assert.equal((await stored(id)).name,'Old Harbour Bay');
 const other=byName('Saltmarsh').id;await menu(other,'rename');const second=card(other).querySelector('.world-rename');second.value='Salt Marsh';second.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await settle();
 assert.equal((await stored(other)).name,'Salt Marsh','a closed world is renamed in storage');assert.equal($('worldname').value,'Old Harbour Bay');
});

test('duplicate makes an independent copy with a numbered name',async()=>{
 const id=lib().currentId;await menu(id,'duplicate');await menu(id,'duplicate');
 assert.ok(byName('Old Harbour Bay copy'));assert.ok(byName('Old Harbour Bay copy 2'));assert.equal(lib().currentId,id,'duplicating does not switch worlds');
 assert.deepEqual((await stored(byName('Old Harbour Bay copy').id)).heights,(await stored(id)).heights);
 assert.match($('library-toast').textContent,/Made a copy/);
});

test('backup files and artwork download for open and closed worlds',async()=>{
 blobs.length=0;const salt=byName('Salt Marsh').id;await menu(salt,'backup');
 assert.equal(blobs.at(-1).name,'Salt Marsh.world.json');assert.equal(JSON.parse(await blobs.at(-1).blob.text()).name,'Salt Marsh');
 await menu(salt,'map-2048');assert.equal(blobs.at(-1).name,'Salt Marsh-map.png');assert.equal($('worldname').value,'Old Harbour Bay','the open world is back after rendering');
 await menu(lib().currentId,'heightmap');assert.equal(blobs.at(-1).name,'Old Harbour Bay-heightmap.png');
});

test('delete moves a world to Recently deleted, with Undo and Restore',async()=>{
 const copy=byName('Old Harbour Bay copy 2').id;await menu(copy,'delete');
 assert.ok(lib().worlds.find(x=>x.id===copy).deleted);assert.equal(card(copy),null);assert.ok($('trash-list').querySelector(`[data-world="${copy}"]`));
 assert.match($('trash-count').textContent,/1 · kept for 30 days/);assert.match($('library-toast').textContent,/Deleted Old Harbour Bay copy 2/);
 $('library-toast').querySelector('button').click();await settle();assert.ok(!lib().worlds.find(x=>x.id===copy).deleted);assert.ok(card(copy));
 await menu(copy,'delete');$('trash-list').querySelector(`[data-world="${copy}"] [data-action="restore"]`).click();await settle();assert.ok(card(copy));

});

test('deleting the open world switches to the most recent other one, and Undo brings it back open',async()=>{
 const open=lib().currentId;await menu(open,'delete');
 assert.notEqual(lib().currentId,open);assert.ok(lib().currentId);assert.equal($('library').open,true,'the library stays open');
 $('library-toast').querySelector('button').click();await settle();assert.equal(lib().currentId,open);assert.equal($('worldname').value,'Old Harbour Bay');
});

test('Delete forever asks for a second click, then removes the world from storage',async()=>{
 const copy=byName('Old Harbour Bay copy').id;await menu(copy,'delete');
 const purge=()=>$('trash-list').querySelector(`[data-world="${copy}"] [data-action="purge"]`);
 purge().click();await settle();assert.match(purge().textContent,/Click again/);assert.ok(lib().worlds.find(x=>x.id===copy));
 purge().click();await settle();assert.equal(lib().worlds.find(x=>x.id===copy),undefined);assert.equal(await stored(copy),null);
 assert.equal((await(await openLibrary(idb)).meta(copy)),undefined);
});

test('importing a project adds it as a new world and leaves the others alone',async()=>{
 const before=active().length,harbour=lib().currentId;
 Object.defineProperty($('file'),'files',{configurable:true,value:[{name:'Highland Survey.world.json',size:100,text:async()=>JSON.stringify(legacyProject('Highland Survey',128,90))}]});
 await $('file').onchange();await settle();
 assert.equal(active().length,before+1);assert.equal($('worldname').value,'Highland Survey');assert.notEqual(lib().currentId,harbour);assert.equal((await stored(harbour)).name,'Old Harbour Bay');
});

test('sorting by name orders the cards; the footer reports what is stored',async()=>{
 $('worlds').click();$('library-sort').value='name';$('library-sort').dispatchEvent(new w.Event('change'));
 const names=[...doc.querySelectorAll('#library-grid .world-name')].map(n=>n.textContent);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)));
 assert.match($('library-foot').textContent,/Stored in this browser · \d+ worlds/);$('library').close();
});
