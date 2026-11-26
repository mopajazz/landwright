import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
// Boots a fresh copy of the app in its own DOM with the given IndexedDB and browser storage.
// Canvas drawing is stubbed: these tests cover the library, not rendering.
export async function bootApp({indexedDB,storage={},tag='boot'}={}){
 const dom=new JSDOM(await fs.readFile(new URL('../../index.html',import.meta.url),'utf8'),{url:'https://example.test/'});
 const w=dom.window,doc=w.document,$=id=>doc.getElementById(id),blobs=[];
 const context=new Proxy({createImageData:(x,y)=>({data:new Uint8ClampedArray(x*y*4)}),getImageData:(x,y,a,b)=>({data:new Uint8ClampedArray(a*b*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 w.HTMLCanvasElement.prototype.getContext=type=>type==='2d'?context:null;
 w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(new w.Blob(['image']));};
 w.HTMLCanvasElement.prototype.toDataURL=function(){return'data:image/png;base64,'+'T'.repeat(80);};
 w.HTMLCanvasElement.prototype.setPointerCapture=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){blobs.push({name:this.download,blob:currentBlob});};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(value){this.open=false;if(value!==undefined)this.returnValue=value;this.dispatchEvent(new w.Event('close'));};
 let currentBlob=null;URL.createObjectURL=b=>{currentBlob=b;return'blob:test'};URL.revokeObjectURL=()=>{};
 for(const id of['map','preview'])for(const [k,v] of [['clientWidth',id==='map'?1024:224],['clientHeight',id==='map'?768:165]])Object.defineProperty($(id),k,{value:v});
 for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v);
 Object.assign(globalThis,{requestAnimationFrame:cb=>{cb(performance.now());return 1;},document:doc,localStorage:w.localStorage,devicePixelRatio:1,ResizeObserver:class{observe(){}},indexedDB});
 const app=await import(`../../app.mjs?${tag}`);
 const settle=async()=>{for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,0));await app.worldsReady();}};
 await settle();
 return{dom,w,doc,$,app,blobs,settle,
  key:(key,more={})=>doc.body.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,...more})),
  card:id=>doc.querySelector(`#library-grid [data-world="${id}"]`),
  async menu(id,action){if(!$('library').open)$('worlds').click();doc.querySelector(`#library-grid [data-world="${id}"] .world-more`).click();const item=$('world-menu').querySelector(`[data-action="${action}"]`);if(!item)throw Error('menu has no '+action);item.click();await settle();}};
}
export const legacyProject=(name,size=128,height=70)=>({version:2,size,name,heights:Array(size*size).fill(height),paint:Array(size*size).fill(0),sea:62,water:true});
