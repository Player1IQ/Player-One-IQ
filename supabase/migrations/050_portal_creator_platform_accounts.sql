-- Allow portal creators/players to connect platforms on their linked profile.

create policy "Portal creators can manage own platform accounts"
  on public.creator_platform_accounts for all
  using (creator_id = public.user_linked_creator_id(organization_id))
  with check (creator_id = public.user_linked_creator_id(organization_id));
