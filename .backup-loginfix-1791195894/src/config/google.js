// src/config/google.js
export const GOOGLE_WEB_CLIENT_ID =
  '425017210315-5v634vcgkn78r7j0mtph458lhg60vb0c.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID =
  '425017210315-v2kl3l9n0sqm1nnn8mf396n42mc2sbt2.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = 'ios-client-id';

export const isGoogleConfigured = () =>
  !GOOGLE_WEB_CLIENT_ID.startsWith('1234567890');
