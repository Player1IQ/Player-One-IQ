-- Migration: add X (Twitter) as a supported platform (OAuth wiring comes later)
-- Run when ready to support X connect + content coach

alter table public.creator_platform_accounts
  drop constraint if exists creator_platform_accounts_platform_check;

alter table public.creator_platform_accounts
  add constraint creator_platform_accounts_platform_check
  check (platform in ('YouTube', 'Twitch', 'TikTok', 'Instagram', 'Kick', 'X'));

alter table public.creator_revenue_entries
  drop constraint if exists creator_revenue_entries_platform_check;

alter table public.creator_revenue_entries
  add constraint creator_revenue_entries_platform_check
  check (platform in ('YouTube', 'Twitch', 'TikTok', 'Instagram', 'Kick', 'X'));
