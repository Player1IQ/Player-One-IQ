-- Schedule writes via SECURITY DEFINER RPCs.
-- Server actions may validate the session with auth.getUser() while PostgREST
-- inserts still fail RLS when the JWT is not attached to the DB request.

create or replace function public.create_creator_schedule_block(
  p_organization_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_all_day boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_creator_id uuid;
  v_event_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_organization_id not in (select public.user_organization_ids()) then
    raise exception 'Not authorized for this organization';
  end if;

  v_creator_id := public.user_schedule_linked_creator_id(p_organization_id);
  if v_creator_id is null then
    raise exception 'No linked creator profile';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'End time must be after start time';
  end if;

  insert into public.schedule_events (
    organization_id,
    title,
    event_type,
    starts_at,
    ends_at,
    all_day,
    created_by
  )
  values (
    p_organization_id,
    coalesce(nullif(trim(p_title), ''), 'Blocked'),
    'block',
    p_starts_at,
    p_ends_at,
    coalesce(p_all_day, false),
    v_user_id
  )
  returning id into v_event_id;

  insert into public.schedule_event_participants (
    event_id,
    organization_id,
    creator_id,
    role
  )
  values (
    v_event_id,
    p_organization_id,
    v_creator_id,
    'organizer'
  );

  return v_event_id;
end;
$$;

create or replace function public.update_creator_schedule_block(
  p_event_id uuid,
  p_organization_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_all_day boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.user_can_manage_schedule_event(p_event_id) then
    raise exception 'Not authorized to update this event';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'End time must be after start time';
  end if;

  update public.schedule_events
  set
    title = coalesce(nullif(trim(p_title), ''), 'Blocked'),
    starts_at = p_starts_at,
    ends_at = p_ends_at,
    all_day = coalesce(p_all_day, false),
    updated_at = now()
  where id = p_event_id
    and organization_id = p_organization_id
    and event_type = 'block'
    and created_by = v_user_id;

  if not found then
    raise exception 'Event not found';
  end if;

  return p_event_id;
end;
$$;

create or replace function public.create_org_schedule_event(
  p_organization_id uuid,
  p_title text,
  p_description text,
  p_event_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_all_day boolean default false,
  p_location text default null,
  p_color text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_organization_id not in (select public.user_organization_ids()) then
    raise exception 'Not authorized for this organization';
  end if;

  if not public.user_can_write_org(p_organization_id) then
    raise exception 'You do not have permission to create schedule events';
  end if;

  if p_event_type not in ('meeting', 'practice', 'stream', 'other') then
    raise exception 'Invalid event type';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Title is required';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'End time must be after start time';
  end if;

  insert into public.schedule_events (
    organization_id,
    title,
    description,
    event_type,
    starts_at,
    ends_at,
    all_day,
    created_by,
    location,
    color
  )
  values (
    p_organization_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_event_type,
    p_starts_at,
    p_ends_at,
    coalesce(p_all_day, false),
    v_user_id,
    nullif(trim(coalesce(p_location, '')), ''),
    p_color
  )
  returning id into v_event_id;

  insert into public.schedule_event_participants (
    event_id,
    organization_id,
    user_id,
    role
  )
  values (
    v_event_id,
    p_organization_id,
    v_user_id,
    'organizer'
  );

  return v_event_id;
end;
$$;

revoke all on function public.create_creator_schedule_block(uuid, text, timestamptz, timestamptz, boolean) from public;
revoke all on function public.update_creator_schedule_block(uuid, uuid, text, timestamptz, timestamptz, boolean) from public;
revoke all on function public.create_org_schedule_event(uuid, text, text, text, timestamptz, timestamptz, boolean, text, text) from public;

grant execute on function public.create_creator_schedule_block(uuid, text, timestamptz, timestamptz, boolean) to authenticated;
grant execute on function public.update_creator_schedule_block(uuid, uuid, text, timestamptz, timestamptz, boolean) to authenticated;
grant execute on function public.create_org_schedule_event(uuid, text, text, text, timestamptz, timestamptz, boolean, text, text) to authenticated;
