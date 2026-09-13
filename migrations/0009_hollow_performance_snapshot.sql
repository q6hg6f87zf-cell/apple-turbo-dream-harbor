-- Freeze the server-owned performance basis when the mission ticket is issued.
-- This prevents a client from changing authoritative gear/training/intel after
-- deployment and before settlement in order to improve treasure rarity.

alter table hollow_mission_ticket
  add column if not exists sealed_performance_score integer;

alter table hollow_mission_ticket
  drop constraint if exists hollow_mission_ticket_sealed_performance_check;

alter table hollow_mission_ticket
  add constraint hollow_mission_ticket_sealed_performance_check
  check (sealed_performance_score is null or sealed_performance_score between 300 and 950);

create or replace function hollow_capture_mission_performance()
returns trigger
language plpgsql
as $$
begin
  new.sealed_performance_score := hollow_server_mission_performance(
    new.campaign_id,
    new.user_id,
    new.ticket_id,
    new.region,
    new.mission_kind,
    new.party_ids
  );
  return new;
end;
$$;

drop trigger if exists hollow_mission_performance_capture on hollow_mission_ticket;
create trigger hollow_mission_performance_capture
before insert on hollow_mission_ticket
for each row execute function hollow_capture_mission_performance();

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
    v_score := coalesce(
      old.sealed_performance_score,
      new.sealed_performance_score,
      hollow_server_mission_performance(
        new.campaign_id,
        new.user_id,
        new.ticket_id,
        new.region,
        new.mission_kind,
        new.party_ids
      )
    );
    new.sealed_performance_score := v_score;
    new.performance_score := v_score;
    if new.reward is not null then
      new.reward := jsonb_set(new.reward, '{performanceScore}', to_jsonb(v_score), true)
        || jsonb_build_object(
          'performanceAuthority', 'server',
          'performanceBasis', 'mission-start-snapshot'
        );
    end if;
  end if;
  return new;
end;
$$;

-- Existing open tickets created between migrations get a conservative snapshot
-- now. Fresh tickets are always captured by the insert trigger above.
update hollow_mission_ticket t
set sealed_performance_score = hollow_server_mission_performance(
  t.campaign_id,
  t.user_id,
  t.ticket_id,
  t.region,
  t.mission_kind,
  t.party_ids
)
where t.settled_at is null
  and t.sealed_performance_score is null;
