-- Platform trials: new orgs start on paid-tier plans with trialing status,
-- then downgrade to free tier plans if they don't subscribe.

insert into public.subscription_plans (
  code,
  name,
  description,
  tier_group,
  price_monthly_cents,
  price_yearly_cents,
  limits,
  features,
  sort_order
)
values (
  'agency_starter',
  'Agency Starter',
  'Core roster tools after your trial. Upgrade for AI, scale, and advanced workflows.',
  'agency',
  0,
  0,
  '{"creators": 5, "team_members": 2, "opportunities": null, "campaigns": null, "ai_requests": 0}'::jsonb,
  '["creator_profiles", "team_management", "contracts", "sponsor_crm", "messaging", "limited_analytics"]'::jsonb,
  25
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  limits = excluded.limits,
  features = excluded.features,
  sort_order = excluded.sort_order;

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
    when new.type = 'Brand / Sponsor' then 'sponsor_pro'
    when new.type in (
      'Gaming Agency',
      'Esports Team',
      'Multi-Channel Network',
      'Talent Management Firm'
    ) then 'agency'
    else 'creator_pro'
  end;

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    status,
    billing_interval,
    current_period_start,
    current_period_end,
    trial_ends_at
  )
  select
    new.id,
    sp.id,
    'trialing',
    'monthly',
    now(),
    now() + interval '5 days',
    now() + interval '5 days'
  from public.subscription_plans sp
  where sp.code = plan_code
  on conflict (organization_id) do nothing;

  return new;
end;
$$;
