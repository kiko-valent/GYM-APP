import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnxclqonizujxckbbtgb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueGNscW9uaXp1anhja2JidGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTAzNjMsImV4cCI6MjA3Nzg2NjM2M30.sZpXEBrGouJNeKqMrRoyQsq_cpA63J5GCyrapg5NIfI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = 'fjavierizquierdocarreras@gmail.com';
const password = 'Kikochelo13.';
const userId = '7a863ecc-c1ec-480a-8ff5-eba35db67c26';

const planData = {
  training_days: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
  workouts: {
    lunes: {
      name: 'PUSH A — Pecho · Hombro · Tríceps',
      exercises: [
        { name: 'Press con mancuernas en banco plano',      sets: 4, reps: 8,  weight: 0, description: 'Movimiento controlado' },
        { name: 'Press pectoral en máquina (inclinado)',    sets: 3, reps: 10, weight: 0, description: 'Contracción en pico' },
        { name: 'Press militar de pie con barra',           sets: 4, reps: 8,  weight: 0, description: 'Core apretado' },
        { name: 'Elevaciones laterales con mancuerna',      sets: 4, reps: 12, weight: 0, description: 'Codos ligeramente flexionados' },
        { name: 'Extensión de tríceps en polea (agarre V)', sets: 4, reps: 10, weight: 0, description: 'Codos pegados al cuerpo' },
        { name: 'Plancha abdominal',                        sets: 3, reps: 30, weight: 0, description: 'Sin hundir caderas. 30-40 seg' },
      ]
    },
    martes: {
      name: 'PULL A — Espalda · Bíceps · Core',
      exercises: [
        { name: 'Remo en barra con piernas estiradas', sets: 4, reps: 6,  weight: 0, description: 'Espalda recta, sin tirón' },
        { name: 'Jalón al pecho agarre ancho',          sets: 3, reps: 8,  weight: 0, description: 'Pecho hacia la barra' },
        { name: 'Remo unilateral con mancuerna',        sets: 4, reps: 8,  weight: 0, description: 'Apoyo sólido en banco' },
        { name: 'Remo en máquina',                      sets: 3, reps: 10, weight: 0, description: 'Retracción escapular' },
        { name: 'Curl de bíceps con barra Z',           sets: 4, reps: 10, weight: 0, description: 'Sin balanceo de espalda' },
        { name: 'Sit-ups o encogimientos',              sets: 3, reps: 15, weight: 0, description: 'Movimiento lento' },
      ]
    },
    'miércoles': {
      name: 'LEGS A — Cuádriceps · Femoral · Gemelo',
      exercises: [
        { name: 'Sentadilla con barra',                   sets: 4, reps: 6,  weight: 0, description: 'Empieza ligero, técnica primero' },
        { name: 'Peso muerto rumano con barra',           sets: 3, reps: 8,  weight: 0, description: 'Bisagra de cadera limpia' },
        { name: 'Prensa horizontal en máquina',           sets: 3, reps: 10, weight: 0, description: 'Pies separados a anchura de hombros' },
        { name: 'Extensión de rodilla en máquina',        sets: 3, reps: 12, weight: 0, description: 'Rango completo' },
        { name: 'Curl femoral tumbado en máquina',        sets: 3, reps: 10, weight: 0, description: 'Añadido para equilibrio quad/femoral' },
        { name: 'Elevación de gemelo de pie',             sets: 4, reps: 15, weight: 0, description: 'Rango completo, pausa arriba' },
        { name: 'Plancha lateral',                        sets: 3, reps: 25, weight: 0, description: 'Cadera alineada. 25-30 seg/lado' },
      ]
    },
    jueves: {
      name: 'PUSH B — Pecho · Hombro · Tríceps',
      exercises: [
        { name: 'Press con mancuernas en banco inclinado', sets: 4, reps: 8,  weight: 0, description: 'Ángulo 30-45°' },
        { name: 'Aperturas en máquina (pec deck)',         sets: 3, reps: 12, weight: 0, description: 'Amplitud máxima controlada' },
        { name: 'Press Arnold con mancuernas',             sets: 4, reps: 10, weight: 0, description: 'Rotación de muñeca completa' },
        { name: 'Elevaciones frontales con mancuerna',     sets: 3, reps: 12, weight: 0, description: 'Alternadas, sin impulso' },
        { name: 'Extensión de codo en polea (cuerda)',     sets: 4, reps: 10, weight: 0, description: 'Separar cuerda abajo del todo' },
        { name: 'Plancha abdominal',                       sets: 3, reps: 35, weight: 0, description: 'Progresión vs lunes. 35-45 seg' },
      ]
    },
    viernes: {
      name: 'PULL B — Espalda · Bíceps · Core',
      exercises: [
        { name: 'Dominadas asistidas o jalón supino',     sets: 4, reps: 6,  weight: 0, description: 'Si puedes, dominadas' },
        { name: 'Remo en polea baja (agarre neutro)',      sets: 4, reps: 10, weight: 0, description: 'Pecho erguido' },
        { name: 'Pull-over con mancuerna',                 sets: 3, reps: 12, weight: 0, description: 'Trabaja dorsal y serrato' },
        { name: 'Face pulls en polea alta',                sets: 3, reps: 15, weight: 0, description: 'Salud del manguito rotador' },
        { name: 'Curl de bíceps con mancuernas alterno',  sets: 4, reps: 10, weight: 0, description: 'Supinación completa' },
        { name: 'Hollow body hold o encogimientos',        sets: 3, reps: 20, weight: 0, description: 'Core profundo' },
      ]
    },
  },
  preferences: { trackIntensity: false }
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

  console.log('Actualizando plan de entrenamiento para kiko...');

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
