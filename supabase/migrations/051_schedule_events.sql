-- Scheduling: org events, participants, and in-app user notifications

-- ---------------------------------------------------------------------------
-- schedule_events
-- ---------------------------------------------------------------------------

create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  description text,
  event_type text not null default 'other'
    check (event_type in ('block', 'meeting', 'practice', 'stream', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  location text,
  color text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint schedule_events_ends_after_starts check (ends_at > starts_at)
);

create index if not exists schedule_events_organization_id_idx
  on public.schedule_events (organization_id);

create index if not exists schedule_events_starts_at_idx
  on public.schedule_events (starts_at);

create index if not exists schedule_events_org_starts_idx
  on public.schedule_events (organization_id, starts_at);

alter table public.schedule_events enable row level security;

-- ---------------------------------------------------------------------------
-- schedule_event_participants
-- ---------------------------------------------------------------------------

create table if not exists public.schedule_event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.schedule_events(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  creator_id uuid references public.creators(id) on delete cascade,
  role text not null default 'attendee'
    check (role in ('organizer', 'attendee', 'optional')),
  response_status text not null default 'pending'
    check (response_status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now() not null,
  constraint schedule_participant_target check (
    user_id is not null or creator_id is not null
  )
);

create index if not exists schedule_event_participants_event_id_idx
  on public.schedule_event_participants (event_id);

create index if not exists schedule_event_participants_user_id_idx
  on public.schedule_event_participants (user_id);

create index if not exists schedule_event_participants_creator_id_idx
  on public.schedule_event_participants (creator_id);

create unique index if not exists schedule_event_participants_user_unique_idx
  on public.schedule_event_participants (event_id, user_id)
  where user_id is not null;

create unique index if not exists schedule_event_participants_creator_unique_idx
  on public.schedule_event_participants (event_id, creator_id)
  where creator_id is not null;

alter table public.schedule_event_participants enable row level security;

-- ---------------------------------------------------------------------------
-- user_notifications (in-app)
-- ---------------------------------------------------------------------------

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  notification_type text not null default 'schedule'
    check (notification_type in ('schedule', 'system')),
  title text not null,
  body text,
  link text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists user_notifications_user_id_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_unread_idx
  on public.user_notifications (user_id)
  where read_at is null;

alter table public.user_notifications enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_is_schedule_event_participant(p_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.schedule_event_participants sep
    join public.schedule_events se on se.id = sep.event_id
    where sep.event_id = p_event_id
      and se.organization_id in (select public.user_organization_ids())
      and (
        sep.user_id = auth.uid()
        or sep.creator_id = public.user_linked_creator_id(se.organization_id)
      )
  )
$$;

create or replace function public.user_can_view_schedule_event(p_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.schedule_events se
    where se.id = p_event_id
      and se.organization_id in (select public.user_organization_ids())
      and (
        coalesce(public.get_user_team_role(se.organization_id), '')
          not in ('player', 'content_creator', 'sponsor')
        or se.created_by = auth.uid()
        or public.user_is_schedule_event_participant(p_event_id)
      )
  )
$$;

-- ---------------------------------------------------------------------------
-- schedule_events RLS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view schedule events" on public.schedule_events;
drop policy if exists "Users can insert schedule events" on public.schedule_events;
drop policy if exists "Users can update schedule events" on public.schedule_events;
drop policy if exists "Users can delete schedule events" on public.schedule_events;

create policy "Users can view schedule events"
  on public.schedule_events for select
  using (public.user_can_view_schedule_event(id));

create policy "Users can insert schedule events"
  on public.schedule_events for insert
  with check (
    organization_id in (select public.user_organization_ids())
    and (
      public.user_can_write_org(organization_id)
      or (
        event_type = 'block'
        and coalesce(public.get_user_team_role(organization_id), '')
          in ('player', 'content_creator')
        and created_by = auth.uid()
      )
    )
  );

create policy "Users can update schedule events"
  on public.schedule_events for update
  using (
    organization_id in (select public.user_organization_ids())
    and (
      public.user_can_write_org(organization_id)
      or (
        event_type = 'block'
        and created_by = auth.uid()
        and coalesce(public.get_user_team_role(organization_id), '')
          in ('player', 'content_creator')
      )
    )
  );

create policy "Users can delete schedule events"
  on public.schedule_events for delete
  using (
    organization_id in (select public.user_organization_ids())
    and (
      public.user_can_write_org(organization_id)
      or (
        event_type = 'block'
        and created_by = auth.uid()
        and coalesce(public.get_user_team_role(organization_id), '')
          in ('player', 'content_creator')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- schedule_event_participants RLS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view schedule participants" on public.schedule_event_participants;
drop policy if exists "Users can insert schedule participants" on public.schedule_event_participants;
drop policy if exists "Users can update schedule participants" on public.schedule_event_participants;
drop policy if exists "Users can delete schedule participants" on public.schedule_event_participants;

create policy "Users can view schedule participants"
  on public.schedule_event_participants for select
  using (public.user_can_view_schedule_event(event_id));

create policy "Users can insert schedule participants"
  on public.schedule_event_participants for insert
  with check (
    organization_id in (select public.user_organization_ids())
    and public.user_can_view_schedule_event(event_id)
    and (
      public.user_can_write_org(organization_id)
      or (
        exists (
          select 1
          from public.schedule_events se
          where se.id = event_id
            and se.event_type = 'block'
            and se.created_by = auth.uid()
        )
        and creator_id = public.user_linked_creator_id(organization_id)
      )
    )
  );

create policy "Users can update schedule participants"
  on public.schedule_event_participants for update
  using (
    organization_id in (select public.user_organization_ids())
    and (
      public.user_can_write_org(organization_id)
      or user_id = auth.uid()
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  );

create policy "Users can delete schedule participants"
  on public.schedule_event_participants for delete
  using (
    organization_id in (select public.user_organization_ids())
    and (
      public.user_can_write_org(organization_id)
      or exists (
        select 1
        from public.schedule_events se
        where se.id = event_id
          and se.event_type = 'block'
          and se.created_by = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- user_notifications RLS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view own notifications" on public.user_notifications;
drop policy if exists "Staff can insert notifications" on public.user_notifications;
drop policy if exists "Users can update own notifications" on public.user_notifications;

create policy "Users can view own notifications"
  on public.user_notifications for select
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Staff can insert notifications"
  on public.user_notifications for insert
  with check (
    organization_id in (select public.user_organization_ids())
    and public.user_can_write_org(organization_id)
  );

create policy "Users can update own notifications"
  on public.user_notifications for update
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

revoke execute on function public.user_is_schedule_event_participant(uuid) from anon, public;
revoke execute on function public.user_can_view_schedule_event(uuid) from anon, public;
