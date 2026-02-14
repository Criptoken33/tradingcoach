import React, { useState, useEffect } from 'react';
import { useChallengeStatus } from '../hooks/useChallengeStatus';
import { Trade, ChallengeSettings, ChallengeStatus } from '../types';
import { ShieldCheckIcon, ExclamationTriangleIcon, TrophyIcon, ChartBarIcon } from './icons';
import ChallengeDetailsModal from './ChallengeDetailsModal';
import FundingCertificateModal from './FundingCertificateModal';

interface ChallengeDashboardProps {
    trades: Trade[];
    settings?: ChallengeSettings;
    className?: string;
}

const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({ trades, settings, className }) => {
    const metrics = useChallengeStatus(trades, settings);
    const [isOpen, setIsOpen] = useState(false);
    const [isCertificateOpen, setIsCertificateOpen] = useState(false);

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

    if (!metrics) return null;

    const { status, daysActive } = metrics;

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
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsOpen(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setIsOpen(true);
                    }
                }}
                className={`w-full text-left transition-all group focus:outline-none focus:ring-2 focus:ring-tc-growth-green/50 rounded-3xl cursor-pointer ${className}`}
            >
                <div className="bg-tc-bg rounded-3xl border border-tc-border-light shadow-sm overflow-hidden hover:shadow-md hover:border-tc-growth-green/30 transition-all">
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 ${status === 'FAILED' ? 'bg-tc-error/5' : 'bg-tc-bg-secondary/30 group-hover:bg-tc-bg-secondary/50 transition-colors'}`}>
                        {/* Top Row: Icon + Title + Status Pill */}
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl flex-shrink-0 ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                                <statusConfig.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-tc-text uppercase tracking-wide group-hover:text-tc-growth-green transition-colors truncate">
                                    Modo Desafío 🏆
                                </h3>
                                <p className="text-xs text-tc-text-secondary truncate">
                                    Día {daysActive} • {statusConfig.label}
                                </p>
                            </div>
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
        </>
    );
};

export default ChallengeDashboard;
