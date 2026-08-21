import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  FileText,
  ShieldCheck,
  RotateCcw,
  Receipt,
  X
} from 'lucide-react';
import { formatarMoeda } from '../../utils/pricingEngine';

export interface ItemComposicao {
  id: string;
  nome: string;
  valor: number;
  isImposto?: boolean;
}

const INITIAL_RENDIMENTOS: ItemComposicao[] = [
  { id: 'r1', nome: 'Taxa de Administração Base (Condomínios)', valor: 35000 },
  { id: 'r2', nome: 'Gestão de Serviços Extras e Obras', valor: 8500 },
  { id: 'r3', nome: 'Honorários de Síndico Profissional VOS', valor: 6000 },
  { id: 'r4', nome: 'Comissões de Parceiros / Fornecedores', valor: 2500 },
];

const INITIAL_GASTOS: ItemComposicao[] = [
  { id: 'g1', nome: 'Folha de Pagamento & Equipe Operacional', valor: 14500, isImposto: false },
  { id: 'g2', nome: 'Licenças de Software, ERP & Telefonia', valor: 3200, isImposto: false },
  { id: 'g3', nome: 'Imposto Simples Nacional (Tributos)', valor: 3800, isImposto: true },
  { id: 'g4', nome: 'ISS e Taxas Municipais (Impostos)', valor: 1200, isImposto: true },
  { id: 'g5', nome: 'Assessoria Contábil & Jurídica', valor: 2500, isImposto: false },
  { id: 'g6', nome: 'Marketing & Comercial VOS', valor: 1800, isImposto: false },
];

