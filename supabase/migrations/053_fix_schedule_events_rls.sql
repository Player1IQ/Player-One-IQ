-- Schedule RLS: resolve linked creator for blocks regardless of team role
-- (solo org owners with linked_creator_id, not only player/content_creator roles).

create or replace function public.user_schedule_linked_creator_id(org_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select tm.linked_creator_id
      from public.team_members tm
      where tm.organization_id = org_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.linked_creator_id is not null
      limit 1
    ),
    (
      select c.id
      from public.creators c
      inner join public.organizations o on o.id = c.organization_id
      where c.organization_id = org_id
        and o.user_id = auth.uid()
      order by c.created_at asc
      limit 1
    )
  )
$$;

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
        and public.user_schedule_linked_creator_id(p_organization_id) is not null
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
          and public.user_schedule_linked_creator_id(se.organization_id) is not null
        )
      )
  )
$$;

drop policy if exists "Users can insert schedule participants" on public.schedule_event_participants;

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
        and creator_id = public.user_schedule_linked_creator_id(organization_id)
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

revoke execute on function public.user_schedule_linked_creator_id(uuid) from anon, public;
revoke execute on function public.user_can_create_schedule_event(uuid, text, uuid) from anon, public;
revoke execute on function public.user_can_manage_schedule_event(uuid) from anon, public;
