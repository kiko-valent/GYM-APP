import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Target } from 'lucide-react';

export default function RestTimer({ onComplete, onBack, nextExercise }) {
  const [selectedTime, setSelectedTime] = useState(90);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setTimeLeft(selectedTime);
  }, [selectedTime]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const progress = ((selectedTime - timeLeft) / selectedTime) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Circular progress calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="min-h-[80vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-white/60 hover:text-white p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-white tracking-wide">RESTING...</h2>
        <button className="text-white/60 hover:text-white p-2 -mr-2">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Circular Progress - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative inline-flex items-center justify-center mb-10">
          <svg width="280" height="280" className="progress-ring">
            {/* Background circle */}
            <circle
              className="progress-ring-bg"
              strokeWidth="8"
              r={radius}
              cx="140"
              cy="140"
            />
            {/* Progress circle */}
            <circle
              className="progress-ring-fill"
              strokeWidth="8"
              r={radius}
              cx="140"
              cy="140"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-white tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-cyan text-sm font-medium tracking-widest mt-2">REMAINING</span>
          </div>
        </div>

        {/* Time Adjustment Buttons */}
        <div className="flex justify-center gap-3 mb-10">
          <button
            onClick={() => setSelectedTime(prev => prev + 30)}
            className="btn-dark-pill px-6 py-3 text-sm font-medium"
          >
            +30s
          </button>
          <button
            onClick={() => setSelectedTime(prev => prev + 60)}
            className="btn-dark-pill px-6 py-3 text-sm font-medium"
          >
            +1m
          </button>
          <button
            onClick={() => setSelectedTime(prev => Math.max(10, prev - 10))}
            className="btn-dark-pill px-6 py-3 text-sm font-medium"
          >
            -10s
          </button>
        </div>
      </div>

      {/* Up Next Card */}
      <div className="card-dark p-4 mb-6">
        <p className="label-uppercase mb-2">UP NEXT</p>
        <div className="flex items-center gap-3">
          <div className="bg-cyan/20 p-2.5 rounded-xl">
            <Target className="w-5 h-5 text-cyan" />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold">{nextExercise || 'Siguiente ejercicio'}</p>
            <p className="text-secondary text-sm">Prepárate para continuar</p>
          </div>
        </div>
      </div>

      {/* Resume Button */}
      <button
        onClick={onComplete}
        className="w-full btn-cyan py-5 text-lg font-bold mb-4"
      >
        Resume Workout →
      </button>

      {/* Edit Timer Link */}
      <button className="text-secondary text-sm hover:text-white transition-colors">
        Edit Timer Settings
      </button>
    </motion.div>
  );
}