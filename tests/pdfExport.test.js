import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as progression from '../src/utils/progression.js';

// Se ejecuta el generador real con las librerías nuevas. Solo sustituimos la descarga.
const outputs=[];
globalThis.__pdfExportTest={autoTable,progression,jsPDF:class {
  constructor(options){const doc=new jsPDF(options);doc.save=filename=>outputs.push({filename,content:doc.output(),pages:doc.internal.getNumberOfPages()});return doc;}
}};
const source=fs.readFileSync(new URL('../src/utils/pdfGenerator.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
const prelude='const {jsPDF,autoTable,progression}=globalThis.__pdfExportTest; const {epley1RM,buildMuscleGroupMap,muscleGroupLabel}=progression;';
const generator=await import(`data:text/javascript;base64,${Buffer.from(prelude+source).toString('base64')}`);

test('el PDF de una sesión conserva pesos decimales y produce un documento válido',()=>{
  generator.generateWorkoutPDF([{name:'Press',sets:[{weight:62.5,reps:8,rir:2},{weight:63.75,reps:7,rir:1}]}],'2026-10-06T12:00:00Z','Martes');
  const output=outputs.at(-1);
  assert.ok(output.content.startsWith('%PDF-')); assert.match(output.content,/62\.5/); assert.match(output.content,/63\.75/);
  assert.equal(output.pages,1);assert.match(output.filename,/\.pdf$/);
});
test('el informe mensual genera tablas con las librerías actualizadas',()=>{
  const plan={workouts:{martes:{exercises:[{name:'Press',muscleGroup:'pecho'}]}}};
  const history=[{date:'2026-10-06T12:00:00Z',evaluation:{feeling:4,setOrder:[{name:'Press',muscleGroup:'pecho'}]},workout_exercises:[{exercise_name:'Press',weight:62.5,reps:8,rir:2}]}];
  assert.equal(generator.generateMonthlyPDF(history,plan,'2026-10'),true);
  const output=outputs.at(-1);assert.ok(output.content.startsWith('%PDF-'));assert.ok(output.content.includes('Press'));assert.ok(output.pages>=1);
});
