-- Migration: link contracts to accepted opportunity applications

alter table public.contracts
  add column if not exists source_opportunity_id uuid
    references public.opportunities(id) on delete set null,
  add column if not exists source_application_id uuid
    references public.opportunity_applications(id) on delete set null;

create unique index if not exists contracts_source_application_id_idx
  on public.contracts (source_application_id)
  where source_application_id is not null;

create index if not exists contracts_source_opportunity_id_idx
  on public.contracts (source_opportunity_id)
  where source_opportunity_id is not null;
