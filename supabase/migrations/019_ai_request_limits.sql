-- Migration: add ai_requests limits to subscription plans
-- Prerequisites: 018_subscription_billing.sql

update public.subscription_plans
set limits = limits || '{"ai_requests": 0}'::jsonb
where code in ('free_creator', 'sponsor')
  and not (limits ? 'ai_requests');

update public.subscription_plans
set limits = limits || '{"ai_requests": 50}'::jsonb
where code = 'creator_pro'
  and not (limits ? 'ai_requests');

update public.subscription_plans
set limits = limits || '{"ai_requests": 100}'::jsonb
where code = 'agency'
  and not (limits ? 'ai_requests');

update public.subscription_plans
set limits = limits || '{"ai_requests": null}'::jsonb
where code = 'agency_pro'
  and not (limits ? 'ai_requests');

update public.subscription_plans
set limits = limits || '{"ai_requests": 75}'::jsonb
where code = 'sponsor_pro'
  and not (limits ? 'ai_requests');
