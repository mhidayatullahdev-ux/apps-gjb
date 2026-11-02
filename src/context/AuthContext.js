import Toast from 'react-native-toast-message';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authApi } from '../api/auth';
import {
  getToken, setToken, setUnauthorizedHandler,
  getStoredUser, setStoredUser, getStoredQuota, setStoredQuota,
} from '../api/client';
import { disconnectEcho } from '../api/echo';
import { navigateToLogin } from '../hooks/useDeepLinking';
import { registerForPushNotifications } from '../services/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bookingQuota, setBookingQuota] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getToken();
        if (saved) {
          // Tampilkan data cache dulu agar tidak flicker saat app dibuka
          const [cachedUser, cachedQuota] = await Promise.all([
            getStoredUser(),
            getStoredQuota(),
          ]);
          if (cachedUser) {
            setUser(cachedUser);
            if (cachedQuota) setBookingQuota(cachedQuota);
          }

          // Validasi token ke server
          try {
            const res = await authApi.profile();
            setUser(res.user);
            await setStoredUser(res.user);
            if (res.booking_quota) {
              setBookingQuota(res.booking_quota);
              await setStoredQuota(res.booking_quota);
            }
          } catch (e) {
            if (e?.status === 401) {
              // Token expired → clear semua
              await setToken(null);
              await Promise.all([setStoredUser(null), setStoredQuota(null)]);
              setUser(null);
              setBookingQuota(null);
            }
            // Network/timeout error → biarkan cache tetap aktif (user tetap login)
          }
        }
      } catch {
        // Error storage tak terduga → biarkan saja
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    await setToken(res.token);
    setUser(res.user);
    await setStoredUser(res.user);
    if (res.booking_quota) {
      setBookingQuota(res.booking_quota);
      await setStoredQuota(res.booking_quota);
    }
    return res;
  }, []);

  const login = useCallback(async (payload) => {
    const res = await authApi.login(payload);
    await setToken(res.token);
    setUser(res.user);
    await setStoredUser(res.user);
    if (res.booking_quota) {
      setBookingQuota(res.booking_quota);
      await setStoredQuota(res.booking_quota);
    }

    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) await authApi.savePushToken(pushToken);
    } catch {}

    return res;
  }, []);

  const googleLogin = useCallback(async (payload) => {
    const res = await authApi.google(payload);
    await setToken(res.token);
    setUser(res.user);
    await setStoredUser(res.user);
    if (res.booking_quota) {
      setBookingQuota(res.booking_quota);
      await setStoredQuota(res.booking_quota);
    }

    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) await authApi.savePushToken(pushToken);
    } catch {}

    return res;
  }, []);

  const completeProfile = useCallback(async (payload) => {
    const res = await authApi.completeProfile(payload);
    setUser(res.user);
    await setStoredUser(res.user);
    if (res.booking_quota) {
      setBookingQuota(res.booking_quota);
      await setStoredQuota(res.booking_quota);
    }
    return res;
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await authApi.profile();
    setUser(res.user);
    await setStoredUser(res.user);
    if (res.booking_quota) {
      setBookingQuota(res.booking_quota);
      await setStoredQuota(res.booking_quota);
    }
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try { await GoogleSignin.signOut(); } catch {}
    disconnectEcho();
    try { await authApi.logout(); } catch {}
    await setToken(null);
    await Promise.all([setStoredUser(null), setStoredQuota(null)]);
    setUser(null);
    setBookingQuota(null);
  }, []);

  
  // ✅ Handle Token Expired (401) dari API
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Cegah infinite loop: Hanya jalankan jika user masih ada (belum logout)
      setUser((currentUser) => {
        if (currentUser) {
          console.log('[Auth] Token expired / 401 detected. Logging out...');
          Toast.show({
            type: 'error',
            text1: 'Sesi Berakhir',
            text2: 'Sesi login telah berakhir, silakan login kembali.',
            visibilityTime: 4000,
          });
          
          // Clear semua data lokal TANPA memanggil API logout (biar gak 401 lagi)
          Promise.all([setToken(null), setStoredUser(null), setStoredQuota(null)]).then(() => {
            setUser(null);
            setBookingQuota(null);
            try { disconnectEcho(); } catch {}
            // Redirect ke Login setelah toast sempat tampil
            setTimeout(() => navigateToLogin(), 500);
          });
        }
        return null;
      });
    });
  }, [logout]);

  const value = useMemo(() => ({
    user,
    bookingQuota,
    ready,
    isLoggedIn: !!user,
    isProfileComplete: !!user?.is_profile_complete,
    register,
    login,
    googleLogin,
    completeProfile,
    refreshProfile,
    logout,
  }), [user, bookingQuota, ready, register, login, googleLogin, completeProfile, refreshProfile, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}

export default { AuthProvider, useAuth };