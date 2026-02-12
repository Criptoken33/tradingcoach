import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InfoIcon, XCircleIcon } from '../../components/icons';

// ============================================
// TYPES
// ============================================

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
    message: string;
    variant: ToastVariant;
    show: boolean;
    isExiting: boolean;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface ConfirmState extends ConfirmOptions {
    show: boolean;
    resolve: ((value: boolean) => void) | null;
}

interface LoadingState {
    show: boolean;
    message: string;
}

interface FeedbackAPI {
    showToast: (message: string, variant?: ToastVariant) => void;
    showConfirm: (options: ConfirmOptions) => Promise<boolean>;
    setLoading: (loading: boolean, message?: string) => void;
}

const FeedbackContext = createContext<FeedbackAPI | undefined>(undefined);

// ============================================
// TOAST COMPONENT
// ============================================

const toastConfig: Record<ToastVariant, {
    bg: string;
    border: string;
    icon: string;
    IconComponent: React.FC<{ className?: string }>;
}> = {
    success: {
        bg: 'bg-md-success-container',
        border: 'border-l-md-success',
        icon: 'text-md-on-success-container',
        IconComponent: CheckCircleIcon,
    },
    error: {
        bg: 'bg-md-error-container',
        border: 'border-l-md-error',
        icon: 'text-md-on-error-container',
        IconComponent: ExclamationTriangleIcon,
    },
    warning: {
        bg: 'bg-md-surface-container-highest',
        border: 'border-l-[rgb(var(--md-sys-color-warning-high))]',
        icon: 'text-[rgb(var(--md-sys-color-warning-high))]',
        IconComponent: ExclamationTriangleIcon,
    },
    info: {
        bg: 'bg-md-primary-container',
        border: 'border-l-md-primary',
        icon: 'text-md-on-primary-container',
        IconComponent: InfoIcon,
    },
};

interface ToastComponentProps {
    state: ToastState;
}

