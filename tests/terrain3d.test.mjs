import{test}from'node:test';import assert from'node:assert/strict';
const t=await import('../terrain3d.mjs');
test('3D picking reverses the projection over varying yaw and pitch',()=>{let heights=new Float32Array(256*256).fill(100);for(let yaw of[-1,0,1.5])for(let pitch of[.2,.65,1.1]){let camera={yaw,pitch,zoom:1,panX:12,panY:-8},screen=t.projectTerrain(140,120,100,800,600,camera),hit=t.pickTerrain(screen.x,screen.y,800,600,camera,heights,62,false);assert.ok(hit);assert.ok(Math.abs(hit.x-140)<.05);assert.ok(Math.abs(hit.y-120)<.05);}});
test('picking uses water surface and ignores empty background',()=>{let a=new Float32Array(256*256).fill(20),c={yaw:0,pitch:.65,zoom:1},p=t.projectTerrain(128,128,62,800,600,c),hit=t.pickTerrain(p.x,p.y,800,600,c,a,62,true);assert.ok(Math.abs(hit.x-128)<.05&&Math.abs(hit.y-128)<.05);assert.equal(t.pickTerrain(-200,-200,800,600,c,a,62,true),null);});
test('terrain picking selects the nearer raised ridge before ground behind it',()=>{let a=new Float32Array(256*256).fill(40);for(let y=120;y<160;y++)for(let x=100;x<170;x++)a[y*256+x]=180;let c={yaw:.4,pitch:.5,zoom:1},p=t.projectTerrain(130,140,180,800,600,c),hit=t.pickTerrain(p.x,p.y,800,600,c,a,62,false);assert.ok(hit);assert.ok(Math.abs(hit.x-130)<.1&&Math.abs(hit.y-140)<.1);});
test('frame scheduler coalesces pointer updates into one animation frame',()=>{let queue=[],renders=0,frame=t.createFrameScheduler(()=>renders++,cb=>queue.push(cb));frame();frame();frame();assert.equal(queue.length,1);queue.shift()(100);assert.equal(renders,1);frame();assert.equal(queue.length,1);});
test('picking finds a single-cell summit even at a grazing camera angle',()=>{let a=new Float32Array(256*256).fill(10);for(let z of[100,200,255]){a[128*256+128]=z;let c={yaw:0,pitch:.18,zoom:1},p=t.projectTerrain(128,128,z,800,600,c),hit=t.pickTerrain(p.x,p.y,800,600,c,a,62,false);assert.ok(hit);assert.ok(Math.abs(hit.x-128)<.01&&Math.abs(hit.y-128)<.01);}});
test('3D projection and picking agree at each selectable world size',()=>{for(let n of[128,192,256]){let a=new Float32Array(n*n).fill(80),c={size:n,yaw:.4,pitch:.65,zoom:1};for(let [x,y]of[[1,1],[n/2,n/2],[n-2,n-2]]){assert.equal(t.sampleTerrain(x,y,a,62,true),80);let p=t.projectTerrain(x,y,80,800,600,c),hit=t.pickTerrain(p.x,p.y,800,600,c,a,62,true);assert.ok(hit);assert.ok(Math.abs(hit.x-x)<.01&&Math.abs(hit.y-y)<.01);}}});
test('Canvas woodland uses cached texture only on covered terrain cells',()=>{let n=16,heights=new Float32Array(n*n).fill(80),mask=new Float32Array(n*n),draws=0,transforms=0,c=new Proxy({drawImage:()=>draws++,transform:(...v)=>{assert.ok(v.every(Number.isFinite));transforms++;}},{get:(o,k)=>k in o?o[k]:()=>{}}),image={width:64,height:64},camera={yaw:-.65,pitch:.65,zoom:1,size:n};t.renderTerrain(c,800,600,heights,()=>[70,100,45],62,true,camera,3,{image,mask});assert.equal(draws,0);mask.fill(1);t.renderTerrain(c,800,600,heights,()=>[70,100,45],62,true,camera,3,{image,mask});assert.ok(draws>0);assert.equal(transforms,draws);});

test('512-square terrain fits in the default 3D view and the far corners are pickable',()=>{
 const size=512,w=800,h=600,heights=new Float32Array(size*size).fill(80);
 const camera={size,yaw:-.65,pitch:.65,zoom:1};
 for(const [x,y] of [[1,1],[1,510],[510,1],[510,510]]){
  const p=t.projectTerrain(x,y,80,w,h,camera);
  assert.ok(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h);
  const hit=t.pickTerrain(p.x,p.y,w,h,camera,heights,62,false);
  assert.ok(hit&&Math.abs(hit.x-x)<.01&&Math.abs(hit.y-y)<.01);
 }
});
