import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Minus, ArrowLeft, Target, Calendar, Trophy, Timer, ExternalLink, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { getPreviousWorkout } from '@/utils/workoutData';
import { useToast } from '@/components/ui/use-toast';

export default function SetTracker({
  exercise,
  onExerciseComplete,
  onSetProgress,
  userId,
  day,
  initialCompletedSets = [],
  trackIntensity = false
}) {
  const totalSets = exercise.sets;

  // Initialize from props (restoration or resume)
  const [completedSets, setCompletedSets] = useState(initialCompletedSets);
  const [currentSet, setCurrentSet] = useState(Math.min(initialCompletedSets.length + 1, totalSets));

  // Initialize inputs with last completed set values if available, else default
  const lastCompleted = initialCompletedSets[initialCompletedSets.length - 1];
  const [reps, setReps] = useState(lastCompleted ? lastCompleted.reps : exercise.reps);
  const [weight, setWeight] = useState(lastCompleted ? lastCompleted.weight : exercise.weight);

  // New RIR/RPE states
  const [rir, setRir] = useState(lastCompleted ? lastCompleted.rir ?? 2 : 2);
  const [rpe, setRpe] = useState(lastCompleted ? lastCompleted.rpe ?? 8 : 8);

  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Edit mode: index into completedSets of the set being corrected, or null
  const [editingIndex, setEditingIndex] = useState(null);
  // Holds the in-progress inputs while editing a previous set
  const stashedInputsRef = useRef(null);

  // Goal Achievement State
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [goalAchievedData, setGoalAchievedData] = useState(null);

  // Rest timer states
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const allSetsDone = completedSets.length >= totalSets;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Vibrate when rest finishes (mobile)
  useEffect(() => {
    if (showRestTimer && timeLeft === 0 && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [showRestTimer, timeLeft]);

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

  const validateInputs = () => {
    const parsedReps = parseInt(reps, 10);
    const parsedWeight = parseFloat(weight);

    if (!parsedReps || parsedReps <= 0) {
      toast({ variant: 'destructive', title: 'Repeticiones inválidas', description: 'Introduce un número de reps mayor que 0.' });
      return null;
    }
    if (isNaN(parsedWeight) || parsedWeight < 0) {
      toast({ variant: 'destructive', title: 'Peso inválido', description: 'Introduce un peso válido (mayor o igual a 0).' });
      return null;
    }
    return { reps: parsedReps, weight: parsedWeight };
  };

  const handleConfirmSet = () => {
    const parsed = validateInputs();
    if (!parsed) return;

    const setData = {
      set: currentSet,
      reps: parsed.reps,
      weight: parsed.weight,
    };

    if (trackIntensity) {
      setData.rir = parseInt(rir, 10);
      setData.rpe = parseInt(rpe, 10);
    }

    if (exercise.targetWeight && parsed.weight >= parseFloat(exercise.targetWeight)) {
      const daysLeft = getDaysRemaining(exercise.targetDate);
      const isEarly = daysLeft && daysLeft > 0;
      const alreadyAchievedInSession = completedSets.some(s => s.weight >= parseFloat(exercise.targetWeight));

      if (!alreadyAchievedInSession) {
        setGoalAchievedData({
          weight: parsed.weight,
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
    setCurrentSet(prev => Math.min(prev + 1, totalSets));
    setTimeLeft(restDuration);
  };

  const handleSkipRest = () => {
    setIsTimerRunning(false);
    handleContinueToNextSet();
  };

  const handleRestBack = () => {
    setShowRestTimer(false);
    setIsTimerRunning(false);
    const newCompletedSets = completedSets.slice(0, -1);
    setCompletedSets(newCompletedSets);
  };

  // ===== Edit previous set =====
  const startEditSet = (index) => {
    if (editingIndex === null) {
      stashedInputsRef.current = { reps, weight, rir, rpe };
    }
    const target = completedSets[index];
    setReps(target.reps);
    setWeight(target.weight);
    if (trackIntensity) {
      setRir(target.rir ?? 2);
      setRpe(target.rpe ?? 8);
    }
    setEditingIndex(index);
  };

  const cancelEdit = () => {
    const stashed = stashedInputsRef.current;
    if (stashed) {
      setReps(stashed.reps);
      setWeight(stashed.weight);
      setRir(stashed.rir);
      setRpe(stashed.rpe);
      stashedInputsRef.current = null;
    }
    setEditingIndex(null);
  };

  const handleSaveEdit = () => {
    const parsed = validateInputs();
    if (parsed === null) return;

    const setNumber = completedSets[editingIndex]?.set ?? editingIndex + 1;
    setCompletedSets(prev => prev.map((s, i) => {
      if (i !== editingIndex) return s;
      const updated = { ...s, reps: parsed.reps, weight: parsed.weight };
      if (trackIntensity) {
        updated.rir = parseInt(rir, 10);
        updated.rpe = parseInt(rpe, 10);
      }
      return updated;
    }));

    toast({ title: `Serie ${setNumber} corregida ✓`, description: `${parsed.weight}kg × ${parsed.reps} reps` });
    cancelEdit();
  };

  // Open video externally in YouTube app or browser
  const handleOpenVideo = () => {
    if (!exercise.techniqueVideo) {
      toast({
        variant: "destructive",
        title: "Sin vídeo",
        description: "No hay vídeo configurado para este ejercicio."
      });
      return;
    }
    // Open in new tab - on mobile this will open YouTube app if installed
    window.open(exercise.techniqueVideo, '_blank', 'noopener,noreferrer');
  };

  // Adjusts both total duration and remaining time so the buttons work mid-countdown
  const adjustRestTime = (delta) => {
    setRestDuration(prev => Math.max(10, prev + delta));
    const next = Math.max(0, timeLeft + delta);
    setTimeLeft(next);
    if (next > 0 && !isTimerRunning) {
      setIsTimerRunning(true);
    }
  };

  const isEditing = editingIndex !== null;
  const isLastSet = currentSet === totalSets;
  const restFinished = timeLeft === 0;
  const progress = restDuration > 0 ? Math.min(100, Math.max(0, ((restDuration - timeLeft) / restDuration) * 100)) : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Calculate circumference for circular progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const numberOrZero = (v) => parseFloat(v) || 0;

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
            <button
              onClick={handleRestBack}
              className="flex items-center gap-1.5 text-white/60 hover:text-white p-2 -ml-2 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="text-sm">Corregir serie</span>
            </button>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {restFinished ? '¡A POR LA SIGUIENTE!' : 'DESCANSANDO...'}
            </h2>
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
              <span className={`text-6xl font-bold tracking-tight ${restFinished ? 'text-lime' : 'text-white'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-cyan text-sm font-medium tracking-widest mt-1">
                {restFinished ? 'COMPLETADO' : 'RESTANTE'}
              </span>
            </div>
          </div>

          {/* Time Adjustment Buttons */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => adjustRestTime(30)}
              className="btn-dark-pill px-5 py-3 text-sm"
            >
              +30s
            </button>
            <button
              onClick={() => adjustRestTime(60)}
              className="btn-dark-pill px-5 py-3 text-sm"
            >
              +1m
            </button>
            <button
              onClick={() => adjustRestTime(-10)}
              className="btn-dark-pill px-5 py-3 text-sm"
            >
              -10s
            </button>
          </div>

          {/* Up Next */}
          <div className="card-dark p-4 mb-6">
            <p className="label-uppercase mb-2">SIGUIENTE</p>
            <div className="flex items-center gap-3">
              <div className="bg-cyan/20 p-2 rounded-xl">
                <Target className="w-5 h-5 text-cyan" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">{exercise.name}</p>
                <p className="text-secondary text-sm">Serie {Math.min(currentSet + 1, totalSets)} • {exercise.reps} reps • {weight}kg</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenVideo}
              disabled={!exercise.techniqueVideo}
              className="w-full mt-3 text-cyan border border-cyan/30 hover:bg-cyan/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {exercise.techniqueVideo ? 'Ver en YouTube' : 'Sin vídeo'}
            </Button>
          </div>

          {/* Resume Button */}
          <button
            onClick={handleSkipRest}
            className={`w-full btn-cyan py-5 text-lg mb-4 ${restFinished ? 'animate-pulse glow-cyan' : ''}`}
          >
            Continuar entrenamiento →
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
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${allSetsDone ? 'bg-lime/20 text-lime' : 'bg-dark-card-lighter text-white'}`}>
                    {allSetsDone ? 'COMPLETADO ✓' : `SERIE ${currentSet}`}
                  </span>
                  {!allSetsDone && <span className="text-secondary">de {totalSets}</span>}
                  {!loading && previousData && (
                    <span className="text-secondary text-sm">
                      Anterior: {previousData.weight}kg × {previousData.reps}
                    </span>
                  )}
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleOpenVideo}
                  disabled={!exercise.techniqueVideo}
                  className="text-cyan p-0 h-auto font-normal justify-start disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> {exercise.techniqueVideo ? 'Consultar ejercicio' : 'Sin vídeo'}
                </Button>
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
                  <p className="text-lime text-sm font-medium">Objetivo: {exercise.targetWeight}kg</p>
                  {exercise.targetDate && (
                    <p className="text-lime/60 text-xs flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDeadline(exercise.targetDate)}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-lime font-bold">
                {exercise.targetWeight > 0 ? Math.min(100, Math.round((numberOrZero(weight) / exercise.targetWeight) * 100)) : 0}%
              </span>
            </motion.div>
          )}

          {/* Editing banner */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between bg-cyan/10 border border-cyan/40 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <Pencil className="w-5 h-5 text-cyan" />
                  <p className="text-cyan font-semibold">
                    Corrigiendo serie {completedSets[editingIndex]?.set ?? editingIndex + 1}
                  </p>
                </div>
                <button
                  onClick={cancelEdit}
                  className="text-white/60 hover:text-white p-1 transition-colors"
                  aria-label="Cancelar corrección"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {allSetsDone && !isEditing ? (
            /* Exercise already completed: only editing is allowed */
            <div className="card-dark p-6 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-lime/15 rounded-full mb-3 border border-lime/30">
                <Check className="w-8 h-8 text-lime" />
              </div>
              <p className="text-white font-semibold mb-1">Todas las series registradas</p>
              <p className="text-secondary text-sm">Toca cualquier serie de la lista para corregir el peso o las repeticiones.</p>
            </div>
          ) : (
            <>
              {/* Weight Input Card */}
              <div className={`card-dark p-6 ${isEditing ? 'border border-cyan/30' : ''}`}>
                <p className="label-uppercase text-center mb-4">PESO (KG)</p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setWeight(w => Math.max(0, numberOrZero(w) - 2.5))}
                    className="bg-dark-card-lighter hover:bg-dark-border w-16 h-20 rounded-2xl flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Minus className="w-6 h-6 text-cyan" />
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="number-display text-white bg-transparent text-center w-full focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setWeight(w => numberOrZero(w) + 2.5)}
                    className="bg-dark-card-lighter hover:bg-dark-border w-16 h-20 rounded-2xl flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Plus className="w-6 h-6 text-cyan" />
                  </button>
                </div>
                {/* Quick weight adjustments */}
                <div className="flex justify-center gap-2 mt-4">
                  {[2.5, 5, 10].map(increment => (
                    <button
                      key={increment}
                      onClick={() => setWeight(w => numberOrZero(w) + increment)}
                      className="btn-dark-pill px-4 py-2 text-sm"
                    >
                      +{increment}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reps Input Card */}
              <div className={`card-dark p-6 ${isEditing ? 'border border-cyan/30' : ''}`}>
                <p className="label-uppercase text-center mb-4">REPS</p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setReps(r => Math.max(0, (parseInt(r, 10) || 0) - 1))}
                    className="bg-dark-card-lighter hover:bg-dark-border w-16 h-20 rounded-2xl flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Minus className="w-6 h-6 text-cyan" />
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="number-display text-white bg-transparent text-center w-full focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setReps(r => (parseInt(r, 10) || 0) + 1)}
                    className="bg-dark-card-lighter hover:bg-dark-border w-16 h-20 rounded-2xl flex items-center justify-center transition-colors active:scale-95"
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
            </>
          )}

          {/* Action Button */}
          {isEditing ? (
            <div className="space-y-3">
              <button
                onClick={handleSaveEdit}
                className="w-full btn-cyan py-5 text-lg flex items-center justify-center gap-2"
              >
                GUARDAR SERIE {completedSets[editingIndex]?.set ?? editingIndex + 1}
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={cancelEdit}
                className="w-full btn-dark-pill py-4 text-base"
              >
                Cancelar
              </button>
            </div>
          ) : allSetsDone ? (
            <button
              onClick={() => onExerciseComplete({ name: exercise.name, sets: completedSets })}
              className="w-full btn-lime py-5 text-lg flex items-center justify-center gap-2"
            >
              GUARDAR Y CONTINUAR
              <Check className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleConfirmSet}
              className="w-full btn-lime py-5 text-lg flex items-center justify-center gap-2"
            >
              {isLastSet ? 'COMPLETAR EJERCICIO' : 'CONFIRMAR SERIE'}
              <Check className="w-5 h-5" />
            </button>
          )}

          {/* Set Progress Dots */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalSets }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${i < completedSets.length
                  ? 'bg-lime'
                  : i === completedSets.length
                    ? 'bg-cyan'
                    : 'bg-dark-card-lighter'
                  }`}
              />
            ))}
          </div>

          {/* Completed Sets - tap to fix a mistake */}
          {completedSets.length > 0 && (
            <div className="card-dark p-4">
              <p className="label-uppercase mb-3">SERIES COMPLETADAS · TOCA PARA CORREGIR</p>
              <div className="space-y-2">
                {completedSets.map((s, i) => {
                  const isBeingEdited = editingIndex === i;
                  return (
                    <motion.button
                      key={`${s.set}-${i}`}
                      layout
                      onClick={() => (isBeingEdited ? cancelEdit() : startEditSet(i))}
                      className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition-colors text-left ${isBeingEdited
                        ? 'bg-cyan/15 border border-cyan/50'
                        : 'bg-dark-card-lighter border border-transparent hover:border-cyan/30'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isBeingEdited ? 'bg-cyan text-dark-bg' : 'bg-lime/20 text-lime'}`}>
                          {isBeingEdited ? <Pencil className="w-3.5 h-3.5" /> : s.set}
                        </span>
                        <span className="text-white font-semibold">
                          {s.weight}kg × {s.reps}
                        </span>
                        {trackIntensity && s.rir != null && (
                          <span className="text-secondary text-xs">RIR {s.rir} · RPE {s.rpe}</span>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isBeingEdited ? 'text-cyan' : 'text-secondary'}`}>
                        {isBeingEdited ? 'Editando...' : 'Corregir'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}


    </AnimatePresence>
  );
}
