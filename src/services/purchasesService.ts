import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || 'goog_placeholder';
const REVENUECAT_API_KEY_IOS = import.meta.env.VITE_REVENUECAT_API_KEY_IOS || 'appl_placeholder';

export const PurchasesService = {
    async initialize(uid: string) {
        try {
            if (Capacitor.getPlatform() === 'web') {
                console.warn('RevenueCat not supported on web directly via this plugin.');
                return;
            }

            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

            const apiKey = Capacitor.getPlatform() === 'android'
                ? REVENUECAT_API_KEY_ANDROID
                : REVENUECAT_API_KEY_IOS;

            await Purchases.configure({
                apiKey,
                appUserID: uid,
            });

            console.log('RevenueCat initialized for user:', uid);
        } catch (error) {
            console.error('Error initializing RevenueCat:', error);
        }
    },

    async getCustomerInfo() {
        try {
            if (Capacitor.getPlatform() === 'web') return null;
            return await Purchases.getCustomerInfo();
        } catch (error) {
            console.error('Error getting customer info:', error);
            return null;
        }
    },

    async isPro(): Promise<boolean> {
        try {
            if (Capacitor.getPlatform() === 'web') return false;
            const customerInfo = await Purchases.getCustomerInfo();
            // Assuming entitlement ID is 'pro'
            return customerInfo.customerInfo.entitlements.active['pro'] !== undefined;
        } catch (error) {
            console.error('Error checking PRO status:', error);
            return false;
        }
    },

    async getOfferings() {
        try {
            if (Capacitor.getPlatform() === 'web') return null;
            return await Purchases.getOfferings();
        } catch (error) {
            console.error('Error getting offerings:', error);
            return null;
        }
    },

    async purchasePackage(pkg: any) {
        try {
            if (Capacitor.getPlatform() === 'web') throw new Error('Purchases not supported on web');
            return await Purchases.purchasePackage({ aPackage: pkg });
        } catch (error) {
            console.error('Error purchasing package:', error);
            throw error;
        }
    },

    async restorePurchases() {
        try {
            if (Capacitor.getPlatform() === 'web') return null;
            return await Purchases.restorePurchases();
        } catch (error) {
            console.error('Error restoring purchases:', error);
            return null;
        }
    }
};
