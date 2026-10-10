// src/screens/BookingFormScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView,
  Platform, TextInput, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ensureGalleryPermission } from '../utils/permissions';
import * as Crypto from 'expo-crypto';
import haptic from '../utils/haptics';
import analytics from '../utils/analytics';
import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { bookingsApi } from '../api/bookings';
import { PrimaryButton, Notice, Divider } from '../components/common';

export default function BookingFormScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const settings = useSettings();
  const { user, bookingQuota } = useAuth();
  const s = useThemedStyles(makeStyles);
  const isEn = lang === 'en';

  const {
    facility,
    court,
    defaultDate,
    ranges,
    totalPrice,
    totalHours,
    slotCount,
    purpose: initialPurpose,
  } = route.params || {};

  const purpose = initialPurpose || 'Latihan';
  const sportLabel = settings.sportLabel
    ? settings.sportLabel(court?.sport_type)
    : court?.sport_type;

  const [ktp, setKtp] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);  // ✅ Guard double-tap
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const dateObj = defaultDate ? new Date(defaultDate) : new Date();

  // ✅ Booking lebih dari 1 hari ke depan (H+2+)
  const isBookingFarDate = (() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDay = new Date(dateObj);
      bookingDay.setHours(0, 0, 0, 0);
      const diffDays = Math.round((bookingDay.getTime() - today.getTime()) / 86400000);
      return diffDays >= 2;
    } catch {
      return false;
    }
  })();

  const pickKtp = async () => {
    const ok = await ensureGalleryPermission({
      title: isEn ? 'Gallery Permission Required' : 'Izin Galeri Diperlukan',
      message: isEn
        ? 'App needs gallery access to upload KTP. Open settings and enable permission.'
        : 'Aplikasi membutuhkan akses galeri untuk upload KTP. Buka pengaturan HP dan aktifkan izin.',
    });
    if (!ok) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets?.[0]) setKtp(res.assets[0]);
  };

  const buildFarDateMessage = () => {
    return isEn
      ? `Hello GJB Helpdesk,\n\nI want to book for a date more than 1 day ahead:\n\n• Facility: ${court?.facility?.name || facility?.name || '-'}\n• Court: ${court?.name || '-'}\n• Purpose: ${purpose}\n• Sport: ${sportLabel}\n• Booking Date: ${dateObj.toISOString().slice(0, 10)}\n• Name: ${user?.name || '-'}\n\nPlease assist.`
      : `Halo Helpdesk GJB,\n\nSaya ingin booking untuk tanggal lebih dari 1 hari ke depan:\n\n• Fasilitas: ${court?.facility?.name || facility?.name || '-'}\n• Lapangan: ${court?.name || '-'}\n• Tujuan: ${purpose}\n• Cabor: ${sportLabel}\n• Tanggal Booking: ${dateObj.toISOString().slice(0, 10)}\n• Nama: ${user?.name || '-'}\n\nMohon dibantu. Terima kasih.`;
  };

  const goToHelpdeskDate = () => {
    haptic.light();
    navigation.navigate('Chat', { prefill: buildFarDateMessage() });
  };

  const goToWhatsAppDate = () => {
    // ✅ Pakai WA fasilitas dulu (per-GOR), fallback ke global
    let waBase = court?.facility?.whatsapp_url || null;

    if (!waBase) {
      const waNumber = settings.whatsappUrl
        ? String(settings.whatsappUrl).replace(/\D/g, '')
        : (settings.contact?.whatsapp
          ? String(settings.contact.whatsapp).replace(/\D/g, '')
          : null);
      if (!waNumber) {
        Alert.alert('WhatsApp belum tersedia', 'Admin belum mengisi nomor WhatsApp.');
        return;
      }
      waBase = `https://wa.me/${waNumber}`;
    }

    const url = `${waBase}?text=${encodeURIComponent(buildFarDateMessage())}`;
    haptic.light();
    Linking.openURL(url).catch(() => {});
  };

  const submit = async () => {
    // ✅ Guard: block double-tap instan (sebelum state loading update)
    if (submittingRef.current) {
      console.log('[Booking] Ignore double-tap');
      return;
    }
    submittingRef.current = true;

    setError('');

    // ✅ Cek booking quota dari backend
    if (bookingQuota && bookingQuota.can_book === false) {
      submittingRef.current = false;  // reset karena tidak jadi submit
      return setError(
        bookingQuota.message ||
        (isEn ? 'You cannot book right now.' : 'Anda tidak bisa booking saat ini.')
      );
    }

    if (!ranges || ranges.length === 0) {
      submittingRef.current = false;
      return setError(isEn ? 'No slots selected.' : 'Belum ada slot terpilih.');
    }

    setLoading(true);
    setProgress(isEn ? 'Creating booking...' : 'Membuat booking...');

    try {
      const items = ranges.map((r) => ({
        court_id: court.id,
        booking_date: defaultDate,
        start_time: r.start,
        end_time: r.end,
      }));

      const idempotencyKey = Crypto.randomUUID();

      let res;
      if (ktp) {
        const fd = new FormData();
        items.forEach((item, i) => {
          fd.append(`items[${i}][court_id]`, String(item.court_id));
          fd.append(`items[${i}][booking_date]`, item.booking_date);
          fd.append(`items[${i}][start_time]`, item.start_time);
          fd.append(`items[${i}][end_time]`, item.end_time);
        });
        fd.append('purpose', purpose);
        if (notes.trim()) fd.append('notes', notes.trim());
        fd.append('ktp', {
          uri: ktp.uri,
          type: ktp.mimeType || 'image/jpeg',
          name: `ktp-${Date.now()}.jpg`,
        });
        res = await bookingsApi.storeBatchMultipart(fd, idempotencyKey);
      } else {
        res = await bookingsApi.storeBatch({
          items,
          purpose,
          notes: notes.trim() || undefined,
        }, idempotencyKey);
      }

      const group = res.group;
      if (!group || !group.bookings || group.bookings.length === 0) {
        throw new Error(isEn ? 'Invalid response from server.' : 'Respons server tidak valid.');
      }

      const firstBooking = group.bookings[0];

      haptic.success();
      analytics.logEvent('booking_created', {
        group_code: group.group_code,
        count: group.booking_count,
        total: group.total_amount,
        purpose,
      });

      if (group.booking_count === 1) {
        navigation.replace('Payment', {
          order: {
            item: `${court.facility?.name || facility?.name || ''} - ${court.name}`,
            amount: firstBooking.total_amount,
            detail: `${purpose} · ${dateObj.toLocaleDateString('id-ID')} · ${firstBooking.start_time}-${firstBooking.end_time}`,
            bookingCode: firstBooking.booking_code,
            bookingId: firstBooking.id,
            booking: firstBooking,
            group: group,
          },
        });
        return;
      }

      Alert.alert(
        isEn ? 'Booking Created' : 'Booking Berhasil',
        isEn
          ? `${group.booking_count} sesi dibuat.\nTotal: Rp ${Number(group.total_amount).toLocaleString('id-ID')}.\nBayar sekali untuk semua.`
          : `${group.booking_count} sesi dibuat.\nTotal: Rp ${Number(group.total_amount).toLocaleString('id-ID')}.\nBayar sekali untuk semua.`,
        [{
          text: 'OK',
          onPress: () => navigation.replace('Payment', {
            order: {
              item: `${court.facility?.name || facility?.name || ''} - ${court.name}`,
              amount: group.total_amount,
              detail: `${purpose} · ${group.booking_count} slot · ${dateObj.toLocaleDateString('id-ID')}`,
              bookingCode: firstBooking.booking_code,
              bookingId: firstBooking.id,
              booking: firstBooking,
              group: group,
            },
          }),
        }]
      );
    } catch (e) {
      haptic.error();
      setError(e.message || (isEn ? 'Failed.' : 'Gagal.'));
    } finally {
      setLoading(false);
      setProgress('');
      submittingRef.current = false;  // ✅ Reset guard
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.label}>{isEn ? 'Facility' : 'Fasilitas'}</Text>
          <Text style={s.value}>{court?.facility?.name || facility?.name || '-'}</Text>
          <Divider style={{ marginVertical: spacing.sm }} />
          <Text style={s.label}>{isEn ? 'Court' : 'Lapangan'}</Text>
          <Text style={s.value}>{court?.name || '-'}</Text>
          <Divider style={{ marginVertical: spacing.sm }} />
          <Text style={s.label}>{isEn ? 'Purpose' : 'Tujuan'}</Text>
          <Text style={[s.value, { color: colors.primary, fontWeight: '900' }]}>{purpose}</Text>
        </View>

        {/* ✅ Quota Banner */}
        {bookingQuota && bookingQuota.can_book === false ? (
          <View style={{
            flexDirection: 'row', alignItems: 'flex-start', gap: 8,
            padding: spacing.md,
            backgroundColor: '#8B6914' + '20',
            borderRadius: 10,
            borderWidth: 1, borderColor: '#8B6914',
            marginBottom: spacing.sm,
          }}>
            <Ionicons name="lock-closed-outline" size={20} color="#8B6914" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#8B6914', fontSize: 13, fontWeight: '900', marginBottom: 2 }}>
                {isEn ? 'Booking Unavailable' : 'Booking Tidak Tersedia'}
              </Text>
              <Text style={{ color: '#8B6914', fontSize: 12, lineHeight: 18 }}>
                {bookingQuota.message ||
                  (isEn
                    ? 'You cannot book right now.'
                    : 'Anda tidak bisa booking saat ini.')}
              </Text>
              {bookingQuota.next_available_at ? (
                <Text style={{ color: '#8B6914', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                  {isEn ? 'Available again: ' : 'Dapat booking lagi: '}
                  {new Date(bookingQuota.next_available_at).toLocaleString(isEn ? 'en-GB' : 'id-ID')}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {error ? <Notice text={error} tone="primary" icon="alert-circle-outline" /> : null}

        {/* CABOR */}
        <Text style={s.fieldLabel}>{isEn ? 'SPORT' : 'CABOR'}</Text>
        <View style={s.sportDisplay}>
          <Ionicons name="football-outline" size={18} color={colors.primary} />
          <Text style={s.sportDisplayText}>{sportLabel}</Text>
        </View>

        {/* TANGGAL */}
        <Text style={s.fieldLabel}>{isEn ? 'DATE' : 'TANGGAL'}</Text>
        <View style={s.infoBox}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={s.infoBoxText}>
            {dateObj.toLocaleDateString(isEn ? 'en-GB' : 'id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>

        {/* ✅ FAR DATE NOTICE — Booking > 1 hari ke depan */}
        {true ? (
          <View style={s.farDateBox}>
            <Ionicons name="information-circle" size={20} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={s.farDateTitle}>
                {isEn ? 'Booking More Than 1 Day Ahead' : 'Booking Lebih dari 1 Hari'}
              </Text>
              <Text style={s.farDateBody}>
                {isEn
                  ? 'For bookings more than 1 day ahead, please contact admin for confirmation.'
                  : 'Untuk booking lebih dari 1 hari ke depan, silakan hubungi admin untuk konfirmasi.'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* SLOT TERPILIH */}
        <Text style={s.fieldLabel}>{isEn ? 'SELECTED SLOTS' : 'SLOT TERPILIH'}</Text>
        <View style={s.selectedSlotBox}>
          <Ionicons name="list-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            {(ranges || []).map((r, i) => (
              <Text key={i} style={s.selectedSlotRange}>
                • {r.start} - {r.end}
              </Text>
            ))}
            <Text style={s.selectedSlotHint}>
              {slotCount || 0} slot · {totalHours || 0} jam · {ranges?.length || 0} sesi
            </Text>
            <Text style={s.selectedSlotPrice}>
              Rp {Number(totalPrice || 0).toLocaleString('id-ID')}
            </Text>
          </View>
          <Pressable onPress={() => navigation.goBack()} style={s.changeSlotBtn}>
            <Text style={s.changeSlotText}>{isEn ? 'Change' : 'Ubah'}</Text>
          </Pressable>
        </View>

        {/* KTP */}
        <Text style={s.fieldLabel}>{isEn ? 'KTP (OPTIONAL)' : 'FOTO KTP (OPSIONAL)'}</Text>
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

        {/* NOTES */}
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

        {/* ✅ TOMBOL — Kalau H+2 tampil Chat GJB + WA, kalau tidak Buat Booking */}
        <PrimaryButton
          label={
            bookingQuota && bookingQuota.can_book === false
              ? (isEn ? 'Cannot Book Now' : 'Tidak Bisa Booking')
              : loading
                ? progress
                : (isEn ? 'Create Booking' : 'Buat Booking')
          }
          icon={
            bookingQuota && bookingQuota.can_book === false
              ? 'lock-closed-outline'
              : 'arrow-forward'
          }
          loading={loading}
          disabled={bookingQuota && bookingQuota.can_book === false}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />

        <PrimaryButton
          label={isEn ? 'Chat Helpdesk GJB' : 'Chat Helpdesk GJB'}
          variant="ghost"
          icon="chatbubble-ellipses-outline"
          onPress={goToHelpdeskDate}
          style={{ marginTop: spacing.sm }}
        />
        <PrimaryButton
          label={isEn ? 'Chat via WhatsApp' : 'Chat via WhatsApp'}
          variant="ghost"
          icon="logo-whatsapp"
          onPress={goToWhatsAppDate}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  card: { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: spacing.lg },
  label: { ...t.small, fontSize: 11 },
  value: { ...t.subtitle, fontSize: 14 },
  fieldLabel: { ...t.small, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, color: c.textMuted, marginTop: spacing.sm },
  sportDisplay: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: c.primarySoft, borderRadius: radius.md, borderWidth: 1, borderColor: c.primary, marginTop: spacing.xs },
  sportDisplayText: { ...t.subtitle, fontSize: 15, color: c.primary, fontWeight: '900', textTransform: 'capitalize' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, marginTop: spacing.xs },
  infoBoxText: { ...t.body, fontSize: 14, fontWeight: '600' },
  farDateBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    padding: spacing.lg, backgroundColor: c.goldSoft,
    borderRadius: radius.md, borderWidth: 1, borderColor: c.gold,
    marginTop: spacing.md,
  },
  farDateTitle: { ...t.subtitle, fontSize: 14, fontWeight: '900', color: c.gold },
  farDateBody: { ...t.body, fontSize: 12, lineHeight: 18, marginTop: 3 },
  selectedSlotBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, backgroundColor: c.primarySoft, borderRadius: radius.md, borderWidth: 2, borderColor: c.primary, marginTop: spacing.xs },
  selectedSlotRange: { ...t.body, fontSize: 13, fontWeight: '700', color: c.primary, lineHeight: 19 },
  selectedSlotHint: { ...t.small, fontSize: 11, marginTop: 4 },
  selectedSlotPrice: { ...t.subtitle, fontSize: 15, fontWeight: '900', color: c.primary, marginTop: 4 },
  changeSlotBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: c.primary, backgroundColor: c.surface },
  changeSlotText: { color: c.primary, fontSize: 12, fontWeight: '800' },
  uploadBtn: { height: 80, borderRadius: radius.md, borderWidth: 2, borderColor: c.line, borderStyle: 'dashed', backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', gap: 6 },
  uploadText: { ...t.subtitle, fontSize: 13, color: c.primary },
  ktpPreview: { width: 140, height: 100, borderRadius: radius.md, overflow: 'hidden', position: 'relative' },
  ktpImage: { width: '100%', height: '100%' },
  ktpRemove: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  textarea: { minHeight: 80, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line },
  textareaInput: { color: c.text, fontSize: 14, textAlignVertical: 'top' },
});
