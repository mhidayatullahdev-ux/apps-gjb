// src/context/NotificationsContext.js
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationsApi } from '../api/notifications';
import { initEcho } from '../api/echo';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);
const READ_IDS_KEY = 'dispora.readNotifIds';

export function NotificationsProvider({ children }) {
  const { isLoggedIn, user } = useAuth();
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const readIdsLoaded = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => { appStateRef.current = state; });
    return () => sub.remove();
  }, []);

  // ==== Load readIds dari storage sekali ====
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(READ_IDS_KEY);
        if (raw) {
          setReadIds(new Set(JSON.parse(raw)));
        }
      } catch {}
      readIdsLoaded.current = true;
    })();
  }, []);

  const persistReadIds = async (set) => {
    try {
      await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...set]));
    } catch {}
  };

  // ==== Hitung unread dari list (bukan dari server) ====
  const unreadCount = useMemo(() => {
    return items.filter((n) => !n.is_read && !readIds.has(n.id)).length;
  }, [items, readIds]);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setItems([]);
      return;
    }
    if (!readIdsLoaded.current) return; // tunggu readIds selesai load

    setLoading(true);
    try {
      const res = await notificationsApi.list();
      const list = res?.notifications?.data || [];
      setItems(list);
    } catch (e) {
      // diamkan
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Load awal
  useEffect(() => { load(); }, [load]);

  // ==== Persist readIds ke storage saat berubah ====
  useEffect(() => {
    if (!readIdsLoaded.current) return;
    persistReadIds(readIds);
  }, [readIds]);

  // ==== Real-time refresh saat chat baru ====
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    let chatChannel = null;
    let notifChannel = null;
    let echoRef = null;
    let isActive = true;

    (async () => {
      const echo = await initEcho();
      if (!echo || !isActive) return;
      echoRef = echo;

      // Listener Notifikasi Sistem (Booking, Pembayaran, dll)
      notifChannel = echo.private(`App.Models.User.${user.id}`);
      notifChannel.notification((notification) => {
        if (!isActive) return;
        Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title || 'Notifikasi Baru',
            body: notification.message || 'Ada pembaruan dari sistem.',
            data: notification.data || {},
            sound: true,
          },
          trigger: null,
        }).catch(() => {});
        load();
      });

      chatChannel = echo.private(`chat.${user.id}`);
      chatChannel.listen('.new-message', (data) => {
        if (!isActive) return;
        if (data.sender_type === 'admin') {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Pesan Baru dari Admin',
              body: data.message,
              data: { type: 'chat_reply' },
              sound: true,
            },
            trigger: null,
          }).catch(() => {});
          load();
        }
      });
    })();

    return () => {
      isActive = false;
      if (chatChannel) {
        try { chatChannel.stopListening('.new-message'); } catch {}
      }
      if (echoRef) {
        try { echoRef.leave(`chat.${user.id}`); } catch {}
        try { echoRef.leave(`App.Models.User.${user.id}`); } catch {}
      }
    };
  }, [isLoggedIn, user?.id, load]);

  // Fallback polling 60 detik — skip saat app di-background
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      if (appStateRef.current === 'active') load();
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, load]);

  // ==== Mark satu baca ====
  const markRead = useCallback(async (id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(String(id));
      return next;
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));

    try {
      await notificationsApi.markRead(id);
    } catch (e) {
      console.warn('[Notif] markRead failed:', e);
    }
  }, []);

  // ==== Mark semua baca ====
  const markAllRead = useCallback(async () => {
    const ids = items.map((n) => String(n.id));
    setReadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await notificationsApi.markAllRead();
    } catch (e) {
      console.warn('[Notif] markAllRead failed:', e);
    }
  }, [items]);

  // ==== Mark semua yang tipe chat_reply ====
  const markChatRepliesRead = useCallback(async () => {
    const chatIds = items
      .filter((n) => n.type === 'chat_reply' && !n.is_read && !readIds.has(n.id))
      .map((n) => String(n.id));

    if (chatIds.length === 0) return;

    setReadIds((prev) => {
      const next = new Set(prev);
      chatIds.forEach((id) => next.add(id));
      return next;
    });

    setItems((prev) =>
      prev.map((n) =>
        chatIds.includes(String(n.id)) ? { ...n, is_read: true } : n
      )
    );

    // Call API satu-satu (kalau backend gak support bulk per-type)
    for (const id of chatIds) {
      try {
        await notificationsApi.markRead(id);
      } catch {}
    }
  }, [items, readIds]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      refresh: load,
      markRead,
      markAllRead,
      markChatRepliesRead,
    }),
    [items, unreadCount, loading, load, markRead, markAllRead, markChatRepliesRead]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications harus dipakai di dalam NotificationsProvider');
  return ctx;
}