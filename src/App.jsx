import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster.jsx';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import WorkoutPage from '@/pages/WorkoutPage';
import ProgressPage from '@/pages/ProgressPage';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import CalorieCalculatorPage from '@/pages/CalorieCalculatorPage';
import NutritionPage from '@/pages/NutritionPage';
import ErrorNotification from '@/components/ErrorNotification';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando...
      </div>
    );
  }
  return !user ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Helmet>
          <title>FitTrack - Tu Entrenador Personal</title>
          <meta name="description" content="Aplicación de entrenamiento personal para seguir tu progreso y alcanzar tus objetivos fitness" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/workout/:day" element={<PrivateRoute><WorkoutPage /></PrivateRoute>} />
            <Route path="/progress" element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/calculator" element={<PrivateRoute><CalorieCalculatorPage /></PrivateRoute>} />
            <Route path="/nutrition" element={<PrivateRoute><NutritionPage /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
          <Toaster />
          <ErrorNotification />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;