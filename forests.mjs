import{pathField,riverField}from'./routes.mjs?v=2.9.1';
import{brushWeight}from'./brushes.mjs?v=2.9.1';
// Authoritative density is independent of surface paint. A gesture blends once
// against its starting field, so event frequency cannot amplify opacity.
export function forestStroke(field,n,cx,cy,r,{preset='soft',opacity=1,density=.65,erase=false,initial,coverage}={}){
 for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(n,cy+r);y++)for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(n,cx+r);x++){
  let i=y*n+x,w=brushWeight(x,y,cx,cy,r,preset)*opacity;if(!w||coverage&&w<=coverage[i])continue;
  if(coverage)coverage[i]=w;let start=initial?initial[i]:field[i];field[i]=Math.max(0,Math.min(1,start+((erase?0:density)-start)*w));
 }
}
// Committed route arrays are replaced, never mutated in place. Brush edits and
// layer toggles reuse the masks; route replacement/load/size changes rebuild.
export function createForestHabitatCache(){let previous=null,size=0,cached;return{get(routes,n){if(previous!==routes||size!==n){cached={paths:pathField(routes,n),riverWater:riverField(routes,n)};previous=routes;size=n;}return cached;}};}

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{let t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
function hash(x,y){let h=Math.imul(x,374761393)^Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function valueNoise(x,y){let ix=Math.floor(x),iy=Math.floor(y),u=smooth(0,1,x-ix),v=smooth(0,1,y-iy);return(hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;}
function patchNoise(x,y){return .58*valueNoise(x/13,y/13)+.28*valueNoise(x/5,y/5)+.14*valueNoise(x/2,y/2);}
// Interlocking crowns: irregular lobes, rather than a repeated symbol or grid.
function crown(x,y){let ix=Math.floor(x/1.8),iy=Math.floor(y/1.8),nearest=12;for(let yy=iy-1;yy<=iy+1;yy++)for(let xx=ix-1;xx<=ix+1;xx++){let px=(xx-.12+hash(xx+91,yy)*1.24)*1.8,py=(yy-.12+hash(xx,yy+47)*1.24)*1.8,rx=.65+hash(xx+13,yy+7)*1.1,ry=.6+hash(xx+59,yy+71)*1.05,dx=(x-px)/rx,dy=(y-py)/ry;nearest=Math.min(nearest,dx*dx+dy*dy);}return .73*Math.exp(-nearest*1.4)+.27*valueNoise(x*1.3,y*1.3);}
let spatial=null;const texturePatterns=new Map();
function spatialPattern(n){if(spatial?.n===n)return spatial;let patch=new Float32Array(n*n),height=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){let i=y*n+x;patch[i]=clamp((patchNoise(x,y)-.22)*1.5+.12*valueNoise(x/2,y/2));height[i]=.4+1.7*crown(x,y);}return spatial={n,patch,height};}
function foliagePattern(n,width){let key=n+':'+width;if(texturePatterns.has(key))return texturePatterns.get(key);let tone=new Float32Array(width*width),tint=new Float32Array(tone.length),h=new Float32Array(tone.length),scale=n/width;for(let y=0;y<width;y++)for(let x=0;x<width;x++)h[y*width+x]=crown((x+.5)*scale,(y+.5)*scale);for(let y=0;y<width;y++)for(let x=0;x<width;x++){let i=y*width+x,dx=h[y*width+Math.min(width-1,x+1)]-h[y*width+Math.max(0,x-1)],dy=h[Math.min(width-1,y+1)*width+x]-h[Math.max(0,y-1)*width+x];tone[i]=clamp(.79+h[i]*.21+(dx+dy)/scale*.19+(hash(x,y)-.5)*.08,.57,1.22);tint[i]=valueNoise(x*scale/7,y*scale/7);}let pattern={n,width,tone,tint};if(texturePatterns.size>=2)texturePatterns.delete(texturePatterns.keys().next().value);texturePatterns.set(key,pattern);return pattern;}
export function buildWoodland({n,heights,forest,sea,riverWater,paths,shade=true}){
 const pattern=spatialPattern(n),coverage=new Float32Array(n*n),height=new Float32Array(n*n),allowed=new Uint8Array(n*n),light=new Float32Array(n*n).fill(1),accents=[];let minX=n,minY=n,maxX=-1,maxY=-1;
 for(let y=2;y<n-2;y++)for(let x=2;x<n-2;x++){let i=y*n+x,h=heights[i],dx=heights[i+1]-heights[i-1],dy=heights[i+n]-heights[i-n];if(h<sea+2||riverWater?.[i]>h+.01||paths?.[i]||Math.max(Math.abs(h-heights[i-1]),Math.abs(h-heights[i+1]),Math.abs(h-heights[i-n]),Math.abs(h-heights[i+n]))>6)continue;
  allowed[i]=1;light[i]=shade?clamp(1+(dx+dy)*.04,.58,1.25):1;if(!forest[i])continue;
  let edge=clamp((Math.min(x,y,n-1-x,n-1-y)-1)/3),c=smooth(pattern.patch[i]-.14,pattern.patch[i]+.14,forest[i])*Math.min(1,forest[i]*2)*edge;coverage[i]=c;height[i]=c*pattern.height[i];if(c>0){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(c>.55&&x%4===0&&y%4===0)accents.push({x,y,size:1.2,coverage:c,phase:hash(x+93,y+11)*Math.PI*2});
 }
 let stride=Math.max(1,Math.ceil(accents.length/256));return{n,coverage,height,allowed,light,bounds:{minX,minY,maxX,maxY},accents:accents.filter((_,i)=>i%stride===0)};
}
function sample(a,n,x,y){x=clamp(x,0,n-1);y=clamp(y,0,n-1);let ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,j=iy*n+ix,k=Math.min(n-1,iy+1)*n+ix,r=ix<n-1?1:0;return(a[j]*(1-u)+a[j+r]*u)*(1-v)+(a[k]*(1-u)+a[k+r]*u)*v;}
export function renderWoodland(woodland,width=woodland.n*4){
 const {n,coverage,allowed,light}=woodland,data=new Uint8ClampedArray(width*width*4);if(!coverage.some(v=>v>0))return{width,height:width,data};let pattern=foliagePattern(n,width),scale=n/width;
 let bounds=woodland.bounds,x0=Math.max(0,Math.floor((bounds.minX-2)/scale)),x1=Math.min(width,Math.ceil((bounds.maxX+3)/scale)),y0=Math.max(0,Math.floor((bounds.minY-2)/scale)),y1=Math.min(width,Math.ceil((bounds.maxY+3)/scale));
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){let wx=(x+.5)*scale-.5,wy=(y+.5)*scale-.5,ix=Math.round(clamp(wx,0,n-1)),iy=Math.round(clamp(wy,0,n-1));if(!allowed[iy*n+ix])continue;let c=sample(coverage,n,wx,wy),shadow=sample(coverage,n,wx-.65,wy-.65)*.17*(1-c),alpha=c*.97+shadow;if(alpha<.002)continue;let i=y*width+x,t=pattern.tone[i]*sample(light,n,wx,wy),v=pattern.tint[i],j=i*4;
  // Muted moss/olive variation and contact shade, without outlines or trunks.
  data[j]=((60+v*40)*t*c*.97+24*shadow)/alpha;data[j+1]=((87+v*37)*t*c*.97+40*shadow)/alpha;data[j+2]=((39+v*18)*t*c*.97+23*shadow)/alpha;data[j+3]=alpha*255;
 }return{width,height:width,data};
}
export function woodlandSurface(ground,woodland){if(!woodland.height.some(v=>v>0))return ground;return Float32Array.from(ground,(h,i)=>Math.min(255,h+woodland.height[i]));}
