-- Migration: messaging and deal rooms
-- Prerequisites: organizations, team helper functions (005_team.sql)

-- ---------------------------------------------------------------------------
-- Tables (created before helper functions and RLS policies)
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  type text not null
    check (type in ('direct', 'opportunity', 'contract')),
  related_id uuid,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists conversations_organization_id_idx
  on public.conversations (organization_id);

create index if not exists conversations_type_related_idx
  on public.conversations (type, related_id);

create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);

create unique index if not exists conversations_opportunity_unique_idx
  on public.conversations (organization_id, related_id)
  where type = 'opportunity' and related_id is not null;

create unique index if not exists conversations_contract_unique_idx
  on public.conversations (organization_id, related_id)
  where type = 'contract' and related_id is not null;

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  last_read_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  unique (conversation_id, user_id)
);

create index if not exists conversation_participants_user_id_idx
  on public.conversation_participants (user_id);

create index if not exists conversation_participants_conversation_id_idx
  on public.conversation_participants (conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  check (char_length(trim(content)) > 0)
);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

alter table public.messages replica identity full;

-- ---------------------------------------------------------------------------
-- Helper functions (after tables exist)
-- ---------------------------------------------------------------------------

create or replace function public.user_is_conversation_participant(conv_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = conv_id
      and cp.user_id = auth.uid()
  )
$$;

create or replace function public.user_can_access_conversation(conv_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    inner join public.conversation_participants cp
      on cp.conversation_id = c.id
      and cp.user_id = auth.uid()
    where c.id = conv_id
      and c.organization_id in (select public.user_organization_ids())
  )
$$;

create or replace function public.get_conversation_organization_id(conv_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id
  from public.conversations
  where id = conv_id
$$;

create or replace function public.conversation_in_user_org(conv_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = conv_id
      and c.organization_id in (select public.user_organization_ids())
  )
$$;

create or replace function public.user_is_active_org_member(p_user_id uuid, p_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.organization_id = p_org_id
      and tm.user_id = p_user_id
      and tm.status = 'active'
  )
  or exists (
    select 1
    from public.organizations o
    where o.id = p_org_id
      and o.user_id = p_user_id
  )
$$;

create or replace function public.ensure_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  v_org_id := public.get_conversation_organization_id(p_conversation_id);
  if v_org_id is null then
    raise exception 'Conversation not found';
  end if;

  if not public.conversation_in_user_org(p_conversation_id) then
    raise exception 'Not authorized';
  end if;

  if not public.user_is_active_org_member(p_user_id, v_org_id) then
    raise exception 'User is not in this organization';
  end if;

  if p_user_id <> v_actor
     and not public.user_is_conversation_participant(p_conversation_id) then
    raise exception 'Not a conversation participant';
  end if;

  insert into public.conversation_participants (conversation_id, user_id, last_read_at)
  values (p_conversation_id, p_user_id, now())
  on conflict (conversation_id, user_id) do nothing;
end;
$$;

grant execute on function public.user_is_active_org_member(uuid, uuid) to authenticated;
grant execute on function public.ensure_conversation_participant(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participants can view conversations" on public.conversations;
drop policy if exists "Org members can view conversations" on public.conversations;
drop policy if exists "Org members can create conversations" on public.conversations;
drop policy if exists "Participants can update conversations" on public.conversations;

create policy "Org members can view conversations"
  on public.conversations for select
  using (organization_id in (select public.user_organization_ids()));

create policy "Org members can create conversations"
  on public.conversations for insert
  with check (
    organization_id in (select public.user_organization_ids())
  );

create policy "Participants can update conversations"
  on public.conversations for update
  using (public.user_can_access_conversation(id));

drop policy if exists "Participants can view conversation members" on public.conversation_participants;
drop policy if exists "Users can view conversation participants" on public.conversation_participants;
drop policy if exists "Users can join or add participants" on public.conversation_participants;
drop policy if exists "Users can update own participant row" on public.conversation_participants;

create policy "Users can view conversation participants"
  on public.conversation_participants for select
  using (
    user_id = auth.uid()
    or public.user_is_conversation_participant(conversation_id)
  );

create policy "Users can join or add participants"
  on public.conversation_participants for insert
  with check (
    public.conversation_in_user_org(conversation_id)
    and public.user_is_active_org_member(
      user_id,
      public.get_conversation_organization_id(conversation_id)
    )
    and (
      user_id = auth.uid()
      or public.user_is_conversation_participant(conversation_id)
    )
  );

create policy "Users can update own participant row"
  on public.conversation_participants for update
  using (user_id = auth.uid());

drop policy if exists "Participants can view messages" on public.messages;
drop policy if exists "Participants can send messages" on public.messages;

create policy "Participants can view messages"
  on public.messages for select
  using (public.user_is_conversation_participant(conversation_id));

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.user_is_conversation_participant(conversation_id)
  );

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row
  execute function public.touch_conversation_on_message();

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
