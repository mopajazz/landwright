import{generate,stroke}from'./terrain.mjs?v=1.8.0';
import{brushDelta,resizeBrush,normalizeProject,defaultLayers}from'./editor.mjs?v=1.8.0';
import{drawLandmark,createLandmarkAtlas}from'./landmarks.mjs?v=1.8.0';
import{MATERIALS,blendPaint,brushWeight,coastStroke}from'./brushes.mjs?v=1.8.0';
import{drawShape,drawProjectedShape}from'./shapes.mjs?v=1.8.0';
import{renderTerrain,projectTerrain,pickTerrain,sampleTerrain,createFrameScheduler}from'./terrain3d.mjs?v=1.8.0';
import{initUI}from'./ui.mjs?v=1.8.0';
import{toolIcon}from'./icons.mjs?v=1.8.0';
import{touchesShape}from'./eraser.mjs?v=1.8.0';
import{createGPUTerrain}from'./gpu-terrain.mjs?v=1.8.0';
let N=256;const $=id=>document.getElementById(id),map=$('map'),ctx=map.getContext('2d'),mini=$('preview'),mc=mini.getContext('2d'),off=document.createElement('canvas');off.width=off.height=N;const oc=off.getContext('2d');let heights=generate(N,42),paint=new Uint8Array(N*N),tool='raise',material=1,view='terrain',sea=62,water=true,shade=true,contours=true,grid=false,zoom=1,pan={x:0,y:0},undo=[],redo=[],down=false,last=null,modified=false,rotation=0,saveTimer,marks=[],layers=defaultLayers(),selectedShape='island',brushPosition=null,nameEditSnapshot=null,paintColors=new Uint8ClampedArray(N*N*3),paintAlpha=new Float32Array(N*N),drawings=[],brushPreset='soft',workspaceMode='2d',camera={yaw:-.65,pitch:.65,zoom:1},orbitPointer=null,paintStroke=null,textureDirty=true,sceneDirty=true,gpu=null,gpuFailed=false,gpuFailureReason='',orbitMode=false,lastFrameTime=0,averageFps=0,eraseTarget='surface';
document.querySelectorAll('[data-tool]').forEach(button=>{button.querySelector('b').outerHTML=toolIcon(button.dataset.tool);button.title={land:'Shape land · Shift removes land (C)',raise:'Raise terrain (R)',lower:'Lower terrain (L)',smooth:'Smooth terrain (Q)',flatten:'Flatten terrain (F)',paint:'Paint surface (B / P)',erase:'Erase from a layer (E)',pan:'Pan the map (H)'}[button.dataset.tool];button.setAttribute('aria-label',button.title);});
const materials=MATERIALS;
const glCanvas=$('terrain-gl'),combined=document.createElement('canvas'),composite=combined.getContext('2d');combined.width=combined.height=1024;
const landmarkAtlas=createLandmarkAtlas();
const tiny=document.createElement('canvas');tiny.width=tiny.height=N;const tinyCtx=tiny.getContext('2d');let fallbackPixels=null;
let grainNoise=Float32Array.from({length:N*N},(_,i)=>(Math.sin(i*78.233)*43758.5453)%1*4),pixels=oc.createImageData(N,N);
const scheduleFrame=createFrameScheduler(renderFrame);

