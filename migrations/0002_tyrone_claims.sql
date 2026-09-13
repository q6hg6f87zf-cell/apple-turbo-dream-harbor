create table if not exists tyrone_identity_claim (
  token_hash text primary key,
  discord_id text not null references tyrone_arcade_snapshot(discord_id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists tyrone_identity_claim_expiry_idx
  on tyrone_identity_claim(expires_at);
