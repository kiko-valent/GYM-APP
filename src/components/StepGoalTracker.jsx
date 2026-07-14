import React, { useEffect, useMemo, useState } from 'react';
import { Check, Footprints, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentWeek() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const daysSinceMonday = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - daysSinceMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      date,
      key: formatLocalDate(date),
      label: DAY_LABELS[index],
      isToday: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
    };
  });
}

export default function StepGoalTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const week = useMemo(() => getCurrentWeek(), []);
  const [completedDates, setCompletedDates] = useState(new Set());
  const [savingDates, setSavingDates] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStepGoals = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('daily_step_goals')
        .select('step_date')
        .eq('user_id', user.id)
        .gte('step_date', week[0].key)
        .lte('step_date', week[6].key);

      if (!isMounted) return;

      if (error) {
        toast({
          variant: 'destructive',
          title: 'No se pudieron cargar los pasos',
          description: 'Comprueba que la migración de pasos esté aplicada en Supabase.',
        });
      } else {
        setCompletedDates(new Set((data || []).map((entry) => entry.step_date)));
      }

      setLoading(false);
    };

    loadStepGoals();
    return () => { isMounted = false; };
  }, [user, toast, week]);

  const toggleDay = async (day) => {
    if (!user || day.isFuture || savingDates.has(day.key)) return;

    const wasCompleted = completedDates.has(day.key);
    setCompletedDates((current) => {
      const next = new Set(current);
      wasCompleted ? next.delete(day.key) : next.add(day.key);
      return next;
    });
    setSavingDates((current) => new Set(current).add(day.key));

    const query = wasCompleted
      ? supabase
          .from('daily_step_goals')
          .delete()
          .eq('user_id', user.id)
          .eq('step_date', day.key)
      : supabase
          .from('daily_step_goals')
          .upsert(
            { user_id: user.id, step_date: day.key },
            { onConflict: 'user_id,step_date' }
          );

    const { error } = await query;

    if (error) {
      setCompletedDates((current) => {
        const next = new Set(current);
        wasCompleted ? next.add(day.key) : next.delete(day.key);
        return next;
      });
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar',
        description: 'El check de 15.000 pasos no se ha actualizado.',
      });
    }

    setSavingDates((current) => {
      const next = new Set(current);
      next.delete(day.key);
      return next;
    });
  };

  const completedCount = completedDates.size;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="card-dark p-5 mb-6"
      aria-labelledby="step-goal-title"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-lime/15 p-3 rounded-xl shrink-0">
            <Footprints className="w-5 h-5 text-lime" />
          </div>
          <div>
            <h2 id="step-goal-title" className="text-white font-bold">15.000 pasos</h2>
            <p className="text-secondary text-xs mt-0.5">Marca los días en los que superaste el objetivo</p>
          </div>
        </div>
        <span className="rounded-full bg-dark-card-lighter px-3 py-1 text-xs font-bold text-lime whitespace-nowrap">
          {completedCount}/7
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {week.map((day) => {
          const completed = completedDates.has(day.key);
          const saving = savingDates.has(day.key);

          return (
            <div key={day.key} className="flex flex-col items-center gap-2">
              <span className={`text-[11px] font-bold ${day.isToday ? 'text-lime' : 'text-secondary'}`}>
                {day.label}
              </span>
              <button
                type="button"
                onClick={() => toggleDay(day)}
                disabled={loading || day.isFuture || saving}
                aria-label={`${completed ? 'Desmarcar' : 'Marcar'} objetivo de 15.000 pasos del ${day.date.toLocaleDateString('es-ES')}`}
                aria-pressed={completed}
                className={`w-full aspect-square max-w-12 rounded-xl flex items-center justify-center border transition-all duration-200
                  ${completed
                    ? 'bg-lime border-lime text-dark-bg shadow-[0_0_18px_rgba(210,255,0,0.2)]'
                    : day.isFuture
                      ? 'bg-dark-card-lighter/30 border-white/5 text-white/15 cursor-not-allowed'
                      : 'bg-dark-card-lighter border-white/10 text-white/35 hover:border-lime/50 hover:text-lime'}
                  ${day.isToday && !completed ? 'ring-1 ring-lime/60' : ''}`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : completed ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <span className="text-xs font-semibold">{day.date.getDate()}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
