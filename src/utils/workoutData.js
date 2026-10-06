import { supabase } from '@/lib/customSupabaseClient';
import { logError } from '@/utils/errorLogger';

import { localDate, normalizeDayName, normalizePlanData, validatePlan, validSets } from './workoutModel';
import { readLocal, writeLocal, removeLocal, newId } from '@/lib/localStore';
import { enqueueSave, drainSaves } from '@/lib/saveQueue';
export { normalizePlanData };
const planCache = new Map();
const planRequests = new Map();
const planVersions = new Map();
const historyCache = new Map();
const historyRequests = new Map();
const planKey = userId => `fittrack_plan_${userId}`;
const progressQueueKey = (userId, day, date) => `${userId}:${normalizeDayName(day)}:${date}`;

const defaultPlan = {
  training_days: ['lunes', 'martes', 'jueves', 'viernes'],
  preferences: { trackIntensity: true },
  workouts: {
    lunes: {
      exercises: [
        { name: 'Press de Banca', sets: 4, repsMin: 8, repsMax: 12, weight: 60, description: 'Mantener codos a 45 grados, pies firmes en el suelo.' },
        { name: 'Aperturas con Mancuernas', sets: 3, repsMin: 10, repsMax: 15, weight: 15, description: '' },
      ]
    },
    martes: { exercises: [{ name: 'Dominadas', sets: 4, repsMin: 6, repsMax: 10, weight: 0, description: 'Rango completo de movimiento.' }] },
    jueves: { exercises: [{ name: 'Sentadillas', sets: 4, repsMin: 8, repsMax: 12, weight: 80, description: 'Romper el paralelo, pecho arriba.' }] },
    viernes: { exercises: [{ name: 'Press Militar', sets: 4, repsMin: 8, repsMax: 12, weight: 40, description: 'No arquear la espalda baja.' }] },
  }
};

const handleSupabaseError = (error, context, metadata = null) => {
  console.error(`Error in ${context}:`, error);
  logError(context, error, metadata);
  return error;
};

export async function getUserPlan(userId, { fresh = false } = {}) {
  const cached = planCache.get(userId);
  if (!fresh && cached && Date.now() - cached.at < 30000) return cached.plan;
  const diskPlan = readLocal(planKey(userId));
  if (!fresh && (cached?.plan || diskPlan)) {
    if (!planRequests.has(userId)) void getUserPlan(userId, { fresh: true }).catch(() => {});
    return normalizePlanData(cached?.plan || diskPlan);
  }
  if (planRequests.has(userId)) return planRequests.get(userId);
  const version = planVersions.get(userId) || 0;
  const request = (async () => {
    try {
      const { data, error } = await supabase.from('user_plans').select('plan_data').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      let plan = data?.plan_data;
      if (!plan) {
        const result = await supabase.from('user_plans').upsert({ user_id: userId, plan_data: normalizePlanData(defaultPlan) }, { onConflict: 'user_id', ignoreDuplicates: true }).select('plan_data').maybeSingle();
        if (result.error) throw result.error;
        plan = result.data?.plan_data;
        if (!plan) {
          const existing = await supabase.from('user_plans').select('plan_data').eq('user_id', userId).single();
          if (existing.error) throw existing.error;
          plan = existing.data.plan_data;
        }
      }
      plan = normalizePlanData(plan);
      if (version !== (planVersions.get(userId) || 0)) return planCache.get(userId)?.plan || plan;
      planCache.set(userId, { plan, at: Date.now() });
      writeLocal(planKey(userId), plan);
      return plan;
    } catch (error) {
      const offlinePlan = cached?.plan || readLocal(planKey(userId));
      if (offlinePlan) return normalizePlanData(offlinePlan);
      handleSupabaseError(error, 'getUserPlan');
      throw error;
    }
  })();
  planRequests.set(userId, request);
  try { return await request; } finally { planRequests.delete(userId); }
}

export async function updateUserPlan(userId, planData) {
  const plan = normalizePlanData(planData);
  const invalid = validatePlan(plan);
  if (invalid) return { error: new Error(invalid) };
  try {
    const result = await supabase.from('user_plans').upsert({ user_id: userId, plan_data: plan, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select();
    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error('El servidor no ha confirmado el guardado.');
    planVersions.set(userId, (planVersions.get(userId) || 0) + 1);
    planCache.set(userId, { plan, at: Date.now() });
    writeLocal(planKey(userId), plan);
    window.dispatchEvent(new Event('fittrack-plan-updated'));
    return { data: result.data, error: null };
  } catch (error) { handleSupabaseError(error, 'updateUserPlan'); return { error }; }
}

export async function getWorkoutPlanForDay(userId, rawDay) {
  const day = normalizeDayName(rawDay);
  const plan = await getUserPlan(userId);
  return { title: plan.workouts?.[day]?.name || `Entrenamiento ${day}`, exercises: plan.workouts?.[day]?.exercises || [] };
}

const sessionRequests = new Map();
export async function saveWorkoutSession(userId, session) {
  if (!session.sessionKey) return { error: new Error('No se ha identificado el entrenamiento. Recarga para recuperar el borrador.') };
  if (!session.exercises?.length || session.exercises.some(ex => !ex.name?.trim() || !ex.sets?.length || !validSets(ex.sets, 20))) {
    return { error: new Error('Revisa las series antes de guardar: peso de 0 a 1000 kg, repeticiones de 1 a 100 y RIR de 0 a 10.') };
  }
  const key = `${userId}:${session.sessionKey}`;
  if (sessionRequests.has(key)) return sessionRequests.get(key);
  const save = async () => {
    try {
      const evaluation = { ...session.evaluation, sessionKey: session.sessionKey, durationMinutes: session.durationMinutes,
        setOrder: session.exercises.map(ex => ({ name: ex.name, exerciseId: ex.id, muscleGroup: ex.muscleGroup, sets: ex.sets })) };
      const payload = { ...session, day: normalizeDayName(session.day), evaluation };
      const rpc = await supabase.rpc('save_workout_session', { p_session: payload });
      if (!rpc.error) { historyCache.delete(userId); return { error: null, atomic: true }; }
      // Compatibilidad con la BD actual hasta aplicar la migración. Nunca redondear microcargas.
      if (rpc.error.code !== 'PGRST202' && rpc.error.code !== '42883') throw rpc.error;
      let { data: saved, error: lookupError } = await supabase.from('workout_sessions').select('id, evaluation, workout_exercises(id)')
        .eq('user_id', userId).contains('evaluation', { sessionKey: session.sessionKey }).maybeSingle();
      if (lookupError) throw lookupError;
      if (saved?.evaluation?.finished === true) return { error: null, atomic: false };
      if (!saved) {
        const result = await supabase.from('workout_sessions').insert({ user_id: userId, day: payload.day, date: payload.date,
          evaluation: { ...evaluation, finished: false }, notes: session.evaluation.notes }).select().single();
        if (result.error) throw result.error;
        saved = result.data;
      }
      const rows = session.exercises.flatMap(ex => ex.sets.map(set => ({ session_id: saved.id, exercise_name: ex.name,
        weight: Number(set.weight), reps: Number(set.reps), rir: set.rir ?? null, rpe: set.rpe ?? null })));
      const existing = saved.workout_exercises?.length || 0;
      if (existing && existing !== rows.length) throw new Error('Hay un guardado parcial. El borrador sigue seguro; aplica la migración antes de reintentarlo.');
      if (!existing) {
        const result = await supabase.from('workout_exercises').insert(rows);
        if (result.error) {
          if (result.error.code === '22P02') throw new Error('La base de datos necesita la migración para guardar los pesos decimales exactos. Tu borrador sigue guardado.');
          throw result.error;
        }
      }
      const finish = await supabase.from('workout_sessions').update({ evaluation: { ...evaluation, finished: true } }).eq('id', saved.id).eq('user_id', userId);
      if (finish.error) throw finish.error;
      historyCache.delete(userId);
      return { error: null, atomic: false };
    } catch (error) { handleSupabaseError(error, 'saveWorkoutSession'); return { error }; }
  };
  const request = (globalThis.navigator?.locks?.request ? navigator.locks.request(`fittrack-session:${key}`, save) : save());
  sessionRequests.set(key, request);
  try { return await request; } finally { sessionRequests.delete(key); }
}

export async function getWorkoutHistory(userId) {
  const cached = historyCache.get(userId);
  if (cached && Date.now() - cached.at < 10000) return cached.history;
  if (historyRequests.has(userId)) return historyRequests.get(userId);
  const request = (async () => {
    try {
      const { data, error } = await supabase.from('workout_sessions').select('*, workout_exercises(*)').eq('user_id', userId).order('date', { ascending: false });
      if (error) throw error;
      const history = (data || []).filter(session => session.evaluation?.finished !== false);
      historyCache.set(userId, { history, at: Date.now() });
      writeLocal(`fittrack_history_${userId}`, history);
      return history;
    } catch (error) { handleSupabaseError(error, 'getWorkoutHistory'); return readLocal(`fittrack_history_${userId}`, []); }
  })();
  historyRequests.set(userId, request);
  try { return await request; } finally { historyRequests.delete(userId); }
}

export async function getPreviousWorkout(userId, exerciseName, exerciseId) {
  const history = await getWorkoutHistory(userId);
  for (const session of history) {
    const recorded = session.evaluation?.setOrder?.find(ex => (exerciseId && ex.exerciseId === exerciseId) || ex.name === exerciseName);
    const rows = (session.workout_exercises || []).filter(row => (exerciseId && row.exercise_id === exerciseId) || row.exercise_name === exerciseName);
    if (!recorded && !rows.length) continue;
    const ordered = Boolean(recorded || rows.every(row => row.set_number != null));
    const sets = recorded?.sets || (ordered ? rows.sort((a,b) => a.set_number - b.set_number) : rows).map(row => ({ reps: row.reps, weight: row.weight, rir: row.rir }));
    return { date: session.date, sets, ordered, feeling: session.evaluation?.feeling, notes: session.notes };
  }
  return null;
}

export async function deleteWorkoutSession(sessionId) {
  try {
    const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId);
    if (error) throw error;
    historyCache.clear();
    return { error: null };
  } catch (error) { handleSupabaseError(error, 'deleteWorkoutSession'); return { error }; }
}

// Technique Videos
export async function getTechniqueVideo(userId, exerciseName) {
  try {
    const { data, error } = await supabase
      .from('user_exercise_videos')
      .select('video_url')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error, 'getTechniqueVideo');
      return null;
    }

    return data?.video_url ? resolveTechniqueVideo(data.video_url) : null;
  } catch (e) {
    handleSupabaseError(e, 'getTechniqueVideo (unexpected)');
    return null;
  }
}

export async function uploadTechniqueVideo(userId, exerciseName, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${exerciseName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('technique-videos')
      .upload(filePath, file);

    if (uploadError) {
      handleSupabaseError(uploadError, 'uploadTechniqueVideo (storage)');
      return { error: uploadError };
    }

    const videoReference = `storage:technique-videos/${filePath}`;

    // 3. Save to DB
    const { error: dbError } = await supabase
      .from('user_exercise_videos')
      .upsert({
        user_id: userId,
        exercise_name: exerciseName,
        video_url: videoReference
      }, { onConflict: 'user_id, exercise_name' });

    if (dbError) {
      handleSupabaseError(dbError, 'uploadTechniqueVideo (db)');
      return { error: dbError };
    }

    return { publicUrl: await resolveTechniqueVideo(videoReference), error: null };
  } catch (e) {
    handleSupabaseError(e, 'uploadTechniqueVideo (unexpected)');
    return { error: e };
  }
}

const getProgressKey = (userId, day, date) => `workout_progress_${userId}_${normalizeDayName(day)}_${date}`;
const receiptKey = (userId, day, date) => `workout_receipt_${userId}_${normalizeDayName(day)}_${date}`;

export function saveWorkoutProgress(userId, day, exercisesState, currentExerciseIndex, metadata = {}) {
  const date = metadata.workoutDate || localDate();
  const previous = readLocal(getProgressKey(userId, day, date));
  const data = { ...previous, ...metadata, version: 2, workoutDate: date, exercisesState, currentExerciseIndex,
    sessionKey: metadata.sessionKey || previous?.sessionKey || newId(), startedAt: metadata.startedAt || previous?.startedAt || Date.now(), savedAt: new Date().toISOString() };
  const saved = writeLocal(getProgressKey(userId, day, date), data);
  return { ...data, saved };
}

