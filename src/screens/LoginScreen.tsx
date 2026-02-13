import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from '../../components/icons';

const LoginScreen: React.FC = () => {
    const { signInWithGoogle, loading } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-tc-bg p-6 text-tc-text">
            <div className="w-full max-w-md space-y-10 animate-fade-in">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-tc-growth-green mb-3 tracking-tight">Trading Coach</h1>
                    <p className="text-tc-text-secondary text-base font-medium">Tu camino a la rentabilidad profesional.</p>
                </div>

                <div className="bg-tc-bg-secondary/50 p-8 rounded-[2rem] shadow-sm border border-tc-border-light backdrop-blur-sm">
                    <h2 className="text-lg font-semibold mb-8 text-center uppercase tracking-widest text-tc-text-secondary">Inicia Sesión</h2>

                    <button
                        onClick={signInWithGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-50 font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm border border-gray-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-tc-growth-green"></div>
                        ) : (
                            <GoogleIcon className="w-5 h-5" />
                        )}
                        <span className="text-sm">Continuar con Google</span>
                    </button>

                    <p className="mt-8 text-center text-[10px] text-tc-text-secondary uppercase tracking-widest leading-relaxed opacity-70">
                        Al continuar, aceptas nuestros <br />
                        <span className="underline cursor-pointer hover:text-tc-text transition-colors">Términos de Servicio</span> y <span className="underline cursor-pointer hover:text-tc-text transition-colors">Política de Privacidad</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
