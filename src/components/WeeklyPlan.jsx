import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const [loading, setLoading] = useState(true);

  // Get current day
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

  useEffect(() => {
    const fetchPlan = async () => {
      if (user) {
        const plan = await getUserPlan(user.id);
        const sortedDays = (plan.training_days || []).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
        setTrainingDays(sortedDays);
        setLoading(false);
      }
    };
    fetchPlan();
  }, [user]);

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
      className="space-y-6"
    >
      {/* Day Selector - Horizontal Pills */}
      <div className="card-dark p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan" />
            Días de Entrenamiento
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {dayOrder.map((day, index) => {
            const isTrainingDay = trainingDays.includes(day);
            const isToday = day === today;

            return (
              <motion.button
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => isTrainingDay && navigate(`/workout/${day}`)}
                disabled={!isTrainingDay}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center
                  w-14 h-16 rounded-2xl transition-all duration-200
                  ${isToday && isTrainingDay
                    ? 'bg-lime text-dark-bg font-bold shadow-lime-glow'
                    : isTrainingDay
                      ? 'bg-dark-card-lighter text-white hover:bg-dark-border cursor-pointer'
                      : 'bg-dark-card text-secondary opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-xs font-medium">{dayLabels[day] || day.slice(0, 3)}</span>
                <span className={`text-lg font-bold ${isToday && isTrainingDay ? 'text-dark-bg' : ''}`}>
                  {new Date(Date.now() + (dayOrder.indexOf(day) - dayOrder.indexOf(today)) * 86400000).getDate()}
                </span>
                {isToday && isTrainingDay && (
                  <div className="w-1.5 h-1.5 rounded-full bg-dark-bg mt-0.5" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Training Days Cards */}
      {trainingDays.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainingDays.map((day, index) => {
            const isToday = day === today;

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => navigate(`/workout/${day}`)}
                className="group cursor-pointer"
              >
                <div className={`
                  card-dark p-5 transition-all duration-300 transform hover:scale-[1.02]
                  ${isToday ? 'border-lime/30 bg-lime/5' : ''}
                `}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`
                      p-3 rounded-xl
                      ${isToday ? 'bg-lime text-dark-bg' : 'bg-dark-card-lighter'}
                    `}>
                      <Dumbbell className={`w-6 h-6 ${isToday ? 'text-dark-bg' : 'text-cyan'}`} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1 capitalize">{day}</h3>
                  <p className="text-secondary text-sm">
                    {isToday ? '¡Hoy toca!' : 'Toca para comenzar'}
                  </p>
                  {isToday && (
                    <div className="mt-3 inline-block bg-lime/20 text-lime text-xs font-semibold px-3 py-1 rounded-full">
                      Día actual
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card-dark p-8 text-center">
          <p className="text-lg text-secondary mb-4">No has configurado tu plan de entrenamiento.</p>
          <button
            onClick={() => navigate('/settings')}
            className="btn-lime px-6 py-3"
          >
            Configurar ahora
          </button>
        </div>
      )}
    </motion.div>
  );
}