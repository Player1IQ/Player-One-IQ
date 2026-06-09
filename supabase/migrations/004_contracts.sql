-- Migration: add contracts and activity_log tables
-- Prerequisites: organizations, creators, and sponsors tables must exist

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  creator_id uuid references public.creators(id) on delete restrict not null,
  sponsor_id uuid references public.sponsors(id) on delete restrict not null,
  contract_name text not null,
  contract_value numeric(12, 2) not null default 0,
  contract_status text not null default 'draft'
    check (contract_status in (
      'draft', 'negotiating', 'active', 'completed', 'expired', 'cancelled'
    )),
  start_date date,
  end_date date,
  deliverables text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists contracts_organization_id_idx
  on public.contracts (organization_id);

create index if not exists contracts_creator_id_idx
  on public.contracts (creator_id);

create index if not exists contracts_sponsor_id_idx
  on public.contracts (sponsor_id);

create index if not exists contracts_status_idx
  on public.contracts (contract_status);

create index if not exists contracts_end_date_idx
  on public.contracts (end_date);

alter table public.contracts enable row level security;

drop policy if exists "Users can view org contracts" on public.contracts;
drop policy if exists "Users can insert org contracts" on public.contracts;
drop policy if exists "Users can update org contracts" on public.contracts;
drop policy if exists "Users can delete org contracts" on public.contracts;

create policy "Users can view org contracts"
  on public.contracts for select
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can insert org contracts"
  on public.contracts for insert
  with check (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can update org contracts"
  on public.contracts for update
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can delete org contracts"
  on public.contracts for delete
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

-- Activity log (org-scoped audit trail)
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  entity_type text not null,
  entity_id uuid,
  action text not null
    check (action in ('created', 'updated', 'status_changed', 'deleted')),
  summary text not null,
  detail text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists activity_log_organization_id_idx
  on public.activity_log (organization_id);

create index if not exists activity_log_created_at_idx
  on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "Users can view org activity" on public.activity_log;
drop policy if exists "Users can insert org activity" on public.activity_log;

create policy "Users can view org activity"
  on public.activity_log for select
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can insert org activity"
  on public.activity_log for insert
  with check (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );
