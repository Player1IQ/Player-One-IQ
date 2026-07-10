-- Sponsor workspaces: auto-create the org's brand profile (sponsors row) so campaigns work
-- without asking the brand to "add a sponsor" in agency-style CRM.

create or replace function public.bootstrap_sponsor_brand_for_org(
  p_organization_id uuid,
  p_company_name text,
  p_owner_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_type text;
  v_sponsor_id uuid;
  v_name text;
begin
  select type
  into v_org_type
  from public.organizations
  where id = p_organization_id;

  if v_org_type is distinct from 'Brand / Sponsor' then
    return null;
  end if;

  v_name := nullif(trim(p_company_name), '');
  if v_name is null then
    select name into v_name from public.organizations where id = p_organization_id;
  end if;

  if v_name is null then
    return null;
  end if;

  select id
  into v_sponsor_id
  from public.sponsors
  where organization_id = p_organization_id
  order by created_at asc
  limit 1;

  if v_sponsor_id is null then
    insert into public.sponsors (
      organization_id,
      company_name,
      industry,
      status,
      primary_contact
    )
    values (
      p_organization_id,
      v_name,
      'Gaming',
      'active',
      '{}'::jsonb
    )
    returning id into v_sponsor_id;
  end if;

  if p_owner_user_id is not null and v_sponsor_id is not null then
    update public.team_members
    set
      linked_sponsor_id = v_sponsor_id,
      updated_at = now()
    where organization_id = p_organization_id
      and user_id = p_owner_user_id
      and linked_sponsor_id is null;
  end if;

  return v_sponsor_id;
end;
$$;

create or replace function public.bootstrap_sponsor_brand_on_org_create()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'Brand / Sponsor' then
    perform public.bootstrap_sponsor_brand_for_org(new.id, new.name, new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_sponsor_organization_bootstrap on public.organizations;

create trigger on_sponsor_organization_bootstrap
  after insert on public.organizations
  for each row
  execute function public.bootstrap_sponsor_brand_on_org_create();

create or replace function public.ensure_sponsor_brand_profile()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_org_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select o.id, o.name
  into v_org_id, v_org_name
  from public.organizations o
  where o.user_id = v_user_id
  limit 1;

  if v_org_id is null then
    select tm.organization_id, o.name
    into v_org_id, v_org_name
    from public.team_members tm
    join public.organizations o on o.id = tm.organization_id
    where tm.user_id = v_user_id
      and tm.status = 'active'
      and o.type = 'Brand / Sponsor'
    order by tm.joined_at asc nulls last
    limit 1;
  end if;

  if v_org_id is null then
    return null;
  end if;

  return public.bootstrap_sponsor_brand_for_org(v_org_id, v_org_name, v_user_id);
end;
$$;

revoke all on function public.bootstrap_sponsor_brand_for_org(uuid, text, uuid) from public;
revoke all on function public.ensure_sponsor_brand_profile() from public;
grant execute on function public.ensure_sponsor_brand_profile() to authenticated;
