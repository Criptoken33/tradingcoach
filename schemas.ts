import { z } from 'zod';
import { Direction, Phase, OperationStatus, ChecklistItemType } from './types';

// Enums as Zod schemas
const DirectionSchema = z.nativeEnum(Direction);
const PhaseSchema = z.nativeEnum(Phase);
const OperationStatusSchema = z.nativeEnum(OperationStatus);
const ChecklistItemTypeSchema = z.nativeEnum(ChecklistItemType);

// Risk Plan Schema
export const RiskPlanSchema = z.object({
    riskPercentage: z.number().nullable(),
    entryPrice: z.number().nullable(),
    stopLossPrice: z.number().nullable(),
    takeProfitPrice: z.number().nullable(),
    riskRewardRatio: z.number().nullable(),
    positionSizeLots: z.number().nullable(),
});

// Checklist Answer Schema
export const ChecklistAnswersSchema = z.record(z.union([z.boolean(), z.null(), z.string()]));

// Pair State Schema
export const PairStateSchema = z.object({
    symbol: z.string(),
    direction: DirectionSchema,
    answers: ChecklistAnswersSchema,
    riskPlan: RiskPlanSchema.nullable(),
    status: OperationStatusSchema,
    notes: z.array(z.string()),
    exitPrice: z.number().nullable(),
    exitReason: z.string().nullable(),
    optionSelections: z.record(z.string()),
});

// Settings Schema
export const SettingsSchema = z.object({
    defaultRiskPercentage: z.number(),
    theme: z.enum(['light', 'dark', 'system']),
    showTips: z.boolean(),
    checklistVersion: z.string(),
});

// Trade Schema
export const TradeSchema = z.object({
    id: z.string(),
    symbol: z.string(),
    direction: DirectionSchema,
    openTimestamp: z.number(),
    closeTimestamp: z.number().nullable(),
    riskPlan: RiskPlanSchema,
    status: OperationStatusSchema,
    notes: z.array(z.string()),
    exitPrice: z.number().nullable(),
    exitReason: z.string().nullable(),
    optionSelections: z.array(z.object({
        questionId: z.string(),
        questionText: z.string(),
        selectedOption: z.string(),
    })),
});
