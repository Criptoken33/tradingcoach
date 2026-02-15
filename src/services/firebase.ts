import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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
