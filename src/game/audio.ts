let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let ambientNodes: { osc: OscillatorNode; osc2: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;
let muted = false;

const MUTE_KEY = "moon-squad-mute";

function loadMute() {
  if (typeof window === "undefined") return;
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    muted = false;
  }
}

if (typeof window !== "undefined") loadMute();

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.gain.value = 0.85;
    musicBus.gain.value = 0.55;
    master.gain.value = muted ? 0 : 0.9;
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
  if (!muted) startAmbient();
}

export function isMuted() {
  return muted;
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
  gain.gain.setTargetAtTime(0.028, c.currentTime, 1.2);
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

export const sfx = {
  click: () => {
    tone({ freq: jitter(620, 0.06), dur: 0.045, type: "triangle", gain: 0.035 });
    tone({ freq: jitter(1240, 0.04), dur: 0.03, type: "sine", gain: 0.018, detune: 8 });
  },
  dice: () => {
    noise(0.05, 0.04, 1800);
    tone({ freq: jitter(170), dur: 0.07, type: "sawtooth", gain: 0.04 });
    window.setTimeout(() => tone({ freq: jitter(240), dur: 0.07, type: "sawtooth", gain: 0.04 }), 70);
    window.setTimeout(() => tone({ freq: jitter(340), dur: 0.1, type: "triangle", gain: 0.05 }), 150);
  },
  coin: () => {
    tone({ freq: jitter(880, 0.03), dur: 0.08, type: "square", gain: 0.03 });
    window.setTimeout(() => tone({ freq: jitter(1320, 0.03), dur: 0.1, type: "square", gain: 0.025 }), 50);
  },
  hit: () => {
    noise(0.08, 0.05, 400);
    tone({ freq: jitter(110, 0.1), dur: 0.14, type: "sawtooth", gain: 0.07, freqEnd: 70 });
  },
  hurt: () => {
    tone({ freq: jitter(90, 0.08), dur: 0.2, type: "square", gain: 0.06, freqEnd: 55 });
    noise(0.1, 0.03, 220);
  },
  miss: () => {
    tone({ freq: jitter(420), dur: 0.09, type: "sine", gain: 0.03, freqEnd: 180 });
  },
  crit: () => {
    noise(0.06, 0.04, 2400);
    tone({ freq: 523, dur: 0.12, type: "triangle", gain: 0.05 });
    window.setTimeout(() => tone({ freq: 784, dur: 0.14, type: "triangle", gain: 0.045 }), 70);
    window.setTimeout(() => tone({ freq: 1046, dur: 0.18, type: "sine", gain: 0.04 }), 140);
  },
  win: () => {
    tone({ freq: 392, dur: 0.12, type: "triangle", gain: 0.04 });
    window.setTimeout(() => tone({ freq: 523, dur: 0.14, type: "triangle", gain: 0.04 }), 90);
    window.setTimeout(() => tone({ freq: 659, dur: 0.2, type: "sine", gain: 0.045 }), 180);
  },
  dawn: () => {
    tone({ freq: 196, dur: 0.45, type: "sine", gain: 0.035, attack: 0.08, freqEnd: 330, bus: "music" });
    window.setTimeout(() => tone({ freq: 247, dur: 0.5, type: "sine", gain: 0.025, attack: 0.1, bus: "music" }), 120);
  },
  deploy: () => {
    tone({ freq: jitter(80, 0.05), dur: 0.16, type: "sine", gain: 0.06, freqEnd: 50 });
    window.setTimeout(() => sfx.click(), 40);
  },
  forge: () => {
    noise(0.07, 0.045, 900);
    tone({ freq: jitter(210), dur: 0.12, type: "square", gain: 0.04 });
    window.setTimeout(() => tone({ freq: jitter(140), dur: 0.1, type: "triangle", gain: 0.035 }), 80);
  },
  whoosh: () => {
    noise(0.14, 0.04, 700);
    tone({ freq: 480, dur: 0.16, type: "sine", gain: 0.03, freqEnd: 140 });
  },
  hack: () => {
    tone({ freq: jitter(880, 0.04), dur: 0.05, type: "square", gain: 0.03 });
    window.setTimeout(() => tone({ freq: jitter(1240, 0.04), dur: 0.04, type: "square", gain: 0.02 }), 40);
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
};

export function rumble(ms = 16) {
  if (typeof navigator === "undefined" || muted) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no haptic */
  }
}
