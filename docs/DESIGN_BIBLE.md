# Hollow Realm Design Bible v1.2

**Owner:** Canon (Creative Director)  
**Repo:** `q6hg6f87zf-cell/apple-turbo-dream-harbor`  
**Campaign:** `moon-squad` · Prod: https://thehollowrealm.com  
**Engineering spine:** [Live Authority Fabric](https://cursor.com/canvas/store-8e1bd1ab-5d66-441f-abad-8f985578d9db/353158fb-01f8-4eee-bd3e-bac86aca36b5)  
**Status:** Living doctrine. Canon revises. Teammates align; they do not fork tone.

Creative north star for an **elite** Hollow Realm: fantasy-tech Moon Squad, progression fantasy, a world that answers the player, and **fair but spectacular** payoffs. If a feature does not serve the priority stack below — cut it.

---

## Doctrine (one line)

Moon Squad runs an elite terminal into a shared Hollow. The browser is theater. Neon is the referee. Discord is a subscriber — never the mint. **Every meaningful act leaves a mark the rider can read.**

Tone: short, hard, radio-brief. Kane keeps receipts. Intel is the cheap blood. Named raids refuse to die twice. No cozy filler, no generic sci-fi grind, no client-minted spectacle.

Mythos / Atlas / Strike own story, world heat, and encounter fantasy **inside this voice**. Soften it and Canon rejects the PR.

---

## Elite priority stack (ship in this order)

These eight are the product bar. Work that does not advance one of them is out of scope until Canon promotes it.

| # | Priority | Player unlock | Owner lane |
| --- | --- | --- | --- |
| 1 | **Map-readable consequences** | After a sortie, the atlas shows scars/heals — heat, fog peel, dead zones that stay dead until earned | Atlas + Mythos; Vault events feed projections |
| 2 | **Multi-beat server-stamped sorties** | A run is ticket → encounter beats → sealed score → settle — each beat stamped by the server, not local improv | Strike + Vault; Forge presents stamps |
| 3 | **Shared live campaign pulses** | Linked riders feel the same Vault tick / revision pulse in sub-second time | Pulse; Chrome health pip only |
| 4 | **Sealed fair economy** | Caps, XP, favor, intel pay once; 0.55×–1.45× from performance; rank never scales; retries inert | Vault + Ledger + Sentinel |
| 5 | **One choreographed settle beat** | One climax sold together: Forge theater + Lumina VFX + Resonance SFX + Chrome HUD — same server beat, no freelancing | Forge / Lumina / Resonance / Chrome under Canon |
| 6 | **War journal / Vault history** | Riders can read what the campaign did — settles, bosses, transfers as durable history, not chat scroll | Vault projections + Mythos framing; Chrome surfaces |
| 7 | **Day-cycle drama** | Day board rewrites from Kane heat, crisis, tribute, unanswered watches — the compound has a day that matters | Mythos + Atlas; Ledger favor hooks |
| 8 | **Trust wall** | Sacred fences visible in product: no client mint, no profile-card risk, no Discord mint, localStorage is theater | Sentinel + Canon; all lanes enforce |

**Cut rule:** Static wallpaper (atlas/board/Vault/faction/fog that never reacts), second payout rails, settle freelancing across clients, arcade side-loops that steal from map consequences or the choreographed beat — cut without Canon exception.

---

## Pillars (map to the stack)

| Pillar | Serves priorities | Feel rule |
| --- | --- | --- |
| **Presence** | 3 | World feels occupied — squad in sectors, Vault humming |
| **Living World** | 1, 7 | Hollow remembers: atlas, board, Vault mood, favor, intel fog change on authority acts |
| **Cinematic settle** | 2, 5 | One auditable climax; multi-beat sortie stamps lead into one choreographed settle |
| **Integrity** | 4, 8 | No client mint, no double-credit ghosts; trust wall holds |
| **Spectacle** | 5, 6 | Read models + choreography + journal — living projections, not static HUD |
| **Latency** | 3 | Sub-second pulses; optimistic VFX only; law arrives as revision |

### Living World (player contract)

Meaningful acts are authority-backed (settled mission, boss clear, transfer, day advance). Each must change at least one of: **atlas** scars/heals, **day board** offers, **Vault mood**, **faction favor**, **intel fog**. Fake “world reacts” before revision/SSE is a trust-wall violation.

### Fair but spectacular (locked math — priority 4)

- Performance **0–1000** → **0.55×–1.45×** via `scaleAuthorityAmount` on scalable rewards only.
- **Command rank never scales payout.**
- Duplicate settle is inert: same reward, same revision, no second credit.
- Optimistic UI: VFX queues only — never balances, XP, boss flags, favor, or fog.

### Choreographed settle (priority 5)

One server-authored beat (e.g. `MissionSettled` + beat name). Forge animates, Lumina paints, Resonance cues, Chrome reflects — same payload. No lane invents a second climax or mint theater.

---

## What not to ship

Canon / Sentinel block on sight:

1. **tyrone-bot** changes, Discord / Moon Squad **rider profile cards**, rider identity store risk.
2. **Client mint** of caps, XP, rank, Pack, intel, bosses, day, ore, favor, atlas heat, or fog.
3. `localStorage` / `tyrone_arcade_snapshot` treated as ledger.
4. Double-pay (missing receipt / `settled_at` / unique domain event key in one TX).
5. `/api/rtc` used as world bus (P2P signaling only).
6. Discord/bridge blocking the ledger.
7. Soft-fail UX that hides authority rejection as success.
8. Side-loops that steal focus from priorities 1–5 without Canon sign-off.
9. Production balance surgery; non-additive history rewrites.
10. Cozy / apologetic / over-explained tone — Mythos/Atlas stay radio-brief.
11. **Static world content** that never reacts to settled acts.
12. Freelanced settle spectacle that implies credit before revision (breaks 5 + 8).
13. Anything that does not serve the elite priority stack.

---

## Shipped ground (review baseline)

| PR | What landed | Priority served |
| --- | --- | --- |
| [#13](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/13) Vault fair settle | Domain event + scaled settle same TX; `MissionSettled` beat | 2, 4, 5 (beat payload) |
| [#14](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/14) Pulse SSE | `GET /api/hollow/live` revision rail | 3 |
| [#17](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/17) Chrome live-rail pip | Read-only Pulse health | 3, 8 (`Live` / `Reconnecting`) |

Pulse ↔ Vault contract:

```json
{ "type": "revision", "campaignRevision": 0, "memberRevision": 0, "eventType": "MissionSettled" }
```

Equal revisions → no beat. Chrome pip: **`Live`** / **`Reconnecting`** only.

---

## PR review checklist

### Trust wall (8)
- [ ] No `tyrone-bot` / rider profile card stores
- [ ] No client mint path for economy, progression, favor, heat, fog
- [ ] Additive SQL only; no prod balance edits

### Sealed fair economy (4) + multi-beat sorties (2)
- [ ] Pay only through server commands
- [ ] Receipt + ticket guard + unique event key in one TX when credits move
- [ ] `scaleAuthorityAmount` once; rank does not scale
- [ ] Encounter beats feed sealed score; no second payout rail

### Map consequences (1) + day-cycle (7) + Living World
- [ ] Settled acts change atlas / board / Vault mood / favor / fog
- [ ] No new static wallpaper
- [ ] Projections from domain events — client does not invent scars

### Shared pulses (3) + choreographed settle (5)
- [ ] Live rail revision contract; `/api/rtc` untouched as bus
- [ ] One beat sold by Forge + Lumina + Resonance + Chrome together
- [ ] Pip stays health-only; no fake settle claims

### War journal (6)
- [ ] History surfaces cite server events; no fabricated journal rows

### Team lanes (ask Canon before crossing)
| Lane | Protects | Ask Canon before |
| --- | --- | --- |
| Vault | Authority, settle identity, journal projections | Settle math / event keys |
| Pulse | Live pulses | Fanout shapes that change timing |
| Forge | Client theater for the one settle beat | Competing climaxes |
| Atlas | Map-readable consequences | Heat that never reacts; gate fantasy breaks |
| Strike | Multi-beat stamped encounters | Score shortcuts; fights with no world mark |
| Mythos | Day-cycle drama, intel voice | Tone drift; static board copy |
| Chrome | HUD truth + pip | Chrome that lies about balances |
| Lumina / Resonance | Settle choreography legs | Spectacle without an authority beat |
| Ledger | Fair economy curves | Curves outside 0.55×–1.45× |
| Sentinel | Trust wall proofs | Waiving fair-settle / continuity smokes |

---

## Near-term bar by lane

**Atlas (1):** Heat/fog readable after settle — projections, not paint.  
**Strike (2):** Beats stamp toward sealed score; boss phases lethal, not flavor.  
**Pulse (3):** Keep revision rail healthy; no rtc overload.  
**Vault / Ledger / Sentinel (4, 8):** Hold sealed economy + trust wall.  
**Forge / Lumina / Resonance / Chrome (5):** One settle package on `MissionSettled`.  
**Mythos + Chrome (6, 7):** Journal + day-board drama from consequences, radio-brief.

---

## Working agreement

- Canon owns this file, the priority stack, and the cut list.
- Fabric architecture Page = engineering; this bible = elite player feel + ship gates.
- Docs-only PRs for bible edits when possible.
- Scale deeper by making the world answer and the settle sing — not by adding static rooms.
- When unsure: cut scope, keep elite, serve the stack.

