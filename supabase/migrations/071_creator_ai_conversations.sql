-- Creator AI chat: conversations and messages (portal user scoped, no staff transcript access)

create table if not exists public.creator_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_ai_conversations_creator_idx
  on public.creator_ai_conversations (creator_id, updated_at desc);

create index if not exists creator_ai_conversations_user_idx
  on public.creator_ai_conversations (user_id, updated_at desc);

create index if not exists creator_ai_conversations_org_idx
  on public.creator_ai_conversations (organization_id, user_id, updated_at desc);

create table if not exists public.creator_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.creator_ai_conversations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists creator_ai_messages_conversation_idx
  on public.creator_ai_messages (conversation_id, created_at asc);

create index if not exists creator_ai_messages_created_at_idx
  on public.creator_ai_messages (created_at desc);

alter table public.creator_ai_conversations enable row level security;
alter table public.creator_ai_messages enable row level security;

-- Conversations: portal user owns their rows (no staff read)
drop policy if exists "Users can view own creator ai conversations" on public.creator_ai_conversations;
drop policy if exists "Users can insert own creator ai conversations" on public.creator_ai_conversations;
drop policy if exists "Users can update own creator ai conversations" on public.creator_ai_conversations;
drop policy if exists "Users can delete own creator ai conversations" on public.creator_ai_conversations;

create policy "Users can view own creator ai conversations"
  on public.creator_ai_conversations for select
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can insert own creator ai conversations"
  on public.creator_ai_conversations for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
    and creator_id = public.user_linked_creator_id(organization_id)
  );

create policy "Users can update own creator ai conversations"
  on public.creator_ai_conversations for update
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  )
  with check (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

create policy "Users can delete own creator ai conversations"
  on public.creator_ai_conversations for delete
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id in (select public.user_organization_ids())
  );

-- Messages: scoped via owned conversations (no staff read)
drop policy if exists "Users can view own creator ai messages" on public.creator_ai_messages;
drop policy if exists "Users can insert own creator ai messages" on public.creator_ai_messages;

create policy "Users can view own creator ai messages"
  on public.creator_ai_messages for select
  to authenticated
  using (
    organization_id in (select public.user_organization_ids())
    and exists (
      select 1
      from public.creator_ai_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own creator ai messages"
  on public.creator_ai_messages for insert
  to authenticated
  with check (
    organization_id in (select public.user_organization_ids())
    and exists (
      select 1
      from public.creator_ai_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
        and c.creator_id = public.user_linked_creator_id(organization_id)
    )
  );

-- Optional: ensure creator_pro plan includes ai_creator_coach in seeded features
update public.subscription_plans
set features = features || '["ai_creator_coach"]'::jsonb
where code = 'creator_pro'
  and not (features @> '["ai_creator_coach"]'::jsonb);
