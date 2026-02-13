import React, { useState, useEffect, useMemo } from 'react';
import { PauseCircleIcon, ShieldAlertIcon } from './icons';
import { getRandomTip } from './Philosophy';

interface ReflectionModalProps {
    cooldownUntil: number;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({ cooldownUntil }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const tip = useMemo(() => getRandomTip(), []);

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

    return (
        <div className="fixed inset-0 z-[100] bg-tc-bg/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="w-full max-w-xl max-h-[95vh] bg-tc-bg rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-tc-border-light overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">

                {/* Progress Bar (Visual indicator of cooldown) */}
                <div className="h-1.5 w-full bg-tc-bg-secondary overflow-hidden flex-shrink-0">
                    <div
                        className="h-full bg-tc-warning transition-all duration-1000 ease-linear"
                        style={{
                            width: `${Math.max(0, Math.min(100, (1 - (cooldownUntil - Date.now()) / (15 * 60 * 1000)) * 100))}%`
                        }}
                    />
                </div>

                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-10 px-6 sm:p-12 flex flex-col items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-tc-warning/10 rounded-full flex items-center justify-center mb-6 sm:mb-8 animate-pulse shrink-0">
                        <PauseCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-tc-warning" />
                    </div>

                    <h2 className="text-xl sm:text-3xl font-semibold text-tc-text mb-2 tracking-tight text-center">Periodo de Reflexión</h2>
                    <p className="text-tc-text-secondary mb-8 sm:mb-10 text-sm sm:text-base font-medium max-w-sm mx-auto text-center leading-relaxed">
                        La disciplina es el puente entre las metas y el logro. Usa este tiempo para recalibrar.
                    </p>

                    <div className="bg-tc-bg-secondary/50 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 w-full border border-tc-border-light mb-8 sm:mb-10 shrink-0">
                        <span className="text-[10px] font-bold text-tc-text-secondary uppercase tracking-[0.2em] mb-4 block text-center">Tiempo Restante</span>
                        <div className="text-5xl sm:text-7xl font-data font-bold text-tc-text tracking-tighter text-center">
                            {timeLeft}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 w-full text-left">
                        <div className="p-5 sm:p-6 bg-tc-warning/5 border border-tc-warning/10 rounded-2xl flex gap-3 sm:gap-4 items-start">
                            <ShieldAlertIcon className="w-5 h-5 sm:w-6 sm:h-6 text-tc-warning flex-shrink-0" />
                            <div>
                                <h4 className="text-[10px] sm:text-sm font-bold text-tc-warning uppercase tracking-wider mb-1">Pausa de Seguridad</h4>
                                <p className="text-xs sm:text-sm text-tc-text-secondary leading-relaxed font-medium">
                                    Has tenido una pérdida. El sistema ha bloqueado las entradas para evitar el trading por venganza.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6 bg-tc-growth-green/5 border border-tc-growth-green/10 rounded-2xl flex gap-3 sm:gap-4 items-start">
                            <tip.icon className="w-5 h-5 sm:w-6 sm:h-6 text-tc-growth-green flex-shrink-0" />
                            <div>
                                <h4 className="text-[10px] sm:text-sm font-bold text-tc-growth-green uppercase tracking-wider mb-1">{tip.title}</h4>
                                <p className="text-xs sm:text-sm text-tc-text-secondary leading-relaxed font-medium">
                                    {tip.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-8 sm:mt-12 text-[10px] text-tc-text-secondary/50 uppercase tracking-widest font-bold text-center pb-[safe-area-inset-bottom]">
                        Trading Coach · Profesionalismo ante todo
                    </p>
                </div>
            </div>
        </div>
    );
};
