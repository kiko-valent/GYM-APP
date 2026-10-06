import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { localDate } from '../src/utils/workoutModel.js';

// El módulo real se carga con un cliente simulado: las pruebas nunca conectan a Supabase.
const values = new Map();
globalThis.localStorage = { getItem:key=>values.get(key) || null, setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key) };
globalThis.window = { dispatchEvent(){} };
const local = await import('../src/lib/localStore.js');
const model = await import('../src/utils/workoutModel.js');
const queue = await import('../src/lib/saveQueue.js');
let client;
globalThis.__fittrackTest = { local, model, queue, get client(){return client;} };
const source = fs.readFileSync(new URL('../src/utils/workoutData.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
const prelude=`const { local, model, queue } = globalThis.__fittrackTest;
const supabase = new Proxy({}, {get:(_,name) => globalThis.__fittrackTest.client[name]});
const { localDate, normalizeDayName, normalizePlanData, validatePlan, validSets } = model;
const { readLocal, writeLocal, removeLocal, newId } = local;
const { enqueueSave, drainSaves } = queue;
const logError = () => {};
`;
const module = await import(`data:text/javascript;base64,${Buffer.from(prelude+source).toString('base64')}`);

test('rechaza series incompletas antes de intentar guardarlas en el servidor', async () => {
  let calls=0; client={rpc:async()=>{calls++;return {error:null};}};
  const result=await module.saveWorkoutSession('invalid-u',{sessionKey:'session-invalid',exercises:[{name:'Press',sets:[{weight:'',reps:8}]}]});
  assert.ok(result.error); assert.equal(calls,0);
});

test('una lectura antigua no sobrescribe la rutina que se acaba de guardar', async () => {
  const oldPlan={training_days:['lunes'],workouts:{lunes:{exercises:[{name:'Press',sets:2,reps:8}]}}};
  const nextPlan={...oldPlan,preferences:{phase:'maintenance'}};
  let resolveRead;
  client={from:()=>({select:()=>({eq:()=>({maybeSingle:()=>new Promise(resolve=>{resolveRead=resolve;})})}),
    upsert:()=>({select:async()=>({data:[{plan_data:nextPlan}],error:null})})})};
  const pending=module.getUserPlan('race-plan-u',{fresh:true});
  assert.equal((await module.updateUserPlan('race-plan-u',nextPlan)).error,null);
  resolveRead({data:{plan_data:oldPlan},error:null});
  assert.equal((await pending).preferences.phase,'maintenance');
  assert.equal((await module.getUserPlan('race-plan-u')).preferences.phase,'maintenance');
});

test('no recupera progreso de otra fecha y mantiene intacto el original', () => {
  values.set('workout_progress_u_lunes',JSON.stringify({savedAt:'2020-01-01T12:00:00Z',exercisesState:{0:{sets:[]}}}));
  assert.equal(module.loadWorkoutProgress('u','lunes'),null);
  assert.ok(values.has('workout_progress_u_lunes'));
});
test('el borrador conserva el mismo ID entre series y la fecha de inicio', () => {
  const first=module.saveWorkoutProgress('u','martes',{},0);
  const next=module.saveWorkoutProgress('u','martes',{0:{sets:[{weight:62.5,reps:8}]}},0);
  assert.equal(first.sessionKey,next.sessionKey); assert.equal(first.startedAt,next.startedAt);
  assert.equal(module.loadWorkoutProgress('u','martes').exercisesState[0].sets[0].weight,62.5);
});
test('borrar espera a los upserts pendientes y conserva los decimales exactos', async () => {
  const operations=[];
  client={from:()=>({upsert:async payload=>{await new Promise(r=>setTimeout(r,20));operations.push(payload);return {error:null};},delete:()=>{
    const query={eq:()=>query,then:resolve=>Promise.resolve({error:null}).then(value=>{operations.push('delete');return resolve(value);})};return query;
  }})};
  const pending=module.saveExerciseProgressToSupabase('u','martes',0,'Press',[{reps:8,weight:62.5}],false);
  await module.clearWorkoutProgressFromSupabase('u','martes');await pending;
  assert.equal(operations[0].sets_data[0].weight,62.5);assert.equal(operations.at(-1),'delete');
});
test('una sesión finalizada no resucita por un borrador remoto que no se pudo borrar', async () => {
  module.clearWorkoutProgress('u','martes');
  const query={select:()=>query,eq:()=>query,then:resolve=>Promise.resolve({data:[{exercise_index:0,exercise_name:'Press',sets_data:[{weight:60,reps:8}],completed:true,updated_at:'2020-01-01T00:00:00Z'}],error:null}).then(resolve)};
  client={from:()=>query};
  assert.deepEqual((await module.loadWorkoutProgressFromSupabase('u','martes')).exercisesState,{});
});
test('dos pulsaciones al finalizar comparten un solo guardado remoto', async () => {
  let calls=0;
  client={rpc:async()=>{calls++;await new Promise(r=>setTimeout(r,20));return {error:null};}};
  const session={sessionKey:crypto.randomUUID(),date:new Date().toISOString(),day:'martes',evaluation:{feeling:4,notes:''},exercises:[{name:'Press',sets:[{reps:8,weight:62.5}]}]};
  const result=await Promise.all([module.saveWorkoutSession('u',session),module.saveWorkoutSession('u',session)]);
  assert.equal(calls,1);assert.ok(result.every(value=>!value.error));
});
test('un error al guardar la rutina se devuelve al caller', async () => {
  const query={upsert:()=>query,select:()=>query,then:resolve=>Promise.resolve({error:{message:'Simulated rejection'}}).then(resolve)};
  client={from:()=>query};
  const routine={training_days:['martes'],workouts:{martes:{exercises:[{name:'Press',sets:2,repsMin:6,repsMax:8}]}}};
  const result=await module.updateUserPlan('u',routine);assert.equal(result.error.message,'Simulated rejection');
});
test('sin conexión y sin copia de rutina no se inventa un plan ni se escribe en la BD', async () => {
  let writes=0;const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({error:{message:'offline'}}),upsert:()=>{writes++;return query;}};
  client={from:()=>query};
  await assert.rejects(module.getUserPlan('new-user'));assert.equal(writes,0);
});
test('la fecha guardada es local y no cambia al convertir a UTC', () => {
  assert.match(localDate(new Date(2026,9,6,0,5)),/^2026-10-06$/);
});
