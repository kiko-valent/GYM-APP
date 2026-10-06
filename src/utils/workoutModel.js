export const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function normalizeDayName(day = '') {
  const value = day.trim().toLowerCase();
  return ({ miercoles: 'miércoles', sabado: 'sábado' })[value] || value;
}

function hash(value) {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return (result >>> 0).toString(36);
}

// Los IDs nuevos se conservan; los planes antiguos reciben IDs deterministas.
export function normalizePlanData(plan) {
  if (!plan) return plan;
  const workouts = {};
  for (const [rawDay, workout] of Object.entries(plan.workouts || {})) {
    const day = normalizeDayName(rawDay);
    const occurrences = {};
    workouts[day] = { ...workout, exercises: (workout.exercises || []).map(exercise => {
      const name = String(exercise.name || '').trim();
      occurrences[name] = (occurrences[name] || 0) + 1;
      return { ...exercise, name, id: exercise.id || `legacy-${hash(`${day}:${name}:${occurrences[name]}`)}` };
    }) };
  }
  return { ...plan, training_days: [...new Set((plan.training_days || []).map(normalizeDayName))], workouts,
    preferences: { trackIntensity: true, phase: 'deficit', ...plan.preferences } };
}

export function planRevision(exercises) {
  return hash(exercises.map(ex => [ex.id, ex.name, ex.sets, ex.repsMin ?? ex.reps, ex.repsMax ?? ex.reps].join(':')).sort().join('|'));
}

export function validatePlan(plan) {
  if (!plan || !Array.isArray(plan.training_days) || !plan.workouts) return 'La rutina no tiene un formato válido.';
  const ids = new Set();
  for (const day of plan.training_days) {
    if (!DAYS.includes(day)) return 'Hay un día de entrenamiento inválido.';
    const exercises = plan.workouts[day]?.exercises || [];
    if (!exercises.length) return `${day}: añade al menos un ejercicio o marca el día como descanso.`;
    for (const ex of exercises) {
      if (!ex.name?.trim()) return `${day}: hay un ejercicio sin nombre.`;
      if (!Number.isInteger(Number(ex.sets)) || Number(ex.sets) < 1 || Number(ex.sets) > 20) return `${ex.name}: las series deben estar entre 1 y 20.`;
      const min = Number(ex.repsMin ?? ex.reps), max = Number(ex.repsMax ?? ex.reps);
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 100) return `${ex.name}: revisa el rango de repeticiones (1–100; máximo ≥ mínimo).`;
      if (ex.rest != null && (!Number.isFinite(Number(ex.rest)) || Number(ex.rest) < 10 || Number(ex.rest) > 600)) return `${ex.name}: el descanso debe estar entre 10 y 600 segundos.`;
      if (ex.increment != null && (!Number.isFinite(Number(ex.increment)) || Number(ex.increment) <= 0 || Number(ex.increment) > 20)) return `${ex.name}: el incremento debe ser mayor que 0 y hasta 20 kg.`;
      if (ex.targetWeight !== '' && ex.targetWeight != null && (!Number.isFinite(Number(ex.targetWeight)) || Number(ex.targetWeight) < 0)) return `${ex.name}: revisa el peso objetivo.`;
      if (ex.techniqueVideo && !/^https?:\/\//i.test(ex.techniqueVideo)) return `${ex.name}: el vídeo necesita una dirección https:// o http://.`;
      if (ex.id && ids.has(ex.id)) return 'Hay ejercicios con el mismo identificador. Vuelve a copiar el ejercicio.';
      if (ex.id) ids.add(ex.id);
    }
  }
  return null;
}

export function validSets(sets, totalSets) {
  return Array.isArray(sets) && sets.length <= totalSets && sets.every(s =>
    s.weight !== '' && s.weight != null && Number.isFinite(Number(s.weight)) && Number(s.weight) >= 0 && Number(s.weight) <= 1000 && Number.isInteger(Number(s.reps)) && Number(s.reps) > 0 && Number(s.reps) <= 100 &&
    (s.rir == null || (Number.isInteger(Number(s.rir)) && Number(s.rir) >= 0 && Number(s.rir) <= 10)));
}

// Se fusiona POR EJERCICIO, nunca por posición. Una corrección a cero series también cuenta.
export function reconcileProgress(exercises, local, remote, revision) {
  const candidates = [...Object.values(remote || {}), ...Object.values(local || {})];
  const state = {};
  exercises.forEach((exercise, index) => {
    const uniqueName = exercises.filter(ex => ex.name === exercise.name).length === 1;
    const matches = candidates.filter(row => {
      const identityMatches = row.exerciseId ? row.exerciseId === exercise.id : uniqueName && row.exerciseName === exercise.name;
      return identityMatches && (!row.revision || row.revision === revision) && validSets(row.sets, exercise.sets);
    }).sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
    const row = matches[0];
    state[index] = { ...(row || {}), exerciseId: exercise.id, exerciseName: exercise.name, revision,
      sets: row?.sets || [], completed: Boolean(row?.completed && row.sets.length === Number(exercise.sets)) };
  });
  return state;
}

export function timerRemaining(timer, now = Date.now()) {
  return timer?.running ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : Math.max(0, timer?.remaining || 0);
}

export function weightTrend(entries, now = new Date()) {
  const today = localDate(now);
  const byDay = new Map();
  // Entrada más reciente por fecha. Nunca contar dos pesajes del mismo día dos veces.
  for (const row of entries || []) {
    const day = String(row.date).slice(0, 10), weight = Number(row.weight);
    if (day <= today && Number.isFinite(weight) && weight > 0 && !byDay.has(day)) byDay.set(day, weight);
  }
  const dates = offset => { const d = new Date(now); d.setDate(d.getDate() - offset); return localDate(d); };
  const current = [], previous = [];
  for (let i = 0; i < 14; i++) {
    const weight = byDay.get(dates(i));
    if (weight != null) (i < 7 ? current : previous).push(weight);
  }
  const avg = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const average = avg(current), previousAverage = avg(previous);
  return { average, previousAverage, count: current.length, previousCount: previous.length,
    change: current.length >= 3 && previous.length >= 3 ? average - previousAverage : null,
    points: [...byDay].sort(([a], [b]) => a.localeCompare(b)).map(([date, weight]) => ({ date, weight })) };
}
