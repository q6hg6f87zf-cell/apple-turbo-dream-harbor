create table if not exists hollow_vendor_purchase (
  source_event text primary key,
  campaign_id text not null references hollow_campaign_state(campaign_id) on delete cascade,
  user_id text not null references hollow_identity_link(user_id) on delete cascade,
  item_name text not null,
  price integer not null,
  ore_units integer not null default 0,
  instance_id text,
  created_at timestamptz not null default now(),
  check (price >= 0),
  check (ore_units >= 0)
);

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
  v_name text;
begin
  perform 1 from hollow_campaign_state where campaign_id='moon-squad' for update;

  if exists(select 1 from hollow_vendor_purchase where source_event=p_source_event) then
    return query select false, true;
    return;
  end if;

  select vault_caps into v_caps from hollow_campaign_state where campaign_id='moon-squad';
  if v_caps < p_price then
    raise exception 'vendor_insufficient_caps';
  end if;

  v_name := split_part(p_template_key, ':', 2);

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

  insert into hollow_vendor_purchase (
    source_event,campaign_id,user_id,item_name,price,ore_units,instance_id
  ) values (
    p_source_event,'moon-squad',p_user_id,v_name,p_price,greatest(0,p_ore_units),
    case when greatest(0,p_ore_units)=0 then p_instance_id else null end
  );

  return query select true, false;
end;
$$;
