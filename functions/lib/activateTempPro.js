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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateTempPro = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
exports.activateTempPro = functions.https.onCall({ cors: true }, async (request) => {
    // 1. Auth Guard
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    try {
        // 2. Transaction to ensure atomicity and prevent race conditions
        const result = await db.runTransaction(async (transaction) => {
            var _a;
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'User profile not found.');
            }
            const userData = userDoc.data();
            // 3. Check if already used
            if ((userData === null || userData === void 0 ? void 0 : userData.tempProUsed) === true) {
                // Check if currently active to return remaining time, or throw error if expired
                const now = Date.now();
                if (userData.tempProExpiration && userData.tempProExpiration > now) {
                    return {
                        success: true,
                        expiration: userData.tempProExpiration,
                        message: "Temporary PRO is already active."
                    };
                }
                throw new functions.https.HttpsError('failed-precondition', 'Free trial already used.');
            }
            // 4. Activate 24h Trial
            const now = Date.now();
            const expiration = now + (24 * 60 * 60 * 1000); // 24 hours
            transaction.update(userRef, {
                tempProUsed: true,
                tempProExpiration: expiration,
                // We do NOT set isPro: true in top-level, because that's for permanent subs.
                // The client and other rules will check tempProExpiration.
            });
            // 5. Set Custom Claims (for rules and client token)
            // 5. Set Custom Claims (for rules and client token)
            // Filter out reserved claims from request.auth.token
            const currentClaims = ((_a = request.auth) === null || _a === void 0 ? void 0 : _a.token) || {};
            const reservedClaims = [
                'aud', 'auth_time', 'exp', 'iat', 'iss', 'sub', 'firebase',
                'user_id', 'email', 'email_verified', 'phone_number', 'name', 'picture'
            ];
            const newClaims = {};
            for (const key in currentClaims) {
                if (!reservedClaims.includes(key)) {
                    newClaims[key] = currentClaims[key];
                }
            }
            await admin.auth().setCustomUserClaims(uid, Object.assign(Object.assign({}, newClaims), { tempProExpiration: expiration }));
            return {
                success: true,
                expiration: expiration,
                message: "Temporary PRO activated for 24 hours."
            };
        });
        console.log(`[activateTempPro] Success for ${uid}:`, result);
        return result;
    }
    catch (error) {
        console.error("[activateTempPro] Error:", error);
        // Re-throw HttpsErrors, wrap others
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', `Could not activate trial: ${error.message || error}`);
    }
});
//# sourceMappingURL=activateTempPro.js.map