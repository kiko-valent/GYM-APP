# 🏋️ FitTrack - Fitness Tracker App

Una aplicación de seguimiento de fitness con diseño "Dark Modern" construida con React + Vite y Supabase.

## 🎨 Características

- **Navegación No Lineal**: Salta entre ejercicios en cualquier orden
- **Inputs Grandes**: Controles +/- gigantes para peso y repeticiones
- **Timer Circular**: Descanso con anillo de progreso cyan
- **Progreso Visual**: Gráficos con gradientes suaves
- **Tema Dark Modern**: Fondo negro, acentos lime y cyan

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **Charts**: Recharts
- **Animations**: Framer Motion

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## 📝 Scripts

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción (genera `public/llms.txt` y compila con Vite)
- `npm run preview` - Preview del build
- `npm run lint` - ESLint sobre `src/`

## 🔑 Variables de entorno

Los scripts de `tools/` necesitan credenciales que **no** se guardan en el repositorio.
Copia `.env.example` a `.env`, rellena los valores y ejecuta los scripts así:

```bash
node --env-file=.env tools/seed_workout_plan.js
```

La app web no necesita `.env`: usa la clave anon pública de Supabase, protegida por RLS.

## 📊 Estructura

```
src/
├── components/     # Componentes reutilizables
├── pages/          # Páginas de la app
├── contexts/       # Context providers (Auth)
├── lib/            # Configuración (Supabase)
└── utils/          # Funciones de utilidad
```

## 🔐 Supabase

Tablas requeridas:
- `user_plans` - Planes de entrenamiento por usuario
- `workout_sessions` - Sesiones de entrenamiento
- `workout_exercises` - Ejercicios por sesión

---

Made with 💪 by kiko-valent
