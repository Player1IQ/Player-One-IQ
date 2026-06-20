-- Portal messaging scope: portal users only see conversations they participate in.

drop policy if exists "Org members can view conversations" on public.conversations;

create policy "Org members can view conversations"
  on public.conversations for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator')
      or public.user_is_conversation_participant(id)
    )
  );
