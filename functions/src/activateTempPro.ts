import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const activateTempPro = functions.https.onCall(
    { cors: true },
    async (request) => {
        // 1. Auth Guard
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Authentication required.'
            );
        }

        const uid = request.auth.uid;
        const db = admin.firestore();
        const userRef = db.collection('users').doc(uid);

        try {
            // 2. Transaction to ensure atomicity and prevent race conditions
            const result = await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists) {
                    throw new functions.https.HttpsError('not-found', 'User profile not found.');
                }

                const userData = userDoc.data();

                // 3. Check if already used
                if (userData?.tempProUsed === true) {
                    // Check if currently active to return remaining time, or throw error if expired
                    const now = Date.now();
                    if (userData.tempProExpiration && userData.tempProExpiration > now) {
                        return {
                            success: true,
                            expiration: userData.tempProExpiration,
                            message: "Temporary PRO is already active."
                        };
                    }

                    throw new functions.https.HttpsError(
                        'failed-precondition',
                        'Free trial already used.'
                    );
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
                const currentClaims = request.auth?.token || {};
                const reservedClaims = [
                    'aud', 'auth_time', 'exp', 'iat', 'iss', 'sub', 'firebase',
                    'user_id', 'email', 'email_verified', 'phone_number', 'name', 'picture'
                ];

                const newClaims: Record<string, any> = {};
                for (const key in currentClaims) {
                    if (!reservedClaims.includes(key)) {
                        newClaims[key] = currentClaims[key];
                    }
                }

                await admin.auth().setCustomUserClaims(uid, {
                    ...newClaims,
                    tempProExpiration: expiration
                });

                return {
                    success: true,
                    expiration: expiration,
                    message: "Temporary PRO activated for 24 hours."
                };
            });

            console.log(`[activateTempPro] Success for ${uid}:`, result);
            return result;

        } catch (error: any) {
            console.error("[activateTempPro] Error:", error);
            // Re-throw HttpsErrors, wrap others
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            throw new functions.https.HttpsError('internal', `Could not activate trial: ${error.message || error}`);
        }
    }
);
