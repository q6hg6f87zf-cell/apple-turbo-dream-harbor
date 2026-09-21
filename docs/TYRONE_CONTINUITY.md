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

`getTyroneContext(discordId, query)` returns only:

identity · relationship · relevant memories · active promises · recent major events ·
campaign facts · character · region if known

Hard limit on memories. Relevance, not a dump. Failures degrade; they do not stall the game.
