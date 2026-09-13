create table if not exists hollow_campaign_state (
  campaign_id text primary key,
  vault_caps bigint not null default 1400,
  hollow_ore integer not null default 0,
  moon_favor integer not null default 0,
  rooms jsonb not null default '{"vault":1,"barracks":0,"forge":0,"infirmary":0,"watchtower":0,"ledger":0}'::jsonb,
  quarters jsonb not null default '{"bunk":0,"lockbox":0,"hearth":0}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  check (vault_caps between 0 and 2000000000),
  check (hollow_ore between 0 and 1000000),
  check (moon_favor between 0 and 1000000)
);

insert into hollow_campaign_state (campaign_id)
values ('moon-squad')
on conflict (campaign_id) do nothing;

create table if not exists hollow_campaign_member (
  campaign_id text not null references hollow_campaign_state(campaign_id) on delete cascade,
  user_id text not null references hollow_identity_link(user_id) on delete cascade,
  discord_id text not null,
  card_caps bigint not null default 0,
  xp bigint not null default 0,
  level integer not null default 1,
  revision bigint not null default 1,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, user_id),
  unique (campaign_id, discord_id),
  check (card_caps between 0 and 2000000000),
  check (xp between 0 and 2000000000),
  check (level between 1 and 1000)
);

create index if not exists hollow_campaign_member_discord_idx
  on hollow_campaign_member(discord_id);

create table if not exists hollow_command_receipt (
  user_id text not null,
  request_id text not null,
  command_type text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id),
  check (length(request_id) between 12 and 96),
  check (length(command_type) between 2 and 48)
);

create index if not exists hollow_command_receipt_created_idx
  on hollow_command_receipt(created_at desc);
