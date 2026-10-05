import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme';

export default function GlobalBackground({ children }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.base }]}>
      {/* Gradient layer dengan opacity 0.5 */}
      <LinearGradient
        colors={
          isDark
            ? [
                'rgba(213, 28, 41, 0)',
                'rgba(213, 28, 41, 0.06)',
                'rgba(213, 28, 41, 0)',
              ]
            : [
                'rgba(213, 28, 41, 0)',
                'rgba(213, 28, 41, 0.04)',
                'rgba(213, 28, 41, 0)',
              ]
        }
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
        pointerEvents="none"
      />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
