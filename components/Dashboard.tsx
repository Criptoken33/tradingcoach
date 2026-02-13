import React, { useState, useMemo, useEffect } from 'react';
import { PairState, Direction, Probability, OperationStatus, Checklist, MT5ReportData, MT5Summary, Trade } from '../types';
import { CURRENCY_INFO, CURRENCY_PAIRS } from '../constants';
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, TrashIcon, XCircleIcon, CheckCircleIcon, InfoIcon, ShieldCheckIcon, StarIcon, ExclamationTriangleIcon, BookOpenIcon, PauseCircleIcon } from './icons';
import TradingTip from './TradingTip';
import AlertMessage from './AlertMessage';

const calculateProbability = (pairState: PairState, checklist: Checklist | undefined): Probability => {
  if (pairState.direction === Direction.NONE || !checklist) {
    return Probability.NONE;
  }

  if (pairState.status === OperationStatus.OPEN || pairState.status === OperationStatus.CLOSED) {
    return Probability.ENTRY;
  }

  const allItems = checklist.phases.flatMap(p => p.items);
  if (allItems.length === 0) {
    return Probability.NONE;
  }

  const answers = pairState.answers;

  const yesCount = Object.values(answers).filter(a => a === true).length;
  const totalQuestions = allItems.length;

  if (yesCount === totalQuestions) {
    return Probability.ENTRY;
  }
  if (yesCount >= totalQuestions * 0.75) {
    return Probability.HIGH;
  }
  if (yesCount >= totalQuestions * 0.5) {
    return Probability.MEDIUM;
  }
  return Probability.LOW;
};


interface DashboardProps {
  pairsState: { [key: string]: PairState };
  onSelectPair: (symbol: string) => void;
  onAddPair: (symbol: string) => void;
  onRemovePair: (symbol: string) => void;
  isTradingLocked: boolean;
  lockReason: string;
  recommendedRisk: number;
  pairPerformance: { [symbol: string]: number };
  showWeeklyReview: boolean;
  onDismissWeeklyReview: () => void;
  onNavigateToStats: () => void;
  getChecklistForPair: (pair: PairState) => Checklist | undefined;
  currentStreak: { type: string, count: number };
  mt5Summary: MT5Summary | null;
  tradingLog: Trade[];
  cooldownUntil: number | null;
  isBannerVisible?: boolean;
}

const LockNotification: React.FC<{ reason: string }> = ({ reason }) => (
  <div className="bg-tc-error/10 border border-tc-error/20 text-tc-error p-4 rounded-3xl mb-6 flex items-start space-x-3">
    <InfoIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
    <div>
      <h3 className="title-medium">Operativa Bloqueada</h3>
      <p className="body-medium opacity-90">{reason}</p>
    </div>
  </div>
);

const RiskStatusIndicator: React.FC<{ recommendedRisk: number }> = ({ recommendedRisk }) => {
  let message = '';
  let Icon = ShieldCheckIcon;
  let bgColor = 'bg-tc-success/10';
  let textColor = 'text-tc-success';

  if (recommendedRisk <= 0.25) {
    message = 'Conservador';
  } else if (recommendedRisk <= 0.5) {
    message = 'Controlado';
    bgColor = 'bg-tc-warning/10';
    textColor = 'text-tc-warning';
    Icon = InfoIcon;
  } else if (recommendedRisk <= 0.75) {
    message = 'Moderado';
    bgColor = 'bg-tc-warning/10';
    textColor = 'text-tc-warning';
    Icon = ExclamationTriangleIcon;
  } else { // 1.0%
    message = 'Máximo';
    bgColor = 'bg-tc-error/10';
    textColor = 'text-tc-error';
    Icon = ExclamationTriangleIcon;
  }

  return (
    <div className={`${bgColor} ${textColor} p-4 rounded-3xl mb-6 flex items-center space-x-3 animate-fade-in`}>
      <Icon className="w-6 h-6 flex-shrink-0" />
      <div>
        <p className="body-medium">Riesgo por Operación: <span className="label-large">{recommendedRisk.toFixed(2)}%</span> ({message})</p>
      </div>
    </div>
  );
};

