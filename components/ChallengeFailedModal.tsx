import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from './icons';
import { ChallengeMetrics } from '../hooks/useChallengeStatus';

interface ChallengeFailedModalProps {
    metrics: ChallengeMetrics;
    accountSize: number;
    onRestart: () => void;
    onClose: () => void;
}

const ChallengeFailedModal: React.FC<ChallengeFailedModalProps> = ({
    metrics,
    accountSize,
    onRestart,
    onClose,
}) => {
    const {
        currentDailyLoss,
        maxDailyLossAmount,
        currentTotalDrawdown,
        maxTotalDrawdownAmount,
        netProfit,
        daysActive,
    } = metrics;

    // Determine which rule was violated
    const dailyLossViolated = currentDailyLoss >= maxDailyLossAmount;
    const drawdownViolated = currentTotalDrawdown >= maxTotalDrawdownAmount;

    const formattedAccount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(accountSize);

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);

    return (
        <div
            className="fixed inset-0 z-[110] animate-fade-in"
            style={{
                backgroundColor: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={onClose}
        >
            <div className="w-full h-full flex items-center justify-center p-4">
                <div
                    className="bg-tc-bg w-full max-w-sm rounded-3xl shadow-2xl border border-tc-error/20 overflow-hidden animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Red Banner */}
                    <div className="bg-gradient-to-b from-tc-error/15 to-transparent pt-6 pb-3 px-5 text-center relative">
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-tc-bg-secondary transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4 text-tc-text-tertiary" />
                        </button>

                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-tc-error/10 border-2 border-tc-error/30 flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-8 h-8 text-tc-error" />
                        </div>
                        <h2 className="text-lg font-bold text-tc-error tracking-wide uppercase">
                            Evaluación No Superada
                        </h2>
                        <p className="text-xs text-tc-text-tertiary mt-1">
                            Cuenta {formattedAccount} • {daysActive} {daysActive === 1 ? 'día' : 'días'} de operativa
                        </p>
                    </div>

                    {/* Violation Details */}
                    <div className="px-5 pb-4">
                        <p className="text-[10px] font-bold text-tc-text-secondary uppercase tracking-widest mb-2.5">
                            Regla(s) Violada(s)
                        </p>
                        <div className="space-y-2">
                            {dailyLossViolated && (
                                <div className="flex items-center gap-3 bg-tc-error/5 border border-tc-error/15 rounded-xl px-3.5 py-2.5">
                                    <div className="w-2 h-2 rounded-full bg-tc-error flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-tc-text">Límite de Pérdida Diaria</p>
                                        <p className="text-[11px] text-tc-text-secondary mt-0.5">
                                            Pérdida: <span className="font-data font-bold text-tc-error">{fmt(currentDailyLoss)}</span>
                                            {' '}/ Límite: <span className="font-data font-semibold">{fmt(maxDailyLossAmount)}</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                            {drawdownViolated && (
                                <div className="flex items-center gap-3 bg-tc-error/5 border border-tc-error/15 rounded-xl px-3.5 py-2.5">
                                    <div className="w-2 h-2 rounded-full bg-tc-error flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-tc-text">Drawdown Máximo Total</p>
                                        <p className="text-[11px] text-tc-text-secondary mt-0.5">
                                            Drawdown: <span className="font-data font-bold text-tc-error">{fmt(currentTotalDrawdown)}</span>
                                            {' '}/ Límite: <span className="font-data font-semibold">{fmt(maxTotalDrawdownAmount)}</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="px-5 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-tc-bg-secondary/50 rounded-xl py-2.5 px-3 border border-tc-border-light/50 text-center">
                                <p className="text-[9px] text-tc-text-tertiary uppercase tracking-wider mb-0.5">Resultado</p>
                                <p className={`text-sm font-bold font-data ${netProfit >= 0 ? 'text-tc-growth-green' : 'text-tc-error'}`}>
                                    {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
                                </p>
                            </div>
                            <div className="bg-tc-bg-secondary/50 rounded-xl py-2.5 px-3 border border-tc-border-light/50 text-center">
                                <p className="text-[9px] text-tc-text-tertiary uppercase tracking-wider mb-0.5">Duración</p>
                                <p className="text-sm font-bold text-tc-text font-data">
                                    {daysActive} {daysActive === 1 ? 'día' : 'días'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Motivational Note */}
                    <div className="mx-5 mb-4 px-3.5 py-2.5 bg-tc-bg-secondary/30 rounded-xl border border-tc-border-light/50">
                        <p className="text-[11px] text-tc-text-secondary leading-relaxed text-center italic">
                            "El fracaso no es el fin, es parte del proceso. Los mejores traders aprenden de cada intento."
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="px-5 pb-5 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-2xl bg-tc-bg-secondary text-sm font-semibold text-tc-text border border-tc-border-light hover:bg-tc-bg-tertiary transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={onRestart}
                            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-tc-growth-green to-emerald-500 text-white text-sm font-bold shadow-lg shadow-tc-growth-green/20 hover:shadow-xl active:scale-[0.98] transition-all"
                        >
                            🔄 Reintentar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChallengeFailedModal;
