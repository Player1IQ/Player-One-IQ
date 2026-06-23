-- Optional campaign link on contract deliverables

alter table public.contract_deliverables
  add column if not exists campaign_id uuid
    references public.sponsor_campaigns(id) on delete set null;

create index if not exists contract_deliverables_campaign_id_idx
  on public.contract_deliverables (campaign_id);

-- Campaign must belong to the same organization as the deliverable
create or replace function public.validate_deliverable_campaign_org()
returns trigger
language plpgsql
as $$
begin
  if new.campaign_id is not null then
    if not exists (
      select 1
      from public.sponsor_campaigns sc
      where sc.id = new.campaign_id
        and sc.organization_id = new.organization_id
    ) then
      raise exception 'Campaign must belong to the same organization as the deliverable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists contract_deliverables_validate_campaign_org
  on public.contract_deliverables;

create trigger contract_deliverables_validate_campaign_org
  before insert or update of campaign_id, organization_id
  on public.contract_deliverables
  for each row
  execute function public.validate_deliverable_campaign_org();
