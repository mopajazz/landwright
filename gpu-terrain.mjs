import {sampleTerrain,terrainScale} from './terrain3d.mjs?v=1.4.0';
import {createLandmarkAtlas} from './landmarks.mjs?v=1.4.0';
const vertex=`
attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec2 a_offset;
attribute float a_alpha;
uniform vec2 u_size;
uniform vec2 u_pan;
uniform vec2 u_angle;
uniform float u_scale;
uniform float u_sprite;
varying vec2 v_uv;
varying float v_alpha;
void main(){
 float c=cos(u_angle.x),s=sin(u_angle.x),sp=sin(u_angle.y),cp=cos(u_angle.y);
 vec2 p=a_position.xy-vec2(128.0);float rx=p.x*c-p.y*s,ry=p.x*s+p.y*c;
 float elevation=(a_position.z-62.0)*0.65;
 vec2 screen=vec2(u_size.x*.5+rx*u_scale,u_size.y*.57+(ry*sp-elevation*cp)*u_scale)+u_pan+a_offset*u_scale;
 float depth=ry*cp+elevation*sp+u_sprite*2.0;
 gl_Position=vec4(screen.x/u_size.x*2.0-1.0,1.0-screen.y/u_size.y*2.0,-depth/1024.0,1.0);
 v_uv=a_uv;v_alpha=a_alpha;
}`;
const fragment=`precision mediump float;uniform sampler2D u_texture;varying vec2 v_uv;varying float v_alpha;void main(){vec4 c=texture2D(u_texture,v_uv);c.a*=v_alpha;if(c.a<0.005)discard;gl_FragColor=c;}`;
export function createGPUTerrain(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false});
 if(!gl)return null;
 function shader(type,source){let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){let e=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(e);}return s;}
 const program=gl.createProgram(),vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const attrs=['position','uv','offset','alpha'].map(name=>gl.getAttribLocation(program,'a_'+name));
 const uniforms=Object.fromEntries(['size','pan','angle','scale','sprite','texture'].map(name=>[name,gl.getUniformLocation(program,'u_'+name)]));
 const terrain=gl.createBuffer(),indices=gl.createBuffer(),sprites=gl.createBuffer();
 const vertices=new Float32Array(256*256*8),indexData=new Uint16Array(255*255*6);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){let i=(y*256+x)*8;vertices[i]=x;vertices[i+1]=y;vertices[i+3]=(x+.5)/256;vertices[i+4]=(y+.5)/256;vertices[i+7]=1;}
 let next=0;for(let y=0;y<255;y++)for(let x=0;x<255;x++){let a=y*256+x,b=a+1,c=a+256,d=c+1;indexData.set([a,b,d,a,d,c],next);next+=6;}
 gl.bindBuffer(gl.ARRAY_BUFFER,terrain);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indexData,gl.STATIC_DRAW);
 function texture(){let t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
 const surface=texture(),atlas=texture(),sheet=createLandmarkAtlas();gl.bindTexture(gl.TEXTURE_2D,atlas);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sheet);
 let marks=[],spriteData=new Float32Array(0),lastYaw=NaN,lastPitch=NaN;
 function bind(buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let [i,[size,offset]] of [[3,0],[2,12],[2,20],[1,28]].entries()){gl.enableVertexAttribArray(attrs[i]);gl.vertexAttribPointer(attrs[i],size,gl.FLOAT,false,32,offset);}}
 return {
  update(heights,image,newMarks,sea,water){
   for(let i=0;i<heights.length;i++)vertices[i*8+2]=water?Math.max(sea,heights[i]):heights[i];gl.bindBuffer(gl.ARRAY_BUFFER,terrain);gl.bufferSubData(gl.ARRAY_BUFFER,0,vertices);
   gl.bindTexture(gl.TEXTURE_2D,surface);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
   marks=newMarks.map(m=>({m,z:sampleTerrain(m.x,m.y,heights,sea,water),depth:0}));spriteData=new Float32Array(marks.length*6*8);lastYaw=NaN;lastPitch=NaN;
  },
  draw(w,h,camera){
   gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.depthMask(true);gl.useProgram(program);
   gl.uniform2f(uniforms.size,w,h);gl.uniform2f(uniforms.pan,camera.panX||0,camera.panY||0);gl.uniform2f(uniforms.angle,camera.yaw,camera.pitch);gl.uniform1f(uniforms.scale,terrainScale(w,h,camera));gl.uniform1i(uniforms.texture,0);gl.uniform1f(uniforms.sprite,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,surface);bind(terrain);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.drawElements(gl.TRIANGLES,indexData.length,gl.UNSIGNED_SHORT,0);
   if(marks.length){
    if(camera.yaw!==lastYaw||camera.pitch!==lastPitch){let c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch);for(let item of marks)item.depth=((item.m.x-128)*s+(item.m.y-128)*c)*cp+(item.z-62)*.65*sp;marks.sort((a,b)=>a.depth-b.depth);let offset=0;for(let {m,z} of marks){let kind={tree:0,mountain:1,town:2}[m.type],half=m.size*32/44;for(let [x,y] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){spriteData.set([m.x,m.y,z+1,(kind+(x+1)/2)/3,(y+1)/2,x*half,y*half,m.opacity??1],offset);offset+=8;}}gl.bindBuffer(gl.ARRAY_BUFFER,sprites);gl.bufferData(gl.ARRAY_BUFFER,spriteData,gl.DYNAMIC_DRAW);lastYaw=camera.yaw;lastPitch=camera.pitch;}
    gl.uniform1f(uniforms.sprite,1);gl.bindTexture(gl.TEXTURE_2D,atlas);bind(sprites);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,marks.length*6);gl.depthMask(true);
   }
  },
  get triangleCount(){return indexData.length/3;}
 };
}
