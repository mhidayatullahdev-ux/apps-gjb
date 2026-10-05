import React, { useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useNotifications } from '../context/NotificationsContext';
import { EmptyState, Loader, PrimaryButton } from '../components/common';
import { FadeInUp, stagger } from '../components/anim';

const ICONS = {
  payment_approved: 'checkmark-circle',
  payment_rejected: 'close-circle',
  booking_rejected: 'close-circle',
  chat_reply: 'chatbubble-ellipses',
};

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { items, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading && items.length === 0) return <Loader />;

  const header = (
    <View style={s.headerWrap}>
      <Text style={s.title}>Notifikasi</Text>
      <Text style={s.caption}>
        {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
      </Text>
      {unreadCount > 0 ? (
        <PrimaryButton
          label="Tandai semua dibaca"
          variant="ghost"
          icon="checkmark-done-outline"
          onPress={markAllRead}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={s.screen}
      data={items}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      contentContainerStyle={s.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
      }
      renderItem={({ item, index }) => {
        const unread = !item.is_read;
        return (
          <FadeInUp delay={stagger(index)}>
            <Pressable
              onPress={async () => {
                if (unread) await markRead(item.id);
                if (item.booking_id) {
                  navigation.navigate('Transactions');
                } else {
                  navigation.navigate('Helpdesk');
                }
              }}
              style={[s.card, unread && s.cardUnread]}
            >
              <View style={[s.iconBox, unread && s.iconBoxUnread]}>
                <Ionicons
                  name={ICONS[item.type] || 'notifications-outline'}
                  size={18}
                  color={unread ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, unread && s.cardTitleUnread]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={s.cardBody} numberOfLines={2}>{item.body}</Text>
                <Text style={s.cardTime}>{timeAgo(item.created_at)}</Text>
              </View>
              {unread ? <View style={s.dot} /> : null}
            </Pressable>
          </FadeInUp>
        );
      }}
      ListEmptyComponent={
        <EmptyState icon="notifications-off-outline" title="Belum ada notifikasi"
          hint="Notifikasi akan muncul saat admin membalas chat atau memverifikasi pembayaran." />
      }
    />
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  headerWrap: { paddingVertical: spacing.lg, gap: 4 },
  title: { ...t.display, fontSize: 28 },
  caption: { ...t.body },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
  card: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start',
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line, padding: spacing.lg,
  },
  cardUnread: { backgroundColor: c.primarySoft, borderColor: c.primary },
  iconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceAlt,
  },
  iconBoxUnread: { backgroundColor: 'rgba(255,255,255,0.08)' },
  cardTitle: { ...t.subtitle, fontSize: 14 },
  cardTitleUnread: { fontWeight: '900' },
  cardBody: { ...t.body, fontSize: 13, marginTop: 2 },
  cardTime: { ...t.small, fontSize: 10, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary, marginTop: 8 },
});