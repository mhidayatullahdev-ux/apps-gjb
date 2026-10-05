// src/hooks/useDeepLinking.js
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

let navigationRef = null;
let pendingDeepLink = null;

export function setNavigationRef(ref) {
  navigationRef = ref;
  if (pendingDeepLink && ref) {
    handleDeepLink(pendingDeepLink, ref);
    pendingDeepLink = null;
  }
}

function handleDeepLink(url, navRef) {
  if (!url) return;
  console.log('[DeepLink] Received:', url);

  try {
    const parsed = Linking.parse(url);
    const { hostname, path, queryParams } = parsed;

    console.log('[DeepLink] Parsed:', { hostname, path, queryParams });

    // ✅ Reset password: disporamobile://reset-password?email=xxx&code=xxx
    // Atau: disporamobile:///reset-password?...
    if (hostname === 'reset-password' || path === 'reset-password') {
      const email = queryParams?.email || '';
      const code = queryParams?.code || '';

      navRef.navigate('ResetPassword', { email, code });
      return;
    }

    // Fallback: buka Login
    navRef.navigate('Login');
  } catch (e) {
    console.warn('[DeepLink] Parse error:', e);
  }
}

export default function useDeepLinking() {
  useEffect(() => {
    const onUrl = ({ url }) => {
      if (navigationRef) {
        handleDeepLink(url, navigationRef);
      } else {
        pendingDeepLink = url;
      }
    };

    // Cold start
    Linking.getInitialURL().then((url) => {
      if (url) onUrl({ url });
    });

    // Warm start
    const sub = Linking.addEventListener('url', onUrl);

    return () => sub.remove();
  }, []);
}
