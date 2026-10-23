/**
 * Client-side live-rail coordination: health flag + refresh fan-in.
 * Runtimes register their authoritative refresh; Pulse triggers them on revision beats.
 * When healthy, 30s backup pollers stay quiet (focus/visibility still refresh).
 */

type RefreshHandler = () => void | Promise<void>;
type HealthListener = (healthy: boolean) => void;

const refreshHandlers = new Set<RefreshHandler>();
const healthListeners = new Set<HealthListener>();
let healthy = false;

export function isLiveRailHealthy(): boolean {
  return healthy;
}

export function setLiveRailHealthy(next: boolean): void {
  if (healthy === next) return;
  healthy = next;
  for (const listener of healthListeners) listener(healthy);
}

export function subscribeLiveRailHealth(listener: HealthListener): () => void {
  healthListeners.add(listener);
  listener(healthy);
  return () => {
    healthListeners.delete(listener);
  };
}

export function registerLiveRefresh(handler: RefreshHandler): () => void {
  refreshHandlers.add(handler);
  return () => {
    refreshHandlers.delete(handler);
  };
}

/** Ask every registered authority runtime to pull+apply. Never optimistic-write from SSE alone. */
export async function requestLiveRefresh(): Promise<void> {
  const jobs = [...refreshHandlers].map((handler) => Promise.resolve().then(handler).catch(() => undefined));
  await Promise.all(jobs);
}
