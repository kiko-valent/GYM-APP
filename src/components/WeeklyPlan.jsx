import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Dumbbell, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getUserPlan } from '@/utils/workoutData';

const dayOrder = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const dayLabels = {
  lunes: "Lun",
  martes: "Mar",
  miércoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sábado: "Sáb",
  domingo: "Dom"
};

export default function WeeklyPlan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainingDays, setTrainingDays] = useState([]);
  const [workouts, setWorkouts] = useState({});
  const [loading, setLoading] = useState(true);

  // Get current day
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      if (user) {
        const plan = await getUserPlan(user.id);
        const sortedDays = (plan.training_days || []).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
        setTrainingDays(sortedDays);
        setWorkouts(plan.workouts || {});

        // Expand today if it's a training day
        if (sortedDays.includes(today)) {
          setExpandedDay(today);
        } else {
          // Or expand the first day? Or none?
          // "excepto el día actual, que debe aparecer abierto." if it exists.
        }

        setLoading(false);
      }
    };
    fetchPlan();
  }, [user, today]);

  const toggleDay = (day) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  if (loading) {
    return (
      <div className="card-dark p-6 text-center">
        <p className="text-secondary">Cargando plan semanal...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between px-2 mb-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan" />
          Agenda Semanal
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {trainingDays.map((day, index) => {
          const isToday = day === today;
          const isExpanded = expandedDay === day;
          const dayWorkouts = workouts[day]?.exercises || [];

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card-dark overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-lime/50 bg-dark-card-lighter' : 'hover:bg-dark-card-lighter'}`}
            >
              {/* Header */}
              <button
                onClick={() => toggleDay(day)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                      ${isToday ? 'bg-lime text-dark-bg' : 'bg-dark-card border border-white/10 text-white'}
                    `}>
                    {dayLabels[day]}
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-semibold capitalize text-lg leading-tight">
                      {day}
                    </h3>
                    <p className="text-secondary text-xs">
                      {dayWorkouts.length} Ejercicios
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-90 text-lime' : ''}`}
                />
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-black/20"
                  >
                    <div className="p-4 pt-0 border-t border-white/5">
                      <div className="py-3 space-y-2">
                        {dayWorkouts.slice(0, 3).map((ex, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-secondary">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan/50" />
                            <span className="truncate">{ex.name}</span>
                            <span className="text-white/40 text-xs whitespace-nowrap ml-auto">{ex.sets}x{ex.reps}</span>
                          </div>
                        ))}
                        {dayWorkouts.length > 3 && (
                          <p className="text-xs text-center text-white/30 pt-1">+ {dayWorkouts.length - 3} ejercicios más</p>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/workout/${day}`)}
                        className="w-full mt-2 bg-gradient-to-r from-lime to-emerald-400 text-dark-bg font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-lime/20"
                      >
                        <Dumbbell className="w-4 h-4" />
                        {isToday ? '¡Entrenar Ahora!' : 'Ver Entrenamiento'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {trainingDays.length === 0 && (
          <div className="card-dark p-8 text-center border-dashed border-2 border-white/10">
            <p className="text-secondary mb-4">No hay días configurados</p>
            <button onClick={() => navigate('/settings')} className="text-lime text-sm font-semibold hover:underline">Configurar Rutina</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}