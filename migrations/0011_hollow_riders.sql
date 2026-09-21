create table if not exists hollow_riders (
  discord_id text primary key,
  handle text not null,
  display_name text not null,
  stamped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
