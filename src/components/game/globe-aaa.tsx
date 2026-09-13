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
const MIN_ZOOM = 0.82;
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
type Star = { x: number; y: number; depth: number; size: number; phase: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; ttl: number; size: number };
type TerrainPoint = { region: RegionId; lat: number; lon: number; size: number; tone: number };

function seeded(n: number) {
  const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const STARS: Star[] = Array.from({ length: 260 }, (_, i) => ({
  x: seeded(i * 7 + 1),
  y: seeded(i * 7 + 2),
  depth: 0.18 + seeded(i * 7 + 3) * 0.82,
  size: 0.35 + seeded(i * 7 + 4) * 1.65,
  phase: seeded(i * 7 + 5) * Math.PI * 2,
}));

const TERRAIN: TerrainPoint[] = CANONICAL_REGION_IDS.flatMap((region, ri) => {
  const marker = regionById(region).marker;
  return Array.from({ length: 64 }, (_, i) => {
    const a = seeded(ri * 1000 + i * 13 + 1) * Math.PI * 2;
    const radial = Math.sqrt(seeded(ri * 1000 + i * 13 + 2));
    const latSpread = region === "blackspire" ? 19 : region === "brasswater" ? 16 : 21;
    const lonSpread = region === "veyra" ? 24 : 31;
    return {
      region,
      lat: marker.lat + Math.sin(a) * radial * latSpread,
      lon: marker.lon + Math.cos(a) * radial * lonSpread,
      size: 0.45 + seeded(ri * 1000 + i * 13 + 3) * 1.35,
      tone: seeded(ri * 1000 + i * 13 + 4),
    };
  });
});

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

const TERRAIN_TONES: Record<RegionId, [string, string, string]> = {
  ironclad: ["#8b7058", "#aa8968", "#66584b"],
  slagtown: ["#9d4931", "#c2643c", "#71372c"],
  blackspire: ["#4d555b", "#747d82", "#252c31"],
  brasswater: ["#557d72", "#6d9789", "#365e59"],
  veyra: ["#5a8f8c", "#83b4aa", "#345f65"],
};

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
  return { yaw: -m.lon * DEG, pitch: m.lat * DEG, zoom: 1.12 };
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

function openRegionMap(regionId: RegionId) {
  window.dispatchEvent(new CustomEvent("hollow:open-region-map", { detail: { regionId } }));
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

export function HollowGlobeAAA({ loc, onSelect }: { loc: LocationId; onSelect: (id: LocationId) => void }) {
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
    c.targetZoom = 1.18;
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
    c.targetZoom = 1.12;
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
      const mobileCap = width < 600 ? 1.55 : 2;
      dpr = Math.min(mobileCap, window.devicePixelRatio || 1);
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

      const c = camera.current;
      for (const star of STARS) {
        const px = ((star.x * width + c.yaw * width * star.depth * 0.022) % width + width) % width;
        const py = ((star.y * height + c.pitch * height * star.depth * 0.018) % height + height) % height;
        const flicker = reduced ? 0.65 : 0.52 + Math.sin(now * 0.0013 + star.phase) * 0.22;
        ctx.fillStyle = `rgba(226,232,241,${flicker * star.depth})`;
        ctx.beginPath();
        ctx.arc(px, py, star.size * (0.42 + star.depth * 0.52), 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant moon with a soft terminator.
      const mx = width * 0.12;
      const my = height * 0.18;
      const mr = Math.max(9, Math.min(width, height) * 0.026);
      const mg = ctx.createRadialGradient(mx - mr * 0.35, my - mr * 0.4, 1, mx, my, mr);
      mg.addColorStop(0, "#d1c1a4");
      mg.addColorStop(0.5, "#817562");
      mg.addColorStop(1, "#17181b");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
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
      ocean.addColorStop(0, "#476d7a");
      ocean.addColorStop(0.28, "#2f5962");
      ocean.addColorStop(0.67, "#1e3a3e");
      ocean.addColorStop(1, "#111a1d");
      ctx.fillStyle = ocean;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Region-authored terrain granulation. Projecting hundreds of tiny land
      // cells gives the globe irregular coast texture without a heavyweight 3D lib.
      for (const t of TERRAIN) {
        const p = project(t.lat, t.lon, c);
        if (p.z <= -0.015) continue;
        const edge = clamp((p.z + 0.04) / 0.28, 0, 1);
        const palette = TERRAIN_TONES[t.region];
        const color = t.tone > 0.68 ? palette[1] : t.tone < 0.28 ? palette[2] : palette[0];
        const size = radius * 0.034 * t.size * (0.68 + p.z * 0.32);
        ctx.globalAlpha = edge * (0.24 + t.tone * 0.23);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx + p.x * radius, cy - p.y * radius, size * 1.25, size * 0.72, (t.lon + t.lat) * DEG, 0, Math.PI * 2);
        ctx.fill();
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
        const markerRadius = (active ? 7.5 : 5.5) + depth * 2;
        markers.current.push({ id, x, y, z: p.z, radius: 30, unlocked });

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
        ctx.arc(x, y, markerRadius + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        const label = unlocked ? region.name : "SEALED";
        ctx.font = `${active ? 600 : 500} ${active ? 11 : 10}px ui-monospace, SFMono-Regular, Menlo, monospace`;
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
  }, [locations, selected]);

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
      c.yaw += dx * 0.0046;
      c.pitch = clamp(c.pitch - dy * 0.0038, -1.08, 1.08);
      c.targetYaw = c.yaw;
      c.targetPitch = c.pitch;
      c.yawVelocity = clamp((dx / elapsed) * 4.2, -2.4, 2.4);
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
      zoomBy(e.deltaY > 0 ? 0.92 : 1.09);
      setHint(`Orbital zoom ${camera.current.targetZoom.toFixed(2)}×`);
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
  }, [locations, selected]);

  const region = regionById(selected);
  const location = REGION_TO_LOCATION[selected];
  const unlocked = !!locations[location]?.unlocked;

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-line/70 bg-[#030407] shadow-[0_24px_80px_rgba(0,0,0,.45)]">
      <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-surface/75 px-3 py-2.5 backdrop-blur-md">
        <div className="min-w-0">
          <div className="font-display text-[9px] uppercase tracking-[0.22em] text-ember">Hollow Realm · Orbital Command</div>
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
        aria-label="Interactive 3D-style Hollow Realm globe. Drag to rotate and pinch to zoom."
      >
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="max-w-[68%] rounded-[var(--radius-lg)] border border-line/60 bg-ink/78 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Compass className="size-4 shrink-0 text-ember" />
              <div className="min-w-0">
                <div className="truncate font-display text-sm text-paper">{region.name}</div>
                <div className="truncate text-[11px] text-muted">{unlocked ? `Danger ${region.danger} · ${region.biome.replaceAll("-", " ")}` : "SEALED · preceding boss must fall"}</div>
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
