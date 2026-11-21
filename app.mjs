import{wandDab,erodeStep,settleSediment,drainToSea,feedTrail,feedSprings,dryArea,addSpring,meanderPoint,WAND_DEFAULTS}from'./river-wand.mjs?v=2.11.0';
import {createCanvasRaster} from './raster-cache.mjs?v=2.11.0';
import {createMapDetail, packTerrainDetail} from './terrain-detail.mjs?v=2.11.0';
import {startWalk,moveWalk} from './walk.mjs?v=2.11.0';
import {createBasinFill, createPouredWater,MAX_WATER_DROPS} from './water-dropper.mjs?v=2.11.0';
import{EARTHEN_MATERIALS,renderEarthen}from'./earthen.mjs?v=2.11.0';
import{encodeMaterialCoverage,decodeMaterialCoverage,applyMaterialCoverage}from'./material-paint.mjs?v=2.11.0';
import{forestStroke,buildWoodland,renderWoodland,woodlandSurface,createForestHabitatCache}from'./forests.mjs?v=2.11.0';
import{buildLivingScene,createLivingLoop,drawLiving}from'./living.mjs?v=2.11.0';
import{makeRoute,applyRoute,riverField,routeTouches,waterSurface,routeWork,PROJECT_WORK_LIMIT,routeRadius,routeFractions,reflowRivers}from'./routes.mjs?v=2.11.0';
import{generate,stroke,heightStroke,fitHeightRange,DEFAULT_FLOOR,DEFAULT_CEILING,FLOOR_MAX,CEILING_MIN,MIN_RANGE}from'./terrain.mjs?v=2.11.0';
import{brushDelta,resizeBrush,normalizeProject,defaultLayers,isWorldSize}from'./editor.mjs?v=2.11.0';
import{drawLandmark,createLandmarkAtlas,ATLAS_TYPES}from'./landmarks.mjs?v=2.11.0';
import{MATERIALS,blendPaint,brushWeight,coastStroke}from'./brushes.mjs?v=2.11.0';
import{drawShape,drawProjectedShape}from'./shapes.mjs?v=2.11.0';
import{renderTerrain,projectTerrain,pickTerrain,sampleTerrain,terrainScale,verticalScale,createFrameScheduler}from'./terrain3d.mjs?v=2.11.0';
import{initUI}from'./ui.mjs?v=2.11.0';
import{toolIcon}from'./icons.mjs?v=2.11.0';
import{touchesShape}from'./eraser.mjs?v=2.11.0';
import {createReactiveWater, writeOceanSurface} from './reactive-water.mjs?v=2.11.0';
import{createGPUTerrain}from'./gpu-terrain.mjs?v=2.11.0';
let N=256;const $=id=>document.getElementById(id),map=$('map'),ctx=map.getContext('2d'),mini=$('preview'),mc=mini.getContext('2d'),off=document.createElement('canvas');off.width=off.height=N;const oc=off.getContext('2d');let heights=fitHeightRange(generate(N,42)),paint=new Uint8Array(N*N),tool='raise',material=1,view='terrain',sea=62,water=true,shade=true,contours=true,grid=false,zoom=1,pan={x:0,y:0},undo=[],redo=[],down=false,last=null,modified=false,rotation=0,saveTimer,marks=[],layers=defaultLayers(),selectedShape='island',brushPosition=null,nameEditSnapshot=null,paintColors=new Uint8ClampedArray(N*N*3),paintAlpha=new Float32Array(N*N),drawings=[],brushPreset='soft',workspaceMode='2d',camera={yaw:-.65,pitch:.65,zoom:1},orbitPointer=null,paintStroke=null,textureDirty=true,sceneDirty=true,gpu=null,gpuFailed=false,gpuFailureReason='',orbitMode=false,lastFrameTime=0,averageFps=0,eraseTarget='surface',routes=[],routeDraft=null,routeHover=null,riverWater=new Float32Array(N*N).fill(-1),surfaceHeights=heights,riverWaterDirty=true;
document.querySelectorAll('[data-tool]').forEach(button=>{button.querySelector('b').outerHTML=toolIcon(button.dataset.tool);button.title={path:'Place a path (J)',river:'Carve a river (V)',land:'Build a coast · Shift cuts channels from the ocean (C)',raise:'Raise terrain (R)',lower:'Lower terrain (L)',smooth:'Smooth terrain (Q)',flatten:'Flatten terrain (F)',paint:'Paint surface (B / P)',pan:'Pan the map (H)'}[button.dataset.tool];button.setAttribute('aria-label',button.title);});
$('rail-settings').innerHTML=toolIcon('settings');
let surfaceMaterials=new Uint8Array(N*N*8),forest=new Float32Array(N*N),forestTrees=[],woodland=null,surfaceDirty=true;const forestHabitat=createForestHabitatCache();
let walk=null,walkRequested=false,walkReturnMode='2d',walkLocked=false,walkTime=null;
const walkKeys=new Set();
const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','ShiftLeft','ShiftRight']);
const walking=()=>!!walk||walkRequested;
let spacePan=false,detailMask=null;
let surfaceBounds=null,uploadedSurfaceLayout,rendererOceanReady=false;
const oceanMap = document.createElement('canvas'), oceanContext = oceanMap.getContext('2d');
let ocean = createReactiveWater(N), oceanImage, oceanDirty = true, oceanLastFrame = null;
let waterDrops=[], basinFill=createBasinFill(N), dropperEnabled=false, basinMode=false, authoredRiverWater;
const droppingWater=()=>tool==='river'&&dropperEnabled;
const fillingBasin=()=>tool==='river'&&basinMode;
const waterTool=()=>droppingWater()||fillingBasin();
let poured=createPouredWater(N), hasPouredWater=false, pourActive=false, pouring=false, lastFlowFrame=null, terrainEdited=false;

let renderedDepth=new Float32Array(0),lastWaterRedraw=0;
// A river fed by a spring never stops moving, but once it settles only a few
// cells (the spring itself, thin edges) change. Redraw at once for real
// changes; otherwise refresh slow changes, like a filling lake, every 1.5 s.
function visibleWaterChanged(time=performance.now()){const d=poured.depth;if(renderedDepth.length!==d.length){renderedDepth=Float32Array.from(d);lastWaterRedraw=time;return true;}
 let count=0;for(let i=0;i<d.length;i++){const a=d[i],b=renderedDepth[i];if((a>.01)!==(b>.01)||Math.abs(a-b)>.15)count++;}
 if(count>24||(count>0&&time-lastWaterRedraw>1500)){renderedDepth.set(d);lastWaterRedraw=time;return true;}return false;}
function updatePouredWater(time){
 if(document.hidden||(!pourActive&&!pouring)){lastFlowFrame=null;return;}
 if(lastFlowFrame===null)lastFlowFrame=time;
 if(time-lastFlowFrame>=90){
  lastFlowFrame=time;
  if(pouring&&last?.hit&&layers.rivers.visible&&!layers.rivers.locked)addPour(last);
  const wasActive=pourActive;
  let moved=false;
  if(springs.length){feedSprings(poured.depth,springs);moved=true;}
  if(wandStroke&&down&&!wandStroke.drying)feedTrail(poured.depth,wandStroke.trail,+$('wand-water').value);
  for(let step=0;step<3;step++){moved=poured.step(heights)||moved;
   if(wandStroke&&down&&erodeStep(heights,poured.depth,wandStroke.sediment,N,{floor:heightFloor,sea,ocean:ocean.coverage})){moved=true;terrainEdited=true;}
   if(drainToSea(poured.depth,heights,N,{sea,ocean:ocean.coverage}))moved=true;}
  pourActive=moved||!!wandStroke||springs.length>0;
  if(terrainEdited){terrainEdited=false;refresh();}
  // Redraw only when the water changes visibly. A settled river keeps flowing
  // without re-rendering the terrain every tick.
  if(moved&&(wandStroke||visibleWaterChanged(time)))surfaceDirty=textureDirty=sceneDirty=true;
  else if(wasActive&&!pouring)persist();
 }
 if(pourActive||pouring||wandStroke)requestFrame();
}

let baseSurface = heights, oceanVisible = false, visibleOceanSurface, oceanOpaque = new Uint8Array(N*N);
const oceanSurface = () => water && view !== 'height';
const animateOcean = () => oceanSurface() && view === 'terrain' && livingPrefs.enabled &&
  livingPrefs.waterMotion && !motionQuery?.matches;
function updateOceanGeometry(rgba) {
 if (!oceanSurface() || !ocean.coverage.some(Boolean)) {
  surfaceHeights = baseSurface;
  return false;
 }
 if (visibleOceanSurface?.length !== heights.length) visibleOceanSurface = new Float32Array(heights.length);
 surfaceHeights = visibleOceanSurface;
 writeOceanSurface(heights, baseSurface, sea, ocean.coverage, rgba, surfaceHeights);
 return true;
}
function updateOcean(time) {
 if (ocean.active && !animateOcean()) {
  ocean.settle();
  oceanDirty = true;
 }
 if (!ocean.active || document.hidden) oceanLastFrame = null;
 else {
  if (oceanLastFrame === null) oceanLastFrame = time - 1000 / 30;
  if (time - oceanLastFrame >= 32) {
   oceanDirty = ocean.advance((time - oceanLastFrame) / 1000) || oceanDirty;
   oceanLastFrame = time;
  }
  if (ocean.active) requestFrame();
 }
 if (!oceanDirty) return false;
 oceanDirty = false;
 if (!oceanImage || oceanMap.width !== N) {
  oceanMap.width = oceanMap.height = N;
  oceanImage = oceanContext.createImageData(N, N);
 }
 oceanVisible = updateOceanGeometry(oceanImage.data);
 if (oceanVisible) oceanContext.putImageData(oceanImage, 0, 0);
 return true;
}
let detailPixels, mapDetail, mapDetailCanvas, mapDetailFailed=false;
function drawMapDetail(t,w,h){
 if(view!=='terrain'||t.scale<=3||!detailPixels||!w||!h||mapDetailFailed)return;
 if(!mapDetail){
  mapDetailCanvas=document.createElement('canvas');
  try{mapDetail=createMapDetail(mapDetailCanvas);}catch{}
  if(!mapDetail){mapDetailFailed=true;return;}
  mapDetailCanvas.addEventListener('webglcontextlost',()=>{mapDetailFailed=true;});
 }
 mapDetail.render(detailPixels,N,t,w,h,map.width,map.height,shade&&layers.elevation.visible);
 ctx.drawImage(mapDetailCanvas,0,0,w,h);
}
const groundMap=document.createElement('canvas'),groundContext=groundMap.getContext('2d');groundMap.width=groundMap.height=N;
const forestMap=document.createElement('canvas');forestMap.width=forestMap.height=1024;const forestContext=forestMap.getContext('2d');
let livingLoop=null,livingScene=null,livingPrefs={enabled:true,clouds:true,waterMotion:true,vegetationMotion:true};const livingCanvas=$('living-overlay'),livingContext=livingCanvas.getContext('2d'),motionQuery=document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
try{let saved=JSON.parse(localStorage.getItem('landwright-living'));for(let k of Object.keys(livingPrefs))if(typeof saved?.[k]==='boolean')livingPrefs[k]=saved[k];}catch{}
const materials=MATERIALS;
const glCanvas=$('terrain-gl'),combined=document.createElement('canvas'),composite=combined.getContext('2d');combined.width=combined.height=1024;
const groundRasterCache=createCanvasRaster(groundMap,groundContext);
const forestRasterCache=createCanvasRaster(forestMap,forestContext);

