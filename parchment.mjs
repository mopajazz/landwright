import {rasterFrame} from './raster-cache.mjs?v=2.15.0';
import {MATERIAL_IDS} from './material-paint.mjs?v=2.15.0';

export const INK_BRUSHES = [
  {id:1,name:'Hatch',swatch:'#826447',description:'Slope-following pen strokes'},
  {id:2,name:'Stipple',swatch:'#a98662',description:'Fine dots for grit and sand'},
  {id:4,name:'Woodland',swatch:'#63684a',description:'Overlapping crown outlines'},
  {id:6,name:'Fine Line',swatch:'#513728',description:'Dark ink for narrow freehand marks'}
];

const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
function hash(x,y){
  const bits=Math.imul(x,374761393)+Math.imul(y,668265263);
  const mixed=Math.imul(bits^(bits>>>13),1274126177);
  return ((mixed^(mixed>>>16))>>>0)/4294967296;
}

export function parchmentRelief(heights,n,sea,water,ocean,river){
  const field=new Float32Array(heights.length);
  for(let i=0;i<field.length;i++){
    const x=i%n,h=heights[i];
    const left=heights[x?i-1:i],right=heights[x<n-1?i+1:i];
    const above=heights[i>=n?i-n:i],below=heights[i+n<field.length?i+n:i];
    const shoulder=(left+right+above+below)*.25;
    const fold=h+.23*clamp(h-shoulder,-4,4);
    const wet=water&&(ocean[i]||river[i]>h+.01);
    field[i]=wet?(ocean[i]?sea-2:river[i]-1):clamp(sea+(fold-sea)*1.16,0,255);
  }
  return field;
}

function shorelineDistance(ocean,n){
  const distance=new Float32Array(ocean.length);
  for(let i=0;i<distance.length;i++){
    if(!ocean[i])continue;
    distance[i]=7;
    if(i%n)distance[i]=Math.min(distance[i],distance[i-1]+1);
    if(i>=n)distance[i]=Math.min(distance[i],distance[i-n]+1);
  }
  for(let i=distance.length-1;i>=0;i--){
    if(i%n<n-1)distance[i]=Math.min(distance[i],distance[i+1]+1);
    if(i+n<distance.length)distance[i]=Math.min(distance[i],distance[i+n]+1);
  }
  return distance;
}

function materialInk(id,x,y,h,grain,hatch,variation){
  switch(id){
    case 1: return hatch?26:2;
    case 2: return grain>.71?44:3;
    case 3: return Math.sin(x*.24+y*.62+variation*2)>.72?62:11;
    case 5: return grain>.91?20:-9;
    case 6: return 76+grain*18;
    case 7: return Math.cos(x*.48+y*.16+variation*2)>.36?45:11;
    case 8: return grain>.64?62:grain>.44?22:5;
    case 9: return Math.sin(y*.67+variation*2)>.66?43:23;
    case 10: return grain<variation*.82?59:8;
    case 11: return Math.abs(Math.sin(x*.29+Math.sin(y*.25)*1.6+variation))<.23?14:105;
    case 12: return Math.sin(x*.49+y*.31+h*.13+Math.sin(y*.18)*1.8+variation)>.28?73:18;
    default: return 0;
  }
}

