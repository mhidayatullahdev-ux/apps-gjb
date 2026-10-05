// src/components/QuickWidget.js
import React from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { PressableScale } from './anim';

const AUTH_ROUTES = ['Transactions', 'Chat', 'EditProfile'];

export default function QuickWidget({ navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { isLoggedIn } = useAuth();
  const s = useThemedStyles(makeStyles);

  const WIDGET_ITEMS = [
    { id: 'facilities', lib: 'ion', icon: 'business', label: t('widget.facilities'), route: 'Fasilitas', accent: 'primary' },
    { id: 'booking', lib: 'ion', icon: 'calendar', label: t('widget.booking'), route: 'Fasilitas', accent: 'gold' },
    { id: 'transactions', lib: 'ion', icon: 'receipt', label: t('widget.transactions'), route: 'Transactions', accent: 'primary' },
    { id: 'chat', lib: 'ion', icon: 'chatbubble-ellipses', label: t('widget.chat'), route: 'Chat', accent: 'gold' },
    { id: 'helpdesk', lib: 'mci', icon: 'face-agent', label: t('widget.helpdesk'), route: 'Helpdesk', accent: 'primary' },
    { id: 'news', lib: 'ion', icon: 'newspaper', label: t('widget.news'), route: 'Berita', accent: 'gold' },
    { id: 'profile', lib: 'ion', icon: 'person', label: t('widget.profile'), route: 'EditProfile', accent: 'primary' },
    { id: 'more', lib: 'ion', icon: 'grid', label: t('widget.more'), route: 'Lainnya', accent: 'gold' },
  ];

  const handlePress = (item) => {
    if (!item.route) {
      Alert.alert('Segera hadir', 'Fitur ini akan tersedia di update berikutnya.');
      return;
    }
    if (AUTH_ROUTES.includes(item.route) && !isLoggedIn) {
      navigation.navigate('Login', { returnTo: item.route });
      return;
    }
    navigation.navigate(item.route);
  };

  const getAccent = (accent) => {
    if (accent === 'gold') return { bg: colors.goldSoft, fg: colors.gold };
    return { bg: colors.primarySoft, fg: colors.primary };
  };

  const renderIcon = (item, accent) => {
    if (item.lib === 'mci') {
      return <MaterialCommunityIcons name={item.icon} size={26} color={accent.fg} />;
    }
    return <Ionicons name={item.icon} size={24} color={accent.fg} />;
  };

  return (
    <View style={s.wrap}>
      <Text style={s.sectionLabel}>{t('widget.sectionLabel')}</Text>
      <View style={s.grid}>
        {WIDGET_ITEMS.map((item) => {
          const accent = getAccent(item.accent);
          return (
            <View key={item.id} style={s.itemWrap}>
              <PressableScale
                onPress={() => handlePress(item)}
                style={s.item}
                scaleTo={0.92}
              >
                <View style={[s.iconBox, { backgroundColor: accent.bg }]}>
                  {renderIcon(item, accent)}
                </View>
                <Text style={s.label} numberOfLines={1}>{item.label}</Text>
              </PressableScale>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (c, t) => ({
  wrap: { marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
  sectionLabel: {
    ...t.eyebrow, fontSize: 11, color: c.gold,
    marginBottom: spacing.md, letterSpacing: 1.2,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: c.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: c.line,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
  },
  itemWrap: { width: '25%', alignItems: 'center', paddingVertical: spacing.sm },
  item: { alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  iconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '700', color: c.text, textAlign: 'center' },
});
