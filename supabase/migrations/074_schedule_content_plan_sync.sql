-- Link schedule events to creator content plans for AI plan sync.

alter table public.schedule_events
  add column if not exists content_plan_id uuid
    references public.creator_content_plans (id) on delete set null,
  add column if not exists content_plan_item_id text;

create unique index if not exists schedule_events_content_plan_item_uidx
  on public.schedule_events (content_plan_id, content_plan_item_id)
  where content_plan_id is not null
    and content_plan_item_id is not null;

create index if not exists schedule_events_content_plan_id_idx
  on public.schedule_events (content_plan_id)
  where content_plan_id is not null;

-- Upsert a plan-linked schedule event for the linked portal creator.
create or replace function public.upsert_creator_plan_schedule_event(
  p_organization_id uuid,
  p_plan_id uuid,
  p_plan_item_id text,
  p_title text,
  p_description text,
  p_event_type text,
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

  if p_plan_id is null or nullif(trim(p_plan_item_id), '') is null then
    raise exception 'Plan id and item id are required';
  end if;

  if not exists (
    select 1
    from public.creator_content_plans cp
    where cp.id = p_plan_id
      and cp.organization_id = p_organization_id
      and cp.creator_id = v_creator_id
      and cp.user_id = v_user_id
  ) then
    raise exception 'Content plan not found';
  end if;

  if p_event_type not in ('block', 'meeting', 'practice', 'stream', 'other') then
    raise exception 'Invalid event type';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'End time must be after start time';
  end if;

  select se.id
  into v_event_id
  from public.schedule_events se
  where se.organization_id = p_organization_id
    and se.content_plan_item_id = p_plan_item_id
    and se.content_plan_id is not null
    and exists (
      select 1
      from public.schedule_event_participants sep
      where sep.event_id = se.id
        and sep.organization_id = p_organization_id
        and sep.creator_id = v_creator_id
        and sep.role = 'organizer'
    )
  order by se.updated_at desc
  limit 1;

  if v_event_id is not null then
    update public.schedule_events
    set
      content_plan_id = p_plan_id,
      title = coalesce(nullif(trim(p_title), ''), 'Planned content'),
      description = nullif(trim(coalesce(p_description, '')), ''),
      event_type = p_event_type,
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      all_day = coalesce(p_all_day, false),
      updated_at = now()
    where id = v_event_id
      and organization_id = p_organization_id;

    return v_event_id;
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
    content_plan_id,
    content_plan_item_id
  )
  values (
    p_organization_id,
    coalesce(nullif(trim(p_title), ''), 'Planned content'),
    nullif(trim(coalesce(p_description, '')), ''),
    p_event_type,
    p_starts_at,
    p_ends_at,
    coalesce(p_all_day, false),
    v_user_id,
    p_plan_id,
    p_plan_item_id
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

-- Delete AI plan-linked events for a single calendar day (UTC date of starts_at).
create or replace function public.delete_creator_plan_schedule_events_for_day(
  p_organization_id uuid,
  p_plan_id uuid,
  p_date date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_creator_id uuid;
  v_deleted integer;
  v_day_start timestamptz;
  v_day_end timestamptz;
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

  v_day_start := (p_date::text || 'T00:00:00.000Z')::timestamptz;
  v_day_end := v_day_start + interval '1 day';

  delete from public.schedule_events se
  where se.organization_id = p_organization_id
    and se.content_plan_id = p_plan_id
    and se.content_plan_id is not null
    and se.starts_at >= v_day_start
    and se.starts_at < v_day_end
    and exists (
      select 1
      from public.schedule_event_participants sep
      where sep.event_id = se.id
        and sep.organization_id = p_organization_id
        and sep.creator_id = v_creator_id
        and sep.role = 'organizer'
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.upsert_creator_plan_schedule_event(
  uuid, uuid, text, text, text, text, timestamptz, timestamptz, boolean
) from public;

revoke all on function public.delete_creator_plan_schedule_events_for_day(
  uuid, uuid, date
) from public;

grant execute on function public.upsert_creator_plan_schedule_event(
  uuid, uuid, text, text, text, text, timestamptz, timestamptz, boolean
) to authenticated;

grant execute on function public.delete_creator_plan_schedule_events_for_day(
  uuid, uuid, date
) to authenticated;