$('palette').innerHTML=materials.map((m,i)=>`<button data-material="${i+1}" class="${i===0?'selected':''}" title="Paint ${m[0]}"><span class="swatch" style="--c:${m[1]}"></span><span>${m[0]}</span></button>`).join('');
function notify(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>$('toast').classList.remove('show'),2400)}
function color(i){
 let h=heights[i],c;
 if(view==='height')return[h,h,h];
 if(h<sea&&water){let d=Math.min(1,(sea-h)/65);return[46-d*17,83-d*31,88-d*28];}
 if(h<sea+4)c=[175,166,116];else if(h>180)c=[216,216,195];else if(h>145)c=[140,145,116];else if(h>110)c=[108,132,84];else c=[93,126,73];
 if(view==='biome')c=h>160?[167,183,185]:h>120?[105,145,106]:[114,167,89];
 if(layers.surface.visible&&paintAlpha[i]){let a=paintAlpha[i];c=c.map((v,k)=>v*(1-a)+paintColors[i*3+k]*a);}
 if(view==='biome')return c;
 let x=i%N,y=Math.floor(i/N),s=1;if(shade&&layers.elevation.visible){let dx=heights[y*N+Math.min(N-1,x+1)]-heights[y*N+Math.max(0,x-1)],dy=heights[Math.min(N-1,y+1)*N+x]-heights[Math.max(0,y-1)*N+x];s=Math.max(.47,Math.min(1.4,1+(dx+dy)*.055));}
 let grain=grainNoise[i];return c.map(v=>Math.max(0,Math.min(255,v*s+grain)));
}
function texture(){let img=pixels;for(let i=0;i<N*N;i++){let c=color(i);if(contours&&layers.elevation.visible&&view!=='biome'&&heights[i]>sea&&i>=N&&Math.floor(heights[i]/10)!==Math.floor(heights[i-N]/10))c=c.map(v=>v*.78);let j=i*4;img.data[j]=c[0];img.data[j+1]=c[1];img.data[j+2]=c[2];img.data[j+3]=255;}oc.putImageData(img,0,0);}
function flushTexture(){if(textureDirty){texture();textureDirty=false;}}
function transform(){let w=map.clientWidth,h=map.clientHeight;let scale=Math.max(.05,Math.min((w-70)/N,(h-135)/N))*zoom;return{scale,x:(w-N*scale)/2+pan.x,y:(h-N*scale)/2+pan.y-6}}
function draw(){if(workspaceMode==='3d'){sceneDirty=true;scheduleFrame();return;}let w=map.clientWidth,h=map.clientHeight;ctx.clearRect(0,0,w,h);let t=transform();ctx.save();ctx.shadowColor='#0005';ctx.shadowBlur=36;ctx.drawImage(off,t.x,t.y,N*t.scale,N*t.scale);ctx.restore();if(layers.shapes.visible&&view!=='height'){ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);ctx.beginPath();ctx.rect(0,0,N,N);ctx.clip();for(let shape of drawings)drawShape(ctx,shape);ctx.restore();}if(layers.landmarks.visible&&view!=='height'){ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);for(let m of marks)drawLandmark(ctx,m);ctx.restore();}ctx.strokeStyle='#84988045';ctx.strokeRect(t.x,t.y,N*t.scale,N*t.scale);if(grid){ctx.strokeStyle='#dae5c62a';ctx.lineWidth=.5;for(let i=0;i<=N;i+=16){ctx.beginPath();ctx.moveTo(t.x+i*t.scale,t.y);ctx.lineTo(t.x+i*t.scale,t.y+N*t.scale);ctx.stroke();ctx.beginPath();ctx.moveTo(t.x,t.y+i*t.scale);ctx.lineTo(t.x+N*t.scale,t.y+i*t.scale);ctx.stroke()}}$('zoomtext').textContent=Math.round(zoom*100)+'%'}
function composeSurface(includeDrawings=true){
 composite.setTransform(1,0,0,1,0,0);composite.clearRect(0,0,1024,1024);composite.drawImage(off,0,0,1024,1024);composite.scale(1024/N,1024/N);
 if(includeDrawings&&layers.shapes.visible&&view!=='height'){for(let s of drawings)drawShape(composite,s);}
 if(grid){composite.strokeStyle='#e1ebd43d';composite.lineWidth=.25;composite.beginPath();for(let i=0;i<N;i+=16){composite.moveTo(i,0);composite.lineTo(i,N);composite.moveTo(0,i);composite.lineTo(N,i);}composite.stroke();}
}
function draw3DBrush(){
 if(!brushPosition?.hit||orbitPointer||tool==='pan'||orbitMode)return;
 let w=mini.clientWidth,h=mini.clientHeight,r=+$('size').value/2;mc.beginPath();
 for(let i=0;i<=48;i++){let angle=i/48*Math.PI*2,x=Math.max(0,Math.min(N-1,brushPosition.x+Math.cos(angle)*r)),y=Math.max(0,Math.min(N-1,brushPosition.y+Math.sin(angle)*r)),p=projectTerrain(x,y,sampleTerrain(x,y,heights,sea,water)+.7,w,h,camera);if(i)mc.lineTo(p.x,p.y);else mc.moveTo(p.x,p.y);}
 mc.closePath();mc.fillStyle='#cfe9a512';mc.strokeStyle='#e1f3bdcc';mc.lineWidth=1;mc.fill();mc.stroke();
}
function renderFrame(time){
 flushTexture();
 if(workspaceMode!=='3d'){draw();return;}
 let started=performance.now(),w=mini.clientWidth,h=mini.clientHeight;if(!w||!h)return;
 if(!gpu&&!gpuFailed){try{gpu=createGPUTerrain(glCanvas);if(!gpu){gpuFailed=true;gpuFailureReason='WebGL context unavailable';}}catch(error){gpuFailed=true;gpuFailureReason=error.message;}glCanvas.hidden=!gpu;}
 if(sceneDirty){composeSurface(!!gpu);if(gpu)gpu.update(heights,combined,layers.landmarks.visible&&view!=='height'?marks:[],sea,water);else{tinyCtx.clearRect(0,0,N,N);tinyCtx.drawImage(combined,0,0,N,N);fallbackPixels=tinyCtx.getImageData(0,0,N,N).data;}sceneDirty=false;}
 mc.clearRect(0,0,w,h);
 if(gpu)gpu.draw(w,h,camera);
 else{renderTerrain(mc,w,h,heights,i=>[fallbackPixels[i*4],fallbackPixels[i*4+1],fallbackPixels[i*4+2]],sea,water,camera,orbitPointer?6:3);if(layers.shapes.visible&&view!=='height'){const project=(x,y)=>projectTerrain(x,y,sampleTerrain(x,y,heights,sea,water)+.2,w,h,camera);for(let shape of drawings)drawProjectedShape(mc,shape,project);}if(layers.landmarks.visible&&view!=='height')for(let m of marks){let p=projectTerrain(m.x,m.y,sampleTerrain(m.x,m.y,heights,sea,water),w,h,camera),scale=Math.max(.1,Math.min((w-50)/365,(h-100)/290))*camera.zoom;let size=m.size*64/44*scale,kind={tree:0,mountain:1,town:2}[m.type];mc.globalAlpha=m.opacity??1;mc.drawImage(landmarkAtlas,kind*64,0,64,64,p.x-size/2,p.y-size/2,size,size);mc.globalAlpha=1;}}
 draw3DBrush();
 let duration=performance.now()-started,delta=time-lastFrameTime;if(lastFrameTime&&delta>0&&delta<200&&(orbitPointer||down)){let fps=1000/delta;averageFps=averageFps?averageFps*.8+fps*.2:fps;}lastFrameTime=time;
 $('render-stats').textContent=(gpu?'GPU':'Canvas')+(averageFps?' · '+Math.round(averageFps)+' fps':'');$('render-stats').dataset.renderMs=duration.toFixed(2);$('render-stats').dataset.fps=averageFps.toFixed(1);$('render-stats').dataset.renderer=gpu?'webgl':'canvas';$('render-stats').dataset.fallbackReason=gpu?'':gpuFailureReason;$('render-stats').title=gpu?'WebGL rendering':'Canvas fallback: '+gpuFailureReason;
}
function preview(){scheduleFrame();}
function refresh(){textureDirty=true;sceneDirty=true;scheduleFrame();}
function resize(){let d=Math.min(2,devicePixelRatio||1);for(let c of[map,mini,glCanvas]){let width=Math.round((c===glCanvas?mini.clientWidth:c.clientWidth)*d),height=Math.round((c===glCanvas?mini.clientHeight:c.clientHeight)*d);if(c.width!==width||c.height!==height){c.width=width;c.height=height;}if(c!==glCanvas)c.getContext('2d').setTransform(d,0,0,d,0,0);}scheduleFrame();}new ResizeObserver(resize).observe(document.querySelector('.workspace'));
function state(){return{version:3,size:N,name:$('worldname').value,heights:Array.from(heights,v=>Math.round(v*1000)/1000),paint:Array.from(paint),paintColors:Array.from(paintColors),paintAlpha:Array.from(paintAlpha,v=>Math.round(v*10000)/10000),sea,water,shade,marks:marks.map(m=>({...m})),shapes:structuredClone(drawings),layers:structuredClone(layers)}}
function persist(){modified=true;$('save-status').textContent='Saving changes…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem('worldpainter-project',JSON.stringify(state()));modified=false;$('save-status').textContent='All changes saved locally'}catch{$('save-status').textContent='Save project to keep changes';notify('Local storage full — save your project to a file.')}},600)}
function snapshot(record=state()){undo.push(record);if(undo.length>35)undo.shift();redo=[];historyUI()}
function historyUI(){$('undo').disabled=!undo.length;$('redo').disabled=!redo.length}
function restoreHistory(from,to){cancelStroke();if(!from.length)return;to.push(state());load(from.pop());refresh();historyUI();persist()}
function pointer(e){let canvas=workspaceMode==='3d'?mini:map,b=canvas.getBoundingClientRect(),sx=e.clientX-b.left,sy=e.clientY-b.top;
 if(workspaceMode==='3d'){let hit=pickTerrain(sx,sy,mini.clientWidth,mini.clientHeight,camera,heights,sea,water);return hit?{...hit,sx,sy,hit:true}:{x:NaN,y:NaN,sx,sy,hit:false};}
 let t=transform();return{x:(sx-t.x)/t.scale,y:(sy-t.y)/t.scale,sx,sy,hit:true};}
function activeLayer(){return layers[tool==='erase'?eraseTarget:tool==='paint'?'surface':'elevation'];}
function opacity(){return tool==='erase'&&eraseTarget!=='surface'?1:+$('opacity').value/100;}
function apply(p,e){
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return;let layer=activeLayer();if(layer.locked||!layer.visible||!opacity())return;
 let r=+$('size').value/2,alpha=opacity();
 if(tool==='erase'&&eraseTarget==='landmarks'){marks=marks.filter(m=>Math.hypot(m.x-p.x,m.y-p.y)>r+m.size*.6);return;}
 if(tool==='erase'&&eraseTarget==='shapes'){drawings=drawings.filter(s=>!touchesShape(s,p.x,p.y,r));return;}
 if(tool==='land'){coastStroke(heights,N,p.x,p.y,r,sea,alpha,e.shiftKey);return;}
 if(tool==='paint'||(tool==='erase'&&eraseTarget==='surface')){
  for(let y=Math.max(0,Math.floor(p.y-r));y<Math.min(N,p.y+r);y++)for(let x=Math.max(0,Math.floor(p.x-r));x<Math.min(N,p.x+r);x++){
   let weight=brushWeight(x,y,p.x,p.y,r,brushPreset)*alpha;if(!weight)continue;let i=y*N+x;
   if(paintStroke){if(weight<=paintStroke.coverage[i])continue;paintStroke.coverage[i]=weight;paintAlpha[i]=paintStroke.alpha[i];for(let k=0;k<3;k++)paintColors[i*3+k]=paintStroke.colors[i*3+k];}
   let erasing=tool==='erase'||e.shiftKey;blendPaint(paintColors,paintAlpha,i,materials[material-1][2],weight,erasing);paint[i]=paintAlpha[i]<.001?0:(erasing?paint[i]:material);
  }
  return;
 }
 let active=tool;if(e.shiftKey){if(tool==='raise')active='lower';else if(tool==='lower')active='raise';}
 stroke(heights,N,p.x,p.y,r,+$('strength').value/100*3*alpha,active,+$('target').value,{preserveBoundary:$('preserve-edges').checked,preset:brushPreset});
}
map.onpointerdown=e=>{
 if(e.button!==0&&e.button!==1)return;
 (workspaceMode==='3d'?mini:map).setPointerCapture(e.pointerId);down=true;last=pointer(e);if(workspaceMode==='3d'&&!last.hit){down=false;return;}
 if(tool==='pan'||e.button===1){last.pan=true;return;}
 let layer=activeLayer();if(layer.locked||!layer.visible){notify(layer.locked?'Unlock this layer to edit it.':'Show this layer to edit it.');down=false;return;}
 if(opacity()){snapshot();if(tool==='paint'||(tool==='erase'&&eraseTarget==='surface'))paintStroke={colors:paintColors.slice(),alpha:paintAlpha.slice(),coverage:new Float32Array(N*N)};apply(last,e);refresh();}
};
map.onpointermove=e=>{
 let p=pointer(e),t=transform();brushPosition=p;
 $('brush').style.cssText=`display:${workspaceMode==='3d'||tool==='pan'?'none':'block'};left:${p.sx}px;top:${p.sy}px;width:${+$('size').value*t.scale}px;height:${+$('size').value*t.scale}px`;
 let x=Math.floor(p.x),y=Math.floor(p.y);if(x>=0&&y>=0&&x<N&&y<N){let i=y*N+x;$('coords').textContent=`X: ${x}   Z: ${y}`;$('heightstatus').textContent=`Height: ${Math.round(heights[i])}`;$('terrainstatus').textContent=heights[i]<sea&&water?'Ocean':paint[i]?materials[paint[i]-1][0]:'Grassland';}
 if(workspaceMode==='3d'){preview();if(!p.hit){last=p;return;}}
 if(down){
  if(last.pan){pan.x+=p.sx-last.sx;pan.y+=p.sy-last.sy;p.pan=true;draw();}
  else if(tool!=='pan'){if(!last?.hit)last=p;let d=Math.hypot(p.x-last.x,p.y-last.y),steps=Math.max(1,Math.ceil(d/3));for(let j=1;j<=steps;j++)apply({x:last.x+(p.x-last.x)*j/steps,y:last.y+(p.y-last.y)*j/steps},e);refresh();}
  last=p;
 }
};
function end(){const legacyErase=down&&tool==='erase'&&eraseTarget!=='surface';if(down&&tool!=='pan')persist();down=false;last=null;paintStroke=null;if(legacyErase)renderLayers();}
function cancelStroke(){if(down&&!last?.pan)persist();down=false;last=null;paintStroke=null;draw();}
map.onpointerup=end;map.onpointercancel=()=>{if(down)persist();cancelStroke();};map.onpointerleave=()=>{brushPosition=null;$('brush').style.display='none';};
function changeZoom(z){zoom=Math.max(.4,Math.min(4,z));draw()}map.addEventListener('wheel',e=>{e.preventDefault();if(e.shiftKey){adjustBrush(brushDelta(e));return;}changeZoom(zoom*(e.deltaY>0?.9:1.1))},{passive:false});$('plus').onclick=()=>changeZoom(zoom*1.2);$('minus').onclick=()=>changeZoom(zoom/1.2);$('fit').onclick=()=>{zoom=1;pan={x:0,y:0};draw()};
function selectTool(t){
 $('erase-description').textContent={surface:'Reveal the natural terrain color. Elevation stays intact.',landmarks:'Remove whole legacy landmarks touched by the brush. Undo to restore.',shapes:'Remove whole legacy drawings touched by the brush. Undo to restore.'}[eraseTarget];
 if(down)end();orbitPointer=null;orbitMode=false;$('orbit-toggle').setAttribute('aria-pressed','false');$('orbit-toggle').textContent='Orbit';tool=t;updateBrushUI();
 $('erase-settings').hidden=t!=='erase';$('opacity-label').hidden=false;$('brush-controls').hidden=false;$('size-label').hidden=false;$('size-shortcuts').hidden=false;$('size').disabled=t==='pan';$('opacity').disabled=t==='pan'||(t==='erase'&&eraseTarget!=='surface');$('strength-label').hidden=!['raise','lower','smooth','flatten'].includes(t);$('target-label').hidden=t!=='flatten';$('edge-protection-label').hidden=t!=='flatten';
 $('sculpt-settings').hidden=!['raise','lower','smooth','flatten'].includes(t);$('brush-settings').hidden=false;document.querySelectorAll('[data-brush]').forEach(b=>b.disabled=!['raise','lower','smooth','flatten','paint','erase'].includes(t)||(t==='erase'&&eraseTarget!=='surface'));
 $('palette').closest('.section').hidden=false;$('paint-status').textContent=t==='paint'?`${materials[material-1][0]} · ${brushPreset==='coast'?'Coastline':brushPreset==='hard'?'Hard Round':brushPreset==='grain'?'Grain':'Soft Round'} · Shift erases paint`:`${materials[material-1][0]} selected · Use Paint (P) to apply.`;
 document.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('selected',b.dataset.tool===t);b.setAttribute('aria-pressed',b.dataset.tool===t);});
 $('toolhint').textContent={raise:'Raise terrain',lower:'Lower terrain',smooth:'Smooth terrain',flatten:'Flatten to target height',paint:'Paint '+materials[material-1][0],pan:'Pan the map',erase:'Erase '+{surface:'surface paint',landmarks:'landmarks',shapes:'drawings'}[eraseTarget],land:'Shape coastline · Shift to remove land'}[t];map.style.cursor=t==='pan'?'grab':'crosshair';
}
$('tools').onclick=e=>{let b=e.target.closest('[data-tool]');if(b)selectTool(b.dataset.tool)};$('palette').onclick=e=>{let b=e.target.closest('[data-material]');if(!b)return;material=+b.dataset.material;document.querySelectorAll('[data-material]').forEach(el=>el.classList.toggle('selected',el===b));selectTool(tool)};
for(let id of['size','strength','target'])$(id).oninput=()=>{$(id+'out').value=$(id).value+(id==='size'?' px':id==='strength'?'%':'')};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));refresh()});
$('grid').onclick=()=>{grid=!grid;$('grid').classList.toggle('active',grid);draw()};$('contours').onclick=()=>{contours=!contours;$('contours').classList.toggle('active',contours);refresh()};$('sea').onpointerdown=()=>snapshot();$('sea').onkeydown=e=>{if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key))snapshot()};$('sea').oninput=()=>{sea=+$('sea').value;$('seaout').value=sea;refresh();persist()};for(let id of['water','shade'])$(id).onclick=()=>{snapshot();if(id==='water')water=!water;else shade=!shade;let v=id==='water'?water:shade;$(id).classList.toggle('on',v);$(id).setAttribute('aria-pressed',v);refresh();persist()};$('undo').onclick=()=>restoreHistory(undo,redo);$('redo').onclick=()=>restoreHistory(redo,undo);
function download(blob,name){let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}function slug(){return $('worldname').value.replace(/[^a-z0-9 -]/gi,'').trim()||'world'}
$('save').onclick=()=>{download(new Blob([JSON.stringify(state())],{type:'application/json'}),slug()+'.world.json');persist();notify('Project saved — keep building.')};$('export-height').onclick=()=>{$('exportdialog').close();let c=document.createElement('canvas');c.width=c.height=N;let cx=c.getContext('2d'),im=cx.createImageData(N,N);for(let i=0;i<N*N;i++){let v=Math.round(heights[i]);im.data.set([v,v,v,255],i*4)}cx.putImageData(im,0,0);c.toBlob(b=>{download(b,slug()+'-heightmap.png');notify(`${N} × ${N} heightmap exported.`)})};
$('new').onclick=()=>{$('newdialog').returnValue='';$('newdialog').showModal();};$('newdialog').addEventListener('close',()=>{if($('newdialog').returnValue!=='generate')return;snapshot();setWorldSize(+$('world-size').value);heights=generate(N,+$('seed').value,{shape:selectedShape,relief:+$('relief').value/100});paint.fill(0);paintColors.fill(0);paintAlpha.fill(0);marks=[];drawings=[];layers=defaultLayers();sea=62;water=true;shade=true;load({...state(),name:$('newname').value||'Untitled world'});$('worldname').value=$('newname').value||'Untitled Island';$('infotitle').textContent=$('worldname').value;zoom=1;pan={x:0,y:0};camera={yaw:-.65,pitch:.65,zoom:1,panX:0,panY:0,size:N};refresh();persist();notify('Your new world is ready.')});$('help').onclick=()=>$('helpdialog').showModal();$('worldname').onfocus=()=>{nameEditSnapshot=state();};$('worldname').onblur=()=>{nameEditSnapshot=null;};$('worldname').oninput=()=>{if(nameEditSnapshot){snapshot(nameEditSnapshot);nameEditSnapshot=null;}$('infotitle').textContent=$('worldname').value;persist()};
function setWorldSize(n){if(![128,192,256].includes(n))throw Error('Invalid project');N=n;camera.size=N;off.width=off.height=tiny.width=tiny.height=N;pixels=oc.createImageData(N,N);grainNoise=Float32Array.from({length:N*N},(_,i)=>(Math.sin(i*78.233)*43758.5453)%1*4);paint=new Uint8Array(N*N);paintColors=new Uint8ClampedArray(N*N*3);paintAlpha=new Float32Array(N*N);document.querySelectorAll('[data-dimensions]').forEach(el=>el.textContent=`${N} × ${N}`);$('heightmap-dimensions').textContent=`PNG · ${N} × ${N}`;document.querySelector('.map-scale').innerHTML=`<span></span>${N/2} blocks`;$('world-size').value=String(N);textureDirty=true;brushPosition=null;}
function load(input){let s=normalizeProject(input);setWorldSize(s.size);heights=Float32Array.from(s.heights);paint=Uint8Array.from(s.paint);paintColors=Uint8ClampedArray.from(s.paintColors);paintAlpha=Float32Array.from(s.paintAlpha);drawings=s.shapes;sea=s.sea;water=s.water;shade=s.shade;marks=s.marks;layers=s.layers;$('worldname').value=s.name;$('infotitle').textContent=s.name;$('sea').value=sea;$('seaout').value=sea;for(let id of['water','shade']){let v=id==='water'?water:shade;$(id).classList.toggle('on',v);$(id).setAttribute('aria-pressed',v);}renderLayers();}
$('open').onclick=()=>$('file').click();$('file').onchange=async()=>{let f=$('file').files[0];if(!f)return;try{if(f.size>12e6)throw Error('File too large (12 MB maximum)');if(f.name.endsWith('.json')){let s=normalizeProject(JSON.parse(await f.text()));snapshot();load(s)}else{let image=await createImageBitmap(f);snapshot();oc.clearRect(0,0,N,N);oc.drawImage(image,0,0,N,N);let d=oc.getImageData(0,0,N,N).data;for(let i=0;i<N*N;i++)heights[i]=d[i*4]*.2126+d[i*4+1]*.7152+d[i*4+2]*.0722;paint.fill(0);paintColors.fill(0);paintAlpha.fill(0);marks=[];drawings=[];image.close()}refresh();persist();notify('Imported successfully.')}catch(e){notify(e.message==='Invalid project'?'This project file is invalid.':e.message||'Could not import file.')}finally{$('file').value=''}};
document.onkeydown=e=>{if(e.target.matches('input,textarea,select,[contenteditable=true]')||document.querySelector('dialog[open]'))return;if(e.ctrlKey||e.metaKey){if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?restoreHistory(redo,undo):restoreHistory(undo,redo)}if(e.key.toLowerCase()==='s'){e.preventDefault();$('save').click()}return}if(e.key==='Escape'){cancelStroke();return;}let delta=brushDelta(e);if(delta){e.preventDefault();adjustBrush(delta);return;}let t={r:'raise',l:'lower',q:'smooth',f:'flatten',p:'paint',b:'paint',h:'pan',m:'land',c:'land',e:'erase'}[e.key.toLowerCase()];if(t)selectTool(t)};

