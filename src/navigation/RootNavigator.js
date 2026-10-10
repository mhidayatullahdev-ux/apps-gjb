// src/navigation/RootNavigator.js
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useTheme } from '../theme';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import analytics from '../utils/analytics';

import FloatingTabBar from '../components/FloatingTabBar';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HomeScreen from '../screens/HomeScreen';
import FacilitiesScreen from '../screens/FacilitiesScreen';
import FacilityDetailScreen from '../screens/FacilityDetailScreen';
import NewsScreen from '../screens/NewsScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import MoreScreen from '../screens/MoreScreen';
import ChatScreen from '../screens/ChatScreen';
import HelpdeskScreen from '../screens/HelpdeskScreen';
import PaymentScreen from '../screens/PaymentScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileCompleteScreen from '../screens/ProfileCompleteScreen';
import BookingFormScreen from '../screens/BookingFormScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import RescheduleScreen from '../screens/RescheduleScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import { setNavigationRef } from '../hooks/useDeepLinking';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Fasilitas" component={FacilitiesScreen} />
      <Tab.Screen name="Helpdesk" component={HelpdeskScreen} />
      <Tab.Screen name="Berita" component={NewsScreen} />
      <Tab.Screen name="Lainnya" component={MoreScreen} />
    </Tab.Navigator>
  );
}

// MainStack: bisa diakses guest maupun user login.
// Screens yang butuh login diproteksi di handler tombol masing-masing.
function MainStack() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerStyle: { backgroundColor: colors.base },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.base },
      }}
    >
      {/* Tabs utama — selalu bisa diakses */}
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />

      {/* Detail screens — bisa diakses guest */}
      <Stack.Screen name="FacilityDetail" component={FacilityDetailScreen} options={{ title: t('facilities.title') }} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: t('news.detail') }} />

      {/* Auth screens */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('more.register') }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Lupa Password' }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />

      {/* Screens yang butuh login — guard di handler tombol */}
      <Stack.Screen name="BookingForm" component={BookingFormScreen} options={{ title: lang === 'en' ? 'New Booking' : 'Buat Booking' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: t('chat.title') }} />
      <Stack.Screen name="Helpdesk" component={HelpdeskScreen} options={{ title: t('helpdesk.title') }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: lang === 'en' ? 'Confirmation' : 'Konfirmasi' }} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ title: lang === 'en' ? 'My Transactions' : 'Transaksi Saya' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: lang === 'en' ? 'Edit Profile' : 'Edit Profil' }} />
      <Stack.Screen name="Reschedule" component={RescheduleScreen} options={{ title: lang === 'en' ? 'Reschedule' : 'Ubah Jadwal' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: lang === 'en' ? 'Notifications' : 'Notifikasi' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: lang === 'en' ? 'Favorites' : 'Favorit' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Kebijakan Privasi' }} />
    </Stack.Navigator>
  );
}

// ProfileSetupStack: hanya untuk user login yang belum lengkapi profil.
function ProfileSetupStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.base },
      }}
    >
      <Stack.Screen name="ProfileComplete" component={ProfileCompleteScreen} />
    </Stack.Navigator>
  );
}

const onNavigationStateChange = (state) => {
  try {
    const currentRoute = state?.routes?.[state.index];
    if (currentRoute?.name) {
      analytics.logScreen(currentRoute.name);
    }
  } catch {}
};

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { ready, isLoggedIn, isProfileComplete } = useAuth();

  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: 'transparent',
      card: colors.base,
      text: colors.text,
      border: colors.line,
      notification: colors.primary,
    },
  };

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.base,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={setNavigationRef} theme={navTheme} onStateChange={onNavigationStateChange}>
      {isLoggedIn && !isProfileComplete ? (
        <ProfileSetupStack />
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  );
}
