create table if not exists tyrone_arcade_snapshot (
  discord_id text primary key,
  display_name text not null,
  caps bigint not null default 0,
  xp bigint not null default 0,
  level integer not null default 1,
  pack jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  check (length(discord_id) between 17 and 22),
  check (caps between 0 and 2000000000),
  check (xp between 0 and 2000000000),
  check (level between 1 and 1000)
);

create index if not exists tyrone_arcade_snapshot_updated_idx
  on tyrone_arcade_snapshot(updated_at desc);

create table if not exists hollow_identity_link (
  user_id text primary key,
  discord_id text unique not null references tyrone_arcade_snapshot(discord_id) on delete cascade,
  linked_at timestamptz not null default now()
);
