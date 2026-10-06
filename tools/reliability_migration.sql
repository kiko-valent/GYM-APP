-- Revisar y aplicar en Supabase SQL Editor tras core_schema.sql y las migraciones de progreso/pasos.
-- Conserva sesiones y ejercicios. Cambia peso a numeric, RLS y guardado transaccional.
begin;
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
commit;
