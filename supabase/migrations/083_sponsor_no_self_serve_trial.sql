-- New Brand / Sponsor workspaces start on free `sponsor`, not a Sponsor Pro trial.
-- Existing subscriptions are unchanged. Public signup no longer creates this org type.

create or replace function public.assign_default_organization_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_code text;
  trial_end timestamptz;
  sub_status text;
begin
  plan_code := case
    when new.type = 'Brand / Sponsor' then 'sponsor'
    when new.type in (
      'Gaming Agency',
      'Esports Team',
      'Multi-Channel Network',
      'Talent Management Firm'
    ) then 'agency'
    else 'creator_pro'
  end;

  if plan_code = 'sponsor' then
    sub_status := 'active';
    trial_end := null;
  else
    sub_status := 'trialing';
    trial_end := now() + interval '14 days';
  end if;

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
    sub_status,
    'monthly',
    now(),
    coalesce(trial_end, now()),
    trial_end,
    case
      when plan_code = 'sponsor' then '{}'::jsonb
      else jsonb_build_object('platform_trialed_plans', jsonb_build_array(plan_code))
    end
  from public.subscription_plans sp
  where sp.code = plan_code
  on conflict (organization_id) do nothing;

  return new;
end;
$$;
