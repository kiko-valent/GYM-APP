import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getWorkoutPlanForDay, saveWorkoutSession, getUserPlan } from '@/utils/workoutData';
import SetTracker from '@/components/SetTracker';
import ExerciseNavChips from '@/components/ExerciseNavChips';
import WorkoutEvaluation from '@/components/WorkoutEvaluation';
import { useToast } from '@/components/ui/use-toast';

export default function WorkoutPage() {
  const { day } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [plan, setPlan] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState({ trackIntensity: false });

  // State object to track ALL exercises' progress
  const [exercisesState, setExercisesState] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadPlan = async () => {
      if (user) {
        try {
          const fullPlan = await getUserPlan(user.id);
          if (fullPlan?.preferences && isMounted) {
            setUserPreferences(fullPlan.preferences);
          }

          const workoutData = await getWorkoutPlanForDay(user.id, day);
          if (isMounted) {
            setPlan(workoutData);
            if (workoutData?.exercises) {
              const initialState = {};
              workoutData.exercises.forEach((_, idx) => {
                initialState[idx] = { sets: [], completed: false };
              });
              setExercisesState(initialState);
            }
            setLoading(false);
          }
        } catch (error) {
          console.error("Error loading plan:", error);
          if (isMounted) setLoading(false);
        }
      }
    };
    loadPlan();
    return () => { isMounted = false; };
  }, [user, day]);

  const saveCurrentExerciseProgress = useCallback((sets, completed = false) => {
    setExercisesState(prev => ({
      ...prev,
      [currentExerciseIndex]: {
        sets: sets || prev[currentExerciseIndex]?.sets || [],
        completed: completed || prev[currentExerciseIndex]?.completed || false
      }
    }));
  }, [currentExerciseIndex]);

  const handleNavigateToExercise = useCallback((targetIndex) => {
    if (targetIndex === currentExerciseIndex) return;
    setCurrentExerciseIndex(targetIndex);
  }, [currentExerciseIndex]);

  const handleExerciseComplete = (exerciseData) => {
    setExercisesState(prev => ({
      ...prev,
      [currentExerciseIndex]: {
        sets: exerciseData.sets,
        completed: true
      }
    }));

    const updatedState = {
      ...exercisesState,
      [currentExerciseIndex]: { sets: exerciseData.sets, completed: true }
    };

    const allCompleted = plan.exercises.every((_, idx) => updatedState[idx]?.completed);

    if (allCompleted) {
      setIsComplete(true);
    } else {
      let nextIndex = -1;
      for (let i = 0; i < plan.exercises.length; i++) {
        const checkIdx = (currentExerciseIndex + 1 + i) % plan.exercises.length;
        if (!updatedState[checkIdx]?.completed) {
          nextIndex = checkIdx;
          break;
        }
      }

      if (nextIndex !== -1) {
        setCurrentExerciseIndex(nextIndex);
      } else {
        setIsComplete(true);
      }
    }
  };

  const handleSetProgress = (sets) => {
    saveCurrentExerciseProgress(sets, false);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleWorkoutFinish = async (evaluation) => {
    const completedExercises = plan.exercises
      .map((ex, idx) => {
        const state = exercisesState[idx];
        if (state?.completed && state?.sets?.length > 0) {
          return { name: ex.name, sets: state.sets };
        }
        return null;
      })
      .filter(Boolean);

    const sessionData = {
      day,
      date: new Date().toISOString(),
      exercises: completedExercises,
      evaluation
    };

    await saveWorkoutSession(user.id, sessionData);

    toast({
      title: "¡Entrenamiento guardado! 🎉",
      description: "Gran trabajo hoy. Sigue así.",
    });

    navigate('/dashboard');
  };

  const getCompletionPercentage = () => {
    if (!plan?.exercises) return 0;
    const completedCount = Object.values(exercisesState).filter(s => s.completed).length;
    return Math.round((completedCount / plan.exercises.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Cargando entrenamiento...</p>
        </div>
      </div>
    );
  }

  if (!plan || plan.exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg p-8 text-center">
        <div className="text-6xl mb-4">😴</div>
        <h2 className="text-2xl font-bold text-white mb-2">Día de descanso</h2>
        <p className="text-secondary mb-8">No tienes ejercicios programados para hoy.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-dark-pill px-6 py-3">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  if (isComplete) {
    return <WorkoutEvaluation onComplete={handleWorkoutFinish} />;
  }

  const currentExercise = plan.exercises[currentExerciseIndex];
  const currentExerciseState = exercisesState[currentExerciseIndex] || { sets: [], completed: false };

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Salir</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-secondary">
            {getCompletionPercentage()}% Completado
          </span>
          <div className="w-16 h-2 bg-dark-card-lighter rounded-full overflow-hidden">
            <div
              className="h-full bg-lime rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercise Navigation Chips */}
      <ExerciseNavChips
        exercises={plan.exercises}
        currentIndex={currentExerciseIndex}
        exercisesState={exercisesState}
        onNavigate={handleNavigateToExercise}
      />

      {/* Set Tracker */}
      <SetTracker
        key={`exercise-${currentExerciseIndex}`}
        exercise={currentExercise}
        exerciseNumber={currentExerciseIndex + 1}
        totalExercises={plan.exercises.length}
        onExerciseComplete={handleExerciseComplete}
        onSetProgress={handleSetProgress}
        onBack={handleBack}
        userId={user.id}
        day={day}
        initialCompletedSets={currentExerciseState.sets}
        trackIntensity={userPreferences.trackIntensity}
      />
    </div>
  );
}