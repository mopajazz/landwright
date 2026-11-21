import{brushWeight}from'./brushes.mjs?v=2.9.2-walk.1';
export function generate(n,seed=42,{shape="island",relief=1}={}){if(shape==='flat')return new Float32Array(n*n).fill(80);let hash=(x,y)=>{let v=Math.sin(x*127.1+y*311.7+seed*0.79)*43758.5453;return v-Math.floor(v)};let noise=(x,y)=>{let a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(a,b)*(1-u)+hash(a+1,b)*u)*(1-v)+(hash(a,b+1)*(1-u)+hash(a+1,b+1)*u)*v};let data=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){let u=x/n*2-1,v=y/n*2-1;let angle=Math.atan2(v,u),radius=Math.hypot(u*1.04,v);let coast=.74+.09*Math.sin(angle*3+1)+.05*Math.sin(angle*7);let f=noise(x/n*4,y/n*4)*.55+noise(x/n*9,y/n*9)*.27+noise(x/n*22,y/n*22)*.12+noise(x/n*60,y/n*60)*.06;let mask=coast-radius;
if(shape==='continent')mask=.85-Math.hypot(u*.72+.13,v*.91)+.12*Math.sin(v*7+u*3);
if(shape==='archipelago'){mask=.22-Math.hypot(u+.06,v-.02);for(let j=0;j<6;j++){let a=j*Math.PI/3+seed*.1,cx=Math.cos(a)*(.63+(j%2)*.07),cy=Math.sin(a)*(.63+(j%2)*.07);mask=Math.max(mask,.17+(j%3)*.022-Math.hypot(u-cx,v-cy));}mask*=1.7;}
if(shape==='atoll')mask=.16-Math.abs(radius-(.55+.04*Math.sin(angle*5)));
let z=62+mask*155+(f-.48)*155;
if(shape==='archipelago')z=62+mask*155+(f-.48)*70;
if(shape==='atoll')z=62+mask*250+(f-.48)*60;
if(shape==='blank')z=30;else if(z>62)z=62+(z-62)*relief;
data[y*n+x]=Math.max(10,Math.min(250,z));}return data;}
export function stroke(a,n,cx,cy,r,p,tool,target=100,{preserveBoundary=true,preset='soft'}={}){let original=tool==='smooth'?a.slice():a;for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(n,cy+r);y++)for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(n,cx+r);x++){let d=Math.hypot(x-cx,y-cy)/r;if(d>=1)continue;let i=y*n+x,w=brushWeight(x,y,cx,cy,r,preset);if(tool==='smooth'){let sum=0,c=0;for(let yy=Math.max(0,y-2);yy<=Math.min(n-1,y+2);yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(n-1,x+2);xx++){sum+=original[yy*n+xx];c++;}a[i]+=(sum/c-a[i])*w*p/15;}else if(tool==='flatten'){if(preserveBoundary)w*=Math.min(1,x/4,y/4,(n-1-x)/4,(n-1-y)/4);a[i]+=(target-a[i])*w*p/30;}else a[i]+=w*p*(tool==='lower'?-1:1);a[i]=Math.max(0,Math.min(255,a[i]));}}
