import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, TrendingUp, User } from 'lucide-react';

const tabs = [
  ['/dashboard', 'Hoy', Home], ['/settings', 'Rutina', Dumbbell], ['/progress', 'Progreso', TrendingUp], ['/profile', 'Perfil', User],
];
export default function BottomNav() {
  return <nav aria-label="Navegación principal" className="app-dock"><div className="flex justify-around max-w-xl mx-auto">{tabs.map(([path, label, Icon]) => <NavLink key={path} to={path} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-colors ${isActive ? 'text-lime bg-lime/5' : 'text-secondary hover:text-white'}`}><Icon size={21} aria-hidden="true"/><span className="text-[11px] font-medium">{label}</span></NavLink>)}</div></nav>;
}
