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
        <div className="min-h-screen bg-gradient-to-br from-[#388656] via-[#2f7550] to-[#2d6b45] flex items-center justify-center p-4">
            <div className="glassmorphism-card-strong rounded-[32px] p-8 max-w-md w-full animate-[fade-in-up_0.6s_cubic-bezier(0.05,0.7,0.1,1.0)]">
                <div className="text-center mb-10">
                    <h1
                        className="text-5xl font-bold text-white tracking-wide mb-3"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                        TradingCoach
                    </h1>
                    <p className="text-lg text-white/80 font-medium">
                        Inicia sesión para continuar
                    </p>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="
                        w-full bg-white text-gray-900 font-semibold py-4 px-6 
                        rounded-2xl flex items-center justify-center gap-3 
                        hover:bg-gray-50 hover:shadow-xl
                        active:scale-[0.98]
                        transition-all duration-200
                        disabled:opacity-60 disabled:cursor-not-allowed
                        shadow-lg
                        min-h-[56px]
                    "
                >
                    {loading ? (
                        <div className="w-5 h-5 rounded-full border-[2.5px] border-gray-300 border-t-gray-800 animate-spin" />
                    ) : (
                        <GoogleIcon className="w-5 h-5" />
                    )}
                    <span className="text-base">{loading ? 'Conectando...' : 'Continuar con Google'}</span>
                </button>

                <p className="mt-8 text-center text-sm text-white/60 leading-relaxed">
                    Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
                </p>
            </div>
        </div>
    );
}

