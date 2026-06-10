import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Play, Utensils, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getUserPlan } from '@/utils/workoutData';

const tabs = [
  { path: '/dashboard', label: 'Inicio', icon: Home },
  { path: '/progress', label: 'Progreso', icon: TrendingUp },
  null, // hueco para el FAB
  { path: '/nutrition', label: 'Alimentación', icon: Utensils },
  { path: '/settings', label: 'Rutina', icon: Dumbbell },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayRoutine, setTodayRoutine] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const todayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

  useEffect(() => {
    let isMounted = true;
    const checkToday = async () => {
      if (!user) return;
      const plan = await getUserPlan(user.id);
      if (isMounted) {
        setTodayRoutine(plan.training_days?.includes(todayName) ? todayName : null);
        setLoadingPlan(false);
      }
    };
    checkToday();
    return () => { isMounted = false; };
  }, [user, todayName]);

  const handleQuickStart = () => {
    if (todayRoutine) {
      navigate(`/workout/${todayRoutine}`);
    } else {
      toast({
        title: 'Día de descanso 🧘',
        description: 'No hay rutina programada hoy. ¿Quieres entrenar de todos modos?',
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
    <div className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border p-2 z-40">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab, i) => {
          if (!tab) {
            return (
              <div key="fab" className="-mt-8">
                <button
                  onClick={handleQuickStart}
                  disabled={loadingPlan}
                  className="w-14 h-14 bg-lime rounded-full flex items-center justify-center shadow-lime-glow hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                  title={todayRoutine ? `Entrenar ${todayRoutine}` : 'Día de descanso'}
                >
                  <Play className="w-7 h-7 text-dark-bg ml-0.5" fill="currentColor" />
                </button>
              </div>
            );
          }
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-cyan' : 'text-secondary hover:text-white'}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
