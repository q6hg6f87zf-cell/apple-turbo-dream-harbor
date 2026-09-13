alter table hollow_resident_progress
  add column if not exists forge_sealed boolean not null default false,
  add column if not exists race_key text;

-- Residents created before this migration were already produced by the server
-- progression path. Preserve those files while all new residents move through
-- the sealed forge contract below.
update hollow_resident_progress
set forge_sealed = true
where forge_sealed = false;

create table if not exists hollow_exchange_purchase (
  campaign_id text not null references hollow_campaign_state(campaign_id) on delete cascade,
  user_id text not null references hollow_identity_link(user_id) on delete cascade,
  campaign_day integer not null,
  tier text not null check (tier in ('bargain','essential','artifact')),
  item_name text not null,
  price integer not null,
  instance_id text,
  created_at timestamptz not null default now(),
  primary key (campaign_id, user_id, campaign_day, tier),
  check (campaign_day >= 1),
  check (price >= 0)
);

create or replace function hollow_forge_resident(
  p_user_id text,
  p_resident_id text,
  p_display_name text,
  p_class_key text,
  p_race_key text,
  p_starters jsonb
)
returns table(ok boolean, duplicate boolean, forge_cost integer, roster_count integer, roster_cap integer)
language plpgsql
as $$
declare
  v_count integer;
  v_cap integer;
  v_cost integer;
  v_caps bigint;
  v_rooms jsonb;
  v_owner text;
  v_sealed boolean;
begin
  select created_by_user_id, forge_sealed
    into v_owner, v_sealed
  from hollow_resident_progress
  where campaign_id = 'moon-squad' and resident_id = p_resident_id;

  if v_owner is not null and v_owner <> p_user_id then
    raise exception 'resident_id_owned';
  end if;
  if coalesce(v_sealed, false) then
    select count(*)::integer into v_count
    from hollow_resident_progress
    where campaign_id = 'moon-squad' and created_by_user_id = p_user_id and forge_sealed = true;
    return query select false, true, 0, v_count, 0;
    return;
  end if;

  select vault_caps, rooms into v_caps, v_rooms
  from hollow_campaign_state
  where campaign_id = 'moon-squad'
  for update;

  select count(*)::integer into v_count
  from hollow_resident_progress
  where campaign_id = 'moon-squad' and created_by_user_id = p_user_id and forge_sealed = true;

  v_cap := 3 + greatest(0, coalesce((v_rooms->>'barracks')::integer, 0)) * 2;
  v_cost := case when v_count = 0 then 0 else 600 + v_count * 350 end;

  if v_count >= v_cap then
    raise exception 'resident_roster_full';
  end if;
  if v_caps < v_cost then
    raise exception 'resident_forge_insufficient_caps';
  end if;

  update hollow_campaign_state
  set vault_caps = vault_caps - v_cost,
      revision = revision + 1,
      updated_at = now()
  where campaign_id = 'moon-squad';

  insert into hollow_resident_progress (
    campaign_id, resident_id, created_by_user_id, display_name, class_key,
    xp_total, revision, forge_sealed, race_key, created_at, updated_at
  ) values (
    'moon-squad', p_resident_id, p_user_id, p_display_name, p_class_key,
    0, 1, true, p_race_key, now(), now()
  )
  on conflict (campaign_id, resident_id) do update set
    display_name = excluded.display_name,
    class_key = excluded.class_key,
    forge_sealed = true,
    race_key = excluded.race_key,
    revision = hollow_resident_progress.revision + 1,
    updated_at = now()
  where hollow_resident_progress.created_by_user_id = p_user_id
    and hollow_resident_progress.forge_sealed = false;

  insert into hollow_item_instance (
    instance_id, campaign_id, template_key, owner_type, owner_user_id,
    owner_resident_id, equipped, condition, source_event, discovered_day
  )
  select
    x.instance_id,
    'moon-squad',
    x.template_key,
    'resident',
    p_user_id,
    p_resident_id,
    x.equipped,
    'Pristine',
    x.source_event,
    greatest(1, coalesce((select campaign_day from hollow_campaign_state where campaign_id='moon-squad'), 1))
  from jsonb_to_recordset(coalesce(p_starters, '[]'::jsonb))
    as x(instance_id text, template_key text, equipped boolean, source_event text)
  on conflict (campaign_id, source_event) do nothing;

  return query select true, false, v_cost, v_count + 1, v_cap;
end;
$$;

create or replace function hollow_buy_exchange(
  p_user_id text,
  p_day integer,
  p_tier text,
  p_price integer,
  p_item_name text,
  p_instance_id text,
  p_template_key text,
  p_source_event text,
  p_ore_units integer
)
returns table(ok boolean, duplicate boolean)
language plpgsql
as $$
declare
  v_caps bigint;
