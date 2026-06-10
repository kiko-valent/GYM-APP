import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { epley1RM, buildMuscleGroupMap, muscleGroupLabel } from '@/utils/progression';

export const generateWorkoutPDF = (workoutData, date, dayTitle) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Title
  doc.setFontSize(18);
  doc.text(`Resumen de Entrenamiento - ${dayTitle}`, 14, 22);
  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date(date).toLocaleDateString()}`, 14, 30);

  // Calculate max sets to determine columns
  let maxSets = 0;
  workoutData.forEach(ex => {
    if (ex.sets && ex.sets.length > maxSets) {
      maxSets = ex.sets.length;
    }
  });
  
  // Ensure at least 1 set column if data is empty (edge case)
  if (maxSets === 0) maxSets = 1;

  // Headers configuration matching the requested professional table style
  // Row 1: Main Headers
  const headRow1 = [
    { 
      content: 'EJERCICIOS', 
      rowSpan: 2, 
      styles: { 
        valign: 'middle', 
        halign: 'center', 
        fillColor: [200, 200, 200], 
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      } 
    }
  ];
  
  // Row 2: Sub Headers (KG/RP)
  const headRow2 = [];

  for (let i = 1; i <= maxSets; i++) {
    headRow1.push({ 
      content: `${i}ª Serie`, 
      colSpan: 2, 
      styles: { 
        halign: 'center', 
        fillColor: [220, 220, 220], 
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      } 
    });
    headRow2.push({ 
      content: 'KG', 
      styles: { 
        halign: 'center', 
        fillColor: [240, 240, 240], 
        textColor: [0, 0, 0],
        fontStyle: 'bold' 
      } 
    });
    headRow2.push({ 
      content: 'RP', 
      styles: { 
        halign: 'center', 
        fillColor: [240, 240, 240], 
        textColor: [0, 0, 0],
        fontStyle: 'bold' 
      } 
    });
  }

  // Prepare Body Data
  const body = [];
  workoutData.forEach(exercise => {
    // Exercise Name Row
    const row = [{ 
      content: exercise.name, 
      styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } 
    }];
    
    // Fill data for sets
    for (let i = 0; i < maxSets; i++) {
      const set = exercise.sets[i];
      if (set) {
        row.push({ content: set.weight.toString(), styles: { halign: 'center' } });
        row.push({ content: set.reps.toString(), styles: { halign: 'center' } });
      } else {
        // Empty cells for non-existent sets
        row.push({ content: '', styles: { halign: 'center' } });
        row.push({ content: '', styles: { halign: 'center' } });
      }
    }
    body.push(row);
  });

  autoTable(doc, {
    startY: 40,
    head: [headRow1, headRow2],
    body: body,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 60 } // Fixed width for Exercise Name column
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    doc.text('Generado por FitTrack', doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
  }

  doc.save(`entrenamiento_${dayTitle.replace(/\s+/g, '_')}_${new Date(date).toISOString().split('T')[0]}.pdf`);
};

// ==========================================
// Informe mensual
// ==========================================

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const monthKeyOf = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Días programados del mes según los training_days del plan (para adherencia)
function countScheduledDays(monthKey, trainingDays) {
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date > today) break; // no contar días futuros del mes en curso
    if (trainingDays.includes(DAY_NAMES[date.getDay()])) count++;
  }
  return count;
}

/**
 * Informe mensual: resumen, PRs del mes, evolución de e1RM por ejercicio
 * y series por grupo muscular.
 * @param {Array} history - sesiones (desc) con workout_exercises
 * @param {Object} plan - plan del usuario (training_days, workouts con muscleGroup)
 * @param {string} monthKey - 'YYYY-MM'
 * @returns {boolean} false si no hay sesiones en ese mes
 */
export const generateMonthlyPDF = (history, plan, monthKey) => {
  const monthSessions = history.filter(s => monthKeyOf(s.date) === monthKey);
  if (monthSessions.length === 0) return false;

  const [year, month] = monthKey.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  // ===== Datos =====
  const totalSets = monthSessions.reduce((sum, s) => sum + (s.workout_exercises?.length || 0), 0);
  const scheduled = countScheduledDays(monthKey, plan?.training_days || []);
  const adherence = scheduled > 0 ? Math.round((monthSessions.length / scheduled) * 100) : null;

  // Mejor e1RM por ejercicio ANTES del mes (para detectar PRs reales)
  const baseline = {};
  history.forEach(session => {
    if (monthKeyOf(session.date) >= monthKey) return;
    (session.workout_exercises || []).forEach(set => {
      const rm = epley1RM(set.weight, set.reps);
      if (!baseline[set.exercise_name] || rm > baseline[set.exercise_name]) {
        baseline[set.exercise_name] = rm;
      }
    });
  });

  // PRs del mes y series por sesión/ejercicio
  const prs = {}; // ejercicio -> { e1rm, weight, reps, date }
  const byExercise = {}; // ejercicio -> [{date, best1RM, topWeight}] asc
  const ascSessions = [...monthSessions].sort((a, b) => new Date(a.date) - new Date(b.date));

  ascSessions.forEach(session => {
    const grouped = {};
    (session.workout_exercises || []).forEach(set => {
      if (!grouped[set.exercise_name]) grouped[set.exercise_name] = [];
      grouped[set.exercise_name].push(set);
    });
    Object.entries(grouped).forEach(([name, sets]) => {
      const bestSet = sets.reduce((b, s) => (epley1RM(s.weight, s.reps) > epley1RM(b.weight, b.reps) ? s : b), sets[0]);
      const best1RM = epley1RM(bestSet.weight, bestSet.reps);
      const topWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0));

      if (!byExercise[name]) byExercise[name] = [];
      byExercise[name].push({ date: session.date, best1RM, topWeight, setCount: sets.length });

      const prevBest = Math.max(baseline[name] || 0, prs[name]?.e1rm || 0);
      if (best1RM > prevBest) {
        prs[name] = { e1rm: best1RM, weight: bestSet.weight, reps: bestSet.reps, date: session.date };
      }
    });
  });

  // Series por grupo muscular
  const groupMap = buildMuscleGroupMap(plan || {});
  const setsByGroup = {};
  monthSessions.forEach(session => {
    (session.workout_exercises || []).forEach(set => {
      const group = groupMap[set.exercise_name] || 'sin-asignar';
      setsByGroup[group] = (setsByGroup[group] || 0) + 1;
    });
  });
  const weeksElapsed = Math.max(1, Math.round(ascSessions.length > 0
    ? (new Date(ascSessions[ascSessions.length - 1].date) - new Date(ascSessions[0].date)) / (1000 * 60 * 60 * 24 * 7) + 1
    : 1));

  // ===== PDF =====
  const doc = new jsPDF(); // portrait
  const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  doc.setFontSize(18);
  doc.text(`Informe mensual — ${monthLabel}`, 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(90);
  const summaryParts = [
    `${monthSessions.length} sesiones`,
    `${totalSets} series`,
    `${Object.keys(prs).length} PRs`,
  ];
  if (adherence != null) summaryParts.push(`adherencia ${adherence}% (${monthSessions.length}/${scheduled} programadas)`);
  doc.text(summaryParts.join('  ·  '), 14, 28);
  doc.setTextColor(0);

  let cursorY = 36;

  // --- PRs del mes ---
  doc.setFontSize(13);
  doc.text('Récords del mes', 14, cursorY);
  const prRows = Object.entries(prs)
    .sort((a, b) => b[1].e1rm - a[1].e1rm)
    .map(([name, pr]) => [name, `${pr.weight} kg × ${pr.reps}`, `${pr.e1rm} kg`, fmtDate(pr.date)]);

  autoTable(doc, {
    startY: cursorY + 4,
    head: [['Ejercicio', 'Mejor serie', 'e1RM', 'Fecha']],
    body: prRows.length > 0 ? prRows : [['Sin récords nuevos este mes', '', '', '']],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [40, 40, 40] },
  });
  cursorY = doc.lastAutoTable.finalY + 12;

  // --- Evolución por ejercicio ---
  doc.setFontSize(13);
  doc.text('Evolución de cargas (e1RM)', 14, cursorY);
  const evoRows = Object.entries(byExercise)
    .filter(([, sessions]) => sessions.length >= 2)
    .map(([name, sessions]) => {
      const first = sessions[0];
      const last = sessions[sessions.length - 1];
      const delta = Math.round((last.best1RM - first.best1RM) * 10) / 10;
      return [
        name,
        `${first.best1RM} kg`,
        `${last.best1RM} kg`,
        `${delta > 0 ? '+' : ''}${delta} kg`,
        `${Math.max(...sessions.map(s => s.topWeight))} kg`,
      ];
    })
    .sort((a, b) => parseFloat(b[3]) - parseFloat(a[3]));

  autoTable(doc, {
    startY: cursorY + 4,
    head: [['Ejercicio', 'e1RM inicio', 'e1RM fin', 'Δ mes', 'Mejor peso']],
    body: evoRows.length > 0 ? evoRows : [['Se necesitan 2+ sesiones por ejercicio', '', '', '', '']],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [40, 40, 40] },
  });
  cursorY = doc.lastAutoTable.finalY + 12;

  // --- Series por grupo ---
  doc.setFontSize(13);
  doc.text('Volumen por grupo muscular', 14, cursorY);
  const groupRows = Object.entries(setsByGroup)
    .sort((a, b) => b[1] - a[1])
    .map(([group, sets]) => [
      group === 'sin-asignar' ? 'Sin asignar' : muscleGroupLabel(group),
      String(sets),
      `${Math.round((sets / weeksElapsed) * 10) / 10} series/semana`,
    ]);

  autoTable(doc, {
    startY: cursorY + 4,
    head: [['Grupo', 'Series del mes', 'Media semanal']],
    body: groupRows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [40, 40, 40] },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    doc.text('Generado por FitTrack', doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
  }

  doc.save(`informe_${monthKey}.pdf`);
  return true;
};