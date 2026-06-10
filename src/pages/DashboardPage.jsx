import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Utensils, Scale, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import WeeklyPlan from '@/components/WeeklyPlan';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/customSupabaseClient';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Peso corporal de hoy (tarjeta inline, sin modal interruptivo)
  const [todayWeight, setTodayWeight] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightLoaded, setWeightLoaded] = useState(false);

  useEffect(() => {
    const checkTodayWeight = async () => {
      if (!user) return;

      const today = new Date().toLocaleDateString('en-CA');
      const { data, error } = await supabase
        .from('weight_history')
        .select('weight')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('id', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setTodayWeight(data[0].weight);
      }
      setWeightLoaded(true);
    };
    checkTodayWeight();
  }, [user]);

  const handleSaveWeight = async () => {
    const parsed = parseFloat(String(weightInput).replace(',', '.'));
    if (!parsed || parsed <= 0) {
      toast({ variant: 'destructive', title: 'Peso inválido', description: 'Introduce un peso válido en kg.' });
      return;
    }

    setSavingWeight(true);
    const today = new Date().toLocaleDateString('en-CA');
    const { error } = await supabase
      .from('weight_history')
      .insert({ user_id: user.id, weight: parsed, date: today });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el peso.' });
    } else {
      await supabase.from('user_profiles').update({ current_weight: parsed }).eq('id', user.id);
      setTodayWeight(parsed);
      setWeightInput('');
      toast({ title: 'Peso registrado ✓', description: `${parsed} kg` });
    }
    setSavingWeight(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-28 bg-dark-bg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-4">
            {/* Avatar → Perfil */}
            <button onClick={() => navigate('/profile')} className="relative" title="Mi perfil">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime to-cyan flex items-center justify-center">
                <span className="text-xl font-bold text-dark-bg">
                  {user?.user_metadata?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-lime rounded-full border-2 border-dark-bg" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                ¡Hola {user?.user_metadata?.full_name?.split(' ')[0] || 'Atleta'}!
              </h1>
              <p className="text-secondary text-sm">¿Listo para darlo todo?</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="text-secondary hover:text-white hover:bg-dark-card-lighter"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Body Weight Card (inline, no modal) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="card-dark p-4 flex items-center gap-4">
            <div className="bg-cyan/20 p-3 rounded-xl shrink-0">
              <Scale className="w-5 h-5 text-cyan" />
            </div>
            {!weightLoaded ? (
              <p className="text-secondary text-sm">Cargando...</p>
            ) : todayWeight ? (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-lime" />
                <p className="text-white font-semibold">{todayWeight} kg <span className="text-secondary font-normal text-sm">registrados hoy</span></p>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1">
                  <p className="label-uppercase text-xs mb-1">PESO DE HOY (EN AYUNAS)</p>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="78,4"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="bg-transparent text-white text-xl font-bold w-24 focus:outline-none placeholder:text-white/20"
                  />
                  <span className="text-secondary text-sm ml-1">kg</span>
                </div>
                <Button
                  onClick={handleSaveWeight}
                  disabled={savingWeight || !weightInput}
                  className="btn-lime px-5 shrink-0 disabled:opacity-40"
                >
                  Guardar
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Nutrition Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <div
            onClick={() => navigate('/nutrition')}
            className="card-dark p-6 cursor-pointer hover:bg-dark-card-lighter transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-lime/10" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-lime/20 p-3 rounded-xl">
                  <Utensils className="w-6 h-6 text-lime" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Mi Alimentación</h3>
                  <p className="text-secondary text-sm">Tus objetivos y el cierre del día</p>
                </div>
              </div>
              <Button variant="ghost" className="text-lime group-hover:bg-lime/10">
                ¿Cierras el día?
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Weekly Plan */}
        <WeeklyPlan />
      </div>

      <BottomNav />
    </div>
  );
}
