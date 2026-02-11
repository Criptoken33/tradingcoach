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

export const AdMobService = {
    initialize: async () => {
        if (!isHybrid()) return;

        try {
            await AdMob.initialize({
                testingDevices: ['YOUR_TEST_DEVICE_ID'], // Opcional
                initializeForTesting: true, // Poner en false para producción
            });
            console.log('AdMob initialized');
        } catch (error) {
            console.error('AdMob initialization failed', error);
        }
    },

    showBanner: async () => {
        if (!isHybrid()) return;

        // Configuración para el tamaño y posición del banner
        // Configuración para el tamaño y posición del banner
        const options: BannerAdOptions = {
            adId: 'ca-app-pub-3940256099942544/6300978111', // TEST ID
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.TOP_CENTER,
            margin: 0,
            isTesting: true,
            // npa: true // non-personalized ads
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

        const options: AdOptions = {
            adId: 'ca-app-pub-3940256099942544/1033173712', // TEST ID
            isTesting: true,
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

        const options: AdOptions = {
            adId: 'ca-app-pub-3940256099942544/5224354917', // TEST ID
            isTesting: true,
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

        // Listener temporal para la recompensa
        const handler = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
            console.log('User rewarded', reward);
            onReward();
            handler.remove(); // Limpiar listener
        });

        try {
            await AdMob.showRewardVideoAd();
        } catch (error) {
            console.error('Error showing reward video', error);
            handler.remove(); // Limpiar listener si falla
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
