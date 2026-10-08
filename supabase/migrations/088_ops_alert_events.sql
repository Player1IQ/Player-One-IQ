-- Cooldown log for launch-month ops email alerts (service role only).

create table if not exists public.ops_alert_events (
  fingerprint text primary key,
  kind text not null
    check (kind in ('server_error', 'cron', 'email', 'oauth', 'uptime')),
  title text not null,
  last_detail text,
  hit_count integer not null default 1,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ops_alert_events enable row level security;

revoke all on table public.ops_alert_events from public, anon, authenticated;
