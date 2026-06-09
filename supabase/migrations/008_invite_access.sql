-- Migration: public invite token lookup + resend support
-- Fixes invite links not loading for unauthenticated users (RLS blocked SELECT)

create or replace function public.get_invitation_by_token(p_token uuid)
returns table (
  id uuid,
  email text,
  role text,
  status text,
  expires_at timestamptz,
  organization_name text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    i.id,
    i.email,
    i.role,
    i.status,
    i.expires_at,
    o.name as organization_name
  from public.team_invitations i
  inner join public.organizations o on o.id = i.organization_id
  where i.token = p_token
  limit 1;
$$;

grant execute on function public.get_invitation_by_token(uuid) to anon, authenticated;
