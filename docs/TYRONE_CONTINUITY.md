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
| Promises | Primary feature of this phase |
| `relationship.trust` | Bond |
| `relationship.familiarity` | Bond |
| `relationship.respect` | Bond |
| `relationship.conflict` | Bond |
| `relationship.sharedHistory` | Bond |
| `relationship.concern` | Bond |
| `relationship.loyalty` | Bond |
| `relationship.humor` | Stored so both sides read the same number. No auto-mutation this phase |

Provenance on every canonical memory: `game` / `discord` / `system` / `admin` / `world`.
Original source and `created_at` are never overwritten on duplicate write.
Default scope is `private`.

### Session-local (stay on the save file / process)

| Field | Why |
|---|---|
| `cooldowns` | Speech / hint windows |
| `lastSpeechAt`, `lastSpeechConcept`, `lastSilentReason`, `lastSpeakReason`, `speechCount` | Anti-spam |
| `working` | Recent UI trail |
| `utterance` | Current line |
| `failedBeats` | Current sortie |
| `settings.assist`, `settings.showNumbers` | Game chrome preference |
| Dawn / roll / “steel came out” / market-buy episodes | Noise. Not a surveillance log |
| Compact snapshot (`TyroneSnap`) | Diff fuel for ingest |
| Live combat, screen, talk overlay, mission beat | Temporary |

If a field was uncertain, it stayed local.

### TyroneBot-only (not this store)

Porch Dust→Reckoned (`familiarity.js`), guild `relationshipLedger`, Smart Chat topic affinity,
conversation sessions. Those are Moon Squad community manners. They are not Hollow bond.

Do not copy caps, inventory, soul, or progression onto a Moon Squad profile.
Do not move Moonhand / TikTok / Ethera / tickets into Hollow Realm.

## Canonical service

`GET /api/bridge/context?discord=&q=` (TyroneBot bearer) and rider `GET /api/hollow/chronicle`
assemble `getTyroneContext(discordId, query)`:

identity · relationship · relevant memories · active promises · recent major events ·
campaign facts · character · region if known

Hard limit on memories. Relevance, not a dump. Failures degrade; they do not stall the game.
The AI may only state values present in `facts`, `memories`, or `promises`.

## Promises

Structured rows in `hollow_tyrone_promise`. Created only from explicit intent
(`parsePromiseFromText`) or a game `kind: "promise"` memory. Duplicate writes keep
the original source.

Statuses: `active` · `fulfilled` · `broken` · `cancelled` · `expired`.

When the rider enters a matching region, the game asks `/api/hollow/chronicle` with
`player.entered_region` (assist and combat included). If the server returns a
surface hit, Tyrone speaks it and marks the promise surfaced. Assist off and live
combat stay silent. Local `considerTyroneHint` may also speak from hydrated
promises; the same concept cooldown stops a double line.

Kept `prm-*` ids POST `{ promise: { action: "fulfill", id } }`. That writes a
fulfilled row, a private episode, and a small trust/loyalty bump.

## Relationship

`hollow_tyrone_bond` is one row per Discord User ID. Mutations go through
`recordRelationshipEvent` (validated field, bounded delta, required reason).
Each change is logged on `hollow_tyrone_bond_event`. Humor is stored and readable
on both sides; it is not auto-mutated this phase.

## Privacy

Memories default to `private`. USER B never reads USER A's bond, promises, or
memories. `/api/bridge/*` rejects browser cookies. Unlink does not destroy the
Moon Squad profile.

## Proven vs remaining

Proven in code and tests:

- Identity split (Hollow fields rejected on Moon Squad profiles)
- Promise parse / trigger / anti-spam / two-user isolation (in-memory)
- SQL schema + insert/duplicate/fulfill/bond/isolation (PGlite applying `migrations/*.sql` from disk)
- Unauthorized production context stays `401` with no soul

Not yet live-proven as one person:

- TyroneBot on Railway must use the same `HOLLOW_BRIDGE_KEY` already set on Vercel
- Two real Discord accounts walking the Ironclad tower loop
- Discord feed restart chaos (unit-proven; not a live restart)

Do not claim Tyrone is fully unified until that two-user walk passes.
Do not paste the bridge key into Discord, GitHub, chat, or logs.
