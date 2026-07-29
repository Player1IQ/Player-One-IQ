-- Creator Seasons: battle-pass style progression (creator portal only)

create table if not exists public.creator_seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.creator_season_progress (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.creator_seasons (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  opted_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists creator_season_progress_scope_idx
  on public.creator_season_progress (season_id, user_id, creator_id);

create index if not exists creator_season_progress_org_creator_idx
  on public.creator_season_progress (organization_id, creator_id);

create table if not exists public.creator_season_xp_events (
  id uuid primary key default gen_random_uuid(),
  progress_id uuid not null references public.creator_season_progress (id) on delete cascade,
  event_type text not null,
  xp_amount integer not null check (xp_amount > 0),
  source_key text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create unique index if not exists creator_season_xp_events_dedupe_idx
  on public.creator_season_xp_events (progress_id, source_key);

create index if not exists creator_season_xp_events_progress_idx
  on public.creator_season_xp_events (progress_id, created_at desc);

alter table public.creator_seasons enable row level security;
alter table public.creator_season_progress enable row level security;
alter table public.creator_season_xp_events enable row level security;

create policy "Anyone authenticated can view active seasons"
  on public.creator_seasons for select
  to authenticated
  using (is_active = true);

create policy "Users can view own season progress"
  on public.creator_season_progress for select
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can insert own season progress"
  on public.creator_season_progress for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
    and creator_id = public.user_linked_creator_id(organization_id)
  );

create policy "Users can update own season progress"
  on public.creator_season_progress for update
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  )
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can view own season xp events"
  on public.creator_season_xp_events for select
  to authenticated
  using (
    progress_id in (
      select id from public.creator_season_progress
      where user_id = auth.uid()
    )
  );

create policy "Users can insert own season xp events"
  on public.creator_season_xp_events for insert
  to authenticated
  with check (
    progress_id in (
      select id from public.creator_season_progress
      where user_id = auth.uid()
    )
  );

insert into public.creator_seasons (slug, name, description, starts_at, ends_at, is_active)
values (
  'season-1-momentum',
  'Season 1: Momentum',
  'Earn XP by completing Creator Coach missions and hitting your goals. Unlock tier rewards all season long.',
  '2026-06-01T00:00:00Z',
  '2026-08-31T23:59:59Z',
  true
)
on conflict (slug) do nothing;
