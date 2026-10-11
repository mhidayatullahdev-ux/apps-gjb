// src/utils/permissions.js
import { Linking, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function openAppSettings() {
  try {
    await Linking.openSettings();
  } catch (e) {
    console.warn('[Permissions] openSettings error:', e);
    Alert.alert(
      'Tidak bisa buka pengaturan',
      'Silakan buka Settings HP → Aplikasi → Cari nama aplikasi → Izin.'
    );
  }
}

/**
 * Tampilkan modal proper "izin diperlukan".
 * User bisa pilih "Buka Pengaturan" atau "Batal".
 */
export function showPermissionModal({ title, message, onOpenSettings }) {
  Alert.alert(
    title || 'Izin Diperlukan',
    message || 'Aplikasi membutuhkan izin ini. Buka pengaturan HP dan aktifkan izin untuk melanjutkan.',
    [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Buka Pengaturan',
        style: 'default',
        onPress: () => {
          if (onOpenSettings) onOpenSettings();
          else openAppSettings();
        },
      },
    ]
  );
}

/**
 * Request galeri. Return: 'granted' | 'denied' | 'blocked'
 * - 'granted' : izin ada
 * - 'denied'  : user tolak (masih bisa ditanya lagi)
 * - 'blocked' : user tolak permanen → HARUS ke Settings
 */
export async function requestGalleryPermission() {
  try {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (result.granted) return 'granted';

    // Cek canAskAgain untuk bedain denied vs blocked
    if (result.canAskAgain === false || result.status === 'denied') {
      // iOS: kalau sudah denied permanen, canAskAgain = false
      // Android: sama
      return result.canAskAgain === false ? 'blocked' : 'denied';
    }
    return 'denied';
  } catch (e) {
    console.warn('[Permissions] gallery error:', e);
    return 'denied';
  }
}

/**
 * Request kamera. Return: 'granted' | 'denied' | 'blocked'
 */
export async function requestCameraPermission() {
  try {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    if (result.granted) return 'granted';
    return result.canAskAgain === false ? 'blocked' : 'denied';
  } catch (e) {
    console.warn('[Permissions] camera error:', e);
    return 'denied';
  }
}

/**
 * Request MediaLibrary (simpan QR ke galeri).
 */
export async function requestMediaLibraryWritePermission() {
  try {
    const MediaLibrary = require('expo-media-library');

    // ✅ Cek permission existing dulu (jangan minta ulang kalau sudah ada)
    let current = null;
    try {
      current = await MediaLibrary.getPermissionsAsync(true); // true = writeOnly
      if (current?.granted) return 'granted';
    } catch {}

    // ✅ Minta WRITE permission (parameter pertama = writeOnly)
    const result = await MediaLibrary.requestPermissionsAsync(true);
    if (result?.granted) return 'granted';

    // Fallback: coba granular permissions untuk Android 13+
    try {
      const fallback = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      if (fallback?.granted) return 'granted';
    } catch {}

    return result?.canAskAgain === false ? 'blocked' : 'denied';
  } catch (e) {
    console.warn('[Permissions] media library error:', e);
    return 'denied';
  }
}

/**
 * Helper: pastikan izin galeri ada.
 * Kalau tidak ada → tampil modal redirect settings.
 * Return true kalau boleh lanjut, false kalau tidak.
 */
export async function ensureGalleryPermission({
  title = 'Izin Galeri Diperlukan',
  message = 'Aplikasi membutuhkan akses galeri foto. Buka pengaturan HP dan aktifkan izin "Foto" atau "Penyimpanan".',
} = {}) {
  const status = await requestGalleryPermission();
  if (status === 'granted') return true;

  showPermissionModal({
    title,
    message,
    onOpenSettings: openAppSettings,
  });
  return false;
}

/**
 * Helper: pastikan izin kamera ada.
 */
export async function ensureCameraPermission({
  title = 'Izin Kamera Diperlukan',
  message = 'Aplikasi membutuhkan akses kamera. Buka pengaturan HP dan aktifkan izin "Kamera".',
} = {}) {
  const status = await requestCameraPermission();
  if (status === 'granted') return true;

  showPermissionModal({
    title,
    message,
    onOpenSettings: openAppSettings,
  });
  return false;
}

/**
 * Helper: pastikan izin simpan ke galeri.
 */
export async function ensureSavePermission({
  title = 'Izin Penyimpanan Diperlukan',
  message = 'Aplikasi membutuhkan akses penyimpanan untuk menyimpan QR ke galeri. Buka pengaturan HP dan aktifkan izin.',
} = {}) {
  const status = await requestMediaLibraryWritePermission();
  if (status === 'granted') return true;

  showPermissionModal({
    title,
    message,
    onOpenSettings: openAppSettings,
  });
  return false;
}
