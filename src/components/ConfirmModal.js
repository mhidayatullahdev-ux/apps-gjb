// src/components/ConfirmModal.js
import React from 'react';
import {
  View, Text, Modal, Pressable, TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Batal',
  icon = 'alert-circle-outline',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const toneColor =
    tone === 'danger' ? colors.danger
    : tone === 'success' ? colors.success
    : colors.primary;

  const toneBg =
    tone === 'danger' ? colors.danger + '15'
    : tone === 'success' ? colors.success + '15'
    : colors.primarySoft;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onCancel}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <View style={s.card}>
              {/* Icon */}
              <View style={[s.iconWrap, { backgroundColor: toneBg }]}>
                <Ionicons name={icon} size={28} color={toneColor} />
              </View>

              <Text style={s.title}>{title}</Text>
              {message ? <Text style={s.message}>{message}</Text> : null}

              {/* ✅ Actions — pakai Pressable biasa biar flex:1 jalan */}
              <View style={s.actions}>
                <Pressable
                  style={({ pressed }) => [
                    s.btn,
                    s.btnCancel,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={onCancel}
                  disabled={loading}
                >
                  <Text style={s.btnCancelText} numberOfLines={1}>
                    {cancelLabel}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    s.btn,
                    { backgroundColor: toneColor, borderColor: toneColor },
                    pressed && { opacity: 0.85 },
                    loading && { opacity: 0.6 },
                  ]}
                  onPress={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.btnConfirmText} numberOfLines={1}>
                      {confirmLabel}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (c, t) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.line,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...t.title, fontSize: 18, fontWeight: '900',
    textAlign: 'center', marginBottom: spacing.xs,
  },
  message: {
    ...t.body, fontSize: 13, textAlign: 'center',
    lineHeight: 19, marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.md,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnCancel: {
    backgroundColor: c.base,
    borderColor: c.line,
  },
  btnCancelText: {
    color: c.text, fontSize: 14, fontWeight: '700',
  },
  btnConfirmText: {
    color: '#FFFFFF', fontSize: 14, fontWeight: '800',
  },
});