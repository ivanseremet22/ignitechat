-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text,
  bio text,
  phone text,
  email text,
  location text,
  status text default 'в сети',
  avatar_url text,
  is_online boolean not null default false,
  last_seen timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies (re-applying to be sure)
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Indexes
create index if not exists idx_profiles_username on public.profiles (username);
create index if not exists idx_profiles_is_online_last_seen on public.profiles (is_online, last_seen desc);

-- Function to handle new user creation automatically
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
  final_username text;
begin
  -- 1. Get base username from metadata or email
  base_username := coalesce(
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1), 
    'user_' || substr(new.id::text, 1, 6)
  );
  
  -- Ensure it's not empty or null
  if base_username is null or base_username = '' then
    base_username := 'user_' || substr(new.id::text, 1, 6);
  end if;

  final_username := base_username;

  -- 2. Attempt to insert, with retry for username conflict
  begin
    insert into public.profiles (
      id, 
      username, 
      name, 
      email, 
      avatar_url, 
      bio, 
      phone, 
      location, 
      status
    )
    values (
      new.id,
      final_username,
      coalesce(new.raw_user_meta_data->>'name', final_username),
      new.email,
      new.raw_user_meta_data->>'avatarDataUrl',
      coalesce(new.raw_user_meta_data->>'bio', ''),
      coalesce(new.raw_user_meta_data->>'phone', ''),
      coalesce(new.raw_user_meta_data->>'location', ''),
      coalesce(new.raw_user_meta_data->>'statusText', 'в сети')
    )
    on conflict (id) do update set
      username = excluded.username,
      name = excluded.name,
      email = excluded.email,
      avatar_url = excluded.avatar_url,
      bio = excluded.bio,
      phone = excluded.phone,
      location = excluded.location,
      status = excluded.status,
      updated_at = now();
  exception when unique_violation then
    -- If username is taken, append random suffix and try again
    final_username := base_username || '_' || floor(random() * 10000)::text;
    
    insert into public.profiles (
      id, username, name, email, avatar_url, bio, phone, location, status
    )
    values (
      new.id,
      final_username,
      coalesce(new.raw_user_meta_data->>'name', final_username),
      new.email,
      new.raw_user_meta_data->>'avatarDataUrl',
      coalesce(new.raw_user_meta_data->>'bio', ''),
      coalesce(new.raw_user_meta_data->>'phone', ''),
      coalesce(new.raw_user_meta_data->>'location', ''),
      coalesce(new.raw_user_meta_data->>'statusText', 'в сети')
    )
    on conflict (id) do update set
      username = excluded.username,
      updated_at = now();
  when others then
    -- Last resort: don't fail the registration even if profile creation fails
    -- The user can manually create profile later or we'll handle it in the frontend
    return new;
  end;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
