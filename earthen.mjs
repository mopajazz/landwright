import{rasterFrame}from'./raster-cache.mjs?v=2.11.0';
import {MATERIAL_IDS} from './material-paint.mjs?v=2.11.0';

export const EARTHEN_MATERIALS = [
  [1,'grass','Grass','Living ground',[105,125,72]],
  [6,'loam','Loam','Soils',[126,94,65]],
  [7,'clay','Clay','Soils',[162,113,85]],
  [3,'bedrock','Bedrock','Stone',[137,140,130]],
  [8,'scree','Scree','Stone',[145,137,121]],
  [9,'mud','Mud','Wet ground',[100,88,65]],
  [2,'sand','Sand','Dry & cold',[194,174,125]],
  [5,'snow','Snow','Dry & cold',[221,226,217]]
].map(([id,key,name,family,color])=>({id,key,name,family,color,hex:'#'+color.map(v=>v.toString(16).padStart(2,'0')).join('')}));
const colors = MATERIAL_IDS.map(id=>EARTHEN_MATERIALS.find(m=>m.id===id).color);
const clamp = (v,min=0,max=1)=>Math.max(min,Math.min(v,max));
const mix = (a,b,t)=>a+(b-a)*t;
const size=128, mask=size-1, tau=2*Math.PI;
let cachedPattern;

// A periodic, quarter-cell sample atlas. Construct the costly Voronoi fields once.
function pattern() {
  if(cachedPattern) return cachedPattern;
  function hash(x,y,seed){
    let h=Math.imul(x,374761393)+Math.imul(y,668265263)+seed;
    h=Math.imul(h^(h>>>13),1274126177);
    return ((h^(h>>>16))>>>0)/4294967296;
  }
  const field=()=>new Float32Array(size*size);
  const grain=field(), mid=field(), tuft=field(), crack=field(), rubble=field();
  function noise(x,y,nx,ny,seed){
    x=x*nx/size;y=y*ny/size;
    const ix=Math.floor(x),iy=Math.floor(y);
    let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);
    const at=(dx,dy)=>hash((ix+dx)%nx,(iy+dy)%ny,seed);
    return mix(mix(at(0,0),at(1,0),u),mix(at(0,1),at(1,1),u),v);
  }
  function cells(x,y,count,stone){
    x=x*count/size;y=y*count/size;
    let first=Infinity, second=Infinity, face=0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const cx=Math.floor(x)+i,cy=Math.floor(y)+j;
      const px=(cx+count)%count,py=(cy+count)%count;
      const dx=x-cx-.15-hash(px,py,91)*.7,dy=y-cy-.15-hash(px,py,777)*.7;
      const d=dx*dx+dy*dy;
      if(d<first){second=first;first=d;face=(hash(px,py,3911)-.45)*.48+clamp(-dx-dy,-.3,.3)*.5;}
      else if(d<second)second=d;
    }
    const edge=Math.sqrt(second)-Math.sqrt(first);
    return stone?clamp((edge-.045)/.12)*face-(edge<.025?.07:0):1-clamp(edge/.075);
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=y*size+x;
    grain[i]=noise(x,y,59,61,999);
    mid[i]=noise(x,y,7,9,700);
    tuft[i]=noise(x,y,31,13,400)**3;
    crack[i]=cells(x,y,9,false);rubble[i]=cells(x,y,23,true);
  }
  return cachedPattern={grain,mid,tuft,crack,rubble};
}

