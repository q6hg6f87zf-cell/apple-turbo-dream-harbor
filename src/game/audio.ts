import { addTrauma } from "./juice";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let ambientNodes: { osc: OscillatorNode; osc2: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;
let motor: { osc: OscillatorNode; filt: BiquadFilterNode; gain: GainNode } | null = null;
let muted = false;
let sfxLevel = 0.85;
let musicLevel = 0.58;

const MUTE_KEY = "moon-squad-mute";
const MIX_KEY = "hollow-radio-mix-v1";

const unlockHooks = new Set<() => void>();
const muteHooks = new Set<(next: boolean) => void>();

function loadMute() {
  if (typeof window === "undefined") return;
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    muted = false;
  }
  try {
    const raw = localStorage.getItem(MIX_KEY);
    if (!raw) return;
    const mix = JSON.parse(raw) as { sfx?: number; music?: number };
    if (typeof mix.sfx === "number") sfxLevel = clamp01(mix.sfx);
    if (typeof mix.music === "number") musicLevel = clamp01(mix.music);
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") loadMute();

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function curve(n: number) {
  return n * n;
}

function persistMix() {
  try {
    localStorage.setItem(MIX_KEY, JSON.stringify({ sfx: sfxLevel, music: musicLevel }));
  } catch {
    /* ignore */
  }
}

function applyBusGains(c: AudioContext) {
  if (sfxBus) sfxBus.gain.setTargetAtTime(curve(sfxLevel) * 0.95, c.currentTime, 0.04);
  if (musicBus) musicBus.gain.setTargetAtTime(curve(musicLevel) * 0.72, c.currentTime, 0.05);
}

export function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    applyBusGains(ctx);
    master.gain.value = muted ? 0 : 0.9;
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function getMusicBus() {
  ac();
  return musicBus;
}

export function addUnlockHook(fn: () => void) {
  unlockHooks.add(fn);
  return () => unlockHooks.delete(fn);
}

export function addMuteHook(fn: (next: boolean) => void) {
  muteHooks.add(fn);
  return () => muteHooks.delete(fn);
}

export function unlockAudio() {
  ac();
  warmSfxSamples();
  unlockHooks.forEach((fn) => fn());
  if (!muted) startAmbient();
}

export function isMuted() {
  return muted;
}

export function sfxMix() {
  return sfxLevel;
}

export function musicMix() {
  return musicLevel;
}

export function setSfxMix(value: number) {
  sfxLevel = clamp01(value);
  persistMix();
  const c = ac();
  if (c) applyBusGains(c);
}

export function setMusicMix(value: number) {
  musicLevel = clamp01(value);
  persistMix();
  const c = ac();
  if (c) applyBusGains(c);
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
  const c = ac();
  if (master && c) {
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setTargetAtTime(muted ? 0 : 0.9, c.currentTime, 0.04);
  }
  if (muted) stopAmbient();
  else startAmbient();
  muteHooks.forEach((fn) => fn(muted));
  return muted;
}

function jitter(n: number, amt = 0.08) {
  return n * (1 + (Math.random() * 2 - 1) * amt);
}

function tone(opts: {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  detune?: number;
  bus?: "sfx" | "music";
  freqEnd?: number;
}) {
  const c = ac();
  if (!c || !sfxBus || !musicBus || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type ?? "triangle";
  o.frequency.setValueAtTime(opts.freq, c.currentTime);
  if (opts.freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), c.currentTime + opts.dur);
  if (opts.detune) o.detune.value = opts.detune;
  const atk = opts.attack ?? 0.008;
  const vol = opts.gain ?? 0.05;
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + opts.dur);
  o.connect(g);
  g.connect(opts.bus === "music" ? musicBus : sfxBus);
  o.start();
  o.stop(c.currentTime + opts.dur + 0.02);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}

function noise(dur: number, gain = 0.03, freq = 1200) {
  const c = ac();
  if (!c || !sfxBus || muted) return;
  const n = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = n;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(f);
  f.connect(g);
  g.connect(sfxBus);
  src.start();
  src.stop(c.currentTime + dur);
}

export function startAmbient() {
  const c = ac();
  if (!c || !musicBus || muted || ambientNodes) return;
  const gain = c.createGain();
  gain.gain.value = 0.0001;
  gain.gain.setTargetAtTime(0.018, c.currentTime, 1.2);
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  o1.type = "sine";
  o2.type = "sine";
  o1.frequency.value = 55;
  o2.frequency.value = 82.4;
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfo.frequency.value = 0.07;
  lfoG.gain.value = 6;
  lfo.connect(lfoG);
  lfoG.connect(o1.frequency);
  o1.connect(gain);
  o2.connect(gain);
  gain.connect(musicBus);
  o1.start();
  o2.start();
  lfo.start();
  ambientNodes = { osc: o1, osc2: o2, lfo, gain };
}

export function stopAmbient() {
  const c = ac();
  if (!ambientNodes || !c) return;
  const n = ambientNodes;
  n.gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.25);
  window.setTimeout(() => {
    try {
      n.osc.stop();
      n.osc2.stop();
      n.lfo.stop();
      n.osc.disconnect();
      n.osc2.disconnect();
      n.lfo.disconnect();
      n.gain.disconnect();
    } catch {
      /* already stopped */
    }
  }, 600);
  ambientNodes = null;
}

