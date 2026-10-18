import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authApi } from '../api/auth';
import { getToken, setToken, setUnauthorizedHandler } from '../api/client';
import { disconnectEcho } from '../api/echo';
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
          const res = await authApi.profile();
          setUser(res.user);
        }
      } catch {
        await setToken(null);
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    await setToken(res.token);
    setUser(res.user);
    if (res.booking_quota) setBookingQuota(res.booking_quota);
    return res;
  }, []);

  const login = useCallback(async (payload) => {
    const res = await authApi.login(payload);
    await setToken(res.token);
    setUser(res.user);
    if (res.booking_quota) setBookingQuota(res.booking_quota);
  
    try {
      const pushToken = await registerForPushNotifications(); // safe-call
      if (pushToken) {
        // Optional: kirim ke backend untuk simpan
        // await authApi.savePushToken(pushToken);
      }
    } catch {}
  
    return res;
  }, []);

  const googleLogin = useCallback(async (payload) => {
    const res = await authApi.google(payload);
    await setToken(res.token);
    setUser(res.user);
    if (res.booking_quota) setBookingQuota(res.booking_quota);
    return res;
  }, []);

  const completeProfile = useCallback(async (payload) => {
    const res = await authApi.completeProfile(payload);
    setUser(res.user);
    if (res.booking_quota) setBookingQuota(res.booking_quota);
    return res;
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await authApi.profile();
    setUser(res.user);
    if (res.booking_quota) setBookingQuota(res.booking_quota);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try { await GoogleSignin.signOut(); } catch {}
    // Putuskan WebSocket dulu sebelum token dihapus
    disconnectEcho();
    try { await authApi.logout(); } catch {}
    await setToken(null);
    setUser(null);
    setBookingQuota(null);
  }, []);

  
  // ✅ Handle Token Expired (401) dari API
  useEffect(() => {
    setUnauthorizedHandler(() => {
      console.log('[Auth] Token expired / 401 detected. Logging out...');
      logout();
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