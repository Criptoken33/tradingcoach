import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PairState, Direction, View, ChecklistAnswers, RiskPlan, OperationStatus, Trade, Checklist as ChecklistType, ChecklistItemType, Phase, MT5ReportData, MT5Summary } from './types';
import Dashboard from './components/Dashboard';
import Checklist from './components/Checklist';
import RiskManagementScreen from './components/RiskManagementModal';
import TradingLog from './components/TradingLog';
import PerformanceStats from './components/PerformanceStats';
import Settings from './components/Settings';
import ChecklistEditor from './components/ChecklistEditor';
import { HomeIcon, JournalIcon, ChartPieIcon, Cog6ToothIcon, CalculatorIcon } from './components/icons';

// Helper para parsear localStorage de forma segura y evitar crash de la app
const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) { // La clave no existe, devolver el valor por defecto.
      return fallback;
    }
    const parsed = JSON.parse(item);
    // Si el valor parseado es null pero el fallback no lo es, usar el fallback.
    // Esto previene errores si "null" se guarda como string en localStorage.
    if (parsed === null && fallback !== null) {
      return fallback;
    }
    return parsed;
  } catch (error) {
    console.warn(`Error parsing ${key} from localStorage, using fallback.`, error);
    return fallback;
  }
};

const initialLongChecklist: ChecklistType = {
  id: 'default-long',
  name: 'Wyckoff Scalping (Long)',
  description: 'Estrategia de scalping alcista basada en la metodología Wyckoff, buscando entradas en testeos de acumulación.',
  version: '1.1',
  tags: ['Wyckoff', 'Scalping', 'Long'],
  phases: [
    {
      phase: Phase.HINT,
      items: [
        { id: 'dl-h-1', type: ChecklistItemType.BOOLEAN, timeframe: '30m', text: '¿Precio reacciona a Pivot Point/Soporte Mayor?' },
        { id: 'dl-h-2', type: ChecklistItemType.BOOLEAN, timeframe: '30m', text: '¿Divergencia Alcista en el Estocástico?' },
        { id: 'dl-h-3', type: ChecklistItemType.OPTIONS, timeframe: '30m', text: '¿Vela de Reversión Alcista Cerrada?', options: ['Engulfing', 'Hammer', 'Morning Star'], tooltip: 'Esperar a que la vela cierre para confirmar.' },
        { id: 'dl-h-4', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Se identifica Vela de Parada (PS/SC)?' },
        { id: 'dl-h-5', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Volumen SC superior a MA 20?' },
        { id: 'dl-h-6', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Estocástico en sobreventa (≤ 20)?' },
      ],
    },
    {
      phase: Phase.TEST,
      items: [
        { id: 'dl-t-1', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Se forma Test Secundario (ST)?' },
        { id: 'dl-t-2', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Volumen ST inferior a MA 20 y al SC?' },
        { id: 'dl-t-3', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Estocástico girando al alza o divergencia alcista?' },
      ],
    },
    {
      phase: Phase.CONFIRMATION,
      items: [
        { id: 'dl-c-1', type: ChecklistItemType.BOOLEAN, timeframe: '1m', text: '¿Vela alcista (SOS) rompe resistencia inmediata/LT bajista?' },
        { id: 'dl-c-2', type: ChecklistItemType.BOOLEAN, timeframe: '1m', text: '¿Volumen SOS superior a MA 20?' },
        { id: 'dl-c-3', type: ChecklistItemType.BOOLEAN, timeframe: '1m', text: '¿Estocástico cruza arriba de 20?' },
      ],
    },
  ],
};

const initialShortChecklist: ChecklistType = {
  id: 'default-short',
  name: 'Wyckoff Scalping (Short)',
  description: 'Estrategia de scalping bajista basada en la metodología Wyckoff, buscando entradas en testeos de distribución.',
  version: '1.1',
  tags: ['Wyckoff', 'Scalping', 'Short'],
  phases: [
    {
      phase: Phase.HINT,
      items: [
        { id: 'ds-h-1', type: ChecklistItemType.BOOLEAN, timeframe: '30m', text: '¿Precio reacciona a Pivot Point/Resistencia Mayor?' },
        { id: 'ds-h-2', type: ChecklistItemType.BOOLEAN, timeframe: '30m', text: '¿Divergencia Bajista en el Estocástico?' },
        { id: 'ds-h-3', type: ChecklistItemType.OPTIONS, timeframe: '30m', text: '¿Vela de Reversión Bajista Cerrada?', options: ['Bearish Engulfing', 'Shooting Star', 'Evening Star'], tooltip: 'Esperar a que la vela cierre para confirmar.' },
        { id: 'ds-h-4', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Se identifica Vela de Parada (PSY/BC)?' },
        { id: 'ds-h-5', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Volumen BC superior a MA 20?' },
        { id: 'ds-h-6', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Estocástico en sobrecompra (≥ 80)?' },
      ],
    },
    {
      phase: Phase.TEST,
      items: [
        { id: 'ds-t-1', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Se forma Upthrust (UT/UTAD)?' },
        { id: 'ds-t-2', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Volumen UT inferior a MA 20 y al BC?' },
        { id: 'ds-t-3', type: ChecklistItemType.BOOLEAN, timeframe: '5m', text: '¿Estocástico girando a la baja o divergencia bajista?' },
      ],
    },
    {
      phase: Phase.CONFIRMATION,
      items: [
        { id: 'ds-c-1', type: ChecklistItemType.BOOLEAN, timeframe: '1m', text: '¿Vela bajista (SOW) rompe soporte inmediato/LT alcista?' },
        { id: 'ds-c-2', type: ChecklistItemType.BOOLEAN, timeframe: '1m', text: '¿Volumen SOW superior a MA 20?' },
        { id: 'ds-c-3', type: ChecklistItemType.BOOLEAN, timeframe: '1m', text: '¿Estocástico cruza abajo de 80?' },
      ],
    },
  ],
};


const createNewPairState = (symbol: string): PairState => {
    return {
      symbol,
      direction: Direction.NONE,
      answers: {},
      riskPlan: null,
      status: OperationStatus.IDLE,
      notes: [],
      exitPrice: null,
      exitReason: null,
      optionSelections: {},
    };
};

const calculatePnl = (trade: Trade): number | null => {
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

// Toast Component
interface ToastProps {
  message: string;
  show: boolean;
  isExiting: boolean;
}
const Toast: React.FC<ToastProps> = ({ message, show, isExiting }) => {
  if (!show) return null;

  const animationClass = isExiting ? 'animate-fade-out-down' : 'animate-fade-in-up';

  return (
    <div className={`fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 bg-brand-text text-brand-dark px-6 py-3 rounded-xl shadow-lg z-50 ${animationClass} flex items-center gap-3 justify-center text-center w-auto max-w-[calc(100vw-2rem)] sm:max-w-md`}>
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

// Helper to get ISO week number
const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};

export type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [view, setView] = useState<View>('DASHBOARD');
  
  // Use safeParse for all persisted state to prevent app crashes
  const [pairsState, setPairsState] = useState<{ [key: string]: PairState }>(() => safeParse('tradingCoachWatchlist', {}));
  const [tradingLog, setTradingLog] = useState<Trade[]>(() => safeParse('tradingCoachLog', []));
  
  const [activePairSymbol, setActivePairSymbol] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: '', show: false, isExiting: false });

  const [settings, setSettings] = useState(() => safeParse('tradingCoachSettings', {
        accountBalance: '10000',
        dailyLossLimit: '1',
        weeklyLossLimit: '2.5'
  }));
  
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('tradingCoachTheme') as Theme) || 'system';
  });

  const [checklists, setChecklists] = useState<ChecklistType[]>(() => safeParse('tradingCoachChecklists', [initialLongChecklist, initialShortChecklist]));

  const [activeChecklistIds, setActiveChecklistIds] = useState<{ long: string, short: string }>(() => safeParse('tradingCoachActiveChecklists', { long: 'default-long', short: 'default-short' }));

  const [isTradingLocked, setIsTradingLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  
  const [dynamicRiskPercentage, setDynamicRiskPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('tradingCoachRiskPercentage');
    const parsed = saved ? parseFloat(saved) : NaN;
    return isNaN(parsed) ? 0.25 : parsed;
  });

  const [mt5ReportData, setMt5ReportData] = useState<MT5ReportData | null>(() => safeParse('tradingCoachMt5Report', null));

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const currentAccountBalance = useMemo(() => {
    let baseBalance: number;
    let startTime = 0;

    if (mt5ReportData?.equityCurve && mt5ReportData.equityCurve.length > 0) {
        const lastReportEntry = mt5ReportData.equityCurve[mt5ReportData.equityCurve.length - 1];
        baseBalance = lastReportEntry.balance;
        startTime = lastReportEntry.time;
    } else {
        baseBalance = parseFloat(settings.accountBalance) || 0;
    }

    const pnlSinceStart = tradingLog
        .filter(t => t.status === OperationStatus.CLOSED && t.closeTimestamp && t.closeTimestamp > startTime)
        .reduce((sum, trade) => sum + (calculatePnl(trade) ?? 0), 0);
        
    return baseBalance + pnlSinceStart;
  }, [settings.accountBalance, tradingLog, mt5ReportData]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.toggle('dark', isDark);
    localStorage.setItem('tradingCoachTheme', theme);
  }, [theme]);

  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

    if (isWeekend) {
        const currentWeek = getWeekNumber(today);
        const lastDismissedWeek = parseInt(localStorage.getItem('lastReviewDismissedWeek') || '0', 10);
        
        if (currentWeek > lastDismissedWeek) {
            setShowWeeklyReview(true);
        }
    }
  }, []); 

  useEffect(() => {
    if (!cooldownUntil) return;

    const interval = setInterval(() => {
        if (Date.now() > cooldownUntil) {
            setCooldownUntil(null);
            triggerToast('Periodo de reflexión terminado. Puedes volver a operar.');
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
      localStorage.setItem('tradingCoachSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('tradingCoachWatchlist', JSON.stringify(pairsState));
  }, [pairsState]);

  useEffect(() => {
    localStorage.setItem('tradingCoachLog', JSON.stringify(tradingLog));
  }, [tradingLog]);

  useEffect(() => {
    localStorage.setItem('tradingCoachChecklists', JSON.stringify(checklists));
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem('tradingCoachActiveChecklists', JSON.stringify(activeChecklistIds));
  }, [activeChecklistIds]);

  useEffect(() => {
    localStorage.setItem('tradingCoachRiskPercentage', String(dynamicRiskPercentage));
  }, [dynamicRiskPercentage]);

  useEffect(() => {
    if (mt5ReportData) {
        localStorage.setItem('tradingCoachMt5Report', JSON.stringify(mt5ReportData));
    } else {
        localStorage.removeItem('tradingCoachMt5Report');
    }
  }, [mt5ReportData]);


  useEffect(() => {
    const closedTrades = tradingLog.filter(t => t.status === OperationStatus.CLOSED && t.closeTimestamp);
    if (closedTrades.length === 0) {
        setIsTradingLocked(false);
        setLockReason('');
        return;
    }

    const balance = currentAccountBalance;
    const dailyLimit = parseFloat(settings.dailyLossLimit) || 0;
    const weeklyLimit = parseFloat(settings.weeklyLossLimit) || 0;

    if (balance <= 0 || (dailyLimit <= 0 && weeklyLimit <= 0)) {
        setIsTradingLocked(false);
        setLockReason('');
        return;
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const dayOfWeek = now.getDay(); 
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)).getTime();

    let dailyPnl = 0;
    let weeklyPnl = 0;

    closedTrades.forEach(trade => {
        const pnl = calculatePnl(trade);
        if (pnl !== null) {
            if (trade.closeTimestamp! >= startOfWeek) {
                weeklyPnl += pnl;
            }
            if (trade.closeTimestamp! >= startOfDay) {
                dailyPnl += pnl;
            }
        }
    });

    const dailyLossAmount = (balance * dailyLimit) / 100;
    const weeklyLossAmount = (balance * weeklyLimit) / 100;
    
    if (dailyLimit > 0 && dailyPnl <= -dailyLossAmount) {
        setIsTradingLocked(true);
        setLockReason(`Límite de pérdida diaria (${settings.dailyLossLimit}%) alcanzado. La operativa se reanudará mañana.`);
        return;
    }

    if (weeklyLimit > 0 && weeklyPnl <= -weeklyLossAmount) {
        setIsTradingLocked(true);
        setLockReason(`Límite de pérdida semanal (${settings.weeklyLossLimit}%) alcanzado. La operativa se reanudará la próxima semana.`);
        return;
    }

    setIsTradingLocked(false);
    setLockReason('');
    
  }, [tradingLog, settings, currentAccountBalance]);
  
  const pairPerformance = React.useMemo(() => {
    const performance: Record<string, number> = {};
    let lastReportTime = 0;

    if (mt5ReportData?.performanceBySymbol) {
        mt5ReportData.performanceBySymbol.forEach(item => {
            performance[item.label] = item.value;
        });
        if (mt5ReportData.equityCurve && mt5ReportData.equityCurve.length > 0) {
            lastReportTime = mt5ReportData.equityCurve[mt5ReportData.equityCurve.length - 1].time;
        }
    }

    const tradesToMerge = tradingLog.filter(t =>
        t.status === OperationStatus.CLOSED &&
        t.closeTimestamp &&
        t.closeTimestamp > lastReportTime
    );

    tradesToMerge.forEach(trade => {
        const pnl = calculatePnl(trade);
        if (pnl !== null) {
            if (!performance[trade.symbol]) {
                performance[trade.symbol] = 0;
            }
            performance[trade.symbol] += pnl;
        }
    });

    return performance;
  }, [tradingLog, mt5ReportData]);

  const activeLongChecklist = React.useMemo(() => checklists.find(c => c.id === activeChecklistIds.long), [checklists, activeChecklistIds.long]);
  const activeShortChecklist = React.useMemo(() => checklists.find(c => c.id === activeChecklistIds.short), [checklists, activeChecklistIds.short]);

  const getChecklistForPair = useCallback((pair: PairState): ChecklistType | undefined => {
      if (pair.direction === Direction.LONG) {
          return activeLongChecklist;
      }
      if (pair.direction === Direction.SHORT) {
          return activeShortChecklist;
      }
      return undefined;
  }, [activeLongChecklist, activeShortChecklist]);


  const triggerToast = (message: string) => {
    setToast({ message, show: true, isExiting: false });
  };
  
  useEffect(() => {
    if (toast.show) {
      const exitTimer = setTimeout(() => {
        setToast(prev => ({ ...prev, isExiting: true }));
      }, 2500);

      const hideTimer = setTimeout(() => {
        setToast({ message: '', show: false, isExiting: false });
      }, 3000);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [toast.show, toast.message]);

  const handleSelectPair = useCallback((symbol: string) => {
    if (isTradingLocked || cooldownUntil) {
      triggerToast(lockReason || 'La operativa está en pausa para un periodo de reflexión.');
      return;
    }
    setActivePairSymbol(symbol);
    setView('CHECKLIST');
  }, [isTradingLocked, lockReason, cooldownUntil]);
  
  const resetTradePlan = (checklist: ChecklistType | null) => {
    const initialAnswers: ChecklistAnswers = {};
    if (checklist) {
        checklist.phases.flatMap(p => p.items).forEach(item => {
            initialAnswers[item.id] = null;
        });
    }
    return {
        answers: initialAnswers,
        riskPlan: null,
        status: OperationStatus.IDLE,
        notes: [],
        exitPrice: null,
        exitReason: null,
        optionSelections: {},
    };
  }

  const handleChangeDirection = useCallback((symbol: string, direction: Direction) => {
    setPairsState(prevState => {
      const currentPair = prevState[symbol];
      const previousDirection = currentPair.direction;
      
      const checklist = direction === Direction.LONG ? activeLongChecklist : activeShortChecklist;
      const shouldReset = direction !== previousDirection;

      return {
        ...prevState,
        [symbol]: {
          ...currentPair,
          direction: direction,
          ...(shouldReset ? resetTradePlan(checklist) : {}),
        },
      };
    });
  }, [activeLongChecklist, activeShortChecklist]);
  
  const handleAddPair = useCallback((symbol: string) => {
    if (pairsState[symbol]) {
        triggerToast('El símbolo ya está en la lista.');
        return;
    }
    setPairsState(prevState => ({
        ...prevState,
        [symbol]: createNewPairState(symbol)
    }));
    triggerToast(`${symbol} añadido`);
  }, [pairsState]);

  const handleRemovePair = useCallback((symbol: string) => {
    setPairsState(prevState => {
        const newState = { ...prevState };
        delete newState[symbol];
        return newState;
    });
    triggerToast(`${symbol} eliminado`);
  }, []);

  const handleUpdateChecklist = useCallback((symbol: string, answers: ChecklistAnswers) => {
    setPairsState(prevState => ({
      ...prevState,
      [symbol]: {
        ...prevState[symbol],
        answers,
      },
    }));
  }, []);

  const handleUpdateOptionSelection = useCallback((symbol: string, questionId: string, option: string) => {
    setPairsState(prevState => {
      const newSelections = { ...prevState[symbol].optionSelections, [questionId]: option };
      return {
        ...prevState,
        [symbol]: {
          ...prevState[symbol],
          optionSelections: newSelections,
        },
      };
    });
  }, []);


  const handleBackToDashboard = useCallback(() => {
    setActivePairSymbol(null);
    setView('DASHBOARD');
  }, []);
  
  const handleChecklistComplete = useCallback(() => {
    setView('RISK_MANAGEMENT');
  }, []);

  const handleBackToChecklist = useCallback(() => {
    setView('CHECKLIST');
  }, []);
  
  const handleSavePlan = useCallback((plan: RiskPlan) => {
      if (!activePairSymbol) return;
      const activePair = pairsState[activePairSymbol];
      const checklist = getChecklistForPair(activePair);
      const allItems = checklist?.phases.flatMap(p => p.items) || [];

      const tradeOptionSelections = Object.entries(activePair.optionSelections)
        .map(([questionId, selectedOption]) => {
            const item = allItems.find(i => i.id === questionId);
            return item ? {
                questionId: item.id,
                questionText: item.text,
                selectedOption: selectedOption
            } : null;
        })
        .filter((selection): selection is { questionId: string; questionText: string; selectedOption: string; } => selection !== null);
      
      const newTrade: Trade = {
        id: `${activePairSymbol}-${Date.now()}`,
        symbol: activePair.symbol,
        direction: activePair.direction,
        optionSelections: tradeOptionSelections,
        openTimestamp: Date.now(),
        closeTimestamp: null,
        riskPlan: plan,
        status: OperationStatus.OPEN,
        notes: [],
        exitPrice: null,
        exitReason: null,
      };

      setTradingLog(prevLog => [...prevLog, newTrade]);
      
      handleRemovePair(activePairSymbol);

      triggerToast(`Operación en ${activePairSymbol} abierta.`);
      handleBackToDashboard();
  }, [activePairSymbol, pairsState, handleBackToDashboard, handleRemovePair, getChecklistForPair]);

  const handleAddNote = useCallback((tradeId: string, note: string) => {
    setTradingLog(prevLog => prevLog.map(trade =>
      trade.id === tradeId ? { ...trade, notes: [...trade.notes, note] } : trade
    ));
  }, []);

  const handleCloseTrade = useCallback((tradeId: string, exitPrice: number, exitReason: string) => {
    const tradeToClose = tradingLog.find(t => t.id === tradeId);
    if (!tradeToClose) return;

    const updatedTrade = {
        ...tradeToClose,
        status: OperationStatus.CLOSED,
        exitPrice,
        exitReason,
        closeTimestamp: Date.now(),
    };

    const pnl = calculatePnl(updatedTrade);

    if (pnl !== null) {
        if (pnl > 0) { // Win
            setDynamicRiskPercentage(prev => Math.min(1.0, prev + 0.25));
        } else if (pnl < 0) { // Loss
            setDynamicRiskPercentage(prev => Math.max(0.25, prev - 0.25));
            setCooldownUntil(Date.now() + 15 * 60 * 1000); // 15 minute cooldown
        }
    }

    setTradingLog(prevLog => prevLog.map(trade =>
        trade.id === tradeId ? updatedTrade : trade
    ));
  }, [tradingLog]);

  const handleSaveSettings = (newSettings: { accountBalance: string; dailyLossLimit: string; weeklyLossLimit: string; }) => {
    setSettings(newSettings);
    triggerToast('Ajustes guardados.');
  };
  
  const handleImportMt5Report = (htmlContent: string) => {
    try {
        const match = htmlContent.match(/window\.__report\s*=\s*(\{[\s\S]*?\});/);
        if (!match || !match[1]) {
            throw new Error("Could not find window.__report object in the HTML file.");
        }

        const report = JSON.parse(match[1]);

        const totalTrades = report.tradeTypeTotal?.manual ?? (report.longShortTotal?.long + report.longShortTotal?.short) ?? 0;
        const winTradesLong = report.longShortIndicators?.win_trades?.[0] ?? 0;
        const winTradesShort = report.longShortIndicators?.win_trades?.[1] ?? 0;
        const totalWinTrades = winTradesLong + winTradesShort;
        const totalLossTrades = totalTrades - totalWinTrades;

        const summary: MT5Summary = {
            grossProfit: report.profitTotal?.profit_gross ?? 0,
            grossLoss: report.profitTotal?.loss_gross ?? 0,
            totalNetProfit: report.balance?.table?.total ?? 0,
            profitFactor: report.summaryIndicators?.profit_factor ?? 0,
            maxDrawdown: (report.summaryIndicators?.drawdown ?? 0) * 100,
            totalTrades: totalTrades,
            bestTrade: report.risksIndicators?.profit?.[0] ?? 0,
            worstTrade: report.risksIndicators?.profit?.[1] ?? 0,
            maxConsecutiveWins: report.risksIndicators?.max_consecutive_trades?.[0] ?? 0,
            maxConsecutiveLosses: report.risksIndicators?.max_consecutive_trades?.[1] ?? 0,
            averageProfitTrade: totalWinTrades > 0 ? (report.profitTotal?.profit_gross ?? 0) / totalWinTrades : 0,
            averageLossTrade: totalLossTrades > 0 ? (report.profitTotal?.loss_gross ?? 0) / totalLossTrades : 0,
        };

        const equityCurve = (report.balance?.chart ?? []).map((p: { x: number; y: number[] }) => ({
            time: p.x * 1000,
            balance: p.y[0]
        }));
        
        if (equityCurve.length > 0) {
            const lastEquityPoint = equityCurve[equityCurve.length - 1];
            if (lastEquityPoint) {
                setSettings(prev => ({
                    ...prev,
                    accountBalance: String(lastEquityPoint.balance),
                }));
            }
        }
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyPerformance = (report.balance?.table?.years ?? []).map((yearData: { year: number; months: Record<string, number>}) => ({
            year: yearData.year,
            months: Object.entries(yearData.months).map(([monthIndex, pnl]) => ({
                name: monthNames[parseInt(monthIndex, 10)],
                pnl: pnl
            }))
        }));

        const performanceBySymbol = (report.symbolIndicators?.netto_profit ?? []).map(([label, value]: [string, number]) => ({ label, value }));

        const performanceByDirection = [
            { label: Direction.LONG, value: report.longShortIndicators?.netto_pl?.[0] ?? 0 },
            { label: Direction.SHORT, value: report.longShortIndicators?.netto_pl?.[1] ?? 0 },
        ];
        
        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const performanceByDay = (report.dayOfWeekIndicators?.netto_pl ?? []).map((value: number, index: number) => ({
            label: dayNames[index],
            value: value,
        }));


        setMt5ReportData({
            summary,
            trades: [],
            monthlyPerformance,
            equityCurve,
            performanceBySymbol,
            performanceByDirection,
            performanceByDay,
        });
        
        triggerToast('Reporte de MT5 importado con éxito.');
        setView('PERFORMANCE_STATS');
    } catch (e) {
        console.error("Failed to parse MT5 report", e);
        triggerToast('Error: El formato del reporte no es válido o está dañado.');
    }
  };

  const handleImportData = (data: any) => {
    setPairsState(data.pairsState);
    setTradingLog(data.tradingLog);
    setSettings(data.settings);
    if (data.checklists) setChecklists(data.checklists);
    if (data.activeChecklistIds) setActiveChecklistIds(data.activeChecklistIds);
    if (data.dynamicRiskPercentage) setDynamicRiskPercentage(data.dynamicRiskPercentage);
    if (data.mt5ReportData) setMt5ReportData(data.mt5ReportData);
    triggerToast('Datos importados con éxito.');
    setView('DASHBOARD');
  };

  const handleDismissWeeklyReview = () => {
    const currentWeek = getWeekNumber(new Date());
    localStorage.setItem('lastReviewDismissedWeek', String(currentWeek));
    setShowWeeklyReview(false);
  };

  const handleNavigateToStats = () => {
      handleDismissWeeklyReview();
      setView('PERFORMANCE_STATS');
  };
  
  const handleResetAppData = useCallback(() => {
    setTradingLog([]);
    setPairsState({});
    setDynamicRiskPercentage(0.25);
    setCooldownUntil(null);

    localStorage.removeItem('tradingCoachLog');
    localStorage.removeItem('tradingCoachWatchlist');
    localStorage.setItem('tradingCoachRiskPercentage', '0.25');

    triggerToast('El diario y la lista de seguimiento han sido reiniciados.');
    setView('DASHBOARD');
  }, []);

  const handleDeleteMt5Report = useCallback(() => {
    setMt5ReportData(null);
    triggerToast('Reporte de MT5 eliminado.');
  }, []);


  const currentStreak = useMemo(() => {
    const closedTrades = tradingLog
        .filter(t => t.status === OperationStatus.CLOSED && t.closeTimestamp)
        .sort((a, b) => b.closeTimestamp! - a.closeTimestamp!); 

    if (closedTrades.length === 0) return { type: 'none', count: 0 };

    const lastTradePnl = calculatePnl(closedTrades[0]);
    if (lastTradePnl === null) return { type: 'none', count: 0 };

    const streakType = lastTradePnl >= 0 ? 'win' : 'loss';
    let streakCount = 0;

    for (const trade of closedTrades) {
        const pnl = calculatePnl(trade);
        if (pnl === null) break;
        const currentTradeType = pnl >= 0 ? 'win' : 'loss';
        if (currentTradeType === streakType) {
            streakCount++;
        } else {
            break;
        }
    }
    return { type: streakType, count: streakCount };
  }, [tradingLog]);

  const renderView = () => {
    const activePair = activePairSymbol ? pairsState[activePairSymbol] : null;
    const activeChecklist = activePair ? getChecklistForPair(activePair) : null;

    switch (view) {
      case 'RISK_MANAGEMENT':
        if (activePair) {
            return (
                <RiskManagementScreen
                    pairState={activePair}
                    accountBalance={currentAccountBalance}
                    onSavePlan={handleSavePlan}
                    onBack={handleBackToChecklist}
                    recommendedRisk={dynamicRiskPercentage}
                />
            );
        }
        return null;
      case 'RISK_CALCULATOR':
        return (
            <RiskManagementScreen
                accountBalance={currentAccountBalance}
                onBack={handleBackToDashboard}
                recommendedRisk={dynamicRiskPercentage}
            />
        );
      case 'CHECKLIST':
        if (activePair) {
          return (
            <Checklist
              pairState={activePair}
              checklist={activeChecklist}
              onChangeDirection={handleChangeDirection}
              onUpdate={(answers) => handleUpdateChecklist(activePairSymbol!, answers)}
              onUpdateOptionSelection={(questionId, option) => handleUpdateOptionSelection(activePairSymbol!, questionId, option)}
              onBack={handleBackToDashboard}
              onComplete={handleChecklistComplete}
              onShowToast={triggerToast}
            />
          );
        }
        return null;
      case 'TRADING_LOG':
        return <TradingLog
          tradingLog={tradingLog}
          onAddNote={handleAddNote}
          onCloseTrade={handleCloseTrade}
        />;
      case 'PERFORMANCE_STATS':
        return <PerformanceStats 
                    tradingLog={tradingLog} 
                    mt5ReportData={mt5ReportData} 
                    accountBalance={parseFloat(settings.accountBalance) || 0}
                />;
      case 'SETTINGS':
        return <Settings 
                    currentSettings={settings} 
                    onSave={handleSaveSettings} 
                    appData={{ pairsState, tradingLog, settings, checklists, activeChecklistIds, dynamicRiskPercentage, mt5ReportData }}
                    onImportData={handleImportData}
                    onImportMt5Report={handleImportMt5Report}
                    onShowToast={triggerToast}
                    onNavigateToChecklistEditor={() => setView('CHECKLIST_EDITOR')}
                    theme={theme}
                    setTheme={setTheme}
                    currentAccountBalance={currentAccountBalance}
                    mt5ReportData={mt5ReportData}
                    onResetAppData={handleResetAppData}
                    onDeleteMt5Report={handleDeleteMt5Report}
                />;
      case 'CHECKLIST_EDITOR':
        return <ChecklistEditor
                  checklists={checklists}
                  setChecklists={setChecklists}
                  activeIds={activeChecklistIds}
                  setActiveIds={setActiveChecklistIds}
                  onBack={() => setView('SETTINGS')}
                  onShowToast={triggerToast}
               />;
      case 'DASHBOARD':
      default:
        return (
          <Dashboard
            pairsState={pairsState}
            onSelectPair={handleSelectPair}
            onAddPair={handleAddPair}
            onRemovePair={handleRemovePair}
            isTradingLocked={isTradingLocked}
            lockReason={lockReason}
            recommendedRisk={dynamicRiskPercentage}
            pairPerformance={pairPerformance}
            showWeeklyReview={showWeeklyReview}
            onDismissWeeklyReview={handleDismissWeeklyReview}
            onNavigateToStats={handleNavigateToStats}
            getChecklistForPair={getChecklistForPair}
            currentStreak={currentStreak}
            mt5Summary={mt5ReportData?.summary ?? null}
            tradingLog={tradingLog}
            cooldownUntil={cooldownUntil}
          />
        );
    }
  };
  
  const activeTradesCount = tradingLog.filter(trade => trade.status === OperationStatus.OPEN).length;

  return (
    <div className="min-h-screen bg-brand-dark font-sans pb-24 md:pb-0 md:pl-24">
      <main className="md:max-w-7xl md:mx-auto">
        {renderView()}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-brand-light z-30 h-20 md:h-screen md:w-24 md:flex-col md:justify-start md:pt-8 md:border-r border-brand-border-secondary">
          <div className="flex items-center justify-around h-full md:flex-col md:justify-start md:h-auto md:gap-6 w-full">
            <NavButton
              label="Inicio"
              icon={<HomeIcon />}
              isActive={view === 'DASHBOARD'}
              onClick={() => setView('DASHBOARD')}
            />
            <NavButton
              label="Diario"
              icon={<JournalIcon />}
              isActive={view === 'TRADING_LOG'}
              onClick={() => setView('TRADING_LOG')}
              notificationCount={activeTradesCount}
            />
            <NavButton
              label="Calculadora"
              icon={<CalculatorIcon />}
              isActive={view === 'RISK_CALCULATOR'}
              onClick={() => setView('RISK_CALCULATOR')}
            />
            <NavButton
              label="Análisis"
              icon={<ChartPieIcon />}
              isActive={view === 'PERFORMANCE_STATS'}
              onClick={() => setView('PERFORMANCE_STATS')}
            />
             <NavButton
              label="Ajustes"
              icon={<Cog6ToothIcon />}
              isActive={view === 'SETTINGS' || view === 'CHECKLIST_EDITOR'}
              onClick={() => setView('SETTINGS')}
            />
          </div>
        </nav>
      
      <Toast message={toast.message} show={toast.show} isExiting={toast.isExiting} />
    </div>
  );
};

interface NavButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    notificationCount?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick, notificationCount }) => {
    return (
        <button 
            onClick={onClick} 
            className="flex flex-col items-center justify-center w-full md:h-16 group focus:outline-none relative"
        >
            <div className={`
                flex items-center justify-center w-16 h-8 rounded-full transition-all duration-300 mb-1
                ${isActive ? 'bg-brand-accent-container text-brand-accent' : 'text-brand-text-secondary group-hover:bg-brand-tertiary'}
            `}>
                <div className={`w-[22px] h-[22px]`}>
                    {icon}
                </div>
            </div>
            <span className={`
                text-[11px] font-medium transition-colors duration-200 tracking-tight
                ${isActive ? 'text-brand-text font-bold' : 'text-brand-text-secondary'}
            `}>
                {label}
            </span>
            {notificationCount > 0 && (
                <span className="absolute top-1 right-1/4 md:top-2 md:right-4 flex h-2 w-2 items-center justify-center rounded-full bg-brand-danger ring-2 ring-brand-light">
                </span>
            )}
        </button>
    );
};

export default App;