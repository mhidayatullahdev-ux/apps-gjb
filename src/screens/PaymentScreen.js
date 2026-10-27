// src/screens/PaymentScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, Linking, Alert, Clipboard, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNetwork } from '../context/NetworkContext';
import { bookingsApi } from '../api/bookings';
import { PrimaryButton, Notice, Divider, Tag } from '../components/common';
import { getBookingStatusLabel, getBookingStatusTone } from '../utils/statusLabel';
import { FadeInUp, PressableScale } from '../components/anim';
import { shareBookingToWhatsApp } from '../utils/share';
import { ensureSavePermission } from '../utils/permissions';
import haptic from '../utils/haptics';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDeadlineFull(iso, lang = 'id') {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const day = days[d.getDay()];
    const date = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hour = pad2(d.getHours());
    const min = pad2(d.getMinutes());
    return `${day}, ${date} ${month} ${year}, ${hour}:${min} WIB`;
  } catch {
    return iso;
  }
}

export default function PaymentScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const { user } = useAuth();
  const { contact, reschedule } = useSettings();
  const { isOnline } = useNetwork();
  const s = useThemedStyles(makeStyles);
  const isEn = lang === 'en';

  const order = route.params?.order;

  if (!order || !order.bookingId) {
    return (
      <View style={s.emptyWrap}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={s.emptyTitle}>Booking tidak ditemukan</Text>
        <PrimaryButton label="Kembali" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  const [booking, setBooking] = useState(order?.booking || null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [countdown, setCountdown] = useState('-- : -- : --');
  const qrRef = useRef(null);
  const qrCardRef = useRef(null);

  const group = order?.group || null;
  const isGroup = !!(group && group.bookings && group.bookings.length > 1);

  // ✅ Schema baru: status booking langsung
  const bookingStatus = booking?.status || 'pending';
  const statusLabel = booking?.status_label || bookingStatus;
  const isExpired = bookingStatus === 'expired' || bookingStatus === 'cancelled';
  const isPending = bookingStatus === 'pending';
  const isApproved = bookingStatus === 'approved';
  const isCompleted = bookingStatus === 'completed';
  const isRejected = bookingStatus === 'rejected';

  const verificationDeadline = booking?.verification_deadline || null;
  const barcode = booking?.barcode || null;

  const bookingCode = isGroup
    ? (group?.group_code || order.bookingCode)
    : (order.bookingCode || 'menunggu konfirmasi');

  const displayAmount = (() => {
    if (isGroup && group?.total_amount != null) return Number(group.total_amount);
    return Number(booking?.total_amount ?? order?.amount ?? 0);
  })();

  const actions = booking?.actions || {};
  const canCancel = actions.can_cancel ?? isPending;
  const canReschedule = actions.can_reschedule ?? (isApproved || isCompleted);
  const canDownloadInvoice = actions.can_download_invoice ?? (isApproved || isCompleted);

  const dateObj = booking?.booking_date ? new Date(booking.booking_date) : new Date();

  // Countdown sampai verification_deadline (hanya kalau pending)
  useEffect(() => {
    if (!verificationDeadline || !isPending) return;

    const tick = () => {
      const diff = new Date(verificationDeadline).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('00 : 00 : 00');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${pad2(hours)} : ${pad2(mins)} : ${pad2(secs)}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [verificationDeadline, isPending]);

  // Cancel
  const cancelBooking = () => {
    Alert.alert(
      isEn ? 'Cancel Booking' : 'Batalkan Booking',
      isEn ? 'Are you sure?' : 'Yakin ingin membatalkan booking ini?',
      [
        { text: isEn ? 'No' : 'Tidak', style: 'cancel' },
        {
          text: isEn ? 'Yes, Cancel' : 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await bookingsApi.cancel(order.bookingId);
              haptic.success();
              Alert.alert(
                'Berhasil',
                isEn ? 'Booking cancelled.' : 'Booking berhasil dibatalkan.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (e) {
              haptic.error();
              Alert.alert('Gagal', e.message || 'Tidak bisa membatalkan booking.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  // Download invoice (per-booking atau grup)
  const downloadInvoice = async () => {
    setDownloading(true);
    haptic.light();
    try {
      let url, headers, filename;

      if (isGroup && group?.group_code && group?.can_download_invoice) {
        // Tiket gabungan grup
        const res = await bookingsApi.downloadGroupInvoice(group.group_code);
        url = res.url;
        headers = res.headers;
        filename = `tiket-grup-${group.group_code}.pdf`;
      } else {
        // Tiket per-booking
        const res = await bookingsApi.downloadInvoice(order.bookingId);
        url = res.url;
        headers = res.headers;
        filename = `tiket-${bookingCode}.pdf`;
      }

      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(url, fileUri, { headers });

      if (downloadRes.status !== 200) {
        throw new Error(`Download failed: ${downloadRes.status}`);
      }

      haptic.success();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: 'application/pdf',
          dialogTitle: isEn ? 'Open Ticket' : 'Buka Tiket',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          isEn ? 'Downloaded' : 'Terunduh',
          `${isEn ? 'Saved to' : 'Tersimpan di'}: ${downloadRes.uri}`,
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      console.error('[Invoice] Error:', e);
      haptic.error();
      Alert.alert('Gagal', e.message || 'Tidak bisa download tiket.');
    } finally {
      setDownloading(false);
    }
  };

  // Share booking ke WA
  const handleShareBooking = async () => {
    haptic.light();
    try {
      await shareBookingToWhatsApp(booking || order, user);
    } catch (e) {
      Alert.alert('Gagal', 'Tidak bisa membuka menu share.');
    }
  };

  // Save barcode ke galeri
  const downloadQR = async () => {
    if (!qrCardRef.current) {
      return Alert.alert('Info', 'E-Ticket belum siap. Coba beberapa saat lagi.');
    }

    const ok = await ensureSavePermission({
      title: isEn ? 'Storage Permission Required' : 'Izin Penyimpanan Diperlukan',
      message: isEn
        ? 'App needs permission to save E-Ticket to gallery.'
        : 'Aplikasi membutuhkan izin untuk menyimpan E-Ticket ke galeri.',
    });
    if (!ok) return;

    try {
      // ✅ Capture seluruh E-Ticket (QR + text) jadi PNG
      const uri = await qrCardRef.current.capture();

      const fileUri = `${FileSystem.documentDirectory}eticket-${bookingCode}.png`;
      await FileSystem.copyAsync({ from: uri, to: fileUri });

      await MediaLibrary.saveToLibraryAsync(fileUri);

      haptic.success();
      Alert.alert('Berhasil', 'E-Ticket tersimpan ke galeri.');
    } catch (e) {
      console.error('[QR Save] error:', e);
      Alert.alert(
        'Gagal menyimpan',
        'Tidak bisa menyimpan E-Ticket. Coba lagi atau screenshot manual.'
      );
    }
  };

  const helpdeskMessage = isEn
    ? `Hello GJB Helpdesk,\n\nI want to confirm my booking:\n\n• Item: ${order.item}\n• Amount: Rp ${displayAmount.toLocaleString('id-ID')}\n• Booking Code: ${bookingCode}\n• Name: ${user?.name || '-'}\n\nPlease assist.`
    : `Halo Helpdesk GJB,\n\nSaya ingin konfirmasi booking:\n\n• Item: ${order.item}\n• Jumlah: Rp ${displayAmount.toLocaleString('id-ID')}\n• Kode Booking: ${bookingCode}\n• Nama: ${user?.name || '-'}\n\nMohon dibantu. Terima kasih.`;

  // ✅ Pakai WA fasilitas (dari booking), fallback ke global settings
  const facilityWaBase = (() => {
    // Coba dari booking langsung
    if (booking?.court?.facility?.whatsapp_url) {
      return booking.court.facility.whatsapp_url;
    }
    // Coba dari group bookings
    if (group?.bookings?.[0]?.court?.facility?.whatsapp_url) {
      return group.bookings[0].court.facility.whatsapp_url;
    }
    // Fallback ke settings global
    if (contact?.whatsapp) {
      return `https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}`;
    }
    return null;
  })();

  const waUrl = facilityWaBase
    ? `${facilityWaBase}?text=${encodeURIComponent(helpdeskMessage)}`
    : null;

  const openWhatsApp = () => {
    if (!waUrl) {
      return Alert.alert(
        'WhatsApp belum tersedia',
        'GOR ini belum mengisi nomor WhatsApp. Hubungi admin via Live Chat.'
      );
    }
    Linking.openURL(waUrl).catch(() => {});
  };

  const openLiveChat = () => navigation.navigate('Chat', { prefill: helpdeskMessage, bookingCode });

  const copyCode = () => {
    Clipboard.setString(String(bookingCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // ✅ Status info berdasarkan booking.status
  const statusInfo = (() => {
    if (isExpired) {
      return {
        label: isEn ? 'Expired' : 'Kedaluwarsa',
        hint: isEn ? 'This booking is expired.' : 'Booking ini sudah kedaluwarsa.',
      };
    }
    if (isRejected) {
      return {
        label: isEn ? 'Rejected' : 'Ditolak',
        hint: booking?.rejection_reason || (isEn ? 'This booking was rejected.' : 'Booking ini ditolak admin.'),
      };
    }
    if (isCompleted) {
      return {
        label: isEn ? 'Completed' : 'Selesai',
        hint: isEn ? 'Booking completed.' : 'Booking sudah selesai.',
      };
    }
    if (isApproved) {
      return {
        label: isEn ? 'Verified' : 'Terverifikasi',
        hint: isEn ? 'Your booking is verified. Show the barcode to the officer.' : 'Booking Anda terverifikasi. Tunjukkan barcode ke petugas.',
      };
    }
    return {
      label: isEn ? 'Pending Verification' : 'Menunggu Verifikasi',
      hint: isEn ? 'Waiting for admin verification.' : 'Menunggu verifikasi admin.',
    };
  })();

  const heroColor = isExpired
    ? (colors.textFaint || '#6B7280')
    : isRejected
      ? colors.danger
      : (isApproved || isCompleted)
        ? colors.success
        : colors.gold;

  const heroIcon = isExpired
    ? 'close-circle'
    : isRejected
      ? 'close-circle'
      : (isApproved || isCompleted)
        ? 'checkmark-circle'
        : 'time';

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Hero — DISABLED per klien */}
      {false && (
      <FadeInUp>
        <View style={[s.heroCard, { backgroundColor: heroColor }]}>
          <View style={s.heroIcon}>
            <Ionicons name={heroIcon} size={26} color={colors.onPrimary} />
          </View>
          <Text style={s.heroTitle}>{statusInfo.label}</Text>
          <Text style={s.heroSubtitle}>{statusInfo.hint}</Text>
        </View>
      </FadeInUp>
      )}

      {/* Countdown verifikasi (pending only) */}
      {isPending && verificationDeadline ? (
        <FadeInUp delay={80}>
          <View style={s.countdownCard}>
            <Text style={s.countdownLabel}>
              {isEn ? 'Verification Deadline' : 'Batas Waktu Verifikasi'}
            </Text>
            <View style={s.countdownRow}>
              <Ionicons name="alarm-outline" size={26} color="#F2B705" />
              <Text style={s.countdownValue}>{countdown}</Text>
            </View>
            <View style={s.countdownNote}>
              <Ionicons name="alert-circle" size={16} color="#8B6914" />
              <Text style={s.countdownNoteText}>
                {isEn ? 'Please contact admin before: ' : 'Hubungi admin sebelum :'}
                {'\n'}
                <Text style={s.countdownDate}>
                  {formatDeadlineFull(verificationDeadline, lang)}
                </Text>
              </Text>
            </View>
          </View>
        </FadeInUp>
      ) : null}

      {/* QR E-Ticket (approved / completed) */}
      {(isApproved || isCompleted) ? (
        <FadeInUp delay={100}>
          <View style={s.barcodeCard}>
            <View style={s.barcodeHeader}>
              <Ionicons name="qr-code" size={22} color={colors.success} />
              <Text style={s.barcodeTitle}>
                {isEn ? 'Check-in QR Code' : 'QR Code Check-in'}
              </Text>
            </View>

            {/* E-Ticket untuk disimpan */}
            <ViewShot
              ref={qrCardRef}
              options={{ format: 'png', quality: 1.0 }}
              style={s.qrShotWrap}
            >
              <View style={s.qrShotInner}>
                <View style={s.qrShotHeader}>
                  <Text style={s.qrShotBrand}>Gelanggang Jakbar</Text>
                  <Text style={s.qrShotSub}>E-Ticket Check-in</Text>
                </View>

                <View style={s.qrShotQrWrap}>
                  <QRCode
                    value={String(bookingCode)}
                    size={240}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                    quietZone={16}
                    getRef={(c) => (qrRef.current = c)}
                  />
                </View>

                <View style={s.qrShotInfo}>
                  <Text style={s.qrShotInfoLabel}>
                    {isEn ? 'BOOKING CODE' : 'KODE BOOKING'}
                  </Text>
                  <Text style={s.qrShotInfoCode}>{bookingCode}</Text>

                  {order?.item ? (
                    <>
                      <Text style={[s.qrShotInfoLabel, { marginTop: 14 }]}>
                        {isEn ? 'BOOKING ITEM' : 'ITEM BOOKING'}
                      </Text>
                      <Text style={s.qrShotInfoValue}>{order.item}</Text>
                    </>
                  ) : null}

                  {booking?.booking_date ? (
                    <>
                      <Text style={[s.qrShotInfoLabel, { marginTop: 14 }]}>
                        {isEn ? 'DATE & TIME' : 'TANGGAL & JAM'}
                      </Text>
                      <Text style={s.qrShotInfoValue}>
                        {new Date(booking.booking_date).toLocaleDateString(
                          isEn ? 'en-GB' : 'id-ID',
                          { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                        )}
                        {booking.start_time && booking.end_time
                          ? ` · ${booking.start_time}-${booking.end_time}`
                          : ''}
                      </Text>
                    </>
                  ) : null}

                  <Text style={s.qrShotFooter}>
                    {isEn
                      ? 'Show this QR to the officer on duty.'
                      : 'Tunjukkan QR ini ke petugas saat check-in.'}
                  </Text>
                </View>
              </View>
            </ViewShot>

            <Text style={s.barcodeHint}>
              {isEn ? 'Show this to the officer.' : 'Tunjukkan ini ke petugas.'}
            </Text>
            <PrimaryButton
              label={isEn ? 'Save E-Ticket to Gallery' : 'Simpan E-Ticket ke Galeri'}
              icon="download-outline"
              onPress={downloadQR}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </FadeInUp>
      ) : null}

      {/* Ringkasan Booking */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>{isEn ? 'Booking Summary' : 'Ringkasan Booking'}</Text>
        <Divider style={{ marginVertical: spacing.md }} />

        <Row label="Item" value={order.item} s={s} />
        <Divider />

        <Row
          label={isEn ? 'Amount' : 'Jumlah'}
          value={`Rp ${displayAmount.toLocaleString('id-ID')}`}
          strong
          s={s}
        />
        <Divider />

        <View style={s.codeRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowLabel}>{isEn ? 'Booking Code' : 'Kode Booking'}</Text>
            <Text style={s.codeValue}>{bookingCode}</Text>
          </View>
          <PressableScale onPress={copyCode} style={s.copyBtn}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={14}
              color={copied ? colors.success : colors.primary}
            />
            <Text style={[s.copyText, copied && { color: colors.success }]}>
              {copied ? (isEn ? 'Copied' : 'Tersalin') : (isEn ? 'Copy' : 'Salin')}
            </Text>
          </PressableScale>
        </View>

        {/* Action buttons */}
        {(canReschedule || canDownloadInvoice || canCancel) ? (
          <View style={s.actionRow}>
            {canReschedule ? (
              <PressableScale
                onPress={() => {
                  if (!isOnline) return;
                  haptic.light();
                  navigation.navigate('Reschedule', { booking });
                }}
                disabled={!isOnline}
                style={s.actionBtn}
                scaleTo={0.96}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.gold} />
                <Text style={[s.actionBtnText, { color: colors.gold }]}>
                  {isEn ? 'Reschedule' : 'Ubah Jadwal'}
                </Text>
              </PressableScale>
            ) : null}

            {canDownloadInvoice ? (
              <PressableScale
                onPress={downloadInvoice}
                disabled={downloading || !isOnline}
                style={[s.actionBtn, downloading && { opacity: 0.6 }]}
                scaleTo={0.96}
              >
                <Ionicons name="download-outline" size={18} color={colors.primary} />
                <Text style={s.actionBtnText}>
                  {downloading
                    ? (isEn ? 'Downloading...' : 'Mengunduh...')
                    : (isEn ? 'Ticket' : 'Tiket')}
                </Text>
              </PressableScale>
            ) : null}

            {(isApproved || isCompleted) ? (
              <PressableScale
                onPress={handleShareBooking}
                style={s.actionBtn}
                scaleTo={0.96}
              >
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                <Text style={s.actionBtnText}>{isEn ? 'Share' : 'Bagikan'}</Text>
              </PressableScale>
            ) : null}

            {canCancel ? (
              <PressableScale
                onPress={cancelBooking}
                disabled={cancelling || !isOnline}
                style={[s.actionBtn, s.actionBtnDanger, cancelling && { opacity: 0.6 }]}
                scaleTo={0.96}
              >
                <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                <Text style={[s.actionBtnText, { color: colors.danger }]}>
                  {cancelling
                    ? (isEn ? 'Cancelling...' : 'Membatalkan...')
                    : (isEn ? 'Cancel' : 'Batalkan')}
                </Text>
              </PressableScale>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Daftar Sesi dalam Grup */}
      {isGroup ? (
        <View style={s.card}>
          <Text style={s.sectionTitle}>{isEn ? 'Group Sessions' : 'Daftar Sesi dalam Grup'}</Text>
          <Divider style={{ marginVertical: spacing.md }} />
          {group.bookings.map((b, idx) => {
            const bStatus = b.status || 'pending';
            const bIsTarget = b.id === order.bookingId;

            const bStatusTone = getBookingStatusTone(bStatus);

            return (
              <View
                key={b.id}
                style={[
                  s.sessionRow,
                  bStatus === 'approved' && s.sessionRowApproved,
                  bStatus === 'pending' && s.sessionRowPending,
                  bIsTarget && s.sessionRowTarget,
                ]}
              >
                <View style={s.sessionNum}>
                  <Text style={s.sessionNumText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.sessionHeader}>
                    <Text style={s.sessionCode}>{b.booking_code}</Text>
                    {bIsTarget ? (
                      <View style={s.sessionCurrentBadge}>
                        <Text style={s.sessionCurrentText}>
                          {isEn ? 'CURRENT' : 'SEDANG DILIHAT'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.sessionTime}>
                    {b.booking_date} · {b.start_time}-{b.end_time}
                  </Text>
                  <View style={s.sessionTags}>
                    <Tag label={getBookingStatusLabel(bStatus, isEn)} tone={getBookingStatusTone(bStatus)} />
                  </View>
                  {b.rejection_reason ? (
                    <Text style={s.sessionNote}>
                      {isEn ? 'Reason: ' : 'Alasan: '}{b.rejection_reason}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          <View style={s.sessionTotalRow}>
            <Text style={s.sessionTotalLabel}>
              {isEn ? 'Total' : 'Total'}
            </Text>
            <Text style={s.sessionTotalValue}>
              Rp {displayAmount.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      ) : null}

      {/* T&C Reschedule */}
      {!isExpired && reschedule?.terms ? (
        <View style={s.card}>
          <Text style={s.sectionTitle}>{isEn ? 'Terms & Conditions' : 'Syarat & Ketentuan'}</Text>
          <Divider style={{ marginVertical: spacing.md }} />
          <Text style={s.termsText}>{reschedule.terms}</Text>
          {reschedule?.min_days_before ? (
            <Text style={s.termsHint}>
              {isEn
                ? `Reschedule: min H-${reschedule.min_days_before}, max ${reschedule.max_times}x`
                : `Reschedule: minimal H-${reschedule.min_days_before}, maksimal ${reschedule.max_times}x`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Kontak */}
      <View style={s.actions}>
        <PrimaryButton label="Chat via WhatsApp" icon="logo-whatsapp" onPress={openWhatsApp} />
        <PrimaryButton
          label={isEn ? 'Chat min GJB' : 'Tanya min GJB'}
          variant="ghost"
          icon="chatbubble-ellipses-outline"
          onPress={openLiveChat}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, strong, s }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, strong && s.rowValueStrong]}>{value}</Text>
    </View>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.base, padding: spacing.lg },
  emptyTitle: { ...t.title, textAlign: 'center', marginTop: spacing.md },

  heroCard: { borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  heroIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', lineHeight: 19 },

  countdownCard: {
    backgroundColor: '#0F2A47', borderRadius: radius.lg,
    padding: spacing.lg, gap: spacing.md,
    borderWidth: 1, borderColor: '#1E3A5F',
  },
  countdownLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  countdownValue: {
    fontSize: 38, fontWeight: '900', color: '#F2D576',
    letterSpacing: 2, fontVariant: ['tabular-nums'],
  },
  countdownNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#FAF2D9', borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  countdownNoteText: { flex: 1, color: '#8B6914', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  countdownDate: { fontWeight: '800', color: '#8B6914' },

  qrShotWrap: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  qrShotInner: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  qrShotHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrShotBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D51C29',
    letterSpacing: 0.4,
  },
  qrShotSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  qrShotQrWrap: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
  },
  qrShotInfo: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  qrShotInfoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 1,
    textAlign: 'center',
  },
  qrShotInfoCode: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B0C10',
    fontFamily: 'monospace',
    marginTop: 4,
    letterSpacing: 1,
    textAlign: 'center',
  },
  qrShotInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0C10',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 19,
  },
  qrShotFooter: {
    fontSize: 10,
    color: '#888888',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },

  barcodeCard: {
    backgroundColor: c.surface, borderRadius: radius.lg,
    borderWidth: 2, borderColor: c.success,
    padding: spacing.lg, gap: spacing.md, alignItems: 'center',
  },
  barcodeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barcodeTitle: { ...t.subtitle, fontSize: 15, fontWeight: '900', color: c.success },
  barcodeWrap: {
    padding: spacing.lg, backgroundColor: '#FFFFFF',
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    width: '100%',
  },
  barcodeImage: { width: '100%', height: 100 },
  barcodeCode: { ...t.subtitle, fontSize: 14, fontWeight: '900', letterSpacing: 1, color: c.primary },
  barcodeHint: { ...t.small, fontSize: 11, textAlign: 'center' },

  card: { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: spacing.lg },
  sectionTitle: { ...t.subtitle, fontSize: 14, fontWeight: '900' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.md },
  rowLabel: { ...t.body, fontSize: 13, flex: 1 },
  rowValue: { ...t.subtitle, fontSize: 14, textAlign: 'right', flexShrink: 0, maxWidth: '55%' },
  rowValueStrong: { color: c.primary, fontWeight: '900', fontSize: 16 },

  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, gap: spacing.md },
  codeValue: { color: c.primary, fontSize: 15, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  copyText: { color: c.primary, fontSize: 11, fontWeight: '800' },

  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  actionBtn: {
    flexGrow: 1, flexBasis: '30%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, paddingHorizontal: spacing.md,
    borderRadius: radius.pill, borderWidth: 1, borderColor: c.line,
    backgroundColor: c.surface,
  },
  actionBtnDanger: { borderColor: c.danger, backgroundColor: 'transparent' },
  actionBtnText: { color: c.primary, fontSize: 12, fontWeight: '800' },

  // Session rows
  sessionRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, marginBottom: spacing.xs,
  },
  sessionRowApproved: { backgroundColor: c.successSoft || 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: c.success },
  sessionRowPending: { backgroundColor: c.goldSoft, borderWidth: 1, borderColor: c.gold },
  sessionRowTarget: { borderWidth: 2, borderColor: c.primary },
  sessionNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sessionNumText: { color: c.primary, fontSize: 11, fontWeight: '900' },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sessionCode: { color: c.primary, fontSize: 12, fontWeight: '900', fontFamily: 'monospace', flexShrink: 1 },
  sessionCurrentBadge: { backgroundColor: c.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  sessionCurrentText: { color: c.onPrimary, fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  sessionTime: { ...t.small, fontSize: 11, marginTop: 2 },
  sessionTags: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  sessionNote: { ...t.small, fontSize: 11, marginTop: 4, color: c.danger, fontStyle: 'italic' },
  sessionTotalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: c.line,
    paddingTop: spacing.md, marginTop: spacing.md,
  },
  sessionTotalLabel: { ...t.body, fontSize: 13, fontWeight: '700' },
  sessionTotalValue: { ...t.subtitle, fontSize: 16, fontWeight: '900', color: c.primary },

  termsText: { ...t.body, fontSize: 13, lineHeight: 20 },
  termsHint: { ...t.small, fontSize: 11, marginTop: spacing.sm, fontStyle: 'italic' },

  actions: { marginTop: spacing.sm },
});
