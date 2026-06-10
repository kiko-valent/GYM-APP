import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BatteryLow, BatteryMedium, BatteryFull, Activity } from 'lucide-react';

const DAY_MS = 1000 * 60 * 60 * 24;
const WEEKS_WINDOW = 8;

// Lunes a las 00:00 de la semana de `d`
function startOfWeek(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
}

function buildWeeklyData(history) {
  const thisWeek = startOfWeek(new Date());
  const buckets = [];

  for (let i = WEEKS_WINDOW - 1; i >= 0; i--) {
    const start = new Date(thisWeek - i * 7 * DAY_MS);
    const end = new Date(start.getTime() + 7 * DAY_MS);

    let rirSum = 0, rirCount = 0, feelingSum = 0, feelingCount = 0, sets = 0;

    history.forEach(session => {
      const date = new Date(session.date);
      if (date < start || date >= end) return;
      if (session.evaluation?.feeling) {
        feelingSum += session.evaluation.feeling;
        feelingCount++;
      }
      (session.workout_exercises || []).forEach(s => {
        sets++;
        if (s.rir != null) {
          rirSum += s.rir;
          rirCount++;
        }
      });
    });

    buckets.push({
      label: start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      rir: rirCount > 0 ? Math.round((rirSum / rirCount) * 10) / 10 : null,
      feeling: feelingCount > 0 ? Math.round((feelingSum / feelingCount) * 10) / 10 : null,
      sets,
    });
  }

  return buckets;
}

function buildInsight(weeks) {
  const withRir = weeks.filter(w => w.rir != null);
  if (withRir.length < 2) {
    return {
      level: 'empty',
      title: 'Aún no hay suficientes datos',
      detail: 'Registra el RIR de tus series durante un par de semanas y aquí verás si tu intensidad es sostenible o toca descargar.',
    };
  }

  const recent = withRir.slice(-2);
  const avgRir = recent.reduce((s, w) => s + w.rir, 0) / recent.length;
  const recentFeeling = recent.filter(w => w.feeling != null);
  const avgFeeling = recentFeeling.length > 0
    ? recentFeeling.reduce((s, w) => s + w.feeling, 0) / recentFeeling.length
    : null;

  if (avgRir <= 1 && avgFeeling != null && avgFeeling <= 2.5) {
    return {
      level: 'high',
      title: 'Señal de descarga',
      detail: `Llevas 2 semanas a RIR ${avgRir.toFixed(1)} de media y la sensación post-entreno está baja (${avgFeeling.toFixed(1)}/5). Una semana al 60-70% del peso suele desbloquear el progreso.`,
    };
  }
  if (avgRir <= 1) {
    return {
      level: 'medium',
      title: 'Muy cerca del fallo de forma sostenida',
      detail: `RIR ${avgRir.toFixed(1)} de media las últimas 2 semanas. Productivo a corto plazo, pero vigila la sensación: si empieza a caer, descarga.`,
    };
  }
  if (avgRir >= 2.5) {
    return {
      level: 'low',
      title: 'Te queda margen',
      detail: `RIR ${avgRir.toFixed(1)} de media: estás lejos del fallo. Si las series salen limpias, es momento de apretar una rep más o subir peso.`,
    };
  }
  return {
    level: 'ok',
    title: 'Intensidad en zona productiva',
    detail: `RIR ${avgRir.toFixed(1)} de media (el rango 1-2 es el punto dulce para hipertrofia). Sigue así y deja que la doble progresión haga su trabajo.`,
  };
}

const INSIGHT_STYLES = {
  high: { box: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', Icon: BatteryLow },
  medium: { box: 'bg-yellow-400/10 border-yellow-400/30', text: 'text-yellow-400', Icon: BatteryMedium },
  low: { box: 'bg-cyan/10 border-cyan/30', text: 'text-cyan', Icon: BatteryFull },
  ok: { box: 'bg-lime/10 border-lime/30', text: 'text-lime', Icon: Activity },
  empty: { box: 'bg-dark-card-lighter border-dark-border', text: 'text-secondary', Icon: Activity },
};

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl p-3 shadow-lg">
        <p className="text-white font-bold mb-1">Semana del {label}</p>
        {payload.map(p => (
          <p key={p.dataKey} className="text-sm" style={{ color: p.stroke }}>
            {p.dataKey === 'rir' ? 'RIR medio' : 'Sensación'}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FatigueInsights({ history }) {
  const weeks = useMemo(() => buildWeeklyData(history), [history]);
  const insight = useMemo(() => buildInsight(weeks), [weeks]);
  const { box, text, Icon } = INSIGHT_STYLES[insight.level];

  const hasChartData = weeks.some(w => w.rir != null || w.feeling != null);

  return (
    <div className="space-y-4">
      {/* Insight */}
      <div className={`flex items-start gap-3 rounded-2xl p-4 border ${box}`}>
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${text}`} />
        <div>
          <p className={`font-bold ${text}`}>{insight.title}</p>
          <p className="text-secondary text-sm mt-0.5">{insight.detail}</p>
        </div>
      </div>

      {/* RIR vs sensación, por semana */}
      <div className="card-dark p-4">
        <p className="label-uppercase mb-4">RIR MEDIO VS SENSACIÓN · ÚLTIMAS {WEEKS_WINDOW} SEMANAS</p>
        {hasChartData ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeks} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8E99A4', fontSize: 11 }} dy={8} />
              <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#8E99A4', fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#8E99A4', fontSize: 12 }}>
                    {value === 'rir' ? 'RIR medio (0-3+)' : 'Sensación (1-5)'}
                  </span>
                )}
              />
              <Line type="monotone" dataKey="rir" stroke="#00C2FF" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="feeling" stroke="#D2FF00" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-secondary text-sm text-center py-8">
            Sin datos todavía. El RIR se registra en cada serie y la sensación al terminar cada entreno.
          </p>
        )}
        <p className="text-secondary text-xs mt-2">
          Si el RIR baja hacia 0 y la sensación cae a la vez durante 2+ semanas, es la señal clásica de fatiga acumulada.
        </p>
      </div>
    </div>
  );
}
