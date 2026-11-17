import{generate,stroke}from'./terrain.mjs?v=1.3.2';
import{brushDelta,resizeBrush,normalizeProject,defaultLayers}from'./editor.mjs?v=1.3.2';
import{drawLandmark,createLandmarkAtlas}from'./landmarks.mjs?v=1.3.2';
import{MATERIALS,blendPaint,brushWeight,coastStroke,noise}from'./brushes.mjs?v=1.3.2';
import{makeShape,validShape,drawShape,drawProjectedShape}from'./shapes.mjs?v=1.3.2';
import{renderTerrain,projectTerrain,pickTerrain,sampleTerrain,createFrameScheduler}from'./terrain3d.mjs?v=1.3.2';
import{createGPUTerrain}from'./gpu-terrain.mjs?v=1.3.2';
const $=id=>document.getElementById(id),N=256,map=$('map'),ctx=map.getContext('2d'),mini=$('preview'),mc=mini.getContext('2d'),off=document.createElement('canvas');off.width=off.height=N;const oc=off.getContext('2d');let heights=generate(N,42),paint=new Uint8Array(N*N),tool='raise',material=1,view='terrain',sea=62,water=true,shade=true,contours=true,grid=false,zoom=1,pan={x:0,y:0},undo=[],redo=[],down=false,last=null,modified=false,rotation=0,saveTimer,marks=[],layers=defaultLayers(),stampType='tree',selectedShape='island',brushPosition=null,nameEditSnapshot=null,paintColors=new Uint8ClampedArray(N*N*3),paintAlpha=new Float32Array(N*N),drawings=[],drawingType='freehand',draft=null,drawStart=null,brushPreset='soft',workspaceMode='2d',camera={yaw:-.65,pitch:.65,zoom:1},orbitPointer=null,paintStroke=null,textureDirty=true,sceneDirty=true,gpu=null,gpuFailed=false,gpuFailureReason='',orbitMode=false,lastFrameTime=0,averageFps=0;
const materials=MATERIALS;
const glCanvas=$('terrain-gl'),combined=document.createElement('canvas'),composite=combined.getContext('2d');combined.width=combined.height=1024;
const landmarkAtlas=createLandmarkAtlas();
const tiny=document.createElement('canvas');tiny.width=tiny.height=N;const tinyCtx=tiny.getContext('2d');let fallbackPixels=null;
const grainNoise=Float32Array.from({length:N*N},(_,i)=>(Math.sin(i*78.233)*43758.5453)%1*4),pixels=oc.createImageData(N,N);
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
function transform(){let w=map.clientWidth,h=map.clientHeight;let scale=Math.min((w-70)/N,(h-135)/N)*zoom;return{scale,x:(w-N*scale)/2+pan.x,y:(h-N*scale)/2+pan.y-6}}
function draw(){if(workspaceMode==='3d'){sceneDirty=true;scheduleFrame();return;}let w=map.clientWidth,h=map.clientHeight;ctx.clearRect(0,0,w,h);let t=transform();ctx.save();ctx.shadowColor='#0005';ctx.shadowBlur=36;ctx.drawImage(off,t.x,t.y,N*t.scale,N*t.scale);ctx.restore();if(layers.shapes.visible&&view!=='height'){ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);ctx.beginPath();ctx.rect(0,0,N,N);ctx.clip();for(let shape of drawings)drawShape(ctx,shape);if(draft)drawShape(ctx,draft,true);ctx.restore();}if(layers.landmarks.visible&&view!=='height'){ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);for(let m of marks)drawLandmark(ctx,m);ctx.restore();}ctx.strokeStyle='#84988045';ctx.strokeRect(t.x,t.y,N*t.scale,N*t.scale);if(grid){ctx.strokeStyle='#dae5c62a';ctx.lineWidth=.5;for(let i=0;i<=N;i+=16){ctx.beginPath();ctx.moveTo(t.x+i*t.scale,t.y);ctx.lineTo(t.x+i*t.scale,t.y+N*t.scale);ctx.stroke();ctx.beginPath();ctx.moveTo(t.x,t.y+i*t.scale);ctx.lineTo(t.x+N*t.scale,t.y+i*t.scale);ctx.stroke()}}$('zoomtext').textContent=Math.round(zoom*100)+'%'}
function composeSurface(includeDrawings=true){
 composite.setTransform(1,0,0,1,0,0);composite.clearRect(0,0,1024,1024);composite.drawImage(off,0,0,1024,1024);composite.scale(4,4);
 if(includeDrawings&&layers.shapes.visible&&view!=='height'){for(let s of drawings)drawShape(composite,s);if(draft)drawShape(composite,draft,true);}
 if(grid){composite.strokeStyle='#e1ebd43d';composite.lineWidth=.25;composite.beginPath();for(let i=0;i<N;i+=16){composite.moveTo(i,0);composite.lineTo(i,N);composite.moveTo(0,i);composite.lineTo(N,i);}composite.stroke();}
}
function draw3DBrush(){
 if(!brushPosition?.hit||orbitPointer||['pan','draw'].includes(tool)||orbitMode)return;
 let w=mini.clientWidth,h=mini.clientHeight,r=+$('size').value/2;mc.beginPath();
 for(let i=0;i<=48;i++){let angle=i/48*Math.PI*2,x=Math.max(0,Math.min(255,brushPosition.x+Math.cos(angle)*r)),y=Math.max(0,Math.min(255,brushPosition.y+Math.sin(angle)*r)),p=projectTerrain(x,y,sampleTerrain(x,y,heights,sea,water)+.7,w,h,camera);if(i)mc.lineTo(p.x,p.y);else mc.moveTo(p.x,p.y);}
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
 else{renderTerrain(mc,w,h,heights,i=>[fallbackPixels[i*4],fallbackPixels[i*4+1],fallbackPixels[i*4+2]],sea,water,camera,orbitPointer?6:3);if(layers.shapes.visible&&view!=='height'){const project=(x,y)=>projectTerrain(x,y,sampleTerrain(x,y,heights,sea,water)+.2,w,h,camera);for(let shape of drawings)drawProjectedShape(mc,shape,project);if(draft)drawProjectedShape(mc,draft,project);}if(layers.landmarks.visible&&view!=='height')for(let m of marks){let p=projectTerrain(m.x,m.y,sampleTerrain(m.x,m.y,heights,sea,water),w,h,camera),scale=Math.max(.1,Math.min((w-50)/365,(h-100)/290))*camera.zoom;let size=m.size*64/44*scale,kind={tree:0,mountain:1,town:2}[m.type];mc.globalAlpha=m.opacity??1;mc.drawImage(landmarkAtlas,kind*64,0,64,64,p.x-size/2,p.y-size/2,size,size);mc.globalAlpha=1;}}
 draw3DBrush();
 let duration=performance.now()-started,delta=time-lastFrameTime;if(lastFrameTime&&delta>0&&delta<200&&(orbitPointer||down)){let fps=1000/delta;averageFps=averageFps?averageFps*.8+fps*.2:fps;}lastFrameTime=time;
 $('render-stats').textContent=(gpu?'GPU':'Canvas')+(averageFps?' · '+Math.round(averageFps)+' fps':'');$('render-stats').dataset.renderMs=duration.toFixed(2);$('render-stats').dataset.fps=averageFps.toFixed(1);$('render-stats').dataset.renderer=gpu?'webgl':'canvas';$('render-stats').dataset.fallbackReason=gpu?'':gpuFailureReason;$('render-stats').title=gpu?'WebGL rendering':'Canvas fallback: '+gpuFailureReason;
}
function preview(){scheduleFrame();}
function refresh(){textureDirty=true;sceneDirty=true;scheduleFrame();}
function resize(){let d=Math.min(2,devicePixelRatio||1);for(let c of[map,mini,glCanvas]){let width=Math.round((c===glCanvas?mini.clientWidth:c.clientWidth)*d),height=Math.round((c===glCanvas?mini.clientHeight:c.clientHeight)*d);if(c.width!==width||c.height!==height){c.width=width;c.height=height;}if(c!==glCanvas)c.getContext('2d').setTransform(d,0,0,d,0,0);}scheduleFrame();}new ResizeObserver(resize).observe(document.querySelector('.workspace'));
function state(){return{version:3,name:$('worldname').value,heights:Array.from(heights,v=>Math.round(v*1000)/1000),paint:Array.from(paint),paintColors:Array.from(paintColors),paintAlpha:Array.from(paintAlpha,v=>Math.round(v*10000)/10000),sea,water,shade,marks:marks.map(m=>({...m})),shapes:structuredClone(drawings),layers:structuredClone(layers)}}
function persist(){modified=true;$('save-status').textContent='Saving changes…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem('worldpainter-project',JSON.stringify(state()));modified=false;$('save-status').textContent='All changes saved locally'}catch{$('save-status').textContent='Save project to keep changes';notify('Local storage full — save your project to a file.')}},600)}
function snapshot(record=state()){undo.push(record);if(undo.length>35)undo.shift();redo=[];historyUI()}
function historyUI(){$('undo').disabled=!undo.length;$('redo').disabled=!redo.length}
function restoreHistory(from,to){if(draft){cancelStroke();return;}cancelStroke();if(!from.length)return;to.push(state());load(from.pop());refresh();historyUI();persist()}
function pointer(e){let canvas=workspaceMode==='3d'?mini:map,b=canvas.getBoundingClientRect(),sx=e.clientX-b.left,sy=e.clientY-b.top;
 if(workspaceMode==='3d'){let hit=pickTerrain(sx,sy,mini.clientWidth,mini.clientHeight,camera,heights,sea,water);return hit?{...hit,sx,sy,hit:true}:{x:NaN,y:NaN,sx,sy,hit:false};}
 let t=transform();return{x:(sx-t.x)/t.scale,y:(sy-t.y)/t.scale,sx,sy,hit:true};}
function activeLayer(){return layers[tool==='draw'?'shapes':tool==='stamp'?'landmarks':tool==='paint'?'surface':'elevation'];}
function opacity(){return +$('opacity').value/100;}
function placeMark(p,type,scatter=false){
 let alpha=opacity();if(!alpha||p.x<0||p.y<0||p.x>=N||p.y>=N||marks.length>=3000)return;
 let size=Math.max(3,Math.min(28,+$('size').value*(scatter?.12:.28)));
 if(water&&heights[Math.floor(p.y)*N+Math.floor(p.x)]<sea)return;
 if(marks.some(m=>Math.hypot(m.x-p.x,m.y-p.y)<size*.65))return;
 marks.push({type,x:p.x,y:p.y,size,opacity:alpha});
}
function apply(p,e){
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return;let layer=activeLayer();if(layer.locked||!layer.visible||!opacity())return;
 let r=+$('size').value/2,alpha=opacity();
 if(tool==='stamp'){
  if(e.shiftKey){marks=marks.filter(m=>Math.hypot(m.x-p.x,m.y-p.y)>r);return;}
  if(brushPreset==='forest'){
   let spacing=Math.max(3,r*.29),startX=Math.floor((p.x-r)/spacing),startY=Math.floor((p.y-r)/spacing);
   for(let gy=startY;gy<=(p.y+r)/spacing;gy++)for(let gx=startX;gx<=(p.x+r)/spacing;gx++){
    let x=(gx+.2+noise(gx,gy)*.6)*spacing,y=(gy+.2+noise(gy,gx)*.6)*spacing;
    if(Math.hypot(x-p.x,y-p.y)<r*.9&&noise(gx+4,gy+7)>.22)placeMark({x,y},'tree',true);
   }
  }else placeMark(p,stampType);
  return;
 }
 if(tool==='land'){coastStroke(heights,N,p.x,p.y,r,sea,alpha,e.shiftKey);return;}
 if(tool==='paint'){
  for(let y=Math.max(0,Math.floor(p.y-r));y<Math.min(N,p.y+r);y++)for(let x=Math.max(0,Math.floor(p.x-r));x<Math.min(N,p.x+r);x++){
   let weight=brushWeight(x,y,p.x,p.y,r,brushPreset)*alpha;if(!weight)continue;let i=y*N+x;
   if(paintStroke){if(weight<=paintStroke.coverage[i])continue;paintStroke.coverage[i]=weight;paintAlpha[i]=paintStroke.alpha[i];for(let k=0;k<3;k++)paintColors[i*3+k]=paintStroke.colors[i*3+k];}
   blendPaint(paintColors,paintAlpha,i,materials[material-1][2],weight,e.shiftKey);paint[i]=paintAlpha[i]<.001?0:(e.shiftKey?paint[i]:material);
  }
  return;
 }
 let active=tool;if(e.shiftKey){if(tool==='raise')active='lower';else if(tool==='lower')active='raise';}
 stroke(heights,N,p.x,p.y,r,+$('strength').value/100*3*alpha,active,+$('target').value);
}
function shapeStyle(){return{color:$('ink-color').value,width:+$('line-width').value,opacity:opacity(),filled:$('shape-fill').checked};}
function updateDraft(p,e){
 if(!draft)return;
 if(draft.type==='freehand'){let lastPoint=draft.points.at(-1);p={x:Math.max(0,Math.min(N-1,p.x)),y:Math.max(0,Math.min(N-1,p.y))};if(Math.hypot(p.x-lastPoint.x,p.y-lastPoint.y)>=.7&&draft.points.length<1000)draft.points.push(p);draft.x2=p.x;draft.y2=p.y;}
 else draft=makeShape(drawingType,drawStart,p,shapeStyle(),e.shiftKey,N);
 draw();
}
map.onpointerdown=e=>{
 if(e.button!==0&&e.button!==1)return;
 (workspaceMode==='3d'?mini:map).setPointerCapture(e.pointerId);down=true;last=pointer(e);if(workspaceMode==='3d'&&!last.hit){down=false;return;}
 if(tool==='pan'||e.button===1){last.pan=true;return;}
 let layer=activeLayer();if(layer.locked||!layer.visible){notify(layer.locked?'Unlock this layer to edit it.':'Show this layer to edit it.');down=false;return;}
 if(tool==='draw'){
  if(last.x<0||last.y<0||last.x>=N||last.y>=N||!opacity()){down=false;return;}
  drawStart={...last};draft=makeShape(drawingType,last,last,shapeStyle(),false,N);return;
 }
 if(opacity()){snapshot();if(tool==='paint')paintStroke={colors:paintColors.slice(),alpha:paintAlpha.slice(),coverage:new Float32Array(N*N)};apply(last,e);refresh();}
};
map.onpointermove=e=>{
 let p=pointer(e),t=transform();brushPosition=p;
 $('brush').style.cssText=`display:${workspaceMode==='3d'||['pan','draw'].includes(tool)?'none':'block'};left:${p.sx}px;top:${p.sy}px;width:${+$('size').value*t.scale}px;height:${+$('size').value*t.scale}px`;
 let x=Math.floor(p.x),y=Math.floor(p.y);if(x>=0&&y>=0&&x<N&&y<N){let i=y*N+x;$('coords').textContent=`X: ${x}   Z: ${y}`;$('heightstatus').textContent=`Height: ${Math.round(heights[i])}`;$('terrainstatus').textContent=heights[i]<sea&&water?'Ocean':paint[i]?materials[paint[i]-1][0]:'Grassland';}
 if(workspaceMode==='3d'){preview();if(!p.hit){last=p;return;}}
 if(down){
  if(last.pan){pan.x+=p.sx-last.sx;pan.y+=p.sy-last.sy;p.pan=true;draw();}
  else if(draft){updateDraft(p,e);}
  else if(tool!=='draw'&&tool!=='pan'){if(!last?.hit)last=p;let d=Math.hypot(p.x-last.x,p.y-last.y),steps=Math.max(1,Math.ceil(d/3));for(let j=1;j<=steps;j++)apply({x:last.x+(p.x-last.x)*j/steps,y:last.y+(p.y-last.y)*j/steps},e);refresh();}
  last=p;
 }
};
function end(e){
 if(draft){if(e){let p=pointer(e);if(p.hit)updateDraft(p,e);}let layer=layers.shapes;
  if(!layer.locked&&layer.visible&&draft.opacity>0&&validShape(draft,N)&&(draft.type==='freehand'?draft.points.some(p=>Math.hypot(p.x-draft.x1,p.y-draft.y1)>.5):Math.hypot(draft.x2-draft.x1,draft.y2-draft.y1)>.5)&&drawings.length<500&&drawings.reduce((n,s)=>n+s.points.length,0)+draft.points.length<=100000){snapshot();drawings.push(draft);persist();}
  draft=null;drawStart=null;draw();
 }else if(down&&tool!=='pan')persist();
 down=false;last=null;paintStroke=null;
}
function cancelStroke(){if(down&&!draft&&!last?.pan)persist();draft=null;drawStart=null;down=false;last=null;paintStroke=null;draw();}
map.onpointerup=end;map.onpointercancel=()=>{if(!draft&&down)persist();cancelStroke();};map.onpointerleave=()=>{brushPosition=null;$('brush').style.display='none';};
function changeZoom(z){zoom=Math.max(.4,Math.min(4,z));draw()}map.addEventListener('wheel',e=>{e.preventDefault();if(e.shiftKey){adjustBrush(brushDelta(e));return;}changeZoom(zoom*(e.deltaY>0?.9:1.1))},{passive:false});$('plus').onclick=()=>changeZoom(zoom*1.2);$('minus').onclick=()=>changeZoom(zoom/1.2);$('fit').onclick=()=>{zoom=1;pan={x:0,y:0};draw()};
function selectTool(t){
 if(down)end();orbitPointer=null;orbitMode=false;$('orbit-toggle').setAttribute('aria-pressed','false');$('orbit-toggle').textContent='Orbit';tool=t;if((brushPreset==='forest'&&t!=='stamp')||(brushPreset==='coast'&&t!=='land')||(brushPreset==='grain'&&t!=='paint'))brushPreset='soft';if(t==='land')brushPreset='coast';updateBrushUI();
 $('brush-controls').hidden=t==='pan';$('size-label').hidden=t==='draw';$('size-shortcuts').hidden=t==='draw';$('strength-label').hidden=!['raise','lower','smooth','flatten'].includes(t);$('target-label').hidden=t!=='flatten';
 $('stamp-settings').hidden=t!=='stamp';$('drawing-settings').hidden=t!=='draw';$('brush-settings').hidden=t==='draw'||t==='pan';
 $('palette').closest('.section').hidden=['stamp','draw','pan'].includes(t);
 document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('selected',b.dataset.tool===t));
 $('toolhint').textContent={raise:'Raise terrain',lower:'Lower terrain',smooth:'Smooth terrain',flatten:'Flatten to target height',paint:'Paint '+materials[material-1][0],pan:'Pan the map',land:'Shape coastline · Shift to remove land',draw:'Draw '+drawingType,stamp:'Place '+({tree:'trees',mountain:'mountains',town:'settlements'}[stampType])}[t];map.style.cursor=t==='pan'?'grab':'crosshair';
}
$('tools').onclick=e=>{let b=e.target.closest('[data-tool]');if(b)selectTool(b.dataset.tool)};$('palette').onclick=e=>{let b=e.target.closest('[data-material]');if(!b)return;material=+b.dataset.material;document.querySelectorAll('[data-material]').forEach(el=>el.classList.toggle('selected',el===b));selectTool('paint')};
for(let id of['size','strength','target'])$(id).oninput=()=>{$(id+'out').value=$(id).value+(id==='size'?' px':id==='strength'?'%':'')};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));refresh()});
$('grid').onclick=()=>{grid=!grid;$('grid').classList.toggle('active',grid);draw()};$('contours').onclick=()=>{contours=!contours;$('contours').classList.toggle('active',contours);refresh()};$('sea').onpointerdown=()=>snapshot();$('sea').onkeydown=e=>{if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key))snapshot()};$('sea').oninput=()=>{sea=+$('sea').value;$('seaout').value=sea;refresh();persist()};for(let id of['water','shade'])$(id).onclick=()=>{snapshot();if(id==='water')water=!water;else shade=!shade;let v=id==='water'?water:shade;$(id).classList.toggle('on',v);$(id).setAttribute('aria-pressed',v);refresh();persist()};$('undo').onclick=()=>restoreHistory(undo,redo);$('redo').onclick=()=>restoreHistory(redo,undo);
function download(blob,name){let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}function slug(){return $('worldname').value.replace(/[^a-z0-9 -]/gi,'').trim()||'world'}
$('save').onclick=()=>{download(new Blob([JSON.stringify(state())],{type:'application/json'}),slug()+'.world.json');persist();notify('Project saved — keep building.')};$('export-height').onclick=()=>{$('exportdialog').close();let c=document.createElement('canvas');c.width=c.height=N;let cx=c.getContext('2d'),im=cx.createImageData(N,N);for(let i=0;i<N*N;i++){let v=Math.round(heights[i]);im.data.set([v,v,v,255],i*4)}cx.putImageData(im,0,0);c.toBlob(b=>{download(b,slug()+'-heightmap.png');notify('256 × 256 heightmap exported.')})};
$('new').onclick=()=>{$('newdialog').returnValue='';$('newdialog').showModal();};$('newdialog').addEventListener('close',()=>{if($('newdialog').returnValue!=='generate')return;snapshot();heights=generate(N,+$('seed').value,{shape:selectedShape,relief:+$('relief').value/100});paint.fill(0);paintColors.fill(0);paintAlpha.fill(0);marks=[];drawings=[];layers=defaultLayers();sea=62;water=true;shade=true;load({...state(),name:$('newname').value||'Untitled world'});$('worldname').value=$('newname').value||'Untitled Island';$('infotitle').textContent=$('worldname').value;zoom=1;pan={x:0,y:0};refresh();persist();notify('Your new world is ready.')});$('help').onclick=()=>$('helpdialog').showModal();$('worldname').onfocus=()=>{nameEditSnapshot=state();};$('worldname').onblur=()=>{nameEditSnapshot=null;};$('worldname').oninput=()=>{if(nameEditSnapshot){snapshot(nameEditSnapshot);nameEditSnapshot=null;}$('infotitle').textContent=$('worldname').value;persist()};
function load(input){let s=normalizeProject(input,N);heights=Float32Array.from(s.heights);paint=Uint8Array.from(s.paint);paintColors=Uint8ClampedArray.from(s.paintColors);paintAlpha=Float32Array.from(s.paintAlpha);drawings=s.shapes;sea=s.sea;water=s.water;shade=s.shade;marks=s.marks;layers=s.layers;$('worldname').value=s.name;$('infotitle').textContent=s.name;$('sea').value=sea;$('seaout').value=sea;for(let id of['water','shade']){let v=id==='water'?water:shade;$(id).classList.toggle('on',v);$(id).setAttribute('aria-pressed',v);}renderLayers();}
$('open').onclick=()=>$('file').click();$('file').onchange=async()=>{let f=$('file').files[0];if(!f)return;try{if(f.size>12e6)throw Error('File too large (12 MB maximum)');if(f.name.endsWith('.json')){let s=normalizeProject(JSON.parse(await f.text()),N);snapshot();load(s)}else{let image=await createImageBitmap(f);snapshot();oc.clearRect(0,0,N,N);oc.drawImage(image,0,0,N,N);let d=oc.getImageData(0,0,N,N).data;for(let i=0;i<N*N;i++)heights[i]=d[i*4]*.2126+d[i*4+1]*.7152+d[i*4+2]*.0722;paint.fill(0);paintColors.fill(0);paintAlpha.fill(0);marks=[];drawings=[];image.close()}refresh();persist();notify('Imported successfully.')}catch(e){notify(e.message==='Invalid project'?'This project file is invalid.':e.message||'Could not import file.')}finally{$('file').value=''}};
document.onkeydown=e=>{if(e.target.matches('input,textarea,select,[contenteditable=true]')||document.querySelector('dialog[open]'))return;if(e.ctrlKey||e.metaKey){if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?restoreHistory(redo,undo):restoreHistory(undo,redo)}if(e.key.toLowerCase()==='s'){e.preventDefault();$('save').click()}return}if(e.key==='Escape'){cancelStroke();return;}let delta=brushDelta(e);if(delta){e.preventDefault();adjustBrush(delta);return;}let t={r:'raise',l:'lower',q:'smooth',f:'flatten',p:'paint',b:'paint',t:'stamp',h:'pan',d:'draw',m:'land'}[e.key.toLowerCase()];if(t)selectTool(t)};

