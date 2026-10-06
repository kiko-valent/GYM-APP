// Datos SINTÉTICOS para QA local. Esta importación solo se usa con tools/preview_ui.mjs.
import { localDate, DAYS } from '../src/utils/workoutModel.js';
const user = { id: 'fixture-kiko', user_metadata: { full_name: 'Francisco Javier' } };
const today = localDate();
const trainingDay = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
const plan = { training_days: DAYS.filter(day => ['lunes', 'martes', 'jueves', 'viernes', trainingDay].includes(day)), preferences: { phase: 'deficit', trackIntensity: true },
  workouts: Object.fromEntries(DAYS.map(day => [day, { name: day === trainingDay ? 'Torso A' : 'Tu rutina', exercises: [
    { id: `${day}-press`, name: 'Press inclinado con barra', sets: 2, repsMin: 6, repsMax: 8, muscleGroup: 'pecho', weight: 60, rest: 120, increment: 2.5, description: 'Controla el descenso y mantén la técnica.' },
    { id: `${day}-remo`, name: 'Remo con pecho apoyado', sets: 1, repsMin: 8, repsMax: 12, muscleGroup: 'espalda', weight: 35, rest: 90, increment: 2.5 },
  ] }])) };
const weights = Array.from({length: 18}, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return { id: `weight-${i}`, user_id: user.id, date: localDate(d), weight: Math.round((78.2 + i * .04 + (i % 3) * .06) * 10) / 10 }; });
const sessionDate = new Date(); sessionDate.setDate(sessionDate.getDate() - 4);
const history = [{ id: 'previous-fixture', user_id: user.id, day: 'viernes', date: sessionDate.toISOString(), evaluation: { feeling: 4 }, notes: '',
  workout_exercises: [{ id: 'set-1', exercise_name: 'Press inclinado con barra', set_number: 1, reps: 8, weight: 60, rir: 2 }, { id: 'set-2', exercise_name: 'Press inclinado con barra', set_number: 2, reps: 7, weight: 60, rir: 2 }] }];
const tables = JSON.parse(localStorage.getItem('fittrack-fixture-db') || 'null') || {
  user_plans: [{ user_id: user.id, plan_data: plan }], user_profiles: [{ id: user.id, full_name: 'Francisco Javier', age: null }], weight_history: weights,
  user_nutrition: [], workout_sessions: history, workout_progress: [], daily_step_goals: [], workout_exercises: [],
};
const persist = () => localStorage.setItem('fittrack-fixture-db', JSON.stringify(tables));
class Query {
  constructor(table) { this.table = table; this.filters = []; this.mode = 'read'; }
  select() { return this; }
  eq(key, value) { this.filters.push(row => row[key] === value); return this; }
  gte(key, value) { this.filters.push(row => row[key] >= value); return this; }
  lte(key, value) { this.filters.push(row => row[key] <= value); return this; }
  contains(key, value) { this.filters.push(row => Object.entries(value).every(([k,v]) => row[key]?.[k] === v)); return this; }
  order(key, options) { this.sort = { key, options }; return this; }
  limit(count) { this.count = count; return this; }
  maybeSingle() { this.singleRow = true; return this; }
  single() { this.singleRow = true; return this; }
  insert(data) { this.mode = 'insert'; this.payload = data; return this; }
  update(data) { this.mode = 'update'; this.payload = data; return this; }
  upsert(data, options) { this.mode = 'upsert'; this.payload = data; this.conflict = options?.onConflict; return this; }
  delete() { this.mode = 'delete'; return this; }
  then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve,reject); }
  run() {
    if (localStorage.getItem('fittrack-fixture-fail') === 'true') return { data:null, error: { message:'Fallo de red simulado', status:0 } };
    const table = tables[this.table] ||= []; let rows = table.filter(row => this.filters.every(filter => filter(row)));
    if (this.mode === 'insert' || this.mode === 'upsert') {
      const payloads = Array.isArray(this.payload) ? this.payload : [this.payload];
      rows = payloads.map(payload => {
        const keys = this.conflict?.split(',').map(k => k.trim()) || (this.table === 'user_profiles' ? ['id'] : ['user_id']);
        const existing = this.mode === 'upsert' ? table.find(row => keys.every(key => row[key] === payload[key])) : null;
        if (existing) { Object.assign(existing, payload); return existing; }
        const row = { id: crypto.randomUUID(), ...payload }; table.push(row); return row;
      });
    } else if (this.mode === 'update') rows.forEach(row => Object.assign(row,this.payload));
    else if (this.mode === 'delete') tables[this.table] = table.filter(row => !rows.includes(row));
    if (this.sort) rows.sort((a,b) => (a[this.sort.key] > b[this.sort.key] ? 1 : -1) * (this.sort.options?.ascending === false ? -1 : 1));
    if (this.count != null) rows = rows.slice(0,this.count);
    persist(); return { data: this.singleRow ? rows[0] || null : structuredClone(rows), error:null };
  }
}
export const supabase = {
  from: table => new Query(table),
  rpc: async (name, { p_session: session }) => {
    if (localStorage.getItem('fittrack-fixture-fail') === 'true') return { error:{message:'Fallo de red simulado'} };
    const previous = tables.workout_sessions.find(row => row.evaluation?.sessionKey === session.sessionKey);
    if (!previous) tables.workout_sessions.unshift({ id:crypto.randomUUID(), user_id:user.id, day:session.day, date:session.date, evaluation: { ...session.evaluation, finished:true }, notes:session.evaluation.notes,
      workout_exercises:session.exercises.flatMap(ex => ex.sets.map((set,index) => ({ ...set, set_number:index+1, exercise_name:ex.name }))) });
    persist(); return { data:{},error:null };
  },
  auth: {
    getSession: async () => ({ data:{session:{user}},error:null }),
    onAuthStateChange: () => ({ data:{ subscription:{ unsubscribe() {} } } }),
    updateUser: async () => ({data:{user},error:null}), signOut: async () => ({error:null}),
  },
};
export default supabase;
