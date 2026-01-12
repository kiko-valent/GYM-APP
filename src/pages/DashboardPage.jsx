import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, LogOut, Dumbbell, Settings, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import WeeklyPlan from '@/components/WeeklyPlan';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-dark-bg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime to-cyan flex items-center justify-center">
                <span className="text-xl font-bold text-dark-bg">
                  {user?.user_metadata?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-lime rounded-full border-2 border-dark-bg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Hey {user?.user_metadata?.full_name?.split(' ')[0] || 'Atleta'}!
              </h1>
              <p className="text-secondary text-sm">Ready to crush it?</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-full hover:bg-dark-card transition-colors">
              <Bell className="w-5 h-5 text-white" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan rounded-full" />
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/progress')}
            className="card-dark p-5 cursor-pointer hover:bg-dark-card-lighter transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-cyan/20 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-cyan" />
                  </div>
                  <span className="bg-lime/20 text-lime text-xs font-semibold px-2 py-0.5 rounded-full">
                    +15%
                  </span>
                </div>
                <p className="text-secondary text-sm mb-1">Weekly Volume</p>
                <p className="text-3xl font-bold text-white">12,450<span className="text-lg text-secondary ml-1">kg</span></p>
              </div>
              {/* Mini Chart Placeholder */}
              <div className="w-24 h-12 flex items-end gap-0.5">
                {[40, 55, 45, 60, 75, 65, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-cyan/50 to-cyan rounded-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/settings')}
            className="card-dark p-5 cursor-pointer hover:bg-dark-card-lighter transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="bg-lime/20 p-2.5 rounded-lg shrink-0">
                <Dumbbell className="w-5 h-5 text-lime" />
              </div>
              <div>
                <p className="text-secondary text-sm mb-1">Today's Focus</p>
                <h3 className="text-xl font-bold text-white leading-tight">
                  Upper Body<br />Hypertrophy
                </h3>
                <button className="mt-3 flex items-center gap-2 bg-dark-card-lighter hover:bg-dark-border px-4 py-2 rounded-full text-sm font-medium text-white transition-colors">
                  Start
                  <span className="bg-white/20 rounded-full p-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Weekly Plan */}
        <WeeklyPlan />

        {/* Bottom Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border p-2 md:hidden"
        >
          <div className="flex items-center justify-around max-w-md mx-auto">
            <button className="flex flex-col items-center gap-1 p-2 text-cyan">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              <span className="text-xs">Home</span>
            </button>
            <button onClick={() => navigate('/progress')} className="flex flex-col items-center gap-1 p-2 text-secondary hover:text-white">
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs">Progress</span>
            </button>

            {/* FAB Button */}
            <div className="-mt-8">
              <button className="w-14 h-14 bg-lime rounded-full flex items-center justify-center shadow-lime-glow">
                <svg className="w-7 h-7 text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 p-2 text-secondary hover:text-white">
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </button>
            <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 p-2 text-secondary hover:text-white">
              <Settings className="w-6 h-6" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </motion.div>

        {/* Desktop Logout */}
        <div className="hidden md:block fixed bottom-8 right-8">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-dark-card border-dark-border text-white hover:bg-dark-card-lighter"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </div>
  );
}