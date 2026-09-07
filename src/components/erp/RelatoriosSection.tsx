import React, { useState, useMemo, useEffect } from 'react';
import { Condominio } from '../../types';
import { formatarMoeda, calcularSaudeCondominio } from '../../utils/pricingEngine';
import { apiGetRelatoriosOrcamento, apiSaveRelatorioOrcamento, apiDeleteRelatorioOrcamento } from '../../services/api';
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
  Droplets,
  Save,
  Search,
  Folder,
  FolderOpen,
  Eye,
  Calendar,
  Tag,
  ArrowRight,
  CheckCheck,
  Clock,
  ExternalLink,
  Bookmark,
  Layers,
  Activity,
  Copy,
  AlignLeft
} from 'lucide-react';

export interface OrcamentoRelatorioSalvo {
  id: string;
  titulo: string;
  dataSalvamento: string;
  timestamp: number;
  condominioId: string;
  nomeCondominio: string;
  mesReferencia: string;
  numeroUnidades: number;
  vencimentoBoleto: string;
  totalGeral: number;
  totalOrdinarias: number;
  totalFundoReserva: number;
  totalExtraordinarias: number;
  totalFundoPintura: number;
  totalFundoObras: number;
  totalAgua: number;
  observacoes?: string;
  // Snapshot completo das tabelas e regras
  despesasOrdinarias: DespesaOrdinaria[];
  despesasExtraordinarias: DespesaExtraordinaria[];
  unidadesConfig: UnidadeConfig[];
  taxaMinimaAgua: number;
  excedenteAguaTotal: number;
  escopoRateioAgua: 'total_com_taxa_minima' | 'apenas_excedente';
  excedentesExtras?: { id: string; nome: string; valor: number }[];
  tipoCotaBasica: 'fracao_ideal' | 'divisao_igual' | 'moradores';
  tipoRateioFundoReserva: 'fracao_ideal' | 'divisao_igual' | 'moradores';
  tipoDespesaExtra: 'fracao_ideal' | 'divisao_igual' | 'moradores';
  tipoFundoPintura: string;
  tipoFundoObras: string;
  tipoRateioAgua: 'fracao_ideal' | 'divisao_igual' | 'moradores';
  tipoRateioTaxaMinAgua: 'fracao_ideal' | 'divisao_igual' | 'moradores';
  tipoRateioExcedente: 'fracao_ideal' | 'divisao_igual' | 'moradores';
  fundoReservaValor: number;
  fundoPinturaPorUnidade: number;
  fundoObrasPorUnidade: number;
  taxaBoletoValor: number;
  descricaoFundoObras?: string;
  composicaoAgua?: string;
}

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

  const somaTotalFracoes = useMemo(() => {
    return demonstrativoUnidades.reduce((acc, u) => acc + (Number(u.fracaoIdeal) || 0), 0);
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
        <div className="bg-sky-50/90 border border-sky-200/90 p-3 rounded-xl space-y-2 print:hidden">
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
                  Valor Total Apurado do Rateio = Excedente de Consumo
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
                  Valor Total Apurado do Rateio = Taxa Mínima Sanepar + Excedente de Consumo
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
              <th className="py-2 px-2.5 w-36 text-center text-black font-bold">
                {tipoRateio === 'moradores' ? 'Nº Moradores' : tipoRateio === 'divisao_igual' ? 'Critério' : 'Fração (%)'}
              </th>
              <th className="py-2 px-2.5 text-black font-bold">Unidades de Residências</th>
              <th className="py-2 px-2.5 w-48 text-right text-black font-bold">Valor Total Pago pelo Grupo</th>
              <th className="py-2 px-2.5 w-44 text-right text-black font-bold">Valor Unitário do Grupo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {grupos.map((g, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="py-2 px-2.5 text-center font-mono font-bold text-black bg-slate-50/60">
                  {g.keyLabel}
                </td>
                <td className="py-2 px-2.5">
                  <span className="font-semibold text-black">
                    {g.unidades.length} {g.unidades.length === 1 ? 'unidade' : 'unidades'}
                  </span>
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-bold text-black">
                  {formatarMoeda(g.totalGrupo)}
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-bold text-black">
                  {formatarMoeda(g.valorUnitario)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/90 font-bold text-black border-t border-slate-200 text-xs">
              <td colSpan={2} className="py-2 px-2.5 text-right uppercase text-black font-bold">
                {tipoRateio === 'fracao_ideal'
                  ? 'Subtotal do Rateio por Fração Ideal:'
                  : tipoRateio === 'moradores'
                    ? 'Subtotal do Rateio por Nº de Moradores:'
                    : 'Subtotal da Divisão Igualitária:'}
              </td>
              <td className="py-2 px-2.5 text-right font-mono font-black text-black">
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
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${
                        Math.abs(somaTotalFracoes - 100) < 0.01 
                          ? 'text-emerald-700 bg-emerald-50/80' 
                          : 'text-amber-700 bg-amber-50/80'
                      }`}>
                        {somaTotalFracoes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%
                      </td>
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
        // Se o condomínio NÃO tiver templates de unidades configurados,
        // inicializa com valores genéricos. Caso contrário, o useEffect de
        // templates (que monitora templatesRelatorioKey) irá populá-las corretamente.
        if (!c.templatesRelatorio?.unidadesPadrao || c.templatesRelatorio.unidadesPadrao.length === 0) {
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

  const handleFracaoUnidadeChange = (unidadeId: number, valor: string) => {
    const num = parseFloat(valor.replace(',', '.')) || 0;
    setUnidadesConfig((prev) =>
      prev.map((u) => (u.unidadeId === unidadeId ? { ...u, fracaoIdeal: num } : u))
    );
  };

  const handleMoradoresUnidadeChange = (unidadeId: number, valor: string) => {
    const num = Math.max(0, parseInt(valor) || 0);
    setUnidadesConfig((prev) =>
      prev.map((u) => (u.unidadeId === unidadeId ? { ...u, moradores: num } : u))
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
  const [tipoRateioTaxaMinAgua, setTipoRateioTaxaMinAgua] = useState<'fracao_ideal' | 'divisao_igual' | 'moradores'>('moradores');
  const [tipoRateioExcedente, setTipoRateioExcedente] = useState<'fracao_ideal' | 'divisao_igual' | 'moradores'>('moradores');


  const [fundoReservaValor, setFundoReservaValor] = useState<number>(10); // 10% or R$ 50
  const [fundoPinturaPorUnidade, setFundoPinturaPorUnidade] = useState<number>(25.0);
  const [fundoObrasPorUnidade, setFundoObrasPorUnidade] = useState<number>(15.0);
  const [taxaBoletoValor, setTaxaBoletoValor] = useState<number>(3.50);
  const [vencimentoBoleto, setVencimentoBoleto] = useState<string>('10/08/2026');

  // Textos editáveis baseados nos templates
  const [descricaoFundoObras, setDescricaoFundoObras] = useState<string>('Fundo Permanente de Obras e Manutenção Estrutural Geral');
  const [composicaoAgua, setComposicaoAgua] = useState<string>('Sanepar/Concessionária');

  // Linhas extras de excedente de água (com nome editável)
  const [excedentesExtras, setExcedentesExtras] = useState<{ id: string; nome: string; valor: number }[]>([]);

  const addExcedenteExtra = () => {
    setExcedentesExtras(prev => [...prev, { id: Date.now().toString(), nome: 'Excedente Extra', valor: 0 }]);
  };
  const removeExcedenteExtra = (id: string) => {
    setExcedentesExtras(prev => prev.filter(e => e.id !== id));
  };
  const updateExcedenteExtra = (id: string, field: 'nome' | 'valor', value: string | number) => {
    setExcedentesExtras(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Aplicar templates quando o condomínio for selecionado ou quando o template do condomínio for atualizado
  // Extrai o templatesRelatorio do condomínio selecionado para usar como dependência direta.
  // Assim, qualquer mudança no template (mesmo sem trocar de condomínio) dispara a re-aplicação.
  const templatesRelatorioAtual = useMemo(() => {
    if (!condominioId || condominioId === 'custom') return null;
    const c = condominios.find(c => c.id === condominioId);
    return c?.templatesRelatorio ?? null;
  }, [condominioId, condominios]);

  // Serializa o template em string para que o useEffect detecte mudanças profundas no objeto
  const templatesRelatorioKey = useMemo(() => {
    return JSON.stringify(templatesRelatorioAtual);
  }, [templatesRelatorioAtual]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condominioId, templatesRelatorioKey]);

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

  const totalExcedentesExtras = useMemo(() => {
    return excedentesExtras.reduce((acc, e) => acc + (Number(e.valor) || 0), 0);
  }, [excedentesExtras]);

  const totalAgua = useMemo(() => {
    return (Number(taxaMinimaAgua) || 0) + (Number(excedenteAguaTotal) || 0) + totalExcedentesExtras;
  }, [taxaMinimaAgua, excedenteAguaTotal, totalExcedentesExtras]);

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
      // Taxa Mínima Sanepar usa tipoRateioTaxaMinAgua
      // Excedentes usam tipoRateioExcedente
      let taxaMinAguaUnidade = 0;
      let excedenteAguaUnidade = 0;

      // Taxa Mínima (sempre rateada pelo tipoRateioTaxaMinAgua)
      if (tipoRateioTaxaMinAgua === 'fracao_ideal' && somaFracoesTotais > 0) {
        taxaMinAguaUnidade = (taxaMinimaAgua || 0) * (u.fracaoIdeal / somaFracoesTotais);
      } else if (tipoRateioTaxaMinAgua === 'moradores') {
        taxaMinAguaUnidade = ((taxaMinimaAgua || 0) / totalMoradores) * moradoresUnidade;
      } else {
        taxaMinAguaUnidade = (taxaMinimaAgua || 0) / (numeroUnidades || 1);
      }

      // Se escopo for apenas_excedente, zeramos a taxa mínima no rateio
      if (escopoRateioAgua === 'apenas_excedente') {
        taxaMinAguaUnidade = (taxaMinimaAgua || 0) / (numeroUnidades || 1); // divisão igual fixa
      }

      // Excedente de Consumo usa tipoRateioExcedente
      // totalExcedenteBase = excedente principal + todos os extras (6.2 completo)
      const totalExcedenteBase = (excedenteAguaTotal || 0) + totalExcedentesExtras;

      if (tipoRateioExcedente === 'fracao_ideal' && somaFracoesTotais > 0) {
        excedenteAguaUnidade =
          u.excedenteAguaIndividual !== undefined
            ? u.excedenteAguaIndividual
            : totalExcedenteBase * (u.fracaoIdeal / somaFracoesTotais);
      } else if (tipoRateioExcedente === 'moradores') {
        excedenteAguaUnidade =
          u.excedenteAguaIndividual !== undefined
            ? u.excedenteAguaIndividual
            : (totalExcedenteBase / totalMoradores) * moradoresUnidade;
      } else {
        excedenteAguaUnidade =
          u.excedenteAguaIndividual !== undefined
            ? u.excedenteAguaIndividual
            : totalExcedenteBase / (numeroUnidades || 1);
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

  // ==========================================
  // ESTADOS E FUNÇÕES PARA ORÇAMENTOS SALVOS
  // ==========================================
  const [visualizacaoAba, setVisualizacaoAba] = useState<'editor' | 'pesquisa'>('editor');

  const [relatoriosSalvos, setRelatoriosSalvos] = useState<OrcamentoRelatorioSalvo[]>(() => {
    try {
      const saved = localStorage.getItem('vos_orcamentos_relatorios_salvos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Sincronização e Migração com SQLite em Tempo Real ───────────────────────
  useEffect(() => {
    // 1. Carregar do SQLite
    apiGetRelatoriosOrcamento()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRelatoriosSalvos(data);
        } else {
          // Se o SQLite estiver vazio mas o localStorage local tiver relatórios, salva no SQLite!
          try {
            const local = localStorage.getItem('vos_orcamentos_relatorios_salvos');
            const parsed = local ? JSON.parse(local) : [];
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach((item) => apiSaveRelatorioOrcamento(item).catch(console.error));
              setRelatoriosSalvos(parsed);
            }
          } catch (e) {
            console.warn(e);
          }
        }
      })
      .catch((err) => console.error('Erro ao buscar relatórios do SQLite:', err));

    // 2. Polling contínuo de sincronização a cada 4 segundos
    const intervalId = setInterval(() => {
      apiGetRelatoriosOrcamento()
        .then((data) => {
          if (Array.isArray(data)) {
            setRelatoriosSalvos((prev) => {
              if (prev.length !== data.length || JSON.stringify(prev) !== JSON.stringify(data)) {
                return data;
              }
              return prev;
            });
          }
        })
        .catch(console.error);
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('vos_orcamentos_relatorios_salvos', JSON.stringify(relatoriosSalvos));
    } catch (e) {
      console.warn("Erro ao persistir orçamentos salvos:", e);
    }
  }, [relatoriosSalvos]);

  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtroCondominio, setFiltroCondominio] = useState('todos');
  const [filtroMes, setFiltroMes] = useState('todos');

  // ── Termômetro de Saúde Financeira & Resumo Descritivo (Rateio 2.5 + Saúde 2.2) ──
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  const [textoEditavelCustom, setTextoEditavelCustom] = useState<string | null>(null);

  // Flags para inclusão dinâmica na Caixa de Texto
  const [flagsTextoRateio, setFlagsTextoRateio] = useState<{
    cotaBasica: boolean;
    fundoReserva: boolean;
    extraordinarias: boolean;
    fundoPintura: boolean;
    fundoObras: boolean;
    aguaSaneamento: boolean;
    termometroGeral: boolean;
    itensSaude: { [chave: string]: boolean };
  }>({
    cotaBasica: true,
    fundoReserva: true,
    extraordinarias: true,
    fundoPintura: true,
    fundoObras: true,
    aguaSaneamento: true,
    termometroGeral: true,
    itensSaude: {},
  });

  const toggleFlagRateio = (chave: 'cotaBasica' | 'fundoReserva' | 'extraordinarias' | 'fundoPintura' | 'fundoObras' | 'aguaSaneamento' | 'termometroGeral') => {
    setTextoEditavelCustom(null);
    setFlagsTextoRateio(prev => ({ ...prev, [chave]: !prev[chave] }));
  };

  const toggleFlagSaudeItem = (nomeItem: string) => {
    setTextoEditavelCustom(null);
    setFlagsTextoRateio(prev => ({
      ...prev,
      itensSaude: {
        ...prev.itensSaude,
        [nomeItem]: prev.itensSaude[nomeItem] === false ? true : false
      }
    }));
  };

  const condominioAtual = useMemo(() => {
    if (!condominioId || condominioId === 'custom') return null;
    return condominios.find((c) => c.id === condominioId) || null;
  }, [condominioId, condominios]);

  const saudeFinanceiraDetalhes = useMemo(() => {
    if (!condominioAtual) {
      return {
        itensValidos: [] as { nome: string; valor: number; tipo: 'caixa' | 'fundo' }[],
        saldoTotal: 0,
        score: 0,
        status: 'N/A',
        cor: '#94a3b8',
        mensagem: 'Condomínio personalizado ou sem dados de saúde cadastrados.',
        ratio: 0,
        gastoMedio: 0,
        dataUltimaAlteracao: undefined
      };
    }

    const livreCaixa = Number(condominioAtual.livreCaixa) || 0;
    const fundoObras = Number(condominioAtual.fundoObras) || 0;
    const fundoPintura = Number(condominioAtual.fundoPintura) || 0;
    const fundoReforma = Number(condominioAtual.fundoReforma) || 0;
    const gastoMedio = Number(condominioAtual.gastoMedioMensal) || 0;

    const saudeCalculada = calcularSaudeCondominio(
      livreCaixa,
      fundoObras,
      fundoPintura,
      fundoReforma,
      gastoMedio
    );

    const todosItens: { nome: string; valor: number; tipo: 'caixa' | 'fundo' }[] = [
      { nome: 'Caixa Livre (Saldo Disponível)', valor: livreCaixa, tipo: 'caixa' },
      { nome: 'Fundo de Obras', valor: fundoObras, tipo: 'fundo' },
      { nome: 'Fundo de Pintura', valor: fundoPintura, tipo: 'fundo' },
      { nome: 'Fundo de Reforma / Reserva', valor: fundoReforma, tipo: 'fundo' }
    ];

    // Apenas valores acima de 10,00 reais (conforme solicitado)
    const itensValidos = todosItens.filter((item) => item.valor > 10);

    return {
      itensValidos,
      saldoTotal: saudeCalculada.saldoTotal,
      score: saudeCalculada.score,
      status: saudeCalculada.status,
      cor: saudeCalculada.cor,
      mensagem: saudeCalculada.mensagem,
      ratio: saudeCalculada.ratio,
      gastoMedio,
      dataUltimaAlteracao: condominioAtual.dataUltimaAlteracaoCaixa
    };
  }, [condominioAtual]);

  const textoDescritivoGerado = useMemo(() => {
    const linhas: string[] = [];
    linhas.push(`=======================================================`);
    linhas.push(`DEMONSTRATIVO FINANCEIRO E RATEIO - ${nomeCondominioExibicao.toUpperCase()}`);
    linhas.push(`Mês de Referência: ${mesReferencia} | Vencimento: ${vencimentoBoleto || 'N/A'}`);
    linhas.push(`Total de Unidades: ${numeroUnidades}`);
    linhas.push(`=======================================================\n`);

    const temAlgumItemRateio =
      flagsTextoRateio.cotaBasica ||
      flagsTextoRateio.fundoReserva ||
      flagsTextoRateio.extraordinarias ||
      flagsTextoRateio.fundoPintura ||
      flagsTextoRateio.fundoObras ||
      flagsTextoRateio.aguaSaneamento;

    if (temAlgumItemRateio) {
      linhas.push(`--- 2.5 COMPOSIÇÃO DETALHADA DO RATEIO POR CONDOMÍNIO ---\n`);

      // 1. Cota Básica (Ordinárias)
      if (flagsTextoRateio.cotaBasica) {
        linhas.push(`1. COTA BÁSICA (DESPESAS ORDINÁRIAS DO MÊS) - Subtotal: ${formatarMoeda(totalOrdinarias)}`);
        if (despesasOrdinarias.length > 0) {
          despesasOrdinarias.forEach((d, idx) => {
            const ref = d.vencimentoReferencia ? ` (Ref/Venc: ${d.vencimentoReferencia})` : '';
            linhas.push(`   • ${d.descricao || `Item ${idx + 1}`}${ref}: ${formatarMoeda(d.valor || 0)}`);
          });
        } else {
          linhas.push(`   • Nenhuma despesa ordinária lançada`);
        }
        linhas.push(``);
      }

      // 2. Fundo de Reserva
      if (flagsTextoRateio.fundoReserva) {
        linhas.push(`2. FUNDO DE RESERVA - Total: ${formatarMoeda(totalFundoReservaCalculado)}`);
        linhas.push(`   • Alíquota aplicada: ${fundoReservaValor}% sobre o subtotal de despesas ordinárias (${formatarMoeda(totalOrdinarias)})`);
        linhas.push(``);
      }

      // 3. Extraordinárias e Obras
      if (flagsTextoRateio.extraordinarias) {
        linhas.push(`3. DESPESAS EXTRAORDINÁRIAS E OBRAS - Subtotal: ${formatarMoeda(totalExtraordinarias)}`);
        if (despesasExtraordinarias.length > 0) {
          despesasExtraordinarias.forEach((e, idx) => {
            linhas.push(`   • ${e.descricao || `Obra ${idx + 1}`} (Rateio ${e.percentualRateio}%): ${formatarMoeda(e.valor || 0)}`);
          });
        } else {
          linhas.push(`   • Nenhuma despesa extraordinária lançada`);
        }
        linhas.push(``);
      }

      // 4. Fundo Pintura
      if (flagsTextoRateio.fundoPintura) {
        linhas.push(`4. FUNDO DE PINTURA - Total: ${formatarMoeda(totalFundoPinturaCalculado)}`);
        linhas.push(`   • Valor por unidade: ${formatarMoeda(fundoPinturaPorUnidade)} x ${numeroUnidades} unidades`);
        linhas.push(``);
      }

      // 5. Fundo Obras
      if (flagsTextoRateio.fundoObras) {
        linhas.push(`5. FUNDO DE OBRAS - Total: ${formatarMoeda(totalFundoObrasCalculado)}`);
        linhas.push(`   • ${descricaoFundoObras || 'Fundo Permanente de Obras'}: ${formatarMoeda(fundoObrasPorUnidade)}/unidade (${formatarMoeda(totalFundoObrasCalculado)} total)`);
        linhas.push(``);
      }

      // 6. Custos de Água e Saneamento
      if (flagsTextoRateio.aguaSaneamento) {
        linhas.push(`6. CUSTOS DE ÁGUA E SANEAMENTO - Total: ${formatarMoeda(totalAgua)}`);
        linhas.push(`   • 6.1 Taxa Mínima (${composicaoAgua}): ${formatarMoeda(taxaMinimaAgua || 0)}`);
        linhas.push(`   • 6.2 Excedente de Consumo: ${formatarMoeda(excedenteAguaTotal || 0)}`);
        if (excedentesExtras && excedentesExtras.length > 0) {
          excedentesExtras.forEach((extra) => {
            linhas.push(`   • 6.2 Extra - ${extra.nome || 'Excedente adicional'}: ${formatarMoeda(extra.valor || 0)}`);
          });
        }
        linhas.push(``);
      }

      // 7. TAXA DE BOLETO RETIRADA DA CAIXA DE TEXTO CONFORME SOLICITADO
    }

    // 2.2 Termômetro de Saúde Financeira
    if (flagsTextoRateio.termometroGeral) {
      const itensValidosMarcados = saudeFinanceiraDetalhes.itensValidos.filter(
        (item) => flagsTextoRateio.itensSaude[item.nome] !== false
      );

      if (itensValidosMarcados.length > 0) {
        linhas.push(`--- 2.2 TERMÔMETRO DE SAÚDE FINANCEIRA DO CONDOMÍNIO ---\n`);
        linhas.push(`Saldos Disponíveis em Caixa e Fundos (apenas valores acima de R$ 10,00):`);
        itensValidosMarcados.forEach((item) => {
          linhas.push(`   ✔ ${item.nome}: ${formatarMoeda(item.valor)}`);
        });
      } else if (saudeFinanceiraDetalhes.itensValidos.length === 0) {
        linhas.push(`--- 2.2 TERMÔMETRO DE SAÚDE FINANCEIRA DO CONDOMÍNIO ---\n`);
        linhas.push(`Nenhum saldo em caixa ou fundos com valor acima de R$ 10,00 cadastrado para este condomínio.`);
      }
    }

    return linhas.join('\n');
  }, [
    nomeCondominioExibicao,
    mesReferencia,
    vencimentoBoleto,
    numeroUnidades,
    flagsTextoRateio,
    totalOrdinarias,
    despesasOrdinarias,
    totalFundoReservaCalculado,
    fundoReservaValor,
    totalExtraordinarias,
    despesasExtraordinarias,
    totalFundoPinturaCalculado,
    fundoPinturaPorUnidade,
    totalFundoObrasCalculado,
    descricaoFundoObras,
    fundoObrasPorUnidade,
    totalAgua,
    composicaoAgua,
    taxaMinimaAgua,
    excedenteAguaTotal,
    excedentesExtras,
    saudeFinanceiraDetalhes
  ]);

  const textoExibicaoFinal = textoEditavelCustom !== null ? textoEditavelCustom : textoDescritivoGerado;

  const handleCopiarTextoDescritivo = () => {
    navigator.clipboard.writeText(textoExibicaoFinal);
    setCopiadoTexto(true);
    setTimeout(() => setCopiadoTexto(false), 2500);
  };

  const [modalSalvarAberto, setModalSalvarAberto] = useState(false);
  const [tituloSalvar, setTituloSalvar] = useState('');
  const [obsSalvar, setObsSalvar] = useState('');
  const [orcamentoDetalhes, setOrcamentoDetalhes] = useState<OrcamentoRelatorioSalvo | null>(null);

  const handleAbrirModalSalvar = () => {
    const padrao = `${nomeCondominioExibicao} - ${mesReferencia} (${formatarMoeda(totaisDemonstrativo.totalGeral)})`;
    setTituloSalvar(padrao);
    setObsSalvar('');
    setModalSalvarAberto(true);
  };

  const handleConfirmarSalvarOrcamento = (e: React.FormEvent) => {
    e.preventDefault();
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const novoOrcamento: OrcamentoRelatorioSalvo = {
      id: `ORC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      titulo: tituloSalvar.trim() || `${nomeCondominioExibicao} - ${mesReferencia}`,
      dataSalvamento: dataFormatada,
      timestamp: Date.now(),
      condominioId,
      nomeCondominio: nomeCondominioExibicao,
      mesReferencia,
      numeroUnidades,
      vencimentoBoleto,
      totalGeral: totaisDemonstrativo.totalGeral,
      totalOrdinarias,
      totalFundoReserva: totaisDemonstrativo.fundoReserva,
      totalExtraordinarias,
      totalFundoPintura: totalFundoPinturaCalculado,
      totalFundoObras: totalFundoObrasCalculado,
      totalAgua,
      observacoes: obsSalvar.trim(),
      despesasOrdinarias: JSON.parse(JSON.stringify(despesasOrdinarias)),
      despesasExtraordinarias: JSON.parse(JSON.stringify(despesasExtraordinarias)),
      unidadesConfig: JSON.parse(JSON.stringify(unidadesConfig)),
      taxaMinimaAgua,
      excedenteAguaTotal,
      escopoRateioAgua,
      excedentesExtras: JSON.parse(JSON.stringify(excedentesExtras)),
      tipoCotaBasica,
      tipoRateioFundoReserva,
      tipoDespesaExtra,
      tipoFundoPintura,
      tipoFundoObras,
      tipoRateioAgua,
      tipoRateioTaxaMinAgua,
      tipoRateioExcedente,
      fundoReservaValor,
      fundoPinturaPorUnidade,
      fundoObrasPorUnidade,
      taxaBoletoValor,
      descricaoFundoObras,
      composicaoAgua
    };

    setRelatoriosSalvos((prev) => [novoOrcamento, ...prev]);
    apiSaveRelatorioOrcamento(novoOrcamento).catch((err) => console.error('Erro ao salvar relatório no SQLite:', err));

    setModalSalvarAberto(false);
    setMensagemGeracao(`✓ Orçamento "${novoOrcamento.titulo}" salvo com sucesso! Você pode consultá-lo na aba "Orçamentos & Relatórios Salvos".`);
    setTimeout(() => setMensagemGeracao(''), 6000);
  };

  const handleCarregarOrcamento = (salvo: OrcamentoRelatorioSalvo) => {
    if (salvo.condominioId) setCondominioId(salvo.condominioId);
    if (salvo.mesReferencia) setMesReferencia(salvo.mesReferencia);
    if (salvo.numeroUnidades) setNumeroUnidades(salvo.numeroUnidades);
    if (salvo.vencimentoBoleto) setVencimentoBoleto(salvo.vencimentoBoleto);
    if (salvo.despesasOrdinarias) setDespesasOrdinarias(salvo.despesasOrdinarias);
    if (salvo.despesasExtraordinarias) setDespesasExtraordinarias(salvo.despesasExtraordinarias);
    if (salvo.unidadesConfig) setUnidadesConfig(salvo.unidadesConfig);
    if (salvo.taxaMinimaAgua !== undefined) setTaxaMinimaAgua(salvo.taxaMinimaAgua);
    if (salvo.excedenteAguaTotal !== undefined) setExcedenteAguaTotal(salvo.excedenteAguaTotal);
    if (salvo.escopoRateioAgua) setEscopoRateioAgua(salvo.escopoRateioAgua);
    if (salvo.excedentesExtras) setExcedentesExtras(salvo.excedentesExtras);
    if (salvo.tipoCotaBasica) setTipoCotaBasica(salvo.tipoCotaBasica);
    if (salvo.tipoRateioFundoReserva) setTipoRateioFundoReserva(salvo.tipoRateioFundoReserva);
    if (salvo.tipoDespesaExtra) setTipoDespesaExtra(salvo.tipoDespesaExtra);
    if (salvo.tipoFundoPintura) setTipoFundoPintura(salvo.tipoFundoPintura as any);
    if (salvo.tipoFundoObras) setTipoFundoObras(salvo.tipoFundoObras as any);
    if (salvo.tipoRateioAgua) setTipoRateioAgua(salvo.tipoRateioAgua);
    if (salvo.tipoRateioTaxaMinAgua) setTipoRateioTaxaMinAgua(salvo.tipoRateioTaxaMinAgua);
    if (salvo.tipoRateioExcedente) setTipoRateioExcedente(salvo.tipoRateioExcedente);
    if (salvo.fundoReservaValor !== undefined) setFundoReservaValor(salvo.fundoReservaValor);
    if (salvo.fundoPinturaPorUnidade !== undefined) setFundoPinturaPorUnidade(salvo.fundoPinturaPorUnidade);
    if (salvo.fundoObrasPorUnidade !== undefined) setFundoObrasPorUnidade(salvo.fundoObrasPorUnidade);
    if (salvo.taxaBoletoValor !== undefined) setTaxaBoletoValor(salvo.taxaBoletoValor);
    if (salvo.descricaoFundoObras) setDescricaoFundoObras(salvo.descricaoFundoObras);
    if (salvo.composicaoAgua) setComposicaoAgua(salvo.composicaoAgua);

    setVisualizacaoAba('editor');
    setMensagemGeracao(`✓ Orçamento "${salvo.titulo}" carregado com sucesso no formulário de rateio!`);
    setTimeout(() => setMensagemGeracao(''), 6000);
  };

  const handleExcluirOrcamento = (id: string, titulo: string) => {
    if (window.confirm(`Deseja realmente excluir o orçamento "${titulo}" dos relatórios salvos?`)) {
      setRelatoriosSalvos((prev) => prev.filter((item) => item.id !== id));
      apiDeleteRelatorioOrcamento(id).catch((err) => console.error('Erro ao excluir relatório no SQLite:', err));
      if (orcamentoDetalhes?.id === id) {
        setOrcamentoDetalhes(null);
      }
    }
  };

  const relatoriosFiltrados = useMemo(() => {
    return relatoriosSalvos.filter((item) => {
      const matchBusca =
        !termoPesquisa.trim() ||
        item.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
        item.nomeCondominio.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
        item.mesReferencia.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
        (item.observacoes && item.observacoes.toLowerCase().includes(termoPesquisa.toLowerCase()));

      const matchCondo = filtroCondominio === 'todos' || item.condominioId === filtroCondominio;
      const matchMes = filtroMes === 'todos' || item.mesReferencia === filtroMes;

      return matchBusca && matchCondo && matchMes;
    });
  }, [relatoriosSalvos, termoPesquisa, filtroCondominio, filtroMes]);

  const mesesDisponiveisFiltro = useMemo(() => {
    const setMeses = new Set<string>();
    relatoriosSalvos.forEach((r) => {
      if (r.mesReferencia) setMeses.add(r.mesReferencia);
    });
    return Array.from(setMeses);
  }, [relatoriosSalvos]);

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAbrirModalSalvar}
              className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Salvar cópia deste orçamento / relatório"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Orçamento</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-[#2d5a32] hover:bg-[#1f4223] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>

        {/* Sub-Aba Navigation: Elaborar vs Pesquisar Orçamentos Salvos */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setVisualizacaoAba('editor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              visualizacaoAba === 'editor'
                ? 'bg-[#2d5a32] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Elaborar Relatório de Rateio</span>
          </button>

          <button
            type="button"
            onClick={() => setVisualizacaoAba('pesquisa')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              visualizacaoAba === 'pesquisa'
                ? 'bg-[#2d5a32] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Pesquisar Relatórios & Orçamentos Salvos</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                visualizacaoAba === 'pesquisa' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {relatoriosSalvos.length}
            </span>
          </button>
        </div>
      </div>

      {visualizacaoAba === 'editor' ? (
        <>
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
            <h3 className="text-base font-bold text-black uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-5 h-5 text-black" />
              <span>1 - Relatório de Despesas & Resumo Financeiro do Mês</span>
            </h3>
            <p className="text-xs text-black font-semibold">
              Discriminação ordenada de todas as despesas operacionais ordinárias, fundos, obras extraordinárias e saneamento
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 print:hidden text-xs">
            <span className="font-bold text-black text-[11px] uppercase tracking-wider">Itens no PDF:</span>
            <button
              type="button"
              onClick={() => setSecoesRelatorioPDF({ ordinarias: true, fundoReserva: true, extraordinarias: true, fundoPintura: true, fundoObras: true, aguaSaneamento: true, demonstrativoIndividual: true })}
              className="text-[11px] font-bold text-black hover:underline cursor-pointer"
            >
              Marcar Todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setSecoesRelatorioPDF({ ordinarias: false, fundoReserva: false, extraordinarias: false, fundoPintura: false, fundoObras: false, aguaSaneamento: false, demonstrativoIndividual: false })}
              className="text-[11px] font-bold text-black hover:underline cursor-pointer"
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
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-black select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.ordinarias}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, ordinarias: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.ordinarias ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span>1. Cota básica (despesas ordinárias do mês)</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={addDespesaOrdinaria}
                className="bg-white border border-slate-400 text-black hover:bg-black hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer print:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-black font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-black">Descrição</th>
                    <th className="py-2 px-2 w-32 text-black">Vencimento / Ref</th>
                    <th className="py-2 px-2 w-32 text-right text-black">Valor (R$)</th>
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
                          className="w-full bg-transparent font-medium text-black focus:outline-none focus:bg-white focus:ring-1 focus:ring-black rounded px-1"
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
                          className="w-full bg-transparent text-black focus:outline-none focus:bg-white focus:ring-1 focus:ring-black rounded px-1 font-mono text-[11px] font-semibold"
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
                          className="w-full bg-transparent text-right font-mono font-bold text-black focus:outline-none focus:bg-white focus:ring-1 focus:ring-black rounded px-1"
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
                  <tr className="border-t-2 border-slate-400 font-bold text-black">
                    <td colSpan={2} className="py-2 px-2 text-right text-black font-bold">
                      Subtotal Cota Básica (Ordinárias):
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-sm text-black font-black">{formatarMoeda(totalOrdinarias)}</td>
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
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-black select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.fundoReserva}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, fundoReserva: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.fundoReserva ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span>2. Fundo Reserva</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-black bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Total Arrecadado: {formatarMoeda(totaisDemonstrativo.fundoReserva)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-black font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-black">Tipo de Regra / Cálculo</th>
                    <th className="py-2 px-2 w-48 text-center text-black">Alíquota / Valor por Unidade</th>
                    <th className="py-2 px-2 w-48 text-right text-black">Total Calculado do Fundo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-slate-100/60 transition-colors">
                    <td className="py-2 px-2">
                      <div className="font-semibold text-black text-[11px] uppercase tracking-wider">% Percentual sobre a Cota Básica</div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={fundoReservaValor}
                          onChange={(e) => setFundoReservaValor(parseFloat(e.target.value) || 0)}
                          className="w-28 p-1.5 border border-slate-300 rounded-lg font-mono font-bold text-black text-right bg-white focus:ring-1 focus:ring-black focus:outline-none"
                        />
                        <span className="font-bold text-black">%</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-black text-sm">
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
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-black select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.extraordinarias}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, extraordinarias: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.extraordinarias ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span>3. Despesas Extraordinárias e Obras</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={addDespesaExtraordinaria}
                className="bg-white border border-slate-400 text-black hover:bg-black hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer print:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Obra</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-black font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-black">Descrição da Obra</th>
                    <th className="py-2 px-2 w-28 text-center text-black">% Rateio</th>
                    <th className="py-2 px-2 w-32 text-right text-black">Valor R$</th>
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
                          className="w-full bg-transparent font-medium text-black focus:outline-none focus:bg-white focus:ring-1 focus:ring-black rounded px-1"
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
                          className="w-full bg-transparent text-center font-mono text-black font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-black rounded px-1 text-[11px]"
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
                          className="w-full bg-transparent text-right font-mono font-bold text-black focus:outline-none focus:bg-white focus:ring-1 focus:ring-black rounded px-1"
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
                  <tr className="border-t-2 border-slate-400 font-bold text-black">
                    <td colSpan={2} className="py-2 px-2 text-right text-black font-bold">
                      Subtotal Extraordinárias:
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-sm text-black font-black">{formatarMoeda(totalExtraordinarias)}</td>
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
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-black select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.fundoPintura}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, fundoPintura: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.fundoPintura ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span>4. Fundo Pintura</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-black bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Total Arrecadado: {formatarMoeda(totaisDemonstrativo.fundoPintura)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-black font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-black">Descrição / Destinação</th>
                    <th className="py-2 px-2 w-48 text-center text-black">Valor por Unidade (R$/Un)</th>
                    <th className="py-2 px-2 w-48 text-right text-black">Total Calculado do Fundo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-slate-100/60 transition-colors">
                    <td className="py-2 px-2 font-medium text-black">
                      Fundo de Reserva Especial para Pintura de Fachada e Paredes
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-black">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={fundoPinturaPorUnidade}
                          onChange={(e) => setFundoPinturaPorUnidade(parseFloat(e.target.value) || 0)}
                          className="w-28 p-1.5 border border-slate-300 rounded-lg font-mono font-bold text-black text-right bg-white focus:ring-1 focus:ring-black focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-black text-sm">
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
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-black select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.fundoObras}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, fundoObras: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.fundoObras ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span>5. Fundo Obras</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-black bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Total Arrecadado: {formatarMoeda(totaisDemonstrativo.fundoObras)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-black font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-black">Descrição / Destinação</th>
                    <th className="py-2 px-2 w-48 text-center text-black">Valor por Unidade (R$/Un)</th>
                    <th className="py-2 px-2 w-48 text-right text-black">Total Calculado do Fundo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-slate-100/60 transition-colors">
                    <td className="py-2 px-2 font-medium text-black">
                      <input
                        type="text"
                        value={descricaoFundoObras}
                        onChange={(e) => setDescricaoFundoObras(e.target.value)}
                        className="w-full p-1.5 border-b border-transparent hover:border-slate-300 focus:border-black bg-transparent focus:bg-white focus:outline-none transition-all text-black font-medium"
                        placeholder="Ex: Fundo Permanente de Obras..."
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-black">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={fundoObrasPorUnidade}
                          onChange={(e) => setFundoObrasPorUnidade(parseFloat(e.target.value) || 0)}
                          className="w-28 p-1.5 border border-slate-300 rounded-lg font-mono font-bold text-black text-right bg-white focus:ring-1 focus:ring-black focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-black text-sm">
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
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-black select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.aguaSaneamento}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, aguaSaneamento: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.aguaSaneamento ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span>6. Custos de Água e Saneamento do Mês</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-black bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Total Água: {formatarMoeda(totalAgua)}
              </span>
            </div>

            {/* ──────────────────────────────────────────────────────── */}
            {/* 6.1 Taxa Mínima Sanepar/Concessionária                  */}
            {/* ──────────────────────────────────────────────────────── */}
            <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
              {/* Header 6.1 */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-black bg-slate-200 px-1.5 py-0.5 rounded-md">6.1</span>
                  <h5 className="font-bold text-black text-xs flex items-center gap-1.5">
                    Taxa Mínima —{' '}
                    <input
                      type="text"
                      value={composicaoAgua}
                      onChange={(e) => setComposicaoAgua(e.target.value)}
                      className="inline-block w-36 px-1 py-0.5 text-xs border-b border-transparent hover:border-slate-400 focus:border-black bg-transparent focus:bg-white focus:outline-none transition-all text-black font-bold"
                      title="Clique para editar o nome da concessionária"
                    />
                  </h5>
                </div>
                <span className="text-xs font-mono font-bold text-black bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {formatarMoeda(taxaMinimaAgua || 0)}
                </span>
              </div>

              {/* Seletor de Rateio 6.1 — oculto no PDF */}
              <div className="px-3 py-2 bg-slate-50/60 border-b border-slate-200 print:hidden">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold text-black uppercase tracking-tight pr-1">Regra de Rateio:</span>
                  {(['fracao_ideal', 'divisao_igual', 'moradores'] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoRateioTaxaMinAgua(tipo)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        tipoRateioTaxaMinAgua === tipo
                          ? 'bg-black text-white shadow-xs'
                          : 'text-black hover:bg-slate-200 bg-white border border-slate-300'
                      }`}
                    >
                      {tipo === 'fracao_ideal' ? 'Fração Ideal' : tipo === 'divisao_igual' ? 'Divisão Igualitária' : 'Por Moradores'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabela 6.1 */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-black font-bold uppercase text-[10px] bg-white">
                    <th className="py-2 px-3 text-black">Componente</th>
                    <th className="py-2 px-3 w-48 text-right text-black">Valor Total Apurado (R$)</th>
                    <th className="py-2 px-3 w-44 text-right text-black">Média por Unidade (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2.5 px-3 font-semibold text-black">
                      Taxa Mínima {composicaoAgua}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={taxaMinimaAgua}
                        onChange={(e) => setTaxaMinimaAgua(parseFloat(e.target.value) || 0)}
                        className="w-32 p-1 border border-slate-300 rounded font-mono font-bold text-right text-black bg-white focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-black font-semibold">
                      {formatarMoeda((taxaMinimaAgua || 0) / (numeroUnidades || 1))}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300 bg-slate-50 font-bold text-black">
                    <td className="py-2 px-3 text-right text-[11px] uppercase text-black font-bold">Subtotal 6.1:</td>
                    <td className="py-2 px-3 text-right font-mono text-black font-bold">{formatarMoeda(taxaMinimaAgua || 0)}</td>
                    <td className="py-2 px-3 text-right font-mono text-[11px] text-black font-bold">{formatarMoeda((taxaMinimaAgua || 0) / (numeroUnidades || 1))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ──────────────────────────────────────────────────────── */}
            {/* 6.2 Excedente de Consumo                                */}
            {/* ──────────────────────────────────────────────────────── */}
            <div className="bg-white border border-slate-300 rounded-xl overflow-hidden">
              {/* Header 6.2 */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-black bg-slate-200 px-1.5 py-0.5 rounded-md">6.2</span>
                  <h5 className="font-bold text-black text-xs">Excedente de Consumo</h5>
                </div>
                <span className="text-xs font-mono font-bold text-black bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {formatarMoeda((excedenteAguaTotal || 0) + totalExcedentesExtras)}
                </span>
              </div>

              {/* Seletor de Rateio 6.2 — oculto no PDF */}
              <div className="px-3 py-2 bg-slate-50/60 border-b border-slate-200 print:hidden">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold text-black uppercase tracking-tight pr-1">Regra de Rateio:</span>
                  {(['fracao_ideal', 'divisao_igual', 'moradores'] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoRateioExcedente(tipo)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        tipoRateioExcedente === tipo
                          ? 'bg-black text-white shadow-xs'
                          : 'text-black hover:bg-slate-200 bg-white border border-slate-300'
                      }`}
                    >
                      {tipo === 'fracao_ideal' ? 'Fração Ideal' : tipo === 'divisao_igual' ? 'Divisão Igualitária' : 'Por Moradores'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabela 6.2 */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-black font-bold uppercase text-[10px] bg-white">
                    <th className="py-2 px-3 text-black">Componente</th>
                    <th className="py-2 px-3 w-48 text-right text-black">Valor Total Apurado (R$)</th>
                    <th className="py-2 px-3 w-44 text-right text-black">Média por Unidade (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Linha principal: Excedente de Consumo */}
                  <tr className="bg-white">
                    <td className="py-2.5 px-3 font-semibold text-black">Excedente de Consumo</td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={excedenteAguaTotal}
                        onChange={(e) => setExcedenteAguaTotal(parseFloat(e.target.value) || 0)}
                        className="w-32 p-1 border border-slate-300 rounded font-mono font-bold text-right text-black bg-white focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-black font-semibold">
                      {formatarMoeda((excedenteAguaTotal || 0) / (numeroUnidades || 1))}
                    </td>
                  </tr>

                  {/* Linhas extras de excedente (nome editável) */}
                  {excedentesExtras.map((extra) => (
                    <tr key={extra.id} className="bg-slate-50/50">
                      <td className="py-2 px-3 font-medium text-black">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={extra.nome}
                            onChange={(e) => updateExcedenteExtra(extra.id, 'nome', e.target.value)}
                            className="flex-1 px-1.5 py-0.5 text-xs border border-slate-300 rounded focus:border-black focus:ring-1 focus:ring-black bg-white outline-none text-black font-semibold"
                            placeholder="Nome do excedente"
                          />
                          <button
                            type="button"
                            onClick={() => removeExcedenteExtra(extra.id)}
                            className="text-red-400 hover:text-red-700 transition-colors cursor-pointer print:hidden shrink-0"
                            title="Remover linha"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={extra.valor}
                          onChange={(e) => updateExcedenteExtra(extra.id, 'valor', parseFloat(e.target.value) || 0)}
                          className="w-32 p-1 border border-slate-300 rounded font-mono font-bold text-right text-black bg-white focus:ring-1 focus:ring-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-black font-semibold">
                        {formatarMoeda((extra.valor || 0) / (numeroUnidades || 1))}
                      </td>
                    </tr>
                  ))}

                  {/* Botão Adicionar Excedente Extra */}
                  <tr className="print:hidden">
                    <td colSpan={3} className="py-2 px-3">
                      <button
                        type="button"
                        onClick={addExcedenteExtra}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-black hover:text-white bg-white hover:bg-black border border-slate-400 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                        Adicionar Excedente Extra
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300 bg-slate-50 font-bold text-black">
                    <td className="py-2 px-3 text-right text-[11px] uppercase text-black font-bold">Subtotal 6.2:</td>
                    <td className="py-2 px-3 text-right font-mono text-black font-bold">{formatarMoeda((excedenteAguaTotal || 0) + totalExcedentesExtras)}</td>
                    <td className="py-2 px-3 text-right font-mono text-[11px] text-black font-bold">{formatarMoeda(((excedenteAguaTotal || 0) + totalExcedentesExtras) / (numeroUnidades || 1))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Total Geral 6.1 + 6.2 */}
            <div className="flex justify-end">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-3">
                <span className="uppercase tracking-wide opacity-80">Total Água e Saneamento (6.1 + 6.2):</span>
                <span className="font-mono text-sm">{formatarMoeda(totalAgua)}</span>
              </div>
            </div>

            {/* Rateio por grupos — oculto no PDF (print:hidden já no componente) */}
            <TabelaFracoesBreakdown
              demonstrativoUnidades={demonstrativoUnidades}
              getValue={(u) => u.taxaMinAguaUnidade}
              titulo="Rateio — Taxa Mínima Sanepar"
              borderColor="border-slate-300"
              tipoRateio={tipoRateioTaxaMinAgua}
              onTipoRateioChange={setTipoRateioTaxaMinAgua}
              unidadesConfig={unidadesConfig}
              setUnidadesConfig={setUnidadesConfig}
            />

            <TabelaFracoesBreakdown
              demonstrativoUnidades={demonstrativoUnidades}
              getValue={(u) => u.excedenteAguaUnidade}
              titulo="Rateio — Excedente de Consumo"
              borderColor="border-slate-300"
              tipoRateio={tipoRateioExcedente}
              onTipoRateioChange={setTipoRateioExcedente}
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
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 text-[11px] font-bold text-black select-none shadow-2xs print:hidden">
                  <input
                    type="checkbox"
                    checked={secoesRelatorioPDF.taxaBoleto}
                    onChange={(e) => setSecoesRelatorioPDF((prev) => ({ ...prev, taxaBoleto: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded text-black focus:ring-black cursor-pointer"
                  />
                  <span>{secoesRelatorioPDF.taxaBoleto ? 'Incluir no PDF' : 'Ocultar no PDF'}</span>
                </label>
                <h4 className="font-bold text-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span>7. Taxa de Boleto</span>
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-black bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Total Previsto: {formatarMoeda(totalTaxaBoletoCalculado)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-black font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-black">Descrição</th>
                    <th className="py-2 px-2 w-48 text-right text-black">Valor por Unidade (R$)</th>
                    <th className="py-2 px-2 w-48 text-right text-black">Valor Total Apurado (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="py-2 px-2 font-medium text-black">
                      Taxa de Emissão de Boleto (Cobrança)
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={taxaBoletoValor}
                        onChange={(e) => setTaxaBoletoValor(parseFloat(e.target.value) || 0)}
                        className="w-32 p-1 border border-slate-300 rounded font-mono font-bold text-right text-black bg-white focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-black">
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
                  {/* Vencimento — read-only (derivado das despesas) */}
                  {colunasPDF.vencimento && <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">{row.vencimento}</td>}
                  {!colunasPDF.vencimento && <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px] opacity-30 print:hidden">{row.vencimento}</td>}

                  {/* Taxa de boleto — read-only (calculado) */}
                  {colunasPDF.taxaBoleto && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.taxaBoleto)}</td>}
                  {!colunasPDF.taxaBoleto && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.taxaBoleto)}</td>}

                  {/* Cota Básica — calculada; exibe a fração ideal editável como sublabel no print:hidden */}
                  {colunasPDF.cotaBasica && (
                    <td className="py-1.5 px-2 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono font-semibold text-slate-800 text-xs">{formatarMoeda(row.cotaBasica)}</span>
                        {/* Fração Ideal editável inline — visível na tela, omitida no PDF */}
                        <div className="flex items-center gap-1 print:hidden" title="Editar fração ideal desta unidade">
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            max="100"
                            value={unidadesConfig.find(u => u.unidadeId === row.unidadeId)?.fracaoIdeal ?? row.fracaoIdeal}
                            onChange={(e) => handleFracaoUnidadeChange(row.unidadeId, e.target.value)}
                            className="w-[68px] px-1.5 py-0.5 text-[10px] font-mono text-amber-900 bg-amber-50 border border-amber-200 hover:border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400 rounded text-right outline-none transition-all"
                          />
                          <span className="text-[9px] text-slate-400 font-semibold">%</span>
                        </div>
                      </div>
                    </td>
                  )}
                  {!colunasPDF.cotaBasica && <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800 opacity-30 print:hidden">{formatarMoeda(row.cotaBasica)}</td>}

                  {/* Despesas Extraordinárias — calculada */}
                  {colunasPDF.despesaExtraordinaria && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.despesaExtra || 0)}</td>}
                  {!colunasPDF.despesaExtraordinaria && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.despesaExtra || 0)}</td>}

                  {/* Fundo Obras — calculado */}
                  {colunasPDF.fundoObras && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.fundoObras)}</td>}
                  {!colunasPDF.fundoObras && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.fundoObras)}</td>}

                  {/* Fundo Reserva — calculado */}
                  {colunasPDF.fundoReserva && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.fundoReserva)}</td>}
                  {!colunasPDF.fundoReserva && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.fundoReserva)}</td>}

                  {/* Fundo Pintura — calculado; exibe nº de moradores editável como sublabel */}
                  {colunasPDF.fundoPintura && (
                    <td className="py-1.5 px-2 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-slate-700 text-xs">{formatarMoeda(row.fundoPintura)}</span>
                        {/* Moradores editável inline — visível na tela, omitido no PDF */}
                        <div className="flex items-center gap-1 print:hidden" title="Editar nº de moradores desta unidade">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={unidadesConfig.find(u => u.unidadeId === row.unidadeId)?.moradores ?? row.moradores ?? 2}
                            onChange={(e) => handleMoradoresUnidadeChange(row.unidadeId, e.target.value)}
                            className="w-[48px] px-1.5 py-0.5 text-[10px] font-mono text-indigo-900 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded text-center outline-none transition-all"
                          />
                          <span className="text-[9px] text-slate-400 font-semibold">hab</span>
                        </div>
                      </div>
                    </td>
                  )}
                  {!colunasPDF.fundoPintura && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.fundoPintura)}</td>}

                  {/* Taxa Mínima Água — calculada */}
                  {colunasPDF.taxaMinAgua && <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatarMoeda(row.taxaMinAguaUnidade)}</td>}
                  {!colunasPDF.taxaMinAgua && <td className="py-2.5 px-2 text-right font-mono text-slate-700 opacity-30 print:hidden">{formatarMoeda(row.taxaMinAguaUnidade)}</td>}

                  {/* Excedente Água — calculado */}
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAbrirModalSalvar}
                className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Orçamento</span>
              </button>

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

      {/* SEÇÃO 3: RESUMO DESCRITIVO DOS ITENS DO RATEIO (2.5) & TERMÔMETRO DE SAÚDE FINANCEIRA (2.2) (Oculto no PDF) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 print:hidden transition-all">
        <div className="border-b pb-4 border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1c3220] uppercase tracking-wider flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-[#2d5a32]" />
                <span>3 - Resumo Descritivo dos Itens do Rateio (2.5) & Termômetro de Saúde Financeira (2.2)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Discriminação textual de cada item do rateio com seu valor e extrato do termômetro de saúde financeira (itens &gt; R$ 10,00)
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {textoEditavelCustom !== null && (
              <button
                type="button"
                onClick={() => setTextoEditavelCustom(null)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                title="Restaurar o texto gerado automaticamente pelas tabelas"
              >
                Restaurar Original
              </button>
            )}
            <button
              type="button"
              onClick={handleCopiarTextoDescritivo}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                copiadoTexto
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#2d5a32] hover:bg-[#1f4223] text-white'
              }`}
            >
              {copiadoTexto ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Texto Completo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARDS VISUAIS DE DESTAQUE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card Esquerdo: Composição dos Itens do Rateio 2.5 com Flags Individuais */}
          <div className="bg-[#f4f7f4] p-4 rounded-xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="font-bold text-xs text-[#1c3220] uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#2d5a32]" />
                Itens que Compõem o Rateio (2.5)
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Desmarque a caixa para retirar o item do texto
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-emerald-100">
              {/* 1. Cota Básica */}
              <div className="pt-1.5 first:pt-0">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flagsTextoRateio.cotaBasica}
                      onChange={() => toggleFlagRateio('cotaBasica')}
                      className="w-4 h-4 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer accent-[#2d5a32]"
                      title="Marcar/desmarcar para incluir ou retirar da caixa de texto"
                    />
                    <span className={flagsTextoRateio.cotaBasica ? 'font-bold text-slate-800' : 'text-slate-400 line-through'}>
                      1. Cota Básica (Ordinárias)
                    </span>
                  </label>
                  <span className={`font-mono ${flagsTextoRateio.cotaBasica ? 'text-[#2d5a32]' : 'text-slate-400'}`}>
                    {formatarMoeda(totalOrdinarias)}
                  </span>
                </div>
                {despesasOrdinarias.length > 0 && flagsTextoRateio.cotaBasica && (
                  <div className="pl-6 pt-1 space-y-0.5 text-[11px] text-slate-600">
                    {despesasOrdinarias.map((d) => (
                      <div key={d.id} className="flex justify-between">
                        <span className="truncate pr-2">• {d.descricao || 'Item'}{d.vencimentoReferencia ? ` (${d.vencimentoReferencia})` : ''}</span>
                        <span className="font-mono font-semibold text-slate-700">{formatarMoeda(d.valor || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Fundo Reserva */}
              <div className="pt-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flagsTextoRateio.fundoReserva}
                      onChange={() => toggleFlagRateio('fundoReserva')}
                      className="w-4 h-4 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer accent-[#2d5a32]"
                      title="Marcar/desmarcar para incluir ou retirar da caixa de texto"
                    />
                    <span className={flagsTextoRateio.fundoReserva ? 'font-bold text-slate-800' : 'text-slate-400 line-through'}>
                      2. Fundo de Reserva ({fundoReservaValor}%)
                    </span>
                  </label>
                  <span className={`font-mono ${flagsTextoRateio.fundoReserva ? 'text-[#2d5a32]' : 'text-slate-400'}`}>
                    {formatarMoeda(totalFundoReservaCalculado)}
                  </span>
                </div>
              </div>

              {/* 3. Despesas Extraordinárias */}
              <div className="pt-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flagsTextoRateio.extraordinarias}
                      onChange={() => toggleFlagRateio('extraordinarias')}
                      className="w-4 h-4 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer accent-[#2d5a32]"
                      title="Marcar/desmarcar para incluir ou retirar da caixa de texto"
                    />
                    <span className={flagsTextoRateio.extraordinarias ? 'font-bold text-slate-800' : 'text-slate-400 line-through'}>
                      3. Despesas Extraordinárias / Obras
                    </span>
                  </label>
                  <span className={`font-mono ${flagsTextoRateio.extraordinarias ? 'text-[#2d5a32]' : 'text-slate-400'}`}>
                    {formatarMoeda(totalExtraordinarias)}
                  </span>
                </div>
                {despesasExtraordinarias.length > 0 && flagsTextoRateio.extraordinarias && (
                  <div className="pl-6 pt-1 space-y-0.5 text-[11px] text-slate-600">
                    {despesasExtraordinarias.map((e) => (
                      <div key={e.id} className="flex justify-between">
                        <span className="truncate pr-2">• {e.descricao || 'Obra'} ({e.percentualRateio}%)</span>
                        <span className="font-mono font-semibold text-slate-700">{formatarMoeda(e.valor || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Fundo Pintura */}
              <div className="pt-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flagsTextoRateio.fundoPintura}
                      onChange={() => toggleFlagRateio('fundoPintura')}
                      className="w-4 h-4 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer accent-[#2d5a32]"
                      title="Marcar/desmarcar para incluir ou retirar da caixa de texto"
                    />
                    <span className={flagsTextoRateio.fundoPintura ? 'font-bold text-slate-800' : 'text-slate-400 line-through'}>
                      4. Fundo de Pintura ({formatarMoeda(fundoPinturaPorUnidade)}/un)
                    </span>
                  </label>
                  <span className={`font-mono ${flagsTextoRateio.fundoPintura ? 'text-[#2d5a32]' : 'text-slate-400'}`}>
                    {formatarMoeda(totalFundoPinturaCalculado)}
                  </span>
                </div>
              </div>

              {/* 5. Fundo Obras */}
              <div className="pt-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flagsTextoRateio.fundoObras}
                      onChange={() => toggleFlagRateio('fundoObras')}
                      className="w-4 h-4 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer accent-[#2d5a32]"
                      title="Marcar/desmarcar para incluir ou retirar da caixa de texto"
                    />
                    <span className={flagsTextoRateio.fundoObras ? 'font-bold text-slate-800' : 'text-slate-400 line-through'}>
                      5. Fundo de Obras ({formatarMoeda(fundoObrasPorUnidade)}/un)
                    </span>
                  </label>
                  <span className={`font-mono ${flagsTextoRateio.fundoObras ? 'text-[#2d5a32]' : 'text-slate-400'}`}>
                    {formatarMoeda(totalFundoObrasCalculado)}
                  </span>
                </div>
              </div>

              {/* 6. Água e Saneamento */}
              <div className="pt-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flagsTextoRateio.aguaSaneamento}
                      onChange={() => toggleFlagRateio('aguaSaneamento')}
                      className="w-4 h-4 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer accent-[#2d5a32]"
                      title="Marcar/desmarcar para incluir ou retirar da caixa de texto"
                    />
                    <span className={flagsTextoRateio.aguaSaneamento ? 'font-bold text-slate-800' : 'text-slate-400 line-through'}>
                      6. Água e Saneamento (6.1 + 6.2)
                    </span>
                  </label>
                  <span className={`font-mono ${flagsTextoRateio.aguaSaneamento ? 'text-[#2d5a32]' : 'text-slate-400'}`}>
                    {formatarMoeda(totalAgua)}
                  </span>
                </div>
                {flagsTextoRateio.aguaSaneamento && (
                  <div className="pl-6 pt-1 space-y-0.5 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>• 6.1 Taxa Mínima ({composicaoAgua})</span>
                      <span className="font-mono font-semibold text-slate-700">{formatarMoeda(taxaMinimaAgua || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 6.2 Excedente de Consumo</span>
                      <span className="font-mono font-semibold text-slate-700">{formatarMoeda(excedenteAguaTotal || 0)}</span>
                    </div>
                    {excedentesExtras && excedentesExtras.map((ex) => (
                      <div key={ex.id} className="flex justify-between">
                        <span>• 6.2 Extra ({ex.nome || 'Excedente'})</span>
                        <span className="font-mono font-semibold text-slate-700">{formatarMoeda(ex.valor || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Taxa de Boleto - Indicador de não inclusão no texto */}
              <div className="pt-1.5 opacity-60">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>7. Taxa de Boleto (Apenas Relatório)</span>
                  </span>
                  <span className="font-mono">{formatarMoeda(totalTaxaBoletoCalculado)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Direito: 2.2 Termômetro de Saúde Financeira com Flag Geral e Flags por Caixa */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={flagsTextoRateio.termometroGeral}
                    onChange={() => toggleFlagRateio('termometroGeral')}
                    className="w-4 h-4 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer accent-[#2d5a32]"
                    title="Marcar/desmarcar para incluir ou retirar a seção de Saúde Financeira da caixa de texto"
                  />
                  <span className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                    flagsTextoRateio.termometroGeral ? 'text-[#1c3220]' : 'text-slate-400 line-through'
                  }`}>
                    <Activity className="w-4 h-4 text-[#2d5a32]" />
                    2.2 Termômetro de Saúde Financeira
                  </span>
                </label>
                {saudeFinanceiraDetalhes.score > 0 && (
                  <span
                    className="font-bold text-[11px] px-2.5 py-0.5 rounded-full text-white font-mono shadow-2xs"
                    style={{ backgroundColor: saudeFinanceiraDetalhes.cor }}
                  >
                    Nota: {saudeFinanceiraDetalhes.score}/10 • {saudeFinanceiraDetalhes.status}
                  </span>
                )}
              </div>

              {/* Caixa Livre e Fundos > R$ 10,00 com Flag individual para cada caixa */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-tight text-slate-500">
                  Caixa Livre & Fundos (&gt; R$ 10,00) — Desmarque para retirar do texto:
                </div>

                {saudeFinanceiraDetalhes.itensValidos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {saudeFinanceiraDetalhes.itensValidos.map((item, idx) => {
                      const itemMarcado = flagsTextoRateio.itensSaude[item.nome] !== false;
                      const ativo = itemMarcado && flagsTextoRateio.termometroGeral;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border shadow-2xs flex flex-col justify-between transition-all ${
                            ativo ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={ativo}
                              disabled={!flagsTextoRateio.termometroGeral}
                              onChange={() => toggleFlagSaudeItem(item.nome)}
                              className="w-3.5 h-3.5 rounded text-[#2d5a32] focus:ring-[#2d5a32] cursor-pointer accent-[#2d5a32]"
                              title="Marcar/desmarcar para incluir ou retirar este item da caixa de texto"
                            />
                            <span className={`text-[11px] font-semibold truncate ${ativo ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                              {item.nome}
                            </span>
                          </label>
                          <span className={`text-sm font-mono font-bold mt-1 pl-5.5 ${ativo ? 'text-[#2d5a32]' : 'text-slate-400'}`}>
                            {formatarMoeda(item.valor)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-medium">
                    Nenhum item de caixa livre ou fundo com saldo superior a R$ 10,00 cadastrado neste condomínio.
                  </div>
                )}
              </div>

              {/* Resumo da Saúde */}
              <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span>Total em Reservas:</span>
                  <strong className="text-emerald-300 font-mono text-xs">{formatarMoeda(saudeFinanceiraDetalhes.saldoTotal)}</strong>
                </div>
                {saudeFinanceiraDetalhes.ratio > 0 && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Proporção x Gasto Mensal:</span>
                    <strong className="text-emerald-300 font-mono text-xs">{saudeFinanceiraDetalhes.ratio}x</strong>
                  </div>
                )}
                {saudeFinanceiraDetalhes.mensagem && (
                  <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800">
                    {saudeFinanceiraDetalhes.mensagem}
                  </p>
                )}
              </div>
            </div>

            {saudeFinanceiraDetalhes.dataUltimaAlteracao && (
              <div className="text-[10px] text-slate-400 text-right pt-2">
                Última alteração do caixa: {saudeFinanceiraDetalhes.dataUltimaAlteracao}
              </div>
            )}
          </div>
        </div>

        {/* CAIXA DE TEXTO DESCRITIVA INTEGRADA (EDITÁVEL / COPIÁVEL) */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#2d5a32]" />
              <span>Caixa de Texto com Descrição e Valores (Rateio 2.5 + Saúde 2.2):</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              Pronto para copiar e colar no WhatsApp, e-mails ou ata de assembleia
            </span>
          </div>

          <div className="relative rounded-xl border border-slate-300 overflow-hidden bg-slate-50 shadow-inner focus-within:border-[#2d5a32] focus-within:ring-2 focus-within:ring-[#2d5a32]/20">
            <textarea
              rows={12}
              value={textoExibicaoFinal}
              onChange={(e) => setTextoEditavelCustom(e.target.value)}
              className="w-full p-4 font-mono text-xs text-slate-800 bg-transparent resize-y outline-none leading-relaxed"
              placeholder="Descrição completa do rateio e saúde financeira..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
            <span>
              {textoExibicaoFinal.length} caracteres • {textoExibicaoFinal.split('\n').length} linhas
            </span>
            <div className="flex items-center gap-3">
              {textoEditavelCustom !== null && (
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Texto personalizado manualmente
                </span>
              )}
              <button
                type="button"
                onClick={handleCopiarTextoDescritivo}
                className="font-bold text-[#2d5a32] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar texto</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar at Bottom */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 print:hidden">
          <p className="text-xs font-semibold text-slate-500">
            Relatório pronto para exportação, impressão ou envio aos condôminos em PDF.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAbrirModalSalvar}
              className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Orçamento</span>
            </button>

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
        </>
      ) : (
        /* ABA: PESQUISAR RELATÓRIOS & ORÇAMENTOS SALVOS */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header & Filtros da Pesquisa */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-[#2d5a32] rounded-xl">
                  <FolderOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#1c3220]">
                    Banco de Orçamentos & Relatórios Salvos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consulte, filtre, visualize detalhes e recarregue instantaneamente qualquer orçamento salvo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisualizacaoAba('editor')}
                  className="bg-[#2d5a32] hover:bg-[#1f4223] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Orçamento / Voltar ao Editor</span>
                </button>
              </div>
            </div>

            {/* Barra de Pesquisa e Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              {/* Campo de Busca Texto */}
              <div className="md:col-span-6 relative">
                <label className="block font-bold text-slate-700 mb-1">Buscar por palavra-chave:</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    placeholder="Digite o título, condomínio, mês ou anotações..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-[#2d5a32] focus:border-[#2d5a32] outline-none"
                  />
                  {termoPesquisa && (
                    <button
                      type="button"
                      onClick={() => setTermoPesquisa('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro por Condomínio */}
              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Filtrar por Condomínio:</label>
                <select
                  value={filtroCondominio}
                  onChange={(e) => setFiltroCondominio(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-[#2d5a32] outline-none"
                >
                  <option value="todos">Todos os Condomínios</option>
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                  <option value="custom">Condomínios Customizados</option>
                </select>
              </div>

              {/* Filtro por Mês */}
              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Filtrar por Mês:</label>
                <select
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-[#2d5a32] outline-none"
                >
                  <option value="todos">Todos os Meses</option>
                  {mesesDisponiveisFiltro.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status e Limpar Filtros */}
            {(termoPesquisa || filtroCondominio !== 'todos' || filtroMes !== 'todos') && (
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-100">
                <span>
                  Exibindo <strong>{relatoriosFiltrados.length}</strong> de <strong>{relatoriosSalvos.length}</strong> orçamentos salvos.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTermoPesquisa('');
                    setFiltroCondominio('todos');
                    setFiltroMes('todos');
                  }}
                  className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>

          {/* Cards dos Relatórios / Orçamentos Salvos */}
          {relatoriosSalvos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-[#2d5a32]">
                <Folder className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#1c3220]">Nenhum orçamento salvo ainda</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Quando estiver elaborando um relatório de rateio, clique no botão verde <strong className="text-emerald-800">"Salvar Orçamento"</strong> no topo para guardar um histórico completo com todas as despesas e rateios.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVisualizacaoAba('editor')}
                className="bg-[#2d5a32] hover:bg-[#1f4223] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Ir para o Editor de Relatório</span>
              </button>
            </div>
          ) : relatoriosFiltrados.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Nenhum orçamento encontrado</h4>
              <p className="text-xs text-slate-500">
                Nenhum orçamento corresponde aos critérios de busca ou filtros selecionados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTermoPesquisa('');
                  setFiltroCondominio('todos');
                  setFiltroMes('todos');
                }}
                className="text-xs font-bold text-[#2d5a32] hover:underline cursor-pointer"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatoriosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Top Header Card */}
                  <div className="p-5 space-y-3 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#2d5a32] border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Building2 className="w-3 h-3" />
                          {item.nomeCondominio}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">
                          {item.titulo}
                        </h4>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded-md shrink-0">
                        {item.numeroUnidades} un
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Ref: <strong className="text-slate-700">{item.mesReferencia}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.dataSalvamento}
                      </span>
                    </div>

                    {/* Total Geral em Destaque */}
                    <div className="bg-[#f2f7f1] p-3 rounded-xl border border-[#2d5a32]/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Total Arrecadado:</span>
                      <span className="text-base font-mono font-black text-[#1c3220]">
                        {formatarMoeda(item.totalGeral)}
                      </span>
                    </div>

                    {/* Mini Discriminativo das Categorias */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400">Ordinárias: </span>
                        <strong className="text-slate-700">{formatarMoeda(item.totalOrdinarias)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Reserva: </span>
                        <strong className="text-slate-700">{formatarMoeda(item.totalFundoReserva)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Obras: </span>
                        <strong className="text-slate-700">{formatarMoeda(item.totalFundoObras)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Pintura: </span>
                        <strong className="text-slate-700">{formatarMoeda(item.totalFundoPintura)}</strong>
                      </div>
                    </div>

                    {/* Observações / Notas se houver */}
                    {item.observacoes && (
                      <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 italic line-clamp-2">
                        "{item.observacoes}"
                      </div>
                    )}
                  </div>

                  {/* Ações do Card */}
                  <div className="p-3 bg-slate-50/80 flex items-center justify-between gap-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleCarregarOrcamento(item)}
                      className="bg-[#2d5a32] hover:bg-[#1e3d22] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer flex-1 justify-center"
                      title="Carregar este orçamento para o formulário de rateio"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Carregar no Relatório</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrcamentoDetalhes(item)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Visualizar detalhes do orçamento"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluirOrcamento(item.id, item.titulo)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir orçamento salvo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SALVAR ORÇAMENTO ATUAL                         */}
      {/* ======================================================== */}
      {modalSalvarAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleConfirmarSalvarOrcamento}>
              {/* Header */}
              <div className="bg-[#1c3220] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-800/60 rounded-xl text-emerald-200">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Salvar Orçamento / Demonstrativo</h3>
                    <p className="text-[11px] text-emerald-200/80">
                      Guarde um snapshot deste rateio para consultas ou reuso futuro
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalSalvarAberto(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                {/* Resumo do Orçamento */}
                <div className="bg-[#e8f0e6] p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1c3220]">{nomeCondominioExibicao}</span>
                    <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]">
                      {mesReferencia}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Total Geral do Demonstrativo:</span>
                    <span className="font-mono font-black text-emerald-900 text-sm">
                      {formatarMoeda(totaisDemonstrativo.totalGeral)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {numeroUnidades} unidades cadastradas • Vencimento: {vencimentoBoleto}
                  </p>
                </div>

                {/* Título do Orçamento */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome / Título deste Orçamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={tituloSalvar}
                    onChange={(e) => setTituloSalvar(e.target.value)}
                    placeholder="Ex: Condomínio XYZ - Agosto / 2026 (Versão Final)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-[#2d5a32] focus:border-[#2d5a32] outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dica: use um nome fácil de identificar para pesquisas posteriores.
                  </p>
                </div>

                {/* Anotações / Observações */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Anotações / Observações (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={obsSalvar}
                    onChange={(e) => setObsSalvar(e.target.value)}
                    placeholder="Ex: Aprovado em assembleia de 05/08 com cota extra para pintura das vagas..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-normal text-slate-800 focus:ring-2 focus:ring-[#2d5a32] focus:border-[#2d5a32] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalSalvarAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d5a32] hover:bg-[#1e3d22] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar & Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DETALHES DO ORÇAMENTO SALVO                     */}
      {/* ======================================================== */}
      {orcamentoDetalhes && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#1c3220] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-800/60 rounded-xl text-emerald-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{orcamentoDetalhes.titulo}</h3>
                  <p className="text-[11px] text-emerald-200/80">
                    {orcamentoDetalhes.nomeCondominio} • Ref: {orcamentoDetalhes.mesReferencia}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrcamentoDetalhes(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Resumo Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#e8f0e6] p-4 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Geral:</span>
                  <strong className="text-sm font-mono text-[#1c3220] font-black">
                    {formatarMoeda(orcamentoDetalhes.totalGeral)}
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Unidades:</span>
                  <strong className="text-sm font-mono text-slate-800">{orcamentoDetalhes.numeroUnidades} un</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Vencimento:</span>
                  <strong className="text-sm font-mono text-slate-800">{orcamentoDetalhes.vencimentoBoleto}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Data de Salvamento:</span>
                  <strong className="text-xs text-slate-800">{orcamentoDetalhes.dataSalvamento}</strong>
                </div>
              </div>

              {/* Observações */}
              {orcamentoDetalhes.observacoes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-0.5">Observações:</span>
                  <p className="italic">{orcamentoDetalhes.observacoes}</p>
                </div>
              )}

              {/* Despesas Ordinárias */}
              <div>
                <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Despesas Ordinárias ({orcamentoDetalhes.despesasOrdinarias.length})</span>
                  <span className="font-mono text-[#2d5a32] font-black">
                    {formatarMoeda(orcamentoDetalhes.totalOrdinarias)}
                  </span>
                </h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-center">Ref</th>
                        <th className="p-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orcamentoDetalhes.despesasOrdinarias.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-800">{d.descricao}</td>
                          <td className="p-2 text-center text-slate-500 font-mono">{d.vencimentoReferencia || '-'}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {formatarMoeda(d.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Despesas Extraordinárias */}
              {orcamentoDetalhes.despesasExtraordinarias.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Despesas Extraordinárias / Obras ({orcamentoDetalhes.despesasExtraordinarias.length})</span>
                    <span className="font-mono text-[#2d5a32] font-black">
                      {formatarMoeda(orcamentoDetalhes.totalExtraordinarias)}
                    </span>
                  </h5>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2 text-left">Descrição</th>
                          <th className="p-2 text-center">Rateio</th>
                          <th className="p-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orcamentoDetalhes.despesasExtraordinarias.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">{d.descricao}</td>
                            <td className="p-2 text-center text-slate-500 font-mono">{d.percentualRateio}%</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-800">
                              {formatarMoeda(d.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleExcluirOrcamento(orcamentoDetalhes.id, orcamentoDetalhes.titulo)}
                className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrcamentoDetalhes(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer text-xs"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCarregarOrcamento(orcamentoDetalhes);
                    setOrcamentoDetalhes(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2d5a32] hover:bg-[#1e3d22] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Carregar este Orçamento no Editor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
