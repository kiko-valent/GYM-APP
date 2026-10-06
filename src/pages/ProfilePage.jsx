import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Download, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { getUserPlan, updateUserPlan, getWorkoutHistory } from '@/utils/workoutData';
import { getPersonalData } from '@/utils/personalData';
import { readLocal, writeLocal, removeLocal } from '@/lib/localStore';
import { localDate } from '@/utils/workoutModel';
import WeightTrend from '@/components/WeightTrend';
import BottomNav from '@/components/BottomNav';
import ScreenHeader from '@/components/ScreenHeader';

export default function ProfilePage() {
  const { user, signOut } = useAuth(), navigate = useNavigate(), { toast } = useToast();
  const [plan, setPlan] = useState(null), [body, setBody] = useState(null), [error, setError] = useState('');
  const [fields, setFields] = useState({ full_name: '', age: '', height: '', calorieTarget: '', proteinTarget: '', phase: 'deficit' });
  const [saving, setSaving] = useState(false), [dirty, setDirty] = useState(false);
  const saveLock = useRef(false);
  useEffect(() => {
    let cancelled = false;
    Promise.all([getUserPlan(user.id), getPersonalData(user.id)]).then(([routine, personal]) => {
      if (cancelled) return;
      setPlan(routine); setBody(personal);
      const draft = readLocal(`fittrack_profile_draft_${user.id}`);
      setFields(draft || { full_name: personal.profile.full_name || user.user_metadata?.full_name || 'Francisco Javier', age: personal.profile.age ?? '',
        height: routine.preferences.height ?? '', calorieTarget: routine.preferences.calorieTarget ?? '', proteinTarget: routine.preferences.proteinTarget ?? '', phase: routine.preferences.phase || 'deficit' });
      if (draft) setDirty(true);
    }).catch(() => { if (!cancelled) setError('No se pudo cargar tu perfil. Reintenta con conexión.'); });
    return () => { cancelled = true; };
  }, [user.id, user.user_metadata?.full_name]);
  useEffect(() => { if (dirty) writeLocal(`fittrack_profile_draft_${user.id}`, fields); }, [dirty, fields, user.id]);
  const change = (field, value) => { if (saving) return; setFields(previous => ({ ...previous, [field]: value })); setDirty(true); };
  const handleSave = async event => {
    event.preventDefault(); if (!plan || saveLock.current) return;
    const optionalNumber = value => value === '' ? null : Number(value);
    const age = optionalNumber(fields.age), height = optionalNumber(fields.height), calories = optionalNumber(fields.calorieTarget), protein = optionalNumber(fields.proteinTarget);
    if (!fields.full_name.trim() || (age != null && (!Number.isInteger(age) || age < 18 || age > 100)) || (height != null && (!Number.isFinite(height) || height < 100 || height > 250)) || (calories != null && (!Number.isInteger(calories) || calories <= 0 || calories > 15000)) || (protein != null && (!Number.isFinite(protein) || protein <= 0 || protein > 1000))) {
      toast({ variant: 'destructive', title: 'Revisa los datos', description: 'Usa un nombre y cifras válidas. Puedes dejar los objetivos pendientes en blanco.' }); return;
    }
    saveLock.current = true; setSaving(true);
    try {
      const next = { ...plan, preferences: { ...plan.preferences, height, calorieTarget: calories, proteinTarget: protein, phase: fields.phase } };
      const result = await updateUserPlan(user.id, next); if (result.error) throw result.error;
      setPlan(next);
      const profileResult = await supabase.from('user_profiles').upsert({ id: user.id, full_name: fields.full_name.trim(), age, physical_goal: fields.phase === 'deficit' ? 'Definición' : 'Mantenimiento' });
      if (profileResult.error) throw new Error('Tus objetivos ya están guardados, pero el perfil no se pudo actualizar. Reintenta para completar el guardado.');
      const authResult = await supabase.auth.updateUser({ data: { full_name: fields.full_name.trim() } });
      if (authResult.error) toast({ title: 'Perfil guardado', description: 'El nombre del saludo se actualizará al volver a iniciar sesión.' });
      else toast({ title: 'Tus objetivos están guardados', description: 'Ya los verás en Hoy. Los cambios de peso se registran allí.' });
      setDirty(false); removeLocal(`fittrack_profile_draft_${user.id}`);
    } catch (caught) { toast({ variant: 'destructive', title: 'Guardado pendiente', description: caught.message }); }
    finally { setSaving(false); saveLock.current = false; }
  };
  const backup = async () => {
    try {
      const history = await getWorkoutHistory(user.id);
      const drafts = {};
      for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key.includes(user.id) && !key.startsWith('sb-')) drafts[key] = readLocal(key); }
      const blob = new Blob([JSON.stringify({ format: 'fittrack-backup', version: 1, exportedAt: new Date().toISOString(), userId: user.id, plan, personal: body, history, drafts }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `fittrack-kiko-${localDate()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: 'Copia descargada', description: 'Incluye los datos cargados y borradores de este dispositivo. Consérvala en un lugar privado.' });
    } catch { toast({ variant: 'destructive', title: 'No se pudo crear la copia', description: 'Reintenta con conexión.' }); }
  };
  const logout = async () => { const result = await signOut(); if (!result?.error) navigate('/login', { replace: true }); };
  return <main className="page-shell max-w-4xl"><ScreenHeader title="A tu medida." eyebrow="PERFIL Y OBJETIVOS" description="Tu punto de partida y el plan que sigues." back/>
    {plan && <section className="profile-banner"><span className="profile-monogram" aria-hidden="true">K</span><div><p className="eyebrow">TU ESPACIO PERSONAL</p><h2>{fields.full_name || 'Francisco Javier'}</h2></div></section>}
    {error ? <div role="alert" className="card-dark p-6">{error}<button className="btn-dark-pill block py-3 px-5 mt-4" onClick={() => window.location.reload()}>Reintentar</button></div> : !plan ? <div className="card-dark p-8 flex items-center gap-3"><Loader2 className="animate-spin text-lime"/> Cargando tu perfil…</div> : <div className="grid md:grid-cols-2 gap-5 items-start">
      <form onSubmit={handleSave} className="space-y-5"><section className="card-dark p-6 space-y-4"><h2 className="font-semibold">Sobre ti</h2><label className="block text-sm text-secondary">Nombre<input className="field block w-full mt-1" value={fields.full_name} onChange={e => change('full_name', e.target.value)} required disabled={saving}/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm text-secondary">Edad<input className="field w-full mt-1" type="number" min="18" max="100" value={fields.age} onChange={e => change('age', e.target.value)} disabled={saving}/></label><label className="text-sm text-secondary">Altura (cm)<input className="field w-full mt-1" type="number" min="100" max="250" value={fields.height} onChange={e => change('height', e.target.value)} disabled={saving}/></label></div></section>
      <section className="card-dark p-6 space-y-4"><h2 className="font-semibold">Tu fase actual</h2><div className="grid grid-cols-2 gap-2">{[['deficit','Perder grasa'],['maintenance','Mantener']].map(([value,label]) => <button key={value} type="button" disabled={saving} aria-pressed={fields.phase === value} onClick={() => change('phase', value)} className={`py-3 rounded-xl text-sm ${fields.phase === value ? 'bg-lime text-dark-bg font-bold' : 'bg-dark-card-lighter'}`}>{label}</button>)}</div><p className="text-secondary text-sm leading-relaxed">En déficit buscamos conservar el rendimiento y observar la tendencia del peso. No hace falta batir una marca en cada sesión.</p><div className="grid grid-cols-2 gap-3"><label className="text-sm text-secondary">Objetivo de kcal/día<input className="field w-full mt-1" type="number" min="1" max="15000" placeholder="Pendiente" value={fields.calorieTarget} onChange={e => change('calorieTarget', e.target.value)} disabled={saving}/></label><label className="text-sm text-secondary">Proteína (g/día)<input className="field w-full mt-1" type="number" min="1" max="1000" placeholder="Pendiente" value={fields.proteinTarget} onChange={e => change('proteinTarget', e.target.value)} disabled={saving}/></label></div><p className="text-secondary text-xs leading-relaxed">Introduce los objetivos del plan que sigues. La app no cambia tu alimentación por un pesaje aislado.</p></section>
      <button type="submit" disabled={saving || !dirty} className="btn-lime w-full py-4 flex justify-center gap-2 disabled:opacity-40"><Save size={18}/>{saving ? 'Guardando…' : dirty ? 'Guardar mis cambios' : 'Sin cambios pendientes'}</button></form>
      <div className="space-y-5"><WeightTrend entries={body?.weights || []}/><section className="card-dark p-6"><h2 className="font-semibold mb-2">Tus datos, a mano</h2><p className="text-secondary text-sm mb-4">Descarga una copia de tu rutina, historial y datos cargados. Los vídeos se conservan como referencias, no se descargan.</p><button onClick={backup} className="btn-dark-pill w-full py-3 flex justify-center gap-2"><Download size={18}/> Descargar copia JSON</button></section><button onClick={logout} className="flex items-center gap-2 text-secondary text-sm p-3"><LogOut size={17}/> Cerrar sesión</button></div>
    </div>}<BottomNav/></main>;
}
