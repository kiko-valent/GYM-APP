import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ChefHat, FileText, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient'; // Assumed client
import ResourceSection from '@/components/nutrition/ResourceSection';

export default function NutritionPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Capitalize first letter helper
    const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

    const getDayName = (date) => {
        return date.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    };

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    useEffect(() => {
        const fetchNutrition = async () => {
            if (user) {
                setLoading(true);
                const dayName = getDayName(selectedDate);

                // First get plan id
                const { data: plan } = await supabase
                    .from('nutrition_plans')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (plan) {
                    const { data: dailyMeals } = await supabase
                        .from('daily_meals')
                        .select('*')
                        .eq('plan_id', plan.id)
                        .eq('day_of_week', dayName); // Query by day name (lunes, martes...)
                    setMeals(dailyMeals || []);
                }
                setLoading(false);
            }
        };
        fetchNutrition();
    }, [user, selectedDate]);

    // Translation map for meal types (DB uses English or Spanish mixed, covering both)
    const mealTranslations = {
        'breakfast': 'Desayuno',
        'lunch': 'Comida',
        'dinner': 'Cena',
        'snack': 'Merienda',
        'desayuno': 'Desayuno',
        'comida': 'Comida',
        'cena': 'Cena',
        'merienda': 'Merienda'
    };

    // Sort order for display
    const mealOrder = ['breakfast', 'desayuno', 'lunch', 'comida', 'snack', 'merienda', 'dinner', 'cena'];

    const sortedMeals = [...meals].sort((a, b) => {
        return mealOrder.indexOf(a.meal_type) - mealOrder.indexOf(b.meal_type);
    });

    const isToday = new Date().toDateString() === selectedDate.toDateString();

    return (
        <div className="min-h-screen p-4 md:p-8 bg-dark-bg">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-dark-card border-dark-border text-white hover:bg-dark-card-lighter">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <h1 className="text-3xl font-bold text-white">Mi Alimentación</h1>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        {/* Day Navigation */}
                        <div className="flex items-center justify-between bg-dark-card p-4 rounded-xl border border-dark-border">
                            <Button
                                onClick={handlePrevDay}
                                variant="ghost"
                                className="text-secondary hover:text-white hover:bg-white/5"
                            >
                                ← Anterior
                            </Button>

                            <div className="text-center">
                                <h2 className="text-lg font-bold text-white capitalize">
                                    {getDayName(selectedDate)}
                                </h2>
                                <p className="text-xs text-secondary">
                                    {isToday ? '(Hoy)' : selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>

                            <Button
                                onClick={handleNextDay}
                                variant="ghost"
                                className="text-secondary hover:text-white hover:bg-white/5"
                            >
                                Siguiente →
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-secondary animate-pulse">Cargando menú...</p>
                            </div>
                        ) : sortedMeals.length > 0 ? (
                            sortedMeals.map((meal) => (
                                <motion.div
                                    key={meal.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card-dark p-6"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-cyan text-xs font-bold uppercase tracking-wider">
                                                {mealTranslations[meal.meal_type] || meal.meal_type}
                                            </span>
                                            <h3 className="text-xl font-bold text-white mt-1">{meal.name}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            {meal.prep_time_minutes && (
                                                <div className="flex items-center gap-1 text-secondary text-xs bg-dark-card-lighter px-2 py-1 rounded-full">
                                                    <Clock className="w-3 h-3" /> {meal.prep_time_minutes} min
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-white text-sm font-semibold mb-2">Ingredientes:</h4>
                                        <ul className="text-secondary text-sm space-y-1 ml-4 list-disc">
                                            {meal.ingredients?.map((ing, i) => (
                                                <li key={i}>{ing}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex gap-3">
                                        {meal.recipe_video_url && (
                                            <Button
                                                variant="outline"
                                                className="gap-2 border-lime/30 text-lime hover:bg-lime/10"
                                                onClick={() => window.open(meal.recipe_video_url, '_blank')}
                                            >
                                                <ChefHat className="w-4 h-4" />
                                                Ver Preparación
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="card-dark p-8 text-center">
                                <p className="text-secondary">No hay comidas planificadas para este día.</p>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-1">
                        <ResourceSection />
                    </div>
                </div>
            </div>
        </div>
    );
}
