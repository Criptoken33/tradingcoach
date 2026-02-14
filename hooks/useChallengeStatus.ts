import { useMemo } from 'react';
import { Trade, OperationStatus, ChallengeSettings, ChallengeStatus } from '../types';
import { calculatePnl } from '../utils';

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
}

export const useChallengeStatus = (
    trades: Trade[],
    settings?: ChallengeSettings
): ChallengeMetrics | null => {
    return useMemo(() => {
        if (!settings || !settings.isActive) return null;

        const { accountSize, dailyLossLimitPct, maxTotalDrawdownPct, profitTargetPct, startDate } = settings;

        // Filter relevant trades (closed after start date)
        const challengeTrades = trades.filter(
            t => t.status === OperationStatus.CLOSED &&
                t.closeTimestamp &&
                t.closeTimestamp >= startDate
        );

        // Sort by close time
        challengeTrades.sort((a, b) => (a.closeTimestamp || 0) - (b.closeTimestamp || 0));

        // --- 1. Daily Loss Calculation ---
        // Get start of today (local time)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const todaysTrades = challengeTrades.filter(t => (t.closeTimestamp || 0) >= startOfDay);

        // Calculate P&L for today
        // Note: Daily Loss usually counts CLOSED trades + Floating P&L. 
        // Since this app logs closed trades, we sum closed P&L for today.
        // If net P&L is positive, daily loss is 0. If negative, it's the absolute value.
        // Since this app logs closed trades, we sum closed P&L for today.
        // If net P&L is positive, daily loss is 0. If negative, it's the absolute value.
        const todaysPnL = todaysTrades.reduce((acc, t) => {
            const pnl = calculatePnl(t);
            return acc + (pnl !== null ? pnl : 0);
        }, 0);
        const currentDailyLoss = todaysPnL < 0 ? Math.abs(todaysPnL) : 0;
        const maxDailyLossAmount = (accountSize * dailyLossLimitPct) / 100;
        const dailyLossProgress = Math.min((currentDailyLoss / maxDailyLossAmount) * 100, 100);

        // --- 2. Max Total Drawdown Calculation ---
        // Drawdown is usually High Water Mark - Current Equity.
        // We calculate the running equity curve.
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

        // Current total drawdown relative to HWM or initial balance depending on rule.
        // Most prop firms use "Max Drawdown from Initial Balance" or "Relative Drawdown".
        // Let's implement "Drawdown from Initial Balance" as it's stricter/safer for now.
        // Wait, standard is trailing or static. Let's use simple Net P&L based drawdown for simplicity first (Total Loss limit).
        // Actually, "Total Drawdown" in prop firms usually means Equity cannot fall below Initial Balance - 10%.
        // So distinct from "Trailing Drawdown". Let's use "Max Total Loss" logic: 
        // Current Equity < Initial Balance - MaxLossAmount.

        const netProfit = currentEquity - accountSize;
        const currentTotalDrawdown = netProfit < 0 ? Math.abs(netProfit) : 0; // Simple "Total Loss" model
        const maxTotalDrawdownAmount = (accountSize * maxTotalDrawdownPct) / 100;
        const totalDrawdownProgress = Math.min((currentTotalDrawdown / maxTotalDrawdownAmount) * 100, 100);

        // --- 3. Profit Target ---
        const profitTargetAmount = (accountSize * profitTargetPct) / 100;
        const profitTargetProgress = Math.max(0, Math.min((netProfit / profitTargetAmount) * 100, 100));

        // --- 4. Status Determination ---
        let status: ChallengeStatus = 'PASSING';

        if (currentDailyLoss >= maxDailyLossAmount || currentTotalDrawdown >= maxTotalDrawdownAmount) {
            status = 'FAILED';
        } else if (netProfit >= profitTargetAmount) {
            status = 'COMPLETE';
        } else if (dailyLossProgress > 80 || totalDrawdownProgress > 80) {
            status = 'CAUTION';
        }

        // Days Active
        const daysActive = Math.ceil((Date.now() - startDate) / (1000 * 60 * 60 * 24));

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
            daysActive
        };
    }, [trades, settings]);
};

// Helper: Needs to duplicate the PnL logic or import it.
// For now, I'll inline a simple calculator assuming we have the data.
// In reality, we should import calculateInAppPnl from utils or similar.
// Helper removed in favor of imported util
