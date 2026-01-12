import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function ProgressChart({ history }) {
  const [timeRange, setTimeRange] = useState('week');

  // Calculate volume for each workout (sum of weight * reps * sets)
  const chartData = history.slice(-10).map(session => {
    let totalVolume = 0;
    if (session.workout_exercises) {
      totalVolume = session.workout_exercises.reduce((sum, ex) => {
        return sum + ((ex.weight || 0) * (ex.reps || 0));
      }, 0);
    }

    return {
      date: new Date(session.date).toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase(),
      volume: totalVolume,
      feeling: session.evaluation?.feeling || 3,
      fullDate: new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    };
  });

  // Calculate percentage change
  const calculateChange = () => {
    if (chartData.length < 2) return null;
    const lastTwo = chartData.slice(-2);
    const change = ((lastTwo[1].volume - lastTwo[0].volume) / (lastTwo[0].volume || 1)) * 100;
    return change.toFixed(0);
  };

  const change = calculateChange();

  // Find the peak day
  const peakDay = chartData.reduce((max, day) => day.volume > max.volume ? day : max, chartData[0] || { volume: 0 });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-3 shadow-lg">
          <p className="text-white font-bold">{payload[0].payload.fullDate}</p>
          <p className="text-cyan text-sm">{payload[0].value.toLocaleString()} kg</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card-dark p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Performance</h3>
          {change !== null && (
            <p className={`text-sm ${parseFloat(change) >= 0 ? 'text-cyan' : 'text-red-400'}`}>
              {parseFloat(change) >= 0 ? '+' : ''}{change}% vs last week
            </p>
          )}
        </div>
        {/* Time Range Selector */}
        <div className="flex bg-dark-card-lighter rounded-full p-1">
          {['Week', 'Month', 'Year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range.toLowerCase())}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full transition-all
                ${timeRange === range.toLowerCase()
                  ? 'bg-dark-border text-white'
                  : 'text-secondary hover:text-white'
                }
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="mb-4">
        <p className="text-4xl font-bold text-white">
          High<br />Volume
        </p>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="relative">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00C2FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00C2FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8E99A4', fontSize: 12 }}
                dy={10}
              />
              <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#00C2FF"
                strokeWidth={2}
                fill="url(#volumeGradient)"
                dot={false}
                activeDot={{ r: 6, fill: '#00C2FF', stroke: '#0B1116', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Peak indicator */}
          {peakDay && peakDay.volume > 0 && (
            <div className="absolute top-0 right-4 text-right">
              <div className="inline-block bg-dark-card-lighter border border-dark-border rounded-lg px-2 py-1">
                <p className="text-secondary text-xs">{peakDay.date}</p>
                <p className="text-cyan text-xs font-medium">{peakDay.volume.toLocaleString()} kg</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-secondary">Completa algunos entrenamientos para ver tu progreso</p>
        </div>
      )}
    </motion.div>
  );
}