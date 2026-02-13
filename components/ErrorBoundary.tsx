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
        <div className="min-h-screen bg-tc-bg text-tc-text flex flex-col justify-center items-center p-6 text-center">
          <div className="bg-tc-error/10 p-6 rounded-[2rem] border border-tc-error/20 mb-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-tc-error" />
          </div>
          <h1 className="text-xl font-semibold text-tc-text mb-3 uppercase tracking-wider">Oops! Algo salió mal.</h1>
          <p className="text-tc-text-secondary max-w-md mb-10 text-sm font-medium leading-relaxed">
            La aplicación encontró un error inesperado. Por favor, intenta refrescar la página. Si el problema persiste, considera restaurar tus datos desde la última copia de seguridad.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-tc-growth-green hover:bg-tc-growth-green/90 text-white font-semibold py-3.5 px-10 rounded-xl transition-all shadow-sm active:scale-[0.98]"
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