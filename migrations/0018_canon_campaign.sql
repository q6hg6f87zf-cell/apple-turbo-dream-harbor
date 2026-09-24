create table if not exists hollow_canon_campaign (
 user_id text primary key references hollow_identity_link(user_id) on delete cascade,
 narrative jsonb not null default '{}'::jsonb,
 trust integer not null default 40 check(trust between 0 and 100),
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
