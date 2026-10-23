import { LIVE_SSE_PATH, parseLiveBeat, revisionIsNewer, type LiveRevisionWatermark } from "@/game/server-live";
import {
  isLiveRailHealthy,
  requestLiveRefresh,
  setLiveRailHealthy,
} from "@/game/server-live-rail";
import { useGame } from "@/game/store";
import { useEffect } from "react";

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Pulse client: EventSource → revision beats → authoritative refresh.
 * Never optimistic-writes balances from SSE alone.
 * On healthy SSE, backup 30s pollers demote via live-rail health flag.
 * On error/maxDuration drop, reconnect with backoff and restore 30s poll until healthy.
 */
export function ServerLiveRuntime() {
  const discordId = useGame((store) => store.s.discordId);

  useEffect(() => {
    if (!discordId) {
      setLiveRailHealthy(false);
      return;
    }

    let cancelled = false;
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let backoff = BASE_BACKOFF_MS;
    let watermark: LiveRevisionWatermark | null = null;
    let refreshPending = false;

    const clearReconnect = () => {
      if (reconnectTimer != null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const markDown = () => {
      setLiveRailHealthy(false);
    };

    const markUp = () => {
      setLiveRailHealthy(true);
      backoff = BASE_BACKOFF_MS;
    };

    const refreshIfNewer = async (next: LiveRevisionWatermark) => {
      if (!revisionIsNewer(next, watermark)) return;
      if (refreshPending) {
        watermark = {
          campaignRevision: Math.max(watermark?.campaignRevision ?? 0, next.campaignRevision),
          memberRevision: Math.max(watermark?.memberRevision ?? 0, next.memberRevision),
        };
        return;
      }
      refreshPending = true;
      watermark = next;
      try {
        await requestLiveRefresh();
      } finally {
        refreshPending = false;
      }
    };

    const onPayload = (raw: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }
      const beat = parseLiveBeat(parsed);
      if (!beat) return;

      if (beat.type === "hello") {
        watermark = {
          campaignRevision: beat.campaignRevision,
          memberRevision: beat.memberRevision,
        };
        markUp();
        return;
      }
      if (beat.type === "heartbeat") {
        markUp();
        return;
      }
      if (beat.type === "revision") {
        markUp();
        void refreshIfNewer({
          campaignRevision: beat.campaignRevision,
          memberRevision: beat.memberRevision,
        });
      }
    };

    const connect = () => {
      if (cancelled) return;
      clearReconnect();
      try {
        source?.close();
      } catch {
        /* ignore */
      }
      source = new EventSource(LIVE_SSE_PATH, { withCredentials: true });

      source.onopen = () => {
        // hello arrives as first data message; treat open as provisional until then
      };

      source.onmessage = (event) => {
        if (cancelled) return;
        onPayload(String(event.data ?? ""));
      };

      source.onerror = () => {
        if (cancelled) return;
        markDown();
        try {
          source?.close();
        } catch {
          /* ignore */
        }
        source = null;
        const wait = backoff;
        backoff = Math.min(MAX_BACKOFF_MS, Math.floor(backoff * 1.7));
        reconnectTimer = window.setTimeout(connect, wait);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      try {
        source?.close();
      } catch {
        /* ignore */
      }
      source = null;
      if (isLiveRailHealthy()) setLiveRailHealthy(false);
    };
  }, [discordId]);

  return null;
}
