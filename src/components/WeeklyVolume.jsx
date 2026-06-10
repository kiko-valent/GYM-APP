import React, { useState, useEffect, useMemo } from 'react';
import { CalendarCheck, AlertCircle } from 'lucide-react';
import { getUserPlan } from '@/utils/workoutData';
import { buildMuscleGroupMap, muscleGroupLabel, MUSCLE_GROUPS } from '@/utils/progression';

const DAY_MS = 1000 * 60 * 60 * 24;

// Lunes a las 00:00 de la semana de `d`
function startOfWeek(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
}

export default function WeeklyVolume({ history, userId }) {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPlan = async () => {
      if (!userId) return;
      const userPlan = await getUserPlan(userId);
      if (isMounted) setPlan(userPlan);
    };
    fetchPlan();
    return () => { isMounted = false; };
  }, [userId]);

  const data = useMemo(() => {
    if (!plan) return null;
    const groupMap = buildMuscleGroupMap(plan);
    const weekStart = startOfWeek(new Date());
    const fourWeeksAgo = new Date(weekStart - 28 * DAY_MS);

    const thisWeekSets = {};   // grupo -> series esta semana
    const prevWeeksSets = {};  // grupo -> series en las 4 semanas anteriores
    const lastTrained = {};    // grupo -> fecha más reciente
    let sessionsThisWeek = 0;

    history.forEach(session => {
      const date = new Date(session.date);
      const inThisWeek = date >= weekStart;
      const inPrevWeeks = date >= fourWeeksAgo && date < weekStart;
      if (inThisWeek) sessionsThisWeek++;

      (session.workout_exercises || []).forEach(s => {
        const group = groupMap[s.exercise_name] || 'sin-asignar';
        if (inThisWeek) thisWeekSets[group] = (thisWeekSets[group] || 0) + 1;
        if (inPrevWeeks) prevWeeksSets[group] = (prevWeeksSets[group] || 0) + 1;
        if (!lastTrained[group] || date > new Date(lastTrained[group])) {
          lastTrained[group] = session.date;
        }
      });
    });

    // Grupos a mostrar: los que aparecen en el plan o tienen actividad
    const groups = new Set([
      ...Object.values(groupMap),
      ...Object.keys(thisWeekSets),
      ...Object.keys(prevWeeksSets),
    ]);

    const ordered = MUSCLE_GROUPS.map(g => g.value).filter(v => groups.has(v));
    if (groups.has('sin-asignar')) ordered.push('sin-asignar');

    const rows = ordered.map(group => {
      const current = thisWeekSets[group] || 0;
      const average = Math.round(((prevWeeksSets[group] || 0) / 4) * 10) / 10;
      const last = lastTrained[group];
      const daysSince = last ? Math.floor((new Date() - new Date(last)) / DAY_MS) : null;
      return { group, current, average, daysSince };
    });

    const maxSets = Math.max(1, ...rows.map(r => Math.max(r.current, r.average)));
    const scheduledPerWeek = plan.training_days?.length || 0;

    return { rows, maxSets, sessionsThisWeek, scheduledPerWeek };
  }, [plan, history]);

  if (!data) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data.rows.length === 0) {
    return (
      <div className="card-dark p-8 text-center">
        <p className="text-secondary mb-2">Aún no hay datos de volumen semanal.</p>
        <p className="text-secondary text-sm">
          Asigna un grupo muscular a cada ejercicio en <span className="text-cyan">Rutina</span> para ver tus series semanales por grupo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Adherencia semanal */}
      <div className="card-dark p-4 flex items-center gap-4">
        <div className="bg-lime/20 p-3 rounded-xl">
          <CalendarCheck className="w-5 h-5 text-lime" />
        </div>
        <div>
          <p className="label-uppercase text-xs mb-0.5">ESTA SEMANA</p>
          <p className="text-white font-bold text-lg">
            {data.sessionsThisWeek} <span className="text-secondary font-normal text-sm">de {data.scheduledPerWeek} sesiones programadas</span>
          </p>
        </div>
      </div>

      {/* Series por grupo muscular */}
      <div className="card-dark p-4">
        <p className="label-uppercase mb-4">SERIES POR GRUPO · ESTA SEMANA VS TU MEDIA</p>
        <div className="space-y-4">
          {data.rows.map(row => (
            <div key={row.group}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white text-sm font-semibold">
                  {row.group === 'sin-asignar' ? 'Sin asignar' : muscleGroupLabel(row.group)}
                </span>
                <span className="text-sm">
                  <span className="text-white font-bold">{row.current}</span>
                  <span className="text-secondary"> / media {row.average}</span>
                  {row.daysSince != null && row.daysSince > 7 && (
                    <span className="text-orange-400 text-xs ml-2">· hace {row.daysSince} días</span>
                  )}
                </span>
              </div>
              <div className="relative h-2.5 bg-dark-card-lighter rounded-full overflow-hidden">
                {/* Media (marca de referencia) */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                  style={{ left: `${Math.min(100, (row.average / data.maxSets) * 100)}%` }}
                />
                <div
                  className={`h-full rounded-full transition-all ${row.current >= row.average ? 'bg-lime' : 'bg-cyan'}`}
                  style={{ width: `${Math.min(100, (row.current / data.maxSets) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-secondary text-xs mt-4 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          La línea blanca marca tu media de las últimas 4 semanas.
        </p>
      </div>
    </div>
  );
}
