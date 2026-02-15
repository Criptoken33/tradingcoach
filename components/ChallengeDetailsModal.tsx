import React from 'react';
import { ShieldCheckIcon, ExclamationTriangleIcon, TrophyIcon, XMarkIcon, ChartBarIcon } from './icons';
import { ChallengeMetrics } from '../hooks/useChallengeStatus';

interface ChallengeDetailsModalProps {
    metrics: ChallengeMetrics;
    onClose: () => void;
}

const ChallengeDetailsModal: React.FC<ChallengeDetailsModalProps> = ({ metrics, onClose }) => {
    if (!metrics) return null;

    const {
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
    } = metrics;

    const statusConfig = {
        PASSING: {
            color: 'text-tc-success',
            bgColor: 'bg-tc-success/10',
            borderColor: 'border-tc-success/20',
            icon: ShieldCheckIcon,
            label: 'En Curso (Pasando)',
        },
        CAUTION: {
            color: 'text-tc-warning',
            bgColor: 'bg-tc-warning/10',
            borderColor: 'border-tc-warning/20',
            icon: ExclamationTriangleIcon,
            label: 'Precaución',
        },
        FAILED: {
            color: 'text-tc-error',
            bgColor: 'bg-tc-error/10',
            borderColor: 'border-tc-error/20',
            icon: ExclamationTriangleIcon,
            label: 'Desafío Fallido',
        },
        EXPIRED: {
            color: 'text-tc-text-tertiary',
            bgColor: 'bg-tc-bg-tertiary/50',
            borderColor: 'border-tc-border-light',
            icon: ExclamationTriangleIcon,
            label: 'Tiempo Agotado',
        },
        COMPLETE: {
            color: 'text-tc-growth-green',
            bgColor: 'bg-tc-growth-green/10',
            borderColor: 'border-tc-growth-green/20',
            icon: TrophyIcon,
            label: '¡Objetivo Logrado!',
        },
    }[status];

    return (
        <div
            className="fixed inset-0 z-[100] animate-fade-in"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="w-full h-full overflow-y-auto overscroll-contain flex flex-col items-center"
                style={{
                    paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
                    paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
                    paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
                    paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
                }}
            >
                {/* Spacer */}
                <div className="flex-1 min-h-[0.5rem]" />

                {/* Modal Card */}
                <div
                    className="bg-tc-bg w-full max-w-lg rounded-3xl shadow-2xl border border-tc-border-light overflow-hidden flex flex-col flex-shrink-0 animate-slide-up"
                    style={{ maxHeight: '85vh' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-tc-border-light/50 flex-shrink-0 ${status === 'FAILED' ? 'bg-tc-error/5' : 'bg-tc-bg-secondary/30'}`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-xl flex-shrink-0 ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                                <statusConfig.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base sm:text-lg font-bold text-tc-text uppercase tracking-wide truncate">
                                    Modo Desafío 🏆
                                </h3>
                                <p className="text-xs sm:text-sm text-tc-text-secondary truncate">
                                    Día {daysActive} • {statusConfig.label}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-tc-bg-secondary rounded-full transition-colors group flex-shrink-0 ml-2">
                            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-tc-text-secondary group-hover:text-tc-text" />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="px-4 py-5 sm:p-6 overflow-y-auto overscroll-contain flex-1">
                        {/* Gauge Cards */}
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <GaugeCard
                                label="Pérdida Diaria"
                                current={currentDailyLoss}
                                max={maxDailyLossAmount}
                                progress={dailyLossProgress}
                                inverse={true}
                            />
                            <GaugeCard
                                label="Drawdown Total"
                                current={currentTotalDrawdown}
                                max={maxTotalDrawdownAmount}
                                progress={totalDrawdownProgress}
                                inverse={true}
                            />
                        </div>

                        {/* Profit Target Bar - Full Width */}
                        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-tc-border-light">
                            <div className="flex justify-between items-end mb-3 gap-2">
                                <span className="text-[10px] sm:text-xs font-bold text-tc-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                                    <ChartBarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="truncate">Objetivo de Ganancia</span>
                                </span>
                                <span className="font-data font-bold text-tc-growth-green text-xl sm:text-2xl flex-shrink-0">
                                    {profitTargetProgress.toFixed(1)}%
                                </span>
                            </div>
                            <div className="relative w-full h-5 sm:h-6 bg-tc-bg-secondary rounded-full overflow-hidden border border-tc-border-light shadow-inner">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-tc-success to-tc-growth-green transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                    style={{ width: `${profitTargetProgress}%` }}
                                />
                                {profitTargetProgress === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-tc-text-tertiary/20" />}
                            </div>
                            <div className="flex justify-between mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-tc-text-secondary">
                                <span className="font-data">${Math.max(0, netProfit).toFixed(2)}</span>
                                <span className="font-data">Target: ${profitTargetAmount.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Trading Days & Time Remaining */}
                        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-tc-border-light">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-tc-bg-secondary/50 rounded-xl py-3 px-3 border border-tc-border-light/50 text-center">
                                    <p className="text-[9px] text-tc-text-tertiary uppercase tracking-wider mb-1">Días Operados</p>
                                    <p className={`text-lg font-bold font-data ${tradingDaysCount >= minTradingDays ? 'text-tc-growth-green' : 'text-tc-text'}`}>
                                        {tradingDaysCount}<span className="text-sm text-tc-text-tertiary">/{minTradingDays}</span>
                                    </p>
                                    <p className="text-[9px] text-tc-text-tertiary mt-0.5">
                                        {tradingDaysCount >= minTradingDays ? '✅ Completado' : `Faltan ${minTradingDays - tradingDaysCount}`}
                                    </p>
                                </div>
                                <div className="bg-tc-bg-secondary/50 rounded-xl py-3 px-3 border border-tc-border-light/50 text-center">
                                    <p className="text-[9px] text-tc-text-tertiary uppercase tracking-wider mb-1">Tiempo Restante</p>
                                    <p className={`text-lg font-bold font-data ${daysRemaining <= 5 ? 'text-tc-error' : daysRemaining <= 10 ? 'text-tc-warning' : 'text-tc-text'}`}>
                                        {daysRemaining}<span className="text-sm text-tc-text-tertiary"> días</span>
                                    </p>
                                    <p className="text-[9px] text-tc-text-tertiary mt-0.5">
                                        Día {daysActive} de 30
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Tip */}
                    <div className="px-4 py-3 sm:p-4 bg-tc-bg-secondary/50 text-center text-[11px] sm:text-xs text-tc-text-tertiary border-t border-tc-border-light flex-shrink-0">
                        Mantén la disciplina. El trading es una maratón, no un sprint.
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1 min-h-[0.5rem]" />
            </div>
        </div>
    );
};

const GaugeCard: React.FC<{ label: string; current: number; max: number; progress: number; inverse?: boolean }> = ({ label, current, max, progress, inverse }) => {
    let colorClass = 'bg-tc-growth-green';
    let textColor = 'text-tc-text';

    if (inverse) {
        if (progress > 80) {
            colorClass = 'bg-tc-error shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse';
            textColor = 'text-tc-error';
        } else if (progress > 50) {
            colorClass = 'bg-tc-warning';
            textColor = 'text-tc-warning';
        } else {
            colorClass = 'bg-tc-success';
            textColor = 'text-tc-text';
        }
    }

    return (
        <div className="flex flex-col bg-tc-bg-secondary/30 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-tc-border-light/50">
            <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-tc-text-secondary uppercase tracking-widest truncate">{label}</span>
                <span className={`font-data font-bold text-lg sm:text-xl flex-shrink-0 ${textColor}`}>
                    ${current.toFixed(2)}
                </span>
            </div>

            {/* Custom Bar Gauge */}
            <div className="relative h-3.5 sm:h-4 bg-tc-bg-tertiary rounded-full overflow-hidden border border-tc-border-light shadow-inner">
                {inverse && (
                    <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-tc-error/10 border-l border-tc-error/20" title="Zona de Peligro" />
                )}
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>

            <div className="flex justify-between mt-2 sm:mt-3 text-[11px] sm:text-xs font-medium text-tc-text-tertiary">
                <span className="font-data">$0</span>
                <span className="font-data">Límite: ${max.toFixed(0)}</span>
            </div>
        </div>
    );
}

export default ChallengeDetailsModal;