function recordRaster(cache,frame){
 cache.write(frame);
 const {x0,y0,x1,y1}=frame.bounds;
 if(x0===x1||y0===y1)return;
 const dirty=surfaceBounds;
 surfaceBounds=dirty?{
  x0:Math.min(x0,dirty.x0),y0:Math.min(y0,dirty.y0),
  x1:Math.max(x1,dirty.x1),y1:Math.max(y1,dirty.y1)
 }:frame.bounds;
}
const landmarkAtlas=createLandmarkAtlas();
const tiny=document.createElement('canvas');tiny.width=tiny.height=N;const tinyCtx=tiny.getContext('2d');let fallbackPixels=null;
let grainNoise=Float32Array.from({length:N*N},(_,i)=>(Math.sin(i*78.233)*43758.5453)%1*4),pixels=oc.createImageData(N,N);
let frameRequested=false;
const requestFrame=createFrameScheduler(renderFrame);
function scheduleFrame(){frameRequested=true;requestFrame();}

const materialFamilies=[...new Set(EARTHEN_MATERIALS.map(m=>m.family))];
$('palette').innerHTML=materialFamilies.map(family=>`<div class="material-family" role="group" aria-label="${family}"><div class="material-family-title">${family}</div><div class="family-materials">${EARTHEN_MATERIALS.filter(m=>m.family===family).map(m=>`<button data-material="${m.id}" class="${m.id===1?'selected':''}" aria-pressed="${m.id===1}" title="Paint ${m.name} · automatic terrain texture"><span class="swatch" style="--c:${m.hex}"></span><span>${m.name}</span></button>`).join('')}</div></div>`).join('');
$('forest-paint').innerHTML='<div class="material-family-title">WOODLAND · DENSITY LAYER</div><button data-material="4" aria-pressed="false" title="Paint Forest density"><span class="swatch" style="--c:#355e43"></span><span>Forest</span><small>Paint trees, not ground</small></button>';

function notify(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>$('toast').classList.remove('show'),2400)}
function color(i){
 let h=heights[i],c;
 if(view==='height')return[h,h,h];
 if(water&&riverWater[i]>h+.01){let depth=Math.max(0,riverWater[i]-h);return[43,Math.max(75,116-depth*2),Math.max(91,139-depth*2)];}
 if(h<sea+4)c=[175,166,116];else if(h>180)c=[216,216,195];else if(h>145)c=[140,145,116];else if(h>110)c=[108,132,84];else c=[93,126,73];
 if(view==='biome')c=h>160?[167,183,185]:h>120?[105,145,106]:[114,167,89];
 if(layers.surface.visible&&paintAlpha[i]){let a=paintAlpha[i];c=c.map((v,k)=>v*(1-a)+paintColors[i*3+k]*a);}
 if(view==='biome')return c;
 let x=i%N,y=Math.floor(i/N),s=1;if(shade&&layers.elevation.visible){let dx=heights[y*N+Math.min(N-1,x+1)]-heights[y*N+Math.max(0,x-1)],dy=heights[Math.min(N-1,y+1)*N+x]-heights[Math.max(0,y-1)*N+x];s=Math.max(.47,Math.min(1.4,1+(dx+dy)*.055));}
 let grain=grainNoise[i];return c.map(v=>Math.max(0,Math.min(255,v*s+grain)));
}
function texture(){let img=pixels;for(let i=0;i<N*N;i++){
 // Paint exposed ground before its water starts draining or reaches full opacity.
 oceanOpaque[i]=ocean.connected[i]&&ocean.coverage[i]===1?1:0;
 let c=color(i);if(contours&&layers.elevation.visible&&!(water&&riverWater[i]>heights[i])&&view!=='biome'&&heights[i]>sea&&i>=N&&Math.floor(heights[i]/10)!==Math.floor(heights[i-N]/10))c=c.map(v=>v*.78);let j=i*4;img.data[j]=c[0];img.data[j+1]=c[1];img.data[j+2]=c[2];img.data[j+3]=255;}let raw=forestHabitat.get(routes,N).riverWater,rendered=renderEarthen({n:N,resolution:view==='terrain'?N*4:N,cache:groundRasterCache,heights,sea,rawRiverWater:raw,riverWater,water,paintAlpha,weights:surfaceMaterials,baseColors:img.data,surfaceVisible:layers.surface.visible,shade,elevationVisible:layers.elevation.visible,view,oceanOpaque});recordRaster(groundRasterCache,rendered);}
// Picking needs current derived heights, not a synchronous high-resolution raster.
function updateSurface(){if(!surfaceDirty&&!riverWaterDirty)return;if(riverWaterDirty){authoredRiverWater=riverField(layers.rivers.visible?routes:[],N);riverWaterDirty=false;}
 riverWater=authoredRiverWater;
 if(layers.rivers.visible&&(waterDrops.length||hasPouredWater)){
  riverWater=authoredRiverWater.slice();
  for(const {cell,level} of waterDrops)basinFill(heights,cell,level,riverWater);
  if(hasPouredWater)for(let i=0;i<heights.length;i++)if(poured.depth[i]>.01){
   riverWater[i]=Math.max(riverWater[i],heights[i]+poured.depth[i]);
  }
 }
 baseSurface=waterSurface(heights,riverWater,oceanSurface());let habitat=forestHabitat.get(routes,N);woodland=buildWoodland({n:N,heights,forest,sea,riverWater:(waterDrops.length||hasPouredWater)&&layers.rivers.visible?riverWater:habitat.riverWater,paths:habitat.paths,shade:shade&&layers.elevation.visible});forestTrees=woodland.accents;if(visibleForest())baseSurface=woodlandSurface(baseSurface,woodland);ocean.setTerrain(heights,sea,water);oceanDirty=true;detailMask=view==='terrain'?new Float32Array(N*N).fill(1):visibleForest()?woodland.coverage:new Float32Array(N*N);surfaceDirty=false;}
function flushTexture(){if(textureDirty){updateSurface();recordRaster(forestRasterCache,renderWoodland(woodland,N*4,forestRasterCache));texture();
 detailPixels=view==='terrain'?packTerrainDetail(heights,visibleForest()?woodland.coverage:null,riverWater,water):null;
 livingScene=buildLivingScene({n:N,heights,riverWater,sea,water,view,oceanCoverage:ocean.coverage,oceanTarget:ocean.connected,routes,riversVisible:layers.rivers.visible,trees:layers.forests.visible?forestTrees:[]});textureDirty=false;}}
