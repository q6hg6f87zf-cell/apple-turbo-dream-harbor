import { CANONICAL_REGION_IDS, canonicalRegionId, regionById } from "@/game/data";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import type { LocationId, RegionId } from "@/game/types";
import { Compass, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const REGION_TO_LOCATION: Record<RegionId, LocationId> = {
  ironclad: "ironclad",
  slagtown: "kingdom",
  blackspire: "caverns",
  brasswater: "library",
  veyra: "veyra",
};

const DEG = Math.PI / 180;
const MIN_ZOOM = 0.46;
const MAX_ZOOM = 1.78;

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

type Point3 = { x: number; y: number; z: number };
type MarkerHit = { id: RegionId; x: number; y: number; radius: number; z: number; unlocked: boolean };
type Star = { x: number; y: number; depth: number; size: number; phase: number; hot: boolean };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; ttl: number; size: number };

function seeded(n: number) {
  const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const STARS: Star[] = Array.from({ length: 720 }, (_, i) => ({
  x: seeded(i * 7 + 1),
  y: seeded(i * 7 + 2),
  depth: 0.12 + seeded(i * 7 + 3) * 0.88,
  size: 0.2 + seeded(i * 7 + 4) * (seeded(i * 7 + 6) > 0.94 ? 1.15 : 0.55),
  phase: seeded(i * 7 + 5) * Math.PI * 2,
  hot: seeded(i * 7 + 8) > 0.96,
}));

const CITY_LIGHTS = CANONICAL_REGION_IDS.flatMap((region, ri) => {
  const marker = regionById(region).marker;
  const count = region === "veyra" ? 42 : region === "ironclad" ? 18 : 11;
  return Array.from({ length: count }, (_, i) => ({
    region,
    lat: marker.lat + (seeded(ri * 2200 + i * 5 + 1) - 0.5) * (region === "veyra" ? 9 : 14),
    lon: marker.lon + (seeded(ri * 2200 + i * 5 + 2) - 0.5) * (region === "veyra" ? 14 : 20),
    strength: 0.35 + seeded(ri * 2200 + i * 5 + 3) * 0.65,
  }));
});

const REGION_BITMAPS: Partial<Record<RegionId, HTMLImageElement>> = {};
let bitmapsRequested = false;

export function requestRegionBitmaps() {
  if (bitmapsRequested || typeof Image === "undefined") return;
  bitmapsRequested = true;
  for (const id of CANONICAL_REGION_IDS) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = `/map/regions/thumbs/${id}.jpg`;
    img.onload = () => {
      REGION_BITMAPS[id] = img;
    };
  }
}

export function regionBitmap(id: RegionId) {
  return REGION_BITMAPS[id] ?? null;
}

const EARTH_MAP: { data: ImageData | null; w: number; h: number } = { data: null, w: 0, h: 0 };
let earthRequested = false;
let earthBlit: HTMLCanvasElement | null = null;

const SPACE_ART: { galaxy: HTMLImageElement | null; moon: HTMLImageElement | null } = {
  galaxy: null,
  moon: null,
};
let spaceRequested = false;

function requestSpaceArt() {
  if (spaceRequested || typeof Image === "undefined") return;
  spaceRequested = true;
  const galaxy = new Image();
  galaxy.crossOrigin = "anonymous";
  galaxy.decoding = "async";
  galaxy.src = "/art/space/galaxy.jpg";
  galaxy.onload = () => {
    SPACE_ART.galaxy = galaxy;
  };
  const moon = new Image();
  moon.crossOrigin = "anonymous";
  moon.decoding = "async";
  moon.src = "/art/space/moon.jpg";
  moon.onload = () => {
    SPACE_ART.moon = moon;
  };
}

function requestEarthMap() {
  if (earthRequested || typeof Image === "undefined") return;
  earthRequested = true;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = "/art/earth/day.jpg";
  img.onload = () => {
    const off = document.createElement("canvas");
    off.width = 2048;
    off.height = 1024;
    const ctx = off.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 2048, 1024);
    EARTH_MAP.data = ctx.getImageData(0, 0, 2048, 1024);
    EARTH_MAP.w = 2048;
    EARTH_MAP.h = 1024;
  };
}

