import { supabase } from '@/lib/customSupabaseClient';

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

const handleSupabaseError = (error, context) => {
  console.error(`Error in ${context}:`, error);
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
    
    if(insertError) {
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
    const exercisesToInsert = session.exercises.flatMap(exercise => 
      exercise.sets.map(set => ({
        session_id: sessionData.id,
        exercise_name: exercise.name,
        reps: set.reps,
        weight: set.weight,
        rir: set.rir,
        rpe: set.rpe
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