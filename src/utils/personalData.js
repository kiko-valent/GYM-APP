import { supabase } from '@/lib/customSupabaseClient';
import { readLocal, writeLocal } from '@/lib/localStore';
import { localDate } from './workoutModel';

export async function getPersonalData(userId) {
  const date = localDate(), key = `fittrack_body_${userId}`;
  const cached = readLocal(key, {});
  const results = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('weight_history').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(120),
    supabase.from('user_nutrition').select('*').eq('user_id', userId).eq('date', date).maybeSingle(),
  ]);
  const [profile, weights, nutrition] = results;
  const data = { profile: profile.error ? cached.profile || {} : profile.data || {},
    weights: weights.error ? cached.weights || [] : weights.data || [],
    nutrition: nutrition.error ? cached.nutrition?.date === date ? cached.nutrition : {} : nutrition.data || {},
    offline: results.some(result => result.error), date };
  writeLocal(key, data);
  return data;
}

export async function saveBodyWeight(userId, value, date = localDate()) {
  const weight = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(weight) || weight < 20 || weight > 500) return { error: new Error('Introduce un peso entre 20 y 500 kg.') };
  const existing = await supabase.from('weight_history').select('id').eq('user_id', userId).eq('date', date).limit(1);
  if (existing.error) return { error: existing.error };
  const query = existing.data?.[0]
    ? supabase.from('weight_history').update({ weight }).eq('id', existing.data[0].id).eq('user_id', userId)
    : supabase.from('weight_history').insert({ user_id: userId, date, weight });
  const result = await query;
  if (result.error) return { error: result.error };
  const profile = await supabase.from('user_profiles').upsert({ id: userId, current_weight: weight });
  return { error: null, profileError: profile.error, weight, date };
}

export async function saveDailyNutrition(userId, values, date = localDate()) {
  const calories = values.calories_kcal === '' ? null : Number(values.calories_kcal);
  const protein = values.protein_g === '' ? null : Number(values.protein_g);
  if ((calories != null && (!Number.isInteger(calories) || calories < 0 || calories > 15000)) || (protein != null && (!Number.isFinite(protein) || protein < 0 || protein > 1000))) {
    return { error: new Error('Revisa las calorías y la proteína: usa valores válidos y positivos.') };
  }
  return supabase.from('user_nutrition').upsert({ user_id: userId, date, calories_kcal: calories, protein_g: protein }, { onConflict: 'user_id,date' });
}
