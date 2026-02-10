import React, { useEffect, useState } from 'react';
import { VersionService, VersionInfo } from '../services/versionService';
import { Cog6ToothIcon, XCircleIcon } from '../../components/icons';
import { Capacitor } from '@capacitor/core';

export const UpdateManager: React.FC = () => {
    const [info, setInfo] = useState<VersionInfo | null>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const check = async () => {
            // Only check on Android for now, or adapt for iOS later
            if (Capacitor.getPlatform() !== 'android') return;

            const versionInfo = await VersionService.checkVersion();
            if (versionInfo.isUpdateAvailable || versionInfo.isUpdateRequired) {
                setInfo(versionInfo);
                setShow(true);
            }
        };
        check();
    }, []);

    const handleUpdate = () => {
        if (info?.updateUrl) {
            window.open(info.updateUrl, '_blank');
        }
    };

    if (!show || !info) return null;

    // Hard update cannot be closed
    const canClose = !info.isUpdateRequired;

    return (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-[#1C1B1F] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col p-8 text-center animate-in zoom-in-95 duration-500">

                <div className="w-16 h-16 bg-brand-accent/10 dark:bg-brand-accent/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Cog6ToothIcon className="w-8 h-8 text-brand-accent animate-spin-slow" />
                </div>

                <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                    {info.isUpdateRequired ? 'Actualización Necesaria' : 'Actualización Disponible'}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    {info.isUpdateRequired
                        ? 'Para continuar usando TradingCoach de forma segura y estable, debes actualizar a la última versión (v' + info.latestVersion + ').'
                        : 'Hay una nueva versión de TradingCoach disponible (v' + info.latestVersion + ') con mejoras y correcciones importantes.'
                    }
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleUpdate}
                        className="w-full bg-brand-accent hover:brightness-110 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98]"
                    >
                        Actualizar Ahora
                    </button>

                    {canClose && (
                        <button
                            onClick={() => setShow(false)}
                            className="w-full py-4 text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            Más tarde
                        </button>
                    )}
                </div>

                {!canClose && (
                    <p className="text-[10px] text-gray-400 mt-6">
                        Esta actualización es crítica para el funcionamiento del sistema.
                    </p>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}} />
        </div>
    );
};
