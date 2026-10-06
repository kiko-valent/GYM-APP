import React from 'react';
import { weightTrend } from '@/utils/workoutModel';

export default function WeightTrend({ entries = [], compact = false }) {
  const trend = weightTrend(entries);
  const points = trend.points.slice(-28);
  const values = points.map(p => p.weight), min = Math.min(...values), max = Math.max(...values);
  const line = points.map((p, idx) => `${10 + idx / Math.max(1, points.length - 1) * 300},${70 - (p.weight - min) / Math.max(0.5, max - min) * 50}`).join(' ');
  const delta = trend.change;
  return <section className="card-dark p-5 sm:p-6" aria-labelledby="weight-trend-title">
    <div className="flex items-center justify-between gap-3"><h2 id="weight-trend-title" className="eyebrow">TENDENCIA DEL PESO</h2><span className="text-xs text-secondary">Media de 7 días</span></div>
    <div className="flex items-baseline gap-3 mt-4"><strong className="text-3xl font-bold tabular-nums">{trend.average == null ? '—' : trend.average.toFixed(1)}<span className="text-base font-normal text-secondary ml-1.5">kg</span></strong>
      {delta != null && <span className="text-sm font-semibold text-cyan tabular-nums">{delta > 0 ? '+' : ''}{delta.toFixed(2)} kg / semana</span>}
    </div>
    {points.length > 1 && <svg viewBox="0 0 320 85" className="w-full h-24 mt-4" role="img" aria-label={`Evolución de tus últimos ${points.length} pesajes; no mide grasa corporal`}><line x1="10" y1="75" x2="310" y2="75" stroke="rgba(255,255,255,.08)"/><polyline points={line} fill="none" stroke="#00C2FF" strokeWidth="2.5" strokeLinejoin="round"/><circle cx={line.split(' ').at(-1).split(',')[0]} cy={line.split(' ').at(-1).split(',')[1]} r="4" fill="#00C2FF"/></svg>}
    <p className="text-secondary text-sm mt-3 leading-relaxed">{delta == null ? `Llevas ${trend.count} pesajes esta semana. Con al menos 3 en cada semana podrás comparar las medias.` : Math.abs(delta) < 0.1 ? 'La media está estable. Unos días no bastan para cambiar el plan: observa la tendencia y tu constancia.' : delta < 0 ? 'La media ha bajado. Compárala con tu rendimiento; el peso también cambia por agua y otros factores.' : 'La media ha subido. Revisa la constancia y observa otra semana antes de sacar conclusiones.'}</p>
    {!compact && points.length > 0 && <details className="mt-4 text-sm"><summary className="text-cyan cursor-pointer py-2">Ver pesajes recientes</summary><div className="mt-2 divide-y divide-white/5">{points.slice(-7).reverse().map(row => <div key={row.date} className="flex justify-between py-2"><span className="text-secondary">{new Date(`${row.date}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span><span className="tabular-nums">{row.weight} kg</span></div>)}</div></details>}
  </section>;
}
