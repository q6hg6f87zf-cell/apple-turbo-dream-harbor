import { CANONICAL_REGION_IDS, canonicalRegionId, regionById } from "@/game/data";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import type { LocationId, RegionId } from "@/game/types";
import { Compass, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HollowGlobeAAA } from "./globe-aaa";

const REGION_TO_LOCATION: Record<RegionId, LocationId> = {
  ironclad: "ironclad",
  slagtown: "kingdom",
  blackspire: "caverns",
  brasswater: "library",
  veyra: "veyra",
};

const DEG = Math.PI / 180;
const MIN_ZOOM = 0.82;
const MAX_ZOOM = 1.72;
const SPHERE_RADIUS = 1.15;
const SPHERE_Z = -3;
const FOCAL = 1.9;

type Vec3 = [number, number, number];
type Camera = {
  yaw: number;
  pitch: number;
  zoom: number;
  targetYaw: number;
  targetPitch: number;
  targetZoom: number;
  yawVelocity: number;
  pitchVelocity: number;
};
type MarkerHit = { id: RegionId; x: number; y: number; radius: number; unlocked: boolean; depth: number };

const VERTEX = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_zoom;
uniform vec3 u_regionDir[5];
uniform vec3 u_regionColor[5];

#define PI 3.14159265359

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i + vec3(0,0,0));
  float n100 = hash31(i + vec3(1,0,0));
  float n010 = hash31(i + vec3(0,1,0));
  float n110 = hash31(i + vec3(1,1,0));
  float n001 = hash31(i + vec3(0,0,1));
  float n101 = hash31(i + vec3(1,0,1));
  float n011 = hash31(i + vec3(0,1,1));
  float n111 = hash31(i + vec3(1,1,1));
  return mix(
    mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
    mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.52;
  for (int i = 0; i < 5; i++) {
    v += noise3(p) * a;
    p = p * 2.03 + vec3(11.7, 4.2, 8.9);
    a *= 0.49;
  }
  return v;
}

vec3 rotateX(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(v.x, c*v.y - s*v.z, s*v.y + c*v.z);
}
vec3 rotateY(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c*v.x + s*v.z, v.y, -s*v.x + c*v.z);
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p-a, ba = b-a;
  float h = clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
  return length(pa-ba*h);
}

vec3 space(vec2 uv) {
  vec3 col = vec3(0.006,0.008,0.014);
  vec2 p = uv;
  p.x *= u_resolution.x / max(1.0, u_resolution.y);

  float stripe = exp(-pow(abs((p.y - 0.42) + (p.x - 0.55)*0.22), 2.0) * 64.0);
  float galNoise = noise3(vec3(p*3.2, 2.7));
  col += vec3(0.11,0.09,0.14) * stripe * (0.2 + galNoise*0.55);
  col += vec3(0.12,0.10,0.07) * stripe * stripe * 0.34;

  vec2 starCell = floor(v_uv * u_resolution / 3.0);
  float star = hash21(starCell);
  if (star > 0.9935) {
    float twinkle = 0.52 + 0.48*sin(u_time*(0.5 + star*1.9) + star*80.0);
    col += vec3(0.72,0.78,0.88) * twinkle * (star-0.9935) * 125.0;
  }

  vec2 moonP = v_uv - vec2(0.13,0.79);
  moonP.x *= u_resolution.x / max(1.0,u_resolution.y);
  float moonD = length(moonP);
  if (moonD < 0.032) {
    float lit = smoothstep(-0.025, 0.018, moonP.x + moonP.y*0.35);
    float rim = smoothstep(0.032, 0.024, moonD);
    col = mix(col, vec3(0.5,0.47,0.40) * (0.22 + lit*0.78), rim);
  }

  float meteorPhase = mod(u_time, 13.0);
  if (meteorPhase < 1.15) {
    float k = meteorPhase / 1.15;
    vec2 a = vec2(-0.12 + k*0.52, 0.88 - k*0.25);
    vec2 b = a - vec2(0.11, -0.052);
    float md = segmentDistance(v_uv, a, b);
    float head = length(v_uv-a);
    float m = smoothstep(0.006, 0.0, md) * smoothstep(0.16,0.01,head) * sin(k*PI);
    col += vec3(1.0,0.55,0.22)*m*0.8;
  }
  return col;
}

