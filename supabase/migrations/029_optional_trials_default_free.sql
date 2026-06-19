-- Trials are opt-in from Billing. New orgs start on the free tier for their type.

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
    ) then 'agency_starter'
    else 'free_creator'
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
    'active',
    'monthly',
    now(),
    now() + interval '1 month',
    null
  from public.subscription_plans sp
  where sp.code = plan_code
  on conflict (organization_id) do nothing;

  return new;
end;
$$;
