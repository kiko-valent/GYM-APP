import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Info, Video as VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
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

export default function ExerciseCard({ exercise, exerciseNumber, totalExercises, onComplete, userId, day }) {
  const [reps, setReps] = useState(exercise.reps);
  const [weight, setWeight] = useState(exercise.weight);
  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const prev = await getPreviousWorkout(userId, day, exercise.name);
      setPreviousData(prev);
      setLoading(false);
    };
    fetchData();
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

      <div className="pt-4 border-t border-white/10 mb-8">
        <div className="flex flex-col gap-2">
          <Label className="text-blue-200 text-sm font-semibold flex items-center gap-2">
            <VideoIcon className="w-4 h-4" /> Video de Técnica
          </Label>

          {exercise.techniqueVideo ? (
            <Button
              variant="outline"
              onClick={() => setShowVideoModal(true)}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-200 border-red-500/30 flex items-center justify-center gap-2 h-12"
            >
              <VideoIcon className="w-5 h-5" />
              Ver Tutorial en YouTube
            </Button>
          ) : (
            <p className="text-white/30 text-sm italic">No hay video configurado</p>
          )}
        </div>
      </div>

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

      <Button
        onClick={handleComplete}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 rounded-xl text-lg"
      >
        <Check className="w-5 h-5 mr-2" />
        Completar Ejercicio
      </Button>
    </motion.div >
  );
}