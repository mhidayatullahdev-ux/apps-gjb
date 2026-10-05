// src/components/HomeHeader.js
import React, { useState } from 'react';
import {
  View, Text, Pressable, Modal, TouchableWithoutFeedback, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

export default function HomeHeader({ navigation, onOpenNotifications }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { user, isLoggedIn } = useAuth();
  const { unreadCount } = useNotifications();
  const s = useThemedStyles(makeStyles);
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = (user && user.name ? user.name : '?').charAt(0).toUpperCase();

  const avatarUri = (() => {
    const url = user && user.avatar_url;
    if (!url) return null;
    const sep = url.indexOf('?') >= 0 ? '&' : '?';
    return url + sep + 't=' + (user.updated_at || Date.now());
  })();

  const openMenu = () => {
    if (!isLoggedIn) return navigation.navigate('Login');
    setMenuOpen(true);
  };

  const goFavorites = () => {
    if (!isLoggedIn) return navigation.navigate('Login');
    navigation.navigate('Favorites');
  };

  const goNotifications = () => {
    if (!isLoggedIn) return navigation.navigate('Login');
    if (onOpenNotifications) onOpenNotifications();
    else navigation.navigate('Notifications');
  };

  const menuItems = [
    { id: 'editProfile', icon: 'person-circle-outline', label: t('menu.editProfile'), route: 'EditProfile' },
    { id: 'transactions', icon: 'receipt-outline', label: t('menu.transactions'), route: 'Transactions' },
    { id: 'helpdesk', icon: 'help-circle-outline', label: t('menu.helpdesk'), route: 'Helpdesk' },
    { id: 'chat', icon: 'chatbubble-ellipses-outline', label: t('menu.chat'), route: 'Chat' },
  ];

  const handleMenuPress = (item) => {
    setMenuOpen(false);
    setTimeout(() => navigation.navigate(item.route), 150);
  };

  return (
    <>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={openMenu} style={s.avatarBtn} hitSlop={6}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.avatarImg} />
          ) : (
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitial}>{isLoggedIn ? initial : '?'}</Text>
            </View>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Fasilitas')} style={s.searchBox}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <Text style={s.searchText} numberOfLines={1}>{t('header.search')}</Text>
        </Pressable>

        <Pressable onPress={goFavorites} style={s.iconBtn} hitSlop={6}>
          <Ionicons name="heart-outline" size={22} color={colors.text} />
        </Pressable>

        <Pressable onPress={goNotifications} style={s.iconBtn} hitSlop={6}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable onPress={() => setLang(lang === 'id' ? 'en' : 'id')} style={s.iconBtn} hitSlop={6}>
          <Text style={s.langText}>{lang.toUpperCase()}</Text>
        </Pressable>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, { top: insets.top + 54, left: spacing.md }]}>
                <View style={[s.arrow, { left: 12 }]} />
                <View style={s.modalUserRow}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={s.modalAvatar} />
                  ) : (
                    <View style={[s.modalAvatar, s.modalAvatarPlaceholder]}>
                      <Text style={s.modalAvatarInitial}>{initial}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.modalName} numberOfLines={1}>{user ? user.name : 'User'}</Text>
                    <Text style={s.modalEmail} numberOfLines={1}>{user ? user.email : ''}</Text>
                  </View>
                </View>
                <View style={s.modalDivider} />
                {menuItems.map((item) => (
                  <Pressable key={item.id} style={s.modalItem} onPress={() => handleMenuPress(item)}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                    <Text style={s.modalItemText}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                  </Pressable>
                ))}
                <View style={s.modalDivider} />
                <Pressable
                  style={s.modalItem}
                  onPress={() => {
                    setMenuOpen(false);
                    setTimeout(() => navigation.navigate('Lainnya'), 150);
                  }}
                >
                  <Ionicons name="settings-outline" size={20} color={colors.primary} />
                  <Text style={s.modalItemText}>{t('menu.accountSettings')}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const makeStyles = (c, t) => ({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  avatarBtn: { position: 'relative' },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surfaceAlt },
  avatarInitial: { color: c.onPrimary, fontSize: 16, fontWeight: '900' },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, height: 40, paddingHorizontal: spacing.md,
    backgroundColor: c.surface, borderRadius: radius.pill,
    borderWidth: 1, borderColor: c.line,
  },
  searchText: { flex: 1, color: c.textFaint, fontSize: 13 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: c.primary, borderRadius: 9,
    minWidth: 18, height: 18, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: c.base,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  langText: { color: c.text, fontSize: 12, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalCard: {
    position: 'absolute', width: 280,
    backgroundColor: c.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: c.line,
    paddingVertical: spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.25,
    shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  arrow: {
    position: 'absolute', top: -8,
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: c.surface,
  },
  modalUserRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  modalAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.surfaceAlt },
  modalAvatarPlaceholder: {
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarInitial: { color: c.onPrimary, fontSize: 18, fontWeight: '900' },
  modalName: { ...t.subtitle, fontSize: 14, fontWeight: '900' },
  modalEmail: { ...t.small, fontSize: 11, marginTop: 2 },
  modalDivider: { height: 1, backgroundColor: c.line, marginVertical: 4 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  modalItemText: { ...t.subtitle, fontSize: 13, flex: 1, fontWeight: '600' },
});
