alter table hollow_mission_ticket
  add column if not exists party_ids jsonb not null default '[]'::jsonb;

create table if not exists hollow_resident_progress (
  campaign_id text not null references hollow_campaign_state(campaign_id) on delete cascade,
  resident_id text not null,
  created_by_user_id text not null references hollow_identity_link(user_id) on delete cascade,
  display_name text not null,
  class_key text not null,
  xp_total bigint not null default 0,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, resident_id),
  check (length(resident_id) between 2 and 96),
  check (length(display_name) between 1 and 64),
  check (class_key in ('Warrior','Wizard','Rogue','Healer','Merchant','Bard')),
  check (xp_total between 0 and 2000000000)
);

create index if not exists hollow_resident_progress_xp_idx
  on hollow_resident_progress(campaign_id, xp_total desc);
