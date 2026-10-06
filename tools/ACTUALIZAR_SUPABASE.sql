-- FITTRACK / KIKO: copiar TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Crea tablas ausentes y actualiza permisos y guardados; conserva rutina, historial y archivos.
-- Exportar antes una copia de la BD. Los buckets pasan a privados: enlaces públicos antiguos dejan de abrirse.
-- Una sola transacción: ante un error, no queda una actualización parcial.
-- No ejecutar scripts de siembra. No contiene contraseñas ni modifica usuarios de Auth.
begin;
set local lock_timeout='10s';
set local statement_timeout='120s';
-- Base completa para una instalación nueva. En una BD existente, no reemplaza tablas ni datos.
-- Ejecutar ANTES de reliability_migration.sql. Requiere Supabase (auth.uid y storage).
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
do $$
declare key_type text;
begin
  if to_regclass('public.workout_exercises') is null then
    select format_type(atttypid,atttypmod) into key_type from pg_attribute
      where attrelid='public.workout_sessions'::regclass and attname='id' and not attisdropped;
    if key_type not in ('uuid','bigint','integer') or key_type is null then
      raise exception 'Tipo de ID de workout_sessions no compatible: %',key_type;
    end if;
    execute format('create table public.workout_exercises (
      id uuid primary key default gen_random_uuid(),
      session_id %s not null references public.workout_sessions(id) on delete cascade,
      exercise_name text not null, reps integer not null check(reps>0),
      weight numeric not null check(weight>=0), rir integer, rpe integer)',key_type);
  end if;
end $$;
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

-- =====================================================
-- WORKOUT PROGRESS TABLE - Real-time persistence
-- Run this in Supabase SQL Editor
-- =====================================================

