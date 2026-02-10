import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from '../../components/icons';

const LoginScreen: React.FC = () => {
    const { signInWithGoogle, loading } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-brand-dark p-6 text-brand-text">
            <div className="w-full max-w-md space-y-8 animate-fade-in">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-brand-accent mb-2">Trading Coach</h1>
                    <p className="text-brand-text-secondary">Tu camino a la rentabilidad.</p>
                </div>

                <div className="bg-brand-light p-8 rounded-3xl shadow-xl border border-brand-border-secondary/30">
                    <h2 className="text-2xl font-bold mb-6 text-center">Inicia Sesión</h2>

                    <button
                        onClick={signInWithGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-100 font-bold py-3 px-4 rounded-xl transition-all shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
                        ) : (
                            <GoogleIcon className="w-6 h-6" />
                        )}
                        <span>Continuar con Google</span>
                    </button>

                    <p className="mt-6 text-center text-xs text-brand-text-secondary">
                        Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