function adjustBrush(delta){$('size').value=resizeBrush(+$('size').value,delta);$('sizeout').value=$('size').value+' px';if(brushPosition){let t=transform();$('brush').style.width=$('brush').style.height=(+$('size').value*t.scale)+'px';}if(workspaceMode==='3d')preview();}
$('stamp-settings').onclick=e=>{let b=e.target.closest('[data-stamp]');if(!b)return;if(brushPreset==='forest')brushPreset='soft';stampType=b.dataset.stamp;document.querySelectorAll('[data-stamp]').forEach(el=>el.classList.toggle('selected',el===b));selectTool('stamp');};
function renderLayers(){let names={shapes:['Drawings','Paths, borders & shapes'],landmarks:['Landmarks','Trees, mountains & settlements'],surface:['Surface','Terrain & biome paint'],elevation:['Relief','Sculpting, shading & contours']};$('layers').innerHTML=Object.entries(names).map(([key,[name,desc]])=>`<div class="layer-row ${layers[key].visible?'':'is-hidden'}"><button data-layer="${key}" data-action="visible" aria-label="${layers[key].visible?'Hide':'Show'} ${name}" aria-pressed="${layers[key].visible}" title="Toggle visibility">${layers[key].visible?'◉':'○'}</button><div class="layer-name">${name}<small>${desc}</small></div><button data-layer="${key}" data-action="locked" aria-label="${layers[key].locked?'Unlock':'Lock'} ${name}" aria-pressed="${layers[key].locked}" title="${layers[key].locked?'Unlock':'Lock'} layer">${layers[key].locked?'▣':'◇'}</button></div>`).join('');}
$('layers').onclick=e=>{let b=e.target.closest('[data-layer]');if(!b)return;snapshot();layers[b.dataset.layer][b.dataset.action]=!layers[b.dataset.layer][b.dataset.action];renderLayers();refresh();persist();};
const shapes=[['island','Island'],['archipelago','Archipelago'],['continent','Continent'],['atoll','Atoll'],['blank','Open ocean']];
$('shape-presets').innerHTML=shapes.map(([id,name])=>`<button type="button" data-shape="${id}" aria-pressed="${id===selectedShape}" class="${id===selectedShape?'selected':''}"><canvas width="80" height="80" aria-hidden="true"></canvas>${name}</button>`).join('');
function renderPresets(){document.querySelectorAll('[data-shape]').forEach(b=>{let c=b.querySelector('canvas'),cx=c.getContext('2d'),a=generate(80,+$('seed').value,{shape:b.dataset.shape,relief:+$('relief').value/100}),img=cx.createImageData(80,80);for(let i=0;i<a.length;i++){let h=a[i],v=h<62?[34,68,73]:h<67?[164,161,112]:h<115?[103,135,78]:h<160?[139,152,99]:[199,204,169];img.data.set([...v,255],i*4);}cx.putImageData(img,0,0);});}
$('shape-presets').onclick=e=>{let b=e.target.closest('[data-shape]');if(!b)return;selectedShape=b.dataset.shape;document.querySelectorAll('[data-shape]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',el===b);});};
$('seed').oninput=renderPresets;$('relief').oninput=()=>{$('reliefout').value=+$('relief').value<70?'Gentle':+$('relief').value>115?'Dramatic':'Natural';renderPresets();};$('reroll').onclick=()=>{$('seed').value=Math.floor(Math.random()*1000000);renderPresets();};
$('panel-toggle').onclick=()=>{let open=$('right-panel').classList.toggle('mobile-open');$('panel-toggle').setAttribute('aria-expanded',open);resize();};
$('opacity').oninput=()=>{$('opacityout').value=$('opacity').value+'%';};$('line-width').oninput=()=>{$('line-widthout').value=$('line-width').value+' px';};
$('export').onclick=()=>$('exportdialog').showModal();$('export-map').onclick=()=>{$('exportdialog').close();flushTexture();let c=document.createElement('canvas');c.width=c.height=1536;let cx=c.getContext('2d');cx.drawImage(off,0,0,1536,1536);cx.scale(6,6);if(layers.shapes.visible&&view!=='height')for(let s of drawings)drawShape(cx,s);if(layers.landmarks.visible&&view!=='height')for(let m of marks)drawLandmark(cx,m);c.toBlob(b=>{download(b,slug()+'-map.png');notify('Your map is ready to share.');});};

