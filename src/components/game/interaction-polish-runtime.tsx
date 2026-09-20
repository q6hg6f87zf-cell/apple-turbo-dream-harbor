import { punchClick } from "@/game/juice";
import { useGame } from "@/game/store";
import { isTalkLocked } from "@/game/talk";
import { useEffect } from "react";

const STYLE_ID = "hollow-aaa-interactions-v2";

function dismissStoreChrome() {
  const store = useGame.getState();
  if (store.guideOpen) store.closeGuide();
  if (store.confirmRest) store.cancelRest();
  if (store.s.term || store.s.hack) store.closeTerminal();
  if (store.s.talk && !isTalkLocked(store.s)) store.skipTalk();
  if (store.s.selectedId && !store.s.mission && !store.s.combat) store.selectOp(null);
}

function visible(el: HTMLElement) {
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function clickTopDismissibleBackdrop() {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("div.fixed.inset-0"))
    .filter(visible)
    .map((el) => ({ el, z: Number.parseInt(window.getComputedStyle(el).zIndex || "0", 10) || 0 }))
    .sort((a, b) => b.z - a.z);

  for (const { el } of candidates) {
    const store = useGame.getState().s;
    if (store.mission || store.combat) return false;
    const before = useGame.getState();
    el.click();
    const after = useGame.getState();
    if (
      before.s.selectedId !== after.s.selectedId ||
      before.guideOpen !== after.guideOpen ||
      before.confirmRest !== after.confirmRest ||
      before.s.hack !== after.s.hack ||
      before.s.term !== after.s.term
    ) return true;

    if (el.querySelector(".ms-pop, .ms-sheet, [role='dialog']")) return true;
  }
  return false;
}

export function InteractionPolishRuntime() {
  const screen = useGame((store) => store.s.screen);
  const selectedId = useGame((store) => store.s.selectedId);
  const guideOpen = useGame((store) => store.guideOpen);
  const confirmRest = useGame((store) => store.confirmRest);
  const hackOpen = useGame((store) => !!store.s.hack);
  const termOpen = useGame((store) => !!store.s.term);
  const missionOpen = useGame((store) => !!store.s.mission);
  const combatOpen = useGame((store) => !!store.s.combat);

  useEffect(() => {
    document.getElementById("hollow-aaa-interactions")?.remove();
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      button, a[href], [role="button"], select, summary {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      /* Inventory is a vertical list. manipulation + :active scale on every
         row is why Safari never starts a pan — the press "catches". */
      .ms-inv-list,
      .ms-inv-list *,
      .ms-inv-row,
      [data-inventory-list] [role="button"] {
        touch-action: pan-y !important;
      }
      button:not(:disabled), a[href], [role="button"], select, summary { cursor: pointer; }
      button:disabled, [aria-disabled="true"] { cursor: not-allowed; }
      button:focus-visible, a[href]:focus-visible, [role="button"]:focus-visible,
      input:focus-visible, textarea:focus-visible, select:focus-visible {
        outline: 2px solid color-mix(in oklab, var(--color-ember) 82%, white);
        outline-offset: 2px;
      }
      @media (max-width: 767px) {
        input, textarea, select { font-size: 16px !important; }
        aside.ms-sheet {
          width: min(92vw, 28rem) !important;
          max-width: min(92vw, 28rem) !important;
        }
        aside.ms-sheet button { min-height: 44px; }
      }
      @media (prefers-reduced-motion: no-preference) {
        button:not(:disabled), a[href], [role="button"] {
          transition-property: transform, color, background-color, border-color, box-shadow, opacity, filter;
          transition-duration: 180ms;
          transition-timing-function: cubic-bezier(.34,1.56,.64,1);
        }
        button:not(:disabled):active, a[href]:active, [role="button"]:active {
          transform: scale(.94);
          filter: brightness(1.18);
          box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-ember) 70%, transparent), 0 0 22px color-mix(in oklab, var(--color-ember) 35%, transparent);
          transition-duration: 70ms;
          transition-timing-function: cubic-bezier(.2,.8,.2,1);
        }
        .ms-inv-row:active,
        [data-inventory-list] [role="button"]:active,
        [data-inventory-list] button:active {
          transform: none;
          filter: none;
          box-shadow: none;
        }
      }
      html, body { overscroll-behavior: none; }
      body[data-orbit="1"] .ms-help,
      body[data-region-map="1"] .ms-help,
      [data-chrome="task"] .ms-help,
      [data-chrome="focused"] .ms-help { display: none !important; }
    `;
    return () => {
      style?.remove();
    };
  }, []);

  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body) active.blur?.();
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  useEffect(() => {
    const locked = selectedId || guideOpen || confirmRest || hackOpen || termOpen || missionOpen || combatOpen;
    const previous = document.body.style.overflow;
    if (locked) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedId, guideOpen, confirmRest, hackOpen, termOpen, missionOpen, combatOpen]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const pressable = target.closest("button, a[href], [role='button']") as HTMLElement | null;
      const inventoryPan = target.closest("[data-inventory-list], .ms-inv-row, .ms-inv-list");
      if (
        pressable &&
        !inventoryPan &&
        !(pressable as HTMLButtonElement).disabled &&
        pressable.getAttribute("aria-disabled") !== "true"
      ) {
        punchClick(event.clientX, event.clientY);
      }

      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        active !== document.body &&
        active.matches("input, textarea, select") &&
        !target.closest("input, textarea, select, label")
      ) active.blur();

      if (target.closest("nav button, aside:not(.ms-sheet) > button")) dismissStoreChrome();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const store = useGame.getState();
      if (store.guideOpen && !target.closest(".ms-pop, [role='dialog']")) store.closeGuide();
      if (store.confirmRest && !target.closest(".ms-pop")) store.cancelRest();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) target.blur();
      if (useGame.getState().s.mission || useGame.getState().s.combat) return;
      if (useGame.getState().s.term || useGame.getState().s.hack) return;
      const orbitClose = document.getElementById("hollow-orbit-close");
      if (orbitClose) {
        event.preventDefault();
        orbitClose.click();
        return;
      }
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("hollow:dismiss-ui"));
      if (!clickTopDismissibleBackdrop()) dismissStoreChrome();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
