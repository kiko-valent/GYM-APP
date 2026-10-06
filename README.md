# FitTrack · El espacio de Kiko

Aplicación personal de Francisco Javier para registrar su rutina, seguir el rendimiento y observar la tendencia del peso durante el déficit. Conserva la rutina y el historial existentes en Supabase. No incluye una dieta calculada ni garantiza un resultado corporal.

## Uso diario

- **Hoy:** entrenamiento previsto o descanso, constancia semanal, pesaje del día y objetivos personales. Un segundo pesaje corrige el del mismo día.
- **Entrenar:** un ejercicio cada vez, peso y repeticiones con controles grandes, RIR opcional, referencia anterior y revisión de series registradas.
- **Rutina:** días, ejercicios, repeticiones, descanso e incremento de carga. Los cambios se validan y solo aparecen como guardados cuando el servidor los confirma.
- **Progreso:** medias de peso, volumen semanal, fuerza e historial. Los análisis adicionales quedan plegados y los PDF se cargan al pedirlos.
- **Perfil:** nombre, edad, altura, fase y objetivos voluntarios de calorías/proteína; copia JSON de datos cargados y borradores del dispositivo.

En déficit las sugerencias no exigen subir peso en cada sesión ni reducen automáticamente calorías por un pesaje aislado. Una subida de carga requiere completar el rango con RIR registrado y margen en todas las series. Son sugerencias editables, no órdenes. La media del peso no mide grasa corporal.

Los objetivos de calorías y proteína quedan pendientes hasta introducir los valores del plan de Kiko. Se conserva su objetivo de pasos existente; no se prescribe uno nuevo. El espacio se llama Kiko y los datos pertenecen al usuario autenticado, sin un UUID personal incrustado en el código.

## Arranque y comprobaciones

Node 24; versión en `.nvmrc` y `package.json` para mantener el mismo entorno local y en Vercel.

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

La app real abre en `http://127.0.0.1:3000`. El build genera `public/llms.txt` y `dist/`; no publica nada. Usar un navegador actual compatible con Tailwind 4 (Safari 16.4+, Chrome 111+, Firefox 128+).

Para revisar la interfaz sin tocar Supabase:

```bash
npm run preview:ui
```

La **demostración con datos sintéticos** abre en `http://127.0.0.1:3001`. Sustituye el cliente Supabase mediante un alias exclusivo del servidor de prueba. El build real no incluye ese alias. Los valores corporales, rutina e historial de la demo no son datos reales de Kiko.

## Despliegue en Vercel

El repositorio `kiko-valent/GYM-APP` está conectado a Vercel: los commits en `main` disparan el despliegue de producción. Se compila con `npm run build` y se sirve `dist/`. `vercel.json` conserva la reescritura de rutas para abrir directamente Rutina, Perfil o Progreso.

La versión de Node se fija siguiendo la [configuración oficial de Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). El despliegue usa el cliente Supabase real. Subir el código no ejecuta los SQL: aplicar el bloque único indicado abajo sigue siendo un paso independiente.

## Persistencia y conexión

Las series se guardan primero en un borrador local con fecha, identidad del ejercicio y clave de sesión. Los envíos a Supabase se ordenan y la finalización espera a que terminen. Reordenar ejercicios no cambia su identidad; un borrador antiguo o incompatible no se asigna por posición a otro ejercicio.

El temporizador usa una hora absoluta y persiste al recargar. Respeta el descanso de cada ejercicio. El bloqueo de pantalla se utiliza solo si el navegador lo permite; los sistemas pueden liberarlo o suspender la pestaña.

La rutina y el historial tienen copias locales para continuar con datos ya cargados. Esto no convierte la aplicación en una PWA ni garantiza iniciar desde cero sin Internet. Se necesita conexión para autenticarse, guardar rutina/perfil/pesajes y confirmar la sesión en la nube. Si falla la finalización, se conserva el borrador y se puede reintentar con la misma clave.

Los borradores pertenecen al usuario y navegador. Borrar sus datos o cambiar de dispositivo puede hacer perder cambios aún sin sincronizar. La copia JSON incluye datos cargados y referencias a vídeos, no los archivos de vídeo ni una copia completa de Supabase. No se añade una importación destructiva.

## Migración de Supabase

**Estado de la entrega:** los SQL están preparados y revisados en el proyecto; no se han ejecutado contra la cuenta real ni se ha verificado su esquema remoto completo. La lectura autenticada confirmó la rutina existente: lunes 7 ejercicios, martes 6, jueves 9 y viernes 7. No había conexión administrativa disponible. RLS, Storage y guardado transaccional siguen pendientes de aplicación y comprobación.

Exportar una copia de la base de datos existente y comprobar tipos de claves y duplicados. Ejecutar en Supabase SQL Editor por este orden:

