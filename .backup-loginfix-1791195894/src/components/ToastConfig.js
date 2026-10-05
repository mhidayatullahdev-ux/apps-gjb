// src/components/ToastConfig.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BaseToast = ({ icon, color, text1, text2 }) => (
  <View style={[styles.container, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={22} color={color} />
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{text1}</Text>
      {text2 ? <Text style={styles.message} numberOfLines={2}>{text2}</Text> : null}
    </View>
  </View>
);

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      icon="checkmark-circle"
      color="#22C55E"
    />
  ),
  error: (props) => (
    <BaseToast
      {...props}
      icon="close-circle"
      color="#EF4444"
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      icon="information-circle"
      color="#3B82F6"
    />
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#141620',
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  message: { color: '#A3A8B8', fontSize: 12, marginTop: 2 },
});