function adjustBrush(delta){$('size').value=resizeBrush(+$('size').value,delta);$('sizeout').value=$('size').value+' px';if(brushPosition){let t=transform();$('brush').style.width=$('brush').style.height=(+$('size').value*t.scale)+'px';}if(workspaceMode==='3d')preview();}
function renderLayers(){let names={...(drawings.length?{shapes:['Drawings','From an earlier project']}:{}),...(marks.length?{landmarks:['Landmarks','From an earlier project']}:{}),surface:['Surface','Terrain & biome paint'],elevation:['Relief','Sculpting, shading & contours']};$('layer-count').textContent=Object.keys(names).length;
 const targets={surface:'Surface paint',...(marks.length?{landmarks:'Legacy landmarks'}:{}),...(drawings.length?{shapes:'Legacy drawings'}:{})};if(!targets[eraseTarget])eraseTarget='surface';$('erase-target').innerHTML=Object.entries(targets).map(([id,label])=>`<option value="${id}">${label}</option>`).join('');$('erase-target').value=eraseTarget;
 $('layers').innerHTML=Object.entries(names).map(([key,[name,desc]])=>`<div class="layer-row ${layers[key].visible?'':'is-hidden'}"><button data-layer="${key}" data-action="visible" aria-label="${layers[key].visible?'Hide':'Show'} ${name}" aria-pressed="${layers[key].visible}" title="Toggle visibility">${layers[key].visible?'◉':'○'}</button><div class="layer-name">${name}<small>${desc}</small></div><button data-layer="${key}" data-action="locked" aria-label="${layers[key].locked?'Unlock':'Lock'} ${name}" aria-pressed="${layers[key].locked}" title="${layers[key].locked?'Unlock':'Lock'} layer">${layers[key].locked?'▣':'◇'}</button></div>`).join('');selectTool(tool);}
