-- Migration: add sponsors table (run if organizations already exists)

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  company_name text not null,
  industry text not null,
  status text not null default 'prospect'
    check (status in ('active', 'prospect', 'inactive', 'negotiating')),
  website text,
  headquarters text,
  founded text,
  description text,
  primary_contact jsonb not null default '{}'::jsonb,
  secondary_contact jsonb,
  internal_notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists sponsors_organization_id_idx
  on public.sponsors (organization_id);

alter table public.sponsors enable row level security;

drop policy if exists "Users can view org sponsors" on public.sponsors;
drop policy if exists "Users can insert org sponsors" on public.sponsors;
drop policy if exists "Users can update org sponsors" on public.sponsors;
drop policy if exists "Users can delete org sponsors" on public.sponsors;

create policy "Users can view org sponsors"
  on public.sponsors for select
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can insert org sponsors"
  on public.sponsors for insert
  with check (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can update org sponsors"
  on public.sponsors for update
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can delete org sponsors"
  on public.sponsors for delete
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );
