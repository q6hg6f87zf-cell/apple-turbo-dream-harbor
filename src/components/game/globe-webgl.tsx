import { CANONICAL_REGION_IDS, canonicalRegionId, regionById } from "@/game/data";
import { sfx } from "@/game/audio";
import { addTrauma, punchClick, shockwaveAt } from "@/game/juice";
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
const MIN_ZOOM = 0.42;
const MAX_ZOOM = 2.15;
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

// The hash/fbm block is shared with the terrain bake below, so the baked
// fields and the live fallback are the same noise to the last bit.
const TERRAIN_NOISE_GLSL = `#define PI 3.14159265359

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
  for (int i = 0; i < 6; i++) {
    value += noise3(p) * amplitude;
    p = p * 2.07 + vec3(11.7, 4.2, 8.9);
    amplitude *= 0.5;
  }
  return value;
}
float ridge(vec3 p) {
  float n = fbm(p);
  return 1.0 - abs(n * 2.0 - 1.0);
}`;

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
uniform sampler2D u_bakeA;
uniform sampler2D u_bakeB;
uniform float u_bakeReady;
uniform sampler2D u_earth;
uniform sampler2D u_clouds;
uniform sampler2D u_night;
uniform sampler2D u_water;
uniform float u_mapsReady;
uniform sampler2D u_galaxy;
uniform sampler2D u_moon;
uniform float u_spaceReady;
uniform float u_moonReady;
${TERRAIN_NOISE_GLSL}
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
  vec3 color = vec3(0.003, 0.005, 0.01);
  vec2 p = uv;
  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  p.x *= aspect;
  vec2 drift = vec2(u_yaw * 0.035, u_pitch * 0.02);

  if (u_spaceReady > 0.5) {
    float imgAspect = 9.0 / 16.0;
    vec2 cover = (uv + drift * 0.08 - 0.5) * 0.94 + 0.5;
    if (aspect > imgAspect) {
      cover.y = (cover.y - 0.5) * (imgAspect / aspect) + 0.5;
    } else {
      cover.x = (cover.x - 0.5) * (aspect / imgAspect) + 0.5;
    }
    cover = clamp(cover, 0.0, 1.0);
    color = pow(max(texture(u_galaxy, cover).rgb, vec3(0.0)), vec3(0.92)) * 1.06;
  } else {
    vec2 neb = p - vec2(0.55, 0.46) + drift * 0.4;
    float stripe = exp(-pow(abs(neb.y * 1.05 + neb.x * 0.28), 2.0) * 22.0);
    float galaxyNoise = fbm(vec3((p + drift) * 2.1, 2.7 + u_time * 0.012));
    float dust = fbm(vec3((p - drift) * 4.4, 8.1));
    color += vec3(0.14, 0.09, 0.16) * stripe * (0.22 + galaxyNoise * 0.85);
    color += vec3(0.22, 0.16, 0.07) * stripe * stripe * (0.35 + dust * 0.4);
    color += vec3(0.04, 0.07, 0.05) * dust * 0.22;
  }

  float starGain = u_spaceReady > 0.5 ? 0.72 : 1.0;
  for (int layer = 0; layer < 4; layer++) {
    float density = 11.0 + float(layer) * 10.0;
    vec2 field = uv + drift * (0.07 + float(layer) * 0.05);
    vec2 g = field * vec2(aspect, 1.0) * density;
    vec2 id = floor(g);
    float n1 = hash21(id + float(layer) * 17.3);
    float n2 = hash21(id + float(layer) * 31.9 + 4.2);
    float n3 = hash21(id + 9.1 + float(layer));
    float keep = layer == 0 ? 0.9 : layer == 1 ? 0.84 : layer == 2 ? 0.76 : 0.64;
    if (n1 > keep) {
      vec2 offset = vec2(n2, n3) - 0.5;
      vec2 f = fract(g) - 0.5 - offset * 0.84;
      float dist = length(f);
      float mag = pow(n1, 10.0);
      float tw = 0.58 + 0.42 * sin(u_time * (0.35 + n2 * 2.4) + n3 * 42.0);
      float scin = 0.82 + 0.18 * sin(u_time * (2.6 + n1 * 6.0) + n2 * 14.0);
      tw *= mix(scin, 1.0, smoothstep(0.15, 0.55, mag));
      float core = exp(-dist * dist * (110.0 + mag * 420.0));
      float halo = exp(-dist * dist * 48.0) * 0.12;
      vec3 tint = mix(vec3(0.74, 0.84, 1.0), vec3(1.0, 0.88, 0.66), step(0.55, n3));
      tint = mix(tint, vec3(1.0, 0.62, 0.48), step(0.93, n2));
      float bright = (0.16 + mag * 1.7) * tw * (layer == 0 ? 1.05 : 0.58);
      color += tint * (core + halo) * bright * starGain;
      if (mag > 0.55 && dist < 0.16) {
        float sx = pow(max(0.0, 1.0 - abs(f.x) * 36.0), 12.0);
        float sy = pow(max(0.0, 1.0 - abs(f.y) * 36.0), 12.0);
        color += tint * (sx + sy) * tw * mag * 0.32 * starGain;
      }
    }
  }

  vec2 moonPoint = uv - vec2(0.14, 0.81) + drift * 0.15;
  moonPoint.x *= aspect;
  float moonDistance = length(moonPoint);
  float moonR = 0.062;
  color += vec3(0.42, 0.36, 0.26) * smoothstep(moonR * 1.85, moonR * 0.92, moonDistance) * 0.1;
  if (moonDistance < moonR) {
    float rim = smoothstep(moonR, moonR * 0.97, moonDistance);
    vec3 moonCol;
    if (u_moonReady > 0.5) {
      vec2 mu = clamp(moonPoint / (moonR * 2.0) + 0.5, 0.0, 1.0);
      moonCol = pow(max(texture(u_moon, mu).rgb, vec3(0.0)), vec3(1.35)) * vec3(0.86, 0.80, 0.68);
    } else {
      float craters = fbm(vec3(moonPoint * 42.0, 2.2));
      float lit = smoothstep(-0.04, 0.05, moonPoint.x + moonPoint.y * 0.28);
      moonCol = vec3(0.72, 0.66, 0.52) * (0.22 + lit * 0.82) * (0.82 + craters * 0.22);
    }
    color = mix(color, moonCol, rim);
  }

  vec2 moon2 = uv - vec2(0.84, 0.18) + drift * 0.1;
  moon2.x *= aspect;
  float m2 = length(moon2);
  if (m2 < 0.013) {
    color = mix(color, vec3(0.55, 0.5, 0.42) * 0.75, smoothstep(0.013, 0.007, m2));
  }

  vec2 ringP = p - vec2(0.5, 0.48);
  float ring = abs(length(ringP * vec2(1.0, 2.35)) - 0.62);
  color += vec3(0.32, 0.26, 0.14) * smoothstep(0.02, 0.0, ring) * 0.2;

  float meteorPhase = mod(u_time * 0.92, 9.5);
  if (meteorPhase < 0.9) {
    float k = meteorPhase / 0.9;
    vec2 head = vec2(-0.08 + k * 0.7, 0.92 - k * 0.34) + drift * 0.05;
    vec2 tail = head - vec2(0.16, -0.06);
    float d = segmentDistance(uv, head, tail);
    float headDistance = length(uv - head);
    float meteor = smoothstep(0.008, 0.0, d) * smoothstep(0.2, 0.01, headDistance) * sin(k * PI);
    color += vec3(1.0, 0.72, 0.38) * meteor * 1.05;
  }
  return color;
}

