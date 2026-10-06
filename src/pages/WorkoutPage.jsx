import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getUserPlan, saveWorkoutSession, saveWorkoutProgress, loadWorkoutProgress, clearWorkoutProgress,
  saveExerciseProgressToSupabase, loadWorkoutProgressFromSupabase, clearWorkoutProgressFromSupabase, waitForWorkoutSaves } from '@/utils/workoutData';
import { localDate, normalizeDayName, planRevision, reconcileProgress } from '@/utils/workoutModel';
import { newId, writeLocal } from '@/lib/localStore';
import SetTracker from '@/components/SetTracker';
import ExerciseNavChips from '@/components/ExerciseNavChips';
import WorkoutEvaluation from '@/components/WorkoutEvaluation';
import { useToast } from '@/components/ui/use-toast';

export default function WorkoutPage() {
  const { day: rawDay } = useParams();
  const day = normalizeDayName(rawDay);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [plan, setPlan] = useState(null);
  const [preferences, setPreferences] = useState({ trackIntensity: true });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exercisesState, setExercisesState] = useState({});
  const stateRef = useRef({}), metadata = useRef(null), saveLock = useRef(false), generation = useRef(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false), [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');
  const syncStates = useRef(new Map());

  useEffect(() => {
    const token = ++generation.current;
    setLoading(true); setPlan(null); setError(''); setIsComplete(false); setCurrentIndex(0);
    metadata.current = null; stateRef.current = {}; syncStates.current.clear();
    const load = async () => {
      try {
        const fullPlan = await getUserPlan(user.id);
        const workout = fullPlan.workouts?.[day] || { exercises: [] };
        const revision = planRevision(workout.exercises), date = localDate();
        const local = loadWorkoutProgress(user.id, day, date);
        if (local && (local.version !== 2 || local.revision !== revision)) {
          writeLocal(`fittrack_draft_archive_${user.id}_${local.sessionKey || newId()}`, local);
        }
        const cachedState = reconcileProgress(workout.exercises, local?.exercisesState, null, revision);
        const hasLocal = Object.values(cachedState).some(row => row.sets.length || row.updatedAt);
        if (hasLocal && generation.current === token) {
          metadata.current = { workoutDate: date, revision, sessionKey: local.sessionKey || newId(), startedAt: local.startedAt || Date.now() };
          stateRef.current = cachedState; setExercisesState(cachedState); setPlan(workout); setPreferences(fullPlan.preferences);
          const first = workout.exercises.findIndex((_, idx) => !cachedState[idx].completed);
          setCurrentIndex(first < 0 ? 0 : first); setIsComplete(workout.exercises.length > 0 && first < 0); setSyncStatus('local'); setLoading(false);
        }
        const remote = await loadWorkoutProgressFromSupabase(user.id, day, date);
        // Fusionar con la ref para no borrar series registradas mientras llegaba la consulta.
        const latestLocal = hasLocal ? stateRef.current : local?.exercisesState;
        if (generation.current !== token) return;
        const restored = reconcileProgress(workout.exercises, latestLocal, remote.exercisesState, revision);
        const remoteSession = Object.values(restored).find(row => row.sessionKey);
        metadata.current = { workoutDate: date, revision, sessionKey: local?.sessionKey || remoteSession?.sessionKey || newId(), startedAt: local?.startedAt || remoteSession?.startedAt || Date.now() };
        stateRef.current = restored;
        setExercisesState(restored); setPlan(workout); setPreferences(fullPlan.preferences);
        const first = workout.exercises.findIndex((_, idx) => !restored[idx].completed);
        if (!hasLocal) setCurrentIndex(first < 0 ? 0 : first);
        setIsComplete(workout.exercises.length > 0 && first < 0);
        setSyncStatus(remote.error || hasLocal ? 'local' : 'synced');
        if (local?.exercisesState && Object.values(restored).every(row => !row.sets.length) && Object.values(local.exercisesState).some(row => row.sets?.length)) {
          toast({ title: 'La rutina ha cambiado', description: 'El borrador antiguo sigue conservado, pero no se ha asignado a ejercicios sin identificar.' });
        }
        if (hasLocal) Object.entries(restored).forEach(([idx, row]) => { if (row.updatedAt) syncRow(Number(idx), row); });
        setLoading(false);
      } catch {
        if (generation.current !== token) return;
        setError('No se pudo cargar tu rutina. Comprueba la conexión y vuelve a intentarlo.'); setLoading(false);
      }
    };
    load();
    return () => { generation.current = token + 1; };
    // syncRow utiliza refs y el contexto inmutable de este efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, day, toast]);

  const syncRow = (index, row) => {
    const token = generation.current;
    const requestId = newId();
    syncStates.current.set(index, { requestId, status: 'saving' });
    setSyncStatus('saving');
    saveExerciseProgressToSupabase(user.id, day, index, row.exerciseName, row.sets, row.completed,
      { ...metadata.current, exerciseId: row.exerciseId, updatedAt: row.updatedAt }).then(({ error: syncError }) => {
      if (generation.current !== token || syncStates.current.get(index)?.requestId !== requestId) return;
      syncStates.current.set(index, { requestId, status: syncError ? 'local' : 'synced' });
      const states = [...syncStates.current.values()];
      setSyncStatus(states.some(row => row.status === 'saving') ? 'saving' : states.some(row => row.status === 'local') ? 'local' : 'synced');
    });
  };

  useEffect(() => {
    const sync = () => {
      if (!plan || !metadata.current || saving) return;
      Object.entries(stateRef.current).forEach(([idx, row]) => { if (row.updatedAt) syncRow(Number(idx), row); });
    };
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
    // El callback lee el último borrador desde refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, saving, user.id, day]);

  const updateExercise = (index, sets, completed) => {
    if (!metadata.current || !plan?.exercises[index]) return;
    const exercise = plan.exercises[index], previous = stateRef.current[index];
    if (!completed && JSON.stringify(previous?.sets) === JSON.stringify(sets)) return;
    const row = { ...previous, exerciseId: exercise.id, exerciseName: exercise.name, revision: metadata.current.revision,
      sets, completed: completed ?? previous?.completed ?? false, updatedAt: new Date().toISOString() };
    const next = { ...stateRef.current, [index]: row };
    stateRef.current = next; setExercisesState(next);
    const result = saveWorkoutProgress(user.id, day, next, index, metadata.current);
    if (!result.saved) toast({ variant: 'destructive', title: 'No se pudo guardar en este dispositivo', description: 'No cierres la app hasta que la sincronización termine.' });
    syncRow(index, row);
    if (completed) {
      const first = plan.exercises.findIndex((_, idx) => !next[idx]?.completed);
      if (first < 0) setIsComplete(true);
      else {
        const after = plan.exercises.findIndex((_, idx) => idx > index && !next[idx]?.completed);
        setCurrentIndex(after >= 0 ? after : first);
      }
    }
  };

  const finish = async evaluation => {
    if (saveLock.current || !metadata.current) return;
    saveLock.current = true; setSaving(true);
    try {
      await waitForWorkoutSaves(user.id, day, metadata.current.workoutDate);
      const exercises = plan.exercises.flatMap((exercise, idx) => {
        const row = stateRef.current[idx];
        return row?.completed && row.sets.length ? [{ ...exercise, sets: row.sets }] : [];
      });
      if (!exercises.length) throw new Error('No hay series completadas para guardar.');
      const { error: saveError } = await saveWorkoutSession(user.id, { ...metadata.current, day, date: new Date().toISOString(), exercises,
        durationMinutes: Math.max(1, Math.round((Date.now() - metadata.current.startedAt) / 60000)), evaluation });
      if (saveError) throw saveError;
      const cleanup = await clearWorkoutProgressFromSupabase(user.id, day, metadata.current.workoutDate);
      clearWorkoutProgress(user.id, day, metadata.current.workoutDate);
      toast({ title: 'Entrenamiento guardado', description: cleanup.error ? 'La sesión está guardada. Queda pendiente limpiar la copia del borrador en la nube.' : 'Una sesión más para tu constancia. Buen trabajo, Kiko.' });
      navigate('/dashboard', { replace: true });
    } catch (caught) {
      toast({ variant: 'destructive', title: 'El entrenamiento sigue pendiente', description: caught.message || 'Tu borrador sigue en este dispositivo. Reintenta cuando tengas conexión.' });
    } finally { saveLock.current = false; setSaving(false); }
  };

  if (loading) return <div className="page-shell flex min-h-[70vh] items-center justify-center"><Loader2 className="mr-3 animate-spin text-lime" /> Recuperando tu entrenamiento…</div>;
  if (error) return <div className="page-shell"><div className="card-dark p-6"><h1 className="text-xl font-bold mb-3">Tu rutina está a salvo</h1><p className="text-secondary mb-4">{error}</p><button className="btn-lime px-5 py-3" onClick={() => window.location.reload()}>Reintentar</button><button className="btn-dark-pill px-5 py-3 ml-2" onClick={() => navigate('/dashboard')}>Volver</button></div></div>;
  if (!plan?.exercises.length) return <div className="page-shell text-center py-20"><p className="eyebrow">RECUPERACIÓN</p><h1 className="text-3xl font-bold my-4">Hoy también cuenta descansar</h1><p className="text-secondary mb-6">No hay ejercicios programados para este día.</p><button className="btn-lime px-6 py-3" onClick={() => navigate('/dashboard')}>Volver a Hoy</button></div>;
  const completed = plan.exercises.filter((_, idx) => exercisesState[idx]?.completed).length;
  const index = Math.min(currentIndex, plan.exercises.length - 1);
  return <main className="page-shell max-w-2xl">
    <header className="flex items-center justify-between mb-6 gap-3">
      <button onClick={() => navigate('/dashboard')} disabled={saving} className="btn-dark-pill flex items-center gap-2 text-secondary px-4 py-3 text-sm"><ArrowLeft size={19} /> Pausar</button>
      <span className="text-xs text-secondary flex items-center gap-1.5" role="status">
        {syncStatus === 'local' ? <CloudOff size={15} /> : syncStatus === 'saving' ? <Loader2 size={15} className="animate-spin" /> : <Cloud size={15} />}
        {syncStatus === 'local' ? 'Guardado en este móvil' : syncStatus === 'saving' ? 'Sincronizando' : 'Sincronizado'}
      </span>
    </header>
    <div className="workout-heading mb-6"><p className="eyebrow capitalize">{day} · {plan.name || 'Tu entrenamiento'}</p><div className="flex justify-between my-2"><h1 className="text-xl font-bold">{isComplete ? 'Sesión completada' : 'Una serie cada vez'}</h1><span className="text-secondary text-sm">{completed}/{plan.exercises.length}</span></div><div className="workout-progress-track h-1.5 rounded-full overflow-hidden"><div className="workout-progress-fill h-full transition-all" style={{ width: `${completed / plan.exercises.length * 100}%` }} /></div></div>
    {isComplete ? <WorkoutEvaluation onComplete={finish} saving={saving} exercises={plan.exercises.map((ex, idx) => ({ ...ex, sets: exercisesState[idx]?.sets || [] }))} onBack={() => setIsComplete(false)} /> : <>
      <ExerciseNavChips exercises={plan.exercises} currentIndex={index} exercisesState={exercisesState} onNavigate={setCurrentIndex} />
      <SetTracker key={`${metadata.current.sessionKey}:${plan.exercises[index].id}`} exercise={plan.exercises[index]} userId={user.id}
        initialCompletedSets={exercisesState[index]?.sets || []} trackIntensity={preferences.trackIntensity}
        phase={preferences.phase} timerKey={`fittrack_rest_${user.id}_${metadata.current.sessionKey}_${plan.exercises[index].id}`}
        onSetProgress={sets => updateExercise(index, sets)} onExerciseComplete={data => updateExercise(index, data.sets, true)} />
      {completed === plan.exercises.length && <button onClick={() => setIsComplete(true)} className="btn-lime w-full py-4 mt-4">Ver resumen y finalizar</button>}
    </>}
  </main>;
}
