import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, spacing, radius } from '../theme';

export function SectionHeading({ title, accentWord, caption, actionLabel, onAction }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.headingWrap}>
      <View style={s.headingRow}>
        <Text style={s.headingText}>
          {title}
          {accentWord ? <Text style={s.headingAccent}>{accentWord}</Text> : null}
          <Text style={s.headingAccent}>.</Text>
        </Text>
        {actionLabel ? (
          <Pressable hitSlop={8} onPress={onAction} style={s.headingAction}>
            <Text style={s.headingActionText}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={13} color={s.__gold} />
          </Pressable>
        ) : null}
      </View>
      {caption ? <Text style={s.headingCaption}>{caption}</Text> : null}
    </View>
  );
}

export function Tag({ label, tone = 'primary', style }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const tones = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    gold: { bg: colors.goldSoft, fg: colors.gold },
    blue: { bg: colors.blueSoft, fg: colors.blue },
    success: { bg: colors.successSoft, fg: colors.success },
    neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
  };
  const t = tones[tone] || tones.primary;
  return (
    <View style={[s.tag, { backgroundColor: t.bg }, style]}>
      <Text style={[s.tagText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function StatBox({ label, value, unit }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statUnit}>{unit}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, icon, variant = 'solid', loading, disabled, style }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const isSolid = variant === 'solid';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        s.button,
        isSolid ? s.buttonSolid : s.buttonGhost,
        pressed && !isDisabled && s.buttonPressed,
        isDisabled && s.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isSolid ? colors.onPrimary : colors.text} />
      ) : null}
      <Text style={[s.buttonText, !isSolid && { color: colors.text }]}>{label}</Text>
      {icon && !loading ? (
        <Ionicons name={icon} size={15} color={isSolid ? colors.onPrimary : colors.text} />
      ) : null}
    </Pressable>
  );
}

export function Field({ label, error, ...inputProps }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldBox, !!error && s.fieldBoxError]}>{inputProps.children}</View>
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon = 'search-outline', title, hint, action }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={30} color={colors.textFaint} />
      <Text style={s.emptyTitle}>{title}</Text>
      {hint ? <Text style={s.emptyHint}>{hint}</Text> : null}
      {action}
    </View>
  );
}

export function Notice({ text, tone = 'gold', icon = 'information-circle-outline' }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const map = {
    gold: { bg: colors.goldSoft, fg: colors.gold },
    primary: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
  };
  const c = map[tone] || map.gold;
  return (
    <View style={[s.notice, { backgroundColor: c.bg }]}>
      <Ionicons name={icon} size={15} color={c.fg} />
      <Text style={[s.noticeText, { color: c.fg }]}>{text}</Text>
    </View>
  );
}

export function Skeleton({ height = 16, width = '100%', style }) {
  const s = useThemedStyles(makeStyles);
  return <View style={[s.skeleton, { height, width }, style]} />;
}

export function Divider({ style }) {
  const s = useThemedStyles(makeStyles);
  return <View style={[s.divider, style]} />;
}

export function Loader({ label }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.loader}>
      <ActivityIndicator color={colors.primary} />
      {label ? <Text style={s.loaderText}>{label}</Text> : null}
    </View>
  );
}

const makeStyles = (c, t) => ({
  __gold: c.gold,

  headingWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headingText: { ...t.title, fontSize: 24, flexShrink: 1 },
  headingAccent: { color: c.primary },
  headingAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: spacing.sm },
  headingActionText: { color: c.gold, fontSize: 12, fontWeight: '700' },
  headingCaption: { ...t.body, marginTop: spacing.xs, paddingRight: spacing.xl },

  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    maxWidth: 180,
  },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },

  statBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statValue: { color: c.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statUnit: { color: c.primary, fontSize: 11, fontWeight: '700', marginTop: 1 },
  statLabel: { ...t.small, marginTop: spacing.xs },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  buttonSolid: { backgroundColor: c.primary },
  buttonGhost: { borderWidth: 1, borderColor: c.line, backgroundColor: 'transparent' },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: c.onPrimary, fontSize: 13, fontWeight: '800' },

  fieldWrap: { gap: 6 },
  fieldLabel: { ...t.small, fontSize: 12, color: c.textMuted, fontWeight: '700' },
  fieldBox: {
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  fieldBoxError: { borderColor: c.danger },
  fieldError: { color: c.danger, fontSize: 11, fontWeight: '600' },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { ...t.subtitle, fontSize: 15, textAlign: 'center' },
  emptyHint: { ...t.body, textAlign: 'center' },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '600' },

  skeleton: { backgroundColor: c.skeleton, borderRadius: radius.sm },

  divider: { height: 1, backgroundColor: c.line },

  loader: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  loaderText: { ...t.small },
});
