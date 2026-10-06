-- Creator weekly brief emails: preference toggle + send-log kind.

alter table public.notification_preferences
  add column if not exists email_weekly_brief boolean not null default true;

alter table public.notification_email_log
  drop constraint if exists notification_email_log_kind_check;

alter table public.notification_email_log
  add constraint notification_email_log_kind_check
  check (kind in (
    'deliverable_due',
    'contract_ending',
    'opportunity',
    'message',
    'weekly_brief'
  ));
