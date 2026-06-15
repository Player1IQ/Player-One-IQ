-- Org-level BYOK AI provider credentials (encrypted server-side)

create table if not exists public.organization_ai_integrations (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic')),
  encrypted_api_key text not null,
  api_key_hint text not null default '',
  model text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_ai_integrations_enabled_idx
  on public.organization_ai_integrations (organization_id)
  where is_enabled = true;

alter table public.organization_ai_integrations enable row level security;

drop policy if exists "Org managers can view ai integration" on public.organization_ai_integrations;
create policy "Org managers can view ai integration"
  on public.organization_ai_integrations for select
  using (public.user_can_manage_team(organization_id));

drop policy if exists "Org managers can insert ai integration" on public.organization_ai_integrations;
create policy "Org managers can insert ai integration"
  on public.organization_ai_integrations for insert
  with check (public.user_can_manage_team(organization_id));

drop policy if exists "Org managers can update ai integration" on public.organization_ai_integrations;
create policy "Org managers can update ai integration"
  on public.organization_ai_integrations for update
  using (public.user_can_manage_team(organization_id))
  with check (public.user_can_manage_team(organization_id));

drop policy if exists "Org managers can delete ai integration" on public.organization_ai_integrations;
create policy "Org managers can delete ai integration"
  on public.organization_ai_integrations for delete
  using (public.user_can_manage_team(organization_id));
