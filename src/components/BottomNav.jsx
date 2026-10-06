import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, TrendingUp, User } from 'lucide-react';

const tabs = [
  ['/dashboard', 'Hoy', Home], ['/settings', 'Rutina', Dumbbell], ['/progress', 'Progreso', TrendingUp], ['/profile', 'Perfil', User],
];
export default function BottomNav() {
  return <nav aria-label="Navegación principal" className="app-dock"><div className="flex justify-around max-w-xl mx-auto">{tabs.map(([path, label, Icon]) => <NavLink key={path} to={path} className={({ isActive }) => `dock-link ${isActive ? 'dock-link-active' : ''}`}><span className="dock-icon"><Icon size={20} aria-hidden="true"/></span><span className="text-[11px] font-medium">{label}</span></NavLink>)}</div></nav>;
}
