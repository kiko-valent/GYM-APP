-- =====================================================
-- DAILY STEP GOALS - Registro de días con más de 15.000 pasos
-- Ejecutar en el editor SQL de Supabase
-- =====================================================

create table if not exists daily_step_goals (
  user_id uuid references auth.users(id) on delete cascade not null,
  step_date date not null,
  created_at timestamp with time zone default now() not null,
  primary key (user_id, step_date)
);

alter table daily_step_goals enable row level security;

drop policy if exists "select_daily_step_goals" on daily_step_goals;
drop policy if exists "insert_daily_step_goals" on daily_step_goals;
drop policy if exists "update_daily_step_goals" on daily_step_goals;
drop policy if exists "delete_daily_step_goals" on daily_step_goals;

create policy "select_daily_step_goals" on daily_step_goals
  for select using (auth.uid() = user_id);

create policy "insert_daily_step_goals" on daily_step_goals
  for insert with check (auth.uid() = user_id);

create policy "update_daily_step_goals" on daily_step_goals
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete_daily_step_goals" on daily_step_goals
  for delete using (auth.uid() = user_id);
