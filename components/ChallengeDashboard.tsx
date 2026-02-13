import React, { useState } from 'react';
import { useChallengeStatus } from '../hooks/useChallengeStatus';
import { Trade, ChallengeSettings, ChallengeStatus } from '../types';
import { ShieldCheckIcon, ExclamationTriangleIcon, TrophyIcon, ChartBarIcon } from './icons';
import ChallengeDetailsModal from './ChallengeDetailsModal';

interface ChallengeDashboardProps {
    trades: Trade[];
    settings?: ChallengeSettings;
    className?: string;
}

const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({ trades, settings, className }) => {
    const metrics = useChallengeStatus(trades, settings);
    const [isOpen, setIsOpen] = useState(false);

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
            <button
                onClick={() => setIsOpen(true)}
                className={`w-full text-left transition-all group focus:outline-none focus:ring-2 focus:ring-tc-growth-green/50 rounded-3xl ${className}`}
            >
                <div className={`bg-tc-bg rounded-3xl border border-tc-border-light shadow-sm overflow-hidden hover:shadow-md hover:border-tc-growth-green/30 transition-all`}>
                    {/* Header Summary */}
                    <div className={`px-6 py-4 flex items-center justify-between ${status === 'FAILED' ? 'bg-tc-error/5' : 'bg-tc-bg-secondary/30 group-hover:bg-tc-bg-secondary/50 transition-colors'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                                <statusConfig.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-tc-text uppercase tracking-wide group-hover:text-tc-growth-green transition-colors">Modo Desafío 🏆</h3>
                                <p className="text-xs text-tc-text-secondary">Día {daysActive} • {statusConfig.label}</p>
                            </div>
                        </div>

                        <div className="bg-tc-bg-tertiary px-3 py-1.5 rounded-xl border border-tc-border-light text-xs font-semibold text-tc-text-secondary group-hover:text-tc-growth-green group-hover:border-tc-growth-green/30 transition-colors">
                            Ver Estado
                        </div>
                    </div>
                </div>
            </button>

            {isOpen && (
                <ChallengeDetailsModal metrics={metrics} onClose={() => setIsOpen(false)} />
            )}
        </>
    );
};

export default ChallengeDashboard;
