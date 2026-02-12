import {
    AdMob,
    AdOptions,
    AdLoadInfo,
    InterstitialAdPluginEvents,
    RewardAdPluginEvents,
    BannerAdOptions,
    BannerAdSize,
    BannerAdPosition,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const isHybrid = () => Capacitor.getPlatform() !== 'web';

// Standard Google Test IDs
const TEST_IDS = {
    ANDROID: {
        APP_ID: 'ca-app-pub-3940256099942544~3347511713',
        BANNER: 'ca-app-pub-3940256099942544/6300978111',
        INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
        REWARDED: 'ca-app-pub-3940256099942544/5224354917',
    },
    IOS: {
        APP_ID: 'ca-app-pub-3940256099942544~1458002511',
        BANNER: 'ca-app-pub-3940256099942544/2934735716',
        INTERSTITIAL: 'ca-app-pub-3940256099942544/4411468910',
        REWARDED: 'ca-app-pub-3940256099942544/1712485313',
    }
};

// Helper to get the correct ID
const getAdUnitId = (type: 'BANNER' | 'INTERSTITIAL' | 'REWARDED') => {
    const platform = Capacitor.getPlatform();
    // Default to Test Mode if env var is not explicitly set to 'false' in production, or if in dev mode
    const useTestAds = import.meta.env.VITE_ENABLE_TEST_ADS === 'true' || import.meta.env.MODE === 'development';

    if (useTestAds) {
        if (platform === 'android') return TEST_IDS.ANDROID[type];
        if (platform === 'ios') return TEST_IDS.IOS[type];
        return '';
    }

    // Production IDs from Environment Variables
    if (platform === 'android') {
        switch (type) {
            case 'BANNER': return import.meta.env.VITE_ADMOB_ANDROID_BANNER_ID || TEST_IDS.ANDROID.BANNER;
            case 'INTERSTITIAL': return import.meta.env.VITE_ADMOB_ANDROID_INTERSTITIAL_ID || TEST_IDS.ANDROID.INTERSTITIAL;
            case 'REWARDED': return import.meta.env.VITE_ADMOB_ANDROID_REWARD_ID || TEST_IDS.ANDROID.REWARDED;
        }
    }

    if (platform === 'ios') {
        switch (type) {
            case 'BANNER': return import.meta.env.VITE_ADMOB_IOS_BANNER_ID || TEST_IDS.IOS.BANNER;
            case 'INTERSTITIAL': return import.meta.env.VITE_ADMOB_IOS_INTERSTITIAL_ID || TEST_IDS.IOS.INTERSTITIAL;
            case 'REWARDED': return import.meta.env.VITE_ADMOB_IOS_REWARD_ID || TEST_IDS.IOS.REWARDED;
        }
    }

    return '';
};

export const AdMobService = {
    initialize: async () => {
        if (!isHybrid()) return;

        try {
            // FORCE TEST MODE for debugging
            const useTestAds = true; // import.meta.env.VITE_ENABLE_TEST_ADS === 'true' || import.meta.env.MODE === 'development';

            await AdMob.initialize({
                testingDevices: ['EC21962B7AD82E4F483CA4DA3F1C2A61'],
                initializeForTesting: useTestAds,
            });
            console.log('AdMob initialized. Test Mode:', useTestAds);
        } catch (error) {
            console.error('AdMob initialization failed', error);
        }
    },

    showBanner: async () => {
        if (!isHybrid()) return;

        const adId = getAdUnitId('BANNER');
        if (!adId) {
            console.warn('AdMob: No Banner ID found for this platform.');
            return;
        }

        const options: BannerAdOptions = {
            adId: adId,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.TOP_CENTER,
            margin: 0,
            isTesting: true, // Force test ads for debugging
            // npa: true 
        };

        try {
            await AdMob.showBanner(options);
        } catch (error) {
            console.error('Error showing banner', error);
        }
    },

    resumeBanner: async () => {
        if (!isHybrid()) return;
        try {
            await AdMob.resumeBanner();
        } catch (error) {
            console.error('Error resuming banner', error);
        }
    },

    hideBanner: async () => {
        if (!isHybrid()) return;
        try {
            await AdMob.hideBanner();
        } catch (error) {
            console.error('Error hiding banner', error);
        }
    },

    prepareInterstitial: async () => {
        if (!isHybrid()) return;

        const adId = getAdUnitId('INTERSTITIAL');
        if (!adId) return;

        const options: AdOptions = {
            adId: adId,
            isTesting: import.meta.env.VITE_ENABLE_TEST_ADS === 'true' || import.meta.env.MODE === 'development',
            // npa: true
        };

        try {
            await AdMob.prepareInterstitial(options);
        } catch (error) {
            console.error('Error preparing interstitial', error);
        }
    },

    showInterstitial: async () => {
        if (!isHybrid()) return;
        try {
            await AdMob.showInterstitial();
        } catch (error) {
            console.error('Error showing interstitial', error);
        }
    },

    prepareRewardVideo: async () => {
        if (!isHybrid()) return;

        const adId = getAdUnitId('REWARDED');
        if (!adId) return;

        const options: AdOptions = {
            adId: adId,
            isTesting: true, // Force test ads for debugging
            // npa: true
        };

        try {
            await AdMob.prepareRewardVideoAd(options);
        } catch (error) {
            console.error('Error preparing reward video', error);
        }
    },

    showRewardVideo: async (onReward: () => void) => {
        if (!isHybrid()) return;

        let rewardHandler: any;
        let failHandler: any;
        let closeHandler: any;

        const cleanup = () => {
            if (rewardHandler) rewardHandler.remove();
            if (failHandler) failHandler.remove();
            if (closeHandler) closeHandler.remove();
        };

        try {
            rewardHandler = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
                console.log('User rewarded', reward);
                onReward();
                cleanup();
            });

            failHandler = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
                console.error('Reward video failed to load', error);
                cleanup();
            });

            closeHandler = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                cleanup();
            });

            await AdMob.showRewardVideoAd();
        } catch (error) {
            console.error('Error showing reward video. Did you prepare it?', error);
            cleanup();
        }
    },

    removeBanner: async () => {
        if (!isHybrid()) return;
        try {
            await AdMob.removeBanner();
        } catch (error) {
            console.error('Error removing banner', error);
        }
    }
};
