-- Track last successful probe and most recent probe failure for org AI integrations

alter table public.organization_ai_integrations
  add column if not exists last_verified_at timestamptz,
  add column if not exists last_probe_error text;