Para copiar un solo bloque al SQL Editor, usar **`tools/ACTUALIZAR_SUPABASE.sql`**. Integra los pasos siguientes y Storage en una transacción, adapta el FK a UUID/bigint/integer, limita los permisos CRUD y se detiene si existen archivos sin carpeta de propietario. Esta alternativa se ha probado en PostgreSQL local con esquemas Auth/Storage simulados: reejecución, guardado idempotente, decimales, RLS, cascada, esquema bigint y rollback ante duplicados/rutas antiguas. La extensión pgcrypto y los servicios reales de Supabase no forman parte de esa simulación. No ejecutar también los scripts individuales si se utiliza el bloque único.

1. `tools/core_schema.sql`: crea tablas ausentes; no sustituye las existentes. La instalación nueva usa UUID. Si faltara `workout_exercises` pero la sesión existente usara bigint, adaptar primero su FK al tipo real.
2. `tools/workout_progress_migration.sql`: borradores por usuario/día/fecha.
3. `tools/step_goal_migration.sql`: objetivo de pasos.
4. `tools/reliability_migration.sql`: pesos decimales, índices, RLS por propietario, borrado en cascada y función `save_workout_session` transaccional e idempotente.

Si existen duplicados de usuario/rutina, nutrición diaria o clave de sesión, el índice único falla y la migración de fiabilidad se revierte sin eliminarlos automáticamente. Revisarlos antes de reintentar. El SQL reemplaza las políticas de las ocho tablas de la app por acceso del propietario; revisar integraciones adicionales que dependan de las políticas anteriores. No ejecutar scripts de siembra para actualizar una rutina personal existente.

Hasta disponer de la RPC, el cliente mantiene un guardado compatible y un bloqueo en el navegador. Esa compatibilidad **no ofrece la misma atomicidad entre dispositivos**. Si la columna antigua rechaza decimales, se informa del error y se conserva el borrador; no se redondea la carga.

Para archivos, revisar antes los enlaces y rutas. `tools/setup_db.sql` crea buckets privados y tablas auxiliares cuando se necesita una instalación nueva; `tools/private_storage_migration.sql` privatiza los dos buckets y limita sus rutas al propietario. Los archivos permanecen, pero enlaces públicos antiguos a documentos dejarán de abrirse. El cliente convierte referencias del bucket de vídeos de técnica en enlaces firmados temporales.

Después de aplicar SQL, verificar con el usuario real: guardar y recargar rutina, finalizar dos veces la misma clave sin duplicarla, recuperar series, guardar 62.5 kg exactamente, corregir pesaje, borrar sesión con sus series y comprobar que otro usuario no puede leer datos ni archivos.

## Credenciales

La app admite `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; conserva los valores públicos anteriores como alternativa para el proyecto existente. Una clave anon es pública y requiere RLS correcto; nunca colocar `service_role` en variables `VITE_*`.

Los scripts administrativos requieren su propia configuración de `.env`. No compartir credenciales ni incorporar `.env` al repositorio. El arranque no ejecuta siembras ni migraciones.

## Criterio de personalización

De la propuesta adjunta se eligieron el entrenamiento centrado en un ejercicio, descanso absoluto, pantalla activa cuando sea posible, referencia anterior, microcargas, tendencia del peso y exportación. Se aplazan Dexie, calculadora de discos, gamificación, más indicadores y sincronización offline compleja: añadían carga sin conocer todavía los hábitos reales de Kiko.

La app ayuda a registrar y revisar hábitos; los cambios corporales se observan, no se prometen. Referencias: [CDC: pérdida de peso y seguimiento de hábitos](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html), [NIDDK: alimentación y actividad física](https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity/eating-physical-activity). La migración de estilos sigue la [guía oficial de Tailwind](https://tailwindcss.com/docs/upgrade-guide).

## Verificación local de esta entrega

- 23 pruebas pasan: recuperación por fecha/identidad, mezcla de borradores, errores de guardado, orden de escrituras y limpieza, finalización repetida, lectura obsoleta de rutina, decimales, temporizador absoluto, tendencia del peso, sugerencias de carga y generación de ambos PDF.
- `npm run lint` y `npm run build` terminan correctamente. Las dependencias bloqueadas devolvieron cero vulnerabilidades en la auditoría de npm.
- JavaScript principal: aproximadamente 354 kB sin comprimir frente a 1.416 kB antes. Gráficas y PDF se cargan por separado; esto mide tamaño de archivos, no tiempo real en el móvil de Kiko.
- Demo revisada a 390×844 y 1280×900. Se completó una sesión, se recuperaron las series y el descanso tras recargar, se validó una rutina inválida y se guardó un perfil sin inventar objetivos.
- La generación de PDF se probó con las librerías reales y comprobación de sus documentos. La herramienta de navegador no confirmó el evento de descarga; comprobar la descarga en el navegador habitual sigue formando parte de la validación con el usuario real.
- La rutina real se comprobó mediante lectura autenticada, sin escrituras. La ejecución de SQL, los permisos remotos y el bloqueo de pantalla en el móvil físico siguen pendientes de verificación.
