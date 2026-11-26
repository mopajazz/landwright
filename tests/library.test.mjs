import{test}from'node:test';
import assert from'node:assert/strict';
import{openLibrary,worldMeta,activeWorlds,deletedWorlds,sortWorlds,copyName,isExpired,daysLeft,relativeTime,formatBytes,TRASH_DAYS}from'../library.mjs';
import{libraryFootText}from'../library-view.mjs';
import{fakeIndexedDB}from'./support/fake-indexeddb.mjs';

const project=(name,size=128)=>({version:9,name,size,heights:Array(size*size).fill(80)});

test('the library stores worlds in IndexedDB and lists them without their projects',async()=>{
 const idb=fakeIndexedDB(),lib=await openLibrary(idb);assert.equal(lib.persistent,true);
 const a=worldMeta(project('Evergreen Island'),{now:1000}),b=worldMeta(project('Saltmarsh',192),{now:2000});
 await lib.save(a,project('Evergreen Island'));await lib.save(b,project('Saltmarsh',192));
 const list=await lib.list();assert.equal(list.length,2);assert.ok(list.every(w=>!('heights' in w)),'metadata only');
 assert.ok(list.find(w=>w.id===a.id).bytes>0,'stored size is recorded');
 assert.equal((await lib.load(b.id)).size,192);
 const reopened=await openLibrary(idb);assert.equal((await reopened.list()).length,2,'a second visit sees the same worlds');
});

test('updating metadata keeps the project, and removing a world deletes both records',async()=>{
 const idb=fakeIndexedDB(),lib=await openLibrary(idb),p=project('Ring Reef'),m=worldMeta(p);await lib.save(m,p);
 await lib.update(m.id,{name:'The Ring Reef',deleted:5});const meta=await lib.meta(m.id);assert.equal(meta.name,'The Ring Reef');assert.equal(meta.deleted,5);
 assert.deepEqual((await lib.load(m.id)).heights,p.heights,'a metadata-only save leaves the project');
 await lib.remove(m.id);assert.equal(await lib.meta(m.id),undefined);assert.equal(await lib.load(m.id),null);
});

test('worlds deleted 30 or more days ago are purged; newer ones are kept',async()=>{
 const lib=await openLibrary(fakeIndexedDB()),day=864e5,now=100*day;
 const old={...worldMeta(project('Old')),deleted:now-TRASH_DAYS*day},recent={...worldMeta(project('Recent')),deleted:now-29*day},live=worldMeta(project('Live'));
 for(const m of[old,recent,live])await lib.save(m,project(m.name));
 assert.deepEqual(await lib.purgeExpired(now),[old.id]);assert.deepEqual((await lib.list()).map(w=>w.name).sort(),['Live','Recent']);
 assert.equal(daysLeft(recent,now),1);assert.equal(isExpired(recent,now),false);
});

test('without IndexedDB the library still works for the session but says it is not persistent',async()=>{
 const lib=await openLibrary(null);assert.equal(lib.persistent,false);const m=worldMeta(project('Session only'));await lib.save(m,project('Session only'));assert.equal((await lib.list()).length,1);
 const failing={open(){const r={};setTimeout(()=>{r.error=Error('denied');r.onerror?.()});return r;}};
 assert.equal((await openLibrary(failing)).persistent,false,'a refused database falls back to memory');
 assert.match(libraryFootText({worlds:[m],deleted:[],persistent:false}),/only the open world is saved/);
});

test('sorting, trash filtering, copy names and labels',()=>{
 const w=[{id:'a',name:'beta',edited:3,created:1},{id:'b',name:'Alpha',edited:1,created:3},{id:'c',name:'gamma',edited:2,created:2,deleted:9}];
 assert.deepEqual(activeWorlds(w).map(x=>x.id),['a','b']);assert.deepEqual(deletedWorlds(w).map(x=>x.id),['c']);
 assert.deepEqual(sortWorlds(activeWorlds(w)).map(x=>x.id),['a','b']);assert.deepEqual(sortWorlds(activeWorlds(w),'name').map(x=>x.name),['Alpha','beta']);assert.deepEqual(sortWorlds(activeWorlds(w),'created').map(x=>x.id),['b','a']);
 assert.equal(copyName('Evergreen',[]),'Evergreen copy');assert.equal(copyName('Evergreen',['Evergreen copy']),'Evergreen copy 2');assert.equal(copyName('Evergreen copy',['Evergreen copy']),'Evergreen copy 2');assert.ok(copyName('x'.repeat(80),[]).length<=80);
 const now=Date.UTC(2026,10,26,12);assert.equal(relativeTime(now-30e3,now),'Just now');assert.equal(relativeTime(now-2*36e5,now),'2 hr ago');assert.equal(relativeTime(now-30*36e5,now),'Yesterday');
 assert.equal(formatBytes(1500),'2 KB');assert.equal(formatBytes(2.45e6),'2.5 MB');
});
