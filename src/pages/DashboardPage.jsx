import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, User, Utensils, Play, TrendingUp, Scale, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import WeeklyPlan from '@/components/WeeklyPlan';
import { getUserPlan } from '@/utils/workoutData';
import { supabase } from '@/lib/customSupabaseClient';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [todayRoutine, setTodayRoutine] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Get today's day name in Spanish (lowercase)
  const todayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

  // Fetch user plan on mount to check if today is a training day
  useEffect(() => {
    const checkTodayRoutine = async () => {
      if (user) {
        const plan = await getUserPlan(user.id);
        if (plan.training_days?.includes(todayName)) {
          setTodayRoutine(todayName);
        } else {
          setTodayRoutine(null);
        }
        setIsLoadingPlan(false);
      }
    };
    checkTodayRoutine();
  }, [user, todayName]);

  // Check if weight was recorded today
  useEffect(() => {
    const checkTodayWeight = async () => {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('weight_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (!error && !data) {
        // No weight recorded today - show modal
        setShowWeightModal(true);
      }
    };
    checkTodayWeight();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Quick Start FAB handler
  const handleQuickStart = () => {
    if (todayRoutine) {
      navigate(`/workout/${todayRoutine}`);
    } else {
      toast({
        title: "Día de descanso 🧘",
        description: "No hay rutina programada hoy. ¿Quieres entrenar de todos modos?",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
            className="bg-lime text-dark-bg hover:bg-lime/90"
          >
            Ver Rutinas
          </Button>
        ),
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-dark-bg">
      <div className="max-w-6xl mx-auto">
        {/* Morning Weight Modal */}
        <AnimatePresence>
          {showWeightModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowWeightModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="card-dark p-6 max-w-sm w-full relative"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="absolute top-4 right-4 text-secondary hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <div className="bg-lime/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scale className="w-8 h-8 text-lime" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">¡Buenos días! ☀️</h3>
                  <p className="text-secondary mb-6">
                    Recuerda pesarte en ayunas para un seguimiento preciso de tu progreso.
                  </p>
                  <Button
                    onClick={() => {
                      setShowWeightModal(false);
                      navigate('/profile');
                    }}
                    className="w-full btn-lime py-4"
                  >
                    <Scale className="w-5 h-5 mr-2" />
                    Ir a anotar peso
                  </Button>
                  <button
                    onClick={() => setShowWeightModal(false)}
                    className="mt-3 text-secondary text-sm hover:text-white"
                  >
                    Más tarde
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime to-cyan flex items-center justify-center">
                <span className="text-xl font-bold text-dark-bg">
                  {user?.user_metadata?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-lime rounded-full border-2 border-dark-bg" />
            </div>
            <div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  ¡Hola {user?.user_metadata?.full_name?.split(' ')[0] || 'Atleta'}!
                </h1>
                <p className="text-secondary text-sm">¿Listo para darlo todo?</p>
              </div>
            </div>
          </div>


        </motion.div>



        {/* Nutrition Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <div
            onClick={() => navigate('/nutrition')}
            className="card-dark p-6 cursor-pointer hover:bg-dark-card-lighter transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-lime/10" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-lime/20 p-3 rounded-xl">
                  <Utensils className="w-6 h-6 text-lime" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Mi Alimentación</h3>
                  <p className="text-secondary text-sm">Gestiona tu dieta y recetas</p>
                </div>
              </div>
              <Button variant="ghost" className="text-lime group-hover:bg-lime/10">
                Ver Menú de Hoy
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Weekly Plan */}
        <WeeklyPlan />

        {/* Bottom Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border p-2 md:hidden"
        >
          <div className="flex items-center justify-around max-w-md mx-auto">
            <button className="flex flex-col items-center gap-1 p-2 text-cyan">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <span className="text-xs">Inicio</span>
            </button>
            <button onClick={() => navigate('/progress')} className="flex flex-col items-center gap-1 p-2 text-secondary hover:text-white">
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs">Progreso</span>
            </button>

            {/* FAB Button - Quick Start */}
            <div className="-mt-8">
              <button
                onClick={handleQuickStart}
                disabled={isLoadingPlan}
                className="w-14 h-14 bg-lime rounded-full flex items-center justify-center shadow-lime-glow hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                title={todayRoutine ? `Entrenar ${todayRoutine}` : "Día de descanso"}
              >
                <Play className="w-7 h-7 text-dark-bg ml-0.5" fill="currentColor" />
              </button>
            </div>

            <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 p-2 text-secondary hover:text-white">
              <User className="w-6 h-6" />
              <span className="text-xs">Perfil</span>
            </button>
            <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 p-2 text-secondary hover:text-white">
              <Settings className="w-6 h-6" />
              <span className="text-xs">Ajustes</span>
            </button>
          </div>
        </motion.div>

        {/* Desktop Logout */}
        <div className="hidden md:block fixed bottom-8 right-8">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-dark-card border-dark-border text-white hover:bg-dark-card-lighter"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </div>
  );
}