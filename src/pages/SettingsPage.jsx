import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, PlusCircle, Save, Loader2, AlertCircle, StickyNote, Gauge, Target, Calendar, Calculator, Wrench, ChevronRight, Video } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getUserPlan, updateUserPlan } from '@/utils/workoutData';
import { useToast } from "@/components/ui/use-toast.js";
import VideoUpload from '@/components/VideoUpload.jsx';

const allDays = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;
    const fetchPlan = async () => {
      if (user) {
        try {
          const userPlan = await getUserPlan(user.id);
          if (isMounted) {
            // Ensure preferences object exists
            if (!userPlan.preferences) {
              userPlan.preferences = { trackIntensity: false };
            }
            setPlan(userPlan);
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to load plan", error);
          if (isMounted) setLoading(false);
        }
      }
    };
    fetchPlan();
    return () => { isMounted = false; };
  }, [user]);

  const handleManualSave = async () => {
    if (!plan) return;

    setIsSaving(true);
    try {
      await updateUserPlan(user.id, plan);
      setIsDirty(false);
      toast({
        title: "¡Guardado exitoso! 💪",
        description: "Tu rutina ha sido actualizada correctamente.",
      });
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // UI State Helper
  const getSaveStatusDisplay = () => {
    if (isSaving) return <span className="flex items-center text-blue-400 text-sm font-medium"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</span>;
    if (isDirty) return <span className="flex items-center text-amber-400 text-sm font-medium"><AlertCircle className="w-4 h-4 mr-2" /> Cambios sin guardar</span>;
    return null;
  };

  const handleDayToggle = (day) => {
    setPlan(prevPlan => {
      if (!prevPlan) return prevPlan;
      const newTrainingDays = prevPlan.training_days.includes(day)
        ? prevPlan.training_days.filter(d => d !== day)
        : [...prevPlan.training_days, day];

      const newWorkouts = { ...prevPlan.workouts };
      if (!newWorkouts[day]) {
        newWorkouts[day] = { exercises: [] };
      }

      setIsDirty(true);
      return { ...prevPlan, training_days: newTrainingDays, workouts: newWorkouts };
    });
  };

  const handleExerciseChange = (day, exIndex, field, value) => {
    setPlan(prevPlan => {
      if (!prevPlan) return prevPlan;
      const newPlan = JSON.parse(JSON.stringify(prevPlan));
      if (newPlan.workouts[day]?.exercises[exIndex]) {
        newPlan.workouts[day].exercises[exIndex][field] = value;
        setIsDirty(true);
      }
      return newPlan;
    });
  };

  const handlePreferenceChange = (checked) => {
    setPlan(prevPlan => {
      if (!prevPlan) return prevPlan;
      const newPlan = {
        ...prevPlan,
        preferences: {
          ...prevPlan.preferences,
          trackIntensity: checked
        }
      };
      setIsDirty(true);
      return newPlan;
    });
  };

  const addExercise = (day) => {
    setPlan(prevPlan => {
      if (!prevPlan) return prevPlan;
      const newPlan = JSON.parse(JSON.stringify(prevPlan));
      // Initializing with empty description and targets
      const newExercise = {
        name: '',
        sets: 4,
        reps: 10,
        weight: 0,
        description: '',
        targetWeight: '',
        targetDate: '',
        techniqueVideo: ''
      };
      if (!newPlan.workouts[day]) {
        newPlan.workouts[day] = { exercises: [] };
      }
      newPlan.workouts[day].exercises.push(newExercise);
      setIsDirty(true);
      return newPlan;
    });
  };

  const removeExercise = (day, exIndex) => {
    setPlan(prevPlan => {
      if (!prevPlan) return prevPlan;
      const newPlan = JSON.parse(JSON.stringify(prevPlan));
      if (newPlan.workouts[day]?.exercises) {
        newPlan.workouts[day].exercises.splice(exIndex, 1);
        setIsDirty(true);
      }
      return newPlan;
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin mr-2" /> Cargando configuración...</div>;
  }

  if (!plan) {
    return <div className="min-h-screen flex flex-col items-center justify-center text-white">
      <p>No se pudo cargar el plan.</p>
      <Button onClick={() => window.location.reload()} className="mt-4">Reintentar</Button>
    </div>;
  }

  const sortedTrainingDays = [...plan.training_days].sort((a, b) => allDays.indexOf(a) - allDays.indexOf(b));

  return (
    <div className="min-h-screen p-4 md:p-8 bg-dark-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header with Save Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-dark-card border-dark-border text-white hover:bg-dark-card-lighter">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Configurar Plan</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <p className="text-secondary">Personaliza tus días y ejercicios</p>
                <div className="hidden md:block h-4 w-px bg-white/20"></div>
                <div className="min-h-[24px] flex items-center">
                  {getSaveStatusDisplay()}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleManualSave}
            disabled={isSaving || !isDirty}
            className={`w-full md:w-auto ${isDirty ? 'bg-amber-500 hover:bg-amber-600' : 'bg-white/10 text-white/50 cursor-not-allowed'} text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-lg`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isDirty ? 'Guardar Cambios' : 'Sin Cambios'}
          </Button>
        </motion.div>

        {/* Tools Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="card-dark p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-400" /> Herramientas
          </h2>
          <Button
            onClick={() => navigate('/calculator')}
            variant="outline"
            className="w-full justify-start h-auto py-4 px-4 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-left group"
          >
            <div className="bg-blue-500/20 p-2 rounded-lg mr-4 group-hover:bg-blue-500/30 transition-colors">
              <Calculator className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-white font-semibold block text-base">Calculadora de Calorías</span>
              <span className="text-blue-200/70 font-normal text-sm">Calcula tu TDEE y objetivos calóricos</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30 ml-auto group-hover:text-white/60 transition-colors" />
          </Button>
        </motion.div>

        {/* Preferences Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-400" /> Preferencias de Entrenamiento
          </h2>
          <div className="flex items-center space-x-2 bg-white/5 p-4 rounded-xl border border-white/10">
            <Checkbox
              id="rir-rpe"
              checked={plan.preferences?.trackIntensity || false}
              onCheckedChange={handlePreferenceChange}
              className="border-white/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label htmlFor="rir-rpe" className="text-white cursor-pointer flex-1">
              <span className="font-semibold block mb-1">Habilitar RIR / RPE (Intensidad)</span>
              <span className="text-white/60 font-normal text-xs block">
                Permite registrar Repeticiones en Reserva (RIR) y Esfuerzo Percibido (RPE) durante el entrenamiento para un control más avanzado de la fatiga.
              </span>
            </Label>
          </div>
        </motion.div>

        {/* Day Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-dark p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Días de entrenamiento</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {allDays.map(day => (
              <Button
                key={day}
                onClick={() => handleDayToggle(day)}
                variant={plan.training_days.includes(day) ? "default" : "outline"}
                className={`capitalize transition-all duration-200 ${plan.training_days.includes(day) ? 'bg-lime text-dark-bg border-none font-bold' : 'bg-dark-card-lighter border-dark-border hover:bg-dark-border text-gray-300'}`}
              >
                {day.substring(0, 3)}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Workouts List */}
        <AnimatePresence>
          {sortedTrainingDays.map((day, dayIndex) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.2 + dayIndex * 0.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white capitalize">{day}</h3>
                <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full">
                  {plan.workouts[day]?.exercises.length || 0} ejercicios
                </span>
              </div>

              <div className="space-y-4">
                {plan.workouts[day]?.exercises.map((ex, exIndex) => (
                  <div key={exIndex} className="bg-dark-card-lighter p-4 rounded-xl border border-dark-border hover:border-secondary/30 transition-colors">

                    {/* Main Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-3">
                      <div className="md:col-span-5 space-y-1.5">
                        <Label className="text-xs text-cyan uppercase font-bold tracking-wider">Ejercicio</Label>
                        <Input
                          value={ex.name}
                          onChange={(e) => handleExerciseChange(day, exIndex, 'name', e.target.value)}
                          placeholder="Ej: Press de banca"
                          className="bg-dark-card border-dark-border text-white placeholder:text-tertiary focus:bg-dark-card-lighter"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 md:col-span-6">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-cyan uppercase font-bold tracking-wider text-center block">Series</Label>
                          <Input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => handleExerciseChange(day, exIndex, 'sets', parseInt(e.target.value) || 0)}
                            className="bg-white/10 border-white/20 text-white text-center focus:bg-white/20"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-cyan uppercase font-bold tracking-wider text-center block">Reps</Label>
                          <Input
                            type="number"
                            value={ex.reps}
                            onChange={(e) => handleExerciseChange(day, exIndex, 'reps', parseInt(e.target.value) || 0)}
                            className="bg-white/10 border-white/20 text-white text-center focus:bg-white/20"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-cyan uppercase font-bold tracking-wider text-center block">Peso</Label>
                          <Input
                            type="number"
                            value={ex.weight}
                            onChange={(e) => handleExerciseChange(day, exIndex, 'weight', parseFloat(e.target.value) || 0)}
                            className="bg-white/10 border-white/20 text-white text-center focus:bg-white/20"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-1 flex justify-end pb-1">
                        <Button
                          onClick={() => removeExercise(day, exIndex)}
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>

                    {/* Goals / Targets Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-3 pt-2 pb-2 border-t border-b border-white/5">
                      <div className="md:col-span-12 flex items-center gap-2 mb-1">
                        <Target className="w-3 h-3 text-green-400" />
                        <Label className="text-xs text-green-400 uppercase font-bold tracking-wider">Objetivo / Meta</Label>
                      </div>

                      <div className="md:col-span-6 space-y-1.5">
                        <Label className="text-[10px] text-white/50 uppercase tracking-wider">Peso Objetivo (kg)</Label>
                        <Input
                          type="number"
                          value={ex.targetWeight || ''}
                          onChange={(e) => handleExerciseChange(day, exIndex, 'targetWeight', parseFloat(e.target.value) || '')}
                          placeholder="Ej: 100"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:bg-white/10 h-8 text-sm"
                        />
                      </div>
                      <div className="md:col-span-6 space-y-1.5">
                        <Label className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Fecha Límite
                        </Label>
                        <Input
                          type="date"
                          value={ex.targetDate || ''}
                          onChange={(e) => handleExerciseChange(day, exIndex, 'targetDate', e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:bg-white/10 h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Description / Notes Row */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-cyan uppercase font-bold tracking-wider flex items-center gap-2">
                        <StickyNote className="w-3 h-3" />
                        Notas / Técnica <span className="text-tertiary font-normal normal-case">(Opcional)</span>
                      </Label>
                      <Input
                        value={ex.description || ''}
                        onChange={(e) => handleExerciseChange(day, exIndex, 'description', e.target.value)}
                        placeholder="Ej: Mantener espalda recta, movimiento controlado, respiración constante..."
                        className="bg-dark-card border-dark-border text-white placeholder:text-tertiary focus:bg-dark-card-lighter w-full"
                      />
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-dark-border">
                      <div className="flex items-center gap-2">
                        <Video className="w-3 h-3 text-red-400" />
                        <Label className="text-xs text-red-300 uppercase font-bold tracking-wider">
                          Video YouTube <span className="text-white/30 font-normal normal-case">(Opcional)</span>
                        </Label>
                      </div>
                      <Input
                        value={ex.techniqueVideo || ''}
                        onChange={(e) => handleExerciseChange(day, exIndex, 'techniqueVideo', e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:bg-white/10"
                      />
                    </div>

                  </div>
                ))}
              </div>

              <Button
                onClick={() => addExercise(day)}
                variant="outline"
                className="w-full mt-4 border-dashed bg-transparent border-white/30 hover:bg-white/10 text-white hover:text-white hover:border-white/50"
              >
                <PlusCircle size={16} className="mr-2" /> Añadir Ejercicio
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bottom Sticky Save Button for Mobile */}
        <motion.div
          className="md:hidden fixed bottom-6 right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Button
            onClick={handleManualSave}
            disabled={!isDirty}
            size="icon"
            className={`h-14 w-14 rounded-full shadow-xl ${isDirty ? 'bg-lime glow-lime' : 'bg-dark-card-lighter cursor-not-allowed'}`}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          </Button>
        </motion.div>

        {sortedTrainingDays.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <p className="text-white text-lg">Selecciona los días que quieres entrenar arriba 👆</p>
          </div>
        )}
      </div>
    </div >
  );
}