-- Schedule update/delete/participant RPCs (bypass RLS for server actions).

create or replace function public.delete_schedule_event(
  p_event_id uuid,
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.user_can_manage_schedule_event(p_event_id) then
    raise exception 'Not authorized to delete this event';
  end if;

  delete from public.schedule_events
  where id = p_event_id
    and organization_id = p_organization_id;

  if not found then
    raise exception 'Event not found';
  end if;
end;
$$;

create or replace function public.update_org_schedule_event(
  p_event_id uuid,
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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.user_can_manage_schedule_event(p_event_id) then
    raise exception 'Not authorized to update this event';
  end if;

  if not public.user_can_write_org(p_organization_id) then
    raise exception 'You do not have permission to update schedule events';
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

  update public.schedule_events
  set
    title = trim(p_title),
    description = nullif(trim(coalesce(p_description, '')), ''),
    event_type = p_event_type,
    starts_at = p_starts_at,
    ends_at = p_ends_at,
    all_day = coalesce(p_all_day, false),
    location = nullif(trim(coalesce(p_location, '')), ''),
    color = p_color,
    updated_at = now()
  where id = p_event_id
    and organization_id = p_organization_id
    and event_type <> 'block';

  if not found then
    raise exception 'Event not found';
  end if;

  return p_event_id;
end;
$$;

create or replace function public.sync_schedule_event_participants(
  p_event_id uuid,
  p_organization_id uuid,
  p_user_ids uuid[] default '{}',
  p_creator_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_creator_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.user_can_manage_schedule_event(p_event_id) then
    raise exception 'Not authorized to manage participants';
  end if;

  if not public.user_can_write_org(p_organization_id) then
    raise exception 'You do not have permission to manage participants';
  end if;

  if not exists (
    select 1
    from public.schedule_events se
    where se.id = p_event_id
      and se.organization_id = p_organization_id
  ) then
    raise exception 'Event not found';
  end if;

  delete from public.schedule_event_participants
  where event_id = p_event_id
    and role <> 'organizer';

  if p_user_ids is not null then
    foreach v_user_id in array p_user_ids loop
      if v_user_id is null then
        continue;
      end if;

      if not public.user_is_active_org_member(v_user_id, p_organization_id) then
        raise exception 'User is not in this organization';
      end if;

      if exists (
        select 1
        from public.schedule_event_participants sep
        where sep.event_id = p_event_id
          and sep.user_id = v_user_id
          and sep.role = 'organizer'
      ) then
        continue;
      end if;

      insert into public.schedule_event_participants (
        event_id,
        organization_id,
        user_id,
        role
      )
      values (p_event_id, p_organization_id, v_user_id, 'attendee')
      on conflict (event_id, user_id) where user_id is not null do nothing;
    end loop;
  end if;

  if p_creator_ids is not null then
    foreach v_creator_id in array p_creator_ids loop
      if v_creator_id is null then
        continue;
      end if;

      if not exists (
        select 1
        from public.creators c
        where c.id = v_creator_id
          and c.organization_id = p_organization_id
      ) then
        raise exception 'Creator is not in this organization';
      end if;

      insert into public.schedule_event_participants (
        event_id,
        organization_id,
        creator_id,
        role
      )
      values (p_event_id, p_organization_id, v_creator_id, 'attendee')
      on conflict (event_id, creator_id) where creator_id is not null do nothing;
    end loop;
  end if;
end;
$$;

create or replace function public.insert_schedule_notifications(
  p_organization_id uuid,
  p_event_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_user_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_body text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.user_can_write_org(p_organization_id) then
    raise exception 'Not authorized';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    return;
  end if;

  v_body := p_title || ' — ' || to_char(
    p_starts_at at time zone 'UTC',
    'Dy Mon DD, HH12:MI AM'
  );

  foreach v_user_id in array p_user_ids loop
    if v_user_id is null or v_user_id = auth.uid() then
      continue;
    end if;

    if not public.user_is_active_org_member(v_user_id, p_organization_id) then
      continue;
    end if;

    insert into public.user_notifications (
      organization_id,
      user_id,
      notification_type,
      title,
      body,
      link,
      entity_type,
      entity_id
    )
    values (
      p_organization_id,
      v_user_id,
      'schedule',
      'New schedule event',
      v_body,
      '/schedule',
      'schedule_event',
      p_event_id
    );
  end loop;
end;
$$;

revoke all on function public.delete_schedule_event(uuid, uuid) from public;
revoke all on function public.update_org_schedule_event(uuid, uuid, text, text, text, timestamptz, timestamptz, boolean, text, text) from public;
revoke all on function public.sync_schedule_event_participants(uuid, uuid, uuid[], uuid[]) from public;
revoke all on function public.insert_schedule_notifications(uuid, uuid, text, timestamptz, uuid[]) from public;

grant execute on function public.delete_schedule_event(uuid, uuid) to authenticated;
grant execute on function public.update_org_schedule_event(uuid, uuid, text, text, text, timestamptz, timestamptz, boolean, text, text) to authenticated;
grant execute on function public.sync_schedule_event_participants(uuid, uuid, uuid[], uuid[]) to authenticated;
grant execute on function public.insert_schedule_notifications(uuid, uuid, text, timestamptz, uuid[]) to authenticated;
