-- Migration: link opportunities to sponsors

alter table public.opportunities
  add column if not exists sponsor_id uuid
    references public.sponsors(id) on delete set null;

create index if not exists opportunities_sponsor_id_idx
  on public.opportunities (sponsor_id);

-- Backfill existing opportunities from matching sponsor industry, then any active sponsor
update public.opportunities o
set sponsor_id = (
  select s.id
  from public.sponsors s
  where s.organization_id = o.organization_id
    and s.status = 'active'
    and s.industry = o.category
  order by s.created_at
  limit 1
)
where o.sponsor_id is null;

update public.opportunities o
set sponsor_id = (
  select s.id
  from public.sponsors s
  where s.organization_id = o.organization_id
    and s.status = 'active'
  order by s.created_at
  limit 1
)
where o.sponsor_id is null;
