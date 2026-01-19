import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Check, ThumbsUp, Smile, Meh, Frown, Annoyed as Tired } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const feelings = [
  { emoji: <ThumbsUp size={28} />, label: 'Excelente', value: 5, color: 'text-lime' },
  { emoji: <Smile size={28} />, label: 'Bien', value: 4, color: 'text-cyan' },
  { emoji: <Meh size={28} />, label: 'Normal', value: 3, color: 'text-yellow-400' },
  { emoji: <Frown size={28} />, label: 'Cansado', value: 2, color: 'text-orange-400' },
  { emoji: <Tired size={28} />, label: 'Agotado', value: 1, color: 'text-red-400' }
];

export default function WorkoutEvaluation({ onComplete }) {
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [notes, setNotes] = useState('');

  const handleComplete = () => {
    onComplete({
      feeling: selectedFeeling,
      notes
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-dark-card border border-dark-border rounded-3xl p-6 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-lime to-cyan w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Star className="w-10 h-10 text-dark-bg" fill="currentColor" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="text-lime">¡Entrenamiento</span>{' '}
          <span className="text-cyan">Completado!</span>
        </h2>
        <p className="text-secondary">¿Cómo te has sentido?</p>
      </div>

      {/* Feelings Grid */}
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {feelings.map(feeling => (
            <motion.button
              key={feeling.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedFeeling(feeling.value)}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${selectedFeeling === feeling.value
                  ? 'bg-dark-card-lighter border-lime shadow-lg'
                  : 'bg-dark-bg border-dark-border hover:border-dark-border/80 hover:bg-dark-card-lighter/50'
                }`}
            >
              <div className={selectedFeeling === feeling.value ? 'text-lime' : feeling.color}>
                {feeling.emoji}
              </div>
              <p className={`text-xs font-medium ${selectedFeeling === feeling.value ? 'text-white' : 'text-secondary'
                }`}>
                {feeling.label}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-cyan" />
            <span className="text-white font-medium">Notas</span>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Algo que quieras recordar sobre este entrenamiento?"
            className="bg-dark-bg border-dark-border text-white placeholder:text-secondary/60 min-h-[100px] focus:border-cyan focus:ring-cyan/20"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleComplete}
        disabled={!selectedFeeling}
        className="w-full btn-lime py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check className="w-5 h-5 mr-2" />
        Guardar y Finalizar
      </Button>
    </motion.div>
  );
}