const Toast: React.FC<ToastComponentProps> = ({ state }) => {
    if (!state.show) return null;

    const config = toastConfig[state.variant];
    const { IconComponent } = config;

    // Combine all transforms in inline style to prevent conflicts
    const getTransform = () => {
        if (state.isExiting) {
            return 'translateX(-50%) translateY(16px) scale(0.95)';
        }
        return 'translateX(-50%) translateY(0) scale(1)';
    };

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                transform: getTransform(),
            }}
            className={`
        fixed z-[10001] 
        bottom-24 left-1/2
        pointer-events-none
        flex items-center justify-center gap-3
        px-5 py-3.5
        rounded-xl shadow-md-elevation-3
        border-l-4 ${config.border}
        ${config.bg}
        transition-all duration-300 ease-[cubic-bezier(0.05,0.7,0.1,1.0)]
        ${state.isExiting ? 'opacity-0' : 'opacity-100 animate-[toast-in_0.4s_cubic-bezier(0.05,0.7,0.1,1.0)]'}
        min-w-[280px] max-w-[calc(100vw-32px)] 
        md-medium:max-w-[480px]
      `}
        >
            <div className="flex items-center gap-3 pointer-events-auto">
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${config.icon}`} />
                <p className="label-large text-md-on-surface flex-1 break-words text-center">
                    {state.message}
                </p>
            </div>
        </div>
    );
};

// ============================================
// CONFIRM DIALOG COMPONENT
// ============================================

interface ConfirmDialogProps {
    state: ConfirmState;
    onResolve: (value: boolean) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onResolve }) => {
    if (!state.show) return null;

    const isDestructive = state.variant === 'destructive';

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-[fade-in_0.2s_ease-out]"
            onClick={() => onResolve(false)}
        >
            {/* Scrim */}
            <div className="absolute inset-0 bg-md-scrim/50 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                className="
          relative w-full max-w-[340px]
          bg-md-surface-container-high
          rounded-[28px] p-6
          shadow-md-elevation-3
          animate-[dialog-in_0.3s_cubic-bezier(0.05,0.7,0.1,1.0)]
        "
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                {isDestructive && (
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-md-error-container flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-6 h-6 text-md-on-error-container" />
                        </div>
                    </div>
                )}

                {/* Title */}
                <h2 className={`title-large text-md-on-surface ${isDestructive ? 'text-center' : ''} mb-2`}>
                    {state.title}
                </h2>

                {/* Body */}
                <p className={`body-medium text-md-on-surface-variant ${isDestructive ? 'text-center' : ''} mb-6`}>
                    {state.message}
                </p>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onResolve(false)}
                        className="
              px-5 py-2.5 rounded-full
              label-large text-md-primary
              hover:bg-md-primary/8 active:bg-md-primary/12
              transition-colors duration-200
              min-h-[40px]
            "
                    >
                        {state.cancelText || 'Cancelar'}
                    </button>
                    <button
                        onClick={() => onResolve(true)}
                        className={`
              px-5 py-2.5 rounded-full
              label-large min-h-[40px]
              transition-all duration-200
              active:scale-[0.97]
              ${isDestructive
                                ? 'bg-md-error text-md-on-error hover:brightness-110 shadow-md-elevation-1'
                                : 'bg-md-primary text-md-on-primary hover:brightness-110 shadow-md-elevation-1'
                            }
            `}
                    >
                        {state.confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// FULL SCREEN LOADER COMPONENT
// ============================================

interface FullScreenLoaderProps {
    state: LoadingState;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ state }) => {
    if (!state.show) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-md-surface flex flex-col items-center justify-center gap-6 animate-[fade-in_0.3s_ease-out]">
            {/* Branded Spinner */}
            <div className="relative">
                {/* Outer ring */}
                <div className="w-16 h-16 rounded-full border-[3px] border-md-surface-container-highest" />
                {/* Spinning arc */}
                <div className="absolute inset-0 w-16 h-16 rounded-full border-[3px] border-transparent border-t-md-primary animate-spin" />
            </div>

            {/* Brand */}
            <div className="text-center space-y-2">
                <h1 className="title-large text-md-on-surface font-semibold">
                    Trading Coach
                </h1>
                <p className="body-medium text-md-on-surface-variant animate-pulse">
                    {state.message || 'Cargando...'}
                </p>
            </div>
        </div>
    );
};

// ============================================
// FEEDBACK PROVIDER
// ============================================

export function FeedbackProvider({ children }: { children: ReactNode }) {
    // Toast State
    const [toast, setToast] = useState<ToastState>({
        message: '',
        variant: 'info',
        show: false,
        isExiting: false,
    });

    // Confirm Dialog State
    const [confirm, setConfirm] = useState<ConfirmState>({
        title: '',
        message: '',
        show: false,
        resolve: null,
    });

    // Loading State
    const [loading, setLoadingState] = useState<LoadingState>({
        show: false,
        message: '',
    });

    // Auto-hide toast
    useEffect(() => {
        if (toast.show && !toast.isExiting) {
            const exitTimer = setTimeout(() => {
                setToast(prev => ({ ...prev, isExiting: true }));
            }, 2800);

            const hideTimer = setTimeout(() => {
                setToast({ message: '', variant: 'info', show: false, isExiting: false });
            }, 3200);

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [toast.show, toast.message, toast.isExiting]);

    // Show Toast
    const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
        // Reset first to allow rapid-fire toasts
        setToast({ message: '', variant: 'info', show: false, isExiting: false });
        // Use timeout for React to flush the reset
        setTimeout(() => {
            setToast({ message, variant, show: true, isExiting: false });
        }, 50);
    }, []);

    // Show Confirm Dialog
    const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirm({
                ...options,
                show: true,
                resolve,
            });
        });
    }, []);

    // Handle Confirm Resolution
    const handleConfirmResolve = useCallback((value: boolean) => {
        confirm.resolve?.(value);
        setConfirm(prev => ({ ...prev, show: false, resolve: null }));
    }, [confirm.resolve]);

    // Set Loading
    const setLoading = useCallback((show: boolean, message: string = 'Cargando...') => {
        setLoadingState({ show, message });
    }, []);

    return (
        <FeedbackContext.Provider value={{ showToast, showConfirm, setLoading }}>
            {children}
            <Toast state={toast} />
            <ConfirmDialog state={confirm} onResolve={handleConfirmResolve} />
            <FullScreenLoader state={loading} />
        </FeedbackContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useFeedback(): FeedbackAPI {
    const context = useContext(FeedbackContext);
    if (context === undefined) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
}
