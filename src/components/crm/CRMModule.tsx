import React, { useState } from 'react';
import { Condominio, Complexidade, Plano, ServicoExtra, ServicoPrestado } from '../../types';
import { SERVICOS_PRESTADOS_INICIAIS } from '../../data/initialData';
import { calcularMensalidade, formatarMoeda } from '../../utils/pricingEngine';
import { ProposalModal } from './ProposalModal';
import { Calculator, Plus, ArrowRight, FileCheck, Layers, Sparkles, DollarSign, ArrowUpRight, CheckCircle2, ChevronRight, HelpCircle, XCircle, RotateCcw, X, Search, Trash2, Clock, FileText, Building2, Filter, Edit3 } from 'lucide-react';

interface CRMModuleProps {
  condominios: Condominio[];
  setCondominios: React.Dispatch<React.SetStateAction<Condominio[]>>;
  servicosExtras: ServicoExtra[];
  setServicosExtras: React.Dispatch<React.SetStateAction<ServicoExtra[]>>;
  subTab: string;
}

export const CRMModule: React.FC<CRMModuleProps> = ({
  condominios,
  setCondominios,
  servicosExtras,
  setServicosExtras,
  subTab
}) => {
  // Simulator State
  const [customId, setCustomId] = useState('');
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [unidades, setUnidades] = useState<number | string>(24);
  const [complexidade, setComplexidade] = useState<Complexidade>('Tranquilo');
  const [plano, setPlano] = useState<Plano>('Vos 360');
  const [fatorAjuste, setFatorAjuste] = useState<number | string>(1.0);
  const [sindico, setSindico] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');

  // Selected proposal modal & ID editing state
  const [selectedCondoForDoc, setSelectedCondoForDoc] = useState<Condominio | null>(null);
  const [editingIdCondo, setEditingIdCondo] = useState<{ id: string; newId: string } | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Servicos Prestados State
  const [servicosPrestados, setServicosPrestados] = useState<ServicoPrestado[]>(SERVICOS_PRESTADOS_INICIAIS);
  const [buscaServico, setBuscaServico] = useState('');
  const [modalNovoServico, setModalNovoServico] = useState(false);

  // New Servico Prestado Form State
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novoCnpj, setNovoCnpj] = useState('');
  const [novoNomeCliente, setNovoNomeCliente] = useState('');
  const [novoServico, setNovoServico] = useState('');
  const [novasHoras, setNovasHoras] = useState<number | ''>('');
  const [novoValor, setNovoValor] = useState<number | ''>('');
  const [novaObservacao, setNovaObservacao] = useState('');

  const handleSelectCondoParaServico = (condoId: string) => {
    const selected = condominios.find(c => c.id === condoId);
    if (selected) {
      setNovoNomeCliente(selected.nome);
      setNovoCnpj(selected.cnpj);
    }
  };

  const handleSalvarServicoPrestado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeCliente.trim() || !novoServico.trim()) return;

    const novoItem: ServicoPrestado = {
      id: `SP-${String(servicosPrestados.length + 1).padStart(3, '0')}`,
      data: novaData || new Date().toISOString().split('T')[0],
      cnpjCliente: novoCnpj || '00.000.000/0001-00',
      nomeCliente: novoNomeCliente,
      servico: novoServico,
      horasTrabalhadas: Number(novasHoras) || 0,
      valor: Number(novoValor) || 0,
      observacao: novaObservacao || 'Sem observações adicionais.'
    };

    setServicosPrestados([novoItem, ...servicosPrestados]);
    setModalNovoServico(false);
    setNovaData(new Date().toISOString().split('T')[0]);
    setNovoCnpj('');
    setNovoNomeCliente('');
    setNovoServico('');
    setNovasHoras('');
    setNovoValor('');
    setNovaObservacao('');
  };

  const handleExcluirServicoPrestado = (id: string) => {
    setServicosPrestados(servicosPrestados.filter(s => s.id !== id));
  };

  const servicosFiltrados = servicosPrestados.filter(s =>
    s.nomeCliente.toLowerCase().includes(buscaServico.toLowerCase()) ||
    s.cnpjCliente.toLowerCase().includes(buscaServico.toLowerCase()) ||
    s.servico.toLowerCase().includes(buscaServico.toLowerCase()) ||
    s.observacao.toLowerCase().includes(buscaServico.toLowerCase())
  );

  const totalHorasGerais = servicosPrestados.reduce((acc, s) => acc + s.horasTrabalhadas, 0);
  const totalValorGeral = servicosPrestados.reduce((acc, s) => acc + s.valor, 0);

  // Safe numeric conversion for calculation motor
  const parseNum = (val: number | string, defaultVal: number): number => {
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    if (!val || typeof val !== 'string') return defaultVal;
    const normalized = val.trim().replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const numUnidades = Math.max(1, Math.round(parseNum(unidades, 24)));
  const numFator = Math.max(0.1, parseNum(fatorAjuste, 1.0));

  // Live calculation output
  const calcResult = calcularMensalidade(numUnidades, complexidade, plano, numFator);

  // Compare all plans live
  const comparativoPlanos = [
    { nome: 'Vos Essencial', calc: calcularMensalidade(numUnidades, complexidade, 'Vos Essencial', numFator) },
    { nome: 'Vos Pulse', calc: calcularMensalidade(numUnidades, complexidade, 'Vos Pulse', numFator) },
    { nome: 'Vos 360', calc: calcularMensalidade(numUnidades, complexidade, 'Vos 360', numFator) },
    { nome: 'Vos Starter', calc: calcularMensalidade(numUnidades, complexidade, 'Vos Starter', numFator) },
  ];

  const gerarProximoIdCondominio = (lista: Condominio[]) => {
    const numeros = lista
      .map((c) => {
        const match = c.id.match(/^COND-(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = numeros.length > 0 ? Math.max(...numeros) : 100;
    const proximo = Math.max(maxNum + 1, 101);
    return `COND-${proximo}`;
  };

  const handleSalvarOrcamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const newId = customId.trim() || gerarProximoIdCondominio(condominios);
    const newCondo: Condominio = {
      id: newId,
      status: 'Cotação',
      nome,
      cnpj: cnpj || '00.000.000/0001-00',
      unidades: numUnidades,
      endereco: endereco || 'Curitiba - PR',
      sindicoResponsavel: sindico || 'A definir',
      emailCondominio: email || 'contato@condominio.com',
      numeroCondominio: '(41) 90000-0000',
      banco: 'A definir',
      agenciaEConta: 'A definir',
      complexidade,
      plano,
      fatorAjuste: numFator,
      mensalidadeCalculada: calcResult.valorFinal,
      livreCaixa: 5000,
      fundoObras: 0,
      fundoPintura: 0,
      fundoReforma: 0,
      gastoMedioMensal: 5000,
      rendimentoMedioMensal: 5500,
      saudeScore: 5
    };

    setCondominios([newCondo, ...condominios]);
    setSyncNotice(`Orçamento para "${nome}" cadastrado no Kanban com ID [${newId}] com sucesso!`);
    // Reset form
    setCustomId('');
    setNome('');
    setCnpj('');
    setSindico('');
    setEmail('');
    setEndereco('');
  };

  const handleSaveEditedId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdCondo || !editingIdCondo.newId.trim()) return;

    const targetOldId = editingIdCondo.id;
    const targetNewId = editingIdCondo.newId.trim();

    setCondominios((prev) =>
      prev.map((c) => (c.id === targetOldId ? { ...c, id: targetNewId } : c))
    );
    setSyncNotice(`ID atualizado para [${targetNewId}]. Você pode selecioná-lo no Bloco 2 (Perfil Completo)!`);
    setEditingIdCondo(null);
  };

  // Exclusion Modal States
  const [leadParaExcluir, setLeadParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  const [leadParaExcluirDefinitivo, setLeadParaExcluirDefinitivo] = useState<{ id: string; nome: string } | null>(null);

  const handleMoverExcluido = (id: string, nome: string) => {
    setLeadParaExcluir({ id, nome });
  };

  const confirmarMoverExcluido = () => {
    if (leadParaExcluir) {
      handleMoverStatus(leadParaExcluir.id, 'Excluído');
      setSyncNotice(`Lead "${leadParaExcluir.nome}" foi movido para a lista de Excluídos.`);
      setLeadParaExcluir(null);
    }
  };

  const handleExcluirDefinitivoPrompt = (id: string, nome: string) => {
    setLeadParaExcluirDefinitivo({ id, nome });
  };

  const confirmarExclusaoDefinitiva = () => {
    if (leadParaExcluirDefinitivo) {
      setCondominios((prev) => prev.filter((c) => c.id !== leadParaExcluirDefinitivo.id));
      setSyncNotice(`Lead "${leadParaExcluirDefinitivo.nome}" foi excluído definitivamente.`);
      setLeadParaExcluirDefinitivo(null);
    }
  };

  // Base Service Catalog (servicosExtras) Management States
  const [modalNovoServicoBase, setModalNovoServicoBase] = useState(false);
  const [editingServicoBase, setEditingServicoBase] = useState<ServicoExtra | null>(null);
  const [servicoBaseParaExcluir, setServicoBaseParaExcluir] = useState<ServicoExtra | null>(null);

  // Form fields for new or editing Base Service
  const [servicoBaseNome, setServicoBaseNome] = useState('');
  const [servicoBaseCategoria, setServicoBaseCategoria] = useState<ServicoExtra['categoria']>('Administrativa');
  const [servicoBaseValor, setServicoBaseValor] = useState<number>(150);
  const [servicoBaseUnidade, setServicoBaseUnidade] = useState<ServicoExtra['unidade']>('hora');
  const [servicoBaseDescricao, setServicoBaseDescricao] = useState('');

  const handleOpenAddServicoBase = () => {
    setServicoBaseNome('');
    setServicoBaseCategoria('Administrativa');
    setServicoBaseValor(150);
    setServicoBaseUnidade('hora');
    setServicoBaseDescricao('');
    setModalNovoServicoBase(true);
  };

  const handleOpenEditServicoBase = (se: ServicoExtra) => {
    setEditingServicoBase(se);
    setServicoBaseNome(se.nome);
    setServicoBaseCategoria(se.categoria);
    setServicoBaseValor(se.valorUnitario);
    setServicoBaseUnidade(se.unidade);
    setServicoBaseDescricao(se.descricao);
  };

  const handleSaveNovoServicoBase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoBaseNome.trim()) return;

    const nextNumber = servicosExtras.length + 1;
    const newId = `EXT-${String(nextNumber).padStart(3, '0')}`;

    const novoItem: ServicoExtra = {
      id: newId,
      nome: servicoBaseNome.trim(),
      categoria: servicoBaseCategoria,
      valorUnitario: Number(servicoBaseValor),
      unidade: servicoBaseUnidade,
      descricao: servicoBaseDescricao.trim() || 'Serviço prestado sob demanda.'
    };

    setServicosExtras((prev) => [...prev, novoItem]);
    setSyncNotice(`Serviço "${novoItem.nome}" cadastrado no Catálogo Base! Atualizado no Gerador de Carta Proposta.`);
    setModalNovoServicoBase(false);
  };

  const handleSaveEditServicoBase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServicoBase || !servicoBaseNome.trim()) return;

    setServicosExtras((prev) =>
      prev.map((s) =>
        s.id === editingServicoBase.id
          ? {
              ...s,
              nome: servicoBaseNome.trim(),
              categoria: servicoBaseCategoria,
              valorUnitario: Number(servicoBaseValor),
              unidade: servicoBaseUnidade,
              descricao: servicoBaseDescricao.trim()
            }
          : s
      )
    );

    setSyncNotice(`Valor e dados do serviço "${servicoBaseNome}" atualizados! Atualizado no Gerador de Carta Proposta.`);
    setEditingServicoBase(null);
  };

  const handleConfirmDeleteServicoBase = () => {
    if (servicoBaseParaExcluir) {
      setServicosExtras((prev) => prev.filter((s) => s.id !== servicoBaseParaExcluir.id));
      setSyncNotice(`Serviço "${servicoBaseParaExcluir.nome}" foi removido do Catálogo Base.`);
      setServicoBaseParaExcluir(null);
    }
  };

  const handleMoverStatus = (id: string, novoStatus: Condominio['status']) => {
    setCondominios((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: novoStatus } : c))
    );
  };

  const orcamentos = condominios.filter((c) => c.status === 'Cotação' || c.status === 'Interessado');
  const emTransicao = condominios.filter((c) => c.status === 'Em transição');
  const finalizados = condominios.filter((c) => c.status === 'Cliente Fidelizado');
  const perdidos = condominios.filter((c) => c.status === 'Perdido');
  const excluidos = condominios.filter((c) => c.status === 'Excluído');

  return (
    <div className="space-[#1c3220] p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* SubTab 1: Orçamentos & Calculadora & Kanban */}
      {subTab === 'orcamentos' && (
        <>
          {/* TOP SECTION: Calculator & Live Pricing Motor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="bg-[#2d5a32] p-2 rounded-xl text-white">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1c3220]">1.1 Pré-Cadastro & Simulador</h2>
                  <p className="text-xs text-slate-500">Insira as variáveis do condomínio para precificar via Motor VOS</p>
                </div>
              </div>

              <form onSubmit={handleSalvarOrcamento} className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nome do Condomínio *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Condomínio Batel Central"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] focus:border-transparent outline-hidden font-medium"
                    />
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">ID do Condomínio</label>
                      <button
                        type="button"
                        onClick={() => setCustomId(gerarProximoIdCondominio(condominios))}
                        className="text-[10px] text-[#2d5a32] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Gerar ID automático"
                      >
                        <Sparkles className="w-3 h-3" /> Gerar
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={`Ex: ${gerarProximoIdCondominio(condominios)}`}
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Número de Unidades *</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={unidades}
                      onChange={(e) => setUnidades(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Complexidade *</label>
                    <select
                      value={complexidade}
                      onChange={(e) => setComplexidade(e.target.value as Complexidade)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] font-medium"
                    >
                      <option value="Tranquilo">Tranquilo (+ R$ 50,00)</option>
                      <option value="Moderado">Moderado (+ R$ 150,00)</option>
                      <option value="Difícil">Difícil (+ R$ 250,00)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Plano Escolhido *</label>
                    <select
                      value={plano}
                      onChange={(e) => setPlano(e.target.value as Plano)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] font-semibold text-[#2d5a32]"
                    >
                      <option value="Vos Essencial">Vos Essencial (105%)</option>
                      <option value="Vos Pulse">Vos Pulse (125%)</option>
                      <option value="Vos 360">Vos 360 (135%)</option>
                      <option value="Vos Starter">Vos Starter (Fixo R$ 129,90)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fator de Ajuste (Negociação)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="2.0"
                      value={fatorAjuste}
                      onChange={(e) => setFatorAjuste(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] font-mono"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { label: 'Padrão (1.0)', val: 1.0 },
                        { label: '-10% (0.90)', val: 0.90 },
                        { label: '-5% (0.95)', val: 0.95 },
                        { label: '+5% (1.05)', val: 1.05 },
                        { label: '+10% (1.10)', val: 1.10 },
                      ].map((f) => (
                        <button
                          key={f.val}
                          type="button"
                          onClick={() => setFatorAjuste(f.val)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition-colors ${
                            numFator === f.val
                              ? 'bg-[#2d5a32] text-white border-[#2d5a32]'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CNPJ (Opcional)</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Síndico Responsável</label>
                    <input
                      type="text"
                      placeholder="Nome do Síndico"
                      value={sindico}
                      onChange={(e) => setSindico(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Orçamento no Kanban</span>
                </button>
              </form>
            </div>

            {/* Live Pricing Breakdown Motor */}
            <div className="lg:col-span-6 bg-[#1c3220] text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between border border-[#2d5a32]">
              <div>
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    <h3 className="text-base font-bold text-emerald-50">1.2 Motor de Cálculo da Mensalidade</h3>
                  </div>
                  <span className="bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest font-bold">
                    Equação do Valor
                  </span>
                </div>

                {/* Main Result Display */}
                <div className="bg-[#122215] p-5 rounded-xl border border-emerald-700/50 mb-5 shadow-inner text-center">
                  <span className="text-xs text-emerald-300 uppercase tracking-widest font-semibold">Valor Final Estimado</span>
                  <div className="text-4xl font-black text-emerald-300 my-1 tracking-tight">
                    {formatarMoeda(calcResult.valorFinal)} <span className="text-sm font-normal text-emerald-100">/mês</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 italic">
                    Plano {plano} • {numUnidades} unidades • Complexidade {complexidade} • Fator {numFator}
                  </p>
                </div>

                {/* Sequential Step Breakdown */}
                <div className="space-y-2.5 text-xs">
                  {/* Step A */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#244528]/80 border border-emerald-700/40">
                    <div>
                      <span className="text-emerald-300 font-bold">Passo A (Por Unidade):</span>
                      <p className="text-[11px] text-emerald-100/80">{numUnidades} un x {formatarMoeda(calcResult.taxaPorUnidade)}/un</p>
                    </div>
                    <span className="font-mono font-bold text-white">{formatarMoeda(calcResult.passoA)}</span>
                  </div>

                  {/* Step B */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#244528]/80 border border-emerald-700/40">
                    <div>
                      <span className="text-emerald-300 font-bold">Passo B (Complexidade):</span>
                      <p className="text-[11px] text-emerald-100/80">
                        {formatarMoeda(calcResult.passoA)} + Taxa {complexidade} ({formatarMoeda(calcResult.taxaComplexidade)})
                      </p>
                    </div>
                    <span className="font-mono font-bold text-white">{formatarMoeda(calcResult.passoB)}</span>
                  </div>

                  {/* Step C */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#244528]/80 border border-emerald-700/40">
                    <div>
                      <span className="text-emerald-300 font-bold">Passo C (Multiplicador do Plano):</span>
                      <p className="text-[11px] text-emerald-100/80">
                        {plano === 'Vos Starter' ? 'Plano Starter (Valor Fixo R$ 129,90)' : `${formatarMoeda(calcResult.passoB)} x ${(calcResult.multiplicadorPlano * 100).toFixed(0)}% (${plano})`}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-white">{formatarMoeda(calcResult.subtotalPlano)}</span>
                  </div>

                  {/* Step D / Fator */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#244528]/80 border border-emerald-700/40">
                    <div>
                      <span className="text-emerald-300 font-bold">Passo D (Fator de Ajuste):</span>
                      <p className="text-[11px] text-emerald-100/80">
                        Multiplicador de negociação: {calcResult.fatorAjuste} ({numFator < 1 ? `Desconto de ${((1 - numFator) * 100).toFixed(0)}%` : numFator > 1 ? `Acréscimo de ${((numFator - 1) * 100).toFixed(0)}%` : 'Sem ajuste'})
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-300">{formatarMoeda(calcResult.valorFinal)}</span>
                  </div>
                </div>
              </div>

              {/* Compare Plans Matrix */}
              <div className="mt-6 border-t border-emerald-800/80 pt-4">
                <span className="block text-[11px] font-bold text-emerald-300 mb-2 uppercase tracking-wider">
                  Simulação Comparativa dos 4 Planos (Clique para Selecionar)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  {comparativoPlanos.map((item) => (
                    <div
                      key={item.nome}
                      onClick={() => setPlano(item.nome as Plano)}
                      className={`p-2 rounded-lg cursor-pointer transition-all border ${
                        plano === item.nome
                          ? 'bg-emerald-600 border-white text-white font-bold ring-2 ring-emerald-300/40 shadow-md'
                          : 'bg-[#122215] border-emerald-800/60 text-emerald-200 hover:bg-[#1a331f]'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-semibold">{item.nome}</span>
                      <span className="text-xs font-black font-mono">{formatarMoeda(item.calc.valorFinal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: 1.4 Visualização Kanban */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1c3220]">1.4 Funil Comercial (Kanban de Orçamentos)</h3>
                <p className="text-xs text-slate-500">Gerencie a transição das negociações do orçamento até o contrato finalizado</p>
              </div>
              <span className="text-xs font-bold text-[#2d5a32] bg-[#e8f0e6] px-3 py-1 rounded-full border border-[#2d5a32]/20">
                Total Oportunidades: {condominios.length}
              </span>
            </div>

            {/* Kanban Stages as Horizontal Rows */}
            <div className="space-y-6">
              
              {/* Row 1: Orçamentos / Cotação */}
              <div className="bg-[#f2f5f1] p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0"></span>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">1. Orçamentos & Cotações</h4>
                  </div>
                  <span className="bg-amber-100 text-amber-800 font-bold px-3 py-0.5 rounded-full text-xs text-center">
                    {orcamentos.length} {orcamentos.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {orcamentos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum orçamento nesta fase</p>
                ) : (
                  <div className="space-y-2">
                    {orcamentos.map((item) => (
                      <div key={item.id} className="bg-white p-3 sm:px-4 sm:py-3 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Condominium info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{item.id}</span>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-slate-900 text-sm truncate">{item.nome}</h5>
                            <p className="text-xs text-slate-500">{item.unidades} un • Complexidade {item.complexidade}</p>
                          </div>
                        </div>

                        {/* Plan & Pricing & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <span className="bg-[#e8f0e6] text-[#2d5a32] text-[10px] font-bold px-2.5 py-1 rounded-full text-center shrink-0">
                            {item.plano}
                          </span>
                          <span className="font-bold text-emerald-800 font-mono text-xs sm:text-sm shrink-0 min-w-[90px] text-right">
                            {formatarMoeda(item.mensalidadeCalculada)}/mês
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setSelectedCondoForDoc(item)}
                              title="Gerar Carta Proposta e Contrato PDF"
                              className="px-2.5 py-1.5 bg-[#1c3220] hover:bg-[#2d5a32] text-white rounded-lg text-[11px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                              <span className="text-center">Proposta</span>
                            </button>
                            <button
                              onClick={() => handleMoverStatus(item.id, 'Em transição')}
                              title="Avançar para Em Transição"
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoverStatus(item.id, 'Perdido')}
                              title="Marcar como Perdido"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 2: Em Transição */}
              <div className="bg-[#f2f5f1] p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0"></span>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">2. Em Transição (Aprovação)</h4>
                  </div>
                  <span className="bg-blue-100 text-blue-800 font-bold px-3 py-0.5 rounded-full text-xs text-center">
                    {emTransicao.length} {emTransicao.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {emTransicao.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum cliente em transição</p>
                ) : (
                  <div className="space-y-2">
                    {emTransicao.map((item) => (
                      <div key={item.id} className="bg-white p-3 sm:px-4 sm:py-3 rounded-xl border border-blue-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Condominium info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{item.id}</span>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-slate-900 text-sm truncate">{item.nome}</h5>
                            <p className="text-xs text-slate-500">{item.unidades} un • Síndico: {item.sindicoResponsavel}</p>
                          </div>
                        </div>

                        {/* Plan & Pricing & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full text-center shrink-0">
                            {item.plano}
                          </span>
                          <span className="font-bold text-emerald-800 font-mono text-xs sm:text-sm shrink-0 min-w-[90px] text-right">
                            {formatarMoeda(item.mensalidadeCalculada)}/mês
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setSelectedCondoForDoc(item)}
                              title="Visualizar Contrato em PDF"
                              className="px-2.5 py-1.5 bg-[#1c3220] hover:bg-[#2d5a32] text-white rounded-lg text-[11px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                              <span className="text-center">Ver Contrato</span>
                            </button>
                            <button
                              onClick={() => handleMoverStatus(item.id, 'Cliente Fidelizado')}
                              title="Aprovar e Tornar Cliente Fidelizado"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold text-xs inline-flex items-center justify-center text-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-center">Fechar</span>
                            </button>
                            <button
                              onClick={() => handleMoverStatus(item.id, 'Perdido')}
                              title="Marcar como Perdido"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: Finalizados / Clientes Fidelizados */}
              <div className="bg-[#f2f5f1] p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 shrink-0"></span>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">3. Finalizados / Clientes</h4>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-0.5 rounded-full text-xs text-center">
                    {finalizados.length} {finalizados.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {syncNotice && (
                  <div className="bg-emerald-800 text-emerald-100 p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span>{syncNotice}</span>
                    </div>
                    <button onClick={() => setSyncNotice(null)} className="p-1 text-emerald-300 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {finalizados.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum contrato finalizado ainda</p>
                ) : (
                  <div className="space-y-2">
                    {finalizados.map((item) => (
                      <div key={item.id} className="bg-white p-3 sm:px-4 sm:py-3 rounded-xl border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Condominium info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => setEditingIdCondo({ id: item.id, newId: item.id })}
                            title="Clique para editar/personalizar o ID do Condomínio"
                            className="bg-slate-900 hover:bg-slate-800 text-emerald-300 font-mono text-[11px] px-2.5 py-1 rounded-lg font-bold shrink-0 flex items-center gap-1 transition-colors border border-slate-700"
                          >
                            <span>{item.id}</span>
                            <Edit3 className="w-3 h-3 text-slate-400" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-slate-900 text-sm truncate">{item.nome}</h5>
                            <p className="text-xs text-slate-500">{item.unidades} un • CNPJ: {item.cnpj}</p>
                          </div>
                        </div>

                        {/* Plan & Pricing & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <span className="bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full text-center shrink-0">
                            {item.plano}
                          </span>
                          <span className="font-bold text-[#2d5a32] font-mono text-xs sm:text-sm shrink-0 min-w-[90px] text-right">
                            {formatarMoeda(item.mensalidadeCalculada)}/mês
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setSyncNotice(`Condomínio [${item.id}] ${item.nome} está vinculado! Acesse a aba "ERP -> 2.1 Perfil Completo" para puxar e visualizar os dados.`);
                              }}
                              title="Disponibilizar e puxar dados no Bloco 2 (Perfil Completo do Cliente)"
                              className="px-2.5 py-1.5 bg-[#e8f0e6] hover:bg-emerald-200 text-[#2d5a32] rounded-lg text-[11px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors border border-[#2d5a32]/20"
                            >
                              <Building2 className="w-3.5 h-3.5 text-[#2d5a32] shrink-0" />
                              <span className="text-center">Puxar p/ Bloco 2</span>
                            </button>
                            <button
                              onClick={() => setSelectedCondoForDoc(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="text-center">Acessar Doc</span>
                            </button>
                            <button
                              onClick={() => handleMoverStatus(item.id, 'Perdido')}
                              title="Marcar como Perdido"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 4: Perdidos */}
              <div className="bg-[#f2f5f1] p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0"></span>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">4. Perdidos</h4>
                  </div>
                  <span className="bg-rose-100 text-rose-800 font-bold px-3 py-0.5 rounded-full text-xs text-center">
                    {perdidos.length} {perdidos.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {perdidos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum orçamento perdido</p>
                ) : (
                  <div className="space-y-2">
                    {perdidos.map((item) => (
                      <div key={item.id} className="bg-white p-3 sm:px-4 sm:py-3 rounded-xl border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Condominium info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{item.id}</span>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-slate-900 text-sm truncate">{item.nome}</h5>
                            <p className="text-xs text-slate-500">{item.unidades} un • Complexidade {item.complexidade}</p>
                          </div>
                        </div>

                        {/* Plan & Pricing & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-full text-center shrink-0">
                            {item.plano}
                          </span>
                          <span className="font-bold text-slate-400 line-through font-mono text-xs sm:text-sm shrink-0 min-w-[90px] text-right">
                            {formatarMoeda(item.mensalidadeCalculada)}/mês
                          </span>
                          <button
                            onClick={() => handleMoverStatus(item.id, 'Cotação')}
                            title="Reabrir Orçamento no Kanban"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors shrink-0 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span className="text-center">Reabrir</span>
                          </button>
                          <button
                            onClick={() => handleMoverExcluido(item.id, item.nome)}
                            title="Excluir Lead (Mover para Leads Excluídos)"
                            className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                            <span className="text-center">Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 5: Leads Excluídos */}
              <div className="bg-[#f8faf6] p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0">
                      <Trash2 className="w-2.5 h-2.5" />
                    </span>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-700">5. Leads Excluídos</h4>
                  </div>
                  <span className="bg-slate-200 text-slate-700 font-bold px-3 py-0.5 rounded-full text-xs text-center">
                    {excluidos.length} {excluidos.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {excluidos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum lead excluído no momento</p>
                ) : (
                  <div className="space-y-2">
                    {excluidos.map((item) => (
                      <div key={item.id} className="bg-slate-50 p-3 sm:px-4 sm:py-3 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 opacity-90">
                        {/* Condominium info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{item.id}</span>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-slate-700 text-sm truncate line-through">{item.nome}</h5>
                            <p className="text-xs text-slate-400">{item.unidades} un • Lead Excluído</p>
                          </div>
                        </div>

                        {/* Plan & Pricing & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 shrink-0">
                          <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full text-center shrink-0">
                            {item.plano}
                          </span>
                          <span className="font-bold text-slate-400 line-through font-mono text-xs sm:text-sm shrink-0 min-w-[80px] text-right">
                            {formatarMoeda(item.mensalidadeCalculada)}/mês
                          </span>
                          <button
                            onClick={() => {
                              handleMoverStatus(item.id, 'Perdido');
                              setSyncNotice(`Lead "${item.nome}" foi restaurado para a lista de Perdidos.`);
                            }}
                            title="Restaurar Lead para Perdidos"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors shrink-0 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-white shrink-0" />
                            <span className="text-center">Restaurar</span>
                          </button>
                          <button
                            onClick={() => handleExcluirDefinitivoPrompt(item.id, item.nome)}
                            title="Excluir Definitivamente"
                            className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="text-center">Definitivo</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}

      {/* SubTab 2: 1.3 Tabela de Serviços Extras */}
      {subTab === 'extras' && (
        <div className="space-y-8">
          {/* Reference Catalog Table Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#1c3220]">Catálogo de Referência de Preços Base</h3>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full hidden md:inline-block">
                    Sincronizado c/ Carta Proposta
                  </span>
                </div>
                <p className="text-xs text-slate-500">Valores de referência da tabela homologada para consultas e Gerador de Documentos Oficiais</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-[#e8f0e6] text-[#2d5a32] font-bold text-[11px] px-2.5 py-1 rounded-md border border-[#2d5a32]/20 hidden sm:inline-block">
                  Tabela Base 2026
                </span>
                <button
                  onClick={handleOpenAddServicoBase}
                  className="px-3 py-1.5 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Serviço Base</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicosExtras.map((se) => (
                <div key={se.id} className="p-4 rounded-xl border border-slate-200 bg-[#fafbfc] space-y-3 text-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="bg-[#e8f0e6] text-[#2d5a32] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {se.categoria}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{se.id}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{se.nome}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">{se.descricao}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[11px] text-slate-500">Tarifa Ref.:</span>
                      <span className="font-bold text-[#2d5a32]">
                        {se.valorUnitario > 0 ? `${formatarMoeda(se.valorUnitario)} / ${se.unidade}` : 'Sob Orçamento'}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEditServicoBase(se)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#2d5a32] border border-slate-200 hover:border-emerald-300 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Alterar Valor / Dados do Serviço"
                      >
                        <Edit3 className="w-3 h-3 text-[#2d5a32]" />
                        <span>Editar Valor</span>
                      </button>
                      <button
                        onClick={() => setServicoBaseParaExcluir(se)}
                        className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-md transition-colors cursor-pointer"
                        title="Remover Serviço do Catálogo Base"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Card: Lista de Serviços Prestados */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2d5a32]" />
                  <h2 className="text-xl font-bold text-[#1c3220]">1.3 Tabela de Serviços Extras Prestados</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Registro e controle de lançamentos de serviços avulsos e horas técnicas faturadas
                </p>
              </div>

              <button
                onClick={() => setModalNovoServico(true)}
                className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Lançar Novo Serviço Prestado</span>
              </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Faturado (Extras)
                </span>
                <span className="text-2xl font-black text-[#2d5a32] font-mono">
                  {formatarMoeda(totalValorGeral)}
                </span>
              </div>
              <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Horas Trabalhadas
                </span>
                <span className="text-2xl font-black text-slate-800 font-mono">
                  {totalHorasGerais} h
                </span>
              </div>
              <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total de Atendimentos
                </span>
                <span className="text-2xl font-black text-slate-800 font-mono">
                  {servicosPrestados.length} lançamentos
                </span>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f8faf6] p-3 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, CNPJ ou serviço..."
                  value={buscaServico}
                  onChange={(e) => setBuscaServico(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Exibindo {servicosFiltrados.length} de {servicosPrestados.length} registros
              </span>
            </div>

            {/* MAIN DATA TABLE: SERVIÇOS PRESTADOS */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1c3220] text-emerald-100 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">DATA</th>
                    <th className="p-3.5 whitespace-nowrap">CNPJ CLIENTE</th>
                    <th className="p-3.5 whitespace-nowrap">NOME</th>
                    <th className="p-3.5 whitespace-nowrap">SERVIÇO</th>
                    <th className="p-3.5 whitespace-nowrap text-center">HORAS TRABALHADAS</th>
                    <th className="p-3.5 whitespace-nowrap text-right">VALOR</th>
                    <th className="p-3.5 min-w-[220px]">OBSERVAÇÃO</th>
                    <th className="p-3.5 text-center whitespace-nowrap">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {servicosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Nenhum serviço prestado encontrado com os termos pesquisados.
                      </td>
                    </tr>
                  ) : (
                    servicosFiltrados.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8faf6] transition-colors">
                        {/* 0. Data */}
                        <td className="p-3.5 font-mono text-slate-700 font-bold whitespace-nowrap">
                          {item.data ? new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                        </td>

                        {/* 1. CNPJ Cliente */}
                        <td className="p-3.5 font-mono text-slate-600 font-medium whitespace-nowrap">
                          {item.cnpjCliente}
                        </td>

                        {/* 2. Nome */}
                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {item.nomeCliente}
                        </td>

                        {/* 3. Serviço */}
                        <td className="p-3.5">
                          <span className="bg-emerald-50 text-emerald-900 font-semibold px-2.5 py-1 rounded-md border border-emerald-200 text-[11px] inline-block">
                            {item.servico}
                          </span>
                        </td>

                        {/* 4. Horas Trabalhadas */}
                        <td className="p-3.5 text-center font-bold text-slate-800 font-mono whitespace-nowrap">
                          {item.horasTrabalhadas} h
                        </td>

                        {/* 5. Valor */}
                        <td className="p-3.5 text-right font-black text-emerald-800 font-mono text-sm whitespace-nowrap">
                          {formatarMoeda(item.valor)}
                        </td>

                        {/* 6. OBSERVAÇÃO */}
                        <td className="p-3.5 text-slate-600 text-[11px] leading-relaxed">
                          {item.observacao}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleExcluirServicoPrestado(item.id)}
                            title="Excluir Lançamento"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lançar Novo Serviço Prestado */}
      {modalNovoServico && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2d5a32]" />
                <h3 className="text-base font-bold text-slate-900">Lançar Novo Serviço Prestado</h3>
              </div>
              <button
                onClick={() => setModalNovoServico(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarServicoPrestado} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Selecionar Cliente Existente (Opcional)</label>
                  <select
                    onChange={(e) => handleSelectCondoParaServico(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800"
                  >
                    <option value="">-- Preencher CNPJ e Nome --</option>
                    {condominios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.cnpj})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNPJ Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678/0001-90"
                    value={novoCnpj}
                    onChange={(e) => setNovoCnpj(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Residencial Batel Plaza"
                    value={novoNomeCliente}
                    onChange={(e) => setNovoNomeCliente(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vistoria Técnica de Engenharia"
                  value={novoServico}
                  onChange={(e) => setNovoServico(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horas Trabalhadas *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    placeholder="Ex: 4.0"
                    value={novasHoras}
                    onChange={(e) => setNovasHoras(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Ex: 680.00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">OBSERVAÇÃO *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva detalhes ou observações adicionais..."
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNovoServico(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl font-bold transition-colors shadow-sm"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Document Generator */}
      {selectedCondoForDoc && (
        <ProposalModal
          condominio={selectedCondoForDoc}
          servicosExtras={servicosExtras}
          onClose={() => setSelectedCondoForDoc(null)}
        />
      )}

      {/* Modal to Edit Condominium ID */}
      {editingIdCondo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#1c3220]">
                <Edit3 className="w-5 h-5 text-[#2d5a32]" />
                <h3 className="font-bold text-sm">Personalizar ID do Condomínio</h3>
              </div>
              <button
                onClick={() => setEditingIdCondo(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedId} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ID Atual: <span className="font-mono text-emerald-800 font-black">{editingIdCondo.id}</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Defina o ID do condomínio que será utilizado para vincular e puxar todos os dados no Bloco 2 (Perfil Completo do Cliente).
                </p>
                <label className="block font-bold text-slate-700 mb-1">Novo ID do Condomínio *</label>
                <input
                  type="text"
                  required
                  value={editingIdCondo.newId}
                  onChange={(e) => setEditingIdCondo({ ...editingIdCondo, newId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  placeholder="Ex: COND-2026-BATEL"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingIdCondo(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs"
                >
                  Salvar Novo ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Move to Excluidos */}
      {leadParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Lead?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deseja mover <strong className="text-slate-800">"{leadParaExcluir.nome}"</strong> para a lista de Leads Excluídos? Você poderá restaurá-lo a qualquer momento.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setLeadParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarMoverExcluido}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Excluir Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Permanent Exclusion */}
      {leadParaExcluirDefinitivo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Definitivamente?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Atenção: Tem certeza que deseja apagar permanentemente o lead <strong className="text-slate-800">"{leadParaExcluirDefinitivo.nome}"</strong>? Esta ação removerá totalmente os dados do sistema e não poderá ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setLeadParaExcluirDefinitivo(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoDefinitiva}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Novo Serviço Base */}
      {modalNovoServicoBase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#1c3220]">
                <Plus className="w-5 h-5 text-[#2d5a32]" />
                <h3 className="font-bold text-base">Cadastrar Serviço no Catálogo Base</h3>
              </div>
              <button
                onClick={() => setModalNovoServicoBase(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNovoServicoBase} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Serviço / Rubrica *</label>
                <input
                  type="text"
                  required
                  value={servicoBaseNome}
                  onChange={(e) => setServicoBaseNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  placeholder="Ex: Auditoria Contábil de Transição"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={servicoBaseCategoria}
                    onChange={(e) => setServicoBaseCategoria(e.target.value as ServicoExtra['categoria'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="Administrativa">Administrativa</option>
                    <option value="Engenharia">Engenharia</option>
                    <option value="Compras">Compras</option>
                    <option value="Assembleia">Assembleia</option>
                    <option value="Laudo">Laudo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Ref. (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={servicoBaseValor}
                    onChange={(e) => setServicoBaseValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                    placeholder="0.00"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Use 0 para 'Sob Orçamento'</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade *</label>
                  <select
                    value={servicoBaseUnidade}
                    onChange={(e) => setServicoBaseUnidade(e.target.value as ServicoExtra['unidade'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="hora">Hora</option>
                    <option value="evento">Evento</option>
                    <option value="processo">Processo</option>
                    <option value="sob_consulta">Sob Consulta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Curta *</label>
                <textarea
                  required
                  rows={2}
                  value={servicoBaseDescricao}
                  onChange={(e) => setServicoBaseDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  placeholder="Descrição do serviço exibida na Carta Proposta..."
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Sincronização Automática:
                </span>
                <p>
                  Ao cadastrar este serviço, ele será automaticamente incluído no catálogo e exibido no Gerador de Documentos Oficiais (Carta Proposta).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalNovoServicoBase(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar Serviço Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Valor / Dados do Serviço Base */}
      {editingServicoBase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#1c3220]">
                <Edit3 className="w-5 h-5 text-[#2d5a32]" />
                <h3 className="font-bold text-base">Alterar Valor / Dados do Serviço Base</h3>
              </div>
              <button
                onClick={() => setEditingServicoBase(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditServicoBase} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Serviço / Rubrica *</label>
                <input
                  type="text"
                  required
                  value={servicoBaseNome}
                  onChange={(e) => setServicoBaseNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={servicoBaseCategoria}
                    onChange={(e) => setServicoBaseCategoria(e.target.value as ServicoExtra['categoria'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="Administrativa">Administrativa</option>
                    <option value="Engenharia">Engenharia</option>
                    <option value="Compras">Compras</option>
                    <option value="Assembleia">Assembleia</option>
                    <option value="Laudo">Laudo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Ref. (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={servicoBaseValor}
                    onChange={(e) => setServicoBaseValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Use 0 para 'Sob Orçamento'</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade *</label>
                  <select
                    value={servicoBaseUnidade}
                    onChange={(e) => setServicoBaseUnidade(e.target.value as ServicoExtra['unidade'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="hora">Hora</option>
                    <option value="evento">Evento</option>
                    <option value="processo">Processo</option>
                    <option value="sob_consulta">Sob Consulta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Curta *</label>
                <textarea
                  required
                  rows={2}
                  value={servicoBaseDescricao}
                  onChange={(e) => setServicoBaseDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Atualização em Tempo Real:
                </span>
                <p>
                  Ao salvar, este novo valor/dados será atualizado imediatamente na tabela de Carta Proposta no Gerador de Documentos Oficiais.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingServicoBase(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Atualizar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Exclusion of Base Service */}
      {servicoBaseParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Remover Serviço Base?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tem certeza que deseja remover o serviço <strong className="text-slate-800">"{servicoBaseParaExcluir.nome}"</strong> do Catálogo Base?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setServicoBaseParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteServicoBase}
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
