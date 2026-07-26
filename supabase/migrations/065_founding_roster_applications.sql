-- Founding Roster applications (public marketing funnel)

create table if not exists public.founding_roster_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  applicant_type text not null
    check (applicant_type in ('creator', 'organization')),
  name text not null,
  creator_handle text,
  email text not null,
  primary_platform text,
  other_platforms text,
  channel_links text,
  content_type text,
  revenue_sources text[] not null default '{}',
  biggest_management_problem text not null,
  why_join text not null,
  nominated_by text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'accepted', 'waitlisted', 'declined')),
  internal_notes text
);

create index if not exists founding_roster_applications_email_idx
  on public.founding_roster_applications (lower(email));

create index if not exists founding_roster_applications_status_idx
  on public.founding_roster_applications (status, created_at desc);

create unique index if not exists founding_roster_applications_active_email_idx
  on public.founding_roster_applications (lower(email))
  where status in ('pending', 'reviewing');

alter table public.founding_roster_applications enable row level security;

-- Public may submit applications only (no reads/updates/deletes via client API).
create policy "Public can submit founding roster applications"
  on public.founding_roster_applications
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and internal_notes is null
    and applicant_type in ('creator', 'organization')
    and char_length(trim(name)) > 0
    and char_length(trim(email)) > 3
    and position('@' in email) > 1
    and char_length(trim(biggest_management_problem)) > 0
    and char_length(trim(why_join)) > 0
  );

revoke all on table public.founding_roster_applications from anon, authenticated;
grant insert on table public.founding_roster_applications to anon, authenticated;
