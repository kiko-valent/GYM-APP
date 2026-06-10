import React, { useState, useMemo } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getUserPlan } from '@/utils/workoutData';
import { generateMonthlyPDF } from '@/utils/pdfGenerator';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const monthKeyOf = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function MonthlyReport({ history, userId }) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  // Meses con sesiones, más reciente primero
  const months = useMemo(() => {
    const keys = [...new Set(history.map(s => monthKeyOf(s.date)))];
    keys.sort((a, b) => b.localeCompare(a));
    return keys;
  }, [history]);

  const [selectedMonth, setSelectedMonth] = useState(months[0] || '');

  if (months.length === 0) return null;

  const monthLabel = (key) => {
    const [year, month] = key.split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} ${year}`;
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const plan = await getUserPlan(userId);
      const ok = generateMonthlyPDF(history, plan, selectedMonth || months[0]);
      if (!ok) {
        toast({ variant: 'destructive', title: 'Sin datos', description: 'No hay sesiones en ese mes.' });
      }
    } catch (e) {
      console.error('Error generating monthly PDF:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el informe.' });
    }
    setGenerating(false);
  };

  return (
    <div className="card-dark p-4 flex items-center gap-3">
      <div className="bg-cyan/20 p-2.5 rounded-xl shrink-0">
        <FileDown className="w-5 h-5 text-cyan" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">Informe mensual</p>
        <p className="text-secondary text-xs">PRs, evolución de e1RM y volumen por grupo</p>
      </div>
      <select
        value={selectedMonth || months[0]}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="h-9 px-2 rounded-md bg-dark-card border border-dark-border text-white text-sm focus:outline-none focus:border-cyan/50"
      >
        {months.map(m => (
          <option key={m} value={m}>{monthLabel(m)}</option>
        ))}
      </select>
      <Button
        onClick={handleDownload}
        disabled={generating}
        className="btn-lime px-4 shrink-0 disabled:opacity-50"
      >
        {generating ? '...' : 'PDF'}
      </Button>
    </div>
  );
}
