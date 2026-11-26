// World library storage. Each world has a small metadata record (name, size, dates, thumbnail,
// deleted time) and a separate project record holding its v9 project as a JSON string, so the
// library can list worlds without reading every heightfield. IndexedDB is used when the browser
// allows it; otherwise an in-memory store keeps the session working and `persistent` is false.
export const DB_NAME='landwright',DB_VERSION=1,META_STORE='worlds',PROJECT_STORE='projects';
export const TRASH_DAYS=30;
const DAY=864e5;

export function newWorldId(){return globalThis.crypto?.randomUUID?.()??`w${Date.now().toString(36)}${Math.random().toString(36).slice(2,10)}`;}

function request(r){return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function finished(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error||Error('Storage transaction failed'));});}

function indexedBackend(idb){
 const opened=new Promise((resolve,reject)=>{
  const r=idb.open(DB_NAME,DB_VERSION);
  r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE,{keyPath:'id'});if(!db.objectStoreNames.contains(PROJECT_STORE))db.createObjectStore(PROJECT_STORE);};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Storage is blocked by another tab'));
 });
 return{
  persistent:true,ready:opened,
  async list(){const db=await opened;return request(db.transaction(META_STORE).objectStore(META_STORE).getAll());},
  async meta(id){const db=await opened;return request(db.transaction(META_STORE).objectStore(META_STORE).get(id));},
  async project(id){const db=await opened;return request(db.transaction(PROJECT_STORE).objectStore(PROJECT_STORE).get(id));},
  async put(meta,project){const db=await opened,tx=db.transaction([META_STORE,PROJECT_STORE],'readwrite');tx.objectStore(META_STORE).put(meta);if(project!==undefined)tx.objectStore(PROJECT_STORE).put(project,meta.id);return finished(tx);},
  async remove(id){const db=await opened,tx=db.transaction([META_STORE,PROJECT_STORE],'readwrite');tx.objectStore(META_STORE).delete(id);tx.objectStore(PROJECT_STORE).delete(id);return finished(tx);}
 };
}
function memoryBackend(){
 const metas=new Map(),projects=new Map();
 return{
  persistent:false,ready:Promise.resolve(),
  async list(){return[...metas.values()].map(m=>({...m}));},
  async meta(id){return metas.has(id)?{...metas.get(id)}:undefined;},
  async project(id){return projects.get(id);},
  async put(meta,project){metas.set(meta.id,{...meta});if(project!==undefined)projects.set(meta.id,project);},
  async remove(id){metas.delete(id);projects.delete(id);}
 };
}

function wrap(backend){
 return{
  persistent:backend.persistent,
  list:()=>backend.list(),
  meta:id=>backend.meta(id),
  async load(id){const text=await backend.project(id);return text==null?null:JSON.parse(text);},
  // Saves metadata, and the project too when one is given; resolves to the metadata as stored.
  async save(meta,project){const text=project===undefined?undefined:JSON.stringify(project);let bytes=text?.length??meta.bytes;if(bytes===undefined)bytes=(await backend.meta(meta.id))?.bytes;const stored=cleanMeta({...meta,bytes});await backend.put(stored,text);return stored;},
  async update(id,changes){const meta=await backend.meta(id);if(!meta)throw Error('World not found');const next=cleanMeta({...meta,...changes});await backend.put(next);return next;},
  remove:id=>backend.remove(id),
  async purgeExpired(now=Date.now()){const gone=[];for(const meta of await backend.list())if(isExpired(meta,now)){await backend.remove(meta.id);gone.push(meta.id);}return gone;}
 };
}
function cleanMeta(meta){const out={id:meta.id,name:String(meta.name??'Untitled world'),size:meta.size,created:meta.created,edited:meta.edited};if(meta.thumb)out.thumb=meta.thumb;if(Number.isFinite(meta.bytes))out.bytes=meta.bytes;if(meta.deleted)out.deleted=meta.deleted;return out;}

// Opens the browser library, falling back to memory when IndexedDB is missing or refuses to open.
export async function openLibrary(idb=globalThis.indexedDB){
 if(idb){try{const backend=indexedBackend(idb);await backend.ready;return wrap(backend);}catch{}}
 return wrap(memoryBackend());
}

export function worldMeta(project,{id=newWorldId(),now=Date.now(),thumb}={}){return cleanMeta({id,name:project.name||'Untitled world',size:project.size,created:now,edited:now,thumb});}
export const activeWorlds=list=>list.filter(w=>!w.deleted);
export const deletedWorlds=list=>list.filter(w=>w.deleted).sort((a,b)=>b.deleted-a.deleted);
export function sortWorlds(list,by='edited'){
 const out=[...list];
 if(by==='name')out.sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base',numeric:true})||b.edited-a.edited);
 else if(by==='created')out.sort((a,b)=>b.created-a.created);
 else out.sort((a,b)=>b.edited-a.edited);
 return out;
}
export const isExpired=(meta,now=Date.now())=>!!meta.deleted&&now-meta.deleted>=TRASH_DAYS*DAY;
export const daysLeft=(meta,now=Date.now())=>Math.max(1,Math.ceil(TRASH_DAYS-(now-meta.deleted)/DAY));
// "Evergreen Island copy", then "Evergreen Island copy 2", skipping names already in use.
export function copyName(name,taken){
 const base=`${name.replace(/ copy( \d+)?$/,'')} copy`.slice(0,80),used=new Set(taken);
 if(!used.has(base))return base;
 for(let n=2;;n++){const next=`${base} ${n}`;if(!used.has(next))return next;}
}
// Approximate stored size, for the library footer.
export const formatBytes=bytes=>bytes<1e6?`${Math.max(1,Math.round(bytes/1e3))} KB`:`${(bytes/1e6).toFixed(1)} MB`;
export function relativeTime(t,now=Date.now()){
 const d=now-t,min=6e4,hour=36e5;
 if(d<min)return'Just now';if(d<hour)return`${Math.round(d/min)} min ago`;if(d<DAY)return`${Math.round(d/hour)} hr ago`;if(d<2*DAY)return'Yesterday';
 const date=new Date(t);if(d<7*DAY)return date.toLocaleDateString(undefined,{weekday:'long'});
 return date.toLocaleDateString(undefined,new Date(now).getFullYear()===date.getFullYear()?{month:'short',day:'numeric'}:{month:'short',day:'numeric',year:'numeric'});
}