export function renderParchment({n,heights,sea,water,ocean,river,canopy,weights,paintAlpha,shade,contours,cache}){
  const width=n*4,fields=[heights,ocean,river];
  const distance=water&&contours?shorelineDistance(ocean,n):null;
  if(distance)fields.push(distance);
  for(const field of [canopy,weights,paintAlpha])if(field)fields.push(field);
  const {data,bounds}=rasterFrame(cache,n,width,fields,
    `parchment|${sea}|${water}|${shade}|${contours}|${!!canopy}|${!!weights}`);
  const channels=MATERIAL_IDS.length;
  const active=weights?new Uint16Array(n*n):null;
  if(active&&bounds.x0<bounds.x1){
    for(let i=0;i<active.length;i++){
      if(!paintAlpha[i])continue;
      for(let k=0;k<channels;k++)if(weights[i*channels+k])active[i]|=1<<k;
    }
  }
  for(let py=bounds.y0;py<bounds.y1;py++)for(let px=bounds.x0;px<bounds.x1;px++){
    const u=clamp((px+.5)/4-.5,0,n-1),v=clamp((py+.5)/4-.5,0,n-1);
    const x=Math.floor(u),y=Math.floor(v),sx=u-x,sy=v-y;
    const a=y*n+x,b=x+1<n?a+1:a,c=y+1<n?a+n:a,d=c+b-a;
    const h=heights[a], near=Math.round(v)*n+Math.round(u);
    const wet=i=>water&&(ocean[i]||river[i]>heights[i]+.01)?1:0;
    const edge=(1-sx)*((1-sy)*wet(a)+sy*wet(c))+sx*((1-sy)*wet(b)+sy*wet(d));
    const dx=(heights[b]-h)*(1-sy)+(heights[d]-heights[c])*sy;
    const dy=(heights[c]-h)*(1-sx)+(heights[d]-heights[b])*sx;
    const wash=clamp(edge*1.65);
    const light=shade?clamp((dx+dy)*2.2,-25,14)*(1-wash):0;
    const paperGrain=hash(px,py),variation=hash(px>>3,py>>3);
    const grain=(paperGrain-.5)*9+(hash(px>>4,py>>4)-.5)*5;
    const grade=Math.hypot(dx,dy);
    const slope=clamp(grade/4);
    const hatch=Math.sin(px*.74+py*.43+(dx-dy)*.31+variation*1.8)>.60;
    let ink=hatch?slope*(dx+dy<0?49:14):0;
    let tint=0;
    if(active&&edge<.76){
      let bits=active[near],coverage=0;
      while(bits){
        const channel=31-Math.clz32(bits&-bits),id=MATERIAL_IDS[channel];
        bits&=bits-1;
        const weight=weights[near*channels+channel]/255;
        coverage+=weight;
        ink+=weight*materialInk(id,px,py,h,paperGrain,hatch,variation);
        if(id===11)tint+=weight*11;
      }
      if(hatch)ink+=Math.max(0,paintAlpha[near]-coverage)*24;
    }
    if(contours&&edge<.03&&grade>.12){
      const height=(1-sx)*((1-sy)*h+sy*heights[c])+sx*((1-sy)*heights[b]+sy*heights[d]);
      const level=(height-sea)/6,index=Math.round(level);
      const weight=clamp(grade*.6);
      const width=.05+Math.min(.22,grade*.036);
      const pen=clamp(1-Math.abs(level-index)/width);
      ink+=pen*weight*(index%4===0?102:66);
    }
    if(canopy?.[near]>.05){
      const cx=px%9-4+(hash(px/9|0,py/9|0)-.5)*3,cy=py%9-4;
      const ring=Math.hypot(cx,cy*1.16);
      if(ring<3.6)ink+=(ring>2.1?95:38)*canopy[near];
    }
    if(edge>.03&&edge<.76)ink=Math.max(ink,edge>.26&&edge<.61?104:42);
    else if(edge>=.76){
      const coast=distance?((1-sx)*((1-sy)*distance[a]+sy*distance[c])+sx*((1-sy)*distance[b]+sy*distance[d])):0;
      ink=Math.abs(coast-2)<.12?19:Math.abs(coast-3.7)<.10?12:0;
    }
    const i=(py*width+px)*4;
    data[i]=237+grain+light-wash*34-ink+tint;
    data[i+1]=219+grain+light-wash*15-ink*.91;
    data[i+2]=183+grain+light+wash*7-ink*.75;
    data[i+3]=255;
  }
  return {width,data,bounds};
}