function context(s){
  const {n,heights,sea,rawRiverWater=s.riverWater,paintAlpha,weights,surfaceVisible=true}=s;
  const length=n*n, wet=new Float32Array(length),slope=new Float32Array(length),shelter=new Float32Array(length),light=new Float32Array(length);
  const coverage=new Float32Array(length*8),active=new Uint8Array(length);
  // Two city-block distance sweeps suffice for the short damp shoreline band.
  for(let i=0;i<length;i++){
    wet[i]=heights[i]<sea||rawRiverWater?.[i]>heights[i]+.01?0:12;
    if(i%n)wet[i]=Math.min(wet[i],wet[i-1]+1);
    if(i>=n)wet[i]=Math.min(wet[i],wet[i-n]+1);
  }
  for(let i=length-1;i>=0;i--){
    const x=i%n,h=heights[i];
    if(x<n-1)wet[i]=Math.min(wet[i],wet[i+1]+1);
    if(i+n<length)wet[i]=Math.min(wet[i],wet[i+n]+1);
    const l=heights[x?i-1:i],r=heights[x<n-1?i+1:i],u=heights[i<n?i:i-n],d=heights[i+n<length?i+n:i];
    slope[i]=clamp(Math.hypot(r-l,d-u)/25);
    shelter[i]=clamp(.45+(r+l+u+d-4*h)*.075);
    light[i]=s.shade!==false&&s.elevationVisible!==false?clamp(1+(r-l+d-u)*.055,.47,1.4):1;
    const natural=h<sea+4?1:h>180?3:h>145?2:0;
    const a=surfaceVisible?(paintAlpha?.[i]??0):0;
    for(let k=0;k<8;k++){
      const value=(k===natural?1-a:0)+(surfaceVisible?(weights?.[i*8+k]??0)/255:0);
      coverage[i*8+k]=value;
      if(value)active[i]|=1<<k;
    }
  }
  for(let i=0;i<length;i++){
    wet[i]=clamp(.60*(1-wet[i]/12)+clamp((sea+30-heights[i])/55)*.4+shelter[i]*.34-slope[i]*.12);
  }
  return {wet,slope,shelter,light,coverage,active};
}

function pigment(k,f,atlas,p,out){
  const base=colors[k],g=atlas.grain[p],m=atlas.mid[p],{slope,shelter,wet,x,y,h,low}=f;
  let r=base[0],b=base[2],v=base[1],t;
  let tone=1+(low-.5)*.12+(m-.5)*.07+(g-.5)*.07;
  switch(MATERIAL_IDS[k]){
    case 1:
      t=clamp(.3+shelter*.65-slope*.2);
      r=mix(146,91,t);v=mix(139,115,t);b=mix(86,66,t);
      tone+=(atlas.tuft[p]-.2)*.16;break;
    case 2:
      tone+=Math.sin(y*1.15+x*.18+h*.24+low*8)*.045;
      t=wet*.24;r=mix(r,145,t);v=mix(v,137,t);b=mix(b,100,t);break;
    case 3:
      t=(1+Math.sin((h*.16+x*.027+y*.008+low*.35)*tau))*.5;
      r=mix(117,158,t*.45);v=mix(126,155,t*.45);b=mix(119,137,t*.45);
      tone+=g*.055-shelter*.06-t**16*.12;break;
    case 5:
      t=clamp((.78+shelter*.38-slope*.3-clamp((h-150)/100)*.3+(low-.5)*.3-.5)*3);
      r=mix(133,r,t);v=mix(139,v,t);b=mix(131,b,t);
      t=shelter*.035;r=mix(r,159,t);v=mix(v,182,t);b=mix(b,188,t);
      tone+=(g-.5)*.02;break;
    case 6:
      tone+=(g-.5)*.16-shelter*.065;
      if(g>.78){r=mix(r,164,.35);v=mix(v,139,.35);b=mix(b,104,.35);}
      break;
    case 7:
      t=wet*.4;r=mix(r,123,t);v=mix(v,99,t);b=mix(b,77,t);
      tone+=(g-.5)*.015-atlas.crack[p]*clamp(1-wet*1.15)*.27;break;
    case 8:
      t=clamp(.32+shelter*.8-slope*.26);
      r=mix(125,154,t);v=mix(127,143,t);b=mix(116,124,t);
      tone+=atlas.rubble[p]*t;break;
    case 9:
      r=mix(123,77,wet);v=mix(107,78,wet);b=mix(79,60,wet);
      tone+=Math.sin(y*1.04+x*.14+m*7)*.018;
      t=clamp(Math.sin(y*.78+x*.1+low*8))**28*wet*(1-slope)*.14;
      r=mix(r,147,t);v=mix(v,164,t);b=mix(b,145,t);break;
  }
  out[0]=r*tone-base[0];out[1]=v*tone-base[1];out[2]=b*tone-base[2];
}

