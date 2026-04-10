-- IgniteChat baseline chat schema
create extension if not exists pgcrypto;

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_preview text
);

create table if not exists conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  text text,
  created_at timestamptz not null default now(),
  reply_to uuid null,
  voice_duration integer null,
  voice_url text null
);

create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('like', 'love', 'fire'))
);

create unique index if not exists message_reactions_unique
  on message_reactions (message_id, user_id);

create unique index if not exists conversation_participants_unique
  on conversation_participants (conversation_id, user_id);

create index if not exists idx_conversation_participants_user_id
  on conversation_participants (user_id);

create index if not exists idx_messages_conversation_id_created_at
  on messages (conversation_id, created_at desc);

alter table conversations disable row level security;
alter table conversation_participants disable row level security;
alter table messages disable row level security;
alter table message_reactions disable row level security;
