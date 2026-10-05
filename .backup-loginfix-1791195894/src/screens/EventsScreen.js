import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { events } from '../data/content';
import { EventCard } from '../components/cards';
import { EmptyState } from '../components/common';
import { FadeInUp, stagger } from '../components/anim';

const FILTERS = ['Semua', 'Pendaftaran dibuka', 'Akan datang', 'Selesai'];

export default function EventsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const s = useThemedStyles(makeStyles);
  const [filter, setFilter] = useState('Semua');

  const filtered = useMemo(
    () => (filter === 'Semua' ? events : events.filter((e) => e.status === filter)),
    [filter]
  );

  const header = (
    <View style={s.headerWrap}>
      <Text style={s.title}>{t('events.title')}</Text>
      <Text style={s.caption}>{t('events.caption')}</Text>

      <View style={s.chipsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>
                  {f === 'Semua' ? t('common.all') : f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={[s.screen, { paddingTop: insets.top + spacing.sm }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <FadeInUp delay={stagger(index)}>
            <EventCard
              item={item}
              wide
              onPress={() => navigation.navigate('EventDetail', { event: item })}
            />
          </FadeInUp>
        )}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title={t('events.empty')} />}
      />
    </View>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  headerWrap: { gap: spacing.xs, marginBottom: spacing.lg },
  title: { ...t.display, fontSize: 28 },
  caption: { ...t.body },
  chipsRow: { height: 38, marginTop: spacing.md },
  chips: { gap: spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: spacing.md,
    height: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { color: c.textMuted, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: c.onPrimary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
});
