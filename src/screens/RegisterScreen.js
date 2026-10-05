// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton, Notice } from '../components/common';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const s = useThemedStyles(makeStyles);
  const { register } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { promptGoogleLogin, loading: googleLoading, error: googleError } = useGoogleAuth();
  const displayError = error || googleError;

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setError('');
    const { name, email, password, confirm } = form;
    if (!name.trim() || !email.trim() || !password || !confirm) {
      return setError(t('auth.errRequired'));
    }
    if (!EMAIL_RE.test(email.trim())) return setError(t('auth.errEmail'));
    if (password.length < 8) return setError(t('auth.errPassword'));
    if (password !== confirm) return setError(t('auth.errMatch'));

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: confirm,
      });
    } catch (e) {
      setError(e.message || t('auth.errRequired'));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: t('auth.name'), icon: 'person-outline', placeholder: 'Nama lengkap' },
    { key: 'email', label: t('auth.email'), icon: 'mail-outline', placeholder: 'nama@email.com', keyboardType: 'email-address', autoCapitalize: 'none' },
    { key: 'password', label: t('auth.password'), icon: 'lock-closed-outline', placeholder: 'Minimal 8 karakter', secure: true },
    { key: 'confirm', label: t('auth.confirmPassword'), icon: 'lock-closed-outline', placeholder: 'Ulangi kata sandi', secure: true },
  ];

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{t('auth.registerTitle')}</Text>
        <Text style={s.subtitle}>{t('auth.registerSubtitle')}</Text>

        {displayError ? (
          <Notice text={displayError} tone="primary" icon="alert-circle-outline" />
        ) : null}

        {fields.map((f) => (
          <View key={f.key} style={s.field}>
            <Text style={s.label}>{f.label}</Text>
            <View style={s.inputBox}>
              <Ionicons name={f.icon} size={17} color={colors.textFaint} />
              <TextInput
                value={form[f.key]}
                onChangeText={set(f.key)}
                placeholder={f.placeholder}
                placeholderTextColor={colors.textFaint}
                secureTextEntry={!!f.secure}
                keyboardType={f.keyboardType}
                autoCapitalize={f.autoCapitalize || 'sentences'}
                style={s.input}
              />
            </View>
          </View>
        ))}

        <PrimaryButton
          label={t('auth.registerTitle')}
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
            {googleLoading ? t('common.loading') : t('auth.googleRegister')}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={s.switchLink}>
          <Text style={s.switchText}>{t('auth.haveAccount')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  title: { ...t.display, fontSize: 28, marginTop: spacing.lg },
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
