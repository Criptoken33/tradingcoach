import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Hook para manejar el botón "Atrás" nativo de Android
 * @param onBackButton - Función que se ejecuta cuando se presiona el botón atrás
 * @param enabled - Si el listener está habilitado (por defecto true)
 */
export const useAndroidBackButton = (
    onBackButton: () => boolean | void,
    enabled: boolean = true
) => {
    useEffect(() => {
        // Solo funciona en Android
        if (Capacitor.getPlatform() !== 'android' || !enabled) {
            return;
        }

        const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            // Ejecutar el callback personalizado
            const shouldPreventDefault = onBackButton();

            // Si el callback retorna false o undefined, y no hay historial web,
            // minimizar la app en lugar de cerrarla
            if (shouldPreventDefault !== true && !canGoBack) {
                CapacitorApp.minimizeApp();
            }
        });

        // Cleanup: remover el listener cuando el componente se desmonte
        return () => {
            backButtonListener.then(listener => listener.remove());
        };
    }, [onBackButton, enabled]);
};
