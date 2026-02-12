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
        if (Capacitor.getPlatform() === 'web') return false;

        const checkStatus = async () => {
            const res = await Purchases.getCustomerInfo();
            const customerInfo = res.customerInfo;

            console.log('RC Active Entitlements:', Object.keys(customerInfo.entitlements.active));
            console.log('RC Active Subscriptions:', customerInfo.activeSubscriptions);

            const hasEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;
            const hasSubscription = (customerInfo.activeSubscriptions && customerInfo.activeSubscriptions.length > 0);

            return hasEntitlement || hasSubscription;
        };

        try {
            let isPro = await checkStatus();

            // double check with cache invalidation if false
            if (!isPro) {
                console.log('Initial check failed, invalidating cache and retrying...');
                await Purchases.invalidateCustomerInfoCache();
                isPro = await checkStatus();
            }

            console.log('Is user PRO?', isPro);
            return isPro;
        } catch (error) {
            console.error('Error checking PRO status:', error);
            throw error; // Throw so caller knows it failed
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

            console.log('Invalidating cache before restore...');
            await Purchases.invalidateCustomerInfoCache();

            const restoreResult = await Purchases.restorePurchases();
            console.log('Restore completed. Active entitlements:', Object.keys(restoreResult.customerInfo.entitlements.active));

            return restoreResult;
        } catch (error: any) {
            // Filter known benign errors
            if (error.message && error.message.includes('BillingWrapper is not attached to a listener')) {
                console.warn('Suppressing BillingWrapper error (benign race condition)');
                return null;
            }
            console.error('Error restoring purchases:', error);
            throw error; // Throw so UI can handle it
        }
    }
};
