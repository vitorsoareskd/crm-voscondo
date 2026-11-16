import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  handleRecover = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#122b17] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#1b3d22] border-2 border-[#2f6338] rounded-3xl p-8 shadow-2xl space-y-4 text-center">
            <h1 className="text-2xl font-black text-amber-400">VOS CONDOMÍNIOS</h1>
            <p className="text-sm text-emerald-100">
              Detectamos dados em cache de uma versão anterior no navegador. Clique abaixo para sincronizar e carregar o sistema atualizado.
            </p>
            {this.state.error && (
              <pre className="text-[11px] bg-[#0f2413] text-rose-300 p-3 rounded-xl overflow-x-auto text-left border border-rose-500/30">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRecover}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg cursor-pointer transition"
            >
              Sincronizar & Carregar Sistema
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
