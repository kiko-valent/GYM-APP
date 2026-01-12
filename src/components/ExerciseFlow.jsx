import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import SetTracker from './SetTracker';
import RestTimer from './RestTimer';

export default function ExerciseFlow({ 
  exercises, 
  onWorkoutFinish, 
  userId, 
  day, 
  initialState,
  onProgressUpdate 
}) {
  // Initialize state from savedState if available
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(initialState?.currentExerciseIndex || 0);
  const [showRestTimer, setShowRestTimer] = useState(initialState?.showRestTimer || false);
  const [completedExercisesData, setCompletedExercisesData] = useState(initialState?.completedExercises || []);
  
  // Holds the 'current set' data for restoration if we reload page mid-exercise
  const initialCurrentExerciseSets = initialState?.currentExerciseSets || [];

  // Persist state changes
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate({
        currentExerciseIndex,
        showRestTimer,
        completedExercises: completedExercisesData,
        // We don't have 'currentExerciseSets' here directly, it's handled via callback from SetTracker
        // For now, we just save the macro state here. Detailed state is saved in handleSetProgress.
      });
    }
  }, [currentExerciseIndex, showRestTimer, completedExercisesData]);

  const handleSetProgress = (currentSets) => {
    if (onProgressUpdate) {
      onProgressUpdate({
        currentExerciseIndex,
        showRestTimer,
        completedExercises: completedExercisesData,
        currentExerciseSets: currentSets // Save the granular progress of current exercise
      });
    }
  };

  const handleExerciseComplete = (exerciseData) => {
    const newCompletedData = [...completedExercisesData, exerciseData];
    setCompletedExercisesData(newCompletedData);

    if (currentExerciseIndex < exercises.length - 1) {
      setShowRestTimer(true);
    } else {
      onWorkoutFinish(newCompletedData);
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
    setCurrentExerciseIndex(prev => prev + 1);
  };

  // Back Logic
  const handleRestBack = () => {
    // User wants to go back to the exercise they just finished to fix something
    const lastExercise = completedExercisesData[completedExercisesData.length - 1];
    
    // Remove the last completed exercise from the list
    const newCompletedData = completedExercisesData.slice(0, -1);
    setCompletedExercisesData(newCompletedData);
    
    // Turn off rest timer to show SetTracker again
    setShowRestTimer(false);
    // currentExerciseIndex stays the same because we are currently "between" index and index+1 during rest
    // Wait - in handleExerciseComplete we didn't increment index yet. 
    // So currentExerciseIndex still points to the exercise we just finished.
    // So we just need to hide rest timer and pass the data back to SetTracker.
  };

  const handleExerciseBack = () => {
    // User is in SetTracker (Set 1) and wants to go back to PREVIOUS exercise
    if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1;
      
      // Get the data of the previous exercise to let user edit it
      const prevExerciseData = completedExercisesData[completedExercisesData.length - 1];
      
      // Remove it from completed list
      const newCompletedData = completedExercisesData.slice(0, -1);
      setCompletedExercisesData(newCompletedData);
      
      setCurrentExerciseIndex(prevIndex);
      // We don't show rest timer, we go straight to editing that exercise
      setShowRestTimer(false);
    }
  };

  // Determine initial sets for SetTracker
  // If we are simply rendering, we use 'initialCurrentExerciseSets' (from resume)
  // If we just clicked "Back" from RestTimer, we want to use the data we just popped from completedExercisesData
  // We can determine this by checking if 'completedExercisesData' length matches 'currentExerciseIndex'
  
  // Logic: 
  // If resuming: 'initialCurrentExerciseSets' has data.
  // If normally flowing: 'initialCurrentExerciseSets' is empty (handled by useState init).
  // If going BACK from Rest: We need to pass the data we just removed.
  // But 'completedExercisesData' update is async/state based.
  
  // Let's compute the 'sets to restore' dynamically
  // If we are resuming a session where we were editing Ex 1, 'initialCurrentExerciseSets' is set.
  // If we are normally navigating, we pass nothing.
  // The tricky part is "Back from Rest". 
  // When Back from Rest happens, we update completedExercisesData.
  // But SetTracker needs to know "Hey, initialize with THESE sets".
  // We can achieve this by storing "restoredSets" in state momentarily.
  
  // Actually, simplest way: 
  // If currentExerciseIndex matches the length of completedExercisesData, 
  // it means we haven't finished this exercise yet.
  // But if we just came back from rest, we effectively 'un-finished' it.
  
  // Let's use a specific prop for "sets to pre-fill".
  // If 'initialCurrentExerciseSets' exists and matches current index context, use it.
  // However, when we click "Back", we want to force SetTracker to load specific sets.
  // We can use a key on SetTracker that includes the 'completedExercisesData.length' or similar to force re-mount/reset?
  // Or just pass 'initialSets' which SetTracker respects on mount.

  // Workaround for "Back from Rest": 
  // We need to find if we have "popped" data available to pass.
  // But since we removed it from state, we lost it? 
  // NO, in handleRestBack we sliced it. We should grab it there and save to a state 'setsToRestore'.
  
  const [setsToRestore, setSetsToRestore] = useState(initialCurrentExerciseSets);

  // When we successfully complete an exercise, clear restore state
  useEffect(() => {
    // If we move to a new exercise index (forward), clear restore
    // But we also change index when moving back.
  }, [currentExerciseIndex]);

  const activeRestBack = () => {
    const lastExercise = completedExercisesData[completedExercisesData.length - 1];
    setSetsToRestore(lastExercise?.sets || []);
    handleRestBack();
  };
  
  const activeExerciseBack = () => {
    // Going back from Set 1 of Ex 2 to Ex 1
    const prevExerciseData = completedExercisesData[completedExercisesData.length - 1];
    setSetsToRestore(prevExerciseData?.sets || []);
    handleExerciseBack();
  };

  const currentExercise = exercises[currentExerciseIndex];
  const nextExerciseName = exercises[currentExerciseIndex + 1]?.name || "Finalizar";

  return (
    <AnimatePresence mode="wait">
      {showRestTimer ? (
        <RestTimer
          key={`timer-${currentExerciseIndex}`}
          onComplete={handleRestComplete}
          onBack={activeRestBack}
          nextExercise={nextExerciseName}
        />
      ) : (
        <SetTracker
          key={`exercise-${currentExerciseIndex}-${setsToRestore.length}`} // Force remount if restored sets change
          exercise={currentExercise}
          onExerciseComplete={(data) => {
            setSetsToRestore([]); // Clear restore data on completion
            handleExerciseComplete(data);
          }}
          onSetProgress={handleSetProgress}
          onBack={activeExerciseBack}
          userId={userId}
          day={day}
          exerciseNumber={currentExerciseIndex + 1}
          totalExercises={exercises.length}
          initialCompletedSets={setsToRestore}
        />
      )}
    </AnimatePresence>
  );
}