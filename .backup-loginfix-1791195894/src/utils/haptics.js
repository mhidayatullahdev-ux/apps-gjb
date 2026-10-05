// src/utils/haptics.js
// Lazy load expo-haptics — kalau native module belum ada, semua jadi no-op.
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  console.log('[Haptics] Native module tidak tersedia, haptic dinonaktifkan');
}

const safe = (fn) => {
  if (!Haptics) return;
  try { fn(); } catch {}
};

export const haptic = {
  light: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  medium: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  heavy: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  success: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  warning: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  error: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),

  selection: () => safe(() => Haptics.selectionAsync()),
};

export const isHapticsAvailable = () => !!Haptics;

export default haptic;
