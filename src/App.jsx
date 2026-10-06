import React, { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster.jsx';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const WorkoutPage = lazy(() => import('@/pages/WorkoutPage'));
const ProgressPage = lazy(() => import('@/pages/ProgressPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));


function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Cargando...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Cargando...</p>
        </div>
      </div>
    );
  }
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <MotionConfig reducedMotion="user"><AuthProvider>
      <Router>
        <Helmet>
          <title>FitTrack · El espacio de Kiko</title>
          <meta name="description" content="Aplicación de entrenamiento personal para seguir tu progreso y alcanzar tus objetivos fitness" />
        </Helmet>
        <div className="min-h-screen bg-dark-bg">
          <Suspense fallback={<div className="page-shell text-secondary flex min-h-[65vh] items-center justify-center">Cargando tu espacio…</div>}>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/workout/:day" element={<PrivateRoute><WorkoutPage /></PrivateRoute>} />
            <Route path="/progress" element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/login" />} />
            {/* Cualquier ruta desconocida (p. ej. marcadores antiguos) vuelve al inicio */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></Suspense>
          <Toaster />

        </div>
      </Router>
    </AuthProvider></MotionConfig>
  );
}

export default App;