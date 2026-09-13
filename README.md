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
- Verified authority mode keeps Vault expansion locked until campaign progression and upgrade requirements are also server-owned.

LocalStorage remains a gameplay/cache layer during this migration. It is not considered a trusted source for linked rider economy values.

The authoritative card layer passed TypeScript, production build, the 2,500-run campaign simulation, server authority security smoke and iPhone-shaped gameplay smoke before this documentation-only update.

The next migration slice is server-owned campaign progression and reward issuance, followed by authoritative Vault expansion and inventory ownership.
