-- Outbound webhook endpoints for Agency Pro workspace integrations

create table if not exists public.organization_webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  label text not null,
  url text not null,
  secret text not null,
  events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_triggered_at timestamptz,
  last_error text,
  constraint organization_webhooks_label_not_empty check (char_length(trim(label)) > 0),
  constraint organization_webhooks_url_not_empty check (char_length(trim(url)) > 0)
);

create index if not exists organization_webhooks_organization_id_idx
  on public.organization_webhooks (organization_id);

alter table public.organization_webhooks enable row level security;

drop policy if exists "Org managers can view webhooks" on public.organization_webhooks;
create policy "Org managers can view webhooks"
  on public.organization_webhooks for select
  using (public.user_can_manage_team(organization_id));

drop policy if exists "Org managers can create webhooks" on public.organization_webhooks;
create policy "Org managers can create webhooks"
  on public.organization_webhooks for insert
  with check (public.user_can_manage_team(organization_id));

drop policy if exists "Org managers can update webhooks" on public.organization_webhooks;
create policy "Org managers can update webhooks"
  on public.organization_webhooks for update
  using (public.user_can_manage_team(organization_id))
  with check (public.user_can_manage_team(organization_id));

drop policy if exists "Org managers can delete webhooks" on public.organization_webhooks;
create policy "Org managers can delete webhooks"
  on public.organization_webhooks for delete
  using (public.user_can_manage_team(organization_id));
