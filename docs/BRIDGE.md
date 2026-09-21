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

## Deep links

`https://thehollowrealm.com/vault`
`https://thehollowrealm.com/inventory`
`https://thehollowrealm.com/world`
`https://thehollowrealm.com/profile`
`https://thehollowrealm.com/region/ironclad`
