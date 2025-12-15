import React, { ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from './icons';

interface Props {
  // This component doesn't have any specific props besides children,
  // which is now handled by React.PropsWithChildren.
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<Props>, State> {
  constructor(props: React.PropsWithChildren<Props>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-dark text-brand-text flex flex-col justify-center items-center p-4 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-brand-danger mb-4" />
            <h1 className="text-3xl font-bold text-brand-text mb-2">Oops! Algo salió mal.</h1>
            <p className="text-brand-text-secondary max-w-md mb-6">
                La aplicación encontró un error inesperado. Por favor, intenta refrescar la página. Si el problema persiste, considera restaurar tus datos desde la última copia de seguridad.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="bg-brand-accent hover:brightness-95 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg"
            >
                Refrescar Página
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;