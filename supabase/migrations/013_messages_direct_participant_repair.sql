-- Migration: repair direct conversation participants
-- Orphaned direct threads only had the sender as a participant, so the other
-- org member could not see messages in their inbox.

create or replace function public.get_conversation_participant_user_ids(p_conversation_id uuid)
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select cp.user_id
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
$$;

create or replace function public.count_active_org_users(p_org_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(distinct user_id)::integer
  from (
    select tm.user_id
    from public.team_members tm
    where tm.organization_id = p_org_id
      and tm.status = 'active'
      and tm.user_id is not null
    union
    select o.user_id
    from public.organizations o
    where o.id = p_org_id
      and o.user_id is not null
  ) org_users
$$;

create or replace function public.repair_direct_conversation_participants(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_type text;
begin
  select c.organization_id, c.type
  into v_org_id, v_type
  from public.conversations c
  where c.id = p_conversation_id;

  if v_org_id is null or v_type <> 'direct' then
    return;
  end if;

  insert into public.conversation_participants (conversation_id, user_id, last_read_at)
  select p_conversation_id, m.sender_id, now()
  from public.messages m
  where m.conversation_id = p_conversation_id
  on conflict (conversation_id, user_id) do nothing;

  if (
    select count(*)::integer
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
  ) < 2
  and public.count_active_org_users(v_org_id) = 2 then
    insert into public.conversation_participants (conversation_id, user_id, last_read_at)
    select p_conversation_id, org_users.user_id, now()
    from (
      select tm.user_id
      from public.team_members tm
      where tm.organization_id = v_org_id
        and tm.status = 'active'
        and tm.user_id is not null
      union
      select o.user_id
      from public.organizations o
      where o.id = v_org_id
        and o.user_id is not null
    ) org_users
    where not exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = p_conversation_id
        and cp.user_id = org_users.user_id
    );
  end if;
end;
$$;

create or replace function public.repair_direct_conversations_for_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv record;
begin
  for v_conv in
    select c.id
    from public.conversations c
    where c.type = 'direct'
      and c.organization_id in (select public.user_organization_ids())
  loop
    perform public.repair_direct_conversation_participants(v_conv.id);
  end loop;
end;
$$;

grant execute on function public.get_conversation_participant_user_ids(uuid) to authenticated;
grant execute on function public.repair_direct_conversation_participants(uuid) to authenticated;
grant execute on function public.repair_direct_conversations_for_user() to authenticated;
