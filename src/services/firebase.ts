import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyALGVNFzPGnDGcm_3EfjombriJ5SurAhXA",
    authDomain: "tradingcoach-021015.firebaseapp.com",
    projectId: "tradingcoach-021015",
    storageBucket: "tradingcoach-021015.firebasestorage.app",
    messagingSenderId: "146126403535",
    appId: "1:146126403535:web:482a5e76707d14831e84ba",
    measurementId: "G-9EM4D0XVSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const remoteConfig = getRemoteConfig(app);

// Remote Config settings
// Remote Config settings - Lower interval for testing/dev (1 minute instead of 1 hour)
// remoteConfig.settings.minimumFetchIntervalMillis = 60000;

// Analytics is only supported in browser environments
const analytics = typeof window !== 'undefined'
    ? isSupported().then(yes => yes ? getAnalytics(app) : null)
    : null;

// Initialize Native Analytics
if (Capacitor.isNativePlatform()) {
    FirebaseAnalytics.setCollectionEnabled({
        enabled: true,
    });
}

console.log('🔥 Firebase Initialized');

export { auth, db, functions, analytics, remoteConfig, fetchAndActivate, getValue, GoogleAuthProvider, signInWithCredential, signInWithPopup };
