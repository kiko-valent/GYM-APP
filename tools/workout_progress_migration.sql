-- =====================================================
-- WORKOUT PROGRESS TABLE - Real-time persistence
-- Run this in Supabase SQL Editor
-- =====================================================

-- Table to store in-progress workout sets (not yet finalized)
create table if not exists workout_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  day text not null,  -- 'lunes', 'martes', etc.
  workout_date date default current_date not null,
  exercise_index integer not null,
  exercise_name text not null,
  sets_data jsonb not null default '[]',
  completed boolean default false,
  updated_at timestamp with time zone default now(),
  unique(user_id, day, workout_date, exercise_index)
);

-- Enable RLS
alter table workout_progress enable row level security;

-- Drop existing policies if any (safe re-run)
drop policy if exists "select_workout_progress" on workout_progress;
drop policy if exists "insert_workout_progress" on workout_progress;
drop policy if exists "update_workout_progress" on workout_progress;
drop policy if exists "delete_workout_progress" on workout_progress;

-- Policies
create policy "select_workout_progress" on workout_progress 
  for select using (auth.uid() = user_id);
create policy "insert_workout_progress" on workout_progress 
  for insert with check (auth.uid() = user_id);
create policy "update_workout_progress" on workout_progress 
  for update using (auth.uid() = user_id);
create policy "delete_workout_progress" on workout_progress 
  for delete using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists idx_workout_progress_user_day 
  on workout_progress(user_id, day, workout_date);
