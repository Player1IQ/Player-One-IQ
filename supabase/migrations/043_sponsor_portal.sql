-- Sponsor portal: team role, linked sponsor, and scoped RLS

-- ---------------------------------------------------------------------------
-- team_members: sponsor role + linked_sponsor_id
-- ---------------------------------------------------------------------------

alter table public.team_members
  add column if not exists linked_sponsor_id uuid references public.sponsors(id) on delete set null;

alter table public.team_members
  drop constraint if exists team_members_role_check;

alter table public.team_members
  add constraint team_members_role_check
  check (role in (
    'owner', 'admin', 'manager', 'partnerships', 'talent_manager',
    'member', 'viewer', 'player', 'content_creator', 'sponsor'
  ));

alter table public.team_members
  drop constraint if exists team_members_portal_creator_link_check;

alter table public.team_members
  add constraint team_members_portal_creator_link_check
  check (
    role not in ('player', 'content_creator')
    or linked_creator_id is not null
  );

alter table public.team_members
  drop constraint if exists team_members_portal_sponsor_link_check;

alter table public.team_members
  add constraint team_members_portal_sponsor_link_check
  check (
    role != 'sponsor'
    or linked_sponsor_id is not null
  );

create index if not exists team_members_linked_sponsor_id_idx
  on public.team_members (linked_sponsor_id)
  where linked_sponsor_id is not null;

-- ---------------------------------------------------------------------------
-- team_invitations: sponsor role + linked_sponsor_id
-- ---------------------------------------------------------------------------

alter table public.team_invitations
  add column if not exists linked_sponsor_id uuid references public.sponsors(id) on delete set null;

alter table public.team_invitations
  drop constraint if exists team_invitations_role_check;

alter table public.team_invitations
  add constraint team_invitations_role_check
  check (role in (
    'admin', 'manager', 'partnerships', 'talent_manager',
    'member', 'viewer', 'player', 'content_creator', 'sponsor'
  ));

alter table public.team_invitations
  drop constraint if exists team_invitations_portal_creator_link_check;

alter table public.team_invitations
  add constraint team_invitations_portal_creator_link_check
  check (
    role not in ('player', 'content_creator')
    or linked_creator_id is not null
  );

alter table public.team_invitations
  drop constraint if exists team_invitations_portal_sponsor_link_check;

alter table public.team_invitations
  add constraint team_invitations_portal_sponsor_link_check
  check (
    role != 'sponsor'
    or linked_sponsor_id is not null
  );

-- ---------------------------------------------------------------------------
-- Portal scoping helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_linked_sponsor_id(org_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select linked_sponsor_id
  from public.team_members
  where organization_id = org_id
    and user_id = auth.uid()
    and status = 'active'
    and role = 'sponsor'
$$;

-- ---------------------------------------------------------------------------
-- Sponsors RLS: sponsor portal users see only their linked sponsor
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org sponsors" on public.sponsors;

create policy "Users can view org sponsors"
  on public.sponsors for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '') != 'sponsor'
      or id = public.user_linked_sponsor_id(organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Contracts RLS: sponsor portal users see contracts for their linked sponsor
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org contracts" on public.contracts;

create policy "Users can view org contracts"
  on public.contracts for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator', 'sponsor')
      or (
        public.get_user_team_role(organization_id) in ('player', 'content_creator')
        and creator_id = public.user_linked_creator_id(organization_id)
      )
      or (
        public.get_user_team_role(organization_id) = 'sponsor'
        and sponsor_id = public.user_linked_sponsor_id(organization_id)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Sponsor campaigns RLS: sponsor portal users see campaigns for linked sponsor
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org sponsor campaigns" on public.sponsor_campaigns;

create policy "Users can view org sponsor campaigns"
  on public.sponsor_campaigns for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator', 'sponsor')
      or (
        public.get_user_team_role(organization_id) in ('player', 'content_creator')
        and exists (
          select 1
          from public.sponsor_campaign_creators scc
          where scc.campaign_id = id
            and scc.creator_id = public.user_linked_creator_id(organization_id)
        )
      )
      or (
        public.get_user_team_role(organization_id) = 'sponsor'
        and sponsor_id = public.user_linked_sponsor_id(organization_id)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Contract deliverables SELECT: include sponsor portal scoping
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org contract deliverables" on public.contract_deliverables;

create policy "Users can view org contract deliverables"
  on public.contract_deliverables for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator', 'sponsor')
      or exists (
        select 1
        from public.contracts c
        where c.id = contract_deliverables.contract_id
          and (
            (
              public.get_user_team_role(organization_id) in ('player', 'content_creator')
              and c.creator_id = public.user_linked_creator_id(organization_id)
            )
            or (
              public.get_user_team_role(organization_id) = 'sponsor'
              and c.sponsor_id = public.user_linked_sponsor_id(organization_id)
            )
          )
      )
    )
  );

revoke execute on function public.user_linked_sponsor_id(uuid) from anon, public;
