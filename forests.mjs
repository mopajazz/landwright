import{pathField,riverField}from'./routes.mjs?v=2.3.0';
import{brushWeight,noise}from'./brushes.mjs?v=2.3.0';
// Authoritative density is independent of surface paint. A gesture blends once
// against its starting field, so event frequency cannot amplify opacity.
export function forestStroke(field,n,cx,cy,r,{preset='soft',opacity=1,density=.65,erase=false,initial,coverage}={}){
 for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(n,cy+r);y++)for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(n,cx+r);x++){
  let i=y*n+x,w=brushWeight(x,y,cx,cy,r,preset)*opacity;if(!w||coverage&&w<=coverage[i])continue;
  if(coverage)coverage[i]=w;let start=initial?initial[i]:field[i];field[i]=Math.max(0,Math.min(1,start+((erase?0:density)-start)*w));
 }
}
export function buildForest({n,heights,forest,sea,riverWater,paths}){
 let trees=[];for(let y=3;y<n-3;y+=4)for(let x=3;x<n-3;x+=4){
  let px=x+(noise(x+15,y)-.5)*1.6,py=y+(noise(x,y+83)-.5)*1.6,ix=Math.round(px),iy=Math.round(py),i=iy*n+ix,h=heights[i];
  if(!forest[i]||noise(x+41,y+37)>=forest[i]||h<sea+2||riverWater?.[i]>h+.01||paths?.[i])continue;
  if(Math.max(Math.abs(h-heights[i-1]),Math.abs(h-heights[i+1]),Math.abs(h-heights[i-n]),Math.abs(h-heights[i+n]))>6)continue;
  trees.push({type:noise(x+9,y+6)>.46?'forest-pine':'forest-oak',x:px,y:py,size:5.5+noise(x,y)*1.5,opacity:1,phase:noise(x+93,y+11)*Math.PI*2});
 }return trees;
}
// Original symbols, shared by map composition and the GPU/Canvas sprite atlas.
export function drawForestSymbol(c,m){c.save();c.translate(m.x,m.y);c.scale(m.size/12,m.size/12);c.lineWidth=.65;c.lineJoin='round';c.strokeStyle='#173d2b';c.fillStyle='#68583b';c.fillRect(-.7,2,1.4,4);c.fillStyle=m.type==='forest-pine'?'#365e40':'#4e7443';c.beginPath();
 if(m.type==='forest-pine'){c.moveTo(0,-7);c.lineTo(3,-2);c.lineTo(1.7,-2);c.lineTo(4,2);c.lineTo(2.5,2);c.lineTo(4.5,4);c.lineTo(-4.5,4);c.lineTo(-2.5,2);c.lineTo(-4,2);c.lineTo(-1.7,-2);c.lineTo(-3,-2);c.closePath();}
 else{c.arc(-2,-1,3,0,Math.PI*2);c.arc(1,-3,3.5,0,Math.PI*2);c.arc(3,0,2.8,0,Math.PI*2);c.arc(0,1,3.5,0,Math.PI*2);}
 c.fill();c.stroke();c.strokeStyle='#a0b777';c.lineWidth=.65;c.beginPath();c.moveTo(-1,-4);c.lineTo(-2,-2);c.moveTo(-1,0);c.lineTo(-2,1);c.stroke();c.restore();}

// Committed route arrays are replaced, never mutated in place. Brush edits and
// layer toggles reuse the masks; route replacement/load/size changes rebuild.
export function createForestHabitatCache(){let previous=null,size=0,cached;return{get(routes,n){if(previous!==routes||size!==n){cached={paths:pathField(routes,n),riverWater:riverField(routes,n)};previous=routes;size=n;}return cached;}};}
