import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, Plus, Minus, ArrowLeft, Target, Calendar, Trophy, Timer, Video as VideoIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { getPreviousWorkout } from '@/utils/workoutData';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog.jsx";

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2]) ? match[2] : null;
};

export default function SetTracker({
  exercise,
  onExerciseComplete,
  onSetProgress,
  onBack,
  userId,
  day,
  exerciseNumber,
  totalExercises,
  initialCompletedSets = [],
  trackIntensity = false
}) {
  const totalSets = exercise.sets;

  // Initialize from props (restoration or resume)
  const [completedSets, setCompletedSets] = useState(initialCompletedSets);
  const [currentSet, setCurrentSet] = useState(initialCompletedSets.length + 1);

  // Initialize inputs with last completed set values if available, else default
  const lastCompleted = initialCompletedSets[initialCompletedSets.length - 1];
  const [reps, setReps] = useState(lastCompleted ? lastCompleted.reps : exercise.reps);
  const [weight, setWeight] = useState(lastCompleted ? lastCompleted.weight : exercise.weight);

  // New RIR/RPE states
  const [rir, setRir] = useState(lastCompleted ? lastCompleted.rir : 2);
  const [rpe, setRpe] = useState(lastCompleted ? lastCompleted.rpe : 8);

  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Video State
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Goal Achievement State
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [goalAchievedData, setGoalAchievedData] = useState(null);

  // Rest timer states
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (onSetProgress) {
      onSetProgress(completedSets);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedSets]);

  useEffect(() => {
    const fetchPreviousData = async () => {
      const prev = await getPreviousWorkout(userId, day, exercise.name);
      setPreviousData(prev);
      if (prev && completedSets.length === 0) {
        setWeight(prev.weight || exercise.weight);
      }
      setLoading(false);
    };
    fetchPreviousData();
  }, [userId, day, exercise.name, exercise.weight]);

  // Timer countdown effect
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (!isTimerRunning) {
      setTimeLeft(restDuration);
    }
  }, [restDuration, isTimerRunning]);

  const formatDeadline = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    const target = new Date(dateString);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleConfirmSet = () => {
    const setData = {
      set: currentSet,
      reps: parseInt(reps, 10),
      weight: parseFloat(weight),
    };

    if (trackIntensity) {
      setData.rir = parseInt(rir, 10);
      setData.rpe = parseInt(rpe, 10);
    }

    if (exercise.targetWeight && parseFloat(weight) >= parseFloat(exercise.targetWeight)) {
      const daysLeft = getDaysRemaining(exercise.targetDate);
      const isEarly = daysLeft && daysLeft > 0;
      const alreadyAchievedInSession = completedSets.some(s => s.weight >= parseFloat(exercise.targetWeight));

      if (!alreadyAchievedInSession) {
        setGoalAchievedData({
          weight: parseFloat(weight),
          target: parseFloat(exercise.targetWeight),
          daysLeft: daysLeft,
          isEarly: isEarly
        });
        setShowGoalCelebration(true);
        const newCompletedSets = [...completedSets, setData];
        setCompletedSets(newCompletedSets);
        return;
      }
    }

    proceedToNextStep(setData);
  };

  const proceedToNextStep = (currentSetData) => {
    let newCompletedSets = completedSets;
    const lastSet = completedSets[completedSets.length - 1];
    const setAlreadyAdded = lastSet && lastSet.set === currentSetData.set;

    if (!setAlreadyAdded) {
      newCompletedSets = [...completedSets, currentSetData];
      setCompletedSets(newCompletedSets);
    }

    if (currentSet < totalSets) {
      setShowGoalCelebration(false);
      setShowRestTimer(true);
      setTimeLeft(restDuration);
      setIsTimerRunning(true);
    } else {
      setShowGoalCelebration(false);
      onExerciseComplete({
        name: exercise.name,
        sets: newCompletedSets,
      });
    }
  };

  const handleContinueAfterCelebration = () => {
    const setData = {
      set: currentSet,
      reps: parseInt(reps, 10),
      weight: parseFloat(weight),
    };
    if (trackIntensity) {
      setData.rir = parseInt(rir, 10);
      setData.rpe = parseInt(rpe, 10);
    }
    proceedToNextStep(setData);
  };

  const handleContinueToNextSet = () => {
    setShowRestTimer(false);
    setIsTimerRunning(false);
    setCurrentSet(prev => prev + 1);
    setTimeLeft(restDuration);
  };

  const handleSkipRest = () => {
    setIsTimerRunning(false);
    handleContinueToNextSet();
  };

  const handleBack = () => {
    if (currentSet > 1) {
      const newCompletedSets = completedSets.slice(0, -1);
      setCompletedSets(newCompletedSets);
      setCurrentSet(prev => prev - 1);
      const prevSetData = completedSets[completedSets.length - 1];
      if (prevSetData) {
        setReps(prevSetData.reps);
        setWeight(prevSetData.weight);
        if (trackIntensity) {
          setRir(prevSetData.rir ?? 2);
          setRpe(prevSetData.rpe ?? 8);
        }
      }
    } else {
      if (onBack) onBack();
    }
  };

  const handleRestBack = () => {
    setShowRestTimer(false);
    setIsTimerRunning(false);
    const newCompletedSets = completedSets.slice(0, -1);
    setCompletedSets(newCompletedSets);
  };

  const isLastSet = currentSet === totalSets;
  const progress = ((restDuration - timeLeft) / restDuration) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Calculate circumference for circular progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence mode="wait">
      {showGoalCelebration ? (
        /* Goal Celebration Screen */
        <motion.div
          key="celebration"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="card-dark p-8 text-center"
        >
          <div className="mb-6">
            <div className="inline-flex items-center justify-center p-4 bg-lime/20 rounded-full mb-4 border border-lime/40 glow-lime">
              <Trophy className="w-16 h-16 text-lime" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">¡Objetivo Cumplido! 🎉</h2>
            <p className="text-xl text-lime font-semibold mb-1">
              Levantaste {goalAchievedData?.weight}kg
            </p>
            <p className="text-secondary">
              Meta: {goalAchievedData?.target}kg
            </p>

            {goalAchievedData?.daysLeft > 0 && (
              <div className="mt-4 bg-cyan/20 border border-cyan/30 rounded-2xl p-3 inline-block">
                <p className="text-cyan text-sm font-medium">
                  ¡Lo lograste {goalAchievedData.daysLeft} días antes! 🚀
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleContinueAfterCelebration}
            className="w-full btn-lime py-5 text-lg"
          >
            Continuar Entrenamiento
          </button>
        </motion.div>

      ) : showRestTimer ? (
        /* Rest Timer Screen - Circular Progress */
        <motion.div
          key="rest-timer"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={handleRestBack} className="text-white/60 hover:text-white p-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-white tracking-wide">RESTING...</h2>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Circular Progress */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <svg width="280" height="280" className="progress-ring">
              {/* Background circle */}
              <circle
                className="progress-ring-bg"
                strokeWidth="8"
                r={radius}
                cx="140"
                cy="140"
              />
              {/* Progress circle */}
              <circle
                className="progress-ring-fill"
                strokeWidth="8"
                r={radius}
                cx="140"
                cy="140"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>
            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-white tracking-tight">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-cyan text-sm font-medium tracking-widest mt-1">REMAINING</span>
            </div>
          </div>

          {/* Time Adjustment Buttons */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setRestDuration(prev => prev + 30)}
              className="btn-dark-pill px-5 py-3 text-sm"
            >
              +30s
            </button>
            <button
              onClick={() => setRestDuration(prev => prev + 60)}
              className="btn-dark-pill px-5 py-3 text-sm"
            >
              +1m
            </button>
            <button
              onClick={() => setRestDuration(prev => Math.max(10, prev - 10))}
              className="btn-dark-pill px-5 py-3 text-sm"
            >
              -10s
            </button>
          </div>

          {/* Up Next */}
          <div className="card-dark p-4 mb-6">
            <p className="label-uppercase mb-2">UP NEXT</p>
            <div className="flex items-center gap-3">
              <div className="bg-cyan/20 p-2 rounded-xl">
                <Target className="w-5 h-5 text-cyan" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">{exercise.name}</p>
                <p className="text-secondary text-sm">Set {currentSet + 1} • {exercise.reps} Reps • {weight}kg</p>
              </div>
            </div>
            {exercise.techniqueVideo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVideoModal(true)}
                className="w-full mt-3 text-cyan border border-cyan/30 hover:bg-cyan/10"
              >
                <Video className="w-4 h-4 mr-2" />
                Consultar Video
              </Button>
            )}
          </div>

          {/* Resume Button */}
          <button
            onClick={handleSkipRest}
            className="w-full btn-cyan py-5 text-lg mb-4"
          >
            Resume Workout →
          </button>
        </motion.div>

      ) : (
        /* Main Set Tracker Screen */
        <motion.div
          key="set-tracker"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white italic">{exercise.name.toUpperCase()}</h1>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-3">
                  <span className="bg-dark-card-lighter px-3 py-1 rounded-lg text-sm font-semibold text-white">
                    SET {currentSet}
                  </span>
                  <span className="text-secondary">of {totalSets}</span>
                  {!loading && previousData && (
                    <span className="text-secondary text-sm">
                      Last: {previousData.weight}kg × {previousData.reps}
                    </span>
                  )}
                </div>
                {exercise.techniqueVideo && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowVideoModal(true)}
                    className="text-cyan p-0 h-auto font-normal justify-start"
                  >
                    <VideoIcon className="w-4 h-4 mr-2" /> Consultar ejercicio
                  </Button>
                )}
              </div>
            </div>
            <div className="bg-dark-card-lighter p-2 rounded-full">
              <Timer className="w-5 h-5 text-cyan" />
            </div>
          </div>

          {/* Goal Reminder */}
          {exercise.targetWeight && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-lime/10 border border-lime/20 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-lime" />
                <div>
                  <p className="text-lime text-sm font-medium">Goal: {exercise.targetWeight}kg</p>
                  {exercise.targetDate && (
                    <p className="text-lime/60 text-xs flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDeadline(exercise.targetDate)}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-lime font-bold">
                {Math.min(100, Math.round((weight / exercise.targetWeight) * 100))}%
              </span>
            </motion.div>
          )}

          {/* Weight Input Card */}
          <div className="card-dark p-6">
            <p className="label-uppercase text-center mb-4">WEIGHT (KG)</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWeight(w => Math.max(0, w - 2.5))}
                className="bg-dark-card-lighter hover:bg-dark-border w-16 h-20 rounded-2xl flex items-center justify-center transition-colors"
              >
                <Minus className="w-6 h-6 text-cyan" />
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="number-display text-white bg-transparent text-center w-full focus:outline-none"
                />
              </div>
              <button
                onClick={() => setWeight(w => w + 2.5)}
                className="bg-dark-card-lighter hover:bg-dark-border w-16 h-20 rounded-2xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-6 h-6 text-cyan" />
              </button>
            </div>
            {/* Quick weight adjustments */}
            <div className="flex justify-center gap-2 mt-4">
              {[2.5, 5, 10].map(increment => (
                <button
                  key={increment}
                  onClick={() => setWeight(w => w + increment)}
                  className="btn-dark-pill px-4 py-2 text-sm"
                >
                  +{increment}
                </button>
              ))}
            </div>
          </div>

          {/* Reps Input Card */}
          <div className="card-dark p-6">
            <p className="label-uppercase text-center mb-4">REPS</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setReps(r => Math.max(0, r - 1))}
                className="bg-dark-card-lighter hover:bg-dark-border w-16 h-20 rounded-2xl flex items-center justify-center transition-colors"
              >
                <Minus className="w-6 h-6 text-cyan" />
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
                  className="number-display text-white bg-transparent text-center w-full focus:outline-none"
                />
              </div>
              <button
                onClick={() => setReps(r => r + 1)}
                className="bg-dark-card-lighter hover:bg-dark-border w-16 h-20 rounded-2xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-6 h-6 text-cyan" />
              </button>
            </div>
          </div>

          {/* RIR/RPE Section (if enabled) */}
          {trackIntensity && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="card-dark p-4">
                <p className="label-uppercase text-center mb-2">RIR</p>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setRir(r => Math.max(0, r - 1))} className="text-cyan p-1">
                    <Minus size={16} />
                  </button>
                  <span className="text-2xl font-bold text-white w-12 text-center">{rir}</span>
                  <button onClick={() => setRir(r => r + 1)} className="text-cyan p-1">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="card-dark p-4">
                <p className="label-uppercase text-center mb-2">RPE</p>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setRpe(r => Math.max(1, r - 1))} className="text-cyan p-1">
                    <Minus size={16} />
                  </button>
                  <span className="text-2xl font-bold text-white w-12 text-center">{rpe}</span>
                  <button onClick={() => setRpe(r => Math.min(10, r + 1))} className="text-cyan p-1">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirmSet}
            className="w-full btn-lime py-5 text-lg flex items-center justify-center gap-2"
          >
            {isLastSet ? 'COMPLETE EXERCISE' : 'CONFIRM SET'}
            <Check className="w-5 h-5" />
          </button>

          {/* Set Progress Dots */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalSets }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${i < currentSet - 1
                  ? 'bg-lime'
                  : i === currentSet - 1
                    ? 'bg-cyan'
                    : 'bg-dark-card-lighter'
                  }`}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="bg-black border-white/10 sm:max-w-2xl p-0 overflow-hidden">
          {exercise.techniqueVideo ? (
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYouTubeId(exercise.techniqueVideo)}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="p-8 text-center text-white">Video no disponible</div>
          )}
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}