-- Table to store in-progress workout sets (not yet finalized)
create table if not exists workout_progress (
  id uuid default gen_random_uuid() primary key,
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

-- Datos complementarios usados por el perfil actual; conserva los valores existentes.
alter table public.user_profiles add column if not exists full_name text;
alter table public.user_profiles add column if not exists age integer;
alter table public.user_profiles add column if not exists physical_goal text;
alter table public.user_profiles add column if not exists current_weight numeric;
alter table public.user_profiles alter column current_weight type numeric using current_weight::numeric;
alter table public.weight_history alter column weight type numeric using weight::numeric;
alter table public.user_nutrition alter column protein_g type numeric using protein_g::numeric;

-- Índices necesarios para los onConflict del cliente. Si hay duplicados, se detiene sin borrarlos.
do $$
begin
  if exists(select 1 from public.user_plans group by user_id having count(*)>1) then
    raise exception 'Hay varias rutinas para un usuario. No se han borrado datos; revisar duplicados antes de continuar.';
  end if;
  if exists(select 1 from public.user_nutrition group by user_id,date having count(*)>1) then
    raise exception 'Hay registros de nutrición duplicados para el mismo usuario y fecha. No se han borrado datos.';
  end if;
  if exists(select 1 from public.workout_sessions where evaluation->>'sessionKey' is not null
    group by user_id,evaluation->>'sessionKey' having count(*)>1) then
    raise exception 'Hay sesiones con la misma clave de guardado. No se han borrado datos; revisar duplicados.';
  end if;
end $$;
create unique index if not exists workout_progress_owner_day_index_unique
  on public.workout_progress(user_id,day,workout_date,exercise_index);
create unique index if not exists daily_step_goals_owner_date_unique on public.daily_step_goals(user_id,step_date);

-- Retirar permisos amplios (incluido TRUNCATE); la app solo necesita CRUD autenticado.
revoke all on public.user_plans,public.workout_sessions,public.workout_exercises,public.user_profiles,
  public.user_nutrition,public.weight_history,public.workout_progress,public.daily_step_goals
  from public,anon,authenticated;

-- Revisar y aplicar en Supabase SQL Editor tras core_schema.sql y las migraciones de progreso/pasos.
-- Conserva sesiones y ejercicios. Cambia peso a numeric, RLS y guardado transaccional.
alter table public.workout_exercises alter column weight type numeric using weight::numeric;
alter table public.workout_exercises add column if not exists rir integer;
alter table public.workout_exercises add column if not exists rpe integer;
alter table public.workout_exercises add column if not exists set_number integer;
alter table public.workout_exercises add column if not exists exercise_id text;
alter table public.user_plans add column if not exists updated_at timestamptz default now();
alter table public.weight_history add column if not exists created_at timestamptz default now();
-- Si hay filas duplicadas, el índice falla y la transacción se revierte sin borrar datos.
create unique index if not exists user_plans_owner_unique on public.user_plans(user_id);
create unique index if not exists user_nutrition_owner_date_unique on public.user_nutrition(user_id,date);
create unique index if not exists workout_sessions_client_key on public.workout_sessions(user_id, (evaluation->>'sessionKey'))
  where evaluation->>'sessionKey' is not null;
create index if not exists workout_sessions_user_date on public.workout_sessions(user_id,date desc);
create index if not exists workout_exercises_session on public.workout_exercises(session_id);
create index if not exists weight_history_user_date on public.weight_history(user_id,date desc);

-- Ajustar el FK que ya exista, independientemente de que su PK sea uuid o bigint.
do $$
declare constraint_row record;
begin
  for constraint_row in select conname from pg_constraint where conrelid='public.workout_exercises'::regclass
    and confrelid='public.workout_sessions'::regclass and contype='f'
  loop execute format('alter table public.workout_exercises drop constraint %I',constraint_row.conname); end loop;
  alter table public.workout_exercises add constraint workout_exercises_session_fk foreign key(session_id)
    references public.workout_sessions(id) on delete cascade;
end $$;
grant select,insert,update,delete on public.user_plans,public.workout_sessions,public.workout_exercises,
  public.user_profiles,public.user_nutrition,public.weight_history,public.workout_progress,public.daily_step_goals to authenticated;

-- Las políticas permissive se combinan con OR. Retirar las antiguas evita accesos amplios residuales.
do $$
declare table_name text; policy_row record;
begin
  foreach table_name in array array['user_plans','workout_sessions','workout_exercises','user_profiles','user_nutrition','weight_history','workout_progress','daily_step_goals'] loop
    execute format('alter table public.%I enable row level security',table_name);
    for policy_row in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
      execute format('drop policy %I on public.%I',policy_row.policyname,table_name);
    end loop;
    if table_name = 'workout_exercises' then
      execute 'create policy owner_access on public.workout_exercises for all to authenticated
        using (exists(select 1 from public.workout_sessions s where s.id=session_id and s.user_id=auth.uid()))
        with check (exists(select 1 from public.workout_sessions s where s.id=session_id and s.user_id=auth.uid()))';
    elsif table_name = 'user_profiles' then
      execute 'create policy owner_access on public.user_profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid())';
    else
      execute format('create policy owner_access on public.%I for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',table_name);
    end if;
  end loop;
end $$;

create or replace function public.save_workout_session(p_session jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare
  current_user_id uuid := auth.uid();
  session_key text := p_session->>'sessionKey';
  session_row public.workout_sessions%rowtype;
  exercise jsonb; series jsonb; series_number integer; total integer := 0;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if session_key is null or length(session_key)<10 or length(session_key)>100 then raise exception 'Invalid session key'; end if;
  if jsonb_typeof(p_session->'exercises') <> 'array' then raise exception 'Invalid exercises'; end if;
  for exercise in select value from jsonb_array_elements(p_session->'exercises') loop
    if length(trim(coalesce(exercise->>'name',''))) = 0 then raise exception 'Exercise name required'; end if;
    if jsonb_typeof(exercise->'sets') <> 'array' then raise exception 'Invalid sets'; end if;
    for series in select value from jsonb_array_elements(exercise->'sets') loop
      if (series->>'reps')::integer not between 1 and 100 or (series->>'weight')::numeric not between 0 and 1000
        or series->>'reps' is null or series->>'weight' is null then raise exception 'Invalid set'; end if;
      if series->>'rir' is not null and (series->>'rir')::integer not between 0 and 10 then raise exception 'Invalid RIR'; end if;
      total := total+1;
    end loop;
  end loop;
  if total=0 or total>500 then raise exception 'Invalid set count'; end if;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text || ':' || session_key,0));
  select * into session_row from public.workout_sessions where user_id=current_user_id and evaluation->>'sessionKey'=session_key;
  if found and session_row.evaluation->>'finished'='true' then return to_jsonb(session_row); end if;
  if session_row.id is null then
    insert into public.workout_sessions(user_id,day,date,evaluation,notes)
    values(current_user_id,p_session->>'day',(p_session->>'date')::timestamptz,
      coalesce(p_session->'evaluation','{}'::jsonb) || jsonb_build_object('sessionKey',session_key,'finished',true),p_session->'evaluation'->>'notes') returning * into session_row;
  else
    -- Repara un intento anterior incompleto dentro de la misma transacción.
    delete from public.workout_exercises where session_id=session_row.id;
    update public.workout_sessions set evaluation=coalesce(p_session->'evaluation','{}'::jsonb) || jsonb_build_object('sessionKey',session_key,'finished',true),
      notes=p_session->'evaluation'->>'notes' where id=session_row.id returning * into session_row;
  end if;
  for exercise in select value from jsonb_array_elements(p_session->'exercises') loop
    series_number := 0;
    for series in select value from jsonb_array_elements(exercise->'sets') loop
      series_number := series_number+1;
      insert into public.workout_exercises(session_id,exercise_name,exercise_id,set_number,reps,weight,rir,rpe)
      values(session_row.id,exercise->>'name',exercise->>'id',series_number,(series->>'reps')::integer,(series->>'weight')::numeric,
        (series->>'rir')::integer,(series->>'rpe')::integer);
    end loop;
  end loop;
  return to_jsonb(session_row);
