import React, { useState } from 'react';
import { View, Text, ScrollView, Linking, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { Tag, PrimaryButton, Divider } from '../components/common';
import { FadeInUp, PressableScale } from '../components/anim';

const SITE = 'https://dispora.jakarta.go.id';

export default function EventDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const s = useThemedStyles(makeStyles);
  const { event } = route.params;
  const isOpen = event.status === 'Pendaftaran dibuka';
  const [sharing, setSharing] = useState(false);

  const Row = ({ icon, label, value }) => (
    <View style={s.row}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <View style={s.rowBody}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
    </View>
  );

  const onCta = () => {
    if (event.registrationUrl) {
      Linking.openURL(event.registrationUrl).catch(() => {});
      return;
    }
    navigation.navigate('Payment', {
      order: { item: event.title, amount: 75000, detail: event.date },
    });
  };

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = event.registrationUrl || `${SITE}/acara`;
      const message = `${event.title}\n\n${event.date} · ${event.location}\n\n${url}`;
      await Share.share({ title: event.title, message }, { subject: event.title });
    } catch (e) {
      Alert.alert(
        t('news.share'),
        lang === 'en' ? 'Failed to open the share sheet.' : 'Gagal membuka menu berbagi.'
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <FadeInUp>
        <View style={s.tags}>
          <Tag label={event.category} tone="gold" />
          <Tag label={event.status} tone={isOpen ? 'primary' : 'neutral'} />
        </View>
        <Text style={s.title}>{event.title}</Text>
      </FadeInUp>

      <FadeInUp delay={80}>
        <View style={s.infoCard}>
          <Row icon="calendar-outline" label={t('events.date')} value={event.date} />
          <Divider />
          <Row icon="location-outline" label={t('events.location')} value={event.location} />
          <Divider />
          <Row icon="pricetag-outline" label={t('events.category')} value={event.category} />
        </View>
      </FadeInUp>

      <FadeInUp delay={140}>
        <Text style={s.sectionLabel}>{t('events.about')}</Text>
        <Text style={s.body}>{event.description}</Text>
      </FadeInUp>

      <PrimaryButton
        label={isOpen ? t('home.ctaRegister') : t('common.more')}
        icon="arrow-forward"
        onPress={onCta}
        style={{ marginTop: spacing.xl }}
      />

      <PressableScale onPress={onShare} style={s.share} scaleTo={0.95}>
        <Ionicons name="share-social-outline" size={16} color={colors.gold} />
        <Text style={s.shareText}>{t('news.share')}</Text>
      </PressableScale>
    </ScrollView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  tags: { flexDirection: 'row', gap: spacing.sm },
  title: { ...t.display, fontSize: 25, lineHeight: 31, marginTop: spacing.md },
  infoCard: {
    marginTop: spacing.xl,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { ...t.small, fontSize: 11 },
  rowValue: { ...t.subtitle, fontSize: 14, fontWeight: '600' },
  sectionLabel: {
    ...t.eyebrow,
    color: c.textFaint,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  body: { ...t.body, fontSize: 14, lineHeight: 22 },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.line,
  },
  shareText: { color: c.text, fontSize: 13, fontWeight: '700' },
});
