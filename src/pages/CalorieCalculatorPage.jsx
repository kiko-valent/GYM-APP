import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, Flame, Activity, Scale, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";

export default function CalorieCalculatorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    weight: '',
    height: '',
    activity: 1.55
  });

  const [results, setResults] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenderSelect = (gender) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleActivitySelect = (level) => {
    setFormData(prev => ({ ...prev, activity: parseFloat(level) }));
  };

  const calculateCalories = () => {
    const { gender, age, weight, height, activity } = formData;
    
    if (!age || !weight || !height) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Por favor completa todos los campos para calcular.",
      });
      return;
    }

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    
    // Mifflin-St Jeor
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const tdee = Math.round(bmr * activity);

    setResults({
      bmr: Math.round(bmr),
      maintenance: tdee,
      deficit_mild: tdee - 250,
      deficit_moderate: tdee - 500,
      surplus_mild: tdee + 250,
      surplus_moderate: tdee + 500
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
            <Button onClick={() => navigate('/settings')} variant="ghost" className="text-white hover:bg-white/10 -ml-2 mr-2">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-8 h-8 text-blue-400" /> Calculadora de Calorías
            </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Form Section */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 space-y-6 h-fit"
           >
              <div className="space-y-3">
                <Label className="text-white">Género</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    onClick={() => handleGenderSelect('male')}
                    className={`flex-1 py-6 text-lg ${formData.gender === 'male' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/10 hover:bg-white/20 text-blue-200'}`}
                  >
                    Hombre
                  </Button>
                  <Button 
                     type="button"
                    onClick={() => handleGenderSelect('female')}
                    className={`flex-1 py-6 text-lg ${formData.gender === 'female' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-white/10 hover:bg-white/20 text-pink-200'}`}
                  >
                    Mujer
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-white">Edad (años)</Label>
                    <Input 
                      type="number" 
                      name="age"
                      value={formData.age} 
                      onChange={handleChange}
                      className="bg-white/10 border-white/20 text-white h-12 text-lg"
                      placeholder="Ej: 30"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-white">Peso (kg)</Label>
                    <Input 
                      type="number" 
                      name="weight"
                      value={formData.weight} 
                      onChange={handleChange}
                      className="bg-white/10 border-white/20 text-white h-12 text-lg"
                      placeholder="Ej: 75"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                  <Label className="text-white">Altura (cm)</Label>
                  <Input 
                    type="number" 
                    name="height"
                    value={formData.height} 
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white h-12 text-lg"
                    placeholder="Ej: 175"
                  />
              </div>

              <div className="space-y-2">
                  <Label className="text-white">Nivel de Actividad</Label>
                  <div className="space-y-2">
                    {[
                      { val: 1.2, label: 'Sedentario (Poco ejercicio)' },
                      { val: 1.375, label: 'Ligero (1-3 días/sem)' },
                      { val: 1.55, label: 'Moderado (3-5 días/sem)' },
                      { val: 1.725, label: 'Activo (6-7 días/sem)' },
                      { val: 1.9, label: 'Muy Activo (Trabajo físico)' }
                    ].map((opt) => (
                      <div 
                        key={opt.val}
                        onClick={() => handleActivitySelect(opt.val)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${formData.activity === opt.val ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                         <span className={`text-sm ${formData.activity === opt.val ? 'text-white font-medium' : 'text-blue-200'}`}>{opt.label}</span>
                         {formData.activity === opt.val && <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
                      </div>
                    ))}
                  </div>
              </div>

              <Button onClick={calculateCalories} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-6 rounded-xl text-lg shadow-lg mt-4 hover:scale-[1.02] transition-transform">
                 Calcular Mis Calorías
              </Button>
           </motion.div>

           {/* Results Section */}
           <motion.div 
             className="space-y-4"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
           >
              {results ? (
                <div className="space-y-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-lg rounded-3xl p-8 border border-green-500/30 text-center relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                     <div className="relative z-10">
                       <div className="inline-flex items-center justify-center p-3 bg-green-500/20 rounded-2xl mb-3">
                          <Scale className="w-8 h-8 text-green-400" />
                       </div>
                       <h3 className="text-xl font-semibold text-white mb-1">Mantenimiento</h3>
                       <div className="text-5xl font-bold text-white mb-2 tracking-tight">{results.maintenance} <span className="text-2xl font-normal text-green-200">kcal</span></div>
                       <p className="text-green-200/70 text-sm">Calorías diarias para mantener tu peso actual.</p>
                     </div>
                  </motion.div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <motion.div 
                       initial={{ y: 20, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                       transition={{ delay: 0.1 }}
                       className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                     >
                        <h4 className="text-orange-300 font-medium mb-4 flex items-center gap-2"><Flame className="w-5 h-5" /> Déficit (Perder)</h4>
                        <div className="space-y-4">
                           <div>
                              <div className="text-3xl font-bold text-white">{results.deficit_mild}</div>
                              <div className="text-xs text-white/50 uppercase tracking-wider font-medium mt-1">Ligero (-0.25kg/sem)</div>
                           </div>
                           <div className="w-full h-px bg-white/10"></div>
                           <div>
                              <div className="text-3xl font-bold text-white">{results.deficit_moderate}</div>
                              <div className="text-xs text-white/50 uppercase tracking-wider font-medium mt-1">Moderado (-0.5kg/sem)</div>
                           </div>
                        </div>
                     </motion.div>

                     <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                     >
                        <h4 className="text-blue-300 font-medium mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Superávit (Ganar)</h4>
                        <div className="space-y-4">
                           <div>
                              <div className="text-3xl font-bold text-white">{results.surplus_mild}</div>
                              <div className="text-xs text-white/50 uppercase tracking-wider font-medium mt-1">Ligero (+0.25kg/sem)</div>
                           </div>
                           <div className="w-full h-px bg-white/10"></div>
                           <div>
                              <div className="text-3xl font-bold text-white">{results.surplus_moderate}</div>
                              <div className="text-xs text-white/50 uppercase tracking-wider font-medium mt-1">Moderado (+0.5kg/sem)</div>
                           </div>
                        </div>
                     </motion.div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                    <p className="text-white/40 text-xs leading-relaxed">
                      *Calculado usando la fórmula Mifflin-St Jeor. Estos valores son estimados. Ajusta según tus resultados reales en la báscula semana a semana.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 p-10 text-center min-h-[400px]">
                   <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Utensils className="w-10 h-10 text-white/20" />
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-3">Resultados de Calorías</h3>
                   <p className="text-white/50 text-lg max-w-xs mx-auto">Completa el formulario con tus datos para descubrir cuántas calorías necesitas para alcanzar tus objetivos.</p>
                </div>
              )}
           </motion.div>
        </div>
      </div>
    </div>
  );
}