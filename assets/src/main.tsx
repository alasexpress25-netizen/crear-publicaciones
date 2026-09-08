import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LaVisualMk ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-white">Hubo un problema al cargar la vista</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {this.state.error?.message || 'Ocurrió un error inesperado al renderizar la aplicación.'}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-rose-950/50"
              >
                Recargar Aplicación
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('lavisualmk_carousel_slides_v2');
                    localStorage.removeItem('lavisualmk_active_brand_v2');
                  } catch {}
                  window.location.reload();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2.5 rounded-xl transition border border-slate-700"
              >
                Limpiar Caché
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error handlers to intercept cross-origin issues and unhandled rejections cleanly
if (typeof window !== 'undefined') {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.warn('[Handled Script Event]:', msg, error || '');
    return true; // Prevents browser from treating this as an uncaught fatal error
  };

  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      console.warn('[Handled Global Error]:', event.message || event.error);
    },
    true
  );

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    console.warn('[Handled Unhandled Rejection]:', event.reason);
  });
}

// Safely register Service Worker for PWA support only when running top-level outside iframes
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    const isTopLevel = (() => {
      try {
        return window.self === window.parent;
      } catch {
        return false;
      }
    })();

    if (isTopLevel) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration skipped/failed:', err);
          });
      });
    }
  } catch (err) {
    console.warn('[PWA] Service Worker check error:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


