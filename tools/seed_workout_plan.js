import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnxclqonizujxckbbtgb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueGNscW9uaXp1anhja2JidGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTAzNjMsImV4cCI6MjA3Nzg2NjM2M30.sZpXEBrGouJNeKqMrRoyQsq_cpA63J5GCyrapg5NIfI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = 'fjavierizquierdocarreras@gmail.com';
const password = 'Kikochelo13.';
const userId = '7a863ecc-c1ec-480a-8ff5-eba35db67c26';

const planData = {
  training_days: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  workouts: {
    lunes: {
      name: 'PUSH A — Pecho',
      exercises: [
        { name: 'Press banca con barra',             sets: 4, reps: 7,  rest: 150, weight: 0, description: 'Espalda neutra, empuje explosivo' },
        { name: 'Press inclinado con mancuernas',    sets: 4, reps: 9,  rest: 120, weight: 0, description: 'Ángulo 30-45°, contracción en pico' },
        { name: 'Aperturas en polea (cable fly)',    sets: 3, reps: 13, rest: 90,  weight: 0, description: 'Arco natural, no bloquear codos' },
        { name: 'Press militar con mancuernas',      sets: 3, reps: 9,  rest: 120, weight: 0, description: 'Core apretado, sin arquear lumbar' },
        { name: 'Elevaciones laterales',             sets: 4, reps: 13, rest: 68,  weight: 0, description: 'Codos ligeramente flexionados, sin impulso' },
        { name: 'Fondos en máquina o paralelas',     sets: 3, reps: 10, rest: 90,  weight: 0, description: 'Rango completo, torso ligeramente inclinado' },
        { name: 'Extensión de tríceps en polea',     sets: 3, reps: 12, rest: 60,  weight: 0, description: 'Codos pegados al cuerpo, extensión total' },
      ]
    },
    martes: {
      name: 'PULL A — Grosor de espalda',
      exercises: [
        { name: 'Peso muerto convencional',          sets: 4, reps: 5,  rest: 180, weight: 0, description: 'Espalda neutra, empuja el suelo con los pies' },
        { name: 'Remo con barra (Pendlay/inclinado)', sets: 4, reps: 7, rest: 150, weight: 0, description: 'Torso paralelo al suelo, codos a 45°' },
        { name: 'Jalón al pecho agarre ancho',       sets: 4, reps: 9,  rest: 120, weight: 0, description: 'Pecho hacia la barra, retracción escapular' },
        { name: 'Remo sentado en polea',             sets: 3, reps: 11, rest: 90,  weight: 0, description: 'No balancear el torso, aprieta espalda' },
        { name: 'Face pulls',                        sets: 4, reps: 15, rest: 60,  weight: 0, description: 'Polea alta, separar cuerda hacia la cara' },
        { name: 'Curl con barra Z',                  sets: 3, reps: 9,  rest: 75,  weight: 0, description: 'Sin balanceo de espalda, supinación completa' },
        { name: 'Curl martillo',                     sets: 3, reps: 11, rest: 60,  weight: 0, description: 'Agarre neutro, contracción controlada' },
      ]
    },
    'miércoles': {
      name: 'LEGS A — Cuádriceps',
      exercises: [
        { name: 'Sentadilla con barra',              sets: 4, reps: 7,  rest: 180, weight: 0, description: 'Profundidad paralela o más, rodillas sobre pies' },
        { name: 'Prensa inclinada',                  sets: 3, reps: 11, rest: 120, weight: 0, description: 'Pies separados a anchura de hombros' },
        { name: 'Zancadas con mancuernas',           sets: 3, reps: 10, rest: 90,  weight: 0, description: '10 repeticiones por pierna, torso erguido' },
        { name: 'Extensión de cuádriceps',           sets: 3, reps: 13, rest: 60,  weight: 0, description: 'Rango completo, pausa en extensión' },
        { name: 'Curl femoral tumbado',              sets: 3, reps: 11, rest: 75,  weight: 0, description: 'Cadera pegada al banco, contracción completa' },
        { name: 'Gemelo de pie',                     sets: 4, reps: 13, rest: 60,  weight: 0, description: 'Rango completo, pausa arriba y abajo' },
        { name: 'Plancha + ab wheel',                sets: 3, reps: 10, rest: 60,  weight: 0, description: 'Plancha 30-60s o ab wheel ×10, sin hundir caderas' },
      ]
    },
    jueves: {
      name: 'PUSH B — Hombros y pecho superior',
      exercises: [
        { name: 'Press inclinado con barra',         sets: 4, reps: 7,  rest: 150, weight: 0, description: 'Ángulo 30-45°, recorrido completo' },
        { name: 'Press militar de pie con barra',    sets: 4, reps: 7,  rest: 150, weight: 0, description: 'Core apretado, sin hiperextender lumbar' },
        { name: 'Press plano con mancuernas',        sets: 3, reps: 11, rest: 90,  weight: 0, description: 'Rango completo, contracción en pico' },
        { name: 'Elevaciones laterales en polea',    sets: 4, reps: 13, rest: 60,  weight: 0, description: 'Cable bajo, constante tensión en deltoides' },
        { name: 'Pec deck (contractor)',             sets: 3, reps: 13, rest: 75,  weight: 0, description: 'Amplitud máxima controlada, no soltar tensión' },
        { name: 'Press francés con barra Z',         sets: 3, reps: 9,  rest: 75,  weight: 0, description: 'Codos fijos, bajar hasta frente' },
        { name: 'Patada de tríceps en polea',        sets: 3, reps: 12, rest: 60,  weight: 0, description: 'Codo fijo, extensión total del antebrazo' },
      ]
    },
    viernes: {
      name: 'PULL B — Anchura de espalda (dorsales)',
      exercises: [
        { name: 'Dominadas (lastradas si puedes)',   sets: 4, reps: 8,  rest: 150, weight: 0, description: 'Rango completo, si no puedes usar jalón supino' },
        { name: 'Remo en T o con apoyo en banco',    sets: 4, reps: 9,  rest: 120, weight: 0, description: 'Retracción escapular, codo pegado al cuerpo' },
        { name: 'Remo a una mano con mancuerna',     sets: 3, reps: 11, rest: 90,  weight: 0, description: 'Apoyo sólido en banco, tirón desde el codo' },
        { name: 'Pullover en polea (straight-arm)',  sets: 3, reps: 13, rest: 60,  weight: 0, description: 'Brazos semiflexionados, arco amplio' },
        { name: 'Pájaros (rear delt fly)',           sets: 4, reps: 13, rest: 60,  weight: 0, description: 'Torso inclinado, codos ligeramente flexionados' },
        { name: 'Curl inclinado con mancuernas',     sets: 3, reps: 10, rest: 75,  weight: 0, description: 'Banco a 45°, supinación en la subida' },
        { name: 'Curl en banco Scott',               sets: 3, reps: 11, rest: 60,  weight: 0, description: 'No despegar brazos del banco, rango completo' },
      ]
    },
    'sábado': {
      name: 'LEGS B — Posterior y glúteo',
      exercises: [
        { name: 'Peso muerto rumano',                sets: 4, reps: 9,  rest: 150, weight: 0, description: 'Bisagra de cadera limpia, espalda neutra' },
        { name: 'Hack squat o sentadilla búlgara',   sets: 3, reps: 10, rest: 120, weight: 0, description: '10 repeticiones por pierna, rodilla estable' },
        { name: 'Hip thrust con barra',              sets: 4, reps: 9,  rest: 120, weight: 0, description: 'Extensión completa de cadera, glúteo al máximo' },
        { name: 'Curl femoral sentado',              sets: 3, reps: 13, rest: 75,  weight: 0, description: 'Rango completo, no compensar con cadera' },
        { name: 'Gemelo sentado',                    sets: 4, reps: 17, rest: 60,  weight: 0, description: 'Pausa abajo para estirar, explosivo arriba' },
        { name: 'Elevaciones de piernas colgado',    sets: 3, reps: 13, rest: 60,  weight: 0, description: 'Pelvis en retroversión, sin balanceo' },
      ]
    },
  },
  preferences: { trackIntensity: true }
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
