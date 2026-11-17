const KEY='landwright-ui';
export function normalizePreferences(value={}){let s=value&&typeof value==='object'?value:{};return{theme:s.theme==='light'?'light':'dark',sidebarWidth:Math.max(180,Math.min(360,Number.isFinite(s.sidebarWidth)?s.sidebarWidth:228)),collapsed:s.collapsed===true};}
export function effectiveSidebarWidth(preferred,viewport){return Math.max(128,Math.min(preferred,360,viewport-(viewport<=800?180:viewport<=1100?470:510)));}
export function initUI(doc=document,storage=localStorage){
 const $=id=>doc.getElementById(id),root=doc.documentElement,body=doc.body;let saved=null;try{saved=JSON.parse(storage.getItem(KEY));}catch{}let prefs=normalizePreferences(saved);if(!saved&&(globalThis.innerWidth||doc.defaultView?.innerWidth||1280)<800)prefs.collapsed=true;
 const viewport=()=>globalThis.innerWidth||doc.defaultView?.innerWidth||1280;
 let resizing=null,settingsOpen=false;
 const persist=()=>{try{storage.setItem(KEY,JSON.stringify(prefs));}catch{}};
 function closeSettings(){settingsOpen=false;body.classList.remove('tool-settings-open');$('rail-settings').setAttribute('aria-expanded','false');}
 function apply(){root.dataset.theme=prefs.theme;root.style.setProperty('--sidebar-width',effectiveSidebarWidth(prefs.sidebarWidth,viewport())+'px');body.classList.toggle('sidebar-collapsed',prefs.collapsed);$('collapse-sidebar').setAttribute('aria-expanded',String(!prefs.collapsed));$('collapse-sidebar').setAttribute('aria-label',prefs.collapsed?'Expand toolbox':'Collapse toolbox');$('collapse-sidebar').title=prefs.collapsed?'Expand toolbox':'Collapse toolbox';$('sidebar-resizer').hidden=prefs.collapsed;$('sidebar-resizer').setAttribute('aria-valuenow',effectiveSidebarWidth(prefs.sidebarWidth,viewport()));$('sidebar-resizer').setAttribute('aria-valuemin',Math.min(180,effectiveSidebarWidth(360,viewport())));$('sidebar-resizer').setAttribute('aria-valuemax',effectiveSidebarWidth(360,viewport()));$('theme-toggle').setAttribute('aria-label',prefs.theme==='dark'?'Switch to light mode':'Switch to dark mode');$('theme-toggle').title=prefs.theme==='dark'?'Switch to light mode':'Switch to dark mode';$('theme-label').textContent=prefs.theme==='dark'?'Light':'Dark';$('theme-toggle').dataset.current=prefs.theme;}
 $('theme-toggle').onclick=()=>{prefs.theme=prefs.theme==='dark'?'light':'dark';apply();persist();};
 $('collapse-sidebar').onclick=()=>{closeSettings();prefs.collapsed=!prefs.collapsed;apply();persist();};
 $('rail-settings').onclick=()=>{settingsOpen=!settingsOpen;body.classList.toggle('tool-settings-open',settingsOpen);$('rail-settings').setAttribute('aria-expanded',String(settingsOpen));};
 $('close-tool-settings').onclick=()=>{closeSettings();$('rail-settings').focus();};
 const handle=$('sidebar-resizer');
 handle.onpointerdown=e=>{if(e.button!==0||prefs.collapsed)return;e.preventDefault();handle.setPointerCapture(e.pointerId);resizing={x:e.clientX,width:effectiveSidebarWidth(prefs.sidebarWidth,viewport())};body.classList.add('sidebar-resizing');};
 handle.onpointermove=e=>{if(!resizing)return;prefs.sidebarWidth=Math.max(Math.min(180,effectiveSidebarWidth(360,viewport())),effectiveSidebarWidth(resizing.width+e.clientX-resizing.x,viewport()));apply();};
 handle.onpointerup=handle.onpointercancel=()=>{if(!resizing)return;resizing=null;body.classList.remove('sidebar-resizing');persist();};
 handle.onkeydown=e=>{let delta=(e.shiftKey?40:10)*(e.key==='ArrowLeft'?-1:1);if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();prefs.sidebarWidth=e.key==='Home'?Math.min(180,effectiveSidebarWidth(360,viewport())):e.key==='End'?effectiveSidebarWidth(360,viewport()):Math.max(Math.min(180,effectiveSidebarWidth(360,viewport())),effectiveSidebarWidth(effectiveSidebarWidth(prefs.sidebarWidth,viewport())+delta,viewport()));apply();persist();};
 doc.addEventListener('pointerdown',e=>{if(settingsOpen&&prefs.collapsed&&!$('left-panel').contains(e.target))closeSettings();},true);
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&settingsOpen){closeSettings();$('rail-settings').focus();}});
 doc.defaultView?.addEventListener('resize',apply);
 apply();return{closeSettings};
}
