-- Unlisted creator media kits: token URL + JSON snapshot for public pages.

create table if not exists public.creator_media_kits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  token text not null,
  enabled boolean not null default false,
  kit_bio text not null default '',
  show_audience boolean not null default true,
  show_handles boolean not null default true,
  show_highlights boolean not null default true,
  show_past_partners boolean not null default false,
  show_contact_email boolean not null default false,
  snapshot jsonb,
  snapshot_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_media_kits_creator_unique unique (creator_id),
  constraint creator_media_kits_token_unique unique (token),
  constraint creator_media_kits_bio_length check (char_length(kit_bio) <= 800)
);

create index if not exists creator_media_kits_token_enabled_idx
  on public.creator_media_kits (token)
  where enabled = true;

alter table public.creator_media_kits enable row level security;

drop policy if exists "Users can view org media kits" on public.creator_media_kits;
drop policy if exists "Users can insert org media kits" on public.creator_media_kits;
drop policy if exists "Users can update org media kits" on public.creator_media_kits;

create policy "Users can view org media kits"
  on public.creator_media_kits for select
  to authenticated
  using (
    public.user_is_active_org_member(auth.uid(), organization_id)
    and (
      public.user_has_full_permission(organization_id, 'creators')
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  );

create policy "Users can insert org media kits"
  on public.creator_media_kits for insert
  to authenticated
  with check (
    public.user_is_active_org_member(auth.uid(), organization_id)
    and (
      public.user_has_full_permission(organization_id, 'creators')
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  );

create policy "Users can update org media kits"
  on public.creator_media_kits for update
  to authenticated
  using (
    public.user_is_active_org_member(auth.uid(), organization_id)
    and (
      public.user_has_full_permission(organization_id, 'creators')
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  )
  with check (
    public.user_is_active_org_member(auth.uid(), organization_id)
    and (
      public.user_has_full_permission(organization_id, 'creators')
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  );

grant select, insert, update on table public.creator_media_kits to authenticated;
revoke delete on table public.creator_media_kits from authenticated;
revoke all on table public.creator_media_kits from anon;
