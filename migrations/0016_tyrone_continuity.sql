-- Canonical Tyrone relationship + structured promises.
-- Memories stay private by default. Duplicate writes keep original source/time.

alter table hollow_tyrone_memory drop constraint if exists hollow_tyrone_memory_source_check;
alter table hollow_tyrone_memory add constraint hollow_tyrone_memory_source_check
  check (source in ('game', 'discord', 'admin', 'world', 'system'));

alter table hollow_tyrone_memory add column if not exists visibility text not null default 'private';
alter table hollow_tyrone_memory drop constraint if exists hollow_tyrone_memory_visibility_check;
alter table hollow_tyrone_memory add constraint hollow_tyrone_memory_visibility_check
  check (visibility in ('private', 'campaign', 'guild', 'public'));

alter table hollow_tyrone_memory add column if not exists related_event_id text;
alter table hollow_tyrone_memory add column if not exists poi_id text;

create table if not exists hollow_tyrone_bond (
  discord_id text primary key,
  trust numeric not null default 42,
  familiarity numeric not null default 6,
  respect numeric not null default 32,
  conflict numeric not null default 4,
  shared_history numeric not null default 0,
  humor numeric not null default 18,
  concern numeric not null default 12,
  loyalty numeric not null default 48,
  updated_at timestamptz not null default now(),
  check (length(discord_id) between 17 and 22)
);

create table if not exists hollow_tyrone_bond_event (
  id text primary key,
  discord_id text not null,
  field text not null,
  previous numeric not null,
  next numeric not null,
  reason text not null,
  source text not null default 'system',
  event_type text,
  created_at timestamptz not null default now(),
  check (length(discord_id) between 17 and 22),
  check (length(reason) between 2 and 160)
);

create index if not exists hollow_tyrone_bond_event_rider_idx
  on hollow_tyrone_bond_event (discord_id, created_at desc);

create table if not exists hollow_tyrone_promise (
  id text primary key,
  discord_id text not null,
  kind text not null,
  subject text not null,
  status text not null default 'active',
  source text not null,
  region_id text,
  location_id text,
  poi_id text,
  tags text[] not null default '{}',
  importance integer not null default 5,
  related_memory_id text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  last_surfaced_at timestamptz,
  check (kind in ('return', 'intention', 'keep', 'warning')),
  check (status in ('active', 'fulfilled', 'broken', 'cancelled', 'expired')),
  check (source in ('game', 'discord', 'system', 'admin')),
  check (importance between 0 and 10),
  check (length(discord_id) between 17 and 22),
  check (length(subject) between 2 and 160)
);

create unique index if not exists hollow_tyrone_promise_idem_idx
  on hollow_tyrone_promise (discord_id, id);

create index if not exists hollow_tyrone_promise_active_idx
  on hollow_tyrone_promise (discord_id, status, created_at desc);
