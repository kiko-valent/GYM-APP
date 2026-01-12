import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Check, ThumbsUp, Smile, Meh, Frown, Annoyed as Tired } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const feelings = [
  { emoji: <ThumbsUp size={36} />, label: 'Excelente', value: 5, color: 'text-green-400' },
  { emoji: <Smile size={36} />, label: 'Bien', value: 4, color: 'text-blue-400' },
  { emoji: <Meh size={36} />, label: 'Normal', value: 3, color: 'text-yellow-400' },
  { emoji: <Frown size={36} />, label: 'Cansado', value: 2, color: 'text-orange-400' },
  { emoji: <Tired size={36} />, label: 'Agotado', value: 1, color: 'text-red-400' }
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
      className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
    >
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">¡Entrenamiento Completado! 🎉</h2>
        <p className="text-blue-200">¿Cómo te has sentido?</p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-5 gap-3">
          {feelings.map(feeling => (
            <motion.button
              key={feeling.value}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedFeeling(feeling.value)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                selectedFeeling === feeling.value
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-white'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
            >
              <div className={selectedFeeling === feeling.value ? 'text-white' : feeling.color}>
                {feeling.emoji}
              </div>
              <p className="text-white text-xs font-medium">{feeling.label}</p>
            </motion.button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-300" />
            <span className="text-white font-medium">Notas</span>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Algo que quieras recordar sobre este entrenamiento?"
            className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 min-h-[100px]"
          />
        </div>
      </div>

      <Button
        onClick={handleComplete}
        disabled={!selectedFeeling}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 rounded-xl text-lg disabled:opacity-50"
      >
        <Check className="w-5 h-5 mr-2" />
        Guardar y Finalizar
      </Button>
    </motion.div>
  );
}