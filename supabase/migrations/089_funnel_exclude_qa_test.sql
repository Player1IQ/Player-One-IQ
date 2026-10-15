alter table public.marketing_funnel_events
  add column if not exists qa_test boolean not null default false;

create index if not exists marketing_funnel_events_qa_test_idx
  on public.marketing_funnel_events (qa_test, event, created_at desc);

comment on column public.marketing_funnel_events.qa_test is
  'True for automated / example.com QA traffic. Excluded from funnel count views.';

create or replace view public.marketing_funnel_step_counts
  with (security_invoker = true)
as
select
  event,
  count(*)::bigint as event_count,
  count(distinct session_id)::bigint as unique_sessions
from public.marketing_funnel_events
where qa_test = false
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
    and qa_test = false
  group by session_id
) sign
join (
  select session_id, min(created_at) as first_at
  from public.marketing_funnel_events
  where event = 'snapshot_viewed'
    and qa_test = false
  group by session_id
) snap
  on snap.session_id = sign.session_id
where snap.first_at >= sign.first_at;