function visibleForest(){return layers.forests.visible&&view!=='height';}
function sceneMarks(){return view==='height'||!layers.landmarks.visible?[]:marks.slice();}
function transform(){let w=map.clientWidth,h=map.clientHeight;let scale=Math.max(.05,Math.min((w-70)/N,(h-135)/N))*zoom;return{scale,x:(w-N*scale)/2+pan.x,y:(h-N*scale)/2+pan.y-6}}
function draw(){syncLiving();if(workspaceMode==='3d'){sceneDirty=true;scheduleFrame();return;}let w=map.clientWidth,h=map.clientHeight;ctx.clearRect(0,0,w,h);let t=transform();ctx.save();ctx.shadowColor='#0005';ctx.shadowBlur=36;ctx.drawImage(groundMap,t.x,t.y,N*t.scale,N*t.scale);ctx.restore();if(visibleForest())ctx.drawImage(forestMap,t.x,t.y,N*t.scale,N*t.scale);drawMapDetail(t,w,h);if(oceanVisible)ctx.drawImage(oceanMap,t.x,t.y,N*t.scale,N*t.scale);if(layers.shapes.visible&&view!=='height'){ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);ctx.beginPath();ctx.rect(0,0,N,N);ctx.clip();for(let shape of drawings)drawShape(ctx,shape);ctx.restore();}if(layers.landmarks.visible&&view!=='height'){ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);for(let m of marks)drawLandmark(ctx,m);ctx.restore();}ctx.strokeStyle='#84988045';ctx.strokeRect(t.x,t.y,N*t.scale,N*t.scale);if(grid){ctx.strokeStyle='#dae5c62a';ctx.lineWidth=.5;for(let i=0;i<=N;i+=16){ctx.beginPath();ctx.moveTo(t.x+i*t.scale,t.y);ctx.lineTo(t.x+i*t.scale,t.y+N*t.scale);ctx.stroke();ctx.beginPath();ctx.moveTo(t.x,t.y+i*t.scale);ctx.lineTo(t.x+N*t.scale,t.y+i*t.scale);ctx.stroke()}}drawRoutePreview(ctx,p=>({x:t.x+p.x*t.scale,y:t.y+p.y*t.scale}));$('zoomtext').textContent=Math.round(zoom*100)+'%'}
function composeSurface(canvasFallback=false){
 const resolution=Math.max(1024,N*4);
 if(combined.width!==resolution)combined.width=combined.height=resolution;
 composite.setTransform(1,0,0,1,0,0);
 composite.clearRect(0,0,resolution,resolution);
 composite.drawImage(groundMap,0,0,resolution,resolution);
 if(canvasFallback&&oceanVisible)composite.drawImage(oceanMap,0,0,resolution,resolution);
 if(visibleForest())composite.drawImage(forestMap,0,0,resolution,resolution);
 if(canvasFallback){
  composite.scale(resolution/N,resolution/N);
  drawTerrainGrid(composite);
 }
}
let surfacePatch;
function surfaceUpload(){
 const resolution=Math.max(1024,N*4),forestVisible=visibleForest();
 const layout=[resolution,groundMap.width,forestMap.width,forestVisible].join('/');
 const bounds=surfaceBounds;
 surfaceBounds=null;
 if(uploadedSurfaceLayout!==layout||bounds&&(groundMap.width!==resolution||
     forestVisible&&forestMap.width!==resolution)){
  uploadedSurfaceLayout=layout;
  composeSurface();
  return {image:combined};
 }
 if(!bounds)return null;
 const {x0,y0,x1,y1}=bounds,width=x1-x0,height=y1-y0;
 if(!surfacePatch)surfacePatch=document.createElement('canvas');
 if(surfacePatch.width!==width||surfacePatch.height!==height){
  surfacePatch.width=width;
  surfacePatch.height=height;
 }
 const context=surfacePatch.getContext('2d');
 // Ground is opaque. Copy the same texels used by a full composite.
 context.drawImage(groundMap,x0,y0,width,height,0,0,width,height);
 if(forestVisible)context.drawImage(forestMap,x0,y0,width,height,0,0,width,height);
 return {image:surfacePatch,x:x0,y:y0};
}
function drawTerrainGrid(context){
 if(!grid)return;
 context.strokeStyle='#e1ebd43d';context.lineWidth=.25;context.beginPath();
 for(let i=0;i<=N;i+=16){context.moveTo(i,0);context.lineTo(i,N);context.moveTo(0,i);context.lineTo(N,i);}
 context.stroke();
}
let decals;
function terrainDecals(){
 const showDrawings=layers.shapes.visible&&view!=='height'&&drawings.length;
 if(!showDrawings&&!grid)return null;
 if(!decals){decals=document.createElement('canvas');decals.width=decals.height=1024;}
 const context=decals.getContext('2d');
 context.setTransform(1,0,0,1,0,0);
 context.clearRect(0,0,1024,1024);
 context.scale(1024/N,1024/N);
 if(showDrawings)for(let shape of drawings)drawShape(context,shape);
 drawTerrainGrid(context);
 return decals;
}
function draw3DBrush(){
 if(!brushPosition?.hit||spacePan||orbitPointer||(tool==='pan'||isRouteTool())||orbitMode)return;
 let w=mini.clientWidth,h=mini.clientHeight,r=+$('size').value/2;mc.beginPath();
 for(let i=0;i<=48;i++){let angle=i/48*Math.PI*2,x=Math.max(0,Math.min(N-1,brushPosition.x+Math.cos(angle)*r)),y=Math.max(0,Math.min(N-1,brushPosition.y+Math.sin(angle)*r)),p=projectTerrain(x,y,sampleTerrain(x,y,surfaceHeights,sea,false)+.7,w,h,camera);if(i)mc.lineTo(p.x,p.y);else mc.moveTo(p.x,p.y);}
 mc.closePath();mc.fillStyle='#cfe9a512';mc.strokeStyle='#e1f3bdcc';mc.lineWidth=1;mc.fill();mc.stroke();
}
function renderFrame(time){
 const requested=frameRequested;frameRequested=false;
 updatePouredWater(time);
 const changedScene=textureDirty||(workspaceMode==='3d'&&(sceneDirty||surfaceBounds!==null));
 flushTexture();
 const changedOcean=updateOcean(time);
 if(!requested&&!changedOcean&&!changedScene)return;
 syncLiving();
 if(workspaceMode!=='3d'){draw();return;}
 let started=performance.now(),w=mini.clientWidth,h=mini.clientHeight;if(!w||!h)return;
 if(!gpu&&!gpuFailed){try{gpu=createGPUTerrain(glCanvas);if(!gpu){gpuFailed=true;gpuFailureReason='WebGL context unavailable';}}catch(error){gpuFailed=true;gpuFailureReason=error.message;}}
 const renderer=gpu?.supportsSize(N)?gpu:null;
 if(walkRequested){
  walkRequested=false;
  if(renderer)walk=startWalk(heights,surfaceHeights);
  else{exitWalk();notify('Walk needs WebGL terrain rendering.');return;}
 }
 if(walk&&!renderer){exitWalk();return;}
 if(walk)updateWalk(time);
 const fallbackReason=gpu?'32-bit WebGL indices unavailable':gpuFailureReason;
 glCanvas.hidden=!renderer;
 if(changedScene||changedOcean){
  if(renderer){
   if(changedScene){
    renderer.updateDecals(terrainDecals());
    renderer.updateDetail(N,detailPixels);
   }
   renderer.update(surfaceHeights,changedScene?surfaceUpload():null,sceneMarks());
   if(changedOcean||!rendererOceanReady){renderer.updateOcean(N,oceanVisible?oceanImage.data:null);rendererOceanReady=true;}
  }else{
   composeSurface(true);
   surfaceBounds=null;uploadedSurfaceLayout=undefined;
   tinyCtx.clearRect(0,0,N,N);
   tinyCtx.drawImage(combined,0,0,N,N);
   fallbackPixels=tinyCtx.getImageData(0,0,N,N).data;
  }
  sceneDirty=false;
 }
 mc.clearRect(0,0,w,h);
 if(renderer)renderer.draw(w,h,camera,shade&&layers.elevation.visible,walk);
 else{renderTerrain(mc,w,h,surfaceHeights,i=>[fallbackPixels[i*4],fallbackPixels[i*4+1],fallbackPixels[i*4+2]],sea,false,camera,orbitPointer?6:3,orbitPointer||view!=='terrain'&&!visibleForest()?null:{image:combined,mask:detailMask});if(layers.shapes.visible&&view!=='height'){const project=(x,y)=>projectTerrain(x,y,sampleTerrain(x,y,surfaceHeights,sea,false)+.2,w,h,camera);for(let shape of drawings)drawProjectedShape(mc,shape,project);}for(let m of sceneMarks().sort((a,b)=>{let depth=m=>((m.x-N/2)*Math.sin(camera.yaw)+(m.y-N/2)*Math.cos(camera.yaw))*Math.cos(camera.pitch)+(sampleTerrain(m.x,m.y,surfaceHeights,sea,false)-62)*verticalScale(N)*Math.sin(camera.pitch);return depth(a)-depth(b);})){let p=projectTerrain(m.x,m.y,sampleTerrain(m.x,m.y,surfaceHeights,sea,false),w,h,camera),scale=terrainScale(w,h,camera);let size=m.size*64/44*scale,kind=ATLAS_TYPES.indexOf(m.type);mc.globalAlpha=m.opacity??1;mc.drawImage(landmarkAtlas,kind*64,0,64,64,p.x-size/2,p.y-size/2,size,size);mc.globalAlpha=1;}}
 if(!walk){draw3DBrush();drawRoutePreview(mc,p=>projectTerrain(p.x,p.y,sampleTerrain(p.x,p.y,surfaceHeights,sea,false)+.5,w,h,camera));}
 let duration=performance.now()-started,delta=time-lastFrameTime;if(lastFrameTime&&delta>0&&delta<200&&(orbitPointer||down)){let fps=1000/delta;averageFps=averageFps?averageFps*.8+fps*.2:fps;}lastFrameTime=time;
 $('render-stats').textContent=(renderer?'GPU':'Canvas')+(averageFps?' · '+Math.round(averageFps)+' fps':'');$('render-stats').dataset.renderMs=duration.toFixed(2);$('render-stats').dataset.fps=averageFps.toFixed(1);$('render-stats').dataset.renderer=renderer?'webgl':'canvas';$('render-stats').dataset.fallbackReason=renderer?'':fallbackReason;$('render-stats').title=renderer?'WebGL rendering':'Canvas fallback: '+fallbackReason;
}
function preview(){scheduleFrame();}
function refresh(){pourActive=hasPouredWater;surfaceDirty=true;textureDirty=true;sceneDirty=true;scheduleFrame();}
function resize(){let d=Math.min(2,devicePixelRatio||1);for(let c of[map,mini,glCanvas,livingCanvas]){let width=Math.round((c===glCanvas?mini.clientWidth:c===livingCanvas?document.querySelector('.workspace').clientWidth:c.clientWidth)*d),height=Math.round((c===glCanvas?mini.clientHeight:c===livingCanvas?document.querySelector('.workspace').clientHeight:c.clientHeight)*d);if(c.width!==width||c.height!==height){c.width=width;c.height=height;}if(c!==glCanvas)c.getContext('2d').setTransform(d,0,0,d,0,0);}scheduleFrame();}new ResizeObserver(resize).observe(document.querySelector('.workspace'));
function state(){const pouredWater=hasPouredWater?poured.save():[];return{version:9,floor:heightFloor,ceiling:heightCeiling,...(springs.length?{springs:springs.map(({cell,rate})=>[cell,rate])}:{}),...(pouredWater.length?{pouredWater}:{}),...(waterDrops.length?{waterDrops:structuredClone(waterDrops)}:{}),surfaceMaterials:encodeMaterialCoverage(surfaceMaterials),forest:Array.from(forest,v=>Math.round(v*10000)/10000),routes:structuredClone(routes),size:N,name:$('worldname').value,heights:Array.from(heights,v=>Math.round(v*1000)/1000),paint:Array.from(paint),paintColors:Array.from(paintColors),paintAlpha:Array.from(paintAlpha,v=>Math.round(v*10000)/10000),sea,water,shade,marks:marks.map(m=>({...m})),shapes:structuredClone(drawings),layers:structuredClone(layers)}}
function persist(){modified=true;$('save-status').textContent='Saving changes…';$('save-badge').textContent='Saving…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem('worldpainter-project',JSON.stringify(state()));modified=false;$('save-status').textContent='All changes saved locally';$('save-badge').textContent='Saved in browser'}catch{$('save-status').textContent='Download project to keep changes';$('save-badge').textContent='Not saved · download';notify('Local storage full — save your project to a file.')}},600)}
function snapshot(record=state()){undo.push(record);if(undo.length>35)undo.shift();redo=[];historyUI()}
function historyUI(){$('undo').disabled=!undo.length;$('redo').disabled=!redo.length}
function restoreHistory(from,to){if(routeDraft){cancelStroke();return;}cancelStroke();if(!from.length)return;to.push(state());load(from.pop());refresh();historyUI();persist()}
function pointer(e){let canvas=workspaceMode==='3d'?mini:map,b=canvas.getBoundingClientRect(),sx=e.clientX-b.left,sy=e.clientY-b.top;
 if(workspaceMode==='3d'){updateSurface();
 if(oceanDirty)updateOceanGeometry();
 let hit=pickTerrain(sx,sy,mini.clientWidth,mini.clientHeight,camera,surfaceHeights,sea,false);return hit?{...hit,sx,sy,hit:true}:{x:NaN,y:NaN,sx,sy,hit:false};}
 let t=transform();return{x:(sx-t.x)/t.scale,y:(sy-t.y)/t.scale,sx,sy,hit:true};}
function gestureTool(e){return tool==='paint'&&e?.shiftKey?'erase':tool;}
function activeLayer(e){return layers[gestureTool(e)==='erase'?eraseTarget:tool==='paint'&&material===4?'forests':tool==='path'||tool==='paint'?'surface':tool==='river'?'rivers':'elevation'];}
function usesOpacity(t=tool){return t==='paint'||t==='path';}
function opacity(e){return gestureTool(e)==='erase'&&!['surface','forests'].includes(eraseTarget)?1:usesOpacity()?+$('opacity').value/100:1;}
function apply(p,e){
 if(isRouteTool())return;
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return;let action=gestureTool(e),layer=activeLayer(e);if(layer.locked||!layer.visible||!opacity(e))return;
 let r=+$('size').value/2,alpha=opacity(e);
 if(action==='erase'&&eraseTarget==='rivers'){routes=routes.filter(r=>r.type!=='river'||!routeTouches(r,p.x,p.y,radiusForErase()));riverWaterDirty=true;return;}
 if(action==='erase'&&eraseTarget==='landmarks'){marks=marks.filter(m=>Math.hypot(m.x-p.x,m.y-p.y)>r+m.size*.6);return;}
 if(action==='erase'&&eraseTarget==='shapes'){drawings=drawings.filter(s=>!touchesShape(s,p.x,p.y,r));return;}
 if((action==='paint'&&material===4)||(action==='erase'&&eraseTarget==='forests')){forestStroke(forest,N,p.x,p.y,r,{preset:brushPreset,opacity:alpha,density:+$('forest-density').value/100,erase:action==='erase'||e.shiftKey,initial:paintStroke?.forest,coverage:paintStroke?.coverage});return;}
 if(tool==='river'){if(!wandStroke)return;if(wandStroke.drying){springs=dryArea(poured.depth,springs,N,p.x,p.y,r);hasPouredWater=pourActive=true;return;}
  const q=meanderPoint(wandStroke,p,r,+$('wand-meander').value/100,N);
  wandDab(heights,poured.depth,N,q.x,q.y,r,{depth:+$('wand-depth').value,flow:+$('wand-water').value,stroke:wandStroke,floor:heightFloor,ceiling:heightCeiling,preset:brushPreset});
  const cell=Math.round(q.y)*N+Math.round(q.x);if(!wandStroke.seen.has(cell)){wandStroke.seen.add(cell);wandStroke.trail.push(cell);}
  hasPouredWater=pourActive=true;return;}
 if(tool==='path'){const mat=+$('path-material').value,color=materials[mat-1][2];
  for(let y=Math.max(0,Math.floor(p.y-r));y<Math.min(N,p.y+r);y++)for(let x=Math.max(0,Math.floor(p.x-r));x<Math.min(N,p.x+r);x++){
   let weight=brushWeight(x,y,p.x,p.y,r,brushPreset)*alpha;if(!weight)continue;let i=y*N+x;
   if(paintStroke){if(weight<=paintStroke.coverage[i])continue;paintStroke.coverage[i]=weight;paintAlpha[i]=paintStroke.alpha[i];for(let k=0;k<3;k++)paintColors[i*3+k]=paintStroke.colors[i*3+k];forest[i]=paintStroke.forest[i];}
   blendPaint(paintColors,paintAlpha,i,color,weight,false);applyMaterialCoverage(surfaceMaterials,i,{id:mat,amount:weight,erase:false,initial:paintStroke?.materials,alpha:paintAlpha[i]});paint[i]=mat;
   // roads keep trees off the track
   forest[i]*=1-weight;}
  return;}
 if(tool==='land'){coastStroke(heights,N,p.x,p.y,r,sea,alpha,e.shiftKey);return;}
 if(action==='paint'||(action==='erase'&&eraseTarget==='surface')){
  for(let y=Math.max(0,Math.floor(p.y-r));y<Math.min(N,p.y+r);y++)for(let x=Math.max(0,Math.floor(p.x-r));x<Math.min(N,p.x+r);x++){
   let weight=brushWeight(x,y,p.x,p.y,r,brushPreset)*alpha;if(!weight)continue;let i=y*N+x;
   if(paintStroke){if(weight<=paintStroke.coverage[i])continue;paintStroke.coverage[i]=weight;paintAlpha[i]=paintStroke.alpha[i];for(let k=0;k<3;k++)paintColors[i*3+k]=paintStroke.colors[i*3+k];}
   let erasing=action==='erase'||e.shiftKey;blendPaint(paintColors,paintAlpha,i,materials[material-1][2],weight,erasing);applyMaterialCoverage(surfaceMaterials,i,{id:material,amount:weight,erase:erasing,initial:paintStroke?.materials,alpha:paintAlpha[i]});paint[i]=paintAlpha[i]<.001?0:(erasing?paint[i]:material);
  }
  return;
 }
 let active=tool;if(e.shiftKey){if(tool==='raise')active='lower';else if(tool==='lower')active='raise';}
 if(isHeightTool(active)){if(!sculptStroke)sculptStroke={pre:heights.slice(),reach:new Float32Array(N*N)};heightStroke(heights,N,p.x,p.y,r,{dir:active==='raise'?1:-1,budget:+$('strength').value,pre:sculptStroke.pre,reach:sculptStroke.reach,floor:heightFloor,ceiling:heightCeiling,preset:brushPreset});return;}
 stroke(heights,N,p.x,p.y,r,+$('strength').value/100*3*alpha,active,Math.min(heightCeiling,Math.max(heightFloor,+$('target').value)),{preserveBoundary:$('preserve-edges').checked,preset:brushPreset});
}
// Path and River are freehand brushes; the old click-points route drafting is retired.
function isRouteTool(){return false;}
const brushRoute=t=>t==='path'||t==='river';
let wandStroke=null,springs=[];
function finishWand(){if(!wandStroke)return;settleSediment(heights,wandStroke.sediment,heightCeiling,{sea});if(!wandStroke.drying&&wandStroke.trail.length)springs=addSpring(springs,wandStroke.trail[0],+$('wand-water').value,N);wandStroke=null;hasPouredWater=pourActive=hasPouredWater||springs.length>0;renderLayers();refresh();}
function dropCell(point){
 if(!point.hit||point.x<0||point.y<0||point.x>=N||point.y>=N)return -1;
 return Math.min(N-1,Math.round(point.y))*N+Math.min(N-1,Math.round(point.x));
}
function addPour(point){
 const cell=dropCell(point);
 if(cell<0)return;
 poured.depth[cell]+=Math.max(0,Math.min(128-poured.depth[cell],Number($('river-depth').value)*.4));
 pourActive=hasPouredWater=true;
 surfaceDirty=textureDirty=sceneDirty=true;
}
function placeWaterDrop(point,remove){
 const cell=dropCell(point);
 if(cell<0){down=false;return;}
 if(remove){
  const legacy=waterDrops.findLastIndex(drop=>drop.cell===cell||basinFill(heights,drop.cell,drop.level,null,cell));
  down=false;
  if(!poured.depth[cell]&&legacy<0)return;
  snapshot();
  if(poured.depth[cell]){
   poured.depth[cell]=0;
   hasPouredWater=poured.depth.some(Boolean);
   pourActive=hasPouredWater;
  }else waterDrops=waterDrops.filter((drop,i)=>i!==legacy);
  renderLayers();
  refresh();
  persist();
  return;
 }
 snapshot();
 pouring=true;
 lastFlowFrame=null;
 addPour(point);
 renderLayers();
 refresh();
 if(!water)notify('Water added. Turn on Water to see it.');
}
function editBasin(point,drain){
 down=false;
 const cell=dropCell(point);
 if(cell<0)return;
 if(drain){
  const remaining=waterDrops.filter(drop=>!basinFill(heights,drop.cell,drop.level,null,cell));
  if(remaining.length===waterDrops.length){notify('Click inside a filled basin to drain it.');return;}
  snapshot();
  waterDrops=remaining;
 }else{
  const level=Math.min(255,heights[cell]+Number($('river-depth').value));
  if(!basinFill(heights,cell,level,null)){
   notify('Water would run off the map. Try a shallower fill or a more enclosed spot.');
   return;
  }
  const existing=waterDrops.findIndex(drop=>drop.cell===cell);
  if(existing>=0&&waterDrops[existing].level===level)return;
  if(existing<0&&waterDrops.length>=MAX_WATER_DROPS){notify('Basin limit reached. Drain a basin first.');return;}
  snapshot();
  waterDrops=[...waterDrops.filter(drop=>drop.cell!==cell),{cell,level}];
  if(!water)notify('Basin filled. Turn on Water to see it.');
 }
 renderLayers();
 refresh();
 persist();
}
$('basin-fill').onclick=()=>{
 basinMode=!basinMode;
 dropperEnabled=false;
 cancelRoute(false);
 selectTool(tool);
 draw();
};
$('water-dropper').onclick=()=>{
 dropperEnabled=!dropperEnabled;
 basinMode=false;
 cancelRoute(false);
 selectTool(tool);
 draw();
};
function radiusForErase(){return +$('size').value/2;}
function routeOptions(){return{width:+$('route-width').value,depth:+$('river-depth').value,material:+$('path-material').value,opacity:opacity(),taper:$('river-taper').checked,meander:+$('river-meander').value/100};}
function appendRoutePoint(p){if(p.x<0||p.y<0||p.x>N-1||p.y>N-1||!Number.isFinite(p.x)||routeDraft.points.length>=512)return;let lastPoint=routeDraft.points.at(-1);if(!lastPoint||Math.hypot(lastPoint.x-p.x,lastPoint.y-p.y)>.7)routeDraft.points.push({x:p.x,y:p.y});}
function updateRouteControls(){$('route-bar').hidden=!routeDraft;$('route-draft-label').textContent=routeDraft?`${routeDraft.type==='river'?'River':'Path'} preview · ${routeDraft.points.length} points`:'';let ready=!!routeDraft&&routeDraft.points.length>=2;$('finish-route').disabled=!ready;$('cancel-route').disabled=!routeDraft;}
function cancelRoute(redraw=true){routeDraft=null;routeHover=null;if($('finish-route'))updateRouteControls();if(redraw)draw();}
function drawRoutePreview(context,project){if(!routeDraft)return;let controls=routeDraft.points;if(routeHover&&(!controls.length||Math.hypot(routeHover.x-controls.at(-1).x,routeHover.y-controls.at(-1).y)>.7))controls=[...controls,routeHover];let r=makeRoute(routeDraft.type,controls,routeOptions(),heights,N);context.save();let rgb=routeDraft.type==='river'?[86,170,214]:materials[routeOptions().material-1][2],tone=`rgb(${rgb.join(',')})`;context.strokeStyle=routeDraft.type==='river'?'#8fdcf2':'#f1d9a8';context.fillStyle=tone;if(r){let left=[],right=[],fractions=routeFractions(r.points);r.points.forEach((p,i)=>{let before=r.points[Math.max(0,i-1)],after=r.points[Math.min(r.points.length-1,i+1)],dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy)||1,nx=-dy/len*routeRadius(r,fractions[i]),ny=dx/len*routeRadius(r,fractions[i]);const bounded=(x,y)=>({x:Math.max(0,Math.min(N-1,x)),y:Math.max(0,Math.min(N-1,y))});left.push(project(bounded(p.x+nx,p.y+ny)));right.push(project(bounded(p.x-nx,p.y-ny)));});context.globalAlpha=routeDraft.type==='river'?.6:.45+.4*routeOptions().opacity;context.beginPath();[...left,...right.reverse()].forEach((q,i)=>i?context.lineTo(q.x,q.y):context.moveTo(q.x,q.y));context.closePath();context.fill();context.globalAlpha=.9;context.lineWidth=1.5;context.strokeStyle='rgba(20,24,18,.75)';context.stroke();context.strokeStyle=routeDraft.type==='river'?'#8fdcf2':'#f1d9a8';context.globalAlpha=1;}context.lineWidth=3;context.setLineDash([6,4]);context.beginPath();if(r)r.points.forEach((p,i)=>{let q=project(p);i?context.lineTo(q.x,q.y):context.moveTo(q.x,q.y);});context.stroke();context.setLineDash([]);context.fillStyle=context.strokeStyle;context.lineWidth=1.5;for(let p of routeDraft.points){let q=project(p);context.beginPath();context.arc(q.x,q.y,4.5,0,Math.PI*2);context.fill();context.strokeStyle='rgba(20,24,18,.85)';context.stroke();context.strokeStyle=context.fillStyle;}context.restore();}
function finishRoute(){if(!routeDraft)return;let layer=activeLayer();if(layer.locked||!layer.visible||(tool==='river'&&(layers.elevation.locked||!layers.elevation.visible))){notify('Show and unlock the route and terrain layers first.');return;}let r=makeRoute(routeDraft.type,routeDraft.points,routeOptions(),heights,N);if(!r){notify('Use at least two distinct points; shorten very long or complex routes.');return;}if(routes.length>=64||routes.reduce((sum,r)=>sum+r.points.length,0)+r.points.length>32768||routes.reduce((sum,r)=>sum+routeWork(r),0)+routeWork(r)>PROJECT_WORK_LIMIT){notify('Route limit reached.');return;}if(!r.opacity){cancelRoute();return;}snapshot();applyRoute(r,heights,paint,paintColors,paintAlpha,N,surfaceMaterials);routes=[...routes,r];riverWaterDirty=true;cancelRoute(false);down=false;last=null;renderLayers();refresh();persist();notify(r.type==='river'?'River carved. Water toggle reveals the bed.':'Path placed.');}
$('finish-route').onclick=finishRoute;$('cancel-route').onclick=()=>cancelStroke();
for(let [id,suffix]of[['route-width',' blocks'],['river-depth',' blocks']])$(id).oninput=()=>{$(id+'out').value=$(id).value+suffix;draw();};
$('path-material').onchange=()=>draw();$('river-taper').onchange=()=>draw();$('river-meander').oninput=()=>{$('river-meanderout').value=$('river-meander').value+'%';draw();};
for(let canvas of[map,mini])canvas.ondblclick=e=>{if(isRouteTool()){e.preventDefault();finishRoute();}};
map.onpointerdown=e=>{
 if(e.button!==0&&e.button!==1)return;
 (workspaceMode==='3d'?mini:map).setPointerCapture(e.pointerId);down=true;last=pointer(e);if(workspaceMode==='3d'&&!last.hit&&tool!=='pan'&&e.button!==1&&!spacePan){down=false;return;}
 if(tool==='pan'||e.button===1||spacePan&&e.button===0){last.pan=true;document.body.classList.add('panning');return;}
 let layer=activeLayer(e);if(layer.locked||!layer.visible||(tool==='river'&&!waterTool()&&(layers.elevation.locked||!layers.elevation.visible))){notify(tool==='river'&&!waterTool()?'Show and unlock Relief and River water to carve a river.':layer.locked?'Unlock this layer to edit it.':'Show this layer to edit it.');down=false;return;}
 if(fillingBasin()){editBasin(last,e.shiftKey);return;}
 if(droppingWater()){placeWaterDrop(last,e.shiftKey);return;}
 if(isRouteTool()){if(last.x<0||last.y<0||last.x>N-1||last.y>N-1){down=false;last=null;return;}(workspaceMode==='3d'?mini:map).focus({preventScroll:true});if(!routeDraft)routeDraft={type:tool,points:[]};appendRoutePoint(last);routeHover=null;updateRouteControls();draw();return;}
 if(opacity(e)){snapshot();if(tool==='river'){wandStroke={pre:heights.slice(),reach:new Float32Array(N*N),sediment:new Float32Array(N*N),trail:[],seen:new Set(),drying:e.shiftKey,arc:0,prev:null,dir:null,phase:(Math.round(last.x)*7.13+Math.round(last.y)*3.71)%(Math.PI*2)};hasPouredWater=pourActive=true;lastFlowFrame=null;requestFrame();}if(tool==='paint'||tool==='path')paintStroke={materials:surfaceMaterials.slice(),forest:forest.slice(),colors:paintColors.slice(),alpha:paintAlpha.slice(),coverage:new Float32Array(N*N)};apply(last,e);refresh();}
};
map.onpointermove=e=>{
 let p=pointer(e),t=transform();brushPosition=p;
 $('brush').style.cssText=`display:${workspaceMode==='3d'||tool==='pan'||isRouteTool()||spacePan||last?.pan?'none':'block'};left:${p.sx}px;top:${p.sy}px;width:${+$('size').value*t.scale}px;height:${+$('size').value*t.scale}px`;
 let x=Math.floor(p.x),y=Math.floor(p.y);if(x>=0&&y>=0&&x<N&&y<N){let i=y*N+x;$('coords').textContent=`X: ${x}   Z: ${y}`;$('heightstatus').textContent=`Height: ${Math.round(heights[i])}`;$('terrainstatus').textContent=oceanSurface()&&ocean.coverage[i]>0?'Ocean':oceanSurface()&&riverWater[i]>heights[i]+.01?'Inland water':forest[i]>.01?'Forest':paint[i]?materials[paint[i]-1][0]:'Grassland';}
 if(workspaceMode==='3d'){preview();if(!p.hit){last=p;return;}}
 if(pouring){last=p;return;}
 if(isRouteTool()&&routeDraft&&!last?.pan){if(p.hit&&p.x>=0&&p.y>=0&&p.x<N&&p.y<N){routeHover={x:p.x,y:p.y};if(down&&(!routeDraft.points.length||Math.hypot(p.x-routeDraft.points.at(-1).x,p.y-routeDraft.points.at(-1).y)>=2))appendRoutePoint(p);updateRouteControls();draw();}return;}
 if(down){
  if(last.pan){pan.x+=p.sx-last.sx;pan.y+=p.sy-last.sy;p.pan=true;draw();}
  else if(tool!=='pan'){if(!last?.hit)last=p;let d=Math.hypot(p.x-last.x,p.y-last.y),steps=Math.max(1,Math.ceil(d/3));for(let j=1;j<=steps;j++)apply({x:last.x+(p.x-last.x)*j/steps,y:last.y+(p.y-last.y)*j/steps},e);refresh();}
  last=p;
 }
};
function end(){pouring=false;document.body.classList.remove('panning');if(isRouteTool()&&routeDraft){down=false;last=null;return;}const finishWoodland=down&&!last?.pan&&tool!=='pan',legacyErase=down&&!last?.pan&&tool==='paint';if(down&&!last?.pan&&tool!=='pan')persist();down=false;last=null;paintStroke=null;sculptStroke=null;finishWand();if(legacyErase||tool==='paint'&&material===4)renderLayers();if(finishWoodland)refresh();syncLiving();}
function cancelStroke(){pouring=false;document.body.classList.remove('panning');const finishWoodland=down&&!last?.pan,forestEdit=down&&tool==='paint';cancelRoute(false);if(down&&!last?.pan)persist();down=false;last=null;paintStroke=null;sculptStroke=null;finishWand();if(forestEdit)renderLayers();if(finishWoodland)refresh();draw();}
map.onpointerup=end;map.onpointercancel=()=>{if(down)persist();cancelStroke();};map.onpointerleave=()=>{brushPosition=null;$('brush').style.display='none';};
function changeZoom(z){zoom=Math.max(.4,Math.min(4,z));draw()}map.addEventListener('wheel',e=>{e.preventDefault();if(e.shiftKey){adjustBrush(brushDelta(e));return;}changeZoom(zoom*(e.deltaY>0?.9:1.1))},{passive:false});$('plus').onclick=()=>changeZoom(zoom*1.2);$('minus').onclick=()=>changeZoom(zoom/1.2);$('fit').onclick=()=>{zoom=1;pan={x:0,y:0};draw()};
let raiseLowerStrength=3,blendStrength=35,heightFloor=DEFAULT_FLOOR,heightCeiling=DEFAULT_CEILING,sculptStroke=null;
const isHeightTool=t=>t==='raise'||t==='lower';
// Raise/Lower strength is a height budget per stroke (blocks); Smooth/Flatten keep a percentage.
function strengthUnits(t){const s=$('strength');if(isHeightTool(t)){s.min='0.5';s.max='20';s.step='0.5';$('strength-name').textContent='Height per stroke';}else{s.min='1';s.max='100';s.step='1';$('strength-name').textContent='Strength';}}
function strengthText(t){return isHeightTool(t)?(+$('strength').value).toString()+' blocks':$('strength').value+'%';}
function syncHeightRange(){$('height-floor').value=heightFloor;$('height-ceiling').value=heightCeiling;$('height-floorout').value=heightFloor;$('height-ceilingout').value=heightCeiling;$('target').min=String(heightFloor);$('target').max=String(heightCeiling);}
function selectTool(t){

 if(t!==tool){cancelRoute(false);dropperEnabled=basinMode=false;}
 $('erase-description').textContent={forests:'Thin or clear trees without changing the ground. Opacity controls removal.',surface:'Reveal the natural terrain color. Elevation stays intact.',landmarks:'Remove whole legacy landmarks touched by the brush. Undo to restore.',shapes:'Remove whole legacy drawings touched by the brush. Undo to restore.',rivers:'Remove river water along a touched route. The carved channel remains; undo restores the water.'}[eraseTarget];
 if(down)end();if(['raise','lower'].includes(tool))raiseLowerStrength=+$('strength').value;else if(['smooth','flatten'].includes(tool))blendStrength=+$('strength').value;if(['raise','lower','smooth','flatten'].includes(t)){strengthUnits(t);$('strength').value=['raise','lower'].includes(t)?raiseLowerStrength:blendStrength;$('strengthout').value=strengthText(t);}orbitPointer=null;orbitMode=false;$('orbit-toggle').setAttribute('aria-pressed','false');$('orbit-toggle').textContent='Orbit';tool=t;if(isRouteTool()||t==='pan')$('brush').style.display='none';updateBrushUI();
 $('erase-settings').hidden=t!=='paint';$('opacity-label').hidden=!usesOpacity(t);$('brush-controls').hidden=t==='river'&&waterTool();$('size-label').hidden=isRouteTool();$('size-shortcuts').hidden=isRouteTool();$('size').disabled=t==='pan'||isRouteTool();$('opacity').disabled=t==='pan'||t==='river';$('strength-label').hidden=!['raise','lower','smooth','flatten'].includes(t);$('target-label').hidden=t!=='flatten';$('edge-protection-label').hidden=t!=='flatten';
 $('water-dropper').hidden=t!=='river';
 $('water-dropper').setAttribute('aria-pressed',String(droppingWater()));
 $('water-dropper').classList.toggle('active',droppingWater());
 $('basin-fill').hidden=t!=='river';
 $('basin-fill').setAttribute('aria-pressed',String(fillingBasin()));
 $('basin-fill').classList.toggle('active',fillingBasin());
 $('water-dropper-help').hidden=!waterTool();
 $('water-dropper-help').textContent=fillingBasin()?'Click to fill an enclosed basin. Shift-click inside it to drain.':'Click to add water. Hold to keep pouring. Shift-click to drain the spot under the cursor.';
 $('water-depth-title').textContent=fillingBasin()?'Fill depth':droppingWater()?'Pour amount':'Channel depth';
 $('route-width').closest('label').hidden=true;$('wand-controls').hidden=t!=='river'||waterTool();$('route-instructions').textContent=t==='river'?'Drag to carve. Water follows the land while you draw, and the start of the stroke becomes a spring. Go over it again to cut deeper; Shift dries an area.':'Drag to lay a path. It paints the surface and keeps trees off the track.';
 $('route-settings').hidden=!brushRoute(t);$('route-title').textContent=t==='river'?'RIVER':'PATH';$('path-material-label').hidden=t!=='path';$('river-depth-label').hidden=t!=='river'||!waterTool();$('river-taper-label').hidden=true;$('river-meander-label').hidden=true;updateRouteControls();
 $('sculpt-settings').hidden=!['raise','lower','smooth','flatten'].includes(t);$('brush-settings').hidden=t==='river'&&waterTool();document.querySelectorAll('[data-brush]').forEach(b=>b.disabled=!['raise','lower','smooth','flatten','paint'].includes(t));
 $('forest-settings').hidden=!(t==='paint'&&material===4);$('palette-section').hidden=t!=='paint';$('paint-status').textContent=t==='paint'?`${materials[material-1][0]} · ${brushPreset==='coast'?'Coastline':brushPreset==='hard'?'Hard Round':brushPreset==='grain'?'Grain':'Soft Round'} · Shift erases ${$('erase-target').selectedOptions[0]?.textContent||'paint'}`:`${materials[material-1][0]} selected · Use Paint (P) to apply.`;
 document.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('selected',b.dataset.tool===t);b.setAttribute('aria-pressed',b.dataset.tool===t);});
 $('toolhint').textContent=fillingBasin()?'Click to fill a basin · Shift-click to drain':droppingWater()?'Click or hold to pour · Shift-click to drain here':{raise:'Raise terrain',lower:'Lower terrain',smooth:'Smooth terrain',flatten:'Flatten to target height',paint:'Paint '+materials[material-1][0],pan:'Pan the map',land:'Shape coastline · Shift to remove land',path:'Lay a path · drag to paint the track',river:'Carve a river · drag and watch the water find its way'}[t];$('toolkeys').textContent=fillingBasin()?'Set fill depth in River settings':droppingWater()?'Set pour amount in River settings':isRouteTool()?'W/S route width · Shift + wheel resize · Scroll to zoom':t==='flatten'?'D/E target height · Shift ×10 · W/S brush size':t==='pan'?'Drag to pan · Space + drag from any tool · Scroll to zoom':'W/S brush size · Shift + wheel resize · Scroll to zoom';map.style.cursor=t==='pan'?'grab':'crosshair';
}
$('tools').onclick=e=>{let b=e.target.closest('[data-tool]');if(b)selectTool(b.dataset.tool)};function selectMaterialFrom(e){let b=e.target.closest('[data-material]');if(!b)return;material=+b.dataset.material;eraseTarget=material===4?'forests':'surface';renderLayers();document.querySelectorAll('[data-material]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',String(el===b));});selectTool(tool);}
$('palette').onclick=selectMaterialFrom;$('forest-paint').onclick=selectMaterialFrom;
for(let id of['size','strength','target'])$(id).oninput=()=>{$(id+'out').value=id==='strength'?strengthText(tool):$(id).value+(id==='size'?' blocks':'')};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));refresh()});
$('grid').onclick=()=>{grid=!grid;$('grid').classList.toggle('active',grid);$('grid').setAttribute('aria-pressed',grid);draw()};$('contours').onclick=()=>{contours=!contours;$('contours').classList.toggle('active',contours);$('contours').setAttribute('aria-pressed',contours);refresh()};for(const id of['height-floor','height-ceiling']){$(id).onpointerdown=()=>snapshot();$(id).onkeydown=e=>{if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key))snapshot()};$(id).oninput=()=>{let f=+$('height-floor').value,c=+$('height-ceiling').value;if(c-f<MIN_RANGE){if(id==='height-floor')f=c-MIN_RANGE;else c=f+MIN_RANGE;}heightFloor=Math.max(0,Math.min(FLOOR_MAX,f));heightCeiling=Math.max(CEILING_MIN,Math.min(255,c));if(heightCeiling-heightFloor<MIN_RANGE)heightFloor=heightCeiling-MIN_RANGE;syncHeightRange();persist();};}syncHeightRange();$('sea').onpointerdown=()=>snapshot();$('sea').onkeydown=e=>{if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key))snapshot()};$('sea').oninput=()=>{sea=+$('sea').value;$('seaout').value=sea;refresh();persist()};for(let id of['water','shade'])$(id).onclick=()=>{snapshot();if(id==='water'){water=!water;ocean.initialize(heights,sea,water);}else shade=!shade;let v=id==='water'?water:shade;$(id).classList.toggle('on',v);$(id).setAttribute('aria-pressed',v);refresh();persist()};$('undo').onclick=()=>restoreHistory(undo,redo);$('redo').onclick=()=>restoreHistory(redo,undo);
function download(blob,name){let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}function slug(){return $('worldname').value.replace(/[^a-z0-9 -]/gi,'').trim()||'world'}
$('save').onclick=()=>{download(new Blob([JSON.stringify(state())],{type:'application/json'}),slug()+'.world.json');persist();notify('Project saved — keep building.')};$('export-height').onclick=()=>{$('exportdialog').close();let c=document.createElement('canvas');c.width=c.height=N;let cx=c.getContext('2d'),im=cx.createImageData(N,N);for(let i=0;i<N*N;i++){let v=Math.round(heights[i]);im.data.set([v,v,v,255],i*4)}cx.putImageData(im,0,0);c.toBlob(b=>{download(b,slug()+'-heightmap.png');notify(`${N} × ${N} heightmap exported.`)})};
$('new').onclick=()=>{cancelRoute();$('newdialog').returnValue='';renderNewWorldPreview();$('newdialog').showModal();$('newdialog').scrollTop=0;};$('newdialog').addEventListener('close',()=>{if($('newdialog').returnValue!=='generate')return;if(!isWorldSize(+$('world-size').value))return;snapshot();setWorldSize(+$('world-size').value);heights=generate(N,+$('seed').value,{shape:selectedShape,relief:+$('relief').value/100});heightFloor=DEFAULT_FLOOR;heightCeiling=DEFAULT_CEILING;syncHeightRange();fitHeightRange(heights,heightFloor,heightCeiling);paint.fill(0);paintColors.fill(0);paintAlpha.fill(0);forest.fill(0);surfaceMaterials.fill(0);marks=[];drawings=[];routes=[];waterDrops=[];springs=[];poured=createPouredWater(N);hasPouredWater=pourActive=pouring=false;lastFlowFrame=null;riverWaterDirty=true;layers=defaultLayers();sea=62;water=true;shade=true;load({...state(),name:$('newname').value.trim()||'Untitled world'});$('worldname').value=$('newname').value.trim()||'Untitled world';$('infotitle').textContent=$('worldname').value;zoom=1;pan={x:0,y:0};camera={yaw:-.65,pitch:.65,zoom:1,panX:0,panY:0,size:N};refresh();persist();notify('Your new world is ready.')});$('help').onclick=()=>$('helpdialog').showModal();$('worldname').onfocus=()=>{nameEditSnapshot=state();};$('worldname').onblur=()=>{nameEditSnapshot=null;};$('worldname').oninput=()=>{if(nameEditSnapshot){snapshot(nameEditSnapshot);nameEditSnapshot=null;}$('infotitle').textContent=$('worldname').value;persist()};
function setWorldSize(n){cancelRoute(false);riverWaterDirty=true;if(!isWorldSize(n))throw Error('Invalid project');if(N!==n){surfaceBounds=null;uploadedSurfaceLayout=undefined;}N=n;poured=createPouredWater(N);hasPouredWater=pourActive=pouring=false;lastFlowFrame=null;basinFill=createBasinFill(N);ocean=createReactiveWater(N);oceanOpaque=new Uint8Array(N*N);oceanLastFrame=null;oceanDirty=true;camera.size=N;off.width=off.height=tiny.width=tiny.height=N;pixels=oc.createImageData(N,N);grainNoise=Float32Array.from({length:N*N},(_,i)=>(Math.sin(i*78.233)*43758.5453)%1*4);paint=new Uint8Array(N*N);paintColors=new Uint8ClampedArray(N*N*3);paintAlpha=new Float32Array(N*N);forest=new Float32Array(N*N);surfaceMaterials=new Uint8Array(N*N*8);document.querySelectorAll('[data-dimensions]').forEach(el=>el.textContent=`${N} × ${N}`);$('heightmap-dimensions').textContent=`PNG · ${N} × ${N}`;document.querySelector('.map-scale').innerHTML=`<span></span>${N/2} blocks`;$('world-size').value=String(N);surfaceDirty=true;textureDirty=true;brushPosition=null;}
function load(input){let s=normalizeProject(input);if(walking())exitWalk();cancelRoute(false);routes=s.routes;waterDrops=s.waterDrops??[];riverWaterDirty=true;setWorldSize(s.size);for(const [cell,depth] of s.pouredWater??[])poured.depth[cell]=depth;hasPouredWater=pourActive=!!s.pouredWater?.length;heights=Float32Array.from(s.heights);paint=Uint8Array.from(s.paint);paintColors=Uint8ClampedArray.from(s.paintColors);paintAlpha=Float32Array.from(s.paintAlpha);forest=Float32Array.from(s.forest);surfaceMaterials=decodeMaterialCoverage(s.surfaceMaterials,N);drawings=s.shapes;springs=(s.springs??[]).map(([cell,rate])=>({cell,rate}));sea=s.sea;heightFloor=s.floor;heightCeiling=s.ceiling;syncHeightRange();water=s.water;ocean.initialize(heights,sea,water);shade=s.shade;marks=s.marks;layers=s.layers;$('worldname').value=s.name;$('infotitle').textContent=s.name;$('sea').value=sea;$('seaout').value=sea;for(let id of['water','shade']){let v=id==='water'?water:shade;$(id).classList.toggle('on',v);$(id).setAttribute('aria-pressed',v);}renderLayers();}
$('open').onclick=()=>$('file').click();$('file').onchange=async()=>{let f=$('file').files[0];if(!f)return;try{const projectFile=f.name.endsWith('.json'),limit=projectFile?32:12;if(f.size>limit*1e6)throw Error(`File too large (${limit} MB maximum)`);if(projectFile){let s=normalizeProject(JSON.parse(await f.text()));snapshot();load(s)}else{let image=await createImageBitmap(f);snapshot();oc.clearRect(0,0,N,N);oc.drawImage(image,0,0,N,N);let d=oc.getImageData(0,0,N,N).data;for(let i=0;i<N*N;i++)heights[i]=d[i*4]*.2126+d[i*4+1]*.7152+d[i*4+2]*.0722;paint.fill(0);paintColors.fill(0);paintAlpha.fill(0);forest.fill(0);surfaceMaterials.fill(0);marks=[];drawings=[];routes=[];waterDrops=[];springs=[];poured=createPouredWater(N);hasPouredWater=pourActive=pouring=false;lastFlowFrame=null;riverWaterDirty=true;renderLayers();image.close();ocean.initialize(heights,sea,water)}refresh();persist();notify('Imported successfully.')}catch(e){notify(e.message==='Invalid project'?'This project file is invalid.':e.message||'Could not import file.')}finally{$('file').value=''}};
document.onkeydown=e=>{if(e.target.closest('input,textarea,select,[contenteditable]:not([contenteditable=false])')||document.querySelector('dialog[open]'))return;if((e.code==='Space'||e.key===' ')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(down&&!last?.pan)end();spacePan=true;document.body.classList.add('space-pan');$('brush').style.display='none';draw();return;}if(e.ctrlKey||e.metaKey){if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?restoreHistory(redo,undo):restoreHistory(undo,redo)}if(e.key.toLowerCase()==='s'){e.preventDefault();$('save').click()}return}if(['d','e'].includes(e.key.toLowerCase())){if(e.altKey)return;if(tool==='flatten'){e.preventDefault();const step=e.shiftKey?10:1;$('target').value=Math.max(+$('target').min,Math.min(+$('target').max,+$('target').value+(e.key.toLowerCase()==='d'?-step:step)));$('target').oninput();draw();}else if(['raise','lower','smooth'].includes(tool)||(tool==='river'&&!waterTool())){e.preventDefault();nudgeSlider(tool==='river'?'wand-depth':'strength',e.key.toLowerCase()==='d'?-1:1,e.shiftKey);draw();}else if(usesOpacity()){e.preventDefault();$('opacity').value=Math.max(0,Math.min(100,+$('opacity').value+(e.key.toLowerCase()==='d'?-5:5)));$('opacityout').value=$('opacity').value+'%';draw();}return;}if(e.key==='Escape'){cancelStroke();return;}if(e.key==='Enter'&&routeDraft){e.preventDefault();finishRoute();return;}let delta=brushDelta(e);if(delta){e.preventDefault();adjustBrush(delta);return;}let t={r:'raise',l:'lower',q:'smooth',f:'flatten',p:'paint',b:'paint',h:'pan',m:'land',c:'land',j:'path',v:'river'}[e.key.toLowerCase()];if(t)selectTool(t)};

