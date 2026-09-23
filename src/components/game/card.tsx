import { sfx } from "@/game/audio";
import { cardNumber, isVacant, plateHandle, seatedMember } from "@/game/squad";
import type { SquadMember } from "@/game/types";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";
import { FlipHorizontal, RotateCcw, RotateCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoonCrest } from "./primitives";
import { Button } from "@/components/ui/button";

const MIN_Z = 0.82;
const MAX_Z = 1.85;
const SPIN_DEG = 72;

function SigInk({ name }: { name: string }) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  const a = 6 + (h & 15);
  const b = 14 + ((h >>> 4) & 15);
  const c = 8 + ((h >>> 8) & 12);
  const d = 18 + ((h >>> 12) & 10);
  return (
    <svg className="ms-card-sig-ink" viewBox="0 0 220 40" aria-hidden>
      <path
        d={`M3 26 C ${18 + a} 6, ${38 + b} 34, ${68 + c} 16 S ${118 + a} 4, ${148 + b} 22 S ${186 + d} 34, 216 14`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d={`M28 30 C ${50 + c} 22, ${90 + a} 32, ${140 + b} 24`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function MoonCard({ member, className }: { member: SquadMember; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: -14, y: 22 });
  const vel = useRef({ x: 0, y: 0 });
  const scale = useRef(1);
  const spinOn = useRef(false);
  const reduced = useRef(false);
  const dragging = useRef(false);
  const moved = useRef(false);
  const flipT = useRef<number | null>(null);
  const flipFrom = useRef(0);
  const flipTo = useRef(0);
  const lastTap = useRef(0);
  const [label, setLabel] = useState("Moon Squad plate");
  const [spinning, setSpinning] = useState(false);
  const [live, setLive] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch0 = useRef(0);
  const scale0 = useRef(1);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const lastMove = useRef({ t: 0, x: 0, y: 0 });
  const raf = useRef(0);
  const t0 = useRef(performance.now());

  const paint = () => {
    const root = stage.current;
    const el = root?.querySelector<HTMLElement>("[data-card]");
    if (!root || !el) return;
    const y = rot.current.y;
    const x = rot.current.x;
    el.style.transform = `rotateX(${x}deg) rotateY(${y}deg) scale(${scale.current})`;
    const gx = 50 + Math.sin((y * Math.PI) / 180) * 38;
    const gy = 38 - Math.sin((x * Math.PI) / 180) * 22;
    el.style.setProperty("--gx", `${gx}%`);
    el.style.setProperty("--gy", `${gy}%`);
    const shine = Math.max(0.08, 0.22 + Math.cos((y * Math.PI) / 180) * 0.14);
    el.style.setProperty("--shine", String(shine));
    const wrap = ((y % 360) + 360) % 360;
    el.dataset.face = wrap > 90 && wrap < 270 ? "back" : "front";
    const shadow = root.querySelector<HTMLElement>("[data-shadow]");
    if (shadow) {
      const k = 0.55 + scale.current * 0.35;
      shadow.style.transform = `translateX(${Math.sin((y * Math.PI) / 180) * 18}px) scale(${k}, 1)`;
      shadow.style.opacity = String(0.28 + (1.4 - Math.min(scale.current, 1.4)) * 0.2);
    }
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = !reduce;
    setLive(next);
    if (!next) {
      rot.current = { x: -8, y: 18 };
      setLabel("Moon Squad plate");
      paint();
    }
  }, []);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!live) {
      paint();
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (flipT.current != null) {
        flipT.current += dt;
        const u = Math.min(1, flipT.current / 0.52);
        const e = 1 - Math.pow(1 - u, 3);
        rot.current.y = flipFrom.current + (flipTo.current - flipFrom.current) * e;
        if (u >= 1) flipT.current = null;
      } else if (spinOn.current && !dragging.current && !reduced.current) {
        rot.current.y = (rot.current.y + SPIN_DEG * dt) % 360;
      } else if (!dragging.current && !reduced.current) {
        const moving = Math.hypot(vel.current.x, vel.current.y) >= 4;
        if (moving) {
          rot.current.x += vel.current.x * dt;
          rot.current.y += vel.current.y * dt;
          const damp = Math.exp(-3.4 * dt);
          vel.current.x *= damp;
          vel.current.y *= damp;
        } else {
          vel.current = { x: 0, y: 0 };
          rot.current.y = (rot.current.y + 26 * dt) % 360;
          const bob = Math.sin((now - t0.current) / 1700) * 8;
          rot.current.x = -12 + bob;
        }
      }
      rot.current.x = Math.max(-52, Math.min(52, rot.current.x));
      paint();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    paint();
    return () => cancelAnimationFrame(raf.current);
  }, [live]);

  useEffect(() => {
    const root = stage.current;
    if (!root || !live) return;

    const dist = () => {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const onDown = (e: PointerEvent) => {
      root.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      spinOn.current = false;
      setSpinning(false);
      flipT.current = null;
      moved.current = false;
      if (pointers.current.size === 2) {
        pinch0.current = dist();
        scale0.current = scale.current;
        drag.current = null;
        dragging.current = true;
      } else if (pointers.current.size === 1) {
        dragging.current = true;
        drag.current = { x: e.clientX, y: e.clientY, rx: rot.current.x, ry: rot.current.y };
        lastMove.current = { t: performance.now(), x: e.clientX, y: e.clientY };
        vel.current = { x: 0, y: 0 };
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size >= 2 && pinch0.current > 8) {
        const next = dist() / pinch0.current;
        scale.current = Math.min(MAX_Z, Math.max(MIN_Z, scale0.current * next));
        setLabel(`Zoom ${scale.current.toFixed(2)}×`);
        paint();
        return;
      }
      if (drag.current && pointers.current.size === 1) {
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        if (Math.hypot(dx, dy) > 5) moved.current = true;
        rot.current = {
          x: Math.max(-52, Math.min(52, drag.current.rx - dy * 0.28)),
          y: drag.current.ry + dx * 0.42,
        };
        const now = performance.now();
        const dt = Math.max(8, now - lastMove.current.t);
        vel.current = {
          x: ((e.clientY - lastMove.current.y) / dt) * -280,
          y: ((e.clientX - lastMove.current.x) / dt) * 380,
        };
        lastMove.current = { t: now, x: e.clientX, y: e.clientY };
        paint();
      }
    };
    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch0.current = 0;
      if (pointers.current.size === 0) {
        drag.current = null;
        dragging.current = false;
        const now = performance.now();
        if (!moved.current && now - lastTap.current < 320) {
          flip();
        }
        lastTap.current = now;
        if (moved.current) setLabel("Flick to spin · pinch to zoom");
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 0.94 : 1.06;
      scale.current = Math.min(MAX_Z, Math.max(MIN_Z, scale.current * dir));
      setLabel(`Zoom ${scale.current.toFixed(2)}×`);
      paint();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") rot.current.y -= 14;
      else if (e.key === "ArrowRight") rot.current.y += 14;
      else if (e.key === "ArrowUp") rot.current.x = Math.max(-52, rot.current.x - 10);
      else if (e.key === "ArrowDown") rot.current.x = Math.min(52, rot.current.x + 10);
      else if (e.key === "+" || e.key === "=") scale.current = Math.min(MAX_Z, scale.current * 1.08);
      else if (e.key === "-" || e.key === "_") scale.current = Math.max(MIN_Z, scale.current * 0.92);
      else if (e.key === " " || e.key === "s" || e.key === "S") {
        e.preventDefault();
        toggleSpin();
        return;
      } else if (e.key === "f" || e.key === "F") {
        flip();
        return;
      } else if (e.key === "0") reset();
      else return;
      paint();
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKey);
    };
  }, [live]);

  const toggleSpin = () => {
    spinOn.current = !spinOn.current;
    setSpinning(spinOn.current);
    flipT.current = null;
    vel.current = { x: 0, y: 0 };
    setLabel(spinOn.current ? "Spinning" : "Drag · pinch · spin");
    sfx.click();
  };

  const flip = () => {
    spinOn.current = false;
    setSpinning(false);
    vel.current = { x: 0, y: 0 };
    flipFrom.current = rot.current.y;
    flipTo.current = rot.current.y + 180;
    flipT.current = 0;
    setLabel("Flipped");
    sfx.click();
  };

  const reset = () => {
    rot.current = { x: -14, y: 22 };
    scale.current = 1;
    vel.current = { x: 0, y: 0 };
    spinOn.current = false;
    setSpinning(false);
    flipT.current = null;
    setLabel("Drag · pinch · spin");
    sfx.click();
    paint();
  };

  const pan = Number(member?.personalCaps ?? 0).toLocaleString();
  const num = cardNumber(member.id);
  const vacant = isVacant(member);
  const holder = vacant ? "Unclaimed" : member.name;
  const handle = plateHandle(member);
  const cvc = String((member.id.length * 137 + holder.length * 19) % 1000).padStart(3, "0");
  const last4 = num.replace(/\s/g, "").slice(-4);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={stage}
        tabIndex={0}
        className="ms-card-stage relative mx-auto flex h-[13.5rem] w-full max-w-md cursor-grab select-none items-center justify-center overflow-hidden touch-none outline-none active:cursor-grabbing md:h-[16.5rem]"
        aria-label="Moon Squad bank card. Drag to rotate, pinch or wheel to zoom, double-tap to flip, space to spin."
        onContextMenu={(e) => e.preventDefault()}
      >
        <div data-shadow className="ms-card-shadow" />
        <div data-card data-face="front" className="ms-card">
          <div className="ms-card-edge" aria-hidden />
          <div className="ms-card-face ms-card-front">
            <div className="ms-card-plate" aria-hidden />
            <div className="ms-card-skin">
              <div className="ms-card-foil" />
              <div className="ms-card-glare" />
              <div className="relative z-[1] flex h-full flex-col justify-between p-4 text-paper md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="ms-plate-type font-display text-[11px] uppercase tracking-[0.34em]">Moon Squad</p>
                    <p className="ms-plate-steel mt-1 font-mono text-[10px] tracking-[0.18em]">SYNAPSE · T-0880</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ms-card-nfc" aria-hidden />
                    <span className="ms-card-chip" aria-hidden />
                  </div>
                </div>
                <p className="ms-plate-steel font-mono text-[13px] tracking-[0.28em] md:text-sm">{num}</p>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="ms-plate-steel font-display text-[10px] uppercase tracking-[0.2em]">Cardholder</p>
                    <p className="ms-plate-type truncate font-display text-lg leading-tight">{holder}</p>
                    <p className="ms-plate-steel truncate font-mono text-[11px]">{handle}</p>
                  </div>
                  <div className="text-right">
                    <MoonCrest className="ml-auto size-7 text-moon" />
                    <p className="ms-plate-steel mt-1 font-display text-[10px] uppercase tracking-[0.2em]">Balance</p>
                    <p className="ms-plate-ember font-display text-xl tabular-nums">{pan}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="ms-card-face ms-card-back">
            <div className="ms-card-plate" aria-hidden />
            <div className="ms-card-skin">
              <div className="ms-card-hatch" aria-hidden />
              <div className="ms-card-stripe" aria-hidden>
                <span className="ms-card-stripe-track" />
              </div>
              <div className="ms-card-sig-row">
                <div className="ms-card-sig">
                  <span className="ms-card-sig-label">Authorized signature · not valid unless signed</span>
                  <SigInk name={holder} />
                  <p className="ms-card-sig-name">{holder}</p>
                </div>
                <div className="ms-card-cvc">
                  <span>CVC</span>
                  {cvc}
                </div>
              </div>
              <div className="ms-card-back-body">
                <div className="min-w-0 flex-1">
                  <p className="ms-plate-type font-display text-[11px] uppercase tracking-[0.28em]">Moon Squad</p>
                  <p className="ms-plate-steel mt-1 truncate font-mono text-[11px]">{handle}</p>
                  <p className="ms-card-legal">
                    This plate is property of SYNAPSE T-0880 and remains Moon Squad issue. Personal ledger only —
                    compound vault is a separate account. If found, return to the porch. Not transferable. Void if
                    unsigned.
                  </p>
                  <span className="ms-card-barcode" aria-hidden />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="ms-card-holo" aria-hidden>
                    <MoonCrest className="ms-card-holo-mark" />
                  </span>
                  <p className="ms-card-last4 ms-plate-steel">{last4}</p>
                  <p className="ms-plate-steel font-display text-[8px] uppercase tracking-[0.2em]">Desk 24h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {live ? (
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] shadow-[var(--shadow-border)] hover:text-paper",
            spinning ? "text-ember" : "text-muted",
          )}
          aria-label="Spin card"
          aria-pressed={spinning}
          onClick={toggleSpin}
        >
          <RotateCw className="size-4" />
        </button>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted shadow-[var(--shadow-border)] hover:text-paper"
          aria-label="Flip card"
          onClick={flip}
        >
          <FlipHorizontal className="size-4" />
        </button>
        <p className="min-w-32 text-center font-display text-[10px] uppercase tracking-[0.18em] text-muted">
          {label}
        </p>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted shadow-[var(--shadow-border)] hover:text-paper"
          aria-label="Reset card"
          onClick={reset}
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
      ) : (
        <p className="text-center font-display text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p>
      )}
    </div>
  );
}

export function MoonCardSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useGame((g) => seatedMember(g.s));
  const setScreen = useGame((g) => g.setScreen);
  if (!open) return null;
  const sheet = (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/80 p-3 backdrop-blur-md md:items-center"
      onClick={onClose}
    >
      <div
        className="ms-pop w-full max-w-md rounded-[var(--radius-xl)] border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">Moon Squad</p>
            <h2 className="font-display text-xl">Personal plate</h2>
            <p className="mt-1 text-sm text-muted">Drag to rotate. Pinch or wheel to zoom. Double-tap to flip.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-muted"
            aria-label="Close card"
          >
            <X className="size-4" />
          </button>
        </div>
        <MoonCard member={me} />
        <Button
          className="mt-4 w-full"
          variant="ember"
          onClick={() => {
            sfx.click();
            setScreen("ledger");
            onClose();
          }}
        >
          Open ledger
        </Button>
      </div>
    </div>
  );
  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}
