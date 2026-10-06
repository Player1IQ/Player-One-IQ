-- Per-API-key request counts, one row per UTC minute.

create table if not exists public.api_key_rate_windows (
  key_id uuid not null references public.organization_api_keys (id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null default 0,
  constraint api_key_rate_windows_pk primary key (key_id, window_start),
  constraint api_key_rate_windows_count_nonnegative check (request_count >= 0)
);

alter table public.api_key_rate_windows enable row level security;
revoke all on table public.api_key_rate_windows from authenticated, anon;

create or replace function public.consume_api_key_rate_limit(
  p_key_id uuid,
  p_limit integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := date_trunc('minute', timezone('utc', now()));
  n integer;
  elapsed integer;
begin
  insert into public.api_key_rate_windows (key_id, window_start, request_count)
  values (p_key_id, w, 1)
  on conflict (key_id, window_start)
  do update set request_count = public.api_key_rate_windows.request_count + 1
  returning public.api_key_rate_windows.request_count into n;

  elapsed := floor(extract(epoch from (timezone('utc', now()) - w)))::integer;
  return query select (n <= p_limit), greatest(0, 60 - elapsed);
end;
$$;

revoke all on function public.consume_api_key_rate_limit(uuid, integer) from public;
grant execute on function public.consume_api_key_rate_limit(uuid, integer) to service_role;