function releasePanKey(){spacePan=false;document.body.classList.remove('space-pan');draw();}
document.addEventListener('keyup',e=>{if(e.code==='Space'||e.key===' '){releasePanKey();}});
document.defaultView.addEventListener('blur',()=>{releasePanKey();orbitPointer=null;cancelStroke();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){releasePanKey();orbitPointer=null;cancelStroke();}});

function adjustBrush(delta){if(isRouteTool()){$('route-width').value=Math.max(2,Math.min(32,+$('route-width').value+delta));$('route-widthout').value=$('route-width').value+' blocks';draw();return;}$('size').value=resizeBrush(+$('size').value,delta);$('sizeout').value=$('size').value+' blocks';if(brushPosition){let t=transform();$('brush').style.width=$('brush').style.height=(+$('size').value*t.scale)+'px';}if(workspaceMode==='3d')preview();}
function renderLayers(){riverWaterDirty=true;let hasRivers=routes.some(r=>r.type==='river');$('reflow-rivers').hidden=$('reflow-note').hidden=!hasRivers;$('reflow-rivers').disabled=!hasRivers||layers.elevation.locked||!layers.elevation.visible||layers.rivers.locked||!layers.rivers.visible;let names={...(forest.some(v=>v>0)?{forests:['Forests','Trees & clearings']}:{}),...(hasPouredWater||waterDrops.length||hasRivers?{rivers:hasPouredWater||waterDrops.length?['River and lake water','Inland water surfaces']:['River water','Local water above carved channels']}:{}),...(drawings.length?{shapes:['Drawings','From an earlier project']}:{}),...(marks.length?{landmarks:['Landmarks','From an earlier project']}:{}),surface:['Surface','Terrain & biome paint'],elevation:['Relief','Sculpting, shading & contours']};$('layer-count').textContent=Object.keys(names).length;
 const targets={surface:'Surface paint',...(forest.some(v=>v>0)||material===4?{forests:'Forests'}:{}),...(routes.some(r=>r.type==='river')?{rivers:'River water'}:{}),...(marks.length?{landmarks:'Legacy landmarks'}:{}),...(drawings.length?{shapes:'Legacy drawings'}:{})};if(!targets[eraseTarget])eraseTarget='surface';$('erase-target').innerHTML=Object.entries(targets).map(([id,label])=>`<option value="${id}">${label}</option>`).join('');$('erase-target').value=eraseTarget;
 $('layers').innerHTML=Object.entries(names).map(([key,[name,desc]])=>`<div class="layer-row ${layers[key].visible?'':'is-hidden'}"><button data-layer="${key}" data-action="visible" aria-label="${layers[key].visible?'Hide':'Show'} ${name}" aria-pressed="${layers[key].visible}" title="Toggle visibility"><svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/>${layers[key].visible?'<circle cx="12" cy="12" r="3"/>':'<path d="M4 4l16 16"/>'}</svg></button><div class="layer-name">${name}<small>${desc}</small></div><button data-layer="${key}" data-action="locked" aria-label="${layers[key].locked?'Unlock':'Lock'} ${name}" aria-pressed="${layers[key].locked}" title="${layers[key].locked?'Unlock':'Lock'} layer"><svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/>${layers[key].locked?'<path d="M8 11V8a4 4 0 0 1 8 0v3"/>':'<path d="M8 11V8a4 4 0 0 1 7.5-2"/>'}</svg></button></div>`).join('');selectTool(tool);}