vec2 equirect(vec3 nrm) {
  return vec2(atan(nrm.x, nrm.z) / (2.0 * PI) + 0.5, asin(clamp(nrm.y, -1.0, 1.0)) / PI + 0.5);
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
    float halo = smoothstep(1.52, 1.16, closest) * smoothstep(1.10, 1.24, closest);
    float outer = smoothstep(1.82, 1.36, closest) * 0.28;
    outColor = vec4(background + vec3(0.22, 0.52, 0.92) * halo * 0.85 + vec3(0.55, 0.72, 1.0) * outer * 0.18, 1.0);
    return;
  }

  float t = -b - sqrt(h);
  if (t <= 0.0) {
    outColor = vec4(background, 1.0);
    return;
  }

  vec3 normal = normalize(ray * t - center);
  vec3 worldNormal = rotateY(rotateX(normal, u_pitch), u_yaw);
  vec3 nrm = worldNormal;
  float latitude = asin(clamp(nrm.y, -1.0, 1.0));
  float absLat = abs(latitude);
  float tropic = 1.0 - smoothstep(0.0, 0.48, absLat);
  float polar = smoothstep(0.72, 0.96, absLat);

  vec2 buv = equirect(nrm);
  float landMask = 0.0;
  float height = 0.0;
  float moisture = 0.5;
  float waterMask = 1.0;
  vec3 albedo = vec3(0.015, 0.07, 0.16);

  if (u_mapsReady > 0.5) {
    albedo = pow(max(texture(u_earth, buv).rgb, vec3(0.0)), vec3(0.92)) * 1.08;
    float specMap = texture(u_water, buv).r;
    float oceanHue = albedo.b - max(albedo.r, albedo.g);
    float ice = smoothstep(0.66, 0.88, (albedo.r + albedo.g + albedo.b) * 0.333) * polar;
    waterMask = max(specMap, smoothstep(0.012, 0.11, oceanHue) * (1.0 - ice));
    landMask = 1.0 - smoothstep(0.16, 0.52, waterMask);
    height = max(albedo.g - albedo.b * 0.35, 0.0) * landMask;
    moisture = clamp(albedo.g - albedo.r * 0.35, 0.0, 1.0);
  } else if (u_bakeReady > 0.5) {
    vec4 pack = texture(u_bakeA, buv);
    landMask = pack.r;
    height = pack.g;
    moisture = pack.b;
    waterMask = 1.0 - landMask;
  } else {
    vec3 warped = nrm + vec3(fbm(nrm * 1.7 + 2.1) - 0.5, fbm(nrm * 1.7 + 7.4) - 0.5, fbm(nrm * 1.7 + 4.8) - 0.5) * 0.42;
    float n = fbm(warped * 2.05) + fbm(warped * 5.3) * 0.34 + fbm(warped * 11.0) * 0.12;
    float land = n - 0.47 + nrm.y * 0.09;
    land += smoothstep(-0.70, -0.96, nrm.y) * 0.48;
    land += smoothstep(0.86, 0.99, nrm.y) * 0.16;
    landMask = smoothstep(0.02, 0.12, land);
    height = clamp((land - 0.03) * 1.35 + ridge(nrm * 7.1) * 0.3 * landMask, 0.0, 1.0);
    moisture = fbm(nrm * 3.3 + 8.6);
    waterMask = 1.0 - landMask;
  }

  vec3 surface;
  if (u_mapsReady > 0.5) {
    surface = albedo;
  } else {
    float desertBand = smoothstep(0.10, 0.26, absLat) * (1.0 - smoothstep(0.36, 0.54, absLat));
    float temperate = smoothstep(0.22, 0.48, absLat) * (1.0 - smoothstep(0.68, 0.84, absLat));
    vec3 oceanDeep = vec3(0.015, 0.07, 0.16);
    vec3 oceanShallow = vec3(0.04, 0.28, 0.40);
    float wave = fbm(vec3(worldNormal.x * 26.0, worldNormal.z * 26.0, u_time * 0.10));
    vec3 ocean = mix(oceanDeep, oceanShallow, clamp(0.22 + (1.0 - landMask) * 0.2 + wave * 0.12, 0.0, 1.0));
    ocean = mix(ocean, vec3(0.12, 0.42, 0.46), tropic * (1.0 - landMask) * 0.22);
    vec3 sand = vec3(0.72, 0.62, 0.38);
    vec3 desert = vec3(0.62, 0.48, 0.26);
    vec3 grass = vec3(0.20, 0.38, 0.14);
    vec3 forest = vec3(0.07, 0.22, 0.09);
    vec3 jungle = vec3(0.05, 0.18, 0.08);
    vec3 rock = vec3(0.36, 0.34, 0.30);
    vec3 tundra = vec3(0.46, 0.48, 0.40);
    vec3 snow = vec3(0.90, 0.92, 0.94);
    vec3 land = mix(grass, forest, smoothstep(0.35, 0.7, moisture));
    land = mix(land, jungle, tropic * moisture);
    land = mix(land, mix(sand, desert, 0.65), desertBand * (1.0 - moisture) * 0.92);
    land = mix(land, tundra, temperate * (1.0 - moisture) * polar * 0.0 + smoothstep(0.58, 0.78, absLat) * 0.55);
    land = mix(land, rock, smoothstep(0.48, 0.82, height));
    land = mix(land, snow, max(polar, smoothstep(0.72, 0.94, height) * (1.0 - tropic)));
    land *= 0.92 + (fbm(nrm * 16.0) - 0.5) * 0.16;
    surface = mix(ocean, land, landMask);
  }

  float wave = fbm(vec3(worldNormal.x * 26.0, worldNormal.z * 26.0, u_time * 0.10));
  vec3 lightDirection = normalize(rotateY(vec3(-0.58, 0.36, 0.72), u_time * 0.028));
  vec3 bump = normalize(normal + vec3((fbm(nrm * 18.0) - 0.5) * 0.28 * landMask, (height - 0.4) * 0.22 * landMask, landMask * height * 0.35));
  normal = normalize(mix(normal, bump, 0.42));
  float light = dot(normal, lightDirection);
  float daylight = smoothstep(-0.16, 0.36, light);
  float terminator = smoothstep(-0.04, 0.16, light) * (1.0 - smoothstep(0.12, 0.42, light));
  surface *= 0.07 + max(light, 0.0) * 1.12;
  surface += vec3(0.92, 0.48, 0.18) * terminator * 0.38;

  float specular = pow(max(dot(reflect(-lightDirection, normal), -ray), 0.0), 48.0 + wave * 40.0) * waterMask * daylight;
  surface += vec3(0.78, 0.90, 0.98) * specular * 1.05;

  vec3 nightCol = texture(u_night, buv).rgb;
  surface += nightCol * nightCol * (1.0 - daylight) * 2.1;
  for (int i = 0; i < 5; i++) {
    float near = pow(max(0.0, dot(nrm, u_regionDir[i])), 36.0);
    surface += vec3(1.0, 0.82, 0.38) * near * landMask * (1.0 - daylight) * 0.42;
  }

  vec2 cloudUv = buv + vec2(u_time * 0.0026, 0.0);
  float cloudTex = u_mapsReady > 0.5 ? texture(u_clouds, cloudUv).r : 0.0;
  float cloudNoise = fbm(normalize(worldNormal + vec3(u_time * 0.006, 0.0, u_time * 0.0024)) * 3.6);
  float clouds = max(cloudTex, u_mapsReady > 0.5 ? 0.0 : smoothstep(0.52, 0.78, cloudNoise) * 0.7);
  float cloudShadow = texture(u_clouds, cloudUv + vec2(0.006, 0.0)).r;
  surface *= 1.0 - cloudShadow * 0.32 * daylight * landMask;
  surface = mix(surface, vec3(0.93, 0.95, 0.97), clouds * (0.28 + daylight * 0.52));

  float fresnel = pow(1.0 - max(dot(normal, -ray), 0.0), 2.4);
  surface += vec3(0.32, 0.58, 0.98) * fresnel * 1.12;
  surface += vec3(1.0, 0.78, 0.42) * pow(max(dot(normal, lightDirection), 0.0), 8.0) * fresnel * 0.22;
  float air = pow(1.0 - max(dot(normal, -ray), 0.0), 4.2);
  surface = mix(surface, vec3(0.30, 0.54, 0.94), air * 0.32);
  outColor = vec4(pow(mix(background, surface, 0.988), vec3(0.90)), 1.0);
}
`;

// One-time pass that writes the planet's fixed geography into two equirect
// maps: land, height and moisture. Clouds, waves and the terminator stay live.
const BAKE_SIZE = { width: 1024, height: 512 };

const BAKE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
layout(location = 0) out vec4 outA;
layout(location = 1) out vec4 outB;
${TERRAIN_NOISE_GLSL}

void main() {
  float lon = (v_uv.x - 0.5) * 2.0 * PI;
  float lat = (v_uv.y - 0.5) * PI;
  float cosLat = cos(lat);
  vec3 nrm = normalize(vec3(cosLat * sin(lon), sin(lat), cosLat * cos(lon)));
  vec3 warped = nrm + vec3(fbm(nrm * 1.7 + 2.1) - 0.5, fbm(nrm * 1.7 + 7.4) - 0.5, fbm(nrm * 1.7 + 4.8) - 0.5) * 0.42;
  float n = fbm(warped * 2.05) + fbm(warped * 5.3) * 0.34 + fbm(warped * 11.0) * 0.12;
  float land = n - 0.47 + nrm.y * 0.09;
  land += smoothstep(-0.70, -0.96, nrm.y) * 0.48;
  land += smoothstep(0.86, 0.99, nrm.y) * 0.16;
  land += smoothstep(0.28, 0.08, acos(clamp(dot(nrm, normalize(vec3(-0.38, 0.90, 0.18))), -1.0, 1.0))) * 0.2;
  float landMask = smoothstep(0.02, 0.12, land);
  float height = clamp((land - 0.03) * 1.35 + ridge(nrm * 7.1) * 0.3 * landMask, 0.0, 1.0);
  float moisture = fbm(nrm * 3.3 + 8.6);
  outA = vec4(landMask, height, moisture, 1.0);
  outB = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

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
function targetFor(id: RegionId, theater = false) {
  const marker = regionById(id).marker;
  return { yaw: marker.lon * DEG, pitch: -marker.lat * DEG, zoom: theater ? 0.98 : 1.05 };
}
function earthFix(lat: number, lon: number) {
  const ns = `${Math.abs(lat)}°${lat >= 0 ? "N" : "S"}`;
  const ew = `${Math.abs(lon)}°${lon >= 0 ? "E" : "W"}`;
  return `${ns} ${ew}`;
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

type EarthMaps = {
  earth: WebGLTexture;
  clouds: WebGLTexture;
  night: WebGLTexture;
  water: WebGLTexture;
  ready: boolean;
};

type SpaceMaps = {
  galaxy: WebGLTexture;
  moon: WebGLTexture;
  galaxyReady: boolean;
  moonReady: boolean;
};

function makeColorTexture(gl: WebGL2RenderingContext, r: number, g: number, b: number) {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Texture allocation failed.");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([r, g, b, 255]));
  return tex;
}

function fillGlobeTexture(gl: WebGL2RenderingContext, tex: WebGLTexture, image: HTMLImageElement) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  if (aniso) {
    const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
    gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max || 1));
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
}

function fillSpaceTexture(gl: WebGL2RenderingContext, tex: WebGLTexture, image: HTMLImageElement) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  // Full-screen plates need the top mip — mipmaps smear pinpoint stars
  // and crater rims into a blur the 4K globe never has.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}

async function hydrateEarthMaps(gl: WebGL2RenderingContext, maps: EarthMaps, alive: () => boolean) {
  const jobs: Array<[keyof Omit<EarthMaps, "ready">, string]> = [
    ["earth", "/art/earth/day.jpg"],
    ["clouds", "/art/earth/clouds.jpg"],
    ["night", "/art/earth/night.jpg"],
    ["water", "/art/earth/water.png"],
  ];
  await Promise.all(jobs.map(async ([key, url]) => {
    try {
      const image = await loadImage(url);
      if (!alive()) return;
      fillGlobeTexture(gl, maps[key], image);
      if (key === "earth") maps.ready = true;
    } catch (error) {
      console.warn("Earth map missing", url, error);
    }
  }));
}

async function hydrateSpaceMaps(gl: WebGL2RenderingContext, maps: SpaceMaps, alive: () => boolean) {
  const jobs: Array<["galaxy" | "moon", string]> = [
    ["galaxy", "/art/space/galaxy.jpg"],
    ["moon", "/art/space/moon.jpg"],
  ];
  await Promise.all(jobs.map(async ([key, url]) => {
    try {
      const image = await loadImage(url);
      if (!alive()) return;
      fillSpaceTexture(gl, maps[key], image);
      if (key === "galaxy") maps.galaxyReady = true;
      if (key === "moon") maps.moonReady = true;
    } catch (error) {
      console.warn("Space map missing", url, error);
    }
  }));
}

function bakeTerrain(gl: WebGL2RenderingContext) {
  let program: WebGLProgram | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let buffer: WebGLBuffer | null = null;
  let fbo: WebGLFramebuffer | null = null;
  let texA: WebGLTexture | null = null;
  let texB: WebGLTexture | null = null;

  const makeTarget = () => {
    const tex = gl.createTexture();
    if (!tex) throw new Error("Bake texture allocation failed.");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, BAKE_SIZE.width, BAKE_SIZE.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Longitude wraps; without REPEAT the dateline reads as a seam down the globe.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };

  try {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, BAKE_FRAGMENT_SHADER);
    program = gl.createProgram();
    if (!program) throw new Error("Bake program allocation failed.");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Bake program link failed.");
    }

    texA = makeTarget();
    texB = makeTarget();
    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texA, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, texB, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Bake framebuffer incomplete.");
    }

    vao = gl.createVertexArray();
    buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.viewport(0, 0, BAKE_SIZE.width, BAKE_SIZE.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return { texA, texB };
  } catch (error) {
    // Any refusal here just means the planet draws itself the old way.
    console.warn("Hollow Realm terrain bake fallback", error);
    if (texA) gl.deleteTexture(texA);
    if (texB) gl.deleteTexture(texB);
    return null;
  } finally {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (fbo) gl.deleteFramebuffer(fbo);
    if (buffer) gl.deleteBuffer(buffer);
    if (vao) gl.deleteVertexArray(vao);
    if (program) gl.deleteProgram(program);
  }
}

function openRegionMap(regionId: RegionId) {
  const store = useGame.getState();
  const location = REGION_TO_LOCATION[regionId];
  if (!store.s.locations[location]?.unlocked) return;
  // Dive cue for the war-table handoff — globe/galaxy shaders stay untouched.
  try {
    sessionStorage.setItem("hollow:region-dive", regionId);
  } catch {
    /* private mode */
  }
  store.selectLoc(location);
  store.openRegionMap();
  window.dispatchEvent(new CustomEvent("hollow:open-region-map", { detail: { regionId, dive: true } }));
}

export function HollowGlobeWebGL({
  loc,
  onSelect,
  theater = false,
}: {
  loc: LocationId;
  onSelect: (id: LocationId) => void;
  theater?: boolean;
}) {
  const webglRef = useRef<HTMLCanvasElement>(null);
  const markerRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const locations = useGame((g) => g.s.locations);
  const selectedFromGame = canonicalRegionId(loc) ?? "ironclad";
  const [selected, setSelected] = useState<RegionId>(selectedFromGame);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState("Drag the planet · pinch to zoom");
  const initial = targetFor(selectedFromGame, theater);
  const camera = useRef<Camera>({
    yaw: initial.yaw,
    pitch: initial.pitch,
    zoom: theater ? 0.82 : initial.zoom,
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
    const target = targetFor(selectedFromGame, theater);
    const c = camera.current;
    c.targetYaw = c.yaw + shortest(c.yaw, target.yaw);
    c.targetPitch = target.pitch;
    c.targetZoom = Math.max(c.zoom, theater ? 0.98 : 1.05);
    c.yawVelocity = 0;
    c.pitchVelocity = 0;
    setSelected(selectedFromGame);
  }, [selectedFromGame, theater]);

  const focusRegion = (id: RegionId) => {
    const location = REGION_TO_LOCATION[id];
    if (!locations[location]?.unlocked) return;
    const target = targetFor(id, theater);
    const c = camera.current;
    c.targetYaw = c.yaw + shortest(c.yaw, target.yaw);
    c.targetPitch = target.pitch;
    c.targetZoom = theater ? 1.08 : 1.12;
    c.yawVelocity = 0;
    c.pitchVelocity = 0;
    setSelected(id);
    onSelect(location);
    lastInteraction.current = performance.now();
    setHint(`${regionById(id).name} acquired`);
    addTrauma(theater ? 0.42 : 0.22);
    sfx.unlock();
  };

  const zoomBy = (factor: number) => {
    camera.current.targetZoom = clamp(camera.current.targetZoom * factor, MIN_ZOOM, MAX_ZOOM);
    lastInteraction.current = performance.now();
  };

  const reset = () => {
    const target = targetFor(selected, theater);
    const c = camera.current;
    c.targetYaw = c.yaw + shortest(c.yaw, target.yaw);
    c.targetPitch = target.pitch;
    c.targetZoom = theater ? 0.98 : 1.05;
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
    const bakeAUniform = gl.getUniformLocation(program, "u_bakeA");
    const bakeBUniform = gl.getUniformLocation(program, "u_bakeB");
    const bakeReadyUniform = gl.getUniformLocation(program, "u_bakeReady");
    const earthUniform = gl.getUniformLocation(program, "u_earth");
    const cloudsUniform = gl.getUniformLocation(program, "u_clouds");
    const nightUniform = gl.getUniformLocation(program, "u_night");
    const waterUniform = gl.getUniformLocation(program, "u_water");
    const mapsReadyUniform = gl.getUniformLocation(program, "u_mapsReady");
    const galaxyUniform = gl.getUniformLocation(program, "u_galaxy");
    const moonUniform = gl.getUniformLocation(program, "u_moon");
    const spaceReadyUniform = gl.getUniformLocation(program, "u_spaceReady");
    const moonReadyUniform = gl.getUniformLocation(program, "u_moonReady");
    const regionDirections = new Float32Array(
      CANONICAL_REGION_IDS.flatMap((id) => {
        const marker = regionById(id).marker;
        return worldVector(marker.lat, marker.lon);
      }),
    );
    const baked = bakeTerrain(gl);
    const earthMaps: EarthMaps = {
      earth: makeColorTexture(gl, 12, 32, 70),
      clouds: makeColorTexture(gl, 0, 0, 0),
      night: makeColorTexture(gl, 0, 0, 0),
      water: makeColorTexture(gl, 0, 0, 0),
      ready: false,
    };
    const spaceMaps: SpaceMaps = {
      galaxy: makeColorTexture(gl, 2, 3, 8),
      moon: makeColorTexture(gl, 90, 82, 68),
      galaxyReady: false,
      moonReady: false,
    };
    let alive = true;
    void hydrateEarthMaps(gl, earthMaps, () => alive);
    void hydrateSpaceMaps(gl, spaceMaps, () => alive);

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
      dpr = Math.min(2, window.devicePixelRatio || 1);
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
        const scale = theater ? 1.05 : 1;
        const markerRadius = (active ? 2.8 : 2.1) * (0.85 + depth * 0.4) * scale;
        markers.current.push({ id, x, y, radius: theater ? 22 : 18, unlocked });

        ctx.save();
        ctx.globalAlpha = unlocked ? 0.7 + depth * 0.3 : 0.32;
        const pulse = active ? 1 + Math.sin(now * 0.005) * 0.08 : 1;
        ctx.strokeStyle = active ? "rgba(237,199,119,.85)" : unlocked ? "rgba(187,162,100,.55)" : "rgba(90,90,88,.45)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(x, y, (markerRadius + 6) * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, markerRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowColor = active ? "rgba(238,191,105,.55)" : "rgba(190,160,95,.2)";
        ctx.shadowBlur = active ? 12 : 5;
        ctx.fillStyle = active ? "#f0d7a0" : unlocked ? "#c4ae7c" : "#5c5b59";
        ctx.beginPath();
        ctx.arc(x, y, markerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = active ? "#1a140c" : "#0c0d0e";
        ctx.beginPath();
        ctx.arc(x, y, markerRadius * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = active ? "rgba(237,199,119,.7)" : "rgba(150,135,100,.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y + markerRadius);
        ctx.lineTo(x, y + markerRadius + (theater ? 10 : 7));
        ctx.stroke();

        const label = unlocked ? region.name : "SEALED";
        ctx.font = `${active ? 600 : 500} ${theater ? (active ? 17 : 14) : active ? 11 : 10}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        const textWidth = ctx.measureText(label).width;
        const boxH = theater ? 28 : 22;
        const boxX = clamp(x - textWidth / 2 - 8, 5, width - textWidth - 21);
        const boxY = y + markerRadius + (theater ? 16 : 12);
        ctx.fillStyle = active ? "rgba(27,21,14,.93)" : "rgba(5,7,9,.76)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, textWidth + 16, boxH, 7);
        ctx.fill();
        ctx.strokeStyle = active ? "rgba(229,188,108,.52)" : "rgba(150,135,100,.22)";
        ctx.stroke();
        ctx.fillStyle = active ? "#efd49b" : unlocked ? "#c8bfad" : "#77736b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, boxX + (textWidth + 16) / 2, boxY + boxH / 2);
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
      if (baked) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, baked.texA);
        gl.uniform1i(bakeAUniform, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, baked.texB);
        gl.uniform1i(bakeBUniform, 1);
      }
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, earthMaps.earth);
      gl.uniform1i(earthUniform, 2);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, earthMaps.clouds);
      gl.uniform1i(cloudsUniform, 3);
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, earthMaps.night);
      gl.uniform1i(nightUniform, 4);
      gl.activeTexture(gl.TEXTURE5);
      gl.bindTexture(gl.TEXTURE_2D, earthMaps.water);
      gl.uniform1i(waterUniform, 5);
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, spaceMaps.galaxy);
      gl.uniform1i(galaxyUniform, 6);
      gl.activeTexture(gl.TEXTURE7);
      gl.bindTexture(gl.TEXTURE_2D, spaceMaps.moon);
      gl.uniform1i(moonUniform, 7);
      gl.uniform1f(bakeReadyUniform, baked ? 1 : 0);
      gl.uniform1f(mapsReadyUniform, earthMaps.ready ? 1 : 0);
      gl.uniform1f(spaceReadyUniform, spaceMaps.galaxyReady ? 1 : 0);
      gl.uniform1f(moonReadyUniform, spaceMaps.moonReady ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      drawMarkers(now);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      if (buffer) gl.deleteBuffer(buffer);
      if (vao) gl.deleteVertexArray(vao);
      if (program) gl.deleteProgram(program);
      if (baked) {
        gl.deleteTexture(baked.texA);
        gl.deleteTexture(baked.texB);
      }
      gl.deleteTexture(earthMaps.earth);
      gl.deleteTexture(earthMaps.clouds);
      gl.deleteTexture(earthMaps.night);
      gl.deleteTexture(earthMaps.water);
      gl.deleteTexture(spaceMaps.galaxy);
      gl.deleteTexture(spaceMaps.moon);
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
      c.pitch -= dy * 0.0037;
      c.targetYaw = c.yaw;
      c.targetPitch = c.pitch;
      c.yawVelocity = clamp((-dx / elapsed) * 4.1, -2.3, 2.3);
      c.pitchVelocity = clamp((-dy / elapsed) * 3.2, -1.7, 1.7);
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
        if (best?.unlocked) {
          punchClick(point.x, point.y);
          shockwaveAt(point.x, point.y);
          focusRegion(best.id);
        }
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const c = camera.current;
      if (event.ctrlKey || event.metaKey) {
        zoomBy(event.deltaY > 0 ? 0.92 : 1.09);
        setHint(`Orbital zoom ${c.targetZoom.toFixed(2)}×`);
        return;
      }
      c.targetPitch -= event.deltaY * 0.0024;
      c.targetYaw -= event.deltaX * 0.0024;
      c.pitchVelocity = 0;
      c.yawVelocity = 0;
      lastInteraction.current = performance.now();
      setHint("Grab the planet · scroll follows the ground");
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
  }, [failed, locations, selected, theater]);

  if (failed) return <HollowGlobeAAA loc={loc} onSelect={onSelect} theater={theater} />;

  const region = regionById(selected);
  const location = REGION_TO_LOCATION[selected];
  const unlocked = !!locations[location]?.unlocked;

  const zoomRow = (
    <div className="flex shrink-0 items-center gap-1">
      <GlobeButton label="Zoom out" onClick={() => zoomBy(0.9)}><Minus className="size-4" /></GlobeButton>
      <GlobeButton label="Zoom in" onClick={() => zoomBy(1.1)}><Plus className="size-4" /></GlobeButton>
      <GlobeButton label="Recenter" onClick={reset}><RotateCcw className="size-4" /></GlobeButton>
    </div>
  );

  return (
    <div className={theater
      ? "relative h-full min-h-0 overflow-hidden bg-[#020307]"
      : "overflow-hidden rounded-[var(--radius-xl)] border border-line/70 bg-[#020307] shadow-[0_28px_90px_rgba(0,0,0,.5)]"
    }>
      {theater ? null : (
        <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-surface/75 px-3 py-2.5 backdrop-blur-md">
          <div className="min-w-0">
            <div className="font-display text-[9px] uppercase tracking-[0.22em] text-ember">Orbit</div>
            <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>
          </div>
          {zoomRow}
        </div>
      )}

      <div
        ref={stageRef}
        tabIndex={0}
        className={`relative w-full touch-none select-none outline-none ${
          theater
            ? "h-full min-h-0"
            : "h-[12rem] min-h-[12rem] md:h-[min(42vh,360px)] md:min-h-[240px]"
        } ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        aria-label="Interactive WebGL world globe. Drag to orbit and pinch to zoom."
      >
        <canvas ref={webglRef} className="absolute inset-0 size-full" />
        <canvas ref={markerRef} className="pointer-events-none absolute inset-0 size-full" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
        {theater ? (
          <div className="pointer-events-none absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-start justify-end">
            <div className="pointer-events-auto">{zoomRow}</div>
          </div>
        ) : null}
        <div className={`absolute left-3 right-3 flex items-end justify-between gap-3 ${theater ? "bottom-[max(1rem,env(safe-area-inset-bottom))]" : "bottom-3"}`}>
          <div className="max-w-[68%] rounded-[var(--radius-lg)] border border-line/60 bg-ink/78 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Compass className="size-4 shrink-0 text-ember" />
              <div className="min-w-0">
                <div className={`truncate font-display text-paper ${theater ? "text-base" : "text-sm"}`}>{region.name}</div>
                <div className="truncate font-display text-[10px] uppercase tracking-[0.16em] text-ember">
                  {earthFix(region.marker.lat, region.marker.lon)}
                </div>
                <div className="truncate text-[11px] text-muted">
                  {unlocked ? "Pin on the live world · drag to orbit" : "SEALED · preceding boss must fall"}
                </div>
                {theater ? (
                  <div className="mt-1 truncate text-[11px] text-moon">
                    Drag to orbit · pinch to zoom
                  </div>
                ) : null}
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
            className={`shrink-0 rounded-[var(--radius-md)] border border-ember/55 bg-ember/15 font-display uppercase tracking-[0.15em] text-ember shadow-xl backdrop-blur-md disabled:border-line disabled:bg-ink/70 disabled:text-muted ${
              theater ? "min-h-14 px-5 text-xs" : "min-h-12 px-4 text-[10px]"
            }`}
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