$('layers').onclick=e=>{let b=e.target.closest('[data-layer]');if(!b)return;snapshot();layers[b.dataset.layer][b.dataset.action]=!layers[b.dataset.layer][b.dataset.action];renderLayers();refresh();persist();};
const shapes=[['island','Island'],['archipelago','Archipelago'],['continent','Continent'],['atoll','Atoll'],['blank','Open ocean'],['flat','Flat grass']];
$('shape-presets').innerHTML=shapes.map(([id,name])=>`<button type="button" data-shape="${id}" aria-pressed="${id===selectedShape}" class="${id===selectedShape?'selected':''}"><canvas width="80" height="80" aria-hidden="true"></canvas>${name}</button>`).join('');
function renderPresets(){document.querySelectorAll('[data-shape]').forEach(b=>{let c=b.querySelector('canvas'),cx=c.getContext('2d'),a=generate(80,+$('seed').value,{shape:b.dataset.shape,relief:+$('relief').value/100}),img=cx.createImageData(80,80);for(let i=0;i<a.length;i++){let h=a[i],v=h<62?[34,68,73]:h<67?[164,161,112]:h<115?[103,135,78]:h<160?[139,152,99]:[199,204,169];img.data.set([...v,255],i*4);}cx.putImageData(img,0,0);});}
$('shape-presets').onclick=e=>{let b=e.target.closest('[data-shape]');if(!b)return;selectedShape=b.dataset.shape;document.querySelectorAll('[data-shape]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',el===b);});};
$('seed').oninput=renderPresets;$('relief').oninput=()=>{$('reliefout').value=+$('relief').value<70?'Gentle':+$('relief').value>115?'Dramatic':'Natural';renderPresets();};$('reroll').onclick=()=>{$('seed').value=Math.floor(Math.random()*1000000);renderPresets();};
$('panel-toggle').onclick=()=>{let open=$('right-panel').classList.toggle('mobile-open');$('panel-toggle').setAttribute('aria-expanded',open);resize();};
$('opacity').oninput=()=>{$('opacityout').value=$('opacity').value+'%';};
$('export').onclick=()=>$('exportdialog').showModal();$('export-map').onclick=()=>{$('exportdialog').close();flushTexture();let c=document.createElement('canvas');c.width=c.height=1536;let cx=c.getContext('2d');cx.drawImage(off,0,0,1536,1536);cx.scale(1536/N,1536/N);if(layers.shapes.visible&&view!=='height')for(let s of drawings)drawShape(cx,s);if(layers.landmarks.visible&&view!=='height')for(let m of marks)drawLandmark(cx,m);c.toBlob(b=>{download(b,slug()+'-map.png');notify('Your map is ready to share.');});};

