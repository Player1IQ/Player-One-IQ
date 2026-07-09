-- Beta launch: new orgs auto-start a 14-day platform trial on their paid entry plan.
-- Matches getTrialPlanForOrgType + startPlatformTrial metadata in application code.

create or replace function public.assign_default_organization_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_code text;
  trial_end timestamptz;
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

  trial_end := now() + interval '14 days';

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    status,
    billing_interval,
    current_period_start,
    current_period_end,
    trial_ends_at,
    metadata
  )
  select
    new.id,
    sp.id,
    'trialing',
    'monthly',
    now(),
    trial_end,
    trial_end,
    jsonb_build_object('platform_trialed_plans', jsonb_build_array(plan_code))
  from public.subscription_plans sp
  where sp.code = plan_code
  on conflict (organization_id) do nothing;

  return new;
end;
$$;