function sampleEarth(u: number, v: number): [number, number, number] {
  const data = EARTH_MAP.data;
  if (!data) return [18, 48, 78];
  const x = ((u % 1 + 1) % 1) * (EARTH_MAP.w - 1);
  const y = clamp(v, 0, 1) * (EARTH_MAP.h - 1);
  const i = (Math.floor(y) * EARTH_MAP.w + Math.floor(x)) * 4;
  return [data.data[i]!, data.data[i + 1]!, data.data[i + 2]!];
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function wrapAngle(v: number) {
  while (v > Math.PI) v -= Math.PI * 2;
  while (v < -Math.PI) v += Math.PI * 2;
  return v;
}

function shortestAngle(from: number, to: number) {
  return wrapAngle(to - from);
}

function targetForRegion(id: RegionId) {
  const m = regionById(id).marker;
  return { yaw: -m.lon * DEG, pitch: m.lat * DEG, zoom: 0.98 };
}

function project(lat: number, lon: number, camera: Camera): Point3 {
  const la = lat * DEG;
  const lo = lon * DEG;
  const cl = Math.cos(la);
  const x0 = cl * Math.sin(lo);
  const y0 = Math.sin(la);
  const z0 = cl * Math.cos(lo);

  const cy = Math.cos(camera.yaw);
  const sy = Math.sin(camera.yaw);
  const x1 = x0 * cy + z0 * sy;
  const z1 = -x0 * sy + z0 * cy;

  const cp = Math.cos(camera.pitch);
  const sp = Math.sin(camera.pitch);
  return {
    x: x1,
    y: y0 * cp - z1 * sp,
    z: y0 * sp + z1 * cp,
  };
}

function cameraToEquirect(px: number, py: number, pz: number, camera: Camera) {
  const cp = Math.cos(camera.pitch);
  const sp = Math.sin(camera.pitch);
  const y0 = py * cp + pz * sp;
  const z1 = -py * sp + pz * cp;
  const x1 = px;
  const cy = Math.cos(camera.yaw);
  const sy = Math.sin(camera.yaw);
  const x0 = x1 * cy - z1 * sy;
  const z0 = x1 * sy + z1 * cy;
  const lon = Math.atan2(x0, z0);
  const lat = Math.asin(clamp(y0, -1, 1));
  return {
    u: lon / (Math.PI * 2) + 0.5,
    v: 0.5 - lat / Math.PI,
  };
}

function drawTexturedEarth(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  camera: Camera,
) {
  const res = Math.max(96, Math.min(220, Math.round(radius * 1.15)));
  if (!earthBlit) earthBlit = document.createElement("canvas");
  if (earthBlit.width !== res || earthBlit.height !== res) {
    earthBlit.width = res;
    earthBlit.height = res;
  }
  const blit = earthBlit.getContext("2d");
  if (!blit) return;
  const buf = blit.createImageData(res, res);
  const pix = buf.data;
  for (let j = 0; j < res; j++) {
    const ny = 1 - (j + 0.5) / res * 2;
    for (let i = 0; i < res; i++) {
      const nx = (i + 0.5) / res * 2 - 1;
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2);
      const eq = cameraToEquirect(nx, ny, nz, camera);
      const [r, g, b] = sampleEarth(eq.u, eq.v);
      const lit = 0.22 + Math.max(0, nx * -0.35 + ny * 0.28 + nz * 0.55) * 0.95;
      const o = (j * res + i) * 4;
      pix[o] = Math.min(255, r * lit);
      pix[o + 1] = Math.min(255, g * lit);
      pix[o + 2] = Math.min(255, b * lit);
      pix[o + 3] = 255;
    }
  }
  blit.putImageData(buf, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(earthBlit, cx - radius, cy - radius, radius * 2, radius * 2);
}

function openRegionMap(regionId: RegionId) {
  const store = useGame.getState();
  const location = REGION_TO_LOCATION[regionId];
  if (!store.s.locations[location]?.unlocked) return;
  try {
    sessionStorage.setItem("hollow:region-dive", regionId);
  } catch {
    /* private mode */
  }
  store.selectLoc(location);
  store.openRegionMap();
  window.dispatchEvent(new CustomEvent("hollow:open-region-map", { detail: { regionId, dive: true } }));
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function HollowGlobeAAA({
  loc,
  onSelect,
  theater = false,
}: {
  loc: LocationId;
  onSelect: (id: LocationId) => void;
  theater?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const locations = useGame((g) => g.s.locations);
  const selectedFromGame = canonicalRegionId(loc) ?? "ironclad";
  const [selected, setSelected] = useState<RegionId>(selectedFromGame);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState("Drag to orbit · pinch to zoom");

  const start = targetForRegion(selectedFromGame);
  const camera = useRef<Camera>({
    yaw: start.yaw,
    pitch: start.pitch,
    zoom: start.zoom,
    targetYaw: start.yaw,
    targetPitch: start.pitch,
    targetZoom: start.zoom,
    yawVelocity: 0,
    pitchVelocity: 0,
  });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ id: number; x: number; y: number; t: number; moved: boolean } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const markers = useRef<MarkerHit[]>([]);
  const meteors = useRef<Meteor[]>([]);
  const lastMeteor = useRef(0);
  const lastInteraction = useRef(performance.now());

  useEffect(() => {
    setSelected(selectedFromGame);
    const t = targetForRegion(selectedFromGame);
    const c = camera.current;
    c.targetYaw = c.yaw + shortestAngle(c.yaw, t.yaw);
    c.targetPitch = t.pitch;
    c.targetZoom = Math.max(c.zoom, 1.05);
    c.yawVelocity = 0;
    c.pitchVelocity = 0;
  }, [selectedFromGame]);

  const focusRegion = (id: RegionId) => {
    const location = REGION_TO_LOCATION[id];
    if (!locations[location]?.unlocked) return;
    const t = targetForRegion(id);
    const c = camera.current;
    c.targetYaw = c.yaw + shortestAngle(c.yaw, t.yaw);
    c.targetPitch = t.pitch;
    c.targetZoom = 1.05;
    c.yawVelocity = 0;
    c.pitchVelocity = 0;
    setSelected(id);
    onSelect(location);
    setHint(`${regionById(id).name} locked in`);
    sfx.click();
  };

  const zoomBy = (factor: number) => {
    const c = camera.current;
    c.targetZoom = clamp(c.targetZoom * factor, MIN_ZOOM, MAX_ZOOM);
    lastInteraction.current = performance.now();
  };

  const reset = () => {
    const t = targetForRegion(selected);
    const c = camera.current;
    c.targetYaw = c.yaw + shortestAngle(c.yaw, t.yaw);
    c.targetPitch = t.pitch;
    c.targetZoom = 0.98;
    c.yawVelocity = 0;
    c.pitchVelocity = 0;
    setHint("Camera recentered");
    lastInteraction.current = performance.now();
    sfx.click();
  };

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    requestEarthMap();
    requestSpaceArt();

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let previous = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    const drawSpace = (now: number) => {
      if (SPACE_ART.galaxy) {
        const img = SPACE_ART.galaxy;
        const imgA = img.width / Math.max(1, img.height);
        const scrA = width / Math.max(1, height);
        let dw = width;
        let dh = height;
        if (scrA > imgA) {
          dh = width / imgA;
        } else {
          dw = height * imgA;
        }
        const c = camera.current;
        const dx = (width - dw) / 2 + c.yaw * width * 0.028;
        const dy = (height - dh) / 2 + c.pitch * height * 0.02;
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        const bg = ctx.createRadialGradient(width * 0.46, height * 0.55, 0, width * 0.5, height * 0.5, Math.max(width, height));
        bg.addColorStop(0, "#101117");
        bg.addColorStop(0.36, "#080a10");
        bg.addColorStop(1, "#020306");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        const galaxyX = width * 0.82;
        const galaxyY = height * 0.2;
        const galaxyR = Math.min(width, height) * 0.29;
        ctx.save();
        ctx.translate(galaxyX, galaxyY);
        ctx.rotate(-0.5);
        for (let i = 5; i >= 0; i--) {
          const alpha = 0.025 + (5 - i) * 0.011;
          ctx.strokeStyle = `rgba(189,164,138,${alpha})`;
          ctx.lineWidth = 1.2 + i * 1.1;
          ctx.beginPath();
          ctx.ellipse(0, 0, galaxyR * (0.33 + i * 0.07), galaxyR * (0.065 + i * 0.018), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxyR * 0.42);
        core.addColorStop(0, "rgba(255,211,157,.17)");
        core.addColorStop(0.2, "rgba(130,144,195,.10)");
        core.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = core;
        ctx.fillRect(-galaxyR, -galaxyR, galaxyR * 2, galaxyR * 2);
        ctx.restore();
      }

      const c = camera.current;
      for (const star of STARS) {
        const px = ((star.x * width + c.yaw * width * star.depth * 0.028) % width + width) % width;
        const py = ((star.y * height + c.pitch * height * star.depth * 0.02) % height + height) % height;
        const flicker = reduced ? 0.72 : 0.46 + Math.sin(now * (0.0009 + star.depth * 0.0008) + star.phase) * 0.38
          + Math.sin(now * (0.0032 + star.phase * 0.15) + star.x * 12.0) * 0.12;
        const r = star.size * (0.28 + star.depth * 0.55);
        const glow = r * (star.hot ? 2.1 : 1.25);
        const gain = SPACE_ART.galaxy ? 0.38 : 1;
        const g = ctx.createRadialGradient(px, py, 0, px, py, glow);
        if (star.hot) {
          g.addColorStop(0, `rgba(255,236,210,${0.95 * flicker * gain})`);
          g.addColorStop(0.18, `rgba(255,214,160,${0.38 * flicker * gain})`);
          g.addColorStop(1, "rgba(255,214,160,0)");
        } else {
          g.addColorStop(0, `rgba(236,242,255,${(0.55 + star.depth * 0.4) * flicker * gain})`);
          g.addColorStop(0.28, `rgba(186,206,238,${0.16 * flicker * gain})`);
          g.addColorStop(1, "rgba(186,206,238,0)");
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, glow, 0, Math.PI * 2);
        ctx.fill();
        if (star.hot && !reduced) {
          ctx.strokeStyle = `rgba(255,220,170,${0.14 * flicker * gain})`;
          ctx.lineWidth = 0.45;
          ctx.beginPath();
          ctx.moveTo(px - r * 3.2, py);
          ctx.lineTo(px + r * 3.2, py);
          ctx.moveTo(px, py - r * 3.2);
          ctx.lineTo(px, py + r * 3.2);
          ctx.stroke();
        }
      }

      const mx = width * 0.12;
      const my = height * 0.18;
      const mr = Math.max(18, Math.min(width, height) * 0.048);
      const halo = ctx.createRadialGradient(mx, my, mr * 0.7, mx, my, mr * 2.1);
      halo.addColorStop(0, "rgba(210,188,150,.16)");
      halo.addColorStop(1, "rgba(210,188,150,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(mx, my, mr * 2.1, 0, Math.PI * 2);
      ctx.fill();
      if (SPACE_ART.moon) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(SPACE_ART.moon, mx - mr, my - mr, mr * 2, mr * 2);
        ctx.restore();
      } else {
        const mg = ctx.createRadialGradient(mx - mr * 0.35, my - mr * 0.4, 1, mx, my, mr);
        mg.addColorStop(0, "#d1c1a4");
        mg.addColorStop(0.5, "#817562");
        mg.addColorStop(1, "#17181b");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }
    };


    const drawPlanet = (now: number) => {
      const c = camera.current;
      const cx = width * 0.5;
      const cy = height * (width < 600 ? 0.47 : 0.5);
      const radius = Math.min(width, height) * (width < 600 ? 0.335 : 0.31) * c.zoom;

      // Very soft outer atmosphere and planetary bloom.
      const bloom = ctx.createRadialGradient(cx, cy, radius * 0.88, cx, cy, radius * 1.22);
      bloom.addColorStop(0, "rgba(59,124,152,0)");
      bloom.addColorStop(0.7, "rgba(72,151,181,.06)");
      bloom.addColorStop(0.91, "rgba(97,185,219,.17)");
      bloom.addColorStop(1, "rgba(74,132,160,0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.23, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const ocean = ctx.createRadialGradient(cx - radius * 0.42, cy - radius * 0.48, radius * 0.04, cx, cy, radius * 1.06);
      ocean.addColorStop(0, "#3e7c86");
      ocean.addColorStop(0.28, "#215a66");
      ocean.addColorStop(0.67, "#123740");
      ocean.addColorStop(1, "#071416");
      ctx.fillStyle = ocean;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      if (EARTH_MAP.data) {
        drawTexturedEarth(ctx, cx, cy, radius, c);
      } else {
        ctx.fillStyle = "#14364a";
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }

      ctx.globalAlpha = 1;

      // Fine projected latitude/longitude instrument lines.
      ctx.strokeStyle = "rgba(224,218,193,.045)";
      ctx.lineWidth = 0.65;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const p = project(lat, lon, c);
          if (p.z <= 0) { started = false; continue; }
          const x = cx + p.x * radius;
          const y = cy - p.y * radius;
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let lon = -150; lon <= 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -88; lat <= 88; lat += 3) {
          const p = project(lat, lon, c);
          if (p.z <= 0) { started = false; continue; }
          const x = cx + p.x * radius;
          const y = cy - p.y * radius;
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Cloud systems move independently from the planet rotation.
      if (!reduced) {
        const cloudShift = (now * 0.0018) % 360;
        ctx.lineCap = "round";
        for (let band = -48; band <= 48; band += 24) {
          ctx.beginPath();
          let started = false;
          for (let lon = -180; lon <= 180; lon += 5) {
            const lat = band + Math.sin((lon + cloudShift + band * 2) * DEG * 1.7) * 4.2;
            const p = project(lat, lon + cloudShift * 0.22, c);
            if (p.z <= 0.04) { started = false; continue; }
            const x = cx + p.x * radius;
            const y = cy - p.y * radius;
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = "rgba(235,240,235,.085)";
          ctx.lineWidth = radius * 0.018;
          ctx.stroke();
        }
      }

      // Warm city lights bloom on the dark hemisphere only.
      for (const light of CITY_LIGHTS) {
        const p = project(light.lat, light.lon, c);
        if (p.z <= 0.01) continue;
        const darkness = clamp((p.x + 0.12) * 1.8, 0, 1);
        if (darkness < 0.08) continue;
        const alpha = darkness * light.strength * 0.72;
        ctx.fillStyle = `rgba(244,177,87,${alpha})`;
        ctx.beginPath();
        ctx.arc(cx + p.x * radius, cy - p.y * radius, Math.max(0.65, radius * 0.0045 * light.strength), 0, Math.PI * 2);
        ctx.fill();
      }

      // Directional terminator. The offset radial gradient leaves a bright sunward limb.
      const night = ctx.createRadialGradient(cx - radius * 0.45, cy - radius * 0.34, radius * 0.18, cx + radius * 0.28, cy + radius * 0.12, radius * 1.18);
      night.addColorStop(0, "rgba(255,238,199,.09)");
      night.addColorStop(0.42, "rgba(5,10,13,.04)");
      night.addColorStop(0.72, "rgba(1,5,8,.35)");
      night.addColorStop(1, "rgba(0,2,5,.78)");
      ctx.fillStyle = night;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Sun glint on the ocean.
      const glint = ctx.createRadialGradient(cx - radius * 0.43, cy - radius * 0.38, 0, cx - radius * 0.43, cy - radius * 0.38, radius * 0.37);
      glint.addColorStop(0, "rgba(225,205,158,.18)");
      glint.addColorStop(0.24, "rgba(173,204,207,.08)");
      glint.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glint;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();

      // Razor-thin atmospheric limb.
      ctx.save();
      ctx.strokeStyle = "rgba(117,194,221,.52)";
      ctx.lineWidth = Math.max(1.4, radius * 0.008);
      ctx.shadowColor = "rgba(82,166,205,.65)";
      ctx.shadowBlur = radius * 0.055;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.006, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Orbital guide arcs and a tiny moving satellite give true depth cues.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.28);
      ctx.scale(1, 0.31);
      ctx.strokeStyle = "rgba(198,178,130,.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      const sa = now * 0.00009;
      const sx = Math.cos(sa) * radius * 1.35;
      const sy = Math.sin(sa) * radius * 1.35;
      ctx.fillStyle = "rgba(224,205,158,.75)";
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      markers.current = [];
      for (const id of CANONICAL_REGION_IDS) {
        const region = regionById(id);
        const location = REGION_TO_LOCATION[id];
        const unlocked = !!locations[location]?.unlocked;
        const p = project(region.marker.lat, region.marker.lon, c);
        if (p.z <= 0.025) continue;
        const x = cx + p.x * radius;
        const y = cy - p.y * radius;
        const depth = clamp((p.z - 0.02) / 0.65, 0.18, 1);
        const active = id === selected;
        const markerRadius = ((active ? 4.2 : 3.1) + depth * 1.1) * (theater ? 1.05 : 1);
        markers.current.push({ id, x, y, z: p.z, radius: theater ? 26 : 20, unlocked });

        ctx.save();
        ctx.globalAlpha = unlocked ? 0.55 + depth * 0.45 : 0.33;
        ctx.strokeStyle = active ? "#e4be73" : unlocked ? "#bda46d" : "#77736b";
        ctx.fillStyle = active ? "#f0cf87" : unlocked ? "#c3ab75" : "#6b6c6a";
        ctx.shadowColor = active ? "rgba(226,184,105,.65)" : "rgba(180,155,102,.32)";
        ctx.shadowBlur = active ? 15 : 7;
        ctx.beginPath();
        ctx.arc(x, y, markerRadius + (active ? Math.sin(now * 0.004) * 1.3 : 0), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, markerRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        const label = unlocked ? region.name : "SEALED";
        ctx.font = `${active ? 600 : 500} ${theater ? (active ? 15 : 13) : active ? 11 : 10}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        const tw = ctx.measureText(label).width;
        const bx = clamp(x - tw / 2 - 8, 5, width - tw - 21);
        const by = y + markerRadius + 12;
        roundedRect(ctx, bx, by, tw + 16, 22, 7);
        ctx.fillStyle = active ? "rgba(28,22,15,.92)" : "rgba(8,10,12,.76)";
        ctx.fill();
        ctx.strokeStyle = active ? "rgba(221,183,108,.52)" : "rgba(146,133,104,.24)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = active ? "#ead29d" : unlocked ? "#c4bba8" : "#77736b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, bx + (tw + 16) / 2, by + 11);
      }
    };

    const drawMeteors = (now: number, dt: number) => {
      if (!reduced && now - lastMeteor.current > 6500 + seeded(Math.floor(now / 1200)) * 9000) {
        lastMeteor.current = now;
        const left = seeded(Math.floor(now / 97)) > 0.5;
        meteors.current.push({
          x: left ? -40 : width + 40,
          y: height * (0.08 + seeded(Math.floor(now / 71)) * 0.38),
          vx: (left ? 1 : -1) * (190 + seeded(Math.floor(now / 53)) * 150),
          vy: 80 + seeded(Math.floor(now / 41)) * 90,
          life: 0,
          ttl: 1.2 + seeded(Math.floor(now / 31)) * 0.75,
          size: 1.1 + seeded(Math.floor(now / 29)) * 1.4,
        });
      }

      meteors.current = meteors.current.filter((m) => {
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.life >= m.ttl) return false;
        const alpha = Math.sin((m.life / m.ttl) * Math.PI) * 0.85;
        const mag = Math.hypot(m.vx, m.vy) || 1;
        const ux = m.vx / mag;
        const uy = m.vy / mag;
        const len = 52;
        const g = ctx.createLinearGradient(m.x, m.y, m.x - ux * len, m.y - uy * len);
        g.addColorStop(0, `rgba(255,230,180,${alpha})`);
        g.addColorStop(0.22, `rgba(225,133,66,${alpha * 0.68})`);
        g.addColorStop(1, "rgba(190,80,35,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = m.size;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - ux * len, m.y - uy * len);
        ctx.stroke();
        return true;
      });
    };

    const frame = (now: number) => {
      const dt = Math.min(0.034, Math.max(0.001, (now - previous) / 1000));
      previous = now;
      const c = camera.current;
      const idleFor = now - lastInteraction.current;

      if (!drag.current && pointers.current.size < 2) {
        if (!reduced && idleFor > 4200 && Math.abs(shortestAngle(c.yaw, c.targetYaw)) < 0.025) {
          c.targetYaw += dt * 0.045;
        }

        // Inertia is allowed to finish before the spring re-engages strongly.
        if (Math.abs(c.yawVelocity) > 0.002 || Math.abs(c.pitchVelocity) > 0.002) {
          c.yaw += c.yawVelocity * dt;
          c.pitch += c.pitchVelocity * dt;
          const friction = Math.exp(-4.15 * dt);
          c.yawVelocity *= friction;
          c.pitchVelocity *= friction;
          c.targetYaw = c.yaw;
          c.targetPitch = c.pitch;
        } else {
          c.yawVelocity = 0;
          c.pitchVelocity = 0;
          const spring = 1 - Math.exp(-5.8 * dt);
          c.yaw += shortestAngle(c.yaw, c.targetYaw) * spring;
          c.pitch += (c.targetPitch - c.pitch) * spring;
        }
      }
      c.pitch = clamp(c.pitch, -1.08, 1.08);
      c.targetPitch = clamp(c.targetPitch, -1.08, 1.08);
      c.zoom += (c.targetZoom - c.zoom) * (1 - Math.exp(-7.2 * dt));
      c.zoom = clamp(c.zoom, MIN_ZOOM, MAX_ZOOM);
      c.yaw = wrapAngle(c.yaw);
      c.targetYaw = c.yaw + shortestAngle(c.yaw, c.targetYaw);

      drawSpace(now);
      drawPlanet(now);
      drawMeteors(now, dt);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [locations, selected, theater]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const distance = () => {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
    };

    const down = (e: PointerEvent) => {
      stage.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      lastInteraction.current = performance.now();
      const c = camera.current;
      c.yawVelocity = 0;
      c.pitchVelocity = 0;
      if (pointers.current.size === 2) {
        pinch.current = { distance: Math.max(1, distance()), zoom: c.targetZoom };
        drag.current = null;
        setDragging(true);
        return;
      }
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
      setDragging(true);
    };

    const move = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      lastInteraction.current = performance.now();
      const c = camera.current;

      if (pointers.current.size >= 2 && pinch.current) {
        const ratio = distance() / Math.max(1, pinch.current.distance);
        c.targetZoom = clamp(pinch.current.zoom * ratio, MIN_ZOOM, MAX_ZOOM);
        c.zoom += (c.targetZoom - c.zoom) * 0.38;
        setHint(`Orbital zoom ${c.targetZoom.toFixed(2)}×`);
        return;
      }

      const d = drag.current;
      if (!d || d.id !== e.pointerId || pointers.current.size !== 1) return;
      const now = performance.now();
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      const elapsed = Math.max(8, now - d.t);
      if (Math.hypot(dx, dy) > 3) d.moved = true;
      c.yaw -= dx * 0.0046;
      c.pitch = clamp(c.pitch - dy * 0.0038, -1.08, 1.08);
      c.targetYaw = c.yaw;
      c.targetPitch = c.pitch;
      c.yawVelocity = clamp((-dx / elapsed) * 4.2, -2.4, 2.4);
      c.pitchVelocity = clamp((-dy / elapsed) * 3.4, -1.8, 1.8);
      d.x = e.clientX;
      d.y = e.clientY;
      d.t = now;
      setHint("Release to coast");
    };

    const up = (e: PointerEvent) => {
      const d = drag.current;
      const wasTap = d?.id === e.pointerId && !d.moved;
      const point = pointers.current.get(e.pointerId);
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size === 0) {
        drag.current = null;
        setDragging(false);
        setHint("Drag to orbit · pinch to zoom");
      }
      lastInteraction.current = performance.now();

      if (wasTap && point) {
        let best: MarkerHit | null = null;
        let bestDistance = Infinity;
        for (const marker of markers.current) {
          const dist = Math.hypot(point.x - stage.getBoundingClientRect().left - marker.x, point.y - stage.getBoundingClientRect().top - marker.y);
          if (dist < marker.radius && dist < bestDistance) {
            best = marker;
            bestDistance = dist;
          }
        }
        if (best?.unlocked) focusRegion(best.id);
      }
    };

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const c = camera.current;
      if (e.ctrlKey || e.metaKey) {
        zoomBy(e.deltaY > 0 ? 0.92 : 1.09);
        setHint(`Orbital zoom ${c.targetZoom.toFixed(2)}×`);
        return;
      }
      c.targetPitch -= e.deltaY * 0.0024;
      c.targetYaw -= e.deltaX * 0.0024;
      c.pitchVelocity = 0;
      c.yawVelocity = 0;
      lastInteraction.current = performance.now();
      setHint("Grab the planet · scroll follows the ground");
    };

    stage.addEventListener("pointerdown", down);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    stage.addEventListener("wheel", wheel, { passive: false });
    return () => {
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", up);
      stage.removeEventListener("wheel", wheel);
    };
  }, [locations, selected, theater]);

  const region = regionById(selected);
  const location = REGION_TO_LOCATION[selected];
  const unlocked = !!locations[location]?.unlocked;

  return (
    <div className={theater
      ? "relative h-full min-h-0 overflow-hidden bg-[#030407]"
      : "overflow-hidden rounded-[var(--radius-xl)] border border-line/70 bg-[#030407] shadow-[0_24px_80px_rgba(0,0,0,.45)]"
    }>
      {theater ? null : (
      <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-surface/75 px-3 py-2.5 backdrop-blur-md">
        <div className="min-w-0">
          <div className="font-display text-[9px] uppercase tracking-[0.22em] text-ember">Orbit</div>
          <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <GlobeButton label="Zoom out" onClick={() => zoomBy(0.9)}><Minus className="size-4" /></GlobeButton>
          <GlobeButton label="Zoom in" onClick={() => zoomBy(1.1)}><Plus className="size-4" /></GlobeButton>
          <GlobeButton label="Recenter" onClick={reset}><RotateCcw className="size-4" /></GlobeButton>
        </div>
      </div>
      )}

      <div
        ref={stageRef}
        tabIndex={0}
        className={`relative w-full touch-none select-none outline-none ${
          theater ? "h-full min-h-0" : "h-[12rem] min-h-[12rem] md:h-[min(42vh,360px)] md:min-h-[240px]"
        } ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        aria-label="Interactive world globe. Drag to rotate and pinch to zoom."
      >
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
        {theater ? (
          <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center gap-1">
            <GlobeButton label="Zoom out" onClick={() => zoomBy(0.9)}><Minus className="size-4" /></GlobeButton>
            <GlobeButton label="Zoom in" onClick={() => zoomBy(1.1)}><Plus className="size-4" /></GlobeButton>
            <GlobeButton label="Recenter" onClick={reset}><RotateCcw className="size-4" /></GlobeButton>
          </div>
        ) : null}

        <div className={`absolute left-3 right-3 flex items-end justify-between gap-3 ${theater ? "bottom-[max(1rem,env(safe-area-inset-bottom))]" : "bottom-3"}`}>
          <div className="max-w-[68%] rounded-[var(--radius-lg)] border border-line/60 bg-ink/78 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Compass className="size-4 shrink-0 text-ember" />
              <div className="min-w-0">
                <div className={`truncate font-display text-paper ${theater ? "text-base" : "text-sm"}`}>{region.name}</div>
                <div className="truncate font-display text-[10px] uppercase tracking-[0.16em] text-ember">{`${Math.abs(region.marker.lat)}°${region.marker.lat >= 0 ? "N" : "S"} ${Math.abs(region.marker.lon)}°${region.marker.lon >= 0 ? "E" : "W"}`}</div>
                <div className="truncate text-[11px] text-muted">{unlocked ? "Pin on the live world · drag to orbit" : "SEALED · preceding boss must fall"}</div>
                {theater ? <div className="mt-1 truncate text-[11px] text-moon">Drag to orbit · pinch to zoom</div> : null}
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

function GlobeButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
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
