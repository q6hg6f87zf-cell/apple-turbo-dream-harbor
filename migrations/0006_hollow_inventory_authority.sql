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
  instance_id text not null references hollow_item_instance(instance_id) on delete cascade,
  resident_id text not null,
  mastery_kind text not null check (mastery_kind in ('equip','consume','enchant')),
  granted_xp integer not null default 0,
  granted_at timestamptz not null default now(),
  primary key (instance_id, resident_id, mastery_kind)
);

-- Mastery is learned from the canonical design, not from a serial number.
-- The trigger locks the resident's progress row, then rewrites a duplicate
-- template attempt to the already-mastered serial. The route's existing
-- ON CONFLICT(instance_id,resident_id,mastery_kind) therefore becomes a no-op.
-- This also serializes near-simultaneous duplicate-copy equip requests.
create or replace function hollow_dedupe_item_mastery()
returns trigger
language plpgsql
as $$
declare
  new_template text;
  new_campaign text;
  existing_instance text;
begin
  select template_key, campaign_id
    into new_template, new_campaign
  from hollow_item_instance
  where instance_id = new.instance_id;

  if new_template is null then
    return null;
  end if;

  perform 1
  from hollow_resident_progress
  where campaign_id = new_campaign and resident_id = new.resident_id
  for update;

  select m.instance_id
    into existing_instance
  from hollow_item_mastery m
  join hollow_item_instance i on i.instance_id = m.instance_id
  where m.resident_id = new.resident_id
    and m.mastery_kind = new.mastery_kind
    and i.campaign_id = new_campaign
    and i.template_key = new_template
  limit 1;

  if existing_instance is not null then
    new.instance_id := existing_instance;
  end if;
  return new;
end;
$$;

drop trigger if exists hollow_item_mastery_template_dedupe on hollow_item_mastery;
create trigger hollow_item_mastery_template_dedupe
before insert on hollow_item_mastery
for each row execute function hollow_dedupe_item_mastery();

create table if not exists hollow_item_drop_event (
  ticket_id text primary key references hollow_mission_ticket(ticket_id) on delete cascade,
  user_id text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
