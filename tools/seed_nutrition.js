import { createClient } from '@supabase/supabase-js';

// Config
const SUPABASE_URL = 'https://gnxclqonizujxckbbtgb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueGNscW9uaXp1anhja2JidGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTAzNjMsImV4cCI6MjA3Nzg2NjM2M30.sZpXEBrGouJNeKqMrRoyQsq_cpA63J5GCyrapg5NIfI'; // Anon Key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// User Credentials
const email = 'fjavierizquierdocarreras@gmail.com';
const password = 'Kikochelo13.';
let userId = '7a863ecc-c1ec-480a-8ff5-eba35db67c26';

// Detailed Weekly Plan
const weeklyPlan = {
    lunes: [
        {
            type: 'desayuno',
            name: 'Tostadas y fruta',
            ingredients: ['Pan o tortilla de trigo (3 ud / 75g)', 'Pechuga de pavo / Jamón (60g)', 'Queso tipo gusto (50g)', 'Tomate natural (opcional)', 'Pieza de fruta'],
            calories: 550, protein: 30, carbs: 60, fats: 18, time: 10
        },
        {
            type: 'comida',
            name: 'Verduras con patata y carne',
            ingredients: ['Judía verde / Acelga / Brócoli (al gusto)', 'Patata hervida/horno/airfryer (300g)', 'Pechuga pollo / Lomo cerdo / Pavo (180g)'],
            calories: 750, protein: 55, carbs: 70, fats: 20, time: 35
        },
        {
            type: 'merienda',
            name: 'Fruta y batido',
            ingredients: ['Leche entera sin lactosa (300ml)', 'Proteína Whey/Isolate (1 scoop)', 'Pieza de fruta', 'Frutos secos (50g)'],
            calories: 600, protein: 40, carbs: 45, fats: 30, time: 5
        },
        {
            type: 'cena',
            name: 'Carne a la plancha con huevos y ñoquis',
            ingredients: ['Carne a la plancha (180g)', 'Huevos M (2 ud)', 'Ñoquis (250g)', 'Postre: Yogur griego/natilla proteica'],
            calories: 850, protein: 50, carbs: 80, fats: 35, time: 20
        },
    ],
    martes: [
        {
            type: 'desayuno',
            name: 'Tostadas y fruta',
            ingredients: ['Pan o tortilla de trigo (3 ud / 75g)', 'Pechuga de pavo / Jamón (60g)', 'Queso tipo gusto (50g)', 'Fruta'],
            calories: 550, protein: 30, carbs: 60, fats: 18, time: 10
        },
        {
            type: 'comida',
            name: 'Legumbres y carne',
            ingredients: ['Lentejas/Legumbres (180g bote / 60g secas)', 'Patata hervida (100g)', 'Carne a la plancha (180g)', 'Verduras al gusto'],
            calories: 700, protein: 50, carbs: 65, fats: 15, time: 25
        },
        {
            type: 'merienda',
            name: 'Fruta y batido',
            ingredients: ['Leche entera sin lactosa (300ml)', 'Proteína Whey/Isolate (1 scoop)', 'Pieza de fruta', 'Frutos secos (50g)'],
            calories: 600, protein: 40, carbs: 45, fats: 30, time: 5
        },
        {
            type: 'cena',
            name: 'Hamburguesa completa',
            ingredients: ['Pan de hamburguesa', 'Hamburguesa pollo/pavo (120g)', 'Queso (30g)', 'Ñoquis (250g)', 'Lechuga, tomate, cebolla'],
            calories: 900, protein: 45, carbs: 90, fats: 30, time: 20
        },
    ],
    miercoles: [
        {
            type: 'desayuno',
            name: 'Tostadas y fruta',
            ingredients: ['Pan o tortilla de trigo (3 ud / 75g)', 'Pechuga de pavo / Jamón (60g)', 'Queso tipo gusto (50g)', 'Fruta'],
            calories: 550, protein: 30, carbs: 60, fats: 18, time: 10
        },
        {
            type: 'comida',
            name: 'Arroz o pasta con tomate y carne',
            ingredients: ['Arroz blanco o pasta (140g seco)', 'Carne a la plancha (180g)', 'Queso (40g)', 'Salsa de tomate (200g)', 'Verduras al gusto'],
            calories: 850, protein: 50, carbs: 110, fats: 20, time: 25
        },
        {
            type: 'merienda',
            name: 'Fruta y batido',
            ingredients: ['Leche entera sin lactosa (300ml)', 'Proteína Whey/Isolate (1 scoop)', 'Pieza de fruta', 'Frutos secos (50g)'],
            calories: 600, protein: 40, carbs: 45, fats: 30, time: 5
        },
        {
            type: 'cena',
            name: 'Tortilla de atún, queso y verduras',
            ingredients: ['Huevos M (3 ud)', 'Atún al natural (2 latas)', 'Queso (40g)', 'Verduras al gusto', 'Postre: Yogur griego'],
            calories: 550, protein: 55, carbs: 10, fats: 30, time: 15
        },
    ],
    jueves: [
        {
            type: 'desayuno',
            name: 'Tostadas y fruta',
            ingredients: ['Pan o tortilla de trigo (3 ud / 75g)', 'Pechuga de pavo / Jamón (60g)', 'Queso tipo gusto (50g)', 'Fruta'],
            calories: 550, protein: 30, carbs: 60, fats: 18, time: 10
        },
        {
            type: 'comida',
            name: 'Carne con patatas y verduras',
            ingredients: ['Verduras salteadas/horno', 'Patata (350g)', 'Carne a la plancha (180g)'],
            calories: 700, protein: 50, carbs: 65, fats: 15, time: 30
        },
        {
            type: 'merienda',
            name: 'Fruta y batido',
            ingredients: ['Leche entera sin lactosa (300ml)', 'Proteína Whey/Isolate (1 scoop)', 'Pieza de fruta', 'Frutos secos (50g)'],
            calories: 600, protein: 40, carbs: 45, fats: 30, time: 5
        },
        {
            type: 'cena',
            name: 'Ñoquis con huevos y jamón',
            ingredients: ['Huevos a la plancha M (3 ud)', 'Ñoquis (300g)', 'Jamón a tiras (70g)', 'Verduras al gusto', 'Postre: Yogur griego'],
            calories: 850, protein: 50, carbs: 90, fats: 35, time: 20
        },
    ],
    viernes: [
        {
            type: 'desayuno',
            name: 'Tostadas y fruta',
            ingredients: ['Pan o tortilla de trigo (3 ud / 75g)', 'Pechuga de pavo / Jamón (60g)', 'Queso tipo gusto (50g)', 'Fruta'],
            calories: 550, protein: 30, carbs: 60, fats: 18, time: 10
        },
        {
            type: 'comida',
            name: 'Pasta con tomate, carne y queso',
            ingredients: ['Pasta (140g)', 'Salsa de tomate (200g)', 'Carne al gusto (180g)', 'Queso (40g)', 'Verduras'],
            calories: 850, protein: 55, carbs: 110, fats: 25, time: 25
        },
        {
            type: 'merienda',
            name: 'Fruta y batido',
            ingredients: ['Leche entera sin lactosa (300ml)', 'Proteína Whey/Isolate (1 scoop)', 'Pieza de fruta', 'Frutos secos (50g)'],
            calories: 600, protein: 40, carbs: 45, fats: 30, time: 5
        },
        {
            type: 'cena',
            name: 'Filete de carne con patatas',
            ingredients: ['Carne a la plancha (180g)', 'Patata (300g)', 'Verduras al gusto', 'Postre: Yogur griego'],
            calories: 650, protein: 45, carbs: 55, fats: 20, time: 25
        },
    ],
    sabado: [
        {
            type: 'desayuno',
            name: 'Leche con cereales',
            ingredients: ['Leche entera sin lactosa (400ml)', 'Cereales (50g)', 'Pieza de fruta'],
            calories: 450, protein: 20, carbs: 65, fats: 12, time: 5
        },
        {
            type: 'comida',
            name: 'Ensalada de pasta',
            ingredients: ['Pasta o Arroz (90g seco)', 'Atún (2 latas)', 'Queso (40g)', 'Olivas (30g)', 'Huevo duro (1 ud)', 'Verduras'],
            calories: 750, protein: 45, carbs: 70, fats: 30, time: 15
        },
        {
            type: 'merienda',
            name: 'Fruta y batido',
            ingredients: ['Leche entera sin lactosa (300ml)', 'Proteína Whey/Isolate (1 scoop)', 'Pieza de fruta', 'Frutos secos (50g)'],
            calories: 600, protein: 40, carbs: 45, fats: 30, time: 5
        },
        {
            type: 'cena',
            name: 'CENA LIBRE',
            ingredients: ['ELIGE LO QUE QUIERAS (800-1000 kcal de margen)', 'Prioriza alimentos saludables y altos en proteína'],
            calories: 900, protein: 30, carbs: 80, fats: 40, time: 0
        },
    ],
    domingo: [
        {
            type: 'desayuno',
            name: 'Leche con cereales',
            ingredients: ['Leche entera sin lactosa (400ml)', 'Cereales (50g)', 'Pieza de fruta'],
            calories: 450, protein: 20, carbs: 65, fats: 12, time: 5
        },
        {
            type: 'comida',
            name: 'Pollo al horno con patatas',
            ingredients: ['Pollo o carne (250g)', 'Patatas (350g)', 'Verduras al gusto', 'Postre: Yogur griego'],
            calories: 750, protein: 60, carbs: 65, fats: 25, time: 45
        },
        {
            type: 'merienda',
            name: 'Fruta y batido',
            ingredients: ['Leche entera sin lactosa (300ml)', 'Proteína Whey/Isolate (1 scoop)', 'Pieza de fruta', 'Frutos secos (50g)'],
            calories: 600, protein: 40, carbs: 45, fats: 30, time: 5
        },
        {
            type: 'cena',
            name: 'Fajitas de ternera',
            ingredients: ['Tortillas de trigo grandes (2 ud)', 'Carne pavo/ternera/pollo (180g)', 'Queso (50g)', 'Salsa tomate (100g)', 'Verduras'],
            calories: 850, protein: 55, carbs: 75, fats: 35, time: 20
        },
    ],
};

