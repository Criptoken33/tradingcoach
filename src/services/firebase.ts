import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

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
const remoteConfig = getRemoteConfig(app);

// Remote Config settings
remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour

// Analytics is only supported in browser environments
const analytics = typeof window !== 'undefined'
    ? isSupported().then(yes => yes ? getAnalytics(app) : null)
    : null;

console.log('🔥 Firebase Initialized');

export { auth, db, analytics, remoteConfig, fetchAndActivate, getValue, GoogleAuthProvider, signInWithCredential, signInWithPopup };
