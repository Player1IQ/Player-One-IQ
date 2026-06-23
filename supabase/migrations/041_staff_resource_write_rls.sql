-- Align RLS write checks with the staff permission matrix (full access per resource).

create or replace function public.user_has_full_permission(org_id uuid, perm text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case coalesce(public.get_user_team_role(org_id), '')
    when 'owner' then true
    when 'admin' then true
    when 'manager' then perm in ('creators', 'sponsors', 'contracts', 'opportunities')
    when 'partnerships' then perm in ('sponsors', 'contracts', 'opportunities', 'messages')
    when 'talent_manager' then perm = 'creators'
    when 'member' then perm = 'messages'
    else false
  end
$$;

create or replace function public.user_can_manage_opportunities(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.user_has_full_permission(org_id, 'opportunities')
$$;

-- Creators
drop policy if exists "Users can insert org creators" on public.creators;
drop policy if exists "Users can update org creators" on public.creators;
drop policy if exists "Users can delete org creators" on public.creators;

create policy "Users can insert org creators"
  on public.creators for insert
  with check (public.user_has_full_permission(organization_id, 'creators'));

create policy "Users can update org creators"
  on public.creators for update
  using (public.user_has_full_permission(organization_id, 'creators'));

create policy "Users can delete org creators"
  on public.creators for delete
  using (public.user_has_full_permission(organization_id, 'creators'));

-- Sponsors
drop policy if exists "Users can insert org sponsors" on public.sponsors;
drop policy if exists "Users can update org sponsors" on public.sponsors;
drop policy if exists "Users can delete org sponsors" on public.sponsors;

create policy "Users can insert org sponsors"
  on public.sponsors for insert
  with check (public.user_has_full_permission(organization_id, 'sponsors'));

create policy "Users can update org sponsors"
  on public.sponsors for update
  using (public.user_has_full_permission(organization_id, 'sponsors'));

create policy "Users can delete org sponsors"
  on public.sponsors for delete
  using (public.user_has_full_permission(organization_id, 'sponsors'));

-- Contracts
drop policy if exists "Users can insert org contracts" on public.contracts;
drop policy if exists "Users can update org contracts" on public.contracts;
drop policy if exists "Users can delete org contracts" on public.contracts;

create policy "Users can insert org contracts"
  on public.contracts for insert
  with check (public.user_has_full_permission(organization_id, 'contracts'));

create policy "Users can update org contracts"
  on public.contracts for update
  using (public.user_has_full_permission(organization_id, 'contracts'));

create policy "Users can delete org contracts"
  on public.contracts for delete
  using (public.user_has_full_permission(organization_id, 'contracts'));

-- Contract deliverables (staff write; portal update policy unchanged)
drop policy if exists "Users can insert org contract deliverables" on public.contract_deliverables;
drop policy if exists "Staff can update org contract deliverables" on public.contract_deliverables;
drop policy if exists "Users can delete org contract deliverables" on public.contract_deliverables;

create policy "Users can insert org contract deliverables"
  on public.contract_deliverables for insert
  with check (public.user_has_full_permission(organization_id, 'contracts'));

create policy "Staff can update org contract deliverables"
  on public.contract_deliverables for update
  using (public.user_has_full_permission(organization_id, 'contracts'));

create policy "Users can delete org contract deliverables"
  on public.contract_deliverables for delete
  using (public.user_has_full_permission(organization_id, 'contracts'));

-- Sponsor campaigns
drop policy if exists "Writers can insert org sponsor campaigns" on public.sponsor_campaigns;
drop policy if exists "Writers can update org sponsor campaigns" on public.sponsor_campaigns;
drop policy if exists "Writers can delete org sponsor campaigns" on public.sponsor_campaigns;

create policy "Writers can insert org sponsor campaigns"
  on public.sponsor_campaigns for insert
  with check (public.user_has_full_permission(organization_id, 'campaigns'));

create policy "Writers can update org sponsor campaigns"
  on public.sponsor_campaigns for update
  using (public.user_has_full_permission(organization_id, 'campaigns'));

create policy "Writers can delete org sponsor campaigns"
  on public.sponsor_campaigns for delete
  using (public.user_has_full_permission(organization_id, 'campaigns'));

drop policy if exists "Writers can manage campaign creators" on public.sponsor_campaign_creators;

create policy "Writers can manage campaign creators"
  on public.sponsor_campaign_creators for all
  using (public.user_has_full_permission(organization_id, 'campaigns'))
  with check (public.user_has_full_permission(organization_id, 'campaigns'));

-- Creator platform accounts and revenue
drop policy if exists "Users can insert org creator platform accounts" on public.creator_platform_accounts;
drop policy if exists "Users can update org creator platform accounts" on public.creator_platform_accounts;
drop policy if exists "Users can delete org creator platform accounts" on public.creator_platform_accounts;

create policy "Users can insert org creator platform accounts"
  on public.creator_platform_accounts for insert
  with check (public.user_has_full_permission(organization_id, 'creators'));

create policy "Users can update org creator platform accounts"
  on public.creator_platform_accounts for update
  using (public.user_has_full_permission(organization_id, 'creators'));

create policy "Users can delete org creator platform accounts"
  on public.creator_platform_accounts for delete
  using (public.user_has_full_permission(organization_id, 'creators'));

drop policy if exists "Users can insert org creator revenue entries" on public.creator_revenue_entries;
drop policy if exists "Users can update org creator revenue entries" on public.creator_revenue_entries;
drop policy if exists "Users can delete org creator revenue entries" on public.creator_revenue_entries;

create policy "Users can insert org creator revenue entries"
  on public.creator_revenue_entries for insert
  with check (public.user_has_full_permission(organization_id, 'creators'));

create policy "Users can update org creator revenue entries"
  on public.creator_revenue_entries for update
  using (public.user_has_full_permission(organization_id, 'creators'));

create policy "Users can delete org creator revenue entries"
  on public.creator_revenue_entries for delete
  using (public.user_has_full_permission(organization_id, 'creators'));

revoke execute on function public.user_has_full_permission(uuid, text) from anon, public;

-- Creator avatar storage writes require creators full access
drop policy if exists "Org writers can insert creator avatars" on storage.objects;
drop policy if exists "Org writers can update creator avatars" on storage.objects;
drop policy if exists "Org writers can delete creator avatars" on storage.objects;

create policy "Org writers can insert creator avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'creator-avatars'
    and public.user_has_full_permission((storage.foldername(name))[1]::uuid, 'creators')
  );

create policy "Org writers can update creator avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'creator-avatars'
    and public.user_has_full_permission((storage.foldername(name))[1]::uuid, 'creators')
  )
  with check (
    bucket_id = 'creator-avatars'
    and public.user_has_full_permission((storage.foldername(name))[1]::uuid, 'creators')
  );

create policy "Org writers can delete creator avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'creator-avatars'
    and public.user_has_full_permission((storage.foldername(name))[1]::uuid, 'creators')
  );
