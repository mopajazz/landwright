// World-space detail and lighting for the close-zoom terrain views.
export function packTerrainDetail(bed, canopy, inlandWater, waterEnabled) {
  const pixels = new Uint8Array(bed.length * 4);
  for (let i = 0; i < bed.length; i++) {
    const height = Math.round(bed[i] * 256);
    pixels[i * 4] = height >> 8;
    pixels[i * 4 + 1] = height & 255;
    pixels[i * 4 + 2] = Math.round((canopy?.[i] ?? 0) * 255);
    pixels[i * 4 + 3] = waterEnabled && inlandWater[i] > bed[i] + .01 ? 255 : 0;
  }
  return pixels;
}

export const terrainDetailGLSL = `
uniform sampler2D u_detail;
uniform float u_cells;
uniform float u_detailAmount;
uniform float u_lighting;

float hashDetail(vec2 p) {
 vec3 h = fract(vec3(p.xyx) * vec3(.1031,.1030,.0973));
 h += dot(h, h.yzx + 33.33);
 return fract((h.x + h.y) * h.z);
}
float detailNoise(vec2 p) {
 vec2 cell = floor(p), f = fract(p);
 f = f * f * (3.0 - 2.0 * f);
 return mix(mix(hashDetail(cell),hashDetail(cell+vec2(1,0)),f.x),
            mix(hashDetail(cell+vec2(0,1)),hashDetail(cell+vec2(1)),f.x),f.y);
}
float bedHeight(vec4 data) { return dot(data.rg,vec2(255.0,255.0/256.0)); }
float localHeight(vec2 uv) { return bedHeight(texture2D(u_detail,uv)); }
float terrainDetail(vec2 uv, float ocean) {
 vec2 p = uv*u_cells;
 vec4 data = texture2D(u_detail,uv);
 float wet = max(data.a,ocean);
 if(wet>.5){
  float ripples=sin(p.x*8.0+p.y*5.0+detailNoise(p*2.2)*5.0);
  return u_detailAmount*(.012*ripples+.018*(detailNoise(p*6.0)-.5));
 }
 float warp = detailNoise(p*1.35)*.46;
 float grain = (detailNoise(p*5.0+warp)-.5)*.11+(detailNoise(p*9.0)-.5)*.06;
 float canopy = smoothstep(.18,.7,data.b);
 float crowns = (detailNoise(p*3.3+warp)-.5)*.20;
 float lighting = 0.0;
 if(u_lighting>.5){
  vec2 sun = vec2(-.78,-.63);
  float h = bedHeight(data);
  float relief = localHeight(uv+sun/u_cells)-h;
  float slope = max(abs(relief),abs(localHeight(uv+vec2(-sun.y,sun.x)/u_cells)-h));
  // Bands follow elevation through the rock face, with small breaks in the strata.
  float strata = detailNoise(vec2(h*.72+warp,p.x*.6+p.y*.48))-.5;
  grain += strata * smoothstep(2.0,9.0,slope) * .15;
  float shadow = 0.0;
  for(int i=0;i<5;i++){
   float distance = 1.0+float(i)*2.0;
   float ridge = localHeight(uv+sun*distance/u_cells);
   shadow = max(shadow,smoothstep(-1.0,3.0,ridge-h-distance*.85));
  }
  lighting = clamp(-relief*.012,-.07,.07)-shadow*.15;
 }
 return u_detailAmount*(mix(grain,crowns,canopy)+lighting);
}
`;

export function createMapDetail(canvas) {
  const gl = canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
  if (!gl) return null;
  function compile(type, source) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const vertex=compile(gl.VERTEX_SHADER,`
 attribute vec2 a_position;
 varying vec2 v_position;
 void main(){v_position=a_position*.5+.5;gl_Position=vec4(a_position,0,1);}`);
  const fragment=compile(gl.FRAGMENT_SHADER,`
 precision highp float;
 varying vec2 v_position;
 uniform vec4 u_map;
 uniform vec2 u_viewport;
 ${terrainDetailGLSL}
 void main(){
  vec2 point=vec2(v_position.x,1.0-v_position.y)*u_viewport;
  vec2 uv=(point-u_map.xy)/u_map.zw;
  if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1))))discard;
  float shade=terrainDetail(uv,0.0);
  gl_FragColor=vec4(shade<0.0?vec3(.08,.11,.12):vec3(1.0,.95,.82),abs(shade));
 }`);
  const program=gl.createProgram();
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const location=name=>gl.getUniformLocation(program,name);
  const map=location('u_map'),viewport=location('u_viewport'),cells=location('u_cells'),
    amount=location('u_detailAmount'),lighting=location('u_lighting');
  const vertices=gl.createBuffer(), texture=gl.createTexture();
  gl.bindBuffer(gl.ARRAY_BUFFER,vertices);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'a_position');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(location('u_detail'),0);
  let previousPixels, previousView='';
  return {
    render(pixels,n,t,w,h,width,height,shade) {
      const key=[t.x,t.y,t.scale,w,h,width,height,shade].join('/');
      if(previousPixels===pixels&&key===previousView)return;
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      if(previousPixels!==pixels){
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,n,n,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        previousPixels=pixels;
      }
      previousView=key;
      gl.viewport(0,0,width,height);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(viewport,w,h);
      gl.uniform4f(map,t.x,t.y,t.scale*n,t.scale*n);
      gl.uniform1f(cells,n);
      gl.uniform1f(amount,Math.min(1,Math.max(0,(t.scale-3)/5)));
      gl.uniform1f(lighting,shade?1:0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }
  };
}