end $$;
revoke all on function public.save_workout_session(jsonb) from public, anon;
grant execute on function public.save_workout_session(jsonb) to authenticated;

-- Referencias privadas de vídeos de técnica, sin añadir módulos de alimentación antiguos.
create table if not exists public.user_exercise_videos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null, video_url text not null, created_at timestamptz not null default now(),
  unique(user_id,exercise_name)
);
create unique index if not exists user_exercise_videos_owner_name_unique on public.user_exercise_videos(user_id,exercise_name);
alter table public.user_exercise_videos enable row level security;
revoke all on public.user_exercise_videos from public,anon,authenticated;
grant select,insert,update,delete on public.user_exercise_videos to authenticated;
do $$
declare policy_row record; table_row record; sequence_name text;
begin
  for policy_row in select policyname from pg_policies where schemaname='public' and tablename='user_exercise_videos' loop
    execute format('drop policy %I on public.user_exercise_videos',policy_row.policyname);
  end loop;
  -- Instalaciones antiguas pueden tener ID serial/bigserial en lugar de UUID.
  for table_row in select c.oid,a.attname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    join pg_attribute a on a.attrelid=c.oid
    where n.nspname='public' and c.relname in ('user_plans','workout_sessions','workout_exercises','user_profiles',
      'user_nutrition','weight_history','workout_progress','daily_step_goals','user_exercise_videos')
    and a.attnum>0 and not a.attisdropped
  loop
    sequence_name := pg_get_serial_sequence(table_row.oid::regclass::text,table_row.attname);
    if sequence_name is not null then
      execute format('revoke all on sequence %s from public,anon,authenticated',sequence_name);
      execute format('grant usage,select on sequence %s to authenticated',sequence_name);
    end if;
  end loop;
end $$;
create policy owner_access on public.user_exercise_videos for all to authenticated
  using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Storage: detenerse si hay rutas antiguas que no se pueden atribuir a un usuario.
do $$
begin
  if exists(select 1 from storage.objects o where o.bucket_id in ('technique-videos','documents')
    and not exists(select 1 from auth.users u where u.id::text=(storage.foldername(o.name))[1])) then
    raise exception 'Hay archivos en technique-videos/documents sin carpeta de usuario reconocida. La actualización se revierte; revisar las rutas antes de privatizar.';
  end if;
end $$;
insert into storage.buckets(id,name,public) values('technique-videos','technique-videos',false),('documents','documents',false)
  on conflict(id) do nothing;

-- Aplicar tras revisar enlaces guardados: los enlaces públicos antiguos dejarán de funcionar.
-- Los archivos permanecen en Storage; no se borran ni se cambian sus rutas.
update storage.buckets set public=false where id in ('technique-videos','documents');
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Access Docs" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Upload Docs" on storage.objects;
drop policy if exists "owner_fitness_files" on storage.objects;
create policy "owner_fitness_files" on storage.objects for all to authenticated
  using(bucket_id in ('technique-videos','documents') and (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id in ('technique-videos','documents') and (storage.foldername(name))[1]=auth.uid()::text);
-- Esta condición restrictive también limita otras políticas permissive que pudieran existir.
-- Se aplica únicamente a los dos buckets de esta aplicación.
drop policy if exists "fitness_files_owner_boundary" on storage.objects;
create policy "fitness_files_owner_boundary" on storage.objects as restrictive for all to public
  using(bucket_id not in ('technique-videos','documents') or (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id not in ('technique-videos','documents') or (storage.foldername(name))[1]=auth.uid()::text);

notify pgrst,'reload schema';
commit;
select 'Actualización completada. Recarga la app e inicia sesión para probar el guardado.' as resultado,
  to_regprocedure('public.save_workout_session(jsonb)') is not null as funcion_guardado_instalada;
