import React from 'react';
import { View, Text, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../i18n/i18n';

export default function TermsModal({ visible, onClose }) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const settings = useSettings();
  const insets = useSafeAreaInsets();
  const s = useThemedStyles(makeStyles);
  const isEn = lang === 'en';

  const content = settings?.terms?.content || (isEn ? 'Terms and conditions are not available.' : 'Syarat dan ketentuan belum tersedia.');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Text style={s.headerTitle}>{isEn ? 'Terms & Conditions' : 'Syarat & Ketentuan'}</Text>
          <Pressable onPress={onClose} style={s.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scrollContent}>
          {lines.map((line, index) => {
            // Deteksi Heading Angka (contoh: "1. Ketentuan Umum")
            const isHeading = /^\d+\.\s/.test(line);
            // Deteksi Bullet (contoh: "- Weekday")
            const isBullet = /^[-•*]\s/.test(line);

            if (isHeading) {
              return (
                <Text key={index} style={s.heading}>
                  {line}
                </Text>
              );
            }
            if (isBullet) {
              return (
                <View key={index} style={s.bulletRow}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{line.replace(/^[-•*]\s/, '')}</Text>
                </View>
              );
            }
            return (
              <Text key={index} style={s.paragraph}>
                {line}
              </Text>
            );
          })}
        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Pressable style={s.agreeBtn} onPress={onClose}>
            <Text style={s.agreeBtnText}>{isEn ? 'I Understand' : 'Saya Mengerti'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c, t) => ({
  container: { flex: 1, backgroundColor: c.base },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.line,
  },
  headerTitle: { ...t.subtitle, fontSize: 16, fontWeight: '900' },
  closeBtn: { padding: spacing.xs },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { ...t.subtitle, fontSize: 15, fontWeight: '900', color: c.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  paragraph: { ...t.body, fontSize: 14, lineHeight: 22, color: c.textMuted, marginBottom: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, paddingLeft: spacing.sm },
  bulletDot: { fontSize: 14, color: c.primary, fontWeight: '900', lineHeight: 22 },
  bulletText: { ...t.body, fontSize: 14, lineHeight: 22, color: c.textMuted, flex: 1 },
  footer: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface,
  },
  agreeBtn: {
    backgroundColor: c.primary, borderRadius: radius.pill,
    paddingVertical: 14, alignItems: 'center',
  },
  agreeBtnText: { color: c.onPrimary, fontSize: 15, fontWeight: '800' },
});
