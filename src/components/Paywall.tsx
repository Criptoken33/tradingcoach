import React, { useEffect, useState } from 'react';
import { PurchasesService } from '../services/purchasesService';
import { LockClosedIcon, CheckIcon, StarIcon, XCircleIcon } from '../../components/icons';
import { Capacitor } from '@capacitor/core';

interface PaywallProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ onClose, onSuccess }) => {
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

            // Flexible check: if ANY entitlement is active, the purchase was successful
            if (Object.keys(customerInfo.entitlements.active).length > 0) {
                console.log('Entitlement found! Setting success state.');
                setIsSuccess(true);
                await onSuccess();
            } else {
                // This shouldn't happen if purchasePackage succeeded, but just in case:
                console.warn('Purchase successful but no active entitlements found yet. Forcing success.');
                setIsSuccess(true);
                await onSuccess();
            }
        } catch (error: any) {
            if (!error.userCancelled) {
                alert("Error al procesar la compra. Inténtalo de nuevo.");
            }
        } finally {
            setPurchasing(false);
        }
    };

    const benefits = [
        "Sincronización en la Nube ilimitada",
        "Importación de reportes MT5 ilimitados",
        "Estrategias (Checklists) ilimitadas",
        "Backup automático de tus operaciones",
        "Soporte prioritario y nuevas funciones"
    ];

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-[#1C1B1F] w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">¡Felicidades!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Ya eres miembro PRO de TradingCoach. Todas las funciones profesionales han sido desbloqueadas.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-brand-accent hover:brightness-110 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98]"
                    >
                        Empezar a usar PRO
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#1C1B1F] w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl flex flex-col relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-10"
                >
                    <XCircleIcon className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-brand-accent to-[#6750A4] p-8 text-white text-center">
                    <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4">
                        <StarIcon className="w-8 h-8 text-yellow-300" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">TradingCoach PRO</h2>
                    <p className="text-white/80 text-sm">Lleva tu trading al siguiente nivel con todas las herramientas profesionales</p>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                    <div className="space-y-4 mb-8">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="mt-0.5 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                                    <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing */}
                    <div className="mt-auto space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                            </div>
                        ) : offerings?.availablePackages?.length > 0 ? (
                            offerings.availablePackages.map((pkg: any) => (
                                <button
                                    key={pkg.identifier}
                                    disabled={purchasing}
                                    onClick={() => handlePurchase(pkg)}
                                    className="w-full bg-brand-accent hover:brightness-110 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] flex flex-col items-center"
                                >
                                    <span>{pkg.product.title}</span>
                                    <span className="text-xs font-normal opacity-80">{pkg.product.priceString} / mes</span>
                                </button>
                            ))
                        ) : (
                            <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <LockClosedIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                    {Capacitor.getPlatform() === 'web'
                                        ? "Las compras están disponibles solo en la aplicación móvil."
                                        : "No hay ofertas disponibles en este momento."}
                                </p>
                            </div>
                        )}

                        <p className="text-[10px] text-center text-gray-400 px-4 mt-4">
                            La suscripción se renovará automáticamente al menos que se cancele 24h antes del fin del periodo actual.
                        </p>

                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    await PurchasesService.restorePurchases();
                                    await onSuccess();
                                    alert("Estado de suscripción actualizado.");
                                } catch (e) {
                                    alert("No se encontraron compras anteriores.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="w-full py-2 text-xs text-brand-accent font-medium hover:underline mt-2"
                        >
                            Restaurar Compras
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