async function seedNutrition() {
    console.log(`Authenticating as ${email}...`);

    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        return;
    }

    if (session && session.user) {
        console.log('Login successful. User ID:', session.user.id);
        userId = session.user.id;
    }

    console.log(`Starting seed for userId: ${userId}`);

    // 1. Create Nutrition Plan
    // 1. Check if plan exists
    let { data: plan, error: fetchError } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'Row not found'
        console.error('Error fetching plan:', fetchError);
        return;
    }

    if (!plan) {
        console.log('Plan not found, creating new one...');
        const { data: newPlan, error: createError } = await supabase
            .from('nutrition_plans')
            .insert({
                user_id: userId,
                target_calories: 2700,
                goal: 'Recomposición corporal'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating plan:', createError);
            return;
        }
        plan = newPlan;
    } else {
        console.log('Plan found, updating...');
        const { data: updatedPlan, error: updateError } = await supabase
            .from('nutrition_plans')
            .update({
                target_calories: 2700,
                goal: 'Recomposición corporal'
            })
            .eq('id', plan.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating plan:', updateError);
            return;
        }
        plan = updatedPlan;
    }

    console.log('Nutrition Plan created/found:', plan.id);

    // 2. Clear existing meals for this plan
    await supabase.from('daily_meals').delete().eq('plan_id', plan.id);

    // 3. Insert Meals
    const mealsToInsert = [];

    for (const [day, meals] of Object.entries(weeklyPlan)) {
        meals.forEach(meal => {
            mealsToInsert.push({
                plan_id: plan.id,
                day_of_week: day,
                meal_type: meal.type,
                name: meal.name,
                ingredients: meal.ingredients,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats,
                prep_time_minutes: meal.time
            });
        });
    }

    const { error: mealsError } = await supabase
        .from('daily_meals')
        .insert(mealsToInsert);

    if (mealsError) {
        console.error('Error inserting meals:', mealsError);
    } else {
        console.log(`Successfully inserted ${mealsToInsert.length} meals for the week.`);
    }
}

seedNutrition();
