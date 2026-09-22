import { REGION_ART } from "@/game/art";
import { loadRegionLayout, poiMapUv, poiShortLabel, type RegionMapLayout } from "@/game/map-layouts";
import type { RegionId, RegionPointOfInterest } from "@/game/types";
import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

const DEG = Math.PI / 180;
const MIN_ZOOM = 0.85;
const MAX_ZOOM = 2.6;
const YAW_LIMIT = 16 * DEG;
const ASPECT = 1792 / 1008;
const DISPLACE = 0.34;

export type MapPoiMark = RegionPointOfInterest & {
  known: boolean;
  silhouette: boolean;
};

export { poiShortLabel };

type ScreenPin = {
  id: string;
  x: number;
  y: number;
  known: boolean;
  silhouette: boolean;
  name: string;
  short: string;
  danger: number;
};

type Cam = {
  yaw: number;
  pitch: number;
  zoom: number;
  targetYaw: number;
  targetZoom: number;
  panX: number;
  panY: number;
  targetPanX: number;
  targetPanY: number;
};

type GlBundle = {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  mapTex: WebGLTexture;
  heightTex: WebGLTexture;
  uniforms: Record<string, WebGLUniformLocation | null>;
  triCount: number;
  dispose: () => void;
};

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
uniform mat4 u_mvp;
uniform mat4 u_model;
uniform sampler2D u_height;
uniform float u_displace;
uniform vec2 u_texel;
out vec2 v_uv;
out float v_h;
out vec3 v_world;
out vec3 v_normal;
void main() {
  vec2 uv = a_pos * 0.5 + 0.5;
  float h = texture(u_height, uv).r;
  float hx = texture(u_height, uv + vec2(u_texel.x, 0.0)).r - texture(u_height, uv - vec2(u_texel.x, 0.0)).r;
  float hy = texture(u_height, uv + vec2(0.0, u_texel.y)).r - texture(u_height, uv - vec2(0.0, u_texel.y)).r;
  vec3 n = normalize(vec3(-hx * u_displace * 14.0, 1.0, hy * u_displace * 14.0));
  v_uv = uv;
  v_h = h;
  vec3 local = vec3(a_pos.x * ${ASPECT.toFixed(4)}, h * u_displace, a_pos.y);
  v_world = (u_model * vec4(local, 1.0)).xyz;
  v_normal = mat3(u_model) * n;
  gl_Position = u_mvp * vec4(local, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
in float v_h;
in vec3 v_world;
in vec3 v_normal;
out vec4 outColor;
uniform sampler2D u_map;
uniform float u_time;
uniform float u_ember;
uniform float u_teal;
uniform float u_haze;
uniform vec3 u_lightDir;
uniform vec3 u_eye;
uniform vec2 u_focus;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec3 albedo = texture(u_map, v_uv).rgb;
  // Keep paint fidelity — slight contrast lift, no muddy wash.
  albedo = pow(max(albedo, 0.0), vec3(0.92));
  albedo *= 1.06;

  vec3 N = normalize(v_normal);
  vec3 L = normalize(u_lightDir);
  vec3 V = normalize(u_eye - v_world);
  vec3 H = normalize(L + V);

  float ndl = max(dot(N, L), 0.0);
  float wrap = ndl * 0.72 + 0.28;
  float hemi = N.y * 0.5 + 0.5;
  float ao = mix(0.62, 1.0, smoothstep(0.05, 0.55, v_h));
  float roof = smoothstep(0.32, 0.78, v_h);
  float spec = pow(max(dot(N, H), 0.0), mix(24.0, 56.0, roof)) * mix(0.08, 0.28, roof);

  vec3 warmFill = vec3(0.28, 0.16, 0.08) * (0.4 + u_ember * 0.5);
  vec3 coolFill = vec3(0.05, 0.09, 0.11) * (0.3 + u_teal * 0.55);
  vec3 ambient = (warmFill + coolFill) * (0.7 + hemi * 0.4);
  vec3 lit = albedo * (ambient + vec3(1.12, 0.98, 0.82) * wrap * 0.95) * ao;
  lit += vec3(1.0, 0.85, 0.58) * spec * ao;

  // Contact shade in valleys so districts read as relief.
  float valley = 1.0 - smoothstep(0.0, 0.35, v_h);
  lit *= mix(1.0, 0.78, valley * 0.55);

  // Far atmospheric depth — charcoal, not mush.
  float dist = length(v_uv - u_focus);
  float haze = smoothstep(0.22, 1.05, dist) * u_haze;
  vec3 hazeCol = mix(vec3(0.06, 0.05, 0.045), vec3(0.16, 0.08, 0.04), u_ember * 0.7);
  hazeCol = mix(hazeCol, vec3(0.04, 0.1, 0.12), u_teal);
  lit = mix(lit, hazeCol, haze * 0.38);

  // Industrial smoke sheets that scroll with wind.
  float smoke = noise(v_uv * vec2(7.0, 4.5) + vec2(u_time * 0.035, -u_time * 0.02));
  smoke *= noise(v_uv * vec2(13.0, 9.0) - vec2(u_time * 0.02, u_time * 0.015));
  smoke = pow(smoke, 2.8) * (0.12 + roof * 0.22) * (0.45 + u_ember * 0.55);
  lit += vec3(0.14, 0.09, 0.05) * smoke;

  // Ember sparks near hot districts.
  float spark = step(0.992, hash21(floor(v_uv * 90.0) + floor(u_time * 3.0)));
  lit += vec3(1.0, 0.45, 0.12) * spark * roof * u_ember * 0.65;

  // Kane heat as outer rim only.
  float rim = pow(haze, 1.45);
  lit += vec3(0.28, 0.08, 0.02) * rim * u_ember * 0.5;
  lit += vec3(0.02, 0.14, 0.16) * rim * u_teal * 0.4;

  // Soft vignette — table focus, not CRT mush.
  float vig = smoothstep(1.25, 0.28, dist);
  lit *= mix(0.78, 1.0, vig);

  outColor = vec4(clamp(lit, 0.0, 1.6), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("shader alloc");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const msg = gl.getShaderInfoLog(sh) ?? "compile fail";
    gl.deleteShader(sh);
    throw new Error(msg);
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram();
  if (!p) throw new Error("program alloc");
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const msg = gl.getProgramInfoLog(p) ?? "link fail";
    gl.deleteProgram(p);
    throw new Error(msg);
  }
  return p;
}

function mat4Identity(): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function mat4Perspective(out: Float32Array, fovDeg: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan((fovDeg * DEG) / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
}

function mat4Multiply(out: Float32Array, a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  out.set(o);
}

function mat4LookAt(
  out: Float32Array,
  eye: [number, number, number],
  target: [number, number, number],
  up: [number, number, number],
) {
  const zx = eye[0] - target[0];
  const zy = eye[1] - target[1];
  const zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  const zxN = zx / len;
  const zyN = zy / len;
  const zzN = zz / len;
  let xx = up[1] * zzN - up[2] * zyN;
  let xy = up[2] * zxN - up[0] * zzN;
  let xz = up[0] * zyN - up[1] * zxN;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len;
  xy /= len;
  xz /= len;
  const yx = zyN * xz - zzN * xy;
  const yy = zzN * xx - zxN * xz;
  const yz = zxN * xy - zyN * xx;
  out[0] = xx;
  out[1] = yx;
  out[2] = zxN;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zyN;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zzN;
  out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zxN * eye[0] + zyN * eye[1] + zzN * eye[2]);
  out[15] = 1;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`map load ${src}`));
    img.src = src;
  });
}

