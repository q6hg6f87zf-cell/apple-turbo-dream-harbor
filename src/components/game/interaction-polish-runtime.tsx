import { punchClick, tapFeedback } from "@/game/juice";
import { useGame } from "@/game/store";
import { isTalkLocked } from "@/game/talk";
import { useEffect } from "react";

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
    document.getElementById("hollow-aaa-interactions-v2")?.remove();
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
      // A press that begins on a list row may become a pan. Stay silent there.
      const inventoryPan = target.closest("[data-inventory-list], .ms-inv-row, .ms-inv-list");
      if (
        pressable &&
        !inventoryPan &&
        !(pressable as HTMLButtonElement).disabled &&
        pressable.getAttribute("aria-disabled") !== "true"
      ) {
        if (pressable.closest("[data-juice='commit']")) punchClick(event.clientX, event.clientY);
        else tapFeedback();
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
