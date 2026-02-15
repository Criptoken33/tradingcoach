import { Trade, Direction, OperationStatus } from './types';

/**
 * Calculates the PNL for a closed trade.
 */
export const calculatePnl = (trade: Trade): number | null => {
    if (
        trade.status !== OperationStatus.CLOSED ||
        !trade.riskPlan ||
        !trade.exitPrice ||
        !trade.riskPlan.entryPrice ||
        !trade.riskPlan.positionSizeLots
    ) {
        return null;
    }
    const { entryPrice, positionSizeLots } = trade.riskPlan;
    const symbol = trade.symbol.toUpperCase();
    const isJpy = symbol.includes('JPY');
    const pipMultiplier = isJpy ? 100 : 10000;
    const pips = (trade.direction === Direction.LONG ? trade.exitPrice - entryPrice : entryPrice - trade.exitPrice) * pipMultiplier;

    // Improved Pip Value calculation
    const baseCurrency = symbol.substring(0, 3);
    const quoteCurrency = symbol.substring(3, 6);

    // Pip value in quote currency for 1 standard lot
    // Non-JPY (Pip 0.0001): 100,000 * 0.0001 = 10
    // JPY (Pip 0.01): 100,000 * 0.01 = 1000
    const pipValueInQuote = isJpy ? 1000 : 10;
    let pipValueUSD = pipValueInQuote;

    if (quoteCurrency === 'USD') {
        pipValueUSD = pipValueInQuote;
    } else if (baseCurrency === 'USD') {
        // For pairs like USDCAD, USDJPY, USDCHF
        // Pip Value (in USD) = Pip Value (in Quote) / Current Price
        pipValueUSD = pipValueInQuote / trade.exitPrice;
    }
    // Fallback covers cross pairs (e.g. EURGBP) with a standard assumption if rates are unavailable.

    return pips * pipValueUSD * positionSizeLots;
};

/**
 * Gets the ISO week number for a given date.
 */
export const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};
