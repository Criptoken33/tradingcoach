import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface ExchangeRates {
    [currency: string]: number;
}

class CurrencyService {
    private rates: ExchangeRates | null = null;
    private lastFetch: number = 0;
    private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in memory

    async getLatestRates(): Promise<ExchangeRates> {
        const now = Date.now();

        // 1. Return memory cache if valid
        if (this.rates && (now - this.lastFetch < this.CACHE_DURATION)) {
            console.log("[CurrencyService] Using memory cached rates");
            return this.rates;
        }

        try {
            console.log("[CurrencyService] Fetching rates from backend...");
            const getExchangeRates = httpsCallable(functions, 'getExchangeRates');
            const result = await getExchangeRates();

            this.rates = result.data as ExchangeRates;
            this.lastFetch = now;

            return this.rates;
        } catch (error) {
            console.error("[CurrencyService] Error fetching rates:", error);
            // Fallback to minimal USD mapping if everything fails
            return { "USD": 1 };
        }
    }

    /**
     * Converts an amount from one currency to another using the latest rates.
     * All rates are relative to USD.
     */
    convert(amount: number, from: string, to: string, rates: ExchangeRates): number {
        if (from === to) return amount;

        const fromRate = rates[from];
        const toRate = rates[to];

        if (!fromRate || !toRate) {
            console.error(`[CurrencyService] Missing rate for ${!fromRate ? from : to}`);
            return amount;
        }

        // Convert from 'from' to USD, then from USD to 'to'
        const amountInUSD = amount / fromRate;
        return amountInUSD * toRate;
    }
}

export const currencyService = new CurrencyService();
