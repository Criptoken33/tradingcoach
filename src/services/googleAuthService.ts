import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import {
    auth,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithPopup
} from './firebase';

// Inicializar Google Auth para web
if (Capacitor.getPlatform() === 'web') {
    GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
    });
}

export const googleAuthService = {
    async signInWithGoogle() {
        try {
            const platform = Capacitor.getPlatform();

            if (platform === 'web') {
                // Web: usar popup de Firebase
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                return result.user;
            } else {
                // Android: usar plugin de Capacitor
                const googleUser = await GoogleAuth.signIn();

                if (!googleUser.authentication?.idToken) {
                    throw new Error('No se pudo obtener el token de Google');
                }

                const credential = GoogleAuthProvider.credential(
                    googleUser.authentication.idToken
                );

                const result = await signInWithCredential(auth, credential);
                return result.user;
            }
        } catch (error: any) {
            console.error('Error en Google Sign-In:', error);

            // Manejo de errores específicos
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Inicio de sesión cancelado');
            } else if (error.code === 'auth/network-request-failed') {
                throw new Error('Error de red. Verifica tu conexión a internet');
            }

            throw new Error('Error al iniciar sesión con Google');
        }
    },

    async signOut() {
        try {
            await auth.signOut();

            const platform = Capacitor.getPlatform();
            if (platform !== 'web') {
                await GoogleAuth.signOut();
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            throw new Error('Error al cerrar sesión');
        }
    },

    async refreshToken() {
        try {
            const platform = Capacitor.getPlatform();

            if (platform !== 'web') {
                await GoogleAuth.refresh();
            }
        } catch (error) {
            console.error('Error al refrescar token:', error);
        }
    }
};
