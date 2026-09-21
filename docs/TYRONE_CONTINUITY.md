# Tyrone continuity

One Tyrone. One relationship. One history. Discord User ID is the link.

Moon Squad Profile, Hollow Soul, and Tyrone Memory stay three records.

## TyroneMind classification

Inspected: `src/game/tyrone-mind.ts`, `src/game/types.ts`, `src/game/tyrone-voice.ts`,
TyroneBot `familiarity.js`, `relationshipLedger.js`, `riderMemory.js`, `conversationState.js`.

### Persistent cross-platform (canonical, server)

| Field | Why |
|---|---|
| Important episodic memories (`importance >= 5` or `permanent`) | Shared history |
| Semantic facts that were written as canonical memories | Player-true claims |
| Promises | Structured, not raw chat |
| Event memories (boss, death, major sortie, rare find, kept/broken word) | What actually happened |
| `relationship.*` except humor auto-mutation | Bond |
| `relationship.humor` | Stored, read-only |

Provenance on every canonical memory: `game` / `discord` / `system` / `admin` / `world`.
Original source and `created_at` are never overwritten on duplicate write.
Default scope is `private`.

### Session-local (stay on the save file / process)

Speech cooldowns, current combat, screen, utterance, failed beats, assist chrome,
dawn/roll/market noise, compact snapshot, live overlay.

### TyroneBot-only (not this store)

Porch Dust→Reckoned, guild `relationshipLedger`, Smart Chat, tickets, Moonhand, TikTok, Ethera.

## Event architecture (reuse, do not duplicate)

Authoritative table: `hollow_world_event`. Client posts through `/api/hollow/chronicle`.
`publishWorldEvent` is the only writer. After a **new** insert it runs `afterEventPublished`:
memory (if the policy says so) → relationship consequence → promise resolve.
Retries with the same idempotency key return `duplicate: true` and do nothing else.

| Event | Published | Memory | Bond | Notes |
|---|---|---|---|---|
| `boss.defeated` | yes | major/critical | small shared victory | payload must carry boss name if known |
| `boss.failed` | catalog ready | major | shared failure | emit when a boss sortie wipes |
| `character.forged` | yes | major | familiarity +1 | server ingest, not a second client memory |
| `character.died` | yes | major | concern +1 | first death per operative id |
| `mission.completed` | yes | raid/boss/bounty only | sharedHistory +1 | scout/forage excluded |
| `mission.failed` | yes | raid/boss only | concern +1 | can break a `keep` promise on that ground |
| `region.unlocked` | yes | notable except start Ironclad | familiarity +1 | |
| `rare_item.found` / `legendary_item.found` | yes | if a real item name is on the payload | legendary only | no common loot |
| `tyrone.promise_fulfilled` / `_broken` | yes | major | ±trust | private |
| `campaign.day_advanced` | yes | **none** | none | telemetry |
| `player.joined` / `boss.engaged` / `tyrone.memory_recorded` / `tyrone.promise_created` | catalog | **none** | none | noise or already represented |

Game → memory never goes through a second event bus.

## Meaningful-memory policy

`shouldCreateTyroneMemory` / `composeEventMemory` in `continuity-core.ts`.

Tyrone remembers a life, not a telemetry stream. Claims are composed only from
fields the event actually contains. Duplicate `related_event_id` cannot create a
second row (`0017` unique index).

Future consolidation: `consolidation_group` is stored now. Do not delete history
in this phase.

## Relationship consequence

`RELATIONSHIP_RULES` maps an event type to **small** deltas (usually ±1) on the
existing 0–100 scale. Humor stays read-only. Every mutation writes
`hollow_tyrone_bond_event` with previous/next/reason/source event. Unique
`(discord_id, field, source_event_id)` makes retry farming a no-op.

## Promises

Recall ≠ fulfill. Combat, assist-off, and live dialogue **do not consume** a
recall. After combat, the same ground can surface the line. Fulfillment happens
when a real event satisfies it (mission/boss on that ground, or matching POI).
A return promise is not auto-broken by a wipe. Only `kind: keep` plus
`mission.failed` on that ground, or an explicit break.

## Privacy

Event memories default **private**. Guild feed events (`boss.defeated` visibility
guild) are announcements, not a public personal ledger. USER B cannot read
USER A's bond, promises, or memories.

## Discord

`/hollow ask` answers "what have we been through", "why do you trust me",
"did I keep my word", and boss/region questions from `relationshipWhy` and
event memories. Missing history is "I do not have that information." Numbers
like `trust: 7` are not spoken.

## Failure

Ingest is fail-open. A memory/relationship error never blocks boss rewards,
mission completion, or progression.
