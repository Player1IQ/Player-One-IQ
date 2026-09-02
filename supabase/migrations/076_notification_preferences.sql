-- Email notification preferences and send-log for deal/opportunity/message mail.

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email_deal_deadlines boolean not null default true,
  email_new_opportunities boolean not null default true,
  email_new_messages boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_org_user_unique unique (organization_id, user_id)
);

create index if not exists notification_preferences_user_id_idx
  on public.notification_preferences (user_id);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can view own notification preferences" on public.notification_preferences;
drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
drop policy if exists "Users can update own notification preferences" on public.notification_preferences;

create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on table public.notification_preferences to authenticated;

create table if not exists public.notification_email_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null
    check (kind in (
      'deliverable_due',
      'contract_ending',
      'opportunity',
      'message'
    )),
  entity_id text not null,
  window_key text not null,
  sent_at timestamptz not null default now(),
  constraint notification_email_log_dedupe unique (user_id, kind, entity_id, window_key)
);

create index if not exists notification_email_log_lookup_idx
  on public.notification_email_log (user_id, kind, entity_id, sent_at desc);

alter table public.notification_email_log enable row level security;

revoke all on table public.notification_email_log from authenticated, anon;
