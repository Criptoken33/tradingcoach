import React, { useState, useMemo, useEffect } from 'react';
import { PairState, Direction, Probability, OperationStatus, Checklist, MT5ReportData, MT5Summary, Trade } from '../types';
import { CURRENCY_INFO, CURRENCY_PAIRS } from '../constants';
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, TrashIcon, XCircleIcon, CheckCircleIcon, InfoIcon, ShieldCheckIcon, StarIcon, ExclamationTriangleIcon, BookOpenIcon, PauseCircleIcon, ShieldAlertIcon, PlayIcon } from './icons';
import TradingTip from './TradingTip';
import AlertMessage from './AlertMessage';
import { ReflectionModal } from './ReflectionModal';

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
      <h3 className="font-semibold">Operativa Bloqueada</h3>
      <p className="text-sm opacity-90">{reason}</p>
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
        <p className="text-sm">Riesgo por Operación: <span className="font-semibold">{recommendedRisk.toFixed(2)}%</span> ({message})</p>
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
          <h3 className="font-semibold">Revisión Semanal</h3>
          <p className="text-sm opacity-90">Es fin de semana. Revisa tu rendimiento y prepara la próxima semana.</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
        <button
          onClick={onReview}
          className="bg-tc-growth-green hover:bg-tc-growth-green-light active:bg-tc-growth-green-dark text-white text-sm font-medium py-2 px-4 rounded-full shadow-sm hover:shadow-md transition-all whitespace-nowrap"
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
        <h3 className="font-semibold">Racha Perdedora Detectada</h3>
        <p className="text-sm opacity-90">
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

