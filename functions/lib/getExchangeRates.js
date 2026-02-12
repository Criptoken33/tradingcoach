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
exports.getExchangeRates = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const EXCHANGERATE_API_KEY = (0, params_1.defineSecret)("EXCHANGERATE_API_KEY");
exports.getExchangeRates = (0, https_1.onCall)({
    secrets: [EXCHANGERATE_API_KEY],
    region: "us-central1"
}, async (request) => {
    // 1. Auth Check (Optional but recommended)
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated.");
    }
    // Dynamic imports to speed up initialization/discovery
    const admin = await Promise.resolve().then(() => __importStar(require("firebase-admin")));
    const axios = (await Promise.resolve().then(() => __importStar(require("axios")))).default;
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
    }
    catch (error) {
        console.error("[getExchangeRates] Error:", error.message);
        throw new https_1.HttpsError("internal", "Failed to fetch exchange rates.");
    }
});
//# sourceMappingURL=getExchangeRates.js.map