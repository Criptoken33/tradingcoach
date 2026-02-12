import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const EXCHANGERATE_API_KEY = defineSecret("EXCHANGERATE_API_KEY");

export const getExchangeRates = onCall({
    secrets: [EXCHANGERATE_API_KEY],
    region: "us-central1"
}, async (request) => {
    // 1. Auth Check (Optional but recommended)
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    // Dynamic imports to speed up initialization/discovery
    const admin = await import("firebase-admin");
    const axios = (await import("axios")).default;

    const db = admin.firestore();
    const cacheDoc = db.collection("system").doc("exchangeRates");

    try {
        // 2. Check Cache
        const snap = await cacheDoc.get();
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;

        if (snap.exists) {
            const data = snap.data();
            if (data && data.updatedAt && (now - data.updatedAt.toMillis() < ONE_HOUR)) {
                console.log("[getExchangeRates] Returning cached rates");
                return data.rates;
            }
        }

        // 3. Fetch Fresh Rates
        console.log("[getExchangeRates] Cache expired or missing. Fetching fresh rates...");
        const apiKey = EXCHANGERATE_API_KEY.value();
        const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

        const response = await axios.get(url);

        if (response.data.result !== "success") {
            throw new Error(`API returned error: ${response.data['error-type'] || 'unknown'}`);
        }

        const rates = response.data.conversion_rates;

        // 4. Update Cache
        await cacheDoc.set({
            rates: rates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log("[getExchangeRates] Rates updated successfully");
        return rates;

    } catch (error: any) {
        console.error("[getExchangeRates] Error:", error.message);
        throw new HttpsError("internal", "Failed to fetch exchange rates.");
    }
});
