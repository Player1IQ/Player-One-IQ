-- Contract payout V1: payout recipients + contract payments (off-platform)

-- ---------------------------------------------------------------------------
-- payout_recipients
-- ---------------------------------------------------------------------------

create table if not exists public.payout_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  recipient_type text not null
    check (recipient_type in ('organization', 'creator')),
  creator_id uuid references public.creators(id) on delete cascade,
  label text not null default 'Primary',
  payout_instructions text,
  stripe_connect_account_id text,
  connect_status text not null default 'not_started'
    check (connect_status in ('not_started', 'pending', 'active')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint payout_recipients_creator_required check (
    (recipient_type = 'creator' and creator_id is not null)
    or (recipient_type = 'organization' and creator_id is null)
  )
);

create unique index if not exists payout_recipients_org_unique
  on public.payout_recipients (organization_id)
  where recipient_type = 'organization';

create unique index if not exists payout_recipients_creator_unique
  on public.payout_recipients (organization_id, creator_id)
  where recipient_type = 'creator';

create index if not exists payout_recipients_organization_id_idx
  on public.payout_recipients (organization_id);

create index if not exists payout_recipients_creator_id_idx
  on public.payout_recipients (creator_id)
  where creator_id is not null;

alter table public.payout_recipients enable row level security;

drop policy if exists "Users can view org payout recipients" on public.payout_recipients;
drop policy if exists "Staff can insert org payout recipients" on public.payout_recipients;
drop policy if exists "Staff can update org payout recipients" on public.payout_recipients;
drop policy if exists "Portal users can update own creator payout recipient" on public.payout_recipients;

create policy "Users can view org payout recipients"
  on public.payout_recipients for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator')
      or (
        recipient_type = 'creator'
        and creator_id = public.user_linked_creator_id(organization_id)
      )
    )
  );

create policy "Staff can insert org payout recipients"
  on public.payout_recipients for insert
  with check (
    public.user_has_full_permission(organization_id, 'contracts')
    or (
      recipient_type = 'creator'
      and creator_id = public.user_linked_creator_id(organization_id)
      and coalesce(public.get_user_team_role(organization_id), '')
        in ('player', 'content_creator')
    )
  );

create policy "Staff can update org payout recipients"
  on public.payout_recipients for update
  using (public.user_has_full_permission(organization_id, 'contracts'));

create policy "Portal users can update own creator payout recipient"
  on public.payout_recipients for update
  using (
    organization_id in (select public.user_organization_ids())
    and recipient_type = 'creator'
    and creator_id = public.user_linked_creator_id(organization_id)
    and coalesce(public.get_user_team_role(organization_id), '')
      in ('player', 'content_creator')
  );

-- ---------------------------------------------------------------------------
-- contract_payments
-- ---------------------------------------------------------------------------

create table if not exists public.contract_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  contract_id uuid references public.contracts(id) on delete cascade not null,
  payee_type text not null
    check (payee_type in ('creator', 'organization')),
  payee_creator_id uuid references public.creators(id) on delete set null,
  payee_recipient_id uuid references public.payout_recipients(id) on delete set null,
  amount_cents bigint not null,
  currency text not null default 'usd',
  status text not null default 'ready'
    check (status in ('pending', 'ready', 'paid_external', 'paid_platform', 'cancelled')),
  payment_method text
    check (payment_method is null or payment_method in ('external', 'platform')),
  paid_at timestamptz,
  recorded_by uuid references auth.users(id) on delete set null,
  external_reference text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint contract_payments_payee_creator check (
    (payee_type = 'creator' and payee_creator_id is not null)
    or (payee_type = 'organization' and payee_creator_id is null)
  )
);

create unique index if not exists contract_payments_contract_id_unique
  on public.contract_payments (contract_id);

create index if not exists contract_payments_organization_id_idx
  on public.contract_payments (organization_id);

create index if not exists contract_payments_status_idx
  on public.contract_payments (status);

alter table public.contract_payments enable row level security;

drop policy if exists "Users can view org contract payments" on public.contract_payments;
drop policy if exists "Staff can insert org contract payments" on public.contract_payments;
drop policy if exists "Staff can update org contract payments" on public.contract_payments;
drop policy if exists "Sponsor portal can update scoped contract payments" on public.contract_payments;

create policy "Users can view org contract payments"
  on public.contract_payments for select
  using (
    organization_id in (select public.user_organization_ids())
    and (
      coalesce(public.get_user_team_role(organization_id), '')
        not in ('player', 'content_creator', 'sponsor')
      or (
        public.get_user_team_role(organization_id) in ('player', 'content_creator')
        and exists (
          select 1
          from public.contracts c
          where c.id = contract_payments.contract_id
            and c.creator_id = public.user_linked_creator_id(organization_id)
        )
      )
      or (
        public.get_user_team_role(organization_id) = 'sponsor'
        and exists (
          select 1
          from public.contracts c
          where c.id = contract_payments.contract_id
            and c.sponsor_id = public.user_linked_sponsor_id(organization_id)
        )
      )
    )
  );

create policy "Staff can insert org contract payments"
  on public.contract_payments for insert
  with check (public.user_has_full_permission(organization_id, 'contracts'));

create policy "Staff can update org contract payments"
  on public.contract_payments for update
  using (public.user_has_full_permission(organization_id, 'contracts'));

create policy "Sponsor portal can update scoped contract payments"
  on public.contract_payments for update
  using (
    organization_id in (select public.user_organization_ids())
    and public.get_user_team_role(organization_id) = 'sponsor'
    and exists (
      select 1
      from public.contracts c
      where c.id = contract_payments.contract_id
        and c.sponsor_id = public.user_linked_sponsor_id(organization_id)
    )
  );
