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
        daysActive
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
        COMPLETE: {
            color: 'text-tc-growth-green',
            bgColor: 'bg-tc-growth-green/10',
            borderColor: 'border-tc-growth-green/20',
            icon: TrophyIcon,
            label: '¡Objetivo Logrado!',
        },
    }[status];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-tc-bg w-full max-w-2xl rounded-3xl shadow-2xl border border-tc-border-light overflow-hidden flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={`px-6 py-5 flex items-center justify-between border-b border-tc-border-light/50 ${status === 'FAILED' ? 'bg-tc-error/5' : 'bg-tc-bg-secondary/30'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                            <statusConfig.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-tc-text uppercase tracking-wide">Modo Desafío 🏆</h3>
                            <p className="text-sm text-tc-text-secondary">Día {daysActive} • {statusConfig.label}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-tc-bg-secondary rounded-full transition-colors group">
                        <XMarkIcon className="w-6 h-6 text-tc-text-secondary group-hover:text-tc-text" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 1. Daily Loss Gauge */}
                        <GaugeCard
                            label="Pérdida Diaria"
                            current={currentDailyLoss}
                            max={maxDailyLossAmount}
                            progress={dailyLossProgress}
                            inverse={true} // Higher is worse
                        />

                        {/* 2. Max Drawdown Gauge */}
                        <GaugeCard
                            label="Drawdown Total"
                            current={currentTotalDrawdown}
                            max={maxTotalDrawdownAmount}
                            progress={totalDrawdownProgress}
                            inverse={true}
                        />
                    </div>

                    {/* 3. Profit Target Bar - Full Width below */}
                    <div className="mt-8 pt-8 border-t border-tc-border-light">
                        <div className="flex flex-col justify-center">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-xs font-bold text-tc-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <ChartBarIcon className="w-4 h-4" />
                                    Objetivo de Ganancia
                                </span>
                                <span className="font-data font-bold text-tc-growth-green text-2xl">
                                    {profitTargetProgress.toFixed(1)}%
                                </span>
                            </div>
                            <div className="relative w-full h-6 bg-tc-bg-secondary rounded-full overflow-hidden border border-tc-border-light shadow-inner">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-tc-success to-tc-growth-green transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                    style={{ width: `${profitTargetProgress}%` }}
                                />
                                {/* Marker for current progress if 0 */}
                                {profitTargetProgress === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-tc-text-tertiary/20" />}
                            </div>
                            <div className="flex justify-between mt-3 text-sm font-medium text-tc-text-secondary">
                                <span className="font-data">${Math.max(0, netProfit).toFixed(2)}</span>
                                <span className="font-data">Target: ${profitTargetAmount.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-tc-bg-secondary/50 text-center text-xs text-tc-text-tertiary border-t border-tc-border-light">
                    Mantén la disciplina. El trading es una maratón, no un sprint.
                </div>
            </div>
        </div>
    );
};

const GaugeCard: React.FC<{ label: string; current: number; max: number; progress: number; inverse?: boolean }> = ({ label, current, max, progress, inverse }) => {
    // Color logic: if inverse (Loss), low is Green, high is Red.
    // If normal (Profit), low is Red/Grey, high is Green.

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
        <div className="flex flex-col bg-tc-bg-secondary/30 p-5 rounded-3xl border border-tc-border-light/50">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-tc-text-secondary uppercase tracking-widest">{label}</span>
                <span className={`font-data font-bold text-xl ${textColor}`}>
                    ${current.toFixed(2)}
                </span>
            </div>

            {/* Custom Bar Gauge */}
            <div className="relative h-4 bg-tc-bg-tertiary rounded-full overflow-hidden border border-tc-border-light shadow-inner">
                {/* Background Safe Zone (for Loss) */}
                {inverse && (
                    <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-tc-error/10 border-l border-tc-error/20" title="Zona de Peligro" />
                )}

                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>

            <div className="flex justify-between mt-3 text-xs font-medium text-tc-text-tertiary">
                <span className="font-data">$0</span>
                <span className="font-data">Límite: ${max.toFixed(0)}</span>
            </div>
        </div>
    );
}

export default ChallengeDetailsModal;