function interpolate(values,a,b,c,d,wa,wb,wc,wd){
  return values[a]*wa+values[b]*wb+values[c]*wc+values[d]*wd;
}

export function renderEarthen(s){
  const {n,heights,sea,baseColors,riverWater,water=true,view='terrain',oceanOpaque}=s;
  const width=clamp(Math.round(s.resolution??n),1,2048),height=width;
  const terrain=view==='terrain',ctx=terrain?context(s):null,atlas=terrain?pattern():null;
  const {data,bounds}=rasterFrame(s.cache,n,width,[heights,baseColors,...(oceanOpaque?[oceanOpaque]:[]),...(riverWater?[riverWater]:[]),...(ctx?Object.values(ctx):[])],`${view}|${water}|${sea}|${!!oceanOpaque}`);
  const out=[0,0,0],f={x:0,y:0,h:0,low:0,slope:0,shelter:0,wet:0};
  for(let py=bounds.y0;py<bounds.y1;py++){
    const y=clamp((py+.5)*n/height-.5,0,n-1),iy=Math.floor(y),v=y-iy;
    for(let px=bounds.x0;px<bounds.x1;px++){
      const x=clamp((px+.5)*n/width-.5,0,n-1),ix=Math.floor(x),u=x-ix;
      const a=iy*n+ix,b=ix+1<n?a+1:a,c=iy+1<n?a+n:a,d=c+(b-a);
      const wa=(1-u)*(1-v),wb=u*(1-v),wc=(1-u)*v,wd=u*v;
      const a4=a*4,b4=b*4,c4=c*4,d4=d*4;
      let red=interpolate(baseColors,a4,b4,c4,d4,wa,wb,wc,wd);
      let green=interpolate(baseColors,a4+1,b4+1,c4+1,d4+1,wa,wb,wc,wd);
      let blue=interpolate(baseColors,a4+2,b4+2,c4+2,d4+2,wa,wb,wc,wd);
      const nearest=Math.round(y)*n+Math.round(x);
      const underwater=water&&((oceanOpaque?oceanOpaque[nearest]:heights[nearest]<sea)||riverWater?.[nearest]>heights[nearest]+.01);
      if(terrain&&!underwater){
        // Ignore zero-weight neighbors to keep full-resolution single-cell draws cheap.
        let channels=ctx.active[a]|(wb?ctx.active[b]:0)|(wc?ctx.active[c]:0)|(wd?ctx.active[d]:0);
        if(channels){
          f.x=x;f.y=y;f.h=interpolate(heights,a,b,c,d,wa,wb,wc,wd);
          f.slope=interpolate(ctx.slope,a,b,c,d,wa,wb,wc,wd);
          f.wet=interpolate(ctx.wet,a,b,c,d,wa,wb,wc,wd);
          f.shelter=interpolate(ctx.shelter,a,b,c,d,wa,wb,wc,wd);
          const p=(Math.floor(y*4)&mask)*size+(Math.floor(x*4)&mask);
          f.low=atlas.mid[(Math.floor(y*.73)&mask)*size+(Math.floor(x*.73)&mask)];
          const light=interpolate(ctx.light,a,b,c,d,wa,wb,wc,wd);
          while(channels){
            const k=31-Math.clz32(channels&-channels);
            channels&=channels-1;
            const amount=interpolate(ctx.coverage,a*8+k,b*8+k,c*8+k,d*8+k,wa,wb,wc,wd)*light;
            pigment(k,f,atlas,p,out);
            red+=out[0]*amount;green+=out[1]*amount;blue+=out[2]*amount;
          }
        }
      }
      const offset=(py*width+px)*4;
      data[offset]=red;data[offset+1]=green;data[offset+2]=blue;data[offset+3]=interpolate(baseColors,a4+3,b4+3,c4+3,d4+3,wa,wb,wc,wd);
    }
  }
  return {width,height,data,bounds};
}
