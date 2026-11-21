// Visual-only atmosphere: never writes terrain, paint, routes, or project history.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=i=>{let v=Math.sin(i*127.1+19.19)*43758.5453;return v-Math.floor(v);};
export function isWet(s,x,y){if(!s.water||s.view!=='terrain'||x<0||y<0||x>s.n-1||y>s.n-1)return false;let i=Math.round(y)*s.n+Math.round(x);return (s.oceanCoverage ? s.oceanCoverage[i]>.95 : s.heights[i]<s.sea)||(s.riversVisible&&s.riverWater[i]>s.heights[i]+.01);}
// Smooth value noise in 0..1, used to cluster water marks into patches.
function valueNoise(x,y,seed){let xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),h=(a,b)=>hash(a*157.3+b*311.9+seed);return (h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v;}
const SWELL={x:.2,y:.98};// direction crests travel (south, slightly east)
const MAX_CRESTS=260,MAX_GLINTS=140;
// Water marks are placed on a jittered lattice, thinned by patch noise and
// subsampled evenly across the map, so they never read as a grid.
export function buildLivingScene(scene){let target=scene.oceanTarget?{...scene,oceanCoverage:scene.oceanTarget}:scene,n=scene.n,step=Math.max(2,Math.round(n/40)),crests=[],glints=[];
 for(let gy=0;gy<n;gy+=step)for(let gx=0;gx<n;gx+=step){let id=gy*n+gx,x=gx+hash(id+3)*step,y=gy+hash(id+7)*step;if(!isWet(target,x,y))continue;
  let patch=valueNoise(x/(step*4.5),y/(step*4.5),11);
  if(patch>.42&&hash(id+13)<.35+patch*.6){let angle=(valueNoise(x/(step*9),y/(step*9),29)-.5)*.7+(hash(id+17)-.5)*.35,len=step*(.55+hash(id+19)*.9)*(.7+patch*.6);crests.push({x,y,len,dx:Math.cos(angle),dy:Math.sin(angle),bend:.025+hash(id+23)*.05,period:5+hash(id+29)*5,offset:hash(id+31)*10,peak:.1+hash(id+37)*.15,rank:hash(id+41)});}
  if(hash(id+43)<.22)glints.push({x:x+hash(id+47)*step*.5,y:y+hash(id+53)*step*.5,period:2.2+hash(id+59)*2.6,offset:hash(id+61)*5,size:.7+hash(id+67)*.7,rank:hash(id+71)});}
 const even=(list,max)=>list.length<=max?list:list.sort((a,b)=>a.rank-b.rank).slice(0,max);
 return{...scene,crests:even(crests,MAX_CRESTS),glints:even(glints,MAX_GLINTS),rivers:scene.riversVisible?scene.routes.filter(r=>r.type==='river'):[]};}
export function createLivingLoop({request=globalThis.requestAnimationFrame,cancel=globalThis.cancelAnimationFrame,draw,clear,now=()=>performance.now()}){let state={enabled:false,editing:false,hidden:false,reduced:false},pending=null,last=null,elapsed=0;const running=()=>state.enabled&&!state.editing&&!state.hidden&&!state.reduced;function frame(stamp){pending=null;if(!running())return;let t=Number.isFinite(stamp)?stamp:now();if(last===null)last=t-34;if(t-last>=1000/30){elapsed+=Math.min(100,Math.max(0,t-last))/1000;last=t;draw(elapsed);}if(running())pending=request(frame);}return{setState(next){state={...state,...next};if(running()){if(pending===null)pending=request(frame);}else{if(pending!==null)cancel(pending);pending=null;last=null;clear();}},get active(){return running();}};}
export function drawLiving(c,w,h,s,project,time,prefs){c.clearRect(0,0,w,h);if(!s||s.view!=='terrain')return;c.save();c.lineCap='round';
 if(prefs.waterMotion&&s.water){drawWaterMarks(c,s,project,time);c.strokeStyle='#d8f4ec';c.lineWidth=1;
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

// Wave crests: tapered, slightly curved lenses that fade in, drift along the
// swell and fade out on their own cycle. Glints: brief sparkles.
function drawWaterMarks(c,s,project,time){
 c.fillStyle='#e4f3ef';
 for(let k of s.crests||[]){let u=((time+k.offset)/k.period)%1,alpha=k.peak*Math.sin(Math.PI*u)**2;if(alpha<.01)continue;
  let drift=(u-.5)*1.1,cx=k.x+SWELL.x*drift,cy=k.y+SWELL.y*drift,hx=k.dx*k.len/2,hy=k.dy*k.len/2;
  if(!isWet(s,cx-hx,cy-hy)||!isWet(s,cx+hx,cy+hy)||!isWet(s,cx,cy))continue;
  let a=project(cx-hx,cy-hy),b=project(cx+hx,cy+hy),m=project(cx+SWELL.x*k.len*k.bend,cy+SWELL.y*k.len*k.bend);
  let ex=b.x-a.x,ey=b.y-a.y,el=Math.hypot(ex,ey);if(!(el>.5))continue;
  // Thickness in screen pixels so crests stay legible at every zoom.
  let t=Math.min(2.2,.9+el*.035),nx=-ey/el*t,ny=ex/el*t,qx=2*m.x-(a.x+b.x)/2,qy=2*m.y-(a.y+b.y)/2;
  c.globalAlpha=alpha;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(qx,qy,b.x,b.y);c.quadraticCurveTo(qx+nx,qy+ny,a.x,a.y);c.fill();}
 c.fillStyle='#fbfffd';
 for(let g of s.glints||[]){let u=((time+g.offset)/g.period)%1,alpha=.5*Math.max(0,Math.sin(Math.PI*2*u))**14;if(alpha<.02||!isWet(s,g.x,g.y))continue;
  let p=project(g.x,g.y);c.globalAlpha=alpha;c.beginPath();c.ellipse(p.x,p.y,g.size*1.5,g.size*.42,0,0,Math.PI*2);c.fill();}
 c.globalAlpha=1;}
