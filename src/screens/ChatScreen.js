// src/screens/ChatScreen.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { chatApi, subscribeChat } from '../api/chat';

let idSeq = 0;
const nextLocalId = () => `local_${Date.now()}_${idSeq++}`;

export default function ChatScreen({ route }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const s = useThemedStyles(makeStyles);
  const listRef = useRef(null);
  const lastServerIdRef = useRef(0);
  const unsubscribeRef = useRef(null);

  const prefill = route.params?.prefill;

  const [input, setInput] = useState(prefill || '');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminTyping, setAdminTyping] = useState(false);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const mapServer = useCallback(
    (m) => ({
      id: `srv_${m.id}`,
      serverId: m.id,
      role: m.sender_type === 'admin' ? 'admin' : 'user',
      text: m.message,
      at: new Date(m.created_at).getTime(),
      isRead: !!m.is_read,
      userName: m.sender_type === 'admin' ? 'Admin Helpdesk' : (user?.name || 'Anda'),
    }),
    [user]
  );

  // ==== Load awal ====
  useEffect(() => {
    (async () => {
      try {
        const res = await chatApi.messages();
        const list = (res.messages || []).map(mapServer);
        setMessages(list);
        if (list.length) lastServerIdRef.current = list[list.length - 1].serverId;
      } catch {
        setMessages([
          {
            id: nextLocalId(),
            role: 'admin',
            text: t('chat.greeting'),
            at: Date.now(),
            userName: 'Admin Helpdesk',
          },
        ]);
      } finally {
        setLoading(false);
        scrollToEnd();
      }
    })();
  }, [mapServer, t, scrollToEnd]);

  // ==== Real-time via WebSocket Reverb ====
  useEffect(() => {
    if (!user?.id) return;

    let isActive = true;

    (async () => {
      const unsubscribe = await subscribeChat(user.id, (data) => {
        if (!isActive) return;
        console.log('[Chat] 📩 Pesan baru:', data);

        const mapped = {
          id: `srv_${data.id}`,
          serverId: data.id,
          role: data.sender_type === 'admin' ? 'admin' : 'user',
          text: data.message,
          at: new Date(data.created_at).getTime(),
          isRead: false,
          userName:
            data.sender_type === 'admin'
              ? (data.admin_name || 'Admin Helpdesk')
              : (user?.name || 'Anda'),
        };

        setMessages((prev) => {
          // Skip kalau sudah ada (dari optimistic update / load awal)
          if (prev.some((m) => m.serverId === mapped.serverId)) return prev;

          // Kalau admin balas → tandai semua pesan user sebagai read
          const adminReplied = mapped.role === 'admin';
          const updated = adminReplied
            ? prev.map((m) => (m.role === 'user' ? { ...m, isRead: true } : m))
            : prev;

          return [...updated, mapped];
        });

        if (data.id > lastServerIdRef.current) {
          lastServerIdRef.current = data.id;
        }
        if (mapped.role === 'admin') setAdminTyping(false);
        scrollToEnd();
      });

      if (isActive) unsubscribeRef.current = unsubscribe;
      else unsubscribe(); // unmount sebelum subscribe selesai
    })();

    return () => {
      isActive = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, scrollToEnd]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const localId = nextLocalId();
    const mine = {
      id: localId,
      role: 'user',
      text,
      at: Date.now(),
      isRead: false,
      userName: user?.name || 'Anda',
    };
    setMessages((prev) => [...prev, mine]);
    setInput('');
    setSending(true);
    scrollToEnd();

    try {
      const res = await chatApi.send(text);
      const serverId = res?.data?.id;
      if (serverId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === localId ? { ...m, serverId } : m))
        );
        if (serverId > lastServerIdRef.current) lastServerIdRef.current = serverId;
      }
      // Tampilkan "Admin sedang mengetik..." sebentar
      setAdminTyping(true);
      setTimeout(() => setAdminTyping(false), 6000);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextLocalId(),
          role: 'admin',
          text: t('chat.error'),
          at: Date.now(),
          error: true,
          userName: 'Sistem',
        },
      ]);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const renderItem = ({ item }) => {
    const mine = item.role === 'user';
    const time = new Date(item.at).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <View style={[s.row, mine ? s.rowMine : s.rowBot]}>
        <View
          style={[
            s.bubble,
            mine ? s.bubbleMine : s.bubbleBot,
            item.error && s.bubbleError,
          ]}
        >
          {!mine ? <Text style={s.senderName}>{item.userName}</Text> : null}
          <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>{item.text}</Text>
          <View style={s.metaRow}>
            <Text style={[s.timeText, mine && s.timeTextMine]}>{time}</Text>
            {mine ? (
              <Ionicons
                name={item.isRead ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.isRead ? '#60A5FA' : 'rgba(255,255,255,0.7)'}
              />
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const ListFooter = adminTyping ? (
    <View style={[s.row, s.rowBot]}>
      <View style={[s.bubble, s.bubbleBot]}>
        <Text style={s.typingText}>Admin sedang mengetik...</Text>
      </View>
    </View>
  ) : null;

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={ListFooter}
        />
      )}

      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={isOnline ? t('chat.placeholder') : 'Tidak ada koneksi internet...'}
          placeholderTextColor={colors.textFaint}
          style={s.input}
          multiline
          maxLength={1000}
          editable={isOnline}
        />
        <Pressable
          onPress={send}
          disabled={!input.trim() || sending || !isOnline}
          style={[s.sendButton, (!input.trim() || sending || !isOnline) && s.sendDisabled]}
        >
          <Ionicons name="send" size={17} color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
  rowMine: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg },
  bubbleBot: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderBottomLeftRadius: radius.sm },
  bubbleMine: { backgroundColor: c.primary, borderBottomRightRadius: radius.sm },
  bubbleError: { borderColor: c.danger },
  senderName: { color: c.primary, fontSize: 11, fontWeight: '800', marginBottom: 3 },
  bubbleText: { ...t.body, color: c.text, fontSize: 14 },
  bubbleTextMine: { color: c.onPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  timeText: { color: c.textFaint, fontSize: 10 },
  timeTextMine: { color: 'rgba(255,255,255,0.75)' },
  typingText: { color: c.textMuted, fontSize: 13, fontStyle: 'italic' },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    backgroundColor: c.base, borderRadius: radius.lg,
    borderWidth: 1, borderColor: c.line, color: c.text, fontSize: 14,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});