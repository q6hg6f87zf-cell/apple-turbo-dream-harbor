# World Event Theater

Moon Squad fantasy-tech contract for player-facing campaign beats.

Contract version: **1.1** (Atlas · Pulse live fold-in)

## Doctrine

The living Hollow does not speak in ledger rows. It speaks in **theater events**:
a sortie settles, a raid opens, a boss clears, Vault 13 flashes, intel ticks on
the atlas. Neon remains the referee. The browser is theater and cache.
Discord / TyroneBot are **subscribers only** — never the mint.

```
Vault (append domain event · same TX as settle)
   → hollow_domain_event (0018 · Vault-owned)
   → Atlas projectors (world pulse · atlas heat · day-board strip)
   → Pulse GET /api/hollow/live (SSE revision fanout)
   → Forge (UI: DayBoard · WorldAtlas · vault flash)
   → optional hollow_world_event outbox → TyroneBot / Discord
```

`hollow_world_event` (`migrations/0013`–`0015`, `publishWorldEvent`) is the
**bridge outbox** for Tyrone memory and guild announcements. It is **not** the
domain source of truth for Caps, XP, or campaign revisions.

`hollow_domain_event` (`0018_hollow_domain_event`, Vault) is the append-only
domain log. Atlas does **not** own that migration. Atlas projects payloads and
Pulse beats into read models only.

## Ownership

| Surface | Owner | Notes |
|---|---|---|
| Domain event append / settle TX | **Vault** | `MissionSettled` in same TX as ticket settle + revision bump (`0018`) |
| Theater catalog + heat / pulse / board projectors | **Atlas** | This doc + `src/game/world-*` / `atlas-heat` / `day-board-pulse` |
| Elite settle / intel / boss / raid / day-board voice | **Mythos** | `src/game/theater-copy.ts` (+ board-copy idle lead); consumed by pulse / strip |
| SSE revision stream `GET /api/hollow/live` | **Pulse** | Fanout only; does not invent events |
| DayBoard / Atlas / vault flash UI | **Forge** | Consumes Atlas read models |
| Discord announce / Tyrone memory | TyroneBot via bridge | Maps dotted bridge types; never mints |

Sacred fence: never rewrite Moon Squad profile cards, rider identity stores, or
`tyrone_arcade_snapshot` as if they were the campaign ledger. Never touch
`/workspace/tyrone-bot`.

## Pulse live contract (fold-in)

**Route (Pulse-owned):** `GET /api/hollow/live` — Server-Sent Events.

**Beat envelope:**

```ts
type LiveBeatType = "hello" | "revision" | "heartbeat";

type LiveBeat = {
  type: LiveBeatType;
  campaignRevision: number;
  memberRevision: number;
  /** Present on revision beats when a domain event just landed. */
  eventType?: "MissionSettled" | "RaidOpened" | "BossCleared" | string;
};
```

| `type` | Meaning for Atlas |
|---|---|
| `hello` | Snapshot watermark — set pulse revisions; do not invent heat |
| `revision` | Campaign/member revisions advanced; if `eventType` set, project theater beat |
| `heartbeat` | Keepalive — refresh watermark only if revisions are higher |

`eventType` uses **theater / domain PascalCase** (`MissionSettled`, `RaidOpened`,
`BossCleared`), not bridge dotted names. Atlas maps those through
`normalizeTheaterEvent` / `applyLiveBeat`. Full reward payloads still ride the
settle JSON / domain row; the live beat is the sub-second signal that Forge
should animate and that heat/board should tick.

Adapter: `applyLiveBeat(pulse, beat)` in `src/game/world-pulse.ts`.

## Theater names ↔ domain eventType ↔ bridge catalog

Do **not** rename `src/lib/bridge/catalog.ts` dotted types. Atlas aliases map
PascalCase theater / domain names onto existing outbox types when a beat is
important enough to announce.

| Theater / domain `eventType` | Bridge outbox type | When to enqueue outbox |
|---|---|---|
| `MissionSettled` | `mission.completed` | raid / bounty / boss only (scout/forage stay quiet for memory) |
| `MissionFailed` | `mission.failed` | raid / boss wipe paths |
| `RaidOpened` | *(no 1:1; optional `boss.engaged`)* | Ticket start / boss engage |
| `BossCleared` | `boss.defeated` | boss settle that flips `boss_clears[region]` |
| `BossFailed` | `boss.failed` | boss wipe (catalog ready) |
| `TransferSettled` | *(none yet)* | Caps vault↔card↔rider |
| `DayAdvanced` | `campaign.day_advanced` | telemetry; no Tyrone memory |
| `IdentityLinked` | `player.joined` | Never rewrite profile cards |

Primary Milestone 1 beat: **`MissionSettled`** (+ derived **`BossCleared`** when
`kind === "boss"` and clear was new). Live SSE `eventType` carries the same
PascalCase strings Vault appends.

