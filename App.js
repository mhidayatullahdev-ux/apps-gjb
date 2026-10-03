// App.js
import './src/polyfills';

import React from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ============ Sentry Init ============
Sentry.init({
  dsn: 'https://3c1b61910c8aece766cb103483885788@o4512193573027840.ingest.us.sentry.io/4512193575059456',
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__,
  tracesSampleRate: 0,
  debug: false,
});

// ============ Providers ============
import { ThemeProvider } from './src/theme';
import { I18nProvider } from './src/i18n/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { FavoritesProvider } from './src/context/FavoritesContext';

import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import GlobalBackground from './src/components/GlobalBackground';
import { toastConfig } from './src/components/ToastConfig';

import useAppVersion from './src/hooks/useAppVersion';
import useDeepLinking from './src/hooks/useDeepLinking';
import useThemeTime from './src/hooks/useThemeTime';

function AppInner() {
  useAppVersion();
  useDeepLinking();
  useThemeTime();

  return (
    <GlobalBackground>
      <OfflineBanner />
      <RootNavigator />
      <Toast config={toastConfig} />
    </GlobalBackground>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NetworkProvider>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <SettingsProvider>
                  <NotificationsProvider>
                    <FavoritesProvider>
                      <AppInner />
                    </FavoritesProvider>
                  </NotificationsProvider>
                </SettingsProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const AppWithSentry = Sentry.wrap(App);
export default AppWithSentry;
