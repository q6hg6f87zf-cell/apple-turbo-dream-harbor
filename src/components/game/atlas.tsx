import { locById, WORLD } from "@/game/data";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import type { LocationId } from "@/game/types";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

const MIN_Z = 1;
const MAX_Z = 3.35;

const REGION_FILL: Record<string, string> = {
  ironclad: "color-mix(in oklab, var(--color-ok) 16%, transparent)",
  kingdom: "color-mix(in oklab, var(--color-muted) 18%, transparent)",
  caverns: "color-mix(in oklab, var(--color-line) 55%, transparent)",
  library: "color-mix(in oklab, var(--color-moon) 14%, transparent)",
  veyra: "color-mix(in oklab, var(--color-danger) 16%, transparent)",
  hq: "color-mix(in oklab, var(--color-ember) 20%, transparent)",
};

type Cam = { x: number; y: number; z: number };

function clampCam(c: Cam): Cam {
  const hx = 50 / c.z;
  const hy = 50 / c.z;
  return {
    x: Math.min(100 - hx, Math.max(hx, c.x)),
    y: Math.min(100 - hy, Math.max(hy, c.y)),
    z: Math.min(MAX_Z, Math.max(MIN_Z, c.z)),
  };
}

export function WorldAtlas({
  loc,
  onSelect,
}: {
  loc: LocationId;
  onSelect: (id: LocationId) => void;
}) {
  const s = useGame((g) => g.s);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cam = useRef<Cam>({ x: locById(loc).x, y: locById(loc).y, z: 1.15 });
  const tgt = useRef<Cam>({ ...cam.current });
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const pinch = useRef<{ d: number; z: number } | null>(null);

  useEffect(() => {
    const L = locById(loc);
    tgt.current = clampCam({ x: L.x, y: L.y, z: Math.max(tgt.current.z, 1.55) });
  }, [loc]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = el.querySelector("[data-map]") as HTMLElement | null;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = reduced ? 40 : 9;
      const a = 1 - Math.exp(-k * dt);
      cam.current.x += (tgt.current.x - cam.current.x) * a;
      cam.current.y += (tgt.current.y - cam.current.y) * a;
      cam.current.z += (tgt.current.z - cam.current.z) * a;
      if (layer) {
        const w = el.clientWidth;
        const h = el.clientHeight;
        const z = cam.current.z;
        const tx = w / 2 - (cam.current.x / 100) * w * z;
        const ty = h / 2 - (cam.current.y / 100) * h * z;
        layer.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const elNow = wrapRef.current;
      if (!elNow) return;
      const r = elNow.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const c = cam.current;
      const mx = c.x + (px - 0.5) * (100 / c.z);
      const my = c.y + (py - 0.5) * (100 / c.z);
      const z = Math.min(MAX_Z, Math.max(MIN_Z, tgt.current.z * (e.deltaY < 0 ? 1.12 : 0.9)));
      tgt.current = clampCam({
        x: mx - (px - 0.5) * (100 / z),
        y: my - (py - 0.5) * (100 / z),
        z,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  const toMap = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    const px = (clientX - r.left) / r.width;
    const py = (clientY - r.top) / r.height;
    const c = cam.current;
    return {
      x: c.x + (px - 0.5) * (100 / c.z),
      y: c.y + (py - 0.5) * (100 / c.z),
    };
  };

  const hitPin = (mx: number, my: number) => {
    let bestId: LocationId | null = null;
    let bestD = 7.5;
    for (const w of WORLD) {
      const d = Math.hypot(w.x - mx, w.y - my);
      if (d < bestD) {
        bestD = d;
        bestId = w.id;
      }
    }
    return bestId ? WORLD.find((w) => w.id === bestId) ?? null : null;
  };

  const zoomAt = (clientX: number, clientY: number, nextZ: number) => {
    const m = toMap(clientX, clientY);
    const z = Math.min(MAX_Z, Math.max(MIN_Z, nextZ));
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (clientX - r.left) / r.width;
    const py = (clientY - r.top) / r.height;
    tgt.current = clampCam({
      x: m.x - (px - 0.5) * (100 / z),
      y: m.y - (py - 0.5) * (100 / z),
      z,
    });
  };

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="relative h-[22rem] touch-none overflow-hidden rounded-[var(--radius-xl)] bg-ink shadow-[var(--shadow-border)] md:h-[32rem]"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.hypot(dx, dy) > 4) d.moved = true;
          d.x = e.clientX;
          d.y = e.clientY;
          const el = wrapRef.current;
          if (!el) return;
          tgt.current = clampCam({
            x: tgt.current.x - (dx / el.clientWidth) * (100 / tgt.current.z),
            y: tgt.current.y - (dy / el.clientHeight) * (100 / tgt.current.z),
            z: tgt.current.z,
          });
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.moved) return;
          const m = toMap(e.clientX, e.clientY);
          const pin = hitPin(m.x, m.y);
          if (pin && s.locations[pin.id].unlocked) {
            sfx.click();
            onSelect(pin.id as LocationId);
            tgt.current = clampCam({ x: pin.x, y: pin.y, z: Math.max(tgt.current.z, 1.85) });
          }
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const a = e.touches[0]!;
            const b = e.touches[1]!;
            pinch.current = {
              d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
              z: tgt.current.z,
            };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinch.current) {
            e.preventDefault();
            const a = e.touches[0]!;
            const b = e.touches[1]!;
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const midX = (a.clientX + b.clientX) / 2;
            const midY = (a.clientY + b.clientY) / 2;
            zoomAt(midX, midY, pinch.current.z * (dist / pinch.current.d));
          }
        }}
        onTouchEnd={() => {
          if (!wrapRef.current) return;
          pinch.current = null;
        }}
      >
        <div data-map className="absolute inset-0 origin-top-left will-change-transform">
          <img
            src="/map/overworld.jpg"
            alt=""
            draggable={false}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,color-mix(in_oklab,var(--color-ink)_38%,transparent)_100%)]" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label="Hollow Realm map">
            {WORLD.map((w) => (
              <ellipse
                key={`${w.id}-blob`}
                cx={w.x}
                cy={w.y}
                rx={w.id === "hq" ? 7 : 9}
                ry={w.id === "hq" ? 7 : 8}
                fill={REGION_FILL[w.id]}
                opacity={s.locations[w.id].unlocked ? 0.38 : 0.1}
              />
            ))}
            {WORLD.filter((w) => w.id !== "hq").map((a) =>
              a.connectedTo
                .filter((id) => id !== "hq")
                .map((b) => {
                  const o = WORLD.find((w) => w.id === b);
                  if (!o) return null;
                  return (
                    <line
                      key={a.id + b}
                      x1={a.x}
                      y1={a.y}
                      x2={o.x}
                      y2={o.y}
                      stroke="var(--color-ember)"
                      strokeOpacity="0.28"
                      strokeWidth="0.35"
                      strokeDasharray="1.1 0.9"
                    />
                  );
                }),
            )}
            {WORLD.map((w) => {
              const unlocked = s.locations[w.id].unlocked;
              const active = loc === w.id;
              const intel = s.locations[w.id].intel;
              return (
                <g key={w.id} className={unlocked ? "cursor-pointer" : "opacity-35"}>
                  {active ? (
                    <circle
                      cx={w.x}
                      cy={w.y}
                      r="7.2"
                      fill="none"
                      stroke="var(--color-ember)"
                      strokeWidth="0.55"
                      className="ms-map-ring"
                    />
                  ) : null}
                  {intel > 0 && w.id !== "hq" ? (
                    <circle
                      cx={w.x}
                      cy={w.y}
                      r={4.4 + Math.min(3.5, intel)}
                      fill="none"
                      stroke="var(--color-ember)"
                      strokeOpacity="0.32"
                      strokeWidth="0.35"
                    />
                  ) : null}
                  <circle
                    cx={w.x}
                    cy={w.y}
                    r={active ? 3.6 : 2.8}
                    fill={w.id === "hq" ? "var(--color-ember)" : active ? "var(--color-paper)" : "var(--color-ok)"}
                    stroke="var(--color-ink)"
                    strokeWidth="0.45"
                  />
                  <text
                    x={w.x}
                    y={w.y - 5.2}
                    textAnchor="middle"
                    fill="var(--color-paper)"
                    fontSize="3.4"
                    fontFamily="Syne, sans-serif"
                    style={{ paintOrder: "stroke", stroke: "rgba(11,15,12,0.85)", strokeWidth: 0.6 }}
                  >
                    {w.short}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="pointer-events-none absolute inset-0 crt-scan opacity-40" />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 font-display text-[10px] uppercase tracking-[0.18em] text-ember">
        {locById(loc).short} · drag · pinch
      </div>
      <div className="absolute right-3 top-3 flex flex-col gap-1">
        {[
          { icon: Plus, label: "Zoom in", fn: () => (tgt.current = clampCam({ ...tgt.current, z: tgt.current.z * 1.22 })) },
          { icon: Minus, label: "Zoom out", fn: () => (tgt.current = clampCam({ ...tgt.current, z: tgt.current.z / 1.22 })) },
          {
            icon: RotateCcw,
            label: "Reset map",
            fn: () => {
              const L = locById(loc);
              tgt.current = clampCam({ x: L.x, y: L.y, z: 1.15 });
            },
          },
        ].map((b) => {
          const Icon = b.icon;
          return (
            <button
              key={b.label}
              type="button"
              aria-label={b.label}
              onClick={() => {
                sfx.click();
                b.fn();
              }}
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] bg-ink/80 text-paper shadow-[var(--shadow-border)] backdrop-blur-sm hover:text-ember"
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
