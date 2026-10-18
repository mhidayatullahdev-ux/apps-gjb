// src/hooks/useGoogleAuth.js
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  isGoogleConfigured,
} from '../config/google';
import { useAuth } from '../context/AuthContext';

export function useGoogleAuth({ onSuccess, onError } = {}) {
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (!isGoogleConfigured()) return;

    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
      scopes: ['openid', 'profile', 'email'],
    });

    setConfigured(true);
  }, []);

  const promptGoogleLogin = async () => {
    setError('');

    if (!isGoogleConfigured()) {
      setError('Google Sign-In belum dikonfigurasi.');
      return;
    }

    if (!configured) {
      Alert.alert('Tunggu sebentar', 'Menyiapkan Google Sign-In...');
      return;
    }

    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo || userInfo.type === 'cancelled' || userInfo.cancelled) {
        throw new Error('Login Google dibatalkan.');
      }

      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        throw new Error('ID Token tidak diterima dari Google.');
      }

      const result = await googleLogin({ id_token: idToken });
      onSuccess?.(result);
    } catch (e) {
      console.error('[GoogleAuth] Error:', e);
      let msg = 'Login Google gagal.';
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.message === 'Login Google dibatalkan.') {
        msg = 'Login Google dibatalkan.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch {}
  };

  return { promptGoogleLogin, signOut, loading, error };
}
