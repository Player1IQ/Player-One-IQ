-- Last successful per-platform content payload so growth pages can render
-- without calling Twitch/YouTube/Kick/TikTok/Instagram during SSR.

create table if not exists public.creator_platform_content_cache (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  platform_account_id uuid references public.creator_platform_accounts(id) on delete set null,
  platform text not null
    check (platform in ('YouTube', 'Twitch', 'Instagram', 'TikTok', 'Kick')),
  items jsonb not null default '[]'::jsonb,
  audience_size bigint,
  fetched_at timestamptz not null default now(),
  last_error text,
  constraint creator_platform_content_cache_unique unique (creator_id, platform)
);

create index if not exists creator_platform_content_cache_creator_idx
  on public.creator_platform_content_cache (creator_id, fetched_at desc);

alter table public.creator_platform_content_cache enable row level security;

drop policy if exists "Users can view org content cache"
  on public.creator_platform_content_cache;

create policy "Users can view org content cache"
  on public.creator_platform_content_cache for select
  to authenticated
  using (
    public.user_is_active_org_member(auth.uid(), organization_id)
    and (
      public.user_has_full_permission(organization_id, 'creators')
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  );

grant select on table public.creator_platform_content_cache to authenticated;
revoke insert, update, delete on table public.creator_platform_content_cache
  from authenticated;
revoke all on table public.creator_platform_content_cache from anon;
