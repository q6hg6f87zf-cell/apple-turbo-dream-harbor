import { CANONICAL_REGION_IDS, canonicalRegionId, regionById } from "@/game/data";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import type { LocationId, RegionId } from "@/game/types";
import { Compass, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
const RADIUS = 1.15;
const CENTER_Z = -3;
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
type MarkerHit = {
  id: RegionId;
  x: number;
  y: number;
  radius: number;
  unlocked: boolean;
};

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
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
  float a = mix(hash31(i + vec3(0.0,0.0,0.0)), hash31(i + vec3(1.0,0.0,0.0)), f.x);
  float b = mix(hash31(i + vec3(0.0,1.0,0.0)), hash31(i + vec3(1.0,1.0,0.0)), f.x);
  float c = mix(hash31(i + vec3(0.0,0.0,1.0)), hash31(i + vec3(1.0,0.0,1.0)), f.x);
  float d = mix(hash31(i + vec3(0.0,1.0,1.0)), hash31(i + vec3(1.0,1.0,1.0)), f.x);
  return mix(mix(a,b,f.y), mix(c,d,f.y), f.z);
}
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.52;
  for (int i = 0; i < 5; i++) {
    value += noise3(p) * amplitude;
    p = p * 2.03 + vec3(11.7, 4.2, 8.9);
    amplitude *= 0.49;
  }
  return value;
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
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(0.0001, dot(ba, ba)), 0.0, 1.0);
  return length(pa - ba * h);
}
vec3 drawSpace(vec2 uv) {
  vec3 color = vec3(0.006, 0.008, 0.014);
  vec2 p = uv;
  p.x *= u_resolution.x / max(1.0, u_resolution.y);
  float stripe = exp(-pow(abs((p.y - 0.42) + (p.x - 0.55) * 0.22), 2.0) * 64.0);
  float galaxyNoise = noise3(vec3(p * 3.2, 2.7));
  color += vec3(0.11, 0.09, 0.14) * stripe * (0.2 + galaxyNoise * 0.55);
  color += vec3(0.12, 0.10, 0.07) * stripe * stripe * 0.34;

  vec2 starCell = floor(uv * u_resolution / 3.0);
  float star = hash21(starCell);
  if (star > 0.9935) {
    float twinkle = 0.52 + 0.48 * sin(u_time * (0.5 + star * 1.9) + star * 80.0);
    color += vec3(0.72, 0.78, 0.88) * twinkle * (star - 0.9935) * 125.0;
  }

  vec2 moonPoint = uv - vec2(0.13, 0.79);
  moonPoint.x *= u_resolution.x / max(1.0, u_resolution.y);
  float moonDistance = length(moonPoint);
  if (moonDistance < 0.032) {
    float lit = smoothstep(-0.025, 0.018, moonPoint.x + moonPoint.y * 0.35);
    float rim = smoothstep(0.032, 0.024, moonDistance);
    color = mix(color, vec3(0.5,0.47,0.40) * (0.22 + lit * 0.78), rim);
  }

  float meteorPhase = mod(u_time, 13.0);
  if (meteorPhase < 1.15) {
    float k = meteorPhase / 1.15;
    vec2 head = vec2(-0.12 + k * 0.52, 0.88 - k * 0.25);
    vec2 tail = head - vec2(0.11, -0.052);
    float d = segmentDistance(uv, head, tail);
    float headDistance = length(uv - head);
    float meteor = smoothstep(0.006, 0.0, d) * smoothstep(0.16, 0.01, headDistance) * sin(k * PI);
    color += vec3(1.0, 0.55, 0.22) * meteor * 0.8;
  }
  return color;
}

