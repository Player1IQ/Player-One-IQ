-- True 20% annual catalog (monthly * 12 * 0.8, whole dollars).
-- Checkout still uses stripe_price_id_yearly; live Price IDs are updated
-- separately after creating replacement Stripe yearly prices.

update public.subscription_plans
set price_yearly_cents = 27800, updated_at = now()
where code = 'creator_pro';

update public.subscription_plans
set price_yearly_cents = 95000, updated_at = now()
where code = 'agency';

update public.subscription_plans
set price_yearly_cents = 239000, updated_at = now()
where code = 'agency_pro';

update public.subscription_plans
set price_yearly_cents = 191000, updated_at = now()
where code = 'sponsor_pro';
