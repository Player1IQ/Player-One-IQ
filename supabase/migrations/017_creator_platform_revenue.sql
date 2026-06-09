-- Migration: creator platform accounts and revenue tracking
-- Prerequisites: organizations, creators, team helper functions

create table if not exists public.creator_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  creator_id uuid references public.creators(id) on delete cascade not null,
  platform text not null
    check (platform in ('YouTube', 'Twitch', 'TikTok', 'Instagram', 'Kick')),
  account_handle text not null,
  display_name text,
  connection_method text not null default 'manual'
    check (connection_method in ('manual', 'oauth')),
  connection_status text not null default 'connected_manual'
    check (
      connection_status in (
        'connected_manual',
        'connected_oauth',
        'pending_oauth',
        'disconnected',
        'sync_error'
      )
    ),
  oauth_metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  sync_error text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (creator_id, platform)
);

create index if not exists creator_platform_accounts_org_idx
  on public.creator_platform_accounts (organization_id);

create index if not exists creator_platform_accounts_creator_idx
  on public.creator_platform_accounts (creator_id);

create table if not exists public.creator_revenue_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  creator_id uuid references public.creators(id) on delete cascade not null,
  platform_account_id uuid references public.creator_platform_accounts(id) on delete cascade,
  platform text not null
    check (platform in ('YouTube', 'Twitch', 'TikTok', 'Instagram', 'Kick')),
  revenue_type text not null
    check (
      revenue_type in (
        'advertisement',
        'subscription',
        'donations',
        'other'
      )
    ),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  currency text not null default 'USD',
  period_month date not null,
  source text not null default 'manual'
    check (source in ('manual', 'api_sync')),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index if not exists creator_revenue_entries_account_period_type_idx
  on public.creator_revenue_entries (platform_account_id, revenue_type, period_month)
  where platform_account_id is not null;

create index if not exists creator_revenue_entries_org_month_idx
  on public.creator_revenue_entries (organization_id, period_month);

create index if not exists creator_revenue_entries_creator_month_idx
  on public.creator_revenue_entries (creator_id, period_month);

alter table public.creator_platform_accounts enable row level security;
alter table public.creator_revenue_entries enable row level security;

drop policy if exists "Users can view org creator platform accounts" on public.creator_platform_accounts;
drop policy if exists "Users can insert org creator platform accounts" on public.creator_platform_accounts;
drop policy if exists "Users can update org creator platform accounts" on public.creator_platform_accounts;
drop policy if exists "Users can delete org creator platform accounts" on public.creator_platform_accounts;

create policy "Users can view org creator platform accounts"
  on public.creator_platform_accounts for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org creator platform accounts"
  on public.creator_platform_accounts for insert
  with check (public.user_can_write_org(organization_id));

create policy "Users can update org creator platform accounts"
  on public.creator_platform_accounts for update
  using (public.user_can_write_org(organization_id));

create policy "Users can delete org creator platform accounts"
  on public.creator_platform_accounts for delete
  using (public.user_can_write_org(organization_id));

drop policy if exists "Users can view org creator revenue entries" on public.creator_revenue_entries;
drop policy if exists "Users can insert org creator revenue entries" on public.creator_revenue_entries;
drop policy if exists "Users can update org creator revenue entries" on public.creator_revenue_entries;
drop policy if exists "Users can delete org creator revenue entries" on public.creator_revenue_entries;

create policy "Users can view org creator revenue entries"
  on public.creator_revenue_entries for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org creator revenue entries"
  on public.creator_revenue_entries for insert
  with check (public.user_can_write_org(organization_id));

create policy "Users can update org creator revenue entries"
  on public.creator_revenue_entries for update
  using (public.user_can_write_org(organization_id));

create policy "Users can delete org creator revenue entries"
  on public.creator_revenue_entries for delete
  using (public.user_can_write_org(organization_id));
