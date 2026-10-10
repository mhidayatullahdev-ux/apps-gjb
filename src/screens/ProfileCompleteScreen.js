// src/screens/ProfileCompleteScreen.js
import React, { useState, useEffect } from 'react';
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
import { extractBirthDateFromNik, validatePhone } from '../utils/nik';

const PENDING_ADDRESS_KEY = 'dispora.pendingAddress';

export default function ProfileCompleteScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const s = useThemedStyles(makeStyles);
  const { user, completeProfile, logout } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    nik: user?.nik || '',
    address: user?.address || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birth_date: user?.birth_date || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load pending address kalau ada (dari percobaan sebelumnya)
  useEffect(() => {
    (async () => {
      try {
        const pending = await AsyncStorage.getItem(PENDING_ADDRESS_KEY);
        if (pending && !form.address) {
          setForm((prev) => ({ ...prev, address: pending }));
        }
      } catch {}
    })();
  }, []);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const cleanNik = (v) => v.replace(/\D/g, '').slice(0, 16);
  const cleanPhone = (v) => v.replace(/[^\d+]/g, '').slice(0, 13);
  const cleanDate = (v) => v.replace(/[^\d-]/g, '').slice(0, 10);

  const dobFromNik = form.nik.length === 16 ? extractBirthDateFromNik(form.nik) : null;

  // Auto-fill birth_date dari NIK (kalau user belum edit manual)
  useEffect(() => {
    if (!dobFromNik) return;
    setForm((prev) => {
      if (!prev.birth_date || prev.birth_date === dobFromNik) {
        return { ...prev, birth_date: dobFromNik };
      }
      return prev;
    });
  }, [dobFromNik]);

  const submit = async () => {
    setError('');

    if (!form.name.trim()) return setError('Nama wajib diisi.');
    if (form.nik.length !== 16) return setError('NIK harus 16 digit angka.');
    if (!form.address.trim()) return setError('Alamat wajib diisi.');
    if (!form.email.trim()) return setError('Email wajib diisi.');

    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) return setError(phoneCheck.message);

    setLoading(true);

    const birthDate = extractBirthDateFromNik(form.nik);

    const payloadWithAddress = {
      name: form.name.trim(),
      nik: form.nik,
      address: form.address.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      birth_date: form.birth_date || birthDate || undefined,
    };

    const payloadWithoutAddress = { ...payloadWithAddress };
    delete payloadWithoutAddress.address;

    try {
      await completeProfile(payloadWithAddress);
      await AsyncStorage.removeItem(PENDING_ADDRESS_KEY).catch(() => {});
    } catch (e) {
      const msg = String(e.message || '').toLowerCase();
      // Cek apakah error karena field address belum ada di BE
      const isAddressError =
        e.status === 422 &&
        (msg.includes('address') || msg.includes('alamat') || msg === '');

      if (isAddressError) {
        // Retry tanpa address
        try {
          await completeProfile(payloadWithoutAddress);
          // Simpan address lokal untuk sinkron nanti
          await AsyncStorage.setItem(PENDING_ADDRESS_KEY, form.address.trim()).catch(() => {});
          Alert.alert(
            'Berhasil',
            'Profil tersimpan. Alamat akan tersinkron otomatis setelah update berikutnya.',
            [{ text: 'OK' }]
          );
        } catch (e2) {
          setError(e2.message || 'Gagal menyimpan.');
        }
      } else {
        setError(e.message || 'Gagal menyimpan.');
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
        <Text style={s.title}>Lengkapi Profil</Text>
        <Text style={s.subtitle}>
          Hai {user?.name || ''}, lengkapi data diri untuk mulai memesan lapangan.
        </Text>

        {error ? <Notice text={error} tone="primary" icon="alert-circle-outline" /> : null}

        {/* 1. Nama Lengkap */}
        <View style={s.field}>
          <Text style={s.label}>Nama Lengkap</Text>
          <View style={s.inputBox}>
            <Ionicons name="person-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={form.name}
              onChangeText={set('name')}
              placeholder="Nama lengkap"
              placeholderTextColor={colors.textFaint}
              style={s.input}
            />
          </View>
        </View>

        {/* 2. NIK */}
        <View style={s.field}>
          <Text style={s.label}>NIK (16 digit)</Text>
          <View style={s.inputBox}>
            <Ionicons name="card-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={form.nik}
              onChangeText={(v) => set('nik')(cleanNik(v))}
              placeholder="16 digit NIK KTP"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              style={s.input}
              maxLength={16}
            />
          </View>
          <Text style={s.hint}>{form.nik.length}/16</Text>
        </View>

        {/* Tanggal Lahir — auto dari NIK, bisa edit */}
        <View style={s.field}>
          <Text style={s.label}>Tanggal Lahir (YYYY-MM-DD)</Text>
          <View style={s.inputBox}>
            <Ionicons name="calendar-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={form.birth_date}
              onChangeText={(v) => set('birth_date')(cleanDate(v))}
              placeholder="Contoh: 1995-05-15"
              placeholderTextColor={colors.textFaint}
              keyboardType="numbers-and-punctuation"
              style={s.input}
              maxLength={10}
            />
          </View>
          {form.nik.length === 16 && form.birth_date === dobFromNik ? (
            <Text style={[s.hint, { color: colors.success }]}>
              ✓ Otomatis dari NIK
            </Text>
          ) : null}
        </View>
        {/* 3. Alamat */}
        <View style={s.field}>
          <Text style={s.label}>Alamat</Text>
          <View style={[s.inputBox, s.inputBoxMultiline]}>
            <Ionicons
              name="location-outline"
              size={17}
              color={colors.textFaint}
              style={{ marginTop: 4 }}
            />
            <TextInput
              value={form.address}
              onChangeText={set('address')}
              placeholder="Alamat lengkap"
              placeholderTextColor={colors.textFaint}
              style={[s.input, s.inputMultiline]}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* 4. Email */}
        <View style={s.field}>
          <Text style={s.label}>Email</Text>
          <View style={s.inputBox}>
            <Ionicons name="mail-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={form.email}
              onChangeText={set('email')}
              placeholder="nama@email.com"
              placeholderTextColor={colors.textFaint}
              keyboardType="email-address"
              autoCapitalize="none"
              style={s.input}
            />
          </View>
        </View>

        {/* 5. No HP */}
        <View style={s.field}>
          <Text style={s.label}>No HP (10-13 digit)</Text>
          <View style={s.inputBox}>
            <Ionicons name="call-outline" size={17} color={colors.textFaint} />
            <TextInput
              value={form.phone}
              onChangeText={(v) => set('phone')(cleanPhone(v))}
              placeholder="08xxxxxxxxxx"
              placeholderTextColor={colors.textFaint}
              keyboardType="phone-pad"
              style={s.input}
            />
          </View>
          <Text style={s.hint}>{form.phone.replace(/\D/g, '').length}/13</Text>
        </View>

        <PrimaryButton
          label="Simpan & Lanjutkan"
          loading={loading}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />

        <Pressable onPress={logout} style={s.logoutLink}>
          <Text style={s.logoutText}>Keluar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  title: { ...t.display, fontSize: 26, marginTop: spacing.xxl },
  subtitle: { ...t.body, marginBottom: spacing.sm },
  field: { gap: 6, marginTop: spacing.lg },
  label: { ...t.small, fontSize: 12, color: c.textMuted, fontWeight: '700', marginBottom: 6 },
  hint: { ...t.small, fontSize: 10, textAlign: 'right' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    height: 50, paddingHorizontal: spacing.lg,
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
  },
  inputBoxMultiline: {
    height: undefined, minHeight: 70,
    alignItems: 'flex-start', paddingVertical: 10,
  },
  input: { flex: 1, color: c.text, fontSize: 14, padding: 0 },
  inputMultiline: { minHeight: 50, textAlignVertical: 'top' },
  logoutLink: { alignSelf: 'center', paddingVertical: spacing.lg },
  logoutText: { color: c.danger, fontSize: 13, fontWeight: '700' },
});
