import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PairState, Direction, View, ChecklistAnswers, RiskPlan, OperationStatus, Trade, Checklist as ChecklistType, ChecklistItemType, Phase, MT5ReportData, MT5Summary } from './types';
import { SplashScreen } from '@capacitor/splash-screen';
import AnimatedSplash from './src/components/Splash/AnimatedSplash';
import Dashboard from './components/Dashboard';
import Checklist from './components/Checklist';
import RiskManagementScreen from './components/RiskManagementModal';
import TradingLog from './components/TradingLog';
import PerformanceStats from './components/PerformanceStats';
import Settings from './components/Settings';
import ChecklistEditor from './components/ChecklistEditor';
import { HomeIcon, JournalIcon, ChartPieIcon, Cog6ToothIcon, CalculatorIcon } from './components/icons';
import { useAds } from './src/hooks/useAds';
import { useProFeatures } from './src/hooks/useProFeatures';
import { storageService } from './services/storageService';
import { calculatePnl, getWeekNumber } from './utils';
import { useFeedback } from './src/context/FeedbackContext';
import { UserRepository } from './src/services/userRepository';
import { UserData } from './types';
import {
  PairStateSchema,
  TradeSchema,
  SettingsSchema,
} from './schemas';
import { z } from 'zod';

// We wrap the single item schemas into array/record schemas as needed
const WatchlistSchema = z.record(PairStateSchema);
const TradesSchema = z.array(TradeSchema);
const ChecklistsSchema = z.array(z.any());
const ActiveChecklistIdsSchema = z.object({ long: z.string(), short: z.string() });
const Mt5ReportSchema = z.any().nullable();
const SettingsAnySchema = z.any();

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

/* Removed calculatePnl and getWeekNumber as they are now in utils.ts */

export type Theme = 'light' | 'dark' | 'system';

import { useAuth } from './src/context/AuthContext';
import { AuthScreen } from './src/components/AuthScreen';
// import { useProFeatures } from './src/hooks/useProFeatures'; // Removed duplicate
import { Paywall } from './src/components/Paywall';
import { dbService } from './src/services/dbService';
import { UpdateManager } from './src/components/UpdateManager';
import { useAndroidBackButton } from './src/hooks/useAndroidBackButton';

