-- Migration: team members, invitations, and org-wide RLS helpers
-- Prerequisites: organizations, creators, sponsors, contracts tables

-- ---------------------------------------------------------------------------
-- Team members (tables first — helper functions reference these)
-- ---------------------------------------------------------------------------

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null
    check (role in ('owner', 'admin', 'manager', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index if not exists team_members_org_user_idx
  on public.team_members (organization_id, user_id)
  where user_id is not null;

create unique index if not exists team_members_org_email_idx
  on public.team_members (organization_id, lower(email));

create index if not exists team_members_organization_id_idx
  on public.team_members (organization_id);

create index if not exists team_members_user_id_idx
  on public.team_members (user_id);

-- ---------------------------------------------------------------------------
-- Team invitations
-- ---------------------------------------------------------------------------

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  email text not null,
  role text not null
    check (role in ('admin', 'manager', 'viewer')),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references auth.users(id) not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz default now() not null
);

create unique index if not exists team_invitations_pending_email_idx
  on public.team_invitations (organization_id, lower(email))
  where status = 'pending';

create index if not exists team_invitations_token_idx
  on public.team_invitations (token);

-- ---------------------------------------------------------------------------
-- Backfill owner memberships (before RLS policies)
-- ---------------------------------------------------------------------------

insert into public.team_members (
  organization_id,
  user_id,
  email,
  role,
  status,
  joined_at
)
select
  o.id,
  o.user_id,
  coalesce(u.email, ''),
  'owner',
  'active',
  o.created_at
from public.organizations o
join auth.users u on u.id = o.user_id
where not exists (
  select 1
  from public.team_members tm
  where tm.organization_id = o.id
    and tm.user_id = o.user_id
);

-- ---------------------------------------------------------------------------
-- Helper functions (after team_members exists)
-- ---------------------------------------------------------------------------

create or replace function public.user_organization_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.organizations where user_id = auth.uid()
  union
  select organization_id from public.team_members
  where user_id = auth.uid() and status = 'active'
$$;

create or replace function public.get_user_team_role(org_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select 'owner'
      from public.organizations
      where id = org_id and user_id = auth.uid()
    ),
    (
      select role
      from public.team_members
      where organization_id = org_id
        and user_id = auth.uid()
        and status = 'active'
    )
  )
$$;

create or replace function public.user_can_manage_team(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.get_user_team_role(org_id) in ('owner', 'admin'), false)
$$;

create or replace function public.user_can_write_org(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    public.get_user_team_role(org_id) in ('owner', 'admin', 'manager'),
    false
  )
$$;

-- ---------------------------------------------------------------------------
-- Team members RLS
-- ---------------------------------------------------------------------------

alter table public.team_members enable row level security;

drop policy if exists "Users can view org team members" on public.team_members;
drop policy if exists "Managers can insert team members" on public.team_members;
drop policy if exists "Managers can update team members" on public.team_members;
drop policy if exists "Managers can delete team members" on public.team_members;

create policy "Users can view org team members"
  on public.team_members for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Managers can insert team members"
  on public.team_members for insert
  with check (public.user_can_manage_team(organization_id));

create policy "Managers can update team members"
  on public.team_members for update
  using (public.user_can_manage_team(organization_id));

create policy "Managers can delete team members"
  on public.team_members for delete
  using (
    public.user_can_manage_team(organization_id)
    and role <> 'owner'
  );

-- ---------------------------------------------------------------------------
-- Team invitations RLS
-- ---------------------------------------------------------------------------

alter table public.team_invitations enable row level security;

drop policy if exists "Org managers can view invitations" on public.team_invitations;
drop policy if exists "Invitees can view their invitations" on public.team_invitations;
drop policy if exists "Managers can create invitations" on public.team_invitations;
drop policy if exists "Managers can update invitations" on public.team_invitations;
drop policy if exists "Invitees can accept invitations" on public.team_invitations;

create policy "Org managers can view invitations"
  on public.team_invitations for select
  using (public.user_can_manage_team(organization_id));

create policy "Invitees can view their invitations"
  on public.team_invitations for select
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "Managers can create invitations"
  on public.team_invitations for insert
  with check (public.user_can_manage_team(organization_id));

create policy "Managers can update invitations"
  on public.team_invitations for update
  using (public.user_can_manage_team(organization_id));

create policy "Invitees can accept invitations"
  on public.team_invitations for update
  using (
    status = 'pending'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- ---------------------------------------------------------------------------
-- Auto-create owner membership on organization creation
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_email text;
begin
  select email into owner_email from auth.users where id = new.user_id;

  insert into public.team_members (
    organization_id,
    user_id,
    email,
    role,
    status,
    joined_at
  ) values (
    new.id,
    new.user_id,
    coalesce(owner_email, ''),
    'owner',
    'active',
    now()
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;

create trigger on_organization_created
  after insert on public.organizations
  for each row
  execute function public.handle_new_organization();

-- ---------------------------------------------------------------------------
-- Update organizations RLS for team member access
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view their own organization" on public.organizations;

create policy "Users can view their organization"
  on public.organizations for select
  using (id in (select public.user_organization_ids()));

-- ---------------------------------------------------------------------------
-- Update creators RLS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org creators" on public.creators;
drop policy if exists "Users can insert org creators" on public.creators;
drop policy if exists "Users can update org creators" on public.creators;
drop policy if exists "Users can delete org creators" on public.creators;

create policy "Users can view org creators"
  on public.creators for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org creators"
  on public.creators for insert
  with check (public.user_can_write_org(organization_id));

create policy "Users can update org creators"
  on public.creators for update
  using (public.user_can_write_org(organization_id));

create policy "Users can delete org creators"
  on public.creators for delete
  using (public.user_can_write_org(organization_id));

-- ---------------------------------------------------------------------------
-- Update sponsors RLS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org sponsors" on public.sponsors;
drop policy if exists "Users can insert org sponsors" on public.sponsors;
drop policy if exists "Users can update org sponsors" on public.sponsors;
drop policy if exists "Users can delete org sponsors" on public.sponsors;

create policy "Users can view org sponsors"
  on public.sponsors for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org sponsors"
  on public.sponsors for insert
  with check (public.user_can_write_org(organization_id));

create policy "Users can update org sponsors"
  on public.sponsors for update
  using (public.user_can_write_org(organization_id));

create policy "Users can delete org sponsors"
  on public.sponsors for delete
  using (public.user_can_write_org(organization_id));

-- ---------------------------------------------------------------------------
-- Update contracts RLS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org contracts" on public.contracts;
drop policy if exists "Users can insert org contracts" on public.contracts;
drop policy if exists "Users can update org contracts" on public.contracts;
drop policy if exists "Users can delete org contracts" on public.contracts;

create policy "Users can view org contracts"
  on public.contracts for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org contracts"
  on public.contracts for insert
  with check (public.user_can_write_org(organization_id));

create policy "Users can update org contracts"
  on public.contracts for update
  using (public.user_can_write_org(organization_id));

create policy "Users can delete org contracts"
  on public.contracts for delete
  using (public.user_can_write_org(organization_id));

-- ---------------------------------------------------------------------------
-- Update activity_log RLS
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org activity" on public.activity_log;
drop policy if exists "Users can insert org activity" on public.activity_log;

create policy "Users can view org activity"
  on public.activity_log for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org activity"
  on public.activity_log for insert
  with check (organization_id in (select public.user_organization_ids()));
