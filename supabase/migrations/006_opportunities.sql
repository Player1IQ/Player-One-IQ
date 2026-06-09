-- Migration: opportunities marketplace
-- Prerequisites: organizations, creators, team helper functions

-- ---------------------------------------------------------------------------
-- Helper functions for opportunity permissions
-- ---------------------------------------------------------------------------

create or replace function public.user_can_manage_opportunities(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.get_user_team_role(org_id) in ('owner', 'admin'), false)
$$;

create or replace function public.user_can_apply_opportunities(org_id uuid)
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
-- Opportunities
-- ---------------------------------------------------------------------------

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  description text,
  budget numeric(12, 2),
  category text not null,
  platform text not null,
  deliverables text,
  application_deadline date,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'filled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists opportunities_organization_id_idx
  on public.opportunities (organization_id);

create index if not exists opportunities_status_idx
  on public.opportunities (status);

create index if not exists opportunities_deadline_idx
  on public.opportunities (application_deadline);

alter table public.opportunities enable row level security;

drop policy if exists "Users can view org opportunities" on public.opportunities;
drop policy if exists "Admins can insert opportunities" on public.opportunities;
drop policy if exists "Admins can update opportunities" on public.opportunities;
drop policy if exists "Admins can delete opportunities" on public.opportunities;

create policy "Users can view org opportunities"
  on public.opportunities for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Admins can insert opportunities"
  on public.opportunities for insert
  with check (public.user_can_manage_opportunities(organization_id));

create policy "Admins can update opportunities"
  on public.opportunities for update
  using (public.user_can_manage_opportunities(organization_id));

create policy "Admins can delete opportunities"
  on public.opportunities for delete
  using (public.user_can_manage_opportunities(organization_id));

-- ---------------------------------------------------------------------------
-- Opportunity applications
-- ---------------------------------------------------------------------------

create table if not exists public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities(id) on delete cascade not null,
  creator_id uuid references public.creators(id) on delete cascade not null,
  cover_message text,
  proposed_rate numeric(12, 2),
  status text not null default 'applied'
    check (status in ('applied', 'under_review', 'accepted', 'rejected')),
  created_at timestamptz default now() not null
);

create unique index if not exists opportunity_applications_unique_idx
  on public.opportunity_applications (opportunity_id, creator_id);

create index if not exists opportunity_applications_opportunity_id_idx
  on public.opportunity_applications (opportunity_id);

create index if not exists opportunity_applications_creator_id_idx
  on public.opportunity_applications (creator_id);

alter table public.opportunity_applications enable row level security;

drop policy if exists "Users can view org applications" on public.opportunity_applications;
drop policy if exists "Managers can insert applications" on public.opportunity_applications;
drop policy if exists "Admins can update applications" on public.opportunity_applications;
drop policy if exists "Admins can delete applications" on public.opportunity_applications;

create policy "Users can view org applications"
  on public.opportunity_applications for select
  using (
    opportunity_id in (
      select id from public.opportunities
      where organization_id in (select public.user_organization_ids())
    )
  );

create policy "Managers can insert applications"
  on public.opportunity_applications for insert
  with check (
    opportunity_id in (
      select o.id from public.opportunities o
      where o.organization_id in (select public.user_organization_ids())
        and public.user_can_apply_opportunities(o.organization_id)
    )
    and creator_id in (
      select c.id from public.creators c
      where c.organization_id in (select public.user_organization_ids())
    )
  );

create policy "Admins can update applications"
  on public.opportunity_applications for update
  using (
    opportunity_id in (
      select o.id from public.opportunities o
      where public.user_can_manage_opportunities(o.organization_id)
    )
  );

create policy "Admins can delete applications"
  on public.opportunity_applications for delete
  using (
    opportunity_id in (
      select o.id from public.opportunities o
      where public.user_can_manage_opportunities(o.organization_id)
    )
  );
