-- Final reward-trust seam: mission performance is derived from server-owned
-- campaign/resident/loadout state plus a ticket-seeded field roll. The browser
-- may still render the tactical simulation, but it cannot improve treasure by
-- submitting a fabricated performance score.

create or replace function hollow_server_mission_performance(
  p_campaign_id text,
  p_user_id text,
  p_ticket_id text,
  p_region text,
  p_kind text,
  p_party_ids jsonb
)
returns integer
language plpgsql
as $$
declare
  v_base integer;
  v_region integer;
  v_intel integer := 0;
  v_party integer := 0;
  v_classes integer := 0;
  v_training numeric := 0;
  v_equipped integer := 0;
  v_condition integer := 0;
  v_field_roll integer := 0;
  v_score integer := 500;
begin
  v_base := case p_kind
    when 'scout' then 535
    when 'forage' then 545
    when 'trade' then 555
    when 'raid' then 585
    when 'bounty' then 610
    when 'boss' then 675
    else 500
  end;

  v_region := case p_region
    when 'ironclad' then 0
    when 'slagtown' then 8
    when 'blackspire' then 16
    when 'brasswater' then 24
    when 'veyra' then 32
    else 0
  end;

  select greatest(0, coalesce((region_intel ->> p_region)::integer, 0))
    into v_intel
  from hollow_campaign_state
  where campaign_id = p_campaign_id;

  select
    count(*)::integer,
    count(distinct r.class_key)::integer,
    coalesce(avg(least(110.0, sqrt(greatest(r.xp_total, 0)::numeric) * 4.25)), 0)
  into v_party, v_classes, v_training
  from hollow_resident_progress r
  where r.campaign_id = p_campaign_id
    and r.created_by_user_id = p_user_id
    and r.forge_sealed = true
    and r.resident_id in (
      select jsonb_array_elements_text(coalesce(p_party_ids, '[]'::jsonb))
    );

  select
    count(*)::integer,
    coalesce(sum(case i.condition
      when 'Pristine' then 12
      when 'Worn' then 6
      when 'Damaged' then -6
      when 'Broken' then -18
      else 0
    end), 0)::integer
  into v_equipped, v_condition
  from hollow_item_instance i
  where i.campaign_id = p_campaign_id
    and i.destroyed_at is null
    and i.equipped = true
    and i.owner_user_id = p_user_id
    and i.owner_resident_id in (
      select jsonb_array_elements_text(coalesce(p_party_ids, '[]'::jsonb))
    );

  -- Stable per-ticket field variance. It is unknowable before the server issues
  -- the ticket and cannot be changed by replaying settlement with a new score.
  v_field_roll := (mod(abs(hashtext(p_ticket_id || ':' || p_user_id)::bigint), 121))::integer - 60;

  v_score :=
    v_base
    + v_region
    + least(90, v_intel * 6)
    + least(60, v_party * 20)
    + least(72, v_classes * 24)
    + least(110, round(v_training)::integer)
    + least(72, v_equipped * 18)
    + greatest(-72, least(72, v_condition))
    + v_field_roll;

  return greatest(300, least(950, v_score));
end;
$$;

create or replace function hollow_seal_mission_performance()
returns trigger
language plpgsql
as $$
declare
  v_score integer;
begin
  if new.performance_score is not null
     and old.settled_at is null
     and new.settled_at is not null then
    v_score := hollow_server_mission_performance(
      new.campaign_id,
      new.user_id,
      new.ticket_id,
      new.region,
      new.mission_kind,
      new.party_ids
    );
    new.performance_score := v_score;
    if new.reward is not null then
      new.reward := jsonb_set(new.reward, '{performanceScore}', to_jsonb(v_score), true)
        || jsonb_build_object('performanceAuthority', 'server');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists hollow_mission_performance_authority on hollow_mission_ticket;
create trigger hollow_mission_performance_authority
before update of performance_score, settled_at on hollow_mission_ticket
for each row execute function hollow_seal_mission_performance();
