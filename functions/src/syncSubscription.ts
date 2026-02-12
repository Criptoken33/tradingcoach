import * as functions from 'firebase-functions/v2'; // Gen 2
import * as admin from 'firebase-admin';
import axios from 'axios';

// IMPORTANT: Define Secret in Firebase Console or CLI
// firebase functions:secrets:set REVENUECAT_SECRET
const rcSecret = functions.params.defineSecret('REVENUECAT_SECRET');

export const syncSubscription = functions.https.onCall(
    { secrets: [rcSecret], cors: true },
    async (request) => {
        // 1. Auth Guard
        if (!request.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Authentication required.'
            );
        }

        const uid = request.auth.uid;
        const apiKey = rcSecret.value();

        if (!apiKey) {
            console.error("Missing RevenueCat Secret Key");
            throw new functions.https.HttpsError('internal', 'Server misconfiguration.');
        }

        try {
            // 2. Query RevenueCat API
            // https://www.revenuecat.com/docs/api-v1#tag/subscribers/operation/subscribers
            const response = await axios.get(`https://api.revenuecat.com/v1/subscribers/${uid}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const subscriber = response.data.subscriber;
            const entitlements = subscriber.entitlements;

            // Check if user has ANY active entitlement
            const isPro = Object.keys(entitlements.active).length > 0;

            // 3. Update Firestore (Trusted Write)
            await admin.firestore().collection('users').doc(uid).set({
                isPro: isPro,
                subscriptionStatus: {
                    activeEntitlements: Object.keys(entitlements),
                    lastSync: admin.firestore.FieldValue.serverTimestamp(),
                    provider: 'revenuecat'
                }
            }, { merge: true });

            return {
                success: true,
                isPro: isPro,
                message: "Subscription status synced successfully."
            };

        } catch (error: any) {
            console.error("Error syncing with RevenueCat:", error.response?.data || error.message);

            // If 404, it might mean user doesn't exist in RC yet (never purchased)
            if (error.response?.status === 404) {
                // Treat as Free user
                await admin.firestore().collection('users').doc(uid).set({
                    isPro: false,
                    lastSync: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                return { success: true, isPro: false };
            }

            throw new functions.https.HttpsError(
                'internal',
                'Failed to sync subscription status.'
            );
        }
    }
);
