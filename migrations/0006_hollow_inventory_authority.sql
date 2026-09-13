create table if not exists hollow_item_instance (
  instance_id text primary key,
  campaign_id text not null references hollow_campaign_state(campaign_id) on delete cascade,
  template_key text not null,
  owner_type text not null check (owner_type in ('vault','resident')),
  owner_user_id text,
  owner_resident_id text,
  equipped boolean not null default false,
  condition text not null default 'Pristine' check (condition in ('Pristine','Worn','Damaged','Broken')),
  enchantments jsonb not null default '[]'::jsonb,
  source_event text not null,
  discovered_day integer not null default 1,
  revision bigint not null default 1,
  destroyed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, source_event),
  check (
    (owner_type = 'vault' and owner_user_id is null and owner_resident_id is null and equipped = false)
    or
    (owner_type = 'resident' and owner_user_id is not null and owner_resident_id is not null)
  )
);

create index if not exists hollow_item_instance_campaign_idx
  on hollow_item_instance(campaign_id, destroyed_at, owner_type);
create index if not exists hollow_item_instance_resident_idx
  on hollow_item_instance(campaign_id, owner_resident_id, destroyed_at);

create table if not exists hollow_inventory_migration (
  user_id text primary key,
  state text not null default 'started' check (state in ('started','complete')),
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists hollow_item_mastery (
  campaign_id text not null references hollow_campaign_state(campaign_id) on delete cascade,
  resident_id text not null,
  template_key text not null,
  mastery_kind text not null check (mastery_kind in ('equip','consume','enchant')),
  granted_xp integer not null default 0,
  granted_at timestamptz not null default now(),
  primary key (campaign_id, resident_id, template_key, mastery_kind)
);

create table if not exists hollow_item_drop_event (
  ticket_id text primary key references hollow_mission_ticket(ticket_id) on delete cascade,
  user_id text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
