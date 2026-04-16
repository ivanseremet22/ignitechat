-- Fix RLS for conversation_participants and ensure columns exist
begin;

-- 1. Ensure columns exist (if migration failed partially)
alter table conversations 
  add column if not exists is_group boolean not null default false,
  add column if not exists name text,
  add column if not exists avatar_url text;

-- 2. Simplify RLS policy for inserting participants
-- Allow anyone to insert their own participation, OR any participation if they are ALREADY in the chat
-- We use a more permissive check to avoid the "batch insert" chicken-and-egg problem
drop policy if exists "conversation_participants_insert_safe" on conversation_participants;

create policy "conversation_participants_insert_safe"
  on conversation_participants
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (
      -- You can always add yourself
      user_id = auth.uid()
      -- OR you can add others if you are already in that conversation
      or exists (
        select 1
        from conversation_participants cp
        where cp.conversation_id = conversation_participants.conversation_id
          and cp.user_id = auth.uid()
      )
    )
  );

-- 3. Also allow authenticated to insert into conversations without complex checks
drop policy if exists "conversations_insert_authenticated" on conversations;
create policy "conversations_insert_authenticated"
  on conversations
  for insert
  to authenticated
  with check (auth.uid() is not null);

commit;
