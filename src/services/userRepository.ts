import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserData } from '../../types';

export const USER_COLLECTION = 'users';

export const UserRepository = {
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const docRef = doc(db, USER_COLLECTION, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    },

    async createUserProfile(user: UserProfile): Promise<void> {
        const docRef = doc(db, USER_COLLECTION, user.uid);
        await setDoc(docRef, user);
    },

    async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        const docRef = doc(db, USER_COLLECTION, uid);
        await updateDoc(docRef, data);
    },

    async ensureUserExists(user: UserProfile): Promise<UserProfile> {
        const docRef = doc(db, USER_COLLECTION, user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }

        const newUser = {
            ...user,
            createdAt: Date.now(),
        };

        await setDoc(docRef, newUser);
        return newUser;
    },

    async saveUserData(uid: string, data: UserData): Promise<void> {
        const docRef = doc(db, USER_COLLECTION, uid, 'data', 'backup');
        await setDoc(docRef, data); // Overwrite backup with latest state
    },

    async getUserData(uid: string): Promise<UserData | null> {
        const docRef = doc(db, USER_COLLECTION, uid, 'data', 'backup');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    }
};
