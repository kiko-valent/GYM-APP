import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Beef, ExternalLink, Calculator, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { getUserPlan, updateUserPlan } from '@/utils/workoutData';
import ResourceSection from '@/components/nutrition/ResourceSection';
import BottomNav from '@/components/BottomNav';

const todayKey = () => new Date().toLocaleDateString('en-CA');

// Intenta abrir la app nativa de MyFitnessPal (esquema mfp://); si en ~800ms
// la página sigue visible (no hay app instalada), abre el diario web.
function openMyFitnessPal() {
  const webUrl = 'https://www.myfitnesspal.com/food/diary';
  const fallback = setTimeout(() => {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }, 800);

  const cancelIfAppOpened = () => {
    if (document.hidden) clearTimeout(fallback);
    document.removeEventListener('visibilitychange', cancelIfAppOpened);
  };
  document.addEventListener('visibilitychange', cancelIfAppOpened);

  window.location.href = 'mfp://';
}

function ProgressBar({ value, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="h-2.5 bg-dark-card-lighter rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function NutritionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [plan, setPlan] = useState(null);
  const [goals, setGoals] = useState({ kcal: '', protein: '' });
  const [editingGoals, setEditingGoals] = useState(false);

  const [todayLog, setTodayLog] = useState(null); // { calories_kcal, protein_g }
  const [logInput, setLogInput] = useState({ kcal: '', protein: '' });
  const [editingLog, setEditingLog] = useState(false);

  const [weekLog, setWeekLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      const userPlan = await getUserPlan(user.id);
      setPlan(userPlan);
      if (userPlan.nutritionGoals) {
        setGoals({
          kcal: userPlan.nutritionGoals.kcal || '',
          protein: userPlan.nutritionGoals.protein || '',
        });
      }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
      const { data: logs } = await supabase
        .from('user_nutrition')
        .select('date, calories_kcal, protein_g')
        .eq('user_id', user.id)
        .gte('date', weekAgo)
        .order('date', { ascending: true });

      const allLogs = logs || [];
      setWeekLog(allLogs);
      const today = allLogs.find(l => l.date === todayKey());
      if (today && (today.calories_kcal || today.protein_g)) {
        setTodayLog(today);
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSaveGoals = async () => {
    const kcal = parseInt(goals.kcal, 10) || 0;
    const protein = parseInt(goals.protein, 10) || 0;
    if (kcal <= 0 || protein <= 0) {
      toast({ variant: 'destructive', title: 'Objetivos inválidos', description: 'Introduce kcal y proteína mayores que 0.' });
      return;
    }
    setSaving(true);
    const newPlan = { ...plan, nutritionGoals: { kcal, protein } };
    const { error } = await updateUserPlan(user.id, newPlan);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los objetivos.' });
    } else {
      setPlan(newPlan);
      setGoals({ kcal, protein });
      setEditingGoals(false);
      toast({ title: 'Objetivos guardados ✓', description: `${kcal} kcal · ${protein} g de proteína` });
    }
    setSaving(false);
  };

  const handleSaveLog = async () => {
    const kcal = parseInt(logInput.kcal, 10) || 0;
    const protein = parseFloat(logInput.protein) || 0;
    if (kcal <= 0 && protein <= 0) {
      toast({ variant: 'destructive', title: 'Datos inválidos', description: 'Introduce al menos las kcal o la proteína del día.' });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      date: todayKey(),
      calories_kcal: kcal || null,
      protein_g: protein || null,
    };
    const { error } = await supabase
      .from('user_nutrition')
      .upsert(payload, { onConflict: 'user_id,date' });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el registro de hoy.' });
    } else {
      setTodayLog(payload);
      setWeekLog(prev => {
        const rest = prev.filter(l => l.date !== payload.date);
        return [...rest, payload].sort((a, b) => a.date.localeCompare(b.date));
      });
      setEditingLog(false);
      setLogInput({ kcal: '', protein: '' });
      toast({ title: 'Día registrado ✓', description: 'Copiado de MyFitnessPal en 10 segundos.' });
    }
    setSaving(false);
  };

  const hasGoals = goals.kcal && goals.protein;
  const daysLogged = weekLog.filter(l => l.calories_kcal || l.protein_g).length;
  const avgKcal = daysLogged > 0
    ? Math.round(weekLog.reduce((s, l) => s + (l.calories_kcal || 0), 0) / daysLogged)
    : 0;
  const avgProtein = daysLogged > 0
    ? Math.round(weekLog.reduce((s, l) => s + (parseFloat(l.protein_g) || 0), 0) / daysLogged)
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-28 bg-dark-bg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Mi Alimentación</h1>
          <Button
            variant="outline"
            className="border-cyan/30 text-cyan hover:bg-cyan/10 gap-2"
            onClick={openMyFitnessPal}
          >
            <ExternalLink className="w-4 h-4" />
            Abrir MyFitnessPal
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-lime border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">

              {/* Objetivos */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-dark p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="label-uppercase">MIS OBJETIVOS DIARIOS</p>
                  {!editingGoals && (
                    <button onClick={() => setEditingGoals(true)} className="text-cyan text-sm flex items-center gap-1 hover:text-cyan/80">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                </div>

                {editingGoals || !hasGoals ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-secondary text-xs">Calorías (kcal)</Label>
                        <Input
                          type="number"
                          value={goals.kcal}
                          onChange={e => setGoals(g => ({ ...g, kcal: e.target.value }))}
                          placeholder="2500"
                          className="bg-dark-card border-dark-border text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-secondary text-xs">Proteína (g)</Label>
                        <Input
                          type="number"
                          value={goals.protein}
                          onChange={e => setGoals(g => ({ ...g, protein: e.target.value }))}
                          placeholder="160"
                          className="bg-dark-card border-dark-border text-white mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveGoals} disabled={saving} className="btn-lime flex-1">
                        Guardar objetivos
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/calculator')}
                        className="border-white/10 text-secondary hover:text-white gap-2"
                      >
                        <Calculator className="w-4 h-4" /> Calcular TDEE
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-400/20 p-2.5 rounded-xl">
                        <Flame className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{goals.kcal} <span className="text-secondary text-sm font-normal">kcal</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-red-400/20 p-2.5 rounded-xl">
                        <Beef className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{goals.protein} <span className="text-secondary text-sm font-normal">g proteína</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Cierre del día */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-dark p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="label-uppercase">HOY</p>
                  {todayLog && !editingLog && (
                    <button
                      onClick={() => {
                        setLogInput({ kcal: todayLog.calories_kcal || '', protein: todayLog.protein_g || '' });
                        setEditingLog(true);
                      }}
                      className="text-cyan text-sm flex items-center gap-1 hover:text-cyan/80"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Corregir
                    </button>
                  )}
                </div>

                {todayLog && !editingLog ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-secondary">Calorías</span>
                        <span className="text-white font-semibold">
                          {todayLog.calories_kcal || 0} {hasGoals && <span className="text-secondary font-normal">/ {goals.kcal} kcal</span>}
                        </span>
                      </div>
                      <ProgressBar value={todayLog.calories_kcal || 0} target={parseInt(goals.kcal, 10) || 0} color="bg-orange-400" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-secondary">Proteína</span>
                        <span className="text-white font-semibold">
                          {todayLog.protein_g || 0} {hasGoals && <span className="text-secondary font-normal">/ {goals.protein} g</span>}
                        </span>
                      </div>
                      <ProgressBar value={parseFloat(todayLog.protein_g) || 0} target={parseInt(goals.protein, 10) || 0} color="bg-red-400" />
                    </div>
                    <p className="text-lime text-sm flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Día registrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-secondary text-sm">
                      Copia los totales del resumen de MyFitnessPal. Dos números y listo.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-secondary text-xs">Calorías (kcal)</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={logInput.kcal}
                          onChange={e => setLogInput(l => ({ ...l, kcal: e.target.value }))}
                          placeholder="2430"
                          className="bg-dark-card border-dark-border text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-secondary text-xs">Proteína (g)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={logInput.protein}
                          onChange={e => setLogInput(l => ({ ...l, protein: e.target.value }))}
                          placeholder="155"
                          className="bg-dark-card border-dark-border text-white mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveLog} disabled={saving} className="btn-lime flex-1">
                        {saving ? 'Guardando...' : 'Registrar día'}
                      </Button>
                      {editingLog && (
                        <Button variant="outline" onClick={() => setEditingLog(false)} className="border-white/10 text-secondary hover:text-white">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Últimos 7 días */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-dark p-5">
                <p className="label-uppercase mb-4">ÚLTIMOS 7 DÍAS</p>
                {daysLogged === 0 ? (
                  <p className="text-secondary text-sm">Aún no hay días registrados esta semana.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{daysLogged}<span className="text-secondary text-sm font-normal">/7</span></p>
                      <p className="text-secondary text-xs mt-1">días registrados</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{avgKcal}</p>
                      <p className="text-secondary text-xs mt-1">kcal de media</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{avgProtein}<span className="text-secondary text-sm font-normal">g</span></p>
                      <p className="text-secondary text-xs mt-1">proteína de media</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="md:col-span-1">
              <ResourceSection />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
