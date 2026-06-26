-- Allow portal creators to block time when their team role resolves as owner
-- but they still have a linked creator profile (solo creator/player workspaces).

create or replace function public.user_can_create_schedule_event(
  p_organization_id uuid,
  p_event_type text,
  p_created_by uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    p_organization_id in (select public.user_organization_ids())
    and (
      (
        p_event_type <> 'block'
        and public.user_can_write_org(p_organization_id)
      )
      or (
        p_event_type = 'block'
        and p_created_by = auth.uid()
        and public.user_linked_creator_id(p_organization_id) is not null
      )
    )
$$;

create or replace function public.user_can_manage_schedule_event(
  p_event_id uuid
)
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
        public.user_can_write_org(se.organization_id)
        or (
          se.event_type = 'block'
          and se.created_by = auth.uid()
          and public.user_linked_creator_id(se.organization_id) is not null
        )
      )
  )
$$;

drop policy if exists "Users can insert schedule events" on public.schedule_events;
drop policy if exists "Users can update schedule events" on public.schedule_events;
drop policy if exists "Users can delete schedule events" on public.schedule_events;
drop policy if exists "Users can insert schedule participants" on public.schedule_event_participants;
drop policy if exists "Users can delete schedule participants" on public.schedule_event_participants;

create policy "Users can insert schedule events"
  on public.schedule_events for insert
  with check (
    public.user_can_create_schedule_event(
      organization_id,
      event_type,
      created_by
    )
  );

create policy "Users can update schedule events"
  on public.schedule_events for update
  using (public.user_can_manage_schedule_event(id));

create policy "Users can delete schedule events"
  on public.schedule_events for delete
  using (public.user_can_manage_schedule_event(id));

create policy "Users can insert schedule participants"
  on public.schedule_event_participants for insert
  with check (
    organization_id in (select public.user_organization_ids())
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
      or (
        exists (
          select 1
          from public.schedule_events se
          where se.id = event_id
            and public.user_can_write_org(se.organization_id)
        )
      )
    )
  );

create policy "Users can delete schedule participants"
  on public.schedule_event_participants for delete
  using (
    organization_id in (select public.user_organization_ids())
    and (
      public.user_can_write_org(organization_id)
      or public.user_can_manage_schedule_event(event_id)
    )
  );

revoke execute on function public.user_can_create_schedule_event(uuid, text, uuid) from anon, public;
revoke execute on function public.user_can_manage_schedule_event(uuid) from anon, public;
