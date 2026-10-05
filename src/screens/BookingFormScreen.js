// src/screens/BookingFormScreen.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView,
  Platform, TextInput, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import analytics from '../utils/analytics';
import haptic from '../utils/haptics';
import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { bookingsApi } from '../api/bookings';
import { PrimaryButton, Notice, Divider } from '../components/common';

export default function BookingFormScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const settings = useSettings();
  const s = useThemedStyles(makeStyles);
  const isEn = lang === 'en';

  const {
    facility,
    court,
    defaultDate,
    defaultStart,
    defaultEnd,
    purpose: initialPurpose,
  } = route.params || {};

  const purposes = settings.purposes || ['Latihan', 'Kompetisi'];
  const sportLabel = settings.sportLabel
    ? settings.sportLabel(court?.sport_type)
    : court?.sport_type;

  const [purpose, setPurpose] = useState(initialPurpose || purposes[0] || 'Latihan');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState(null);

  const [date, setDate] = useState(() => {
    if (defaultDate) return new Date(defaultDate);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [ktp, setKtp] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dayCount = useMemo(() => {
    if (!isMultiDay || !endDate || !date) return 1;
    const diff = Math.ceil((endDate.getTime() - date.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : 1;
  }, [isMultiDay, date, endDate]);

  const isConsultMode = purpose === 'Kompetisi' && isMultiDay && dayCount > 2;

  useEffect(() => {
    if (isConsultMode) return;
    if (!date || !court?.id) return;

    (async () => {
      setSlotsLoading(true);
      try {
        const res = await bookingsApi.checkAvailability({
          court_id: court.id,
          date: date.toISOString().slice(0, 10),
        });
        const availableSlots = res.available_slots || [];
        setSlots(availableSlots);

        if (defaultStart && defaultEnd) {
          const found = availableSlots.find(
            (sl) =>
              sl.start_time === defaultStart &&
              sl.end_time === defaultEnd &&
              sl.available
          );
          if (found) {
            setStartTime(found.start_time);
            setEndTime(found.end_time);
          } else {
            setStartTime(null);
            setEndTime(null);
          }
        } else {
          setStartTime(null);
          setEndTime(null);
        }
      } catch (e) {
        console.warn('[BookingForm] Availability error:', e.message);
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [date, court?.id, defaultStart, defaultEnd, isConsultMode]);

  const pickKtp = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert(
        isEn ? 'Permission required' : 'Izin diperlukan',
        isEn ? 'Allow gallery access to upload KTP.' : 'Izinkan akses galeri untuk upload KTP.'
      );
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets?.[0]) setKtp(res.assets[0]);
  };

  const goToHelpdesk = () => {
    const message = isEn
      ? `Hello Helpdesk,\n\nI want to consult about a competition booking:\n\n• Facility: ${court?.facility?.name || facility?.name || '-'}\n• Court: ${court?.name || '-'}\n• Start Date: ${date.toISOString().slice(0, 10)}\n• End Date: ${endDate ? endDate.toISOString().slice(0, 10) : '-'}\n• Total Days: ${dayCount} days\n• Name: ${user?.name || '-'}\n\nPlease assist.`
      : `Halo Helpdesk,\n\nSaya ingin konsultasi pemesanan kompetisi:\n\n• Fasilitas: ${court?.facility?.name || facility?.name || '-'}\n• Lapangan: ${court?.name || '-'}\n• Tanggal Mulai: ${date.toISOString().slice(0, 10)}\n• Tanggal Selesai: ${endDate ? endDate.toISOString().slice(0, 10) : '-'}\n• Total Hari: ${dayCount} hari\n• Nama: ${user?.name || '-'}\n\nMohon dibantu. Terima kasih.`;

    haptic.light();
    navigation.navigate('Chat', { prefill: message });
  };

  const submit = async () => {
    if (isConsultMode) return;

    setError('');
    if (!startTime || !endTime) {
      return setError(
        isEn ? 'Please select a time slot.' : 'Pilih slot jam terlebih dahulu.'
      );
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('court_id', String(court.id));
      formData.append('booking_date', date.toISOString().slice(0, 10));
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
      formData.append('purpose', purpose);
      formData.append('sport_type', court.sport_type);
      if (notes.trim()) formData.append('notes', notes.trim());

      if (ktp) {
        formData.append('ktp', {
          uri: ktp.uri,
          type: ktp.mimeType || 'image/jpeg',
          name: `ktp-${Date.now()}.jpg`,
        });
      }

      const idempotencyKey = Crypto.randomUUID();
      const res = await bookingsApi.store(formData, idempotencyKey);
      const booking = res.booking;

      analytics.logEvent('booking_created', {
        booking_id: booking.id,
        booking_code: booking.booking_code,
        facility: court?.facility?.name,
        facility_id: court?.facility?.id,
        court: court?.name,
        sport: court?.sport_type,
        purpose,
        date: date.toISOString().slice(0, 10),
        start_time: startTime,
        end_time: endTime,
        amount: booking.total_amount,
      });

      haptic.success();

      navigation.replace('Payment', {
        order: {
          item: `${court.facility?.name || facility?.name || ''} - ${court.name}`,
          amount: booking.total_amount,
          detail: `${purpose} · ${date.toLocaleDateString('id-ID')} · ${startTime}-${endTime}`,
          bookingCode: booking.booking_code,
          bookingId: booking.id,
          booking,
        },
      });
    } catch (e) {
      haptic.error();
      setError(e.message || (isEn ? 'Failed to create booking.' : 'Gagal membuat booking.'));
    } finally {
      setLoading(false);
    }
  };

  const nextDays = (count) => {
    const out = [];
    const now = new Date();
    for (let i = 1; i <= count; i++) {
      out.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
    }
    return out;
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.label}>{isEn ? 'Facility' : 'Fasilitas'}</Text>
          <Text style={s.value}>{court?.facility?.name || facility?.name || '-'}</Text>
          <Divider style={{ marginVertical: spacing.sm }} />
          <Text style={s.label}>{isEn ? 'Court' : 'Lapangan'}</Text>
          <Text style={s.value}>{court?.name || '-'}</Text>
          <Divider style={{ marginVertical: spacing.sm }} />
          <Text style={s.label}>{isEn ? 'Date' : 'Tanggal'}</Text>
          <Text style={s.value}>
            {date.toLocaleDateString(isEn ? 'en-GB' : 'id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>

        {error ? <Notice text={error} tone="primary" icon="alert-circle-outline" /> : null}

        {/* PURPOSE DI ATAS */}
        <Text style={s.fieldLabel}>{isEn ? 'PURPOSE' : 'TUJUAN PENGGUNAAN'}</Text>
        <View style={s.chipRow}>
          {purposes.map((p) => (
            <Pressable
              key={p}
              onPress={() => {
                setPurpose(p);
                if (p !== 'Kompetisi') {
                  setIsMultiDay(false);
                  setEndDate(null);
                }
              }}
              style={[s.chip, purpose === p && s.chipActive]}
            >
              <Text style={[s.chipText, purpose === p && s.chipTextActive]}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* Multi-day untuk Kompetisi */}
        {purpose === 'Kompetisi' ? (
          <View style={s.multiDayBox}>
            <Pressable
              onPress={() => {
                const next = !isMultiDay;
                setIsMultiDay(next);
                if (!next) setEndDate(null);
              }}
              style={s.multiDayRow}
            >
              <View style={[s.checkbox, isMultiDay && s.checkboxActive]}>
                {isMultiDay ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={s.multiDayLabel}>
                {isEn ? 'Multi-day (competition)' : 'Lebih dari 1 hari (kompetisi)'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={s.fieldLabel}>{isEn ? 'SPORT' : 'CABOR'}</Text>
        <View style={s.sportDisplay}>
          <Ionicons name="football-outline" size={18} color={colors.primary} />
          <Text style={s.sportDisplayText}>{sportLabel}</Text>
        </View>

        <Text style={s.fieldLabel}>
          {isConsultMode
            ? (isEn ? 'START DATE' : 'TANGGAL MULAI')
            : (isEn ? 'CHANGE DATE' : 'UBAH TANGGAL')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {nextDays(14).map((d) => {
            const active = date.toDateString() === d.toDateString();
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

        {isMultiDay ? (
          <>
            <Text style={s.fieldLabel}>{isEn ? 'END DATE' : 'TANGGAL SELESAI'}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.md }}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {nextDays(14)
                .filter((d) => d > date)
                .map((d) => {
                  const active = endDate && endDate.toDateString() === d.toDateString();
                  return (
                    <Pressable
                      key={d.toISOString()}
                      onPress={() => setEndDate(d)}
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

            {endDate ? (
              <Notice
                text={
                  isEn
                    ? `Total duration: ${dayCount} day(s)`
                    : `Total durasi: ${dayCount} hari`
                }
                tone={isConsultMode ? 'gold' : 'primary'}
                icon="information-circle-outline"
              />
            ) : null}
          </>
        ) : null}

        {isConsultMode ? (
          <View style={s.consultBox}>
            <Ionicons name="chatbubbles-outline" size={28} color={colors.gold} />
            <Text style={s.consultTitle}>
              {isEn ? 'Competition Booking > 2 Days' : 'Booking Kompetisi > 2 Hari'}
            </Text>
            <Text style={s.consultBody}>
              {isEn
                ? 'For competition bookings over 2 days, please consult with our Helpdesk for special arrangements.'
                : 'Untuk pemesanan kompetisi lebih dari 2 hari, silakan konsultasi dengan Helpdesk kami untuk pengaturan khusus.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.fieldLabel}>{isEn ? 'AVAILABLE SLOTS' : 'SLOT TERSEDIA'}</Text>
            {slotsLoading ? (
              <Text style={s.hint}>{isEn ? 'Loading slots...' : 'Memuat slot...'}</Text>
            ) : slots.length === 0 ? (
              <Text style={s.hint}>
                {isEn
                  ? 'No slots available for this date.'
                  : 'Tidak ada slot tersedia untuk tanggal ini.'}
              </Text>
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

            <Text style={s.fieldLabel}>
              {isEn ? 'KTP PHOTO (OPTIONAL)' : 'FOTO KTP (OPSIONAL)'}
            </Text>
            {ktp ? (
              <View style={s.ktpPreview}>
                <Image source={{ uri: ktp.uri }} style={s.ktpImage} />
                <Pressable onPress={() => setKtp(null)} style={s.ktpRemove}>
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={pickKtp} style={s.uploadBtn}>
                <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
                <Text style={s.uploadText}>{isEn ? 'Upload KTP' : 'Unggah KTP'}</Text>
              </Pressable>
            )}

            <Text style={s.fieldLabel}>{isEn ? 'NOTES' : 'CATATAN'}</Text>
            <View style={s.textarea}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={isEn ? 'Optional' : 'Opsional'}
                placeholderTextColor={colors.textFaint}
                multiline
                numberOfLines={3}
                style={s.textareaInput}
              />
            </View>
          </>
        )}

        {isConsultMode ? (
          <PrimaryButton
            label={isEn ? 'Consult with Helpdesk' : 'Konsultasi dengan Helpdesk'}
            icon="chatbubble-ellipses-outline"
            onPress={goToHelpdesk}
            style={{ marginTop: spacing.md }}
          />
        ) : (
          <PrimaryButton
            label={isEn ? 'Create Booking' : 'Buat Booking'}
            icon="arrow-forward"
            loading={loading}
            onPress={submit}
            style={{ marginTop: spacing.md }}
          />
        )}
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
  sportDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: c.primarySoft, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.primary, marginTop: spacing.xs,
  },
  sportDisplayText: {
    ...t.subtitle, fontSize: 15, color: c.primary, fontWeight: '900',
    textTransform: 'capitalize',
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: 8,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: c.line, backgroundColor: c.base,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { color: c.textMuted, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: c.onPrimary },
  multiDayBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
  },
  multiDayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  multiDayLabel: { ...t.body, fontSize: 13, flex: 1, fontWeight: '600' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: c.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: c.primary, borderColor: c.primary },
  dateCell: {
    width: 58, paddingVertical: spacing.md, alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1,
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
  uploadBtn: {
    height: 80, borderRadius: radius.md,
    borderWidth: 2, borderColor: c.line, borderStyle: 'dashed',
    backgroundColor: c.surface,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  uploadText: { ...t.subtitle, fontSize: 13, color: c.primary },
  ktpPreview: {
    width: 140, height: 100, borderRadius: radius.md,
    overflow: 'hidden', position: 'relative',
  },
  ktpImage: { width: '100%', height: '100%' },
  ktpRemove: {
    position: 'absolute', top: 4, right: 4,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  textarea: {
    minHeight: 80, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, backgroundColor: c.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: c.line,
  },
  textareaInput: { color: c.text, fontSize: 14, textAlignVertical: 'top' },
  consultBox: {
    padding: spacing.xl,
    backgroundColor: c.goldSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.gold,
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  consultTitle: {
    ...t.subtitle, fontSize: 16, fontWeight: '900',
    color: c.gold, textAlign: 'center',
  },
  consultBody: {
    ...t.body, fontSize: 13, textAlign: 'center', lineHeight: 19,
  },
});
