-- Solo creator org owners are content_creator in team_members; prefer portal roles
-- over organizations.user_id owner when resolving the active team role.

create or replace function public.get_user_team_role(org_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select role
      from public.team_members
      where organization_id = org_id
        and user_id = auth.uid()
        and status = 'active'
        and role in ('player', 'content_creator', 'sponsor')
    ),
    (
      select 'owner'
      from public.organizations
      where id = org_id
        and user_id = auth.uid()
    ),
    (
      select role
      from public.team_members
      where organization_id = org_id
        and user_id = auth.uid()
        and status = 'active'
    )
  )
$$;