/** Contrast-stretched luminance height so rooftops lift and ash plains sit hard. */
function bakeHeight(img: HTMLImageElement): { data: Uint8Array; w: number; h: number } {
  const w = 384;
  const h = Math.max(1, Math.round(384 / ASPECT));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { data: new Uint8Array(w * h), w, h };
  ctx.drawImage(img, 0, 0, w, h);
  const src = ctx.getImageData(0, 0, w, h).data;
  const raw = new Float32Array(w * h);
  let min = 1;
  let max = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    const lum = (src[o]! * 0.28 + src[o + 1]! * 0.52 + src[o + 2]! * 0.2) / 255;
    raw[i] = lum;
    min = Math.min(min, lum);
    max = Math.max(max, lum);
  }
  const span = Math.max(0.08, max - min);
  for (let i = 0; i < raw.length; i++) {
    const n = (raw[i]! - min) / span;
    raw[i] = Math.pow(Math.min(1, Math.max(0, n)), 0.85);
  }
  const blur = new Float32Array(w * h);
  const r = 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const yy = Math.min(h - 1, Math.max(0, y + dy));
          sum += raw[yy * w + xx]!;
          n++;
        }
      }
      blur[y * w + x] = sum / n;
    }
  }
  const data = new Uint8Array(w * h);
  for (let i = 0; i < blur.length; i++) data[i] = Math.round(blur[i]! * 255);
  return { data, w, h };
}

