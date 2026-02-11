import { useEffect } from 'react';
import { AdMobService } from '../services/adMobService';

export const useAds = () => {
    useEffect(() => {
        AdMobService.initialize();
    }, []);

    return {
        showBanner: AdMobService.showBanner,
        hideBanner: AdMobService.hideBanner,
        resumeBanner: AdMobService.resumeBanner,
        removeBanner: AdMobService.removeBanner,
        prepareInterstitial: AdMobService.prepareInterstitial,
        showInterstitial: AdMobService.showInterstitial,
        prepareRewardVideo: AdMobService.prepareRewardVideo,
        showRewardVideo: AdMobService.showRewardVideo,
        AdMobService
    };
};
