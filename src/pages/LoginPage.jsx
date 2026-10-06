import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        toast({ title: '¡Bienvenido de vuelta!', description: 'Iniciando sesión…' });
        navigate('/dashboard');
      }
    } catch (err) { console.error('Login error:', err); }
    finally { setIsLoading(false); }
  };

  return <AuthLayout>
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="auth-input-wrap"><Mail size={18} aria-hidden="true"/><Input id="email" type="email" autoComplete="username" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading}/></div></div>
      <div className="space-y-2"><Label htmlFor="password">Contraseña</Label><div className="auth-input-wrap"><Lock size={18} aria-hidden="true"/><Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading}/><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} disabled={isLoading}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
      <button type="submit" disabled={isLoading} className="btn-lime auth-submit">{isLoading ? <><Loader2 size={19} className="animate-spin"/> Iniciando…</> : <>Entrar a mi espacio <ArrowRight size={19}/></>}</button>
    </form>
    <p className="auth-switch">¿No tienes cuenta? <Link to="/register">Crear cuenta <ArrowRight size={14} aria-hidden="true" className="-rotate-45"/></Link></p>
  </AuthLayout>;
}