export function duckAmbient(duck: boolean) {
  if (duck) stopAmbient();
  else if (!muted) startAmbient();
}

export function pulseDuck(strength = 0.55, holdMs = 900) {
  const c = ac();
  if (!c || !musicBus || muted) return;
  const base = curve(musicLevel) * 0.72;
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.setTargetAtTime(base * Math.max(0.12, 1 - strength), c.currentTime, 0.07);
  window.setTimeout(() => {
    if (!musicBus || !ctx) return;
    musicBus.gain.setTargetAtTime(muted ? 0 : curve(musicLevel) * 0.72, ctx.currentTime, 0.22);
  }, holdMs);
}

export function startReelMotor() {
  stopReelMotor();
  const c = ac();
  if (!c || !sfxBus || muted) return;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 38;
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 420;
  const gain = c.createGain();
  gain.gain.value = 0.0001;
  gain.gain.setTargetAtTime(0.028, c.currentTime, 0.08);
  osc.connect(filt);
  filt.connect(gain);
  gain.connect(sfxBus);
  osc.start();
  motor = { osc, filt, gain };
}

export function setReelMotor(t: number) {
  const c = ac();
  if (!c || !motor) return;
  const k = Math.max(0, Math.min(1, t));
  motor.osc.frequency.setTargetAtTime(26 + k * 70, c.currentTime, 0.05);
  motor.filt.frequency.setTargetAtTime(280 + k * 900, c.currentTime, 0.05);
  motor.gain.gain.setTargetAtTime(0.012 + k * 0.026, c.currentTime, 0.05);
}

export function stopReelMotor() {
  const c = ac();
  const n = motor;
  motor = null;
  if (!c || !n) return;
  try {
    n.gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.04);
    n.osc.stop(c.currentTime + 0.12);
  } catch {
    /* already stopped */
  }
  window.setTimeout(() => {
    try {
      n.osc.disconnect();
      n.filt.disconnect();
      n.gain.disconnect();
    } catch {
      /* ignore */
    }
  }, 180);
}

let heartBed: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

export function startHeartBed(rate = 1.15) {
  stopHeartBed();
  const c = ac();
  if (!c || !sfxBus || muted) return;
  const gain = c.createGain();
  gain.gain.value = 0.0001;
  gain.gain.setTargetAtTime(0.034, c.currentTime, 0.12);
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  o1.type = "sine";
  o2.type = "sine";
  o1.frequency.value = 46 * rate;
  o2.frequency.value = 38 * rate;
  o1.connect(gain);
  o2.connect(gain);
  gain.connect(sfxBus);
  o1.start();
  o2.start();
  heartBed = { osc: o1, osc2: o2, gain };
}

export function setHeartBed(t: number) {
  const c = ac();
  if (!c || !heartBed) return;
  const k = Math.max(0, Math.min(1, t));
  heartBed.osc.frequency.setTargetAtTime(42 + k * 28, c.currentTime, 0.08);
  heartBed.gain.gain.setTargetAtTime(0.018 + k * 0.04, c.currentTime, 0.08);
}

export function stopHeartBed() {
  const c = ac();
  const n = heartBed;
  heartBed = null;
  if (!c || !n) return;
  try {
    n.gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.08);
    n.osc.stop(c.currentTime + 0.16);
    n.osc2.stop(c.currentTime + 0.16);
  } catch {
    /* already stopped */
  }
}

function rumble(ms = 16) {
  if (typeof navigator === "undefined" || muted) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no haptic */
  }
}

