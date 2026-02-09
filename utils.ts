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
    const pipMultiplier = trade.symbol.includes('JPY') ? 100 : 10000;
    const pips = (trade.direction === Direction.LONG ? trade.exitPrice - entryPrice : entryPrice - trade.exitPrice) * pipMultiplier;
    const pipValuePerLot = 10; // Assuming standard lot on a USD account
    return pips * pipValuePerLot * positionSizeLots;
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
