-- Migration: firm per-org AI request caps (included in subscription)
-- Prerequisites: 019_ai_request_limits.sql

update public.subscription_plans
set limits = jsonb_set(limits, '{ai_requests}', '200'::jsonb)
where code = 'agency';

update public.subscription_plans
set limits = jsonb_set(limits, '{ai_requests}', '500'::jsonb)
where code = 'agency_pro';
