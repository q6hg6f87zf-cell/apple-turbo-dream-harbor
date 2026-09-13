import { cn } from "@/lib/cn";
import type { RollBand } from "@/game/types";
import { BAND_LABEL } from "@/game/engine";
import { useEffect, useRef } from "react";

const PHI = (1 + Math.sqrt(5)) / 2;

function icosa(): { verts: number[][]; faces: number[][] } {
  const raw: number[][] = [
    [-1, PHI, 0],
    [1, PHI, 0],
    [-1, -PHI, 0],
    [1, -PHI, 0],
    [0, -1, PHI],
    [0, 1, PHI],
    [0, -1, -PHI],
    [0, 1, -PHI],
    [PHI, 0, -1],
    [PHI, 0, 1],
    [-PHI, 0, -1],
    [-PHI, 0, 1],
  ];
  const verts = raw.map((v) => {
    const l = Math.hypot(v[0]!, v[1]!, v[2]!);
    return [v[0]! / l, v[1]! / l, v[2]! / l];
  });
  const faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  return { verts, faces };
}

const MESH = icosa();
const NUMS = [20, 1, 12, 6, 8, 15, 17, 3, 9, 18, 4, 10, 7, 5, 13, 16, 2, 14, 11, 19];

const GLOW: Record<RollBand, string> = {
  fumble: "#e24b4b",
  fail: "#e24b4b",
  weak: "#c9b27a",
  success: "#3ee07a",
  strong: "#7dffb0",
  crit: "#7dffb0",
};

function rot(v: number[], ax: number, ay: number, az: number) {
  let [x, y, z] = v;
  let s = Math.sin(ax);
  let c = Math.cos(ax);
  let y2 = y * c - z * s;
  let z2 = y * s + z * c;
  y = y2;
  z = z2;
  s = Math.sin(ay);
  c = Math.cos(ay);
  const x2 = x * c + z * s;
  z2 = -x * s + z * c;
  x = x2;
  z = z2;
  s = Math.sin(az);
  c = Math.cos(az);
  const x3 = x * c - y * s;
  y2 = x * s + y * c;
  return [x3, y2, z];
}

export function Dice20({
  value,
  band,
  spinning,
  size = 92,
  className,
}: {
  value?: number;
  band?: RollBand;
  spinning?: boolean;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    ax: 0.4,
    ay: 0.7,
    az: 0.15,
    vx: 0,
    vy: 0,
    vz: 0,
    t: 0,
    spin: false,
  });

  useEffect(() => {
    const s = st.current;
    s.spin = !!spinning;
    if (spinning) {
      s.vx = 8 + Math.random() * 6;
      s.vy = 10 + Math.random() * 8;
      s.vz = 4 + Math.random() * 4;
    } else {
      s.vx *= 0.2;
      s.vy *= 0.2;
      s.vz *= 0.2;
    }
  }, [spinning, value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    let raf = 0;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = st.current;
      s.t += dt;
      if (!reduced) {
        if (s.spin) {
          s.ax += s.vx * dt;
          s.ay += s.vy * dt;
          s.az += s.vz * dt;
        } else {
          s.vx *= Math.exp(-5 * dt);
          s.vy *= Math.exp(-5 * dt);
          s.vz *= Math.exp(-5 * dt);
          s.ax += s.vx * dt;
          s.ay += s.vy * dt;
          s.az += s.vz * dt;
          if (!spinning) {
            const targetY = ((value ?? 10) * 0.31) % (Math.PI * 2);
            s.ay += (targetY - s.ay) * (1 - Math.exp(-3.2 * dt));
            s.ax += (0.55 - s.ax) * (1 - Math.exp(-2.4 * dt));
          }
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2 + size * 0.04;
      const scale = size * 0.38;
      const light = [0.35, -0.55, 0.76];
      const ln = Math.hypot(light[0], light[1], light[2]);
      const L = light.map((n) => n / ln);

      const pts = MESH.verts.map((v) => rot(v, s.ax, s.ay, s.az));
      const faces = MESH.faces.map((f, i) => {
        const a = pts[f[0]!]!;
        const b = pts[f[1]!]!;
        const c = pts[f[2]!]!;
        const ux = b[0]! - a[0]!;
        const uy = b[1]! - a[1]!;
        const uz = b[2]! - a[2]!;
        const vx = c[0]! - a[0]!;
        const vy = c[1]! - a[1]!;
        const vz = c[2]! - a[2]!;
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl;
        ny /= nl;
        nz /= nl;
        const z = (a[2]! + b[2]! + c[2]!) / 3;
        return { i, a, b, c, nx, ny, nz, z, n: NUMS[i]! };
      });
      faces.sort((p, q) => p.z - q.z);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, size * 0.86, size * 0.28, size * 0.06, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fill();
      ctx.restore();

      const accent = band ? GLOW[band] : "#3ee07a";
      faces.forEach((f) => {
        if (f.nz <= 0.02) return;
        const lit = Math.max(0.12, f.nx * L[0]! + f.ny * L[1]! + f.nz * L[2]!);
        const proj = (p: number[]) => {
          const persp = 1.35 / (1.35 - p[2]! * 0.55);
          return [cx + p[0]! * scale * persp, cy - p[1]! * scale * persp];
        };
        const pa = proj(f.a);
        const pb = proj(f.b);
        const pc = proj(f.c);
        ctx.beginPath();
        ctx.moveTo(pa[0]!, pa[1]!);
        ctx.lineTo(pb[0]!, pb[1]!);
        ctx.lineTo(pc[0]!, pc[1]!);
        ctx.closePath();
        const g = Math.round(18 + lit * 70);
        const e = Math.round(40 + lit * 90);
        ctx.fillStyle = `rgb(${g},${e},${Math.round(g * 1.05)})`;
        if (band === "crit" && !spinning) ctx.fillStyle = `rgb(${Math.round(20 + lit * 30)},${Math.round(90 + lit * 140)},${Math.round(50 + lit * 80)})`;
        if ((band === "fumble" || band === "fail") && !spinning)
          ctx.fillStyle = `rgb(${Math.round(70 + lit * 90)},${Math.round(18 + lit * 20)},${Math.round(18 + lit * 20)})`;
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.35 + lit * 0.4;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
        const mx = (pa[0]! + pb[0]! + pc[0]!) / 3;
        const my = (pa[1]! + pb[1]! + pc[1]!) / 3;
        if (f.nz > 0.35 && size >= 56) {
          ctx.fillStyle = "rgba(231,243,234,0.92)";
          ctx.font = `700 ${Math.max(8, size * 0.11)}px Syne, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(spinning ? f.n : f.n), mx, my);
        }
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, spinning, value, band]);

  const show = spinning ? "?" : (value ?? "—");
  return (
    <div className={cn("relative flex flex-col items-center gap-2", className)}>
      <div
        className="relative"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <canvas ref={canvasRef} className="size-full" style={{ width: size, height: size }} />
        {size >= 80 ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-[38%] text-center font-display tabular-nums leading-none",
            spinning ? "text-paper/80" : "text-paper",
            band === "crit" && "text-ember-bright",
            (band === "fumble" || band === "fail") && "text-danger",
          )}
          style={{ fontSize: size * 0.34, textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}
        >
          {show}
        </div>
        ) : null}
      </div>
      {band && !spinning ? (
        <div className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">{BAND_LABEL[band]}</div>
      ) : null}
    </div>
  );
}
