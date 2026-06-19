-- Restrict subscription writes to service role (Stripe webhooks).
-- Clients may only read their org subscription via RLS.

drop policy if exists "Org managers can update subscription" on public.organization_subscriptions;
drop policy if exists "Org managers can insert subscription" on public.organization_subscriptions;
