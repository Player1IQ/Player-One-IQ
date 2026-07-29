-- Creator Coach: daily missions and recommendation persistence

create table if not exists public.creator_coach_state (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  creator_id uuid references public.creators (id) on delete cascade,
  mission_date date not null default (timezone('utc', now()))::date,
  mission_sequence integer not null default 0,
  mission_json jsonb not null,
  dismissed_recommendation_ids text[] not null default '{}',
  completed_recommendation_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists creator_coach_state_scope_unique_idx
  on public.creator_coach_state (
    user_id,
    coalesce(creator_id, '00000000-0000-0000-0000-000000000000'::uuid),
    mission_date,
    mission_sequence
  );

create index if not exists creator_coach_state_org_user_idx
  on public.creator_coach_state (organization_id, user_id, mission_date desc);

alter table public.creator_coach_state enable row level security;

drop policy if exists "Users can view own coach state" on public.creator_coach_state;
drop policy if exists "Users can insert own coach state" on public.creator_coach_state;
drop policy if exists "Users can update own coach state" on public.creator_coach_state;
drop policy if exists "Users can delete own coach state" on public.creator_coach_state;

create policy "Users can view own coach state"
  on public.creator_coach_state for select
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can insert own coach state"
  on public.creator_coach_state for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can update own coach state"
  on public.creator_coach_state for update
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  )
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can delete own coach state"
  on public.creator_coach_state for delete
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );
