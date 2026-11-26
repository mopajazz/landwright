import{test}from'node:test';
import assert from'node:assert/strict';
import{fakeIndexedDB}from'./support/fake-indexeddb.mjs';
import{bootApp,legacyProject}from'./support/boot-app.mjs';
import{openLibrary,worldMeta}from'../library.mjs';

async function seeded(worlds){const idb=fakeIndexedDB(),lib=await openLibrary(idb),metas=[];for(const[name,extra]of worlds){const p=legacyProject(name),m={...worldMeta(p),...extra};await lib.save(m,p);metas.push(m);}return{idb,metas};}

test('a returning visitor reopens the world they last had open, not the most recently edited',async()=>{
 const{idb,metas}=await seeded([['Evergreen Island',{edited:1000}],['Ring Reef',{edited:5000}]]);
 const t=await bootApp({indexedDB:idb,storage:{'landwright-current':metas[0].id},tag:'reopen'});
 assert.equal(t.app.libraryState().currentId,metas[0].id);assert.equal(t.$('worldname').value,'Evergreen Island');
 assert.equal(t.$('library').open,false,'the editor opens straight away');assert.equal(t.$('undo').disabled,true);
 assert.equal(t.app.libraryState().worlds.length,2,'nothing is migrated or duplicated');
 t.w.close();
});

test('without a remembered world the most recently edited one opens; if every world is deleted, Worlds opens instead',async()=>{
 const{idb,metas}=await seeded([['Old Map',{edited:1000,deleted:Date.now()-864e5}],['Only Deleted',{edited:9000,deleted:Date.now()-2*864e5}]]);
 const t=await bootApp({indexedDB:idb,tag:'all-deleted'});
 assert.equal(t.app.libraryState().currentId,null);assert.equal(t.$('library').open,true);assert.equal(t.$('library-back').hidden,true,'there is no world to go back to');
 t.$('library').dispatchEvent(new t.w.Event('cancel',{cancelable:true}));assert.equal(t.$('library').open,true,'Escape cannot leave an empty library');
 assert.equal(t.$('trash-list').querySelectorAll('.trash-row').length,2);
 t.$('trash-list').querySelector(`[data-world="${metas[1].id}"] [data-action="restore"]`).click();await t.settle();
 assert.equal(t.app.libraryState().currentId,metas[1].id);assert.equal(t.$('worldname').value,'Only Deleted');assert.equal(t.$('library-back').hidden,false);
 t.w.close();
});