$('reflow-rivers').onclick=()=>{if(!routes.some(r=>r.type==='river')||layers.elevation.locked||!layers.elevation.visible||layers.rivers.locked||!layers.rivers.visible)return;cancelStroke();let updated=reflowRivers(routes,heights,N);snapshot();routes=updated;for(let route of routes)if(route.type==='river')applyRoute(route,heights,paint,paintColors,paintAlpha,N);riverWaterDirty=true;renderLayers();refresh();persist();notify('Rivers reflowed and channels recut. Undo restores the previous state.');};
$('layers').onclick=e=>{let b=e.target.closest('[data-layer]');if(!b)return;snapshot();layers[b.dataset.layer][b.dataset.action]=!layers[b.dataset.layer][b.dataset.action];renderLayers();refresh();persist();};
const shapes=[['island','Island'],['archipelago','Archipelago'],['continent','Continent'],['atoll','Atoll'],['blank','Open ocean'],['flat','Flat grass']];
$('shape-presets').innerHTML=shapes.map(([id,name])=>`<button type="button" data-shape="${id}" aria-pressed="${id===selectedShape}" class="${id===selectedShape?'selected':''}"><canvas width="80" height="80" aria-hidden="true"></canvas>${name}</button>`).join('');
const shapeDescriptions={island:'A connected landmass surrounded by open water.',archipelago:'Scattered islands, sheltered channels and room to explore.',continent:'Broad connected land with an open coast.',atoll:'A ring of land around a low basin. Cut a channel to let in seawater.',blank:'Open ocean. Add land wherever your story begins.',flat:'Completely level grass at height 80. A blank slate for deliberate sculpting.'};
function paintTerrainPreview(canvas,n,shape){canvas.width=canvas.height=n;let cx=canvas.getContext('2d'),a=fitHeightRange(generate(n,Number.isFinite(+$('seed').value)?+$('seed').value:42,{shape,relief:+$('relief').value/100})),img=cx.createImageData(n,n),wet=createReactiveWater(n).initialize(a,62);for(let i=0;i<a.length;i++){let h=a[i],v=wet[i]?[34,68,73]:h<66?[175,166,116]:h>180?[216,216,195]:h>145?[140,145,116]:h>110?[108,132,84]:[93,126,73],x=i%n,y=Math.floor(i/n),light=wet[i]?1:Math.max(.47,Math.min(1.4,1+((a[y*n+Math.min(n-1,x+1)]-a[y*n+Math.max(0,x-1)])+(a[Math.min(n-1,y+1)*n+x]-a[Math.max(0,y-1)*n+x]))*.055));img.data.set([...v.map(c=>Math.round(Math.min(255,c*light))),255],i*4);}cx.putImageData(img,0,0);}
function renderNewWorldPreview(){let n=+$('world-size').value;if(!isWorldSize(n))return;paintTerrainPreview($('world-preview'),n,selectedShape);$('shape-title').textContent=shapes.find(s=>s[0]===selectedShape)[1];$('shape-description').textContent=shapeDescriptions[selectedShape];$('new-world-summary').textContent=({128:'Quick sketch',192:'Standard',256:'Detailed',512:'Experimental'})[n]+' · '+n+' × '+n+' samples';$('world-size-help').textContent=({128:'Lightest editing workload. Good for quick ideas.',192:'A balance of detail and editing speed.',256:'Four times the samples of Quick sketch for finer edits.',512:'Four times the samples of Detailed. Editing may be slower.'})[n]+' Image export resolution is chosen separately.';let level=['flat','blank'].includes(selectedShape);$('relief').disabled=level;$('generation-note').textContent=level?'This start is completely level; seed and relief do not change it.':'The same seed and settings recreate the same terrain.';}
function renderPresets(){document.querySelectorAll('[data-shape]').forEach(b=>paintTerrainPreview(b.querySelector('canvas'),80,b.dataset.shape));renderNewWorldPreview();}
$('shape-presets').onclick=e=>{let b=e.target.closest('[data-shape]');if(!b)return;selectedShape=b.dataset.shape;document.querySelectorAll('[data-shape]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',el===b);});renderNewWorldPreview();};
$('world-size').onchange=renderNewWorldPreview;
$('backup-world').onclick=()=>$('save').click();
$('seed').oninput=renderPresets;$('relief').oninput=()=>{$('reliefout').value=+$('relief').value<70?'Gentle':+$('relief').value>115?'Dramatic':'Natural';renderPresets();};$('reroll').onclick=()=>{$('seed').value=Math.floor(Math.random()*1000000);renderPresets();};
$('panel-toggle').onclick=()=>{let open=$('right-panel').classList.toggle('mobile-open');$('panel-toggle').setAttribute('aria-expanded',open);resize();};
$('opacity').oninput=()=>{$('opacityout').value=$('opacity').value+'%';};
function exportResolution(){return[1024,2048,4096].includes(+$('export-size').value)?+$('export-size').value:2048;}
function updateExportSize(){let n=exportResolution();$('export-map-size').textContent='PNG · '+n+' × '+n;}
$('export-size').onchange=updateExportSize;
$('export').onclick=()=>{updateExportSize();$('exportdialog').showModal();};$('export-map').onclick=()=>{$('exportdialog').close();flushTexture();let resolution=exportResolution(),c=document.createElement('canvas');c.width=c.height=resolution;let cx=c.getContext('2d');cx.drawImage(groundMap,0,0,resolution,resolution);if(oceanSurface()){
 const settled=document.createElement('canvas');settled.width=settled.height=N;
 const settledContext=settled.getContext('2d'), image=settledContext.createImageData(N,N);
 writeOceanSurface(heights,baseSurface,sea,ocean.connected,image.data);
 settledContext.putImageData(image,0,0);
 cx.drawImage(settled,0,0,resolution,resolution);
 }if(visibleForest())cx.drawImage(forestMap,0,0,resolution,resolution);cx.scale(resolution/N,resolution/N);if(layers.shapes.visible&&view!=='height')for(let s of drawings)drawShape(cx,s);if(layers.landmarks.visible&&view!=='height')for(let m of marks)drawLandmark(cx,m);c.toBlob(b=>{download(b,slug()+'-map.png');notify(resolution+' × '+resolution+' map exported.');});};