$('drawing-settings').onclick=e=>{let b=e.target.closest('[data-draw]');if(!b)return;drawingType=b.dataset.draw;document.querySelectorAll('[data-draw]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',el===b);});selectTool('draw');};
function updateBrushUI(){
 document.querySelectorAll('[data-brush]').forEach(b=>{b.classList.toggle('selected',b.dataset.brush===brushPreset);b.setAttribute('aria-pressed',b.dataset.brush===brushPreset);});
 $('brush-description').textContent={soft:'Soft transitions for elevation and terrain paint.',coast:'Rugged edges for land and inlets. Shift removes land.',forest:'Scatter varied trees across dry land. Shift erases.',grain:'Stippled color for textured soil, rocks and vegetation.'}[brushPreset];
}
function chooseBrush(preset){
 brushPreset=preset;
 if(preset==='coast')selectTool('land');else if(preset==='forest'){stampType='tree';document.querySelectorAll('[data-stamp]').forEach(b=>b.classList.toggle('selected',b.dataset.stamp==='tree'));selectTool('stamp');}else if(preset==='grain')selectTool('paint');else if(['land','stamp'].includes(tool))selectTool('raise');
 updateBrushUI();
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
$('orbit-reset').onclick=()=>{camera={yaw:-.65,pitch:.65,zoom:1,panX:0,panY:0};preview();};
$('orbit-toggle').onclick=()=>{if(down)end();orbitMode=!orbitMode;$('orbit-toggle').setAttribute('aria-pressed',orbitMode);$('orbit-toggle').textContent=orbitMode?'Edit tools':'Orbit';brushPosition=null;preview();};
glCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();gpu=null;gpuFailed=true;glCanvas.hidden=true;sceneDirty=true;preview();});
glCanvas.addEventListener('webglcontextrestored',()=>{gpu=null;gpuFailed=false;sceneDirty=true;preview();});
renderLayers();renderPresets();
try{let saved=localStorage.getItem('worldpainter-project');if(saved)load(JSON.parse(saved))}catch{}selectTool(tool);historyUI();refresh();resize();
