import{relativeTime,daysLeft,formatBytes}from'./library.mjs?v=2.13.0';
// DOM for the Worlds library: cards, Recently deleted and the per-world menu.
// It only draws; app.mjs owns storage and the open world.
export const MAP_SIZES=[1024,2048,4096];

function make(doc,tag,props={},...kids){
 const el=doc.createElement(tag);
 for(const[k,v]of Object.entries(props)){if(v==null||v===false)continue;if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else el.setAttribute(k,v===true?'':String(v));}
 for(const kid of kids)if(kid!=null)el.append(kid);
 return el;
}
function thumb(doc,world,cls){return world.thumb?make(doc,'img',{class:cls,src:world.thumb,alt:'',draggable:'false'}):make(doc,'span',{class:cls+' is-empty','aria-hidden':'true'});}

export function renderWorldCards(grid,model,actions){
 const doc=grid.ownerDocument;
 // A card being renamed is kept as it is, so a redraw (for example after an autosave) never discards what is being typed.
 const editing=model.renaming&&grid.querySelector(`.world-card[data-world="${model.renaming}"] .world-rename`)?.closest('.world-card');
 grid.querySelectorAll('.world-card').forEach(el=>{if(el!==editing)el.remove();});
 for(const world of model.worlds){
  if(editing&&world.id===model.renaming){grid.append(editing);continue;}
  const current=world.id===model.currentId,busy=model.busy[world.id];
  const card=make(doc,'article',{class:'world-card'+(current?' is-current':''),'data-world':world.id,'aria-busy':busy?'true':null});
  card.append(make(doc,'button',{type:'button',class:'world-open','data-action':'open','aria-label':current?`Keep working on ${world.name}`:`Open ${world.name}`,onclick:()=>actions.open(world.id)},thumb(doc,world,'world-thumb'),current?make(doc,'span',{class:'world-badge'},'Open now'):null));
  if(busy)card.append(make(doc,'div',{class:'world-busy',role:'status'},make(doc,'span',{class:'world-spinner','aria-hidden':'true'}),busy));
  const text=make(doc,'div',{class:'world-text'});
  if(model.renaming===world.id){
   const input=make(doc,'input',{class:'world-rename',value:world.name,maxlength:80,'aria-label':'World name'});
   let settled=false;const finish=save=>{if(settled)return;settled=true;save?actions.rename(world.id,input.value):actions.cancelRename();};
   input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();finish(true);}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(false);}});
   input.addEventListener('blur',()=>{if(input.isConnected)finish(true);});
   text.append(input);
  }else text.append(make(doc,'div',{class:'world-name',title:world.name},world.name));
  text.append(make(doc,'div',{class:'world-sub'},`${relativeTime(world.edited,model.now)} · ${world.size} × ${world.size}`));
  card.append(make(doc,'div',{class:'world-meta'},text,make(doc,'button',{type:'button',class:'world-more','data-action':'menu','aria-label':`Options for ${world.name}`,'aria-haspopup':'menu','aria-expanded':'false',onclick:e=>actions.menu(world.id,e.currentTarget)},'⋯')));
  grid.append(card);
 }
}

export function renderTrash(list,count,model,actions){
 const doc=list.ownerDocument;list.replaceChildren();
 count.textContent=model.deleted.length?`${model.deleted.length} · kept for 30 days`:'empty';
 if(!model.deleted.length){list.append(make(doc,'p',{class:'trash-empty'},'Deleted worlds stay here for 30 days, then they are removed for good.'));return;}
 for(const world of model.deleted)list.append(make(doc,'div',{class:'trash-row','data-world':world.id},thumb(doc,world,'trash-thumb'),
  make(doc,'div',{class:'world-text'},make(doc,'div',{class:'world-name'},world.name),make(doc,'div',{class:'world-sub'},`Deleted ${relativeTime(world.deleted,model.now).toLowerCase()} · ${daysLeft(world,model.now)} days left`)),
  make(doc,'div',{class:'trash-actions'},make(doc,'button',{type:'button','data-action':'restore',onclick:()=>actions.restore(world.id)},'Restore'),make(doc,'button',{type:'button',class:model.confirmPurge===world.id?'danger-button':'quiet-button','data-action':'purge',onclick:()=>actions.purge(world.id)},model.confirmPurge===world.id?'Click again to delete for good':'Delete forever'))));
}

export function libraryFootText(model){
 const n=model.worlds.length,bytes=[...model.worlds,...model.deleted].reduce((s,w)=>s+(w.bytes||0),0);
 if(!model.persistent)return'This browser is not letting Landwright keep a library, so only the open world is saved between visits. Download a backup file to keep the others.';
 return`Stored in this browser · ${n} ${n===1?'world':'worlds'}${bytes?` · ${formatBytes(bytes)}`:''}. Clearing this site’s data erases them, so download a backup file for worlds you care about.`;
}

export function renderWorldMenu(menu,world,{current},actions){
 const doc=menu.ownerDocument;menu.replaceChildren();
 const item=(label,action,run,cls)=>make(doc,'button',{type:'button',role:'menuitem',class:cls,'data-action':action,onclick:run},...[].concat(label));
 const sub=make(doc,'div',{class:'world-menu-sub',hidden:true,role:'group','aria-label':'Download artwork'});
 for(const n of MAP_SIZES)sub.append(item(['Map image',make(doc,'small',{},`${n} × ${n}${n===2048?' · default':''}`)],`map-${n}`,()=>actions.art(world.id,'map',n)));
 sub.append(item(['Heightmap',make(doc,'small',{},`${world.size} × ${world.size}`)],'heightmap',()=>actions.art(world.id,'height',world.size)));
 const art=item(['Download artwork',make(doc,'span',{class:'chev','aria-hidden':'true'},'▸')],'artwork',()=>{const opening=sub.hidden;sub.hidden=!opening;art.setAttribute('aria-expanded',String(opening));actions.reposition?.();});
 art.setAttribute('aria-expanded','false');
 menu.append(
  item(current?'Keep working on it':'Open','open',()=>actions.open(world.id)),
  item('Rename','rename',()=>actions.startRename(world.id)),
  item('Duplicate','duplicate',()=>actions.duplicate(world.id)),
  make(doc,'hr'),art,sub,
  item('Download backup file','backup',()=>actions.backup(world.id)),
  make(doc,'p',{class:'world-menu-hint'},'A backup file can be imported into any browser.'),
  make(doc,'hr'),
  item('Delete','delete',()=>actions.remove(world.id),'danger'));
}
