-- Migration: allow org owners/admins to update organization profile

drop policy if exists "Users can update their own organization" on public.organizations;
drop policy if exists "Org managers can update organization" on public.organizations;

create policy "Org managers can update organization"
  on public.organizations for update
  using (public.user_can_manage_team(id));
