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
import { Condominio, ServicoExtra, Inadimplente, TarefaGantt, TarefaEquipe, Fornecedor, Porquinho, TransacaoExtrato, ProjecaoItem } from './types';
import { Header } from './components/Header';
import { CRMModule } from './components/crm/CRMModule';
import { ERPModule } from './components/erp/ERPModule';
import { TreasuryModule } from './components/vostreasury/TreasuryModule';

import { LoginScreen } from './components/auth/LoginScreen';

export default function App() {
  // Authentication State - Always require lock screen on initial app load / page link visit
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Clear any old persisted auth token from localStorage to guarantee lock screen on fresh access
  useEffect(() => {
    localStorage.removeItem('vos_authenticated');
  }, []);

  // Navigation
  const [activeTab, setActiveTab] = useState<'crm' | 'erp' | 'treasury'>('crm');
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
  const [agenda, setAgenda] = useState<any[]>(() => 
    loadFromStorage(STORAGE_KEYS.AGENDA, [])
  );

  // Sync Agenda State
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.AGENDA, agenda);
  }, [agenda]);

  // Fetch from backend API
  useEffect(() => {
    fetch('http://localhost:3001/api/condominios')
      .then(res => res.json())
      .then(data => {
        // Mapeia os dados do SQLite para a interface do frontend, preenchendo o que falta com valores padrao
        const condominiosApi: Condominio[] = data.map((c: any) => ({
          id: String(c.id),
          nome: c.nome,
          cnpj: c.cnpj || '',
          status: c.status || 'Interessado',
          unidades: 0,
          endereco: 'Endereço não cadastrado',
          sindicoResponsavel: 'Não informado',
          emailCondominio: '',
          numeroCondominio: '',
          banco: '',
          agenciaEConta: '',
          complexidade: 'Moderado',
          plano: 'Vos Essencial',
          fatorAjuste: 1,
          mensalidadeCalculada: 0,
          livreCaixa: 0,
          fundoObras: 0,
          fundoPintura: 0,
          fundoReforma: 0,
          gastoMedioMensal: 0,
          rendimentoMedioMensal: 0
        }));
        if (condominiosApi.length > 0) {
          setCondominios(condominiosApi);
        }
      })
      .catch(err => console.error("Erro ao buscar condominios da API:", err));
  }, []);

  // Automatically clear test data on first launch ready for production
  useEffect(() => {
    const isCleared = localStorage.getItem('vos_data_cleared') === 'true';
    if (!isCleared) {
      handleClearData();
    }
  }, []);



  // Sync state changes to LocalStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CONDOMINIOS, condominios);
  }, [condominios]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SERVICOS_EXTRAS, servicosExtras);
  }, [servicosExtras]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INADIMPLENTES, inadimplentes);
  }, [inadimplentes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TAREFAS_GANTT, tarefasGantt);
  }, [tarefasGantt]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TAREFAS_EQUIPE, tarefasEquipe);
  }, [tarefasEquipe]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FORNECEDORES, fornecedores);
  }, [fornecedores]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PORQUINHOS, porquinhos);
  }, [porquinhos]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRANSACOES_EXTRATO, transacoesExtrato);
  }, [transacoesExtrato]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROJECAO_ITEMS, projecaoItems);
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
