-- Migration: sponsor campaigns (campaign tracking v1)

create table if not exists public.sponsor_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  sponsor_id uuid references public.sponsors(id) on delete cascade not null,
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'paused')),
  budget numeric(12, 2),
  start_date date,
  end_date date,
  notes text,
  related_opportunity_id uuid references public.opportunities(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists sponsor_campaigns_organization_id_idx
  on public.sponsor_campaigns (organization_id);

create index if not exists sponsor_campaigns_sponsor_id_idx
  on public.sponsor_campaigns (sponsor_id);

create index if not exists sponsor_campaigns_status_idx
  on public.sponsor_campaigns (status);

alter table public.sponsor_campaigns enable row level security;

drop policy if exists "Users can view org sponsor campaigns" on public.sponsor_campaigns;
drop policy if exists "Users can insert org sponsor campaigns" on public.sponsor_campaigns;
drop policy if exists "Users can update org sponsor campaigns" on public.sponsor_campaigns;
drop policy if exists "Users can delete org sponsor campaigns" on public.sponsor_campaigns;

create policy "Users can view org sponsor campaigns"
  on public.sponsor_campaigns for select
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can insert org sponsor campaigns"
  on public.sponsor_campaigns for insert
  with check (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can update org sponsor campaigns"
  on public.sponsor_campaigns for update
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can delete org sponsor campaigns"
  on public.sponsor_campaigns for delete
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );
