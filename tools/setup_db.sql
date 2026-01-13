-- Enable Storage
insert into storage.buckets (id, name, public)
values ('technique-videos', 'technique-videos', true)
on conflict (id) do nothing;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Public Access Docs" on storage.objects;
drop policy if exists "Authenticated Upload Docs" on storage.objects;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'technique-videos' );

create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'technique-videos' and auth.role() = 'authenticated' );

-- Enable Documents Storage
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "Public Access Docs"
  on storage.objects for select
  using ( bucket_id = 'documents' );

create policy "Authenticated Upload Docs"
  on storage.objects for insert
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Nutrition Tables
create table if not exists nutrition_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  target_calories integer,
  goal text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

create table if not exists daily_meals (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references nutrition_plans(id) on delete cascade not null,
  day_of_week text not null, -- 'lunes', 'martes', etc.
  meal_type text not null, -- 'desayuno', 'comida', 'cena', 'snack'
  name text not null,
  ingredients text[],
  calories integer,
  protein integer,
  carbs integer,
  fats integer,
  recipe_video_url text, -- New requirement
  prep_time_minutes integer, -- New requirement
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exercise Technique Videos (Global reference per user/exercise)
create table if not exists user_exercise_videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  exercise_name text not null,
  video_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, exercise_name)
);

-- Enable RLS
alter table nutrition_plans enable row level security;
alter table daily_meals enable row level security;
alter table user_exercise_videos enable row level security;

-- Policies (Drop first to be safe)
drop policy if exists "Users can view own plan" on nutrition_plans;
drop policy if exists "Users can update own plan" on nutrition_plans;
drop policy if exists "Users can view own meals" on daily_meals;
drop policy if exists "Users can update own meals" on daily_meals;
drop policy if exists "Users can view own videos" on user_exercise_videos;
drop policy if exists "Users can insert own videos" on user_exercise_videos;
drop policy if exists "Users can update own videos" on user_exercise_videos;

-- Drop new specific policies if they exist (Fix for "policy already exists" error)
drop policy if exists "select_nutrition_plans" on nutrition_plans;
drop policy if exists "insert_nutrition_plans" on nutrition_plans;
drop policy if exists "update_nutrition_plans" on nutrition_plans;
drop policy if exists "delete_nutrition_plans" on nutrition_plans;

drop policy if exists "select_daily_meals" on daily_meals;
drop policy if exists "insert_daily_meals" on daily_meals;
drop policy if exists "update_daily_meals" on daily_meals;
drop policy if exists "delete_daily_meals" on daily_meals;

drop policy if exists "select_user_videos" on user_exercise_videos;
drop policy if exists "insert_user_videos" on user_exercise_videos;
drop policy if exists "update_user_videos" on user_exercise_videos;
drop policy if exists "delete_user_videos" on user_exercise_videos;

-- Explicit Policies for nutrition_plans
create policy "select_nutrition_plans" on nutrition_plans for select using (auth.uid() = user_id);
create policy "insert_nutrition_plans" on nutrition_plans for insert with check (auth.uid() = user_id);
create policy "update_nutrition_plans" on nutrition_plans for update using (auth.uid() = user_id);
create policy "delete_nutrition_plans" on nutrition_plans for delete using (auth.uid() = user_id);

-- Explicit Policies for daily_meals
create policy "select_daily_meals" on daily_meals for select using (
  exists (select 1 from nutrition_plans where id = daily_meals.plan_id and user_id = auth.uid())
);
create policy "insert_daily_meals" on daily_meals for insert with check (
  exists (select 1 from nutrition_plans where id = daily_meals.plan_id and user_id = auth.uid())
);
create policy "update_daily_meals" on daily_meals for update using (
  exists (select 1 from nutrition_plans where id = daily_meals.plan_id and user_id = auth.uid())
);
create policy "delete_daily_meals" on daily_meals for delete using (
  exists (select 1 from nutrition_plans where id = daily_meals.plan_id and user_id = auth.uid())
);

-- Explicit Policies for user_exercise_videos
create policy "select_user_videos" on user_exercise_videos for select using (auth.uid() = user_id);
create policy "insert_user_videos" on user_exercise_videos for insert with check (auth.uid() = user_id);
create policy "update_user_videos" on user_exercise_videos for update using (auth.uid() = user_id);
create policy "delete_user_videos" on user_exercise_videos for delete using (auth.uid() = user_id);
