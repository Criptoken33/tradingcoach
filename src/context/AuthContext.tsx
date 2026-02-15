import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { googleAuthService } from '../services/googleAuthService';
import { UserRepository } from '../services/userRepository';
import { UserProfile } from '../../types';
import { PurchasesService } from '../services/purchasesService';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    refreshProStatus: () => Promise<void>;
    activateTempPro: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    // Removed insecure localStorage state

    const activateTempPro = async () => {
        if (!user) return;

        try {
            // SECURE_ACTIVATION: Call Cloud Function
            const { httpsCallable } = await import('firebase/functions');
            const { functions } = await import('../services/firebase');
            const activateTempProFn = httpsCallable(functions, 'activateTempPro');

            const result = await activateTempProFn();
            const data = result.data as { success: boolean; expiration: number; message: string };

            if (data.success) {
                if (import.meta.env.DEV) console.log("[AuthContext] Temp PRO activated until:", new Date(data.expiration));

                // Force token refresh to get new claims
                if (auth.currentUser) {
                    await auth.currentUser.getIdToken(true);
                }

                // Update local state immediately for UI response
                setUser(prev => prev ? {
                    ...prev,
                    tempProExpiration: data.expiration,
                    tempProUsed: true
                } : null);
            }
        } catch (error) {
            console.error("[AuthContext] Failed to activate Temp PRO:", error);
            throw error; // Let UI handle error (e.g. show toast)
        }
    };

    const refreshProStatus = async () => {
        if (!auth.currentUser) return;

        try {
            if (Capacitor.getPlatform() !== 'web') {
                let isPro: boolean;
                try {
                    isPro = await PurchasesService.isPro();
                } catch (e) {
                    if (import.meta.env.DEV) console.log("[AuthContext] Error checking RC status, skipping sync to avoid accidental downgrade.");
                    return; // Stop here if we can't verify RC
                }

                // Fetch the latest profile from Firestore to be sure
                const profile = await UserRepository.getUserProfile(auth.currentUser.uid);

                if (profile) {
                    // Update Firestore if RevenueCat is the source of truth
                    // Only update if it has changed
                    if (isPro !== profile.isPro) {
                        try {
                            // SECURE_SYNC: Trigger backend to verify and update Firestore
                            // We don't await this to block UI, but we could if critical
                            const { httpsCallable } = await import('firebase/functions');
                            const { functions } = await import('../services/firebase');
                            const syncSubscription = httpsCallable(functions, 'syncSubscription');
                            await syncSubscription();
                            // FORCE TOKEN REFRESH to pick up new Custom Claims
                            if (auth.currentUser) {
                                await auth.currentUser.getIdToken(true);
                                if (import.meta.env.DEV) console.log("[AuthContext] Token refreshed with new claims (manual refresh).");
                            }
                            if (import.meta.env.DEV) console.log("[AuthContext] Secure sync triggered.");
                        } catch (error) {
                            console.error("[AuthContext] Secure sync failed:", error);
                        }
                        // Update local state for immediate feedback/session
                        profile.isPro = isPro;
                    }
                    setUser(profile);
                }
            }
        } catch (error) {
            console.error("Error refreshing PRO status:", error);
        }
    };

    // OPTIMIZATION: Background Sync to unblock UI
    const syncUserSession = async (firebaseUser: User, currentProfile: UserProfile) => {
        if (Capacitor.getPlatform() === 'web') return;

        try {
            if (import.meta.env.DEV) console.log("[AuthContext] Starting background sync...");

            // 1. Init RevenueCat
            await PurchasesService.initialize(firebaseUser.uid);
            let isPro = false;
            try {
                isPro = await PurchasesService.isPro();
            } catch (e) {
                console.warn("[AuthContext] RC check failed", e);
            }

            // 2. Sync if needed
            if (isPro !== currentProfile.isPro) {
                try {
                    if (import.meta.env.DEV) console.log("[AuthContext] Status mismatch. Triggering Secure Sync...");
                    const { httpsCallable } = await import('firebase/functions');
                    const { functions } = await import('../services/firebase');
                    const syncSubscription = httpsCallable(functions, 'syncSubscription');
                    await syncSubscription();

                    // 3. Force Token Refresh to get new claims
                    await firebaseUser.getIdToken(true);
                    if (import.meta.env.DEV) console.log("[AuthContext] Token refreshed with new claims (background).");

                    // Update local state smoothly
                    setUser(prev => prev ? { ...prev, isPro } : null);
                } catch (err) {
                    console.error("[AuthContext] Background sync failed:", err);
                }
            } else {
                // 3. SECURE_SYNC: Verify Custom Claims anyway specifically for isPro
                // Needed if Firestore has isPro=true but Token expired/doesn't have it
                try {
                    const tokenResult = await firebaseUser.getIdTokenResult();
                    const tokenIsPro = !!tokenResult.claims.isPro;

                    if (currentProfile.isPro && !tokenIsPro) {
                        if (import.meta.env.DEV) console.log("[AuthContext] Firestore is PRO but Token is NOT. Refreshing...");
                        await firebaseUser.getIdToken(true);
                    }
                } catch (tokenError) {
                    console.error("[AuthContext] Error verifying token claims:", tokenError);
                }
            }
            if (import.meta.env.DEV) console.log("[AuthContext] Background sync completed.");

        } catch (error) {
            console.error("[AuthContext] Error in background sync", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // 1. FAST PATH: Get Firestore Profile
                    // Prepare user data
                    const userProfileData: UserProfile = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        isPro: false,
                        createdAt: Date.now(),
                    };

                    // Ensure user exists in Firestore (usually fast)
                    let profile = await UserRepository.ensureUserExists(userProfileData);

                    // 2. UNBLOCK UI IMMEDIATELY
                    // We trust Firestore profile initially to show the app
                    setUser(profile);
                    setLoading(false);

                    // 3. HEAVY LIFTING (Background)
                    // Fire and forget - don't await this!
                    syncUserSession(firebaseUser, profile);

                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUser(null);
                    setLoading(false);
                }
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            await googleAuthService.signInWithGoogle();
        } catch (error: any) {
            console.error("Sign in error", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await googleAuthService.signOut();
            setUser(null);
        } catch (error: any) {
            console.error("Sign out error", error);
            throw error;
        }
    };

    // Derived user object with effective Pro status
    // Checks Firestore 'isPro' OR valid 'tempProExpiration'
    const isTempProActive = user?.tempProExpiration ? user.tempProExpiration > Date.now() : false;
    const effectiveUser = user ? { ...user, isPro: user.isPro || isTempProActive } : null;

    return (
        <AuthContext.Provider value={{ user: effectiveUser, loading, signInWithGoogle, logout, refreshProStatus, activateTempPro }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
