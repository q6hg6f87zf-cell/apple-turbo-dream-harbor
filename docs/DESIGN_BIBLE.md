# Hollow Realm Design Bible v1.3

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

| # | Priority | Player unlock | Owner lane | Status (post-#24) |
| --- | --- | --- | --- | --- |
| 1 | **Map-readable consequences** | After a sortie, the atlas shows scars/heals — heat, fog peel, dead zones that stay dead until earned | Atlas + Mythos; Vault events feed projections | **Ground in** (#20/#22/#16) — deepen scars that stick |
| 2 | **Multi-beat server-stamped sorties** | A run is ticket → encounter beats → sealed score → settle — each beat stamped by the server, not local improv | Strike + Vault; Forge presents stamps | **Landed** (#23/#24) — deepen beat prompts later |
| 3 | **Shared live campaign pulses** | Linked riders feel the same Vault tick / revision pulse **and** other riders' campaign marks in sub-second time | Pulse; Chrome health pip only | **OPEN — next** |
| 4 | **Sealed fair economy** | Caps, XP, favor, intel pay once; 0.55×–1.45× from performance; rank never scales; retries inert | Vault + Ledger + Sentinel | **Landed** (#13/#18/#23) — hold the wall |
| 5 | **One choreographed settle beat** | One climax sold together: Forge theater + Lumina VFX + Resonance SFX + Chrome HUD — same server beat, no freelancing | Forge / Lumina / Resonance / Chrome under Canon | **Landed M1** (#15/#16/#17/#21) — no second climax |
| 6 | **War journal / Vault history** | Riders can read what the campaign did — settles, bosses, transfers as durable history, not chat scroll | Vault projections + Mythos framing; Chrome surfaces | **OPEN — next** |
| 7 | **Day-cycle drama** | Day board rewrites from Kane heat, crisis, tribute, unanswered watches — the compound has a day that matters | Mythos + Atlas; Ledger favor hooks | **OPEN — next** |
| 8 | **Trust wall** | Sacred fences visible in product: no client mint, no profile-card risk, no Discord mint, localStorage is theater | Sentinel + Canon; all lanes enforce | **Standing** — never relax |

**Near-term focus (Canon):** priorities **3 · 6 · 7**. Cut or defer anything that does not advance those until they clear.

**Cut rule:** Static wallpaper (atlas/board/Vault/faction/fog that never reacts), second payout rails, settle freelancing across clients, arcade side-loops that steal from map consequences or the choreographed beat — cut without Canon exception.

---

## Next open briefs (3 · 6 · 7)

### 3 — Shared live campaign pulses (Pulse lead; Atlas/Mythos consume)

**Player feel:** Two linked riders on the same campaign see the *same* Vault tick land within a breath — and can tell another rider just scarred a sector or settled a raid without opening Discord.

**In:**
- Keep `GET /api/hollow/live` revision contract; equal revisions → no beat.
- Fanout that carries enough theater identity for Atlas `applyLiveBeat` (eventType / theater / region when known) so *other riders'* settles paint shared scars, not only the local memberRevision path.
- Chrome pip stays **`Live` / `Reconnecting`** — health only.

**Out:** `/api/rtc` as world bus; client-invented presence avatars; profile-card risk; chat as the pulse.

**Done when:** A second linked client shows the same campaignRevision advance and a readable world mark from another rider's `MissionSettled` / `BossCleared` without polling.

### 6 — War journal / Vault history (Mythos framing; Vault projections; Chrome surface)

**Player feel:** Kane's receipts survive the session. Riders open a journal and read *what the Hollow did* — sealed settles, boss clears, transfers — not a chat dump.

**In:**
- Durable rows projected from server domain events only (`MissionSettled`, `BossCleared`, `TransferSettled`, day advances).
- Mythos one-line radio framing per row (reuse `theater-copy` voice; no cozy recap paragraphs).
- Chrome/Forge surface that cites event id + revision — never fabricated filler rows.

**Out:** Client-authored diary; Discord backlog as history; rewriting past payouts.

**Done when:** After three sealed settles, a rider can re-open the journal and see three authority-backed entries with Mythos radio lines.

### 7 — Day-cycle drama (Mythos + Atlas; Ledger favor hooks)

**Player feel:** The compound's day *matters*. Board offers rewrite from Kane heat, crisis, tribute pressure, unanswered watches — not a static menu.

**In:**
- Consume Vault `offerMutations` / day-board pulse graph (`boost` / `unlock` / `cool`) already on the wire from world-consequence settle.
- Mythos board copy that shifts with day advance + crisis residue (radio-brief idle lead + strip).
- Atlas day-board strip stays projection-fed; no component-invented heat.

**Out:** Wallpaper board that ignores settles; favor mint on the client; soft day flavor with no offer graph change.

**Done when:** Settling a crisis/raid visibly rewrites at least one next-day offer or board strip line before the next login.

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
8. Side-loops that steal focus from priorities **3 · 6 · 7** (or reopen sealed 2/4/5 without Canon) without Canon sign-off.
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
| [#14](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/14) Pulse SSE | `GET /api/hollow/live` revision rail | 3 (rail) |
| [#15](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/15) Resonance settle SFX | Cue map + first `MissionSettled` SFX | 5 |
| [#16](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/16) Lumina spectacle kits | Settle kits + atlas scar/heal + day-board pulse | 1, 5, 7 (pulse feed) |
| [#17](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/17) Chrome live-rail pip | Read-only Pulse health | 3, 8 (`Live` / `Reconnecting`) |
| [#18](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/18) Economy favor base | Fair-settle scale readable | 4 |
| [#19](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/19) Design Bible v1.2 | Elite stack locked | — |
| [#20](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/20) World-event theater | Catalog + pulse projections | 1, 7 |
| [#21](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/21) Forge settle theater | `MissionSettled` vault/intel + revision-gated apply | 5 |
| [#22](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/22) Vault world-consequence | `MissionSettled` / `BossCleared` `offerMutations` | 1, 7 |
| [#23](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/23) Honest settle | Scale from sealed performance only | 2, 4 |
| [#24](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/24) Server sortie plan | `sortie_plan` intel→approach→crisis→extract | 2 |

Pulse ↔ Vault contract:

```json
{ "type": "revision", "campaignRevision": 0, "memberRevision": 0, "eventType": "MissionSettled" }
```

equal revisions → no beat. Chrome pip: **`Live`** / **`Reconnecting`** only.

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
- [ ] Day-board / offer graph moves on authority acts (priority 7)

### Shared pulses (3) + choreographed settle (5)
- [ ] Live rail revision contract; `/api/rtc` untouched as bus
- [ ] Other riders' campaign marks land as shared theater, not local-only
- [ ] One beat sold by Forge + Lumina + Resonance + Chrome together
- [ ] Pip stays health-only; no fake settle claims

### War journal (6)
- [ ] History surfaces cite server events; no fabricated journal rows
- [ ] Mythos radio framing only — no cozy recap paragraphs

### Team lanes (ask Canon before crossing)
| Lane | Protects | Ask Canon before |
| --- | --- | --- |
| Vault | Authority, settle identity, journal projections | Settle math / event keys |
| Pulse | Live pulses (priority 3) | Fanout shapes that change timing or strip theater identity |
| Forge | Client theater for the one settle beat | Competing climaxes |
| Atlas | Map-readable consequences + day-board projections | Heat that never reacts; gate fantasy breaks |
| Strike | Multi-beat stamped encounters | Score shortcuts; fights with no world mark |
| Mythos | Day-cycle drama, journal voice, intel | Tone drift; static board copy |
| Chrome | HUD truth + pip + journal surface | Chrome that lies about balances |
| Lumina / Resonance | Settle choreography legs | Spectacle without an authority beat |
| Ledger | Fair economy curves | Curves outside 0.55×–1.45× |
| Sentinel | Trust wall proofs | Waiving fair-settle / continuity smokes |

---

## Near-term bar by lane

**Pulse (3 — lead):** Shared campaign pulses of *other* riders — fanout keeps theater identity; no rtc bus; Chrome pip stays health-only.  
**Mythos (6 + 7 — lead voice):** War-journal radio lines from domain events; day-board drama copy that moves with `offerMutations` / day advance — radio-brief, never cozy.  
**Atlas (1 deepen + 7 projectors):** Stickier scars from shared pulses; day-board strip + next-offer graph stay projection-fed; consume Pulse beats for other-rider marks.  
**Vault:** Journal projections for (6); keep `offerMutations` honest for (7).  
**Chrome:** Journal surface for (6); pip unchanged.  
**Strike / Forge / Lumina / Resonance / Ledger / Sentinel:** Hold landed 2/4/5/8 — no scope steal from 3·6·7 without Canon.

---

## Working agreement

- Canon owns this file, the priority stack, and the cut list.
- Fabric architecture Page = engineering; this bible = elite player feel + ship gates.
- Docs-only PRs for bible edits when possible.
- Scale deeper by making the world answer and the settle sing — not by adding static rooms.
- When unsure: cut scope, keep elite, serve the stack — right now **3 · 6 · 7**.
