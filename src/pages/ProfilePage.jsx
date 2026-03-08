import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Flame, Wheat, Beef, Weight, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';

const goalOptions = ["Definición", "Mantenimiento", "Aumento de peso"];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ full_name: '', age: '', physical_goal: '', current_weight: '' });
  const [nutrition, setNutrition] = useState({ fat_g: '', carbs_g: '', protein_g: '', calories_kcal: '' });
  const [newWeight, setNewWeight] = useState('');
  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (profileData) setProfile(profileData);
      // Fetch Today's Nutrition
      const today = new Date().toLocaleDateString('en-CA');
      const { data: nutritionData, error: nutritionError } = await supabase
        .from('user_nutrition')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      if (nutritionData) setNutrition(nutritionData);

      // Fetch Weight History
      const { data: weightData, error: weightError } = await supabase
        .from('weight_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);
      if (weightData) setWeightHistory(weightData);

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNutritionChange = (field, value) => {
    setNutrition(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    // Prepare profile payload with proper data types
    const profilePayload = {
      id: user.id,
      full_name: profile.full_name || null,
      age: profile.age ? parseInt(profile.age, 10) : null,
      current_weight: profile.current_weight ? parseFloat(profile.current_weight) : null,
      physical_goal: profile.physical_goal || null,
    };

    // Upsert Profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(profilePayload);

    if (profileError) {
      // error handled below
    }

    // Prepare nutrition payload with proper data types
    const today = new Date().toLocaleDateString('en-CA');
    const nutritionPayload = {
      user_id: user.id,
      date: today,
      calories_kcal: nutrition.calories_kcal ? parseInt(nutrition.calories_kcal, 10) : null,
      protein_g: nutrition.protein_g ? parseFloat(nutrition.protein_g) : null,
      carbs_g: nutrition.carbs_g ? parseFloat(nutrition.carbs_g) : null,
      fat_g: nutrition.fat_g ? parseFloat(nutrition.fat_g) : null,
    };

    // Upsert Nutrition
    const { error: nutritionError } = await supabase
      .from('user_nutrition')
      .upsert(nutritionPayload, { onConflict: 'user_id,date' });

    if (nutritionError) {
      // error handled below
    }

    if (profileError || nutritionError) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los datos." });
    } else {
      toast({ title: "¡Guardado!", description: "Tu perfil y datos de nutrición han sido actualizados." });
    }
    setLoading(false);
  };

  const handleAddWeight = async () => {
    if (!user || !newWeight) return;
    const today = new Date().toLocaleDateString('en-CA');
    const { error } = await supabase
      .from('weight_history')
      .insert({ user_id: user.id, weight: newWeight, date: today });

    if (!error) {
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({ current_weight: newWeight })
        .eq('id', user.id);

      if (!profileUpdateError) {
        setWeightHistory(prev => [{ weight: newWeight, date: today }, ...prev].slice(0, 5));
        setProfile(prev => ({ ...prev, current_weight: newWeight }));
        setNewWeight('');
        toast({ title: "Peso añadido", description: "Tu peso ha sido registrado." });
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: "No se pudo añadir el peso." });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-dark-bg text-white">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">Perfil del Usuario</h1>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Profile & Nutrition */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card-dark p-6">
              <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" value={profile.full_name || ''} onChange={e => handleProfileChange('full_name', e.target.value)} className="bg-dark-card border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Edad</Label>
                    <Input id="age" type="number" value={profile.age || ''} onChange={e => handleProfileChange('age', e.target.value)} className="bg-dark-card border-white/10" />
                  </div>
                  <div>
                    <Label htmlFor="weight">Peso Actual (kg)</Label>
                    <Input id="weight" type="number" value={profile.current_weight || ''} onChange={e => handleProfileChange('current_weight', e.target.value)} className="bg-dark-card border-white/10" />
                  </div>
                </div>
                <div>
                  <Label>Objetivo Físico</Label>
                  <div className="flex gap-2 mt-2">
                    {goalOptions.map(goal => (
                      <Button key={goal} onClick={() => handleProfileChange('physical_goal', goal)} variant="ghost" className={`w-full text-sm ${profile.physical_goal === goal ? 'bg-lime text-dark-bg hover:bg-lime/90' : 'bg-dark-card-lighter text-white hover:bg-dark-border'}`}>
                        {goal}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card-dark p-6">
              <h2 className="text-xl font-semibold mb-4">Control Nutricional (Hoy)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Flame className="text-orange-400" />
                  <div>
                    <Label>Calorías (kcal)</Label>
                    <Input type="number" value={nutrition.calories_kcal || ''} onChange={e => handleNutritionChange('calories_kcal', e.target.value)} className="bg-dark-card border-white/10" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Beef className="text-red-400" />
                  <div>
                    <Label>Proteínas (g)</Label>
                    <Input type="number" value={nutrition.protein_g || ''} onChange={e => handleNutritionChange('protein_g', e.target.value)} className="bg-dark-card border-white/10" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wheat className="text-yellow-400" />
                  <div>
                    <Label>Carbs (g)</Label>
                    <Input type="number" value={nutrition.carbs_g || ''} onChange={e => handleNutritionChange('carbs_g', e.target.value)} className="bg-dark-card border-white/10" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="text-green-400" />
                  <div>
                    <Label>Grasas (g)</Label>
                    <Input type="number" value={nutrition.fat_g || ''} onChange={e => handleNutritionChange('fat_g', e.target.value)} className="bg-dark-card border-white/10" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Weight History */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card-dark p-6">
            <h2 className="text-xl font-semibold mb-4">Seguimiento de Peso</h2>
            <div className="flex gap-2 mb-4">
              <Input type="number" placeholder="Nuevo peso (kg)" value={newWeight} onChange={e => setNewWeight(e.target.value)} className="bg-dark-card border-white/10" />
              <Button onClick={handleAddWeight} size="icon" className="bg-lime text-dark-bg hover:bg-lime/80 flex-shrink-0"><Plus /></Button>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Historial Reciente</h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 border-4 border-lime border-t-transparent rounded-full animate-spin" />
                </div>
              ) : weightHistory.map((entry, i) => (
                <div key={i} className="flex justify-between items-center bg-dark-card-lighter p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-lime" size={18} />
                    <span className="font-bold">{entry.weight} kg</span>
                  </div>
                  <span className="text-sm text-secondary">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
              ))}
              {weightHistory.length === 0 && !loading && <p className="text-secondary text-center py-4">No hay registros de peso.</p>}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
          <Button onClick={handleSave} disabled={loading} className="w-full btn-lime py-6 text-lg font-semibold disabled:opacity-50">
            <Save className="mr-2 w-5 h-5" /> {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}