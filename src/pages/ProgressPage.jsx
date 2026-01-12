import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getWorkoutHistory, deleteWorkoutSession } from '@/utils/workoutData';
import { useToast } from '@/components/ui/use-toast';
import ProgressChart from '@/components/ProgressChart';
import ProgressStats from '@/components/ProgressStats';
import WorkoutHistoryList from '@/components/WorkoutHistoryList';

export default function ProgressPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado."
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-dark-bg">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white/60 hover:text-white p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Progress</h1>
          </div>
          <button className="text-white/60 hover:text-white p-2">
            <MoreHorizontal className="w-5 h-5" />
          </button>
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
            <ProgressStats history={history} />

            <ProgressChart history={history} />

            <WorkoutHistoryList history={history} onDelete={handleDeleteSession} />
          </div>
        )}
      </div>
    </div>
  );
}