## Canonical theater payload

Projector-facing full payload (`TheaterEventPayload` in
`src/game/world-event-theater.ts`). Live beats may supply only
`eventType` + revisions; Atlas fills defaults for heat/beatId until Forge
merges settle snapshot fields.

| Field | Type | Purpose |
|---|---|---|
| `eventId` | string | Stable id (Vault-issued) |
| `theater` | TheaterName | `MissionSettled` · `RaidOpened` · `BossCleared` · … |
| `bridgeType` | BridgeOutboxType \| null | Mapped dotted type for optional outbox |
| `campaignId` | `"moon-squad"` | Shared campaign |
| `userId` | string \| null | Settling rider |
| `discordId` | string \| null | Bridge subscribers |
| `ticketId` | string \| null | Mission ticket |
| `requestId` | string \| null | Idempotency / receipt key |
| `region` | RegionId \| null | Atlas pin / heat cell |
| `loc` | string \| null | Legacy location id |
| `kind` | MissionKind \| null | scout … boss |
| `partyIds` | string[] | Party on ticket |
| `performanceScore` | 0–1000 \| null | Sealed score |
| `revision` | `{ campaign; member? }` | Authority rail (mirrors live beat) |
| `heatDelta` | number | Atlas heat contribution |
| `intelDelta` | number | Region intel tick |
| `beatId` | TheaterBeatId | Client animation key |
| `at` | ISO timestamptz | Event time |
| `duplicate` | boolean | Idempotent replay |

### Beat ids (Forge animation keys)

| `beatId` | Player moment |
|---|---|
| `vault_flash` | Caps / ore / favor land on Vault 13 |
| `intel_drop` | Region intel ticks; atlas rim wakes |
| `boss_clear` | Named hill falls |
| `raid_opened` | Ticket issued; heat foreshadow |
| `day_advance` | Dawn reprints the board |
| `transfer_flash` | Card ↔ vault pulse |
| `mission_settle` | Generic fair settle |

## Atlas read models (no Redis)

Pure TypeScript under `src/game/` (Atlas-owned):

1. **`world-event-theater.ts`** — catalog, alias map, payload normalize, live `eventType` parse
2. **`world-pulse.ts`** — pulse state + `applyLiveBeat` / `applyTheaterEvent`
3. **`atlas-heat.ts`** — per-region heat cells from pulse
4. **`day-board-pulse.ts`** — strip feed for DayBoard

Do **not** implement `GET /api/hollow/live` here (Pulse). Do **not** add
`0018_hollow_domain_event.sql` here (Vault).

## Mythos copy pack

`src/game/theater-copy.ts` owns player-facing headlines, sublines, and Moon Squad
radio for `MissionSettled`, `RaidOpened`, `BossCleared`, intel spikes, Vault
pulses, and day-board idle lead. Atlas projectors call `theaterCopyFor`; Forge
renders strip fields (`headline` / `subline` / `radio` / `tone`). Do not invent
economy numbers or Caps rules here.

Vault settle may still emit kebab `beatId`s (`intel-spike`, `boss-cleared`,
`mission-cleared`). `resolveTheaterBeatId` aliases them onto Atlas snake ids.

## Consumers

| Consumer | How |
|---|---|
| DayBoard (Forge) | `selectDayBoardPulse(pulse)` → strip above watch ribbon |
| WorldAtlas / region rim (Forge) | `selectAtlasHeat(pulse)` → rim tint / cell intensity |
| Vault flash / intel (Forge) | Queue VFX from `beatId` on revision beats |
| Pulse SSE | Streams live beats → `applyLiveBeat` |
| Bridge outbox | Vault *may* enqueue mapped `bridgeType` after settle; continuity policy gates memory |

## Handoffs

### Vault

- Migration `0018_hollow_domain_event` + append `MissionSettled` in settle TX.
- Unique key e.g. `settle:${ticketId}`; retries must not double-append.
- Optional: include `region` / `kind` in domain payload so Atlas heat is precise
  without waiting for snapshot merge.

### Pulse

- Own `GET /api/hollow/live`; emit `hello` → `revision` (with `eventType`) →
  `heartbeat`. Atlas only consumes.

### Forge

- Open EventSource to `/api/hollow/live`, call `applyLiveBeat`, pass selectors
  into DayBoard / Atlas. Do not invent heat math in components.

## Success criteria (this Atlas slice)

- Doc references live contract + domain/bridge alias map
- Modules + `node:test`: live `revision` + `eventType: "MissionSettled"` bumps
  campaign revision, produces board strip beat, and (with region) heats atlas
- No SSE route, no `0018` migration, no tyrone-bot / profile / snapshot edits

## Forbidden

- Renaming bridge dotted types
- Editing tyrone-bot / profile cards / `tyrone_arcade_snapshot` as ledger
- Production data surgery
- Treating `hollow_world_event.delivery_status` as campaign authority
