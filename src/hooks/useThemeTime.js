// src/hooks/useThemeTime.js
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dispora.theme';
const PREF_KEY = 'dispora.themePreference';

/**
 * Auto switch dark/light based on time:
 * - 06:00 - 18:00 → light mode
 * - 18:00 - 06:00 → dark mode
 *
 * Hanya aktif kalau user set preference = 'auto'
 */
export default function useThemeTime() {
  useEffect(() => {
    const check = async () => {
      try {
        const pref = await AsyncStorage.getItem(PREF_KEY);
        if (pref !== 'auto') return;

        const hour = new Date().getHours();
        const shouldBeDark = hour < 6 || hour >= 18;
        const currentTheme = await AsyncStorage.getItem(STORAGE_KEY);
        const currentIsDark = currentTheme === 'dark';
        const targetTheme = shouldBeDark ? 'dark' : 'light';

        if (currentTheme !== targetTheme) {
          await AsyncStorage.setItem(STORAGE_KEY, targetTheme);
          // Force reload theme di context — bisa trigger event emitter
          if (global.__themeChange) global.__themeChange(targetTheme);
        }
      } catch (e) {
        // silent
      }
    };

    check();
    const interval = setInterval(check, 30 * 60 * 1000); // cek tiap 30 menit
    return () => clearInterval(interval);
  }, []);
}
