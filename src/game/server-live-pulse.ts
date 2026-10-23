/**
 * Pulse-owned module-level world-pulse holder fed by ServerLiveRuntime.
 * Forge/Atlas read selectAtlasHeat(getLiveWorldPulse()) / day-board without a
 * second EventSource. Never invents balances — applyLiveBeat only.
 */
import {
  applyLiveBeat,
  emptyWorldPulse,
  type WorldPulseState,
} from "./world-pulse";

type Listener = (state: WorldPulseState) => void;

let pulse: WorldPulseState = emptyWorldPulse();
const listeners = new Set<Listener>();

export function getLiveWorldPulse(): WorldPulseState {
  return pulse;
}

export function resetLiveWorldPulse(campaignId = "moon-squad"): WorldPulseState {
  pulse = emptyWorldPulse(campaignId);
  for (const listener of listeners) listener(pulse);
  return pulse;
}

/**
 * Apply a parsed/raw Pulse SSE beat into the shared world-pulse projection.
 * Returns the next state; no-ops on malformed input (applyLiveBeat is defensive).
 */
export function applyLiveWorldBeat(
  raw: unknown,
  extras: Parameters<typeof applyLiveBeat>[2] = {},
): WorldPulseState {
  pulse = applyLiveBeat(pulse, raw, extras);
  for (const listener of listeners) listener(pulse);
  return pulse;
}

export function subscribeLiveWorldPulse(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
