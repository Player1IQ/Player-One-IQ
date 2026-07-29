-- Creator Coach onboarding preferences (optional per creator)

create table if not exists public.creator_coach_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  creator_id uuid references public.creators (id) on delete cascade,
  activated_at timestamptz,
  primary_goal text
    check (primary_goal is null or primary_goal in (
      'growth', 'monetization', 'consistency', 'sponsorship', 'brand'
    )),
  content_focus text[] not null default '{}',
  target_posting_days text[] not null default '{}',
  monetization_interests text[] not null default '{}',
  biggest_challenge text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists creator_coach_profiles_user_creator_idx
  on public.creator_coach_profiles (user_id, coalesce(creator_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists creator_coach_profiles_org_idx
  on public.creator_coach_profiles (organization_id, user_id);

alter table public.creator_coach_profiles enable row level security;

create policy "Users can view own coach profile"
  on public.creator_coach_profiles for select
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can insert own coach profile"
  on public.creator_coach_profiles for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can update own coach profile"
  on public.creator_coach_profiles for update
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  )
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );
