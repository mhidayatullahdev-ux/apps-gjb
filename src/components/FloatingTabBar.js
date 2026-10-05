// src/components/FloatingTabBar.js
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useNotifications } from '../context/NotificationsContext';

const ICONS = {
  Beranda: { lib: 'ion', active: 'home', inactive: 'home-outline' },
  Fasilitas: { lib: 'ion', active: 'business', inactive: 'business-outline' },
  Helpdesk: { lib: 'mci', active: 'face-agent', inactive: 'face-agent' },
  Berita: { lib: 'ion', active: 'newspaper', inactive: 'newspaper-outline' },
  Lainnya: { lib: 'ion', active: 'grid', inactive: 'grid-outline' },
};

function TabIcon({ routeName, focused, size, color }) {
  const icon = ICONS[routeName];
  if (!icon) return <Ionicons name="ellipse" size={size} color={color} />;
  const iconName = focused ? icon.active : icon.inactive;
  if (icon.lib === 'mci') {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  }
  return <Ionicons name={iconName} size={size} color={color} />;
}

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { unreadCount } = useNotifications();

  const LABELS = {
    Beranda: t('tab.home'),
    Fasilitas: t('tab.facilities'),
    Helpdesk: t('tab.helpdesk'),
    Berita: t('tab.news'),
    Lainnya: t('tab.more'),
  };

  const routes = state.routes;
  const centerIndex = Math.floor(routes.length / 2);

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      height: 72,
      paddingBottom: 8,
      paddingTop: 8,
      alignItems: 'flex-end',
      paddingHorizontal: 4,
    }}>
      {routes.map((route, index) => {
        const isFocused = state.index === index;
        const isCenter = index === centerIndex;
        const color = isFocused ? colors.primary : colors.textFaint;
        const badge = route.name === 'Helpdesk' ? unreadCount : 0;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <View
              key={route.key}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
            >
              <Pressable
                onPress={onPress}
                style={{ alignItems: 'center', justifyContent: 'flex-end' }}
              >
                <View style={{
                  width: 60, height: 60, borderRadius: 30,
                  backgroundColor: colors.primary,
                  alignItems: 'center', justifyContent: 'center',
                  marginTop: -32,
                  borderWidth: 4,
                  borderColor: colors.base,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 10,
                }}>
                  <TabIcon routeName={route.name} focused={true} size={30} color="#FFFFFF" />
                  {badge > 0 ? (
                    <View style={{
                      position: 'absolute', top: -2, right: -2,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 10, minWidth: 20, height: 20,
                      paddingHorizontal: 5,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 2, borderColor: colors.primary,
                    }}>
                      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>
                        {badge > 99 ? '99+' : badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ fontSize: 10, fontWeight: '700', color, marginTop: 4 }}>
                  {LABELS[route.name]}
                </Text>
              </Pressable>
            </View>
          );
        }

        return (
          <View key={route.key} style={{ flex: 1 }}>
            <Pressable
              onPress={onPress}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                paddingBottom: 4,
                paddingTop: 4,
              }}
            >
              <View>
                <TabIcon routeName={route.name} focused={isFocused} size={22} color={color} />
                {badge > 0 ? (
                  <View style={{
                    position: 'absolute', top: -4, right: -8,
                    backgroundColor: colors.primary,
                    borderRadius: 8, minWidth: 16, height: 16,
                    paddingHorizontal: 4,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '900' }}>
                      {badge > 99 ? '99+' : badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontSize: 10, fontWeight: '700', color }}>
                {LABELS[route.name]}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
