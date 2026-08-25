import React, { useState, useMemo, useEffect } from 'react';
import { Condominio } from '../../types';
import { formatarMoeda } from '../../utils/pricingEngine';
import {
  FileText,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Building2,
  Users,
  DollarSign,
  PieChart,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Clipboard,
  FileSpreadsheet,
  Check,
  Sparkles,
  X,
  Sliders,
  Edit3,
  Droplets
} from 'lucide-react';

interface RelatoriosSectionProps {
  condominios: Condominio[];
}

interface DespesaOrdinaria {
  id: string;
  descricao: string;
  vencimentoReferencia: string;
  valor: number;
}

interface DespesaExtraordinaria {
  id: string;
  descricao: string;
  percentualRateio: number;
  valor: number;
}

interface UnidadeConfig {
  unidadeId: number;
  nomeUnidade: string;
  fracaoIdeal: number; // e.g. 4.1666667 (%)
  excedenteAguaIndividual?: number;
  moradores?: number; // e.g. 2 moradores
}

interface TabelaFracoesBreakdownProps {
  demonstrativoUnidades: Array<any>;
  getValue: (u: any) => number;
  titulo?: string;
  borderColor?: string;
  tipoRateio: 'fracao_ideal' | 'divisao_igual' | 'moradores';
  onTipoRateioChange: (tipo: 'fracao_ideal' | 'divisao_igual' | 'moradores') => void;
  unidadesConfig?: UnidadeConfig[];
  setUnidadesConfig?: React.Dispatch<React.SetStateAction<UnidadeConfig[]>>;
  escopoRateioAgua?: 'total_com_taxa_minima' | 'apenas_excedente';
  onEscopoRateioAguaChange?: (escopo: 'total_com_taxa_minima' | 'apenas_excedente') => void;
  taxaMinimaAgua?: number;
  excedenteAguaTotal?: number;
}

