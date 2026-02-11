import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { GoogleIcon } from '../../components/icons';

export function AuthScreen() {
    const { signInWithGoogle } = useAuth();
    const { showToast } = useFeedback();
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            showToast(err.message || 'Error al iniciar sesión', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-md-surface flex items-center justify-center p-4">
            <div className="bg-md-surface-container-high rounded-[28px] p-8 max-w-md w-full shadow-md-elevation-3 border border-md-outline-variant/30 animate-[dialog-in_0.4s_cubic-bezier(0.05,0.7,0.1,1.0)]">
                <div className="text-center mb-8">
                    <h1 className="headline-medium text-md-on-surface font-semibold mb-2">Trading Coach</h1>
                    <p className="body-medium text-md-on-surface-variant">Inicia sesión para continuar</p>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="
                        w-full bg-white text-gray-900 font-semibold py-3.5 px-6 
                        rounded-xl flex items-center justify-center gap-3 
                        hover:bg-gray-50 active:scale-[0.98]
                        transition-all duration-200
                        disabled:opacity-60 disabled:cursor-not-allowed
                        shadow-md-elevation-1
                        min-h-[48px]
                    "
                >
                    {loading ? (
                        <div className="w-5 h-5 rounded-full border-[2.5px] border-gray-300 border-t-gray-800 animate-spin" />
                    ) : (
                        <GoogleIcon className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
                </button>

                <p className="mt-6 text-center text-xs text-md-on-surface-variant/60">
                    Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
                </p>
            </div>
        </div>
    );
}

