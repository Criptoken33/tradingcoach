import { describe, it, expect } from 'vitest';
import { calculatePnl, getWeekNumber } from './utils';
import { Trade, Direction, OperationStatus } from './types';

describe('calculatePnl', () => {
    it('calculates PNL correctly for a LONG trade', () => {
        const trade: Trade = {
            id: '1',
            symbol: 'EURUSD',
            direction: Direction.LONG,
            openTimestamp: Date.now(),
            closeTimestamp: Date.now(),
            status: OperationStatus.CLOSED,
            riskPlan: {
                entryPrice: 1.1000,
                stopLossPrice: 1.0990,
                takeProfitPrice: 1.1020,
                riskPercentage: 1,
                riskRewardRatio: 2,
                positionSizeLots: 0.1,
            },
            exitPrice: 1.1010,
            notes: [],
            exitReason: 'TP partial',
            optionSelections: [],
        };

        // 10 pips * $10/lot * 0.1 lot = $10
        const pnl = calculatePnl(trade);
        expect(pnl).toBeCloseTo(10);
    });

    it('calculates PNL correctly for a SHORT trade', () => {
        const trade: Trade = {
            id: '2',
            symbol: 'GBPUSD',
            direction: Direction.SHORT,
            openTimestamp: Date.now(),
            closeTimestamp: Date.now(),
            status: OperationStatus.CLOSED,
            riskPlan: {
                entryPrice: 1.3000,
                stopLossPrice: 1.3010,
                takeProfitPrice: 1.2980,
                riskPercentage: 1,
                riskRewardRatio: 2,
                positionSizeLots: 0.1,
            },
            exitPrice: 1.2990,
            notes: [],
            exitReason: 'Profit',
            optionSelections: [],
        };

        // 10 pips * $10/lot * 0.1 lot = $10
        const pnl = calculatePnl(trade);
        expect(pnl).toBeCloseTo(10);
    });

    it('returns null if trade is not CLOSED', () => {
        const trade: any = { status: OperationStatus.OPEN };
        expect(calculatePnl(trade)).toBeNull();
    });
});

describe('getWeekNumber', () => {
    it('returns correctly for a specific date', () => {
        const date = new Date('2023-12-20'); // Should be week 51
        expect(getWeekNumber(date)).toBe(51);
    });
});
