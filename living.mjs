// Visual-only atmosphere: never writes terrain, paint, routes, or project history.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=i=>{let v=Math.sin(i*127.1+19.19)*43758.5453;return v-Math.floor(v);};
export function isWet(s,x,y){if(!s.water||s.view!=='terrain'||x<0||y<0||x>s.n-1||y>s.n-1)return false;let i=Math.round(y)*s.n+Math.round(x);return (s.oceanCoverage ? s.oceanCoverage[i]>.95 : s.heights[i]<s.sea)||(s.riversVisible&&s.riverWater[i]>s.heights[i]+.01);}
export function buildLivingScene(scene){let waves=[],target=scene.oceanTarget?{...scene,oceanCoverage:scene.oceanTarget}:scene,step=Math.max(2,Math.ceil(scene.n/32));for(let y=1;y<scene.n-1;y+=step)for(let x=1;x<scene.n-1;x+=step){let i=y*scene.n+x;if(isWet(target,x-1,y)&&isWet(target,x+1,y)&&hash(i)>.25)waves.push({x,y,phase:hash(i+11)*Math.PI*2});}return{...scene,waves:waves.slice(0,384),rivers:scene.riversVisible?scene.routes.filter(r=>r.type==='river'):[]};}
export function createLivingLoop({request=globalThis.requestAnimationFrame,cancel=globalThis.cancelAnimationFrame,draw,clear,now=()=>performance.now()}){let state={enabled:false,editing:false,hidden:false,reduced:false},pending=null,last=null,elapsed=0;const running=()=>state.enabled&&!state.editing&&!state.hidden&&!state.reduced;function frame(stamp){pending=null;if(!running())return;let t=Number.isFinite(stamp)?stamp:now();if(last===null)last=t-34;if(t-last>=1000/30){elapsed+=Math.min(100,Math.max(0,t-last))/1000;last=t;draw(elapsed);}if(running())pending=request(frame);}return{setState(next){state={...state,...next};if(running()){if(pending===null)pending=request(frame);}else{if(pending!==null)cancel(pending);pending=null;last=null;clear();}},get active(){return running();}};}
export function drawLiving(c,w,h,s,project,time,prefs){c.clearRect(0,0,w,h);if(!s||s.view!=='terrain')return;c.save();c.lineCap='round';
 if(prefs.waterMotion&&s.water){c.strokeStyle='#d8f4ec';c.lineWidth=1;for(let p of s.waves){if(!isWet(s,p.x-1,p.y)||!isWet(s,p.x+1,p.y))continue;let phase=time*.9+p.phase,alpha=.08+.16*(.5+.5*Math.sin(phase));c.globalAlpha=alpha;let a=project(p.x-1,p.y),b=project(p.x+1,p.y+.15*Math.sin(phase));c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
  // Route points are ordered source→mouth. Each particle advances in that direction.
  let per=Math.max(1,Math.min(8,Math.floor(128/Math.max(1,s.rivers.length))));for(let r of s.rivers)for(let j=0;j<per;j++){let t=(time*.035+j/per)%1,index=t*(r.points.length-1),k=Math.floor(index),a=r.points[k],b=r.points[Math.min(k+1,r.points.length-1)],u=index-k,x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;if(!isWet(s,x,y)||!isWet(s,x+dx/len,y+dy/len))continue;let p=project(x,y),q=project(x+dx/len,y+dy/len);c.globalAlpha=.35;c.lineWidth=1.4;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
 }
 if(prefs.vegetationMotion&&s.trees?.length){let step=Math.max(1,Math.ceil(s.trees.length/256));c.fillStyle='#aebd81';c.globalAlpha=.075;for(let i=0;i<s.trees.length;i+=step){let tree=s.trees[i],sway=Math.sin(time*1.2+tree.phase)*.22,p=project(tree.x+sway,tree.y,0),q=project(tree.x+sway+.45,tree.y,0),radius=clamp(Math.hypot(q.x-p.x,q.y-p.y),.55,2.2);c.beginPath();c.ellipse(p.x,p.y,radius,radius*.5,0,0,Math.PI*2);c.fill();}}
 if(prefs.clouds)drawClouds(c,s,project,time);
 c.restore();}

// ---------------------------------------------------------------------------
// Clouds: soft cumulus sprites painted once per cloud and cached, then drawn
// with a ground-projected shadow. Visual only; never touches scene data.
const CLOUD_COUNT=6,CLOUD_ALTITUDE=185,SUN={x:.5,y:.38};
const seeded=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
// Deterministic cloud positions in map cells. Clouds drift east with a slight
// southward component and fade out before they leave the map, so the wrap is
// never visible.
export function cloudField(n,time){let out=[];for(let i=0;i<CLOUD_COUNT;i++){let r=n*(.075+hash(i+77)*.06),speed=n*.0035*(.75+hash(i+91)*.5),span=n+r*2.4,x=((hash(i+40)*span+time*speed)%span)-r*1.2,y=r*.6+hash(i+64)*(n-r*1.2)+Math.sin(time*.02+i)*r*.08,edge=Math.min(x,n-1-x,y,n-1-y),alpha=smooth((edge+r*.35)/(r*1.3));out.push({seed:i,x,y,r,alpha,breathe:1+.018*Math.sin(time*.25+hash(i+5)*6.28)});}return out;}
const sprites=new Map();
function makeCanvas(w,h){if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(w,h);let d=globalThis.document;if(!d?.createElement)return null;let c=d.createElement('canvas');c.width=w;c.height=h;return c;}
function gradient(g,stops){if(!g||typeof g.addColorStop!=='function')return null;for(let[o,col]of stops)g.addColorStop(o,col);return g;}
// Cumulus layout: a row of puffs along a flat base, two or three towers
// stacked above it, and filler puffs that knit the silhouette together.
function puffs(seed,W,H){let rnd=seeded(seed*7919+17),base=H*.72,list=[],left=W*(.14+rnd()*.05),right=W*(.86-rnd()*.05),span=right-left;
 let row=5+Math.floor(rnd()*2);for(let k=0;k<row;k++){let u=(k+.5)/row,cx=left+span*u+(rnd()-.5)*span/row*.5,end=Math.min(u,1-u)*2,r=H*(.12+.07*end+.03*rnd());cx+=(u<.5?1:-1)*(1-end)*r*.55;list.push({cx,cy:base-r*.42,r});}
 let towers=1+Math.floor(rnd()*2);for(let t=0;t<towers;t++){let tu=.36+.28*(towers===1?.5:t/(towers-1))+(rnd()-.5)*.1,height=.55+.45*(1-Math.abs(tu-.5)*2)*rnd()+.25*rnd(),levels=2+Math.floor(height*2);for(let l=0;l<levels;l++){let r=H*(.22+.07*rnd())*(1-l*.12),cx=left+span*tu+(rnd()-.5)*r*.9,cy=base-H*(.17+l*.095*height+.03*rnd());list.push({cx,cy,r});}}
 // Shoulders bridge the towers to the base so the crown reads as one mass.
 for(let k=0;k<3;k++){let u=.3+.4*(k/2)+(rnd()-.5)*.08,r=H*(.19+.05*rnd());list.push({cx:left+span*u,cy:base-H*(.2+.04*rnd()),r});}
 for(let k=0;k<4;k++){let u=.22+.56*rnd(),r=H*(.14+.06*rnd());list.push({cx:left+span*u,cy:base-H*(.1+.12*rnd()),r});}
 return{base,list:list.sort((a,b)=>b.cy-a.cy)};}
function cloudSprite(seed){if(sprites.has(seed))return sprites.get(seed);let W=640,H=400,body=makeCanvas(W,H),shade=makeCanvas(W,H),result=null;try{let c=body?.getContext('2d'),sc=shade?.getContext('2d');if(c&&sc){let{base,list}=puffs(seed,W,H),ok=true;
  // 1. Opaque body with soft edges: overlaps cannot form seams.
  for(let p of list){let g=gradient(c.createRadialGradient(p.cx,p.cy,0,p.cx,p.cy,p.r),[[0,'rgba(236,240,243,1)'],[.5,'rgba(233,237,241,1)'],[.8,'rgba(230,234,239,.6)'],[1,'rgba(230,234,239,0)']]);if(!g){ok=false;break;}c.fillStyle=g;c.beginPath();c.arc(p.cx,p.cy,p.r,0,Math.PI*2);c.fill();}
  if(ok){c.globalCompositeOperation='source-atop';
   // 2. Cool shade on the underside and in the creases between puffs.
   let under=gradient(c.createLinearGradient(0,base-H*.42,0,base+H*.05),[[0,'rgba(150,166,182,0)'],[.6,'rgba(146,162,180,.5)'],[1,'rgba(122,138,158,.8)']]);c.fillStyle=under;c.fillRect(0,0,W,H);
   // 3. Crescent shade under each puff defines the billows.
   for(let p of list){let cx=p.cx+p.r*.2,cy=p.cy+p.r*.3,g=gradient(c.createRadialGradient(cx,cy,p.r*.45,cx,cy,p.r*1.05),[[0,'rgba(118,134,154,0)'],[.72,'rgba(118,134,154,.16)'],[1,'rgba(118,134,154,0)']]);c.fillStyle=g;c.beginPath();c.arc(cx,cy,p.r*1.05,0,Math.PI*2);c.fill();}
   // 4. Each puff catches the sun from the upper left.
   for(let p of list){let hx=p.cx-p.r*SUN.x*.55,hy=p.cy-p.r*SUN.y*1.05,hr=p.r*.95,g=gradient(c.createRadialGradient(hx,hy,0,hx,hy,hr),[[0,'rgba(255,255,253,.85)'],[.45,'rgba(255,255,252,.5)'],[1,'rgba(255,255,252,0)']]);c.fillStyle=g;c.beginPath();c.arc(hx,hy,hr,0,Math.PI*2);c.fill();}
   // 5. Feather the flat base.
   c.globalCompositeOperation='destination-out';let cut=gradient(c.createLinearGradient(0,base-H*.04,0,base+H*.14),[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,1)']]);c.fillStyle=cut;c.fillRect(0,base-H*.04,W,H);c.globalCompositeOperation='source-over';
   // Shadow: the same silhouette, softer and wider.
   for(let p of list){let g=gradient(sc.createRadialGradient(p.cx,p.cy,0,p.cx,p.cy,p.r*1.25),[[0,'rgba(16,28,34,.5)'],[.6,'rgba(16,28,34,.32)'],[1,'rgba(16,28,34,0)']]);sc.fillStyle=g;sc.beginPath();sc.arc(p.cx,p.cy,p.r*1.25,0,Math.PI*2);sc.fill();}
   result={body,shade,W,H,base};}}}catch{result=null;}
 sprites.set(seed,result);return result;}
function drawClouds(c,s,project,time){if(!s.n)return;let field=cloudField(s.n,time).filter(k=>k.alpha>.01),items=[];
 for(let k of field){let sprite=cloudSprite(k.seed);if(!sprite)continue;let sx=k.r*SUN.x*1.35,sy=k.r*SUN.y*1.35,ground=project(k.x+sx,k.y+sy,0),ax=project(k.x+sx+k.r,k.y+sy,0),ay=project(k.x+sx,k.y+sy+k.r,0);
  let top=s.mode==='3d'?project(k.x,k.y,CLOUD_ALTITUDE,true):project(k.x,k.y,0),edge=s.mode==='3d'?project(k.x+k.r,k.y,CLOUD_ALTITUDE,true):project(k.x+k.r,k.y,0),edge2=s.mode==='3d'?project(k.x,k.y+k.r,CLOUD_ALTITUDE,true):edge;
  let pts=[ground,ax,ay,top,edge,edge2];if(!pts.every(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)))continue;
  let px=Math.max(Math.hypot(edge.x-top.x,edge.y-top.y),Math.hypot(edge2.x-top.x,edge2.y-top.y));items.push({k,sprite,ground,ax,ay,top,px});}
 // Shadows first, mapped onto the ground plane so they foreshorten in 3D.
 for(let it of items){let{k,sprite,ground,ax,ay}=it,w=k.r*2.4*k.breathe,scale=w/sprite.W;c.save();c.globalAlpha=.42*k.alpha;c.transform((ax.x-ground.x)/k.r*scale,(ax.y-ground.y)/k.r*scale,(ay.x-ground.x)/k.r*scale,(ay.y-ground.y)/k.r*scale,ground.x,ground.y);c.drawImage(sprite.shade,-sprite.W/2,-sprite.base*.92,sprite.W,sprite.H);c.restore();}
 // Bodies as billboards, far to near.
 items.sort((a,b)=>a.top.y-b.top.y);for(let it of items){let{k,sprite,top,px}=it,w=px*(s.mode==='3d'?3.1:2.4)*k.breathe,h=w*sprite.H/sprite.W;c.save();c.globalAlpha=.92*k.alpha;c.drawImage(sprite.body,top.x-w/2,top.y-h*sprite.base/sprite.H,w,h);c.restore();}}
