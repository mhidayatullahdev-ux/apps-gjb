// src/screens/PrivacyPolicyScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import haptic from '../utils/haptics';

export default function PrivacyPolicyScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  // ✅ Callback dari OnboardingScreen (opsional)
  const onAccept = route?.params?.onAccept;

  const [checked, setChecked] = useState(!!onAccept ? false : true);
  const [finishing, setFinishing] = useState(false);

  const sections = [
    {
      icon: 'information-circle-outline',
      title: '1. Informasi Umum',
      body:
        'Aplikasi Gelanggang Jakbar dikelola oleh Dinas Pemuda dan Olahraga Provinsi DKI Jakarta. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan aplikasi.',
    },
    {
      icon: 'person-outline',
      title: '2. Data yang Kami Kumpulkan',
      body:
        'Kami mengumpulkan data berikut untuk keperluan layanan:\n\n' +
        '• Nama lengkap\n' +
        '• Alamat email\n' +
        '• Nomor NIK (KTP)\n' +
        '• Nomor telepon\n' +
        '• Jenis kelamin & tanggal lahir\n' +
        '• Foto profil (opsional)\n' +
        '• Riwayat booking & pembayaran\n' +
        '• Foto bukti pembayaran',
    },
    {
      icon: 'shield-checkmark-outline',
      title: '3. Penggunaan Data',
      body:
        'Data yang Anda berikan digunakan untuk:\n\n' +
        '• Verifikasi identitas saat booking lapangan\n' +
        '• Konfirmasi pembayaran & penerbitan barcode check-in\n' +
        '• Mengirim notifikasi terkait status booking\n' +
        '• Meningkatkan kualitas layanan',
    },
    {
      icon: 'lock-closed-outline',
      title: '4. Perlindungan Data',
      body:
        'Kami menggunakan enkripsi HTTPS untuk semua komunikasi. Password Anda disimpan dalam bentuk hash. Data NIK hanya digunakan untuk verifikasi di GOR dan tidak dibagikan ke pihak ketiga tanpa izin Anda.',
    },
    {
      icon: 'share-social-outline',
      title: '5. Berbagi Data',
      body:
        'Kami TIDAK menjual atau menyewakan data pribadi Anda. Data hanya dibagikan kepada:\n\n' +
        '• Petugas GOR (untuk verifikasi check-in)\n' +
        '• Penyedia layanan email (untuk kirim invoice & notifikasi)\n' +
        '• Aparat hukum (jika diminta secara resmi)',
    },
    {
      icon: 'hand-left-outline',
      title: '6. Hak Anda',
      body:
        'Anda berhak untuk:\n\n' +
        '• Mengakses dan mengubah data pribadi Anda\n' +
        '• Meminta penghapusan akun\n' +
        '• Menarik persetujuan penggunaan data\n\n' +
        'Hubungi admin melalui fitur Helpdesk untuk permintaan tersebut.',
    },
    {
      icon: 'camera-outline',
      title: '7. Izin Aplikasi',
      body:
        'Aplikasi ini meminta izin:\n\n' +
        '• Kamera & Galeri — untuk upload foto bukti bayar & KTP\n' +
        '• Notifikasi — untuk pengingat booking & status pembayaran\n\n' +
        'Anda dapat menolak izin ini, namun beberapa fitur mungkin terbatas.',
    },
    {
      icon: 'refresh-outline',
      title: '8. Perubahan Kebijakan',
      body:
        'Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui aplikasi. Penggunaan berkelanjutan berarti Anda menyetujui versi terbaru.',
    },
    {
      icon: 'mail-outline',
      title: '9. Kontak',
      body:
        'Untuk pertanyaan tentang kebijakan privasi ini, hubungi:\n\n' +
        'Dinas Pemuda dan Olahraga\n' +
        'Provinsi DKI Jakarta\n\n' +
        'Email: dayattdev@gmail.com\n' +
        'WhatsApp: 6287715882995',
    },
  ];

  const handleAccept = async () => {
    if (finishing) return;

    if (!checked) {
      haptic.warning();
      Alert.alert(
        'Centang Persetujuan',
        'Centang kotak "Saya menyetujui" untuk melanjutkan.',
        [{ text: 'OK' }]
      );
      return;
    }

    setFinishing(true);
    haptic.success();

    try {
      // Simpan flag global
      await AsyncStorage.setItem('dispora.privacyAccepted', '1');

      // Panggil callback ke Onboarding (kalau ada)
      if (onAccept) {
        // ✅ Callback akan handle navigasi (langsung masuk app)
        await onAccept();
      } else {
        // Dari menu Lainnya — balik ke halaman sebelumnya
        navigation.goBack();
      }
    } catch (e) {
      console.warn('[Privacy] accept error:', e);
      setFinishing(false);
    }
  };

  const lastUpdated = '4 Oktober 2026';

  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingBottom: spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.iconWrap}>
            <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
          </View>
          <Text style={s.title}>Kebijakan Privasi</Text>
          <Text style={s.subtitle}>Gelanggang Jakbar</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>Terakhir diperbarui: {lastUpdated}</Text>
          </View>
        </View>

        {/* Intro */}
        <View style={s.intro}>
          <Text style={s.introText}>
            Privasi Anda penting bagi kami. Dokumen ini menjelaskan secara
            transparan bagaimana kami mengelola data pribadi Anda.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((sec, i) => (
          <View key={i} style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIcon}>
                <Ionicons name={sec.icon} size={20} color={colors.primary} />
              </View>
              <Text style={s.sectionTitle}>{sec.title}</Text>
            </View>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        {/* Footer notice */}
        <View style={s.footer}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={s.footerText}>
            Dengan menyetujui, Anda telah membaca dan memahami seluruh isi
            Kebijakan Privasi di atas.
          </Text>
        </View>
      </ScrollView>

      {/* ✅ Sticky bottom — checkbox + tombol */}
      <View
        style={[
          s.stickyBottom,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <Pressable
          onPress={() => {
            haptic.selection();
            setChecked((v) => !v);
          }}
          style={[s.checkRow, checked && s.checkRowActive]}
          hitSlop={8}
        >
          <View style={[s.checkbox, checked && s.checkboxActive]}>
            {checked ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
          </View>
          <Text style={s.checkLabel}>
            Saya menyetujui Kebijakan Privasi Gelanggang Jakbar
          </Text>
        </Pressable>

        <Pressable
          onPress={handleAccept}
          disabled={finishing}
          style={[
            s.acceptBtn,
            { backgroundColor: checked ? colors.primary : colors.textFaint },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={s.acceptText}>
            {finishing ? 'Memproses...' : 'Setuju & Lanjut'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg },

  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: c.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.primary,
    marginTop: -6,
  },
  badge: {
    backgroundColor: c.goldSoft,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  badgeText: {
    color: c.gold,
    fontSize: 11,
    fontWeight: '700',
  },

  intro: {
    backgroundColor: c.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: c.primary,
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
    color: c.text,
    fontStyle: 'italic',
  },

  section: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: c.text,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 21,
    color: c.textMuted,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.success + '10',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: c.success + '40',
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: c.success,
    fontWeight: '700',
  },

  // ============ Sticky Bottom ============
  stickyBottom: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.line,
    backgroundColor: c.surface,
    gap: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: c.line,
    backgroundColor: c.base,
  },
  checkRowActive: {
    borderColor: c.success,
    backgroundColor: c.success + '10',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: c.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: c.success,
    borderColor: c.success,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: c.text,
    fontWeight: '700',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
