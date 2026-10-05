// src/components/OfflineNotice.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, spacing, radius } from '../theme';
import { useNetwork } from '../context/NetworkContext';

/**
 * Notice offline reusable — muncul di atas screen saat tidak ada koneksi.
 * Kalau online, komponen ini tidak render apa-apa.
 */
export default function OfflineNotice({ message, style }) {
  const { colors } = useTheme();
  const { isOnline, isSlow } = useNetwork();

  if (isOnline && !isSlow) return null;

  const isOffline = !isOnline;
  const bgColor = isOffline ? colors.danger + '15' : colors.gold + '15';
  const borderColor = isOffline ? colors.danger : colors.gold;
  const fgColor = isOffline ? colors.danger : colors.gold;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: bgColor,
          borderColor,
          marginHorizontal: spacing.lg,
        },
        style,
      ]}
    >
      <Ionicons
        name={isOffline ? 'cloud-offline-outline' : 'speedometer-outline'}
        size={18}
        color={fgColor}
      />
      <Text style={[styles.text, { color: fgColor }]}>
        {message ||
          (isOffline
            ? 'Tidak ada koneksi internet. Sambungkan lalu coba lagi.'
            : 'Jaringan lambat. Mohon tunggu...')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
});
