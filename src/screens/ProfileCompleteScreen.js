import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import kalender

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton, Notice } from '../components/common';

export default function ProfileCompleteScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const s = useThemedStyles(makeStyles);
  const { user, completeProfile, logout } = useAuth();

  const [form, setForm] = useState({ nik: '', phone: '', gender: '', birth_date: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // State untuk kalender
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date(1995, 4, 15)); // Default: 15 Mei 1995

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const cleanNik = (v) => v.replace(/\D/g, '').slice(0, 16);
  const cleanPhone = (v) => v.replace(/[^\d+]/g, '').slice(0, 20);

  // Handler saat tanggal dipilih dari kalender
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      setDateObj(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      set('birth_date')(`${year}-${month}-${day}`); // Perbaikan typo: 'date' -> 'birth_date'
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const submit = async () => {
    setError('');
    const nik = form.nik.trim();
    if (nik.length !== 16) return setError('NIK harus 16 digit angka.');
    if (!form.phone.trim()) return setError('Nomor HP wajib diisi.');
    if (!['L', 'P'].includes(form.gender)) return setError('Pilih jenis kelamin.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date)) return setError('Format tanggal: YYYY-MM-DD.');

    setLoading(true);
    try {
      await completeProfile({ nik, phone: form.phone.trim(), gender: form.gender, birth_date: form.birth_date });
    } catch (e) { setError(e.message || 'Gagal menyimpan.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Lengkapi Profil</Text>
        <Text style={s.subtitle}>Hai {user?.name || ''}, lengkapi data diri untuk mulai memesan lapangan.</Text>

        {error ? <Notice text={error} tone="primary" icon="alert-circle-outline" /> : null}

        <View style={s.field}>
          <Text style={s.label}>NIK (16 digit)</Text>
          <View style={s.inputBox}>
            <Ionicons name="card-outline" size={17} color={colors.textFaint} />
            <TextInput value={form.nik} onChangeText={(v) => set('nik')(cleanNik(v))}
              placeholder="16 digit NIK KTP" placeholderTextColor={colors.textFaint}
              keyboardType="number-pad" style={s.input} maxLength={16} />
          </View>
          <Text style={s.hint}>{form.nik.length}/16</Text>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Nomor HP</Text>
          <View style={s.inputBox}>
            <Ionicons name="call-outline" size={17} color={colors.textFaint} />
            <TextInput value={form.phone} onChangeText={(v) => set('phone')(cleanPhone(v))}
              placeholder="08xxxxxxxxxx" placeholderTextColor={colors.textFaint}
              keyboardType="phone-pad" style={s.input} />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Jenis Kelamin</Text>
          <View style={s.genderRow}>
            {[{ v: 'L', l: 'Laki-laki' }, { v: 'P', l: 'Perempuan' }].map((g) => {
              const active = form.gender === g.v;
              return (
                <Pressable key={g.v} onPress={() => set('gender')(g.v)}
                  style={[s.genderChip, active && s.genderChipActive]}>
                  <Text style={[s.genderText, active && s.genderTextActive]}>{g.l}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Tanggal Lahir</Text>
          {/* Menggunakan Pressable untuk memicu kalender */}
          <Pressable onPress={() => setShowDatePicker(true)} style={s.inputBox}>
            <Ionicons name="calendar-outline" size={17} color={colors.textFaint} />
            <TextInput 
              value={form.birth_date} 
              placeholder="YYYY-MM-DD (contoh: 1995-05-15)" 
              placeholderTextColor={colors.textFaint}
              style={s.input} 
              editable={false} // Matikan input manual
              pointerEvents="none" // Agar klik diteruskan ke Pressable
            />
          </Pressable>
        </View>

        {/* Komponen Kalender yang muncul saat ditekan */}
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={dateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            maximumDate={new Date()} // Batasi maksimal tanggal hari ini
          />
        )}

        <PrimaryButton label="Simpan & Lanjutkan" loading={loading} onPress={submit} style={{ marginTop: spacing.md }} />

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
  field: { gap: 6 },
  label: { ...t.small, fontSize: 12, color: c.textMuted, fontWeight: '700' },
  hint: { ...t.small, fontSize: 10, textAlign: 'right' },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, height: 50, paddingHorizontal: spacing.lg, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line },
  input: { flex: 1, color: c.text, fontSize: 14, padding: 0 },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderChip: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  genderChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  genderText: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
  genderTextActive: { color: c.onPrimary },
  logoutLink: { alignSelf: 'center', paddingVertical: spacing.lg },
  logoutText: { color: c.danger, fontSize: 13, fontWeight: '700' },
});