/** Read an authored grayscale height PNG into a CPU sample buffer + GPU-ready size. */
function heightFromAuthored(img: HTMLImageElement): { data: Uint8Array; w: number; h: number } {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { data: new Uint8Array(Math.max(1, w * h)), w: Math.max(1, w), h: Math.max(1, h) };
  ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, w, h).data;
  const data = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) data[i] = src[i * 4]!;
  return { data, w, h };
}

async function resolveHeight(
  layout: RegionMapLayout,
  regionId: RegionId,
  mapImg: HTMLImageElement,
): Promise<{ data: Uint8Array; w: number; h: number; source: "authored" | "baked" }> {
  const url = layout.height || `/map/regions/${regionId}.height.png?v=h1`;
  try {
    const img = await loadImage(url);
    return { ...heightFromAuthored(img), source: "authored" };
  } catch {
    return { ...bakeHeight(mapImg), source: "baked" };
  }
}

function createTex(gl: WebGL2RenderingContext, withMips = false) {
  const tex = gl.createTexture();
  if (!tex) throw new Error("tex");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Region paintings are NPOT (1792×1008) — mipmaps go black on many GPUs.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, withMips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function projectPin(
  u: number,
  v: number,
  height: number,
  mvp: Float32Array,
  width: number,
  heightPx: number,
): { x: number; y: number; visible: boolean } {
  const x = (u * 2 - 1) * ASPECT;
  const z = v * 2 - 1;
  const y = height;
  const clipX = mvp[0]! * x + mvp[4]! * y + mvp[8]! * z + mvp[12]!;
  const clipY = mvp[1]! * x + mvp[5]! * y + mvp[9]! * z + mvp[13]!;
  const clipW = mvp[3]! * x + mvp[7]! * y + mvp[11]! * z + mvp[15]!;
  if (clipW <= 0.02) return { x: -999, y: -999, visible: false };
  const ndcX = clipX / clipW;
  const ndcY = clipY / clipW;
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (1 - (ndcY * 0.5 + 0.5)) * heightPx,
    visible: ndcX > -1.2 && ndcX < 1.2 && ndcY > -1.25 && ndcY < 1.25,
  };
}

function sampleHeight(field: Uint8Array, fw: number, fh: number, u: number, v: number) {
  const x = Math.min(fw - 1, Math.max(0, Math.round(u * (fw - 1))));
  const y = Math.min(fh - 1, Math.max(0, Math.round(v * (fh - 1))));
  return (field[y * fw + x] ?? 0) / 255;
}

/**
 * Distance so the landscape plane fills the viewport (cover, not letterbox).
 * Plane spans X ∈ [-ASPECT, ASPECT], Z ∈ [-1, 1].
 */
function coverDistance(pitch: number, fovDeg: number, viewAspect: number, zoom: number): number {
  const halfFov = (fovDeg * DEG) / 2;
  const visibleH = 2 * Math.tan(halfFov); // at distance 1
  const visibleW = visibleH * viewAspect;
  // Projected footprint of the map when viewed at pitch (cos shrinks depth axis).
  const cosP = Math.max(0.35, Math.cos(Math.PI / 2 - pitch));
  const mapW = ASPECT * 2;
  const mapD = 2 * cosP;
  // Cover: pick distance from the AXIS that needs to be CROPPED (the tighter fill).
  const distForW = mapW / Math.max(0.001, visibleW);
  const distForD = mapD / Math.max(0.001, visibleH);
  return (Math.min(distForW, distForD) * 0.96) / Math.max(0.5, zoom);
}

