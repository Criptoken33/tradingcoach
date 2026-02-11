import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export const useProFeatures = () => {
    const { user } = useAuth();
    const [tempProExpiration, setTempProExpiration] = useState<number>(() => {
        const stored = localStorage.getItem('tempProExpiration');
        return stored ? parseInt(stored, 10) : 0;
    });

    // Check if user is PRO (either by subscription or temporary reward)
    const isPro = (user?.isPro || false) || (tempProExpiration > Date.now());

    const activateTempPro = () => {
        const expiration = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        setTempProExpiration(expiration);
        localStorage.setItem('tempProExpiration', expiration.toString());
    };

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
