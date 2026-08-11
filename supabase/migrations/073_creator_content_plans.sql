-- Creator AI content posting plans (portal user scoped, no staff plan read)

create table if not exists public.creator_content_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.creator_ai_conversations (id) on delete set null,
  period_start date not null,
  period_end date not null,
  plan jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_content_plans_creator_idx
  on public.creator_content_plans (creator_id, updated_at desc);

create index if not exists creator_content_plans_user_idx
  on public.creator_content_plans (user_id, updated_at desc);

create index if not exists creator_content_plans_status_idx
  on public.creator_content_plans (creator_id, user_id, status);

create index if not exists creator_content_plans_conversation_idx
  on public.creator_content_plans (conversation_id)
  where conversation_id is not null;

alter table public.creator_content_plans enable row level security;

drop policy if exists "Users can view own creator content plans" on public.creator_content_plans;
drop policy if exists "Users can insert own creator content plans" on public.creator_content_plans;
drop policy if exists "Users can update own creator content plans" on public.creator_content_plans;
drop policy if exists "Users can delete own creator content plans" on public.creator_content_plans;

create policy "Users can view own creator content plans"
  on public.creator_content_plans for select
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can insert own creator content plans"
  on public.creator_content_plans for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
    and creator_id = public.user_linked_creator_id(organization_id)
  );

create policy "Users can update own creator content plans"
  on public.creator_content_plans for update
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  )
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can delete own creator content plans"
  on public.creator_content_plans for delete
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );
