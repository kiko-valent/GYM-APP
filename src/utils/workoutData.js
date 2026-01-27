import { supabase } from '@/lib/customSupabaseClient';
import { logError } from '@/utils/errorLogger';

const defaultPlan = {
  training_days: ['lunes', 'martes', 'jueves', 'viernes'],
  workouts: {
    lunes: {
      exercises: [
        { name: 'Press de Banca', sets: 4, reps: 10, weight: 60, description: 'Mantener codos a 45 grados, pies firmes en el suelo.' },
        { name: 'Aperturas con Mancuernas', sets: 3, reps: 12, weight: 15, description: '' },
      ]
    },
    martes: { exercises: [{ name: 'Dominadas', sets: 4, reps: 8, weight: 0, description: 'Rango completo de movimiento.' }] },
    jueves: { exercises: [{ name: 'Sentadillas', sets: 4, reps: 10, weight: 80, description: 'Romper el paralelo, pecho arriba.' }] },
    viernes: { exercises: [{ name: 'Press Militar', sets: 4, reps: 10, weight: 40, description: 'No arquear la espalda baja.' }] },
  }
};

const handleSupabaseError = (error, context, metadata = null) => {
  console.error(`Error in ${context}:`, error);
  logError(context, error, metadata);
  return error;
};

export async function getUserPlan(userId) {
  try {
    const { data, error } = await supabase
      .from('user_plans')
      .select('plan_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error, 'getUserPlan');
      return defaultPlan;
    }

    if (data) {
      return data.plan_data;
    }

    // Create default plan if none exists
    const { data: newPlanData, error: insertError } = await supabase
      .from('user_plans')
      .insert({ user_id: userId, plan_data: defaultPlan })
      .select('plan_data')
      .single();

    if (insertError) {
      handleSupabaseError(insertError, 'getUserPlan (create default)');
      return defaultPlan;
    }

    return newPlanData.plan_data;
  } catch (e) {
    handleSupabaseError(e, 'getUserPlan (unexpected)');
    return defaultPlan;
  }
}

export async function updateUserPlan(userId, planData) {
  try {
    const { data, error } = await supabase
      .from('user_plans')
      .update({ plan_data: planData, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (error) {
      handleSupabaseError(error, 'updateUserPlan');
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('user_plans')
        .insert({ user_id: userId, plan_data: planData })
        .select();

      if (insertError) {
        handleSupabaseError(insertError, 'updateUserPlan (insert)');
        return { data: null, error: insertError };
      }
      return { data: insertData, error: null };
    }

    return { data, error: null };
  } catch (e) {
    handleSupabaseError(e, 'updateUserPlan (unexpected)');
    return { data: null, error: e };
  }
}


export async function getWorkoutPlanForDay(userId, day) {
  try {
    const plan = await getUserPlan(userId);
    const workout = plan.workouts?.[day];
    if (!workout) {
      return { title: `Entrenamiento ${day}`, exercises: [] };
    }
    return {
      title: `Entrenamiento ${day.charAt(0).toUpperCase() + day.slice(1)}`,
      exercises: workout.exercises || []
    };
  } catch (e) {
    handleSupabaseError(e, 'getWorkoutPlanForDay');
    return { title: `Entrenamiento ${day}`, exercises: [] };
  }
}

export async function saveWorkoutSession(userId, session) {
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        day: session.day,
        date: session.date,
        evaluation: { feeling: session.evaluation.feeling },
        notes: session.evaluation.notes,
      })
      .select()
      .single();

    if (sessionError) {
      handleSupabaseError(sessionError, 'saveWorkoutSession');
      return { error: sessionError };
    }

    // Prepare exercises with all details including RIR/RPE if available
    // Ensure reps is integer and weight is rounded to integer (Supabase requires integer type)
    const exercisesToInsert = session.exercises.flatMap(exercise =>
      exercise.sets.map(set => ({
        session_id: sessionData.id,
        exercise_name: exercise.name,
        reps: parseInt(set.reps, 10) || 0,
        weight: Math.round(parseFloat(set.weight) || 0),
        rir: set.rir != null ? parseInt(set.rir, 10) : null,
        rpe: set.rpe != null ? parseInt(set.rpe, 10) : null
      }))
    );

    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(exercisesToInsert);

    if (exercisesError) {
      handleSupabaseError(exercisesError, 'saveWorkoutSession (exercises)');
      return { error: exercisesError };
    }

    return { error: null };
  } catch (e) {
    handleSupabaseError(e, 'saveWorkoutSession (unexpected)');
    return { error: e };
  }
}

export async function getWorkoutHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_exercises (
          exercise_name,
          reps,
          weight,
          rir,
          rpe
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'getWorkoutHistory');
      return [];
    }

    return data;
  } catch (e) {
    handleSupabaseError(e, 'getWorkoutHistory (unexpected)');
    return [];
  }
}

export async function getPreviousWorkout(userId, day, exerciseName) {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('evaluation, notes, workout_exercises!inner(reps, weight, rir, rpe)')
      .eq('user_id', userId)
      .eq('day', day)
      .eq('workout_exercises.exercise_name', exerciseName)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error, 'getPreviousWorkout');
      return null;
    }

    if (!data || !data.workout_exercises || data.workout_exercises.length === 0) {
      return null;
    }

    const lastSession = data;
    const exerciseData = data.workout_exercises[0];

    return {
      reps: exerciseData.reps,
      weight: exerciseData.weight,
      rir: exerciseData.rir,
      rpe: exerciseData.rpe,
      feeling: lastSession.evaluation?.feeling,
      notes: lastSession.notes
    };
  } catch (e) {
    handleSupabaseError(e, 'getPreviousWorkout (unexpected)');
    return null;
  }
}

export async function deleteWorkoutSession(sessionId) {
  try {
    // First delete related exercises
    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('session_id', sessionId);

    if (exercisesError) {
      handleSupabaseError(exercisesError, 'deleteWorkoutSession (exercises)');
      return { error: exercisesError };
    }

    // Then delete the session
    const { error: sessionError } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) {
      handleSupabaseError(sessionError, 'deleteWorkoutSession (session)');
      return { error: sessionError };
    }

    return { error: null };
  } catch (e) {
    handleSupabaseError(e, 'deleteWorkoutSession (unexpected)');
    return { error: e };
  }
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

    return data?.video_url || null;
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

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('technique-videos')
      .getPublicUrl(filePath);

    // 3. Save to DB
    const { error: dbError } = await supabase
      .from('user_exercise_videos')
      .upsert({
        user_id: userId,
        exercise_name: exerciseName,
        video_url: publicUrl
      }, { onConflict: 'user_id, exercise_name' });

    if (dbError) {
      handleSupabaseError(dbError, 'uploadTechniqueVideo (db)');
      return { error: dbError };
    }

    return { publicUrl, error: null };
  } catch (e) {
    handleSupabaseError(e, 'uploadTechniqueVideo (unexpected)');
    return { error: e };
  }
}

// ==========================================
// In-Progress Workout Persistence (localStorage)
// ==========================================

const getProgressKey = (userId, day) => `workout_progress_${userId}_${day}`;

/**
 * Save current workout progress to localStorage.
 * @param {string} userId
 * @param {string} day - e.g., 'lunes'
 * @param {Object} exercisesState - { 0: { sets: [...], completed: true }, ... }
 * @param {number} currentExerciseIndex
 */
