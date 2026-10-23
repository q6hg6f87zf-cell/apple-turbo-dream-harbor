# World Event Theater

Moon Squad fantasy-tech contract for player-facing campaign beats.

Contract version: **1.3** (Mythos war journal + day-cycle drama · Atlas Design Bible deepen — stickier scars · shared live marks)

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
| Elite settle / intel / boss / raid / day-board / war-journal voice | **Mythos** | `src/game/theater-copy.ts` (+ `board-copy` idle lead); Vault projects journal rows; Chrome cites eventId+revision |
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

// Pulse-locked revision extras (additive; omit unknown). Soft-read only.
type LiveBeat = {
  type: LiveBeatType;
  campaignRevision: number;
  memberRevision: number;
  /** Present on revision beats when a domain event just landed. */
  eventType?: "MissionSettled" | "RaidOpened" | "BossCleared" | "DayAdvanced" | string;
  /** Optional theater extras — second linked client paints shared atlas marks. */
  theater?: TheaterName;
  region?: RegionId;
  kind?: MissionKind;
  heatDelta?: number;
  intelDelta?: number;
  beatId?: TheaterBeatId;
  /** offerMutations only — never nested heat. */
  worldConsequence?: { offerMutations?: OfferMutation[] };
};
```

| `type` | Meaning for Atlas |
|---|---|
| `hello` | Snapshot watermark — set pulse revisions; do not invent heat |
| `revision` | Campaign/member revisions advanced; `eventType` alone = watermark only; with `region` (+ theater extras) paint shared marks |
| `heartbeat` | Keepalive — refresh watermark only if revisions are higher |

`eventType` uses **theater / domain PascalCase** (`MissionSettled`, `RaidOpened`,
`BossCleared`), not bridge dotted names. Atlas maps those through
`normalizeTheaterEvent` / `applyLiveBeat`. Full reward payloads still ride the
settle JSON / domain row; the live beat is the sub-second signal that Forge
should animate and that heat/board should tick.

Adapter: `applyLiveBeat(pulse, beat, extras?)` in `src/game/world-pulse.ts`.
`eventType`-alone → watermark bump only (no scar invent).
With `region` from the wire beat or Forge extras → shared atlas / board projections.

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
| `worldConsequence` | `{ offerMutations? }` \| null | Vault board mutations only (see Vault handoff) |

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

1. **`world-event-theater.ts`** — catalog, alias map, payload normalize, `worldConsequence` parse, live `eventType` parse
2. **`world-pulse.ts`** — pulse state + `applyLiveBeat` / `applyTheaterEvent` (carries `offerMutations` + `scarWorthy`)
3. **`atlas-heat.ts`** — per-region heat cells + **stickier scars** (`deadZone` survives cool; heal only via `heal` / DayAdvanced heal)
4. **`day-board-pulse.ts`** — strip feed + **next-offer graph** (`boost` / `unlock` / `cool` / `heal`); DayAdvanced rewrites strip
5. **`theater-copy.ts`** — Mythos `theaterCopyFor` (Atlas consumes; does not rewrite)

Do **not** implement `GET /api/hollow/live` here (Pulse). Do **not** add
`0018_hollow_domain_event.sql` here (Vault).

## Mythos copy pack

`src/game/theater-copy.ts` owns player-facing headlines, sublines, and Moon Squad
radio for `MissionSettled`, `RaidOpened`, `BossCleared`, intel spikes, Vault
pulses, and day-board idle lead. Atlas projectors call `theaterCopyFor` (source
of truth); Forge renders strip fields (`headline` / `subline` / `radio` / `tone`
/ optional `copyKey`). Do not invent economy numbers or Caps rules here.

Vault settle may still emit kebab `beatId`s (`intel-spike`, `boss-cleared`,
`mission-cleared`). `resolveTheaterBeatId` aliases them onto Atlas snake ids.

### Consequence-aware voice

Settled missions change how the world speaks next. Mythos derives flags from the
event (and optional Atlas `TheaterCopyContext`):

| Flag | Derived when | Voice |
|---|---|---|
| `scarred` | `isScarWorthy(...)`, `regionHeat ≥ 8`, or `copyKey` scar/atlas | Scarred sector / glowing rim / Atlas scar |
| `gratefulVault` | `vault_flash` + `performanceScore ≥ 750`, or key | Vault 13 grateful · SYNAPSE radio |
| `colderIntel` | `intelDelta ≥ 2`, `regionIntel ≥ 3`, or key | Colder intel · Tyrone radio |

Kind-split beats (scout / raid / boss) apply to **both** `vault_flash` and
`intel_drop` before the boss catch-all, so `MissionSettled` + boss kind still
gets Named intel / Vault seals the hill when beatId says so.

`RaidOpened` foreshadows via `foreshadow_raid` / `foreshadow_boss`.
`BossCleared` seals the board as `atlas_scar` (scarred) or `board_seal`.

### Selectable `copyKey` hooks (Atlas)

Atlas may pin a Mythos key on `worldConsequence.offerMutations[].copyKey` or
pass `{ copyKey }` in `TheaterCopyContext` for next-offer / heat-scar projections:

| Key | Use |
|---|---|
| `scar_sector` / `atlas_scar` | Heat scar cell / boss board seal |
| `grateful_vault` / `colder_intel` | Consequence strip overrides |
| `board_seal` | Named-hill seal without scar tone |
| `foreshadow_raid` / `foreshadow_boss` | Day-board next-offer foreshadow |
| `next_offer_boost` / `next_offer_unlock` / `next_offer_cool` | Offer mutation strip voice |
| `vault_flash_*` / `intel_drop_*` | Kind-split settle keys (`scout`/`raid`/`boss`) |

Lookup without a full event: `theaterCopyByKey(key, region)`.
Exported catalog: `THEATER_COPY_KEYS` (**snake_case only** — Canon lock; no kebab aliases).


## Bible 6 — War journal copy contract (Mythos)

Vault projects durable rows from domain events only. Mythos owns **headline + radio**
one-liners. No cozy body paragraphs. No client-fabricated rows. Chrome/Forge must cite
`eventId` + `campaignRevision`.

**Journal theaters (only):** `MissionSettled` · `BossCleared` · `TransferSettled` · `DayAdvanced`

`RaidOpened` is foreshadow / day-board strip only — **not** a journal row.

```ts
// Vault row shape (Vault implements projection; Mythos fills headline+radio)
{
  eventId: string;
  theater: "MissionSettled" | "BossCleared" | "TransferSettled" | "DayAdvanced";
  campaignRevision: number;
  region: RegionId | null;
  kind: MissionKind | null;
  at: string; // ISO
  copyKey: TheaterCopyKey | null; // snake_case THEATER_COPY_KEYS or null
  headline: string;
  radio: string;
}
```

Selector: `journalCopyFor(event)` → `{ copyKey, headline, radio } | null`.
Returns `null` for non-journal theaters (e.g. `RaidOpened`). Reuses `theaterCopyFor`
voice — never invents a second copy path.

`copyKey` is a locked `THEATER_COPY_KEYS` value when the beat resolves one
(`vault_flash_*`, `intel_drop_*`, `atlas_scar`, `board_seal`, …). `DayAdvanced` and
`TransferSettled` may ship `copyKey: null` with headline+radio still set.

## Bible 7 — Day-cycle drama copy contract (Mythos)

Board offers rewrite from Kane heat / crisis / tribute / unanswered watches and from
Vault `worldConsequence.offerMutations` (`boost` | `unlock` | `cool`).

| Surface | Selector | Notes |
|---|---|---|
| Idle lead | `dayCycleIdleLead(ctx)` / `boardIdleLead(ctx)` | Priority: offer key → crisis/residue → unanswered → tribute → heat → dawn → calm |
| Next-offer strip | `dayCycleOfferStrip(op, region)` / `boardOfferStrip` | Maps op → `next_offer_boost` \| `next_offer_unlock` \| `next_offer_cool` via `theaterCopyByKey` |
| Pulse strip | `theaterCopyFor` (Atlas already) | Same tone; do not fork strings in projectors |

`offerMutations[].copyKey` **must** be a `THEATER_COPY_KEYS` snake_case value.
**No kebab aliases** (`scarred-sector` is illegal — use `scar_sector`).

Atlas owns projections / heat / offer graph. Mythos owns strings only.

## Consumers

| Consumer | How |
|---|---|
| DayBoard (Forge) | `selectDayBoardPulse(pulse)` → strip; `selectDayBoardOfferGraph(pulse)` → next-offer |
| WorldAtlas / region rim (Forge) | `selectAtlasHeat(pulse)` → rim tint / heat + lasting scar intensity |
| Vault flash / intel (Forge) | Queue VFX from `beatId` on revision beats |
| Pulse SSE | Streams live beats → `applyLiveBeat` |
| Bridge outbox | Vault *may* enqueue mapped `bridgeType` after settle; continuity policy gates memory |

## Handoffs

### Vault

- Migration `0018_hollow_domain_event` + append `MissionSettled` in settle TX
  (same TX as ticket settle + revision bump). Boss path: also append `BossCleared`
  with unique idempotency `boss-cleared:{ticketId}` when `boss_clears` flips.
- Unique settle key e.g. `settle:${ticketId}`; retries must not double-append.
- Include `region` / `kind` in domain payload so Atlas heat / scars are precise
  without waiting for snapshot merge.

#### Locked `MissionSettled` consequence schema

Keep **one domain row per ticket**. Heat / intel / beatId stay **top-level**.
`offerMutations` live **only** nested under `worldConsequence` (never duplicate
heat inside the bag).

```ts
// Top-level on MissionSettled payload (Vault)
heatDelta: number;          // defaults match Atlas defaultHeatDelta
intelDelta: number;
beatId: "vault_flash" | "intel_drop" | "boss_clear" | "mission_settle" | …;
region: RegionId;
kind: MissionKind;
theater: "MissionSettled";  // or separate BossCleared row on boss path

