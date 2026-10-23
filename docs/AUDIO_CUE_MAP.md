# Hollow Realm audio cue map

Owner: **Resonance** (Audio). Partners: Forge (client path), Pulse (SSE), Atlas (theater names), Chrome (UI confirms).

Contract version: **1.1**

Doctrine: cues sell elite moments. Web Audio in `src/game/audio.ts` (Kenney CC0 samples + procedural fallback). Never block Vite load — decode lazily via `warmSfxSamples` / unlock. Never mint Caps, XP, or authority from audio. Never own revision / applySnapshot (Forge).

## Live theater (Pulse SSE → Forge)

Revision beats on `GET /api/hollow/live` may carry `eventType` (PascalCase domain / theater names). Client path: `ServerLiveRuntime` → `playLiveEventCue(eventType)` in `src/game/live-cues.ts` **beside** Forge `playSettleSpectacle` ([PR #21](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/21)).

| Cue id | SSE `eventType` | Trigger | Character | Priority | Implementation |
|---|---|---|---|---|---|
| `mission.settled` | `MissionSettled` | Fair settle / ticket settle lands on revision beat | Bright confirm triad + soft metal lock (~280ms) | High | **Wired** — `sfx.win` then `sfx.lockIn` |
| `transfer.settled` | `TransferSettled` | Vault transfer settle on revision beat | Coin chime + latch | High | Mapped; same player |
| `boss.cleared` | `BossCleared` | Named raid / boss clear on revision beat | Jackpot stack + trauma | Critical | Mapped; same player |
| `raid.opened` | `RaidOpened` | Raid open fanout on revision beat | Low deploy thump + click | High | Mapped; same player |

Unknown `eventType` values are ignored (no cue). Heartbeat / hello never play theater SFX.

**MissionSettled success stays on this SSE `eventType` path** — do not duplicate via Atlas beatId.

## Atlas / Forge VFX beatIds (snake)

Forge settle theater VFX queue emits Atlas beatIds. Call `playAtlasBeatCue(beatId)` from the Forge emit / `playSettleSpectacle` site.

| Cue id | Atlas `beatId` | Trigger | Character | Priority | Implementation |
|---|---|---|---|---|---|
| `vault.flash` | `vault_flash` | Vault flash presentation | Unlock metal + coin sting | High | Mapped — ready for Forge emit |
| `intel.drop` | `intel_drop` | Intel drop on atlas / day board | Soft chip + click | Medium | Mapped — ready for Forge emit |
| `boss.cleared` | `boss_clear` | Boss clear VFX (same cue as SSE) | Jackpot stack | Critical | Mapped |
| `raid.opened` | `raid_opened` | Raid open VFX (same cue as SSE) | Deploy thump | High | Mapped |

On live `MissionSettled`, prefer **only** `playLiveEventCue("MissionSettled")` for settle success audio; use `playAtlasBeatCue("vault_flash")` when the vault flash is the primary audio moment (e.g. TransferSettled / HTTP vault-only), so settle + vault do not double-stack unless intended.

## UI confirms

| Cue id | Trigger | Character | Priority | Implementation |
|---|---|---|---|---|
| `ui.confirm` | Primary button / confirm tap | Soft UI click | Medium | Existing `sfx.click` (e.g. `button.tsx`, HUD) |

## Integration fence

- Keep SSE `eventType` → `playLiveEventCue` on `server-live-runtime.tsx` beside Forge spectacle.
- Forge calls `playAtlasBeatCue` for snake beatIds; Resonance does not own revision/applySnapshot.
- No economy authority, tyrone-bot, or profile cards.
- Mute / mix: honor `sfx` bus + mute flag in `audio.ts`.
