-- Allow portal creators/players to manage revenue entries on their linked profile.

create policy "Portal creators can manage own revenue entries"
  on public.creator_revenue_entries for all
  using (creator_id = public.user_linked_creator_id(organization_id))
  with check (creator_id = public.user_linked_creator_id(organization_id));
