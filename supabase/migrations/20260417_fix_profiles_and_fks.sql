-- Migration to fix missing columns and foreign keys
-- Run this in Supabase SQL Editor if you are seeing "column does not exist" or "foreign key constraint" errors.

begin;

-- 1. Ensure profiles table has all necessary columns
alter table public.profiles 
  add column if not exists email text,
  add column if not exists status text default 'в сети',
  add column if not exists bio text,
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists avatar_url text,
  add column if not exists is_online boolean not null default false,
  add column if not exists last_seen timestamptz default now(),
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- 2. Fix foreign keys to reference auth.users(id) instead of public.profiles(id)
-- This allows chat functionality even if profile creation is delayed or fails.

-- Fix conversation_participants
alter table if exists public.conversation_participants 
  drop constraint if exists conversation_participants_user_id_fkey;

alter table if exists public.conversation_participants
  add constraint conversation_participants_user_id_fkey 
    foreign key (user_id) references auth.users(id) on delete cascade;

-- Fix messages
alter table if exists public.messages
  drop constraint if exists messages_sender_id_fkey;

alter table if exists public.messages
  add constraint messages_sender_id_fkey 
    foreign key (sender_id) references auth.users(id) on delete cascade;

-- Fix message_reactions
alter table if exists public.message_reactions
  drop constraint if exists message_reactions_user_id_fkey;

alter table if exists public.message_reactions
  add constraint message_reactions_user_id_fkey 
    foreign key (user_id) references auth.users(id) on delete cascade;

-- 3. Backfill profiles from auth.users again to ensure all users have a record
insert into public.profiles (id, username, name, email)
select 
  id,
  coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1), 'user_' || substr(id::text, 1, 6)),
  coalesce(raw_user_meta_data->>'name', raw_user_meta_data->>'username', split_part(email, '@', 1)),
  email
from auth.users
on conflict (id) do update set
  email = excluded.email,
  updated_at = now()
where profiles.email is null;

commit;