void main() {
  vec2 ndc = v_uv * 2.0 - 1.0;
  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  vec3 rd = normalize(vec3(ndc.x * aspect / u_zoom, ndc.y / u_zoom, -1.9));
  vec3 center = vec3(0.0,0.0,-3.0);
  vec3 oc = -center;
  float b = dot(oc, rd);
  float c = dot(oc,oc) - 1.15*1.15;
  float h = b*b-c;

  vec3 bg = space(v_uv);

  if (h < 0.0) {
    float closest = length(oc - rd*dot(oc,rd));
    float halo = smoothstep(1.34,1.15,closest) * smoothstep(1.12,1.18,closest);
    bg += vec3(0.12,0.42,0.62)*halo*0.34;
    outColor = vec4(bg,1.0);
    return;
  }

  float t = -b - sqrt(h);
  if (t <= 0.0) {
    outColor = vec4(bg,1.0);
    return;
  }

  vec3 pos = rd*t - center;
  vec3 n = normalize(pos);
  vec3 worldN = rotateY(rotateX(n, u_pitch), u_yaw);

  float rough = fbm(worldN*4.7);
  float fine = fbm(worldN*15.0 + vec3(3.1,7.9,2.4));
  float maxInf = 0.0;
  vec3 landColor = vec3(0.36,0.32,0.27);
  float regionMix[5];
  for (int i=0; i<5; i++) {
    float d = dot(worldN, u_regionDir[i]);
    float edge = 0.735 + (rough-0.5)*0.12 + (fine-0.5)*0.035;
    float inf = smoothstep(edge, 0.94, d);
    regionMix[i] = inf;
    if (inf > maxInf) {
      maxInf = inf;
      landColor = u_regionColor[i];
    }
  }

  float latitude = asin(clamp(worldN.y,-1.0,1.0));
  float polar = smoothstep(0.91, 1.18, abs(latitude));
  float landMask = smoothstep(0.09,0.30,maxInf + rough*0.13 - 0.08);
  landMask = max(landMask, polar*0.78);

  vec3 oceanDeep = vec3(0.032,0.115,0.14);
  vec3 oceanShallow = vec3(0.08,0.25,0.28);
  vec3 ocean = mix(oceanDeep,oceanShallow,clamp(0.24+rough*0.62,0.0,1.0));
  vec3 land = landColor * (0.64 + rough*0.55);
  land *= 0.90 + (fine-0.5)*0.18;

  float blackspire = regionMix[2];
  float ridge = pow(clamp((fine-0.48)*2.1,0.0,1.0),2.0)*blackspire;
  land += vec3(0.12,0.13,0.14)*ridge;
  land = mix(land, vec3(0.67,0.69,0.68), polar*0.74);

  vec3 base = mix(ocean, land, landMask);

  vec3 lightDir = normalize(vec3(-0.63,0.50,0.71));
  float ndl = dot(n,lightDir);
  float daylight = smoothstep(-0.22,0.32,ndl);
  float diffuse = 0.18 + max(ndl,0.0)*0.91;
  base *= diffuse;

  float spec = pow(max(dot(reflect(-lightDir,n),-rd),0.0),68.0) * (1.0-landMask);
  base += vec3(0.44,0.62,0.63)*spec*0.55;

  float lon = atan(worldN.x,worldN.z);
  vec2 cityCell = floor(vec2(lon*88.0, latitude*102.0));
  float cityHash = hash21(cityCell);
  float cityRegion = max(regionMix[4]*1.45, max(regionMix[0]*0.55, regionMix[1]*0.38));
  float city = step(0.958, cityHash) * cityRegion * (1.0-daylight);
  base += vec3(1.0,0.56,0.16)*city*1.6;

  vec3 cloudN = normalize(worldN + vec3(u_time*0.0035,0.0,u_time*0.0016));
  float cloudNoise = fbm(cloudN*6.8 + vec3(u_time*0.012,0.0,0.0));
  float clouds = smoothstep(0.58,0.75,cloudNoise) * (0.38+daylight*0.62);
  base = mix(base, vec3(0.73,0.78,0.76), clouds*0.28);

  float fresnel = pow(1.0-max(dot(n,-rd),0.0),3.0);
  base += vec3(0.12,0.47,0.67)*fresnel*0.72;
  base += vec3(0.88,0.65,0.31)*pow(max(dot(n,lightDir),0.0),5.0)*fresnel*0.16;

  float vignette = smoothstep(1.3,0.22,length(ndc*vec2(0.75,1.0)));
  vec3 col = mix(bg,base,0.96);
  col *= 0.93 + vignette*0.07;
  col = pow(col,vec3(0.92));
  outColor = vec4(col,1.0);
}`;

const REGION_COLORS: Record<RegionId, Vec3> = {
  ironclad: [0.55, 0.43, 0.33],
  slagtown: [0.64, 0.27, 0.16],
  blackspire: [0.24, 0.27, 0.29],
  brasswater: [0.29, 0.48, 0.42],
  veyra: [0.31, 0.57, 0.58],
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi,Math.max(lo,v));
}
function wrap(v: number) {
  while (v > Math.PI) v -= Math.PI*2;
  while (v < -Math.PI) v += Math.PI*2;
  return v;
}
function shortest(from: number,to: number) {
  return wrap(to-from);
}
function worldVector(lat: number,lon: number): Vec3 {
  const la=lat*DEG, lo=lon*DEG, cl=Math.cos(la);
  return [cl*Math.sin(lo),Math.sin(la),cl*Math.cos(lo)];
}
function rotateY(v: Vec3,a: number): Vec3 {
  const c=Math.cos(a),s=Math.sin(a);
  return [c*v[0]+s*v[2],v[1],-s*v[0]+c*v[2]];
}
function rotateX(v: Vec3,a: number): Vec3 {
  const c=Math.cos(a),s=Math.sin(a);
  return [v[0],c*v[1]-s*v[2],s*v[1]+c*v[2]];
}
function toCamera(v: Vec3,camera: Camera): Vec3 {
  return rotateX(rotateY(v,-camera.yaw),-camera.pitch);
}
function targetFor(id: RegionId) {
  const marker=regionById(id).marker;
  return { yaw: marker.lon*DEG, pitch: -marker.lat*DEG, zoom: 1.13 };
}
function compile(gl: WebGL2RenderingContext,type: number,source: string) {
  const shader=gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate shader.");
  gl.shaderSource(shader,source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
    const message=gl.getShaderInfoLog(shader) ?? "Unknown shader compile error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}
function openRegionMap(regionId: RegionId) {
  window.dispatchEvent(new CustomEvent("hollow:open-region-map",{detail:{regionId}}));
}

export function HollowGlobeWebGL({loc,onSelect}:{loc:LocationId;onSelect:(id:LocationId)=>void}) {
  const webglRef=useRef<HTMLCanvasElement>(null);
  const markerRef=useRef<HTMLCanvasElement>(null);
  const stageRef=useRef<HTMLDivElement>(null);
  const locations=useGame((g)=>g.s.locations);
  const selectedFromGame=canonicalRegionId(loc)??"ironclad";
  const [selected,setSelected]=useState<RegionId>(selectedFromGame);
  const [failed,setFailed]=useState(false);
  const [dragging,setDragging]=useState(false);
  const [hint,setHint]=useState("Drag the planet · pinch to zoom");
  const initial=targetFor(selectedFromGame);
  const camera=useRef<Camera>({yaw:initial.yaw,pitch:initial.pitch,zoom:initial.zoom,targetYaw:initial.yaw,targetPitch:initial.pitch,targetZoom:initial.zoom,yawVelocity:0,pitchVelocity:0});
  const markers=useRef<MarkerHit[]>([]);
  const pointers=useRef(new Map<number,{x:number;y:number}>());
  const drag=useRef<{id:number;x:number;y:number;t:number;moved:boolean}|null>(null);
  const pinch=useRef<{distance:number;zoom:number}|null>(null);
  const lastInteraction=useRef(performance.now());

  useEffect(()=>{
    const t=targetFor(selectedFromGame), c=camera.current;
    c.targetYaw=c.yaw+shortest(c.yaw,t.yaw);
    c.targetPitch=t.pitch;
    c.targetZoom=Math.max(c.zoom,1.05);
    c.yawVelocity=0;c.pitchVelocity=0;
    setSelected(selectedFromGame);
  },[selectedFromGame]);

  const focusRegion=(id:RegionId)=>{
    const location=REGION_TO_LOCATION[id];
    if(!locations[location]?.unlocked)return;
    const t=targetFor(id),c=camera.current;
    c.targetYaw=c.yaw+shortest(c.yaw,t.yaw);
    c.targetPitch=t.pitch;c.targetZoom=1.18;c.yawVelocity=0;c.pitchVelocity=0;
    setSelected(id);onSelect(location);lastInteraction.current=performance.now();sfx.click();
    setHint(`${regionById(id).name} acquired`);
  };
  const zoomBy=(factor:number)=>{
    camera.current.targetZoom=clamp(camera.current.targetZoom*factor,MIN_ZOOM,MAX_ZOOM);
    lastInteraction.current=performance.now();
  };
  const reset=()=>{
    const t=targetFor(selected),c=camera.current;
    c.targetYaw=c.yaw+shortest(c.yaw,t.yaw);c.targetPitch=t.pitch;c.targetZoom=1.13;c.yawVelocity=0;c.pitchVelocity=0;
    lastInteraction.current=performance.now();setHint("Orbital camera recentered");sfx.click();
  };

  useEffect(()=>{
    const canvas=webglRef.current,overlay=markerRef.current,stage=stageRef.current;
    if(!canvas||!overlay||!stage)return;
    const gl=canvas.getContext("webgl2",{antialias:true,alpha:false,powerPreference:"high-performance"});
    const ctx=overlay.getContext("2d");
    if(!gl||!ctx){setFailed(true);return;}

    let program:WebGLProgram|null=null;
    let vao:WebGLVertexArrayObject|null=null;
    let buffer:WebGLBuffer|null=null;
    try{
      const vs=compile(gl,gl.VERTEX_SHADER,VERTEX);
      const fs=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT);
      program=gl.createProgram();
      if(!program)throw new Error("Unable to allocate WebGL program.");
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)??"WebGL link failed.");
      vao=gl.createVertexArray();buffer=gl.createBuffer();
      gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,"a_position");
      gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    }catch(error){
      console.warn("Hollow Realm WebGL fallback",error);setFailed(true);return;
    }

    const resolution=gl.getUniformLocation(program,"u_resolution");
    const time=gl.getUniformLocation(program,"u_time");
    const yaw=gl.getUniformLocation(program,"u_yaw");
    const pitch=gl.getUniformLocation(program,"u_pitch");
    const zoom=gl.getUniformLocation(program,"u_zoom");
    const dirs=gl.getUniformLocation(program,"u_regionDir[0]");
    const colors=gl.getUniformLocation(program,"u_regionColor[0]");
    const regionDirs=new Float32Array(CANONICAL_REGION_IDS.flatMap((id)=>worldVector(regionById(id).marker.lat,regionById(id).marker.lon)));
    const regionColors=new Float32Array(CANONICAL_REGION_IDS.flatMap((id)=>REGION_COLORS[id]));

    let width=1,height=1,dpr=1,raf=0,prev=performance.now();
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize=()=>{
      const rect=stage.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
      dpr=Math.min(width<600?1.55:2,window.devicePixelRatio||1);
      for(const c of [canvas,overlay]){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);c.style.width=`${width}px`;c.style.height=`${height}px`;}
      ctx.setTransform(dpr,0,0,dpr,0,0);gl.viewport(0,0,canvas.width,canvas.height);
    };
    const ro=new ResizeObserver(resize);ro.observe(stage);resize();

    const drawMarkers=(now:number)=>{
      ctx.clearRect(0,0,width,height);markers.current=[];
      const c=camera.current,aspect=width/Math.max(1,height);
      for(const id of CANONICAL_REGION_IDS){
        const region=regionById(id),location=REGION_TO_LOCATION[id],unlocked=!!locations[location]?.unlocked;
        const n=toCamera(worldVector(region.marker.lat,region.marker.lon),c);
        if(n[2]<0.02)continue;
        const pz=SPHERE_Z+SPHERE_RADIUS*n[2];
        const ndcX=(SPHERE_RADIUS*n[0]/-pz)*FOCAL*c.zoom/aspect;
        const ndcY=(SPHERE_RADIUS*n[1]/-pz)*FOCAL*c.zoom;
        if(Math.abs(ndcX)>1.15||Math.abs(ndcY)>1.15)continue;
        const x=(ndcX*0.5+0.5)*width,y=(0.5-ndcY*0.5)*height,active=id===selected;
        const depth=clamp(n[2],0,1),r=(active?7.2:5.4)+depth*2;
        markers.current.push({id,x,y,radius:31,unlocked,depth});
        ctx.save();ctx.globalAlpha=unlocked?0.58+depth*0.42:0.28;
        ctx.strokeStyle=active?"#edc777":unlocked?"#bba264":"#696968";ctx.fillStyle=active?"#f4d38d":unlocked?"#cab177":"#666766";
        ctx.shadowColor=active?"rgba(238,191,105,.7)":"rgba(190,160,95,.28)";ctx.shadowBlur=active?17:7;
        ctx.beginPath();ctx.arc(x,y,r+(active?Math.sin(now*0.004)*1.1:0),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,r+7,0,Math.PI*2);ctx.stroke();
        const label=unlocked?region.name:"SEALED";ctx.font=`${active?600:500} ${active?11:10}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        const tw=ctx.measureText(label).width,bx=clamp(x-tw/2-8,5,width-tw-21),by=y+r+12;
        ctx.fillStyle=active?"rgba(27,21,14,.93)":"rgba(5,7,9,.76)";ctx.beginPath();ctx.roundRect(bx,by,tw+16,22,7);ctx.fill();
        ctx.strokeStyle=active?"rgba(229,188,108,.52)":"rgba(150,135,100,.22)";ctx.stroke();
        ctx.fillStyle=active?"#efd49b":unlocked?"#c8bfad":"#77736b";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,bx+(tw+16)/2,by+11);ctx.restore();
      }
    };

    const frame=(now:number)=>{
      const dt=Math.min(.034,Math.max(.001,(now-prev)/1000));prev=now;
      const c=camera.current,idle=now-lastInteraction.current;
      if(!drag.current&&pointers.current.size<2){
        if(!reduced&&idle>4300&&Math.abs(shortest(c.yaw,c.targetYaw))<.024)c.targetYaw+=dt*.032;
        if(Math.abs(c.yawVelocity)>.002||Math.abs(c.pitchVelocity)>.002){
          c.yaw+=c.yawVelocity*dt;c.pitch+=c.pitchVelocity*dt;
          const f=Math.exp(-4.25*dt);c.yawVelocity*=f;c.pitchVelocity*=f;c.targetYaw=c.yaw;c.targetPitch=c.pitch;
        }else{
          c.yawVelocity=0;c.pitchVelocity=0;const a=1-Math.exp(-5.6*dt);
          c.yaw+=shortest(c.yaw,c.targetYaw)*a;c.pitch+=(c.targetPitch-c.pitch)*a;
        }
      }
      c.pitch=clamp(c.pitch,-1.05,1.05);c.targetPitch=clamp(c.targetPitch,-1.05,1.05);
      c.zoom+=(c.targetZoom-c.zoom)*(1-Math.exp(-7.0*dt));c.zoom=clamp(c.zoom,MIN_ZOOM,MAX_ZOOM);
      c.yaw=wrap(c.yaw);c.targetYaw=c.yaw+shortest(c.yaw,c.targetYaw);

      gl.useProgram(program);gl.bindVertexArray(vao);
      gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,now/1000);gl.uniform1f(yaw,c.yaw);gl.uniform1f(pitch,c.pitch);gl.uniform1f(zoom,c.zoom);
      gl.uniform3fv(dirs,regionDirs);gl.uniform3fv(colors,regionColors);gl.drawArrays(gl.TRIANGLES,0,3);
      drawMarkers(now);raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);ro.disconnect();if(buffer)gl.deleteBuffer(buffer);if(vao)gl.deleteVertexArray(vao);if(program)gl.deleteProgram(program);};
  },[locations,selected]);

  useEffect(()=>{
    const stage=stageRef.current;if(!stage||failed)return;
    const pinchDistance=()=>{const pts=[...pointers.current.values()];return pts.length<2?0:Math.hypot(pts[0]!.x-pts[1]!.x,pts[0]!.y-pts[1]!.y);};
    const down=(e:PointerEvent)=>{
      stage.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});lastInteraction.current=performance.now();
      const c=camera.current;c.yawVelocity=0;c.pitchVelocity=0;
      if(pointers.current.size===2){pinch.current={distance:Math.max(1,pinchDistance()),zoom:c.targetZoom};drag.current=null;setDragging(true);return;}
      drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),moved:false};setDragging(true);
    };
    const move=(e:PointerEvent)=>{
      if(!pointers.current.has(e.pointerId))return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});lastInteraction.current=performance.now();
      const c=camera.current;
      if(pointers.current.size>=2&&pinch.current){const ratio=pinchDistance()/Math.max(1,pinch.current.distance);c.targetZoom=clamp(pinch.current.zoom*ratio,MIN_ZOOM,MAX_ZOOM);c.zoom+=(c.targetZoom-c.zoom)*.38;setHint(`Orbital zoom ${c.targetZoom.toFixed(2)}×`);return;}
      const d=drag.current;if(!d||d.id!==e.pointerId||pointers.current.size!==1)return;
      const now=performance.now(),dx=e.clientX-d.x,dy=e.clientY-d.y,elapsed=Math.max(8,now-d.t);if(Math.hypot(dx,dy)>3)d.moved=true;
      c.yaw-=dx*.00455;c.pitch+=dy*.0037;c.targetYaw=c.yaw;c.targetPitch=c.pitch;
      c.yawVelocity=clamp((-dx/elapsed)*4.1,-2.3,2.3);c.pitchVelocity=clamp((dy/elapsed)*3.2,-1.7,1.7);
      d.x=e.clientX;d.y=e.clientY;d.t=now;setHint("Release to coast");
    };
    const up=(e:PointerEvent)=>{
      const d=drag.current,wasTap=d?.id===e.pointerId&&!d.moved,point=pointers.current.get(e.pointerId);pointers.current.delete(e.pointerId);
      if(pointers.current.size<2)pinch.current=null;if(pointers.current.size===0){drag.current=null;setDragging(false);setHint("Drag the planet · pinch to zoom");}
      lastInteraction.current=performance.now();
      if(wasTap&&point){const rect=stage.getBoundingClientRect(),px=point.x-rect.left,py=point.y-rect.top;let best:MarkerHit|null=null,bestD=Infinity;
        for(const marker of markers.current){const distance=Math.hypot(px-marker.x,py-marker.y);if(distance<marker.radius&&distance<bestD){best=marker;bestD=distance;}}
        if(best?.unlocked)focusRegion(best.id);
      }
    };
    const wheel=(e:WheelEvent)=>{e.preventDefault();zoomBy(e.deltaY>0?.92:1.09);setHint(`Orbital zoom ${camera.current.targetZoom.toFixed(2)}×`);};
    stage.addEventListener("pointerdown",down);stage.addEventListener("pointermove",move);stage.addEventListener("pointerup",up);stage.addEventListener("pointercancel",up);stage.addEventListener("wheel",wheel,{passive:false});
    return()=>{stage.removeEventListener("pointerdown",down);stage.removeEventListener("pointermove",move);stage.removeEventListener("pointerup",up);stage.removeEventListener("pointercancel",up);stage.removeEventListener("wheel",wheel);};
  },[failed,locations,selected]);

  if(failed)return <HollowGlobeAAA loc={loc} onSelect={onSelect}/>;
  const region=regionById(selected),location=REGION_TO_LOCATION[selected],unlocked=!!locations[location]?.unlocked;
  return <div className="overflow-hidden rounded-[var(--radius-xl)] border border-line/70 bg-[#020307] shadow-[0_28px_90px_rgba(0,0,0,.5)]">
    <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-surface/75 px-3 py-2.5 backdrop-blur-md">
      <div className="min-w-0"><div className="font-display text-[9px] uppercase tracking-[0.22em] text-ember">Hollow Realm · WebGL Orbital Command</div><div className="mt-0.5 truncate text-xs text-muted">{hint}</div></div>
      <div className="flex shrink-0 items-center gap-1"><GlobeButton label="Zoom out" onClick={()=>zoomBy(.9)}><Minus className="size-4"/></GlobeButton><GlobeButton label="Zoom in" onClick={()=>zoomBy(1.1)}><Plus className="size-4"/></GlobeButton><GlobeButton label="Recenter" onClick={reset}><RotateCcw className="size-4"/></GlobeButton></div>
    </div>
    <div ref={stageRef} tabIndex={0} className={`relative h-[min(64vh,620px)] min-h-[410px] w-full touch-none select-none outline-none ${dragging?"cursor-grabbing":"cursor-grab"}`} aria-label="Interactive WebGL Hollow Realm planet. Drag to orbit and pinch to zoom.">
      <canvas ref={webglRef} className="absolute inset-0 size-full"/><canvas ref={markerRef} className="pointer-events-none absolute inset-0 size-full"/>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/55 to-transparent"/>
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
        <div className="max-w-[68%] rounded-[var(--radius-lg)] border border-line/60 bg-ink/78 px-3 py-2.5 shadow-xl backdrop-blur-md"><div className="flex items-center gap-2"><Compass className="size-4 shrink-0 text-ember"/><div className="min-w-0"><div className="truncate font-display text-sm text-paper">{region.name}</div><div className="truncate text-[11px] text-muted">{unlocked?`Danger ${region.danger} · ${region.biome.replaceAll("-"," ")}`:"SEALED · preceding boss must fall"}</div></div></div></div>
        <button type="button" disabled={!unlocked} onClick={()=>{if(!unlocked)return;sfx.deploy();openRegionMap(selected);}} className="min-h-12 shrink-0 rounded-[var(--radius-md)] border border-ember/55 bg-ember/15 px-4 font-display text-[10px] uppercase tracking-[0.15em] text-ember shadow-xl backdrop-blur-md disabled:border-line disabled:bg-ink/70 disabled:text-muted">{unlocked?"Enter Region":"Sealed"}</button>
      </div>
    </div>
  </div>;
}

function GlobeButton({label,onClick,children}:{label:string;onClick:()=>void;children:React.ReactNode}){
  return <button type="button" aria-label={label} onClick={()=>{sfx.click();onClick();}} className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line/70 bg-ink/70 text-moon transition-colors hover:border-ember/50 hover:text-ember">{children}</button>;
}
