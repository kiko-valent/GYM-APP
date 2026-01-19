import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Flame } from 'lucide-react';
import { getUserPlan } from '@/utils/workoutData';

export default function ProgressStats({ history, userId }) {
  const [trainingDays, setTrainingDays] = useState([]);
  const [loading, setLoading] = useState(true);

  const totalWorkouts = history.length;

  // Fetch training days from user plan
  useEffect(() => {
    const fetchPlan = async () => {
      if (userId) {
        const plan = await getUserPlan(userId);
        setTrainingDays(plan.training_days || []);
      }
      setLoading(false);
    };
    fetchPlan();
  }, [userId]);

  // New Adherence-Based Streak Logic
  // Only counts consecutive SCHEDULED training days that were completed
  // Rest days do not break the streak
  const calculateStreak = () => {
    if (history.length === 0 || trainingDays.length === 0) return 0;

    // Get unique workout dates
    const workoutDates = new Set(
      history.map(w => new Date(w.date).toDateString())
    );

    // Spanish day names mapping
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Iterate backwards from today
    for (let i = 0; i < 365; i++) { // Max 1 year lookback
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dayName = dayNames[checkDate.getDay()];

      // Check if this day was a scheduled training day
      const isScheduledDay = trainingDays.includes(dayName);

      if (isScheduledDay) {
        // It's a scheduled day - check if workout was completed
        const wasCompleted = workoutDates.has(checkDate.toDateString());

        if (wasCompleted) {
          streak++;
        } else {
          // Missed a scheduled day - streak breaks
          // But only if it's in the past (not today)
          if (i > 0) {
            break;
          }
          // If today is scheduled but not done yet, continue checking
        }
      }
      // If not a scheduled day (rest day), continue without breaking streak
    }

    return streak;
  };

  const stats = [
    {
      icon: Dumbbell,
      label: 'ENTRENAMIENTOS',
      value: totalWorkouts,
      bgColor: 'bg-dark-card-lighter',
      iconColor: 'text-cyan'
    },
    {
      icon: Flame,
      label: 'RACHA',
      value: loading ? '...' : calculateStreak(),
      suffix: 'Días',
      bgColor: 'bg-dark-card-lighter',
      iconColor: 'text-cyan'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card-dark p-5"
        >
          <div className={`${stat.bgColor} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
          </div>
          <p className="label-uppercase text-xs mb-1">{stat.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">{stat.value}</span>
            {stat.suffix && <span className="text-secondary text-sm">{stat.suffix}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}