# Hollow Realm

## Server authority migration

Hollow Realm now has a staged server-authoritative path for verified TyroneBot riders.

- Public URL parameters cannot mint caps, XP, rank or Pack items.
- TyroneBot writes require a trusted server key.
- Identity linking uses short-lived one-time claims with only claim hashes stored server-side.
- Verified riders join the shared `moon-squad` campaign economy.
- Vault 13 treasury caps and each linked rider's Moon Squad bank-card caps settle on the server.
- Vault → card, card → Vault and linked rider → linked rider transfers are atomic and idempotent.
- Duplicate request IDs cannot double-credit or double-debit caps.
- Overdrafts and transfers to unlinked riders are rejected server-side.
- The client refreshes authoritative card/treasury values on focus and on a light polling interval.

### Campaign progression and reward issuance

Verified riders no longer mint campaign day, intel, boss clears, caps, ore, favor, rider XP, resident XP or sortie loot on the device.

- Missions start as server tickets and pay only through `settle_mission`.
- Performance score scales the issued reward (0 → 0.55×, 500 → 1.00×, 1000 → 1.45×). Command rank does not scale.
- Duplicate ticket ids and request ids cannot double-pay.
- A settled raid, bounty or boss writes the world event from the server so Tyrone memory cannot be farmed by a client retry.
- Vault facility and resident-quarter upgrades settle on the server against day, rank, bosses, riders and trained residents.

LocalStorage remains a theater/cache layer during this migration. It is not considered a trusted source for linked rider economy values.

The next migration slice is finishing authoritative inventory ownership for every remaining acquisition path.
