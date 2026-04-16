-- Add last_read_at to conversation_participants for persistent read receipts
alter table conversation_participants
add column if not exists last_read_at timestamptz default now();

-- Index for performance
create index if not exists idx_conversation_participants_last_read_at
on conversation_participants (last_read_at);

-- Update RLS policies to allow updating last_read_at
drop policy if exists "conversation_participants_update_own_last_read_at" on conversation_participants;
create policy "conversation_participants_update_own_last_read_at"
  on conversation_participants
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
