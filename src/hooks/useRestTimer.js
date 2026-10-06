import { useState, useEffect, useCallback } from 'react';
import { readLocal, writeLocal, removeLocal } from '@/lib/localStore';
import { timerRemaining } from '@/utils/workoutModel';

export function useRestTimer(key, defaultDuration = 90) {
  const [timer, setTimer] = useState(() => readLocal(key));
  const [duration, setDuration] = useState(() => Number(defaultDuration) || 90);
  const [now, setNow] = useState(Date.now);
  const update = useCallback(value => {
    setTimer(value); setNow(Date.now());
    if (value) writeLocal(key, value); else removeLocal(key);
  }, [key]);
  const timeLeft = timerRemaining(timer, now);
  useEffect(() => {
    if (!timer?.running) return;
    const refresh = () => setNow(Date.now());
    const interval = setInterval(refresh, 250);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', refresh); };
  }, [timer?.running]);
  useEffect(() => {
    if (!timer?.running || timeLeft > 0) return;
    if (document.visibilityState === 'visible') navigator.vibrate?.([200, 100, 200]);
    update({ ...timer, running: false, remaining: 0 });
  }, [timer, timeLeft, update]);
  const startRest = () => update({ running: true, endsAt: Date.now() + duration * 1000, duration });
  const adjustRest = delta => {
    const nextDuration = Math.max(10, Math.min(600, (timer?.duration || duration) + delta));
    setDuration(nextDuration);
    const remaining = Math.max(0, Math.min(600, timerRemaining(timer) + delta));
    update({ ...timer, duration: nextDuration, running: remaining > 0 && Boolean(timer?.running),
      remaining, endsAt: Date.now() + remaining * 1000 });
  };
  const togglePause = () => {
    const remaining = timerRemaining(timer);
    update({ ...timer, running: !timer?.running && remaining > 0, remaining, endsAt: Date.now() + remaining * 1000 });
  };
  return { showRestTimer: Boolean(timer), isTimerRunning: Boolean(timer?.running), timeLeft,
    restDuration: timer?.duration || duration, startRest, clearRest: () => update(null), adjustRest, togglePause };
}

export function useWakeLock(enabled) {
  useEffect(() => {
    if (!enabled || !navigator.wakeLock) return;
    let cancelled = false, lock;
    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      try { const next = await navigator.wakeLock.request('screen'); if (cancelled) await next.release(); else lock = next; } catch { /* API opcional: el entrenamiento sigue funcionando. */ }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', acquire); lock?.release().catch(() => {}); };
  }, [enabled]);
}
