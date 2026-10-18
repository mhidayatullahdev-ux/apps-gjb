// src/screens/TransactionsScreen.js
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../i18n/i18n';
import { useNetwork } from '../context/NetworkContext';
import { bookingsApi } from '../api/bookings';
import { EmptyState, Tag, Loader } from '../components/common';
import { getBookingStatusLabel, getBookingStatusTone } from '../utils/statusLabel';
import { FadeInUp, stagger } from '../components/anim';
import OfflineNotice from '../components/OfflineNotice';

// Group bookings by group_code
function groupBookings(list) {
  const map = {};
  const singles = [];

  list.forEach((b) => {
    if (b.group_code) {
      if (!map[b.group_code]) map[b.group_code] = [];
      map[b.group_code].push(b);
    } else {
      singles.push({ type: 'single', booking: b });
    }
  });

  const groups = Object.entries(map)
    .filter(([code, bookings]) => bookings.length > 1)  // ✅ 1 sesi jangan jadi grup
    .map(([code, bookings]) => ({
      type: 'group',
      group_code: code,
      bookings: bookings.sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time)),
    }));

  // Booking dengan group_code tapi cuma 1 item → jadi single
  Object.entries(map).forEach(([code, bookings]) => {
    if (bookings.length === 1) {
      singles.push({ type: 'single', booking: bookings[0] });
    }
  });

  return [...groups, ...singles].sort((a, b) => {
    const aTime = a.type === 'group'
      ? new Date(a.bookings[0]?.created_at || a.bookings[0]?.booking_date || 0).getTime()
      : new Date(a.booking?.created_at || a.booking?.booking_date || 0).getTime();
    const bTime = b.type === 'group'
      ? new Date(b.bookings[0]?.created_at || b.bookings[0]?.booking_date || 0).getTime()
      : new Date(b.booking?.created_at || b.booking?.booking_date || 0).getTime();
    return bTime - aTime;
  });
}

