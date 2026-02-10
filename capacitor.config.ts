import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradingcoach.app',
  appName: 'TradingCoach',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '146126403535-ndns8fuslk4ao424lvj2tnru2ajtus82.apps.googleusercontent.com',
      serverClientId: '146126403535-ndns8fuslk4ao424lvj2tnru2ajtus82.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
