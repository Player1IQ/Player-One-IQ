-- System/event messages in conversations (deal room timeline)

alter table public.messages
  add column if not exists message_kind text not null default 'user'
  check (message_kind in ('user', 'system'));

create index if not exists messages_conversation_kind_idx
  on public.messages (conversation_id, message_kind, created_at desc);
