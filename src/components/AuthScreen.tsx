import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from '../../components/icons';

export function AuthScreen() {
    const { signInWithGoogle } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setError(null);
        setLoading(true);

        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
            <div className="bg-brand-surface rounded-2xl p-8 max-w-md w-full shadow-2xl border border-brand-outline">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-brand-on-surface mb-2">Trading Coach</h1>
                    <p className="text-brand-on-surface-variant">Inicia sesión para continuar</p>
                </div>

                {error && (
                    <div className="bg-error/20 border border-error text-error px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <GoogleIcon className="w-5 h-5" />
                    {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                </button>
            </div>
        </div>
    );
}
