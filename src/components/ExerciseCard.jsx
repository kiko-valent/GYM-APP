import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPreviousWorkout } from '@/utils/workoutData';

export default function ExerciseCard({ exercise, exerciseNumber, totalExercises, onComplete, userId, day }) {
  const [reps, setReps] = useState(exercise.reps);
  const [weight, setWeight] = useState(exercise.weight);
  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreviousData = async () => {
      const prev = await getPreviousWorkout(userId, day, exercise.name);
      setPreviousData(prev);
      setLoading(false);
    };
    fetchPreviousData();
  }, [userId, day, exercise.name]);

  const handleComplete = () => {
    onComplete({ reps, weight, exerciseName: exercise.name });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-blue-300 text-sm mb-1">Ejercicio {exerciseNumber} de {totalExercises}</p>
          <h2 className="text-3xl font-bold text-white">{exercise.name}</h2>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{exerciseNumber}</span>
        </div>
      </div>

      {!loading && previousData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/20 rounded-xl p-4 mb-6 border border-blue-400/30"
        >
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-300 mt-0.5" />
            <div>
              <p className="text-blue-200 text-sm font-semibold mb-1">Última vez:</p>
              <p className="text-white">{previousData.reps} reps × {previousData.weight}kg</p>
              {previousData.feeling && (
                <p className="text-blue-200 text-sm mt-1">Sensación: {previousData.feeling}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Repeticiones</Label>
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="bg-white/10 border-white/20 text-white text-2xl font-bold text-center"
            />
            <p className="text-blue-200 text-sm text-center">Recomendado: {exercise.reps}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-white">Peso (kg)</Label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="bg-white/10 border-white/20 text-white text-2xl font-bold text-center"
            />
            <p className="text-blue-200 text-sm text-center">Recomendado: {exercise.weight}kg</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleComplete}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 rounded-xl text-lg"
      >
        <Check className="w-5 h-5 mr-2" />
        Completar Ejercicio
      </Button>
    </motion.div>
  );
}