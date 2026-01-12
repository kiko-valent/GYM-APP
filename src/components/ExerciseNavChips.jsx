import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

/**
 * ExerciseNavChips - Horizontal scrollable navigation for workout exercises
 * Dark Modern Theme
 */
export default function ExerciseNavChips({
  exercises,
  currentIndex,
  exercisesState = {},
  onNavigate
}) {
  const scrollContainerRef = useRef(null);
  const activeChipRef = useRef(null);

  // Auto-scroll to keep active chip visible
  useEffect(() => {
    if (activeChipRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const chip = activeChipRef.current;

      const containerRect = container.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();

      if (chipRect.left < containerRect.left || chipRect.right > containerRect.right) {
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentIndex]);

  const getChipStatus = (index) => {
    const state = exercisesState[index];
    if (!state) return 'pending';
    if (state.completed) return 'completed';
    if (state.sets && state.sets.length > 0) return 'in-progress';
    return 'pending';
  };

  const getChipStyles = (index) => {
    const isActive = index === currentIndex;
    const status = getChipStatus(index);

    let baseClasses = 'flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ';

    if (isActive) {
      // Active chip - Lime green
      baseClasses += 'bg-lime text-dark-bg font-bold shadow-lime-glow';
    } else if (status === 'completed') {
      // Completed - Cyan outline
      baseClasses += 'bg-transparent border-2 border-cyan text-cyan hover:bg-cyan/10';
    } else if (status === 'in-progress') {
      // In progress - Amber
      baseClasses += 'bg-amber-500/20 border-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/30';
    } else {
      // Pending - Dark subtle
      baseClasses += 'bg-dark-card-lighter border-2 border-transparent text-secondary hover:text-white hover:bg-dark-border';
    }

    return baseClasses;
  };

  const getStatusIcon = (index) => {
    const status = getChipStatus(index);

    if (status === 'completed') {
      return <Check className="w-4 h-4 text-cyan" />;
    }
    if (status === 'in-progress') {
      return <Circle className="w-3 h-3 text-amber-400 fill-amber-400/50" />;
    }
    return null;
  };

  const getChipLabel = (exercise, index) => {
    const name = exercise.name || `Ejercicio ${index + 1}`;
    if (name.length > 12) {
      return name.substring(0, 10) + '...';
    }
    return name;
  };

  return (
    <div className="w-full mb-6">
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {exercises.map((exercise, index) => (
          <motion.button
            key={index}
            ref={index === currentIndex ? activeChipRef : null}
            onClick={() => onNavigate(index)}
            className={getChipStyles(index)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <span className={`
              rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold
              ${index === currentIndex
                ? 'bg-dark-bg/20 text-dark-bg'
                : 'bg-white/10 text-current'
              }
            `}>
              {index + 1}
            </span>
            <span>{getChipLabel(exercise, index)}</span>
            {getStatusIcon(index)}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
