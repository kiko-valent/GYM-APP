import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Mail, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);

      if (!error) {
        toast({
          title: "¡Bienvenido de vuelta! 💪",
          description: "Iniciando sesión...",
        });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="card-dark p-8 shadow-2xl">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="bg-lime p-4 rounded-2xl mb-4"
            >
              <Dumbbell className="w-12 h-12 text-dark-bg" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">FitTrack</h1>
            <p className="text-secondary">Tu entrenador personal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-dark-card-lighter border-dark-border text-white placeholder:text-tertiary focus:border-lime focus:ring-lime"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-dark-card-lighter border-dark-border text-white placeholder:text-tertiary focus:border-lime focus:ring-lime"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                className="border-secondary data-[state=checked]:bg-lime data-[state=checked]:border-lime data-[state=checked]:text-dark-bg"
                disabled={isLoading}
              />
              <Label htmlFor="remember-me" className="text-secondary text-sm cursor-pointer">Recordar usuario</Label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-lime py-4 text-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-secondary">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-lime font-semibold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}