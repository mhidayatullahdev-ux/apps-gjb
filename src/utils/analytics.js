import * as Sentry from '@sentry/react-native';

// Simple analytics wrapper — bisa diganti Firebase/Amplitude nanti
const analytics = {
  logEvent: (name, params = {}) => {
    if (__DEV__) {
      console.log(`[Analytics] ${name}`, params);
    }
    // Kirim sebagai breadcrumb ke Sentry (untuk context crash)
    try {
      Sentry.addBreadcrumb({
        category: 'analytics',
        message: name,
        data: params,
        level: 'info',
      });
    } catch {}
  },

  logScreen: (screenName, params = {}) => {
    analytics.logEvent('screen_view', { screen: screenName, ...params });
  },

  logError: (error, context = {}) => {
    try {
      Sentry.captureException(error, { extra: context });
    } catch {}
  },
};

export default analytics;