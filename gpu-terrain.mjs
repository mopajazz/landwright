import {terrainDetailGLSL} from './terrain-detail.mjs?v=2.10.0';
import {sampleTerrain,terrainScale,verticalScale} from './terrain3d.mjs?v=2.10.0';
import {createLandmarkAtlas,ATLAS_TYPES} from './landmarks.mjs?v=2.10.0';
const vertex=`
attribute vec3 a_position;
attribute float a_height;
attribute vec2 a_uv;
attribute vec2 a_offset;
attribute float a_alpha;
uniform vec2 u_size;
uniform vec2 u_pan;
uniform vec2 u_angle;
uniform float u_scale;
uniform float u_center;
uniform float u_vscale;
uniform float u_sprite;
uniform vec4 u_walk;
uniform float u_walkPitch;
varying vec2 v_uv;
varying float v_alpha;
varying float v_depth;
void main(){
 float c=cos(u_angle.x),s=sin(u_angle.x),sp=sin(u_angle.y),cp=cos(u_angle.y);
 vec2 p=a_position.xy-vec2(u_center);float rx=p.x*c-p.y*s,ry=p.x*s+p.y*c;
 float elevation=(a_position.z+a_height-62.0)*u_vscale;
 vec2 screen=vec2(u_size.x*.5+rx*u_scale,u_size.y*.57+(ry*sp-elevation*cp)*u_scale)+u_pan+a_offset*u_scale;
 float depth=ry*cp+elevation*sp+u_sprite*2.0;
 gl_Position=vec4(screen.x/u_size.x*2.0-1.0,1.0-screen.y/u_size.y*2.0,-depth/1024.0,1.0);
 if(u_walk.w>0.5){
  vec2 delta=a_position.xy-u_walk.xy;
  float forward=dot(delta,vec2(c,s));
  float side=dot(delta,vec2(-s,c));
  float up=(a_position.z+a_height)*u_vscale-u_walk.z;
  float tiltSin=sin(u_walkPitch),tiltCos=cos(u_walkPitch);
  float distance=forward*tiltCos+up*tiltSin;
  float vertical=up*tiltCos-forward*tiltSin;
  gl_Position=vec4((side+a_offset.x*.025)*1.4*u_size.y/u_size.x,
    (vertical-a_offset.y*.025)*1.4,distance*1.0002-.2,distance);
 }
 v_uv=a_uv;v_alpha=a_alpha;v_depth=ry;
}`;
const fragment=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_texture;
uniform sampler2D u_ocean;
uniform sampler2D u_decals;
uniform float u_showDecals;
uniform float u_showOcean;
uniform float u_sprite;
varying vec2 v_uv;
varying float v_alpha;
varying float v_depth;
${terrainDetailGLSL}
void main(){
 vec4 c=texture2D(u_texture,v_uv);
 float wet=0.0;
 if(u_showOcean>0.5){
  vec4 ocean=texture2D(u_ocean,v_uv);
  wet=ocean.a;
  c.rgb=mix(c.rgb,ocean.rgb,wet);
 }
 if(u_sprite<.5&&u_detailAmount>0.0){
  float variation=terrainDetail(v_uv,wet);
  c.rgb=variation<0.0?c.rgb*(1.0+variation):mix(c.rgb,vec3(1.0,.95,.82),variation);
  if(u_lighting>.5){
   float height=localHeight(v_uv);
   float depth=smoothstep(-.48,.16,-v_depth/u_cells);
   float haze=depth*(.04+.10*exp(-max(0.0,height-48.0)/55.0));
   c.rgb=mix(c.rgb,vec3(.47,.56,.56),haze*u_detailAmount);
  }
 }
 if(u_showDecals>0.5){
  vec4 decal=texture2D(u_decals,v_uv);
  c.rgb=c.rgb*(1.0-decal.a)+decal.rgb;
 }
 c.a*=v_alpha;
 if(c.a<.005)discard;
 gl_FragColor=c;
}
`;
export function createGPUTerrain(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false});
 if(!gl)return null;
 function shader(type,source){let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){let e=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(e);}return s;}
 const program=gl.createProgram(),vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const attrs=['position','uv','offset','alpha','height'].map(name=>gl.getAttribLocation(program,'a_'+name));
 const uniforms=Object.fromEntries(['size','pan','angle','scale','sprite','texture','center','ocean','showOcean','decals','showDecals','detail','cells','detailAmount','lighting','walk','walkPitch','vscale'].map(name=>[name,gl.getUniformLocation(program,'u_'+name)]));
 const terrain=gl.createBuffer(),elevations=gl.createBuffer(),indices=gl.createBuffer(),sprites=gl.createBuffer();
 const uintIndices=gl.getExtension('OES_element_index_uint');
 let n=0,indexCount=0,indexType,surfaceSize=0,decalsSize=0,detailSize=0;
 function mesh(size){n=size;
 const wide=n*n>65536;
 indexType=wide?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;
 indexCount=(n-1)*(n-1)*6;
 const vertices=new Float32Array(n*n*8),indexData=wide?new Uint32Array(indexCount):new Uint16Array(indexCount);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){let i=(y*n+x)*8;vertices[i]=x;vertices[i+1]=y;vertices[i+3]=(x+.5)/n;vertices[i+4]=(y+.5)/n;vertices[i+7]=1;}
 let next=0;for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){let a=y*n+x,b=a+1,c=a+n,d=c+1;indexData.set([a,b,d,a,d,c],next);next+=6;}
 gl.bindBuffer(gl.ARRAY_BUFFER,terrain);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indexData,gl.STATIC_DRAW);}
 function texture(){let t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
 const surface=texture(),ocean=texture(),decals=texture(),detail=texture(),atlas=texture(),sheet=createLandmarkAtlas();gl.bindTexture(gl.TEXTURE_2D,atlas);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sheet);
 let detailEnabled=false;
 let oceanSize=0,showOcean=false,showDecals=false;
 let marks=[],spriteData=new Float32Array(0),lastYaw=NaN,lastPitch=NaN;
 function bind(buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let [i,[size,offset]] of [[3,0],[2,12],[2,20],[1,28]].entries()){gl.enableVertexAttribArray(attrs[i]);gl.vertexAttribPointer(attrs[i],size,gl.FLOAT,false,32,offset);}}
 return {
  supportsSize(size){return size*size<=65536||!!uintIndices;},
  update(heights,upload,newMarks){
   const resized=n!==Math.sqrt(heights.length);
   if(resized)mesh(Math.sqrt(heights.length));
   gl.bindBuffer(gl.ARRAY_BUFFER,elevations);
   if(resized)gl.bufferData(gl.ARRAY_BUFFER,heights,gl.DYNAMIC_DRAW);
   else gl.bufferSubData(gl.ARRAY_BUFFER,0,heights);
   if(upload){
    const {image,x,y}=upload;
    gl.bindTexture(gl.TEXTURE_2D,surface);
    if(x!==undefined||surfaceSize===image.width)gl.texSubImage2D(gl.TEXTURE_2D,0,x??0,y??0,gl.RGBA,gl.UNSIGNED_BYTE,image);
    else{
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
     surfaceSize=image.width;
    }
   }
   marks=newMarks.map(m=>({m,z:sampleTerrain(m.x,m.y,heights,0,false),depth:0}));spriteData=new Float32Array(marks.length*6*8);lastYaw=NaN;lastPitch=NaN;
  },
  updateDecals(image) {
   showDecals=!!image;
   if (!image) return;
   gl.activeTexture(gl.TEXTURE2);
   gl.bindTexture(gl.TEXTURE_2D,decals);
   gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
   if(decalsSize===image.width)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,image);
   else{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);decalsSize=image.width;}
   gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
   gl.activeTexture(gl.TEXTURE0);
  },
  updateOcean(size, rgba) {
   showOcean = !!rgba;
   gl.activeTexture(gl.TEXTURE1);
   gl.bindTexture(gl.TEXTURE_2D, ocean);
   if (size !== oceanSize) {
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
    oceanSize = size;
   } else if (rgba) {
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
   }
   gl.activeTexture(gl.TEXTURE0);
  },
  updateDetail(size,pixels){
   detailEnabled=!!pixels;
   if(!pixels)return;
   gl.activeTexture(gl.TEXTURE3);
   gl.bindTexture(gl.TEXTURE_2D,detail);
   if(detailSize===size)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   else{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);detailSize=size;}
   gl.activeTexture(gl.TEXTURE0);
  },
  draw(w,h,camera,shade,walk){
   gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.depthMask(true);gl.useProgram(program);
   const scale=terrainScale(w,h,camera);
   gl.uniform4f(uniforms.walk,walk?.x??0,walk?.y??0,walk?.eye??0,walk?1:0);
   gl.uniform1f(uniforms.walkPitch,walk?.pitch??0);
   gl.uniform1i(uniforms.detail,3);
   gl.uniform1f(uniforms.cells,n);
   gl.uniform1f(uniforms.detailAmount,detailEnabled?Math.min(1,Math.max(0,(scale-2.8)/3)):0);
   gl.uniform1f(uniforms.lighting,shade?1:0);
   gl.uniform1f(uniforms.center,n/2);gl.uniform1f(uniforms.vscale,verticalScale(n));gl.uniform2f(uniforms.size,w,h);gl.uniform2f(uniforms.pan,camera.panX||0,camera.panY||0);gl.uniform2f(uniforms.angle,walk?.yaw??camera.yaw,camera.pitch);gl.uniform1f(uniforms.scale,terrainScale(w,h,camera));gl.uniform1i(uniforms.texture,0);gl.uniform1i(uniforms.ocean,1);gl.uniform1i(uniforms.decals,2);gl.uniform1f(uniforms.showDecals,showDecals?1:0);gl.uniform1f(uniforms.showOcean,showOcean?1:0);gl.uniform1f(uniforms.sprite,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,surface);bind(terrain);gl.bindBuffer(gl.ARRAY_BUFFER,elevations);gl.enableVertexAttribArray(attrs[4]);gl.vertexAttribPointer(attrs[4],1,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.drawElements(gl.TRIANGLES,indexCount,indexType,0);
   if(marks.length&&!walk){
    if(camera.yaw!==lastYaw||camera.pitch!==lastPitch){let c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch);for(let item of marks)item.depth=((item.m.x-n/2)*s+(item.m.y-n/2)*c)*cp+(item.z-62)*verticalScale(n)*sp;marks.sort((a,b)=>a.depth-b.depth);let offset=0;for(let {m,z} of marks){let kind=ATLAS_TYPES.indexOf(m.type),half=m.size*32/44;for(let [x,y] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){spriteData.set([m.x,m.y,z+1,(kind+(x+1)/2)/ATLAS_TYPES.length,(y+1)/2,x*half,y*half,m.opacity??1],offset);offset+=8;}}gl.bindBuffer(gl.ARRAY_BUFFER,sprites);gl.bufferData(gl.ARRAY_BUFFER,spriteData,gl.DYNAMIC_DRAW);lastYaw=camera.yaw;lastPitch=camera.pitch;}
    gl.uniform1f(uniforms.sprite,1);gl.uniform1f(uniforms.showOcean,0);gl.uniform1f(uniforms.showDecals,0);gl.disableVertexAttribArray(attrs[4]);gl.bindTexture(gl.TEXTURE_2D,atlas);bind(sprites);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,marks.length*6);gl.depthMask(true);
   }
  },
  get triangleCount(){return indexCount/3;}
 };
}
