// src/services/notifications.js
import { Platform } from 'react-native';

// ============ Lazy load expo-notifications ============
// Native module ini butuh rebuild dev client dulu.
// Sementara kita bungkus try/catch supaya app tidak crash.
let Notifications = null;
let Device = null;
let Constants = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants');

  // Setup handler hanya kalau module berhasil load
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.warn('[Notif] Native module tidak tersedia (butuh rebuild dev client):', e.message);
}

const AVAILABLE = !!Notifications;

export async function registerForPushNotifications() {
  if (!AVAILABLE) {
    console.log('[Notif] Skip — native module belum tersedia');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Notif] Physical device required');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notif] Permission not granted');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D51C29',
      });

      await Notifications.setNotificationChannelAsync('booking-reminder', {
        name: 'Pengingat Booking',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F2B705',
      });
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    console.log('[Notif] Push token:', token);
    return token;
  } catch (e) {
    console.warn('[Notif] Register error:', e.message);
    return null;
  }
}

export async function scheduleBookingReminder(booking) {
  if (!AVAILABLE) {
    console.log('[Notif] Skip reminder — native module belum tersedia');
    return null;
  }

  try {
    if (!booking?.booking_date || !booking?.start_time) return null;

    const bookingDate = new Date(`${booking.booking_date}T${booking.start_time}:00`);
    const reminderDate = new Date(bookingDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(19, 0, 0, 0);

    if (reminderDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Pengingat Booking Besok',
        body: `Jangan lupa! ${booking.court?.name} jam ${booking.start_time} di ${booking.court?.facility?.name}.`,
        data: { bookingId: booking.id, type: 'booking_reminder' },
        sound: true,
      },
      trigger: {
        date: reminderDate,
        channelId: 'booking-reminder',
      },
    });

    console.log('[Notif] Reminder scheduled:', id, 'for', reminderDate);
    return id;
  } catch (e) {
    console.warn('[Notif] Schedule error:', e.message);
    return null;
  }
}

export async function cancelAllReminders() {
  if (!AVAILABLE) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function getAllScheduledReminders() {
  if (!AVAILABLE) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}

export const isNotificationsAvailable = () => AVAILABLE;
