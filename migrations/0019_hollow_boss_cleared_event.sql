-- Live Authority Fabric: one BossCleared companion row per settled boss ticket.
-- Appended in the same Neon TX as MissionSettled + ticket_guard so retries
-- cannot double-append. Additive only.

create unique index if not exists hollow_domain_event_boss_cleared_ticket_uidx
  on hollow_domain_event (campaign_id, event_type, ticket_id)
  where event_type = 'BossCleared' and ticket_id is not null;
