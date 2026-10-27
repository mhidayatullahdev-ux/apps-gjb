// src/screens/HelpdeskScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { useNetwork } from '../context/NetworkContext';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chat';
import { EmptyState, Loader, PrimaryButton } from '../components/common';
import { FadeInUp, stagger } from '../components/anim';
import OfflineNotice from '../components/OfflineNotice';

export default function HelpdeskScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { whatsappUrl } = useSettings();
  const { isLoggedIn } = useAuth();
  const { isOnline } = useNetwork();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await chatApi.messages();
      setMessages(res.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={s.title}>Helpdesk</Text>
        <Text style={s.caption}>Hubungi kami untuk bantuan booking & pembayaran.</Text>

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <PrimaryButton
            label="Buka chat Tanya GJB"
            icon="chatbubble-ellipses-outline"
            disabled={!isOnline}
            onPress={() => {
            if (!isLoggedIn) {
              navigation.navigate('Login', { returnTo: 'Chat' });
              return;
            }
            navigation.navigate('Chat');
          }}
          />
          {whatsappUrl ? (
            <PrimaryButton
              label="Chat WhatsApp"
              variant="ghost"
              icon="logo-whatsapp"
              disabled={!isOnline}
              onPress={() => Linking.openURL(whatsappUrl).catch(() => {})}
            />
          ) : null}
        </View>
      </View>

      <OfflineNotice style={{ marginHorizontal: spacing.lg }} />

      <Text style={s.sectionLabel}>RIWAYAT CHAT</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + spacing.xxl }]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={isOnline}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item, index }) => (
          <FadeInUp delay={stagger(index)}>
            <View style={[s.msgCard, item.sender_type === 'admin' && s.msgCardAdmin]}>
              <View style={s.msgHeader}>
                <Ionicons
                  name={item.sender_type === 'admin' ? 'shield-checkmark' : 'person'}
                  size={14}
                  color={item.sender_type === 'admin' ? colors.primary : colors.textFaint}
                />
                <Text style={s.msgSender}>
                  {item.sender_type === 'admin' ? 'Admin' : 'Anda'}
                </Text>
                <Text style={s.msgTime}>
                  {new Date(item.created_at).toLocaleString('id-ID')}
                </Text>
              </View>
              <Text style={s.msgText}>{item.message}</Text>
            </View>
          </FadeInUp>
        )}
        ListEmptyComponent={
          !isOnline ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Tidak ada koneksi"
              hint="Sambungkan ke internet lalu pull-to-refresh."
            />
          ) : (
            <EmptyState
              icon="chatbubble-outline"
              title="Belum ada chat"
              hint="Mulai percakapan dengan admin lewat tombol di atas."
            />
          )
        }
      />
    </View>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  title: { ...t.display, fontSize: 28 },
  caption: { ...t.body, marginTop: spacing.xs },
  sectionLabel: {
    ...t.eyebrow, color: c.textFaint,
    paddingHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg },
  msgCard: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line, padding: spacing.md, gap: 6,
  },
  msgCardAdmin: { backgroundColor: c.primarySoft, borderColor: c.primary },
  msgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  msgSender: { ...t.subtitle, fontSize: 12, flex: 1 },
  msgTime: { ...t.small, fontSize: 10 },
  msgText: { ...t.body, fontSize: 13 },
});
