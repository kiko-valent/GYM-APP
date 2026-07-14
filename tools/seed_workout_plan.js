import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnxclqonizujxckbbtgb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueGNscW9uaXp1anhja2JidGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTAzNjMsImV4cCI6MjA3Nzg2NjM2M30.sZpXEBrGouJNeKqMrRoyQsq_cpA63J5GCyrapg5NIfI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = 'fjavierizquierdocarreras@gmail.com';
const password = 'Kikochelo13.';
const userId = '7a863ecc-c1ec-480a-8ff5-eba35db67c26';

// Rutina torso/pierna de definición (12 semanas) para Francisco.
// Los nombres de los ejercicios existentes se mantienen para enlazar su historial de cargas.
const planData = {
  training_days: ['lunes', 'martes', 'jueves', 'sábado'],
  workouts: {
    lunes: {
      name: 'TORSO A',
      exercises: [
        { name: 'Press banca con barra', sets: 3, repsMin: 6, repsMax: 8, rest: 150, weight: 0, description: 'RIR 1-2. Mantén técnica estable y evita el fallo.' },
        { name: 'Press inclinado con mancuernas', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Ángulo 30-45°, contracción controlada.' },
        { name: 'Remo en T o con apoyo en banco', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Remo con el pecho apoyado para reducir la demanda lumbar.' },
        { name: 'Jalón al pecho agarre ancho', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Pecho hacia la barra y retracción escapular.' },
        { name: 'Elevaciones laterales', sets: 3, repsMin: 12, repsMax: 20, rest: 75, weight: 0, description: 'Sin impulso; controla la bajada.' },
        { name: 'Extensión de tríceps en polea', sets: 2, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Codos fijos y extensión completa.' },
        { name: 'Curl con barra Z', sets: 2, repsMin: 10, repsMax: 15, rest: 75, weight: 0, description: 'Sin balancear la espalda.' },
      ],
    },
    martes: {
      name: 'PIERNA A',
      exercises: [
        { name: 'Prensa inclinada', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Pies a anchura de hombros y recorrido controlado.' },
        { name: 'Hack squat o sentadilla búlgara', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Por pierna si eliges la sentadilla búlgara.' },
        { name: 'Curl femoral sentado', sets: 3, repsMin: 10, repsMax: 15, rest: 75, weight: 0, description: 'Rango completo y contracción controlada.' },
        { name: 'Hip thrust con barra', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Extensión completa de cadera sin hiperextender la espalda.' },
        { name: 'Gemelo sentado', sets: 3, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Pausa en el estiramiento y arriba.' },
        { name: 'Abdominales en polea', sets: 3, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Flexiona el tronco sin tirar con los brazos.' },
      ],
    },
    jueves: {
      name: 'TORSO B',
      exercises: [
        { name: 'Press inclinado con barra', sets: 3, repsMin: 6, repsMax: 10, rest: 150, weight: 0, description: 'RIR 1-2 y recorrido completo.' },
        { name: 'Press de pecho en máquina', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Mantén las escápulas estables y controla la bajada.' },
        { name: 'Dominadas asistidas o jalón supino', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Usa asistencia si hace falta para completar el rango.' },
        { name: 'Remo sentado en polea', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'No balancees el torso; aprieta la espalda.' },
        { name: 'Reverse pec deck', sets: 3, repsMin: 12, repsMax: 20, rest: 75, weight: 0, description: 'Trabajo estable del deltoides posterior.' },
        { name: 'Elevaciones laterales en polea', sets: 3, repsMin: 12, repsMax: 20, rest: 60, weight: 0, description: 'Tensión constante y movimiento controlado.' },
        { name: 'Extensión de tríceps sobre la cabeza', sets: 2, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Codos orientados al frente y recorrido completo.' },
        { name: 'Curl inclinado con mancuernas', sets: 2, repsMin: 10, repsMax: 15, rest: 75, weight: 0, description: 'Banco a 45° y supinación controlada.' },
      ],
    },
    sábado: {
      name: 'PIERNA B',
      exercises: [
        { name: 'Prensa inclinada', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Alternativa indicada al hack squat.' },
        { name: 'Zancadas con mancuernas', sets: 2, repsMin: 8, repsMax: 12, rest: 90, weight: 0, description: 'Repeticiones por pierna, torso erguido.' },
        { name: 'Hip thrust con barra', sets: 3, repsMin: 8, repsMax: 12, rest: 120, weight: 0, description: 'Aprieta glúteos en la extensión completa.' },
        { name: 'Curl femoral sentado', sets: 3, repsMin: 10, repsMax: 15, rest: 75, weight: 0, description: 'Rango completo, sin compensar con la cadera.' },
        { name: 'Extensión de cuádriceps', sets: 2, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Pausa breve en la extensión.' },
        { name: 'Gemelo sentado', sets: 3, repsMin: 12, repsMax: 20, rest: 60, weight: 0, description: 'Recorrido completo y pausas controladas.' },
        { name: 'Elevaciones de piernas colgado', sets: 3, repsMin: 10, repsMax: 15, rest: 60, weight: 0, description: 'Sin balanceo y con retroversión de pelvis.' },
      ],
    },
  },
  preferences: { trackIntensity: true },
};

async function seedWorkoutPlan() {
  console.log(`Autenticando como ${email}...`);

  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    console.error('Login fallido:', authError.message);
    process.exit(1);
  }

  console.log('Login correcto. User ID:', session.user.id);

  // Crear cliente autenticado con el access_token para que RLS funcione en Node.js
  const authedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  });

  console.log('Actualizando plan de entrenamiento para Francisco...');

  const { data, error } = await authedClient
    .from('user_plans')
    .upsert({ user_id: userId, plan_data: planData }, { onConflict: 'user_id' })
    .select();

  if (error) {
    console.error('Error al actualizar el plan:', error);
    process.exit(1);
  }

  console.log('Plan actualizado correctamente.');
  process.exit(0);
}

seedWorkoutPlan();
