-- Portal opportunity applications: content creators browse open opportunities
-- and apply as their linked creator profile.

-- ---------------------------------------------------------------------------
-- Extend apply permission to content creators
-- ---------------------------------------------------------------------------

create or replace function public.user_can_apply_opportunities(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    public.get_user_team_role(org_id) in (
      'owner',
      'admin',
      'manager',
      'talent_manager',
      'content_creator'
    ),
    false
  )
$$;

-- ---------------------------------------------------------------------------
-- opportunity_applications SELECT: portal users see only their applications
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org applications" on public.opportunity_applications;

create policy "Users can view org applications"
  on public.opportunity_applications for select
  using (
    opportunity_id in (
      select o.id
      from public.opportunities o
      where o.organization_id in (select public.user_organization_ids())
    )
    and (
      coalesce(
        public.get_user_team_role(
          (
            select o.organization_id
            from public.opportunities o
            where o.id = opportunity_applications.opportunity_id
          )
        ),
        ''
      ) not in ('player', 'content_creator')
      or creator_id = public.user_linked_creator_id(
        (
          select o.organization_id
          from public.opportunities o
          where o.id = opportunity_applications.opportunity_id
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- opportunity_applications INSERT: staff managers + portal content creators
-- ---------------------------------------------------------------------------

drop policy if exists "Managers can insert applications" on public.opportunity_applications;

create policy "Users can insert applications"
  on public.opportunity_applications for insert
  with check (
    opportunity_id in (
      select o.id
      from public.opportunities o
      where o.organization_id in (select public.user_organization_ids())
        and public.user_can_apply_opportunities(o.organization_id)
        and (
          coalesce(public.get_user_team_role(o.organization_id), '')
            not in ('player', 'content_creator')
          or o.status = 'open'
        )
    )
    and creator_id in (
      select c.id
      from public.creators c
      where c.organization_id in (select public.user_organization_ids())
    )
    and (
      coalesce(
        public.get_user_team_role(
          (
            select o.organization_id
            from public.opportunities o
            where o.id = opportunity_applications.opportunity_id
          )
        ),
        ''
      ) not in ('player', 'content_creator')
      or creator_id = public.user_linked_creator_id(
        (
          select o.organization_id
          from public.opportunities o
          where o.id = opportunity_applications.opportunity_id
        )
      )
    )
  );
