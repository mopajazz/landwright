function segmentDistance(x,y,a,b){let dx=b.x-a.x,dy=b.y-a.y,t=dx||dy?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy))):0;return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);}
export function touchesShape(s,x,y,r){
 let left=Math.min(s.x1,s.x2),top=Math.min(s.y1,s.y2),right=Math.max(s.x1,s.x2),bottom=Math.max(s.y1,s.y2),radius=r+s.width/2,path=[],closed=['rectangle','ellipse','triangle'].includes(s.type);
 if(s.type==='freehand'){path=s.points;if(!path.length)return false;left=right=path[0].x;top=bottom=path[0].y;for(let p of path){left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);}}
 if(x<left-radius||x>right+radius||y<top-radius||y>bottom+radius)return false;
 if(s.type==='line')path=[{x:s.x1,y:s.y1},{x:s.x2,y:s.y2}];
 if(s.type==='rectangle')path=[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}];
 if(s.type==='triangle')path=[{x:(left+right)/2,y:top},{x:right,y:bottom},{x:left,y:bottom}];
 if(s.type==='ellipse')for(let i=0;i<64;i++){let angle=i/64*Math.PI*2;path.push({x:(left+right)/2+Math.cos(angle)*(right-left)/2,y:(top+bottom)/2+Math.sin(angle)*(bottom-top)/2});}
 if(closed&&s.filled){let inside=false;for(let i=0,j=path.length-1;i<path.length;j=i++){let a=path[i],b=path[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}if(inside)return true;}
 for(let i=1;i<path.length;i++)if(segmentDistance(x,y,path[i-1],path[i])<=radius)return true;
 return closed&&path.length>1&&segmentDistance(x,y,path.at(-1),path[0])<=radius;
}