export function saveWorkoutProgress(userId, day, exercisesState, currentExerciseIndex) {
  try {
    const key = getProgressKey(userId, day);
    const data = {
      exercisesState,
      currentExerciseIndex,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save workout progress to localStorage:', e);
  }
}

/**
 * Load saved workout progress from localStorage.
 * @param {string} userId
 * @param {string} day
 * @returns {{ exercisesState: Object, currentExerciseIndex: number, savedAt: string } | null}
 */
export function loadWorkoutProgress(userId, day) {
  try {
    const key = getProgressKey(userId, day);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load workout progress from localStorage:', e);
    return null;
  }
}

/**
 * Clear saved workout progress from localStorage (call after final save).
 * @param {string} userId
 * @param {string} day
 */
export function clearWorkoutProgress(userId, day) {
  try {
    const key = getProgressKey(userId, day);
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear workout progress from localStorage:', e);
  }
}

// ==========================================
// In-Progress Workout Persistence (Supabase)
// ==========================================

/**
 * Get today's date in YYYY-MM-DD format for the user's timezone
 */
const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Save exercise progress to Supabase (called on each set confirmation).
 * Uses upsert to handle both insert and update cases.
 * @param {string} userId
 * @param {string} day - e.g., 'lunes'
 * @param {number} exerciseIndex
 * @param {string} exerciseName
 * @param {Array} setsData - Array of set objects
 * @param {boolean} completed - Whether exercise is fully completed
 * @returns {Promise<{error: Error|null}>}
 */
export async function saveExerciseProgressToSupabase(userId, day, exerciseIndex, exerciseName, setsData, completed) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase
        .from('workout_progress')
        .upsert({
          user_id: userId,
          day: day,
          workout_date: getTodayDate(),
          exercise_index: exerciseIndex,
          exercise_name: exerciseName,
          sets_data: setsData,
          completed: completed,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,day,workout_date,exercise_index'
        });

      if (error) {
        lastError = error;
        // Retry on transient errors (network issues, timeouts)
        if (attempt < maxRetries) {
          console.log(`[SUPABASE] Retry ${attempt}/${maxRetries} for saveExerciseProgressToSupabase`);
          await new Promise(r => setTimeout(r, 500 * attempt)); // Exponential backoff
          continue;
        }
        handleSupabaseError(error, 'saveExerciseProgressToSupabase');
        return { error };
      }

      console.log('[SUPABASE] Saved exercise progress:', { exerciseIndex, exerciseName, setsCount: setsData.length, completed });
      return { error: null };
    } catch (e) {
      lastError = e;
      // Retry on network errors (TypeError: Load failed, etc.)
      if (attempt < maxRetries) {
        console.log(`[SUPABASE] Retry ${attempt}/${maxRetries} after error:`, e.message);
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }
      handleSupabaseError(e, 'saveExerciseProgressToSupabase (unexpected)');
      return { error: e };
    }
  }

  return { error: lastError };
}

/**
 * Load all exercise progress from Supabase for today's workout.
 * @param {string} userId
 * @param {string} day - e.g., 'lunes'
 * @returns {Promise<{exercisesState: Object, error: Error|null}>}
 */
export async function loadWorkoutProgressFromSupabase(userId, day) {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .select('exercise_index, exercise_name, sets_data, completed')
      .eq('user_id', userId)
      .eq('day', day)
      .eq('workout_date', getTodayDate());

    if (error) {
      handleSupabaseError(error, 'loadWorkoutProgressFromSupabase');
      return { exercisesState: null, error };
    }

    if (!data || data.length === 0) {
      console.log('[SUPABASE] No saved progress found for today');
      return { exercisesState: null, error: null };
    }

    // Convert array to exercisesState object format
    const exercisesState = {};
    data.forEach(row => {
      exercisesState[row.exercise_index] = {
        sets: row.sets_data || [],
        completed: row.completed || false
      };
    });

    console.log('[SUPABASE] Loaded progress:', exercisesState);
    return { exercisesState, error: null };
  } catch (e) {
    handleSupabaseError(e, 'loadWorkoutProgressFromSupabase (unexpected)');
    return { exercisesState: null, error: e };
  }
}

/**
 * Clear all progress for today's workout from Supabase (call after final save).
 * @param {string} userId
 * @param {string} day
 * @returns {Promise<{error: Error|null}>}
 */
export async function clearWorkoutProgressFromSupabase(userId, day) {
  try {
    const { error } = await supabase
      .from('workout_progress')
      .delete()
      .eq('user_id', userId)
      .eq('day', day)
      .eq('workout_date', getTodayDate());

    if (error) {
      handleSupabaseError(error, 'clearWorkoutProgressFromSupabase');
      return { error };
    }

    console.log('[SUPABASE] Cleared workout progress for', day);
    return { error: null };
  } catch (e) {
    handleSupabaseError(e, 'clearWorkoutProgressFromSupabase (unexpected)');
    return { error: e };
  }
}