import React, { useState, useEffect } from 'react';
import { SERVICOS_EXTRAS_INICIAIS } from './data/initialData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './utils/storage';
import {
  apiGetCondominios, apiGetFornecedores, apiGetInadimplentes,
  apiGetTarefasGantt, apiGetTarefasEquipe, apiGetTransacoes,
  apiGetProjecaoItems, apiGetPorquinhos,
} from './services/api';
import { Condominio, ServicoExtra, Inadimplente, TarefaGantt, TarefaEquipe, Fornecedor, Porquinho, TransacaoExtrato, ProjecaoItem } from './types';
import { Header } from './components/Header';
import { CRMModule } from './components/crm/CRMModule';
import { ERPModule } from './components/erp/ERPModule';
import { TreasuryModule } from './components/vostreasury/TreasuryModule';
import { LoginScreen } from './components/auth/LoginScreen';

export default function App() {
  // Authentication — sempre exige tela de login no acesso
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    localStorage.removeItem('vos_authenticated');
    // Garante flag de dados limpos (sem dados fictícios)
    localStorage.setItem('vos_data_cleared', 'true');
  }, []);

  // Navigation
  const [activeTab, setActiveTab] = useState<'crm' | 'erp' | 'treasury'>('crm');
  const [subTab, setSubTab] = useState<string>('orcamentos');

  // ── Estado Central com Cache LocalStorage + Sincronização SQLite ─────────
  const [condominios, setCondominios] = useState<Condominio[]>(() =>
    loadFromStorage(STORAGE_KEYS.CONDOMINIOS, [])
  );
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(() =>
    loadFromStorage(STORAGE_KEYS.FORNECEDORES, [])
  );
  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>(() =>
    loadFromStorage(STORAGE_KEYS.INADIMPLENTES, [])
  );
  const [tarefasGantt, setTarefasGantt] = useState<TarefaGantt[]>(() =>
    loadFromStorage(STORAGE_KEYS.TAREFAS_GANTT, [])
  );
  const [tarefasEquipe, setTarefasEquipe] = useState<TarefaEquipe[]>(() =>
    loadFromStorage(STORAGE_KEYS.TAREFAS_EQUIPE, [])
  );
  const [transacoesExtrato, setTransacoesExtrato] = useState<TransacaoExtrato[]>(() =>
    loadFromStorage(STORAGE_KEYS.TRANSACOES_EXTRATO, [])
  );
  const [projecaoItems, setProjecaoItems] = useState<ProjecaoItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.PROJECAO_ITEMS, [])
  );
  const [porquinhos, setPorquinhos] = useState<Porquinho[]>(() =>
    loadFromStorage(STORAGE_KEYS.PORQUINHOS, [])
  );

  // Serviços extras e agenda: dados de catálogo e calendário
  const [servicosExtras, setServicosExtras] = useState<ServicoExtra[]>(() =>
    loadFromStorage(STORAGE_KEYS.SERVICOS_EXTRAS, SERVICOS_EXTRAS_INICIAIS)
  );
  const [agenda, setAgenda] = useState<any[]>(() =>
    loadFromStorage(STORAGE_KEYS.AGENDA, [])
  );

  // Função auxiliar para atualizar o estado apenas se houver mudança real no banco,
  // preservando a igualdade referencial e evitando re-renders ou perda de foco em formulários.
  const updateIfChanged = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, nextData: T[]) => {
    setter((prev) => {
      if (prev.length !== nextData.length || JSON.stringify(prev) !== JSON.stringify(nextData)) {
        return nextData;
      }
      return prev;
    });
  };

  // ── Sincronizador com o Banco SQLite em Tempo Real ─────────────────────────
  const sincronizarComBanco = React.useCallback(() => {
    apiGetCondominios()
      .then((data) => {
        if (Array.isArray(data)) updateIfChanged(setCondominios, data as Condominio[]);
      })
      .catch((err) => console.error('Erro ao sincronizar condomínios do SQLite:', err));

    apiGetFornecedores()
      .then((data) => {
        if (Array.isArray(data)) updateIfChanged(setFornecedores, data as Fornecedor[]);
      })
      .catch((err) => console.error('Erro ao sincronizar fornecedores do SQLite:', err));

    apiGetInadimplentes()
      .then((data) => {
        if (Array.isArray(data)) updateIfChanged(setInadimplentes, data as Inadimplente[]);
      })
      .catch((err) => console.error('Erro ao sincronizar inadimplentes do SQLite:', err));

    apiGetTarefasGantt()
      .then((data) => {
        if (Array.isArray(data)) updateIfChanged(setTarefasGantt, data as TarefaGantt[]);
      })
      .catch((err) => console.error('Erro ao sincronizar tarefas Gantt do SQLite:', err));

    apiGetTarefasEquipe()
      .then((data) => {
        if (Array.isArray(data)) updateIfChanged(setTarefasEquipe, data as TarefaEquipe[]);
      })
      .catch((err) => console.error('Erro ao sincronizar tarefas equipe do SQLite:', err));

    apiGetTransacoes()
      .then((data) => {
        if (Array.isArray(data)) updateIfChanged(setTransacoesExtrato, data as TransacaoExtrato[]);
      })
      .catch((err) => console.error('Erro ao sincronizar transações do SQLite:', err));

    apiGetProjecaoItems()
      .then((data) => {
        if (Array.isArray(data)) updateIfChanged(setProjecaoItems, data as ProjecaoItem[]);
      })
      .catch((err) => console.error('Erro ao sincronizar projeções do SQLite:', err));

    apiGetPorquinhos()
      .then((data) => {
        if (Array.isArray(data)) updateIfChanged(setPorquinhos, data as Porquinho[]);
      })
      .catch((err) => console.error('Erro ao sincronizar porquinhos do SQLite:', err));
  }, []);

  // 1. Executa na montagem inicial
  // 2. Executa automaticamente a cada 4 segundos (polling contínuo em tempo real)
  // 3. Executa imediatamente ao alternar de volta para a aba (window focus / visibility change)
  useEffect(() => {
    sincronizarComBanco();

    const intervalId = setInterval(sincronizarComBanco, 4000);

    const handleFocus = () => {
      sincronizarComBanco();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sincronizarComBanco();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sincronizarComBanco]);

  // Sincronizar alterações no localStorage como cache rápido
  useEffect(() => { saveToStorage(STORAGE_KEYS.CONDOMINIOS, condominios); }, [condominios]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.FORNECEDORES, fornecedores); }, [fornecedores]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.INADIMPLENTES, inadimplentes); }, [inadimplentes]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.TAREFAS_GANTT, tarefasGantt); }, [tarefasGantt]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.TAREFAS_EQUIPE, tarefasEquipe); }, [tarefasEquipe]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.TRANSACOES_EXTRATO, transacoesExtrato); }, [transacoesExtrato]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PROJECAO_ITEMS, projecaoItems); }, [projecaoItems]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PORQUINHOS, porquinhos); }, [porquinhos]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.AGENDA, agenda); }, [agenda]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.SERVICOS_EXTRAS, servicosExtras); }, [servicosExtras]);

  const handleLogout = () => {
    localStorage.removeItem('vos_authenticated');
    localStorage.removeItem('vos_user_email');
    sessionStorage.removeItem('vos_user_email');
    setIsAuthenticated(false);
  };

  // Limpar dados: recarrega do banco após limpar estado local
  const handleClearData = async () => {
    setCondominios([]);
    setFornecedores([]);
    setInadimplentes([]);
    setTarefasGantt([]);
    setTarefasEquipe([]);
    setPorquinhos([]);
    setTransacoesExtrato([]);
    setProjecaoItems([]);
    setServicosExtras([]);
    setAgenda([]);
    localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SERVICOS_EXTRAS, JSON.stringify([]));
    // Recarregar condomínios do banco (dados reais)
    try {
      const data = await apiGetCondominios();
      setCondominios(data as Condominio[]);
    } catch (err) {
      console.error('Erro ao recarregar condominios:', err);
    }
  };

  // Restaurar apenas serviços extras padrão (não tem dados fictícios de condomínios)
  const handleResetData = async () => {
    setServicosExtras(SERVICOS_EXTRAS_INICIAIS);
    saveToStorage(STORAGE_KEYS.SERVICOS_EXTRAS, SERVICOS_EXTRAS_INICIAIS);
  };

  // Render Lock Screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f8faf6] text-slate-900 font-sans flex flex-col selection:bg-[#2d5a32] selection:text-white">
      {/* App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        subTab={subTab}
        setSubTab={setSubTab}
        onLogout={handleLogout}
        onClearData={handleClearData}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'crm' && (
          <CRMModule
            condominios={condominios}
            setCondominios={setCondominios}
            servicosExtras={servicosExtras}
            setServicosExtras={setServicosExtras}
            subTab={subTab}
          />
        )}

        {activeTab === 'erp' && (
          <ERPModule
            condominios={condominios}
            setCondominios={setCondominios}
            inadimplentes={inadimplentes}
            setInadimplentes={setInadimplentes}
            tarefasGantt={tarefasGantt}
            setTarefasGantt={setTarefasGantt}
            tarefasEquipe={tarefasEquipe}
            setTarefasEquipe={setTarefasEquipe}
            fornecedores={fornecedores}
            setFornecedores={setFornecedores}
            agenda={agenda}
            setAgenda={setAgenda}
            subTab={subTab}
          />
        )}

        {activeTab === 'treasury' && (
          <TreasuryModule
            fornecedores={fornecedores}
            setFornecedores={setFornecedores}
            porquinhos={porquinhos}
            setPorquinhos={setPorquinhos}
            condominios={condominios}
            inadimplentes={inadimplentes}
            setInadimplentes={setInadimplentes}
            transacoesExtrato={transacoesExtrato}
            setTransacoesExtrato={setTransacoesExtrato}
            projecaoItems={projecaoItems}
            setProjecaoItems={setProjecaoItems}
            subTab={subTab}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#142618] text-emerald-200/80 text-xs py-4 border-t border-[#244528] print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            © 2026 <strong className="text-white">VOS CONDO ADMINISTRADORA LTDA</strong> • CNPJ 66.072.162/0001-43
          </p>
          <p className="text-[11px]">
            Curitiba/PR • Tel: (41) 93300-0513 • Sistema de Gestão Interna CRM & ERP
          </p>
        </div>
      </footer>
    </div>
  );
}
