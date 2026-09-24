import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';

// Credenciales fuera del repositorio. Ejecutar con:
//   node --env-file=.env tools/seed_workout_plan.js
// (ver .env.example para las variables necesarias)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gnxclqonizujxckbbtgb.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.SEED_USER_EMAIL;
const password = process.env.SEED_USER_PASSWORD;
const userId = process.env.SEED_USER_ID;

const missing = Object.entries({
  VITE_SUPABASE_ANON_KEY: SUPABASE_KEY,
  SEED_USER_EMAIL: email,
  SEED_USER_PASSWORD: password,
  SEED_USER_ID: userId,
}).filter(([, value]) => !value).map(([key]) => key);

if (missing.length > 0) {
  console.error(`Faltan variables de entorno: ${missing.join(', ')}`);
  console.error('Copia .env.example a .env, rellena los valores y ejecuta:');
  console.error('  node --env-file=.env tools/seed_workout_plan.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Rutina torso/pierna de definición para Francisco.
// Este script solo reemplaza la rutina actual. No modifica sesiones ni progreso histórico.
const planData = {
  training_days: ['lunes', 'martes', 'jueves', 'viernes'],
  workouts: {
    lunes: {
      name: 'TORSO A',
      exercises: [
        { name: 'Press inclinado con barra', muscleGroup: 'pecho', sets: 3, repsMin: 6, repsMax: 8, rest: 150, weight: 0, description: 'Con barra libre o en Smith. Banco a 30°, RIR 1-2. Es el básico prioritario del día.' },
        { name: 'Press plano con mancuernas', muscleGroup: 'pecho', sets: 3, repsMin: 8, repsMax: 10, rest: 150, weight: 0, description: 'Baja hasta estirar el pecho sin perder la retracción escapular. RIR 1-2.' },
        { name: 'Remo con pecho apoyado', muscleGroup: 'espalda', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Mantén el pecho apoyado y controla el recorrido.' },
        { name: 'Jalón al pecho', muscleGroup: 'espalda', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Pecho hacia la barra y retracción escapular.' },
        { name: 'Elevaciones laterales', muscleGroup: 'hombro', sets: 3, repsMin: 12, repsMax: 20, rest: 75, weight: 0, description: 'Sin impulso; controla la bajada.' },
        { name: 'Extensión de tríceps en polea', muscleGroup: 'triceps', sets: 2, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Codos fijos y extensión completa.' },
        { name: 'Curl con barra Z', muscleGroup: 'biceps', sets: 2, repsMin: 10, repsMax: 15, rest: 75, weight: 0, description: 'Sin balancear la espalda.' },
      ],
    },
    martes: {
      name: 'PIERNA A',
      exercises: [
        { name: 'Hack squat o prensa', muscleGroup: 'cuadriceps', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Pies a anchura de hombros y recorrido controlado.' },
        { name: 'Sentadilla búlgara', muscleGroup: 'cuadriceps', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: '8-12 repeticiones por pierna.' },
        { name: 'Curl femoral', muscleGroup: 'femoral', sets: 3, repsMin: 10, repsMax: 15, rest: 75, weight: 0, description: 'Sentado o tumbado. Rango completo y contracción controlada.' },
        { name: 'Hip thrust', muscleGroup: 'gluteo', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Extensión completa de cadera sin hiperextender la espalda.' },
        { name: 'Gemelos', muscleGroup: 'gemelo', sets: 3, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Pausa en el estiramiento y arriba.' },
        { name: 'Crunch en polea', muscleGroup: 'core', sets: 3, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Flexiona el tronco sin tirar con los brazos.' },
      ],
    },
    jueves: {
      name: 'TORSO B',
      exercises: [
        { name: 'Press inclinado con mancuernas', muscleGroup: 'pecho', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Ángulo 30-45°, contracción controlada. Prioriza pecho superior.' },
        { name: 'Press de pecho en máquina', muscleGroup: 'pecho', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Mantén las escápulas estables y controla la bajada.' },
        { name: 'Aperturas en polea de abajo hacia arriba', muscleGroup: 'pecho', sets: 2, repsMin: 12, repsMax: 15, rest: 75, weight: 0, description: 'Poleas bajas cruzando hacia arriba: busca amplitud y estiramiento, codos algo flexionados y fijos.' },
        { name: 'Dominadas asistidas o jalón', muscleGroup: 'espalda', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Usa asistencia si hace falta para completar el rango.' },
        { name: 'Remo sentado en polea', muscleGroup: 'espalda', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'No balancees el torso; aprieta la espalda.' },
        { name: 'Reverse pec deck', muscleGroup: 'hombro', sets: 3, repsMin: 12, repsMax: 20, rest: 75, weight: 0, description: 'Trabajo estable del deltoides posterior.' },
        { name: 'Elevaciones laterales en polea', muscleGroup: 'hombro', sets: 3, repsMin: 12, repsMax: 20, rest: 60, weight: 0, description: 'Tensión constante y movimiento controlado.' },
        { name: 'Extensión de tríceps sobre la cabeza', muscleGroup: 'triceps', sets: 2, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Codos orientados al frente y recorrido completo.' },
        { name: 'Curl inclinado', muscleGroup: 'biceps', sets: 2, repsMin: 10, repsMax: 15, rest: 75, weight: 0, description: 'Banco a 45° y supinación controlada.' },
      ],
    },
    viernes: {
      name: 'PIERNA B',
      exercises: [
        { name: 'Hack squat o prensa', muscleGroup: 'cuadriceps', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Recorrido controlado y estable.' },
        { name: 'Zancadas o búlgara', muscleGroup: 'cuadriceps', sets: 2, repsMin: 8, repsMax: 12, rest: 90, weight: 0, description: '8-12 repeticiones por pierna.' },
        { name: 'Hip thrust', muscleGroup: 'gluteo', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Aprieta glúteos en la extensión completa.' },
        { name: 'Curl femoral', muscleGroup: 'femoral', sets: 3, repsMin: 10, repsMax: 15, rest: 75, weight: 0, description: 'Rango completo, sin compensar con la cadera.' },
        { name: 'Extensión de cuádriceps', muscleGroup: 'cuadriceps', sets: 2, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Pausa breve en la extensión.' },
        { name: 'Gemelo sentado', muscleGroup: 'gemelo', sets: 3, repsMin: 12, repsMax: 20, rest: 60, weight: 0, description: 'Recorrido completo y pausas controladas.' },
        { name: 'Elevación de piernas', muscleGroup: 'core', sets: 3, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Sin balanceo y con retroversión de pelvis.' },
      ],
    },
  },
};

async function seedWorkoutPlan() {
  console.log(`Autenticando como ${email}...`);

  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    console.error('Login fallido:', authError.message);
    process.exit(1);
  }

  console.log('Login correcto. User ID:', session.user.id);

  if (session.user.id !== userId) {
    console.error('La cuenta autenticada no corresponde al usuario de Francisco. Operación cancelada.');
    process.exit(1);
  }

  // Crear cliente autenticado con el access_token para que RLS funcione en Node.js
  const authedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false },
  });

  const { data: currentRow, error: readError } = await authedClient
    .from('user_plans')
    .select('plan_data')
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) {
    console.error('No se pudo leer el plan actual:', readError);
    process.exit(1);
  }

  const updatedPlan = {
    ...(currentRow?.plan_data || {}),
    ...planData,
    preferences: currentRow?.plan_data?.preferences || { trackIntensity: true },
  };

  console.log('Actualizando solo el plan de entrenamiento de Francisco...');

  const { data, error } = await authedClient
    .from('user_plans')
    .upsert({ user_id: userId, plan_data: updatedPlan }, { onConflict: 'user_id' })
    .select();

  if (error) {
    console.error('Error al actualizar el plan:', error);
    process.exit(1);
  }

  const { data: savedRow, error: verifyError } = await authedClient
    .from('user_plans')
    .select('plan_data')
    .eq('user_id', userId)
    .single();

  if (verifyError) {
    console.error('La verificación posterior no coincide con el plan enviado:', verifyError);
    process.exit(1);
  }

  try {
    assert.deepEqual(savedRow?.plan_data, updatedPlan);
  } catch (verificationError) {
    console.error('La verificación posterior no coincide con el plan enviado:', verificationError.message);
    process.exit(1);
  }

  const summary = Object.entries(savedRow.plan_data.workouts).map(([day, workout]) => ({
    day,
    name: workout.name,
    exercises: workout.exercises.length,
    sets: workout.exercises.reduce((total, exercise) => total + exercise.sets, 0),
  }));

  console.table(summary);
  console.log('Plan actualizado y verificado correctamente. El script no ha modificado tablas de progreso.');
  process.exit(0);
}

seedWorkoutPlan();
