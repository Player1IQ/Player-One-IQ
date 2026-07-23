-- Prevent authenticated users from reading OAuth tokens via the Supabase client API.
-- Server-side service role continues to manage oauth_metadata.

REVOKE ALL ON TABLE public.creator_platform_accounts FROM authenticated, anon;

GRANT SELECT (
  id,
  organization_id,
  creator_id,
  platform,
  account_handle,
  display_name,
  connection_method,
  connection_status,
  last_synced_at,
  sync_error,
  created_at,
  updated_at
) ON TABLE public.creator_platform_accounts TO authenticated;

GRANT INSERT (
  organization_id,
  creator_id,
  platform,
  account_handle,
  display_name,
  connection_method,
  connection_status,
  last_synced_at,
  sync_error,
  created_at,
  updated_at
) ON TABLE public.creator_platform_accounts TO authenticated;

GRANT UPDATE (
  account_handle,
  display_name,
  connection_method,
  connection_status,
  last_synced_at,
  sync_error,
  updated_at
) ON TABLE public.creator_platform_accounts TO authenticated;

GRANT DELETE ON TABLE public.creator_platform_accounts TO authenticated;
