// src/screens/MoreScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Divider, PrimaryButton } from '../components/common';
import ConfirmModal from '../components/ConfirmModal';

const SOCIAL_ICONS = {
  instagram: 'logo-instagram',
  facebook: 'logo-facebook',
  x: 'logo-twitter',
  twitter: 'logo-twitter',
  youtube: 'logo-youtube',
  tiktok: 'musical-notes-outline',
};

export default function MoreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, preference, setPreference, toggle } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { user, isLoggedIn, logout } = useAuth();
  const settings = useSettings();
  const s = useThemedStyles(makeStyles);

  const [logoutModal, setLogoutModal] = useState(false);

  const services = [
    {
      id: 'profile',
      icon: 'person-circle-outline',
      title: t('menu.editProfile'),
      desc: t('menu.editProfileDesc'),
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'chat',
      icon: 'chatbubble-ellipses-outline',
      title: t('more.chat'),
      desc: t('more.chatDesc'),
      onPress: () => navigation.navigate('Chat'),
    },
    {
      id: 'helpdesk',
      icon: 'ticket-outline',
      title: t('more.helpdesk'),
      desc: t('more.helpdeskDesc'),
      onPress: () => navigation.navigate('Helpdesk'),
    },
    {
      id: 'transactions',
      icon: 'receipt-outline',
      title: t('menu.transactions'),
      desc: t('menu.transactionsDesc'),
      onPress: () => navigation.navigate('Transactions'),
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      title: 'Kebijakan Privasi',
      desc: 'Cara kami melindungi data Anda',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
  ];

  const contactInfo = settings.contact || {};
  const socialInfo = settings.social || {};

  const socialList = [
    { id: 'instagram', label: 'Instagram', value: socialInfo.instagram },
    { id: 'facebook', label: 'Facebook', value: socialInfo.facebook },
    { id: 'x', label: 'X / Twitter', value: socialInfo.x },
    { id: 'youtube', label: 'YouTube', value: socialInfo.youtube },
    { id: 'tiktok', label: 'TikTok', value: socialInfo.tiktok },
  ].filter((so) => !!so.value);

  const openWhatsApp = () => {
    const num = contactInfo.whatsapp
      ? String(contactInfo.whatsapp).replace(/\D/g, '')
      : null;
    if (!num) return;
    Linking.openURL(`https://wa.me/${num}`).catch(() => {});
  };

  const avatarUri = (() => {
    const url = user?.avatar_url;
    if (!url) return null;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}t=${user?.updated_at || Date.now()}`;
  })();

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: insets.top + spacing.sm }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>{t('more.title')}</Text>
      <Text style={s.caption}>{t('more.caption')}</Text>

      {/* Akun */}
      <Text style={s.sectionLabel}>{t('more.account')}</Text>
      <View style={s.card}>
        {isLoggedIn ? (
          <>
            <View style={s.userRow}>
              <View style={s.avatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarText}>
                    {(user.name || '?').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userName}>{user.name}</Text>
                <Text style={s.userMeta}>{user.email}</Text>
              </View>
            </View>
            <Divider />
            <Pressable onPress={() => setLogoutModal(true)} style={s.rowButton}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[s.rowButtonText, { color: colors.danger }]}>{t('more.logout')}</Text>
            </Pressable>
          </>
        ) : (
          <View style={s.authBox}>
            <Text style={s.authHint}>{t('auth.loginSubtitle')}</Text>
            <View style={s.authButtons}>
              <PrimaryButton
                label={t('more.login')}
                onPress={() => navigation.navigate('Login')}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label={t('more.register')}
                variant="ghost"
                onPress={() => navigation.navigate('Register')}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Layanan */}
      <Text style={s.sectionLabel}>{t('more.services')}</Text>
      <View style={s.card}>
        {services.map((item, i) => (
          <View key={item.id}>
            <Pressable onPress={item.onPress} style={s.serviceRow}>
              <View style={s.serviceIcon}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.serviceTitle}>{item.title}</Text>
                <Text style={s.serviceDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
            {i < services.length - 1 ? <Divider /> : null}
          </View>
        ))}
      </View>

      {/* Tampilan */}
      <Text style={s.sectionLabel}>{t('more.appearance')}</Text>
      <View style={s.card}>
        <View style={s.switchRow}>
          <Ionicons name="moon-outline" size={18} color={colors.textMuted} />
          <Text style={s.switchLabel}>{t('more.darkMode')}</Text>
          <Switch
            value={isDark}
            onValueChange={toggle}
            trackColor={{ false: colors.line, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        <Divider />
        <View style={s.switchRow}>
          <Ionicons name="phone-portrait-outline" size={18} color={colors.textMuted} />
          <Text style={s.switchLabel}>{t('more.followSystem')}</Text>
          <Switch
            value={preference === 'system'}
            onValueChange={(v) => setPreference(v ? 'system' : isDark ? 'dark' : 'light')}
            trackColor={{ false: colors.line, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Bahasa */}
      <Text style={s.sectionLabel}>{t('more.language')}</Text>
      <View style={s.langRow}>
        {[
          { id: 'id', label: 'Bahasa Indonesia' },
          { id: 'en', label: 'English' },
        ].map((l) => {
          const active = lang === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => setLang(l.id)}
              style={[s.langChip, active && s.langChipActive]}
            >
              <Text style={[s.langChipText, active && s.langChipTextActive]}>{l.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Kontak */}
      {(contactInfo.address || contactInfo.email || contactInfo.phone) ? (
        <>
          <Text style={s.sectionLabel}>{t('more.contact')}</Text>
          <View style={s.card}>
            <View style={s.contactBox}>
              <Text style={s.office}>{t('more.office')}</Text>

              {contactInfo.address ? (
                <View style={s.metaRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textFaint} />
                  <Text style={s.metaText}>{contactInfo.address}</Text>
                </View>
              ) : null}

              {contactInfo.phone ? (
                <Pressable
                  style={s.metaRow}
                  onPress={() => Linking.openURL(`tel:${contactInfo.phone}`).catch(() => {})}
                >
                  <Ionicons name="call-outline" size={16} color={colors.textFaint} />
                  <Text style={[s.metaText, s.link]}>{contactInfo.phone}</Text>
                </Pressable>
              ) : null}

              {contactInfo.email ? (
                <Pressable
                  style={s.metaRow}
                  onPress={() => Linking.openURL(`mailto:${contactInfo.email}`).catch(() => {})}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.textFaint} />
                  <Text style={[s.metaText, s.link]}>{contactInfo.email}</Text>
                </Pressable>
              ) : null}

              {contactInfo.whatsapp ? (
                <Pressable style={s.metaRow} onPress={openWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={16} color={colors.textFaint} />
                  <Text style={[s.metaText, s.link]}>{contactInfo.whatsapp}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </>
      ) : null}

      {/* Sosial */}
      {socialList.length > 0 ? (
        <>
          <Text style={s.sectionLabel}>{t('more.social')}</Text>
          <View style={s.card}>
            {socialList.map((so, i) => (
              <View key={so.id}>
                <Pressable
                  style={s.serviceRow}
                  onPress={() => {
                    const url = so.value.startsWith('http') ? so.value : `https://${so.value}`;
                    Linking.openURL(url).catch(() => {});
                  }}
                >
                  <Ionicons
                    name={SOCIAL_ICONS[so.id] || 'link-outline'}
                    size={18}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.serviceTitle}>{so.label}</Text>
                    <Text style={s.serviceDesc} numberOfLines={1}>{so.value}</Text>
                  </View>
                  <Ionicons name="open-outline" size={15} color={colors.textFaint} />
                </Pressable>
                {i < socialList.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* ✅ Modal logout proper */}
      <ConfirmModal
        visible={logoutModal}
        title={t('more.logout')}
        message={t('more.logoutConfirm')}
        confirmLabel={t('more.logout')}
        cancelLabel={t('common.cancel')}
        icon="log-out-outline"
        tone="danger"
        onCancel={() => setLogoutModal(false)}
        onConfirm={() => {
          setLogoutModal(false);
          setTimeout(() => logout(), 200);
        }}
      />
    </ScrollView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
  title: { ...t.display, fontSize: 28 },
  caption: { ...t.body, marginTop: spacing.xs },

  sectionLabel: {
    ...t.eyebrow, color: c.textFaint,
    marginTop: spacing.xl, marginBottom: spacing.md,
  },

  card: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
    paddingHorizontal: spacing.lg,
  },

  userRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.lg,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: c.onPrimary, fontSize: 18, fontWeight: '900' },
  userName: { ...t.subtitle, fontSize: 15 },
  userMeta: { ...t.small },

  rowButton: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.lg,
  },
  rowButtonText: { fontSize: 14, fontWeight: '700' },

  authBox: { paddingVertical: spacing.lg, gap: spacing.md },
  authHint: { ...t.body, fontSize: 13 },
  authButtons: { flexDirection: 'row', gap: spacing.sm },

  serviceRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.lg,
  },
  serviceIcon: {
    width: 38, height: 38, borderRadius: radius.sm,
    backgroundColor: c.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  serviceTitle: { ...t.subtitle, fontSize: 14 },
  serviceDesc: { ...t.small },

  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.md,
  },
  switchLabel: { ...t.subtitle, fontSize: 14, flex: 1 },

  langRow: { flexDirection: 'row', gap: spacing.sm },
  langChip: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: c.line,
    backgroundColor: c.surface,
  },
  langChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  langChipText: { color: c.textMuted, fontSize: 13, fontWeight: '700' },
  langChipTextActive: { color: c.onPrimary },

  contactBox: { paddingVertical: spacing.lg, gap: spacing.md },
  office: { ...t.subtitle, fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  metaText: { ...t.body, flex: 1, fontSize: 13 },
  link: { color: c.gold, fontWeight: '700' },
});