-- Migration: organization logos and creator profile pictures

alter table public.organizations
  add column if not exists logo_url text;

alter table public.creators
  add column if not exists avatar_url text;

-- Storage buckets (public read; writes enforced via RLS)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-assets',
  'org-assets',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creator-avatars',
  'creator-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- org-assets: path {org_id}/logo.{ext}
drop policy if exists "Org members can read org assets" on storage.objects;
drop policy if exists "Org managers can insert org assets" on storage.objects;
drop policy if exists "Org managers can update org assets" on storage.objects;
drop policy if exists "Org managers can delete org assets" on storage.objects;

create policy "Org members can read org assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'org-assets'
    and public.user_is_active_org_member(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    )
  );

create policy "Org managers can insert org assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'org-assets'
    and public.user_can_manage_team((storage.foldername(name))[1]::uuid)
  );

create policy "Org managers can update org assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'org-assets'
    and public.user_can_manage_team((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'org-assets'
    and public.user_can_manage_team((storage.foldername(name))[1]::uuid)
  );

create policy "Org managers can delete org assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'org-assets'
    and public.user_can_manage_team((storage.foldername(name))[1]::uuid)
  );

-- creator-avatars: path {org_id}/{creator_id}.{ext}
drop policy if exists "Org members can read creator avatars" on storage.objects;
drop policy if exists "Org writers can insert creator avatars" on storage.objects;
drop policy if exists "Org writers can update creator avatars" on storage.objects;
drop policy if exists "Org writers can delete creator avatars" on storage.objects;

create policy "Org members can read creator avatars"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'creator-avatars'
    and public.user_is_active_org_member(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    )
  );

create policy "Org writers can insert creator avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'creator-avatars'
    and public.user_can_write_org((storage.foldername(name))[1]::uuid)
  );

create policy "Org writers can update creator avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'creator-avatars'
    and public.user_can_write_org((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'creator-avatars'
    and public.user_can_write_org((storage.foldername(name))[1]::uuid)
  );

create policy "Org writers can delete creator avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'creator-avatars'
    and public.user_can_write_org((storage.foldername(name))[1]::uuid)
  );
