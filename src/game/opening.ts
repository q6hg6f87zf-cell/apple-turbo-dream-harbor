import { useSyncExternalStore } from "react";

export type OpeningBeat = "boot" | "porch" | "wake";
export type BootStage = "CRT" | "FILE" | "UPLINK" | "PORCH";

let beat: OpeningBeat = "boot";
const subs = new Set<() => void>();

function emit() {
  subs.forEach((fn) => fn());
}

export function getOpeningBeat() {
  return beat;
}

export function setOpeningBeat(next: OpeningBeat) {
  if (beat === next) return;
  beat = next;
  emit();
}

export function dismissSynapseSplash() {
  if (typeof document === "undefined") return;
  const el = document.getElementById("synapse-boot");
  if (!el || el.classList.contains("is-up")) return;
  el.classList.add("is-up");
  window.setTimeout(() => el.remove(), 900);
}

export function enterPorch() {
  if (beat === "boot") setOpeningBeat("porch");
}

export function enterWake() {
  setOpeningBeat("wake");
}

export function useOpeningBeat() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    getOpeningBeat,
    getOpeningBeat,
  );
}

export function bootStageName(input: {
  hydrated: boolean;
  uplinkReady: boolean;
  porchLit: boolean;
}): BootStage {
  if (input.porchLit) return "PORCH";
  if (input.uplinkReady) return "UPLINK";
  if (input.hydrated) return "UPLINK";
  return "CRT";
}

export function bootStageLabel(stage: BootStage) {
  if (stage === "PORCH") return "Porch lamps — Vault 13";
  if (stage === "UPLINK") return "Discord uplink · file warm";
  if (stage === "FILE") return "Reading resident file";
  return "Seating the CRT · Tyrone online";
}

/** Real work drives the checkpoints. Elapsed time only creeps toward the next one so the bar never looks frozen. */
export function bootLoadPercent(input: {
  hydrated: boolean;
  uplinkReady: boolean;
  porchLit: boolean;
  startedAt: number;
  now: number;
}) {
  if (input.porchLit) return 100;
  const elapsed = Math.max(0, input.now - input.startedAt);
  if (input.uplinkReady) return 86;
  if (input.hydrated) return Math.min(72, 48 + (elapsed / 9000) * 24);
  return Math.min(42, 12 + (elapsed / 12000) * 30);
}
