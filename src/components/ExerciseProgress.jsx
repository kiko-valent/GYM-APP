import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, Trophy, Dumbbell } from 'lucide-react';
import { epley1RM } from '@/utils/progression';

const DAY_MS = 1000 * 60 * 60 * 24;

// Agrupa el historial plano de sesiones en series temporales por ejercicio
function buildExerciseData(history) {
  const byExercise = new Map();

  history.forEach(session => {
    const grouped = {};
    (session.workout_exercises || []).forEach(s => {
      if (!s.exercise_name) return;
      if (!grouped[s.exercise_name]) grouped[s.exercise_name] = [];
      grouped[s.exercise_name].push(s);
    });

    Object.entries(grouped).forEach(([name, sets]) => {
      const topWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0));
      const bestSet = sets.reduce(
        (best, s) => (epley1RM(s.weight, s.reps) > epley1RM(best.weight, best.reps) ? s : best),
        sets[0]
      );
      if (!byExercise.has(name)) byExercise.set(name, []);
      byExercise.get(name).push({
        date: session.date,
        topWeight,
        best1RM: epley1RM(bestSet.weight, bestSet.reps),
        bestSet,
        setCount: sets.length,
      });
    });
  });

  const result = [];
  byExercise.forEach((sessions, name) => {
    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sessions[sessions.length - 1];

    // Delta de e1RM vs la sesión de hace ~30 días (o la primera disponible)
    const cutoff = new Date(latest.date) - 30 * DAY_MS;
    const baseline = sessions.find(s => new Date(s.date) >= cutoff) || sessions[0];
    const delta1RM = Math.round((latest.best1RM - baseline.best1RM) * 10) / 10;

    const prWeight = sessions.reduce((best, s) => (s.topWeight > best.topWeight ? s : best), sessions[0]);
    const pr1RM = sessions.reduce((best, s) => (s.best1RM > best.best1RM ? s : best), sessions[0]);

    result.push({ name, sessions, latest, delta1RM, prWeight, pr1RM });
  });

  // Más recientes primero
  result.sort((a, b) => new Date(b.latest.date) - new Date(a.latest.date));
  return result;
}

const formatDate = (d) =>
  new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

const ChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl p-3 shadow-lg">
        <p className="text-white font-bold">{p.label}</p>
        <p className="text-cyan text-sm">e1RM: {p.e1rm} kg</p>
        <p className="text-secondary text-xs">{p.detail}</p>
      </div>
    );
  }
  return null;
};

export default function ExerciseProgress({ history }) {
  const [expanded, setExpanded] = useState(null);
  const exercises = useMemo(() => buildExerciseData(history), [history]);

  if (exercises.length === 0) {
    return (
      <div className="card-dark p-8 text-center">
        <Dumbbell className="w-8 h-8 text-secondary mx-auto mb-3" />
        <p className="text-secondary">Completa algunos entrenamientos para ver tu progreso por ejercicio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exercises.map((ex) => {
        const isOpen = expanded === ex.name;
        const chartData = ex.sessions.slice(-15).map(s => ({
          label: formatDate(s.date),
          e1rm: s.best1RM,
          detail: `${s.bestSet.weight}kg × ${s.bestSet.reps}`,
        }));

        return (
          <motion.div key={ex.name} layout className="card-dark overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : ex.name)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-dark-card-lighter/50 transition-colors"
            >
              <div>
                <p className="text-white font-semibold">{ex.name}</p>
                <p className="text-secondary text-sm">
                  {ex.latest.topWeight} kg · última vez {formatDate(ex.latest.date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {ex.delta1RM !== 0 && (
                  <span className={`text-sm font-bold ${ex.delta1RM > 0 ? 'text-lime' : 'text-red-400'}`}>
                    {ex.delta1RM > 0 ? '+' : ''}{ex.delta1RM} kg <span className="text-secondary font-normal text-xs">e1RM/mes</span>
                  </span>
                )}
                <ChevronDown className={`w-5 h-5 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-4">
                {/* e1RM chart */}
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${ex.name.replace(/\W/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D2FF00" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#D2FF00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8E99A4', fontSize: 11 }} dy={8} />
                      <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="e1rm"
                        stroke="#D2FF00"
                        strokeWidth={2}
                        fill={`url(#grad-${ex.name.replace(/\W/g, '')})`}
                        dot={{ r: 3, fill: '#D2FF00', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#D2FF00', stroke: '#0B1116', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-secondary text-sm text-center py-4">
                    Necesitas al menos 2 sesiones para ver la evolución.
                  </p>
                )}

                {/* PRs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-card-lighter rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-lime" />
                      <p className="label-uppercase text-xs">MEJOR PESO</p>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {ex.prWeight.topWeight} kg
                    </p>
                    <p className="text-secondary text-xs">{formatDate(ex.prWeight.date)}</p>
                  </div>
                  <div className="bg-dark-card-lighter rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-cyan" />
                      <p className="label-uppercase text-xs">MEJOR e1RM</p>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {ex.pr1RM.best1RM} kg
                    </p>
                    <p className="text-secondary text-xs">
                      {ex.pr1RM.bestSet.weight}kg × {ex.pr1RM.bestSet.reps} · {formatDate(ex.pr1RM.date)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
