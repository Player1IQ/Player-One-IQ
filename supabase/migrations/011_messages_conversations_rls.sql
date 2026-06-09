-- Migration: fix conversation creation RLS chicken-and-egg
-- New conversations were invisible to SELECT until the user was already a participant,
-- so INSERT ... RETURNING and adding the first participant both failed.

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

drop policy if exists "Participants can view conversations" on public.conversations;
drop policy if exists "Org members can view conversations" on public.conversations;

create policy "Org members can view conversations"
  on public.conversations for select
  using (organization_id in (select public.user_organization_ids()));

drop policy if exists "Users can join or add participants" on public.conversation_participants;

create policy "Users can join or add participants"
  on public.conversation_participants for insert
  with check (
    public.conversation_in_user_org(conversation_id)
    and user_id in (
      select tm.user_id
      from public.team_members tm
      where tm.organization_id = public.get_conversation_organization_id(conversation_id)
        and tm.status = 'active'
        and tm.user_id is not null
    )
    and (
      user_id = auth.uid()
      or public.user_is_conversation_participant(conversation_id)
    )
  );
