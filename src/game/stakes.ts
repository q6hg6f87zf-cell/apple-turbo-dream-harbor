/** Presentation-only. Never changes odds, payouts, or clocks. */

export type HeatBand = "chip" | "sit" | "sweat" | "plate";

export function stakeHeat(stake: number, plate: number) {
  if (plate <= 0) return 1;
  return Math.max(0, Math.min(1, stake / plate));
}

export function heatBand(heat: number): HeatBand {
  if (heat >= 0.72) return "plate";
  if (heat >= 0.38) return "sweat";
  if (heat >= 0.16) return "sit";
  return "chip";
}

export function heatLine(band: HeatBand) {
  if (band === "plate") return "This is the plate. Hold it down if you mean it.";
  if (band === "sweat") return "Enough of the card that the room gets quiet.";
  if (band === "sit") return "A real sit. The chandelier is listening.";
  return "Pocket change. The machine still wants a pull.";
}

export function needCommit(heat: number) {
  return heat >= 0.32;
}

export function atRiskLine(stake: number, plate: number) {
  if (plate <= 0) return "The plate is empty.";
  const pct = Math.round((stake / Math.max(1, plate)) * 100);
  if (pct >= 72) return `${pct}% of the plate. Walk-away money.`;
  if (pct >= 38) return `${pct}% of the card sits on the glass.`;
  if (pct >= 16) return `${pct}% on the line. You will feel a miss.`;
  return `${stake} off the plate. The chandelier barely notices.`;
}

export function tiltLine(delta: number, pulls: number) {
  if (pulls <= 0) return "Clean sheet. First sit.";
  if (delta <= -80) return "You're chasing. The machine can hear it.";
  if (delta < 0) return `Down ${Math.abs(delta)}. Loss is louder than a win.`;
  if (delta >= 80) return `Up ${delta}. The room wants it back.`;
  if (delta > 0) return `Up ${delta}. Don't give it back cheap.`;
  return "Even. The glass hasn't decided.";
}

export function nearMissLine() {
  return "Two on the rail. The third one knew.";
}

export function dryLine(heat: number) {
  if (heat >= 0.38) return "Dry. That one took a piece of the plate.";
  if (heat >= 0.16) return "Dry reels. The chandelier doesn't flinch.";
  return "Dry reels. The plate didn't move.";
}

export function holdMs(heat: number) {
  return Math.round(520 + heat * 420);
}
