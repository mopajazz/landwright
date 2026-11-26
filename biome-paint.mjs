import {noise} from './brushes.mjs?v=2.14.0-textures.1';

export const BIOME_BRUSHES = [
  {key:'jungle', name:'Jungle', description:'Dense canopy, moss and damp soil.'},
  {key:'volcanic', name:'Volcanic Field', description:'Lava in hollows, with exposed stone and scree.'},
  {key:'alpine', name:'Alpine Tundra', description:'Snow pockets, exposed rock and sparse vegetation.'}
];

const clamp = value => Math.max(0,Math.min(1,value));

function patch(x,y) {
  const px=x/6, py=y/6, ix=Math.floor(px), iy=Math.floor(py);
  const u=px-ix, v=py-iy;
  return (noise(ix,iy)*(1-u)+noise(ix+1,iy)*u)*(1-v)
    +(noise(ix,iy+1)*(1-u)+noise(ix+1,iy+1)*u)*v;
}

export function biomeCell(key,x,y,height,slope,shelter) {
  const variation=patch(x,y);
  if(key==='jungle') {
    const material=slope>.64?12:shelter*.57+variation*.43>.56?10:variation<.27?9:6;
    return {material,density:clamp((.78+shelter*.16+variation*.12)*(1-slope))};
  }
  if(key==='volcanic') {
    const material=slope>.62?12:shelter*.7+variation*.3>.56?11:8;
    return {material,density:0};
  }
  const snow=height*.0035+shelter*.30+variation*.15-slope*.48>.69;
  const material=snow?5:slope>.55?12:variation>.52?8:1;
  return {material,density:material===1?clamp((1-slope)*(.07+variation*.18)):0};
}
