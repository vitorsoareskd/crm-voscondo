import React, { useState } from 'react';
import { Fornecedor, Porquinho, TransacaoPorquinho, Condominio, TransacaoExtrato, ProjecaoItem, Inadimplente } from '../../types';
import { formatarMoeda } from '../../utils/pricingEngine';
import { ExtratoFinanceiroSection } from './ExtratoFinanceiroSection';
import { RentabilidadeSection } from './RentabilidadeSection';
import { SaudeAdministradoraSection } from './SaudeAdministradoraSection';
import { UcondoApiSection } from './UcondoApiSection';
import { NFeSection } from './NFeSection';
import {
  ShieldCheck,
  Plus,
  Star,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  DollarSign,
  Layers,
  Search,
  RefreshCw,
  Lock,
  PiggyBank,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface TreasuryModuleProps {
  fornecedores: Fornecedor[];
  setFornecedores: React.Dispatch<React.SetStateAction<Fornecedor[]>>;
  porquinhos: Porquinho[];
  setPorquinhos: React.Dispatch<React.SetStateAction<Porquinho[]>>;
  condominios: Condominio[];
  inadimplentes?: Inadimplente[];
  setInadimplentes?: React.Dispatch<React.SetStateAction<Inadimplente[]>>;
  transacoesExtrato: TransacaoExtrato[];
  setTransacoesExtrato: React.Dispatch<React.SetStateAction<TransacaoExtrato[]>>;
  projecaoItems: ProjecaoItem[];
  setProjecaoItems: React.Dispatch<React.SetStateAction<ProjecaoItem[]>>;
  subTab: string;
}

export const TreasuryModule: React.FC<TreasuryModuleProps> = ({
  fornecedores,
  setFornecedores,
  porquinhos,
  setPorquinhos,
  condominios,
  inadimplentes = [],
  setInadimplentes = () => {},
  transacoesExtrato,
  setTransacoesExtrato,
  projecaoItems,
  setProjecaoItems,
  subTab
}) => {
  // Porquinho Modal State
  const [novoPorquinhoNome, setNovoPorquinhoNome] = useState('');
  const [novoPorquinhoDesc, setNovoPorquinhoDesc] = useState('');
  const [novoPorquinhoSaldo, setNovoPorquinhoSaldo] = useState('1000');
  const [showAddPorquinho, setShowAddPorquinho] = useState(false);
  const [porquinhoParaExcluir, setPorquinhoParaExcluir] = useState<Porquinho | null>(null);

  // Deposit/Withdraw Modal
  const [selectedPorquinho, setSelectedPorquinho] = useState<Porquinho | null>(null);
  const [transacaoValor, setTransacaoValor] = useState('');
  const [transacaoDesc, setTransacaoDesc] = useState('');
  const [transacaoTipo, setTransacaoTipo] = useState<'aporte' | 'retirada'>('aporte');

  // Supplier state
  const [buscaFornecedor, setBuscaFornecedor] = useState('');
  const [segmentoFiltro, setSegmentoFiltro] = useState('todos');

  // Supplier Form
  const [fornNome, setFornNome] = useState('');
  const [fornCnpj, setFornCnpj] = useState('');
  const [fornCondo, setFornCondo] = useState('');
  const [fornSegmento, setFornSegmento] = useState<Fornecedor['segmento']>('Limpeza');
  const [fornServicoStar, setFornServicoStar] = useState(5);
  const [fornCustoStar, setFornCustoStar] = useState(4);
  const [fornTel, setFornTel] = useState('');

  // Selected Year Reference for Porquinhos / Centros de Custo
  const [anoReferenciaPorquinho, setAnoReferenciaPorquinho] = useState<string>('2026');

  // Calculations for Extrato & Porquinhos
  const receitaTotalExtrato = transacoesExtrato
    .filter((t) => t.tipo === 'entrada')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const despesaTotalExtrato = transacoesExtrato
    .filter((t) => t.tipo === 'saida')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const caixaAcumuladoLucroLiquido = receitaTotalExtrato - despesaTotalExtrato;
  const saldoTotalPorquinhos = porquinhos.reduce((acc, p) => acc + (p.saldoAtual || 0), 0);
  const lucroLiquidoLivre = Math.max(0, caixaAcumuladoLucroLiquido - saldoTotalPorquinhos);

  // Total Geral VOS (Saques) / Dividendos for selected reference year
  const totalDividendosGeralVOS = transacoesExtrato
    .filter((t) => {
      const isDiv =
        t.condominioNome === 'Geral VOS (Saques)' ||
        t.condominioNome === 'SAQUES' ||
        t.condominioNome === 'Geral VOS (Dividendos)' ||
        t.categoria === 'Dividendos / Distribuição de Lucro' ||
        t.condominioNome?.includes('Dividendos') ||
        t.condominioNome?.includes('Saques') ||
        t.condominioNome?.includes('SAQUES') ||
        t.categoria?.toLowerCase().includes('dividendo');

      if (!isDiv) return false;
      if (anoReferenciaPorquinho === 'Todos') return true;

      const tAno = t.data ? t.data.substring(0, 4) : (t.mesReferencia?.split('/')[1] || '2026');
      return tAno === anoReferenciaPorquinho;
    })
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const handleAddPorquinho = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPorquinhoNome) return;

    const aporte = parseFloat(novoPorquinhoSaldo) || 0;
    if (aporte > lucroLiquidoLivre) {
      alert(`O aporte inicial (${formatarMoeda(aporte)}) excede o Lucro Líquido Livre disponível (${formatarMoeda(lucroLiquidoLivre)}).`);
      return;
    }

    const colors = ['#2d5a32', '#166534', '#854d0e', '#3f6212', '#065f46', '#1e3a1a'];
    const newP: Porquinho = {
      id: `PORQ-${Math.floor(10 + Math.random() * 90)}`,
      nome: novoPorquinhoNome,
      descricao: novoPorquinhoDesc || 'Centro de Custo Personalizado VOS',
      saldoAtual: aporte,
      cor: colors[porquinhos.length % colors.length]
    };

    setPorquinhos([...porquinhos, newP]);
    setNovoPorquinhoNome('');
    setNovoPorquinhoDesc('');
    setNovoPorquinhoSaldo('0');
    setShowAddPorquinho(false);
  };

  const handleTransacaoPorquinho = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPorquinho || !transacaoValor) return;

    const val = parseFloat(transacaoValor) || 0;
    if (val <= 0) return;

    if (transacaoTipo === 'aporte') {
      if (val > lucroLiquidoLivre) {
        alert(`O valor do aporte (${formatarMoeda(val)}) ultrapassa o Lucro Líquido Livre disponível (${formatarMoeda(lucroLiquidoLivre)}).`);
        return;
      }
    } else if (transacaoTipo === 'retirada') {
      if (val > selectedPorquinho.saldoAtual) {
        alert(`O valor da retirada (${formatarMoeda(val)}) excede o saldo atual do porquinho (${formatarMoeda(selectedPorquinho.saldoAtual)}).`);
        return;
      }
    }

    setPorquinhos((prev) =>
      prev.map((p) => {
        if (p.id === selectedPorquinho.id) {
          const novoSaldo = transacaoTipo === 'aporte' ? p.saldoAtual + val : p.saldoAtual - val;
          return { ...p, saldoAtual: Math.max(0, novoSaldo) };
        }
        return p;
      })
    );

    setSelectedPorquinho(null);
    setTransacaoValor('');
    setTransacaoDesc('');
  };

  const handleConfirmarExclusaoPorquinho = () => {
    if (!porquinhoParaExcluir) return;
    const targetId = porquinhoParaExcluir.id;
    setPorquinhos((prev) => prev.filter((p) => p.id !== targetId));
    setPorquinhoParaExcluir(null);
  };

  const handleAddFornecedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornNome) return;

    const newForn: Fornecedor = {
      id: `FORN-${Math.floor(10 + Math.random() * 90)}`,
      nome: fornNome,
      cnpj: fornCnpj || '00.000.000/0001-00',
      condominioAtendido: fornCondo || 'Vários Prédios',
      segmento: fornSegmento,
      avaliacaoServico: fornServicoStar,
      avaliacaoCustoBeneficio: fornCustoStar,
      telefone: fornTel || '(41) 90000-0000',
      email: 'contato@fornecedor.com'
    };

    setFornecedores([newForn, ...fornecedores]);
    setFornNome('');
    setFornCnpj('');
    setFornTel('');
  };

  // Calculations for Treasury Dashboard
  const faturamentoMensalTotal = condominios.reduce((acc, c) => acc + (c.mensalidadeCalculada || 0), 0);
  const totalUnidades = condominios.reduce((acc, c) => acc + (c.unidades || 0), 0);
  const ticketMedioCondominio = condominios.length > 0 ? faturamentoMensalTotal / condominios.length : 0;

  // Recharts Data
  const dataPie = [
    { name: 'Planos Vos 360', value: condominios.filter((c) => c.plano === 'Vos 360').reduce((acc, c) => acc + c.mensalidadeCalculada, 0), color: '#2d5a32' },
    { name: 'Planos Vos Pulse', value: condominios.filter((c) => c.plano === 'Vos Pulse').reduce((acc, c) => acc + c.mensalidadeCalculada, 0), color: '#3f6212' },
    { name: 'Planos Vos Essencial', value: condominios.filter((c) => c.plano === 'Vos Essencial').reduce((acc, c) => acc + c.mensalidadeCalculada, 0), color: '#166534' },
    { name: 'Planos Vos Starter', value: condominios.filter((c) => c.plano === 'Vos Starter').reduce((acc, c) => acc + c.mensalidadeCalculada, 0), color: '#854d0e' },
  ].filter((item) => item.value > 0);

  const dataBar = condominios.map((c) => {
    const horas = c.horasEstimadasMes || 10;
    const receitaHora = c.mensalidadeCalculada / horas;
    return {
      nome: c.nome.split(' ')[0] + ' ' + (c.nome.split(' ')[1] || ''),
      faturamento: c.mensalidadeCalculada,
      lucroHora: Math.round(receitaHora)
    };
  });

  const fornecedoresFiltrados = fornecedores.filter((f) => {
    const matchBusca = f.nome.toLowerCase().includes(buscaFornecedor.toLowerCase()) || f.segmento.toLowerCase().includes(buscaFornecedor.toLowerCase());
    const matchSeg = segmentoFiltro === 'todos' || f.segmento === segmentoFiltro;
    return matchBusca && matchSeg;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Strict Separation Header Banner */}
      <div className="bg-[#122215] text-white p-5 rounded-2xl border border-emerald-800/80 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-800/80 p-3 rounded-xl border border-emerald-600/40">
            <Lock className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase text-emerald-300 tracking-wider">3.2 Separação Total de Contas</span>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Compliance VOS
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-0.5">
              O caixa dos condomínios é 100% segregado. Este painel cuida exclusivamente da receita e saúde financeira da Administradora VOS.
            </p>
          </div>
        </div>
      </div>

      {/* SubTab 1: 3.2 Caixa & Porquinhos (Centros de Custo) */}
      {subTab === 'porquinhos' && (
        <div className="space-y-6">
          {/* Header Banner & Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-[#1c3220] flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-[#2d5a32]" />
                <span>3.2 Centros de Custo & Porquinhos VOS</span>
              </h2>
              <p className="text-xs text-slate-500">
                Divisão e destino do caixa acumulado da administradora com limite máximo no Lucro Líquido Livre
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Ano:</span>
                <select
                  value={anoReferenciaPorquinho}
                  onChange={(e) => setAnoReferenciaPorquinho(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="Todos">Todos</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setNovoPorquinhoSaldo('0');
                  setShowAddPorquinho(true);
                }}
                className="bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Porquinho</span>
              </button>
            </div>
          </div>

          {/* 4 Key KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Caixa Acumulado (Lucro Líquido) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Caixa Acumulado (Lucro Líquido)
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#2d5a32] font-mono">
                {formatarMoeda(caixaAcumuladoLucroLiquido)}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold">
                Captado do Extrato (Entradas R$ {formatarMoeda(receitaTotalExtrato)} - Saídas R$ {formatarMoeda(despesaTotalExtrato)})
              </p>
            </div>

            {/* Card 2: Saldo Alocado nos Porquinhos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Alocado nos Porquinhos
                </span>
                <div className="p-2 bg-amber-50 text-amber-800 rounded-lg">
                  <PiggyBank className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-900 font-mono">
                {formatarMoeda(saldoTotalPorquinhos)}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold">
                Soma das reservas em {porquinhos.length} porquinhos ativos
              </p>
            </div>

            {/* Card 3: Lucro Líquido Livre (Disponível p/ Alocar) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 bg-gradient-to-br from-emerald-50/60 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lucro Líquido Livre</span>
                </span>
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-900 font-mono">
                {formatarMoeda(lucroLiquidoLivre)}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">
                Saldo disponível não embutido nos porquinhos
              </p>
            </div>

            {/* Card 4: Geral VOS (Saques) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 bg-gradient-to-br from-indigo-50/50 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                  <PieChartIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Geral VOS (Saques)</span>
                </span>
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-indigo-950 font-mono">
                {formatarMoeda(totalDividendosGeralVOS)}
              </p>
              <p className="text-[10px] text-indigo-700 font-semibold">
                Soma acumulada em {anoReferenciaPorquinho === 'Todos' ? 'todo o extrato' : anoReferenciaPorquinho}
              </p>
            </div>
          </div>

          {/* Porquinhos Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {porquinhos.map((p) => {
              const pctOfTotal = caixaAcumuladoLucroLiquido > 0
                ? ((p.saldoAtual / caixaAcumuladoLucroLiquido) * 100).toFixed(1)
                : '0.0';

              return (
                <div
                  key={p.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-[#2d5a32] transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: p.cor }}></span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{p.id}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPorquinhoParaExcluir(p);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir porquinho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{p.nome}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.descricao}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Saldo Atual</span>
                      <span className="text-xl font-black font-mono text-[#2d5a32]">{formatarMoeda(p.saldoAtual)}</span>
                    </div>

                    {/* Progress relative to Lucro Líquido Total */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Fatia do Lucro Líquido</span>
                        <span>{pctOfTotal}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, parseFloat(pctOfTotal))}%`,
                            backgroundColor: p.cor
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPorquinho(p)}
                      className="w-full bg-slate-50 hover:bg-[#2d5a32] hover:text-white text-slate-800 text-xs font-bold py-2 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <span>Movimentar Saldo</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: 3.1 Gestão de Fornecedores e Ranking */}
      {subTab === 'fornecedores' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Add Supplier Form */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-[#1c3220] text-base border-b pb-2">3.1 Homologar Novo Fornecedor</h3>

            <form onSubmit={handleAddFornecedor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Nome da Empresa / Parceiro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: HidroClean Sanitizações"
                  value={fornNome}
                  onChange={(e) => setFornNome(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">CNPJ</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={fornCnpj}
                    onChange={(e) => setFornCnpj(e.target.value)}
                    className="w-full p-2 border rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Segmento *</label>
                  <select
                    value={fornSegmento}
                    onChange={(e) => setFornSegmento(e.target.value as Fornecedor['segmento'])}
                    className="w-full p-2 border rounded-lg font-medium"
                  >
                    <option value="Limpeza">Limpeza</option>
                    <option value="Portaria">Portaria</option>
                    <option value="Manutenção Geral">Manutenção Geral</option>
                    <option value="Elevadores">Elevadores</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Jardinagem">Jardinagem</option>
                    <option value="Engenharia">Engenharia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Condomínio Atendido</label>
                <input
                  type="text"
                  placeholder="Ex: Batel Plaza"
                  value={fornCondo}
                  onChange={(e) => setFornCondo(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Telefone de Contato</label>
                <input
                  type="text"
                  placeholder="(41) 90000-0000"
                  value={fornTel}
                  onChange={(e) => setFornTel(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Star rating inputs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <label className="block font-bold text-[10px] text-slate-600 mb-1">Nível de Serviço (1-5)</label>
                  <select
                    value={fornServicoStar}
                    onChange={(e) => setFornServicoStar(parseInt(e.target.value))}
                    className="w-full p-1.5 border rounded-lg font-bold text-amber-600"
                  >
                    <option value={5}>5 Estrelas ★★★★★</option>
                    <option value={4}>4 Estrelas ★★★★☆</option>
                    <option value={3}>3 Estrelas ★★★☆☆</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[10px] text-slate-600 mb-1">Custo Benefício (1-5)</label>
                  <select
                    value={fornCustoStar}
                    onChange={(e) => setFornCustoStar(parseInt(e.target.value))}
                    className="w-full p-1.5 border rounded-lg font-bold text-amber-600"
                  >
                    <option value={5}>5 Estrelas ★★★★★</option>
                    <option value={4}>4 Estrelas ★★★★☆</option>
                    <option value={3}>3 Estrelas ★★★☆☆</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl shadow-xs"
              >
                Cadastrar Fornecedor Homologado
              </button>
            </form>
          </div>

          {/* Suppliers Table & Ranking Search */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-bold text-[#1c3220] text-base">Ranking de Fornecedores Homologados</h3>
                <p className="text-xs text-slate-500">Avaliação contínua para rápida substituição quando houver reclamações</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Buscar fornecedor..."
                  value={buscaFornecedor}
                  onChange={(e) => setBuscaFornecedor(e.target.value)}
                  className="p-1.5 border rounded-lg"
                />
                <select
                  value={segmentoFiltro}
                  onChange={(e) => setSegmentoFiltro(e.target.value)}
                  className="p-1.5 border rounded-lg font-medium"
                >
                  <option value="todos">Todos Segmentos</option>
                  <option value="Limpeza">Limpeza</option>
                  <option value="Portaria">Portaria</option>
                  <option value="Manutenção Geral">Manutenção Geral</option>
                  <option value="Elevadores">Elevadores</option>
                  <option value="Segurança">Segurança</option>
                  <option value="Engenharia">Engenharia</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fornecedoresFiltrados.map((f) => (
                <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-[#fafbfc] space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-[#e8f0e6] text-[#2d5a32] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {f.segmento}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{f.nome}</h4>
                      <p className="text-xs text-slate-500">Condomínio: {f.condominioAtendido}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{f.id}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Nível de Serviço:</span>
                      <span className="font-bold text-amber-600">{'★'.repeat(f.avaliacaoServico)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Custo Benefício:</span>
                      <span className="font-bold text-amber-600">{'★'.repeat(f.avaliacaoCustoBeneficio)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 font-mono">Contato: {f.telefone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 0: Saúde da Administradora */}
      {subTab === 'saude' && (
        <SaudeAdministradoraSection />
      )}

      {/* SubTab Ucondo API */}
      {subTab === 'ucondo' && (
        <UcondoApiSection
          inadimplentes={inadimplentes}
          setInadimplentes={setInadimplentes}
          condominios={condominios}
        />
      )}

      {/* SubTab 3: 3.3 Painel de Rentabilidade (Ano de Referência & Extrato Financeiro) */}
      {subTab === 'dashboard' && (
        <RentabilidadeSection
          transacoes={transacoesExtrato}
          condominios={condominios}
        />
      )}

      {/* SubTab 4: 3.3 Extrato Financeiro */}
      {subTab === 'extrato' && (
        <ExtratoFinanceiroSection
          transacoes={transacoesExtrato}
          setTransacoes={setTransacoesExtrato}
          condominios={condominios}
        />
      )}

      {/* SubTab 5: NFe */}
      {subTab === 'nfe' && (
        <NFeSection condominios={condominios} transacoes={transacoesExtrato} />
      )}

      {/* Add Porquinho Modal */}
      {showAddPorquinho && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#1c3220]">Criar Novo Porquinho</h3>
              </div>
              <button
                onClick={() => setShowAddPorquinho(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Lucro Líquido Livre */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Líquido Livre Disponível</span>
                <span className="text-base font-black font-mono text-emerald-900">{formatarMoeda(lucroLiquidoLivre)}</span>
              </div>
              <button
                type="button"
                onClick={() => setNovoPorquinhoSaldo(lucroLiquidoLivre.toString())}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer"
              >
                Usar Máximo
              </button>
            </div>

            <form onSubmit={handleAddPorquinho} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Nome do Porquinho *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fundo de Reserva & Expansão"
                  value={novoPorquinhoNome}
                  onChange={(e) => setNovoPorquinhoNome(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">Descrição / Objetivo</label>
                <input
                  type="text"
                  placeholder="Finalidade das economias guardadas"
                  value={novoPorquinhoDesc}
                  onChange={(e) => setNovoPorquinhoDesc(e.target.value)}
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Aporte Inicial (R$)</label>
                  <span className="text-[10px] font-semibold text-slate-400">Máx: {formatarMoeda(lucroLiquidoLivre)}</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  max={lucroLiquidoLivre}
                  value={novoPorquinhoSaldo}
                  onChange={(e) => setNovoPorquinhoSaldo(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl font-mono font-bold text-sm focus:ring-2 ${
                    parseFloat(novoPorquinhoSaldo) > lucroLiquidoLivre
                      ? 'border-rose-500 text-rose-600 focus:ring-rose-500'
                      : 'focus:ring-[#2d5a32]'
                  }`}
                />
                {parseFloat(novoPorquinhoSaldo) > lucroLiquidoLivre && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Valor excede o Lucro Líquido Livre ({formatarMoeda(lucroLiquidoLivre)})</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPorquinho(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={parseFloat(novoPorquinhoSaldo) > lucroLiquidoLivre}
                  className={`px-5 py-2 font-bold text-white rounded-xl shadow-xs cursor-pointer ${
                    parseFloat(novoPorquinhoSaldo) > lucroLiquidoLivre
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-[#2d5a32] hover:bg-[#1f4223]'
                  }`}
                >
                  Salvar Porquinho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit/Withdraw Modal */}
      {selectedPorquinho && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full shadow-xs"
                  style={{ backgroundColor: selectedPorquinho.cor }}
                />
                <h3 className="font-bold text-base text-[#1c3220]">
                  Movimentar • {selectedPorquinho.nome}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPorquinho(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Info Box */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Atual Porquinho</span>
                <span className="font-black font-mono text-[#2d5a32] text-sm">
                  {formatarMoeda(selectedPorquinho.saldoAtual)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Lucro Líquido Livre</span>
                <span className="font-black font-mono text-emerald-800 text-sm">
                  {formatarMoeda(lucroLiquidoLivre)}
                </span>
              </div>
            </div>

            <form onSubmit={handleTransacaoPorquinho} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Tipo de Operação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTransacaoTipo('aporte');
                      setTransacaoValor('');
                    }}
                    className={`py-2 rounded-xl font-bold border cursor-pointer transition-all ${
                      transacaoTipo === 'aporte'
                        ? 'bg-[#2d5a32] text-white border-[#1c3220]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    + Aporte (Depositar)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransacaoTipo('retirada');
                      setTransacaoValor('');
                    }}
                    className={`py-2 rounded-xl font-bold border cursor-pointer transition-all ${
                      transacaoTipo === 'retirada'
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    - Retirada (Sangria)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Valor Operação (R$) *</label>
                  {transacaoTipo === 'aporte' ? (
                    <button
                      type="button"
                      onClick={() => setTransacaoValor(lucroLiquidoLivre.toString())}
                      className="text-[10px] font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
                    >
                      Aportar Máximo Livre ({formatarMoeda(lucroLiquidoLivre)})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTransacaoValor(selectedPorquinho.saldoAtual.toString())}
                      className="text-[10px] font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                    >
                      Retirar Saldo Total ({formatarMoeda(selectedPorquinho.saldoAtual)})
                    </button>
                  )}
                </div>

                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transacaoValor}
                  onChange={(e) => setTransacaoValor(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl font-mono font-bold text-sm focus:ring-2 ${
                    transacaoTipo === 'aporte' && parseFloat(transacaoValor || '0') > lucroLiquidoLivre
                      ? 'border-rose-500 text-rose-600 focus:ring-rose-500'
                      : transacaoTipo === 'retirada' && parseFloat(transacaoValor || '0') > selectedPorquinho.saldoAtual
                      ? 'border-rose-500 text-rose-600 focus:ring-rose-500'
                      : 'focus:ring-[#2d5a32]'
                  }`}
                />

                {transacaoTipo === 'aporte' && parseFloat(transacaoValor || '0') > lucroLiquidoLivre && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Valor excede o Lucro Líquido Livre ({formatarMoeda(lucroLiquidoLivre)})</span>
                  </p>
                )}

                {transacaoTipo === 'retirada' && parseFloat(transacaoValor || '0') > selectedPorquinho.saldoAtual && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Valor excede o saldo do porquinho ({formatarMoeda(selectedPorquinho.saldoAtual)})</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPorquinho(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    (transacaoTipo === 'aporte' && parseFloat(transacaoValor || '0') > lucroLiquidoLivre) ||
                    (transacaoTipo === 'retirada' && parseFloat(transacaoValor || '0') > selectedPorquinho.saldoAtual)
                  }
                  className={`px-5 py-2 font-bold text-white rounded-xl shadow-xs cursor-pointer ${
                    (transacaoTipo === 'aporte' && parseFloat(transacaoValor || '0') > lucroLiquidoLivre) ||
                    (transacaoTipo === 'retirada' && parseFloat(transacaoValor || '0') > selectedPorquinho.saldoAtual)
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-[#2d5a32] hover:bg-[#1f4223]'
                  }`}
                >
                  Confirmar Operação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Porquinho Confirmation Modal */}
      {porquinhoParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Confirmar Exclusão</span>
              </div>
              <button
                type="button"
                onClick={() => setPorquinhoParaExcluir(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Tem certeza que deseja remover o porquinho <strong className="text-slate-900">{porquinhoParaExcluir.nome}</strong>?
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <div className="flex justify-between items-center text-amber-900 font-bold">
                  <span>Saldo a ser liberado:</span>
                  <span className="font-mono text-sm">{formatarMoeda(porquinhoParaExcluir.saldoAtual)}</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  O valor guardado neste porquinho retornará automaticamente ao <strong>Lucro Líquido Livre</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setPorquinhoParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarExclusaoPorquinho}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Porquinho</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
