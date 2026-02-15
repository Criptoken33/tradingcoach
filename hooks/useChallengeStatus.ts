import { useMemo } from 'react';
import { Trade, OperationStatus, ChallengeSettings, ChallengeStatus } from '../types';
import { calculatePnl } from '../utils';
import { FUNDING_DEFAULTS } from '../constants/fundingDefaults';

export interface ChallengeMetrics {
    currentDailyLoss: number;
    maxDailyLossAmount: number;
    dailyLossProgress: number; // 0-100

    currentTotalDrawdown: number;
    maxTotalDrawdownAmount: number;
    totalDrawdownProgress: number; // 0-100

    netProfit: number;
    profitTargetAmount: number;
    profitTargetProgress: number; // 0-100

    status: ChallengeStatus;
    daysActive: number;
    daysRemaining: number;
    tradingDaysCount: number;
    minTradingDays: number;
}

export const useChallengeStatus = (
    trades: Trade[],
    settings?: ChallengeSettings
): ChallengeMetrics | null => {
    return useMemo(() => {
        if (!settings || !settings.isActive) return null;

        const { accountSize, dailyLossLimitPct, maxTotalDrawdownPct, profitTargetPct, startDate } = settings;
        const { minTradingDays, timeLimitDays } = FUNDING_DEFAULTS;

        // Filter relevant trades (closed after start date)
        const challengeTrades = trades.filter(
            t => t.status === OperationStatus.CLOSED &&
                t.closeTimestamp &&
                t.closeTimestamp >= startDate
        );

        // Sort by close time
        challengeTrades.sort((a, b) => (a.closeTimestamp || 0) - (b.closeTimestamp || 0));

        // --- 1. Daily Loss Calculation ---
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const todaysTrades = challengeTrades.filter(t => (t.closeTimestamp || 0) >= startOfDay);

        const todaysPnL = todaysTrades.reduce((acc, t) => {
            const pnl = calculatePnl(t);
            return acc + (pnl !== null ? pnl : 0);
        }, 0);
        const currentDailyLoss = todaysPnL < 0 ? Math.abs(todaysPnL) : 0;
        const maxDailyLossAmount = (accountSize * dailyLossLimitPct) / 100;
        const dailyLossProgress = Math.min((currentDailyLoss / maxDailyLossAmount) * 100, 100);

        // --- 2. Max Total Drawdown Calculation ---
        let currentEquity = accountSize;
        let highWaterMark = accountSize;
        let maxDrawdown = 0;

        challengeTrades.forEach(t => {
            const pnl = calculatePnl(t) || 0;
            currentEquity += pnl;
            if (currentEquity > highWaterMark) {
                highWaterMark = currentEquity;
            }
            const drawdown = highWaterMark - currentEquity;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        });

        const netProfit = currentEquity - accountSize;
        const currentTotalDrawdown = netProfit < 0 ? Math.abs(netProfit) : 0;
        const maxTotalDrawdownAmount = (accountSize * maxTotalDrawdownPct) / 100;
        const totalDrawdownProgress = Math.min((currentTotalDrawdown / maxTotalDrawdownAmount) * 100, 100);

        // --- 3. Profit Target ---
        const profitTargetAmount = (accountSize * profitTargetPct) / 100;
        const profitTargetProgress = Math.max(0, Math.min((netProfit / profitTargetAmount) * 100, 100));

        // --- 4. Trading Days Count ---
        // A "trading day" = a unique calendar day with at least 1 closed trade
        const tradingDaysSet = new Set<string>();
        challengeTrades.forEach(t => {
            if (t.closeTimestamp) {
                const d = new Date(t.closeTimestamp);
                tradingDaysSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
            }
        });
        const tradingDaysCount = tradingDaysSet.size;

        // --- 5. Time Limit ---
        const daysActive = Math.ceil((Date.now() - startDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, timeLimitDays - daysActive);

        // --- 6. Status Determination ---
        let status: ChallengeStatus = 'PASSING';

        if (currentDailyLoss >= maxDailyLossAmount || currentTotalDrawdown >= maxTotalDrawdownAmount) {
            status = 'FAILED';
        } else if (daysRemaining === 0 && netProfit < profitTargetAmount) {
            // Time ran out without reaching profit target
            status = 'EXPIRED';
        } else if (netProfit >= profitTargetAmount && tradingDaysCount >= minTradingDays) {
            // Must meet BOTH profit target AND minimum trading days
            status = 'COMPLETE';
        } else if (dailyLossProgress > 80 || totalDrawdownProgress > 80) {
            status = 'CAUTION';
        }
        // Note: if profit target is met but min trading days NOT met,
        // status stays 'PASSING' — user must keep trading to meet the day requirement

        return {
            currentDailyLoss,
            maxDailyLossAmount,
            dailyLossProgress,
            currentTotalDrawdown,
            maxTotalDrawdownAmount,
            totalDrawdownProgress,
            netProfit,
            profitTargetAmount,
            profitTargetProgress,
            status,
            daysActive,
            daysRemaining,
            tradingDaysCount,
            minTradingDays,
        };
    }, [trades, settings]);
};
