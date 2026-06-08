-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  type text not null,
  created_at timestamptz default now() not null
);

alter table public.organizations enable row level security;

create policy "Users can view their own organization"
  on public.organizations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own organization"
  on public.organizations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own organization"
  on public.organizations for update
  using (auth.uid() = user_id);

-- Creators (scoped to organization)
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

-- Sponsors (scoped to organization)
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
