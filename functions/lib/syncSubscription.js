"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSubscription = void 0;
const functions = __importStar(require("firebase-functions/v2")); // Gen 2
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
// IMPORTANT: Define Secret in Firebase Console or CLI
// firebase functions:secrets:set REVENUECAT_SECRET
const rcSecret = functions.params.defineSecret('REVENUECAT_SECRET');
exports.syncSubscription = functions.https.onCall({ secrets: [rcSecret], cors: true }, async (request) => {
    var _a, _b;
    // 1. Auth Guard
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const apiKey = rcSecret.value().trim();
    if (!apiKey) {
        console.error("Missing RevenueCat Secret Key");
        throw new functions.https.HttpsError('internal', 'Server misconfiguration.');
    }
    try {
        // 2. Query RevenueCat API
        // https://www.revenuecat.com/docs/api-v1#tag/subscribers/operation/subscribers
        const response = await axios_1.default.get(`https://api.revenuecat.com/v1/subscribers/${uid}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const subscriber = response.data.subscriber || {};
        const entitlements = subscriber.entitlements || {};
        const subscriptions = subscriber.subscriptions || {};
        const now = new Date();
        // 1. Check Entitlements (Standard)
        const activeEntitlements = Object.keys(entitlements).filter(id => {
            const ent = entitlements[id];
            if (!ent.expires_date)
                return true;
            return new Date(ent.expires_date) > now;
        });
        // 2. Check Subscriptions (Fallback - handles missing entitlement mapping in RC Dashboard)
        const activeSubs = Object.keys(subscriptions).filter(id => {
            const sub = subscriptions[id];
            if (!sub.expires_date)
                return true;
            return new Date(sub.expires_date) > now;
        });
        const isPro = activeEntitlements.length > 0 || activeSubs.length > 0;
        // 3. Update Firestore (Trusted Write)
        await admin.firestore().collection('users').doc(uid).set({
            isPro: isPro,
            subscriptionStatus: {
                activeEntitlements: activeEntitlements,
                activeSubscriptions: activeSubs,
                lastSync: admin.firestore.FieldValue.serverTimestamp(),
                provider: 'revenuecat'
            }
        }, { merge: true });
        return {
            success: true,
            isPro: isPro,
            message: "Subscription status synced successfully."
        };
    }
    catch (error) {
        console.error("Error syncing with RevenueCat:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        // If 404, it might mean user doesn't exist in RC yet (never purchased)
        if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 404) {
            // Treat as Free user
            await admin.firestore().collection('users').doc(uid).set({
                isPro: false,
                lastSync: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return { success: true, isPro: false };
        }
        throw new functions.https.HttpsError('internal', 'Failed to sync subscription status.');
    }
});
//# sourceMappingURL=syncSubscription.js.map