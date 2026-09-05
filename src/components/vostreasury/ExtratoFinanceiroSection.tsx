import React, { useState } from 'react';
import { TransacaoExtrato, Condominio } from '../../types';
import { apiSaveTransacao, apiDeleteTransacao } from '../../services/api';
import { formatarMoeda } from '../../utils/pricingEngine';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  PieChart,
  X,
  CheckCircle2,
  Printer,
  Tag,
  Pencil
} from 'lucide-react';

interface ExtratoFinanceiroSectionProps {
  transacoes: TransacaoExtrato[];
  setTransacoes: React.Dispatch<React.SetStateAction<TransacaoExtrato[]>>;
  condominios: Condominio[];
  onAdicionarNfe?: (novaNfe: any) => void;
}

export const ExtratoFinanceiroSection: React.FC<ExtratoFinanceiroSectionProps> = ({
  transacoes,
  setTransacoes,
  condominios = [],
  onAdicionarNfe
}) => {
  // Reference Month Filter
  const [mesReferencia, setMesReferencia] = useState<string>('Julho/2026');
  const [filtroCondominio, setFiltroCondominio] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [busca, setBusca] = useState<string>('');

  // Modal New Transaction State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [novaData, setNovaData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [novoMesRef, setNovoMesRef] = useState<string>('Julho/2026');
  const [novaDescricao, setNovaDescricao] = useState<string>('');
  const [novoValor, setNovoValor] = useState<string>('');
  const [novoTipo, setNovoTipo] = useState<'entrada' | 'saida'>('entrada');
  const [novoCondominio, setNovoCondominio] = useState<string>('VOS CONDO');
  const [novaCategoria, setNovaCategoria] = useState<string>('Honorários de Gestão');

  // Category Management State
  const [categorias, setCategorias] = useState<
    { nome: string; tipo: 'entrada' | 'saida' | 'ambos' }[]
  >([
    { nome: 'Honorários de Gestão', tipo: 'entrada' },
    { nome: 'Dividendos / Distribuição de Lucro', tipo: 'saida' },
    { nome: 'Serviços Extras', tipo: 'entrada' },
    { nome: 'Sistemas & TI', tipo: 'saida' },
    { nome: 'Impostos', tipo: 'saida' },
    { nome: 'Despesas Operacionais', tipo: 'saida' },
    { nome: 'Jurídico & Compliance', tipo: 'saida' },
    { nome: 'Laudos & Engenharia', tipo: 'entrada' },
    { nome: 'Outros', tipo: 'ambos' }
  ]);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState<string>('');
  const [novaCategoriaTipo, setNovaCategoriaTipo] = useState<'entrada' | 'saida' | 'ambos'>('entrada');
  const [categoriaEditando, setCategoriaEditando] = useState<{
    index: number;
    nome: string;
    tipo: 'entrada' | 'saida' | 'ambos';
  } | null>(null);
  const [categoriaExcluir, setCategoriaExcluir] = useState<{ index: number; nome: string } | null>(null);

  const handleAddCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = novaCategoriaNome.trim();
    if (!nomeLimpo) return;
    if (categorias.some((c) => c.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
      alert('Esta categoria já existe!');
      return;
    }
    setCategorias([...categorias, { nome: nomeLimpo, tipo: novaCategoriaTipo }]);
    setNovaCategoriaNome('');
  };

  const handleSalvarEdicaoCategoria = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!categoriaEditando) return;
    const nomeLimpo = categoriaEditando.nome.trim();
    if (!nomeLimpo) return;

    const catAntiga = categorias[categoriaEditando.index];
    const nomeAntigo = catAntiga?.nome;

    setCategorias((prev) =>
      prev.map((c, idx) =>
        idx === categoriaEditando.index
          ? { nome: nomeLimpo, tipo: categoriaEditando.tipo }
          : c
      )
    );

    // Update existing transactions if using old category name
    if (nomeAntigo && nomeAntigo !== nomeLimpo) {
      setTransacoes((prev) =>
        prev.map((t) => (t.categoria === nomeAntigo ? { ...t, categoria: nomeLimpo } : t))
      );
    }

    setCategoriaEditando(null);
  };

  const handleConfirmarExcluirCategoria = () => {
    if (!categoriaExcluir) return;
    setCategorias((prev) => prev.filter((_, idx) => idx !== categoriaExcluir.index));
    setCategoriaExcluir(null);
  };

  // Available Reference Months list
  const mesesDisponiveis = [
    'Julho/2026',
    'Junho/2026',
    'Maio/2026',
    'Abril/2026',
    'Março/2026',
    'Fevereiro/2026',
    'Janeiro/2026',
    'Todos os Meses'
  ];

  // List of Condominiums / Origins / Destinations with Segmentation
  const listaOrigensDestinos: { nome: string; tipo: 'entrada' | 'saida' | 'ambos' }[] = [
    { nome: 'VOS CONDO', tipo: 'ambos' },
    { nome: 'Geral VOS (Administradora)', tipo: 'saida' },
    { nome: 'Geral VOS (Saques)', tipo: 'saida' },
    ...Array.from(new Set(condominios.map((c) => c.nome)))
      .filter((n) => n !== 'VOS CONDO')
      .filter(Boolean)
      .map((nome) => ({ nome, tipo: 'entrada' as const }))
  ];

  const listaCondominios = Array.from(new Set(listaOrigensDestinos.map((i) => i.nome)));

  // Handle Add Transaction Submit
  const handleAddTransacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDescricao || !novoValor) return;

    const valNum = parseFloat(novoValor) || 0;
    const newTransId = `EXT-${Math.floor(100 + Math.random() * 900)}`;
    const newTrans: TransacaoExtrato = {
      id: newTransId,
      data: novaData,
      mesReferencia: novoMesRef,
      descricao: novaDescricao.trim(),
      valor: valNum,
      tipo: novoTipo,
      condominioNome: novoCondominio,
      categoria: novaCategoria
    };

    setTransacoes([newTrans, ...transacoes]);
    apiSaveTransacao(newTrans).catch((err) => console.error('Erro ao salvar transação no SQLite:', err));

    // Toda entrada criada no extrato gera um Registro de NFe automaticamente com status Pendente
    if (novoTipo === 'entrada') {
      const condObj = condominios.find((c) => c.nome === novoCondominio);
      const plano = condObj?.plano || 'Vos Essencial';

      const novaNfe = {
        id: `nf_ext_${newTransId}_${Date.now()}`,
        numero: `2026/00${Math.floor(50 + Math.random() * 50)}`,
        condominioNome: novoCondominio,
        cnpjTomador: condObj?.cnpj || (novoCondominio === 'VOS CONDO' ? '45.890.123/0001-99' : '00.000.000/0001-00'),
        enderecoTomador: condObj?.endereco || (novoCondominio === 'VOS CONDO' ? 'Curitiba - PR' : 'Endereço Comercial do Condomínio'),
        emailTomador: condObj?.emailCondominio || 'contato@voscondo.com.br',
        modeloEmpresa: 'MEI' as const,
        codigoTributacao: '17.02',
        descricaoServico: novaDescricao.trim() || `Prestação de serviços de apoio administrativo para ${novoCondominio}, ref. ao mês de ${novoMesRef}.`,
        planoOuServicoPreset: plano,
        dataEmissao: novaData,
        valorTotal: valNum,
        aliquotaIss: 0,
        valorIss: 0,
        status: 'Pendente' as const,
        codigoVerificacao: `VOS-${Math.floor(1000 + Math.random() * 9000)}-MEI`,
        extratoTransacaoId: newTransId
      };

      if (onAdicionarNfe) {
        onAdicionarNfe(novaNfe);
      }

      try {
        const saved = localStorage.getItem('vos_treasury_nfes');
        const listaAtual = saved ? JSON.parse(saved) : [];
        novaNfe.numero = `2026/00${(listaAtual.length + 51).toString().padStart(2, '0')}`;
        localStorage.setItem('vos_treasury_nfes', JSON.stringify([novaNfe, ...listaAtual]));
      } catch (err) {
        console.error('Erro ao salvar NFe automática:', err);
      }
    }

    // Reset Form
    setNovaDescricao('');
    setNovoValor('');
    setShowAddModal(false);
  };

  // Delete Confirmation State
  const [itemParaExcluir, setItemParaExcluir] = useState<{ id: string; desc: string } | null>(null);

  // Delete Transaction
  const handleDeleteTransacao = (id: string, desc: string) => {
    setItemParaExcluir({ id, desc });
  };

  const confirmarExclusaoTransacao = () => {
    if (itemParaExcluir) {
      apiDeleteTransacao(itemParaExcluir.id).catch((err) => console.error('Erro ao excluir transação no SQLite:', err));
      setTransacoes((prev) => prev.filter((t) => t.id !== itemParaExcluir.id));
      setItemParaExcluir(null);
    }
  };

  // Filtered Transactions Logic
  const transacoesFiltradas = transacoes.filter((t) => {
    // Month filter
    const matchMes = mesReferencia === 'Todos os Meses' || t.mesReferencia === mesReferencia;

    // Condominium filter
    const matchCondo =
      filtroCondominio === 'todos' || t.condominioNome.toLowerCase() === filtroCondominio.toLowerCase();

    // Type filter (Entrada / Saída)
    const matchTipo = filtroTipo === 'todos' || t.tipo === filtroTipo;

    // Search query filter
    const searchLower = busca.toLowerCase();
    const matchBusca =
      t.descricao.toLowerCase().includes(searchLower) ||
      t.condominioNome.toLowerCase().includes(searchLower) ||
      (t.categoria && t.categoria.toLowerCase().includes(searchLower));

    return matchMes && matchCondo && matchTipo && matchBusca;
  });

  // Calculate Dashboard Metrics
  const totalEntradas = transacoesFiltradas
    .filter((t) => t.tipo === 'entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalSaidas = transacoesFiltradas
    .filter((t) => t.tipo === 'saida')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoLiquido = totalEntradas - totalSaidas;
  const margemLucro = totalEntradas > 0 ? (saldoLiquido / totalEntradas) * 100 : 0;

  // Format date DD/MM/YYYY
  const formatarDataBR = (dataIso: string) => {
    if (!dataIso) return '-';
    const partes = dataIso.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataIso;
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Reference Month Selector & Add Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#e8f0e6] p-3 rounded-xl border border-[#2d5a32]/20">
            <FileSpreadsheet className="w-6 h-6 text-[#2d5a32]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1c3220] flex items-center gap-2">
              <span>3.3 Extrato Financeiro & Fluxo Mensal VOS</span>
            </h2>
            <p className="text-xs text-slate-500">
              Demonstrativo detalhado de todas as entradas, saídas e rentabilidade líquida do mês
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector Filter */}
          <div className="flex items-center gap-2 bg-[#f8faf6] px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-[#2d5a32]" />
            <label className="text-xs font-bold text-slate-700">Mês de Referência:</label>
            <select
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#1c3220] focus:ring-2 focus:ring-[#2d5a32]"
            >
              {mesesDisponiveis.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNovoTipo('entrada');
                const condsCadastrados = Array.from(new Set(condominios.map((c) => c.nome))).filter(Boolean);
                setNovoCondominio(condsCadastrados[0] || '');
                const catEntrada = categorias.find((c) => c.tipo === 'entrada' || c.tipo === 'ambos');
                if (catEntrada) setNovaCategoria(catEntrada.nome);
                setShowAddModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>+ Entrada</span>
            </button>

            <button
              onClick={() => {
                setNovoTipo('saida');
                setNovoCondominio('Geral VOS (Administradora)');
                const catSaida = categorias.find((c) => c.tipo === 'saida' || c.tipo === 'ambos');
                if (catSaida) setNovaCategoria(catSaida.nome);
                setShowAddModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Saída</span>
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD CARDS: ENTRADAS, SAÍDAS E MARGEM DE LUCRO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: ENTRADAS */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span>Entradas ({mesReferencia})</span>
            </span>
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {formatarMoeda(totalEntradas)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Total de receitas e taxas recebidas
            </p>
          </div>

          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-50/50 rounded-full pointer-events-none" />
        </div>

        {/* Card 2: SAÍDAS */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <span>Saídas ({mesReferencia})</span>
            </span>
            <div className="bg-rose-100 p-2 rounded-xl text-rose-700">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
              {formatarMoeda(totalSaidas)}
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              Despesas operacionais e custos fixos
            </p>
          </div>

          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-50/50 rounded-full pointer-events-none" />
        </div>

        {/* Card 3: MARGEM DE LUCRO */}
        <div className="bg-white p-5 rounded-2xl border border-[#2d5a32]/30 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-[#f4f8f4]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1c3220] uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-[#2d5a32]" />
              <span>Margem de Lucro ({mesReferencia})</span>
            </span>
            <div className="bg-[#2d5a32] p-2 rounded-xl text-white">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-[#2d5a32] font-mono">
                {margemLucro.toFixed(1)}%
              </p>
              <p className="text-[11px] text-[#2d5a32] font-bold mt-1">
                Saldo Líquido: <span className="font-mono">{formatarMoeda(saldoLiquido)}</span>
              </p>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e8f0e6] text-[#2d5a32] border border-[#2d5a32]/20">
              {saldoLiquido >= 0 ? 'Lucrativo ★' : 'Atenção (Déficit)'}
            </span>
          </div>
        </div>
      </div>

      {/* LISTA E TABELA DE EXTRATO DOS FLUXOS DO MÊS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 p-5">
        {/* Search and Sub-filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#1c3220] text-base">Extrato dos Fluxos do Mês</h3>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {transacoesFiltradas.length} lançamentos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Input Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por descrição ou condomínio..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 pr-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-[#2d5a32] font-medium"
              />
            </div>

            {/* Filter by Condominium */}
            <select
              value={filtroCondominio}
              onChange={(e) => setFiltroCondominio(e.target.value)}
              className="p-1.5 border rounded-lg font-semibold bg-slate-50 text-slate-800"
            >
              <option value="todos">Todos Condomínios / Geral</option>
              {listaCondominios.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filter by Type */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'entrada' | 'saida')}
              className="p-1.5 border rounded-lg font-semibold bg-slate-50 text-slate-800"
            >
              <option value="todos">Entradas e Saídas</option>
              <option value="entrada">Apenas Entradas (+)</option>
              <option value="saida">Apenas Saídas (-)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8faf6] text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Valor (R$)</th>
                <th className="py-3 px-3">Entrada ou Saída</th>
                <th className="py-3 px-3">Condomínio / Origem ou Destino</th>
                <th className="py-3 px-3">Descrição & Categoria</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    Nenhum lançamento financeiro encontrado no mês {mesReferencia} com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                transacoesFiltradas.map((t) => {
                  const isEntrada = t.tipo === 'entrada';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Coluna 1: DATA */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {formatarDataBR(t.data)}
                      </td>

                      {/* Coluna 2: VALOR */}
                      <td className="py-3.5 px-3 font-mono font-black text-sm whitespace-nowrap">
                        <span className={isEntrada ? 'text-emerald-700' : 'text-rose-600'}>
                          {isEntrada ? '+' : '-'} {formatarMoeda(t.valor)}
                        </span>
                      </td>

                      {/* Coluna 3: ENTRADA OU SAÍDA */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isEntrada ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-200">
                            <ArrowDownRight className="w-3 h-3 text-emerald-700" />
                            <span>Entrada</span>
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-rose-200">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            <span>Saída</span>
                          </span>
                        )}
                      </td>

                      {/* Coluna 4: CONDOMÍNIO */}
                      <td className="py-3.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#2d5a32] shrink-0" />
                          <span>{t.condominioNome}</span>
                        </span>
                      </td>

                      {/* Coluna 5: DESCRIÇÃO */}
                      <td className="py-3.5 px-3 space-y-0.5">
                        <p className="font-bold text-slate-900 text-xs">{t.descricao}</p>
                        {t.categoria && (
                          <span className="text-[10px] text-slate-400 font-medium block">
                            Categoria: {t.categoria}
                          </span>
                        )}
                      </td>

                      {/* Coluna 6: AÇÃO */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteTransacao(t.id, t.descricao)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Totals */}
        <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span>
              Entradas: <strong className="text-emerald-700 font-mono">{formatarMoeda(totalEntradas)}</strong>
            </span>
            <span>
              Saídas: <strong className="text-rose-600 font-mono">{formatarMoeda(totalSaidas)}</strong>
            </span>
          </div>

          <div className="text-right font-bold text-[#1c3220]">
            <span>Saldo do Mês ({mesReferencia}): </span>
            <span className={`font-mono text-sm ${saldoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatarMoeda(saldoLiquido)}
            </span>
          </div>
        </div>
      </div>

      {/* GESTÃO DE CATEGORIAS DO EXTRATO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#e8f0e6] text-[#2d5a32] rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1c3220] text-base">Categorias dos Lançamentos no Extrato</h3>
              <p className="text-xs text-slate-500">
                Gerencie as categorias disponíveis para classificação no Novo Lançamento no Extrato.
              </p>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
            {categorias.length} categorias cadastradas
          </span>
        </div>

        {/* Form para Adicionar Nova Categoria */}
        <form onSubmit={handleAddCategoria} className="flex flex-wrap lg:flex-nowrap gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="relative flex-1 w-full min-w-[200px]">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Digite o nome da nova categoria (ex: Manutenção, Consultoria)..."
              value={novaCategoriaNome}
              onChange={(e) => setNovaCategoriaNome(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Segmento:</span>
            <button
              type="button"
              onClick={() => setNovaCategoriaTipo('entrada')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center gap-1 ${
                novaCategoriaTipo === 'entrada'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Entrada</span>
            </button>

            <button
              type="button"
              onClick={() => setNovaCategoriaTipo('saida')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center gap-1 ${
                novaCategoriaTipo === 'saida'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Saída</span>
            </button>

            <button
              type="button"
              onClick={() => setNovaCategoriaTipo('ambos')}
              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer flex items-center gap-1 ${
                novaCategoriaTipo === 'ambos'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Ambos</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </form>

        {/* Lista de Categorias Existentes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {categorias.map((cat, idx) => {
            return (
              <div
                key={`${cat.nome}-${idx}`}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-[#2d5a32]/40 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      cat.tipo === 'entrada'
                        ? 'bg-emerald-500'
                        : cat.tipo === 'saida'
                        ? 'bg-rose-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-slate-800 truncate" title={cat.nome}>
                      {cat.nome}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                      {cat.tipo === 'entrada' ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" /> Entrada
                        </span>
                      ) : cat.tipo === 'saida' ? (
                        <span className="text-rose-600 flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" /> Saída
                        </span>
                      ) : (
                        <span className="text-indigo-600 flex items-center gap-0.5">
                          <Tag className="w-3 h-3" /> Entrada & Saída
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setCategoriaEditando({ index: idx, nome: cat.nome, tipo: cat.tipo })
                    }
                    className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Editar Categoria e Segmento"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoriaExcluir({ index: idx, nome: cat.nome })}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Categoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Novo Lançamento Financeiro */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#1c3220] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#2d5a32]" />
                <span>Novo Lançamento no Extrato</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransacao} className="space-y-4 text-xs">
              {/* Tipo: Entrada ou Saída */}
              <div>
                <label className="block font-bold mb-1 text-slate-700">Tipo de Lançamento *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipo('entrada');
                      const condsCadastrados = Array.from(new Set(condominios.map((c) => c.nome))).filter(Boolean);
                      setNovoCondominio(condsCadastrados[0] || '');
                      const catEntrada = categorias.find((c) => c.tipo === 'entrada' || c.tipo === 'ambos');
                      if (catEntrada) setNovaCategoria(catEntrada.nome);
                    }}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      novoTipo === 'entrada'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>+ Entrada (Receita)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipo('saida');
                      setNovoCondominio('Geral VOS (Administradora)');
                      const catSaida = categorias.find((c) => c.tipo === 'saida' || c.tipo === 'ambos');
                      if (catSaida) setNovaCategoria(catSaida.nome);
                    }}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      novoTipo === 'saida'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>- Saída (Despesa)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Data do Fluxo *</label>
                  <input
                    type="date"
                    required
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Mês de Referência *</label>
                  <select
                    value={novoMesRef}
                    onChange={(e) => setNovoMesRef(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    {mesesDisponiveis
                      .filter((m) => m !== 'Todos os Meses')
                      .map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1500.00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    {novoTipo === 'entrada' ? 'Condomínio / Origem *' : 'Condomínio / Destino *'}
                  </label>
                  <select
                    value={novoCondominio}
                    onChange={(e) => setNovoCondominio(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    {novoTipo === 'saida' ? (
                      <>
                        <option value="VOS CONDO">VOS CONDO</option>
                        <option value="Geral VOS (Administradora)">Geral VOS (Administradora)</option>
                        <option value="Geral VOS (Saques)">Geral VOS (Saques)</option>
                      </>
                    ) : (
                      <>
                        <option value="VOS CONDO">VOS CONDO</option>
                        {Array.from(new Set(condominios.map((c) => c.nome)))
                          .filter((n) => n !== 'VOS CONDO')
                          .filter(Boolean)
                          .map((nome) => (
                            <option key={nome} value={nome}>
                              {nome}
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">Descrição / Histórico *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    novoTipo === 'entrada'
                      ? 'Ex: Recebimento de Taxa de Administração extra'
                      : 'Ex: Pagamento de Licença de Software de TI'
                  }
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">
                  Categoria ({novoTipo === 'entrada' ? 'Entrada e Ambos' : 'Saída e Ambos'})
                </label>
                <select
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
                >
                  {categorias
                    .filter((c) => c.tipo === novoTipo || c.tipo === 'ambos')
                    .map((cat) => (
                      <option key={cat.nome} value={cat.nome}>
                        {cat.nome}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar no Extrato</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Confirm Exclusion */}
      {itemParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Remover Transação do Extrato?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Você tem certeza que deseja remover <strong className="text-slate-800">"{itemParaExcluir.desc}"</strong>? Esta ação não poderá ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setItemParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoTransacao}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Editar Categoria do Extrato */}
      {categoriaEditando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#1c3220] flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#2d5a32]" />
                <span>Editar Categoria do Extrato</span>
              </h3>
              <button
                type="button"
                onClick={() => setCategoriaEditando(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoCategoria} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Nome da Categoria *</label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={categoriaEditando.nome}
                    onChange={(e) =>
                      setCategoriaEditando({ ...categoriaEditando, nome: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
                    placeholder="Nome da categoria..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-slate-700">
                  Segmento da Categoria (Classificação) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoriaEditando({ ...categoriaEditando, tipo: 'entrada' })}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      categoriaEditando.tipo === 'entrada'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Entrada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoriaEditando({ ...categoriaEditando, tipo: 'saida' })}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      categoriaEditando.tipo === 'saida'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Saída</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoriaEditando({ ...categoriaEditando, tipo: 'ambos' })}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      categoriaEditando.tipo === 'ambos'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Ambos</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">
                  Defina se esta categoria é de <strong>Entrada (Receita)</strong>, <strong>Saída (Despesa)</strong> ou <strong>Ambos</strong> para filtrar automaticamente ao lançar.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCategoriaEditando(null)}
                  className="px-4 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Category Exclusion */}
      {categoriaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Categoria?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deseja remover a categoria <strong className="text-slate-800">"{categoriaExcluir.nome}"</strong>? Ela deixará de aparecer na seleção de categorias.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoriaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExcluirCategoria}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
