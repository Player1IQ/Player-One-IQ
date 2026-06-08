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
