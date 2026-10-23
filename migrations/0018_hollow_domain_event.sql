-- Live Authority Fabric Milestone 1: append-only domain event log.
-- MissionSettled shares the settle transaction with ticket_guard so retries
-- cannot double-append credits. Additive only; projections stay on
-- hollow_campaign_state / hollow_campaign_member.

create table if not exists hollow_domain_event (
  event_id text primary key,
  campaign_id text not null references hollow_campaign_state(campaign_id) on delete cascade,
  user_id text references hollow_identity_link(user_id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  request_id text,
  ticket_id text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  check (length(event_id) between 8 and 96),
  check (length(event_type) between 2 and 64),
  check (length(idempotency_key) between 8 and 160),
  check (request_id is null or length(request_id) between 12 and 96),
  check (ticket_id is null or length(ticket_id) between 24 and 96)
);

create unique index if not exists hollow_domain_event_idem_uidx
  on hollow_domain_event (idempotency_key);

-- One MissionSettled row per ticket — second line of defense beside settled_at.
create unique index if not exists hollow_domain_event_mission_settled_ticket_uidx
  on hollow_domain_event (campaign_id, event_type, ticket_id)
  where event_type = 'MissionSettled' and ticket_id is not null;

create index if not exists hollow_domain_event_campaign_created_idx
  on hollow_domain_event (campaign_id, created_at desc);

create index if not exists hollow_domain_event_type_created_idx
  on hollow_domain_event (event_type, created_at desc);
