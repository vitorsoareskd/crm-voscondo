import React, { useState, useEffect } from 'react';
import {
  CONDOMINIOS_INICIAIS,
  SERVICOS_EXTRAS_INICIAIS,
  INADIMPLENTES_INICIAIS,
  TAREFAS_GANTT_INICIAIS,
  TAREFAS_EQUIPE_INICIAIS,
  FORNECEDORES_INICIAIS,
  PORQUINHOS_INICIAIS,
  TRANSACOES_EXTRATO_INICIAIS,
  PROJECAO_ITEMS_INICIAIS
} from './data/initialData';
import {
  loadFromStorage,
  saveToStorage,
  STORAGE_KEYS,
  clearAllAppData,
  resetAllToInitialData
} from './utils/storage';
import {
  subscribeToCollection,
  saveCollectionToFirestore,
  clearFirestoreCollection
} from './lib/firebase';
import { Condominio, ServicoExtra, Inadimplente, TarefaGantt, TarefaEquipe, Fornecedor, Porquinho, TransacaoExtrato, ProjecaoItem } from './types';
import { Header } from './components/Header';
import { CRMModule } from './components/crm/CRMModule';
import { ERPModule } from './components/erp/ERPModule';
import { TreasuryModule } from './components/vostreasury/TreasuryModule';
import { SQLiteModule } from './components/sqlite/SQLiteModule';
import { LoginScreen } from './components/auth/LoginScreen';

