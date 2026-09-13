alter table hollow_campaign_state
  add column if not exists campaign_day integer not null default 1,
  add column if not exists command_rank integer not null default 1,
  add column if not exists missions_since_day integer not null default 0,
  add column if not exists boss_clears jsonb not null default '{"ironclad":false,"slagtown":false,"blackspire":false,"brasswater":false,"veyra":false}'::jsonb,
  add column if not exists region_missions jsonb not null default '{"ironclad":0,"slagtown":0,"blackspire":0,"brasswater":0,"veyra":0}'::jsonb,
  add column if not exists region_intel jsonb not null default '{"ironclad":0,"slagtown":0,"blackspire":0,"brasswater":0,"veyra":0}'::jsonb,
  add column if not exists regional_materials jsonb not null default '{"ironclad":0,"slagtown":0,"blackspire":0,"brasswater":0,"veyra":0}'::jsonb;

create table if not exists hollow_mission_ticket (
  ticket_id text primary key,
  campaign_id text not null references hollow_campaign_state(campaign_id) on delete cascade,
  user_id text not null references hollow_identity_link(user_id) on delete cascade,
  start_request_id text not null,
  region text not null,
  mission_kind text not null,
  issued_at timestamptz not null default now(),
  available_at timestamptz not null,
  expires_at timestamptz not null,
  settled_at timestamptz,
  performance_score integer,
  reward jsonb,
  unique (user_id, start_request_id),
  check (length(ticket_id) between 24 and 96),
  check (length(start_request_id) between 12 and 96),
  check (region in ('ironclad','slagtown','blackspire','brasswater','veyra')),
  check (mission_kind in ('scout','forage','trade','raid','bounty','boss')),
  check (performance_score is null or performance_score between 0 and 1000)
);

create index if not exists hollow_mission_ticket_open_idx
  on hollow_mission_ticket(campaign_id, user_id, settled_at, expires_at);

create index if not exists hollow_mission_ticket_recent_idx
  on hollow_mission_ticket(issued_at desc);