void main() {
  vec2 ndc = v_uv * 2.0 - 1.0;
  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  vec3 ray = normalize(vec3(ndc.x * aspect / u_zoom, ndc.y / u_zoom, -1.9));
  vec3 center = vec3(0.0, 0.0, -3.0);
  vec3 originToCenter = -center;
  float b = dot(originToCenter, ray);
  float c = dot(originToCenter, originToCenter) - 1.15 * 1.15;
  float h = b * b - c;
  vec3 background = drawSpace(v_uv);

  if (h < 0.0) {
    float closest = length(originToCenter - ray * dot(originToCenter, ray));
    float halo = smoothstep(1.34, 1.15, closest) * smoothstep(1.12, 1.18, closest);
    outColor = vec4(background + vec3(0.12,0.42,0.62) * halo * 0.34, 1.0);
    return;
  }

  float t = -b - sqrt(h);
  if (t <= 0.0) {
    outColor = vec4(background, 1.0);
    return;
  }

  vec3 normal = normalize(ray * t - center);
  vec3 worldNormal = rotateY(rotateX(normal, u_pitch), u_yaw);
  float rough = fbm(worldNormal * 4.7);
  float fine = fbm(worldNormal * 15.0 + vec3(3.1,7.9,2.4));

  float strongestRegion = 0.0;
  vec3 landColor = vec3(0.36,0.32,0.27);
  float influence[5];
  for (int i = 0; i < 5; i++) {
    float dotRegion = dot(worldNormal, u_regionDir[i]);
    float coastEdge = 0.735 + (rough - 0.5) * 0.12 + (fine - 0.5) * 0.035;
    float regionInfluence = smoothstep(coastEdge, 0.94, dotRegion);
    influence[i] = regionInfluence;
    if (regionInfluence > strongestRegion) {
      strongestRegion = regionInfluence;
      landColor = u_regionColor[i];
    }
  }

  float latitude = asin(clamp(worldNormal.y, -1.0, 1.0));
  float polar = smoothstep(0.91, 1.18, abs(latitude));
  float landMask = smoothstep(0.09, 0.30, strongestRegion + rough * 0.13 - 0.08);
  landMask = max(landMask, polar * 0.78);

  vec3 ocean = mix(
    vec3(0.032,0.115,0.14),
    vec3(0.08,0.25,0.28),
    clamp(0.24 + rough * 0.62, 0.0, 1.0)
  );
  vec3 land = landColor * (0.64 + rough * 0.55) * (0.90 + (fine - 0.5) * 0.18);
  float blackspireRidge = pow(clamp((fine - 0.48) * 2.1, 0.0, 1.0), 2.0) * influence[2];
  land += vec3(0.12,0.13,0.14) * blackspireRidge;
  land = mix(land, vec3(0.67,0.69,0.68), polar * 0.74);
  vec3 surface = mix(ocean, land, landMask);

  vec3 lightDirection = normalize(vec3(-0.63,0.50,0.71));
  float light = dot(normal, lightDirection);
  float daylight = smoothstep(-0.22, 0.32, light);
  surface *= 0.18 + max(light, 0.0) * 0.91;

  float specular = pow(max(dot(reflect(-lightDirection, normal), -ray), 0.0), 68.0) * (1.0 - landMask);
  surface += vec3(0.44,0.62,0.63) * specular * 0.55;

  float longitude = atan(worldNormal.x, worldNormal.z);
  vec2 cityCell = floor(vec2(longitude * 88.0, latitude * 102.0));
  float cityRegion = max(influence[4] * 1.45, max(influence[0] * 0.55, influence[1] * 0.38));
  float cityLight = step(0.958, hash21(cityCell)) * cityRegion * (1.0 - daylight);
  surface += vec3(1.0,0.56,0.16) * cityLight * 1.6;

  vec3 cloudNormal = normalize(worldNormal + vec3(u_time * 0.0035, 0.0, u_time * 0.0016));
  float cloudNoise = fbm(cloudNormal * 6.8 + vec3(u_time * 0.012, 0.0, 0.0));
  float clouds = smoothstep(0.58, 0.75, cloudNoise) * (0.38 + daylight * 0.62);
  surface = mix(surface, vec3(0.73,0.78,0.76), clouds * 0.28);

  float fresnel = pow(1.0 - max(dot(normal, -ray), 0.0), 3.0);
  surface += vec3(0.12,0.47,0.67) * fresnel * 0.72;
  surface += vec3(0.88,0.65,0.31) * pow(max(dot(normal, lightDirection), 0.0), 5.0) * fresnel * 0.16;
  outColor = vec4(pow(mix(background, surface, 0.96), vec3(0.92)), 1.0);
}`;

const REGION_COLORS: Record<RegionId, Vec3> = {
  ironclad: [0.55, 0.43, 0.33],
  slagtown: [0.64, 0.27, 0.16],
  blackspire: [0.24, 0.27, 0.29],
  brasswater: [0.29, 0.48, 0.42],
  veyra: [0.31, 0.57, 0.58],
};

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}
function wrap(value: number) {
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}
function shortest(from: number, to: number) {
  return wrap(to - from);
}
function worldVector(lat: number, lon: number): Vec3 {
  const latitude = lat * DEG;
  const longitude = lon * DEG;
  const cosLat = Math.cos(latitude);
  return [cosLat * Math.sin(longitude), Math.sin(latitude), cosLat * Math.cos(longitude)];
}
function rotateY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
}
function rotateX(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]];
}
function toCamera(v: Vec3, camera: Camera): Vec3 {
  return rotateX(rotateY(v, -camera.yaw), -camera.pitch);
}
function targetFor(id: RegionId) {
  const marker = regionById(id).marker;
  return { yaw: marker.lon * DEG, pitch: -marker.lat * DEG, zoom: 1.13 };
}
function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation failed.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Shader compilation failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}
function openRegionMap(regionId: RegionId) {
  window.dispatchEvent(new CustomEvent("hollow:open-region-map", { detail: { regionId } }));
}

export function HollowGlobeWebGL({ loc, onSelect }: { loc: LocationId; onSelect: (id: LocationId) => void }) {
  const webglRef = useRef<HTMLCanvasElement>(null);
  const markerRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const locations = useGame((g) => g.s.locations);
  const selectedFromGame = canonicalRegionId(loc) ?? "ironclad";
  const [selected, setSelected] = useState<RegionId>(selectedFromGame);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState("Drag the planet · pinch to zoom");
  const initial = targetFor(selectedFromGame);
  const camera = useRef<Camera>({
    yaw: initial.yaw,
    pitch: initial.pitch,
    zoom: initial.zoom,
    targetYaw: initial.yaw,
    targetPitch: initial.pitch,
    targetZoom: initial.zoom,
    yawVelocity: 0,
    pitchVelocity: 0,
  });
  const markers = useRef<MarkerHit[]>([]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ id: number; x: number; y: number; t: number; moved: boolean } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const lastInteraction = useRef(performance.now());

  useEffect(() => {
    const target = targetFor(selectedFromGame);
    const c = camera.current;
    c.targetYaw = c.yaw + shortest(c.yaw, target.yaw);
    c.targetPitch = target.pitch;
    c.targetZoom = Math.max(c.zoom, 1.05);
    c.yawVelocity = 0;
    c.pitchVelocity = 0;
    setSelected(selectedFromGame);
  }, [selectedFromGame]);

  const focusRegion = (id: RegionId) => {
    const location = REGION_TO_LOCATION[id];
    if (!locations[location]?.unlocked) return;
    const target = targetFor(id);
    const c = camera.current;
    c.targetYaw = c.yaw + shortest(c.yaw, target.yaw);
    c.targetPitch = target.pitch;
    c.targetZoom = 1.18;
    c.yawVelocity = 0;
    c.pitchVelocity = 0;
    setSelected(id);
    onSelect(location);
    lastInteraction.current = performance.now();
    setHint(`${regionById(id).name} acquired`);
    sfx.click();
  };

  const zoomBy = (factor: number) => {
    camera.current.targetZoom = clamp(camera.current.targetZoom * factor, MIN_ZOOM, MAX_ZOOM);
    lastInteraction.current = performance.now();
  };

  const reset = () => {
    const target = targetFor(selected);
    const c = camera.current;
    c.targetYaw = c.yaw + shortest(c.yaw, target.yaw);
    c.targetPitch = target.pitch;
    c.targetZoom = 1.13;
    c.yawVelocity = 0;
    c.pitchVelocity = 0;
    lastInteraction.current = performance.now();
    setHint("Orbital camera recentered");
    sfx.click();
  };

  useEffect(() => {
    const canvas = webglRef.current;
    const overlay = markerRef.current;
    const stage = stageRef.current;
    if (!canvas || !overlay || !stage) return;

    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    const ctx = overlay.getContext("2d");
    if (!gl || !ctx) {
      setFailed(true);
      return;
    }

    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let buffer: WebGLBuffer | null = null;

    try {
      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) throw new Error("Program allocation failed.");
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? "Program link failed.");
      }
      vao = gl.createVertexArray();
      buffer = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    } catch (error) {
      console.warn("Hollow Realm WebGL fallback", error);
      setFailed(true);
      return;
    }

    const resolutionUniform = gl.getUniformLocation(program, "u_resolution");
    const timeUniform = gl.getUniformLocation(program, "u_time");
    const yawUniform = gl.getUniformLocation(program, "u_yaw");
    const pitchUniform = gl.getUniformLocation(program, "u_pitch");
    const zoomUniform = gl.getUniformLocation(program, "u_zoom");
    const directionsUniform = gl.getUniformLocation(program, "u_regionDir[0]");
    const colorsUniform = gl.getUniformLocation(program, "u_regionColor[0]");
    const regionDirections = new Float32Array(
      CANONICAL_REGION_IDS.flatMap((id) => {
        const marker = regionById(id).marker;
        return worldVector(marker.lat, marker.lon);
      }),
    );
    const regionColors = new Float32Array(CANONICAL_REGION_IDS.flatMap((id) => REGION_COLORS[id]));

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let previous = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(width < 600 ? 1.5 : 2, window.devicePixelRatio || 1);
      for (const element of [canvas, overlay]) {
        element.width = Math.round(width * dpr);
        element.height = Math.round(height * dpr);
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    const drawMarkers = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      markers.current = [];
      const c = camera.current;
      const aspect = width / Math.max(1, height);

      for (const id of CANONICAL_REGION_IDS) {
        const region = regionById(id);
        const location = REGION_TO_LOCATION[id];
        const unlocked = !!locations[location]?.unlocked;
        const normal = toCamera(worldVector(region.marker.lat, region.marker.lon), c);
        if (normal[2] < 0.02) continue;

        const pointZ = CENTER_Z + RADIUS * normal[2];
        const ndcX = ((RADIUS * normal[0]) / -pointZ) * FOCAL * c.zoom / aspect;
        const ndcY = ((RADIUS * normal[1]) / -pointZ) * FOCAL * c.zoom;
        if (Math.abs(ndcX) > 1.15 || Math.abs(ndcY) > 1.15) continue;

        const x = (ndcX * 0.5 + 0.5) * width;
        const y = (0.5 - ndcY * 0.5) * height;
        const active = id === selected;
        const depth = clamp(normal[2], 0, 1);
        const markerRadius = (active ? 7.2 : 5.4) + depth * 2;
        markers.current.push({ id, x, y, radius: 31, unlocked });

        ctx.save();
        ctx.globalAlpha = unlocked ? 0.58 + depth * 0.42 : 0.28;
        ctx.strokeStyle = active ? "#edc777" : unlocked ? "#bba264" : "#696968";
        ctx.fillStyle = active ? "#f4d38d" : unlocked ? "#cab177" : "#666766";
        ctx.shadowColor = active ? "rgba(238,191,105,.7)" : "rgba(190,160,95,.28)";
        ctx.shadowBlur = active ? 17 : 7;
        ctx.beginPath();
        ctx.arc(x, y, markerRadius + (active ? Math.sin(now * 0.004) * 1.1 : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, markerRadius + 7, 0, Math.PI * 2);
        ctx.stroke();

        const label = unlocked ? region.name : "SEALED";
        ctx.font = `${active ? 600 : 500} ${active ? 11 : 10}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        const textWidth = ctx.measureText(label).width;
        const boxX = clamp(x - textWidth / 2 - 8, 5, width - textWidth - 21);
        const boxY = y + markerRadius + 12;
        ctx.fillStyle = active ? "rgba(27,21,14,.93)" : "rgba(5,7,9,.76)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, textWidth + 16, 22, 7);
        ctx.fill();
        ctx.strokeStyle = active ? "rgba(229,188,108,.52)" : "rgba(150,135,100,.22)";
        ctx.stroke();
        ctx.fillStyle = active ? "#efd49b" : unlocked ? "#c8bfad" : "#77736b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, boxX + (textWidth + 16) / 2, boxY + 11);
        ctx.restore();
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.034, Math.max(0.001, (now - previous) / 1000));
      previous = now;
      const c = camera.current;
      const idleFor = now - lastInteraction.current;

      if (!drag.current && pointers.current.size < 2) {
        if (!reducedMotion && idleFor > 4300 && Math.abs(shortest(c.yaw, c.targetYaw)) < 0.024) {
          c.targetYaw += dt * 0.032;
        }
        if (Math.abs(c.yawVelocity) > 0.002 || Math.abs(c.pitchVelocity) > 0.002) {
          c.yaw += c.yawVelocity * dt;
          c.pitch += c.pitchVelocity * dt;
          const friction = Math.exp(-4.25 * dt);
          c.yawVelocity *= friction;
          c.pitchVelocity *= friction;
          c.targetYaw = c.yaw;
          c.targetPitch = c.pitch;
        } else {
          c.yawVelocity = 0;
          c.pitchVelocity = 0;
          const spring = 1 - Math.exp(-5.6 * dt);
          c.yaw += shortest(c.yaw, c.targetYaw) * spring;
          c.pitch += (c.targetPitch - c.pitch) * spring;
        }
      }

      c.pitch = clamp(c.pitch, -1.05, 1.05);
      c.targetPitch = clamp(c.targetPitch, -1.05, 1.05);
      c.zoom += (c.targetZoom - c.zoom) * (1 - Math.exp(-7 * dt));
      c.zoom = clamp(c.zoom, MIN_ZOOM, MAX_ZOOM);
      c.yaw = wrap(c.yaw);
      c.targetYaw = c.yaw + shortest(c.yaw, c.targetYaw);

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
      gl.uniform1f(timeUniform, now / 1000);
      gl.uniform1f(yawUniform, c.yaw);
      gl.uniform1f(pitchUniform, c.pitch);
      gl.uniform1f(zoomUniform, c.zoom);
      gl.uniform3fv(directionsUniform, regionDirections);
      gl.uniform3fv(colorsUniform, regionColors);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      drawMarkers(now);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      if (buffer) gl.deleteBuffer(buffer);
      if (vao) gl.deleteVertexArray(vao);
      if (program) gl.deleteProgram(program);
    };
  }, [locations, selected]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || failed) return;

    const pinchDistance = () => {
      const points = [...pointers.current.values()];
      if (points.length < 2) return 0;
      return Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y);
    };

    const onPointerDown = (event: PointerEvent) => {
      stage.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      lastInteraction.current = performance.now();
      camera.current.yawVelocity = 0;
      camera.current.pitchVelocity = 0;

      if (pointers.current.size === 2) {
        pinch.current = { distance: Math.max(1, pinchDistance()), zoom: camera.current.targetZoom };
        drag.current = null;
        setDragging(true);
        return;
      }
      drag.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        t: performance.now(),
        moved: false,
      };
      setDragging(true);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      lastInteraction.current = performance.now();
      const c = camera.current;

      if (pointers.current.size >= 2 && pinch.current) {
        const ratio = pinchDistance() / Math.max(1, pinch.current.distance);
        c.targetZoom = clamp(pinch.current.zoom * ratio, MIN_ZOOM, MAX_ZOOM);
        c.zoom += (c.targetZoom - c.zoom) * 0.38;
        setHint(`Orbital zoom ${c.targetZoom.toFixed(2)}×`);
        return;
      }

      const state = drag.current;
      if (!state || state.id !== event.pointerId || pointers.current.size !== 1) return;
      const now = performance.now();
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      const elapsed = Math.max(8, now - state.t);
      if (Math.hypot(dx, dy) > 3) state.moved = true;
      c.yaw -= dx * 0.00455;
      c.pitch += dy * 0.0037;
      c.targetYaw = c.yaw;
      c.targetPitch = c.pitch;
      c.yawVelocity = clamp((-dx / elapsed) * 4.1, -2.3, 2.3);
      c.pitchVelocity = clamp((dy / elapsed) * 3.2, -1.7, 1.7);
      state.x = event.clientX;
      state.y = event.clientY;
      state.t = now;
      setHint("Release to coast");
    };

    const onPointerUp = (event: PointerEvent) => {
      const state = drag.current;
      const wasTap = state?.id === event.pointerId && !state.moved;
      const point = pointers.current.get(event.pointerId);
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size === 0) {
        drag.current = null;
        setDragging(false);
        setHint("Drag the planet · pinch to zoom");
      }
      lastInteraction.current = performance.now();

      if (wasTap && point) {
        const rect = stage.getBoundingClientRect();
        const x = point.x - rect.left;
        const y = point.y - rect.top;
        let best: MarkerHit | null = null;
        let bestDistance = Infinity;
        for (const marker of markers.current) {
          const distance = Math.hypot(x - marker.x, y - marker.y);
          if (distance < marker.radius && distance < bestDistance) {
            best = marker;
            bestDistance = distance;
          }
        }
        if (best?.unlocked) focusRegion(best.id);
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomBy(event.deltaY > 0 ? 0.92 : 1.09);
      setHint(`Orbital zoom ${camera.current.targetZoom.toFixed(2)}×`);
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
      stage.removeEventListener("wheel", onWheel);
    };
  }, [failed, locations, selected]);

  if (failed) return <HollowGlobeAAA loc={loc} onSelect={onSelect} />;

  const region = regionById(selected);
  const location = REGION_TO_LOCATION[selected];
  const unlocked = !!locations[location]?.unlocked;

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-line/70 bg-[#020307] shadow-[0_28px_90px_rgba(0,0,0,.5)]">
      <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-surface/75 px-3 py-2.5 backdrop-blur-md">
        <div className="min-w-0">
          <div className="font-display text-[9px] uppercase tracking-[0.22em] text-ember">Hollow Realm · WebGL Orbital Command</div>
          <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <GlobeButton label="Zoom out" onClick={() => zoomBy(0.9)}><Minus className="size-4" /></GlobeButton>
          <GlobeButton label="Zoom in" onClick={() => zoomBy(1.1)}><Plus className="size-4" /></GlobeButton>
          <GlobeButton label="Recenter" onClick={reset}><RotateCcw className="size-4" /></GlobeButton>
        </div>
      </div>

      <div
        ref={stageRef}
        tabIndex={0}
        className={`relative h-[min(64vh,620px)] min-h-[410px] w-full touch-none select-none outline-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        aria-label="Interactive WebGL Hollow Realm planet. Drag to orbit and pinch to zoom."
      >
        <canvas ref={webglRef} className="absolute inset-0 size-full" />
        <canvas ref={markerRef} className="pointer-events-none absolute inset-0 size-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="max-w-[68%] rounded-[var(--radius-lg)] border border-line/60 bg-ink/78 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Compass className="size-4 shrink-0 text-ember" />
              <div className="min-w-0">
                <div className="truncate font-display text-sm text-paper">{region.name}</div>
                <div className="truncate text-[11px] text-muted">
                  {unlocked ? `Danger ${region.danger} · ${region.biome.replaceAll("-", " ")}` : "SEALED · preceding boss must fall"}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={!unlocked}
            onClick={() => {
              if (!unlocked) return;
              sfx.deploy();
              openRegionMap(selected);
            }}
            className="min-h-12 shrink-0 rounded-[var(--radius-md)] border border-ember/55 bg-ember/15 px-4 font-display text-[10px] uppercase tracking-[0.15em] text-ember shadow-xl backdrop-blur-md disabled:border-line disabled:bg-ink/70 disabled:text-muted"
          >
            {unlocked ? "Enter Region" : "Sealed"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GlobeButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        sfx.click();
        onClick();
      }}
      className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line/70 bg-ink/70 text-moon transition-colors hover:border-ember/50 hover:text-ember"
    >
      {children}
    </button>
  );
}
