const clamp=(v,n)=>Math.max(0,Math.min(n-1,v));
export function makeShape(type,start,end,style,constrain=false,n=256){let x1=clamp(start.x,n),y1=clamp(start.y,n),x2=clamp(end.x,n),y2=clamp(end.y,n);if(constrain&&['rectangle','ellipse','triangle'].includes(type)){let d=Math.min(Math.abs(x2-x1),Math.abs(y2-y1));x2=x1+Math.sign(x2-x1)*d;y2=y1+Math.sign(y2-y1)*d;}return{type,x1,y1,x2,y2,color:style.color,width:style.width,opacity:style.opacity,filled:style.filled,points:type==='freehand'?[{x:x1,y:y1}]:[]};}
export function validShape(s,n=256){let point=p=>p&&[p.x,p.y].every(v=>Number.isFinite(v)&&v>=0&&v<n);return !!(s&&['freehand','line','rectangle','ellipse','triangle'].includes(s.type)&&point({x:s.x1,y:s.y1})&&point({x:s.x2,y:s.y2})&&/^#[0-9a-f]{6}$/i.test(s.color)&&Number.isFinite(s.width)&&s.width>=.25&&s.width<=12&&Number.isFinite(s.opacity)&&s.opacity>=0&&s.opacity<=1&&typeof s.filled==='boolean'&&Array.isArray(s.points)&&s.points.length<=1000&&s.points.every(point)&&(s.type!=='freehand'||s.points.length>=2));}
export function drawShape(c,s,draft=false){c.save();c.globalAlpha=s.opacity*(draft?.7:1);c.strokeStyle=s.color;c.fillStyle=s.color;c.lineWidth=s.width;c.lineCap='round';c.lineJoin='round';c.beginPath();let x=Math.min(s.x1,s.x2),y=Math.min(s.y1,s.y2),w=Math.abs(s.x2-s.x1),h=Math.abs(s.y2-s.y1);if(s.type==='rectangle')c.rect(x,y,w,h);if(s.type==='ellipse')c.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);if(s.type==='line'){c.moveTo(s.x1,s.y1);c.lineTo(s.x2,s.y2);}if(s.type==='triangle'){c.moveTo(x+w/2,y);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.closePath();}if(s.type==='freehand'&&s.points.length){c.moveTo(s.points[0].x,s.points[0].y);for(let p of s.points.slice(1))c.lineTo(p.x,p.y);}if(s.filled&&['rectangle','ellipse','triangle'].includes(s.type))c.fill();c.stroke();c.restore();}

// Canvas fallback keeps cartographic lines crisp instead of sampling them per terrain face.
export function drawProjectedShape(c,s,project){
 let path=[],closed=['rectangle','ellipse','triangle'].includes(s.type),x=Math.min(s.x1,s.x2),y=Math.min(s.y1,s.y2),w=Math.abs(s.x2-s.x1),h=Math.abs(s.y2-s.y1);
 if(s.type==='freehand')path=s.points;
 if(s.type==='line')path=[{x:s.x1,y:s.y1},{x:s.x2,y:s.y2}];
 if(s.type==='rectangle')path=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h},{x,y}];
 if(s.type==='triangle')path=[{x:x+w/2,y},{x:x+w,y:y+h},{x,y:y+h},{x:x+w/2,y}];
 if(s.type==='ellipse')for(let i=0;i<=64;i++){let a=i/64*Math.PI*2;path.push({x:x+w/2+Math.cos(a)*w/2,y:y+h/2+Math.sin(a)*h/2});}
 if(!path.length)return;c.save();c.globalAlpha=s.opacity;c.strokeStyle=c.fillStyle=s.color;c.lineWidth=Math.max(.6,s.width);c.lineCap='round';c.lineJoin='round';c.beginPath();let count=0;
 for(let i=0;i<path.length;i++){let p=path[i],previous=path[Math.max(0,i-1)],steps=Math.max(1,Math.ceil(Math.hypot(p.x-previous.x,p.y-previous.y)/2));for(let j=i?1:0;j<=steps;j++){let q=project(previous.x+(p.x-previous.x)*j/steps,previous.y+(p.y-previous.y)*j/steps);if(!count)c.moveTo(q.x,q.y);else c.lineTo(q.x,q.y);count++;if(count>=5000)break;}if(count>=5000)break;}
 if(closed)c.closePath();if(closed&&s.filled)c.fill();c.stroke();c.restore();
}