export default function TransactionsScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const settings = useSettings();
  const { lang } = useI18n();
  const isEn = lang === 'en';
  const { isOnline } = useNetwork();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('history');
  const [freshGroupData, setFreshGroupData] = useState({});

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

      const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at || a.booking_date || 0).getTime();
        const dateB = new Date(b.created_at || b.booking_date || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
      
  // ✅ Auto-refresh data transaksi setiap 10 detik
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(interval);
  }, [load]);

  return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      // DEBUG grouping
      if (__DEV__) {
        console.log('[TX] loaded:', sorted.length, 'bookings');
        sorted.forEach((b) => {
          console.log('[TX]', b.id, b.booking_code, 'group:', b.group_code || 'null');
        });
      }
      setBookings(sorted);

      // Fetch total fresh untuk grup dari backend
      const groupCodes = [...new Set(sorted.filter(function(b) { return b.group_code; }).map(function(b) { return b.group_code; }))];
      const freshTotals = {};
      await Promise.all(
        groupCodes.map(async function(code) {
          try {
            const gr = await bookingsApi.showGroup(code);
            if (gr && gr.group && gr.group.total_amount != null) {
              freshTotals[code] = {
                total_amount: Number(gr.group.total_amount),
                booking_count: gr.group.booking_count,
              };
            }
          } catch (e) {
            console.warn('[TX] showGroup failed for', code, e && e.message);
          }
        })
      );
      setFreshGroupData(freshTotals);
    } catch (e) {
      console.warn('[Transactions] load error:', e);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, settings?.booking?.history_days, isOnline]);

  

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

  // Open grup → pilih booking yang masih bisa dibayar
  const openGroup = async (group) => {
    if (!isOnline) return;

    // ✅ Pilih booking yang bisa upload payment (bukan yang ditolak)
    // Pilih booking yang masih aktif (pending atau approved)
    const activeBookings = group.bookings.filter(
      (b) => b.status === 'pending' || b.status === 'approved' || b.status === 'completed'
    );
    const targetBooking = activeBookings.length > 0
      ? activeBookings[0]
      : group.bookings[0];

    if (!targetBooking) return;

    try {
      let groupData = null;
      try {
        const gr = await bookingsApi.showGroup(group.group_code);
        groupData = gr.group || null;
      } catch (err) {
        console.warn('[Transactions] showGroup error:', err?.message);
      }

      let bookingDetail = targetBooking;
      try {
        const res = await bookingsApi.detail(targetBooking.id);
        bookingDetail = res.booking || targetBooking;
      } catch (err) {
        console.warn('[Transactions] detail error:', err?.message);
      }

      // ✅ Nominal: pakai amount_due dari target booking (backend sudah handle grup)
      const amount = groupData?.total_amount
        ?? group.bookings
          .filter((b) => b.status === 'pending' || b.status === 'approved')
          .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

      navigation.navigate('Payment', {
        order: {
          item: `${targetBooking.court?.facility?.name || ''} - ${targetBooking.court?.name || ''} (Grup)`,
          amount: Number(amount),
          detail: `${targetBooking.purpose} · ${group.bookings.length} sesi`,
          bookingCode: targetBooking.booking_code,
          bookingId: targetBooking.id,
          booking: bookingDetail,
          group: groupData,
        },
      });
    } catch (e) {
      console.warn('[Transactions] openGroup error:', e);
    }
  };

  if (loading) return <Loader />;

  const header = (
    <View style={s.headerWrap}>
      <Text style={s.title}>Riwayat Pemesanan</Text>
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
    return {
      label: getBookingStatusLabel(status, isEn),
      tone: getBookingStatusTone(status),
    };
  };



  const grouped = groupBookings(bookings);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={grouped}
        keyExtractor={(item, i) => item.type === 'group' ? item.group_code : String(item.booking?.id || i)}
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
          // ============ GROUP ============
          if (item.type === 'group') {
            const first = item.bookings[0];
            const st = statusInfo(first.status);
            const fresh = freshGroupData[item.group_code];
            const totalAmount = fresh && fresh.total_amount != null
              ? fresh.total_amount
              : item.bookings.reduce(function(sum, b) { return sum + Number(b.total_amount || 0); }, 0);

            return (
              <FadeInUp delay={stagger(index)}>
                <Pressable
                  onPress={() => openGroup(item)}
                  disabled={!isOnline}
                  style={[s.card, s.cardGroup, !isOnline && { opacity: 0.6 }]}
                >
                  {/* Header grup */}
                  <View style={s.groupHeader}>
                    <View style={s.groupBadge}>
                      <Ionicons name="layers-outline" size={14} color={colors.onPrimary} />
                      <Text style={s.groupBadgeText}>{item.bookings.length} SESI AKTIF</Text>
                    </View>
                    <Tag label={st.label} tone={st.tone} />
                  </View>

                  {/* Ringkasan status per sesi */}
                  <View style={s.statusSummary}>
                    {(() => {
                      const counts = { paid: 0, pending: 0, rejected: 0, expired: 0, cancelled: 0, waiting: 0 };
                      item.bookings.forEach(function(b) {
                        const st = b.status;
                        const ps = b.payment_status;
                        if (st === 'rejected' || ps === 'rejected') counts.rejected++;
                        else if (st === 'expired') counts.expired++;
                        else if (st === 'cancelled') counts.cancelled++;
                        else if (ps === 'paid') counts.paid++;
                        else if (ps === 'waiting_verification') counts.waiting++;
                        else counts.pending++;
                      });

                      const chips = [];
                      if (counts.paid > 0) chips.push({ key: 'paid', label: counts.paid + ' Lunas', color: colors.success });
                      if (counts.waiting > 0) chips.push({ key: 'waiting', label: counts.waiting + ' Verifikasi', color: colors.gold });
                      if (counts.pending > 0) chips.push({ key: 'pending', label: counts.pending + ' Menunggu Bayar', color: colors.gold });
                      if (counts.rejected > 0) chips.push({ key: 'rejected', label: counts.rejected + ' Ditolak', color: colors.danger });
                      if (counts.expired > 0) chips.push({ key: 'expired', label: counts.expired + ' Kedaluwarsa', color: colors.textFaint });
                      if (counts.cancelled > 0) chips.push({ key: 'cancelled', label: counts.cancelled + ' Dibatalkan', color: colors.textFaint });

                      return chips.map(function(c) {
                        return (
                          <View key={c.key} style={s.statusChip}>
                            <View style={[s.statusDot, { backgroundColor: c.color }]} />
                            <Text style={s.statusChipText}>{c.label}</Text>
                          </View>
                        );
                      });
                    })()}
                  </View>

                  <Text style={s.code}>{first.booking_code} · GRUP</Text>
                  <Text style={s.item} numberOfLines={2}>
                    {first.court?.facility?.name} - {first.court?.name}
                  </Text>

                  {/* List slot */}
                  <View style={s.slotList}>
                    {item.bookings.map((b) => (
                      <View key={b.id} style={s.slotRow}>
                        <Ionicons name="time-outline" size={13} color={colors.textFaint} />
                        <Text style={s.slotText}>
                          {b.booking_date} · {b.start_time}-{b.end_time}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={s.cardFooter}>
                    <View>
                      <Text style={s.totalLabel}>Total Grup</Text>
                      <Text style={s.totalValue}>
                        Rp {Number(totalAmount).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </FadeInUp>
            );
          }

          // ============ SINGLE ============
          const b = item.booking;
          const st = statusInfo(b.status);
          return (
            <FadeInUp delay={stagger(index)}>
              <Pressable
                onPress={() => openDetail(b)}
                disabled={!isOnline}
                style={[s.card, !isOnline && { opacity: 0.6 }]}
              >
                <View style={s.cardTop}>
                  <Text style={s.code}>{b.booking_code}</Text>
                  <Tag label={st.label} tone={st.tone} />
                </View>
                <Text style={s.item} numberOfLines={2}>
                  {b.court?.facility?.name} - {b.court?.name}
                </Text>
                <Text style={s.meta}>
                  {b.booking_date} · {b.start_time}-{b.end_time}
                </Text>
                <View style={s.cardFooter}>
                  <View>
                    <Text style={s.totalLabel}>Total</Text>
                    <Text style={s.totalValue}>
                      Rp {Number(b.total_amount).toLocaleString('id-ID')}
                    </Text>
                  </View>
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

  // Card common
  card: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
    padding: spacing.lg, gap: 6,
  },
  cardGroup: {
    borderWidth: 2,
    borderColor: c.primary,
    backgroundColor: c.surface,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  code: {
    color: c.primary, fontSize: 12, fontWeight: '900', fontFamily: 'monospace',
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

  // Group specific
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statusSummary: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: c.line,
  },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: c.base,
    borderWidth: 1, borderColor: c.line,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statusChipText: {
    fontSize: 10, fontWeight: '700', color: c.text,
  },

  groupBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.primary,
    paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  groupBadgeText: {
    color: c.onPrimary, fontSize: 10, fontWeight: '900', letterSpacing: 0.6,
  },
  slotList: {
    marginTop: spacing.xs, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: c.line,
    gap: 4,
  },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  slotText: {
    ...t.small, fontSize: 12, color: c.text,
  },
});
