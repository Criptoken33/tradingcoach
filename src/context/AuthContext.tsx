import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProStatus = async () => {
        if (!auth.currentUser) return;

        try {
            if (Capacitor.getPlatform() !== 'web') {
                const isPro = await PurchasesService.isPro();

                // Fetch the latest profile from Firestore to be sure
                const profile = await UserRepository.getUserProfile(auth.currentUser.uid);

                if (profile) {
                    // Update Firestore if RevenueCat is the source of truth
                    if (isPro !== profile.isPro) {
                        await UserRepository.updateUserProfile(auth.currentUser.uid, { isPro });
                        profile.isPro = isPro;
                    }
                    setUser(profile);
                }
            }
        } catch (error) {
            console.error("Error refreshing PRO status:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Prepare user data
                    const userProfileData: UserProfile = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        isPro: false,
                        createdAt: Date.now(),
                    };

                    // Ensure user exists in Firestore
                    let profile = await UserRepository.ensureUserExists(userProfileData);

                    // Initialize RevenueCat on mobile
                    if (Capacitor.getPlatform() !== 'web') {
                        await PurchasesService.initialize(firebaseUser.uid);
                        const isPro = await PurchasesService.isPro();

                        // Sync status if needed
                        if (isPro !== profile.isPro) {
                            await UserRepository.updateUserProfile(firebaseUser.uid, { isPro });
                            profile.isPro = isPro;
                        }
                    }

                    setUser(profile);
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
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

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, refreshProStatus }}>
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
