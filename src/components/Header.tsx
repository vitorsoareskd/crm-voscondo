import React, { useState } from 'react';
import { Building2, Calculator, ShieldCheck, Wallet, PieChart, Users, CheckSquare, Layers, Cpu, LogOut, UserCheck, Trash2, RotateCcw, Database } from 'lucide-react';
import { VosLogo } from './VosLogo';

interface HeaderProps {
  activeTab: 'crm' | 'erp' | 'treasury';
  setActiveTab: (tab: 'crm' | 'erp' | 'treasury') => void;
  subTab: string;
  setSubTab: (subTab: string) => void;
  onLogout?: () => void;
  onClearData?: () => void;
  onResetData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  subTab,
  setSubTab,
  onLogout,
  onClearData,
  onResetData
}) => {
  const [showDataModal, setShowDataModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExecuteClear = async () => {
    if (window.confirm('Tem certeza que deseja zerar todos os dados de teste para usar o sistema em branco?')) {
      setIsProcessing(true);
      try {
        if (onClearData) await onClearData();
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
        setShowDataModal(false);
      }
    }
  };

  const handleExecuteReset = async () => {
    if (window.confirm('Deseja recarregar os dados de exemplo do sistema no banco de dados?')) {
      setIsProcessing(true);
      try {
        if (onResetData) await onResetData();
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
        setShowDataModal(false);
      }
    }
  };

  return (
    <header className="bg-[#1c3220] text-white shadow-md border-b border-[#2d5a32] print:hidden">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Slogan */}
        <VosLogo variant="header" onDarkBg={true} size="md" />

        {/* Right Section: Contacts + Logged User / Logout */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden lg:flex items-center gap-6 text-xs text-emerald-200/90 border-r border-emerald-800/60 pr-6">
            <div>
              <span className="block text-emerald-400 text-[10px] uppercase tracking-wider font-bold">CNPJ Matriz</span>
              <span className="font-mono font-medium text-white">66.072.162/0001-43</span>
            </div>
            <div>
              <span className="block text-emerald-400 text-[10px] uppercase tracking-wider font-bold">Atendimento</span>
              <span className="font-mono font-medium text-white">(41) 93300-0513</span>
            </div>
            <div>
              <span className="block text-emerald-400 text-[10px] uppercase tracking-wider font-bold">Cidade</span>
              <span className="font-medium text-white">Curitiba / PR</span>
            </div>
          </div>

          {/* Live Sync Status Indicator */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium shadow-xs"
            title="Conexão em Tempo Real com SQLite: atualizações sincronizadas automaticamente"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="hidden sm:inline text-[11px] font-semibold text-emerald-200">Auto-Sync Ativo</span>
          </div>

          {/* Data Actions Menu Button */}
          <button
            onClick={() => setShowDataModal(true)}
            className="px-3 py-1.5 bg-[#142618] hover:bg-[#203c26] text-emerald-200 border border-[#2d5a32] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Gerenciar Dados do Sistema"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Dados & Banco</span>
          </button>

          {/* User Session & Logout Button */}
          <div className="flex items-center gap-3 bg-[#142618] border border-[#2d5a32] px-3 py-1.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-950 text-emerald-400 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </span>
              <div className="text-left">
                <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Usuário Logado</span>
                <span className="text-xs font-semibold text-white">adm@voscondo.com</span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-2 px-2.5 py-1 bg-emerald-950 hover:bg-rose-950/80 text-emerald-300 hover:text-rose-200 border border-emerald-800/60 hover:border-rose-700/60 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sair e Bloquear Tela"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloquear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Module Tabs */}
      <div className="bg-[#142618] border-t border-[#244528] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-start py-1">
          <nav className="flex space-x-1 sm:space-x-2" aria-label="Tabs">
            {/* CRM Tab */}
            <button
              onClick={() => {
                setActiveTab('crm');
                setSubTab('orcamentos');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'crm'
                  ? 'bg-[#f8faf6] text-[#1c3220] shadow-sm font-bold'
                  : 'text-emerald-200 hover:text-white hover:bg-[#1e3b23]'
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-700" />
              <span>Gestão Comercial (CRM)</span>
            </button>

            {/* ERP Tab */}
            <button
              onClick={() => {
                setActiveTab('erp');
                setSubTab('cadastro');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'erp'
                  ? 'bg-[#f8faf6] text-[#1c3220] shadow-sm font-bold'
                  : 'text-emerald-200 hover:text-white hover:bg-[#1e3b23]'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Controle (ERP)</span>
            </button>

            {/* Treasury / Saúde VOS Tab */}
            <button
              onClick={() => {
                setActiveTab('treasury');
                setSubTab('saude');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'treasury' && subTab !== 'ucondo'
                  ? 'bg-[#f8faf6] text-[#1c3220] shadow-sm font-bold'
                  : 'text-emerald-200 hover:text-white hover:bg-[#1e3b23]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Saúde VOS</span>
            </button>

            {/* API Tab (Aba de cima ao lado de Saúde VOS) */}
            <button
              onClick={() => {
                setActiveTab('treasury');
                setSubTab('ucondo');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'treasury' && subTab === 'ucondo'
                  ? 'bg-[#f8faf6] text-[#1c3220] shadow-sm font-bold'
                  : 'text-emerald-200 hover:text-white hover:bg-[#1e3b23]'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-700" />
              <span>API</span>
            </button>

          </nav>
        </div>
      </div>

      {/* Sub Navigation Bar for Active Module - Below Main Tabs */}
      <div className="bg-[#102013] border-t border-[#1f3d24] px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-start gap-2 text-xs text-emerald-100 overflow-x-auto">
          {activeTab === 'crm' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSubTab('orcamentos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'orcamentos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculadora & Kanban</span>
              </button>
              <button
                onClick={() => setSubTab('extras')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'extras'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tabela de Serviços Extras</span>
              </button>
            </div>
          )}

          {activeTab === 'erp' && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setSubTab('cadastro')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'cadastro'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Perfil de Clientes</span>
              </button>
              <button
                onClick={() => setSubTab('gantt')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'gantt'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Cronograma Gantt</span>
              </button>
              <button
                onClick={() => setSubTab('tarefas')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'tarefas'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Anotações</span>
              </button>
              <button
                onClick={() => setSubTab('fornecedores')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'fornecedores'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Fornecedores</span>
              </button>
              <button
                onClick={() => setSubTab('relatorios')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'relatorios'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Relatórios</span>
              </button>

            </div>
          )}

          {activeTab === 'treasury' && subTab === 'ucondo' && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setSubTab('ucondo')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'ucondo'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Inadimplência</span>
              </button>
            </div>
          )}

          {activeTab === 'treasury' && subTab !== 'ucondo' && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setSubTab('saude')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'saude'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Projeção</span>
              </button>
              <button
                onClick={() => setSubTab('porquinhos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'porquinhos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Caixa & Porquinhos</span>
              </button>
              <button
                onClick={() => setSubTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Painel Rentabilidade</span>
              </button>
              <button
                onClick={() => setSubTab('extrato')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'extrato'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>Extrato Financeiro</span>
              </button>
              <button
                onClick={() => setSubTab('nfe')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'nfe'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#1b3320] text-emerald-200 hover:text-white hover:bg-[#25482e] border border-emerald-800/50'
                }`}
              >
                <span>NFe</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Gerenciamento de Banco de Dados e Limpeza */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-800 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Gerenciador de Dados</h3>
                  <p className="text-xs text-slate-500">Nuvem Firestore (Firebase) e Backup Local</p>
                </div>
              </div>
              <button
                onClick={() => !isProcessing && setShowDataModal(false)}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-lg cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Suas alterações no CRM, ERP e Saúde VOS são <strong>sincronizadas automaticamente</strong> no Firebase Cloud Firestore e salvas no seu navegador. Você pode limpar a base de dados de teste ou restaurar os dados de demonstração.
              </p>

              <div className="space-y-3 pt-2">
                {/* Option 1: Clear all data */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      Limpar Dados de Teste (Base Zera)
                    </h4>
                    <p className="text-[11px] text-rose-700/80 mt-1">
                      Remove condomínios, orçamentos e fornecedores de teste do Firebase e localmente para começar com uma base limpa.
                    </p>
                  </div>
                  <button
                    onClick={handleExecuteClear}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    {isProcessing ? 'Aguarde...' : 'Limpar Dados'}
                  </button>
                </div>

                {/* Option 2: Restore sample data */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-emerald-600" />
                      Restaurar Dados Exemplo
                    </h4>
                    <p className="text-[11px] text-emerald-700/80 mt-1">
                      Recarrega a base completa de condôminos, financeiro e tarefas demonstrativas na nuvem e localmente.
                    </p>
                  </div>
                  <button
                    onClick={handleExecuteReset}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    {isProcessing ? 'Aguarde...' : 'Restaurar Exemplo'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => !isProcessing && setShowDataModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
