-- Ensure solo creator bootstrap always links content_creator membership.

create or replace function public.bootstrap_creator_player_workspace(
  p_creator_name text,
  p_primary_platform text
)
returns table (
  workspace_organization_id uuid,
  workspace_creator_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_creator_id uuid;
  v_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1
    from public.organizations o
    where o.user_id = v_user_id
  ) then
    raise exception 'Organization already exists for user';
  end if;

  if nullif(trim(p_creator_name), '') is null then
    raise exception 'Creator name is required';
  end if;

  if nullif(trim(p_primary_platform), '') is null then
    raise exception 'Primary platform is required';
  end if;

  select u.email
  into v_email
  from auth.users u
  where u.id = v_user_id;

  insert into public.organizations (user_id, name, type)
  values (v_user_id, trim(p_creator_name), 'Creator / Player')
  returning id into v_org_id;

  insert into public.creators (
    organization_id,
    name,
    email,
    primary_platform,
    social_handles,
    status,
    availability_status
  )
  values (
    v_org_id,
    trim(p_creator_name),
    v_email,
    trim(p_primary_platform),
    '[]'::jsonb,
    'active',
    'inactive'
  )
  returning id into v_creator_id;

  insert into public.team_members (
    organization_id,
    user_id,
    email,
    role,
    status,
    linked_creator_id,
    joined_at,
    updated_at
  )
  values (
    v_org_id,
    v_user_id,
    coalesce(v_email, ''),
    'content_creator',
    'active',
    v_creator_id,
    now(),
    now()
  )
  on conflict (organization_id, user_id) do update
  set
    role = 'content_creator',
    linked_creator_id = excluded.linked_creator_id,
    status = 'active',
    updated_at = now();

  return query
  select v_org_id, v_creator_id;
end;
$$;

revoke all on function public.bootstrap_creator_player_workspace(text, text) from public;
grant execute on function public.bootstrap_creator_player_workspace(text, text) to authenticated;
