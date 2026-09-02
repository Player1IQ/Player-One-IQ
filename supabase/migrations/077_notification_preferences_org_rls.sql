-- Tighten notification preference RLS to the user's active org,
-- and index the deadline cron lookups.

drop policy if exists "Users can view own notification preferences" on public.notification_preferences;
drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
drop policy if exists "Users can update own notification preferences" on public.notification_preferences;

create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (
    user_id = auth.uid()
    and public.user_is_active_org_member(auth.uid(), organization_id)
  );

create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_is_active_org_member(auth.uid(), organization_id)
  );

create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  to authenticated
  using (
    user_id = auth.uid()
    and public.user_is_active_org_member(auth.uid(), organization_id)
  )
  with check (
    user_id = auth.uid()
    and public.user_is_active_org_member(auth.uid(), organization_id)
  );

create index if not exists contract_deliverables_due_date_open_idx
  on public.contract_deliverables (due_date)
  where status <> 'completed';

create index if not exists contracts_end_date_active_idx
  on public.contracts (end_date)
  where contract_status = 'active';