const App: React.FC = () => {
  const { user, loading, logout, refreshProStatus } = useAuth();
  const { showToast, showConfirm } = useFeedback();
  // const { isPro } = useProFeatures(); // Removed redundant call
  const { prepareInterstitial, showInterstitial, showBanner, hideBanner, removeBanner } = useAds();

  const [view, setView] = useState<View>('DASHBOARD');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // New Splash State
  const pro = useProFeatures(); // This `pro` object is still used for `pro.isPro` and `pro.canBackupToCloud`

  // Handle Splash Screen Logic
  useEffect(() => {
    const handleSplash = async () => {
      // Hide native splash immediately (it's handled by capacitor.config.ts duration too, but good to be explicit)
      await SplashScreen.hide();

      // Keep React splash visible for animation duration (e.g., 2.5s total)
      setTimeout(() => {
        setShowSplash(false);
      }, 2500);
    };

    handleSplash();
  }, []);

  // Android Back Button Handler
  useAndroidBackButton(() => {
    // Si el paywall está abierto, cerrarlo
    if (showPaywall) {
      setShowPaywall(false);
      return true; // Prevenir comportamiento por defecto
    }

    // Si estamos en el dashboard, minimizar la app (comportamiento por defecto)
    if (view === 'DASHBOARD') {
      return false; // Permitir que se minimice la app
    }

    // Para otras vistas, navegar hacia atrás
    if (view === 'CHECKLIST' || view === 'RISK_MANAGEMENT') {
      handleBackToDashboard();
      return true;
    }

    if (view === 'CHECKLIST_EDITOR') {
      setView('SETTINGS');
      return true;
    }

    // Para cualquier otra vista, volver al dashboard
    setView('DASHBOARD');
    return true;
  }, true);

  // AdMob Management
  // AdMob Management (Global)
  useEffect(() => {
    if (!pro.isPro) {
      showBanner();
    } else {
      removeBanner();
    }
  }, [pro.isPro, showBanner, removeBanner]);

  // Use safeParse for all persisted state to prevent app crashes
  const [pairsState, setPairsState] = useState<{ [key: string]: PairState }>(() =>
    storageService.getItem('tradingCoachWatchlist', {}, WatchlistSchema)
  );
  const [tradingLog, setTradingLog] = useState<Trade[]>(() =>
    storageService.getItem('tradingCoachLog', [], TradesSchema)
  );

  const [activePairSymbol, setActivePairSymbol] = useState<string | null>(null);

  const [settings, setSettings] = useState(() =>
    storageService.getItem('tradingCoachSettings', {
      accountBalance: '10000',
      dailyLossLimit: '1',
      weeklyLossLimit: '2.5'
    }, z.any()) // Using z.any() for now to avoid partial matching issues
  );

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('tradingCoachTheme') as Theme) || 'system';
  });

  const [checklists, setChecklists] = useState<ChecklistType[]>(() =>
    storageService.getItem('tradingCoachChecklists', [initialLongChecklist, initialShortChecklist], ChecklistsSchema)
  );

  const [activeChecklistIds, setActiveChecklistIds] = useState<{ long: string, short: string }>(() =>
    storageService.getItem('tradingCoachActiveChecklists', { long: 'default-long', short: 'default-short' }, ActiveChecklistIdsSchema)
  );

  const [isTradingLocked, setIsTradingLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  const [dynamicRiskPercentage, setDynamicRiskPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('tradingCoachRiskPercentage');
    const parsed = saved ? parseFloat(saved) : NaN;
    return isNaN(parsed) ? 0.25 : parsed;
  });

  const [mt5ReportData, setMt5ReportData] = useState<MT5ReportData | null>(null);

  useEffect(() => {
    const loadMt5Report = async () => {
      try {
        const data = await dbService.getItem<MT5ReportData>('tradingCoachMt5Report');
        if (data) {
          setMt5ReportData(data);
        }
      } catch (error) {
        console.error('Error loading MT5 report from DB:', error);
      }
    };
    loadMt5Report();
  }, []);

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const currentAccountBalance = useMemo(() => {
    let baseBalance = parseFloat(settings.accountBalance) || 10000;

    if (mt5ReportData?.equityCurve && mt5ReportData.equityCurve.length > 0) {
      const lastReportEntry = mt5ReportData.equityCurve[mt5ReportData.equityCurve.length - 1];
      // startTime could be tracked separately if needed
    }

    return baseBalance;
  }, [mt5ReportData, settings.accountBalance]);

  const challengeSettings = useMemo((): ChallengeSettings | undefined => {
    if (!settings.isChallengeActive) return undefined;
    return {
      isActive: true,
      startDate: settings.challengeStartDate || Date.now(),
      accountSize: parseFloat(settings.accountBalance) || 10000,
      dailyLossLimitPct: parseFloat(settings.dailyLossLimit) || 0,
      maxTotalDrawdownPct: parseFloat(settings.maxTotalDrawdownPct) || 10,
      profitTargetPct: parseFloat(settings.profitTargetPct) || 8,
    };
  }, [settings]);

  // --- DATA SYNC LOGIC ---
  // --- DATA SYNC LOGIC ---
  const [isCloudDataLoaded, setIsCloudDataLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        if (!pro.canBackupToCloud) {
          console.log("Cloud backup disabled for non-PRO users");
          // If user just activated temp pro, wait a bit for claims to propagate?
          // Actually pro.canBackupToCloud already checks the claims/profile.
          return;
        }

        // Add artificial delay to allow token refresh to propagate fully if this triggered by Login/Activation
        await new Promise(r => setTimeout(r, 1000));

        const cloudData = await UserRepository.getUserData(user.uid);
        if (cloudData) {
          if (cloudData.pairStates) setPairsState(cloudData.pairStates);
          if (cloudData.trades) setTradingLog(cloudData.trades);
          if (cloudData.checklists) setChecklists(cloudData.checklists);
          if (cloudData.activeChecklistIds) setActiveChecklistIds(cloudData.activeChecklistIds);
          if (cloudData.settings) setSettings(prev => ({ ...prev, ...cloudData.settings }));
          if (cloudData.mt5Report) setMt5ReportData(cloudData.mt5Report);

          showToast('Datos sincronizados desde la nube', 'success');
        }
      } catch (error) {
        console.error("Error loading data from cloud", error);
        // Only show error if it's NOT a permission denied (which happens if pro status is lost or syncing)
        // Or show a friendlier message
        showToast('Error al sincronizar datos. Reintentando...', 'warning');
      } finally {
        setIsCloudDataLoaded(true);
      }
    };

    loadData();
  }, [user, pro.canBackupToCloud]); // added pro.canBackupToCloud dependency

  // Debounced Save
  useEffect(() => {
    if (!user) return;

    // Prevent saving before initial load to avoid overwriting cloud data with empty local state
    if (!isCloudDataLoaded) return;

    const saveData = async () => {
      const userData: UserData = {
        pairStates: pairsState,
        trades: tradingLog,
        checklists,
        activeChecklistIds,
        settings,
        mt5Report: mt5ReportData,
        lastUpdated: Date.now(),
      };

      try {
        if (!pro.canBackupToCloud) {
          console.log("Cloud backup disabled for non-PRO users");
          return;
        }
        await UserRepository.saveUserData(user.uid, userData);
        console.log("Data saved to cloud");
      } catch (error: any) {
        console.error("Error saving data to cloud", error);
        if (error.code === 'permission-denied') {
          showToast('Error de sincronización: Servidor rechazó la copia (Solo PRO)', 'error');
        }
      }
    };

    const timeoutId = setTimeout(saveData, 5000); // 5 seconds debounce
    return () => clearTimeout(timeoutId);

  }, [user, pairsState, tradingLog, checklists, activeChecklistIds, settings, mt5ReportData, isCloudDataLoaded, pro.canBackupToCloud]);


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
    storageService.setItem('tradingCoachTheme', theme);
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
    storageService.setItem('tradingCoachSettings', settings);
  }, [settings]);

  useEffect(() => {
    storageService.setItem('tradingCoachWatchlist', pairsState);
  }, [pairsState]);

  useEffect(() => {
    storageService.setItem('tradingCoachLog', tradingLog);
  }, [tradingLog]);

  useEffect(() => {
    storageService.setItem('tradingCoachChecklists', checklists);
  }, [checklists]);

  useEffect(() => {
    storageService.setItem('tradingCoachActiveChecklists', activeChecklistIds);
  }, [activeChecklistIds]);

  useEffect(() => {
    storageService.setItem('tradingCoachRiskPercentage', String(dynamicRiskPercentage));
  }, [dynamicRiskPercentage]);

  useEffect(() => {
    const saveMt5Report = async () => {
      if (mt5ReportData) {
        await dbService.setItem('tradingCoachMt5Report', mt5ReportData);
      } else {
        await dbService.removeItem('tradingCoachMt5Report');
      }
    };
    saveMt5Report();
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


  // triggerToast is now a thin wrapper around showToast for backward compat
  const triggerToast = useCallback((message: string) => {
    showToast(message);
  }, [showToast]);

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
      showToast('El símbolo ya está en la lista.', 'warning');
      return;
    }
    setPairsState(prevState => ({
      ...prevState,
      [symbol]: createNewPairState(symbol)
    }));
    showToast(`${symbol} añadido`, 'success');
  }, [pairsState]);

  const handleRemovePair = useCallback((symbol: string) => {
    setPairsState(prevState => {
      const newState = { ...prevState };
      delete newState[symbol];
      return newState;
    });
    showToast(`${symbol} eliminado`);
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
    if (!pro.isPro) {
      prepareInterstitial();
    }
    setView('RISK_MANAGEMENT');
  }, [pro.isPro, prepareInterstitial]);

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

    showToast(`Operación en ${activePairSymbol} abierta.`, 'success');

    if (!pro.isPro) {
      // Fire and forget (or await if we want to block)
      // We await to ensuring the ad shows before navigating back fully
      // But showToast is already shown. The ad will overlay.
      showInterstitial();
    }

    handleBackToDashboard();
  }, [activePairSymbol, pairsState, handleBackToDashboard, handleRemovePair, getChecklistForPair, pro.isPro, showInterstitial]);

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

  const handleSaveSettings = (newSettings: any) => {
    console.log('[App] Saving settings:', newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Ajustes guardados.', 'success');
  };

  const handleImportMt5Report = (htmlContent: string) => {
    if (!pro.canImportMT5) {
      setShowPaywall(true);
      return;
    }
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
      const monthlyPerformance = (report.balance?.table?.years ?? []).map((yearData: { year: number; months: Record<string, number> }) => ({
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

      showToast('Reporte de MT5 importado con éxito.', 'success');
      setView('PERFORMANCE_STATS');
    } catch (e) {
      console.error("Failed to parse MT5 report", e);
      showToast('Error: El formato del reporte no es válido o está dañado.', 'error');
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
    showToast('Datos importados con éxito.', 'success');
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

    showToast('El diario y la lista de seguimiento han sido reiniciados.', 'success');
    setView('DASHBOARD');
  }, [showToast]);

  const handleDeleteMt5Report = useCallback(() => {
    setMt5ReportData(null);
    showToast('Reporte de MT5 eliminado.', 'success');
  }, [showToast]);


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
          onLogout={logout}
          onShowPaywall={() => setShowPaywall(true)}
          isPro={pro.isPro}
        />;
      case 'CHECKLIST_EDITOR':
        return <ChecklistEditor
          checklists={checklists}
          setChecklists={setChecklists}
          activeIds={activeChecklistIds}
          setActiveIds={setActiveChecklistIds}
          onBack={() => setView('SETTINGS')}
          onShowToast={triggerToast}
          onShowPaywall={() => setShowPaywall(true)}
          isPro={pro.isPro}
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
            isBannerVisible={!pro.isPro && view === 'DASHBOARD'}
            challengeSettings={challengeSettings}
          />
        );
    }
  };

  const activeTradesCount = tradingLog.filter(trade => trade.status === OperationStatus.OPEN).length;

  return (
    <div className={`
      min-h-screen bg-md-surface font-sans 
      md-medium:pb-0 md-medium:pl-20 pb-20
      ${!pro.isPro ? 'pt-[60px]' : ''} 
    `}>
      <main className="md-expanded:max-w-7xl md-expanded:mx-auto">
        {renderView()}
      </main>

      {/* Navigation Bar (Bottom on mobile, Rail on tablet+) */}
      <nav className={`
        fixed left-0 right-0 z-30 
        bottom-0
        bg-tc-bg 
        h-20 
        md-medium:bottom-0 md-medium:h-screen md-medium:w-20 md-medium:flex-col md-medium:justify-start md-medium:pt-2
        border-t md-medium:border-t-0 md-medium:border-r border-tc-border-light
        shadow-lg
      `}>
        <div className="flex items-center justify-around h-full md-medium:flex-col md-medium:justify-start md-medium:h-auto md-medium:gap-1 w-full">
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

      {/* Toast, ConfirmDialog, and FullScreenLoader are now rendered by FeedbackProvider */}

      <UpdateManager />

      {showPaywall && (
        <Paywall
          onClose={() => setShowPaywall(false)}
          onSuccess={async () => {
            await refreshProStatus();
            triggerToast('¡Bienvenido a TradingCoach PRO!');
          }}
        />
      )}
    </div>
  );
};

