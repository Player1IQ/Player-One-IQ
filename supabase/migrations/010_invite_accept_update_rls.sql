-- Migration: fix invitee invitation UPDATE RLS on accept
-- Without WITH CHECK, PostgreSQL reuses USING (status = 'pending') on the new row,
-- so updating to accepted fails with "new row violates row-level security policy".

drop policy if exists "Invitees can accept invitations" on public.team_invitations;

create policy "Invitees can accept invitations"
  on public.team_invitations for update
  using (
    status = 'pending'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    status in ('accepted', 'expired')
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
