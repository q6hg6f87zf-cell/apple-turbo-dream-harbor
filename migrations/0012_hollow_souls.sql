create table if not exists hollow_souls (
  discord_id text primary key,
  operative jsonb not null,
  forged_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(discord_id) between 17 and 22)
);

create unique index if not exists hollow_mission_ticket_one_open_boss_idx
  on hollow_mission_ticket (campaign_id, region)
  where settled_at is null and mission_kind = 'boss';
