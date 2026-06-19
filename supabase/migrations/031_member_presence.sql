-- Team member presence (auth users) and creator availability status

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'inactive'
    check (status in ('online', 'away', 'in_meeting', 'inactive')),
  is_manual boolean not null default false,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;

drop policy if exists "Org members can view teammate presence" on public.user_presence;
drop policy if exists "Users can insert own presence" on public.user_presence;
drop policy if exists "Users can update own presence" on public.user_presence;

create policy "Org members can view teammate presence"
  on public.user_presence for select
  using (
    user_id = auth.uid()
    or user_id in (
      select tm.user_id
      from public.team_members tm
      where tm.user_id is not null
        and tm.status = 'active'
        and tm.organization_id in (
          select organization_id
          from public.team_members
          where user_id = auth.uid()
            and status = 'active'
        )
    )
  );

create policy "Users can insert own presence"
  on public.user_presence for insert
  with check (user_id = auth.uid());

create policy "Users can update own presence"
  on public.user_presence for update
  using (user_id = auth.uid());

alter table public.creators
  add column if not exists availability_status text not null default 'inactive'
    check (availability_status in ('online', 'away', 'in_meeting', 'inactive'));
