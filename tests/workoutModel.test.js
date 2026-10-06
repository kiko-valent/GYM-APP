import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlanData, planRevision, reconcileProgress, validatePlan, timerRemaining, weightTrend, localDate } from '../src/utils/workoutModel.js';
import { getSuggestion } from '../src/utils/progression.js';
import { enqueueSave, drainSaves } from '../src/lib/saveQueue.js';

const raw = { training_days:['miercoles'], workouts:{ miercoles:{ exercises:[
  {name:'Press',sets:2,repsMin:6,repsMax:8}, {name:'Remo',sets:1,repsMin:8,repsMax:12},
] } } };
const plan = normalizePlanData(raw), exercises = plan.workouts['miércoles'].exercises;
const row = (exercise, updatedAt, sets, completed=false) => ({exerciseId:exercise.id,exerciseName:exercise.name,updatedAt,sets,completed});

test('normaliza días y conserva la identidad al reordenar un plan antiguo', () => {
  assert.deepEqual(plan.training_days,['miércoles']);
  const reordered = normalizePlanData({...raw,workouts:{miercoles:{exercises:[...raw.workouts.miercoles.exercises].reverse()}}});
  assert.equal(reordered.workouts['miércoles'].exercises[1].id,exercises[0].id);
  assert.equal(planRevision(reordered.workouts['miércoles'].exercises),planRevision(exercises));
});
test('rechaza nombres vacíos, series inválidas y rangos incoherentes', () => {
  assert.equal(validatePlan(plan),null);
  for (const changes of [{name:''},{sets:0},{sets:-1},{sets:1.5},{repsMin:10,repsMax:8},{rest:0},{increment:-1}]) {
    const edited=structuredClone(plan); Object.assign(edited.workouts['miércoles'].exercises[0],changes); assert.ok(validatePlan(edited));
  }
});
test('no mezcla series al cambiar el orden de ejercicios', () => {
  const restored=reconcileProgress([...exercises].reverse(),{0:row(exercises[0],'2026-10-06T10:00:00Z',[{reps:8,weight:60}])},null,planRevision(exercises));
  assert.equal(restored[0].sets.length,0); assert.equal(restored[1].sets[0].weight,60);
});
test('elige la copia más reciente por ejercicio, incluida una corrección a cero series', () => {
  const local={0:row(exercises[0],'2026-10-06T11:00:00Z',[])};
  const remote={0:row(exercises[0],'2026-10-06T10:00:00Z',[{reps:8,weight:60}]),1:row(exercises[1],'2026-10-06T12:00:00Z',[{reps:10,weight:35}],true)};
  const restored=reconcileProgress(exercises,local,remote,planRevision(exercises));
  assert.equal(restored[0].sets.length,0); assert.equal(restored[1].completed,true);
});
test('rechaza borradores por índice sin identidad, otra versión o series corruptas', () => {
  const candidates={0:{sets:[{weight:60,reps:8}],completed:true},1:{...row(exercises[1],'2026-10-06T10:00:00Z',[{weight:-1,reps:10}],true)}};
  assert.equal(reconcileProgress(exercises,candidates,null,planRevision(exercises))[0].sets.length,0);
  assert.equal(reconcileProgress(exercises,candidates,null,planRevision(exercises))[1].sets.length,0);
  const obsolete={0:{...row(exercises[0],'2026-10-06T10:00:00Z',[{weight:60,reps:8}]),revision:'otra'}};
  assert.equal(reconcileProgress(exercises,obsolete,null,planRevision(exercises))[0].sets.length,0);
});
test('un ejercicio completo exige todas sus series, no solo el flag', () => {
  const restored=reconcileProgress(exercises,{0:row(exercises[0],'2026-10-06T10:00:00Z',[{weight:60,reps:8}],true)},null,planRevision(exercises));
  assert.equal(restored[0].completed,false);
});
test('temporizador absoluto: pasar a otra app no detiene el tiempo', () => {
  const timer={running:true,endsAt:100000,duration:90};
  assert.equal(timerRemaining(timer,60000),40);assert.equal(timerRemaining(timer,120000),0);
  assert.equal(timerRemaining({running:false,remaining:27},120000),27);
});
test('la tendencia compara medias con suficientes días y no duplica pesajes', () => {
  const now=new Date(2026,9,6,12); const entries=[];
  for(let i=0;i<14;i++){const d=new Date(now);d.setDate(d.getDate()-i);entries.push({date:localDate(d),weight:i<7?78:79});}
  entries.push({date:localDate(now),weight:100});
  const trend=weightTrend(entries,now); assert.equal(trend.average,78);assert.equal(trend.change,-1);assert.equal(trend.count,7);
  assert.equal(weightTrend(entries.slice(0,2),now).change,null);
});
test('en déficit no exige subir ni descarga por una sola sesión floja', () => {
  const previous={sets:[{weight:60,reps:4,rir:0}]};
  assert.equal(getSuggestion(previous,exercises[0],'deficit').type,'maintain');
});
test('progresión usa microcargas y exige RIR registrado para subir', () => {
  const ex={...exercises[0],increment:1.25};
  assert.equal(getSuggestion({sets:[{weight:60,reps:8,rir:2},{weight:60,reps:8,rir:2}]},ex).weight,61.25);
  assert.equal(getSuggestion({sets:[{weight:60,reps:8,rir:null}]},ex).type,'maintain');
});
test('los guardados se ordenan y la limpieza espera incluso cuando uno falla', async () => {
  const events=[];
  const first=enqueueSave('test-session',async()=>{await new Promise(r=>setTimeout(r,25));events.push('first');throw new Error('simulated');}).catch(()=>{});
  const last=enqueueSave('test-session',async()=>{events.push('completed');});
  await drainSaves('test-session');events.push('cleanup');await Promise.all([first,last]);
  assert.deepEqual(events,['first','completed','cleanup']);
});
