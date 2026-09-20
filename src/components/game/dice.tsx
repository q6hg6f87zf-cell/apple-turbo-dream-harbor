import { cn } from "@/lib/cn";
import type { RollBand } from "@/game/types";
import { BAND_LABEL } from "@/game/engine";
import { useEffect, useRef } from "react";

const PHI = (1 + Math.sqrt(5)) / 2;

function icosa(): { verts: number[][]; faces: number[][]; normals: number[][] } {
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
  const normals = faces.map((f) => {
    const a = verts[f[0]!]!;
    const b = verts[f[1]!]!;
    const c = verts[f[2]!]!;
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
    return [nx / nl, ny / nl, nz / nl];
  });
  return { verts, faces, normals };
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

function lerpAngle(from: number, to: number, k: number) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return from + d * k;
}

function eulerForFace(index: number) {
  const n = MESH.normals[index] ?? [0, 0, 1];
  // rot() is Rx then Ry then Rz. Map the face normal onto +Z (toward camera)
  // so the rolled number sits on the face you are looking at.
  const ax = Math.atan2(n[1]!, n[2]!);
  const n1z = Math.hypot(n[1]!, n[2]!);
  const ay = Math.atan2(-(n[0]!), n1z || 1);
  return { ax: ax + 0.22, ay: ay + 0.16, az: 0.08 };
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
      s.vx *= 0.18;
      s.vy *= 0.18;
      s.vz *= 0.18;
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
    const faceIndex = NUMS.findIndex((n) => n === (value ?? 20));
    const target = eulerForFace(faceIndex < 0 ? 0 : faceIndex);

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
          s.vx *= Math.exp(-5.4 * dt);
          s.vy *= Math.exp(-5.4 * dt);
          s.vz *= Math.exp(-5.4 * dt);
          s.ax += s.vx * dt;
          s.ay += s.vy * dt;
          s.az += s.vz * dt;
          const k = 1 - Math.exp(-4.2 * dt);
          s.ax = lerpAngle(s.ax, target.ax, k);
          s.ay = lerpAngle(s.ay, target.ay, k);
          s.az = lerpAngle(s.az, target.az, k);
        }
      } else if (!s.spin) {
        s.ax = target.ax;
        s.ay = target.ay;
        s.az = target.az;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2 + size * 0.02;
      const scale = size * 0.42;
      const light = [0.32, -0.5, 0.8];
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
      const topNz = Math.max(...faces.map((f) => f.nz));

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, size * 0.88, size * 0.3, size * 0.055, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fill();
      ctx.restore();

      const accent = band ? GLOW[band] : "#3ee07a";
      faces.forEach((f) => {
        if (f.nz <= 0.04) return;
        const lit = Math.max(0.14, f.nx * L[0]! + f.ny * L[1]! + f.nz * L[2]!);
        const proj = (p: number[]) => {
          const persp = 1.42 / (1.42 - p[2]! * 0.52);
          return [cx + p[0]! * scale * persp, cy - p[1]! * scale * persp] as const;
        };
        const pa = proj(f.a);
        const pb = proj(f.b);
        const pc = proj(f.c);
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
        ctx.lineTo(pc[0], pc[1]);
        ctx.closePath();
        const g = Math.round(22 + lit * 78);
        const e = Math.round(48 + lit * 96);
        ctx.fillStyle = `rgb(${g},${e},${Math.round(g * 1.04)})`;
        if (band === "crit" && !spinning) ctx.fillStyle = `rgb(${Math.round(18 + lit * 28)},${Math.round(88 + lit * 145)},${Math.round(48 + lit * 82)})`;
        if ((band === "fumble" || band === "fail") && !spinning)
          ctx.fillStyle = `rgb(${Math.round(78 + lit * 90)},${Math.round(20 + lit * 22)},${Math.round(20 + lit * 22)})`;
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.28 + lit * 0.45;
        ctx.lineWidth = f.nz > topNz - 0.04 ? 1.6 : 1;
        ctx.stroke();
        ctx.globalAlpha = 1;

        const mx = (pa[0] + pb[0] + pc[0]) / 3;
        const my = (pa[1] + pb[1] + pc[1]) / 3;
        const area = Math.abs((pa[0] * (pb[1] - pc[1]) + pb[0] * (pc[1] - pa[1]) + pc[0] * (pa[1] - pb[1])) / 2);
        const winner = !spinning && f.n === (value ?? -1);
        const facing = f.nz > 0.18;
        if (!facing && !winner) return;
        const fontPx = Math.max(
          size * 0.12,
          Math.min(size * (winner ? 0.3 : 0.22), Math.sqrt(Math.max(8, area)) * (winner ? 0.7 : 0.5)),
        );
        ctx.save();
        ctx.translate(mx, my);
        if (winner) {
          ctx.beginPath();
          ctx.arc(0, 0, fontPx * 0.72, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(8,12,10,0.45)";
          ctx.fill();
        }
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.lineWidth = Math.max(2.2, fontPx * 0.18);
        ctx.strokeStyle = winner ? "rgba(10,16,12,0.95)" : "rgba(10,16,12,0.8)";
        ctx.font = `800 ${fontPx}px Syne, ui-sans-serif, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = String(f.n);
        ctx.strokeText(label, 0, 1);
        ctx.fillStyle = winner ? "rgba(244,247,240,1)" : `rgba(231,243,234,${0.55 + f.nz * 0.45})`;
        ctx.fillText(label, 0, 1);
        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, spinning, value, band]);

  return (
    <div className={cn("relative flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }} aria-hidden>
        <canvas ref={canvasRef} className="size-full" style={{ width: size, height: size }} />
      </div>
      {band && !spinning ? (
        <div className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">
          {BAND_LABEL[band]}
          {typeof value === "number" ? ` · ${value}` : ""}
        </div>
      ) : null}
    </div>
  );
}
