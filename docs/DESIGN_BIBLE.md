# Hollow Realm Design Bible v1.1

**Owner:** Canon (Creative Director)  
**Repo:** `q6hg6f87zf-cell/apple-turbo-dream-harbor`  
**Campaign:** `moon-squad` · Prod: https://thehollowrealm.com  
**Engineering spine:** [Live Authority Fabric](https://cursor.com/canvas/store-8e1bd1ab-5d66-441f-abad-8f985578d9db/353158fb-01f8-4eee-bd3e-bac86aca36b5)  
**Status:** Living doctrine. Canon revises. Teammates align; they do not fork tone.

This is the creative north star: fantasy-tech Moon Squad, progression fantasy, a **living world that changes when the player acts**, and what **fair but spectacular** means in player terms. If a feature dilutes elite feel — or leaves the Hollow static — cut it.

---

## Doctrine (one line)

Moon Squad runs an elite terminal into a shared Hollow. The browser is theater. Neon is the referee. Discord is a subscriber — never the mint. **Every meaningful act leaves a mark the rider can see.**

Tone: short, hard, radio-brief. Kane keeps receipts. Intel is the cheap blood. Named raids refuse to die twice. No cozy filler, no generic sci-fi grind copy, no client-minted spectacle.

Mythos / Atlas / Strike own story, world heat, and encounter fantasy **inside this voice**. Soften it and Canon rejects the PR.

---

## Six pillars (player → feel → eng)

| Pillar | Player moment | Feel rule | Eng spine (do not invent) |
| --- | --- | --- | --- |
| **Presence** | Squadmates in sectors, Vault 13 humming, parties forming | The world feels occupied | Presence / activity projections; keep `/api/rtc` as P2P only |
| **Living World** | After a sortie, the atlas scars or cools; day-board offers rewrite; Vault mood / faction favor / intel fog shift | The Hollow remembers what you did — no static wallpaper content | Domain events → world projections (atlas heat, board pulse, favor, fog); Mythos/Atlas/Strike author the scars; client only presents |
| **Cinematic settle** | One mission arc: ticket → encounter → settle → vault flash / intel / boss beat | One auditable climax the party can trust | `settle_mission` only pay path; server-authored beats |
| **Integrity** | Ranked progression that feels fair | No client mint, no double-credit ghosts | `hollow_command_receipt` + ticket `settled_at` + unique domain event keys in one TX |
| **Spectacle** | Day board, atlas heat, treasury pulse, living rider cards as projections | Living read models, not static HUD | Projectors from domain events; Forge/Lumina/Resonance sell the beat |
| **Latency** | Settle hits sub-second; authority corrects with revision | Optimistic VFX only; balances wait for law | SSE revision rail (`GET /api/hollow/live`); demote 30s poll while healthy |

### Living World (player contract)

Meaningful acts are authority-backed (settled mission, boss clear, transfer, day advance — not UI clicks). Each must change at least one of:

1. **Atlas** — sector heat scars (raid/boss) or heals (scout/intel spend that cools a site). Dead zones stay dead until earned.
2. **Day board** — offers rewrite from consequences (Kane heat, unanswered watches, crisis, tribute pressure). A board that never reacts is cut.
3. **Vault mood** — treasury pulse and chrome tone track campaign revision / recent settles, not a frozen splash.
4. **Faction favor** — Kane / AEGIS / region factions shift on loud vs quiet work; favor is server truth.
5. **Intel fog** — scout and settle peel fog; failure and time can thicken it. Fog is a projection, not localStorage decoration.

**Cut rule:** If content never reacts to player authority outcomes, it is static wallpaper — cut or wire it to a domain event. Captivating imagination means the world answers back.

### Fair but spectacular (locked math)

- Performance score **0–1000** → **0.55×–1.45×** via `scaleAuthorityAmount` on scalable rewards only.
- **Command rank never scales payout.**
- Retry / duplicate settle is inert: same reward, same revision, no second credit.
- Optimistic UI: local VFX queues only. Never optimistic for balances, XP, boss flags, favor, or fog.

---

## What not to ship

Hard cuts — Canon / Sentinel block on sight:

1. **tyrone-bot** changes, Discord profile / Moon Squad **rider profile cards**, or anything that risks rider identity stores.
2. **Client mint** of caps, XP, rank, Pack, intel, boss clears, day, ore, favor, atlas heat, or fog.
3. Treating `localStorage` or `tyrone_arcade_snapshot` as the ledger (silent snapshot clobber).
4. Double-pay paths (missing receipt / `settled_at` / unique event key in the same TX).
5. Overloading `/api/rtc` as the world bus (signaling only).
6. Discord / bridge delivery blocking the game ledger.
7. Soft-fail UX that hides authority rejection as “success theater.”
8. Random arcade / side-loop features that steal focus from campaign settle, vault pulse, or named raids without Canon sign-off.
9. Production balance surgery or rewriting history rows in place (additive migrations only).
10. Tone that apologizes, over-explains, or cosplays cozy — Mythos/Atlas stay radio-brief.
11. **Static world content** — atlas tiles, day-board jobs, Vault chrome, faction lines, or intel fog that never change after a settled act.
12. Fake “world reacts” theater that implies scars/favor/fog before a revision-bearing snapshot or SSE beat.

---

## Shipped ground (review baseline)

| PR | What landed | Player unlock |
| --- | --- | --- |
| [#13](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/13) Vault Milestone 1 | `hollow_domain_event` + scaled settle in same TX as ticket guard; `MissionSettled` beat payload | First fair settle — vault flash / intel ready, retries inert |
| [#14](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/14) Pulse SSE | `GET /api/hollow/live` revision rail; poll demotion while healthy | Sub-second settle fanout for linked riders |
| [#17](https://github.com/q6hg6f87zf-cell/apple-turbo-dream-harbor/pull/17) Chrome live-rail pip | Read-only Pulse health HUD | `Live` / `Reconnecting` — no balance claims |

Contract Pulse locked with Vault:

```json
{ "type": "revision", "campaignRevision": 0, "memberRevision": 0, "eventType": "MissionSettled" }
```

Equal revisions → no beat. `/api/rtc` stays P2P. Chrome pip copy locked: **`Live`** / **`Reconnecting`** (read-only rail health).

---

## PR review checklist (Canon + owners)

Use on every Hollow Realm PR. Especially Strike / Forge / Atlas / Mythos / Chrome / Lumina / Resonance follow-ups.

### Sacred fences
- [ ] No `tyrone-bot` tree or Discord rider profile card stores touched
- [ ] No path for public URL / client to mint economy, progression, favor, heat, or fog
- [ ] Additive SQL only; no in-place history rewrites; no prod balance edits

### Fair settle / integrity
- [ ] Pay only through server commands (`settle_mission` / economy CTEs)
- [ ] Receipt + ticket guard + unique domain event key share one TX where credits move
- [ ] `scaleAuthorityAmount` applied once; rank does not scale
- [ ] Duplicate request / ticket settle leaves balances and event count unchanged

### Living World
- [ ] Meaningful settle/clear/transfer/day-advance changes atlas, board, Vault mood, favor, and/or intel fog
- [ ] No new static wallpaper (offers, heat, fog, faction lines that ignore outcomes)
- [ ] World scars/heals are projections from domain events — client does not invent them
- [ ] Mythos / Atlas / Strike copy and gates stay radio-brief and consequence-linked

### Feel / spectacle
- [ ] Server authors the beat name (`vault_flash`, intel, boss clear, etc.); client animates, does not invent rewards
- [ ] Optimistic UI limited to VFX; balances / XP / boss flags / favor / fog wait for revision or SSE
- [ ] Presence / atlas heat driven by server truth, not localStorage guesses
- [ ] Mythos/Atlas copy matches radio-brief voice (see `event-theater` KIND_WHY / RADIO)

### Latency / rails
- [ ] Live rail uses revision contract; does not overload `/api/rtc`
- [ ] Pollers demote while SSE healthy; resume on drop
- [ ] Bridge / Discord remains optional outbox — ledger never waits
- [ ] Live-rail HUD pip stays health-only (`Live` / `Reconnecting`) — no fake settle claims

### Team lanes (ask Canon before crossing)
| Lane | Protects | Ask Canon before |
| --- | --- | --- |
| Vault | Authority fabric, settle integrity | Changing settle math or event identity |
| Pulse | Live presence / SSE feel | New fanout shapes that change player timing |
| Forge | Elite client theater | New surfaces that compete with settle climax |
| Atlas | World / campaign heat, living atlas scars | Region / boss fantasy that breaks gate fantasy; heat that never reacts |
| Strike | Encounter / combat feel, score that feeds settle | Payout or gate shortcuts that skip performance score; fights with no world consequence |
| Mythos | Mission intel / boss framing / day-board voice | Tone drift; lore that softens Kane / Hollow stakes; static board copy |
| Chrome | HUD / vault-card readability | Chrome that hides revision law or lies about balances |
| Lumina / Resonance | Visual / audio payoff | Spectacle without an authority beat to hang on |
| Ledger | Vault 13 / banks / live ops / favor curves | Reward curves outside 0.55×–1.45× doctrine |
| Sentinel | Anti-cheat proofs / smoke | Waiving fair-settle or continuity smokes |

---

## Upcoming bar — Mythos / Atlas / Strike / Forge

**Mythos:** Day-board and intel lines rewrite from consequences (Kane heat, crisis, tribute, fog peel). No eternal static jobs. Voice stays radio-brief.

**Atlas:** Atlas heat and region fantasy scar on raid/boss and cool on earned intel — projections, not paint. Dead content that never updates is cut.

**Strike:** Encounter performance feeds the sealed score settle already scales. Boss phases stay readable and lethal — “phases are not flavor.” A fight that does not change the world (heat, favor, fog, board) is incomplete.

**Forge:** Sell the beats Vault/Pulse already emit. Vault flash + intel tick on `MissionSettled` first. Vault mood chrome tracks living revision. No fake mint animations before revision. Cut clutter that dilutes the settle climax.

---

## Working agreement

- Canon owns this file and the creative cut list.
- Fabric architecture Page stays engineering doctrine; this bible stays player feel + ship gates.
- No code from a bible-only edit. Ship bible changes as their own docs PR when possible.
- Scale deeper/richer by making the world answer — not by adding static rooms.
- When unsure: cut scope, keep elite, make the Hollow remember.

