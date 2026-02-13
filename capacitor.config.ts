import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradingcoach.app',
  appName: 'TradingCoach',
  webDir: 'dist',
  // This sets the NATIVE WebView background color — prevents white flash
  // before HTML/CSS loads. Different from SplashScreen.backgroundColor.
  backgroundColor: '#388656',
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
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: "#388656",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
