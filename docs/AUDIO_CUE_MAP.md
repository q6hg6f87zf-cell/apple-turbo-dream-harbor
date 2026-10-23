# Hollow Realm audio cue map

Owner: **Resonance** (Audio). Partners: Forge (client path), Pulse (SSE), Atlas (theater names), Chrome (UI confirms).

Contract version: **1**

Doctrine: cues sell elite moments. Web Audio in `src/game/audio.ts` (Kenney CC0 samples + procedural fallback). Never block Vite load — decode lazily via `warmSfxSamples` / unlock. Never mint Caps, XP, or authority from audio.

## Live theater (Pulse SSE → Forge)

Revision beats on `GET /api/hollow/live` may carry `eventType` (PascalCase domain / theater names). Client path: `ServerLiveRuntime` → `playLiveEventCue(eventType)` in `src/game/live-cues.ts`.

| Cue id | SSE `eventType` | Trigger | Character | Priority | Implementation |
|---|---|---|---|---|---|
| `mission.settled` | `MissionSettled` | Fair settle / ticket settle lands on revision beat | Bright confirm triad + soft metal lock (~280ms) | High | **Wired** — `sfx.win` then `sfx.lockIn` |
| `transfer.settled` | `TransferSettled` | Vault transfer settle on revision beat | Coin chime + latch | High | Mapped; same player |
| `boss.cleared` | `BossCleared` | Named raid / boss clear on revision beat | Jackpot stack + trauma | Critical | Mapped; same player |
| `raid.opened` | `RaidOpened` | Raid open fanout on revision beat | Low deploy thump + click | High | Mapped; same player |

Unknown `eventType` values are ignored (no cue). Heartbeat / hello never play theater SFX.

## UI confirms

| Cue id | Trigger | Character | Priority | Implementation |
|---|---|---|---|---|
| `ui.confirm` | Primary button / confirm tap | Soft UI click | Medium | Existing `sfx.click` (e.g. `button.tsx`, HUD) |

Presence ticks and ambient beds stay on music bus / ambient (`startAmbient`); they are not theater one-shots.

## Integration fence

- Play only on the Forge/Pulse client path that already parses SSE (`server-live-runtime.tsx`).
- Do not invent a parallel settle poll just for audio.
- Do not touch economy authority, tyrone-bot, or profile cards.
- Mute / mix: honor `sfx` bus + mute flag in `audio.ts`.

## Next cues (not in this PR)

- Presence tick one-shot (soft tick, low priority, rate-limited)
- Vault flash layer sync with Lumina VFX
- Boss phase stingers keyed off Atlas theater beats beyond `BossCleared`
