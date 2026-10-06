import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';

export default function ScreenHeader({ title, eyebrow = 'FITTRACK · TU ESPACIO', description, back = false, children }) {
  return <header className="screen-header">
    <div className="screen-toolbar">
      <Link to="/dashboard" className="round-control" aria-label="Volver a Hoy">{back ? <ArrowLeft size={19}/> : <Dumbbell size={20}/>}</Link>
      <span className="brand-wordmark">fittrack<span className="brand-dot"/></span>
      <Link to="/profile" className="profile-monogram" aria-label="Abrir mi perfil y objetivos">K</Link>
    </div>
    <div className="screen-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="screen-description">{description}</p>}</div>{children}</div>
  </header>;
}
