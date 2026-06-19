-- Allow org members to bootstrap deal room / group participants without being
-- an existing participant first (fixes "Not a conversation participant").

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
  v_type text;
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
    select c.type into v_type
    from public.conversations c
    where c.id = p_conversation_id;

    if v_type = 'direct'
       or not public.user_is_active_org_member(v_actor, v_org_id) then
      raise exception 'Not a conversation participant';
    end if;
  end if;

  insert into public.conversation_participants (conversation_id, user_id, last_read_at)
  values (p_conversation_id, p_user_id, now())
  on conflict (conversation_id, user_id) do nothing;
end;
$$;

grant execute on function public.ensure_conversation_participant(uuid, uuid) to authenticated;
