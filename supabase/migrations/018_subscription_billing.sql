-- Migration: subscription plans, billing, usage tracking, AI usage, feature flags
-- Prerequisites: organizations, team helper functions

-- ---------------------------------------------------------------------------
-- Subscription plans (catalog)
-- ---------------------------------------------------------------------------

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  tier_group text not null
    check (tier_group in ('creator', 'agency', 'sponsor')),
  price_monthly_cents integer not null default 0 check (price_monthly_cents >= 0),
  price_yearly_cents integer check (price_yearly_cents is null or price_yearly_cents >= 0),
  limits jsonb not null default '{}'::jsonb,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ---------------------------------------------------------------------------
-- Organization subscriptions (one active row per org)
-- ---------------------------------------------------------------------------

create table if not exists public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null unique,
  plan_id uuid references public.subscription_plans(id) on delete restrict not null,
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'paused')),
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '1 month'),
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists organization_subscriptions_plan_idx
  on public.organization_subscriptions (plan_id);

-- ---------------------------------------------------------------------------
-- Usage tracking (monthly aggregates)
-- ---------------------------------------------------------------------------

create table if not exists public.usage_tracking (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  metric_key text not null,
  period_month date not null,
  count integer not null default 0 check (count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (organization_id, metric_key, period_month)
);

create index if not exists usage_tracking_org_month_idx
  on public.usage_tracking (organization_id, period_month);

-- ---------------------------------------------------------------------------
-- AI usage tracking
-- ---------------------------------------------------------------------------

create table if not exists public.ai_usage_tracking (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  assistant_type text not null
    check (assistant_type in ('growth', 'sponsorship', 'revenue')),
  action text not null,
  tokens_used integer not null default 0 check (tokens_used >= 0),
  period_month date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists ai_usage_tracking_org_month_idx
  on public.ai_usage_tracking (organization_id, period_month);

create index if not exists ai_usage_tracking_assistant_idx
  on public.ai_usage_tracking (organization_id, assistant_type, period_month);

-- ---------------------------------------------------------------------------
-- Feature flags (global + per-organization overrides)
-- ---------------------------------------------------------------------------

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index if not exists feature_flags_org_key_idx
  on public.feature_flags (organization_id, flag_key)
  where organization_id is not null;

create unique index if not exists feature_flags_global_key_idx
  on public.feature_flags (flag_key)
  where organization_id is null;

-- ---------------------------------------------------------------------------
-- Seed subscription plans
-- ---------------------------------------------------------------------------

insert into public.subscription_plans (
  code, name, description, tier_group, price_monthly_cents, price_yearly_cents,
  limits, features, sort_order
) values
(
  'free_creator',
  'Free Creator',
  'Get started with a single creator profile and opportunity applications.',
  'creator',
  0,
  0,
  '{"creators": 1, "team_members": 0, "opportunities": null, "campaigns": null}'::jsonb,
  '["creator_profiles", "apply_opportunities", "limited_analytics"]'::jsonb,
  10
),
(
  'creator_pro',
  'Creator Pro',
  'Advanced analytics and AI-powered growth for serious creators.',
  'creator',
  2900,
  29000,
  '{"creators": null, "team_members": 0, "opportunities": null, "campaigns": null}'::jsonb,
  '["creator_profiles", "apply_opportunities", "advanced_analytics", "ai_growth", "ai_sponsorship", "revenue_forecasting", "monthly_reports"]'::jsonb,
  20
),
(
  'agency',
  'Agency',
  'Manage creators, sponsors, contracts, and opportunities with AI assistance.',
  'agency',
  9900,
  99000,
  '{"creators": 25, "team_members": null, "opportunities": null, "campaigns": null}'::jsonb,
  '["creator_profiles", "team_management", "contracts", "sponsor_crm", "opportunity_management", "advanced_analytics", "ai_creator_performance", "ai_sponsorship_matching", "ai_contract_summaries", "messaging"]'::jsonb,
  30
),
(
  'agency_pro',
  'Agency Pro',
  'Unlimited scale with forecasting, deal recommendations, and API access.',
  'agency',
  24900,
  249000,
  '{"creators": null, "team_members": null, "opportunities": null, "campaigns": null}'::jsonb,
  '["creator_profiles", "team_management", "contracts", "sponsor_crm", "opportunity_management", "advanced_analytics", "ai_creator_performance", "ai_sponsorship_matching", "ai_contract_summaries", "ai_forecasting", "ai_deal_recommendations", "white_label", "api_access", "messaging"]'::jsonb,
  40
),
(
  'sponsor',
  'Sponsor',
  'Create opportunities, review creators, and track campaigns.',
  'sponsor',
  0,
  0,
  '{"creators": null, "team_members": null, "opportunities": null, "campaigns": 5}'::jsonb,
  '["create_opportunities", "review_creators", "messaging", "limited_analytics", "campaign_tracking"]'::jsonb,
  50
),
(
  'sponsor_pro',
  'Sponsor Pro',
  'Unlimited campaigns with AI discovery and ROI forecasting.',
  'sponsor',
  19900,
  199000,
  '{"creators": null, "team_members": null, "opportunities": null, "campaigns": null}'::jsonb,
  '["create_opportunities", "review_creators", "messaging", "advanced_analytics", "campaign_tracking", "ai_creator_discovery", "ai_campaign_recommendations", "ai_roi_forecasting", "advanced_reporting"]'::jsonb,
  60
)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Default subscription on new organization
-- ---------------------------------------------------------------------------

create or replace function public.assign_default_organization_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_code text;
begin
  plan_code := case
    when new.type = 'Brand / Sponsor' then 'sponsor'
    when new.type in (
      'Gaming Agency',
      'Esports Team',
      'Multi-Channel Network',
      'Talent Management Firm'
    ) then 'agency'
    else 'free_creator'
  end;

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    status,
    billing_interval,
    current_period_start,
    current_period_end
  )
  select
    new.id,
    sp.id,
    'active',
    'monthly',
    now(),
    now() + interval '1 month'
  from public.subscription_plans sp
  where sp.code = plan_code
  on conflict (organization_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_organization_created_subscription on public.organizations;

create trigger on_organization_created_subscription
  after insert on public.organizations
  for each row
  execute function public.assign_default_organization_subscription();

-- Backfill subscriptions for existing organizations
insert into public.organization_subscriptions (
  organization_id,
  plan_id,
  status,
  billing_interval,
  current_period_start,
  current_period_end
)
select
  o.id,
  sp.id,
  'active',
  'monthly',
  now(),
  now() + interval '1 month'
from public.organizations o
cross join lateral (
  select id
  from public.subscription_plans
  where code = case
    when o.type = 'Brand / Sponsor' then 'sponsor'
    when o.type in (
      'Gaming Agency',
      'Esports Team',
      'Multi-Channel Network',
      'Talent Management Firm'
    ) then 'agency'
    else 'free_creator'
  end
  limit 1
) sp
where not exists (
  select 1
  from public.organization_subscriptions os
  where os.organization_id = o.id
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.subscription_plans enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.usage_tracking enable row level security;
alter table public.ai_usage_tracking enable row level security;
alter table public.feature_flags enable row level security;

-- Plans: readable by all authenticated users (catalog)
drop policy if exists "Authenticated users can view subscription plans" on public.subscription_plans;
create policy "Authenticated users can view subscription plans"
  on public.subscription_plans for select
  to authenticated
  using (is_active = true);

-- Organization subscriptions
drop policy if exists "Users can view org subscription" on public.organization_subscriptions;
drop policy if exists "Org managers can update subscription" on public.organization_subscriptions;
drop policy if exists "Org managers can insert subscription" on public.organization_subscriptions;

create policy "Users can view org subscription"
  on public.organization_subscriptions for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Org managers can update subscription"
  on public.organization_subscriptions for update
  using (public.user_can_manage_team(organization_id));

create policy "Org managers can insert subscription"
  on public.organization_subscriptions for insert
  with check (public.user_can_manage_team(organization_id));

-- Usage tracking
drop policy if exists "Users can view org usage" on public.usage_tracking;
drop policy if exists "Users can insert org usage" on public.usage_tracking;
drop policy if exists "Users can update org usage" on public.usage_tracking;

create policy "Users can view org usage"
  on public.usage_tracking for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org usage"
  on public.usage_tracking for insert
  with check (public.user_can_write_org(organization_id));

create policy "Users can update org usage"
  on public.usage_tracking for update
  using (public.user_can_write_org(organization_id));

-- AI usage tracking
drop policy if exists "Users can view org ai usage" on public.ai_usage_tracking;
drop policy if exists "Users can insert org ai usage" on public.ai_usage_tracking;

create policy "Users can view org ai usage"
  on public.ai_usage_tracking for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org ai usage"
  on public.ai_usage_tracking for insert
  with check (public.user_can_write_org(organization_id));

-- Feature flags: global + org-scoped
drop policy if exists "Users can view feature flags" on public.feature_flags;
drop policy if exists "Org managers can manage org feature flags" on public.feature_flags;

create policy "Users can view feature flags"
  on public.feature_flags for select
  using (
    organization_id is null
    or organization_id in (select public.user_organization_ids())
  );

create policy "Org managers can manage org feature flags"
  on public.feature_flags for all
  using (
    organization_id is not null
    and public.user_can_manage_team(organization_id)
  )
  with check (
    organization_id is not null
    and public.user_can_manage_team(organization_id)
  );