export const SaudeAdministradoraSection: React.FC = () => {
  // Local state persisted in localStorage
  const [rendimentos, setRendimentos] = useState<ItemComposicao[]>(() => {
    try {
      const saved = localStorage.getItem('vos_saude_rendimentos');
      return saved ? JSON.parse(saved) : INITIAL_RENDIMENTOS;
    } catch {
      return INITIAL_RENDIMENTOS;
    }
  });

  const [gastos, setGastos] = useState<ItemComposicao[]>(() => {
    try {
      const saved = localStorage.getItem('vos_saude_gastos');
      return saved ? JSON.parse(saved) : INITIAL_GASTOS;
    } catch {
      return INITIAL_GASTOS;
    }
  });

  // Audit modal state
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('vos_saude_rendimentos', JSON.stringify(rendimentos));
  }, [rendimentos]);

  useEffect(() => {
    localStorage.setItem('vos_saude_gastos', JSON.stringify(gastos));
  }, [gastos]);

  // Calculations
  const totalGanhos = rendimentos.reduce((acc, r) => acc + (r.valor || 0), 0);
  const totalDespesas = gastos.reduce((acc, g) => acc + (g.valor || 0), 0);
  const totalImpostos = gastos
    .filter((g) => g.isImposto)
    .reduce((acc, g) => acc + (g.valor || 0), 0);

  const lucroLiquido = totalGanhos - totalDespesas;
  const margemLucro = totalGanhos > 0 ? (lucroLiquido / totalGanhos) * 100 : 0;
  const roiProjetado = totalDespesas > 0 ? (lucroLiquido / totalDespesas) * 100 : 0;

  // Reset handler
  const handleReset = () => {
    if (window.confirm('Deseja restaurar os dados originais da Saúde da Administradora?')) {
      setRendimentos(INITIAL_RENDIMENTOS);
      setGastos(INITIAL_GASTOS);
    }
  };

  // Inline updates for Rendimentos
  const updateRendimento = (id: string, field: 'nome' | 'valor', value: string | number) => {
    setRendimentos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Add new empty row to Rendimentos
  const handleAddLinhaRendimento = () => {
    const newItem: ItemComposicao = {
      id: `r_${Date.now()}`,
      nome: '',
      valor: 0
    };
    setRendimentos([...rendimentos, newItem]);
  };

  const handleRemoveRendimento = (id: string) => {
    setRendimentos((prev) => prev.filter((r) => r.id !== id));
  };

  // Inline updates for Gastos
  const updateGasto = (id: string, field: 'nome' | 'valor' | 'isImposto', value: string | number | boolean) => {
    setGastos((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  // Add new empty row to Gastos
  const handleAddLinhaGasto = () => {
    const newItem: ItemComposicao = {
      id: `g_${Date.now()}`,
      nome: '',
      valor: 0,
      isImposto: false
    };
    setGastos([...gastos, newItem]);
  };

  const handleRemoveGasto = (id: string) => {
    setGastos((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-[#1c3220] to-[#25482e] rounded-2xl p-6 text-white shadow-lg border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Módulo Livre & Auditável
              </span>
              <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Auditoria Ativa
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Projeção — Saúde VOS
            </h1>
            <p className="text-emerald-100/80 text-xs mt-1 max-w-2xl">
              Análise autônoma de receitas, custos operacionais e impostos. Preencha e edite diretamente as colunas Nome e Valor de cada quadrante abaixo. As alterações recalculam automaticamente os indicadores auditáveis.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ver Detalhamento Auditável</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-emerald-900/60 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-700/50 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Restaurar valores padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main Auditable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Estimado Ganhos */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Total Estimado Ganhos</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight font-mono">
            {formatarMoeda(totalGanhos)}
          </div>
          <div className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
            <span>{rendimentos.length} linhas de rendimento</span>
          </div>
        </div>

        {/* Card 2: Total Estimado Despesa */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Total Estimado Despesa</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight font-mono">
            {formatarMoeda(totalDespesas)}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Gastos operacionais + tributos
          </div>
        </div>

        {/* Card 3: Impostos Pagos / Previsto */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Impostos Pagos / Previsto</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 tracking-tight font-mono">
            {formatarMoeda(totalImpostos)}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {totalGanhos > 0 ? `~${((totalImpostos / totalGanhos) * 100).toFixed(1)}% dos ganhos` : '0% dos ganhos'}
          </div>
        </div>

        {/* Card 4: Margem de Lucro */}
        <div className={`bg-white rounded-2xl p-4 border shadow-xs transition-all ${
          lucroLiquido >= 0 ? 'border-slate-200 hover:border-emerald-500/50' : 'border-rose-300 bg-rose-50/20'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Margem de Lucro</span>
            <div className={`p-2 rounded-xl ${lucroLiquido >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-black tracking-tight font-mono ${lucroLiquido >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {margemLucro.toFixed(1)}%
          </div>
          <div className="text-[11px] font-semibold text-slate-600 mt-1">
            Lucro: <strong className="font-mono">{formatarMoeda(lucroLiquido)}</strong>
          </div>
        </div>
      </div>

      {/* Two Quadrants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quadrante 1: Composição dos Rendimentos Estimados */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Quadrant Header */}
            <div className="p-5 border-b border-slate-100 bg-emerald-50/40 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-[#1c3220] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Composição dos Rendimentos Estimados
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Edite diretamente o Nome e Valor de cada linha abaixo
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Ganhos</span>
                  <span className="text-base font-black text-emerald-700 font-mono">{formatarMoeda(totalGanhos)}</span>
                </div>
                <button
                  onClick={handleAddLinhaRendimento}
                  className="px-3 py-2 bg-[#1c3220] hover:bg-[#25482e] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Criar mais linhas nesta coluna"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Linha</span>
                </button>
              </div>
            </div>

            {/* Editable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-4">Nome do Rendimento</th>
                    <th className="p-3 text-right w-44">Valor (R$)</th>
                    <th className="p-3 text-center w-14">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rendimentos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-400 italic">
                        Nenhum rendimento cadastrado. Clique no botão acima para adicionar uma linha.
                      </td>
                    </tr>
                  ) : (
                    rendimentos.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Coluna 1: Nome (Editável) */}
                        <td className="p-2.5 pl-4">
                          <input
                            type="text"
                            placeholder={`Ex: Rendimento ${idx + 1}`}
                            value={r.nome}
                            onChange={(e) => updateRendimento(r.id, 'nome', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs"
                          />
                        </td>

                        {/* Coluna 2: Valor (Editável) */}
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            step="any"
                            placeholder="0,00"
                            value={r.valor || ''}
                            onChange={(e) =>
                              updateRendimento(r.id, 'valor', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-800 font-bold font-mono text-right focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs"
                          />
                        </td>

                        {/* Coluna Ação */}
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveRendimento(r.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover linha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quadrant Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <button
              onClick={handleAddLinhaRendimento}
              className="text-[#2d5a32] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar outra linha</span>
            </button>
            <span className="text-emerald-700 font-black text-sm font-mono">{formatarMoeda(totalGanhos)}</span>
          </div>
        </div>

        {/* Quadrante 2: Composição dos Gastos & Impostos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Quadrant Header */}
            <div className="p-5 border-b border-slate-100 bg-rose-50/40 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-[#1c3220] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Composição dos Gastos & Impostos
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Edite o Nome, Valor e marque se é Imposto diretamente
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Gastos</span>
                  <span className="text-base font-black text-rose-700 font-mono">{formatarMoeda(totalDespesas)}</span>
                </div>
                <button
                  onClick={handleAddLinhaGasto}
                  className="px-3 py-2 bg-[#1c3220] hover:bg-[#25482e] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Criar mais linhas nesta coluna"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Linha</span>
                </button>
              </div>
            </div>

            {/* Editable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-4">Nome do Gasto / Imposto</th>
                    <th className="p-3 text-center w-24">Imposto?</th>
                    <th className="p-3 text-right w-36">Valor (R$)</th>
                    <th className="p-3 text-center w-14">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gastos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                        Nenhum gasto cadastrado. Clique no botão acima para adicionar uma linha.
                      </td>
                    </tr>
                  ) : (
                    gastos.map((g, idx) => (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Coluna 1: Nome (Editável) */}
                        <td className="p-2.5 pl-4">
                          <input
                            type="text"
                            placeholder={`Ex: Gasto ${idx + 1}`}
                            value={g.nome}
                            onChange={(e) => updateGasto(g.id, 'nome', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs"
                          />
                        </td>

                        {/* Coluna Tipo Imposto Checkbox */}
                        <td className="p-2.5 text-center">
                          <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!g.isImposto}
                              onChange={(e) => updateGasto(g.id, 'isImposto', e.target.checked)}
                              className="rounded-md border-slate-300 text-[#2d5a32] focus:ring-[#2d5a32] w-4 h-4"
                            />
                            <span className="text-[10px] font-bold text-amber-800">
                              {g.isImposto ? 'Sim' : 'Não'}
                            </span>
                          </label>
                        </td>

                        {/* Coluna 2: Valor (Editável) */}
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            step="any"
                            placeholder="0,00"
                            value={g.valor || ''}
                            onChange={(e) =>
                              updateGasto(g.id, 'valor', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-rose-700 font-bold font-mono text-right focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs"
                          />
                        </td>

                        {/* Coluna Ação */}
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveGasto(g.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover linha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quadrant Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <button
              onClick={handleAddLinhaGasto}
              className="text-[#2d5a32] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar outra linha</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Impostos: {formatarMoeda(totalImpostos)}
              </span>
              <span className="text-rose-700 font-black text-sm font-mono">{formatarMoeda(totalDespesas)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Modal (Detalhamento Auditável) */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Relatório de Auditoria Matemática</h3>
                  <p className="text-slate-500 text-xs">VOS Treasury Financial Audit Engine - ID: AUD-2026-VOS</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-700 text-sm flex items-center justify-between">
                  <span>1. Total Estimado Ganhos</span>
                  <span className="text-emerald-700 font-black font-mono">{formatarMoeda(totalGanhos)}</span>
                </h4>
                <p className="text-slate-500">
                  Somatório das {rendimentos.length} linhas de Rendimentos.
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 font-mono text-[11px] pt-1">
                  {rendimentos.map((r, i) => (
                    <li key={r.id}>
                      {r.nome || `Rendimento ${i + 1}`}: {formatarMoeda(r.valor)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-700 text-sm flex items-center justify-between">
                  <span>2. Total Estimado Despesa</span>
                  <span className="text-rose-700 font-black font-mono">{formatarMoeda(totalDespesas)}</span>
                </h4>
                <p className="text-slate-500">
                  Somatório das {gastos.length} linhas de Gastos e Impostos.
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 font-mono text-[11px] pt-1">
                  {gastos.map((g, i) => (
                    <li key={g.id}>
                      {g.nome || `Gasto ${i + 1}`} {g.isImposto ? '(Imposto)' : ''}: {formatarMoeda(g.valor)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-700 text-sm flex items-center justify-between">
                  <span>3. Impostos Pagos / Previsto</span>
                  <span className="text-amber-700 font-black font-mono">{formatarMoeda(totalImpostos)}</span>
                </h4>
                <p className="text-slate-500">
                  Calculado filtrando apenas as linhas marcadas como Imposto na tabela de Gastos.
                </p>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center justify-between">
                  <span>4. Margem de Lucro</span>
                  <span className="text-emerald-800 font-black font-mono">{margemLucro.toFixed(2)}%</span>
                </h4>
                <div className="space-y-1 font-mono text-slate-700 text-[11px]">
                  <p>Lucro Líquido = Ganhos ({formatarMoeda(totalGanhos)}) - Despesas ({formatarMoeda(totalDespesas)}) = <strong>{formatarMoeda(lucroLiquido)}</strong></p>
                  <p>Margem = ({formatarMoeda(lucroLiquido)} / {formatarMoeda(totalGanhos)}) × 100 = <strong>{margemLucro.toFixed(2)}%</strong></p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-5">
              <span className="text-[11px] text-slate-400">Status: Verificado e Consistente</span>
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-[#1c3220] text-white font-bold rounded-xl text-xs hover:bg-[#25482e] cursor-pointer"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
