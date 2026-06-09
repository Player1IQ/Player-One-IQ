-- Migration: fix conversation participant insert/select RLS
-- Participant rows failed to insert when org owner was only in organizations.user_id,
-- and users could not read their own participant row in some cases.

create or replace function public.user_is_active_org_member(p_user_id uuid, p_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.organization_id = p_org_id
      and tm.user_id = p_user_id
      and tm.status = 'active'
  )
  or exists (
    select 1
    from public.organizations o
    where o.id = p_org_id
      and o.user_id = p_user_id
  )
$$;

create or replace function public.ensure_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  v_org_id := public.get_conversation_organization_id(p_conversation_id);
  if v_org_id is null then
    raise exception 'Conversation not found';
  end if;

  if not public.conversation_in_user_org(p_conversation_id) then
    raise exception 'Not authorized';
  end if;

  if not public.user_is_active_org_member(p_user_id, v_org_id) then
    raise exception 'User is not in this organization';
  end if;

  if p_user_id <> v_actor
     and not public.user_is_conversation_participant(p_conversation_id) then
    raise exception 'Not a conversation participant';
  end if;

  insert into public.conversation_participants (conversation_id, user_id, last_read_at)
  values (p_conversation_id, p_user_id, now())
  on conflict (conversation_id, user_id) do nothing;
end;
$$;

grant execute on function public.user_is_active_org_member(uuid, uuid) to authenticated;
grant execute on function public.ensure_conversation_participant(uuid, uuid) to authenticated;

drop policy if exists "Participants can view conversation members" on public.conversation_participants;
drop policy if exists "Users can view conversation participants" on public.conversation_participants;

create policy "Users can view conversation participants"
  on public.conversation_participants for select
  using (
    user_id = auth.uid()
    or public.user_is_conversation_participant(conversation_id)
  );

drop policy if exists "Users can join or add participants" on public.conversation_participants;

create policy "Users can join or add participants"
  on public.conversation_participants for insert
  with check (
    public.conversation_in_user_org(conversation_id)
    and public.user_is_active_org_member(
      user_id,
      public.get_conversation_organization_id(conversation_id)
    )
    and (
      user_id = auth.uid()
      or public.user_is_conversation_participant(conversation_id)
    )
  );
