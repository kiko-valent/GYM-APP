import React, { useState, useEffect, useRef } from 'react';
import { Minus, Plus, Check, ExternalLink, Pencil, X, Timer } from 'lucide-react';
import { getPreviousWorkout, resolveTechniqueVideo } from '@/utils/workoutData';
import { getSuggestion, formatRepRange, getRepRange } from '@/utils/progression';
import { useRestTimer, useWakeLock } from '@/hooks/useRestTimer';
import { useToast } from '@/components/ui/use-toast';

export default function SetTracker({ exercise, userId, initialCompletedSets = [], onSetProgress, onExerciseComplete,
  trackIntensity = true, phase = 'deficit', timerKey }) {
  const [sets, setSets] = useState(initialCompletedSets);
  const setsRef = useRef(initialCompletedSets), touched = useRef(false), inputsBeforeEdit = useRef(null), tapLock = useRef(false);
  const last = initialCompletedSets.at(-1);
  const [weight, setWeight] = useState(last?.weight ?? exercise.weight ?? 0);
  const [reps, setReps] = useState(last?.reps ?? getRepRange(exercise).max);
  const [rir, setRir] = useState(last?.rir ?? 2);
  const [editing, setEditing] = useState(null), [previous, setPrevious] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const { toast } = useToast();
  const timer = useRestTimer(timerKey, exercise.rest || 90);
  useWakeLock(true);
  const done = sets.length >= Number(exercise.sets), currentSet = Math.min(sets.length + 1, Number(exercise.sets));
  const suggestion = getSuggestion(previous, exercise, phase);
  const reference = previous?.ordered ? previous.sets[currentSet - 1] : null;
  const increment = Number(exercise.increment) || 2.5;

  useEffect(() => {
    let cancelled = false;
    getPreviousWorkout(userId, exercise.name, exercise.id).then(data => {
      if (cancelled) return;
      setPrevious(data);
      if (!touched.current && !setsRef.current.length && data) {
        const suggested = getSuggestion(data, exercise, phase);
        setWeight(suggested.weight);
        if (data.ordered && data.sets[0]?.reps) setReps(data.sets[0].reps);
      }
    });
    return () => { cancelled = true; };
  }, [userId, exercise, phase]);

  useEffect(() => {
    if (JSON.stringify(initialCompletedSets) === JSON.stringify(setsRef.current)) return;
    setsRef.current = initialCompletedSets; setSets(initialCompletedSets);
    // Una copia remota puede actualizar las series; no pisar los inputs que ya estás escribiendo.
    if (!touched.current) { const latest = initialCompletedSets.at(-1); if (latest) { setWeight(latest.weight); setReps(latest.reps); } }
  }, [initialCompletedSets]);

  const publish = next => { setsRef.current = next; setSets(next); onSetProgress?.(next); };
  const cancelEdit = () => {
    if (inputsBeforeEdit.current) { const value = inputsBeforeEdit.current; setWeight(value.weight); setReps(value.reps); setRir(value.rir); }
    inputsBeforeEdit.current = null; setEditing(null);
  };
  const edit = index => {
    if (editing == null) inputsBeforeEdit.current = { weight, reps, rir };
    const set = setsRef.current[index]; setWeight(set.weight); setReps(set.reps); setRir(set.rir ?? 2); setEditing(index); touched.current = true;
  };
  const confirm = () => {
    if (tapLock.current || (editing == null && timer.showRestTimer && timer.timeLeft > 0)) return;
    const parsedWeight = Number(String(weight).replace(',', '.')), parsedReps = Number(reps);
    if (String(weight).trim() === '' || !Number.isFinite(parsedWeight) || parsedWeight < 0 || parsedWeight > 1000 || !Number.isInteger(parsedReps) || parsedReps < 1 || parsedReps > 100) {
      toast({ variant: 'destructive', title: 'Revisa esta serie', description: 'Usa un peso válido (0–1.000 kg) y entre 1 y 100 repeticiones.' }); return;
    }
    tapLock.current = true; setTimeout(() => { tapLock.current = false; }, 350);
    const nextSet = { set: editing == null ? setsRef.current.length + 1 : editing + 1, weight: parsedWeight, reps: parsedReps,
      ...(trackIntensity ? { rir: Number(rir) } : {}) };
    if (editing != null) {
      publish(setsRef.current.map((row,index) => index === editing ? nextSet : row));
      cancelEdit(); toast({ title: 'Serie corregida' }); return;
    }
    const next = [...setsRef.current, nextSet]; publish(next); touched.current = false;
    navigator.vibrate?.(25);
    if (Number(exercise.targetWeight) > 0 && parsedWeight >= Number(exercise.targetWeight) && !setsRef.current.slice(0,-1).some(row => row.weight >= Number(exercise.targetWeight))) toast({ title: 'Peso objetivo alcanzado', description: `${parsedWeight} kg × ${parsedReps} reps. La técnica sigue siendo lo primero.` });
    if (next.length >= Number(exercise.sets)) { timer.clearRest(); onExerciseComplete({ name: exercise.name, sets: next }); }
    else { const nextReference = previous?.ordered ? previous.sets[next.length] : null; setReps(nextReference?.reps ?? parsedReps); setWeight(parsedWeight); timer.startRest(); }
  };
  const copy = () => { if (reference) { setWeight(reference.weight); setReps(reference.reps); setRir(reference.rir ?? 2); touched.current = true; } };
  const openVideo = async () => {
    if (videoLoading) return;
    const opened = window.open('about:blank', '_blank'); if (opened) opened.opener = null;
    setVideoLoading(true);
    try { const url = await resolveTechniqueVideo(exercise.techniqueVideo); if (opened) opened.location.href = url;
      else toast({ title: 'Permite abrir el enlace del vídeo en otra pestaña' }); }
    catch { opened?.close(); toast({ variant: 'destructive', title: 'No se pudo abrir el vídeo' }); }
    finally { setVideoLoading(false); }
  };
  const changeWeight = value => { touched.current = true; setWeight(value); };
  const numericWeight = () => Number(String(weight).replace(',', '.')) || 0;
  const changeReps = value => { touched.current = true; setReps(value); };

  return <section className="space-y-4">
    <header><h2 className="text-2xl font-bold leading-tight">{exercise.name}</h2><p className="text-secondary text-sm mt-2">{done ? 'Todas las series registradas' : `Serie ${currentSet} de ${exercise.sets}`} · {formatRepRange(exercise)} · descanso {exercise.rest || 90}s</p></header>
    {exercise.description && <details className="text-sm text-secondary"><summary className="cursor-pointer py-1">Notas de técnica</summary><p className="mt-2 leading-relaxed">{exercise.description}</p></details>}
    {exercise.techniqueVideo && <button onClick={openVideo} disabled={videoLoading} className="text-cyan text-sm flex gap-2 items-center py-1"><ExternalLink size={15}/>{videoLoading ? 'Abriendo…' : 'Ver vídeo del ejercicio'}</button>}
    <details className="card-dark px-4 py-3 border-lime/15"><summary className="cursor-pointer text-sm text-lime font-semibold">{suggestion.title}</summary><p className="text-secondary text-sm mt-2 leading-relaxed">{suggestion.detail}</p></details>
    {previous && <div className="flex items-center justify-between gap-3 text-sm px-1"><div><p className="text-secondary text-xs">{reference ? `Última vez · serie ${currentSet}` : 'Sesión anterior'}</p><p className="font-semibold mt-0.5">{reference ? `${reference.weight} kg × ${reference.reps}` : `${previous.sets.length} series registradas`}</p></div>{reference && <button onClick={copy} disabled={editing != null} className="text-cyan text-xs py-3">Copiar valores</button>}</div>}
    {timer.showRestTimer && <div className="card-dark rest-panel p-4" role="region" aria-label="Descanso"><div className="flex justify-between items-center gap-3"><div className="flex items-center gap-2"><Timer size={19} className="text-cyan"/><span className="text-3xl font-bold tabular-nums">{Math.floor(timer.timeLeft/60)}:{String(timer.timeLeft%60).padStart(2,'0')}</span><span className="text-secondary text-xs">{timer.timeLeft === 0 ? 'Listo' : timer.isTimerRunning ? 'Descanso' : 'Pausado'}</span></div><button onClick={timer.clearRest} className="text-cyan text-xs py-3">{timer.timeLeft === 0 ? 'Continuar' : 'Terminar descanso'}</button></div><div className="flex gap-2 mt-3"><button onClick={() => timer.adjustRest(-15)} className="btn-dark-pill flex-1 py-2.5 text-xs">−15s</button><button onClick={timer.togglePause} disabled={timer.timeLeft === 0} className="btn-dark-pill flex-1 py-2.5 text-xs">{timer.isTimerRunning ? 'Pausar' : 'Reanudar'}</button><button onClick={() => timer.adjustRest(15)} className="btn-dark-pill flex-1 py-2.5 text-xs">+15s</button></div></div>}
    {editing != null && <div className="flex items-center justify-between text-cyan text-sm"><span>Corrigiendo serie {editing+1}</span><button onClick={cancelEdit} aria-label="Cancelar corrección" className="p-2"><X size={18}/></button></div>}
    {(!done || editing != null) && <>
      <div className="set-fields grid grid-cols-2 gap-3">
        <div className="card-dark p-4 text-center"><label htmlFor="set-weight" className="eyebrow">PESO · KG</label><input id="set-weight" aria-label="Peso de la serie en kg" className="w-full bg-transparent text-center text-[40px] sm:text-5xl font-bold tabular-nums my-3 focus:outline-none" type="text" inputMode="decimal" value={weight} onChange={e => changeWeight(e.target.value)} autoComplete="off"/><div className="grid grid-cols-2 gap-2"><button aria-label="Reducir peso" onClick={() => changeWeight(Math.max(0, numericWeight()-increment))} className="bg-dark-card-lighter py-3 rounded-xl flex justify-center"><Minus size={19}/></button><button aria-label="Aumentar peso" onClick={() => changeWeight(Math.round((numericWeight()+increment)*100)/100)} className="bg-dark-card-lighter py-3 rounded-xl flex justify-center text-cyan"><Plus size={19}/></button></div></div>
        <div className="card-dark p-4 text-center"><label htmlFor="set-reps" className="eyebrow">REPETICIONES</label><input id="set-reps" aria-label="Repeticiones de la serie" className="w-full bg-transparent text-center text-[40px] sm:text-5xl font-bold tabular-nums my-3 focus:outline-none" type="number" inputMode="numeric" min="1" max="100" value={reps} onChange={e => changeReps(e.target.value)}/><div className="grid grid-cols-2 gap-2"><button aria-label="Reducir repeticiones" onClick={() => changeReps(Math.max(1,Number(reps)-1))} className="bg-dark-card-lighter py-3 rounded-xl flex justify-center"><Minus size={19}/></button><button aria-label="Aumentar repeticiones" onClick={() => changeReps(Math.min(100,Number(reps)+1))} className="bg-dark-card-lighter py-3 rounded-xl flex justify-center text-cyan"><Plus size={19}/></button></div></div>
      </div>
      {trackIntensity && <div><p className="text-xs text-secondary mb-2">RIR · ¿Cuántas repeticiones te quedaban?</p><div className="grid grid-cols-4 gap-2">{[0,1,2,3].map(value => <button key={value} onClick={() => setRir(value)} aria-pressed={Number(rir)===value} className={`py-3 rounded-xl font-semibold ${Number(rir)===value ? 'bg-cyan text-dark-bg' : 'bg-dark-card-lighter'}`}>{value===3?'3+':value}</button>)}</div></div>}
    </>}
    <div className="sticky bottom-3 pt-2"><button onClick={done && editing == null ? () => onExerciseComplete({name:exercise.name,sets:setsRef.current}) : confirm} disabled={editing == null && timer.showRestTimer && timer.timeLeft > 0} className="btn-lime w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40"><Check size={19}/>{editing != null ? 'Guardar corrección' : done ? 'Guardar y continuar' : timer.showRestTimer && timer.timeLeft > 0 ? 'Descansa antes de la siguiente' : currentSet === Number(exercise.sets) ? 'Completar ejercicio' : `Confirmar serie ${currentSet}`}</button></div>
    {sets.length > 0 && <div className="space-y-2"><p className="eyebrow">TUS SERIES DE HOY · TOCA PARA CORREGIR</p>{sets.map((row,index) => <button key={index} onClick={() => edit(index)} className="w-full flex items-center justify-between gap-3 rounded-xl bg-dark-card px-4 py-3 text-sm"><span className="text-secondary">{index+1}</span><span className="font-semibold tabular-nums">{row.weight} kg × {row.reps}</span><span className="text-secondary text-xs">{row.rir != null ? `RIR ${row.rir}` : ''}</span><Pencil size={14} className="text-cyan"/></button>)}</div>}
  </section>;
}
