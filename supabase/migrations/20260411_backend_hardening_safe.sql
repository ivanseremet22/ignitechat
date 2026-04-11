-- Backend hardening: safe RLS + presence columns + indexes
begin;

alter table if exists profiles
  add column if not exists is_online boolean not null default false,
  add column if not exists last_seen timestamptz;

update profiles
set last_seen = coalesce(last_seen, updated_at, created_at, now())
where last_seen is null;

create index if not exists idx_profiles_is_online_last_seen
  on profiles (is_online, last_seen desc);

create index if not exists idx_conversation_participants_conversation_id
  on conversation_participants (conversation_id);

create index if not exists idx_messages_conversation_id_created_at_desc
  on messages (conversation_id, created_at desc);

create index if not exists idx_message_reactions_message_id
  on message_reactions (message_id);

alter table if exists profiles enable row level security;
alter table if exists conversations enable row level security;
alter table if exists conversation_participants enable row level security;
alter table if exists messages enable row level security;
alter table if exists message_reactions enable row level security;

drop policy if exists "profiles_select_authenticated" on profiles;
create policy "profiles_select_authenticated"
  on profiles
  for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own"
  on profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "conversations_select_member" on conversations;
create policy "conversations_select_member"
  on conversations
  for select
  to authenticated
  using (
    exists (
      select 1
      from conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "conversations_insert_authenticated" on conversations;
create policy "conversations_insert_authenticated"
  on conversations
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "conversations_update_member" on conversations;
create policy "conversations_update_member"
  on conversations
  for update
  to authenticated
  using (
    exists (
      select 1
      from conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "conversation_participants_select_member" on conversation_participants;
create policy "conversation_participants_select_member"
  on conversation_participants
  for select
  to authenticated
  using (
    exists (
      select 1
      from conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "conversation_participants_insert_safe" on conversation_participants;
create policy "conversation_participants_insert_safe"
  on conversation_participants
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1
        from conversation_participants cp
        where cp.conversation_id = conversation_participants.conversation_id
          and cp.user_id = auth.uid()
      )
    )
  );

drop policy if exists "messages_select_member" on messages;
create policy "messages_select_member"
  on messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_sender_member" on messages;
create policy "messages_insert_sender_member"
  on messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "messages_update_sender" on messages;
create policy "messages_update_sender"
  on messages
  for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "messages_delete_sender" on messages;
create policy "messages_delete_sender"
  on messages
  for delete
  to authenticated
  using (sender_id = auth.uid());

drop policy if exists "message_reactions_select_member" on message_reactions;
create policy "message_reactions_select_member"
  on message_reactions
  for select
  to authenticated
  using (
    exists (
      select 1
      from messages m
      join conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "message_reactions_insert_own_member" on message_reactions;
create policy "message_reactions_insert_own_member"
  on message_reactions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from messages m
      join conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "message_reactions_delete_own" on message_reactions;
create policy "message_reactions_delete_own"
  on message_reactions
  for delete
  to authenticated
  using (user_id = auth.uid());

commit;
