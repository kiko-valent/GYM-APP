import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, { data: { full_name: name } });
      if (!error) {
        toast({ title: '¡Cuenta creada!', description: 'Bienvenido a FitTrack. Revisa tu email para confirmar tu cuenta.' });
        navigate('/dashboard');
      }
    } catch (err) { console.error('Registration error:', err); }
    finally { setIsLoading(false); }
  };

  return <AuthLayout registering>
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="name">Nombre</Label><div className="auth-input-wrap"><User size={18} aria-hidden="true"/><Input id="name" type="text" autoComplete="name" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} required disabled={isLoading}/></div></div>
      <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="auth-input-wrap"><Mail size={18} aria-hidden="true"/><Input id="email" type="email" autoComplete="username" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading}/></div></div>
      <div className="space-y-2"><Label htmlFor="password">Contraseña</Label><div className="auth-input-wrap"><Lock size={18} aria-hidden="true"/><Input id="password" type="password" autoComplete="new-password" placeholder="Elige una contraseña" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading}/></div></div>
      <button type="submit" disabled={isLoading} className="btn-lime auth-submit">{isLoading ? <><Loader2 size={19} className="animate-spin"/> Creando…</> : <>Crear cuenta <ArrowRight size={19}/></>}</button>
    </form>
    <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Iniciar sesión <ArrowRight size={14} aria-hidden="true"/></Link></p>
  </AuthLayout>;
}
