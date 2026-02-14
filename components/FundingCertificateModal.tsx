import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChallengeMetrics, ChallengeSettings } from '../types';
import { XMarkIcon, AwardIcon, CheckCircleIcon, DownloadIcon, ShareIcon } from './icons';
import { useAuth } from '../src/context/AuthContext';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface FundingCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    metrics: ChallengeMetrics;
    settings: ChallengeSettings;
}

const FundingCertificateModal: React.FC<FundingCertificateModalProps> = ({ isOpen, onClose, metrics, settings }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const certificateRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const traderName = user?.displayName || 'Trader';

    const formattedProfit = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.netProfit);
    const formattedAccountSize = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(settings.accountSize);
    const formattedDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date());

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setTimeout(() => {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#B8860B', '#DAA520', '#FFD700', '#FFFACD'], zIndex: 200 });
                setTimeout(() => {
                    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#B8860B', '#DAA520', '#FFD700'], zIndex: 200 });
                    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#B8860B', '#DAA520', '#FFD700'], zIndex: 200 });
                }, 300);
            }, 200);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleDownload = useCallback(async () => {
        if (!certificateRef.current) return;
        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                backgroundColor: '#FFFDF7',
                useCORS: true,
                ignoreElements: (el) => el.hasAttribute('data-no-export'),
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('TradingCoach_Certificado.pdf');
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
    }, []);

    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '¡Certificado de Fondeo!',
                    text: `🏆 He completado exitosamente mi evaluación de fondeo en TradingCoach.\n💰 Beneficio neto: ${formattedProfit}\n📊 Cuenta: ${formattedAccountSize}`,
                });
            } catch { /* user cancelled */ }
        } else {
            try {
                await navigator.clipboard.writeText(
                    `🏆 He completado exitosamente mi evaluación de fondeo en TradingCoach.\n💰 Beneficio neto: ${formattedProfit}\n📊 Cuenta: ${formattedAccountSize}`
                );
                alert('¡Texto copiado al portapapeles!');
            } catch { /* fallback */ }
        }
    }, [formattedProfit, formattedAccountSize]);

    if (!shouldRender) return null;

    return (
        /* ===== FULLSCREEN OVERLAY — scrollable, safe-area aware ===== */
        <div
            className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            onClick={onClose}
        >
            {/* Scrollable container for small viewports */}
            <div
                className="w-full h-full overflow-y-auto overscroll-contain flex flex-col items-center"
                style={{
                    paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
                    paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
                    paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
                    paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
                }}
            >
                {/* Spacer to vertically center on tall screens */}
                <div className="flex-1 min-h-[0.5rem]" />

                {/* ===== CERTIFICATE CARD ===== */}
                <div
                    ref={certificateRef}
                    className={`w-full max-w-[26rem] flex-shrink-0 transform transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'linear-gradient(180deg, #FFFDF7 0%, #FFF8E7 100%)',
                        borderRadius: '1.25rem',
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(218,165,32,0.3)',
                    }}
                >
                    {/* Gold Top Border */}
                    <div style={{ height: '4px', background: 'linear-gradient(90deg, #B8860B, #FFD700, #B8860B)' }} />

                    {/* Inner Border Frame — responsive padding */}
                    <div
                        style={{
                            margin: 'clamp(8px, 2.5vw, 12px)',
                            border: '2px solid #DAA520',
                            borderRadius: '0.75rem',
                            padding: 'clamp(1.25rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem)',
                        }}
                    >
                        {/* Badge */}
                        <div className="flex justify-center mb-3 sm:mb-4">
                            <div
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                                    boxShadow: '0 4px 20px rgba(218,165,32,0.4)',
                                }}
                            >
                                <AwardIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <p
                            className="text-center font-bold uppercase mb-1"
                            style={{ fontSize: 'clamp(0.55rem, 1.8vw, 0.65rem)', color: '#B8860B', letterSpacing: '0.25em' }}
                        >
                            Trading Coach
                        </p>
                        <h1
                            className="text-center font-serif font-bold mb-1"
                            style={{ fontSize: 'clamp(1.35rem, 5vw, 1.75rem)', color: '#1A1A1A', lineHeight: 1.2 }}
                        >
                            Certificado de Fondeo
                        </h1>

                        {/* Divider */}
                        <div className="flex items-center justify-center gap-3 my-3 sm:my-4">
                            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #DAA520)' }} />
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#DAA520' }} />
                            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #DAA520, transparent)' }} />
                        </div>

                        {/* Trader Name */}
                        <p
                            className="text-center font-serif font-bold italic"
                            style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', color: '#2D2D2D', marginBottom: '0.25rem' }}
                        >
                            {traderName}
                        </p>

                        {/* Description */}
                        <p
                            className="text-center mx-auto mb-4 sm:mb-6"
                            style={{ fontSize: 'clamp(0.7rem, 2.2vw, 0.8rem)', color: '#555', maxWidth: '280px', lineHeight: 1.6 }}
                        >
                            Ha completado exitosamente la simulación de evaluación de fondeo, demostrando <strong style={{ color: '#333' }}>consistencia y disciplina</strong>.
                        </p>

                        {/* Metrics Grid */}
                        <div
                            className="grid grid-cols-3 gap-1 sm:gap-2 mb-4 sm:mb-6"
                            style={{ backgroundColor: '#FFF9ED', borderRadius: '0.75rem', padding: 'clamp(0.6rem, 2vw, 1rem)', border: '1px solid #EDE0C8' }}
                        >
                            <div className="text-center">
                                <p style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.6rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Cuenta</p>
                                <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', fontWeight: 700, color: '#1A1A1A' }}>{formattedAccountSize}</p>
                            </div>
                            <div className="text-center" style={{ borderLeft: '1px solid #EDE0C8', borderRight: '1px solid #EDE0C8' }}>
                                <p style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.6rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Beneficio</p>
                                <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', fontWeight: 700, color: '#16A34A' }}>+{formattedProfit}</p>
                            </div>
                            <div className="text-center">
                                <p style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.6rem)', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Días</p>
                                <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', fontWeight: 700, color: '#1A1A1A' }}>{metrics.daysActive}</p>
                            </div>
                        </div>

                        {/* Date */}
                        <p className="text-center" style={{ fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)', color: '#999', marginBottom: '2px' }}>Fecha de Certificación</p>
                        <p className="text-center font-semibold" style={{ fontSize: 'clamp(0.75rem, 2.2vw, 0.85rem)', color: '#333', marginBottom: '0.75rem' }}>{formattedDate}</p>

                        {/* Status Badge */}
                        <div className="flex justify-center">
                            <div
                                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full"
                                style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#16A34A' }}
                            >
                                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span style={{ fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', fontWeight: 600 }}>Objetivos Cumplidos</span>
                            </div>
                        </div>
                    </div>

                    {/* Gold Bottom Border */}
                    <div style={{ height: '4px', background: 'linear-gradient(90deg, #B8860B, #FFD700, #B8860B)' }} />
                </div>

                {/* ===== ACTION BUTTONS ===== */}
                <div
                    data-no-export
                    className={`flex justify-center gap-3 w-full max-w-[26rem] mt-4 flex-shrink-0 transition-all duration-500 delay-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
                        style={{ backgroundColor: '#DAA520', color: '#1A1A1A' }}
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Descargar PDF
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleShare(); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
                        style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
                    >
                        <ShareIcon className="w-5 h-5" />
                        Compartir
                    </button>
                </div>

                {/* Spacer to vertically center on tall screens */}
                <div className="flex-1 min-h-[0.5rem]" />
            </div>

            {/* Close Button — safe-area aware */}
            <button
                data-no-export
                onClick={onClose}
                className="fixed z-[110] p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                style={{
                    top: 'max(0.75rem, env(safe-area-inset-top, 0px))',
                    right: 'max(0.75rem, env(safe-area-inset-right, 0px))',
                }}
            >
                <XMarkIcon className="w-6 h-6 text-white" />
            </button>
        </div>
    );
};

export default FundingCertificateModal;
