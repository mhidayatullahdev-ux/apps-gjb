import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Production-safe polling hook untuk screen components.
 *
 * Guard berlapis:
 *  1. useFocusEffect — interval berhenti otomatis saat layar tidak fokus (user navigasi ke layar lain)
 *  2. AppState — tick di-skip otomatis saat app di-background / minimize
 *
 * @param {() => void} fn       Fungsi yang dipanggil tiap tick (boleh async, error diabaikan)
 * @param {number} intervalMs   Interval antar tick (ms)
 * @param {boolean} enabled     Set false untuk pause sementara (misal: saat loading awal atau mode kompetisi)
 */
export function usePolling(fn, intervalMs, enabled = true) {
  const fnRef = useRef(fn);
  const appStateRef = useRef(AppState.currentState);
  const timerRef = useRef(null);

  // Selalu gunakan versi terbaru fn tanpa perlu restart interval
  useEffect(() => { fnRef.current = fn; }, [fn]);

  // Track app state untuk skip tick saat background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start/stop otomatis mengikuti fokus layar
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      stop();
      timerRef.current = setInterval(() => {
        // Skip tick jika app tidak di foreground
        if (appStateRef.current !== 'active') return;
        try { fnRef.current(); } catch {}
      }, intervalMs);
      return stop;
    }, [enabled, intervalMs, stop])
  );
}
