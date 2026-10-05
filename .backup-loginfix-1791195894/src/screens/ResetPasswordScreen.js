// src/screens/ResetPasswordScreen.js
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

export default function ResetPasswordScreen({ navigation, route }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const paramEmail = route.params?.email || '';
  const paramCode = route.params?.code || '';

  const [email, setEmail] = useState(paramEmail);
  const [code, setCode] = useState(paramCode);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanCode = (v) => v.replace(/\D/g, '').slice(0, 6);

  const submit = async () => {
    setError('');
    if (!email.trim()) return setError('Email wajib diisi.');
    if (code.length !== 6) return setError('Kode OTP harus 6 digit.');
    if (password.length < 8) return setError('Password minimal 8 karakter.');
    if (password !== confirm) return setError('Konfirmasi password tidak sama.');

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        code,
        new_password: password,
        new_password_confirmation: confirm,
      });
      haptic.success();
      analytics.logEvent('password_reset_success');

      Alert.alert(
        'Berhasil',
        'Password berhasil direset. Silakan login dengan password baru.',
        [{ text: 'Login', onPress: () => navigation.replace('Login') }]
      );
    } catch (e) {
      haptic.error();
      setError(e.message || 'Gagal reset password. Cek kode OTP Anda.');
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
        <View style={s.iconWrap}>
          <Ionicons name="key-outline" size={44} color={colors.primary} />
        </View>

        <Text style={s.title}>Reset Password</Text>
        <Text style={s.subtitle}>
          Masukkan kode OTP dari email Anda dan password baru.
        </Text>

        {error ? (
          <Notice text={error} tone="primary" icon="alert-circle-outline" />
        ) : null}

        {/* Email */}
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
              editable={!paramEmail}
            />
          </View>
        </View>

        {/* OTP */}
        <View style={s.field}>
          <Text style={s.label}>Kode OTP (6 digit)</Text>
          <View style={s.inputBox}>
            <Ionicons name="keypad-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={code}
              onChangeText={(v) => setCode(cleanCode(v))}
              placeholder="000000"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              maxLength={6}
              style={[s.input, s.codeInput]}
            />
          </View>
        </View>

        {/* Password baru */}
        <View style={s.field}>
          <Text style={s.label}>Password Baru</Text>
          <View style={s.inputBox}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Minimal 8 karakter"
              placeholderTextColor={colors.textFaint}
              secureTextEntry={!showPass}
              style={s.input}
            />
            <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={17}
                color={colors.textFaint}
              />
            </Pressable>
          </View>
        </View>

        {/* Konfirmasi */}
        <View style={s.field}>
          <Text style={s.label}>Konfirmasi Password</Text>
          <View style={s.inputBox}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Ulangi password baru"
              placeholderTextColor={colors.textFaint}
              secureTextEntry={!showPass}
              style={s.input}
              onSubmitEditing={submit}
            />
          </View>
        </View>

        <PrimaryButton
          label={loading ? 'Memproses...' : 'Reset Password'}
          icon="checkmark-circle-outline"
          loading={loading}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={s.backLink}>
          <Text style={s.backText}>Kirim Ulang Kode OTP</Text>
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
  codeInput: { letterSpacing: 6, fontSize: 18, fontWeight: '800' },
  backLink: { alignSelf: 'center', paddingVertical: spacing.lg },
  backText: { color: c.primary, fontSize: 13, fontWeight: '800' },
});
