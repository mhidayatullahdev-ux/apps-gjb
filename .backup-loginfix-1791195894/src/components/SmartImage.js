// src/components/SmartImage.js
import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { BASE_URL } from '../api/client';

// ============ Lazy load expo-image ============
// Native module ini butuh rebuild dev client dulu.
// Fallback ke react-native Image biasa kalau tidak tersedia.
let ExpoImage = null;
try {
  const mod = require('expo-image');
  ExpoImage = mod.Image;
} catch (e) {
  console.log('[SmartImage] expo-image tidak tersedia, pakai RN Image');
}

function resolveUri(uri) {
  if (!uri) return null;
  const s = String(uri).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${BASE_URL}${s}`;
  if (s.startsWith('storage/') || s.startsWith('articles/') || s.startsWith('facilities/')) {
    return `${BASE_URL}/storage/${s.replace(/^storage\//, '')}`;
  }
  return `${BASE_URL}/${s}`;
}

function toProxy(uri) {
  if (!uri) return null;
  const stripped = String(uri).replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&n=-1`;
}

const BLURHASH = 'L03[%{_3~q_3RjRjRjRj00RjRjRj';

export default function SmartImage({
  uri,
  style,
  resizeMode = 'cover',
  icon = 'image-outline',
  label,
  showLoader = true,
}) {
  const { colors } = useTheme();
  const absolute = resolveUri(uri);
  const [stage, setStage] = useState(absolute ? 0 : 2);
  const [loading, setLoading] = useState(!!absolute);

  const source = stage === 0 ? absolute : stage === 1 ? toProxy(absolute) : null;

  if (!source) {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={colors.textFaint} />
        {label ? (
          <Text
            numberOfLines={2}
            style={{
              color: colors.textFaint,
              fontSize: 10,
              fontWeight: '700',
              textAlign: 'center',
              paddingHorizontal: 8,
            }}
          >
            {label}
          </Text>
        ) : null}
      </View>
    );
  }

  const handleError = () => setStage((prev) => (prev === 0 ? 1 : 2));
  const handleLoadEnd = () => setLoading(false);

  // ============ RENDER: pakai expo-image kalau ada ============
  if (ExpoImage) {
    return (
      <View style={[style, { backgroundColor: colors.surfaceAlt, overflow: 'hidden' }]}>
        <ExpoImage
          source={{ uri: source }}
          style={{ width: '100%', height: '100%' }}
          contentFit={resizeMode}
          transition={250}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: BLURHASH }}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
        {loading && showLoader ? (
          <View
            style={{
              position: 'absolute',
              left: 0, right: 0, top: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center',
            }}
            pointerEvents="none"
          >
            <ActivityIndicator size="small" color={colors.textFaint} />
          </View>
        ) : null}
      </View>
    );
  }

  // ============ FALLBACK: pakai react-native Image ============
  return (
    <View style={[style, { backgroundColor: colors.surfaceAlt, overflow: 'hidden' }]}>
      <RNImage
        source={{ uri: source }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={resizeMode}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      {loading && showLoader ? (
        <View
          style={{
            position: 'absolute',
            left: 0, right: 0, top: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <ActivityIndicator size="small" color={colors.textFaint} />
        </View>
      ) : null}
    </View>
  );
}
