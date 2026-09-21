-- Claim-before-send so a restart cannot double-post a Discord transmission.
-- delivering = pulled and owned by a worker. Not pending. Not delivered.

alter table hollow_world_event drop constraint if exists hollow_world_event_delivery_status_check;

alter table hollow_world_event add constraint hollow_world_event_delivery_status_check
  check (delivery_status in ('pending', 'delivering', 'delivered', 'skipped', 'failed'));
