-- Speed the pending-invite lookup that runs on authenticated page loads.

create index if not exists team_invitations_pending_email_idx
  on public.team_invitations (email, expires_at)
  where status = 'pending';