// CooldownNotification was replaced by ReflectionModal

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
      {cooldownUntil && <ReflectionModal cooldownUntil={cooldownUntil} />}
      {isTradingLocked && !cooldownUntil && <LockNotification reason={lockReason} />}
      {showWeeklyReview && <WeeklyReviewNotification onReview={onNavigateToStats} onDismiss={onDismissWeeklyReview} />}
      <TradingTip />
      <EuphoriaAlert currentStreak={currentStreak} />
      <ContextualRiskAlert currentStreak={currentStreak} mt5Summary={mt5Summary} />
      <RiskStatusIndicator recommendedRisk={recommendedRisk} />

      <h1 className="text-xl font-semibold text-tc-text mb-6 px-2">Lista de Seguimiento</h1>

      <div>
        {Object.keys(pairsState).length === 0 ? (
          <div className="text-center py-20 px-8 bg-tc-bg-secondary/20 rounded-[2.5rem] border border-dashed border-tc-border-medium animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-tc-bg rounded-3xl shadow-sm border border-tc-border-light flex items-center justify-center mx-auto mb-6">
              <PlusIcon className="w-10 h-10 text-tc-text-tertiary" />
            </div>
            <h3 className="text-xl font-semibold text-tc-text mb-2">¿Listo para tu próxima gran operación?</h3>
            <p className="text-tc-text-secondary text-sm max-w-xs mx-auto mb-8">
              Tu lista de seguimiento está lista. Añade los pares que planeas operar hoy para activar el Coach.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-8 py-4 bg-tc-growth-green text-white rounded-full font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="w-5 h-5" /> Añadir Símbolo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPairs.map((pair: PairState) => {
              const checklist = getChecklistForPair(pair);
              const probability = calculateProbability(pair, checklist);
              const isExecuting = pair.status === OperationStatus.OPEN || pair.status === OperationStatus.CLOSED;

              const allItems = checklist?.phases.flatMap(p => p.items) || [];
              const answeredCount = Object.keys(pair.answers).length;
              const isChecklistComplete = allItems.length > 0 && answeredCount >= allItems.length;
              const isChecklistStarted = pair.direction !== Direction.NONE;

              const baseCurrency = pair.symbol.substring(0, 3);
              const quoteCurrency = pair.symbol.substring(3, 6);
              const baseInfo = CURRENCY_INFO[baseCurrency];
              const quoteInfo = CURRENCY_INFO[quoteCurrency];

              // Action button config
              let ActionIcon = PlayIcon;
              let actionButtonColor = 'bg-tc-bg-secondary text-tc-text-tertiary';
              let actionButtonLabel = 'Analizar';

              if (isExecuting) {
                ActionIcon = CheckCircleIcon;
                actionButtonColor = 'bg-tc-bg-secondary text-tc-growth-green';
                actionButtonLabel = 'Ver';
              } else if (isChecklistComplete) {
                ActionIcon = CheckCircleIcon;
                // Color based on probability for professional feedback
                if (probability === Probability.ENTRY) {
                  actionButtonColor = 'bg-tc-growth-green/10 text-tc-growth-green shadow-sm shadow-tc-growth-green/20';
                } else {
                  actionButtonColor = 'bg-tc-warning/10 text-tc-warning shadow-sm shadow-tc-warning/20';
                }
                actionButtonLabel = 'Ver Resultados';
              } else if (isChecklistStarted) {
                ActionIcon = PlayIcon;
                actionButtonColor = 'bg-tc-warning/10 text-tc-warning animate-pulse';
                actionButtonLabel = 'Continuar Análisis';
              }

              return (
                <div key={pair.symbol} className="group relative bg-tc-bg rounded-2xl p-4 shadow-sm border border-tc-border-light flex items-center justify-between transition-all duration-300 hover:shadow-md hover:border-tc-growth-green/30 active:scale-[0.98] overflow-hidden">
                  {/* Subtle hover background jewelry */}
                  <div className="absolute inset-0 bg-tc-growth-green/0 group-hover:bg-tc-growth-green/[0.02] transition-colors duration-300" />

                  <div className="flex items-center flex-1 min-w-0 relative z-10" onClick={() => onSelectPair(pair.symbol)}>
                    {baseInfo && quoteInfo && (
                      <div className="relative w-12 h-10 mr-4 flex-shrink-0">
                        {/* Background glow based on flags */}
                        <div className="absolute inset-0 blur-xl opacity-20 bg-tc-growth-green" />
                        <img
                          className="absolute left-0 top-1 w-8 h-8 rounded-full object-cover border-2 border-tc-bg shadow-sm z-20"
                          src={`https://flagcdn.com/w80/${baseInfo.countryCode.toLowerCase()}.png`}
                          alt={`${baseInfo.name} flag`}
                        />
                        <img
                          className="absolute left-4 top-1 w-8 h-8 rounded-full object-cover border-2 border-tc-bg shadow-sm z-10"
                          src={`https://flagcdn.com/w80/${quoteInfo.countryCode.toLowerCase()}.png`}
                          alt={`${quoteInfo.name} flag`}
                        />
                      </div>
                    )}
                    <div className="min-w-0 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <p className="font-data font-bold text-tc-text text-lg leading-tight tracking-tight">
                          {pair.symbol}
                        </p>
                        {pair.status === OperationStatus.OPEN && (
                          <span className="w-2 h-2 rounded-full bg-tc-warning animate-pulse" title="Operación activa" />
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-tc-text-secondary/60 uppercase tracking-widest truncate mt-0.5">
                        {baseInfo && quoteInfo ? `${baseInfo.name} / ${quoteInfo.name}` : 'Personalizado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                    <button
                      onClick={() => onSelectPair(pair.symbol)}
                      disabled={isUiLocked}
                      className={`min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 ${isUiLocked ? 'bg-tc-bg-secondary text-tc-text-tertiary' : `${actionButtonColor} hover:bg-tc-deep-forest hover:text-white hover:shadow-lg active:scale-95`}`}
                      aria-label={actionButtonLabel}
                    >
                      <ActionIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onRemovePair(pair.symbol)}
                      className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-2xl text-tc-text-tertiary hover:bg-tc-error/10 hover:text-tc-error transition-all duration-300 active:scale-95"
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
        className="fixed bottom-26 right-6 md-medium:bottom-6 md-medium:right-6 w-14 h-14 bg-tc-growth-green hover:bg-tc-growth-green-light active:bg-tc-growth-green-dark text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 z-40 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
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
          <h2 className="text-lg font-semibold text-tc-text">Añadir Símbolo</h2>
        </div>
        <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-4">
            <div className="w-full flex items-center gap-2 bg-tc-bg-secondary rounded-t-lg border-b border-tc-border-medium px-3 py-3 transition-colors focus-within:bg-tc-bg-tertiary">
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                placeholder="Escribe un símbolo..."
                className="flex-grow bg-transparent text-tc-text focus:outline-none text-base placeholder:text-tc-text-tertiary"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); }}
              />
              <button onClick={handleAddCustom} className="bg-tc-growth-green hover:bg-tc-growth-green-light active:bg-tc-growth-green-dark text-white p-2 rounded-full shadow-sm hover:shadow-md transition-all">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {availablePairs
              .sort((a, b) => {
                const perfA = pairPerformance[a];
                const perfB = pairPerformance[b];

                // If both have performance data, sort by performance (highest first)
                if (perfA !== undefined && perfB !== undefined) {
                  return perfB - perfA;
                }

                // Symbols with performance data come before those without
                if (perfA !== undefined && perfB === undefined) return -1;
                if (perfA === undefined && perfB !== undefined) return 1;

                // If neither has performance data, maintain alphabetical order
                return a.localeCompare(b);
              })
              .map(symbol => {
                const performance = pairPerformance[symbol];
                return (
                  <li key={symbol}>
                    <button
                      onClick={() => onAddPair(symbol)}
                      className="w-full text-left p-3 rounded-2xl hover:bg-tc-bg-secondary transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center">
                        <span className="font-data font-semibold text-tc-text">{symbol}</span>
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
            <p className="text-tc-text-secondary text-center py-4 text-sm">Lista sugerida vacía.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;