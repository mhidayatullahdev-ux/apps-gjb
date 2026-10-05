// src/screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { authApi } from '../api/auth';
import { PrimaryButton, Notice } from '../components/common';
import haptic from '../utils/haptics';
import analytics from '../utils/analytics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim()) return setError('Email wajib diisi.');
    if (!EMAIL_RE.test(email.trim())) return setError('Format email tidak valid.');

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      haptic.success();
      analytics.logEvent('forgot_password_requested', { email: email.trim() });
      setSent(true);
    } catch (e) {
      haptic.error();
      setError(e.message || 'Gagal mengirim kode. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={s.screen}>
        <View style={s.successWrap}>
          <View style={[s.successIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="mail" size={40} color={colors.success} />
          </View>
          <Text style={s.successTitle}>Cek Email Anda</Text>
          <Text style={s.successDesc}>
            Kami telah mengirim kode OTP 6 digit ke{' '}
            <Text style={{ fontWeight: '800', color: colors.text }}>
              {email}
            </Text>
            {'\n\n'}
            Kode berlaku selama 15 menit.
          </Text>

          <Notice
            text="Tidak menerima email? Cek folder Spam atau tunggu 60 detik untuk minta kode baru."
            tone="primary"
            icon="information-circle-outline"
            style={{ marginTop: spacing.lg }}
          />

          <PrimaryButton
            label="Masukkan Kode OTP"
            icon="arrow-forward"
            onPress={() => navigation.replace('ResetPassword', { email: email.trim().toLowerCase() })}
            style={{ marginTop: spacing.xl, width: '100%' }}
          />

          <Pressable onPress={() => setSent(false)} style={{ marginTop: spacing.md }}>
            <Text style={s.linkText}>Ganti Email</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.iconWrap}>
          <Ionicons name="lock-open-outline" size={44} color={colors.primary} />
        </View>

        <Text style={s.title}>Lupa Password?</Text>
        <Text style={s.subtitle}>
          Masukkan email yang terdaftar. Kami akan mengirim kode OTP untuk
          reset password.
        </Text>

        {error ? (
          <Notice text={error} tone="primary" icon="alert-circle-outline" />
        ) : null}

        <View style={s.field}>
          <Text style={s.label}>Email</Text>
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
              autoFocus
            />
          </View>
        </View>

        <PrimaryButton
          label={loading ? 'Mengirim...' : 'Kirim Kode OTP'}
          icon="send-outline"
          loading={loading}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />

        <Pressable onPress={() => navigation.goBack()} style={s.backLink}>
          <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
          <Text style={s.backText}>Kembali ke Login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  iconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: c.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginTop: spacing.xxl, marginBottom: spacing.lg,
  },
  title: { ...t.display, fontSize: 26, textAlign: 'center' },
  subtitle: { ...t.body, textAlign: 'center', marginBottom: spacing.md, lineHeight: 21 },
  field: { gap: 6 },
  label: { ...t.small, fontSize: 12, color: c.textMuted, fontWeight: '700' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    height: 50, paddingHorizontal: spacing.lg,
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
  },
  input: { flex: 1, color: c.text, fontSize: 14, padding: 0 },
  backLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', paddingVertical: spacing.lg, marginTop: spacing.md,
  },
  backText: { color: c.textMuted, fontSize: 13, fontWeight: '700' },

  successWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: { ...t.display, fontSize: 24, textAlign: 'center' },
  successDesc: {
    ...t.body, textAlign: 'center', marginTop: spacing.md,
    lineHeight: 22, paddingHorizontal: spacing.md,
  },
  linkText: { color: c.primary, fontSize: 13, fontWeight: '800' },
});