interface WeeklyReviewNotificationProps {
  onReview: () => void;
  onDismiss: () => void;
}

const WeeklyReviewNotification: React.FC<WeeklyReviewNotificationProps> = ({ onReview, onDismiss }) => {
  return (
    <div className="bg-tc-bg-tertiary text-tc-text p-4 rounded-3xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-sm border border-tc-border-light">
      <div className="flex items-start space-x-3">
        <BookOpenIcon className="w-6 h-6 flex-shrink-0 mt-0.5 text-tc-growth-green" />
        <div>
          <h3 className="title-medium">Revisión Semanal</h3>
          <p className="body-medium opacity-90">Es fin de semana. Revisa tu rendimiento y prepara la próxima semana.</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
        <button
          onClick={onReview}
          className="bg-tc-growth-green hover:bg-tc-growth-green-light active:bg-tc-growth-green-dark text-white label-large py-2 px-4 rounded-full shadow-sm hover:shadow-md transition-all whitespace-nowrap"
        >
          Revisar Ahora
        </button>
        <button
          onClick={onDismiss}
          className="p-2 rounded-full hover:bg-tc-bg-secondary"
          aria-label="Cerrar notificación"
        >
          <XCircleIcon className="w-6 h-6 text-tc-text-secondary" />
        </button>
      </div>
    </div>
  );
};

const ContextualRiskAlert: React.FC<{ currentStreak: { type: string, count: number }, mt5Summary: MT5Summary | null }> = ({ currentStreak, mt5Summary }) => {
  if (currentStreak.type !== 'loss' || currentStreak.count < 3 || !mt5Summary) {
    return null;
  }

  return (
    <div className="bg-tc-warning/10 text-tc-warning p-4 rounded-3xl mb-6 flex items-start space-x-3 animate-fade-in border border-tc-warning/20">
      <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="title-medium">Racha Perdedora Detectada</h3>
        <p className="body-medium opacity-90">
          Llevas {currentStreak.count} pérdidas consecutivas. Tu máximo histórico es {mt5Summary.maxConsecutiveLosses}. Reduce el riesgo.
        </p>
      </div>
    </div>
  );
};

const EuphoriaAlert: React.FC<{ currentStreak: { type: string, count: number } }> = ({ currentStreak }) => {
  if (currentStreak.type !== 'win' || currentStreak.count < 3) {
    return null;
  }
  const message = `¡Gran racha! Llevas ${currentStreak.count} operaciones ganadoras. Recuerda mantener la disciplina y adherirte a tu plan. No aumentes el riesgo por exceso de confianza.`;
  return <div className="mb-6"><AlertMessage type="info" text={message} /></div>;
};