$('erase-target').onchange=()=>{eraseTarget=$('erase-target').value;$('erase-description').textContent={surface:'Reveal the natural terrain color. Elevation stays intact.',landmarks:'Remove whole landmarks touched by the brush. Undo to restore.',shapes:'Remove whole drawings touched by the brush. Undo to restore.'}[eraseTarget];selectTool('erase');};
function updateBrushUI(){
 document.querySelectorAll('[data-brush]').forEach(b=>{b.classList.toggle('selected',b.dataset.brush===brushPreset);b.setAttribute('aria-pressed',b.dataset.brush===brushPreset);});
 $('brush-description').textContent={soft:'Soft transitions for elevation and terrain paint.',coast:'Irregular footprint for rugged painted edges. Use Land to add or remove terrain.',hard:'Solid circular coverage with crisp edges. Useful for fills and clean boundaries.',grain:'Stippled color for textured soil, rocks and vegetation.'}[brushPreset];
}
function chooseBrush(preset){
 brushPreset=preset;
 selectTool(tool);
}
$('brush-presets').onclick=e=>{let b=e.target.closest('[data-brush]');if(b)chooseBrush(b.dataset.brush);};
function setMode(mode){
 if(down)end();orbitPointer=null;workspaceMode=mode;$('map').hidden=mode==='3d';mini.hidden=mode!=='3d';glCanvas.hidden=mode!=='3d'||!gpu;$('orbit-controls').hidden=mode!=='3d';$('brush').style.display='none';brushPosition=null;document.querySelector('.workspace').classList.toggle('in-3d',mode==='3d');
 for(let key of['2d','3d']){$('mode'+key).classList.toggle('active',mode===key);$('mode'+key).setAttribute('aria-pressed',mode===key);}
 $('toolhint').textContent=mode==='3d'?'3D editing · Right-drag orbit · Middle-drag pan':'2D map · Ready to create';sceneDirty=true;resize();
}
$('mode2d').onclick=()=>setMode('2d');$('mode3d').onclick=()=>setMode('3d');
mini.onpointerdown=e=>{
 if(e.button===2||e.altKey||orbitMode||e.button===1||tool==='pan'){if(down)end();mini.setPointerCapture(e.pointerId);orbitPointer={x:e.clientX,y:e.clientY,pan:e.button===1||(tool==='pan'&&e.button===0&&!e.altKey&&!orbitMode)};brushPosition=null;preview();return;}
 map.onpointerdown(e);
};
mini.onpointermove=e=>{
 if(orbitPointer){let dx=e.clientX-orbitPointer.x,dy=e.clientY-orbitPointer.y;if(orbitPointer.pan){camera.panX=(camera.panX||0)+dx;camera.panY=(camera.panY||0)+dy;}else{camera.yaw+=dx*.009;camera.pitch=Math.max(.18,Math.min(1.15,camera.pitch+dy*.006));}orbitPointer.x=e.clientX;orbitPointer.y=e.clientY;preview();return;}
 map.onpointermove(e);
};
mini.onpointerup=e=>{if(orbitPointer){orbitPointer=null;preview();}else end(e);};
mini.onpointercancel=()=>{orbitPointer=null;cancelStroke();};
mini.onpointerleave=()=>{if(!down&&!orbitPointer){brushPosition=null;preview();}};
mini.oncontextmenu=e=>e.preventDefault();
mini.addEventListener('wheel',e=>{e.preventDefault();if(down||orbitPointer)return;if(e.shiftKey)adjustBrush(brushDelta(e));else camera.zoom=Math.max(.5,Math.min(3,camera.zoom*(e.deltaY>0?.92:1.08)));preview();},{passive:false});
$('orbit-reset').onclick=()=>{camera={yaw:-.65,pitch:.65,zoom:1,panX:0,panY:0,size:N};preview();};
$('orbit-toggle').onclick=()=>{if(down)end();orbitMode=!orbitMode;$('orbit-toggle').setAttribute('aria-pressed',orbitMode);$('orbit-toggle').textContent=orbitMode?'Edit tools':'Orbit';brushPosition=null;preview();};
glCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();gpu=null;gpuFailed=true;glCanvas.hidden=true;sceneDirty=true;preview();});
glCanvas.addEventListener('webglcontextrestored',()=>{gpu=null;gpuFailed=false;sceneDirty=true;preview();});
initUI();renderLayers();renderPresets();
try{let saved=localStorage.getItem('worldpainter-project');if(saved)load(JSON.parse(saved))}catch{}selectTool(tool);historyUI();refresh();resize();
