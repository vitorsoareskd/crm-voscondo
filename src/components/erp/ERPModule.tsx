import React, { useState } from 'react';
import { Condominio, Inadimplente, TarefaGantt, TarefaEquipe, Fornecedor } from '../../types';
import { calcularSaudeCondominio, formatarMoeda } from '../../utils/pricingEngine';
import { CondominioModal } from './CondominioModal';
import { InadimplenciaSection } from './InadimplenciaSection';
import { GanttSection } from './GanttSection';
import { TasksSection } from './TasksSection';
import { FornecedoresSection } from './FornecedoresSection';
import { RelatoriosSection } from './RelatoriosSection';
import { CompliancePanel } from './CompliancePanel';

import { ContratosAlertas } from './ContratosAlertas';
import { Table, Plus, Download, Upload, Search, Edit3, Trash2, Eye, EyeOff, Activity, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface ERPModuleProps {
  condominios: Condominio[];
  setCondominios: React.Dispatch<React.SetStateAction<Condominio[]>>;
  inadimplentes: Inadimplente[];
  setInadimplentes: React.Dispatch<React.SetStateAction<Inadimplente[]>>;
  tarefasGantt: TarefaGantt[];
  setTarefasGantt: React.Dispatch<React.SetStateAction<TarefaGantt[]>>;
  tarefasEquipe: TarefaEquipe[];
  setTarefasEquipe: React.Dispatch<React.SetStateAction<TarefaEquipe[]>>;
  fornecedores: Fornecedor[];
  setFornecedores: React.Dispatch<React.SetStateAction<Fornecedor[]>>;
  agenda: any[];
  setAgenda: React.Dispatch<React.SetStateAction<any[]>>;
  subTab: string;
}

export const ERPModule: React.FC<ERPModuleProps> = ({
  condominios,
  setCondominios,
  inadimplentes,
  setInadimplentes,
  tarefasGantt,
  setTarefasGantt,
  tarefasEquipe,
  setTarefasEquipe,
  fornecedores,
  setFornecedores,
  agenda,
  setAgenda,
  subTab
}) => {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [editingCondo, setEditingCondo] = useState<Condominio | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveCondo = (condo: Condominio) => {
    setCondominios((prev) => {
      const exists = prev.some((c) => c.id === condo.id);
      if (exists) {
        return prev.map((c) => (c.id === condo.id ? condo : c));
      }
      return [condo, ...prev];
    });
    setEditingCondo(null);
    setIsCreating(false);
  };

  // Delete Modal State
  const [condoParaExcluir, setCondoParaExcluir] = useState<{ id: string; nome: string } | null>(null);

  const handleDeleteCondo = (id: string) => {
    const condo = condominios.find((c) => c.id === id);
    if (condo) {
      setCondoParaExcluir({ id, nome: condo.nome });
    }
  };

  const confirmarExclusaoCondo = () => {
    if (condoParaExcluir) {
      setCondominios((prev) => prev.filter((c) => c.id !== condoParaExcluir.id));
      setCondoParaExcluir(null);
    }
  };

  // CSV Export matching user's exact spreadsheet header
  const handleExportCSV = () => {
    const headers = [
      'ID Condominio',
      'Status',
      'Nome do Condominio',
      'CNPJ',
      'Numero de Unidades',
      'Endereço',
      'Sindico Responsavel',
      'Email do Condominio',
      'numero do condominio',
      'banco',
      'agencia e conta',
      'senha',
      'saude do condominio',
      'livre caixa do condominio',
      'fundo obras',
      'fundo pintura',
      'fundo reforma',
      'gasto medio do condo',
      'rendimento medio do condo',
      'data ultima alteracao caixa',
      'frase livre caixa',
      'frase fundo obras',
      'frase fundo pintura',
      'frase fundo reforma',
      'nota livre caixa',
      'nota fundo obras',
      'nota fundo pintura',
      'nota fundo reforma'
    ];

    const rows = condominios.map((c) => {
      const saude = calcularSaudeCondominio(
        c.livreCaixa,
        c.fundoObras,
        c.fundoPintura,
        c.fundoReforma,
        c.gastoMedioMensal
      );
      return [
        c.id,
        c.status,
        `"${c.nome}"`,
        c.cnpj,
        c.unidades,
        `"${c.endereco}"`,
        `"${c.sindicoResponsavel}"`,
        c.emailCondominio,
        c.numeroCondominio,
        c.banco,
        `"${c.agenciaEConta}"`,
        c.senhaBanco || '',
        saude.score,
        c.livreCaixa,
        c.fundoObras,
        c.fundoPintura,
        c.fundoReforma,
        c.gastoMedioMensal,
        c.rendimentoMedioMensal,
        `"${c.dataUltimaAlteracaoCaixa || ''}"`,
        `"${c.fraseLivreCaixa || ''}"`,
        `"${c.fraseFundoObras || ''}"`,
        `"${c.fraseFundoPintura || ''}"`,
        `"${c.fraseFundoReforma || ''}"`,
        c.notaLivreCaixa || 0,
        c.notaFundoObras || 0,
        c.notaFundoPintura || 0,
        c.notaFundoReforma || 0
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VOS_Condominios_ERP_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const condominiosFiltrados = condominios.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.cnpj.includes(busca) ||
      c.sindicoResponsavel.toLowerCase().includes(busca.toLowerCase()) ||
      c.id.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFiltro === 'todos' || c.status === statusFiltro;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* SubTab 1: Cadastro Planilha */}
      {subTab === 'cadastro' && (
        <div className="space-y-6">
          {/* Top Bar Actions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1c3220] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#2d5a32]" />
                <span>2.1 Perfil Completo do Cliente (Planilha do Condomínio)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Cadastro centralizado de contas, senhas bancárias e saldos operacionais
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-[#2d5a32]" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={() => setIsCreating(true)}
                className="bg-[#2d5a32] hover:bg-[#1f4223] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Condomínio</span>
              </button>
            </div>
          </div>

          {/* Quick Pull / Sync CRM Finalized Items by ID */}
          <div className="bg-[#e8f0e6] p-4 rounded-2xl border border-[#2d5a32]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2d5a32] text-white rounded-xl shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1c3220] text-xs uppercase tracking-wider">
                  Puxar Dados de Item Finalizado no CRM por ID (Bloco 2)
                </h3>
                <p className="text-[11px] text-slate-600">
                  Selecione o ID de um condomínio finalizado para carregar/editar seu perfil completo com as mensalidades e dados precificados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId) {
                    const condo = condominios.find((c) => c.id === selectedId);
                    if (condo) {
                      setEditingCondo(condo);
                    }
                  }
                }}
                className="p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-[#2d5a32] shadow-2xs w-full md:w-80"
              >
                <option value="">-- Puxar Perfil por ID do Condomínio --</option>
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.id}] {c.nome} ({c.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ContratosAlertas />

          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, CNPJ, síndico ou ID..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Filtrar Status:</span>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="p-2 border rounded-xl font-medium bg-slate-50"
              >
                <option value="todos">Todos ({condominios.length})</option>
                <option value="Cliente Fidelizado">Cliente Fidelizado</option>
                <option value="Em transição">Em transição</option>
                <option value="Cotação">Cotação</option>
                <option value="Interessado">Interessado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>
          </div>

          {/* Planilha Grid / Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#1c3220] text-white font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3 border-b border-[#2d5a32]">ID / Condomínio</th>
                    <th className="p-3 border-b border-[#2d5a32]">Status</th>
                    <th className="p-3 border-b border-[#2d5a32]">Un.</th>
                    <th className="p-3 border-b border-[#2d5a32]">Síndico & Contato</th>
                    <th className="p-3 border-b border-[#2d5a32]">Banco & Dados Bancários</th>
                    <th className="p-3 border-b border-[#2d5a32]">2.2 Saúde Financeira</th>
                    <th className="p-3 border-b border-[#2d5a32]">Reserva Total</th>
                    <th className="p-3 border-b border-[#2d5a32] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {condominiosFiltrados.map((c) => {
                    const saude = calcularSaudeCondominio(
                      c.livreCaixa,
                      c.fundoObras,
                      c.fundoPintura,
                      c.fundoReforma,
                      c.gastoMedioMensal
                    );

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <span className="font-mono text-[10px] text-slate-400 font-bold block">{c.id}</span>
                          <span className="font-bold text-slate-900 text-sm">{c.nome}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">CNPJ: {c.cnpj}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                              c.status === 'Cliente Fidelizado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'Em transição'
                                ? 'bg-blue-100 text-blue-800'
                                : c.status === 'Cotação'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{c.unidades} un</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{c.sindicoResponsavel}</span>
                          <span className="text-[11px] text-slate-500">{c.numeroCondominio}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{c.banco}</span>
                          <span className="font-mono text-[11px] text-slate-600 block">{c.agenciaEConta}</span>
                          {c.senhaBanco && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500">
                                {revealedPasswords[c.id] ? c.senhaBanco : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePassword(c.id)}
                                className="text-slate-400 hover:text-emerald-700 p-0.5"
                              >
                                {revealedPasswords[c.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs shrink-0"
                              style={{ backgroundColor: saude.cor }}
                            >
                              {saude.score}
                            </span>
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">{saude.status}</span>
                              <span className="text-[10px] text-slate-500 font-mono block">{saude.ratio.toFixed(1)}x gasto</span>
                              {c.dataUltimaAlteracaoCaixa && (
                                <span className="text-[9px] text-slate-400 block font-mono mt-0.5">
                                  Alt: {c.dataUltimaAlteracaoCaixa}
                                  {c.historicoCaixa && c.historicoCaixa.length > 0 && (
                                    <span className="ml-1 text-[9px] text-[#2d5a32] bg-[#e8f0e6] font-bold px-1 rounded-xs">
                                      ({c.historicoCaixa.length} reg)
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-[#2d5a32]">
                          {formatarMoeda(saude.saldoTotal)}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => setEditingCondo(c)}
                            title="Editar Perfil Completo"
                            className="p-1.5 bg-slate-100 hover:bg-[#2d5a32] hover:text-white rounded-lg text-slate-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCondo(c.id)}
                            title="Remover"
                            className="p-1.5 bg-slate-100 hover:bg-red-600 hover:text-white rounded-lg text-slate-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <CompliancePanel />
        </div>
      )}

      {/* SubTab 2: Inadimplência */}
      {subTab === 'inadimplencia' && (
        <InadimplenciaSection
          inadimplentes={inadimplentes}
          setInadimplentes={setInadimplentes}
          condominios={condominios}
        />
      )}

      {/* SubTab 3: Gantt */}
      {subTab === 'gantt' && (
        <GanttSection
          tarefas={tarefasGantt}
          setTarefas={setTarefasGantt}
          condominios={condominios}
        />
      )}

      {/* SubTab 4: Tarefas Equipe */}
      {subTab === 'tarefas' && (
        <TasksSection
          tarefas={tarefasEquipe}
          setTarefas={setTarefasEquipe}
          agenda={agenda}
          setAgenda={setAgenda}
          condominios={condominios}
        />
      )}

      {/* SubTab 5: Fornecedores & Ranking */}
      {subTab === 'fornecedores' && (
        <FornecedoresSection
          fornecedores={fornecedores}
          setFornecedores={setFornecedores}
          condominios={condominios}
        />
      )}

      {/* SubTab 6: Relatórios Financeiros e Rateio */}
      {subTab === 'relatorios' && (
        <RelatoriosSection condominios={condominios} />
      )}



      {/* Editing / Creating Modal */}
      {(editingCondo || isCreating) && (
        <CondominioModal
          condominio={editingCondo}
          allCondominios={condominios}
          onSave={handleSaveCondo}
          onClose={() => {
            setEditingCondo(null);
            setIsCreating(false);
          }}
        />
      )}

      {/* Modal Confirm Condominio Exclusion */}
      {condoParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Remover Condomínio?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deseja realmente remover o condomínio <strong className="text-slate-800">"{condoParaExcluir.nome}"</strong> do ERP?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCondoParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoCondo}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