const CooldownNotification: React.FC<{ cooldownUntil: number }> = ({ cooldownUntil }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, cooldownUntil - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [cooldownUntil]);

  const message = "Pausa y Analiza: Acabas de cerrar una pérdida. Tómate 15 minutos para revisar la operación en tu diario y despejar la mente antes de buscar una nueva entrada. Un trader profesional protege su estado mental.";

  return (
    <div className="bg-tc-warning/10 border border-tc-warning/20 text-tc-warning p-4 rounded-3xl mb-6 flex items-start space-x-3">
      <PauseCircleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
      <div>
        <div className="flex justify-between items-center">
          <h3 className="title-medium">Periodo de Reflexión Activo</h3>
          <span className="title-large font-mono">{timeLeft}</span>
        </div>
        <p className="body-medium opacity-90">{message}</p>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ pairsState, onSelectPair, onAddPair, onRemovePair, isTradingLocked, lockReason, recommendedRisk, pairPerformance, showWeeklyReview, onDismissWeeklyReview, onNavigateToStats, getChecklistForPair, currentStreak, mt5Summary, tradingLog, cooldownUntil, isBannerVisible }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const availablePairs = CURRENCY_PAIRS.filter(p => !pairsState[p]);

  const probabilityOrder = {
    [Probability.ENTRY]: 0,
    [Probability.HIGH]: 1,
    [Probability.MEDIUM]: 2,
    [Probability.LOW]: 3,
    [Probability.NONE]: 4,
    [Probability.INVALID]: 5,
  };

  const sortedPairs = Object.values(pairsState).sort((a: PairState, b: PairState) => {
    const probA = calculateProbability(a, getChecklistForPair(a));
    const probB = calculateProbability(b, getChecklistForPair(b));
    return probabilityOrder[probA] - probabilityOrder[probB];
  });

  const isUiLocked = isTradingLocked || !!cooldownUntil;

  return (
    <div className="p-4 md-medium:p-6 md-expanded:p-8 max-w-5xl mx-auto animate-fade-in pb-24">
      {cooldownUntil && <CooldownNotification cooldownUntil={cooldownUntil} />}
      {isTradingLocked && !cooldownUntil && <LockNotification reason={lockReason} />}
      {showWeeklyReview && <WeeklyReviewNotification onReview={onNavigateToStats} onDismiss={onDismissWeeklyReview} />}
      <TradingTip />
      <EuphoriaAlert currentStreak={currentStreak} />
      <ContextualRiskAlert currentStreak={currentStreak} mt5Summary={mt5Summary} />
      <RiskStatusIndicator recommendedRisk={recommendedRisk} />

      <h1 className="headline-medium text-tc-text mb-6 px-2">Lista de Seguimiento</h1>

      <div>
        {Object.keys(pairsState).length === 0 ? (
          <div className="text-center py-16 px-4 bg-tc-bg rounded-3xl border border-tc-border-light">
            <p className="text-tc-text-secondary title-large">Tu lista está vacía.</p>
            <p className="text-tc-text-tertiary body-medium mt-1">Usa el botón + para añadir símbolos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPairs.map((pair: PairState) => {
              const isPlanComplete = pair.status === OperationStatus.OPEN || pair.status === OperationStatus.CLOSED;

              const baseCurrency = pair.symbol.substring(0, 3);
              const quoteCurrency = pair.symbol.substring(3, 6);
              const baseInfo = CURRENCY_INFO[baseCurrency];
              const quoteInfo = CURRENCY_INFO[quoteCurrency];

              return (
                <div key={pair.symbol} className="bg-tc-bg rounded-2xl p-4 shadow-sm border border-tc-border-light flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-tc-border-medium active:scale-[0.99]">
                  <div className="flex items-center flex-1 min-w-0" onClick={() => onSelectPair(pair.symbol)}>
                    {baseInfo && quoteInfo && (
                      <div className="relative w-10 h-8 mr-4 flex-shrink-0">
                        <img
                          className="absolute left-0 top-0 w-7 h-7 rounded-full object-cover border-2 border-tc-border-light shadow-sm"
                          src={`https://flagcdn.com/w40/${baseInfo.countryCode.toLowerCase()}.png`}
                          alt={`${baseInfo.name} flag`}
                        />
                        <img
                          className="absolute left-4 top-0 w-7 h-7 rounded-full object-cover border-2 border-tc-border-light shadow-sm"
                          src={`https://flagcdn.com/w40/${quoteInfo.countryCode.toLowerCase()}.png`}
                          alt={`${quoteInfo.name} flag`}
                        />
                      </div>
                    )}
                    <div className="min-w-0 cursor-pointer">
                      <p className="title-large text-tc-text leading-tight">
                        {pair.symbol}
                      </p>
                      <p className="body-small text-tc-text-secondary truncate">
                        {baseInfo && quoteInfo ? `${baseInfo.name} / ${quoteInfo.name}` : 'Personalizado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="h-6 w-px bg-tc-border-light"></div>
                    <button
                      onClick={() => onSelectPair(pair.symbol)}
                      disabled={isUiLocked}
                      className={`min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 ${isUiLocked ? 'bg-gray-100 text-tc-text-tertiary' : 'bg-tc-deep-forest hover:bg-tc-deep-forest-light text-white hover:shadow-md active:scale-95'}`}
                      aria-label={isPlanComplete ? 'Ver' : 'Analizar'}
                    >
                      <CheckCircleIcon className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => onRemovePair(pair.symbol)}
                      className="min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-full text-tc-text-tertiary hover:bg-tc-error/10 hover:text-tc-error transition-all duration-200"
                      aria-label={`Eliminar ${pair.symbol}`}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        disabled={isUiLocked}
        className={`fixed ${isBannerVisible ? 'bottom-40' : 'bottom-24'} right-6 md-medium:bottom-6 md-medium:right-6 w-14 h-14 bg-tc-growth-green hover:bg-tc-growth-green-light active:bg-tc-growth-green-dark text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 z-40 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Añadir símbolo"
      >
        <PlusIcon className="w-7 h-7" />
      </button>

      {isAddModalOpen && (
        <AddSymbolModal
          availablePairs={availablePairs}
          onAddPair={onAddPair}
          onClose={() => setIsAddModalOpen(false)}
          pairPerformance={pairPerformance}
        />
      )}
    </div>
  );
};

interface AddSymbolModalProps {
  availablePairs: string[];
  onAddPair: (symbol: string) => void;
  onClose: () => void;
  pairPerformance: { [key: string]: number };
}

const AddSymbolModal: React.FC<AddSymbolModalProps> = ({ availablePairs, onAddPair, onClose, pairPerformance }) => {
  const [customSymbol, setCustomSymbol] = useState('');

  const handleAddCustom = () => {
    const symbolToAdd = customSymbol.trim().toUpperCase();
    if (symbolToAdd.length >= 4) {
      onAddPair(symbolToAdd);
      setCustomSymbol('');
    }
  };

  return (
    <div className="fixed inset-0 bg-tc-bg-overlay flex justify-center items-center z-50 p-4 animate-fade-in backdrop-blur-sm" onClick={onClose}>
      <div className="bg-tc-bg backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-tc-border-light" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex justify-between items-center bg-transparent">
          <h2 className="headline-small text-tc-text">Añadir Símbolo</h2>
        </div>
        <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-4">
            <div className="w-full flex items-center gap-2 bg-tc-bg-secondary rounded-t-lg border-b border-tc-border-medium px-3 py-3 transition-colors focus-within:bg-tc-bg-tertiary">
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                placeholder="Escribe un símbolo..."
                className="flex-grow bg-transparent text-tc-text focus:outline-none body-large placeholder:text-tc-text-tertiary"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); }}
              />
              <button onClick={handleAddCustom} className="bg-tc-growth-green hover:bg-tc-growth-green-light active:bg-tc-growth-green-dark text-white p-2 rounded-full shadow-sm hover:shadow-md transition-all">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {availablePairs.map(symbol => {
              const performance = pairPerformance[symbol];
              return (
                <li key={symbol}>
                  <button
                    onClick={() => onAddPair(symbol)}
                    className="w-full text-left p-3 rounded-2xl hover:bg-tc-bg-secondary transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <span className="title-medium text-tc-text">{symbol}</span>
                      {performance !== undefined && (
                        <span
                          className="ml-2"
                          title={performance >= 0 ? `P/L: ${performance.toFixed(2)}` : `P/L: ${performance.toFixed(2)}`}
                        >
                          {performance >= 0 ? (
                            <StarIcon className="w-4 h-4 text-tc-success" />
                          ) : (
                            <ExclamationTriangleIcon className="w-4 h-4 text-tc-error" />
                          )}
                        </span>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-tc-bg-secondary group-hover:bg-tc-growth-green group-hover:text-white flex items-center justify-center transition-colors text-tc-text-secondary">
                      <PlusIcon className="w-5 h-5" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {availablePairs.length === 0 && (
            <p className="text-tc-text-secondary text-center py-4 body-medium">Lista sugerida vacía.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;