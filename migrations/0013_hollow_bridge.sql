-- Cross-platform Hollow Realm ↔ TyroneBot: events, Tyrone memory, audit.

create table if not exists hollow_world_event (
  id text primary key,
  event_type text not null,
  discord_id text,
  campaign_id text not null default 'moon-squad',
  importance integer not null default 3,
  visibility text not null default 'private',
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  delivery_status text not null default 'pending',
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  check (visibility in ('private', 'party', 'campaign', 'guild', 'public')),
  check (delivery_status in ('pending', 'delivered', 'skipped', 'failed')),
  check (importance between 0 and 10),
  check (length(event_type) between 3 and 64),
  check (length(idempotency_key) between 8 and 160)
);

create unique index if not exists hollow_world_event_idem_idx
  on hollow_world_event (idempotency_key);

create index if not exists hollow_world_event_pending_idx
  on hollow_world_event (delivery_status, created_at)
  where delivery_status = 'pending';

create table if not exists hollow_tyrone_memory (
  id text primary key,
  discord_id text not null,
  kind text not null,
  claim text not null,
  tags text[] not null default '{}',
  importance integer not null default 3,
  location_id text,
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'game',
  created_at timestamptz not null default now(),
  check (kind in ('episode', 'fact', 'promise', 'conversation')),
  check (source in ('game', 'discord', 'admin', 'world')),
  check (importance between 0 and 10),
  check (length(claim) between 4 and 480),
  check (length(discord_id) between 17 and 22)
);

create index if not exists hollow_tyrone_memory_rider_idx
  on hollow_tyrone_memory (discord_id, created_at desc);

create unique index if not exists hollow_tyrone_memory_idem_idx
  on hollow_tyrone_memory (discord_id, id);

create table if not exists hollow_bridge_audit (
  id bigserial primary key,
  action text not null,
  discord_id text,
  actor text not null default 'system',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (length(action) between 3 and 64)
);

create index if not exists hollow_bridge_audit_created_idx
  on hollow_bridge_audit (created_at desc);
