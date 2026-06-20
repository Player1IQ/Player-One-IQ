-- Portal deliverable access: scope SELECT/UPDATE to linked creator contracts

-- ---------------------------------------------------------------------------
-- contract_deliverables SELECT: portal users see only their scoped contracts
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view org contract deliverables" on public.contract_deliverables;

create policy "Users can view org contract deliverables"
  on public.contract_deliverables for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator')
      or exists (
        select 1
        from public.contracts c
        where c.id = contract_deliverables.contract_id
          and c.creator_id = public.user_linked_creator_id(organization_id)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- contract_deliverables UPDATE: staff full write; portal status-only (app layer)
-- ---------------------------------------------------------------------------

drop policy if exists "Users can update org contract deliverables" on public.contract_deliverables;

create policy "Staff can update org contract deliverables"
  on public.contract_deliverables for update
  using (public.user_can_write_org(organization_id));

create policy "Portal users can update scoped contract deliverables"
  on public.contract_deliverables for update
  using (
    organization_id in (select public.user_organization_ids())
    and coalesce(public.get_user_team_role(organization_id), '')
      in ('player', 'content_creator')
    and exists (
      select 1
      from public.contracts c
      where c.id = contract_deliverables.contract_id
        and c.creator_id = public.user_linked_creator_id(organization_id)
    )
  );
