import React from 'react';
import { Dumbbell, ArrowUpRight, Check } from 'lucide-react';

export default function AuthLayout({ children, registering = false }) {
  return <main className="auth-page"><div className="auth-shell">
    <section className="auth-intro" aria-labelledby="welcome-title">
      <div className="auth-brand"><span className="round-control"><Dumbbell size={21}/></span><span className="brand-wordmark">fittrack<span className="brand-dot"/></span><span className="auth-brand-note">EL ESPACIO DE KIKO</span></div>
      <div className="auth-welcome"><p className="eyebrow">TU RUTINA. TU RITMO.</p><h1 id="welcome-title">Un día más.<br/><span>Un paso más.</span></h1><p>Entrena, registra y observa cómo avanzas.<br/>Lo que necesitas, en un solo lugar.</p></div>
      <div className="auth-feature"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">PEQUEÑOS PASOS, CON CONSTANCIA</p><h2>La siguiente serie<br/>empieza contigo.</h2></div><ArrowUpRight size={28} aria-hidden="true"/></div><div className="barcode-motif" aria-hidden="true"/><div className="auth-feature-footer"><span>Tu plan, a mano</span><span className="flex items-center gap-2"><Check size={16}/> A tu ritmo</span></div></div>
      <div className="auth-pills" aria-label="Tu espacio incluye"><span className="tone-lavender">Rutina</span><span className="tone-mint">Progreso</span><span className="tone-coral">Constancia</span></div>
    </section>
    <section className="auth-form-panel"><div className="auth-form-heading"><span className="auth-section-number">{registering ? '02' : '01'}</span><p className="eyebrow">{registering ? 'CREA TU ESPACIO' : 'VUELVE A TU RUTINA'}</p><h2>{registering ? 'Empieza aquí.' : 'Bienvenido, Kiko.'}</h2><p className="text-secondary">{registering ? 'Guarda tu entrenamiento y sigue tu progreso.' : 'Entra para continuar donde lo dejaste.'}</p></div>{children}<p className="auth-footer-note">Una serie cada vez. Un día cada vez.</p></section>
  </div></main>;
}
