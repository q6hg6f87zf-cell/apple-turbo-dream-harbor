-- Event → memory uniqueness, recall bookkeeping, farm-proof relationship events.
-- related memories can later share consolidation_group. Do not delete history.

alter table hollow_tyrone_memory add column if not exists title text;
alter table hollow_tyrone_memory add column if not exists recall_count integer not null default 0;
alter table hollow_tyrone_memory add column if not exists last_recalled_at timestamptz;
alter table hollow_tyrone_memory add column if not exists consolidation_group text;

create unique index if not exists hollow_tyrone_memory_event_uidx
  on hollow_tyrone_memory (discord_id, related_event_id)
  where related_event_id is not null;

create index if not exists hollow_tyrone_memory_group_idx
  on hollow_tyrone_memory (discord_id, consolidation_group, created_at desc)
  where consolidation_group is not null;

alter table hollow_tyrone_bond_event add column if not exists source_event_id text;
alter table hollow_tyrone_bond_event add column if not exists origin text not null default 'game';

create unique index if not exists hollow_tyrone_bond_event_src_uidx
  on hollow_tyrone_bond_event (discord_id, field, source_event_id)
  where source_event_id is not null;
