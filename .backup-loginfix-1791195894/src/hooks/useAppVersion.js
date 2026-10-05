// src/hooks/useAppVersion.js
import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import semver from 'semver';

const MIN_VERSION_KEY = 'app.minVersion';
const STORE_URL = 'market://details?id=id.go.jakarta.dispora.demo';

/**
 * Cek versi minimal dari backend.
 * Backend harus punya endpoint GET /api/app-version
 * Response: { min_version: '1.3.0', store_url: '...' }
 *
 * Untuk sementara hardcode MIN_VERSION di sini.
 */
export function useAppVersion() {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Ambil versi sekarang
        const currentVersion = Constants.expoConfig?.version || '1.0.0';

        // Hardcoded min version — nanti bisa dari API
        const MIN_VERSION = '1.0.0'; // ganti kalau ada versi baru

        if (semver.lt(currentVersion, MIN_VERSION)) {
          Alert.alert(
            'Update Tersedia',
            'Versi aplikasi Anda sudah kadaluarsa. Silakan update di Play Store untuk pengalaman terbaik.',
            [
              {
                text: 'Update Sekarang',
                onPress: () => Linking.openURL(STORE_URL).catch(() => {}),
              },
              { text: 'Nanti', style: 'cancel' },
            ],
            { cancelable: false }
          );
        }
      } catch (e) {
        // Silent fail
      }
    };

    checkVersion();
  }, []);
}

export default useAppVersion;
