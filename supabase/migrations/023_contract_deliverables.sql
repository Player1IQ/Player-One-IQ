-- Migration: contract deliverables checklist
-- Prerequisites: contracts, organizations, team RLS helpers

create table if not exists public.contract_deliverables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  contract_id uuid references public.contracts(id) on delete cascade not null,
  title text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  due_date date,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists contract_deliverables_organization_id_idx
  on public.contract_deliverables (organization_id);

create index if not exists contract_deliverables_contract_id_idx
  on public.contract_deliverables (contract_id);

create index if not exists contract_deliverables_contract_sort_idx
  on public.contract_deliverables (contract_id, sort_order);

alter table public.contract_deliverables enable row level security;

drop policy if exists "Users can view org contract deliverables" on public.contract_deliverables;
drop policy if exists "Users can insert org contract deliverables" on public.contract_deliverables;
drop policy if exists "Users can update org contract deliverables" on public.contract_deliverables;
drop policy if exists "Users can delete org contract deliverables" on public.contract_deliverables;

create policy "Users can view org contract deliverables"
  on public.contract_deliverables for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Users can insert org contract deliverables"
  on public.contract_deliverables for insert
  with check (public.user_can_write_org(organization_id));

create policy "Users can update org contract deliverables"
  on public.contract_deliverables for update
  using (public.user_can_write_org(organization_id));

create policy "Users can delete org contract deliverables"
  on public.contract_deliverables for delete
  using (public.user_can_write_org(organization_id));
