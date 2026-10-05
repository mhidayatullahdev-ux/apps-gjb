// src/screens/RescheduleScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { bookingsApi } from '../api/bookings';
import { PrimaryButton, Notice, Divider } from '../components/common';
import { FadeInUp, PressableScale } from '../components/anim';

export default function RescheduleScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const s = useThemedStyles(makeStyles);
  const isEn = lang === 'en';

  const { booking } = route.params;

  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load T&C
  useEffect(() => {
    (async () => {
      try {
        const res = await bookingsApi.rescheduleTerms();
        setTerms(res);
      } catch (e) {
        setError('Gagal memuat syarat & ketentuan.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load slot saat tanggal dipilih
  useEffect(() => {
    if (!date || !booking.court?.id) return;
    (async () => {
      setSlotsLoading(true);
      try {
        const res = await bookingsApi.checkAvailability({
          court_id: booking.court.id,
          date: date.toISOString().slice(0, 10),
        });
        setSlots(res.available_slots || []);
        setStartTime(null);
        setEndTime(null);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [date, booking.court?.id]);

  const submit = async () => {
    setError('');
    if (!date || !startTime || !endTime) {
      return setError(isEn ? 'Please select a date and slot.' : 'Pilih tanggal dan slot.');
    }
    if (!termsAccepted) {
      return setError(isEn ? 'Please accept the terms.' : 'Setujui syarat & ketentuan.');
    }

    setSubmitting(true);
    try {
      await bookingsApi.reschedule(booking.id, {
        booking_date: date.toISOString().slice(0, 10),
        start_time: startTime,
        end_time: endTime,
        terms_accepted: true,
      });
      Alert.alert(
        'Berhasil',
        isEn ? 'Booking rescheduled.' : 'Booking berhasil diubah jadwalnya.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      setError(e.message || 'Gagal reschedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextDays = (count) => {
    const out = [];
    const now = new Date();
    const minDays = terms?.min_days_before || 1;
    for (let i = 0; i < count; i++) {
      out.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + minDays));
    }
    return out;
  };

  if (loading) {
    return (
      <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Info booking saat ini */}
        <View style={s.card}>
          <Text style={s.label}>{isEn ? 'Current Schedule' : 'Jadwal Saat Ini'}</Text>
          <Text style={s.value}>{booking.booking_date}</Text>
          <Text style={s.value}>{booking.start_time} - {booking.end_time}</Text>
          <Divider style={{ marginVertical: spacing.sm }} />
          <Text style={s.label}>{isEn ? 'Court' : 'Lapangan'}</Text>
          <Text style={s.value}>{booking.court?.name}</Text>
          <Divider style={{ marginVertical: spacing.sm }} />
          <Text style={s.label}>{isEn ? 'Facility' : 'Fasilitas'}</Text>
          <Text style={s.value}>{booking.court?.facility?.name}</Text>
        </View>

        {error ? <Notice text={error} tone="primary" icon="alert-circle-outline" /> : null}

        {terms?.min_days_before ? (
          <Notice
            text={
              isEn
                ? `Reschedule at least H-${terms.min_days_before}. Max ${terms.max_times || 1}x.`
                : `Reschedule minimal H-${terms.min_days_before}. Maksimal ${terms.max_times || 1}x.`
            }
            tone="primary"
            icon="information-circle-outline"
          />
        ) : null}

        {/* Pilih tanggal baru */}
        <Text style={s.fieldLabel}>{isEn ? 'NEW DATE' : 'TANGGAL BARU'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {nextDays(14).map((d) => {
            const active = date && d.toDateString() === date.toDateString();
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => setDate(d)}
                style={[s.dateCell, active && s.dateCellActive]}
              >
                <Text style={[s.dateDow, active && { color: colors.onPrimary }]}>
                  {d.toLocaleDateString('id-ID', { weekday: 'short' })}
                </Text>
                <Text style={[s.dateNum, active && { color: colors.onPrimary }]}>
                  {d.getDate()}
                </Text>
                <Text style={[s.dateMon, active && { color: colors.onPrimary }]}>
                  {d.toLocaleDateString('id-ID', { month: 'short' })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Pilih slot */}
        {date ? (
          <>
            <Text style={s.fieldLabel}>{isEn ? 'AVAILABLE SLOTS' : 'SLOT TERSEDIA'}</Text>
            {slotsLoading ? (
              <Text style={s.hint}>{isEn ? 'Loading slots...' : 'Memuat slot...'}</Text>
            ) : slots.length === 0 ? (
              <Text style={s.hint}>{isEn ? 'No slots available.' : 'Tidak ada slot tersedia.'}</Text>
            ) : (
              <View style={s.slotsGrid}>
                {slots.map((slot) => {
                  const active = startTime === slot.start_time && endTime === slot.end_time;
                  const disabled = !slot.available;
                  return (
                    <Pressable
                      key={slot.start_time}
                      disabled={disabled}
                      onPress={() => {
                        setStartTime(slot.start_time);
                        setEndTime(slot.end_time);
                      }}
                      style={[s.slot, active && s.slotActive, disabled && s.slotDisabled]}
                    >
                      <Text
                        style={[
                          s.slotText,
                          active && { color: colors.onPrimary },
                          disabled && s.slotTextDisabled,
                        ]}
                      >
                        {slot.start_time} - {slot.end_time}
                      </Text>
                      <Text style={[s.slotSub, active && { color: colors.onPrimary }]}>
                        {disabled
                          ? (isEn ? 'Booked' : 'Terisi')
                          : `Rp ${Number(slot.price).toLocaleString('id-ID')}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        ) : null}

        {/* T&C */}
        {terms?.terms ? (
          <View style={s.termsCard}>
            <Text style={s.termsTitle}>
              {isEn ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
            </Text>
            <Text style={s.termsText}>{terms.terms}</Text>
            <Pressable
              onPress={() => setTermsAccepted(!termsAccepted)}
              style={s.checkboxRow}
            >
              <View style={[s.checkbox, termsAccepted && s.checkboxActive]}>
                {termsAccepted ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={s.checkboxLabel}>
                {isEn ? 'I agree to the terms' : 'Saya setuju dengan ketentuan'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <PrimaryButton
          label={
            submitting
              ? (isEn ? 'Submitting...' : 'Memproses...')
              : (isEn ? 'Submit Reschedule' : 'Ajukan Reschedule')
          }
          icon="calendar-outline"
          loading={submitting}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  card: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line, padding: spacing.lg,
  },
  label: { ...t.small, fontSize: 11 },
  value: { ...t.subtitle, fontSize: 14 },
  fieldLabel: {
    ...t.small, fontSize: 11, fontWeight: '800',
    letterSpacing: 0.4, color: c.textMuted, marginTop: spacing.sm,
  },
  hint: { ...t.small, fontSize: 11 },
  dateCell: {
    width: 58, paddingVertical: spacing.md, marginRight: spacing.sm,
    alignItems: 'center', borderRadius: radius.md, borderWidth: 1,
    borderColor: c.line, backgroundColor: c.base,
  },
  dateCellActive: { backgroundColor: c.primary, borderColor: c.primary },
  dateDow: { ...t.small, fontSize: 10, textTransform: 'uppercase' },
  dateNum: { color: c.text, fontSize: 18, fontWeight: '900' },
  dateMon: { ...t.small, fontSize: 10 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    width: '48%', paddingVertical: spacing.md,
    alignItems: 'center', borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
    backgroundColor: c.surface, gap: 2,
  },
  slotActive: { backgroundColor: c.primary, borderColor: c.primary },
  slotDisabled: { backgroundColor: c.surfaceAlt, opacity: 0.5 },
  slotText: { ...t.subtitle, fontSize: 13, fontWeight: '700' },
  slotTextDisabled: { textDecorationLine: 'line-through' },
  slotSub: { ...t.small, fontSize: 10 },
  termsCard: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
    padding: spacing.lg, gap: spacing.sm,
  },
  termsTitle: { ...t.subtitle, fontSize: 14, fontWeight: '900' },
  termsText: { ...t.body, fontSize: 13, lineHeight: 20 },
  checkboxRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginTop: spacing.md,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: c.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: c.primary, borderColor: c.primary },
  checkboxLabel: { ...t.body, fontSize: 13, flex: 1 },
});
