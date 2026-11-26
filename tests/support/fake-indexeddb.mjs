// A small in-process IndexedDB stand-in covering what library.mjs uses: open with upgrade,
// object stores (keyPath or explicit key), get/getAll/put/delete and transaction completion.
// Real-browser behaviour is checked separately in Chromium.
export function fakeIndexedDB(){
 const dbs=new Map();const later=fn=>setTimeout(fn,0);
 function request(run){const r={};later(()=>{try{r.result=run();r.onsuccess?.()}catch(e){r.error=e;r.onerror?.()}});return r;}
 function database(name){
  const data=dbs.get(name);
  return{objectStoreNames:{contains:n=>data.stores.has(n)},
   createObjectStore(n,{keyPath}={}){data.stores.set(n,{keyPath,rows:new Map()});},
   transaction(names){const tx={};let pending=0;const done=()=>{if(--pending===0)later(()=>tx.oncomplete?.())};
    tx.objectStore=n=>{const store=data.stores.get(n);if(!store)throw Error('NotFoundError');const op=fn=>{pending++;const r=request(fn);setTimeout(done,0);return r;};
     return{get:k=>op(()=>structuredClone(store.rows.get(k))),getAll:()=>op(()=>[...store.rows.values()].map(v=>structuredClone(v))),put:(v,k)=>op(()=>{store.rows.set(store.keyPath?v[store.keyPath]:k,structuredClone(v));}),delete:k=>op(()=>{store.rows.delete(k);})};};
    if(![].concat(names).length)later(()=>tx.oncomplete?.());return tx;}};
 }
 return{open(name,version){const r={};later(()=>{let upgrade=false;if(!dbs.has(name)){dbs.set(name,{version,stores:new Map()});upgrade=true;}r.result=database(name);if(upgrade)r.onupgradeneeded?.();r.onsuccess?.();});return r;},_dbs:dbs};
}

