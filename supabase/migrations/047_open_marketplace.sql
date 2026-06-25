-- Open marketplace: cross-org opportunity listings for creator portal users.

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

alter table public.opportunities
  add column if not exists marketplace_listing boolean not null default false;

create index if not exists opportunities_marketplace_open_idx
  on public.opportunities (marketplace_listing, status)
  where marketplace_listing = true and status = 'open';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_has_creator_portal_role()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where user_id = auth.uid()
      and status = 'active'
      and role in ('player', 'content_creator')
  )
$$;

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
      'content_creator',
      'player'
    ),
    false
  )
$$;

-- ---------------------------------------------------------------------------
-- opportunities SELECT: org members + open marketplace for creator portal
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org opportunities" on public.opportunities;

create policy "Users can view opportunities"
  on public.opportunities for select
  using (
    organization_id in (select public.user_organization_ids())
    or (
      marketplace_listing = true
      and status = 'open'
      and public.user_has_creator_portal_role()
    )
  );

-- ---------------------------------------------------------------------------
-- opportunity_applications SELECT: portal users see own applications cross-org
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org applications" on public.opportunity_applications;

create policy "Users can view org applications"
  on public.opportunity_applications for select
  using (
    (
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
    )
    or (
      public.user_has_creator_portal_role()
      and exists (
        select 1
        from public.team_members tm
        where tm.user_id = auth.uid()
          and tm.status = 'active'
          and tm.role in ('player', 'content_creator')
          and tm.linked_creator_id = opportunity_applications.creator_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- opportunity_applications INSERT: marketplace cross-org apply
-- ---------------------------------------------------------------------------

drop policy if exists "Users can insert applications" on public.opportunity_applications;

create policy "Users can insert applications"
  on public.opportunity_applications for insert
  with check (
    (
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
    )
    or (
      opportunity_id in (
        select o.id
        from public.opportunities o
        where o.marketplace_listing = true
          and o.status = 'open'
          and o.organization_id not in (select public.user_organization_ids())
      )
      and public.user_has_creator_portal_role()
      and creator_id in (
        select c.id
        from public.creators c
        where c.organization_id in (select public.user_organization_ids())
      )
      and exists (
        select 1
        from public.team_members tm
        where tm.user_id = auth.uid()
          and tm.status = 'active'
          and tm.role in ('player', 'content_creator')
          and tm.linked_creator_id = opportunity_applications.creator_id
          and tm.organization_id in (
            select c.organization_id
            from public.creators c
            where c.id = opportunity_applications.creator_id
          )
      )
    )
  );

revoke execute on function public.user_has_creator_portal_role() from anon, public;
