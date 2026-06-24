-- Organization API keys for Agency Pro external API access

create table if not exists public.organization_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  created_by uuid references auth.users (id) on delete set null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint organization_api_keys_name_not_empty check (char_length(trim(name)) > 0)
);

create unique index if not exists organization_api_keys_key_hash_idx
  on public.organization_api_keys (key_hash);

create index if not exists organization_api_keys_organization_id_idx
  on public.organization_api_keys (organization_id);

alter table public.organization_api_keys enable row level security;

drop policy if exists "Org managers can view api keys" on public.organization_api_keys;
create policy "Org managers can view api keys"
  on public.organization_api_keys for select
  using (public.user_can_manage_team(organization_id));

drop policy if exists "Org managers can create api keys" on public.organization_api_keys;
create policy "Org managers can create api keys"
  on public.organization_api_keys for insert
  with check (public.user_can_manage_team(organization_id));

drop policy if exists "Org managers can revoke api keys" on public.organization_api_keys;
create policy "Org managers can revoke api keys"
  on public.organization_api_keys for update
  using (public.user_can_manage_team(organization_id))
  with check (public.user_can_manage_team(organization_id));
