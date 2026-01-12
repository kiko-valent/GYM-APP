import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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