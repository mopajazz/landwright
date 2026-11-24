import{EARTHEN_MATERIALS}from'./earthen.mjs?v=2.13.0';
export const LEGACY_MATERIAL_COLORS=[[111,143,79],[193,173,127],[133,135,124],[53,94,67],[221,226,215],[137,112,79]];
export const MATERIALS=Array.from({length:9},(_,i)=>{if(i===3)return['Forest','#355e43',[53,94,67]];let m=EARTHEN_MATERIALS.find(m=>m.id===i+1);return[m.name,m.hex,m.color];});
export function noise(x,y){let v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
export function blendPaint(rgb,alpha,i,color,amount,erase=false){let a=Math.max(0,Math.min(1,amount));if(!a)return;if(erase){alpha[i]*=1-a;return;}let old=alpha[i],out=a+old*(1-a);for(let k=0;k<3;k++)rgb[i*3+k]=(color[k]*a+rgb[i*3+k]*old*(1-a))/out;alpha[i]=out;}
export function brushWeight(x,y,cx,cy,r,preset='soft'){let dx=(x-cx)/r,dy=(y-cy)/r,d=Math.hypot(dx,dy);let edge=preset==='coast'?.88+.08*Math.sin(Math.atan2(dy,dx)*7)+.06*Math.sin(Math.atan2(dy,dx)*13):1;if(d>=edge)return 0;if(preset==='hard')return 1;let w=preset==='coast'?Math.min(1,(edge-d)*8):(1-d*d)**2;if(preset==='grain')w*=noise(x,y)>.57?.75:.05;return w;}
export function coastStroke(a,n,cx,cy,r,sea,opacity,erase=false){const cutDepth=Math.min(18,sea/2);
  const target=Math.max(0,Math.min(255,sea+(erase?-cutDepth:22)));for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(n,cy+r);y++)for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(n,cx+r);x++){let w=brushWeight(x,y,cx,cy,r,'coast')*opacity;if(!w)continue;let i=y*n+x;if(erase?a[i]>target:a[i]<target)a[i]+=(target-a[i])*w;}}
