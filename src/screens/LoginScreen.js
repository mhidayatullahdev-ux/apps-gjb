import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton, Notice } from '../components/common';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

// Safe toast — kalau utils/toast tidak ada, fallback ke Alert
let safeToast;
try {
  const t = require('../utils/toast');
  safeToast = t.toast;
} catch {
  safeToast = {
    success: (title, msg) => Alert.alert(title, msg || ''),
    error: (title, msg) => Alert.alert(title, msg || ''),
    info: (title, msg) => Alert.alert(title, msg || ''),
  };
}

const REMEMBER_KEY = 'dispora.rememberMe';

export default function LoginScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const s = useThemedStyles(makeStyles);
  const { login, isLoggedIn, isProfileComplete } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false);

  const { promptGoogleLogin, loading: googleLoading, error: googleError } = useGoogleAuth();
  const displayError = error || googleError;

  // ✅ Auto-redirect setelah login sukses — SAFE
  useEffect(() => {
    if (!isLoggedIn) return;
    if (hasNavigated.current) return;

    // Kalau profile belum lengkap, JANGAN reset — biarkan RootNavigator
    // otomatis ganti ke ProfileSetupStack.
    if (!isProfileComplete) {
      hasNavigated.current = true;
      return;
    }

    hasNavigated.current = true;

    const timer = setTimeout(() => {
      try {
        const returnTo = route?.params?.returnTo;
        const returnParams = route?.params?.returnParams;

        if (returnTo) {
          navigation.reset({
            index: 1,
            routes: [
              { name: 'Tabs' },
              { name: returnTo, params: returnParams },
            ],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs' }],
          });
        }
      } catch (e) {
        console.warn('[Login] redirect skipped:', e?.message);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isLoggedIn, isProfileComplete, navigation, route]);

  // Load credentials kalau "Ingat Saya" dicentang
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REMEMBER_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.email) setEmail(data.email);
          if (data.password) setPassword(data.password);
          setRemember(true);
        }
      } catch {}
    })();
  }, []);

  const saveCredentials = async (email, password) => {
    try {
      await AsyncStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }));
    } catch {}
  };

  const clearCredentials = async () => {
    try {
      await AsyncStorage.removeItem(REMEMBER_KEY);
    } catch {}
  };

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) return setError(t('auth.errRequired'));
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });

      if (remember) {
        await saveCredentials(email.trim().toLowerCase(), password);
      } else {
        await clearCredentials();
      }

      try {
        safeToast.success('Login Berhasil', 'Selamat datang kembali!');
      } catch (e) {
        console.warn('[Login] toast error:', e);
      }
    } catch (e) {
      const msg = e.message || t('auth.errNotFound');
      setError(msg);
      try {
        safeToast.error('Login Gagal', msg);
      } catch (err) {
        console.warn('[Login] toast error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{t('auth.loginTitle')}</Text>
        <Text style={s.subtitle}>{t('auth.loginSubtitle')}</Text>

        {displayError ? (
          <Notice text={displayError} tone="primary" icon="alert-circle-outline" />
        ) : null}

        <View style={s.field}>
          <Text style={s.label}>{t('auth.email')}</Text>
          <View style={s.inputBox}>
            <Ionicons name="mail-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              style={s.input}
              autoComplete="email"
            />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>{t('auth.password')}</Text>
          <View style={s.inputBox}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor={colors.textFaint}
              secureTextEntry={!showPassword}
              style={s.input}
              onSubmitEditing={submit}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={17}
                color={colors.textFaint}
              />
            </Pressable>
          </View>
        </View>

        <View style={s.rowBetween}>
          <Pressable
            onPress={() => setRemember((v) => !v)}
            style={s.rememberRow}
            hitSlop={8}
          >
            <View style={[s.checkbox, remember && s.checkboxActive]}>
              {remember ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text style={s.rememberLabel}>Ingat Saya</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text style={s.forgotLink}>Lupa Password?</Text>
          </Pressable>
        </View>

        <PrimaryButton
          label={t('auth.loginTitle')}
          loading={loading}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />

        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>{t('auth.or')}</Text>
          <View style={s.dividerLine} />
        </View>

        <Pressable
          onPress={promptGoogleLogin}
          disabled={googleLoading}
          style={[s.googleButton, googleLoading && { opacity: 0.6 }]}
        >
          <Ionicons name="logo-google" size={18} color={colors.text} />
          <Text style={s.googleText}>
            {googleLoading ? t('common.loading') : t('auth.googleLogin')}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} style={s.switchLink}>
          <Text style={s.switchText}>{t('auth.noAccount')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  title: { ...t.display, fontSize: 28, marginTop: spacing.xxl },
  subtitle: { ...t.body, marginBottom: spacing.sm },
  field: { gap: 6 },
  label: { ...t.small, fontSize: 12, color: c.textMuted, fontWeight: '700' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    height: 50, paddingHorizontal: spacing.lg,
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
  },
  input: { flex: 1, color: c.text, fontSize: 14, padding: 0 },
  rowBetween: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: spacing.xs,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 2, borderColor: c.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: c.primary, borderColor: c.primary },
  rememberLabel: { color: c.text, fontSize: 13, fontWeight: '600' },
  forgotLink: { color: c.primary, fontSize: 13, fontWeight: '800' },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginVertical: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.line },
  dividerText: { ...t.small, fontSize: 11 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.md, paddingVertical: 13,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: c.line, backgroundColor: c.surface,
  },
  googleText: { color: c.text, fontSize: 14, fontWeight: '700' },
  switchLink: { alignSelf: 'center', paddingVertical: spacing.md },
  switchText: { color: c.gold, fontSize: 13, fontWeight: '700' },
});
