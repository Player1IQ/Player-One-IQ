-- Migration: allow invitees to join an org when accepting a pending invitation
-- Fixes: "new row violates row-level security policy for table team_members"

drop policy if exists "Invitees can join via pending invitation" on public.team_members;

create policy "Invitees can join via pending invitation"
  on public.team_members for insert
  with check (
    user_id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status = 'active'
    and role in ('admin', 'manager', 'viewer')
    and exists (
      select 1
      from public.team_invitations ti
      where ti.organization_id = team_members.organization_id
        and ti.status = 'pending'
        and ti.expires_at > now()
        and lower(ti.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and ti.role = team_members.role
    )
  );
