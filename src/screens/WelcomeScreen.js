// src/screens/WelcomeScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

const LOGO = require('../../assets/dispora-logo.png');

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(textFade, {
      toValue: 1,
      duration: 600,
      delay: 800,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.base, paddingTop: insets.top }]}>
      <View style={[styles.circle1, { backgroundColor: colors.primarySoft }]} />
      <View style={[styles.circle2, { backgroundColor: colors.goldSoft }]} />

      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: textFade }]}>
        <Text style={[styles.welcome, { color: colors.textFaint }]}>
          Selamat Datang di
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Gelanggang <Text style={{ color: colors.primary }}>Jakbar</Text>
        </Text>
        <Text style={[styles.appsText, { color: colors.primary }]}>
          Apps
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.gold }]} />
        <Text style={[styles.tagline, { color: colors.textMuted }]}>
          Booking Lapangan Online
        </Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: textFade }]}>
        <Text style={[styles.footerText, { color: colors.textFaint }]}>
          © 2026 Gelanggang Jakbar
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  circle2: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.4,
  },
  logoWrap: {
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
  },
  textWrap: {
    alignItems: 'center',
    gap: 4,
  },
  welcome: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  appsText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: -2,
  },
  divider: {
    width: 70,
    height: 3,
    borderRadius: 2,
    marginTop: 18,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