export function loadWorkoutProgress(userId, day, date = localDate()) {
  const draft = readLocal(getProgressKey(userId, day, date));
  if (draft?.workoutDate === date) return draft;
  const legacy = readLocal(`workout_progress_${userId}_${normalizeDayName(day)}`);
  if (!legacy?.savedAt || localDate(new Date(legacy.savedAt)) !== date) return null;
  // Sin identidad no hay una recuperación segura; preservar el original sin asignarlo a otro ejercicio.
  return legacy;
}

export function clearWorkoutProgress(userId, day, date = localDate()) {
  writeLocal(receiptKey(userId, day, date), { finishedAt: new Date().toISOString() });
  removeLocal(getProgressKey(userId, day, date));
  removeLocal(`workout_progress_${userId}_${normalizeDayName(day)}`);
}

export function saveExerciseProgressToSupabase(userId, day, exerciseIndex, exerciseName, setsData, completed, metadata = {}) {
  const date = metadata.workoutDate || localDate();
  const updatedAt = metadata.updatedAt || new Date().toISOString();
  // Metadatos dentro de JSON: compatible con la tabla actual y con la migración.
  const sets = setsData.map(set => ({ ...set, _exerciseId: metadata.exerciseId, _revision: metadata.revision,
    _sessionKey: metadata.sessionKey, _startedAt: metadata.startedAt }));
  return enqueueSave(progressQueueKey(userId, day, date), async () => {
    let error;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await supabase.from('workout_progress').upsert({ user_id: userId, day: normalizeDayName(day), workout_date: date,
          exercise_index: exerciseIndex, exercise_name: exerciseName, sets_data: sets, completed, updated_at: updatedAt },
          { onConflict: 'user_id,day,workout_date,exercise_index' });
        error = result.error;
      } catch (caught) { error = caught; }
      if (!error) return { error: null };
      if (error.code && !['57014', '53300'].includes(error.code)) break;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
    handleSupabaseError(error, 'saveExerciseProgressToSupabase');
    return { error };
  });
}

export async function loadWorkoutProgressFromSupabase(userId, day, date = localDate()) {
  try {
    const { data, error } = await supabase.from('workout_progress').select('*').eq('user_id', userId).eq('day', normalizeDayName(day)).eq('workout_date', date);
    if (error) throw error;
    const receipt = readLocal(receiptKey(userId, day, date));
    const exercisesState = {};
    for (const row of data || []) {
      if (receipt && row.updated_at <= receipt.finishedAt) continue;
      const first = row.sets_data?.[0];
      exercisesState[row.exercise_index] = { exerciseId: first?._exerciseId, exerciseName: row.exercise_name,
        revision: first?._revision, sessionKey: first?._sessionKey, startedAt: first?._startedAt,
        updatedAt: row.updated_at, sets: row.sets_data || [], completed: row.completed || false };
    }
    return { exercisesState, error: null };
  } catch (error) { handleSupabaseError(error, 'loadWorkoutProgressFromSupabase'); return { exercisesState: null, error }; }
}

export async function clearWorkoutProgressFromSupabase(userId, day, date = localDate()) {
  await drainSaves(progressQueueKey(userId, day, date));
  try {
    const { error } = await supabase.from('workout_progress').delete().eq('user_id', userId).eq('day', normalizeDayName(day)).eq('workout_date', date);
    if (error) throw error;
    return { error: null };
  } catch (error) { handleSupabaseError(error, 'clearWorkoutProgressFromSupabase'); return { error }; }
}

export async function waitForWorkoutSaves(userId, day, date) {
  await drainSaves(progressQueueKey(userId, day, date));
}

export async function resolveTechniqueVideo(reference) {
  const publicPrefix = '/storage/v1/object/public/technique-videos/';
  let filePath;
  if (reference.startsWith('storage:technique-videos/')) filePath = reference.slice('storage:technique-videos/'.length);
  else if (reference.includes(publicPrefix)) {
    const parsed = new URL(reference);
    filePath = decodeURIComponent(parsed.pathname.split(publicPrefix)[1]);
  } else {
    if (!/^https?:\/\//i.test(reference)) throw new Error('El enlace del vídeo no es válido.');
    return reference;
  }
  const { data, error } = await supabase.storage.from('technique-videos').createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
