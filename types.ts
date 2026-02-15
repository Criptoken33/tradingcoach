export enum Direction {
  LONG = 'Long',
  SHORT = 'Short',
  NONE = 'None'
}

export enum Phase {
  IDLE = 'Seleccionar',
  HINT = '1. INDICIO',
  TEST = '2. TEST',
  CONFIRMATION = '3. CONFIRMACIÓN',
  COMPLETE = 'COMPLETO',
  PLANNED = 'PLANIFICADO'
}

export enum Probability {
  NONE = 'N/A',
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
  ENTRY = '¡Entrada!',
  INVALID = 'Inválido'
}

export enum OperationStatus {
  IDLE,
  OPEN,
  CLOSED,
}

export enum ChecklistItemType {
  BOOLEAN = 'boolean',
  OPTIONS = 'options',
  VALUE = 'value',
}

export interface ChecklistItem {
  id: string; // Stable, unique ID
  text: string;
  timeframe: string;
  type: ChecklistItemType;
  options?: string[];
  tooltip?: string;
}

export interface ChecklistPhase {
  phase: Phase;
  items: ChecklistItem[];
}

export interface Checklist {
  id: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  phases: ChecklistPhase[];
}

export type ChecklistAnswers = {
  [key: string]: boolean | null | string; // question id -> yes/no/null/value
};

export interface RiskPlan {
  riskPercentage: number | null;
  entryPrice: number | null;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  riskRewardRatio: number | null;
  positionSizeLots: number | null;
}

export interface PairState {
  symbol: string;
  direction: Direction;
  answers: ChecklistAnswers;
  riskPlan: RiskPlan | null;
  status: OperationStatus;
  notes: string[];
  exitPrice: number | null;
  exitReason: string | null;
  optionSelections: { [key: string]: string };
}

export interface Trade {
  id: string;
  symbol: string;
  direction: Direction;
  openTimestamp: number;
  closeTimestamp: number | null;
  riskPlan: RiskPlan;
  status: OperationStatus;
  notes: string[];
  exitPrice: number | null;
  exitReason: string | null;
  optionSelections: { questionId: string; questionText: string; selectedOption: string; }[];
}

export type View = 'DASHBOARD' | 'CHECKLIST' | 'RISK_MANAGEMENT' | 'TRADING_LOG' | 'PERFORMANCE_STATS' | 'SETTINGS' | 'CHECKLIST_EDITOR' | 'RISK_CALCULATOR';

// MT5 Report Data Types
export interface MT5Trade {
  symbol: string;
  type: Direction;
  profit: number;
  openTime: number; // timestamp
  closeTime: number; // timestamp
}

export interface MT5Summary {
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  totalNetProfit: number;
  maxDrawdown: number; // This is in percentage from the report
  totalTrades: number;
  averageProfitTrade: number;
  averageLossTrade: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  bestTrade: number;
  worstTrade: number;
}

export interface MT5ReportData {
  summary: MT5Summary;
  trades: MT5Trade[];
  monthlyPerformance: { year: number; months: { name: string; pnl: number }[] }[];
  equityCurve: { time: number; balance: number }[];
  performanceBySymbol?: { label: string; value: number }[];
  performanceByDirection?: { label: Direction; value: number }[];
  performanceByDay?: { label: string; value: number }[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isPro: boolean;
  tempProExpiration?: number;
  tempProUsed?: boolean;
  createdAt: number;
}

export interface UserData {
  pairStates: Record<string, PairState>;
  trades: Trade[];
  checklists: Checklist[];
  activeChecklistIds: { long: string; short: string; };
  settings: any; // Using any to avoid circular dependency or strict schema issues for now
  challengeSettings?: ChallengeSettings;
  mt5Report: MT5ReportData | null;
  lastUpdated: number;
}

export interface ChallengeSettings {
  isActive: boolean;
  accountSize: number;
  dailyLossLimitPct: number;
  maxTotalDrawdownPct: number;
  profitTargetPct: number;
  startDate: number;
}

export type ChallengeStatus = 'PASSING' | 'CAUTION' | 'FAILED' | 'COMPLETE' | 'EXPIRED';

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