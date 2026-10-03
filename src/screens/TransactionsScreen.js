// src/screens/TransactionsScreen.js
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useNetwork } from '../context/NetworkContext';
import { bookingsApi } from '../api/bookings';
import { EmptyState, Tag, Loader } from '../components/common';
import { FadeInUp, stagger } from '../components/anim';
import OfflineNotice from '../components/OfflineNotice';

export default function TransactionsScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const settings = useSettings();
  const { isOnline } = useNetwork();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('history');

  const load = useCallback(async () => {
    if (!isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await bookingsApi.list();
      const all = res.data || res.bookings?.data || [];
      const historyDays = settings?.booking?.history_days || 30;
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - historyDays);

      const filtered = all.filter((b) => {
        const bDate = new Date(b.booking_date);
        return tab === 'archive' ? bDate < limitDate : bDate >= limitDate;
      });

      // ✅ Sort terbaru di atas — pakai created_at, fallback ke id
      const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at || a.booking_date || 0).getTime();
        const dateB = new Date(b.created_at || b.booking_date || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      setBookings(sorted);
    } catch (e) {
      console.warn('[Transactions] load error:', e);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, settings?.booking?.history_days, isOnline]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openDetail = async (item) => {
    if (!isOnline) return;
    try {
      const res = await bookingsApi.detail(item.id);
      navigation.navigate('Payment', {
        order: {
          item: `${item.court?.facility?.name} - ${item.court?.name}`,
          amount: item.total_amount,
          detail: `${item.purpose} · ${item.booking_date} · ${item.start_time}-${item.end_time}`,
          bookingCode: item.booking_code,
          bookingId: item.id,
          booking: res.booking,
        },
      });
    } catch (e) {
      navigation.navigate('Payment', {
        order: {
          item: `${item.court?.facility?.name} - ${item.court?.name}`,
          amount: item.total_amount,
          detail: `${item.purpose} · ${item.booking_date} · ${item.start_time}-${item.end_time}`,
          bookingCode: item.booking_code,
          bookingId: item.id,
          booking: item,
        },
      });
    }
  };

  if (loading) return <Loader />;

  const header = (
    <View style={s.headerWrap}>
      <Text style={s.title}>Transaksi Saya</Text>
      <View style={s.tabRow}>
        {[
          { id: 'history', label: 'Riwayat' },
          { id: 'archive', label: 'Arsip' },
        ].map((tb) => (
          <Pressable
            key={tb.id}
            onPress={() => setTab(tb.id)}
            style={[s.tab, tab === tb.id && s.tabActive]}
          >
            <Text style={[s.tabText, tab === tb.id && s.tabTextActive]}>
              {tb.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const statusInfo = (status) => {
    const tone =
      status === 'approved' || status === 'completed'
        ? 'success'
        : status === 'pending'
        ? 'gold'
        : status === 'rejected' || status === 'cancelled' || status === 'expired'
        ? 'neutral'
        : 'primary';
    return { label: settings.bookingStatusLabel(status), tone };
  };

  const paymentInfo = (ps) => {
    const tone =
      ps === 'paid'
        ? 'success'
        : ps === 'waiting_verification'
        ? 'gold'
        : 'neutral';
    return { label: settings.paymentStatusLabel(ps), tone };
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            {header}
            <OfflineNotice />
          </>
        }
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={isOnline}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item, index }) => {
          const st = statusInfo(item.status);
          const ps = paymentInfo(item.payment_status);
          return (
            <FadeInUp delay={stagger(index)}>
              <Pressable
                onPress={() => openDetail(item)}
                disabled={!isOnline}
                style={[s.card, !isOnline && { opacity: 0.6 }]}
              >
                <View style={s.cardTop}>
                  <Text style={s.code}>{item.booking_code}</Text>
                  <Tag label={st.label} tone={st.tone} />
                </View>
                <Text style={s.item} numberOfLines={2}>
                  {item.court?.facility?.name} - {item.court?.name}
                </Text>
                <Text style={s.meta}>
                  {item.booking_date} · {item.start_time}-{item.end_time}
                </Text>
                <View style={s.cardFooter}>
                  <View>
                    <Text style={s.totalLabel}>Total</Text>
                    <Text style={s.totalValue}>
                      Rp {Number(item.total_amount).toLocaleString('id-ID')}
                    </Text>
                  </View>
                  {['pending', 'approved', 'completed'].includes(item.status) ? (
                    <Tag label={ps.label} tone={ps.tone} />
                  ) : null}
                </View>
              </Pressable>
            </FadeInUp>
          );
        }}
        ListEmptyComponent={
          !isOnline ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Tidak ada koneksi"
              hint="Sambungkan ke internet lalu pull-to-refresh."
            />
          ) : (
            <EmptyState
              icon="receipt-outline"
              title={tab === 'archive' ? 'Belum ada arsip' : 'Belum ada transaksi'}
              hint={
                tab === 'archive'
                  ? 'Transaksi lama (>30 hari) akan muncul di sini.'
                  : 'Booking yang kamu buat akan muncul di sini.'
              }
            />
          )
        }
      />
    </View>
  );
}

const makeStyles = (c, t) => ({
  headerWrap: { padding: spacing.lg, gap: spacing.md },
  title: { ...t.display, fontSize: 28 },
  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: c.line, backgroundColor: c.surface,
  },
  tabActive: { backgroundColor: c.primary, borderColor: c.primary },
  tabText: { color: c.textMuted, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: c.onPrimary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
  card: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
    padding: spacing.lg, gap: 6,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  code: {
    color: c.primary, fontSize: 13, fontWeight: '900', fontFamily: 'monospace',
  },
  item: { ...t.subtitle, fontSize: 15, lineHeight: 21 },
  meta: { ...t.small, fontSize: 12 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: c.line,
    paddingTop: spacing.md, marginTop: spacing.sm,
  },
  totalLabel: { ...t.small, fontSize: 10 },
  totalValue: { color: c.text, fontSize: 17, fontWeight: '900' },
});
