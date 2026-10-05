import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dispora.theme';

// Palet gelap — mengikuti tampilan web Dispora
const dark = {
  mode: 'dark',
  base: '#0B0C10',
  surface: '#141620',
  surfaceAlt: '#1C1F2B',
  line: '#272B3A',

  primary: '#D51C29',
  primaryDark: '#A31220',
  primarySoft: 'rgba(213, 28, 41, 0.14)',
  onPrimary: '#FFFFFF',

  gold: '#F2B705',
  goldSoft: 'rgba(242, 183, 5, 0.14)',

  blue: '#1D4ED8',
  blueSoft: 'rgba(29, 78, 216, 0.16)',

  text: '#FFFFFF',
  textMuted: '#A3A8B8',
  textFaint: '#6C7183',

  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.14)',
  danger: '#EF4444',
  overlay: 'rgba(11, 12, 16, 0.72)',
  skeleton: '#1C1F2B',
};

// Palet terang — warna aksen dipertahankan agar identitas tetap sama
const light = {
  mode: 'light',
  base: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EDEFF3',
  line: '#DFE3EA',

  primary: '#C8101F',
  primaryDark: '#9A0C17',
  primarySoft: 'rgba(200, 16, 31, 0.10)',
  onPrimary: '#FFFFFF',

  gold: '#B98600',
  goldSoft: 'rgba(185, 134, 0, 0.12)',

  blue: '#1D4ED8',
  blueSoft: 'rgba(29, 78, 216, 0.10)',

  text: '#101223',
  textMuted: '#4B5163',
  textFaint: '#767D8F',

  success: '#15803D',
  successSoft: 'rgba(21, 128, 61, 0.12)',
  danger: '#DC2626',
  overlay: 'rgba(255, 255, 255, 0.75)',
  skeleton: '#E4E7ED',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
};

// Tipografi dibuat dari palet aktif supaya warna teks ikut berubah
export function makeType(c) {
  return {
    display: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, color: c.text },
    title: { fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.4, color: c.text },
    subtitle: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: c.text },
    body: { fontSize: 14, lineHeight: 21, fontWeight: '400', color: c.textMuted },
    small: { fontSize: 12, lineHeight: 17, fontWeight: '500', color: c.textFaint },
    eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, color: c.gold },
  };
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  // 'system' | 'light' | 'dark'
  const [preference, setPreference] = useState('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreference(v);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const resolved = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;
  const colors = resolved === 'light' ? light : dark;

  const value = useMemo(
    () => ({
      colors,
      type: makeType(colors),
      isDark: resolved === 'dark',
      preference,
      ready,
      setPreference: (p) => {
        setPreference(p);
        AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
      },
      toggle: () => {
        const next = resolved === 'dark' ? 'light' : 'dark';
        setPreference(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      },
    }),
    [colors, resolved, preference, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return ctx;
}

// Helper: bikin StyleSheet yang ikut berubah saat tema diganti.
// Pakai: const s = useThemedStyles(makeStyles) dengan makeStyles = (c, t) => ({...})
export function useThemedStyles(factory) {
  const { colors, type } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors, type)), [colors, type, factory]);
}

export default { spacing, radius, shadow, useTheme, useThemedStyles, ThemeProvider };
