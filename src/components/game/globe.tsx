import { CANONICAL_REGION_IDS, canonicalRegionId, regionById } from "@/game/data";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import type { LocationId, RegionId } from "@/game/types";
import { Compass, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const REGION_TO_LOCATION: Record<RegionId, LocationId> = {
  ironclad: "ironclad",
  slagtown: "kingdom",
  blackspire: "caverns",
  brasswater: "library",
  veyra: "veyra",
};

const DEG = Math.PI / 180;
const MIN_ZOOM = 0.88;
const MAX_ZOOM = 1.7;

type View = { yaw: number; pitch: number; zoom: number };
type Point = { x: number; y: number; z: number };
type ScreenMarker = { id: RegionId; x: number; y: number; z: number; radius: number; unlocked: boolean };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number };

type Star = { x: number; y: number; depth: number; size: number; twinkle: number };

function seeded(i: number) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const STARS: Star[] = Array.from({ length: 170 }, (_, i) => ({
  x: seeded(i * 5 + 1),
  y: seeded(i * 5 + 2),
  depth: 0.2 + seeded(i * 5 + 3) * 0.8,
  size: 0.45 + seeded(i * 5 + 4) * 1.8,
  twinkle: seeded(i * 5 + 5) * Math.PI * 2,
}));

const BIOME_COLORS: Record<RegionId, string> = {
  ironclad: "rgba(166, 125, 88, .52)",
  slagtown: "rgba(184, 72, 38, .62)",
  blackspire: "rgba(57, 66, 72, .72)",
  brasswater: "rgba(71, 123, 112, .55)",
  veyra: "rgba(74, 130, 125, .46)",
};

