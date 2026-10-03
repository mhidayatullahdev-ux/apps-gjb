import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemedStyles, spacing, radius, shadow } from '../theme';
import { Tag } from './common';
import SmartImage from './SmartImage';
import { cleanText } from '../api/dispora';
import { PressableScale } from './anim';

export function HeroCard({ item, onPress, ctaLabel }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const excerpt = cleanText(item.excerpt);

  return (
    <PressableScale onPress={onPress} style={s.hero} scaleTo={0.985}>
      <View style={s.heroMedia}>
        <SmartImage
          uri={item.bannerImage || item.image}
          style={s.heroImage}
          icon="megaphone-outline"
          label={item.title}
        />
        <LinearGradient
          colors={['transparent', 'rgba(11,12,16,0.55)', 'rgba(11,12,16,0.92)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={s.heroBody}>
        <View style={s.heroTags}>
          <Tag label={item.heroBadge || item.type || 'INFO'} tone="primary" />
          {item.date ? <Tag label={item.date} tone="neutral" /> : null}
        </View>
        <Text style={s.heroTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {excerpt ? (
          <Text style={s.heroExcerpt} numberOfLines={1}>
            {excerpt}
          </Text>
        ) : null}
        <View style={s.heroCta}>
          <Text style={s.heroCtaText}>{item.heroCtaText || ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.onPrimary} />
        </View>
      </View>
    </PressableScale>
  );
}

export function ProgramCard({ item, onPress }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const accentColor =
    item.accent === 'gold' ? colors.gold : item.accent === 'blue' ? colors.blue : colors.primary;

  return (
    <PressableScale onPress={onPress} style={s.program} scaleTo={0.96}>
      <View style={s.programMedia}>
        <SmartImage
          uri={item.image}
          style={s.programImage}
          icon="ribbon-outline"
          label={item.title}
        />
        <View style={[s.programStripe, { backgroundColor: accentColor }]} />
      </View>

      <View style={s.programBody}>
        <Tag label={item.tag} tone={item.accent} />
        <Text style={s.programTitle}>{item.title}</Text>
        <Text style={s.programDesc} numberOfLines={3}>
          {item.description}
        </Text>

        {item.children?.length ? (
          <View style={s.programChildren}>
            {item.children.map((ch) => (
              <View key={ch.code} style={s.childRow}>
                <Text style={[s.childCode, { color: accentColor }]}>{ch.code}</Text>
                <Text style={s.childLabel}>{ch.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

export function EventCard({ item, onPress, wide = false }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const isOpen = item.status === 'Pendaftaran dibuka';

  return (
    <PressableScale onPress={onPress} style={[s.event, wide && s.eventWide]} scaleTo={0.97}>
      <View style={s.eventTop}>
        <Tag label={item.category} tone="gold" />
        <Tag label={item.status} tone={isOpen ? 'primary' : 'neutral'} />
      </View>
      <Text style={s.eventTitle} numberOfLines={3}>
        {item.title}
      </Text>
      <View style={s.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.textFaint} />
        <Text style={s.metaText}>{item.date}</Text>
      </View>
      <View style={s.metaRow}>
        <Ionicons name="location-outline" size={13} color={colors.textFaint} />
        <Text style={s.metaText} numberOfLines={2}>
          {item.location}
        </Text>
      </View>
    </PressableScale>
  );
}

export function NewsCard({ item, onPress, compact = false, readLabel }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  return (
    <PressableScale onPress={onPress} style={[s.news, compact && s.newsCompact]} scaleTo={0.975}>
      <View style={s.newsAccent} />

      {item.image ? (
        <SmartImage
          uri={item.image}
          style={s.newsThumb}
          icon="newspaper-outline"
          showLoader={false}
        />
      ) : null}

      <View style={s.newsBody}>
        <View style={s.newsTop}>
          <Tag label={item.category} tone="primary" />
          <Text style={s.newsDate}>{item.date}</Text>
        </View>
        <Text style={s.newsTitle} numberOfLines={compact ? 2 : 3}>{item.title}</Text>
        <Text style={s.newsExcerpt} numberOfLines={compact ? 2 : 3}>{cleanText(item.excerpt)}</Text>
        <View style={s.newsFooter}>
          <Text style={s.newsLink}>{readLabel}</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.gold} />
        </View>
      </View>
    </PressableScale>
  );
}

export function FacilityCard({ item, onPress, actionLabel }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  return (
    <View style={s.facility}>
      <View style={s.facilityIcon}>
        <Ionicons name="business-outline" size={20} color={colors.primary} />
      </View>
      <View style={s.facilityBody}>
        <Text style={s.facilityName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={s.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textFaint} />
          <Text style={s.metaText}>
            {item.area} · {item.type}
          </Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={12} color={colors.textFaint} />
          <Text style={s.metaText}>{item.open}</Text>
        </View>
        <View style={s.facilityFooter}>
          <Text style={s.facilityPrice}>{item.price}</Text>
          <PressableScale onPress={onPress} style={s.bookButton} scaleTo={0.94}>
            <Text style={s.bookButtonText}>{actionLabel}</Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

export function AthleteCard({ item }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.athlete}>
      <SmartImage
        uri={item.image}
        style={s.athleteImage}
        icon="person-outline"
        label={item.name}
      />
      <LinearGradient
        colors={['transparent', 'rgba(11,12,16,0.55)', 'rgba(11,12,16,0.95)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.athleteBody}>
        <Text style={s.athleteAchievement}>{item.achievement}</Text>
        <Text style={s.athleteName}>{item.name}</Text>
        <Text style={s.athleteQuote} numberOfLines={3}>
          {item.quote}
        </Text>
      </View>
    </View>
  );
}

export function TicketCard({ item }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const status = String(item.status || 'OPEN').toUpperCase();
  const tone = status.includes('CLOSE') || status.includes('DONE')
    ? 'success'
    : status.includes('PROGRESS') || status.includes('PENDING')
      ? 'gold'
      : 'primary';

  return (
    <View style={s.ticket}>
      <View style={s.ticketTop}>
        <Text style={s.ticketCode}>#{item.ticketNumber || item.code || item.id}</Text>
        <Tag label={status} tone={tone} />
      </View>
      <Text style={s.ticketSubject} numberOfLines={2}>
        {item.subject || item.title || '-'}
      </Text>
      {item.message || item.description ? (
        <Text style={s.ticketBody} numberOfLines={2}>
          {cleanText(item.message || item.description)}
        </Text>
      ) : null}
      <View style={s.metaRow}>
        <Ionicons name="person-outline" size={12} color={colors.textFaint} />
        <Text style={s.metaText}>{item.name || item.requester || 'Anonim'}</Text>
      </View>
      {item.createdAt ? (
        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={12} color={colors.textFaint} />
          <Text style={s.metaText}>{String(item.createdAt).slice(0, 10)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (c, t) => ({
  pressed: { opacity: 0.85 },

  hero: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.line,
    minHeight: 200,
    ...shadow.card,
  },
  heroMedia: { ...StyleSheet.absoluteFillObject, backgroundColor: c.surfaceAlt },
  heroImage: { width: '100%', height: '100%' },
  heroBody: { marginTop: 'auto', padding: spacing.md, gap: 4 },
  heroTags: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: 2 },
  heroTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  heroExcerpt: {
    fontSize: 10,
    lineHeight: 14,
    color: '#C5CAD6',
    opacity: 0.95,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
    backgroundColor: c.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  heroCtaText: { color: c.onPrimary, fontSize: 11, fontWeight: '800' },

  program: {
    width: 268,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.line,
    overflow: 'hidden',
    ...shadow.card,
  },
  programMedia: { height: 128, backgroundColor: c.surfaceAlt },
  programImage: { width: '100%', height: '100%' },
  programStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  programBody: { padding: spacing.lg, gap: spacing.sm },
  programTitle: { ...t.subtitle, fontSize: 18, fontWeight: '900' },
  programDesc: { ...t.body, fontSize: 13 },
  programChildren: { gap: 6, paddingTop: 2 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  childCode: { fontSize: 11, fontWeight: '900', width: 44 },
  childLabel: { ...t.small, flex: 1 },

  event: {
    width: 250,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    padding: spacing.lg,
    gap: 6,
  },
  eventWide: { width: '100%' },
  eventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  eventTitle: { ...t.subtitle, fontSize: 15, lineHeight: 21, marginBottom: spacing.xs },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...t.small, flex: 1 },

  news: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    overflow: 'hidden',
    minHeight: 120,
    maxHeight: 160,
  },
  newsThumb: {
    width: 96,
    height: '100%',
    backgroundColor: c.surfaceAlt,
  },
  newsCompact: { width: 290 },
  newsAccent: { width: 4, backgroundColor: c.primary },
  newsBody: { flex: 1, padding: spacing.lg, gap: 6 },
  newsTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newsDate: { ...t.small, fontSize: 11 },
  newsTitle: { ...t.subtitle, fontSize: 15, lineHeight: 21 },
  newsExcerpt: { ...t.body, fontSize: 13 },
  newsFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  newsLink: { color: c.gold, fontSize: 12, fontWeight: '800' },

  facility: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    padding: spacing.lg,
  },
  facilityIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityBody: { flex: 1, gap: 5 },
  facilityName: { ...t.subtitle, fontSize: 15 },
  facilityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  facilityPrice: { color: c.gold, fontSize: 13, fontWeight: '800', flex: 1 },
  bookButton: {
    backgroundColor: c.primary,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  bookButtonText: { color: c.onPrimary, fontSize: 12, fontWeight: '800' },

  athlete: {
    width: 220,
    height: 280,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.line,
  },
  athleteImage: { width: '100%', height: '100%' },
  athleteBody: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, gap: 4 },
  athleteAchievement: { ...t.eyebrow, letterSpacing: 0.8 },
  athleteName: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  athleteQuote: { fontSize: 12, lineHeight: 18, color: '#C9CDDA', fontStyle: 'italic' },

  ticket: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    padding: spacing.lg,
    gap: 6,
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketCode: { color: c.primary, fontSize: 12, fontWeight: '900' },
  ticketSubject: { ...t.subtitle, fontSize: 15, lineHeight: 21 },
  ticketBody: { ...t.body, fontSize: 13 },
});