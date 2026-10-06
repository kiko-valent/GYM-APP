-- Base completa para una instalación nueva. En una BD existente, no reemplaza tablas ni datos.
-- Ejecutar ANTES de reliability_migration.sql. Requiere Supabase (auth.uid y storage).
begin;
create extension if not exists pgcrypto;
create table if not exists public.user_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade unique,
  plan_data jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  day text not null, date timestamptz not null default now(), evaluation jsonb, notes text
);
-- En una instalación existente workout_exercises ya existe. En una nueva el FK es uuid.
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_name text not null, reps integer not null check(reps > 0), weight numeric not null check(weight >= 0), rir integer, rpe integer
);
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, age integer, physical_goal text, current_weight numeric
);
create table if not exists public.user_nutrition (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, calories_kcal integer, protein_g numeric, carbs_g numeric, fat_g numeric, unique(user_id,date)
);
create table if not exists public.weight_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, weight numeric not null check(weight > 0), created_at timestamptz not null default now()
);
commit;
