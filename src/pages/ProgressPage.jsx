import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getWorkoutHistory, deleteWorkoutSession } from '@/utils/workoutData';
import { useToast } from '@/components/ui/use-toast';
import ProgressStats from '@/components/ProgressStats';
import WorkoutHistoryList from '@/components/WorkoutHistoryList';
import ExerciseProgress from '@/components/ExerciseProgress';
import WeeklyVolume from '@/components/WeeklyVolume';
import FatigueInsights from '@/components/FatigueInsights';
import MonthlyReport from '@/components/MonthlyReport';
import BottomNav from '@/components/BottomNav';

const TABS = [
  { id: 'ejercicios', label: 'Ejercicios' },
  { id: 'semana', label: 'Semana' },
  { id: 'fatiga', label: 'Fatiga' },
  { id: 'historial', label: 'Historial' },
];

export default function ProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ejercicios');

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        const userHistory = await getWorkoutHistory(user.id);
        setHistory(userHistory);
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleDeleteSession = async (sessionId) => {
    try {
      const { error } = await deleteWorkoutSession(sessionId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el entrenamiento. Inténtalo de nuevo."
        });
        return;
      }

      setHistory(prev => prev.filter(session => session.id !== sessionId));
      toast({
        title: "Entrenamiento eliminado",
        description: "El registro ha sido eliminado correctamente."
      });

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado."
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-28 bg-dark-bg">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white">Progreso</h1>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-secondary">Cargando historial...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ProgressStats history={history} userId={user?.id} />

            {/* Tabs */}
            <div className="flex bg-dark-card rounded-full p-1 border border-dark-border">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${activeTab === tab.id
                    ? 'bg-lime text-dark-bg'
                    : 'text-secondary hover:text-white'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'ejercicios' && <ExerciseProgress history={history} />}
            {activeTab === 'semana' && <WeeklyVolume history={history} userId={user?.id} />}
            {activeTab === 'fatiga' && <FatigueInsights history={history} />}
            {activeTab === 'historial' && (
              <div className="space-y-4">
                <MonthlyReport history={history} userId={user?.id} />
                <WorkoutHistoryList history={history} onDelete={handleDeleteSession} />
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