const BIOME_OFFSETS: [number, number, number][] = [
  [0, 0, 1],
  [8, -9, 0.72],
  [-6, 11, 0.64],
  [12, 8, 0.52],
  [-10, -13, 0.48],
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function wrapAngle(n: number) {
  while (n > Math.PI) n -= Math.PI * 2;
  while (n < -Math.PI) n += Math.PI * 2;
  return n;
}

function targetForRegion(id: RegionId): View {
  const m = regionById(id).marker;
  return { yaw: -m.lon * DEG, pitch: m.lat * DEG, zoom: 1.08 };
}

function projectLatLon(lat: number, lon: number, view: View): Point {
  const la = lat * DEG;
  const lo = lon * DEG;
  const cl = Math.cos(la);
  const x0 = cl * Math.sin(lo);
  const y0 = Math.sin(la);
  const z0 = cl * Math.cos(lo);

  const cy = Math.cos(view.yaw);
  const sy = Math.sin(view.yaw);
  const x1 = x0 * cy + z0 * sy;
  const z1 = -x0 * sy + z0 * cy;

  const cp = Math.cos(view.pitch);
  const sp = Math.sin(view.pitch);
  const y2 = y0 * cp - z1 * sp;
  const z2 = y0 * sp + z1 * cp;
  return { x: x1, y: y2, z: z2 };
}

function drawProjectedLine(
  ctx: CanvasRenderingContext2D,
  view: View,
  cx: number,
  cy: number,
  radius: number,
  samples: { lat: number; lon: number }[],
) {
  let open = false;
  ctx.beginPath();
  for (const sample of samples) {
    const p = projectLatLon(sample.lat, sample.lon, view);
    if (p.z <= 0) {
      open = false;
      continue;
    }
    const x = cx + p.x * radius;
    const y = cy - p.y * radius;
    if (!open) {
      ctx.moveTo(x, y);
      open = true;
    } else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function openRegionMap(regionId: RegionId) {
  window.dispatchEvent(new CustomEvent("hollow:open-region-map", { detail: { regionId } }));
}

export function HollowGlobe({ loc, onSelect }: { loc: LocationId; onSelect: (id: LocationId) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const locations = useGame((g) => g.s.locations);
  const selectedRegion = canonicalRegionId(loc) ?? "ironclad";
  const [hintVisible, setHintVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const view = useRef<View>(targetForRegion(selectedRegion));
  const target = useRef<View>(targetForRegion(selectedRegion));
  const pointer = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const markers = useRef<ScreenMarker[]>([]);
  const meteors = useRef<Meteor[]>([]);
  const lastMeteor = useRef(0);
  const lastInteraction = useRef(performance.now());

  useEffect(() => {
    target.current = { ...targetForRegion(selectedRegion), zoom: Math.max(view.current.zoom, 1.02) };
  }, [selectedRegion]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      width = Math.max(1, r.width);
      height = Math.max(1, r.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const drawStars = (now: number) => {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#030508");
      bg.addColorStop(0.58, "#07080c");
      bg.addColorStop(1, "#120b08");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const galaxyX = width * 0.82;
      const galaxyY = height * 0.18;
      const galaxyR = Math.min(width, height) * 0.22;
      const g = ctx.createRadialGradient(galaxyX, galaxyY, 0, galaxyX, galaxyY, galaxyR);
      g.addColorStop(0, "rgba(245,190,125,.17)");
      g.addColorStop(0.18, "rgba(110,125,180,.13)");
      g.addColorStop(0.55, "rgba(74,62,105,.07)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(galaxyX - galaxyR, galaxyY - galaxyR, galaxyR * 2, galaxyR * 2);
      ctx.save();
      ctx.translate(galaxyX, galaxyY);
      ctx.rotate(-0.42);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, galaxyR * (0.36 + i * 0.08), galaxyR * (0.07 + i * 0.025), 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${190 + i * 7},${155 + i * 8},${130 + i * 10},${0.07 - i * 0.008})`;
        ctx.lineWidth = 2 + i * 0.8;
        ctx.stroke();
      }
      ctx.restore();

      for (const star of STARS) {
        const px = ((star.x * width + view.current.yaw * width * 0.025 * star.depth) % width + width) % width;
        const py = ((star.y * height + view.current.pitch * height * 0.02 * star.depth) % height + height) % height;
        const tw = 0.55 + Math.sin(now * 0.0015 + star.twinkle) * 0.28;
        ctx.fillStyle = `rgba(225,232,245,${tw * star.depth})`;
        ctx.beginPath();
        ctx.arc(px, py, star.size * (0.45 + star.depth * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      const moonX = width * 0.11;
      const moonY = height * 0.2;
      const moonR = Math.max(7, Math.min(width, height) * 0.025);
      const moon = ctx.createRadialGradient(moonX - moonR * 0.35, moonY - moonR * 0.4, 1, moonX, moonY, moonR);
      moon.addColorStop(0, "#b9aa91");
      moon.addColorStop(0.62, "#61594f");
      moon.addColorStop(1, "#171719");
      ctx.fillStyle = moon;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawMeteors = (now: number, dt: number) => {
      if (!reduced && now - lastMeteor.current > 2600 + seeded(Math.floor(now / 1000)) * 4200) {
        lastMeteor.current = now;
        const fromLeft = seeded(Math.floor(now / 97)) > 0.5;
        meteors.current.push({
          x: fromLeft ? -30 : width + 30,
          y: height * (0.08 + seeded(Math.floor(now / 71)) * 0.42),
          vx: (fromLeft ? 1 : -1) * (150 + seeded(Math.floor(now / 53)) * 150),
          vy: 70 + seeded(Math.floor(now / 41)) * 90,
          life: 0,
          max: 1.5 + seeded(Math.floor(now / 31)) * 1.1,
          size: 1.3 + seeded(Math.floor(now / 29)) * 1.9,
        });
      }
      meteors.current = meteors.current.filter((m) => {
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.life >= m.max) return false;
        const alpha = Math.sin((m.life / m.max) * Math.PI) * 0.85;
        const len = 34 + m.size * 18;
        const mag = Math.hypot(m.vx, m.vy) || 1;
        const ux = m.vx / mag;
        const uy = m.vy / mag;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - ux * len, m.y - uy * len);
        grad.addColorStop(0, `rgba(255,220,165,${alpha})`);
        grad.addColorStop(0.15, `rgba(255,148,74,${alpha * 0.7})`);
        grad.addColorStop(1, "rgba(255,100,40,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.size;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - ux * len, m.y - uy * len);
        ctx.stroke();
        return true;
      });
    };

    const drawPlanet = (now: number) => {
      const cx = width * 0.5;
      const cy = height * (width < 640 ? 0.47 : 0.5);
      const radius = Math.min(width, height) * 0.32 * view.current.zoom;

      ctx.save();
      ctx.shadowColor = "rgba(75,151,190,.34)";
      ctx.shadowBlur = radius * 0.18;
      ctx.strokeStyle = "rgba(112,189,227,.42)";
      ctx.lineWidth = Math.max(2, radius * 0.018);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.018, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const ocean = ctx.createRadialGradient(cx - radius * 0.42, cy - radius * 0.4, radius * 0.05, cx, cy, radius);
      ocean.addColorStop(0, "#315765");
      ocean.addColorStop(0.34, "#23444c");
      ocean.addColorStop(0.72, "#1c3030");
      ocean.addColorStop(1, "#111718");
      ctx.fillStyle = ocean;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      for (const id of CANONICAL_REGION_IDS) {
        const def = regionById(id);
        for (let i = 0; i < BIOME_OFFSETS.length; i++) {
          const [latOff, lonOff, scale] = BIOME_OFFSETS[i]!;
          const p = projectLatLon(def.marker.lat + latOff, def.marker.lon + lonOff, view.current);
          if (p.z <= -0.08) continue;
          const alpha = clamp((p.z + 0.12) / 0.55, 0, 1);
          const pr = radius * (0.24 * scale) * (0.4 + p.z * 0.6);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(cx + p.x * radius, cy - p.y * radius);
          ctx.rotate((def.marker.lon + i * 23) * DEG);
          ctx.scale(1, 0.58 + 0.16 * scale);
          ctx.fillStyle = BIOME_COLORS[id];
          ctx.beginPath();
          ctx.ellipse(0, 0, pr, pr * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.strokeStyle = "rgba(225,220,196,.095)";
      ctx.lineWidth = 0.7;
      for (const lat of [-60, -30, 0, 30, 60]) {
        const samples = Array.from({ length: 73 }, (_, i) => ({ lat, lon: -180 + i * 5 }));
        drawProjectedLine(ctx, view.current, cx, cy, radius, samples);
      }
      for (const lon of [-150, -90, -30, 30, 90, 150]) {
        const samples = Array.from({ length: 49 }, (_, i) => ({ lat: -90 + i * 3.75, lon }));
        drawProjectedLine(ctx, view.current, cx, cy, radius, samples);
      }

      const cloudShift = reduced ? 0 : (now * 0.0016) % 360;
      ctx.strokeStyle = "rgba(232,235,228,.14)";
      ctx.lineCap = "round";
      ctx.lineWidth = radius * 0.035;
      for (const lat of [-42, 12, 48]) {
        const samples = Array.from({ length: 40 }, (_, i) => ({
          lat: lat + Math.sin((i / 39) * Math.PI * 4 + lat) * 4,
          lon: -180 + i * (360 / 39) + cloudShift,
        }));
        drawProjectedLine(ctx, view.current, cx, cy, radius, samples);
      }

      const shade = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
      shade.addColorStop(0, "rgba(255,161,82,.12)");
      shade.addColorStop(0.42, "rgba(0,0,0,0)");
      shade.addColorStop(0.72, "rgba(0,0,0,.18)");
      shade.addColorStop(1, "rgba(0,0,0,.7)");
      ctx.fillStyle = shade;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      const topGlow = ctx.createRadialGradient(cx - radius * 0.46, cy - radius * 0.5, 0, cx - radius * 0.3, cy - radius * 0.3, radius * 1.1);
      topGlow.addColorStop(0, "rgba(255,218,165,.16)");
      topGlow.addColorStop(0.42, "rgba(255,255,255,.03)");
      topGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topGlow;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();

      ctx.save();
      for (let i = 0; i < 12; i++) {
        const a = now * 0.00008 * (i % 2 ? -1 : 1) + i * 0.73;
        const orbitR = radius * (1.22 + (i % 4) * 0.055);
        const ox = cx + Math.cos(a) * orbitR;
        const oy = cy + Math.sin(a) * orbitR * 0.27;
        const front = Math.sin(a) > 0;
        ctx.fillStyle = front ? "rgba(160,132,105,.72)" : "rgba(82,72,68,.34)";
        ctx.beginPath();
        ctx.arc(ox, oy, 1.1 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const nextMarkers: ScreenMarker[] = [];
      for (const id of CANONICAL_REGION_IDS) {
        const def = regionById(id);
        const p = projectLatLon(def.marker.lat, def.marker.lon, view.current);
        if (p.z <= 0.03) continue;
        const unlocked = !!locations[REGION_TO_LOCATION[id]]?.unlocked;
        const x = cx + p.x * radius;
        const y = cy - p.y * radius;
        const selected = selectedRegion === id;
        const rr = selected ? 8.5 : 6.5;
        nextMarkers.push({ id, x, y, z: p.z, radius: rr + 18, unlocked });

        ctx.save();
        ctx.globalAlpha = unlocked ? clamp(0.55 + p.z * 0.55, 0.55, 1) : 0.34;
        if (selected) {
          const pulse = 13 + Math.sin(now * 0.003) * 2.5;
          ctx.strokeStyle = "rgba(242,189,112,.62)";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.shadowColor = selected ? "rgba(242,189,112,.75)" : "rgba(94,170,164,.5)";
        ctx.shadowBlur = selected ? 18 : 10;
        ctx.fillStyle = unlocked ? (selected ? "#f2bd70" : "#78b4aa") : "#5f5650";
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(10,8,7,.9)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `${selected ? 700 : 600} ${width < 480 ? 10 : 11}px Cinzel, Georgia, serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(5,6,7,.85)";
        ctx.strokeText(def.name.toUpperCase(), x, y - rr - 6);
        ctx.fillStyle = unlocked ? "#f1e3c2" : "#8b7b6a";
        ctx.fillText(def.name.toUpperCase(), x, y - rr - 6);
        ctx.restore();
      }
      markers.current = nextMarkers;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ease = 1 - Math.exp(-(reduced ? 18 : 7.5) * dt);
      let dyaw = wrapAngle(target.current.yaw - view.current.yaw);
      view.current.yaw = wrapAngle(view.current.yaw + dyaw * ease);
      view.current.pitch += (target.current.pitch - view.current.pitch) * ease;
      view.current.zoom += (target.current.zoom - view.current.zoom) * ease;

      if (!reduced && !drag.current && pointer.current.size === 0 && now - lastInteraction.current > 5200) {
        target.current.yaw = wrapAngle(target.current.yaw + dt * 0.035);
      }

      drawStars(now);
      drawMeteors(now, dt);
      drawPlanet(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [locations, selectedRegion]);

  const focus = (id: RegionId, open = false) => {
    const targetLoc = REGION_TO_LOCATION[id];
    if (!locations[targetLoc]?.unlocked) return;
    lastInteraction.current = performance.now();
    sfx.click();
    onSelect(targetLoc);
    target.current = { ...targetForRegion(id), zoom: Math.max(1.08, target.current.zoom) };
    setHintVisible(false);
    if (open) window.setTimeout(() => openRegionMap(id), 220);
  };

  const hitMarker = (clientX: number, clientY: number) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return null;
    const x = clientX - r.left;
    const y = clientY - r.top;
    let best: ScreenMarker | null = null;
    let bestD = Infinity;
    for (const marker of markers.current) {
      const d = Math.hypot(marker.x - x, marker.y - y);
      if (d < marker.radius && d < bestD) {
        best = marker;
        bestD = d;
      }
    }
    return best;
  };

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line/70 bg-ink shadow-2xl">
      <div
        ref={wrapRef}
        className="relative h-[28rem] touch-none overflow-hidden md:h-[36rem]"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          pointer.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          lastInteraction.current = performance.now();
          if (pointer.current.size === 1) {
            drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
            setDragging(true);
          }
          if (pointer.current.size === 2) {
            const pts = [...pointer.current.values()];
            pinch.current = {
              distance: Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y),
              zoom: target.current.zoom,
            };
          }
        }}
        onPointerMove={(e) => {
          const prev = pointer.current.get(e.pointerId);
          if (!prev) return;
          pointer.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          lastInteraction.current = performance.now();

          if (pointer.current.size === 2 && pinch.current) {
            const pts = [...pointer.current.values()];
            const d = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
            target.current.zoom = clamp(pinch.current.zoom * (d / Math.max(1, pinch.current.distance)), MIN_ZOOM, MAX_ZOOM);
            return;
          }

          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 2 || Math.hypot(dx, dy) > 3) d.moved = true;
          d.x = e.clientX;
          d.y = e.clientY;
          target.current.yaw = wrapAngle(target.current.yaw + dx * 0.0075);
          target.current.pitch = clamp(target.current.pitch - dy * 0.0065, -1.15, 1.15);
          setHintVisible(false);
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          const wasClick = !!d && d.id === e.pointerId && !d.moved && pointer.current.size === 1;
          pointer.current.delete(e.pointerId);
          if (pointer.current.size < 2) pinch.current = null;
          if (d?.id === e.pointerId) drag.current = null;
          if (pointer.current.size === 0) setDragging(false);
          if (!wasClick) return;
          const marker = hitMarker(e.clientX, e.clientY);
          if (marker?.unlocked) focus(marker.id, true);
        }}
        onPointerCancel={(e) => {
          pointer.current.delete(e.pointerId);
          if (drag.current?.id === e.pointerId) drag.current = null;
          if (pointer.current.size < 2) pinch.current = null;
          if (pointer.current.size === 0) setDragging(false);
        }}
        onWheel={(e) => {
          e.preventDefault();
          lastInteraction.current = performance.now();
          target.current.zoom = clamp(target.current.zoom * (e.deltaY < 0 ? 1.09 : 0.92), MIN_ZOOM, MAX_ZOOM);
          setHintVisible(false);
        }}
      >
        <canvas ref={canvasRef} className={`absolute inset-0 size-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_30%,rgba(0,0,0,.18)_66%,rgba(0,0,0,.55)_100%)]" />
        <div className="pointer-events-none absolute inset-0 crt-scan opacity-25" />

        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-line/70 bg-ink/70 px-3 py-1.5 font-display text-[9px] uppercase tracking-[0.2em] text-moon backdrop-blur">
          Hollow Realm · orbital view
        </div>
        {hintVisible ? (
          <div className="pointer-events-none absolute inset-x-5 bottom-28 mx-auto max-w-sm rounded-xl border border-line/60 bg-ink/78 px-4 py-3 text-center text-xs text-moon backdrop-blur md:bottom-24">
            Drag the world · pinch to zoom · tap a region to enter
          </div>
        ) : null}

        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => {
              sfx.click();
              target.current.zoom = clamp(target.current.zoom * 1.14, MIN_ZOOM, MAX_ZOOM);
            }}
            className="flex size-10 items-center justify-center rounded-lg border border-line bg-ink/75 text-paper backdrop-blur"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => {
              sfx.click();
              target.current.zoom = clamp(target.current.zoom / 1.14, MIN_ZOOM, MAX_ZOOM);
            }}
            className="flex size-10 items-center justify-center rounded-lg border border-line bg-ink/75 text-paper backdrop-blur"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Focus selected region"
            onClick={() => {
              sfx.click();
              target.current = targetForRegion(selectedRegion);
              lastInteraction.current = performance.now();
            }}
            className="flex size-10 items-center justify-center rounded-lg border border-line bg-ink/75 text-moon backdrop-blur"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-line/80 bg-ink/84 p-3 shadow-2xl backdrop-blur-md md:left-4 md:right-auto md:w-[22rem]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-ember/50 bg-ember/10 text-ember">
              <Compass className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[9px] uppercase tracking-[0.2em] text-ember">Selected region</p>
              <h3 className="mt-0.5 font-display text-lg text-paper">{regionById(selectedRegion).name}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{regionById(selectedRegion).description}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => openRegionMap(selectedRegion)}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-ember/60 bg-ember/15 px-3 font-display text-[10px] uppercase tracking-[0.16em] text-ember-bright"
            >
              <Maximize2 className="size-3.5" /> Enter region
            </button>
            <span className="flex min-h-11 items-center rounded-lg border border-line bg-raised/70 px-3 font-display text-[9px] uppercase tracking-[0.14em] text-moon">
              Danger {regionById(selectedRegion).danger}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-line/70 bg-surface/95 p-2.5">
        {CANONICAL_REGION_IDS.map((id) => {
          const def = regionById(id);
          const targetLoc = REGION_TO_LOCATION[id];
          const unlocked = !!locations[targetLoc]?.unlocked;
          return (
            <button
              key={id}
              type="button"
              disabled={!unlocked}
              onClick={() => focus(id, false)}
              className={`shrink-0 rounded-full border px-3 py-2 font-display text-[9px] uppercase tracking-[0.14em] transition-colors ${
                selectedRegion === id
                  ? "border-ember bg-ember/15 text-ember-bright"
                  : "border-line bg-ink/50 text-moon disabled:opacity-35"
              }`}
            >
              {def.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