export function RegionMapStage({
  regionId,
  pois,
  selectedPoiId,
  heat = 0,
  onSelectPoi,
  onFailed,
  className,
}: {
  regionId: RegionId;
  pois: MapPoiMark[];
  selectedPoiId: string | null;
  heat?: number;
  onSelectPoi: (id: string, clientX?: number, clientY?: number) => void;
  onFailed: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bundle = useRef<GlBundle | null>(null);
  const heightField = useRef<{ data: Uint8Array; w: number; h: number } | null>(null);
  const layoutRef = useRef<RegionMapLayout | null>(null);
  const cam = useRef<Cam | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [pins, setPins] = useState<ScreenPin[]>([]);
  const [ready, setReady] = useState(false);
  const mvpScratch = useRef(mat4Identity());
  const modelScratch = useRef(mat4Identity());
  const projScratch = useRef(mat4Identity());
  const viewScratch = useRef(mat4Identity());
  const poisRef = useRef(pois);
  poisRef.current = pois;
  const heatRef = useRef(heat);
  heatRef.current = heat;
  const onFailedRef = useRef(onFailed);
  onFailedRef.current = onFailed;
  const lastFrame = useRef(0);
  const eyeRef = useRef<[number, number, number]>([0, 2, 2]);

  useEffect(() => {
    const onZoom = (ev: Event) => {
      const delta = (ev as CustomEvent<{ delta?: number }>).detail?.delta ?? 0;
      if (!cam.current || !delta) return;
      cam.current.targetZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.current.targetZoom + delta));
    };
    window.addEventListener("hollow:region-zoom", onZoom);
    return () => window.removeEventListener("hollow:region-zoom", onZoom);
  }, []);

  useEffect(() => {
    let dead = false;
    let raf = 0;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    (async () => {
      try {
        const layout = await loadRegionLayout(regionId);
        if (dead) return;
        layoutRef.current = layout;
        cam.current = {
          yaw: layout.camera.yaw * DEG,
          pitch: Math.max(48, layout.camera.pitch) * DEG,
          zoom: 1.05,
          targetYaw: layout.camera.yaw * DEG,
          targetZoom: 1.12,
          panX: 0,
          panY: 0,
          targetPanX: 0,
          targetPanY: 0,
        };

        const gl = canvas.getContext("webgl2", {
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
        });
        if (!gl) throw new Error("no webgl2");

        const program = link(gl, VERT, FRAG);
        const vao = gl.createVertexArray();
        const buf = gl.createBuffer();
        if (!vao || !buf) throw new Error("geo");
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        const segs = 96;
        const verts: number[] = [];
        for (let y = 0; y < segs; y++) {
          for (let x = 0; x < segs; x++) {
            const x0 = (x / segs) * 2 - 1;
            const x1 = ((x + 1) / segs) * 2 - 1;
            const y0 = (y / segs) * 2 - 1;
            const y1 = ((y + 1) / segs) * 2 - 1;
            verts.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1);
          }
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const triCount = verts.length / 2;

        const img = await loadImage(layout.map || REGION_ART[regionId]);
        if (dead) return;
        const height = await resolveHeight(layout, regionId, img);
        if (dead) return;
        heightField.current = height;

        const mapTex = createTex(gl, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        const heightTex = gl.createTexture();
        if (!heightTex) throw new Error("height tex");
        gl.bindTexture(gl.TEXTURE_2D, heightTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.R8,
          height.w,
          height.h,
          0,
          gl.RED,
          gl.UNSIGNED_BYTE,
          height.data,
        );
        // Expose source for QA / debugging without noisy logs in prod.
        if (typeof document !== "undefined") {
          stage.dataset.heightSource = height.source;
        }

        const uniforms: Record<string, WebGLUniformLocation | null> = {
          u_mvp: gl.getUniformLocation(program, "u_mvp"),
          u_model: gl.getUniformLocation(program, "u_model"),
          u_height: gl.getUniformLocation(program, "u_height"),
          u_displace: gl.getUniformLocation(program, "u_displace"),
          u_texel: gl.getUniformLocation(program, "u_texel"),
          u_map: gl.getUniformLocation(program, "u_map"),
          u_time: gl.getUniformLocation(program, "u_time"),
          u_ember: gl.getUniformLocation(program, "u_ember"),
          u_teal: gl.getUniformLocation(program, "u_teal"),
          u_haze: gl.getUniformLocation(program, "u_haze"),
          u_focus: gl.getUniformLocation(program, "u_focus"),
          u_lightDir: gl.getUniformLocation(program, "u_lightDir"),
          u_eye: gl.getUniformLocation(program, "u_eye"),
        };

        bundle.current = {
          gl,
          program,
          vao,
          mapTex,
          heightTex,
          uniforms,
          triCount,
          dispose: () => {
            gl.deleteBuffer(buf);
            gl.deleteVertexArray(vao);
            gl.deleteTexture(mapTex);
            gl.deleteTexture(heightTex);
            gl.deleteProgram(program);
          },
        };

        const t0 = performance.now();
        lastFrame.current = t0;
        const tick = (now: number) => {
          if (dead || !bundle.current || !cam.current || !layoutRef.current) return;
          const b = bundle.current;
          const c = cam.current;
          const L = layoutRef.current;
          const dt = Math.min(0.05, (now - lastFrame.current) / 1000 || 0.016);
          lastFrame.current = now;

          c.yaw += (c.targetYaw - c.yaw) * Math.min(1, dt * 9);
          c.zoom += (c.targetZoom - c.zoom) * Math.min(1, dt * 9);
          c.panX += (c.targetPanX - c.panX) * Math.min(1, dt * 11);
          c.panY += (c.targetPanY - c.panY) * Math.min(1, dt * 11);

          const rect = stage.getBoundingClientRect();
          const dpr = Math.min(2.25, window.devicePixelRatio || 1);
          const w = Math.max(1, Math.floor(rect.width * dpr));
          const h = Math.max(1, Math.floor(rect.height * dpr));
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          b.gl.viewport(0, 0, w, h);
          b.gl.enable(b.gl.DEPTH_TEST);
          b.gl.disable(b.gl.CULL_FACE);
          b.gl.clearColor(0.035, 0.03, 0.028, 1);
          b.gl.clear(b.gl.COLOR_BUFFER_BIT | b.gl.DEPTH_BUFFER_BIT);

          const fov = Math.min(34, Math.max(26, L.camera.fov));
          const dist = coverDistance(c.pitch, fov, w / h, c.zoom);
          const pitch = c.pitch;
          const eye: [number, number, number] = [
            Math.sin(c.yaw) * Math.cos(pitch) * dist + c.panX,
            Math.sin(pitch) * dist + 0.08,
            Math.cos(c.yaw) * Math.cos(pitch) * dist + c.panY,
          ];
          eyeRef.current = eye;
          const target: [number, number, number] = [c.panX * 0.55, DISPLACE * 0.15, c.panY * 0.55];
          mat4Perspective(projScratch.current, fov, w / h, 0.04, 50);
          mat4LookAt(viewScratch.current, eye, target, [0, 1, 0]);
          mat4Multiply(mvpScratch.current, projScratch.current, viewScratch.current);

          b.gl.useProgram(b.program);
          b.gl.bindVertexArray(b.vao);
          b.gl.activeTexture(b.gl.TEXTURE0);
          b.gl.bindTexture(b.gl.TEXTURE_2D, b.mapTex);
          b.gl.uniform1i(b.uniforms.u_map, 0);
          b.gl.activeTexture(b.gl.TEXTURE1);
          b.gl.bindTexture(b.gl.TEXTURE_2D, b.heightTex);
          b.gl.uniform1i(b.uniforms.u_height, 1);
          b.gl.uniformMatrix4fv(b.uniforms.u_mvp, false, mvpScratch.current);
          b.gl.uniformMatrix4fv(b.uniforms.u_model, false, modelScratch.current);
          b.gl.uniform1f(b.uniforms.u_displace, DISPLACE);
          b.gl.uniform2f(b.uniforms.u_texel, 1 / Math.max(1, heightField.current?.w ?? 256), 1 / Math.max(1, heightField.current?.h ?? 144));
          b.gl.uniform1f(b.uniforms.u_time, (now - t0) / 1000);
          const ember = Math.min(1, L.rim.ember + heatRef.current / 40);
          b.gl.uniform1f(b.uniforms.u_ember, ember);
          b.gl.uniform1f(b.uniforms.u_teal, L.rim.teal);
          b.gl.uniform1f(b.uniforms.u_haze, 0.42 + Math.min(0.28, heatRef.current / 55));
          b.gl.uniform2f(b.uniforms.u_focus, 0.5 + c.panX * 0.06, 0.5 + c.panY * 0.06);
          b.gl.uniform3f(b.uniforms.u_lightDir, 0.45, 0.82, 0.28);
          b.gl.uniform3f(b.uniforms.u_eye, eye[0], eye[1], eye[2]);
          b.gl.drawArrays(b.gl.TRIANGLES, 0, b.triCount);

          const field = heightField.current;
          const next: ScreenPin[] = [];
          for (const p of poisRef.current) {
            const { u, v } = poiMapUv(p.x, p.y);
            const hh = field ? sampleHeight(field.data, field.w, field.h, u, v) * DISPLACE : 0.06;
            const scr = projectPin(u, v, hh, mvpScratch.current, rect.width, rect.height);
            if (!scr.visible) continue;
            next.push({
              id: p.id,
              x: scr.x,
              y: scr.y,
              known: p.known,
              silhouette: p.silhouette,
              name: p.name,
              short: poiShortLabel(p.name),
              danger: p.danger ?? 1,
            });
          }
          setPins(next);

          raf = requestAnimationFrame(tick);
        };
        setReady(true);
        raf = requestAnimationFrame(tick);
      } catch {
        if (!dead) onFailedRef.current();
      }
    })();

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      bundle.current?.dispose();
      bundle.current = null;
    };
  }, [regionId]);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const clampYaw = (y: number) => Math.min(YAW_LIMIT, Math.max(-YAW_LIMIT, y));

  return (
    <div
      ref={stageRef}
      className={cn("relative min-h-0 flex-1 touch-none overflow-hidden bg-[#090807]", className)}
      data-region-stage={ready ? "ready" : "loading"}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        moved.current = false;
        if (pointers.current.size === 1) {
          dragging.current = true;
          last.current = { x: e.clientX, y: e.clientY };
        }
        if (pointers.current.size === 2 && cam.current) {
          const pts = [...pointers.current.values()];
          pinch.current = {
            dist: Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y),
            zoom: cam.current.targetZoom,
          };
          dragging.current = false;
        }
      }}
      onPointerMove={(e) => {
        if (!pointers.current.has(e.pointerId) || !cam.current) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size >= 2 && pinch.current) {
          const pts = [...pointers.current.values()];
          const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
          cam.current.targetZoom = clampZoom(pinch.current.zoom * (dist / Math.max(1, pinch.current.dist)));
          moved.current = true;
          return;
        }
        if (!dragging.current || !last.current) return;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        if (Math.hypot(dx, dy) > 2) moved.current = true;
        last.current = { x: e.clientX, y: e.clientY };
        cam.current.targetPanX = Math.max(-0.42, Math.min(0.42, cam.current.targetPanX - dx * 0.0018));
        cam.current.targetPanY = Math.max(-0.32, Math.min(0.32, cam.current.targetPanY - dy * 0.0018));
        cam.current.targetYaw = clampYaw(cam.current.targetYaw + dx * 0.0007);
      }}
      onPointerUp={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        if (pointers.current.size === 0) {
          dragging.current = false;
          last.current = null;
        }
      }}
      onPointerCancel={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        dragging.current = false;
        last.current = null;
      }}
      onWheel={(e) => {
        if (!cam.current) return;
        e.preventDefault();
        cam.current.targetZoom = clampZoom(cam.current.targetZoom * (e.deltaY > 0 ? 0.93 : 1.07));
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-label={`${regionId} regional map`} />
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/85">
          <p className="font-display text-[10px] uppercase tracking-[0.28em] text-ember">Seating the table…</p>
        </div>
      ) : null}

      {/* Table vignette / war-room frame — no empty corner voids */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.55)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/70 via-ink/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />

      {pins.map((pin) => {
        const on = selectedPoiId === pin.id;
        if (pin.silhouette) {
          return (
            <div
              key={pin.id}
              data-poi={pin.id}
              data-silhouette="1"
              aria-hidden
              style={{ left: pin.x, top: pin.y }}
              className="pointer-events-none absolute z-[8] -translate-x-1/2 -translate-y-1/2"
            >
              <span className="block size-3 rotate-45 border border-moon/35 bg-ink/50 shadow-[0_0_16px_rgba(170,144,117,0.25)]" />
            </div>
          );
        }
        return (
          <button
            key={pin.id}
            type="button"
            data-poi={pin.id}
            aria-label={pin.name}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPoi(pin.id, e.clientX, e.clientY);
            }}
            style={{ left: pin.x, top: pin.y }}
            className={cn(
              "absolute z-10 flex -translate-x-1/2 -translate-y-[70%] flex-col items-center gap-1",
              "min-h-11 min-w-11",
            )}
          >
            <span
              className={cn(
                "rounded-[2px] border px-2 py-1 font-display text-[9px] uppercase tracking-[0.14em] shadow-xl backdrop-blur-md",
                on
                  ? "border-ember bg-ember text-ink"
                  : "border-ember/55 bg-ink/88 text-ember",
              )}
            >
              {pin.short}
            </span>
            <span
              className={cn(
                "h-3 w-px",
                on ? "bg-ember" : "bg-ember/50",
              )}
            />
            <span
              className={cn(
                "size-2.5 rotate-45 border shadow-[0_0_12px_rgba(201,133,69,0.45)]",
                on ? "border-ember bg-ember" : "border-ember/70 bg-ink",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function setRegionStageZoom(delta: number) {
  window.dispatchEvent(new CustomEvent("hollow:region-zoom", { detail: { delta } }));
}
