-- Include AI Creator Coach chat on agency plans (portal creators on agency orgs)

update public.subscription_plans
set features = features || '["ai_creator_coach"]'::jsonb
where code in ('agency', 'agency_pro', 'creator_pro')
  and not (features @> '["ai_creator_coach"]'::jsonb);
