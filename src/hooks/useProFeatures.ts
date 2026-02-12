import { useAuth } from '../context/AuthContext';


export const useProFeatures = () => {
    const { user, activateTempPro } = useAuth();

    // Check if user is PRO (now handled globally in AuthContext)
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
        MAX_FREE_CHECKLISTS,
        activateTempPro
    };
};
