/**
 * Run this SQL in your Supabase SQL Editor to set up the necessary tables and policies.
 */

/*
-- 1. Create Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  mana_points integer default 0,
  preferred_bg text,
  profile_bg text,
  unmuted_audio text,
  preferred_duration integer default 25,

  constraint username_length check (char_length(username) >= 3)
);

-- 2. Create Tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  category text default 'General',
  status text check (status in ('todo', 'in-progress', 'completed')) default 'todo',
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

-- 4. Set up RLS Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

create policy "Users can view own tasks." on tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks." on tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks." on tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks." on tasks
  for delete using (auth.uid() = user_id);
*/

export const setupDatabase = async () => {
  console.log("Please run the SQL commented in src/lib/database_setup.ts in your Supabase SQL Editor.");
};
