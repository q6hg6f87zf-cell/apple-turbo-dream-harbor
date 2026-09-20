/** Presentation-only feedback. Never touch gameplay math. */

let trauma = 0;
let raf = 0;
let cssReady = false;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function haptic(ms: number) {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no haptic */
  }
}

function ensureCss() {
  if (cssReady || typeof document === "undefined") return;
  cssReady = true;
  if (document.getElementById("hollow-juice-css")) return;
  const style = document.createElement("style");
  style.id = "hollow-juice-css";
  style.textContent = `
    .ms-ripple {
      position: fixed;
      width: 18px;
      height: 18px;
      margin: -9px 0 0 -9px;
      border-radius: 999px;
      pointer-events: none;
      z-index: 240;
      background: radial-gradient(circle, color-mix(in oklab, var(--color-ember) 88%, white) 0%, transparent 70%);
      animation: ms-ripple-pop 520ms cubic-bezier(.16,.84,.22,1) forwards;
    }
    .ms-ripple-ring {
      position: fixed;
      width: 22px;
      height: 22px;
      margin: -11px 0 0 -11px;
      border-radius: 999px;
      pointer-events: none;
      z-index: 241;
      border: 1.5px solid color-mix(in oklab, var(--color-ember) 75%, white);
      box-shadow: 0 0 18px color-mix(in oklab, var(--color-ember) 55%, transparent);
      animation: ms-ripple-ring 560ms cubic-bezier(.14,.82,.22,1) forwards;
    }
    .ms-spark {
      position: fixed;
      width: 5px;
      height: 5px;
      margin: -2px 0 0 -2px;
      border-radius: 1px;
      pointer-events: none;
      z-index: 242;
      background: color-mix(in oklab, var(--color-ember) 80%, white);
      box-shadow: 0 0 10px color-mix(in oklab, var(--color-ember) 90%, transparent);
      animation: ms-spark-fly 420ms cubic-bezier(.15,.9,.3,1) forwards;
    }
    .ms-flash {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 238;
      background: radial-gradient(circle at var(--x) var(--y), color-mix(in oklab, var(--color-ember) 34%, transparent) 0%, transparent 46%);
      animation: ms-flash-fade 260ms ease-out forwards;
    }
    .ms-shock {
      position: fixed;
      width: 28px;
      height: 28px;
      margin: -14px 0 0 -14px;
      border-radius: 999px;
      pointer-events: none;
      z-index: 243;
      border: 2px solid color-mix(in oklab, var(--color-ember) 85%, white);
      box-shadow: 0 0 24px color-mix(in oklab, var(--color-ember) 50%, transparent);
      animation: ms-shock-ring 620ms cubic-bezier(.12,.8,.22,1) forwards;
    }
    .ms-payout-fly {
      position: fixed;
      z-index: 246;
      pointer-events: none;
      font-family: Cinzel, Georgia, serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--color-ember);
      text-shadow: 0 0 12px color-mix(in oklab, var(--color-ember) 70%, transparent);
      animation: ms-payout-fly 820ms cubic-bezier(.16,.84,.22,1) forwards;
    }
    .ms-coin-fly {
      position: fixed;
      z-index: 245;
      width: 10px;
      height: 10px;
      margin: -5px 0 0 -5px;
      border-radius: 99px;
      pointer-events: none;
      background: radial-gradient(circle at 30% 30%, #f0e2b0, var(--color-moon) 45%, #8a7840);
      box-shadow: 0 0 10px color-mix(in oklab, var(--color-moon) 70%, transparent);
      animation: ms-coin-fly 720ms cubic-bezier(.14,.82,.22,1) forwards;
    }
    .ms-hitstop .ms-slot-window {
      filter: brightness(1.35) saturate(1.2);
    }
    .ms-plate-hit {
      animation: ms-plate-hit 420ms cubic-bezier(.16,.84,.22,1);
    }
    @keyframes ms-ripple-pop {
      0% { transform: scale(.3); opacity: .95; }
      55% { opacity: .4; }
      100% { transform: scale(11); opacity: 0; }
    }
    @keyframes ms-ripple-ring {
      0% { transform: scale(.4); opacity: .95; }
      100% { transform: scale(9.5); opacity: 0; }
    }
    @keyframes ms-spark-fly {
      0% { transform: translate(0,0) scale(1.15); opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(.15); opacity: 0; }
    }
    @keyframes ms-flash-fade {
      0% { opacity: .9; }
      100% { opacity: 0; }
    }
    @keyframes ms-shock-ring {
      0% { transform: scale(.2); opacity: .95; }
      100% { transform: scale(22); opacity: 0; }
    }
    @keyframes ms-payout-fly {
      0% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(.55); opacity: 0; }
    }
    @keyframes ms-coin-fly {
      0% { transform: translate(0,0) scale(1.1); opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(.35); opacity: 0; }
    }
    @keyframes ms-plate-hit {
      0% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-ember) 0%, transparent); }
      35% { box-shadow: 0 0 0 6px color-mix(in oklab, var(--color-ember) 45%, transparent); }
      100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-ember) 0%, transparent); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ms-ripple, .ms-ripple-ring, .ms-spark, .ms-flash, .ms-shock, .ms-payout-fly, .ms-coin-fly { display: none; }
      .ms-plate-hit { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

function tick() {
  trauma = Math.max(0, trauma - 0.048);
  const shake = trauma * trauma;
  // Never the scroll container: a translate/rotate there makes it the
  // containing block for fixed descendants and forces the scroller to
  // recomposite mid-gesture.
  const root = document.querySelector("[data-shake]") as HTMLElement | null;
  const orbit = document.getElementById("hollow-orbit-stage") as HTMLElement | null;
  const target = orbit ?? root;
  if (target) {
    if (shake > 0.004) {
      const x = (Math.random() * 2 - 1) * 14 * shake;
      const y = (Math.random() * 2 - 1) * 10 * shake;
      const r = (Math.random() * 2 - 1) * 0.55 * shake;
      target.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
      target.style.rotate = `${r.toFixed(3)}deg`;
    } else {
      target.style.translate = "";
      target.style.rotate = "";
    }
  }
  if (trauma > 0.002) raf = requestAnimationFrame(tick);
  else raf = 0;
}

export function addTrauma(amount: number) {
  if (typeof window === "undefined" || reducedMotion()) return;
  trauma = Math.min(1, trauma + amount);
  if (!raf) raf = requestAnimationFrame(tick);
}

function spawn(className: string, x: number, y: number, life: number, extra?: (node: HTMLElement) => void) {
  const node = document.createElement("span");
  node.className = className;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  extra?.(node);
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), life);
}

export function rippleAt(x: number, y: number) {
  if (typeof document === "undefined" || reducedMotion()) return;
  ensureCss();
  spawn("ms-ripple", x, y, 540);
  spawn("ms-ripple-ring", x, y, 580);
}

export function sparksAt(x: number, y: number, count = 8) {
  if (typeof document === "undefined" || reducedMotion()) return;
  ensureCss();
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 22 + Math.random() * 34;
    spawn("ms-spark", x, y, 440, (node) => {
      node.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      node.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    });
  }
}

export function flashAt(x: number, y: number) {
  if (typeof document === "undefined" || reducedMotion()) return;
  ensureCss();
  const node = document.createElement("span");
  node.className = "ms-flash";
  node.style.setProperty("--x", `${x}px`);
  node.style.setProperty("--y", `${y}px`);
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 280);
}

export function shockwaveAt(x: number, y: number) {
  if (typeof document === "undefined" || reducedMotion()) return;
  ensureCss();
  spawn("ms-shock", x, y, 640);
  haptic(18);
  addTrauma(0.28);
}

/**
 * Tier 1 — an ordinary tap. The CSS :active state carries the visual; this is
 * just the tactile confirmation. Navigation should feel effortless, not loud.
 */
export function tapFeedback() {
  haptic(6);
}

/**
 * Tier 2 — a committed action: Buy, Equip, Deploy, Deal. Confirmation, not
 * fireworks. Screen shake belongs to tier 3, which callers author per outcome
 * through addTrauma/hitstop.
 */
export function punchClick(x: number, y: number) {
  rippleAt(x, y);
  sparksAt(x, y);
  flashAt(x, y);
  haptic(12);
}

export function hitstop(ms = 90) {
  if (typeof document === "undefined" || reducedMotion()) return;
  document.body.classList.add("ms-hitstop");
  window.setTimeout(() => document.body.classList.remove("ms-hitstop"), ms);
}

export function payoutFly(amount: number, fromX: number, fromY: number) {
  if (typeof document === "undefined" || reducedMotion() || amount <= 0) return;
  ensureCss();
  const hud = document.querySelector(".ms-hud-plate") as HTMLElement | null;
  const to = hud?.getBoundingClientRect();
  const tx = to ? to.left + to.width * 0.72 : fromX;
  const ty = to ? to.top + to.height * 0.45 : fromY - 80;
  const node = document.createElement("span");
  node.className = "ms-payout-fly";
  node.textContent = `+${amount.toLocaleString()}`;
  node.style.left = `${fromX}px`;
  node.style.top = `${fromY}px`;
  node.style.setProperty("--dx", `${tx - fromX}px`);
  node.style.setProperty("--dy", `${ty - fromY}px`);
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 860);
  sparksAt(fromX, fromY, 12);
  shockwaveAt(fromX, fromY);
  coinRain(fromX, fromY, hud);
  platePulse();
}

export function coinRain(fromX: number, fromY: number, hud?: HTMLElement | null) {
  if (typeof document === "undefined" || reducedMotion()) return;
  ensureCss();
  const to = (hud ?? (document.querySelector(".ms-hud-plate") as HTMLElement | null))?.getBoundingClientRect();
  const count = 10;
  for (let i = 0; i < count; i++) {
    const delay = i * 28;
    window.setTimeout(() => {
      const tx = to ? to.left + to.width * (0.55 + Math.random() * 0.3) : fromX;
      const ty = to ? to.top + to.height * 0.4 : fromY - 80;
      const ox = fromX + (Math.random() - 0.5) * 48;
      const oy = fromY + (Math.random() - 0.5) * 28;
      spawn("ms-coin-fly", ox, oy, 760, (node) => {
        node.style.setProperty("--dx", `${tx - ox}px`);
        node.style.setProperty("--dy", `${ty - oy}px`);
      });
    }, delay);
  }
}

export function platePulse() {
  if (typeof document === "undefined" || reducedMotion()) return;
  ensureCss();
  const hud = document.querySelector(".ms-hud-plate");
  if (!hud) return;
  hud.classList.remove("ms-plate-hit");
  void (hud as HTMLElement).offsetWidth;
  hud.classList.add("ms-plate-hit");
  window.setTimeout(() => hud.classList.remove("ms-plate-hit"), 440);
}

export function drainFly(amount: number, fromX: number, fromY: number) {
  if (typeof document === "undefined" || reducedMotion() || amount <= 0) return;
  ensureCss();
  const hud = document.querySelector(".ms-hud-plate") as HTMLElement | null;
  const from = hud?.getBoundingClientRect();
  const sx = from ? from.left + from.width * 0.72 : fromX;
  const sy = from ? from.top + from.height * 0.45 : fromY - 80;
  const node = document.createElement("span");
  node.className = "ms-payout-fly";
  node.textContent = `−${amount.toLocaleString()}`;
  node.style.left = `${sx}px`;
  node.style.top = `${sy}px`;
  node.style.color = "var(--color-danger)";
  node.style.setProperty("--dx", `${fromX - sx}px`);
  node.style.setProperty("--dy", `${fromY - sy}px`);
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 860);
  platePulse();
}