/** Kenney CC0 samples under /sfx — procedural synth remains the fallback. */
const SAMPLE_URLS: Record<string, string> = {
  click: "/sfx/ui-click.wav",
  coin: "/sfx/coins.ogg",
  hit: "/sfx/impact-chop.ogg",
  hurt: "/sfx/blade.ogg",
  unlock: "/sfx/metal-latch.ogg",
  machine: "/sfx/ui-metal.wav",
  dice: "/sfx/gear-belt.ogg",
  forge: "/sfx/metal-click.ogg",
  deploy: "/sfx/door-open.ogg",
  whoosh: "/sfx/door-creak.ogg",
  win: "/sfx/ui-confirm.wav",
  deny: "/sfx/ui-toggle.wav",
  swipe: "/sfx/ui-switch.wav",
  dawn: "/sfx/book-open.ogg",
  lockIn: "/sfx/metal-latch.ogg",
  chip: "/sfx/metal-click.ogg",
  lever: "/sfx/ui-metal.wav",
  manual: "/sfx/book-open.ogg",
  porch: "/sfx/door-creak.ogg",
  recorder: "/audio/recorder-click.mp3",
  step: "/sfx/step.ogg",
  bookClose: "/sfx/book-close.ogg",
  bookFlip: "/sfx/book-flip.ogg",
  doorClose: "/sfx/door-close.ogg",
  draw: "/sfx/draw.ogg",
  impactMetal: "/sfx/impact-metal.ogg",
  uiHover: "/sfx/ui-hover.wav",
  uiTap: "/sfx/ui-tap.wav",
};

const sampleCache = new Map<string, AudioBuffer | null>();
let samplesWarm = false;

async function decodeSample(url: string): Promise<AudioBuffer | null> {
  if (sampleCache.has(url)) return sampleCache.get(url) ?? null;
  const c = ac();
  if (!c) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      sampleCache.set(url, null);
      return null;
    }
    const raw = await res.arrayBuffer();
    const buf = await c.decodeAudioData(raw.slice(0));
    sampleCache.set(url, buf);
    return buf;
  } catch {
    sampleCache.set(url, null);
    return null;
  }
}

export function warmSfxSamples() {
  if (samplesWarm || typeof window === "undefined") return;
  samplesWarm = true;
  const urls = [...new Set(Object.values(SAMPLE_URLS).filter(Boolean))];
  void Promise.all(urls.map((u) => decodeSample(u)));
}

