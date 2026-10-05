-- C-lite: anonymous marketing funnel events + daily platform metric history.

create table if not exists public.marketing_funnel_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null,
  event text not null
    check (event in (
      'visit',
      'signup',
      'connect_started',
      'connect_completed',
      'snapshot_viewed',
      'plan_generated',
      'weekly_return'
    )),
  platform text
    check (
      platform is null
      or platform in ('YouTube', 'Twitch', 'Instagram', 'TikTok', 'Kick')
    )
);

create index if not exists marketing_funnel_events_event_created_idx
  on public.marketing_funnel_events (event, created_at desc);

create index if not exists marketing_funnel_events_session_event_idx
  on public.marketing_funnel_events (session_id, event, created_at);

alter table public.marketing_funnel_events enable row level security;

revoke all on table public.marketing_funnel_events from anon, authenticated;

comment on table public.marketing_funnel_events is
  'Anonymous activation funnel. No emails, user ids, or tokens. Written only via the app API.';

create or replace view public.marketing_funnel_step_counts
  with (security_invoker = true)
as
select
  event,
  count(*)::bigint as event_count,
  count(distinct session_id)::bigint as unique_sessions
from public.marketing_funnel_events
group by event
order by event;

create or replace view public.marketing_funnel_signup_to_snapshot
  with (security_invoker = true)
as
select
  count(*)::bigint as completed_sessions,
  percentile_cont(0.5) within group (
    order by extract(epoch from (snap.first_at - sign.first_at))
  ) as median_seconds
from (
  select session_id, min(created_at) as first_at
  from public.marketing_funnel_events
  where event = 'signup'
  group by session_id
) sign
join (
  select session_id, min(created_at) as first_at
  from public.marketing_funnel_events
  where event = 'snapshot_viewed'
  group by session_id
) snap
  on snap.session_id = sign.session_id
where snap.first_at >= sign.first_at;

revoke all on public.marketing_funnel_step_counts from anon, authenticated;
revoke all on public.marketing_funnel_signup_to_snapshot from anon, authenticated;

create table if not exists public.creator_platform_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  platform_account_id uuid references public.creator_platform_accounts(id) on delete set null,
  platform text not null
    check (platform in ('YouTube', 'Twitch', 'Instagram', 'TikTok', 'Kick')),
  captured_on date not null default ((timezone('utc', now()))::date),
  audience_size bigint,
  view_total bigint,
  content_count integer,
  created_at timestamptz not null default now(),
  constraint creator_platform_metric_snapshots_unique
    unique (creator_id, platform, captured_on)
);

create index if not exists creator_platform_metric_snapshots_creator_idx
  on public.creator_platform_metric_snapshots (creator_id, captured_on desc);

alter table public.creator_platform_metric_snapshots enable row level security;

drop policy if exists "Users can view org metric snapshots"
  on public.creator_platform_metric_snapshots;

create policy "Users can view org metric snapshots"
  on public.creator_platform_metric_snapshots for select
  to authenticated
  using (
    public.user_is_active_org_member(auth.uid(), organization_id)
    and (
      public.user_has_full_permission(organization_id, 'creators')
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  );

grant select on table public.creator_platform_metric_snapshots to authenticated;
revoke insert, update, delete on table public.creator_platform_metric_snapshots
  from authenticated;
revoke all on table public.creator_platform_metric_snapshots from anon;
