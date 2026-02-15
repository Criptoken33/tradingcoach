import React, { useState, useEffect } from 'react';
import { useChallengeStatus } from '../hooks/useChallengeStatus';
import { Trade, ChallengeSettings, ChallengeStatus } from '../types';
import { ACCOUNT_SIZES, FUNDING_DEFAULTS } from '../constants/fundingDefaults';
import { ShieldCheckIcon, ExclamationTriangleIcon, TrophyIcon } from './icons';
import ChallengeDetailsModal from './ChallengeDetailsModal';
import FundingCertificateModal from './FundingCertificateModal';
import ChallengeFailedModal from './ChallengeFailedModal';

interface ChallengeDashboardProps {
    trades: Trade[];
    settings?: ChallengeSettings;
    isChallengeActive: boolean;
    onToggleChallenge: (active: boolean, accountSize?: number) => void;
    className?: string;
}

const formatCurrency = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({
    trades,
    settings,
    isChallengeActive,
    onToggleChallenge,
    className,
}) => {
    const metrics = useChallengeStatus(trades, settings);
    const [isOpen, setIsOpen] = useState(false);
    const [isCertificateOpen, setIsCertificateOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState<number>(ACCOUNT_SIZES[2]);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showFailedModal, setShowFailedModal] = useState(false);

    // Auto-show certificate on completion
    useEffect(() => {
        if (!metrics || !settings) return;
        if (metrics.status === 'COMPLETE') {
            const hasShown = localStorage.getItem(`certificate_shown_${settings.startDate}`);
            if (!hasShown) {
                setIsCertificateOpen(true);
                localStorage.setItem(`certificate_shown_${settings.startDate}`, 'true');
            }
        }
    }, [metrics, settings]);

    // Auto-show failed modal when challenge fails
    useEffect(() => {
        if (!metrics || !settings) return;
        if (metrics.status === 'FAILED') {
            const hasShown = localStorage.getItem(`failed_shown_${settings.startDate}`);
            if (!hasShown) {
                setShowFailedModal(true);
                localStorage.setItem(`failed_shown_${settings.startDate}`, 'true');
            }
        }
    }, [metrics, settings]);

    // ─── INACTIVE STATE: Compact Widget + Activation Modal ───
    if (!isChallengeActive || !metrics) {
        return (
            <div className={`${className}`}>
                {/* Compact Widget */}
                <button
                    onClick={() => setShowActivateModal(true)}
                    className="w-full text-left group"
                >
                    <div className="bg-tc-bg rounded-3xl border border-tc-border-light shadow-sm overflow-hidden hover:shadow-md hover:border-tc-gold/30 transition-all">
                        <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-tc-gold/20 to-tc-gold/5 border border-tc-gold/20 flex-shrink-0">
                                <TrophyIcon className="w-5 h-5 text-tc-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-tc-text uppercase tracking-wide group-hover:text-tc-gold transition-colors truncate">
                                    Cuenta de Fondeo 🏆
                                </h3>
                                <p className="text-xs text-tc-text-tertiary truncate">
                                    Inicia tu evaluación de fondeo simulada
                                </p>
                            </div>
                            <label
                                className="relative inline-flex items-center cursor-pointer flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={false}
                                    onChange={() => setShowActivateModal(true)}
                                />
                                <div className="w-10 h-5 bg-tc-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tc-growth-green"></div>
                            </label>
                        </div>
                    </div>
                </button>

                {/* Activation Modal */}
                {showActivateModal && (
                    <div
                        className="fixed inset-0 z-[100] animate-fade-in"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                        onClick={() => setShowActivateModal(false)}
                    >
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <div
                                className="bg-tc-bg w-full max-w-md rounded-3xl shadow-2xl border border-tc-border-light overflow-hidden animate-slide-up"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="px-5 pt-6 pb-4 text-center">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-tc-gold/20 to-tc-gold/5 border border-tc-gold/20 flex items-center justify-center">
                                        <TrophyIcon className="w-7 h-7 text-tc-gold" />
                                    </div>
                                    <h3 className="text-lg font-bold text-tc-text">Cuenta de Fondeo Simulada</h3>
                                    <p className="text-xs text-tc-text-tertiary mt-1">
                                        Simula una evaluación real estilo FTMO, MFF, etc.
                                    </p>
                                </div>

                                {/* Account Size Selector */}
                                <div className="px-5 pb-4">
                                    <p className="text-[10px] font-bold text-tc-text-secondary uppercase tracking-widest mb-2.5">
                                        Selecciona tu cuenta
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {ACCOUNT_SIZES.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`py-2.5 rounded-xl text-xs font-bold transition-all border text-center ${selectedSize === size
                                                    ? 'bg-tc-growth-green/15 text-tc-growth-green border-tc-growth-green/30 shadow-sm ring-1 ring-tc-growth-green/20'
                                                    : 'bg-tc-bg-secondary text-tc-text-secondary border-tc-border-light hover:border-tc-text-tertiary'
                                                    }`}
                                            >
                                                {formatCurrency(size)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Rules Summary */}
                                <div className="px-5 pb-4">
                                    <p className="text-[10px] font-bold text-tc-text-secondary uppercase tracking-widest mb-2.5">
                                        Reglas del desafío
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-tc-bg-secondary/50 rounded-xl py-2.5 px-1 border border-tc-border-light/50">
                                            <p className="text-[9px] text-tc-text-tertiary uppercase tracking-wider mb-0.5">Pérd. Diaria</p>
                                            <p className="text-sm font-bold text-tc-error font-data">{FUNDING_DEFAULTS.dailyLossLimitPct}%</p>
                                        </div>
                                        <div className="bg-tc-bg-secondary/50 rounded-xl py-2.5 px-1 border border-tc-border-light/50">
                                            <p className="text-[9px] text-tc-text-tertiary uppercase tracking-wider mb-0.5">Drawdown</p>
                                            <p className="text-sm font-bold text-tc-warning font-data">{FUNDING_DEFAULTS.maxTotalDrawdownPct}%</p>
                                        </div>
                                        <div className="bg-tc-bg-secondary/50 rounded-xl py-2.5 px-1 border border-tc-border-light/50">
                                            <p className="text-[9px] text-tc-text-tertiary uppercase tracking-wider mb-0.5">Profit</p>
                                            <p className="text-sm font-bold text-tc-growth-green font-data">{FUNDING_DEFAULTS.profitTargetPct}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="px-5 pb-5 flex gap-3">
                                    <button
                                        onClick={() => setShowActivateModal(false)}
                                        className="flex-1 py-3 rounded-2xl bg-tc-bg-secondary text-sm font-semibold text-tc-text border border-tc-border-light hover:bg-tc-bg-tertiary transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowActivateModal(false);
                                            onToggleChallenge(true, selectedSize);
                                        }}
                                        className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-tc-growth-green to-emerald-500 text-white text-sm font-bold shadow-lg shadow-tc-growth-green/20 hover:shadow-xl active:scale-[0.98] transition-all"
                                    >
                                        🚀 Iniciar — {formatCurrency(selectedSize)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── ACTIVE STATE: Live Challenge Widget ───
    const { status, daysActive } = metrics;

    const statusConfig = {
        PASSING: {
            color: 'text-tc-success',
            bgColor: 'bg-tc-success/10',
            borderColor: 'border-tc-success/20',
            icon: ShieldCheckIcon,
            label: 'En Curso',
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
            label: 'Fallido',
        },
        COMPLETE: {
            color: 'text-tc-growth-green',
            bgColor: 'bg-tc-growth-green/10',
            borderColor: 'border-tc-growth-green/20',
            icon: TrophyIcon,
            label: '¡Logrado!',
        },
    }[status];

    const formattedAccountSize = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(settings?.accountSize || 0);

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsOpen(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setIsOpen(true);
                }}
                className={`w-full text-left transition-all group focus:outline-none focus:ring-2 focus:ring-tc-growth-green/50 rounded-3xl cursor-pointer ${className}`}
            >
                <div className="bg-tc-bg rounded-3xl border border-tc-border-light shadow-sm overflow-hidden hover:shadow-md hover:border-tc-growth-green/30 transition-all">
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 ${status === 'FAILED' ? 'bg-tc-error/5' : 'bg-tc-bg-secondary/30 group-hover:bg-tc-bg-secondary/50 transition-colors'}`}>
                        {/* Top Row: Icon + Title + Toggle */}
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl flex-shrink-0 ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                                <statusConfig.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-tc-text uppercase tracking-wide group-hover:text-tc-growth-green transition-colors truncate">
                                    Desafío {formattedAccountSize} 🏆
                                </h3>
                                <p className="text-xs text-tc-text-secondary truncate">
                                    Día {daysActive} • {statusConfig.label}
                                </p>
                            </div>
                            {/* Toggle */}
                            <label
                                className="relative inline-flex items-center cursor-pointer flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={true}
                                    onChange={() => setShowDeactivateConfirm(true)}
                                />
                                <div className="w-10 h-5 bg-tc-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tc-growth-green"></div>
                            </label>
                        </div>

                        {/* Bottom Row: Action Buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-tc-border-light/50">
                            {status === 'COMPLETE' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCertificateOpen(true);
                                    }}
                                    className="flex-1 text-center bg-tc-gold/20 hover:bg-tc-gold/30 text-tc-gold px-3 py-2 rounded-xl border border-tc-gold/30 text-xs font-bold transition-all animate-pulse"
                                >
                                    🏅 Ver Certificado
                                </button>
                            )}
                            <div className={`${status === 'COMPLETE' ? 'flex-1' : 'w-full'} text-center bg-tc-bg-tertiary px-3 py-2 rounded-xl border border-tc-border-light text-xs font-semibold text-tc-text-secondary group-hover:text-tc-growth-green group-hover:border-tc-growth-green/30 transition-colors`}>
                                📊 Ver Estado
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isOpen && (
                <ChallengeDetailsModal metrics={metrics} onClose={() => setIsOpen(false)} />
            )}
            {isCertificateOpen && settings && (
                <FundingCertificateModal metrics={metrics} settings={settings} isOpen={isCertificateOpen} onClose={() => setIsCertificateOpen(false)} />
            )}

            {/* Deactivation Confirmation Modal */}
            {showDeactivateConfirm && (
                <div
                    className="fixed inset-0 z-[100] animate-fade-in"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                    onClick={() => setShowDeactivateConfirm(false)}
                >
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <div
                            className="bg-tc-bg w-full max-w-sm rounded-3xl shadow-2xl border border-tc-border-light overflow-hidden animate-slide-up"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Icon */}
                            <div className="pt-6 pb-2 flex justify-center">
                                <div className="w-14 h-14 rounded-2xl bg-tc-error/10 border border-tc-error/20 flex items-center justify-center">
                                    <ExclamationTriangleIcon className="w-7 h-7 text-tc-error" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-4 text-center">
                                <h3 className="text-base font-bold text-tc-text mb-1">¿Abandonar el desafío?</h3>
                                <p className="text-sm text-tc-text-secondary leading-relaxed">
                                    Se perderá todo el progreso actual de tu cuenta de fondeo simulada.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="px-5 pb-5 flex gap-3">
                                <button
                                    onClick={() => setShowDeactivateConfirm(false)}
                                    className="flex-1 py-2.5 rounded-2xl bg-tc-bg-secondary text-sm font-semibold text-tc-text border border-tc-border-light hover:bg-tc-bg-tertiary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeactivateConfirm(false);
                                        onToggleChallenge(false);
                                    }}
                                    className="flex-1 py-2.5 rounded-2xl bg-tc-error text-sm font-bold text-white hover:bg-tc-error/90 transition-colors shadow-md shadow-tc-error/20"
                                >
                                    Abandonar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Challenge Failed Modal */}
            {showFailedModal && settings && (
                <ChallengeFailedModal
                    metrics={metrics}
                    accountSize={settings.accountSize}
                    onClose={() => setShowFailedModal(false)}
                    onRestart={() => {
                        setShowFailedModal(false);
                        onToggleChallenge(false);
                        setTimeout(() => setShowActivateModal(true), 150);
                    }}
                />
            )}
        </>
    );
};

export default ChallengeDashboard;
