import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { googleAuthService } from '../services/googleAuthService';
import { UserRepository } from '../services/userRepository';
import { UserProfile } from '../../types';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

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
                        isPro: false, // Default to false, logic to check PRO status can be added here
                        createdAt: Date.now(), // This will be ignored by ensureUserExists if user exists
                    };

                    // Ensure user exists in Firestore and get the full profile
                    const fullProfile = await UserRepository.ensureUserExists(userProfileData);
                    setUser(fullProfile);
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
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
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