// Conditional rendering moved to end after all hooks
const AppWithAuth: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleSplash = async () => {
      // Small delay (270ms) to ensure React has fully painted the green background 
      // BEFORE we start fading out the native splash. This prevents the "white flash" or "flicker".
      await new Promise(resolve => setTimeout(resolve, 270));

      // Hide native splash with a fade out effect to smooth the transition
      await SplashScreen.hide({
        fadeOutDuration: 500
      });

      // Keep React splash visible for animation duration (e.g., 2.5s total)
      setTimeout(() => {
        // Remove the inline splash background so the app's normal colors take over
        document.body.style.backgroundColor = '';
        setShowSplash(false);
      }, 2500);
    };

    handleSplash();
  }, []);

  if (showSplash) {
    return <AnimatedSplash />;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-md-surface flex flex-col items-center justify-center gap-6 animate-[fade-in_0.3s_ease-out]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-[3px] border-md-surface-container-highest" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-[3px] border-transparent border-t-md-primary animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold text-md-on-surface">Trading Coach</h1>
          <p className="text-sm text-md-on-surface-variant animate-pulse">Cargando tu espacio de trading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <App />;
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
      className="
              flex flex-col items-center justify-center 
              w-full h-full
              md-medium:w-14 md-medium:h-14 md-medium:mx-auto
              min-h-[48px] min-w-[48px]
              group focus:outline-none relative
              transition-colors duration-md-short4 ease-md-standard
            "
      aria-label={label}
    >
      {/* State Layer Container */}
      <div className={`
                flex flex-col items-center justify-center gap-1
                md-medium:gap-0.5
                w-16 h-12 
                md-medium:w-14 md-medium:h-14
                rounded-2xl
                transition-all duration-200 ease-in-out
                ${isActive
          ? 'bg-tc-growth-green/10 text-tc-growth-green'
          : 'text-tc-text-secondary hover:bg-tc-bg-secondary active:bg-tc-bg-tertiary'
        }
            `}>
        {/* Icon */}
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>

        {/* Label */}
        <span className={`
                    text-xs
                    transition-colors duration-200
                    ${isActive ? 'font-bold' : 'font-medium'}
                `}>
          {label}
        </span>
      </div>

      {/* Notification Badge */}
      {(notificationCount ?? 0) > 0 && (
        <span className="
                  absolute top-1 right-1/4 
                  md-medium:top-1 md-medium:right-2
                  flex h-2 w-2 items-center justify-center 
                  rounded-full 
                  bg-tc-error 
                  ring-2 ring-tc-bg
                ">
        </span>
      )}
    </button>
  );
};

export default AppWithAuth;