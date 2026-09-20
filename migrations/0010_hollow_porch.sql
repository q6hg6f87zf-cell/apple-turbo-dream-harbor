create table if not exists hollow_porch (
  discord_id text primary key,
  user_id text not null,
  name text not null,
  handle text not null default '',
  screen text not null default 'hq',
  last_seen timestamptz not null default now()
);

create index if not exists hollow_porch_seen on hollow_porch (last_seen desc);
