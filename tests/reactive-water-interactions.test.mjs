import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('a held Lower stroke sends ocean coverage into the basin only through the cut', async () => {
  const size=128;
  const heights=Array.from({length:size*size},(_,i)=>{
    const x=i%size,y=Math.floor(i/size);
    if(x<25||(x>=31&&x<=82&&y>=38&&y<=82))return 40;
    if(x>=25&&x<31&&y>=38&&y<=82)return 63.5;
    return 77;
  });
  const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
  const {window:w}=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});
  const d=w.document, $=id=>d.getElementById(id), pending=new Map();
  let id=0, time=0, visibleWater, hidden=false;
  Object.defineProperty(d,'hidden',{get:()=>hidden});
  const request=cb=>{pending.set(++id,cb);return id;};
  const cancel=handle=>pending.delete(handle);
  function frame() {
    time+=35;
    const batch=[...pending.values()];
    pending.clear();
    visibleWater=null;
    for(const cb of batch)cb(time);
  }

  w.HTMLCanvasElement.prototype.toDataURL=()=>'data:image/png;base64,'+'A'.repeat(80);w.HTMLCanvasElement.prototype.getContext=function(kind){
    if(kind!=='2d')return null;
    return new Proxy({
      createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),
      putImageData:image=>{this.image=image;},
      drawImage:source=>{
        if(this.id==='map'&&source.image?.width===size)visibleWater=source.image.data;
      }
    },{get:(object,key)=>object[key]??(()=>{})});
  };
  w.HTMLCanvasElement.prototype.setPointerCapture=()=>{};
  const map=$('map');
  Object.defineProperties(map,{clientWidth:{value:1024},clientHeight:{value:768}});
  const motion=new w.EventTarget();
  motion.matches=false;
  Object.assign(w,{requestAnimationFrame:request,cancelAnimationFrame:cancel,matchMedia:()=>motion});
  Object.assign(globalThis,{
    document:d,localStorage:w.localStorage,devicePixelRatio:1,requestAnimationFrame:request,
    ResizeObserver:class{observe(){}}
  });
  localStorage.setItem('worldpainter-project',JSON.stringify({
    version:2,size,name:'Channel cut',heights,paint:heights.map(()=>0),sea:62,water:true
  }));
  localStorage.setItem('landwright-living',JSON.stringify({enabled:true,clouds:false,waterMotion:true}));
  await import('../app.mjs');

  const alpha=(x,y)=>visibleWater?.[(y*size+x)*4+3]??0;
  const select=s=>d.querySelector(s).click();
  const scale=(768-135)/size;
  const stroke=type=>map['on'+type](new w.MouseEvent(type,{
    clientX:(1024-size*scale)/2+28*scale,clientY:(768-size*scale)/2-6+62*scale,button:0
  }));
  frame();
  assert.equal(alpha(10,62),255);
  assert.equal(alpha(75,62),0);

  select('[data-tool="lower"]');
  select('[data-brush="hard"]');
  $('strength').value='100';
  $('size').value='12';
  stroke('pointerdown');
  for(let i=0;i<120&&alpha(32,62)!==255;i++)frame();
  assert.equal(alpha(32,62),255);
  assert.equal(alpha(75,62),0);

  hidden=true;
  d.dispatchEvent(new w.Event('visibilitychange'));
  time+=5000;
  frame();
  assert.equal(alpha(75,62),0);
  assert.equal(pending.size,0);
  hidden=false;
  d.dispatchEvent(new w.Event('visibilitychange'));
  frame();
  assert.equal(alpha(75,62),0);

  $('undo').click();
  frame();
  assert.equal(alpha(32,62),0);
  $('redo').click();
  frame();
  assert.equal(alpha(75,62),255);

  $('undo').click();
  frame();
  stroke('pointerdown');
  motion.matches=true;
  motion.dispatchEvent(new w.Event('change'));
  frame();
  assert.equal(alpha(75,62),255);
  stroke('pointerup');
  $('water').click();
  frame();
  assert.equal(visibleWater,null);
  await new Promise(resolve=>setTimeout(resolve,650));
  w.close();
});
