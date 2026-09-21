# Hollow Realm × TyroneBot bridge

Contract version: **1**

## Ownership

```
discord_user_id
      ├── TyroneBot Moon Squad profile   (community)
      └── Hollow Realm Hollow Soul       (game)
```

Tyrone memory is a third store. It is not a profile and not a soul.

A Hollow Soul must never replace or destroy a TyroneBot guild/member profile.

## Trust boundary

| Surface | Auth | Who |
|---|---|---|
| `/api/bridge/soul` | Bearer `HOLLOW_BRIDGE_KEY` | TyroneBot only |
| `/api/bridge/context` | Bearer `HOLLOW_BRIDGE_KEY` | TyroneBot only |
| `/api/bridge/memory` | Bearer `HOLLOW_BRIDGE_KEY` | TyroneBot only |
| `/api/bridge/events` | Bearer `HOLLOW_BRIDGE_KEY` | TyroneBot only |
| `/api/hollow/chronicle` | Rider cookie `hr_rider` | The signed-in Discord user, their own file only |

Browser cookies cannot call `/api/bridge/*`. Missing or malformed secrets fail closed (`401` / `503`). Unauthorized responses never include a soul payload.

Compare secrets with SHA-256 + `timingSafeEqual`. Never log tokens, cookies, or bridge keys.

## Environment

| Name | Owner | Purpose |
|---|---|---|
| `HOLLOW_BRIDGE_KEY` | both | Shared trusted-writer secret |
| `TYRONE_SYNC_WRITE_KEY` | both | Fallback secret (same value is fine) |
| `HOLLOW_REALM_URL` | TyroneBot | `https://thehollowrealm.com` |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Hollow Realm | OAuth only, never sent to TyroneBot |

## Failure modes

- Bridge key missing → `503 trusted sync disabled`. TyroneBot keeps the porch and does not invent game state.
- Discord feed channel missing/deleted/no permission → delivery `failed`, retry up to 3 times, never marked `delivered`.
- Duplicate memory or event → same id, original source and timestamp kept.
- Unknown deep link → ignored. Open redirects rejected.

## Discord delivery

The Postgres outbox is the source of truth.

`pending` → claim `delivering` → Discord send → ack `delivered` | `failed` | `skipped`

`delivering` is not pulled again. A restart after a successful send cannot double-post. A crash after claim and before send may drop that announcement (at-most-once, preferred over duplicates).

Failed Discord posts retry up to 3 times, then stay `failed`. They are never marked `delivered`.

TyroneBot also keeps a per-guild sqlite seen list (`guild:hollow-feed-seen:{guildId}`) on the Railway volume. That is a second belt. The outbox still wins.

## Deep links

`https://thehollowrealm.com/vault`
`https://thehollowrealm.com/inventory`
`https://thehollowrealm.com/world`
`https://thehollowrealm.com/profile`
`https://thehollowrealm.com/region/ironclad`

`/region/ironclad` redirects to `/?to=map&region=ironclad`.

## Production

1. Set the same `HOLLOW_BRIDGE_KEY` as a **sensitive** environment variable on Vercel (Hollow Realm, Production) and Railway (TyroneBot).
2. Copy the value from the Vercel dashboard (Project → Settings → Environment Variables → Reveal). Never paste it into Discord, GitHub, chat, or logs.
3. Redeploy both. Unauthorized `/api/bridge/*` stays `401` (wrong or missing bearer) or `503` (key not configured). The body never includes a soul.
4. Two real Discord accounts: A cannot see B's memories. Unlink leaves the Moon Squad profile intact.

## Tyrone continuity

See `docs/TYRONE_CONTINUITY.md`.

`GET /api/bridge/context` is the canonical Tyrone context service. It returns identity, relationship, relevant memories, active promises, recent major events, and a compact summary. It does not dump the ledger.

Promises are structured rows. Relationship writes go through validated deltas. Private memories never leave the owning Discord User ID. Gameplay events become memories only through `shouldCreateTyroneMemory` after `publishWorldEvent`; duplicate event ids cannot farm relationship or duplicate history.

Schema for bonds and promises is `migrations/0016_tyrone_continuity.sql`. The filesystem SQL smoke in `scripts/hollow-continuity-sql-smoke.test.mjs` applies every migration on PGlite and checks duplicate writes, two-user isolation, and fulfill.


## Deep links

`https://thehollowrealm.com/vault`
`https://thehollowrealm.com/inventory`
`https://thehollowrealm.com/world`
`https://thehollowrealm.com/profile`
`https://thehollowrealm.com/region/ironclad`
