import React, { useState, useEffect } from 'react';
import {
  initSQLite,
  querySQL,
  executeSQL,
  exportDatabaseFile,
  importDatabaseFile,
  resetSQLiteDatabase,
  syncAppCondosToSQLite,
  CondominioSQLite,
  UnidadeSQLite,
  PessoaSQLite,
  FinanceiroSQLite,
  ChamadoSQLite,
  VisitanteSQLite
} from '../../lib/sqlite';
import { Condominio } from '../../types';
import {
  Database,
  Building2,
  Users,
  FileText,
  Wrench,
  UserCheck,
  Sparkles,
  Terminal,
  Plus,
  Trash2,
  CheckCircle,
  Download,
  Upload,
  RotateCcw,
  Search,
  Bot,
  Send,
  Key,
  ShieldAlert,
  Home
} from 'lucide-react';
import { formatarMoeda } from '../../utils/pricingEngine';

interface SQLiteModuleProps {
  appCondominios?: Condominio[];
}

export const SQLiteModule: React.FC<SQLiteModuleProps> = ({ appCondominios }) => {
  const [isReady, setIsReady] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'condominios' | 'pessoas' | 'financeiro' | 'chamados' | 'visitantes' | 'sql_console' | 'ai_assistant'
  >('dashboard');

  // Key for Gemini API
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem('gemini_api_key') || 'AQ.Ab8RN6LFTqLqrTXo-BomYMU2XXTzOnMsBrjttm0ZE2CpzrxLLQ'
  );

  // Data states
  const [condominios, setCondominios] = useState<CondominioSQLite[]>([]);
  const [unidades, setUnidades] = useState<UnidadeSQLite[]>([]);
  const [pessoas, setPessoas] = useState<PessoaSQLite[]>([]);
  const [financeiro, setFinanceiro] = useState<FinanceiroSQLite[]>([]);
  const [chamados, setChamados] = useState<ChamadoSQLite[]>([]);
  const [visitantes, setVisitantes] = useState<VisitanteSQLite[]>([]);

  // Console SQL
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM condominios;');
  const [sqlOutput, setSqlOutput] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // AI Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Olá! Sou o Assistente VOS especialista em SQLite. Como posso ajudar na análise financeira ou comunicados do condomínio hoje?' }
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'condominio' | 'unidade' | 'pessoa' | 'financeiro' | 'chamado' | 'visitante' | null
  >(null);

  // Form inputs for modals
  const [formCondo, setFormCondo] = useState({ nome: '', cnpj: '', taxa_padrao: '', endereco: '', sindico_nome: '', sindico_contato: '' });
  const [formUnit, setFormUnit] = useState({ condominio_id: '', bloco: '', numero: '', fracao_ideal: '1.0' });
  const [formPessoa, setFormPessoa] = useState({ nome: '', cpf_cnpj: '', tipo: 'Proprietário' as const, email: '', telefone: '' });
  const [formFin, setFormFin] = useState({ condominio_id: '', unidade_id: '', descricao: '', valor: '', data_vencimento: '' });
  const [formChamado, setFormChamado] = useState({ condominio_id: '', titulo: '', prioridade: 'Média' as const, descricao: '' });
  const [formVis, setFormVis] = useState({ condominio_id: '', unidade_id: '', nome_visitante: '', documento: '', veiculo_placa: '' });

  // Initialize SQLite on mount
  useEffect(() => {
    initSQLite().then((success) => {
      setIsReady(success);
      if (success) {
        if (appCondominios && appCondominios.length > 0) {
          syncAppCondosToSQLite(appCondominios);
        }
        refreshAllData();
      }
    });
  }, [appCondominios]);

  const refreshAllData = () => {
    const condoList = querySQL<CondominioSQLite>('SELECT * FROM condominios ORDER BY id DESC');
    setCondominios(condoList);

    const unitList = querySQL<UnidadeSQLite>(`
      SELECT u.*, c.nome as condominio_nome 
      FROM unidades u
      JOIN condominios c ON u.condominio_id = c.id
      ORDER BY u.id DESC
    `);
    setUnidades(unitList);

    const pessoaList = querySQL<PessoaSQLite>('SELECT * FROM pessoas ORDER BY id DESC');
    setPessoas(pessoaList);

    const finList = querySQL<FinanceiroSQLite>(`
      SELECT f.*, c.nome as condominio_nome, u.numero as unidade_numero, u.bloco
      FROM financeiro f
      JOIN condominios c ON f.condominio_id = c.id
      JOIN unidades u ON f.unidade_id = u.id
      ORDER BY f.id DESC
    `);
    setFinanceiro(finList);

    const chamadoList = querySQL<ChamadoSQLite>(`
      SELECT ch.*, c.nome as condominio_nome, u.numero as unidade_numero
      FROM chamados ch
      JOIN condominios c ON ch.condominio_id = c.id
      LEFT JOIN unidades u ON ch.unidade_id = u.id
      ORDER BY ch.id DESC
    `);
    setChamados(chamadoList);

    const visList = querySQL<VisitanteSQLite>(`
      SELECT v.*, c.nome as condominio_nome, u.numero as unidade_numero
      FROM visitantes v
      JOIN condominios c ON v.condominio_id = c.id
      JOIN unidades u ON v.unidade_id = u.id
      ORDER BY v.id DESC
    `);
    setVisitantes(visList);
  };

  // Actions
  const handleBaixarBoletol = (id: number) => {
    const hoje = new Date().toISOString().slice(0, 10);
    executeSQL("UPDATE financeiro SET status = 'Pago', data_pagamento = ? WHERE id = ?", [hoje, id]);
    refreshAllData();
  };

  const handleConcluirChamado = (id: number) => {
    executeSQL("UPDATE chamados SET status = 'Concluído' WHERE id = ?", [id]);
    refreshAllData();
  };

  const handleDeleteItem = (table: string, id: number) => {
    if (window.confirm(`Tem certeza que deseja excluir o registro #${id} da tabela ${table}?`)) {
      executeSQL(`DELETE FROM ${table} WHERE id = ?`, [id]);
      refreshAllData();
    }
  };

  // Submit Handlers for Modals
  const submitCondo = (e: React.FormEvent) => {
    e.preventDefault();
    const taxa = parseFloat(formCondo.taxa_padrao) || 0;
    executeSQL(
      'INSERT INTO condominios (nome, cnpj, taxa_padrao, endereco, sindico_nome, sindico_contato) VALUES (?, ?, ?, ?, ?, ?)',
      [formCondo.nome, formCondo.cnpj, taxa, formCondo.endereco, formCondo.sindico_nome, formCondo.sindico_contato]
    );
    setFormCondo({ nome: '', cnpj: '', taxa_padrao: '', endereco: '', sindico_nome: '', sindico_contato: '' });
    setActiveModal(null);
    refreshAllData();
  };

  const submitUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const fracao = parseFloat(formUnit.fracao_ideal) || 1.0;
    executeSQL('INSERT INTO unidades (condominio_id, bloco, numero, fracao_ideal) VALUES (?, ?, ?, ?)', [
      formUnit.condominio_id,
      formUnit.bloco,
      formUnit.numero,
      fracao
    ]);
    setFormUnit({ condominio_id: '', bloco: '', numero: '', fracao_ideal: '1.0' });
    setActiveModal(null);
    refreshAllData();
  };

  const submitPessoa = (e: React.FormEvent) => {
    e.preventDefault();
    executeSQL('INSERT INTO pessoas (nome, cpf_cnpj, tipo, email, telefone) VALUES (?, ?, ?, ?, ?)', [
      formPessoa.nome,
      formPessoa.cpf_cnpj,
      formPessoa.tipo,
      formPessoa.email,
      formPessoa.telefone
    ]);
    setFormPessoa({ nome: '', cpf_cnpj: '', tipo: 'Proprietário', email: '', telefone: '' });
    setActiveModal(null);
    refreshAllData();
  };

  const submitFin = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formFin.valor) || 0;
    executeSQL(
      "INSERT INTO financeiro (condominio_id, unidade_id, descricao, valor, data_vencimento, status) VALUES (?, ?, ?, ?, ?, 'Pendente')",
      [formFin.condominio_id, formFin.unidade_id, formFin.descricao, val, formFin.data_vencimento]
    );
    setFormFin({ condominio_id: '', unidade_id: '', descricao: '', valor: '', data_vencimento: '' });
    setActiveModal(null);
    refreshAllData();
  };

  const submitChamado = (e: React.FormEvent) => {
    e.preventDefault();
    executeSQL(
      "INSERT INTO chamados (condominio_id, titulo, prioridade, descricao, status) VALUES (?, ?, ?, ?, 'Aberto')",
      [formChamado.condominio_id, formChamado.titulo, formChamado.prioridade, formChamado.descricao]
    );
    setFormChamado({ condominio_id: '', titulo: '', prioridade: 'Média', descricao: '' });
    setActiveModal(null);
    refreshAllData();
  };

  const submitVisitante = (e: React.FormEvent) => {
    e.preventDefault();
    executeSQL(
      'INSERT INTO visitantes (condominio_id, unidade_id, nome_visitante, documento, veiculo_placa) VALUES (?, ?, ?, ?, ?)',
      [formVis.condominio_id, formVis.unidade_id, formVis.nome_visitante, formVis.documento, formVis.veiculo_placa]
    );
    setFormVis({ condominio_id: '', unidade_id: '', nome_visitante: '', documento: '', veiculo_placa: '' });
    setActiveModal(null);
    refreshAllData();
  };

  // SQL Console Execution
  const handleRunSQL = () => {
    setSqlError(null);
    setSqlOutput(null);
    const queryStr = sqlQuery.trim();
    if (!queryStr) return;

    try {
      if (queryStr.toUpperCase().startsWith('SELECT') || queryStr.toUpperCase().startsWith('PRAGMA')) {
        const res = querySQL(queryStr);
        setSqlOutput(res);
      } else {
        const ok = executeSQL(queryStr);
        if (ok) {
          setSqlOutput({ status: 'Sucesso', mensagem: 'Comando executado e banco persistido com sucesso!' });
          refreshAllData();
        }
      }
    } catch (err: any) {
      setSqlError(err.message || 'Erro de sintaxe SQL.');
    }
  };

  // Gemini AI Assistant Handler
  const handleSendAIMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || aiInputText.trim();
    if (!textToSend) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    if (!customPrompt) setAiInputText('');
    setIsAiLoading(true);

    const systemContext = `
Você é o assistente de IA especialista em condomínios integrado ao banco de dados SQLite "CondoGest".
Responda de forma profissional e direta com base nos dados reais das tabelas SQLite.

DADOS ATUAIS EM TEMPO REAL NO SQLITE:
- Condomínios: ${JSON.stringify(condominios)}
- Lançamentos Financeiros: ${JSON.stringify(financeiro)}
- Chamados Abertos: ${JSON.stringify(chamados.filter((c) => c.status !== 'Concluído'))}
- Pessoas/Condôminos: ${JSON.stringify(pessoas)}
    `;

    try {
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let responseText = '';
      let lastErrorMessage = '';

      for (const model of modelsToTry) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: systemContext + '\n\nPergunta do usuário: ' + textToSend }] }]
              })
            }
          );
          const data = await res.json();
          if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            responseText = data.candidates[0].content.parts[0].text;
            break;
          } else if (data.error?.message) {
            lastErrorMessage = data.error.message;
          }
        } catch (e: any) {
          lastErrorMessage = e.message;
        }
      }

      if (responseText) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: responseText }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'ai', text: '⚠️ Erro da API do Gemini: ' + (lastErrorMessage || 'Não foi possível obter resposta.') }
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: '❌ Erro de conexão com Gemini: ' + err.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Metrics
  const totalCondos = condominios.length;
  const totalUnidades = unidades.length;
  const chamadosAbertos = chamados.filter((c) => c.status !== 'Concluído').length;
  const totalInadimplencia = financeiro
    .filter((f) => f.status === 'Vencido')
    .reduce((acc, f) => acc + (f.valor || 0), 0);

  if (!isReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-600">
        <div className="inline-flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <Database className="w-6 h-6 text-emerald-600 animate-spin" />
          <span className="font-bold text-sm">Carregando Motor WebAssembly SQLite (sql.js)...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1c3220] via-[#24482a] to-[#142618] rounded-2xl p-6 text-white shadow-lg border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                SQLite WebAssembly Engine
              </span>
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <Database className="w-3.5 h-3.5" /> Local Storage Persistent DB
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              ERP Condominial SQLite & Console AI
            </h1>
            <p className="text-emerald-100/80 text-xs mt-1 max-w-2xl">
              Banco de dados relational em memória WebAssembly rodando diretamente no browser com persistência LocalStorage, exportação/importação de arquivos .db e consultas interativas.
            </p>
          </div>

          {/* Quick DB Tools */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={exportDatabaseFile}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Baixar cópia .db do SQLite"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Backup (.db)</span>
            </button>
            <label className="px-3.5 py-2 bg-emerald-900/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/50 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Importar .db</span>
              <input
                type="file"
                accept=".db,.sqlite,.sqlite3"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    importDatabaseFile(e.target.files[0]).then(() => refreshAllData());
                  }
                }}
              />
            </label>
            <button
              onClick={resetSQLiteDatabase}
              className="p-2 bg-emerald-950/60 hover:bg-rose-950/80 text-emerald-300 hover:text-rose-200 border border-emerald-800/60 rounded-xl text-xs transition-all cursor-pointer"
              title="Resetar Banco SQLite"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Buttons for SQLite Module */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'dashboard'
              ? 'bg-[#1c3220] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveSubTab('condominios')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'condominios'
              ? 'bg-[#1c3220] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Condomínios & Unidades</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pessoas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'pessoas'
              ? 'bg-[#1c3220] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Moradores & Proprietários</span>
        </button>

        <button
          onClick={() => setActiveSubTab('financeiro')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'financeiro'
              ? 'bg-[#1c3220] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Financeiro & Boletos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('chamados')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'chamados'
              ? 'bg-[#1c3220] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Manutenção & Chamados</span>
        </button>

        <button
          onClick={() => setActiveSubTab('visitantes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'visitantes'
              ? 'bg-[#1c3220] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Portaria & Visitantes</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sql_console')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'sql_console'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Console SQL</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai_assistant')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ai_assistant'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-purple-50'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>IA Assistente (Gemini)</span>
        </button>
      </div>

      {/* VIEW 1: DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{totalCondos}</div>
                <div className="text-xs font-semibold text-slate-500">Condomínios Ativos</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{totalUnidades}</div>
                <div className="text-xs font-semibold text-slate-500">Unidades / Aptos</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-rose-700 font-mono">{formatarMoeda(totalInadimplencia)}</div>
                <div className="text-xs font-semibold text-slate-500">Total Inadimplência</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{chamadosAbertos}</div>
                <div className="text-xs font-semibold text-slate-500">Chamados Abertos</div>
              </div>
            </div>
          </div>

          {/* Recent Financials */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#1c3220] text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <span>Lançamentos Financeiros Recentes (SQLite)</span>
              </h3>
              <button
                onClick={() => setActiveSubTab('financeiro')}
                className="text-xs font-bold text-[#2d5a32] hover:underline"
              >
                Ver Todos
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">ID</th>
                    <th className="p-3">Condomínio</th>
                    <th className="p-3">Unidade</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financeiro.slice(0, 5).map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-500">#{f.id}</td>
                      <td className="p-3 font-bold text-slate-800">{f.condominio_nome}</td>
                      <td className="p-3 font-medium text-slate-600">Apto {f.unidade_numero}</td>
                      <td className="p-3 font-semibold text-slate-800">{f.descricao}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{formatarMoeda(f.valor)}</td>
                      <td className="p-3 font-mono text-slate-600">{f.data_vencimento}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            f.status === 'Pago'
                              ? 'bg-emerald-100 text-emerald-800'
                              : f.status === 'Vencido'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {f.status !== 'Pago' && (
                          <button
                            onClick={() => handleBaixarBoletol(f.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                          >
                            Baixar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#1c3220] text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <span>Chamados de Manutenção Recentes</span>
              </h3>
              <button
                onClick={() => setActiveSubTab('chamados')}
                className="text-xs font-bold text-[#2d5a32] hover:underline"
              >
                Ver Todos
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">ID</th>
                    <th className="p-3">Condomínio</th>
                    <th className="p-3">Título / Problema</th>
                    <th className="p-3">Prioridade</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chamados.slice(0, 5).map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-500">#{ch.id}</td>
                      <td className="p-3 font-bold text-slate-800">{ch.condominio_nome}</td>
                      <td className="p-3 font-semibold text-slate-800">{ch.titulo}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            ch.prioridade === 'Urgente'
                              ? 'bg-rose-100 text-rose-800'
                              : ch.prioridade === 'Alta'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ch.prioridade}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            ch.status === 'Concluído'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ch.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {ch.data_abertura ? ch.data_abertura.slice(0, 10) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CONDOMÍNIOS & UNIDADES */}
      {activeSubTab === 'condominios' && (
        <div className="space-y-6">
          {/* Condomínios Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#1c3220] text-base">Lista de Condomínios Cadastrados</h3>
              <button
                onClick={() => setActiveModal('condominio')}
                className="px-3 py-2 bg-[#1c3220] hover:bg-[#24482a] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Novo Condomínio
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">ID</th>
                    <th className="p-3">Nome do Condomínio</th>
                    <th className="p-3">CNPJ</th>
                    <th className="p-3">Endereço</th>
                    <th className="p-3">Síndico / Contato</th>
                    <th className="p-3">Taxa Padrão</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {condominios.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-500">#{c.id}</td>
                      <td className="p-3 font-bold text-slate-900">{c.nome}</td>
                      <td className="p-3 font-mono">{c.cnpj || 'N/I'}</td>
                      <td className="p-3">{c.endereco || 'N/I'}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{c.sindico_nome || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500">{c.sindico_contato || ''}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{formatarMoeda(c.taxa_padrao || 0)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteItem('condominios', c.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unidades Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#1c3220] text-base">Unidades / Apartamentos</h3>
              <button
                onClick={() => setActiveModal('unidade')}
                className="px-3 py-2 bg-[#1c3220] hover:bg-[#24482a] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Nova Unidade
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">ID</th>
                    <th className="p-3">Condomínio</th>
                    <th className="p-3">Bloco / Torre</th>
                    <th className="p-3">Número</th>
                    <th className="p-3">Fração Ideal</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unidades.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-500">#{u.id}</td>
                      <td className="p-3 font-bold text-slate-800">{u.condominio_nome}</td>
                      <td className="p-3 font-medium text-slate-600">{u.bloco || 'Geral'}</td>
                      <td className="p-3 font-bold text-slate-900">Apto {u.numero}</td>
                      <td className="p-3 font-mono text-slate-700">{u.fracao_ideal || 1.0}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteItem('unidades', u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MORADORES & PROPRIETÁRIOS */}
      {activeSubTab === 'pessoas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1c3220] text-base">Proprietários, Inquilinos e Moradores</h3>
            <button
              onClick={() => setActiveModal('pessoa')}
              className="px-3 py-2 bg-[#1c3220] hover:bg-[#24482a] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Novo Cadastrado
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Nome Completo</th>
                  <th className="p-3">CPF / CNPJ</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pessoas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-500">#{p.id}</td>
                    <td className="p-3 font-bold text-slate-900">{p.nome}</td>
                    <td className="p-3 font-mono">{p.cpf_cnpj || 'N/I'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-[10px]">
                        {p.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{p.email || 'N/I'}</td>
                    <td className="p-3 font-mono text-slate-700">{p.telefone || 'N/I'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteItem('pessoas', p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: FINANCEIRO & BOLETOS */}
      {activeSubTab === 'financeiro' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1c3220] text-base">Lançamentos Financeiros e Baixas em SQLite</h3>
            <button
              onClick={() => setActiveModal('financeiro')}
              className="px-3 py-2 bg-[#1c3220] hover:bg-[#24482a] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Condomínio</th>
                  <th className="p-3">Unidade</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Vencimento</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Data Pagamento</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financeiro.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-500">#{f.id}</td>
                    <td className="p-3 font-bold text-slate-800">{f.condominio_nome}</td>
                    <td className="p-3 font-medium text-slate-600">Apto {f.unidade_numero}</td>
                    <td className="p-3 font-semibold text-slate-900">{f.descricao}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{formatarMoeda(f.valor)}</td>
                    <td className="p-3 font-mono text-slate-600">{f.data_vencimento}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          f.status === 'Pago'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.status === 'Vencido'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{f.data_pagamento || '-'}</td>
                    <td className="p-3 text-right space-x-1">
                      {f.status !== 'Pago' && (
                        <button
                          onClick={() => handleBaixarBoletol(f.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Baixar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteItem('financeiro', f.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 5: MANUTENÇÃO & CHAMADOS */}
      {activeSubTab === 'chamados' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1c3220] text-base">Chamados de Manutenção e Ocorrências</h3>
            <button
              onClick={() => setActiveModal('chamado')}
              className="px-3 py-2 bg-[#1c3220] hover:bg-[#24482a] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Abrir Chamado
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Condomínio</th>
                  <th className="p-3">Título / Problema</th>
                  <th className="p-3">Prioridade</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Data</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chamados.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-500">#{ch.id}</td>
                    <td className="p-3 font-bold text-slate-800">{ch.condominio_nome}</td>
                    <td className="p-3 font-semibold text-slate-900">{ch.titulo}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          ch.prioridade === 'Urgente'
                            ? 'bg-rose-100 text-rose-800'
                            : ch.prioridade === 'Alta'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ch.prioridade}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          ch.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{ch.data_abertura?.slice(0, 10)}</td>
                    <td className="p-3 text-right space-x-1">
                      {ch.status !== 'Concluído' && (
                        <button
                          onClick={() => handleConcluirChamado(ch.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Concluir
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteItem('chamados', ch.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 6: PORTARIA & VISITANTES */}
      {activeSubTab === 'visitantes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1c3220] text-base">Portaria e Registro de Visitantes</h3>
            <button
              onClick={() => setActiveModal('visitante')}
              className="px-3 py-2 bg-[#1c3220] hover:bg-[#24482a] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Visitante
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Condomínio</th>
                  <th className="p-3">Unidade</th>
                  <th className="p-3">Nome Visitante</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Veículo / Placa</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitantes.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-500">#{v.id}</td>
                    <td className="p-3 font-bold text-slate-800">{v.condominio_nome}</td>
                    <td className="p-3 font-medium text-slate-600">Apto {v.unidade_numero}</td>
                    <td className="p-3 font-bold text-slate-900">{v.nome_visitante}</td>
                    <td className="p-3 font-mono">{v.documento || 'N/I'}</td>
                    <td className="p-3 font-mono text-slate-700">{v.veiculo_placa || 'Sem veículo'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteItem('visitantes', v.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 7: CONSOLE SQLITE INTERATIVO */}
      {activeSubTab === 'sql_console' && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-amber-400">Console Interativo SQLite WASM</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Motor: sql.js WebAssembly</span>
          </div>

          <p className="text-xs text-slate-300">
            Execute consultas SQL diretas (SELECT, INSERT, UPDATE, DELETE) no arquivo SQLite salvo localmente.
          </p>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSqlQuery('SELECT * FROM condominios;')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono rounded-lg cursor-pointer"
            >
              SELECT * FROM condominios
            </button>
            <button
              onClick={() => setSqlQuery('SELECT * FROM financeiro;')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono rounded-lg cursor-pointer"
            >
              SELECT * FROM financeiro
            </button>
            <button
              onClick={() => setSqlQuery('SELECT * FROM chamados;')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono rounded-lg cursor-pointer"
            >
              SELECT * FROM chamados
            </button>
            <button
              onClick={() => setSqlQuery('SELECT * FROM pessoas;')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono rounded-lg cursor-pointer"
            >
              SELECT * FROM pessoas
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              rows={4}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full p-3 bg-slate-950 font-mono text-xs text-emerald-400 rounded-xl border border-slate-800 focus:ring-2 focus:ring-amber-500 outline-hidden"
              placeholder="Digite seu SQL aqui..."
            />
            <button
              onClick={handleRunSQL}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Terminal className="w-4 h-4" /> Executar Consulta SQL
            </button>
          </div>

          {/* Output Renderer */}
          {sqlError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono rounded-xl">
              ❌ {sqlError}
            </div>
          )}

          {sqlOutput && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2 max-h-96 overflow-y-auto">
              <span className="text-amber-400 font-bold block mb-2">Resultado da Consulta:</span>
              <pre className="text-emerald-300 whitespace-pre-wrap">{JSON.stringify(sqlOutput, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* VIEW 8: IA ASSISTENTE GEMINI */}
      {activeSubTab === 'ai_assistant' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-bold text-[#1c3220] text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>IA Assistente de Condomínios (Google AI Studio)</span>
              </h3>
              <p className="text-xs text-slate-500">Conectado diretamente ao seu banco de dados SQLite local</p>
            </div>

            {/* API Key configuration */}
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Chave API Gemini"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  localStorage.setItem('gemini_api_key', e.target.value);
                }}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono w-48"
              />
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex gap-2 flex-wrap text-xs">
            <button
              onClick={() =>
                handleSendAIMessage('Faça um resumo detalhado da saúde financeira dos condomínios no SQLite.')
              }
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 cursor-pointer"
            >
              💡 Análise Financeira
            </button>
            <button
              onClick={() =>
                handleSendAIMessage('Escreva um modelo de comunicado amigável de cobrança via WhatsApp para moradores.')
              }
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 cursor-pointer"
            >
              💡 Gerar Comunicado de Cobrança
            </button>
            <button
              onClick={() =>
                handleSendAIMessage('Liste os chamados de manutenção mais urgentes no banco e sugira prioridades.')
              }
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 cursor-pointer"
            >
              💡 Relatório de Manutenção
            </button>
          </div>

          {/* Chat Window */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 h-96 overflow-y-auto space-y-3 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl max-w-xl ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-[#1c3220] text-white font-medium'
                    : 'mr-auto bg-white border border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isAiLoading && (
              <div className="p-3 bg-purple-50 text-purple-800 font-bold rounded-2xl border border-purple-200 w-fit">
                🤖 Pensando e analisando dados do SQLite...
              </div>
            )}
          </div>

          {/* Send Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Pergunte algo sobre os condomínios, boletos ou manutenções do banco SQLite..."
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAIMessage()}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 outline-hidden font-medium"
            />
            <button
              onClick={() => handleSendAIMessage()}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" /> Enviar
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* Modal Add Condominio */}
      {activeModal === 'condominio' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#1c3220] text-base">Cadastrar Novo Condomínio no SQLite</h3>
            <form onSubmit={submitCondo} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Nome do Condomínio *"
                value={formCondo.nome}
                onChange={(e) => setFormCondo({ ...formCondo, nome: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                placeholder="CNPJ"
                value={formCondo.cnpj}
                onChange={(e) => setFormCondo({ ...formCondo, cnpj: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Taxa Padrão (R$)"
                value={formCondo.taxa_padrao}
                onChange={(e) => setFormCondo({ ...formCondo, taxa_padrao: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                placeholder="Endereço Completo"
                value={formCondo.endereco}
                onChange={(e) => setFormCondo({ ...formCondo, endereco: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                placeholder="Nome do Síndico"
                value={formCondo.sindico_nome}
                onChange={(e) => setFormCondo({ ...formCondo, sindico_nome: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                placeholder="Contato do Síndico (Telefone)"
                value={formCondo.sindico_contato}
                onChange={(e) => setFormCondo({ ...formCondo, sindico_contato: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#1c3220] text-white font-bold rounded-xl">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Unidade */}
      {activeModal === 'unidade' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#1c3220] text-base">Cadastrar Nova Unidade no SQLite</h3>
            <form onSubmit={submitUnit} className="space-y-3 text-xs">
              <select
                required
                value={formUnit.condominio_id}
                onChange={(e) => setFormUnit({ ...formUnit, condominio_id: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="">Selecione o Condomínio *</option>
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Bloco / Torre (Ex: Bloco A)"
                value={formUnit.bloco}
                onChange={(e) => setFormUnit({ ...formUnit, bloco: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                required
                placeholder="Número da Unidade / Apto *"
                value={formUnit.numero}
                onChange={(e) => setFormUnit({ ...formUnit, numero: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Fração Ideal (Padrão: 1.0)"
                value={formUnit.fracao_ideal}
                onChange={(e) => setFormUnit({ ...formUnit, fracao_ideal: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#1c3220] text-white font-bold rounded-xl">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Pessoa */}
      {activeModal === 'pessoa' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#1c3220] text-base">Cadastrar Morador / Proprietário no SQLite</h3>
            <form onSubmit={submitPessoa} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Nome Completo *"
                value={formPessoa.nome}
                onChange={(e) => setFormPessoa({ ...formPessoa, nome: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                placeholder="CPF / CNPJ"
                value={formPessoa.cpf_cnpj}
                onChange={(e) => setFormPessoa({ ...formPessoa, cpf_cnpj: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <select
                value={formPessoa.tipo}
                onChange={(e) => setFormPessoa({ ...formPessoa, tipo: e.target.value as any })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="Proprietário">Proprietário</option>
                <option value="Inquilino">Inquilino</option>
                <option value="Morador">Morador</option>
              </select>
              <input
                type="email"
                placeholder="E-mail"
                value={formPessoa.email}
                onChange={(e) => setFormPessoa({ ...formPessoa, email: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                placeholder="Telefone / WhatsApp"
                value={formPessoa.telefone}
                onChange={(e) => setFormPessoa({ ...formPessoa, telefone: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#1c3220] text-white font-bold rounded-xl">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Financeiro */}
      {activeModal === 'financeiro' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#1c3220] text-base">Novo Lançamento Financeiro no SQLite</h3>
            <form onSubmit={submitFin} className="space-y-3 text-xs">
              <select
                required
                value={formFin.condominio_id}
                onChange={(e) => setFormFin({ ...formFin, condominio_id: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="">Selecione o Condomínio *</option>
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>

              <select
                required
                value={formFin.unidade_id}
                onChange={(e) => setFormFin({ ...formFin, unidade_id: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="">Selecione a Unidade *</option>
                {unidades
                  .filter((u) => !formFin.condominio_id || String(u.condominio_id) === String(formFin.condominio_id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.bloco ? u.bloco + ' - ' : ''}Apto {u.numero}
                    </option>
                  ))}
              </select>

              <input
                type="text"
                required
                placeholder="Descrição (Ex: Cota Condominial Agosto/2026) *"
                value={formFin.descricao}
                onChange={(e) => setFormFin({ ...formFin, descricao: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="number"
                step="0.01"
                required
                placeholder="Valor (R$) *"
                value={formFin.valor}
                onChange={(e) => setFormFin({ ...formFin, valor: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="date"
                required
                value={formFin.data_vencimento}
                onChange={(e) => setFormFin({ ...formFin, data_vencimento: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#1c3220] text-white font-bold rounded-xl">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Chamado */}
      {activeModal === 'chamado' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#1c3220] text-base">Abrir Chamado no SQLite</h3>
            <form onSubmit={submitChamado} className="space-y-3 text-xs">
              <select
                required
                value={formChamado.condominio_id}
                onChange={(e) => setFormChamado({ ...formChamado, condominio_id: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="">Selecione o Condomínio *</option>
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Título do Chamado *"
                value={formChamado.titulo}
                onChange={(e) => setFormChamado({ ...formChamado, titulo: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <select
                value={formChamado.prioridade}
                onChange={(e) => setFormChamado({ ...formChamado, prioridade: e.target.value as any })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="Baixa">Prioridade: Baixa</option>
                <option value="Média">Prioridade: Média</option>
                <option value="Alta">Prioridade: Alta</option>
                <option value="Urgente">Prioridade: Urgente</option>
              </select>
              <textarea
                rows={3}
                placeholder="Descrição detalhada do problema..."
                value={formChamado.descricao}
                onChange={(e) => setFormChamado({ ...formChamado, descricao: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#1c3220] text-white font-bold rounded-xl">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Visitante */}
      {activeModal === 'visitante' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#1c3220] text-base">Registrar Visitante na Portaria (SQLite)</h3>
            <form onSubmit={submitVisitante} className="space-y-3 text-xs">
              <select
                required
                value={formVis.condominio_id}
                onChange={(e) => setFormVis({ ...formVis, condominio_id: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="">Selecione o Condomínio *</option>
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <select
                required
                value={formVis.unidade_id}
                onChange={(e) => setFormVis({ ...formVis, unidade_id: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="">Selecione a Unidade Visitada *</option>
                {unidades
                  .filter((u) => !formVis.condominio_id || String(u.condominio_id) === String(formVis.condominio_id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.bloco ? u.bloco + ' - ' : ''}Apto {u.numero}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                required
                placeholder="Nome do Visitante *"
                value={formVis.nome_visitante}
                onChange={(e) => setFormVis({ ...formVis, nome_visitante: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                placeholder="Documento (RG / CPF)"
                value={formVis.documento}
                onChange={(e) => setFormVis({ ...formVis, documento: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
              <input
                type="text"
                placeholder="Placa do Veículo (Se houver)"
                value={formVis.veiculo_placa}
                onChange={(e) => setFormVis({ ...formVis, veiculo_placa: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#1c3220] text-white font-bold rounded-xl">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
