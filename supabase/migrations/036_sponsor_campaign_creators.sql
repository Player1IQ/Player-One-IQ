-- Link sponsor campaigns to roster creators for portal scoping.

create table if not exists public.sponsor_campaign_creators (
  campaign_id uuid references public.sponsor_campaigns(id) on delete cascade not null,
  creator_id uuid references public.creators(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (campaign_id, creator_id)
);

create index if not exists sponsor_campaign_creators_creator_id_idx
  on public.sponsor_campaign_creators (creator_id);

create index if not exists sponsor_campaign_creators_organization_id_idx
  on public.sponsor_campaign_creators (organization_id);

-- Backfill from linked opportunities (creators who applied).
insert into public.sponsor_campaign_creators (campaign_id, creator_id, organization_id)
select distinct sc.id, oa.creator_id, sc.organization_id
from public.sponsor_campaigns sc
join public.opportunity_applications oa
  on oa.opportunity_id = sc.related_opportunity_id
where sc.related_opportunity_id is not null
on conflict do nothing;

-- Backfill from contracts with the same sponsor.
insert into public.sponsor_campaign_creators (campaign_id, creator_id, organization_id)
select distinct sc.id, c.creator_id, sc.organization_id
from public.sponsor_campaigns sc
join public.contracts c
  on c.organization_id = sc.organization_id
 and c.sponsor_id = sc.sponsor_id
where c.contract_status in ('draft', 'negotiating', 'active', 'completed')
on conflict do nothing;

alter table public.sponsor_campaign_creators enable row level security;

drop policy if exists "Users can view org campaign creators" on public.sponsor_campaign_creators;
drop policy if exists "Writers can manage campaign creators" on public.sponsor_campaign_creators;

create policy "Users can view org campaign creators"
  on public.sponsor_campaign_creators for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator')
      or creator_id = public.user_linked_creator_id(organization_id)
    )
  );

create policy "Writers can manage campaign creators"
  on public.sponsor_campaign_creators for all
  using (public.user_can_write_org(organization_id))
  with check (public.user_can_write_org(organization_id));

-- Align sponsor_campaigns RLS with org membership + portal scoping.
drop policy if exists "Users can view org sponsor campaigns" on public.sponsor_campaigns;
drop policy if exists "Users can insert org sponsor campaigns" on public.sponsor_campaigns;
drop policy if exists "Users can update org sponsor campaigns" on public.sponsor_campaigns;
drop policy if exists "Users can delete org sponsor campaigns" on public.sponsor_campaigns;

create policy "Users can view org sponsor campaigns"
  on public.sponsor_campaigns for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator')
      or exists (
        select 1
        from public.sponsor_campaign_creators scc
        where scc.campaign_id = id
          and scc.creator_id = public.user_linked_creator_id(organization_id)
      )
    )
  );

create policy "Writers can insert org sponsor campaigns"
  on public.sponsor_campaigns for insert
  with check (public.user_can_write_org(organization_id));

create policy "Writers can update org sponsor campaigns"
  on public.sponsor_campaigns for update
  using (public.user_can_write_org(organization_id));

create policy "Writers can delete org sponsor campaigns"
  on public.sponsor_campaigns for delete
  using (public.user_can_write_org(organization_id));