worldConsequence: {
  // offerMutations ONLY — no heatDelta / intelDelta / beatId here
  offerMutations: Array<{
    op: "boost" | "unlock" | "cool" | "heal";
    region: RegionId;
    kinds?: MissionKind[];
    weight?: number;       // optional signed weight hint
    reason: string;        // machine reason for Forge/debug
    copyKey?: string;      // Mythos selectable key only — Atlas does not invent copy
  }>;
};
```

Atlas projectors:

- `heatDelta` → atlas heat cells
- BossCleared / dense MissionSettled (`isScarWorthy`) → **lasting per-region scar**
- `worldConsequence.offerMutations` → day-board **next-offer graph**

### Pulse

- Own `GET /api/hollow/live`; emit `hello` → `revision` (with `eventType`) →
  `heartbeat`. Atlas only consumes.

### Forge

- Open EventSource to `/api/hollow/live`, call `applyLiveBeat`, pass selectors
  into DayBoard / Atlas. Do not invent heat math in components.

## Success criteria (this Atlas slice)

- Doc references live contract + domain/bridge alias map + locked Vault consequence schema
- Modules + `node:test`: live `revision` + `eventType: "MissionSettled"` bumps
  campaign revision; **with region** produces board strip beat + atlas heat/scar;
  **eventType-alone** is watermark-only (no invented sector scars)
- Stickier scars: BossCleared / dense MissionSettled set `deadZone` when boss/high;
  board `cool` never reduces scar intensity or clears deadZone; earned `heal`
  (or DayAdvanced heal-flavored mutation) is the only clear path
- Day-cycle drama: `DayAdvanced` + crisis/raid `offerMutations` rewrite strip/next-offer
  in the same projection pass — no component-invented heat
- Mythos `theaterCopyFor` / `theaterCopyByKey` only for player copy; `THEATER_COPY_KEYS`
  snake_case; optional `copyKey` hooks, no string rewrites
- No SSE route, no `0018` migration, no tyrone-bot / profile / snapshot edits,
  no `/api/rtc` bus, no Resonance live-cues


## Design Bible deepen (1 · 3 · 7)

Canon near-term bar for Atlas projectors:

| # | Bar | Projector rule |
|---|---|---|
| **1** | Stickier scars | `AtlasHeatScar.deadZone` for BossCleared / boss / high scar; survives board cool forever; heal only via `op: "heal"` or DayAdvanced heal-flavored reason/copyKey |
| **3** | Shared live marks | Soft-read Pulse revision extras (`region`, `kind`, `heatDelta`, `theater`, `worldConsequence`); second linked client paints the same scar without polling; `eventType`-alone = watermark only |
| **7** | Day-cycle drama | `DayAdvanced` + crisis/raid `offerMutations` rewrite day-board strip / next-offer graph; Mythos owns strip copyKeys |

Out of scope: tyrone-bot, profile cards, client mint, `/api/rtc` as world bus, inventing SSE fields beyond additive optional extras, Resonance live-cues.

## Forbidden

- Renaming bridge dotted types
- Editing tyrone-bot / profile cards / `tyrone_arcade_snapshot` as ledger
- Production data surgery
- Treating `hollow_world_event.delivery_status` as campaign authority
