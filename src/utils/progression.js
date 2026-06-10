// Motor de doble progresión: decide subir, mantener o bajar carga
// a partir de las series de la última sesión (peso × reps @ RIR).

const PLATE_INCREMENT = 2.5;

// 1RM estimado (fórmula de Epley). Permite comparar 60×12 con 65×8.
export function epley1RM(weight, reps) {
  const w = parseFloat(weight) || 0;
  const r = parseInt(reps, 10) || 0;
  if (w <= 0 || r <= 0) return 0;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

export const MUSCLE_GROUPS = [
  { value: 'pecho', label: 'Pecho' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'hombro', label: 'Hombro' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'cuadriceps', label: 'Cuádriceps' },
  { value: 'femoral', label: 'Femoral' },
  { value: 'gluteo', label: 'Glúteo' },
  { value: 'core', label: 'Core' },
  { value: 'otro', label: 'Otro' },
];

export function muscleGroupLabel(value) {
  return MUSCLE_GROUPS.find(g => g.value === value)?.label || 'Sin asignar';
}

/** Mapa nombre de ejercicio → grupo muscular, construido desde el plan actual. */
export function buildMuscleGroupMap(plan) {
  const map = {};
  Object.values(plan?.workouts || {}).forEach(workout => {
    (workout.exercises || []).forEach(ex => {
      if (ex.name && ex.muscleGroup) {
        map[ex.name] = ex.muscleGroup;
      }
    });
  });
  return map;
}

const roundToPlate = (w) => Math.round(w / PLATE_INCREMENT) * PLATE_INCREMENT;

/**
 * Rango de reps objetivo del ejercicio.
 * Soporta el formato nuevo (repsMin/repsMax) y el legado (reps fijo).
 */
export function getRepRange(exercise) {
  const legacy = parseInt(exercise?.reps, 10) || 0;
  const min = parseInt(exercise?.repsMin, 10) || legacy || 8;
  const max = Math.max(min, parseInt(exercise?.repsMax, 10) || legacy || min);
  return { min, max };
}

export function formatRepRange(exercise) {
  const { min, max } = getRepRange(exercise);
  return min === max ? `${max} reps` : `${min}-${max} reps`;
}

/**
 * Sugerencia para la sesión de hoy.
 * @param {{sets: Array<{reps:number, weight:number, rir:number|null}>}|null} previous - última sesión del ejercicio
 * @param {Object} exercise - ejercicio del plan (repsMin/repsMax o reps, weight opcional)
 * @returns {{type:'first'|'increase'|'maintain'|'decrease', weight:number, title:string, detail:string}}
 */
export function getSuggestion(previous, exercise) {
  const { min, max } = getRepRange(exercise);

  if (!previous || !previous.sets || previous.sets.length === 0) {
    return {
      type: 'first',
      weight: parseFloat(exercise?.weight) || 0,
      title: 'Primera vez',
      detail: `Busca un peso que te deje 2-3 reps en reserva (objetivo: ${min}-${max} reps).`,
    };
  }

  const sets = previous.sets.map(s => ({
    reps: parseInt(s.reps, 10) || 0,
    weight: parseFloat(s.weight) || 0,
    rir: s.rir != null ? parseInt(s.rir, 10) : null,
  }));

  const topWeight = Math.max(...sets.map(s => s.weight));
  const hasRir = sets.some(s => s.rir != null);

  const allAtCeiling = sets.every(s => s.reps >= max);
  // Sin datos de RIR asumimos que sí hay margen; con datos, exigimos RIR >= 2 en todas
  const hasReserve = !hasRir || sets.every(s => s.rir == null || s.rir >= 2);
  const allAtFailure = hasRir && sets.every(s => (s.rir ?? 2) === 0);
  const firstSetBelowFloor = sets[0].reps < min;

  if (allAtCeiling && hasReserve) {
    const next = roundToPlate(topWeight + PLATE_INCREMENT);
    return {
      type: 'increase',
      weight: next,
      title: `Sube a ${next} kg`,
      detail: `Completaste ${max} reps en todas las series con margen. Toca progresar.`,
    };
  }

  if (firstSetBelowFloor || allAtFailure) {
    const next = Math.max(0, roundToPlate(topWeight * 0.9));
    return {
      type: 'decrease',
      weight: next,
      title: `Baja a ${next} kg`,
      detail: allAtFailure
        ? 'Llegaste al fallo en todas las series. Reconstruye desde un poco menos.'
        : `Te quedaste por debajo de ${min} reps. Baja un 10% y vuelve a subir.`,
    };
  }

  const bestReps = Math.max(...sets.map(s => s.reps));
  return {
    type: 'maintain',
    weight: topWeight,
    title: `Mantén ${topWeight} kg`,
    detail: `Busca una rep más por serie (la última vez: ${bestReps} como máximo, objetivo ${max}).`,
  };
}