const TabelaFracoesBreakdown: React.FC<TabelaFracoesBreakdownProps> = ({
  demonstrativoUnidades,
  getValue,
  titulo = "Rateio por Grupo de Fração Ideal",
  borderColor = "border-slate-200",
  tipoRateio,
  onTipoRateioChange,
  unidadesConfig,
  setUnidadesConfig,
  escopoRateioAgua,
  onEscopoRateioAguaChange,
  taxaMinimaAgua,
  excedenteAguaTotal
}) => {
  const [janelaMoradoresAberta, setJanelaMoradoresAberta] = useState(false);

  const gruposMap = new Map<
    string,
    { keyLabel: string; fracaoLabel: string; unidades: string[]; totalGrupo: number; valorUnitario: number; ordenacao: number }
  >();

  demonstrativoUnidades.forEach((u) => {
    const val = getValue(u) || 0;
    const fracao = Number(u.fracaoIdeal) || 0;
    const moradores = u.moradores !== undefined ? Number(u.moradores) : 2;

    let groupKey: string;
    let keyLabel: string;
    let fracaoLabel: string;
    let ordenacao: number;

    if (tipoRateio === 'moradores') {
      groupKey = `mor_${moradores}`;
      keyLabel = `${moradores} Morador${moradores > 1 ? 'es' : ''}`;
      fracaoLabel = `${moradores} hab.`;
      ordenacao = moradores;
    } else if (tipoRateio === 'divisao_igual') {
      groupKey = 'div_igual';
      keyLabel = 'Divisão Igualitária';
      fracaoLabel = '1/N';
      ordenacao = 1;
    } else {
      const roundedFracao = Math.round(fracao * 100000) / 100000;
      groupKey = `frac_${roundedFracao}`;
      keyLabel = `${roundedFracao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}%`;
      fracaoLabel = `${roundedFracao.toFixed(3)}%`;
      ordenacao = fracao;
    }

    if (!gruposMap.has(groupKey)) {
      gruposMap.set(groupKey, {
        keyLabel,
        fracaoLabel,
        unidades: [u.nomeUnidade],
        totalGrupo: val,
        valorUnitario: val,
        ordenacao
      });
    } else {
      const g = gruposMap.get(groupKey)!;
      g.unidades.push(u.nomeUnidade);
      g.totalGrupo += val;
    }
  });

  const grupos = Array.from(gruposMap.values()).sort((a, b) => b.ordenacao - a.ordenacao);
  const totalGeralGrupos = grupos.reduce((acc, g) => acc + g.totalGrupo, 0);

  // Modal Totals Calculation
  const somaTotalMoradores = useMemo(() => {
    return demonstrativoUnidades.reduce((acc, u) => acc + (u.moradores !== undefined ? Number(u.moradores) : 2), 0);
  }, [demonstrativoUnidades]);

  const somaTotalValores = useMemo(() => {
    return demonstrativoUnidades.reduce((acc, u) => acc + (getValue(u) || 0), 0);
  }, [demonstrativoUnidades, getValue]);

  const valorPorMorador = useMemo(() => {
    return somaTotalMoradores > 0 ? somaTotalValores / somaTotalMoradores : 0;
  }, [somaTotalValores, somaTotalMoradores]);

  return (
    <div className={`mt-3 pt-3 border-t ${borderColor} space-y-2.5 print:hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-[#2d5a32]" />
            <span>{titulo}</span>
          </h5>
          <span className="text-[10px] font-semibold text-slate-500">
            • {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}
          </span>
        </div>

        {/* Option Selector: Rateio por Fração vs Divisão Igualitária vs Por Moradores */}
        <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 px-1.5 uppercase tracking-tight">Regra de Rateio:</span>
          <button
            type="button"
            onClick={() => onTipoRateioChange('fracao_ideal')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${tipoRateio === 'fracao_ideal'
                ? 'bg-[#2d5a32] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            Fração Ideal (%)
          </button>
          <button
            type="button"
            onClick={() => onTipoRateioChange('divisao_igual')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${tipoRateio === 'divisao_igual'
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            Divisão Igualitária (R$)
          </button>
          <button
            type="button"
            onClick={() => {
              onTipoRateioChange('moradores');
              setJanelaMoradoresAberta(true);
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${tipoRateio === 'moradores'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Por Moradores (Habitantes)</span>
          </button>

          {tipoRateio === 'moradores' && (
            <button
              type="button"
              onClick={() => setJanelaMoradoresAberta(true)}
              className="ml-1 px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-md border border-amber-300 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Sliders className="w-3 h-3 text-amber-700" />
              <span>🪟 Abrir Janela por Moradores</span>
            </button>
          )}
        </div>
      </div>

      {/* Opção de composição no Valor Total Apurado do Rateio de Água */}
      {onEscopoRateioAguaChange && (
        <div className="bg-sky-50/90 border border-sky-200/90 p-3 rounded-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-sky-950 uppercase tracking-wide flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-700 shrink-0" />
              <span>Opção de soma no Valor Total Apurado do Rateio de Água:</span>
            </span>
            <span className="text-xs font-mono font-black text-sky-950 bg-white px-2.5 py-1 rounded-lg border border-sky-300 shadow-2xs">
              Valor Total Apurado = {formatarMoeda(escopoRateioAgua === 'apenas_excedente' ? (excedenteAguaTotal || 0) : ((taxaMinimaAgua || 0) + (excedenteAguaTotal || 0)))}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEscopoRateioAguaChange('apenas_excedente')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${escopoRateioAgua === 'apenas_excedente'
                  ? 'bg-sky-700 text-white border-sky-800 shadow-xs ring-2 ring-sky-400'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                }`}
            >
              <div className={`mt-0.5 p-1 rounded-full ${escopoRateioAgua === 'apenas_excedente' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold leading-tight uppercase tracking-tight">
                  1. Apenas Excedente de Consumo
                </p>
                <p className={`text-[10px] mt-0.5 ${escopoRateioAgua === 'apenas_excedente' ? 'text-sky-100' : 'text-slate-500'}`}>
                  Valor Total Apurado do Rateio = Excedente de Consumo (Medição Individualizada/Hidrômetros)
                </p>
                <p className={`text-[11px] mt-1 font-mono font-bold ${escopoRateioAgua === 'apenas_excedente' ? 'text-white' : 'text-sky-900'}`}>
                  Total Apurado = {formatarMoeda(excedenteAguaTotal || 0)}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onEscopoRateioAguaChange('total_com_taxa_minima')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${escopoRateioAgua === 'total_com_taxa_minima' || !escopoRateioAgua
                  ? 'bg-sky-700 text-white border-sky-800 shadow-xs ring-2 ring-sky-400'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                }`}
            >
              <div className={`mt-0.5 p-1 rounded-full ${escopoRateioAgua === 'total_com_taxa_minima' || !escopoRateioAgua ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold leading-tight uppercase tracking-tight">
                  2. Taxa Mínima + Excedente de Consumo
                </p>
                <p className={`text-[10px] mt-0.5 ${escopoRateioAgua === 'total_com_taxa_minima' || !escopoRateioAgua ? 'text-sky-100' : 'text-slate-500'}`}>
                  Valor Total Apurado do Rateio = Taxa Mínima de Água & Esgoto (Sanepar/Concessionária) + Excedente de Consumo
                </p>
                <p className={`text-[11px] mt-1 font-mono font-bold ${escopoRateioAgua === 'total_com_taxa_minima' || !escopoRateioAgua ? 'text-white' : 'text-sky-900'}`}>
                  {formatarMoeda(taxaMinimaAgua || 0)} + {formatarMoeda(excedenteAguaTotal || 0)} = {formatarMoeda((taxaMinimaAgua || 0) + (excedenteAguaTotal || 0))}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <th className="py-2 px-2.5 w-36 text-center">
                {tipoRateio === 'moradores' ? 'Nº Moradores' : tipoRateio === 'divisao_igual' ? 'Critério' : 'Fração (%)'}
              </th>
              <th className="py-2 px-2.5">Unidades de Residências</th>
              <th className="py-2 px-2.5 w-48 text-right">Valor Total Pago pelo Grupo</th>
              <th className="py-2 px-2.5 w-44 text-right">Valor Unitário do Grupo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {grupos.map((g, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 bg-slate-50/60">
                  {g.keyLabel}
                </td>
                <td className="py-2 px-2.5">
                  <span className="font-semibold text-slate-800">
                    {g.unidades.length} {g.unidades.length === 1 ? 'unidade' : 'unidades'}
                  </span>
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-800">
                  {formatarMoeda(g.totalGrupo)}
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800">
                  {formatarMoeda(g.valorUnitario)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/90 font-bold text-slate-800 border-t border-slate-200 text-xs">
              <td colSpan={2} className="py-2 px-2.5 text-right uppercase">
                {tipoRateio === 'fracao_ideal'
                  ? 'Subtotal do Rateio por Fração Ideal:'
                  : tipoRateio === 'moradores'
                    ? 'Subtotal do Rateio por Nº de Moradores:'
                    : 'Subtotal da Divisão Igualitária:'}
              </td>
              <td className="py-2 px-2.5 text-right font-mono font-black text-[#2d5a32]">
                {formatarMoeda(totalGeralGrupos)}
              </td>
              <td className="py-2 px-2.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* JANELA DE PREENCHIMENTO: RATEIO POR MORADORES & FRAÇÃO */}
      {janelaMoradoresAberta && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/30">
                  <Users className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>Janela de Rateio por Moradores & Fração (Água & Saneamento)</span>
                  </h3>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    Preencha as unidades, número de moradores e acompanhe em tempo real a soma total de moradores e o valor por fração.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJanelaMoradoresAberta(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary Cards */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-800">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Soma Número de Moradores</span>
                  <p className="text-lg font-black font-mono text-amber-950">{somaTotalMoradores} habitantes</p>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-sky-500/20 rounded-lg text-sky-800 mt-0.5 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">Valor Total Apurado do Rateio</span>
                  <p className="text-lg font-black font-mono text-sky-950 leading-tight">{formatarMoeda(somaTotalValores)}</p>

                  {onEscopoRateioAguaChange && (
                    <div className="pt-1 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-sky-900 uppercase">Regra de Soma:</span>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => onEscopoRateioAguaChange('apenas_excedente')}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${escopoRateioAgua === 'apenas_excedente'
                              ? 'bg-sky-700 text-white border-sky-800 shadow-2xs'
                              : 'bg-white text-sky-900 border-sky-300 hover:bg-sky-100'
                            }`}
                        >
                          Apenas Excedente
                        </button>
                        <button
                          type="button"
                          onClick={() => onEscopoRateioAguaChange('total_com_taxa_minima')}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${escopoRateioAgua === 'total_com_taxa_minima' || !escopoRateioAgua
                              ? 'bg-sky-700 text-white border-sky-800 shadow-2xs'
                              : 'bg-white text-sky-900 border-sky-300 hover:bg-sky-100'
                            }`}
                        >
                          Taxa Mínima + Excedente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-800">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Valor Médio por Morador</span>
                  <p className="text-lg font-black font-mono text-emerald-950">{formatarMoeda(valorPorMorador)} / hab.</p>
                </div>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-amber-100/60 p-2.5 rounded-lg border border-amber-200">
                <p className="flex items-center gap-1.5 font-medium">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Edite a coluna <strong>Unidades (Pre Editado)</strong> e o <strong>Número de Moradores</strong>. O valor por fração atualiza na hora.</span>
                </p>
                {setUnidadesConfig && (
                  <button
                    type="button"
                    onClick={() => {
                      setUnidadesConfig(prev => prev.map(u => ({ ...u, moradores: 2 })));
                    }}
                    className="text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded border border-amber-400 cursor-pointer shrink-0 transition-all"
                  >
                    Setar 2 Moradores p/ Todos
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3 w-12 text-center bg-slate-200/80">#</th>
                      <th className="py-2.5 px-3">Unidades (Pre Editado)</th>
                      <th className="py-2.5 px-3 w-36 text-center bg-amber-100/80 text-amber-950">Nº Moradores</th>
                      <th className="py-2.5 px-3 w-32 text-right">Fração Ideal (%)</th>
                      <th className="py-2.5 px-3 w-48 text-right bg-emerald-100/80 text-emerald-950">Valor por Fração (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {demonstrativoUnidades.map((u, index) => {
                      const moradoresUnid = u.moradores !== undefined ? Number(u.moradores) : 2;
                      const valorUnid = getValue(u) || 0;
                      return (
                        <tr key={u.unidadeId || index} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 bg-slate-50">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {setUnidadesConfig ? (
                              <input
                                type="text"
                                value={u.nomeUnidade}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setUnidadesConfig(prev =>
                                    prev.map(item => item.unidadeId === u.unidadeId ? { ...item, nomeUnidade: val } : item)
                                  );
                                }}
                                className="w-full px-2.5 py-1 border border-slate-200 hover:border-slate-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 rounded font-semibold text-slate-800 bg-white focus:outline-none transition-all"
                              />
                            ) : (
                              <span>{u.nomeUnidade}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center bg-amber-50/50">
                            <div className="flex items-center justify-center gap-1.5">
                              {setUnidadesConfig ? (
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={moradoresUnid}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setUnidadesConfig(prev =>
                                      prev.map(item => item.unidadeId === u.unidadeId ? { ...item, moradores: val } : item)
                                    );
                                  }}
                                  className="w-20 px-2 py-1 border border-amber-300 hover:border-amber-500 focus:border-amber-600 focus:ring-1 focus:ring-amber-500 rounded font-bold text-center text-amber-950 bg-white focus:outline-none transition-all"
                                />
                              ) : (
                                <span className="font-bold text-amber-900">{moradoresUnid}</span>
                              )}
                              <span className="text-[11px] font-semibold text-amber-800">hab.</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-600">
                            {Number(u.fracaoIdeal || 0).toFixed(3)}%
                          </td>
                          <td className="py-2 px-3 text-right bg-emerald-50/50">
                            <div className="flex flex-col items-end">
                              <span className="font-mono font-bold text-emerald-900 text-sm">
                                {formatarMoeda(valorUnid)}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-700">
                                ({formatarMoeda(moradoresUnid > 0 ? valorUnid / moradoresUnid : 0)} / hab)
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                      <td colSpan={2} className="py-2.5 px-3 uppercase text-right">
                        Soma Totais ({demonstrativoUnidades.length} Unidades):
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-amber-900 bg-amber-100/80">
                        {somaTotalMoradores} hab.
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">100.00%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-900 bg-emerald-100/80">
                        {formatarMoeda(somaTotalValores)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Soma de moradores: <strong className="text-slate-900">{somaTotalMoradores} hab.</strong> | Valor por fração atualizado automaticamente.</span>
              </div>
              <button
                type="button"
                onClick={() => setJanelaMoradoresAberta(false)}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Concluído & Fechar Janela</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export const RelatoriosSection: React.FC<RelatoriosSectionProps> = ({ condominios }) => {
  // 1. Informações do Condomínio State
  const [mesReferencia, setMesReferencia] = useState('Agosto / 2026');
  const [condominioId, setCondominioId] = useState<string>(condominios[0]?.id || '');
  const [nomeCondominioCustom, setNomeCondominioCustom] = useState('');
  const [numeroUnidades, setNumeroUnidades] = useState<number>(condominios[0]?.unidades || 24);
  const [mostrarMatrizFracoes, setMostrarMatrizFracoes] = useState(false);

  // Derive Condominium Name
  const nomeCondominioExibicao = useMemo(() => {
    if (condominioId === 'custom') return nomeCondominioCustom || 'Condomínio Exemplo';
    const c = condominios.find((item) => item.id === condominioId);
    return c ? c.nome : nomeCondominioCustom || 'Condomínio Exemplo';
  }, [condominioId, condominios, nomeCondominioCustom]);

  // Fractions per unit state
  const [unidadesConfig, setUnidadesConfig] = useState<UnidadeConfig[]>(() => {
    const totalUnidades = condominios[0]?.unidades || 24;
    const baseFracao = Number((100 / totalUnidades).toFixed(4));
    return Array.from({ length: totalUnidades }, (_, i) => ({
      unidadeId: i + 1,
      nomeUnidade: `Apt ${101 + Math.floor(i / 4) * 10 + (i % 4)}`,
      fracaoIdeal: baseFracao,
      moradores: 2
    }));
  });

  // Excel paste state & handler
  const [mostrarAreaExcel, setMostrarAreaExcel] = useState(false);
  const [textoExcelInput, setTextoExcelInput] = useState('');
  const [mensagemSucessoExcel, setMensagemSucessoExcel] = useState('');

  // Generation/Update report state & handler
  const [isGerando, setIsGerando] = useState(false);
  const [mensagemGeracao, setMensagemGeracao] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);

  const handleGerarEAtualizarRelatorio = () => {
    setIsGerando(true);

    setTimeout(() => {
      setIsGerando(false);
      const agora = new Date();
      const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setUltimaAtualizacao(hora);

      setMensagemGeracao(
        `Relatório do ${nomeCondominioExibicao} (${mesReferencia}) gerado e atualizado com sucesso às ${hora}! Todos os demonstrativos, tabelas de rateio e frações foram recalculados.`
      );

      setTimeout(() => {
        setMensagemGeracao('');
      }, 7000);
    }, 450);
  };

  const processarTextoExcel = (rawText: string) => {
    if (!rawText || !rawText.trim()) return;

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const novasUnidades: UnidadeConfig[] = [];

    lines.forEach((line, index) => {
      // Split by tab (Excel default), semicolon or double spaces
      let cols = line.split('\t');
      if (cols.length < 2) cols = line.split(';');
      if (cols.length < 2) cols = line.split(/\s{2,}/);

      if (cols.length >= 2) {
        const nome = cols[0].trim();
        const fracaoRaw = cols[1].trim().replace('%', '').replace(',', '.');
        const fracao = parseFloat(fracaoRaw) || 0;
        const moradoresRaw = cols[2] ? cols[2].trim() : '2';
        const moradores = parseInt(moradoresRaw) || 2;
        if (nome) {
          novasUnidades.push({
            unidadeId: index + 1,
            nomeUnidade: nome,
            fracaoIdeal: fracao,
            moradores
          });
        }
      } else if (cols.length === 1) {
        const parts = cols[0].split(/,|\t/);
        if (parts.length >= 2) {
          const nome = parts[0].trim();
          const fracaoRaw = parts[1].trim().replace('%', '').replace(',', '.');
          const fracao = parseFloat(fracaoRaw) || 0;
          const moradoresRaw = parts[2] ? parts[2].trim() : '2';
          const moradores = parseInt(moradoresRaw) || 2;
          if (nome) {
            novasUnidades.push({
              unidadeId: index + 1,
              nomeUnidade: nome,
              fracaoIdeal: fracao,
              moradores
            });
          }
        }
      }
    });

    if (novasUnidades.length > 0) {
      setUnidadesConfig(novasUnidades);
      setNumeroUnidades(novasUnidades.length);
      setMensagemSucessoExcel(`${novasUnidades.length} unidades, frações e moradores importados do Excel com sucesso!`);
      setTimeout(() => setMensagemSucessoExcel(''), 4000);
      setTextoExcelInput('');
      setMostrarAreaExcel(false);
    }
  };

  // Re-sync units config when number of units or selected condo changes
  const handleCondominioChange = (newId: string) => {
    setCondominioId(newId);
    if (newId !== 'custom') {
      const c = condominios.find((item) => item.id === newId);
      if (c) {
        const total = c.unidades || 24;
        setNumeroUnidades(total);
        const baseFracao = Number((100 / total).toFixed(4));
        setUnidadesConfig(
          Array.from({ length: total }, (_, i) => ({
            unidadeId: i + 1,
            nomeUnidade: `Apt ${101 + Math.floor(i / 4) * 10 + (i % 4)}`,
            fracaoIdeal: baseFracao,
            moradores: 2
          }))
        );
      }
    }
  };

  const handleNumeroUnidadesChange = (num: number) => {
    const validNum = Math.max(1, Math.min(500, num));
    setNumeroUnidades(validNum);
    const baseFracao = Number((100 / validNum).toFixed(4));
    setUnidadesConfig(
      Array.from({ length: validNum }, (_, i) => ({
        unidadeId: i + 1,
        nomeUnidade: unidadesConfig[i]?.nomeUnidade || `Apt ${101 + Math.floor(i / 4) * 10 + (i % 4)}`,
        fracaoIdeal: baseFracao,
        excedenteAguaIndividual: unidadesConfig[i]?.excedenteAguaIndividual,
        moradores: unidadesConfig[i]?.moradores || 2
      }))
    );
  };

  const redistribuirFracoesIgualmente = () => {
    const baseFracao = Number((100 / numeroUnidades).toFixed(4));
    setUnidadesConfig((prev) =>
      prev.map((u) => ({
        ...u,
        fracaoIdeal: baseFracao
      }))
    );
  };

  const handleNomeUnidadeChange = (unidadeId: number, novoNome: string) => {
    setUnidadesConfig((prev) =>
      prev.map((u) => (u.unidadeId === unidadeId ? { ...u, nomeUnidade: novoNome } : u))
    );
  };

  // 2. Relatório Despesas State
  const [despesasOrdinarias, setDespesasOrdinarias] = useState<DespesaOrdinaria[]>([
    { id: '1', descricao: 'Folha de Pagamento & Encargos', vencimentoReferencia: '05/08', valor: 4500.0 },
    { id: '2', descricao: 'Energia Elétrica Áreas Comuns (COPEL)', vencimentoReferencia: '10/08', valor: 1250.0 },
    { id: '3', descricao: 'Manutenção Elevadores & Portões', vencimentoReferencia: '15/08', valor: 880.0 },
    { id: '4', descricao: 'Honorários Administradora (VOS)', vencimentoReferencia: '10/08', valor: 1450.0 },
    { id: '5', descricao: 'Produtos de Limpeza & Consumíveis', vencimentoReferencia: '12/08', valor: 420.0 }
  ]);

  const [despesasExtraordinarias, setDespesasExtraordinarias] = useState<DespesaExtraordinaria[]>([
    { id: 'e1', descricao: 'Reforma Portaria Remota (Parcela 03/10)', percentualRateio: 100, valor: 1200.0 },
    { id: 'e2', descricao: 'Inspeção de Para-Raios e Laudo elétrico', percentualRateio: 100, valor: 650.0 }
  ]);

  // Custos de Água e Saneamento
  const [taxaMinimaAgua, setTaxaMinimaAgua] = useState<number>(600.0);
  const [excedenteAguaTotal, setExcedenteAguaTotal] = useState<number>(340.0);
  const [escopoRateioAgua, setEscopoRateioAgua] = useState<'total_com_taxa_minima' | 'apenas_excedente'>('total_com_taxa_minima');

  // 3. Regras de Rateio e Fundos
  const [tipoCotaBasica, setTipoCotaBasica] = useState<'fracao_ideal' | 'divisao_igual' | 'moradores'>('fracao_ideal');
  const [tipoRateioFundoReserva, setTipoRateioFundoReserva] = useState<'fracao_ideal' | 'divisao_igual' | 'moradores'>('fracao_ideal');
  const [tipoDespesaExtra, setTipoDespesaExtra] = useState<'fracao_ideal' | 'divisao_igual' | 'moradores'>('fracao_ideal');
  const [tipoFundoPintura, setTipoFundoPintura] = useState<'fracao_ideal' | 'divisao_igual' | 'moradores'>('fracao_ideal');
  const [tipoFundoObras, setTipoFundoObras] = useState<'fracao_ideal' | 'divisao_igual' | 'moradores'>('fracao_ideal');
  const [tipoRateioAgua, setTipoRateioAgua] = useState<'fracao_ideal' | 'divisao_igual' | 'moradores'>('moradores');


  const [fundoReservaValor, setFundoReservaValor] = useState<number>(10); // 10% or R$ 50
  const [fundoPinturaPorUnidade, setFundoPinturaPorUnidade] = useState<number>(25.0);
  const [fundoObrasPorUnidade, setFundoObrasPorUnidade] = useState<number>(15.0);
  const [taxaBoletoValor, setTaxaBoletoValor] = useState<number>(3.50);
  const [vencimentoBoleto, setVencimentoBoleto] = useState<string>('10/08/2026');

  // Textos editáveis baseados nos templates
  const [descricaoFundoObras, setDescricaoFundoObras] = useState<string>('Fundo Permanente de Obras e Manutenção Estrutural Geral');
  const [composicaoAgua, setComposicaoAgua] = useState<string>('Sanepar/Concessionária');

  // Aplicar templates quando o condomínio for selecionado
  useEffect(() => {
    try {
      if (condominioId && condominioId !== 'custom') {
        const c = condominios.find(c => c.id === condominioId);
        if (c && c.templatesRelatorio) {
          const tr = c.templatesRelatorio;

          // 1. Despesas Múltiplas
          if (tr.despesasPadrao && tr.despesasPadrao.length > 0) {
            setDespesasOrdinarias(
              tr.despesasPadrao.filter(desc => desc.trim() !== '').map((desc, i) => ({
                id: Date.now().toString(36) + Math.random().toString(36).substring(2) + i,
                descricao: desc,
                vencimentoReferencia: '',
                valor: 0
              }))
            );
          } else {
            // Fallback se não houver template configurado
            setDespesasOrdinarias([{
              id: Date.now().toString(36) + Math.random().toString(36).substring(2),
              descricao: 'Despesas ref. Mês Anterior',
              vencimentoReferencia: '',
              valor: 0
            }]);
          }

          // 2. Fundo Reserva - Agora é sempre um percentual da Cota Básica
          if (tr.fundoReservaAliquota) {
            setFundoReservaValor(Number(String(tr.fundoReservaAliquota).replace('%', '').replace(',', '.')) || 0);
          } else if (tr.fundoReservaValor) {
            setFundoReservaValor(Number(String(tr.fundoReservaValor).replace('%', '').replace(',', '.')) || 0);
          }

          // 3. Obras
          if (tr.obrasPadrao && tr.obrasPadrao.length > 0) {
            setDespesasExtraordinarias(
              tr.obrasPadrao.map(descricao => ({
                id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                descricao,
                percentualRateio: 100,
                valor: 0
              }))
            );
          } else {
            setDespesasExtraordinarias([{
              id: Date.now().toString(36) + Math.random().toString(36).substring(2),
              descricao: tr.obrasDescricao || 'Rateio Obras',
              percentualRateio: 100,
              valor: 0
            }]);
          }

          // 4. Fundo Pintura e Fundo Obras
          if (tr.fundoPinturaValor) {
            setTipoFundoPintura('valor_fixo_unidade');
            setFundoPinturaPorUnidade(Number(String(tr.fundoPinturaValor).replace(',', '.')) || 0);
          }
          if (tr.fundoObrasValor) {
            setTipoFundoObras('valor_fixo_unidade');
            setFundoObrasPorUnidade(Number(String(tr.fundoObrasValor).replace(',', '.')) || 0);
          }

          // 4.1 Taxa de Boleto
          if (tr.taxaBoletoValor) {
            setTaxaBoletoValor(Number(String(tr.taxaBoletoValor).replace(',', '.')) || 0);
          }

          // 5. Rateio Água
          if (tr.aguaTipoRateio) setTipoRateioAgua(tr.aguaTipoRateio as any);
          if (tr.aguaComposicao) setComposicaoAgua(tr.aguaComposicao);

          // 6. Unidades e Moradores Pré-Editados
          if (tr.unidadesPadrao && tr.unidadesPadrao.length > 0) {
            // Mapeia as unidades padronizadas do template para o formato do demonstrativo
            setUnidadesConfig(
              tr.unidadesPadrao.map(u => ({
                unidadeId: u.unidadeId,
                nomeUnidade: u.nomeUnidade,
                moradores: u.moradores,
                fracaoIdeal: u.fracaoIdeal !== undefined ? Number(u.fracaoIdeal) : Number((100 / tr.unidadesPadrao!.length).toFixed(7))
              }))
            );
            setNumeroUnidades(tr.unidadesPadrao.length);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao aplicar templates:', error);
    }
  }, [condominioId, condominios]);

  // Seleção de seções ativas para o PDF / Impressão
  const [secoesRelatorioPDF, setSecoesRelatorioPDF] = useState({
    ordinarias: true,
    fundoReserva: true,
    extraordinarias: true,
    fundoPintura: true,
    fundoObras: true,
    aguaSaneamento: true,
    taxaBoleto: true,
    demonstrativoIndividual: true,
  });

  const [colunasPDF, setColunasPDF] = useState({
    unidade: true,
    vencimento: true,
    taxaBoleto: true,
    cotaBasica: true,
    despesaExtraordinaria: true,
    fundoObras: true,
    fundoReserva: true,
    fundoPintura: true,
    taxaMinAgua: true,
    excedenteAgua: true,
    totalUnidade: true,
  });

  // Helper functions for adding/removing items
  const addDespesaOrdinaria = () => {
    setDespesasOrdinarias((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        descricao: 'Nova Despesa Ordinária',
        vencimentoReferencia: '10/08',
        valor: 100.0
      }
    ]);
  };

  const removeDespesaOrdinaria = (id: string) => {
    setDespesasOrdinarias((prev) => prev.filter((item) => item.id !== id));
  };

  const addDespesaExtraordinaria = () => {
    setDespesasExtraordinarias((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        descricao: 'Nova Obra / Extraordinária',
        percentualRateio: 100,
        valor: 200.0
      }
    ]);
  };

  const removeDespesaExtraordinaria = (id: string) => {
    setDespesasExtraordinarias((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const totalOrdinarias = useMemo(() => {
    return despesasOrdinarias.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  }, [despesasOrdinarias]);

  const totalExtraordinarias = useMemo(() => {
    return despesasExtraordinarias.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  }, [despesasExtraordinarias]);

  const totalAgua = useMemo(() => {
    return (Number(taxaMinimaAgua) || 0) + (Number(excedenteAguaTotal) || 0);
  }, [taxaMinimaAgua, excedenteAguaTotal]);

  const totalFundoReservaCalculado = useMemo(() => {
    return totalOrdinarias * ((fundoReservaValor || 0) / 100);
  }, [totalOrdinarias, fundoReservaValor]);

  const totalFundoPinturaCalculado = useMemo(() => {
    return (fundoPinturaPorUnidade || 0) * (numeroUnidades || 1);
  }, [fundoPinturaPorUnidade, numeroUnidades]);

  const totalFundoObrasCalculado = useMemo(() => {
    return (fundoObrasPorUnidade || 0) * (numeroUnidades || 1);
  }, [fundoObrasPorUnidade, numeroUnidades]);

  const totalTaxaBoletoCalculado = useMemo(() => {
    return (taxaBoletoValor || 0) * (numeroUnidades || 1);
  }, [taxaBoletoValor, numeroUnidades]);

  const totalGeralDespesasMes = useMemo(() => {
    return (
      totalOrdinarias +
      totalFundoReservaCalculado +
      totalExtraordinarias +
      totalFundoPinturaCalculado +
      totalFundoObrasCalculado +
      totalTaxaBoletoCalculado +
      totalAgua
    );
  }, [
    totalOrdinarias,
    totalFundoReservaCalculado,
    totalExtraordinarias,
    totalFundoPinturaCalculado,
    totalFundoObrasCalculado,
    totalTaxaBoletoCalculado,
    totalAgua
  ]);

  const resumoGeralValores = useMemo(() => ({
    cotaBasica: totalOrdinarias,
    fundoReserva: totalFundoReservaCalculado,
    extraordinarias: totalExtraordinarias,
    fundoPintura: totalFundoPinturaCalculado,
    fundoObras: totalFundoObrasCalculado,
    agua: totalAgua,
    taxaBoleto: totalTaxaBoletoCalculado,
    totalGeral: totalGeralDespesasMes
  }), [
    totalOrdinarias,
    totalFundoReservaCalculado,
    totalExtraordinarias,
    totalFundoPinturaCalculado,
    totalFundoObrasCalculado,
    totalAgua,
    totalTaxaBoletoCalculado,
    totalGeralDespesasMes
  ]);

  const somaFracoesTotais = useMemo(() => {
    return unidadesConfig.reduce((acc, u) => acc + (Number(u.fracaoIdeal) || 0), 0);
  }, [unidadesConfig]);

  const totalMoradoresCondominio = useMemo(() => {
    return unidadesConfig.reduce((acc, u) => acc + (u.moradores !== undefined ? Number(u.moradores) : 2), 0);
  }, [unidadesConfig]);

  // Individual unit demonstrative calculation matrix
  const demonstrativoUnidades = useMemo(() => {
    const totalMoradores = totalMoradoresCondominio || 1;

    return unidadesConfig.map((u) => {
      const moradoresUnidade = u.moradores !== undefined ? Number(u.moradores) : 2;

      // 1. Cota Básica (Despesas Ordinárias)
      let cotaBasica = 0;
      if (tipoCotaBasica === 'fracao_ideal' && somaFracoesTotais > 0) {
        cotaBasica = totalOrdinarias * (u.fracaoIdeal / somaFracoesTotais);
      } else if (tipoCotaBasica === 'moradores') {
        cotaBasica = (totalOrdinarias / totalMoradores) * moradoresUnidade;
      } else {
        cotaBasica = totalOrdinarias / (numeroUnidades || 1);
      }

      // 2. Fundo de Reserva (Sempre Percentual da Cota Básica)
      const fundoReservaBase = totalOrdinarias * ((fundoReservaValor || 0) / 100);

      let fundoReserva = 0;
      if (tipoRateioFundoReserva === 'fracao_ideal' && somaFracoesTotais > 0) {
        fundoReserva = fundoReservaBase * (u.fracaoIdeal / somaFracoesTotais);
      } else if (tipoRateioFundoReserva === 'moradores') {
        fundoReserva = (fundoReservaBase / totalMoradores) * moradoresUnidade;
      } else {
        fundoReserva = fundoReservaBase / (numeroUnidades || 1);
      }

      // 3. Despesas Extraordinárias
      let despesaExtra = 0;
      if (tipoDespesaExtra === 'fracao_ideal' && somaFracoesTotais > 0) {
        despesaExtra = totalExtraordinarias * (u.fracaoIdeal / somaFracoesTotais);
      } else if (tipoDespesaExtra === 'moradores') {
        despesaExtra = (totalExtraordinarias / totalMoradores) * moradoresUnidade;
      } else {
        despesaExtra = totalExtraordinarias / (numeroUnidades || 1);
      }

      // 4. Fundo Pintura
      const totalFundoPintura = (fundoPinturaPorUnidade || 0) * (numeroUnidades || 1);
      let fundoPintura = 0;
      if (tipoFundoPintura === 'fracao_ideal' && somaFracoesTotais > 0) {
        fundoPintura = totalFundoPintura * (u.fracaoIdeal / somaFracoesTotais);
      } else if (tipoFundoPintura === 'moradores') {
        fundoPintura = (totalFundoPintura / totalMoradores) * moradoresUnidade;
      } else {
        fundoPintura = totalFundoPintura / (numeroUnidades || 1);
      }

      // 5. Fundo Obras
      const totalFundoObras = (fundoObrasPorUnidade || 0) * (numeroUnidades || 1);
      let fundoObras = 0;
      if (tipoFundoObras === 'fracao_ideal' && somaFracoesTotais > 0) {
        fundoObras = totalFundoObras * (u.fracaoIdeal / somaFracoesTotais);
      } else if (tipoFundoObras === 'moradores') {
        fundoObras = (totalFundoObras / totalMoradores) * moradoresUnidade;
      } else {
        fundoObras = totalFundoObras / (numeroUnidades || 1);
      }

      // 6. Custos de Água e Saneamento
      let taxaMinAguaUnidade = 0;
      let excedenteAguaUnidade = 0;

      if (escopoRateioAgua === 'apenas_excedente') {
        // Opção 1: Valor Total Apurado do Rateio = Excedente de Consumo (Medição Individualizada/Hidrômetros)
        // A Taxa Mínima de Água é repartida igualmente entre todas as unidades
        taxaMinAguaUnidade = (taxaMinimaAgua || 0) / (numeroUnidades || 1);

        if (tipoRateioAgua === 'fracao_ideal' && somaFracoesTotais > 0) {
          excedenteAguaUnidade =
            u.excedenteAguaIndividual !== undefined
              ? u.excedenteAguaIndividual
              : (excedenteAguaTotal || 0) * (u.fracaoIdeal / somaFracoesTotais);
        } else if (tipoRateioAgua === 'moradores') {
          excedenteAguaUnidade =
            u.excedenteAguaIndividual !== undefined
              ? u.excedenteAguaIndividual
              : ((excedenteAguaTotal || 0) / totalMoradores) * moradoresUnidade;
        } else {
          excedenteAguaUnidade =
            u.excedenteAguaIndividual !== undefined
              ? u.excedenteAguaIndividual
              : (excedenteAguaTotal || 0) / (numeroUnidades || 1);
        }
      } else {
        // Opção 2: Valor Total Apurado do Rateio = Taxa Mínima de Água & Esgoto (Sanepar/Concessionária) + Excedente de Consumo
        if (tipoRateioAgua === 'fracao_ideal' && somaFracoesTotais > 0) {
          taxaMinAguaUnidade = (taxaMinimaAgua || 0) * (u.fracaoIdeal / somaFracoesTotais);
          excedenteAguaUnidade =
            u.excedenteAguaIndividual !== undefined
              ? u.excedenteAguaIndividual
              : (excedenteAguaTotal || 0) * (u.fracaoIdeal / somaFracoesTotais);
        } else if (tipoRateioAgua === 'moradores') {
          taxaMinAguaUnidade = ((taxaMinimaAgua || 0) / totalMoradores) * moradoresUnidade;
          excedenteAguaUnidade =
            u.excedenteAguaIndividual !== undefined
              ? u.excedenteAguaIndividual
              : ((excedenteAguaTotal || 0) / totalMoradores) * moradoresUnidade;
        } else {
          taxaMinAguaUnidade = (taxaMinimaAgua || 0) / (numeroUnidades || 1);
          excedenteAguaUnidade =
            u.excedenteAguaIndividual !== undefined
              ? u.excedenteAguaIndividual
              : (excedenteAguaTotal || 0) / (numeroUnidades || 1);
        }
      }

      // 7. Taxa de Boleto
      const taxaBoleto = taxaBoletoValor || 0;

      return {
        unidadeId: u.unidadeId,
        nomeUnidade: u.nomeUnidade,
        fracaoIdeal: u.fracaoIdeal,
        moradores: moradoresUnidade,
        vencimento: vencimentoBoleto,
        cotaBasica,
        fundoReserva,
        despesaExtra,
        fundoPintura,
        fundoObras,
        taxaMinAguaUnidade,
        excedenteAguaUnidade,
        taxaBoleto,
        totalUnidade: cotaBasica + fundoReserva + despesaExtra + fundoPintura + fundoObras + taxaMinAguaUnidade + excedenteAguaUnidade + taxaBoleto
      };
    });
  }, [
    unidadesConfig,
    tipoCotaBasica,
    tipoDespesaExtra,
    tipoFundoPintura,
    tipoFundoObras,
    tipoRateioAgua,
    somaFracoesTotais,
    totalOrdinarias,
    numeroUnidades,
    fundoReservaValor,
    totalExtraordinarias,
    totalAgua,
    fundoPinturaPorUnidade,
    fundoObrasPorUnidade,
    taxaBoletoValor,
    vencimentoBoleto
  ]);

  // Totals calculated from demonstrativo table
  const totaisDemonstrativo = useMemo(() => {
    return demonstrativoUnidades.reduce(
      (acc, row) => ({
        taxaBoleto: acc.taxaBoleto + row.taxaBoleto,
        cotaBasica: acc.cotaBasica + row.cotaBasica,
        fundoReserva: acc.fundoReserva + row.fundoReserva,
        despesaExtra: acc.despesaExtra + row.despesaExtra,
        taxaMinAguaUnidade: acc.taxaMinAguaUnidade + row.taxaMinAguaUnidade,
        excedenteAguaUnidade: acc.excedenteAguaUnidade + row.excedenteAguaUnidade,
        fundoPintura: acc.fundoPintura + row.fundoPintura,
        fundoObras: acc.fundoObras + row.fundoObras,
        totalGeral: acc.totalGeral + row.totalUnidade
      }),
      {
        taxaBoleto: 0,
        cotaBasica: 0,
        fundoReserva: 0,
        despesaExtra: 0,
        taxaMinAguaUnidade: 0,
        excedenteAguaUnidade: 0,
        fundoPintura: 0,
        fundoObras: 0,
        totalGeral: 0
      }
    );
  }, [demonstrativoUnidades]);

  // Audit calculation validation
  const totalArrecadacaoEsperada = totalGeralDespesasMes;
  const diferencaAuditoria = Math.abs(totaisDemonstrativo.totalGeral - totalArrecadacaoEsperada);

  const temInconsistenciaFracao = Math.abs(somaFracoesTotais - 100) > 0.05;
  const temDiferencaValor = diferencaAuditoria > 0.1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="printable-doc" className="space-y-8 max-w-7xl mx-auto print:p-0 print:space-y-4">
      {/* ESTILOS EXCLUSIVOS DE IMPRESSÃO / PDF */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: white !important;
            color: #0f172a !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          input[type="text"], input[type="number"], select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            outline: none !important;
            color: #0f172a !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
            max-width: none !important;
          }
          table {
            width: 100% !important;
            table-layout: auto !important;
          }
        }
      `}</style>

      {/* CABEÇALHO EXCLUSIVO DE IMPRESSÃO / PDF - BRANDING VOS CONDOMÍNIOS */}
      <div className="hidden print:block mb-6 border-b-2 border-[#2d5a32] pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-[#2d5a32] tracking-wider leading-none">VOS</span>
              <span className="text-2xl font-black text-[#1c3220] tracking-widest leading-none">CONDOMÍNIOS</span>
            </div>
            <p className="text-[10px] font-bold text-slate-600 italic mt-0.5">
              Raízes sólidas e gestão moderna para seu condomínio.
            </p>
          </div>

          <div className="text-right text-xs text-slate-800 space-y-0.5">
            <p className="text-sm font-black text-[#2d5a32] uppercase">{nomeCondominioExibicao}</p>
            <p className="text-[11px] font-bold text-slate-700">Relatório de Rateio & Prestação de Contas</p>
            <p className="text-[10px] font-mono font-bold text-slate-500">
              Mês Ref: {mesReferencia} | Vencimento: {vencimentoBoleto}
            </p>
          </div>
        </div>
      </div>

      {/* Top Header Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#2d5a32] text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[#1c3220]">
              2.5 Relatórios de Rateio e Demonstrativo Financeiro por Condomínio
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Geração de prestação de contas mensal, regras de fundos, resumo financeiro de despesas e fração ideal por morador
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-[#2d5a32] hover:bg-[#1f4223] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Gerar PDF</span>
          </button>
        </div>
      </div>

      {/* BLOCO: Informações do Condomínio (Formulário de Configuração - Oculto na Impressão) */}
      <div className="bg-[#e8f0e6] p-6 rounded-2xl border border-emerald-200/60 shadow-xs space-y-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2d5a32]" />
            <h3 className="text-base font-bold text-[#1c3220]">
              Informações do Condomínio & Período
            </h3>
            <span className="text-xs bg-emerald-50 text-[#2d5a32] font-bold px-3 py-1 rounded-full border border-emerald-200">
              {mesReferencia}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGerarEAtualizarRelatorio}
            disabled={isGerando}
            className="bg-[#2d5a32] hover:bg-[#1f4223] active:scale-98 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${isGerando ? 'animate-spin' : ''}`} />
            <span>{isGerando ? 'Atualizando Informações...' : 'Gerar / Atualizar Relatório'}</span>
          </button>
        </div>

        {/* Feedback Message Banner */}
        {mensagemGeracao && (
          <div className="p-3.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-xs flex items-center justify-between gap-2 shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#2d5a32] shrink-0" />
              <span>{mensagemGeracao}</span>
            </div>
            <button
              onClick={() => setMensagemGeracao('')}
              className="text-emerald-800 hover:text-emerald-950 font-bold text-xs underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mês de Referência *</label>
            <input
              type="text"
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              placeholder="Ex: Agosto / 2026"
              className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Selecione o Condomínio *</label>
            <select
              value={condominioId}
              onChange={(e) => handleCondominioChange(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-[#2d5a32]"
            >
              {condominios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.unidades} un)
                </option>
              ))}
              <option value="custom">-- Outro / Customizado --</option>
            </select>
          </div>

          {condominioId === 'custom' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome do Condomínio Customizado</label>
              <input
                type="text"
                value={nomeCondominioCustom}
                onChange={(e) => setNomeCondominioCustom(e.target.value)}
                placeholder="Ex: Condomínio Residencial Bella Vista"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Número de Unidades *</label>
            <input
              type="number"
              min={1}
              max={500}
              value={numeroUnidades}
              onChange={(e) => handleNumeroUnidadesChange(parseInt(e.target.value) || 1)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Data de Vencimento do Boleto</label>
            <input
              type="text"
              value={vencimentoBoleto}
              onChange={(e) => setVencimentoBoleto(e.target.value)}
              placeholder="Ex: 10/08/2026"
              className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
            />
          </div>
        </div>

        {/* Action Status Bar */}
        {ultimaAtualizacao && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Dados recalculados e atualizados às {ultimaAtualizacao}
            </span>
          </div>
        )}
      </div>
      {/* SEÇÃO 1: RELATÓRIO DESPESAS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 print:border-none print:p-0">
        <div className="border-b pb-4 border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1c3220] uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#2d5a32]" />
              <span>1 - Relatório de Despesas & Resumo Financeiro do Mês</span>
            </h3>
            <p className="text-xs text-slate-500">
              Discriminação ordenada de todas as despesas operacionais ordinárias, fundos, obras extraordinárias e saneamento
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 print:hidden text-xs">
            <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Itens no PDF:</span>
            <button
              type="button"
              onClick={() => setSecoesRelatorioPDF({ ordinarias: true, fundoReserva: true, extraordinarias: true, fundoPintura: true, fundoObras: true, aguaSaneamento: true, demonstrativoIndividual: true })}
              className="text-[11px] font-bold text-[#2d5a32] hover:underline cursor-pointer"
            >
              Marcar Todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setSecoesRelatorioPDF({ ordinarias: false, fundoReserva: false, extraordinarias: false, fundoPintura: false, fundoObras: false, aguaSaneamento: false, demonstrativoIndividual: false })}
              className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        {/* Tabelas Empilhadas em Ordem Estrita */}
        <div className="space-y-6">
          {/* 1. Cota Básica (Despesas Ordinárias do Mês) */}
          <div className={`bg-[#e8f0e6] p-4 rounded-xl border border-emerald-200/60 space-y-3 transition-all ${!secoesRelatorioPDF.ordinarias ? 'print:hidden opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-slate-700 select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.ordinarias}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, ordinarias: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.ordinarias ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2d5a32]"></span>
                  <span>1. Cota básica (despesas ordinárias do mês)</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={addDespesaOrdinaria}
                className="bg-white border border-[#2d5a32] text-[#2d5a32] hover:bg-[#2d5a32] hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer print:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Descrição</th>
                    <th className="py-2 px-2 w-32">Vencimento / Ref</th>
                    <th className="py-2 px-2 w-32 text-right">Valor (R$)</th>
                    <th className="py-2 px-1 w-8 text-center print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {despesasOrdinarias.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-100/60 transition-colors">
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={d.descricao}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDespesasOrdinarias((prev) =>
                              prev.map((item) => (item.id === d.id ? { ...item, descricao: val } : item))
                            );
                          }}
                          className="w-full bg-transparent font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#2d5a32] rounded px-1"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={d.vencimentoReferencia}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDespesasOrdinarias((prev) =>
                              prev.map((item) => (item.id === d.id ? { ...item, vencimentoReferencia: val } : item))
                            );
                          }}
                          className="w-full bg-transparent text-slate-600 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#2d5a32] rounded px-1 font-mono text-[11px]"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={d.valor}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDespesasOrdinarias((prev) =>
                              prev.map((item) => (item.id === d.id ? { ...item, valor: val } : item))
                            );
                          }}
                          className="w-full bg-transparent text-right font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#2d5a32] rounded px-1"
                        />
                      </td>
                      <td className="py-1.5 px-1 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => removeDespesaOrdinaria(d.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-bold text-[#1c3220]">
                    <td colSpan={2} className="py-2 px-2 text-right">
                      Subtotal Cota Básica (Ordinárias):
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-sm">{formatarMoeda(totalOrdinarias)}</td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <TabelaFracoesBreakdown
              demonstrativoUnidades={demonstrativoUnidades}
              getValue={(u) => u.cotaBasica}
              titulo="Rateio por Grupo de Fração (Cota Básica / Despesas Ordinárias)"
              tipoRateio={tipoCotaBasica}
              onTipoRateioChange={setTipoCotaBasica}
              unidadesConfig={unidadesConfig}
              setUnidadesConfig={setUnidadesConfig}
            />
          </div>

          {/* 2. Fundo Reserva */}
          <div className={`bg-[#e8f0e6] p-4 rounded-xl border border-emerald-200/60 space-y-3 transition-all ${!secoesRelatorioPDF.fundoReserva ? 'print:hidden opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-slate-700 select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.fundoReserva}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, fundoReserva: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.fundoReserva ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>2. Fundo Reserva</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Total Arrecadado: {formatarMoeda(totaisDemonstrativo.fundoReserva)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Tipo de Regra / Cálculo</th>
                    <th className="py-2 px-2 w-48 text-center">Alíquota / Valor por Unidade</th>
                    <th className="py-2 px-2 w-48 text-right">Total Calculado do Fundo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-slate-100/60 transition-colors">
                    <td className="py-2 px-2">
                      <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">% Percentual sobre a Cota Básica</div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={fundoReservaValor}
                          onChange={(e) => setFundoReservaValor(parseFloat(e.target.value) || 0)}
                          className="w-28 p-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 text-right bg-white focus:ring-1 focus:ring-[#2d5a32] focus:outline-none"
                        />
                        <span className="font-bold text-slate-600">%</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-800 text-sm">
                      {formatarMoeda(totaisDemonstrativo.fundoReserva)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <TabelaFracoesBreakdown
              demonstrativoUnidades={demonstrativoUnidades}
              getValue={(u) => u.fundoReserva}
              titulo="Rateio por Grupo de Fração (Fundo Reserva)"
              tipoRateio={tipoRateioFundoReserva}
              onTipoRateioChange={setTipoRateioFundoReserva}
              unidadesConfig={unidadesConfig}
              setUnidadesConfig={setUnidadesConfig}
            />
          </div>

          {/* 3. Despesas Extraordinárias e Obras */}
          <div className={`bg-[#e8f0e6] p-4 rounded-xl border border-emerald-200/60 space-y-3 transition-all ${!secoesRelatorioPDF.extraordinarias ? 'print:hidden opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-slate-700 select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.extraordinarias}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, extraordinarias: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.extraordinarias ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  <span>3. Despesas Extraordinárias e Obras</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={addDespesaExtraordinaria}
                className="bg-white border border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer print:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Obra</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Descrição da Obra</th>
                    <th className="py-2 px-2 w-28 text-center">% Rateio</th>
                    <th className="py-2 px-2 w-32 text-right">Valor R$</th>
                    <th className="py-2 px-1 w-8 text-center print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {despesasExtraordinarias.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-100/60 transition-colors">
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={e.descricao}
                          onChange={(ev) => {
                            const val = ev.target.value;
                            setDespesasExtraordinarias((prev) =>
                              prev.map((item) => (item.id === e.id ? { ...item, descricao: val } : item))
                            );
                          }}
                          className="w-full bg-transparent font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 rounded px-1"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          value={e.percentualRateio}
                          onChange={(ev) => {
                            const val = parseFloat(ev.target.value) || 0;
                            setDespesasExtraordinarias((prev) =>
                              prev.map((item) => (item.id === e.id ? { ...item, percentualRateio: val } : item))
                            );
                          }}
                          className="w-full bg-transparent text-center font-mono text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 rounded px-1 text-[11px]"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={e.valor}
                          onChange={(ev) => {
                            const val = parseFloat(ev.target.value) || 0;
                            setDespesasExtraordinarias((prev) =>
                              prev.map((item) => (item.id === e.id ? { ...item, valor: val } : item))
                            );
                          }}
                          className="w-full bg-transparent text-right font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 rounded px-1"
                        />
                      </td>
                      <td className="py-1.5 px-1 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => removeDespesaExtraordinaria(e.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-bold text-[#1c3220]">
                    <td colSpan={2} className="py-2 px-2 text-right">
                      Subtotal Extraordinárias:
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-sm">{formatarMoeda(totalExtraordinarias)}</td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <TabelaFracoesBreakdown
              demonstrativoUnidades={demonstrativoUnidades}
              getValue={(u) => u.despesaExtra}
              titulo="Rateio por Grupo de Fração (Despesas Extraordinárias)"
              tipoRateio={tipoDespesaExtra}
              onTipoRateioChange={setTipoDespesaExtra}
              unidadesConfig={unidadesConfig}
              setUnidadesConfig={setUnidadesConfig}
            />
          </div>

          {/* 4. Fundo Pintura */}
          <div className={`bg-[#e8f0e6] p-4 rounded-xl border border-emerald-200/60 space-y-3 transition-all ${!secoesRelatorioPDF.fundoPintura ? 'print:hidden opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-slate-700 select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.fundoPintura}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, fundoPintura: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.fundoPintura ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <span>4. Fundo Pintura</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-300">
                Total Arrecadado: {formatarMoeda(totaisDemonstrativo.fundoPintura)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Descrição / Destinação</th>
                    <th className="py-2 px-2 w-48 text-center">Valor por Unidade (R$/Un)</th>
                    <th className="py-2 px-2 w-48 text-right">Total Calculado do Fundo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-slate-100/60 transition-colors">
                    <td className="py-2 px-2 font-medium text-slate-700">
                      Fundo de Reserva Especial para Pintura de Fachada e Paredes
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-slate-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={fundoPinturaPorUnidade}
                          onChange={(e) => setFundoPinturaPorUnidade(parseFloat(e.target.value) || 0)}
                          className="w-28 p-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 text-right bg-white focus:ring-1 focus:ring-[#2d5a32] focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-indigo-800 text-sm">
                      {formatarMoeda(totaisDemonstrativo.fundoPintura)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <TabelaFracoesBreakdown
              demonstrativoUnidades={demonstrativoUnidades}
              getValue={(u) => u.fundoPintura}
              titulo="Rateio por Grupo de Fração (Fundo Pintura)"
              tipoRateio={tipoFundoPintura}
              onTipoRateioChange={setTipoFundoPintura}
              unidadesConfig={unidadesConfig}
              setUnidadesConfig={setUnidadesConfig}
            />
          </div>

          {/* 5. Fundo Obras */}
          <div className={`bg-[#e8f0e6] p-4 rounded-xl border border-emerald-200/60 space-y-3 transition-all ${!secoesRelatorioPDF.fundoObras ? 'print:hidden opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-slate-700 select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.fundoObras}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, fundoObras: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.fundoObras ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <span>5. Fundo Obras</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
                Total Arrecadado: {formatarMoeda(totaisDemonstrativo.fundoObras)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Descrição / Destinação</th>
                    <th className="py-2 px-2 w-48 text-center">Valor por Unidade (R$/Un)</th>
                    <th className="py-2 px-2 w-48 text-right">Total Calculado do Fundo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-slate-100/60 transition-colors">
                    <td className="py-2 px-2 font-medium text-slate-700">
                      <input
                        type="text"
                        value={descricaoFundoObras}
                        onChange={(e) => setDescricaoFundoObras(e.target.value)}
                        className="w-full p-1.5 border-b border-transparent hover:border-slate-300 focus:border-purple-500 bg-transparent focus:bg-white focus:outline-none transition-all"
                        placeholder="Ex: Fundo Permanente de Obras..."
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-slate-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={fundoObrasPorUnidade}
                          onChange={(e) => setFundoObrasPorUnidade(parseFloat(e.target.value) || 0)}
                          className="w-28 p-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 text-right bg-white focus:ring-1 focus:ring-[#2d5a32] focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-purple-800 text-sm">
                      {formatarMoeda(totaisDemonstrativo.fundoObras)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <TabelaFracoesBreakdown
              demonstrativoUnidades={demonstrativoUnidades}
              getValue={(u) => u.fundoObras}
              titulo="Rateio por Grupo de Fração (Fundo Obras)"
              tipoRateio={tipoFundoObras}
              onTipoRateioChange={setTipoFundoObras}
              unidadesConfig={unidadesConfig}
              setUnidadesConfig={setUnidadesConfig}
            />
          </div>

          {/* 6. Custos de Água e Saneamento do Mês */}
          <div className={`bg-[#e8f0e6] p-4 rounded-xl border border-emerald-200/60 space-y-3 transition-all ${!secoesRelatorioPDF.aguaSaneamento ? 'print:hidden opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-sky-300 hover:border-sky-400 text-[11px] font-bold text-sky-900 select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.aguaSaneamento}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, aguaSaneamento: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.aguaSaneamento ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-sky-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                  <span>6. Custos de Água e Saneamento do Mês</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-sky-900 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-300">
                Total Água: {formatarMoeda(totalAgua)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-sky-200 text-sky-700 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Componente de Consumo</th>
                    <th className="py-2 px-2 w-48 text-right">Valor Total Apurado (R$)</th>
                    <th className="py-2 px-2 w-48 text-right">Média por Unidade (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-200/60 bg-white">
                  <tr>
                    <td className="py-2 px-2 font-medium text-slate-800">
                      Taxa Mínima de Água & Esgoto (
                      <input
                        type="text"
                        value={composicaoAgua}
                        onChange={(e) => setComposicaoAgua(e.target.value)}
                        className="inline-block w-40 px-1 py-0.5 text-xs border-b border-transparent hover:border-slate-300 focus:border-sky-500 bg-transparent focus:bg-white focus:outline-none transition-all text-sky-800 font-bold"
                      />
                      )
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={taxaMinimaAgua}
                        onChange={(e) => setTaxaMinimaAgua(parseFloat(e.target.value) || 0)}
                        className="w-32 p-1 border border-slate-300 rounded font-mono font-bold text-right text-slate-800 bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-600">
                      {formatarMoeda((taxaMinimaAgua || 0) / (numeroUnidades || 1))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-medium text-slate-800">Excedente de Consumo (Medição Individualizada/Hidrômetros)</td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={excedenteAguaTotal}
                        onChange={(e) => setExcedenteAguaTotal(parseFloat(e.target.value) || 0)}
                        className="w-32 p-1 border border-slate-300 rounded font-mono font-bold text-right text-slate-800 bg-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-600">
                      {formatarMoeda((excedenteAguaTotal || 0) / (numeroUnidades || 1))}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-sky-300 font-bold text-sky-950 bg-sky-100/70">
                    <td className="py-2 px-2 uppercase text-right">Subtotal Água e Saneamento:</td>
                    <td className="py-2 px-2 text-right font-mono text-sm">{formatarMoeda(totalAgua)}</td>
                    <td className="py-2 px-2 text-right font-mono text-xs">{formatarMoeda(totalAgua / (numeroUnidades || 1))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <TabelaFracoesBreakdown
              demonstrativoUnidades={demonstrativoUnidades}
              getValue={(u) => escopoRateioAgua === 'apenas_excedente' ? u.excedenteAguaUnidade : u.taxaMinAguaUnidade + u.excedenteAguaUnidade}
              titulo="Rateio por Grupo de Fração (Água & Saneamento)"
              borderColor="border-sky-200"
              tipoRateio={tipoRateioAgua}
              onTipoRateioChange={setTipoRateioAgua}
              unidadesConfig={unidadesConfig}
              setUnidadesConfig={setUnidadesConfig}
              escopoRateioAgua={escopoRateioAgua}
              onEscopoRateioAguaChange={setEscopoRateioAgua}
              taxaMinimaAgua={taxaMinimaAgua}
              excedenteAguaTotal={excedenteAguaTotal}
            />
          </div>

          {/* 7. Taxa de Boleto */}
          <div className={`bg-[#e8f0e6] p-4 rounded-xl border border-emerald-200/60 space-y-3 transition-all ${!secoesRelatorioPDF.taxaBoleto ? 'print:hidden opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-emerald-300 hover:border-emerald-400 text-[11px] font-bold text-emerald-900 select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.taxaBoleto}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, taxaBoleto: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.taxaBoleto ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-[#2d5a32] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2d5a32]"></span>
                  <span>7. Taxa de Boleto</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Total Previsto: {formatarMoeda(totalTaxaBoletoCalculado)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-emerald-200 text-emerald-800 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Descrição</th>
                    <th className="py-2 px-2 w-48 text-right">Valor por Unidade (R$)</th>
                    <th className="py-2 px-2 w-48 text-right">Valor Total Apurado (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-200/60 bg-white">
                  <tr>
                    <td className="py-2 px-2 font-medium text-slate-800">
                      Taxa de Emissão de Boleto (Cobrança)
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={taxaBoletoValor}
                        onChange={(e) => setTaxaBoletoValor(parseFloat(e.target.value) || 0)}
                        className="w-32 p-1 border border-slate-300 rounded font-mono font-bold text-right text-slate-800 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-800">
                      {formatarMoeda(totalTaxaBoletoCalculado)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Total Geral Card */}
        <div className="bg-[#1c3220] text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
          <div>
            <span className="text-emerald-300 print:text-[#2d5a32] text-xs font-bold uppercase tracking-wider">
              Total Geral de Despesas do Período - {mesReferencia}
            </span>
            <p className="text-xs text-emerald-100/80 mt-0.5 print:hidden">
              Soma: 1. Cota Básica (Ordinárias): {formatarMoeda(totalOrdinarias)} | 2. Fundo Reserva: {formatarMoeda(totalFundoReservaCalculado)} | 3. Extraordinárias: {formatarMoeda(totalExtraordinarias)} | 4. Fundo Pintura: {formatarMoeda(totalFundoPinturaCalculado)} | 5. Fundo Obras: {formatarMoeda(totalFundoObrasCalculado)} | 6. Água: {formatarMoeda(totalAgua)} | 7. Taxa de Boleto: {formatarMoeda(totalTaxaBoletoCalculado)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black font-mono text-emerald-300 print:text-[#2d5a32]">
              {formatarMoeda(totalGeralDespesasMes)}
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: FRAÇÃO POR MORADOR - DEMONSTRATIVO INDIVIDUAL */}
      <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 print:border-none print:p-0 transition-all ${!secoesRelatorioPDF.demonstrativoIndividual ? 'print:hidden opacity-60' : ''}`}>
        <div className="border-b pb-4 border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-slate-700 select-none shadow-2xs print:hidden">
                <input
                  type="checkbox"
                  checked={secoesRelatorioPDF.demonstrativoIndividual}
                  onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, demonstrativoIndividual: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer"
                />
                <span>{secoesRelatorioPDF.demonstrativoIndividual ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
              </label>
              <h3 className="text-base font-bold text-[#1c3220] uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2d5a32]" />
                <span>2 - Demonstrativo Individual por Unidade (Fração por Morador)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Cálculo preciso com duas casas decimais (R$ 0,00) com composição detalhada de cota, fundos e consumo por morador
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Arrecadado</span>
            <span className="text-lg font-mono font-bold text-[#2d5a32]">
              {formatarMoeda(totaisDemonstrativo.totalGeral)}
            </span>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1c3220] text-white font-bold text-[11px]">
                {colunasPDF.unidade && (
                  <th className="py-2 px-2 text-left group">
                    <div className="flex flex-col items-start justify-center gap-1.5">
                      <span>Unidade</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.unidade} onChange={(e) => setColunasPDF(prev => ({...prev, unidade: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.unidade && (
                  <th className="py-2 px-2 text-left print:hidden group">
                    <div className="flex flex-col items-start justify-center gap-1.5 opacity-50">
                      <span>Unidade</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.unidade} onChange={(e) => setColunasPDF(prev => ({...prev, unidade: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.vencimento && (
                  <th className="py-2 px-2 text-center group">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span>Vencimento</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.vencimento} onChange={(e) => setColunasPDF(prev => ({...prev, vencimento: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.vencimento && (
                  <th className="py-2 px-2 text-center print:hidden group">
                    <div className="flex flex-col items-center justify-center gap-1.5 opacity-50">
                      <span>Vencimento</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.vencimento} onChange={(e) => setColunasPDF(prev => ({...prev, vencimento: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.taxaBoleto && (
                  <th className="py-2 px-2 text-right group">
                    <div className="flex flex-col items-end justify-center gap-1.5">
                      <span>Taxa de boleto</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.taxaBoleto} onChange={(e) => setColunasPDF(prev => ({...prev, taxaBoleto: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.taxaBoleto && (
                  <th className="py-2 px-2 text-right print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50">
                      <span>Taxa de boleto</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.taxaBoleto} onChange={(e) => setColunasPDF(prev => ({...prev, taxaBoleto: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.cotaBasica && (
                  <th className="py-2 px-2 text-right group">
                    <div className="flex flex-col items-end justify-center gap-1.5">
                      <span>Cota Basica</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.cotaBasica} onChange={(e) => setColunasPDF(prev => ({...prev, cotaBasica: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.cotaBasica && (
                  <th className="py-2 px-2 text-right print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50">
                      <span>Cota Basica</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.cotaBasica} onChange={(e) => setColunasPDF(prev => ({...prev, cotaBasica: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.despesaExtraordinaria && (
                  <th className="py-2 px-2 text-right group">
                    <div className="flex flex-col items-end justify-center gap-1.5">
                      <span>Despesas Extraordinárias</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.despesaExtraordinaria} onChange={(e) => setColunasPDF(prev => ({...prev, despesaExtraordinaria: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.despesaExtraordinaria && (
                  <th className="py-2 px-2 text-right print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50">
                      <span>Despesas Extraordinárias</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.despesaExtraordinaria} onChange={(e) => setColunasPDF(prev => ({...prev, despesaExtraordinaria: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.fundoObras && (
                  <th className="py-2 px-2 text-right group">
                    <div className="flex flex-col items-end justify-center gap-1.5">
                      <span>Fundo Obras</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.fundoObras} onChange={(e) => setColunasPDF(prev => ({...prev, fundoObras: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.fundoObras && (
                  <th className="py-2 px-2 text-right print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50">
                      <span>Fundo Obras</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.fundoObras} onChange={(e) => setColunasPDF(prev => ({...prev, fundoObras: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.fundoReserva && (
                  <th className="py-2 px-2 text-right group">
                    <div className="flex flex-col items-end justify-center gap-1.5">
                      <span>Fundo de Reserva</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.fundoReserva} onChange={(e) => setColunasPDF(prev => ({...prev, fundoReserva: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.fundoReserva && (
                  <th className="py-2 px-2 text-right print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50">
                      <span>Fundo de Reserva</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.fundoReserva} onChange={(e) => setColunasPDF(prev => ({...prev, fundoReserva: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.fundoPintura && (
                  <th className="py-2 px-2 text-right group">
                    <div className="flex flex-col items-end justify-center gap-1.5">
                      <span>Fundo de Pintura</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.fundoPintura} onChange={(e) => setColunasPDF(prev => ({...prev, fundoPintura: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.fundoPintura && (
                  <th className="py-2 px-2 text-right print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50">
                      <span>Fundo de Pintura</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.fundoPintura} onChange={(e) => setColunasPDF(prev => ({...prev, fundoPintura: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.taxaMinAgua && (
                  <th className="py-2 px-2 text-right group">
                    <div className="flex flex-col items-end justify-center gap-1.5">
                      <span>Taxa Minima Sanepar</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.taxaMinAgua} onChange={(e) => setColunasPDF(prev => ({...prev, taxaMinAgua: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.taxaMinAgua && (
                  <th className="py-2 px-2 text-right print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50">
                      <span>Taxa Minima Sanepar</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.taxaMinAgua} onChange={(e) => setColunasPDF(prev => ({...prev, taxaMinAgua: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.excedenteAgua && (
                  <th className="py-2 px-2 text-right group">
                    <div className="flex flex-col items-end justify-center gap-1.5">
                      <span>Excedente Sanepar</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.excedenteAgua} onChange={(e) => setColunasPDF(prev => ({...prev, excedenteAgua: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.excedenteAgua && (
                  <th className="py-2 px-2 text-right print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50">
                      <span>Excedente Sanepar</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.excedenteAgua} onChange={(e) => setColunasPDF(prev => ({...prev, excedenteAgua: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#2d5a32]" />
                    </div>
                  </th>
                )}

                {colunasPDF.totalUnidade && (
                  <th className="py-2 px-3 text-right bg-[#2d5a32] group">
                    <div className="flex flex-col items-end justify-center gap-1.5 text-white">
                      <span>Total por Unidade</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.totalUnidade} onChange={(e) => setColunasPDF(prev => ({...prev, totalUnidade: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#1c3220]" />
                    </div>
                  </th>
                )}
                {!colunasPDF.totalUnidade && (
                  <th className="py-2 px-3 text-right bg-[#2d5a32] print:hidden group">
                    <div className="flex flex-col items-end justify-center gap-1.5 opacity-50 text-white">
                      <span>Total por Unidade</span>
                      <input type="checkbox" title="Incluir no PDF" checked={colunasPDF.totalUnidade} onChange={(e) => setColunasPDF(prev => ({...prev, totalUnidade: e.target.checked}))} className="w-3 h-3 cursor-pointer print:hidden accent-[#1c3220]" />
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {demonstrativoUnidades.map((row, idx) => (
                <tr
                  key={row.unidadeId}
                  className={idx % 2 === 0 ? 'bg-white hover:bg-emerald-50/50' : 'bg-slate-50/60 hover:bg-emerald-50/50'}
                >
                  {colunasPDF.unidade && (
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.nomeUnidade}
                        onChange={(e) => handleNomeUnidadeChange(row.unidadeId, e.target.value)}
                        title="Clique para editar o nome ou número da unidade"
                        className="w-full min-w-[85px] max-w-[140px] px-2 py-1 text-xs font-bold text-slate-800 bg-white/80 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-400 focus:border-[#2d5a32] rounded-lg transition-colors focus:ring-1 focus:ring-[#2d5a32] focus:outline-none print:border-none print:bg-transparent print:p-0 print:text-xs print:font-bold"
                      />
                    </td>
                  )}
                  {!colunasPDF.unidade && (
                    <td className="py-1.5 px-2 print:hidden opacity-30">
                      <span className="px-2 py-1 text-xs font-bold text-slate-800 bg-transparent">{row.nomeUnidade}</span>
                    </td>
                  )}
                  {colunasPDF.vencimento && <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">{row.vencimento}</td>}
                  {!colunasPDF.vencimento && <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px] opacity-30 print:hidden">{row.vencimento}</td>}
                  
                  {colunasPDF.taxaBoleto && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.taxaBoleto)}</td>}
                  {!colunasPDF.taxaBoleto && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.taxaBoleto)}</td>}
                  
                  {colunasPDF.cotaBasica && <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800">{formatarMoeda(row.cotaBasica)}</td>}
                  {!colunasPDF.cotaBasica && <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800 opacity-30 print:hidden">{formatarMoeda(row.cotaBasica)}</td>}
                  
                  {colunasPDF.despesaExtraordinaria && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.despesaExtra || 0)}</td>}
                  {!colunasPDF.despesaExtraordinaria && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.despesaExtra || 0)}</td>}

                  {colunasPDF.fundoObras && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.fundoObras)}</td>}
                  {!colunasPDF.fundoObras && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.fundoObras)}</td>}

                  {colunasPDF.fundoReserva && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.fundoReserva)}</td>}
                  {!colunasPDF.fundoReserva && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.fundoReserva)}</td>}
                  
                  {colunasPDF.fundoPintura && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.fundoPintura)}</td>}
                  {!colunasPDF.fundoPintura && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.fundoPintura)}</td>}

                  {colunasPDF.taxaMinAgua && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.taxaMinAguaUnidade)}</td>}
                  {!colunasPDF.taxaMinAgua && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.taxaMinAguaUnidade)}</td>}
                  
                  {colunasPDF.excedenteAgua && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.excedenteAguaUnidade)}</td>}
                  {!colunasPDF.excedenteAgua && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.excedenteAguaUnidade)}</td>}
                  
                  {colunasPDF.totalUnidade && (
                    <td className="py-2.5 px-3 text-right font-mono font-black text-[#2d5a32] bg-emerald-50/80">
                      {formatarMoeda(row.totalUnidade)}
                    </td>
                  )}
                  {!colunasPDF.totalUnidade && (
                    <td className="py-2.5 px-3 text-right font-mono font-black text-[#2d5a32] bg-emerald-50/80 opacity-30 print:hidden">
                      {formatarMoeda(row.totalUnidade)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold text-xs">
                {colunasPDF.unidade && (
                  <td className="py-3 px-3 uppercase tracking-wider text-white">
                    Soma - {numeroUnidades} un
                  </td>
                )}
                {!colunasPDF.unidade && (
                  <td className="py-3 px-3 uppercase tracking-wider text-white opacity-30 print:hidden">
                    Soma - {numeroUnidades} un
                  </td>
                )}
                {colunasPDF.vencimento && <td></td>}
                {!colunasPDF.vencimento && <td className="print:hidden"></td>}

                {colunasPDF.taxaBoleto && <td className="py-3 px-2 text-right font-mono text-white">{formatarMoeda(totaisDemonstrativo.taxaBoleto)}</td>}
                {!colunasPDF.taxaBoleto && <td className="py-3 px-2 text-right font-mono text-white opacity-30 print:hidden">{formatarMoeda(totaisDemonstrativo.taxaBoleto)}</td>}
                
                {colunasPDF.cotaBasica && <td className="py-3 px-2 text-right font-mono text-white">{formatarMoeda(totaisDemonstrativo.cotaBasica)}</td>}
                {!colunasPDF.cotaBasica && <td className="py-3 px-2 text-right font-mono text-white opacity-30 print:hidden">{formatarMoeda(totaisDemonstrativo.cotaBasica)}</td>}
                
                {colunasPDF.despesaExtraordinaria && <td className="py-3 px-2 text-right font-mono text-white">{formatarMoeda(totaisDemonstrativo.despesaExtra)}</td>}
                {!colunasPDF.despesaExtraordinaria && <td className="py-3 px-2 text-right font-mono text-white opacity-30 print:hidden">{formatarMoeda(totaisDemonstrativo.despesaExtra)}</td>}
                
                {colunasPDF.fundoObras && <td className="py-3 px-2 text-right font-mono text-white">{formatarMoeda(totaisDemonstrativo.fundoObras)}</td>}
                {!colunasPDF.fundoObras && <td className="py-3 px-2 text-right font-mono text-white opacity-30 print:hidden">{formatarMoeda(totaisDemonstrativo.fundoObras)}</td>}

                {colunasPDF.fundoReserva && <td className="py-3 px-2 text-right font-mono text-white">{formatarMoeda(totaisDemonstrativo.fundoReserva)}</td>}
                {!colunasPDF.fundoReserva && <td className="py-3 px-2 text-right font-mono text-white opacity-30 print:hidden">{formatarMoeda(totaisDemonstrativo.fundoReserva)}</td>}
                
                {colunasPDF.fundoPintura && <td className="py-3 px-2 text-right font-mono text-white">{formatarMoeda(totaisDemonstrativo.fundoPintura)}</td>}
                {!colunasPDF.fundoPintura && <td className="py-3 px-2 text-right font-mono text-white opacity-30 print:hidden">{formatarMoeda(totaisDemonstrativo.fundoPintura)}</td>}

                {colunasPDF.taxaMinAgua && <td className="py-3 px-2 text-right font-mono text-white">{formatarMoeda(totaisDemonstrativo.taxaMinAguaUnidade)}</td>}
                {!colunasPDF.taxaMinAgua && <td className="py-3 px-2 text-right font-mono text-white opacity-30 print:hidden">{formatarMoeda(totaisDemonstrativo.taxaMinAguaUnidade)}</td>}
                
                {colunasPDF.excedenteAgua && <td className="py-3 px-2 text-right font-mono text-white">{formatarMoeda(totaisDemonstrativo.excedenteAguaUnidade)}</td>}
                {!colunasPDF.excedenteAgua && <td className="py-3 px-2 text-right font-mono text-white opacity-30 print:hidden">{formatarMoeda(totaisDemonstrativo.excedenteAguaUnidade)}</td>}
                
                {colunasPDF.totalUnidade && (
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-300 bg-slate-900 text-sm">
                    {formatarMoeda(totaisDemonstrativo.totalGeral)}
                  </td>
                )}
                {!colunasPDF.totalUnidade && (
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-300 bg-slate-900 text-sm opacity-30 print:hidden">
                    {formatarMoeda(totaisDemonstrativo.totalGeral)}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* OBSERVAÇÕES DE AUDITORIA CARD */}
        <div className="pt-2 print:hidden">
          {temInconsistenciaFracao || temDiferencaValor ? (
            <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 uppercase tracking-wider text-xs">
                  Observações de Auditoria e Inconsistências Detectadas
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                  {temInconsistenciaFracao && (
                    <li>
                      <strong>Fração Ideal Incompleta:</strong> A soma das frações ideais cadastradas é de{' '}
                      <strong>{somaFracoesTotais.toFixed(2)}%</strong> (Divergente do total de 100,00%). Ajuste os percentuais na matriz de frações.
                    </li>
                  )}
                  {temDiferencaValor && (
                    <li>
                      <strong>Diferença de Arredondamento / Valor:</strong> O valor total esperado das despesas e taxas de emissão é de{' '}
                      <strong>{formatarMoeda(totalArrecadacaoEsperada)}</strong>, enquanto o demonstrativo individual totaliza{' '}
                      <strong>{formatarMoeda(totaisDemonstrativo.totalGeral)}</strong> (Diferença de {formatarMoeda(diferencaAuditoria)}).
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-900 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-900 uppercase tracking-wider text-xs">
                  Observações de Auditoria - Validação Green OK
                </h4>
                <p className="text-[11px] text-emerald-800">
                  O somatório individual das {numeroUnidades} unidades bate rigorosamente com o Total Geral de Despesas + Fundos e Taxas de Emissão ({formatarMoeda(totaisDemonstrativo.totalGeral)}). As frações ideais fecham exatamente em 100,00%.
                </p>
              </div>
            </div>
          )}

          {/* Action Bar at Bottom of Report */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 print:hidden">
            <p className="text-xs font-semibold text-slate-500">
              Relatório pronto para exportação, impressão ou envio aos condôminos em PDF.
            </p>
            <button
              onClick={handlePrint}
              className="bg-[#2d5a32] hover:bg-[#1f4223] active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