export default function App() {
  // Authentication State - Always require lock screen on initial app load / page link visit
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Clear any old persisted auth token from localStorage to guarantee lock screen on fresh access
  useEffect(() => {
    localStorage.removeItem('vos_authenticated');
  }, []);

  // Navigation
  const [activeTab, setActiveTab] = useState<'crm' | 'erp' | 'treasury' | 'sqlite'>('crm');
  const [subTab, setSubTab] = useState<string>('orcamentos');

  // Shared Central State with LocalStorage Persistence & Firestore Sync
  const [condominios, setCondominios] = useState<Condominio[]>(() =>
    loadFromStorage(STORAGE_KEYS.CONDOMINIOS, CONDOMINIOS_INICIAIS)
  );
  const [servicosExtras, setServicosExtras] = useState<ServicoExtra[]>(() =>
    loadFromStorage(STORAGE_KEYS.SERVICOS_EXTRAS, SERVICOS_EXTRAS_INICIAIS)
  );
  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>(() =>
    loadFromStorage(STORAGE_KEYS.INADIMPLENTES, INADIMPLENTES_INICIAIS)
  );
  const [tarefasGantt, setTarefasGantt] = useState<TarefaGantt[]>(() =>
    loadFromStorage(STORAGE_KEYS.TAREFAS_GANTT, TAREFAS_GANTT_INICIAIS)
  );
  const [tarefasEquipe, setTarefasEquipe] = useState<TarefaEquipe[]>(() =>
    loadFromStorage(STORAGE_KEYS.TAREFAS_EQUIPE, TAREFAS_EQUIPE_INICIAIS)
  );
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(() =>
    loadFromStorage(STORAGE_KEYS.FORNECEDORES, FORNECEDORES_INICIAIS)
  );
  const [porquinhos, setPorquinhos] = useState<Porquinho[]>(() =>
    loadFromStorage(STORAGE_KEYS.PORQUINHOS, PORQUINHOS_INICIAIS)
  );
  const [transacoesExtrato, setTransacoesExtrato] = useState<TransacaoExtrato[]>(() =>
    loadFromStorage(STORAGE_KEYS.TRANSACOES_EXTRATO, TRANSACOES_EXTRATO_INICIAIS)
  );
  const [projecaoItems, setProjecaoItems] = useState<ProjecaoItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.PROJECAO_ITEMS, PROJECAO_ITEMS_INICIAIS)
  );

  // Automatically clear test data on first launch ready for production
  useEffect(() => {
    const isCleared = localStorage.getItem('vos_data_cleared') === 'true';
    if (!isCleared) {
      handleClearData();
    }
  }, []);

  // Firestore Subscriptions & Real-Time Sync
  useEffect(() => {
    const unsubCondominios = subscribeToCollection<Condominio>('condominios', (data) => setCondominios(data), CONDOMINIOS_INICIAIS);
    const unsubServicos = subscribeToCollection<ServicoExtra>('servicosExtras', (data) => setServicosExtras(data), SERVICOS_EXTRAS_INICIAIS);
    const unsubInadimplentes = subscribeToCollection<Inadimplente>('inadimplentes', (data) => setInadimplentes(data), INADIMPLENTES_INICIAIS);
    const unsubTarefasGantt = subscribeToCollection<TarefaGantt>('tarefasGantt', (data) => setTarefasGantt(data), TAREFAS_GANTT_INICIAIS);
    const unsubTarefasEquipe = subscribeToCollection<TarefaEquipe>('tarefasEquipe', (data) => setTarefasEquipe(data), TAREFAS_EQUIPE_INICIAIS);
    const unsubFornecedores = subscribeToCollection<Fornecedor>('fornecedores', (data) => setFornecedores(data), FORNECEDORES_INICIAIS);
    const unsubPorquinhos = subscribeToCollection<Porquinho>('porquinhos', (data) => setPorquinhos(data), PORQUINHOS_INICIAIS);
    const unsubTransacoes = subscribeToCollection<TransacaoExtrato>('transacoesExtrato', (data) => setTransacoesExtrato(data), TRANSACOES_EXTRATO_INICIAIS);
    const unsubProjecao = subscribeToCollection<ProjecaoItem>('projecaoItems', (data) => setProjecaoItems(data), PROJECAO_ITEMS_INICIAIS);

    return () => {
      unsubCondominios();
      unsubServicos();
      unsubInadimplentes();
      unsubTarefasGantt();
      unsubTarefasEquipe();
      unsubFornecedores();
      unsubPorquinhos();
      unsubTransacoes();
      unsubProjecao();
    };
  }, []);

  // Sync state changes to LocalStorage and direct to Cloud Firestore
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CONDOMINIOS, condominios);
    saveCollectionToFirestore('condominios', condominios);
  }, [condominios]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SERVICOS_EXTRAS, servicosExtras);
    saveCollectionToFirestore('servicosExtras', servicosExtras);
  }, [servicosExtras]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INADIMPLENTES, inadimplentes);
    saveCollectionToFirestore('inadimplentes', inadimplentes);
  }, [inadimplentes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TAREFAS_GANTT, tarefasGantt);
    saveCollectionToFirestore('tarefasGantt', tarefasGantt);
  }, [tarefasGantt]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TAREFAS_EQUIPE, tarefasEquipe);
    saveCollectionToFirestore('tarefasEquipe', tarefasEquipe);
  }, [tarefasEquipe]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FORNECEDORES, fornecedores);
    saveCollectionToFirestore('fornecedores', fornecedores);
  }, [fornecedores]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PORQUINHOS, porquinhos);
    saveCollectionToFirestore('porquinhos', porquinhos);
  }, [porquinhos]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRANSACOES_EXTRATO, transacoesExtrato);
    saveCollectionToFirestore('transacoesExtrato', transacoesExtrato);
  }, [transacoesExtrato]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROJECAO_ITEMS, projecaoItems);
    saveCollectionToFirestore('projecaoItems', projecaoItems);
  }, [projecaoItems]);

  const handleLogout = () => {
    localStorage.removeItem('vos_authenticated');
    localStorage.removeItem('vos_user_email');
    sessionStorage.removeItem('vos_user_email');
    setIsAuthenticated(false);
  };

  const handleClearData = async () => {
    clearAllAppData();
    setCondominios([]);
    setServicosExtras([]);
    setInadimplentes([]);
    setTarefasGantt([]);
    setTarefasEquipe([]);
    setFornecedores([]);
    setPorquinhos([]);
    setTransacoesExtrato([]);
    setProjecaoItems([]);

    await Promise.all([
      clearFirestoreCollection('condominios'),
      clearFirestoreCollection('servicosExtras'),
      clearFirestoreCollection('inadimplentes'),
      clearFirestoreCollection('tarefasGantt'),
      clearFirestoreCollection('tarefasEquipe'),
      clearFirestoreCollection('fornecedores'),
      clearFirestoreCollection('porquinhos'),
      clearFirestoreCollection('transacoesExtrato'),
      clearFirestoreCollection('projecaoItems'),
    ]);
  };

  const handleResetData = async () => {
    resetAllToInitialData();
    setCondominios(CONDOMINIOS_INICIAIS);
    setServicosExtras(SERVICOS_EXTRAS_INICIAIS);
    setInadimplentes(INADIMPLENTES_INICIAIS);
    setTarefasGantt(TAREFAS_GANTT_INICIAIS);
    setTarefasEquipe(TAREFAS_EQUIPE_INICIAIS);
    setFornecedores(FORNECEDORES_INICIAIS);
    setPorquinhos(PORQUINHOS_INICIAIS);
    setTransacoesExtrato(TRANSACOES_EXTRATO_INICIAIS);
    setProjecaoItems(PROJECAO_ITEMS_INICIAIS);

    await Promise.all([
      saveCollectionToFirestore('condominios', CONDOMINIOS_INICIAIS),
      saveCollectionToFirestore('servicosExtras', SERVICOS_EXTRAS_INICIAIS),
      saveCollectionToFirestore('inadimplentes', INADIMPLENTES_INICIAIS),
      saveCollectionToFirestore('tarefasGantt', TAREFAS_GANTT_INICIAIS),
      saveCollectionToFirestore('tarefasEquipe', TAREFAS_EQUIPE_INICIAIS),
      saveCollectionToFirestore('fornecedores', FORNECEDORES_INICIAIS),
      saveCollectionToFirestore('porquinhos', PORQUINHOS_INICIAIS),
      saveCollectionToFirestore('transacoesExtrato', TRANSACOES_EXTRATO_INICIAIS),
      saveCollectionToFirestore('projecaoItems', PROJECAO_ITEMS_INICIAIS),
    ]);
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

        {activeTab === 'sqlite' && <SQLiteModule appCondominios={condominios} />}
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
