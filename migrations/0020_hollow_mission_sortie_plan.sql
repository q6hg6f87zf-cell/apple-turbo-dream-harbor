-- Server-stamped multi-beat sortie plan on mission tickets.
-- Authority clients render this plan; they do not invent the loop.
-- Additive: legacy open tickets may keep sortie_plan null until reissued.

alter table hollow_mission_ticket
  add column if not exists sortie_plan jsonb;

alter table hollow_mission_ticket
  drop constraint if exists hollow_mission_ticket_sortie_plan_object;

alter table hollow_mission_ticket
  add constraint hollow_mission_ticket_sortie_plan_object
  check (sortie_plan is null or jsonb_typeof(sortie_plan) = 'object');

comment on column hollow_mission_ticket.sortie_plan is
  'Strike: server-owned intel→approach→crisis?→extract beat graph for the ticket.';