function playSample(url: string, gain = 0.42): boolean {
  const c = ac();
  if (!c || !sfxBus || muted) return false;
  const buf = sampleCache.get(url);
  if (!buf) {
    void decodeSample(url);
    return false;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(sfxBus);
  src.start();
  src.onended = () => {
    try {
      src.disconnect();
      g.disconnect();
    } catch {
      /* noop */
    }
  };
  return true;
}

function withSample(key: string, procedural: () => void, gain = 0.42, alsoProcedural = false) {
  const url = SAMPLE_URLS[key];
  if (url && playSample(url, gain)) {
    if (alsoProcedural) procedural();
    return;
  }
  procedural();
}

const sfxProcedural = {
  click: () => {
    tone({ freq: jitter(88, 0.08), dur: 0.05, type: "sine", gain: 0.048, freqEnd: 52 });
    tone({ freq: jitter(620, 0.06), dur: 0.045, type: "triangle", gain: 0.032 });
    tone({ freq: jitter(1560, 0.05), dur: 0.026, type: "sine", gain: 0.016, detune: 10 });
    rumble(8);
  },
  machine: () => {
    tone({ freq: 64, dur: 0.32, type: "sine", gain: 0.05, freqEnd: 38 });
    noise(0.1, 0.022, 160);
    rumble(18);
  },
  dice: () => {
    noise(0.05, 0.04, 1800);
    tone({ freq: jitter(170), dur: 0.07, type: "sawtooth", gain: 0.04 });
    window.setTimeout(() => tone({ freq: jitter(240), dur: 0.07, type: "sawtooth", gain: 0.04 }), 70);
    window.setTimeout(() => tone({ freq: jitter(340), dur: 0.1, type: "triangle", gain: 0.05 }), 150);
    addTrauma(0.22);
    rumble(14);
  },
  coin: () => {
    tone({ freq: jitter(880, 0.03), dur: 0.08, type: "square", gain: 0.03 });
    window.setTimeout(() => tone({ freq: jitter(1320, 0.03), dur: 0.1, type: "square", gain: 0.025 }), 50);
  },
  hit: () => {
    noise(0.08, 0.05, 400);
    tone({ freq: jitter(110, 0.1), dur: 0.14, type: "sawtooth", gain: 0.07, freqEnd: 70 });
    addTrauma(0.38);
    rumble(18);
  },
  hurt: () => {
    tone({ freq: jitter(90, 0.08), dur: 0.2, type: "square", gain: 0.06, freqEnd: 55 });
    noise(0.1, 0.03, 220);
    addTrauma(0.42);
    rumble(20);
  },
  miss: () => {
    tone({ freq: jitter(420), dur: 0.09, type: "sine", gain: 0.03, freqEnd: 180 });
  },
  crit: () => {
    noise(0.06, 0.04, 2400);
    tone({ freq: 523, dur: 0.12, type: "triangle", gain: 0.05 });
    window.setTimeout(() => tone({ freq: 784, dur: 0.14, type: "triangle", gain: 0.045 }), 70);
    window.setTimeout(() => tone({ freq: 1046, dur: 0.18, type: "sine", gain: 0.04 }), 140);
    addTrauma(0.72);
    rumble(28);
  },
  win: () => {
    tone({ freq: 392, dur: 0.12, type: "triangle", gain: 0.04 });
    window.setTimeout(() => tone({ freq: 523, dur: 0.14, type: "triangle", gain: 0.04 }), 90);
    window.setTimeout(() => tone({ freq: 659, dur: 0.2, type: "sine", gain: 0.045 }), 180);
  },
  jackpot: () => {
    noise(0.12, 0.05, 900);
    tone({ freq: 196, dur: 0.22, type: "sawtooth", gain: 0.06, freqEnd: 98 });
    window.setTimeout(() => tone({ freq: 523, dur: 0.16, type: "triangle", gain: 0.05 }), 80);
    window.setTimeout(() => tone({ freq: 659, dur: 0.18, type: "triangle", gain: 0.05 }), 160);
    window.setTimeout(() => tone({ freq: 784, dur: 0.28, type: "sine", gain: 0.055 }), 260);
    window.setTimeout(() => tone({ freq: 1046, dur: 0.32, type: "sine", gain: 0.04 }), 380);
    addTrauma(0.85);
    rumble(40);
  },
  dry: () => {
    noise(0.09, 0.025, 280);
    tone({ freq: jitter(70, 0.04), dur: 0.18, type: "sine", gain: 0.04, freqEnd: 42 });
    rumble(10);
  },
  lever: () => {
    noise(0.06, 0.04, 500);
    tone({ freq: jitter(90, 0.06), dur: 0.14, type: "sawtooth", gain: 0.055, freqEnd: 48 });
    window.setTimeout(() => tone({ freq: jitter(220, 0.05), dur: 0.07, type: "triangle", gain: 0.03 }), 90);
    rumble(16);
    addTrauma(0.2);
  },
  reelTick: () => {
    tone({ freq: jitter(1900, 0.12), dur: 0.018, type: "square", gain: 0.012 });
    tone({ freq: jitter(140, 0.1), dur: 0.03, type: "sine", gain: 0.018, freqEnd: 90 });
  },
  reelStop: () => {
    noise(0.04, 0.035, 700);
    tone({ freq: jitter(110, 0.06), dur: 0.09, type: "square", gain: 0.05, freqEnd: 55 });
    rumble(11);
  },
  heart: () => {
    tone({ freq: 52, dur: 0.11, type: "sine", gain: 0.06, freqEnd: 40 });
    window.setTimeout(() => tone({ freq: 46, dur: 0.14, type: "sine", gain: 0.045, freqEnd: 36 }), 160);
    rumble(8);
  },
  hold: () => {
    tone({ freq: 120, dur: 0.7, type: "sine", gain: 0.03, attack: 0.05, freqEnd: 280 });
  },
  clockTick: () => {
    tone({ freq: jitter(880, 0.04), dur: 0.04, type: "square", gain: 0.022 });
    tone({ freq: jitter(220, 0.05), dur: 0.05, type: "sine", gain: 0.02 });
  },
  clockWarn: () => {
    tone({ freq: 740, dur: 0.08, type: "square", gain: 0.035 });
    window.setTimeout(() => tone({ freq: 620, dur: 0.1, type: "square", gain: 0.03 }), 90);
    rumble(9);
  },
  lockTick: () => {
    tone({ freq: jitter(1480, 0.08), dur: 0.025, type: "triangle", gain: 0.02 });
  },
  pinSet: () => {
    tone({ freq: 392, dur: 0.07, type: "square", gain: 0.03 });
    window.setTimeout(() => tone({ freq: 523, dur: 0.1, type: "triangle", gain: 0.035 }), 50);
    rumble(10);
  },
  chip: () => {
    tone({ freq: jitter(1240, 0.05), dur: 0.04, type: "square", gain: 0.018 });
    tone({ freq: jitter(180, 0.06), dur: 0.07, type: "sine", gain: 0.028, freqEnd: 90 });
    rumble(6);
  },
  plateDrain: () => {
    tone({ freq: jitter(220, 0.04), dur: 0.16, type: "sine", gain: 0.04, freqEnd: 70 });
    noise(0.08, 0.02, 420);
  },
  nearMiss: () => {
    tone({ freq: 196, dur: 0.22, type: "sine", gain: 0.045, freqEnd: 330 });
    window.setTimeout(() => {
      noise(0.07, 0.03, 260);
      tone({ freq: 90, dur: 0.18, type: "sawtooth", gain: 0.04, freqEnd: 48 });
    }, 240);
    rumble(18);
  },
  bankPop: () => {
    tone({ freq: jitter(660, 0.04), dur: 0.06, type: "triangle", gain: 0.03 });
    window.setTimeout(() => tone({ freq: jitter(880, 0.03), dur: 0.08, type: "sine", gain: 0.028 }), 40);
    rumble(8);
  },
  lockIn: () => {
    noise(0.04, 0.03, 1100);
    tone({ freq: 523, dur: 0.08, type: "square", gain: 0.03 });
    window.setTimeout(() => tone({ freq: 784, dur: 0.12, type: "triangle", gain: 0.028 }), 50);
    rumble(12);
  },
  countTick: () => {
    tone({ freq: jitter(1480, 0.08), dur: 0.018, type: "square", gain: 0.01 });
  },
  dawn: () => {
    tone({ freq: 196, dur: 0.45, type: "sine", gain: 0.035, attack: 0.08, freqEnd: 330, bus: "music" });
    window.setTimeout(() => tone({ freq: 247, dur: 0.5, type: "sine", gain: 0.025, attack: 0.1, bus: "music" }), 120);
  },
  deploy: () => {
    tone({ freq: jitter(80, 0.05), dur: 0.16, type: "sine", gain: 0.06, freqEnd: 50 });
    window.setTimeout(() => sfx.click(), 40);
    addTrauma(0.55);
    rumble(22);
  },
  forge: () => {
    noise(0.07, 0.045, 900);
    tone({ freq: jitter(210), dur: 0.12, type: "square", gain: 0.04 });
    window.setTimeout(() => tone({ freq: jitter(140), dur: 0.1, type: "triangle", gain: 0.035 }), 80);
  },
  whoosh: () => {
    noise(0.14, 0.04, 700);
    tone({ freq: 480, dur: 0.16, type: "sine", gain: 0.03, freqEnd: 140 });
    addTrauma(0.18);
  },
  hack: () => {
    tone({ freq: jitter(880, 0.04), dur: 0.05, type: "square", gain: 0.03 });
    window.setTimeout(() => tone({ freq: jitter(1240, 0.04), dur: 0.04, type: "square", gain: 0.02 }), 40);
  },
  termKey: () => {
    noise(0.018, 0.022, jitter(2400, 0.18));
    tone({ freq: jitter(1680, 0.12), dur: 0.028, type: "square", gain: 0.018 });
    tone({ freq: jitter(420, 0.1), dur: 0.04, type: "triangle", gain: 0.012, freqEnd: 180 });
  },
  termType: (n = 4) => {
    const count = Math.max(1, Math.min(18, Math.floor(n)));
    for (let i = 0; i < count; i++) {
      window.setTimeout(() => sfx.termKey(), i * (16 + Math.floor(Math.random() * 18)));
    }
  },
  deny: () => {
    tone({ freq: jitter(140, 0.06), dur: 0.16, type: "square", gain: 0.05, freqEnd: 70 });
    noise(0.06, 0.03, 300);
  },
  unlock: () => {
    tone({ freq: 392, dur: 0.08, type: "square", gain: 0.03 });
    window.setTimeout(() => tone({ freq: 523, dur: 0.1, type: "square", gain: 0.03 }), 70);
    window.setTimeout(() => tone({ freq: 784, dur: 0.16, type: "square", gain: 0.035 }), 150);
  },
  swipe: () => {
    noise(0.12, 0.035, 900);
    tone({ freq: 220, dur: 0.12, type: "sine", gain: 0.04, freqEnd: 90 });
    window.setTimeout(() => {
      tone({ freq: 1480, dur: 0.06, type: "square", gain: 0.02 });
      rumble(12);
    }, 80);
  },
  reel: () => {
    noise(0.035, 0.03, 1400);
    tone({ freq: jitter(190, 0.08), dur: 0.05, type: "triangle", gain: 0.035, freqEnd: 90 });
    rumble(7);
  },
  /** Soft open for Tyrone's field manual / journal. */
  manual: () => {
    rumble(6);
  },
  /** Porch lamp / boot settle. */
  porch: () => {
    rumble(10);
  },
  recorder: () => {
    noise(0.05, 0.045, 1800);
    tone({ freq: 210, dur: 0.07, type: "square", gain: 0.04, freqEnd: 70 });
    rumble(10);
  },
};

export const sfx = {
  click: () => withSample("click", sfxProcedural.click, 0.38),
  machine: () => withSample("machine", sfxProcedural.machine, 0.32),
  dice: () => withSample("dice", sfxProcedural.dice, 0.45),
  coin: () => withSample("coin", sfxProcedural.coin, 0.4),
  hit: () => withSample("hit", sfxProcedural.hit, 0.48),
  hurt: () => withSample("hurt", sfxProcedural.hurt, 0.4),
  miss: () => sfxProcedural.miss(),
  crit: () => {
    withSample("hit", sfxProcedural.crit, 0.35, true);
  },
  win: () => withSample("win", sfxProcedural.win, 0.36),
  jackpot: () => sfxProcedural.jackpot(),
  dry: () => sfxProcedural.dry(),
  lever: () => withSample("lever", sfxProcedural.lever, 0.34),
  reelTick: () => sfxProcedural.reelTick(),
  reelStop: () => sfxProcedural.reelStop(),
  heart: () => sfxProcedural.heart(),
  hold: () => sfxProcedural.hold(),
  clockTick: () => sfxProcedural.clockTick(),
  clockWarn: () => sfxProcedural.clockWarn(),
  lockTick: () => sfxProcedural.lockTick(),
  pinSet: () => sfxProcedural.pinSet(),
  chip: () => withSample("chip", sfxProcedural.chip, 0.35),
  plateDrain: () => sfxProcedural.plateDrain(),
  nearMiss: () => sfxProcedural.nearMiss(),
  bankPop: () => sfxProcedural.bankPop(),
  lockIn: () => withSample("lockIn", sfxProcedural.lockIn, 0.4),
  countTick: () => sfxProcedural.countTick(),
  dawn: () => withSample("dawn", sfxProcedural.dawn, 0.35),
  deploy: () => withSample("deploy", sfxProcedural.deploy, 0.4),
  forge: () => withSample("forge", sfxProcedural.forge, 0.42),
  whoosh: () => withSample("whoosh", sfxProcedural.whoosh, 0.38),
  hack: () => sfxProcedural.hack(),
  termKey: () => sfxProcedural.termKey(),
  termType: (n = 4) => sfxProcedural.termType(n),
  deny: () => withSample("deny", sfxProcedural.deny, 0.34),
  unlock: () => withSample("unlock", sfxProcedural.unlock, 0.4),
  swipe: () => withSample("swipe", sfxProcedural.swipe, 0.32),
  reel: () => sfxProcedural.reel(),
  manual: () => withSample("manual", sfxProcedural.manual, 0.36),
  porch: () => withSample("porch", sfxProcedural.porch, 0.3),
  recorder: () => withSample("recorder", sfxProcedural.recorder, 0.72),
  step: () =>
    withSample("step", () => {
      noise(0.04, 0.02, 400);
    }, 0.28),
  bookFlip: () => withSample("bookFlip", () => noise(0.03, 0.018, 900), 0.3),
  draw: () => withSample("draw", () => tone({ freq: 220, dur: 0.08, type: "triangle", gain: 0.03 }), 0.34),
};

export { rumble };
