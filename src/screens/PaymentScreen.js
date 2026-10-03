// src/screens/PaymentScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, Linking, Alert, Clipboard, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNetwork } from '../context/NetworkContext';
import { bookingsApi } from '../api/bookings';
import { PrimaryButton, Notice, Divider } from '../components/common';
import { FadeInUp, PressableScale } from '../components/anim';
import { shareBookingToWhatsApp } from '../utils/share';
import { scheduleBookingReminder, isNotificationsAvailable } from '../services/notifications';
import haptic from '../utils/haptics';
import analytics from '../utils/analytics';

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

function formatDeadline(iso, lang = 'id') {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function PaymentScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const s = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const { contact, payment, reschedule } = useSettings();
  const { isOnline } = useNetwork();
  const qrRef = useRef(null);

  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [proof, setProof] = useState(null);
  const [booking, setBooking] = useState(route.params?.order?.booking || null);
  const [countdown, setCountdown] = useState('-- : -- : --');

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

  const isEn = lang === 'en';
  const bookingCode = order.bookingCode || 'menunggu konfirmasi';
  const paymentStatus = booking?.payment_status || 'unpaid';
  const proofUrl = booking?.payment?.proof_url || null;
  const rejectionNote = booking?.payment?.note || null;
  const isPaid = paymentStatus === 'paid';

  const deadline = booking?.payment?.deadline || null;
  const deadlineFormatted = formatDeadline(deadline, lang);

  const qrData = booking?.qr_content || bookingCode;

  const actions = booking?.actions || {};
  const canUpload = actions.can_upload_payment !== undefined
    ? actions.can_upload_payment
    : (paymentStatus === 'unpaid' || paymentStatus === 'rejected');
  const canCancel = actions.can_cancel ?? (paymentStatus === 'unpaid');
  const canReschedule = actions.can_reschedule ?? isPaid;
  const canDownloadInvoice = actions.can_download_invoice ?? isPaid;

  // ✅ Countdown timer — hitung mundur sampai deadline
  useEffect(() => {
    const dl = booking?.payment?.deadline;
    if (!dl) return;

    const tick = () => {
      const diff = new Date(dl).getTime() - Date.now();
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
  }, [booking?.payment?.deadline]);

  // ============ Upload ============
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin diperlukan', 'Izinkan akses galeri untuk upload bukti bayar.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) setProof(res.assets[0]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin diperlukan', 'Izinkan akses kamera untuk foto bukti bayar.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) setProof(res.assets[0]);
  };

  const submitProof = async () => {
    if (!proof) {
      Alert.alert('Pilih bukti', 'Pilih atau foto bukti pembayaran terlebih dahulu.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('payment_proof', {
        uri: proof.uri,
        type: proof.mimeType || 'image/jpeg',
        name: `payment-${Date.now()}.jpg`,
      });
      const res = await bookingsApi.uploadPayment(order.bookingId, fd);
      setBooking(res.booking);
      setProof(null);

      haptic.success();
      analytics.logEvent('payment_uploaded', {
        booking_id: order.bookingId,
        booking_code: bookingCode,
      });

      Alert.alert(
        isEn ? 'Success' : 'Berhasil',
        isEn
          ? 'Payment proof uploaded. Waiting for admin verification.'
          : 'Bukti pembayaran diunggah. Menunggu verifikasi admin.'
      );
    } catch (e) {
      haptic.error();
      Alert.alert('Gagal', e.message || 'Gagal upload bukti pembayaran.');
    } finally {
      setUploading(false);
    }
  };

  // ============ Cancel ============
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
              analytics.logEvent('booking_cancelled', { booking_id: order.bookingId });
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

  // ============ Download Invoice ============
  const downloadInvoice = async () => {
    setDownloading(true);
    haptic.light();
    try {
      const { url, headers } = await bookingsApi.downloadInvoice(order.bookingId);
      const fileUri = `${FileSystem.documentDirectory}invoice-${bookingCode}.pdf`;
      const downloadRes = await FileSystem.downloadAsync(url, fileUri, { headers });

      if (downloadRes.status !== 200) {
        throw new Error(`Download failed: ${downloadRes.status}`);
      }

      haptic.success();
      analytics.logEvent('invoice_downloaded', { booking_id: order.bookingId });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: 'application/pdf',
          dialogTitle: isEn ? 'Open Invoice' : 'Buka Invoice',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          isEn ? 'Invoice Downloaded' : 'Invoice Terunduh',
          `${isEn ? 'Saved to' : 'Tersimpan di'}: ${downloadRes.uri}`,
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      console.error('[Invoice] Error:', e);
      haptic.error();
      Alert.alert('Gagal', e.message || 'Tidak bisa download invoice.');
    } finally {
      setDownloading(false);
    }
  };

  // ============ Share Booking ke WA ============
  const handleShareBooking = async () => {
    haptic.light();
    try {
      analytics.logEvent('booking_shared', { booking_id: order.bookingId });
      await shareBookingToWhatsApp(booking || order, user);
    } catch (e) {
      Alert.alert('Gagal', 'Tidak bisa membuka menu share.');
    }
  };

  // ============ Schedule Reminder H-1 ============
  const handleScheduleReminder = async () => {
    if (!booking) return;
    haptic.light();

    if (!isNotificationsAvailable()) {
      Alert.alert(
        'Fitur Belum Tersedia',
        isEn
          ? 'Push notification will be active after the next app update.'
          : 'Fitur pengingat akan aktif setelah update aplikasi berikutnya.'
      );
      return;
    }

    const result = await scheduleBookingReminder(booking);
    if (result) {
      Alert.alert(
        'Pengingat Aktif',
        isEn
          ? 'We will remind you 1 day before your booking.'
          : 'Kami akan mengingatkan Anda H-1 sebelum jadwal booking.'
      );
    } else {
      Alert.alert(
        'Info',
        isEn
          ? 'Cannot set reminder. Booking may be too close or permission denied.'
          : 'Tidak bisa set pengingat. Booking terlalu dekat atau izin notifikasi ditolak.'
      );
    }
  };

  // ============ Download QR ============
  const downloadQR = async () => {
    if (!qrRef.current) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin diperlukan', 'Izinkan akses galeri untuk menyimpan QR code.');
        return;
      }
      qrRef.current.toDataURL(async (data) => {
        try {
          const fileUri = `${FileSystem.cacheDirectory}booking-${bookingCode}.png`;
          await FileSystem.writeAsStringAsync(fileUri, data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await MediaLibrary.saveToLibraryAsync(fileUri);
          haptic.success();
          Alert.alert('Berhasil', 'QR code sudah disimpan ke galeri HP.');
        } catch (e) {
          Alert.alert('Gagal', 'Tidak bisa menyimpan QR code.');
        }
      });
    } catch (e) {
      Alert.alert('Gagal', e.message || 'Tidak bisa menyimpan QR code.');
    }
  };

  const helpdeskMessage = isEn
    ? `Hello Dispora Helpdesk,\n\nI want to confirm my payment:\n\n• Item: ${order.item}\n• Amount: Rp ${Number(order.amount || 0).toLocaleString('id-ID')}\n• Booking Code: ${bookingCode}\n• Name: ${user?.name || '-'}\n\nPlease help me.`
    : `Halo Helpdesk Dispora,\n\nSaya ingin konfirmasi pembayaran:\n\n• Item: ${order.item}\n• Jumlah: Rp ${Number(order.amount || 0).toLocaleString('id-ID')}\n• Kode Booking: ${bookingCode}\n• Nama: ${user?.name || '-'}\n\nMohon dibantu. Terima kasih.`;

  const waNumber = contact?.whatsapp ? String(contact.whatsapp).replace(/\D/g, '') : null;
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(helpdeskMessage)}` : null;

  const openWhatsApp = () => {
    if (!waUrl) return Alert.alert('WhatsApp belum tersedia', 'Admin belum mengisi nomor WhatsApp.');
    Linking.openURL(waUrl).catch(() => {});
  };

  const openLiveChat = () => navigation.navigate('Chat', { prefill: helpdeskMessage, bookingCode });

  const copyCode = () => {
    Clipboard.setString(String(bookingCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const statusInfo = {
    unpaid: { label: isEn ? 'Unpaid' : 'Belum Bayar', hint: isEn ? 'Upload payment proof below.' : 'Upload bukti pembayaran di bawah ini.' },
    waiting_verification: { label: isEn ? 'Waiting verification' : 'Menunggu Verifikasi', hint: isEn ? 'Admin is verifying your payment.' : 'Admin sedang memverifikasi.' },
    paid: { label: isEn ? 'Paid' : 'Lunas', hint: isEn ? 'Payment verified. QR code active.' : 'Pembayaran terverifikasi. QR code aktif.' },
    rejected: { label: isEn ? 'Rejected' : 'Bukti Ditolak', hint: isEn ? 'Please upload again.' : 'Silakan upload ulang.' },
  }[paymentStatus] || { label: paymentStatus, hint: '' };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Hero */}
      <FadeInUp>
        <View style={[s.heroCard, { backgroundColor: colors.primary }]}>
          <View style={s.heroIcon}>
            <Ionicons
              name={
                paymentStatus === 'paid' ? 'checkmark-circle' :
                paymentStatus === 'waiting_verification' ? 'time' :
                paymentStatus === 'rejected' ? 'alert-circle' : 'chatbubbles'
              }
              size={26}
              color={colors.onPrimary}
            />
          </View>
          <Text style={s.heroTitle}>{statusInfo.label}</Text>
          <Text style={s.heroSubtitle}>{statusInfo.hint}</Text>
        </View>
      </FadeInUp>

      {/* Deadline */}
      {canUpload && deadline ? (
        <FadeInUp delay={80}>
          <View style={s.countdownCard}>
            <Text style={s.countdownLabel}>
              {isEn ? 'Payment Deadline' : 'Batas Waktu Pembayaran'}
            </Text>

            <View style={s.countdownRow}>
              <Ionicons name="alarm-outline" size={26} color="#F2B705" />
              <Text style={s.countdownValue}>{countdown}</Text>
            </View>

            <View style={s.countdownNote}>
              <Ionicons name="alert-circle" size={16} color="#8B6914" />
              <Text style={s.countdownNoteText}>
                {isEn ? 'Please pay before: ' : 'Harap lakukan pembayaran sebelum :'}
                {'\n'}
                <Text style={s.countdownDate}>
                  {formatDeadlineFull(deadline, lang)}
                </Text>
              </Text>
            </View>
          </View>
        </FadeInUp>
      ) : null}

      {/* QR Code */}
      {isPaid ? (
        <FadeInUp delay={100}>
          <View style={s.qrCard}>
            <View style={s.qrHeader}>
              <Ionicons name="qr-code" size={22} color={colors.success} />
              <Text style={s.qrTitle}>
                {isEn ? 'Check-in QR Code' : 'QR Code Check-in'}
              </Text>
            </View>
            <View style={s.qrWrap}>
              <QRCode
                value={qrData}
                size={220}
                color="#000000"
                backgroundColor="#FFFFFF"
                getRef={(c) => (qrRef.current = c)}
              />
            </View>
            <Text style={s.qrCode}>{bookingCode}</Text>
            <Text style={s.qrHint}>
              {isEn ? 'Show this QR to the officer.' : 'Tunjukkan QR ini ke petugas.'}
            </Text>
            <PrimaryButton
              label={isEn ? 'Download QR' : 'Simpan QR ke Galeri'}
              icon="download-outline"
              onPress={downloadQR}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </FadeInUp>
      ) : null}

      {/* Ringkasan */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>{isEn ? 'Booking Summary' : 'Ringkasan Booking'}</Text>
        <Divider style={{ marginVertical: spacing.md }} />
        <Row label="Item" value={order.item} s={s} />
        <Divider />
        <Row
          label={isEn ? 'Amount' : 'Jumlah'}
          value={`Rp ${Number(order.amount || 0).toLocaleString('id-ID')}`}
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
        {(canReschedule || canDownloadInvoice || canCancel || isPaid) ? (
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
                    : (isEn ? 'Invoice' : 'Invoice')}
                </Text>
              </PressableScale>
            ) : null}

            {/* ✅ Share ke WA */}
            {isPaid ? (
              <PressableScale
                onPress={handleShareBooking}
                style={s.actionBtn}
                scaleTo={0.96}
              >
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                <Text style={s.actionBtnText}>
                  {isEn ? 'Share' : 'Bagikan'}
                </Text>
              </PressableScale>
            ) : null}

            {/* ✅ Reminder H-1 */}
            {isPaid ? (
              <PressableScale
                onPress={handleScheduleReminder}
                style={s.actionBtn}
                scaleTo={0.96}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.gold} />
                <Text style={[s.actionBtnText, { color: colors.gold }]}>
                  {isEn ? 'Reminder' : 'Pengingat'}
                </Text>
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

      {/* Info pembayaran */}
      {booking?.payment?.bank_name || booking?.payment?.account_number || payment?.bank_name ? (
        <View style={s.card}>
          <Text style={s.sectionTitle}>{isEn ? 'Payment Destination' : 'Tujuan Pembayaran'}</Text>
          <Divider style={{ marginVertical: spacing.md }} />
          {(booking?.payment?.bank_name || payment?.bank_name) ? (
            <Row label="Bank" value={booking?.payment?.bank_name || payment?.bank_name} s={s} />
          ) : null}
          {(booking?.payment?.account_number || payment?.account_number) ? (
            <Row label={isEn ? 'Account No.' : 'No. Rekening'} value={booking?.payment?.account_number || payment?.account_number} s={s} />
          ) : null}
          {(booking?.payment?.account_name || payment?.account_name) ? (
            <Row label={isEn ? 'Account Name' : 'Nama Rekening'} value={booking?.payment?.account_name || payment?.account_name} s={s} />
          ) : null}
          {(booking?.payment?.instructions || payment?.instructions) ? (
            <Notice text={booking?.payment?.instructions || payment?.instructions} tone="primary" icon="information-circle-outline" />
          ) : null}
        </View>
      ) : null}

      {/* Bukti */}
      {proofUrl && paymentStatus !== 'unpaid' ? (
        <View style={s.card}>
          <Text style={s.sectionTitle}>{isEn ? 'Your Payment Proof' : 'Bukti Pembayaran Anda'}</Text>
          <Divider style={{ marginVertical: spacing.md }} />
          <Image source={{ uri: proofUrl }} style={s.proofPreview} resizeMode="cover" />
          {rejectionNote ? (
            <Notice text={`${isEn ? 'Reason' : 'Alasan'}: ${rejectionNote}`} tone="primary" icon="alert-circle-outline" />
          ) : null}
        </View>
      ) : null}

      {/* Upload */}
      {canUpload ? (
        <View style={s.card}>
          <Text style={s.sectionTitle}>
            {paymentStatus === 'rejected'
              ? (isEn ? 'Upload Again' : 'Upload Ulang')
              : (isEn ? 'Upload Payment Proof' : 'Upload Bukti Bayar')}
          </Text>
          <Text style={s.hint}>
            {isEn ? 'Format: JPG/PNG, max 2MB.' : 'Format: JPG/PNG, maks 2MB.'}
          </Text>

          {proof ? (
            <View style={s.proofWrap}>
              <Image source={{ uri: proof.uri }} style={s.proofPreview} resizeMode="cover" />
              <Pressable onPress={() => setProof(null)} style={s.proofRemove}>
                <Ionicons name="close" size={16} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={s.pickRow}>
              <PressableScale onPress={pickImage} style={s.pickBtn} scaleTo={0.96}>
                <Ionicons name="image-outline" size={22} color={colors.primary} />
                <Text style={s.pickText}>{isEn ? 'From Gallery' : 'Dari Galeri'}</Text>
              </PressableScale>
              <PressableScale onPress={takePhoto} style={s.pickBtn} scaleTo={0.96}>
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Text style={s.pickText}>{isEn ? 'Take Photo' : 'Ambil Foto'}</Text>
              </PressableScale>
            </View>
          )}

          {proof ? (
            <PrimaryButton
              label={uploading
                ? (isEn ? 'Uploading...' : 'Mengunggah...')
                : (isEn ? 'Submit Payment Proof' : 'Kirim Bukti Bayar')}
              icon="cloud-upload-outline"
              loading={uploading}
              disabled={!isOnline}
              onPress={submitProof}
              style={{ marginTop: spacing.md }}
            />
          ) : null}
        </View>
      ) : null}

      {/* T&C */}
      {reschedule?.terms ? (
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

      {/* Steps */}
      <View style={s.stepsCard}>
        <Text style={s.sectionTitle}>{isEn ? 'How to pay' : 'Cara bayar'}</Text>
        {[
          isEn ? 'Transfer to the account above.' : 'Transfer ke rekening di atas.',
          isEn ? 'Take a screenshot of the receipt.' : 'Screenshot bukti transfer.',
          isEn ? 'Upload the proof above.' : 'Upload bukti di atas.',
          isEn ? 'Wait for admin verification.' : 'Tunggu admin verifikasi.',
          isEn ? 'QR code becomes active.' : 'QR code check-in Anda aktif.',
        ].map((step, i) => (
          <View key={i} style={s.stepRow}>
            <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Kontak */}
      <View style={s.actions}>
        <PrimaryButton label="Chat via WhatsApp" icon="logo-whatsapp" onPress={openWhatsApp} />
        <PrimaryButton
          label={isEn ? 'Open Live Chat' : 'Buka Live Chat'}
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

  deadlineCard: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start',
    backgroundColor: c.goldSoft, borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: c.gold,
  },
  deadlineLabel: { ...t.small, fontSize: 11, fontWeight: '700', color: c.gold },
  deadlineValue: { ...t.subtitle, fontSize: 16, fontWeight: '900', marginTop: 2 },
  deadlineHint: { ...t.small, fontSize: 11, marginTop: 4 },

  qrCard: {
    backgroundColor: c.surface, borderRadius: radius.lg,
    borderWidth: 2, borderColor: c.success,
    padding: spacing.lg, gap: spacing.md, alignItems: 'center',
  },
  qrHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qrTitle: { ...t.subtitle, fontSize: 15, fontWeight: '900', color: c.success },
  qrWrap: {
    padding: spacing.lg, backgroundColor: '#FFFFFF',
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
  },
  qrCode: { ...t.subtitle, fontSize: 14, fontWeight: '900', letterSpacing: 1, color: c.primary },
  qrHint: { ...t.small, fontSize: 11, textAlign: 'center' },

  countdownCard: {
    backgroundColor: '#0F2A47',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  countdownLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  countdownValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#F2D576',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  countdownNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FAF2D9',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  countdownNoteText: {
    flex: 1,
    color: '#8B6914',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  countdownDate: {
    fontWeight: '800',
    color: '#8B6914',
  },

  card: { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: spacing.lg },
  sectionTitle: { ...t.subtitle, fontSize: 14, fontWeight: '900' },
  hint: { ...t.small, fontSize: 11, marginTop: spacing.xs, marginBottom: spacing.md },

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

  proofPreview: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: c.surfaceAlt },
  proofWrap: { position: 'relative', marginTop: spacing.sm },
  proofRemove: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },

  pickRow: { flexDirection: 'row', gap: spacing.md },
  pickBtn: { flex: 1, minHeight: 90, borderRadius: radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', gap: 6 },
  pickText: { ...t.subtitle, fontSize: 12, color: c.primary },

  termsText: { ...t.body, fontSize: 13, lineHeight: 20 },
  termsHint: { ...t.small, fontSize: 11, marginTop: spacing.sm, fontStyle: 'italic' },

  stepsCard: { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: spacing.lg, gap: spacing.md },
  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: c.primary, fontSize: 11, fontWeight: '900' },
  stepText: { ...t.body, flex: 1, fontSize: 13, lineHeight: 19 },

  actions: { marginTop: spacing.sm },
});
