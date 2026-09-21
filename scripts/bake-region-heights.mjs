#!/usr/bin/env node
/**
 * Derive single-channel heightfields from painted region maps.
 * Roofs/bright structure rise; ash plains sit low. No invented mountains.
 *
 *   node scripts/bake-region-heights.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REGIONS = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"];
const OUT_W = 896;
const OUT_H = 504; // exact half of 1792×1008

async function loadSharp() {
  try {
    const require = createRequire(import.meta.url);
    return require("sharp");
  } catch {
    return null;
  }
}

async function bakeWithSharp(sharp, id) {
  const src = join(ROOT, "public/map/regions", `${id}.jpg`);
  const out = join(ROOT, "public/map/regions", `${id}.height.png`);
  const { data, info } = await sharp(src)
    .resize(OUT_W, OUT_H, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const n = info.width * info.height;
  const lum = new Float32Array(n);
  let min = 1;
  let max = 0;
  for (let i = 0; i < n; i++) {
    const o = i * info.channels;
    const y = (data[o] * 0.28 + data[o + 1] * 0.52 + data[o + 2] * 0.2) / 255;
    lum[i] = y;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  const span = Math.max(0.08, max - min);
  for (let i = 0; i < n; i++) {
    const t = (lum[i] - min) / span;
    // Mild gamma: keep roofs high, streets readable, no cliff spikes.
    lum[i] = Math.pow(Math.min(1, Math.max(0, t)), 0.82);
  }

  // Soft box blur (r=2) so displacement reads as districts.
  const blur = new Float32Array(n);
  const r = 2;
  const w = info.width;
  const h = info.height;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let c = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const yy = Math.min(h - 1, Math.max(0, y + dy));
          sum += lum[yy * w + xx];
          c++;
        }
      }
      blur[y * w + x] = sum / c;
    }
  }

  // Emphasize local peaks (roofs) without inventing terrain.
  const outPix = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    const base = blur[i];
    const detail = Math.max(0, lum[i] - blur[i]);
    const v = Math.min(1, base * 0.88 + detail * 1.35);
    outPix[i] = Math.round(v * 255);
  }

  await sharp(outPix, { raw: { width: w, height: h, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(out);

  return out;
}

async function bakeWithPillow(id) {
  // Fallback via python if sharp is missing.
  const { spawnSync } = await import("node:child_process");
  const py = `
from PIL import Image
import math
id=${JSON.stringify(id)}
src=f"public/map/regions/{id}.jpg"
out=f"public/map/regions/{id}.height.png"
im=Image.open(src).convert("RGB").resize((${OUT_W}, ${OUT_H}), Image.Resampling.LANCZOS)
px=im.load()
w,h=im.size
lum=[[0.0]*w for _ in range(h)]
mn,mx=1.0,0.0
for y in range(h):
  for x in range(w):
    r,g,b=px[x,y]
    v=(r*0.28+g*0.52+b*0.2)/255.0
    lum[y][x]=v
    mn=min(mn,v); mx=max(mx,v)
span=max(0.08, mx-mn)
for y in range(h):
  for x in range(w):
    t=(lum[y][x]-mn)/span
    lum[y][x]=min(1.0,max(0.0,t))**0.82
blur=[[0.0]*w for _ in range(h)]
R=2
for y in range(h):
  for x in range(w):
    s=c=0
    for dy in range(-R,R+1):
      for dx in range(-R,R+1):
        xx=min(w-1,max(0,x+dx)); yy=min(h-1,max(0,y+dy))
        s+=lum[yy][xx]; c+=1
    blur[y][x]=s/c
out_im=Image.new("L",(w,h))
op=out_im.load()
for y in range(h):
  for x in range(w):
    base=blur[y][x]
    detail=max(0.0, lum[y][x]-blur[y][x])
    v=min(1.0, base*0.88 + detail*1.35)
    op[x,y]=int(round(v*255))
out_im.save(out, optimize=True)
print(out)
`;
    const res = spawnSync("python3", ["-c", py], { cwd: ROOT, encoding: "utf8" });
    if (res.status !== 0) throw new Error(res.stderr || res.stdout || "pillow bake failed");
    return res.stdout.trim();
}

mkdirSync(join(ROOT, "public/map/regions"), { recursive: true });
const sharp = await loadSharp();
for (const id of REGIONS) {
  const path = sharp ? await bakeWithSharp(sharp, id) : await bakeWithPillow(id);
  console.log("wrote", path.replace(ROOT + "/", ""));
}
