// src/screens/RetributionScreen.js
import React, { useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../i18n/i18n';
import { EmptyState } from '../components/common';

function RichText({ text, style, boldStyle }) {
  const parts = String(text || '').split(/(Rp\s?[\d.,]+)/g);
  return (
    <Text style={style}>
      {parts.map((p, i) => {
        if (/^Rp\s?[\d.,]+$/.test(p)) {
          return (
            <Text key={i} style={boldStyle}>
              {p}
            </Text>
          );
        }
        return <Text key={i}>{p}</Text>;
      })}
    </Text>
  );
}

export default function RetributionScreen() {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const settings = useSettings();
  const s = useThemedStyles(makeStyles);

  // ✅ Auto-refresh tarif retribusi setiap kali layar dibuka
  // ✅ Force reload settings setiap kali layar dibuka
  useEffect(() => {
    if (settings.reload) settings.reload();
  }, []); // Empty array = jalan sekali saat mount

  const isEn = lang === 'en';
  const content = settings?.retribution?.content;

  if (!content || !String(content).trim()) {
    return (
      <View style={s.screen}>
        <EmptyState
          icon="cash-outline"
          title={isEn ? 'No data available' : 'Data belum tersedia'}
          hint={
            isEn
              ? 'Retribution rates will appear here once available.'
              : 'Tarif retribusi akan muncul di sini setelah tersedia.'
          }
        />
      </View>
    );
  }

  // Parse content
  const lines = String(content).split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks = lines.map((line) => {
    const bulletMatch = line.match(/^[-•*]\s+(.*)$/);
    if (bulletMatch) return { type: 'bullet', text: bulletMatch[1] };
    return { type: 'text', text: line };
  });

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View style={s.iconBox}>
          <Ionicons name="cash-outline" size={28} color={colors.gold} />
        </View>
        <Text style={s.title}>
          {isEn ? 'Retribution Rates' : 'Tarif Retribusi'}
        </Text>
        <Text style={s.subtitle}>
          {isEn
            ? 'Applicable rates for facility usage'
            : 'Tarif yang berlaku untuk penggunaan fasilitas'}
        </Text>
      </View>

      <View style={s.card}>
        {blocks.map((b, i) => {
          if (b.type === 'bullet') {
            return (
              <View key={i} style={s.bulletRow}>
                <View style={s.bulletDot}>
                  <Ionicons name="checkmark" size={14} color={colors.gold} />
                </View>
                <RichText
                  text={b.text}
                  style={s.bulletText}
                  boldStyle={s.priceBold}
                />
              </View>
            );
          }
          return (
            <RichText
              key={i}
              text={b.text}
              style={[s.paragraph, i > 0 && { marginTop: spacing.md }]}
              boldStyle={s.priceBold}
            />
          );
        })}
      </View>

      <View style={s.note}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.textFaint}
        />
        <Text style={s.noteText}>
          {isEn
            ? 'Rates may change at any time. Contact helpdesk for clarification.'
            : 'Tarif dapat berubah sewaktu-waktu. Hubungi helpdesk untuk klarifikasi.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  header: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  iconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: c.goldSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...t.title, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { ...t.body, fontSize: 13, textAlign: 'center', color: c.textMuted },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  paragraph: { ...t.body, fontSize: 14, lineHeight: 22, color: c.text },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  bulletDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: c.goldSoft,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  bulletText: {
    ...t.body, fontSize: 14, lineHeight: 22,
    flex: 1, color: c.text,
  },
  priceBold: { fontWeight: '900', color: c.gold, fontSize: 15 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  noteText: { ...t.small, fontSize: 11, color: c.textFaint, flex: 1, lineHeight: 16 },
});
