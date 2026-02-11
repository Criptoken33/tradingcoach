import React, { useEffect, useState } from 'react';
import { PurchasesService } from '../services/purchasesService';
import { LockClosedIcon, CheckIcon, StarIcon, XCircleIcon } from '../../components/icons';
import { Capacitor } from '@capacitor/core';
import { useFeedback } from '../context/FeedbackContext';
import { useProFeatures } from '../hooks/useProFeatures';

interface PaywallProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ onClose, onSuccess }) => {
    const { isPro } = useProFeatures();
    const { showToast } = useFeedback();
    const [offerings, setOfferings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const fetchOfferings = async () => {
            if (Capacitor.getPlatform() === 'web') {
                setLoading(false);
                return;
            }
            try {
                const res = await PurchasesService.getOfferings();
                if (res && res.current) {
                    setOfferings(res.current);
                }
            } catch (error) {
                console.error("Error fetching offerings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOfferings();
    }, []);

    const handlePurchase = async (pkg: any) => {
        setPurchasing(true);
        try {
            console.log('Starting purchase for:', pkg.product.identifier);
            const result = await PurchasesService.purchasePackage(pkg);
            const customerInfo = result.customerInfo;

            console.log('Purchase result customerInfo:', JSON.stringify(customerInfo.entitlements.active));

            if (Object.keys(customerInfo.entitlements.active).length > 0) {
                setIsSuccess(true);
                await onSuccess();
            } else {
                console.warn('Purchase successful but no active entitlements found yet. Forcing success.');
                setIsSuccess(true);
                await onSuccess();
            }
        } catch (error: any) {
            if (!error.userCancelled) {
                showToast('Error al procesar la compra. Inténtalo de nuevo.', 'error');
            }
        } finally {
            setPurchasing(false);
        }
    };

    const benefits = [
        {
            title: "Tu Trading, en Cualquier Lugar",
            desc: "Opera en casa, analiza en el móvil. Tus datos te siguen, no al revés."
        },
        {
            title: "La Verdad sobre tu Rentabilidad",
            desc: "Audita tu cuenta de MT5 en segundos. Encuentra tus fallos antes de que te cuesten la cuenta."
        },
        {
            title: "Nunca más entres por impulso",
            desc: "Crea protocolos blindados para cada escenario. Elimina el trading emocional para siempre."
        },
        {
            title: "Protege tu Capital",
            desc: "Copias de seguridad automáticas. Porque un fallo del dispositivo no debería borrar tu progreso."
        }
    ];

    if (isSuccess) {
        return (
            <div className={`fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 ${!isPro ? 'pt-[60px]' : ''}`}>
                <div className="bg-white dark:bg-[#1C1B1F] w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">¡Decisión Inteligente!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                        Te has unido al 10% de traders que invierten en su negocio. Vamos a hacer historia.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-brand-accent hover:brightness-110 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                    >
                        Empezar a Operar como PRO
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 ${!isPro ? 'pt-[60px]' : ''}`}>
            <div className="bg-white dark:bg-[#1C1B1F] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-colors z-10 backdrop-blur-sm"
                >
                    <XCircleIcon className="w-6 h-6 text-white/80" />
                </button>

                {/* Header Section */}
                <div className="bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#D4AF37] p-8 pb-14 text-black text-center relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="inline-flex p-3 bg-white/30 backdrop-blur-md rounded-2xl mb-4 shadow-sm ring-1 ring-white/50">
                            <StarIcon className="w-8 h-8 text-black" />
                        </div>
                        <h2 className="text-3xl font-extrabold mb-3 tracking-tight">Deja de Operar a Ciegas</h2>
                        <p className="text-black font-semibold text-base leading-snug max-w-xs mx-auto drop-shadow-sm">
                            El 90% pierde dinero por falta de datos. <br />Únete al 10% que opera con ventaja.
                        </p>
                    </div>
                </div>

                {/* Content Scrollable */}
                <div className="p-6 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-5 mb-8">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="mt-1 flex-shrink-0 w-8 h-8 bg-brand-accent/10 rounded-xl flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-colors duration-300">
                                    <CheckIcon className="w-5 h-5 text-brand-accent group-hover:text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-base">{benefit.title}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug mt-0.5">{benefit.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Section */}
                    <div className="mt-auto space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-accent border-t-transparent"></div>
                            </div>
                        ) : offerings?.availablePackages?.length > 0 ? (
                            <div className="space-y-3">
                                {offerings.availablePackages
                                    .slice()
                                    .sort((a: any, b: any) => {
                                        const isAnnualA = a.packageType === 'ANNUAL' || a.packageType === 3 || a.product.identifier.toLowerCase().includes('annual') || a.product.identifier.toLowerCase().includes('year');
                                        const isAnnualB = b.packageType === 'ANNUAL' || b.packageType === 3 || b.product.identifier.toLowerCase().includes('annual') || b.product.identifier.toLowerCase().includes('year');
                                        if (isAnnualA && !isAnnualB) return -1;
                                        if (!isAnnualA && isAnnualB) return 1;
                                        return 0;
                                    })
                                    .map((pkg: any) => {
                                        const isAnnual = pkg.packageType === 'ANNUAL' ||
                                            pkg.packageType === 3 ||
                                            pkg.product.identifier.toLowerCase().includes('year') ||
                                            pkg.product.identifier.toLowerCase().includes('annual');

                                        return (
                                            <button
                                                key={pkg.identifier}
                                                disabled={purchasing}
                                                onClick={() => handlePurchase(pkg)}
                                                className={`
                                                w-full relative overflow-hidden font-bold py-4 px-6 rounded-2xl transition-all shadow-md active:scale-[0.98] flex items-center justify-between group
                                                ${isAnnual
                                                        ? 'bg-brand-accent text-white hover:brightness-110 ring-4 ring-brand-accent/20'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    }
                                            `}
                                            >
                                                {isAnnual && (
                                                    <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[10px] font-extrabold px-3 py-1 rounded-bl-xl shadow-sm">
                                                        MEJOR OPCIÓN
                                                    </div>
                                                )}
                                                <div className="flex flex-col items-start">
                                                    <span className={`text-base ${isAnnual ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{pkg.product.title}</span>
                                                    {isAnnual && <span className="text-[10px] font-normal bg-white/20 px-2 py-0.5 rounded text-white mt-1">Ahorras 2 meses</span>}
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xl">{pkg.product.priceString}</span>
                                                    <span className={`text-xs font-normal ${isAnnual ? 'text-white/80' : 'text-gray-500'}`}>
                                                        /{isAnnual ? 'año' : 'mes'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <LockClosedIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm text-gray-500 font-medium">
                                    {Capacitor.getPlatform() === 'web' ? (
                                        <span className="block">
                                            Para desbloquear PRO:<br />
                                            1. Abre TradingCoach en tu móvil.<br />
                                            2. Compra tu plan.<br />
                                            3. Vuelve aquí y actualiza.
                                        </span>
                                    ) : "No hay ofertas disponibles en este momento."}
                                </p>
                            </div>
                        )}

                        <div className="text-center space-y-2 pt-2">
                            <p className="text-xs text-center text-gray-400 italic">
                                "¿Cuánto te costó tu último Stop Loss innecesario?<br />Probablemente más que esta suscripción."
                            </p>

                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await PurchasesService.restorePurchases();
                                        await onSuccess();
                                        showToast('Estado de suscripción actualizado.', 'success');
                                    } catch (e) {
                                        showToast('No se encontraron compras anteriores.', 'warning');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="text-[11px] uppercase tracking-wider text-gray-400 hover:text-brand-accent transition-colors font-semibold"
                            >
                                Restaurar Compras
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
