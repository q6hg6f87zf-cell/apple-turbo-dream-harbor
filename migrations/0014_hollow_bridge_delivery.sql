-- Delivery attempts + last error for safe Discord feed retries.
-- Additive: existing rows stay pending/delivered/skipped/failed.

alter table hollow_world_event
  add column if not exists delivery_attempts integer not null default 0;

alter table hollow_world_event
  add column if not exists last_error text;

create index if not exists hollow_world_event_retry_idx
  on hollow_world_event (delivery_status, delivery_attempts, created_at)
  where delivery_status in ('pending', 'failed');
