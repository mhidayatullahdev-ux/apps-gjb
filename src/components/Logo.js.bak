import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme, spacing } from '../theme';

const LOGO = require('../../assets/dispora-logo.png');

export function LogoMark({ size = 38 }) {
  return (
    <Image
      source={LOGO}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export function BrandHeader({ size = 38, subtitle = 'DKI Jakarta' }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <LogoMark size={size} />
      <View>
        <Text style={[styles.name, { color: colors.text }]}>
          Gelanggang <Text style={{ color: colors.primary }}>Jakbar</Text>
        </Text>
        <Text style={[styles.sub, { color: colors.textFaint }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  sub: { fontSize: 11, fontWeight: '500' },
});

export default { LogoMark, BrandHeader };
