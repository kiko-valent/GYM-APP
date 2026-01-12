import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, ChevronUp, Dumbbell, StickyNote, Activity, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateWorkoutPDF } from '@/utils/pdfGenerator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function WorkoutHistoryList({ history, onDelete }) {
  const processSession = (session) => {
    const groupedExercises = {};

    if (session.workout_exercises) {
      session.workout_exercises.forEach(ex => {
        if (!groupedExercises[ex.exercise_name]) {
          groupedExercises[ex.exercise_name] = [];
        }
        groupedExercises[ex.exercise_name].push(ex);
      });
    }

    return groupedExercises;
  };

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12 card-dark">
        <div className="bg-dark-card-lighter w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-8 h-8 text-secondary" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Sin historial aún</h3>
        <p className="text-secondary">Completa tu primer entrenamiento para verlo aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">Recent Grind</h3>

      {history.map((session, index) => (
        <HistoryItem
          key={session.id}
          session={session}
          exercises={processSession(session)}
          index={index}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function HistoryItem({ session, exercises, index, onDelete }) {
  const [isOpen, setIsOpen] = useState(index === 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} Days ago`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getDuration = () => {
    // Estimate duration: ~45 min per workout
    return '45 min';
  };

  const handleDownloadPDF = (e) => {
    e.stopPropagation();

    const workoutDataForPDF = Object.entries(exercises).map(([name, sets]) => ({
      name: name,
      sets: sets.map(set => ({
        weight: set.weight,
        reps: set.reps
      }))
    }));

    generateWorkoutPDF(workoutDataForPDF, session.date, session.day);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-dark overflow-hidden"
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 cursor-pointer hover:bg-dark-card-lighter transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-cyan/20 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-cyan" />
          </div>
          <div>
            <h4 className="text-white font-semibold capitalize">{session.day || 'Workout'}</h4>
            <div className="flex items-center gap-2 text-secondary text-sm">
              <Calendar className="w-3 h-3" />
              <span>{getDuration()}</span>
              <span>•</span>
              <span>{formatDate(session.date)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-secondary hover:text-white hover:bg-dark-card-lighter rounded-full w-8 h-8">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-dark-border">
              {session.notes && (
                <div className="mt-4 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                  <StickyNote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-200 text-sm italic">"{session.notes}"</p>
                </div>
              )}

              <div className="space-y-3 mt-4">
                {Object.entries(exercises).map(([name, sets], i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-white font-medium">{name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-secondary">
                      <span>{sets.length} × {sets[0]?.reps || 0}</span>
                      <span className="text-cyan font-medium">@ {sets[0]?.weight || 0}kg</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-secondary hover:text-white hover:bg-dark-card-lighter gap-2"
                  onClick={handleDownloadPDF}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-secondary hover:text-red-400 hover:bg-red-500/10"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-dark-card border-dark-border" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription className="text-secondary">
                        Esta acción no se puede deshacer. Se eliminará permanentemente el registro de este entrenamiento.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-dark-card-lighter border-dark-border text-white hover:bg-dark-border">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(session.id);
                        }}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}