$('erase-target').onchange=()=>{eraseTarget=$('erase-target').value;$('erase-description').textContent={forests:'Thin or clear trees without changing the ground. Opacity controls removal.',surface:'Reveal the natural terrain color. Elevation stays intact.',landmarks:'Remove whole landmarks touched by the brush. Undo to restore.',shapes:'Remove whole drawings touched by the brush. Undo to restore.'}[eraseTarget];selectTool(tool);};
function updateBrushUI(){
 document.querySelectorAll('[data-brush]').forEach(b=>{b.classList.toggle('selected',b.dataset.brush===brushPreset);b.setAttribute('aria-pressed',b.dataset.brush===brushPreset);});
 $('brush-description').textContent={soft:'Soft transitions for elevation and terrain paint.',coast:'Irregular footprint for rugged painted edges. Use Land to add or remove terrain.',hard:'Solid circular coverage with crisp edges. Useful for fills and clean boundaries.',grain:'Scattered coverage with soft edges. Works with any material; its terrain texture stays intact.'}[brushPreset];
}
function chooseBrush(preset){
 brushPreset=preset;
 selectTool(tool);
}
// D/E nudge: one slider step per press (Smooth 5%), Shift for four.
function nudgeSlider(id,dir,big){const el=$(id),step=id==='strength'&&!isHeightTool(tool)?5:+el.step||1,next=+el.value+dir*step*(big?4:1);el.value=String(Math.max(+el.min,Math.min(+el.max,Math.round(next/(+el.step||1))*(+el.step||1))));el.dispatchEvent(new el.ownerDocument.defaultView.Event('input'));}
for(const id of['wand-depth','wand-water','wand-meander'])$(id).oninput=()=>{$(id+'out').value=id==='wand-depth'?$(id).value+' blocks':$(id).value+'%';};
$('brush-presets').onclick=e=>{let b=e.target.closest('[data-brush]');if(b)chooseBrush(b.dataset.brush);};
function exitWalk(mode=walkReturnMode){
 if(!$('walk').matches('[aria-pressed="true"]'))return;
 walk=null;walkRequested=false;walkLocked=false;walkTime=null;walkKeys.clear();
 if(document.pointerLockElement===mini)document.exitPointerLock();
 $('walk').setAttribute('aria-pressed','false');
 $('walk-controls').hidden=true;
 document.querySelector('.workspace').classList.remove('is-walking');
 setMode(mode);
 $('walk').focus({preventScroll:true});
}
function updateWalk(time){
 const seconds=walkTime===null?0:Math.min(.05,Math.max(0,(time-walkTime)/1000));
 walkTime=time;
 const held=key=>Number(walkKeys.has(key));
 walk.yaw+=(held('ArrowRight')-held('ArrowLeft'))*seconds*1.65;
 walk.pitch=Math.max(-1.3,Math.min(1.3,walk.pitch+(held('ArrowUp')-held('ArrowDown'))*seconds*1.35));
 moveWalk(walk,held('KeyW')-held('KeyS'),held('KeyD')-held('KeyA'),seconds,surfaceHeights,held('Space')-Math.max(held('ShiftLeft'),held('ShiftRight')));
 if(walkKeys.size)preview();
}
$('walk').onclick=()=>{
 if(walking()){exitWalk();return;}
 walkReturnMode=workspaceMode;
 setMode('3d');
 walkRequested=true;
 $('walk').setAttribute('aria-pressed','true');
 $('walk-controls').hidden=false;
 $('orbit-controls').hidden=true;
 document.querySelector('.workspace').classList.add('is-walking');
 mini.focus({preventScroll:true});
 preview();
};
$('walk-exit').onclick=()=>exitWalk();
document.addEventListener('keydown',event=>{
 if(!walking()||event.target.closest('dialog,input,textarea,select'))return;
 if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();exitWalk();return;}
 if(movementKeys.has(event.code)&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
  event.preventDefault();event.stopImmediatePropagation();
  if(!walkKeys.size)walkTime=null;
  walkKeys.add(event.code);
  preview();
 }
},true);
document.addEventListener('keyup',event=>walkKeys.delete(event.code),true);
document.defaultView.addEventListener('blur',()=>walkKeys.clear());
document.addEventListener('pointerlockchange',()=>{
 if(document.pointerLockElement===mini){
  if(walking())walkLocked=true;
  else document.exitPointerLock();
 }else if(walkLocked)exitWalk();
});
document.addEventListener('mousemove',event=>{
 if(!walk||!walkLocked)return;
 walk.yaw+=event.movementX*.003;
 walk.pitch=Math.max(-1.3,Math.min(1.3,walk.pitch-event.movementY*.003));
 preview();
});
function setMode(mode){

 cancelRoute(false); if(down)end();orbitPointer=null;rendererOceanReady=false;workspaceMode=mode;$('map').hidden=mode==='3d';mini.hidden=mode!=='3d';glCanvas.hidden=mode!=='3d'||!gpu;$('orbit-controls').hidden=mode!=='3d';$('brush').style.display='none';brushPosition=null;document.querySelector('.workspace').classList.toggle('in-3d',mode==='3d');
 for(let key of['2d','3d']){$('mode'+key).classList.toggle('active',mode===key);$('mode'+key).setAttribute('aria-pressed',mode===key);}
 $('toolhint').textContent=mode==='3d'?'3D editing · Right-drag orbit · Space + drag pan · Middle-drag pan':'2D map · Ready to create';sceneDirty=true;resize();
}
$('mode2d').onclick=()=>walking()?exitWalk('2d'):setMode('2d');$('mode3d').onclick=()=>walking()?exitWalk('3d'):setMode('3d');
mini.onpointerdown=e=>{
 if(walking()){
  if(e.button===0&&document.pointerLockElement!==mini){
   try{mini.requestPointerLock?.()?.catch?.(()=>{});}catch{}
  }
  return;
 }
 if(e.button===2||e.altKey||orbitMode||e.button===1||tool==='pan'||spacePan&&e.button===0){if(down)end();mini.setPointerCapture(e.pointerId);orbitPointer={x:e.clientX,y:e.clientY,pan:spacePan&&e.button===0||e.button===1||(tool==='pan'&&e.button===0&&!e.altKey&&!orbitMode)};brushPosition=null;preview();return;}
 map.onpointerdown(e);
};
mini.onpointermove=e=>{
 if(walking())return;
 if(orbitPointer){let dx=e.clientX-orbitPointer.x,dy=e.clientY-orbitPointer.y;if(orbitPointer.pan){camera.panX=(camera.panX||0)+dx;camera.panY=(camera.panY||0)+dy;}else{camera.yaw+=dx*.009;camera.pitch=Math.max(.18,Math.min(1.15,camera.pitch+dy*.006));}orbitPointer.x=e.clientX;orbitPointer.y=e.clientY;preview();return;}
 map.onpointermove(e);
};
mini.onpointerup=e=>{if(orbitPointer){orbitPointer=null;preview();}else end(e);};
mini.onpointercancel=()=>{if(walking())return;orbitPointer=null;cancelStroke();};
mini.onpointerleave=()=>{if(!down&&!orbitPointer){brushPosition=null;preview();}};
mini.oncontextmenu=e=>e.preventDefault();
mini.addEventListener('wheel',e=>{e.preventDefault();if(walking()||down||orbitPointer)return;if(e.shiftKey)adjustBrush(brushDelta(e));else camera.zoom=Math.max(.5,Math.min(3,camera.zoom*(e.deltaY>0?.92:1.08)));preview();},{passive:false});
$('orbit-reset').onclick=()=>{camera={yaw:-.65,pitch:.65,zoom:1,panX:0,panY:0,size:N};preview();};
$('orbit-toggle').onclick=()=>{if(down)end();orbitMode=!orbitMode;$('orbit-toggle').setAttribute('aria-pressed',orbitMode);$('orbit-toggle').textContent=orbitMode?'Edit tools':'Orbit';brushPosition=null;preview();};
glCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();gpu=null;gpuFailed=true;glCanvas.hidden=true;sceneDirty=true;preview();});
glCanvas.addEventListener('webglcontextrestored',()=>{gpu=null;gpuFailed=false;uploadedSurfaceLayout=undefined;rendererOceanReady=false;sceneDirty=true;preview();});
$('forest-density').oninput=()=>{$('forest-densityout').value=$('forest-density').value+'%';};
function syncLiving(){const editing=down||!!orbitPointer||!!routeDraft,reduced=!!motionQuery?.matches,hidden=!!document.hidden,diagnostic=view!=='terrain'||walking(),enabled=livingPrefs.enabled&&!diagnostic&&(livingPrefs.clouds||(livingPrefs.waterMotion&&water)||(livingPrefs.vegetationMotion&&layers.forests.visible&&forestTrees.length>0));livingLoop?.setState({enabled,editing,hidden,reduced});$('living-toggle').setAttribute('aria-pressed',String(livingPrefs.enabled));$('living-toggle').classList.toggle('on',livingPrefs.enabled);$('living-options').hidden=!livingPrefs.enabled;$('living-clouds').checked=livingPrefs.clouds;$('living-water').checked=livingPrefs.waterMotion;$('living-vegetation').checked=livingPrefs.vegetationMotion;$('living-status').textContent=!livingPrefs.enabled?'Off':reduced?'Paused: reduced motion':hidden?'Paused: tab hidden':editing?'Paused while editing':diagnostic?'Paused in this view':!enabled?'Choose an effect':!livingLoop?'Animation unavailable':'Living World active';}
function livingProject(x,y,elevation=0,absolute=false){if(workspaceMode==='2d'){let t=transform();return{x:t.x+x*t.scale,y:t.y+(y-elevation*.4)*t.scale};}return projectTerrain(x,y,absolute?elevation:sampleTerrain(x,y,surfaceHeights,sea,false)+elevation,mini.clientWidth,mini.clientHeight,camera);}
const animationWindow=document.defaultView;if(typeof animationWindow?.requestAnimationFrame==='function')livingLoop=createLivingLoop({request:animationWindow.requestAnimationFrame.bind(animationWindow),cancel:animationWindow.cancelAnimationFrame.bind(animationWindow),draw:time=>drawLiving(livingContext,workspaceMode==='3d'?mini.clientWidth:map.clientWidth,workspaceMode==='3d'?mini.clientHeight:map.clientHeight,livingScene?{...livingScene,mode:workspaceMode}:null,(x,y,z,abs)=>livingProject(x,y,z,abs),time,livingPrefs),clear:()=>livingContext.clearRect(0,0,livingCanvas.width,livingCanvas.height)});
function saveLiving(){try{localStorage.setItem('landwright-living',JSON.stringify(livingPrefs));}catch{}syncLiving();scheduleFrame();}
$('living-vegetation').onchange=()=>{livingPrefs.vegetationMotion=$('living-vegetation').checked;saveLiving();};
$('living-toggle').onclick=()=>{livingPrefs.enabled=!livingPrefs.enabled;saveLiving();};$('living-clouds').onchange=()=>{livingPrefs.clouds=$('living-clouds').checked;saveLiving();};$('living-water').onchange=()=>{livingPrefs.waterMotion=$('living-water').checked;saveLiving();};function syncMotionPreferences(){syncLiving();oceanLastFrame=lastFlowFrame=null;scheduleFrame();}
document.addEventListener('visibilitychange',syncMotionPreferences);
motionQuery?.addEventListener?.('change',syncMotionPreferences);
initUI();renderLayers();renderPresets();
try{let saved=localStorage.getItem('worldpainter-project');if(saved)load(JSON.parse(saved))}catch{}ocean.initialize(heights,sea,water);selectTool(tool);historyUI();refresh();resize();
