-- Personal profile photos for any signed-in user (staff + portal).

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Org members can view teammate profiles" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can delete own profile" on public.user_profiles;

create policy "Users can view own profile"
  on public.user_profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Org members can view teammate profiles"
  on public.user_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.team_members viewer
      join public.team_members teammate
        on teammate.organization_id = viewer.organization_id
      where viewer.user_id = auth.uid()
        and viewer.status = 'active'
        and teammate.user_id = user_profiles.user_id
        and teammate.status = 'active'
    )
    or exists (
      select 1
      from public.organizations o
      join public.team_members teammate
        on teammate.organization_id = o.id
      where o.user_id = auth.uid()
        and teammate.user_id = user_profiles.user_id
        and teammate.status = 'active'
    )
  );

create policy "Users can insert own profile"
  on public.user_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own profile"
  on public.user_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own profile"
  on public.user_profiles for delete
  to authenticated
  using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path: {user_id}/avatar.{ext}
drop policy if exists "Users can read own avatars" on storage.objects;
drop policy if exists "Users can insert own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;

create policy "Users can read own avatars"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can insert own avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
