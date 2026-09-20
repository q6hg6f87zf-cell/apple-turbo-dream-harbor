/**
 * Proves the baked planet and the procedural planet are the same planet.
 *
 * The globe's geography — the five region fields and the archipelago mask —
 * is now drawn once into a pair of equirect maps instead of six octaves of
 * noise per region per pixel per frame. This renders the same camera poses
 * both ways in one context and compares the pixels, so the optimisation can
 * never quietly become a redesign.
 *
 * Note it runs on whatever GL the sandbox has (usually SwiftShader). Software
 * rendering gives correct pixels but meaningless frame times, so this gate
 * speaks to fidelity only — never to speed.
 *
 * HOLLOW_QA_CHROMIUM overrides the browser binary.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

const executablePath = process.env.HOLLOW_QA_CHROMIUM || undefined;
mkdirSync("screenshots", { recursive: true });

const source = readFileSync("src/components/game/globe-webgl.tsx", "utf8");

function literal(name) {
  const start = source.indexOf(`const ${name} = \``);
  if (start < 0) throw new Error(`${name} not found`);
  const from = source.indexOf("`", start) + 1;
  const to = source.indexOf("`;", from);
  if (to < 0) throw new Error(`${name} unterminated`);
  return source.slice(from, to);
}

const noise = literal("TERRAIN_NOISE_GLSL");
const expand = (glsl) => glsl.replace("${TERRAIN_NOISE_GLSL}", noise);
const shaders = {
  vertex: expand(literal("VERTEX_SHADER")),
  fragment: expand(literal("FRAGMENT_SHADER")),
  bake: expand(literal("BAKE_FRAGMENT_SHADER")),
};
if (shaders.fragment.includes("${")) throw new Error("fragment shader still has an unresolved interpolation");
if (shaders.bake.includes("${")) throw new Error("bake shader still has an unresolved interpolation");

// Region markers and palette, in CANONICAL_REGION_IDS order.
const data = readFileSync("src/game/data.ts", "utf8");
const markers = [...data.matchAll(/marker: \{ lat: (-?[\d.]+), lon: (-?[\d.]+)/g)].map((m) => ({
  lat: Number(m[1]),
  lon: Number(m[2]),
}));
if (markers.length !== 5) throw new Error(`expected 5 region markers, found ${markers.length}`);
const colorBlock = source.slice(source.indexOf("const REGION_COLORS"));
const colors = [...colorBlock.slice(0, colorBlock.indexOf("};")).matchAll(/\[([\d.,\s]+)\]/g)].map((m) =>
  m[1].split(",").map((n) => Number(n.trim())),
);
if (colors.length !== 5) throw new Error(`expected 5 region colors, found ${colors.length}`);

const DEG = Math.PI / 180;
const regionDir = markers.flatMap(({ lat, lon }) => {
  const a = lat * DEG;
  const b = lon * DEG;
  return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)];
});

const POSES = [
  { name: "home", yaw: -118 * DEG, pitch: -34 * DEG, zoom: 1.05, time: 8 },
  { name: "close", yaw: 116 * DEG, pitch: -7 * DEG, zoom: 2.0, time: 23 },
  { name: "wide", yaw: 0.6, pitch: 0.2, zoom: 0.42, time: 41 },
];

const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 520, height: 520 } });
page.on("console", (m) => {
  if (m.type() === "error") console.error("  page:", m.text());
});
await page.setContent("<!doctype html><html><body style='margin:0;background:#000'></body></html>");

const report = await page.evaluate(
  ({ shaders, regionDir, colors, poses, bake }) => {
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 480;
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!gl) return { error: "no webgl2" };

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const link = (vs, fs) => {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    };

    let main;
    let baker;
    try {
      main = link(shaders.vertex, shaders.fragment);
      baker = link(shaders.vertex, shaders.bake);
    } catch (e) {
      return { error: String(e && e.message ? e.message : e) };
    }

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const bindQuad = (program) => {
      const loc = gl.getAttribLocation(program, "a_position");
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    // --- bake the geography, exactly as the component does
    const target = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, bake.width, bake.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const texA = target();
    const texB = target();
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texA, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, texB, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    if (!fbStatus) return { error: "bake framebuffer incomplete" };
    gl.useProgram(baker);
    bindQuad(baker);
    gl.uniform3fv(gl.getUniformLocation(baker, "u_regionDir[0]"), new Float32Array(regionDir));
    gl.viewport(0, 0, bake.width, bake.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // --- flat stand-ins for the painted region maps, so both passes agree
    const flat = colors.map((c) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([Math.round(c[0] * 255), Math.round(c[1] * 255), Math.round(c[2] * 255), 255]),
      );
      return t;
    });

    gl.useProgram(main);
    bindQuad(main);
    const u = (n) => gl.getUniformLocation(main, n);
    gl.uniform3fv(u("u_regionDir[0]"), new Float32Array(regionDir));
    gl.uniform3fv(u("u_regionColor[0]"), new Float32Array(colors.flat()));
    flat.forEach((t, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.uniform1i(u(`u_tex${i}`), i);
    });
    gl.uniform1f(u("u_texReady"), 0);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(u("u_bakeA"), 5);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.uniform1i(u("u_bakeB"), 6);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const shoot = (pose, ready) => {
      gl.uniform2f(u("u_resolution"), canvas.width, canvas.height);
      gl.uniform1f(u("u_time"), pose.time);
      gl.uniform1f(u("u_yaw"), pose.yaw);
      gl.uniform1f(u("u_pitch"), pose.pitch);
      gl.uniform1f(u("u_zoom"), pose.zoom);
      gl.uniform1f(u("u_bakeReady"), ready);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const px = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return { px, png: canvas.toDataURL("image/png") };
    };

    const out = [];
    for (const pose of poses) {
      const live = shoot(pose, 0);
      const cooked = shoot(pose, 1);
      let total = 0;
      let max = 0;
      let loud = 0;
      const pixels = canvas.width * canvas.height;
      for (let i = 0; i < pixels; i++) {
        const d = Math.max(
          Math.abs(live.px[i * 4] - cooked.px[i * 4]),
          Math.abs(live.px[i * 4 + 1] - cooked.px[i * 4 + 1]),
          Math.abs(live.px[i * 4 + 2] - cooked.px[i * 4 + 2]),
        );
        total += d;
        if (d > max) max = d;
        if (d > 12) loud++;
      }
      out.push({
        name: pose.name,
        mean: total / pixels,
        max,
        loudShare: loud / pixels,
        live: live.png,
        cooked: cooked.png,
      });
    }
    return { poses: out };
  },
  { shaders, regionDir, colors, poses: POSES, bake: { width: 1024, height: 512 } },
);

await browser.close();

if (report.error) {
  console.error(`FAIL globe bake harness — ${report.error}`);
  process.exit(1);
}

let failed = 0;
for (const pose of report.poses) {
  for (const [which, png] of [["live", pose.live], ["baked", pose.cooked]]) {
    writeFileSync(`screenshots/globe-${pose.name}-${which}.png`, Buffer.from(png.split(",")[1], "base64"));
  }
  // The bake stores geography at 8 bits, so coastlines can land a hair either
  // way. A drifting mean or a wide loud share would mean a different planet.
  const ok = pose.mean < 1.2 && pose.loudShare < 0.02;
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${pose.name} — mean ${pose.mean.toFixed(3)}/255, max ${pose.max}, ` +
      `${(pose.loudShare * 100).toFixed(2)}% of pixels moved more than 12`,
  );
}

console.log(`\n${report.poses.length - failed}/${report.poses.length} globe poses matched the procedural planet`);
if (failed) process.exit(1);
