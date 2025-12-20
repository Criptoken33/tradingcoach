import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

export const initAdMob = async () => {
    try {
        await AdMob.initialize({});
        console.log('AdMob Initialized');
    } catch (error) {
        console.error('Error initializing AdMob:', error);
    }
};

export const showBanner = async () => {
    const options: BannerAdOptions = {
        adId: 'ca-app-pub-3940256099942544/6300978111', // Test Unit ID
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
    };

    try {
        await AdMob.showBanner(options);
        console.log('Banner shown');
    } catch (error) {
        console.error('Error showing banner:', error);
    }
};

export const hideBanner = async () => {
    try {
        await AdMob.hideBanner();
    } catch (error) {
        console.error('Error hiding banner:', error);
    }
};

export const resumeBanner = async () => {
    try {
        await AdMob.resumeBanner();
    } catch (error) {
        console.error('Error resuming banner:', error);
    }
};

export const removeBanner = async () => {
    try {
        await AdMob.removeBanner();
    } catch (error) {
        console.error('Error removing banner:', error);
    }
};
