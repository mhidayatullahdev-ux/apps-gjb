import React, { useState } from 'react';
import {
  View, Text, Pressable, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { FadeInUp, stagger } from './anim';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INITIAL_LIMIT = 4;

export default function FaqSection({ faqs = [], title = 'Pertanyaan Umum' }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const [openId, setOpenId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (!faqs.length) return null;

  const toggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(openId === id ? null : id);
  };

  const visible = showAll ? faqs : faqs.slice(0, INITIAL_LIMIT);
  const hasMore = faqs.length > INITIAL_LIMIT;

  return (
    <View style={s.wrap}>
      {/* Header — tanpa subtitle "13 pertanyaan" */}
      <View style={s.headerRow}>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>

      {/* List */}
      <View style={s.list}>
        {visible.map((faq, idx) => {
          const open = openId === faq.id;
          return (
            <FadeInUp key={faq.id} delay={stagger(idx, 40, 200)}>
              <Pressable
                onPress={() => toggle(faq.id)}
                style={[s.card, open && s.cardOpen]}
              >
                <View style={s.questionRow}>
                  <View style={[s.qBadge, open && s.qBadgeOpen]}>
                    <Text style={[s.qBadgeText, open && s.qBadgeTextOpen]}>?</Text>
                  </View>
                  <Text
                    style={[s.question, open && s.questionOpen]}
                    numberOfLines={open ? 10 : 2}
                  >
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={open ? colors.primary : colors.textFaint}
                  />
                </View>
                {open ? (
                  <View style={s.answerWrap}>
                    <Text style={s.answer}>{faq.answer}</Text>
                  </View>
                ) : null}
              </Pressable>
            </FadeInUp>
          );
        })}
      </View>

      {/* Toggle show all / less — tanpa jumlah */}
      {hasMore ? (
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowAll((v) => !v);
            if (showAll) setOpenId(null);
          }}
          style={s.moreBtn}
        >
          <Text style={s.moreText}>
            {showAll ? 'Sembunyikan' : 'Tampilkan Semua'}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c, t) => ({
  wrap: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  sectionTitle: { ...t.title, fontSize: 22, lineHeight: 26 },

  list: { gap: spacing.sm },

  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cardOpen: {
    borderColor: c.primary,
    backgroundColor: c.surface,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: c.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  qBadgeOpen: { backgroundColor: c.primary },
  qBadgeText: {
    color: c.primary, fontSize: 13, fontWeight: '900',
  },
  qBadgeTextOpen: { color: c.onPrimary },
  question: {
    ...t.subtitle, fontSize: 14, flex: 1, lineHeight: 20,
  },
  questionOpen: { color: c.primary, fontWeight: '800' },
  answerWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    paddingLeft: 40,
    borderTopWidth: 1,
    borderTopColor: c.line,
  },
  answer: {
    ...t.body, fontSize: 13, lineHeight: 20,
  },

  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
  },
  moreText: {
    color: c.primary, fontSize: 13, fontWeight: '800',
  },
});