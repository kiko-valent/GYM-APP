import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Flame, Award, TrendingUp } from 'lucide-react';

export default function ProgressStats({ history }) {
  const totalWorkouts = history.length;
  const thisWeek = history.filter(w => {
    const date = new Date(w.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }).length;

  const avgFeeling = history.length > 0
    ? (history.reduce((sum, w) => sum + (w.evaluation?.feeling || 0), 0) / history.length).toFixed(1)
    : 0;

  // Calculate streak
  const calculateStreak = () => {
    if (history.length === 0) return 0;
    const sortedDates = history
      .map(w => new Date(w.date).toDateString())
      .filter((date, i, arr) => arr.indexOf(date) === i)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (sortedDates.includes(checkDate.toDateString())) {
        streak++;
      } else if (i === 0) {
        // If today wasn't a workout, check yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  const stats = [
    {
      icon: Dumbbell,
      label: 'WORKOUTS',
      value: totalWorkouts,
      bgColor: 'bg-dark-card-lighter',
      iconColor: 'text-cyan'
    },
    {
      icon: Flame,
      label: 'STREAK',
      value: calculateStreak(),
      suffix: 'Days',
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