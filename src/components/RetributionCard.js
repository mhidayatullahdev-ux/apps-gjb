// src/components/RetributionCard.js
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../i18n/i18n';

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

export default function RetributionCard() {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const settings = useSettings();
  const s = useThemedStyles(makeStyles);

  const content = settings?.retribution?.content;
  if (!content || !String(content).trim()) return null;

  const isEn = lang === 'en';

  const lines = String(content).split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks = lines.map((line) => {
    const bulletMatch = line.match(/^[-•*]\s+(.*)$/);
    if (bulletMatch) return { type: 'bullet', text: bulletMatch[1] };
    return { type: 'text', text: line };
  });

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <View style={s.iconBox}>
          <Ionicons name="cash-outline" size={20} color={colors.gold} />
        </View>
        <Text style={s.title}>
          {isEn ? 'RETRIBUTION RATES' : 'TARIF RETRIBUSI'}
        </Text>
      </View>

      <View style={s.body}>
        {blocks.map((b, i) => {
          if (b.type === 'bullet') {
            return (
              <View key={i} style={s.bulletRow}>
                <View style={s.bulletDot}>
                  <Ionicons name="checkmark" size={12} color={colors.gold} />
                </View>
                <RichText text={b.text} style={s.bulletText} boldStyle={s.priceBold} />
              </View>
            );
          }
          return (
            <RichText
              key={i}
              text={b.text}
              style={[s.paragraph, i > 0 && { marginTop: spacing.sm }]}
              boldStyle={s.priceBold}
            />
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (c, t) => ({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.line,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: c.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    ...t.subtitle, fontSize: 13, fontWeight: '900',
    letterSpacing: 0.8, color: c.gold, flex: 1,
  },
  body: { gap: spacing.sm },
  paragraph: { ...t.body, fontSize: 13, lineHeight: 20, color: c.text },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bulletDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: c.goldSoft,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  bulletText: { ...t.body, fontSize: 13, lineHeight: 20, flex: 1, color: c.text },
  priceBold: { fontWeight: '900', color: c.gold },
});
