import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Play, Check, Scale, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getUserPlan, getWorkoutHistory, loadWorkoutProgress } from '@/utils/workoutData';
import { getPersonalData, saveBodyWeight, saveDailyNutrition } from '@/utils/personalData';
import { localDate } from '@/utils/workoutModel';
import WeightTrend from '@/components/WeightTrend';
import WeeklyPlan from '@/components/WeeklyPlan';
import StepGoalTracker from '@/components/StepGoalTracker';
import BottomNav from '@/components/BottomNav';
import ScreenHeader from '@/components/ScreenHeader';

export default function DashboardPage() {
  const { user } = useAuth(), navigate = useNavigate(), { toast } = useToast();
  const [plan, setPlan] = useState(null), [body, setBody] = useState(null), [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [weightInput, setWeightInput] = useState(''), [editingWeight, setEditingWeight] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false), [savingFood, setSavingFood] = useState(false);
  const [food, setFood] = useState({ calories_kcal: '', protein_g: '' });
  const [reload, setReload] = useState(0);
  const lock = useRef(false);
  const today = localDate(), day = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    Promise.all([getUserPlan(user.id), getPersonalData(user.id), getWorkoutHistory(user.id)]).then(([routine, personal, sessions]) => {
      if (cancelled) return;
      setPlan(routine); setBody(personal); setHistory(sessions);
      setFood({ calories_kcal: personal.nutrition.calories_kcal ?? '', protein_g: personal.nutrition.protein_g ?? '' });
    }).catch(() => { if (!cancelled) setError('No se pudieron cargar todos tus datos. Comprueba la conexión.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.id, reload]);

  const todayWeight = body?.weights.find(entry => entry.date === today)?.weight;
  const workout = plan?.training_days.includes(day) ? plan.workouts[day] : null;
  const draft = workout ? loadWorkoutProgress(user.id, day) : null;
  const trainedToday = history.some(session => localDate(new Date(session.date)) === today);
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
  const sessionsThisWeek = new Set(history.filter(session => new Date(session.date) >= weekStart).map(session => localDate(new Date(session.date)))).size;
  const saveWeight = async event => {
    event.preventDefault(); if (lock.current) return; lock.current = true; setSavingWeight(true);
    try {
      const result = await saveBodyWeight(user.id, weightInput);
      if (result.error) throw result.error;
      setBody(previous => ({ ...previous, weights: [{ date: today, weight: result.weight }, ...previous.weights.filter(row => row.date !== today)] }));
      setWeightInput(''); setEditingWeight(false);
      toast({ title: 'Peso guardado', description: result.profileError ? 'El pesaje está registrado. Queda pendiente actualizar el peso del perfil.' : 'Mira la media semanal, no un día aislado.' });
    } catch (caught) { toast({ variant: 'destructive', title: 'No se pudo guardar el peso', description: caught.message }); }
    finally { lock.current = false; setSavingWeight(false); }
  };
  const saveFood = async event => {
    event.preventDefault(); if (lock.current) return; lock.current = true; setSavingFood(true);
    try { const result = await saveDailyNutrition(user.id, food); if (result.error) throw result.error; toast({ title: 'Registro de hoy guardado' }); }
    catch (caught) { toast({ variant: 'destructive', title: 'No se pudo guardar', description: caught.message }); }
    finally { lock.current = false; setSavingFood(false); }
  };
  return <main className="page-shell max-w-5xl">
    <ScreenHeader title="Vamos a por hoy, Kiko." eyebrow={new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} description={plan?.preferences.phase === 'maintenance' ? 'Mantén tus hábitos y sigue entrenando con criterio.' : 'Tu rutina, tu progreso y un paso más cada día.'}/>
    {!loading && plan && <div className="metric-strip" aria-label="Tu semana de un vistazo"><div className="metric-tile metric-lime"><strong>{sessionsThisWeek}</strong><span>Sesiones esta semana</span></div><div className="metric-tile tone-lavender"><strong>{plan.training_days.length}</strong><span>Días de tu rutina</span></div><div className="metric-tile tone-mint"><strong>{todayWeight ? String(todayWeight).replace('.', ',') : '—'}</strong><span>Peso de hoy · kg</span></div><div className="metric-tile tone-coral"><strong className="!text-base">{plan.preferences.phase === 'maintenance' ? 'Mantener' : 'Déficit'}</strong><span>Tu fase actual</span></div></div>}
    {error && <div role="alert" className="card-dark border-orange-400/30 p-4 mb-5 flex items-center gap-3"><p className="flex-1 text-sm">{error}</p><button onClick={() => setReload(x => x + 1)} aria-label="Reintentar carga"><RefreshCw size={19}/></button></div>}
    {loading && !plan ? <div className="card-dark p-10 flex justify-center text-secondary"><Loader2 className="animate-spin mr-3"/> Cargando tu día…</div> : <div className="grid lg:grid-cols-[1.25fr_1fr] gap-5 items-start">
      <div className="space-y-5">
        <section className="today-hero p-6 sm:p-8 relative overflow-hidden"><div className="hero-label"><p className="eyebrow">{trainedToday ? 'HOY YA HAS SUMADO' : workout ? 'TU SIGUIENTE PASO' : 'DÍA DE RECUPERACIÓN'}</p><ArrowUpRight size={23} aria-hidden="true"/></div><h2 className="text-3xl font-bold mt-4 mb-2">{trainedToday ? 'Entrenamiento registrado' : workout?.name || (workout ? `Entrenamiento de ${day}` : 'Recarga para la próxima sesión')}</h2><p className="text-secondary text-sm leading-relaxed mb-6">{trainedToday ? 'La constancia también incluye recuperar. Puedes revisar tus series en Progreso.' : workout ? `${workout.exercises.length} ejercicios · ${workout.exercises.reduce((sum, ex) => sum + Number(ex.sets), 0)} series. Tu última sesión te acompaña en cada ejercicio.` : 'Sigue tu plan de alimentación y tu actividad habitual. El descanso forma parte del entrenamiento.'}</p><button onClick={() => navigate(trainedToday ? '/progress' : workout ? `/workout/${day}` : '/settings')} className="btn-lime w-full sm:w-auto px-6 py-4 flex items-center justify-center gap-3">{trainedToday ? <Check size={19}/> : <Play size={19}/>} {trainedToday ? 'Ver mi sesión' : workout ? draft?.exercisesState && Object.values(draft.exercisesState).some(row => row.sets?.length) ? 'Continuar entrenamiento' : 'Empezar entrenamiento' : 'Ver mi rutina'}</button><div className="hero-constancy flex items-center justify-between mt-5 pt-4 border-t"><span className="text-secondary text-sm">Constancia esta semana</span><strong className="tabular-nums">{sessionsThisWeek}<span className="text-secondary font-normal"> / {plan?.training_days.length || 0} días</span></strong></div></section>
        <section className="card-dark p-5 sm:p-6"><div className="flex gap-3 items-center mb-4"><Scale size={20} className="text-cyan"/><h2 className="font-semibold">Tu peso de hoy</h2></div>{todayWeight && !editingWeight ? <div className="flex justify-between items-center"><p className="text-2xl font-bold tabular-nums">{todayWeight} <span className="text-base text-secondary">kg</span></p><button onClick={() => { setEditingWeight(true); setWeightInput(String(todayWeight)); }} className="text-cyan text-sm py-3">Corregir</button></div> : <form onSubmit={saveWeight} className="flex items-center gap-3"><label className="sr-only" htmlFor="today-weight">Peso de hoy en kg</label><input id="today-weight" type="text" inputMode="decimal" placeholder="Ej. 78,4" value={weightInput} onChange={event => setWeightInput(event.target.value)} className="field flex-1 min-w-0 text-xl tabular-nums" autoComplete="off"/><button type="submit" disabled={savingWeight || !weightInput || !body} className="btn-cyan px-5 py-3 disabled:opacity-40">{savingWeight ? 'Guardando…' : 'Guardar'}</button></form>}<p className="text-secondary text-xs mt-3">Procura pesarte en condiciones parecidas. Cada pesaje ayuda a ver la tendencia.</p></section>
        <StepGoalTracker goal={plan?.preferences.stepGoal || 15000}/>
      </div>
      <div className="space-y-5"><WeightTrend entries={body?.weights || []} compact/>
        <section className="card-dark p-5 sm:p-6"><div className="flex justify-between gap-3 items-center mb-4"><h2 className="eyebrow">TU PLAN DE ALIMENTACIÓN</h2><button onClick={() => navigate('/profile')} className="text-cyan text-xs flex items-center gap-1">Objetivos <ArrowUpRight size={15}/></button></div><div className="grid grid-cols-2 gap-4"><div><p className="text-2xl font-bold tabular-nums">{plan?.preferences.calorieTarget || '—'}<span className="text-xs font-normal text-secondary ml-1">kcal</span></p><p className="text-secondary text-xs mt-1">Objetivo diario</p></div><div><p className="text-2xl font-bold tabular-nums">{plan?.preferences.proteinTarget || '—'}<span className="text-xs font-normal text-secondary ml-1">g</span></p><p className="text-secondary text-xs mt-1">Proteína diaria</p></div></div><details className="mt-5 border-t border-white/5 pt-3"><summary className="text-sm text-secondary cursor-pointer py-2">Registrar calorías y proteína de hoy</summary><form onSubmit={saveFood} className="space-y-3 mt-3"><div className="grid grid-cols-2 gap-3"><label className="text-xs text-secondary">Calorías consumidas<input className="field mt-1 w-full" type="number" min="0" max="15000" value={food.calories_kcal} onChange={e => setFood({...food, calories_kcal:e.target.value})}/></label><label className="text-xs text-secondary">Proteína consumida (g)<input className="field mt-1 w-full" type="number" min="0" max="1000" step="0.1" value={food.protein_g} onChange={e => setFood({...food, protein_g:e.target.value})}/></label></div><button type="submit" className="btn-dark-pill w-full py-3 text-sm" disabled={savingFood || !body}>{savingFood ? 'Guardando…' : 'Guardar registro de hoy'}</button></form></details></section>
      </div>
      <section className="lg:col-span-2 mt-2"><WeeklyPlan /></section>
    </div>}
    <BottomNav/>
  </main>;
}
