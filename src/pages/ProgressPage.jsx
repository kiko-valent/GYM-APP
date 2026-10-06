import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getPersonalData } from '@/utils/personalData';
import WeightTrend from '@/components/WeightTrend';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getWorkoutHistory, deleteWorkoutSession } from '@/utils/workoutData';
import { useToast } from '@/components/ui/use-toast';
import ProgressStats from '@/components/ProgressStats';
const WorkoutHistoryList = lazy(() => import('@/components/WorkoutHistoryList'));
const ExerciseProgress = lazy(() => import('@/components/ExerciseProgress'));
const WeeklyVolume = lazy(() => import('@/components/WeeklyVolume'));
const FatigueInsights = lazy(() => import('@/components/FatigueInsights'));
const MonthlyReport = lazy(() => import('@/components/MonthlyReport'));

const TABS = [{ id: 'resumen', label: 'Resumen' }, { id: 'ejercicios', label: 'Fuerza' }, { id: 'historial', label: 'Historial' }];

export default function ProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWorkoutHistory(user.id), getPersonalData(user.id)]).then(([sessions, body]) => {
      if (!cancelled) { setHistory(sessions); setWeights(body.weights); setLoadError(body.offline); }
    }).catch(() => { if (!cancelled) setLoadError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.id]);

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
    <div className="page-shell max-w-5xl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="eyebrow">DATOS PARA DECIDIR</p><h1 className="text-3xl font-bold text-white mt-2">Tu progreso</h1><p className="text-secondary text-sm mt-2">La tendencia del peso y tu rendimiento, juntos.</p>
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
            {loadError && <p role="status" className="text-orange-300 text-sm">Algunos datos pueden ser de la última copia de este dispositivo.</p>}

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

            <Suspense fallback={<div className="card-dark p-8 text-secondary">Cargando detalles…</div>}>
            {activeTab === 'resumen' && <div className="space-y-5"><WeightTrend entries={weights}/><WeeklyVolume history={history} userId={user.id}/><details className="card-dark p-5" onToggle={event => setRecoveryOpen(event.currentTarget.open)}><summary className="font-semibold cursor-pointer py-1">Cómo estás recuperando</summary><div className="mt-5">{recoveryOpen && <FatigueInsights history={history}/>}</div></details></div>}
            {activeTab === 'ejercicios' && <ExerciseProgress history={history} />}
            {activeTab === 'historial' && (
              <div className="space-y-4">
                <MonthlyReport history={history} userId={user?.id} />
                <WorkoutHistoryList history={history} onDelete={handleDeleteSession} />
              </div>
            )}
          </Suspense></div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
