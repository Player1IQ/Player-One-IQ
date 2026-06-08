-- Migration: add creators table (run if organizations already exists)

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  email text,
  primary_platform text not null,
  social_handles jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('active', 'inactive', 'pending', 'on-hold')),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists creators_organization_id_idx
  on public.creators (organization_id);

alter table public.creators enable row level security;

drop policy if exists "Users can view org creators" on public.creators;
drop policy if exists "Users can insert org creators" on public.creators;
drop policy if exists "Users can update org creators" on public.creators;
drop policy if exists "Users can delete org creators" on public.creators;

create policy "Users can view org creators"
  on public.creators for select
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can insert org creators"
  on public.creators for insert
  with check (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can update org creators"
  on public.creators for update
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );

create policy "Users can delete org creators"
  on public.creators for delete
  using (
    organization_id in (
      select id from public.organizations where user_id = auth.uid()
    )
  );
