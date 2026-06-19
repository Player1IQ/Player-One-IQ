-- Group chats, conversation titles, participant roles, and member removal

alter table public.conversations
  drop constraint if exists conversations_type_check;

alter table public.conversations
  add constraint conversations_type_check
  check (type in ('direct', 'opportunity', 'contract', 'group'));

alter table public.conversations
  add column if not exists title text;

alter table public.conversations
  add column if not exists created_by uuid references auth.users(id);

alter table public.conversation_participants
  add column if not exists role text not null default 'member'
  check (role in ('admin', 'member'));

create or replace function public.remove_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_type text;
  v_participant_count int;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if not public.conversation_in_user_org(p_conversation_id) then
    raise exception 'Not authorized';
  end if;

  if not public.user_is_conversation_participant(p_conversation_id) then
    raise exception 'Not a conversation participant';
  end if;

  select c.type into v_type
  from public.conversations c
  where c.id = p_conversation_id;

  if v_type is null then
    raise exception 'Conversation not found';
  end if;

  if v_type = 'direct' then
    raise exception 'Cannot remove members from a direct message';
  end if;

  if not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = p_user_id
  ) then
    return;
  end if;

  select count(*)::int into v_participant_count
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id;

  if v_participant_count <= 1 then
    raise exception 'Cannot remove the last participant';
  end if;

  delete from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.user_id = p_user_id;
end;
$$;

revoke all on function public.remove_conversation_participant(uuid, uuid) from public;
grant execute on function public.remove_conversation_participant(uuid, uuid) to authenticated;
