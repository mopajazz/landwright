import{drawForestSymbol}from'./forests.mjs?v=2.3.0';
export const ATLAS_TYPES=['tree','mountain','town','forest-pine','forest-oak'];
// Original, lightweight cartographic symbols. Coordinates use map units.
export function drawLandmark(c,m){c.save();c.globalAlpha=m.opacity??1;c.translate(m.x,m.y);c.scale(m.size/12,m.size/12);c.lineJoin='round';c.lineCap='round';c.lineWidth=.7;c.strokeStyle='#203a2b';c.shadowColor='#14251c66';c.shadowBlur=.5;c.shadowOffsetY=.6;
if(m.type==='tree'){c.fillStyle='#536b3e';c.beginPath();c.moveTo(0,-7);c.lineTo(4,-1);c.lineTo(2,-1);c.lineTo(5,3);c.lineTo(1,3);c.lineTo(1,6);c.lineTo(-1,6);c.lineTo(-1,3);c.lineTo(-5,3);c.lineTo(-2,-1);c.lineTo(-4,-1);c.closePath();c.fill();c.stroke();c.strokeStyle='#a6bb7e';c.beginPath();c.moveTo(-.8,-4);c.lineTo(-2,-1);c.moveTo(-1,0);c.lineTo(-2.5,2);c.stroke();}
if(m.type==='mountain'){c.fillStyle='#9b9d7a';c.beginPath();c.moveTo(-7,5);c.lineTo(0,-7);c.lineTo(7,5);c.closePath();c.fill();c.stroke();c.fillStyle='#59684c';c.beginPath();c.moveTo(0,-7);c.lineTo(2,5);c.lineTo(7,5);c.closePath();c.fill();c.fillStyle='#e6e5c4';c.beginPath();c.moveTo(0,-7);c.lineTo(-2,-3.5);c.lineTo(0,-4);c.lineTo(1,-2.5);c.lineTo(2,-3.5);c.closePath();c.fill();}
if(m.type==='town'){c.fillStyle='#ccba8c';c.beginPath();c.rect(-5,-1,4,6);c.rect(0,-3,5,8);c.fill();c.stroke();c.fillStyle='#735544';c.beginPath();c.moveTo(-6,-1);c.lineTo(-3,-5);c.lineTo(0,-1);c.closePath();c.moveTo(-1,-3);c.lineTo(2.5,-7);c.lineTo(6,-3);c.closePath();c.fill();c.stroke();c.fillStyle='#3a4936';c.fillRect(1,1,1.6,4);c.fillRect(-4,1,1,1.5);c.fillRect(3,-1,1,1);}
c.restore();}

// Shared vector-to-bitmap atlas keeps repeated 3D object drawing inexpensive.
export function createLandmarkAtlas(){let sheet=document.createElement('canvas');sheet.width=ATLAS_TYPES.length*64;sheet.height=64;let c=sheet.getContext('2d');for(let [i,type]of ATLAS_TYPES.entries()){c.save();c.translate(i*64+32,32);(type.startsWith('forest-')?drawForestSymbol:drawLandmark)(c,{type,x:0,y:0,size:44,opacity:1});c.restore();}return sheet;}