begin
  perform 1 from hollow_campaign_state where campaign_id='moon-squad' for update;

  if exists(
    select 1 from hollow_exchange_purchase
    where campaign_id='moon-squad' and user_id=p_user_id and campaign_day=p_day and tier=p_tier
  ) then
    return query select false, true;
    return;
  end if;

  select vault_caps into v_caps from hollow_campaign_state where campaign_id='moon-squad';
  if v_caps < p_price then
    raise exception 'exchange_insufficient_caps';
  end if;

  update hollow_campaign_state
  set vault_caps=vault_caps-p_price,
      hollow_ore=hollow_ore+greatest(0,p_ore_units),
      revision=revision+1,
      updated_at=now()
  where campaign_id='moon-squad';

  if greatest(0,p_ore_units) = 0 then
    insert into hollow_item_instance (
      instance_id,campaign_id,template_key,owner_type,source_event,discovered_day
    ) values (
      p_instance_id,'moon-squad',p_template_key,'vault',p_source_event,p_day
    );
  end if;

  insert into hollow_exchange_purchase (
    campaign_id,user_id,campaign_day,tier,item_name,price,instance_id
  ) values (
    'moon-squad',p_user_id,p_day,p_tier,p_item_name,p_price,
    case when greatest(0,p_ore_units)=0 then p_instance_id else null end
  );

  return query select true, false;
end;
$$;

create or replace function hollow_buy_vendor(
  p_user_id text,
  p_price integer,
  p_instance_id text,
  p_template_key text,
  p_source_event text,
  p_ore_units integer
)
returns table(ok boolean, duplicate boolean)
language plpgsql
as $$
declare
  v_caps bigint;
begin
  perform 1 from hollow_campaign_state where campaign_id='moon-squad' for update;

  if exists(select 1 from hollow_item_instance where campaign_id='moon-squad' and source_event=p_source_event) then
    return query select false, true;
    return;
  end if;

  select vault_caps into v_caps from hollow_campaign_state where campaign_id='moon-squad';
  if v_caps < p_price then
    raise exception 'vendor_insufficient_caps';
  end if;

  update hollow_campaign_state
  set vault_caps=vault_caps-p_price,
      hollow_ore=hollow_ore+greatest(0,p_ore_units),
      revision=revision+1,
      updated_at=now()
  where campaign_id='moon-squad';

  if greatest(0,p_ore_units) = 0 then
    insert into hollow_item_instance (
      instance_id,campaign_id,template_key,owner_type,source_event,discovered_day
    ) values (
      p_instance_id,'moon-squad',p_template_key,'vault',p_source_event,
      greatest(1,coalesce((select campaign_day from hollow_campaign_state where campaign_id='moon-squad'),1))
    );
  end if;

  return query select true, false;
end;
$$;

create or replace function hollow_grant_broker_supply(
  p_user_id text,
  p_resident_id text,
  p_instance_id text,
  p_template_key text,
  p_source_event text
)
returns table(ok boolean, duplicate boolean)
language plpgsql
as $$
begin
  if not exists(
    select 1 from hollow_resident_progress
    where campaign_id='moon-squad'
      and resident_id=p_resident_id
      and created_by_user_id=p_user_id
      and class_key='Merchant'
      and forge_sealed=true
  ) then
    raise exception 'broker_resident_required';
  end if;

  if exists(select 1 from hollow_item_instance where campaign_id='moon-squad' and source_event=p_source_event) then
    return query select false, true;
    return;
  end if;

  insert into hollow_item_instance (
    instance_id,campaign_id,template_key,owner_type,owner_user_id,owner_resident_id,
    equipped,condition,source_event,discovered_day
  ) values (
    p_instance_id,'moon-squad',p_template_key,'resident',p_user_id,p_resident_id,
    false,'Pristine',p_source_event,
    greatest(1,coalesce((select campaign_day from hollow_campaign_state where campaign_id='moon-squad'),1))
  );

  return query select true, false;
end;
$$;

-- Mission registration may update an existing resident for display purposes, but
-- a mission ticket may never carry a resident that did not pass the server forge.
create or replace function hollow_require_sealed_party()
returns trigger
language plpgsql
as $$
declare
  v_party integer;
  v_sealed integer;
begin
  select count(*)::integer into v_party
  from jsonb_array_elements_text(coalesce(new.party_ids,'[]'::jsonb));

  select count(*)::integer into v_sealed
  from hollow_resident_progress r
  where r.campaign_id=new.campaign_id
    and r.created_by_user_id=new.user_id
    and r.forge_sealed=true
    and r.resident_id in (
      select jsonb_array_elements_text(coalesce(new.party_ids,'[]'::jsonb))
    );

  if v_party < 1 or v_party <> v_sealed then
    raise exception 'unsealed_mission_party';
  end if;
  return new;
end;
$$;

drop trigger if exists hollow_mission_party_authority on hollow_mission_ticket;
create trigger hollow_mission_party_authority
before insert or update of party_ids on hollow_mission_ticket
for each row execute function hollow_require_sealed_party();
