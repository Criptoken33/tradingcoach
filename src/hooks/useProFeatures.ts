import { useAuth } from '../context/AuthContext';

export const useProFeatures = () => {
    const { user } = useAuth();

    // Check if user is PRO
    // On web, we might lack RevenueCat, so we rely on Firestore's isPro flag
    // On mobile, the AuthContext should have synced this from RevenueCat
    const isPro = user?.isPro || false;

    // Feature gating logic
    const canImportMT5 = isPro;
    const canHaveUnlimitedChecklists = isPro;
    const canBackupToCloud = isPro;

    // Limits for free users
    const MAX_FREE_CHECKLISTS = 3;

    return {
        isPro,
        canImportMT5,
        canHaveUnlimitedChecklists,
        canBackupToCloud,
        MAX_FREE_CHECKLISTS
    };
};
