// Renders the water balloon simulation (public/water-balloon/index.html) in headless
// Chromium and saves stills at chosen times and camera angles.
//
//   node scripts/water-balloon-shots.mjs --out screenshots/balloon [--w 1280 --h 720]
//        [--shots '[{"name":"side-1ms","t":1,"view":"side"}, {"t":40,"yaw":2.1,"pitch":0.3,"dist":0.9}]']
//        [--set '{"env":"day","keyI":5}']
//
// Each shot: t in milliseconds, plus either a preset `view` (side, three, front, exit, top, wide)
// or explicit yaw/pitch (radians), dist (m) and optional ty (orbit target height, m).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => { if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]); return acc; }, []));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../public/water-balloon');
const out = path.resolve(args.out || 'screenshots/balloon');
const W = +(args.w || 1280), H = +(args.h || 720);
const DEFAULT = [
  { name: '01-pre-impact-side', t: -0.15, view: 'side' },
  { name: '02-bullet-inside-three', t: 0.25, view: 'three' },
  { name: '03-exit-jet-side', t: 0.9, view: 'side' },
  { name: '04-tear-3ms-three', t: 3, view: 'three' },
  { name: '05-peel-8ms-exit', t: 8, view: 'exit' },
  { name: '06-free-ball-40ms-front', t: 40, view: 'front' },
  { name: '07-falling-200ms-wide', t: 200, view: 'wide' },
  { name: '08-impact-wide', t: 'fall+0.03', view: 'wide' },
  { name: '09-splash-late-top', t: 'end', view: 'top' }
];
const shots = args.shots ? JSON.parse(args.shots) : DEFAULT;
fs.mkdirSync(out, { recursive: true });

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto(url);
if (args.clean !== 'no') await page.evaluate(() => document.body.classList.add('clean'));
await page.evaluate(() => { window.__balloon.hold = true; });
await page.waitForFunction(() => window.__balloon && window.__balloon.info() && window.__balloon.info().tEnd, null, { timeout: 60000 });
if (args.set) {
  const set = JSON.parse(args.set);
  await page.evaluate((s) => { for (const [k, v] of Object.entries(s)) window.__balloon.set(k, v); }, set);
  await page.waitForTimeout(500);
  await page.waitForFunction(() => window.__balloon.info() && window.__balloon.info().tEnd && window.__balloon.info().frames > 1, null, { timeout: 120000 });
}
const info = await page.evaluate(() => window.__balloon.info());
console.log('sim', JSON.stringify(info));

for (const s of shots) {
  let t = s.t;
  if (t === 'end') t = info.tEnd * 1000 - 1;
  else if (typeof t === 'string' && t.startsWith('fall')) t = (info.tFall + parseFloat(t.slice(4) || '0')) * 1000;
  await page.waitForFunction((ms) => window.__balloon.bakedMs() >= ms || window.__balloon.done(), t, { timeout: 600000, polling: 500 });
  await page.evaluate(({ s, t }) => {
    const B = window.__balloon; B.S.playing = false;
    if (s.view) B.setView(s.view);
    if (s.yaw !== undefined) B.cam.yaw = s.yaw; if (s.pitch !== undefined) B.cam.pitch = s.pitch; if (s.dist !== undefined) B.cam.dist = s.dist;
    if (s.ty !== undefined) B.cam.target = [0, s.ty, 0];
    B.setTime(t);
  }, { s, t });
  await page.waitForTimeout(200);
  const file = path.join(out, (s.name || `t${t}`) + '.png');
  await page.screenshot({ path: file, timeout: 180000 });
  console.log('saved', file, `t=${(+t).toFixed(3)}ms`);
}
if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.join('\n'));
await browser.close(); server.close();
