-- Expand organization team roles and portal creator linking

-- ---------------------------------------------------------------------------
-- team_members: new roles + linked_creator_id for portal users
-- ---------------------------------------------------------------------------

alter table public.team_members
  add column if not exists linked_creator_id uuid references public.creators(id) on delete set null;

alter table public.team_members
  drop constraint if exists team_members_role_check;

alter table public.team_members
  add constraint team_members_role_check
  check (role in (
    'owner', 'admin', 'manager', 'partnerships', 'talent_manager',
    'member', 'viewer', 'player', 'content_creator'
  ));

alter table public.team_members
  drop constraint if exists team_members_portal_creator_link_check;

alter table public.team_members
  add constraint team_members_portal_creator_link_check
  check (
    role not in ('player', 'content_creator')
    or linked_creator_id is not null
  );

create index if not exists team_members_linked_creator_id_idx
  on public.team_members (linked_creator_id)
  where linked_creator_id is not null;

-- ---------------------------------------------------------------------------
-- team_invitations: new roles + linked_creator_id for portal invites
-- ---------------------------------------------------------------------------

alter table public.team_invitations
  add column if not exists linked_creator_id uuid references public.creators(id) on delete set null;

alter table public.team_invitations
  drop constraint if exists team_invitations_role_check;

alter table public.team_invitations
  add constraint team_invitations_role_check
  check (role in (
    'admin', 'manager', 'partnerships', 'talent_manager',
    'member', 'viewer', 'player', 'content_creator'
  ));

alter table public.team_invitations
  drop constraint if exists team_invitations_portal_creator_link_check;

alter table public.team_invitations
  add constraint team_invitations_portal_creator_link_check
  check (
    role not in ('player', 'content_creator')
    or linked_creator_id is not null
  );

-- ---------------------------------------------------------------------------
-- Portal scoping helpers
-- ---------------------------------------------------------------------------

create or replace function public.user_linked_creator_id(org_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select linked_creator_id
  from public.team_members
  where organization_id = org_id
    and user_id = auth.uid()
    and status = 'active'
    and role in ('player', 'content_creator')
$$;

-- ---------------------------------------------------------------------------
-- Creators RLS: portal users see only their linked roster record
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org creators" on public.creators;

create policy "Users can view org creators"
  on public.creators for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator')
      or id = public.user_linked_creator_id(organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Contracts RLS: portal users see only contracts for their linked creator
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org contracts" on public.contracts;

create policy "Users can view org contracts"
  on public.contracts for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator')
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  );

create or replace function public.user_can_write_org(org_id uuid)
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
      'partnerships',
      'talent_manager'
    ),
    false
  )
$$;

create or replace function public.user_can_manage_opportunities(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    public.get_user_team_role(org_id) in ('owner', 'admin', 'partnerships'),
    false
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
      'talent_manager'
    ),
    false
  )
$$;

revoke execute on function public.user_linked_creator_id(uuid) from anon, public;
