-- Allow portal users to accept or decline schedule invitations.

create or replace function public.respond_to_schedule_invite(
  p_participant_id uuid,
  p_response text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_creator_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_response not in ('accepted', 'declined') then
    raise exception 'Invalid response';
  end if;

  select sep.organization_id, sep.creator_id
  into v_org_id, v_creator_id
  from public.schedule_event_participants sep
  join public.schedule_events se on se.id = sep.event_id
  where sep.id = p_participant_id
    and se.event_type <> 'block';

  if v_org_id is null then
    raise exception 'Invitation not found';
  end if;

  if v_org_id not in (select public.user_organization_ids()) then
    raise exception 'Not authorized';
  end if;

  if not exists (
    select 1
    from public.schedule_event_participants sep
    where sep.id = p_participant_id
      and (
        sep.user_id = v_user_id
        or sep.creator_id = public.user_schedule_linked_creator_id(v_org_id)
      )
  ) then
    raise exception 'Not authorized to respond';
  end if;

  update public.schedule_event_participants
  set response_status = p_response
  where id = p_participant_id;
end;
$$;

revoke all on function public.respond_to_schedule_invite(uuid, text) from public;
grant execute on function public.respond_to_schedule_invite(uuid, text) to authenticated;
