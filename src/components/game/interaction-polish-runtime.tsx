import { useGame } from "@/game/store";
import { useEffect } from "react";

const STYLE_ID = "hollow-aaa-interactions";

function dismissStoreChrome() {
  const store = useGame.getState();
  if (store.guideOpen) store.closeGuide();
  if (store.confirmRest) store.cancelRest();
  if (store.s.hack) store.closeTerminal();
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
    // Mission/combat are deliberate blocking states. Never dismiss the sortie
    // just because Escape was pressed.
    const store = useGame.getState().s;
    if (store.mission || store.combat) return false;
    const before = useGame.getState();
    el.click();
    const after = useGame.getState();
    if (
      before.s.selectedId !== after.s.selectedId ||
      before.guideOpen !== after.guideOpen ||
      before.confirmRest !== after.confirmRest ||
      before.s.hack !== after.s.hack
    ) return true;

    // Local-state dialogs such as Inventory close themselves from backdrop
    // clicks, so one animation frame is enough for that handler to run.
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
  const missionOpen = useGame((store) => !!store.s.mission);
  const combatOpen = useGame((store) => !!store.s.combat);

  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      button, a[href], [role="button"], select, summary {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
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
      }
      @media (prefers-reduced-motion: no-preference) {
        button:not(:disabled), a[href], [role="button"] {
          transition-property: transform, color, background-color, border-color, box-shadow, opacity;
          transition-duration: 140ms;
          transition-timing-function: cubic-bezier(.2,.8,.2,1);
        }
        button:not(:disabled):active, a[href]:active, [role="button"]:active {
          transform: scale(.975);
        }
      }
      html, body { overscroll-behavior: none; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body) active.blur?.();
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  useEffect(() => {
    const locked = selectedId || guideOpen || confirmRest || hackOpen || missionOpen || combatOpen;
    const previous = document.body.style.overflow;
    if (locked) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedId, guideOpen, confirmRest, hackOpen, missionOpen, combatOpen]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        active !== document.body &&
        active.matches("input, textarea, select") &&
        !target.closest("input, textarea, select, label")
      ) active.blur();

      // Primary navigation is a hard context switch. Clear transient chrome
      // before the destination screen renders so drawers never ghost across it.
      if (target.closest("nav button, aside button")) dismissStoreChrome();

      const store = useGame.getState();
      if (store.guideOpen && !target.closest(".ms-pop, [role='dialog']")) store.closeGuide();
      if (store.confirmRest && !target.closest(".ms-pop")) store.cancelRest();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) target.blur();
      if (useGame.getState().s.mission || useGame.getState().s.combat) return;
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("hollow:dismiss-ui"));
      if (!clickTopDismissibleBackdrop()) dismissStoreChrome();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
