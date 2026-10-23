/**
 * Forge → Resonance stacking rule for Atlas beatIds (presentation only).
 * - vault_flash on MissionSettled → skip (mission.settled already plays via playLiveEventCue)
 * - intel_drop → always
 * - vault_flash on TransferSettled / vault-primary → play
 * - boss_clear / raid_opened → play
 */
export type SettleBeatCue = "vault_flash" | "intel_drop" | "boss_clear" | "raid_opened";

const ALIASES: Record<string, SettleBeatCue> = {
  vault_flash: "vault_flash",
  "mission-cleared": "vault_flash",
  intel_drop: "intel_drop",
  "intel-spike": "intel_drop",
  boss_clear: "boss_clear",
  "boss-cleared": "boss_clear",
  raid_opened: "raid_opened",
};

export function settleBeatCueId(
  beat: { beatId?: string; theater?: string } | null | undefined,
  eventType?: string,
): SettleBeatCue | undefined {
  if (!beat?.beatId) return undefined;
  const cue = ALIASES[beat.beatId];
  if (!cue) return undefined;
  const theater = eventType ?? beat.theater;
  if (cue === "vault_flash" && theater === "MissionSettled") return undefined;
  return cue;
}
