import React, { useState, useEffect } from 'react';
import { Condominio, StatusFunil, Complexidade, Plano, RegistroHistoricoCaixa, TemplateRelatorio } from '../../types';
import { calcularSaudeCondominio, formatarMoeda, calcularMensalidade } from '../../utils/pricingEngine';
import { X, Save, Eye, EyeOff, ShieldCheck, Activity, Building, Landmark, DollarSign, Clock, MessageSquare, Target, RefreshCw, History, Plus, Trash2, Maximize2, FileText, Check, Copy, Settings } from 'lucide-react';
import TemplatesRelatorioModal from './TemplatesRelatorioModal';

interface CondominioModalProps {
  condominio?: Condominio | null;
  allCondominios?: Condominio[];
  onSave: (condo: Condominio) => void;
  onClose: () => void;
}

export const CondominioModal: React.FC<CondominioModalProps> = ({ condominio, allCondominios = [], onSave, onClose }) => {
  const [idCustom, setIdCustom] = useState(condominio?.id || '');
  const [nome, setNome] = useState(condominio?.nome || '');
  const [status, setStatus] = useState<StatusFunil>(condominio?.status || 'Cliente Fidelizado');
  const [cnpj, setCnpj] = useState(condominio?.cnpj || '');
  const [unidades, setUnidades] = useState<number>(condominio?.unidades || 20);
  const [endereco, setEndereco] = useState(condominio?.endereco || '');
  const [sindico, setSindico] = useState(condominio?.sindicoResponsavel || '');
  const [email, setEmail] = useState(condominio?.emailCondominio || '');
  const [telefone, setTelefone] = useState(condominio?.numeroCondominio || '');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const [livreCaixa, setLivreCaixa] = useState<number>(condominio?.livreCaixa || 10000);
  const [fundoObras, setFundoObras] = useState<number>(condominio?.fundoObras || 5000);
  const [fundoPintura, setFundoPintura] = useState<number>(condominio?.fundoPintura || 2000);
  const [fundoReforma, setFundoReforma] = useState<number>(condominio?.fundoReforma || 1000);
  const [gastoMedio, setGastoMedio] = useState<number>(condominio?.gastoMedioMensal || 8000);
  const [rendimentoMedio, setRendimentoMedio] = useState<number>(condominio?.rendimentoMedioMensal || 9500);

  const [anotacoes, setAnotacoes] = useState<string>(condominio?.anotacoes || '');
  const [modalAnotacoesAberto, setModalAnotacoesAberto] = useState(false);
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);

  const obterDataHoraAtual = () => {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [dataUltimaAlteracaoCaixa, setDataUltimaAlteracaoCaixa] = useState<string>(
    condominio?.dataUltimaAlteracaoCaixa || obterDataHoraAtual()
  );

  const [fraseLivreCaixa, setFraseLivreCaixa] = useState<string>(
    condominio?.fraseLivreCaixa || 'Suficiente para cobertura de despesas operacionais correntes.'
  );
  const [fraseFundoObras, setFraseFundoObras] = useState<string>(
    condominio?.fraseFundoObras || 'Reserva prioritária para melhorias de infraestrutura.'
  );
  const [fraseFundoPintura, setFraseFundoPintura] = useState<string>(
    condominio?.fraseFundoPintura || 'Fundo em aberto para revitalização de fachada.'
  );
  const [fraseFundoReforma, setFraseFundoReforma] = useState<string>(
    condominio?.fraseFundoReforma || 'Reserva destinada a grandes intervenções prediais.'
  );

  const [metaLivreCaixaCustom, setMetaLivreCaixaCustom] = useState<number>(
    condominio?.metaLivreCaixaCustom || 0
  );
  const [metaFundoObrasCustom, setMetaFundoObrasCustom] = useState<number>(
    condominio?.metaFundoObrasCustom || 0
  );
  const [metaFundoPinturaCustom, setMetaFundoPinturaCustom] = useState<number>(
    condominio?.metaFundoPinturaCustom || 0
  );

  const [historicoCaixa, setHistoricoCaixa] = useState<RegistroHistoricoCaixa[]>(() => {
    if (condominio?.historicoCaixa && condominio.historicoCaixa.length > 0) {
      return condominio.historicoCaixa.slice(0, 5);
    }
    const dataRef = condominio?.dataUltimaAlteracaoCaixa || obterDataHoraAtual();
    const lc = condominio?.livreCaixa !== undefined ? condominio.livreCaixa : 10000;
    const fo = condominio?.fundoObras !== undefined ? condominio.fundoObras : 5000;
    const fp = condominio?.fundoPintura !== undefined ? condominio.fundoPintura : 2000;
    const fr = condominio?.fundoReforma !== undefined ? condominio.fundoReforma : 1000;
    return [{
      id: `HIST-INIT-${Date.now()}`,
      dataHora: dataRef,
      livreCaixa: lc,
      fundoObras: fo,
      fundoPintura: fp,
      fundoReforma: fr,
      totalReservas: lc + fo + fp + fr,
      saudeScore: condominio?.saudeScore || 7,
      observacao: 'Registro inicial do condomínio'
    }];
  });

  const [templatesRelatorio, setTemplatesRelatorio] = useState<TemplateRelatorio | undefined>(
    condominio?.templatesRelatorio
  );
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  const registrarSnapshotHistorico = (dataCustomizada?: string, obsCustomizada?: string) => {
    const dataRef = dataCustomizada || dataUltimaAlteracaoCaixa || obterDataHoraAtual();
    const totalRes = Number(livreCaixa) + Number(fundoObras) + Number(fundoPintura) + Number(fundoReforma);
    const novoRegistro: RegistroHistoricoCaixa = {
      id: `HIST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dataHora: dataRef,
      livreCaixa: Number(livreCaixa),
      fundoObras: Number(fundoObras),
      fundoPintura: Number(fundoPintura),
      fundoReforma: Number(fundoReforma),
      totalReservas: totalRes,
      saudeScore: saude.score,
      observacao: obsCustomizada || 'Atualização manual do caixa'
    };

    setHistoricoCaixa((prev) => {
      const filtrados = prev.filter((item) => item.dataHora !== dataRef);
      return [novoRegistro, ...filtrados].slice(0, 5);
    });
  };

  const marcarAlteracaoCaixa = () => {
    const novaData = obterDataHoraAtual();
    setDataUltimaAlteracaoCaixa(novaData);
    registrarSnapshotHistorico(novaData, 'Atualização com timestamp de agora');
  };

  const handlePuxarDadosCrm = (idSelecionado: string) => {
    if (!idSelecionado) return;
    const item = allCondominios.find((c) => c.id === idSelecionado);
    if (item) {
      setIdCustom(item.id);
      setNome(item.nome);
      setStatus(item.status);
      setCnpj(item.cnpj);
      setUnidades(item.unidades);
      setEndereco(item.endereco);
      setSindico(item.sindicoResponsavel);
      setEmail(item.emailCondominio);
      setTelefone(item.numeroCondominio);
      setComplexidade(item.complexidade);
      setPlano(item.plano);
      setFatorAjuste(item.fatorAjuste);
      if (item.banco) setBanco(item.banco);
      if (item.agenciaEConta) setAgenciaEConta(item.agenciaEConta);
      if (item.senhaBanco) setSenhaBanco(item.senhaBanco);
      if (item.livreCaixa !== undefined) setLivreCaixa(item.livreCaixa);
      if (item.fundoObras !== undefined) setFundoObras(item.fundoObras);
      if (item.fundoPintura !== undefined) setFundoPintura(item.fundoPintura);
      if (item.fundoReforma !== undefined) setFundoReforma(item.fundoReforma);
      if (item.gastoMedioMensal !== undefined) setGastoMedio(item.gastoMedioMensal);
      if (item.rendimentoMedioMensal !== undefined) setRendimentoMedio(item.rendimentoMedioMensal);
      if (item.dataUltimaAlteracaoCaixa) setDataUltimaAlteracaoCaixa(item.dataUltimaAlteracaoCaixa);
      if (item.fraseLivreCaixa) setFraseLivreCaixa(item.fraseLivreCaixa);
      if (item.fraseFundoObras) setFraseFundoObras(item.fraseFundoObras);
      if (item.fraseFundoPintura) setFraseFundoPintura(item.fraseFundoPintura);
      if (item.fraseFundoReforma) setFraseFundoReforma(item.fraseFundoReforma);
      if (item.metaLivreCaixaCustom !== undefined) setMetaLivreCaixaCustom(item.metaLivreCaixaCustom);
      if (item.metaFundoObrasCustom !== undefined) setMetaFundoObrasCustom(item.metaFundoObrasCustom);
      if (item.metaFundoPinturaCustom !== undefined) setMetaFundoPinturaCustom(item.metaFundoPinturaCustom);
      if (item.anotacoes !== undefined) setAnotacoes(item.anotacoes);

      if (item.templatesRelatorio) {
        setTemplatesRelatorio(item.templatesRelatorio);
      }

      setImportMessage(`✓ Dados do ID [${item.id}] - ${item.nome} puxados com sucesso do CRM!`);
    }
  };
  
  const [banco, setBanco] = useState(condominio?.banco || 'Itaú');
  const [agenciaEConta, setAgenciaEConta] = useState(condominio?.agenciaEConta || '');
  const [senhaBanco, setSenhaBanco] = useState(condominio?.senhaBanco || '');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [complexidade, setComplexidade] = useState<Complexidade>(condominio?.complexidade || 'Tranquilo');
  const [plano, setPlano] = useState<Plano>(condominio?.plano || 'Vos 360');
  const [fatorAjuste, setFatorAjuste] = useState<number>(condominio?.fatorAjuste || 1.0);

  const saude = calcularSaudeCondominio(
    livreCaixa,
    fundoObras,
    fundoPintura,
    fundoReforma,
    gastoMedio
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const calcMensalidade = calcularMensalidade(unidades, complexidade, plano, fatorAjuste);

    let historicoAtualizado = [...historicoCaixa];
    const totRes = Number(livreCaixa) + Number(fundoObras) + Number(fundoPintura) + Number(fundoReforma);
    const dataRef = dataUltimaAlteracaoCaixa || obterDataHoraAtual();

    if (historicoAtualizado.length === 0 || historicoAtualizado[0].dataHora !== dataRef) {
      const snap: RegistroHistoricoCaixa = {
        id: `HIST-${Date.now()}`,
        dataHora: dataRef,
        livreCaixa: Number(livreCaixa),
        fundoObras: Number(fundoObras),
        fundoPintura: Number(fundoPintura),
        fundoReforma: Number(fundoReforma),
        totalReservas: totRes,
        saudeScore: saude.score,
        observacao: 'Salvo via formulário'
      };
      historicoAtualizado = [snap, ...historicoAtualizado.filter(h => h.dataHora !== dataRef)].slice(0, 5);
    }

    const updatedCondo: Condominio = {
      id: idCustom.trim() || condominio?.id || `COND-${Math.floor(100 + Math.random() * 900)}`,
      status,
      nome,
      cnpj: cnpj || '00.000.000/0001-00',
      unidades: Number(unidades),
      endereco,
      sindicoResponsavel: sindico,
      emailCondominio: email,
      numeroCondominio: telefone,
      banco,
      agenciaEConta,
      senhaBanco,
      complexidade,
      plano,
      fatorAjuste: Number(fatorAjuste),
      mensalidadeCalculada: calcMensalidade.valorFinal,
      livreCaixa: Number(livreCaixa),
      fundoObras: Number(fundoObras),
      fundoPintura: Number(fundoPintura),
      fundoReforma: Number(fundoReforma),
      gastoMedioMensal: Number(gastoMedio),
      rendimentoMedioMensal: Number(rendimentoMedio),
      saudeScore: saude.score,
      dataUltimaAlteracaoCaixa,
      fraseLivreCaixa,
      fraseFundoObras,
      fraseFundoPintura,
      fraseFundoReforma,
      metaLivreCaixaCustom,
      metaFundoObrasCustom,
      metaFundoPinturaCustom,
      anotacoes,
      historicoCaixa: historicoAtualizado,
      templatesRelatorio
    };

    onSave(updatedCondo);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="bg-[#1c3220] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">
              {condominio ? `Editar Perfil • ${condominio.nome}` : 'Cadastrar Novo Condomínio'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-800 text-emerald-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          {allCondominios.length > 0 && (
            <div className="bg-[#e8f0e6] p-3.5 rounded-xl border border-[#2d5a32]/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-bold text-[#1c3220] flex items-center gap-1.5 text-xs">
                  <Building className="w-4 h-4 text-[#2d5a32]" />
                  <span>Puxar / Importar Dados do CRM (Item Finalizado por ID):</span>
                </label>
                {importMessage && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full">
                    {importMessage}
                  </span>
                )}
              </div>
              <select
                onChange={(e) => handlePuxarDadosCrm(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 font-semibold text-[#1c3220] bg-white text-xs focus:ring-2 focus:ring-[#2d5a32]"
              >
                <option value="">-- Selecione o ID do Condomínio para auto-preencher do CRM --</option>
                {allCondominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.id}] {c.nome} ({c.status}) • {c.plano} • R$ {c.mensalidadeCalculada ? c.mensalidadeCalculada.toFixed(2) : '0.00'}/mês
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-bold text-[#1c3220] border-b pb-1 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-[#2d5a32]" />
              <span>1. Dados Cadastrais & Responsáveis</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold mb-1">ID do Condomínio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: COND-101"
                  value={idCustom}
                  onChange={(e) => setIdCustom(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold mb-1">Nome do Condomínio *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Status no Funil *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFunil)}
                  className="w-full p-2 border rounded-lg font-semibold text-[#2d5a32]"
                >
                  <option value="Cotação">Cotação</option>
                  <option value="Interessado">Interessado</option>
                  <option value="Em transição">Em transição</option>
                  <option value="Cliente Fidelizado">Cliente Fidelizado</option>
                  <option value="Perdido">Perdido</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Nº de Unidades</label>
                <input
                  type="number"
                  value={unidades}
                  onChange={(e) => setUnidades(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border rounded-lg font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Telefone do Condomínio</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="(41) 90000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Síndico Responsável</label>
                <input
                  type="text"
                  value={sindico}
                  onChange={(e) => setSindico(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block font-bold mb-1">Email do Condomínio</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="md:col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2d5a32]" />
                    <label className="text-xs font-bold text-slate-900">Anotações</label>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Espaço customizável do condomínio)
                    </span>
                    {anotacoes && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                        {anotacoes.length} caracteres
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAnotacoesAberto(true)}
                    className="text-[11px] font-bold text-[#2d5a32] bg-white hover:bg-[#e8f0e6] px-3 py-1.5 rounded-lg border border-[#2d5a32]/30 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    title="Abrir janela com mais espaço para detalhamento customizado"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Abrir em Nova Janela / Mais Espaço</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  placeholder="Espaço em branco para anotações personalizadas do condomínio (particularidades, regras, histórico de obras, acordos com o síndico, contatos úteis, instruções da portaria, etc.). Clique em 'Abrir em Nova Janela' para ter mais espaço de digitação e modelos rápidos."
                  className="w-full p-2.5 border rounded-lg text-xs text-slate-800 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#2d5a32] resize-y"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-[#1c3220] border-b pb-1 text-sm flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#2d5a32]" />
              <span>2. Dados Bancários & Segurança</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border">
              <div>
                <label className="block font-bold mb-1">Instituição Bancária</label>
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Ex: Itaú / Bradesco"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Agência e Conta</label>
                <input
                  type="text"
                  value={agenciaEConta}
                  onChange={(e) => setAgenciaEConta(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="Ag 0000 / CC 00000-0"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 flex items-center justify-between">
                  <span>Senha do Banco</span>
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    {mostrarSenha ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{mostrarSenha ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senhaBanco}
                  onChange={(e) => setSenhaBanco(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#2d5a32]" />
                <h4 className="font-bold text-[#1c3220] text-sm">
                  2.2 Termômetro de Saúde Financeira
                </h4>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs px-3 py-1 rounded-full text-white font-mono shadow-xs" style={{ backgroundColor: saude.cor }}>
                  Nota Geral: {saude.score}/10 • {saude.status}
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-[#2d5a32]" />
                <span className="font-bold">Data da Última Alteração do Caixa:</span>
                <input
                  type="text"
                  value={dataUltimaAlteracaoCaixa}
                  onChange={(e) => setDataUltimaAlteracaoCaixa(e.target.value)}
                  className="p-1.5 border rounded-lg font-mono font-bold text-slate-800 bg-slate-50 w-48 text-xs focus:ring-2 focus:ring-[#2d5a32]"
                  placeholder="DD/MM/AAAA HH:MM"
                />
              </div>
              <button
                type="button"
                onClick={marcarAlteracaoCaixa}
                className="text-[11px] font-bold text-[#2d5a32] hover:bg-[#e8f0e6] px-2.5 py-1 rounded-lg border border-[#2d5a32]/30 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Atualizar p/ Agora</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700 shadow-xs">
              <div className="flex flex-wrap justify-between items-center text-xs gap-2">
                <span>Saldo Total Reservas: <strong className="text-emerald-300 font-mono text-sm">{formatarMoeda(saude.saldoTotal)}</strong></span>
                <span>Proporção x Gasto Mensal: <strong className="text-emerald-300 font-mono text-sm">{saude.ratio.toFixed(1)}x</strong></span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden flex p-0.5 border border-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${saude.score * 10}%`, backgroundColor: saude.cor }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-300 italic">{saude.mensagem}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Gasto Médio Mensal do Condomínio *</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Base para Metas)</span>
                </label>
                <input
                  type="number"
                  value={gastoMedio}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 1;
                    setGastoMedio(v);
                    marcarAlteracaoCaixa();
                  }}
                  className="w-full p-2 border rounded-lg font-mono font-bold text-amber-800 bg-amber-50/50 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Rendimento Médio Mensal do Caixa
                </label>
                <input
                  type="number"
                  value={rendimentoMedio}
                  onChange={(e) => {
                    setRendimentoMedio(parseFloat(e.target.value) || 0);
                    marcarAlteracaoCaixa();
                  }}
                  className="w-full p-2 border rounded-lg font-mono text-emerald-800 bg-emerald-50/50 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#2d5a32]" />
                    <span>Livre Caixa</span>
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Valor Atual do Caixa (R$)</label>
                  <input
                    type="number"
                    value={livreCaixa}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setLivreCaixa(v);
                      marcarAlteracaoCaixa();
                    }}
                    className="w-full p-2 border rounded-lg font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Frase / Observação do Livre Caixa</span>
                  </label>
                  <input
                    type="text"
                    value={fraseLivreCaixa}
                    onChange={(e) => setFraseLivreCaixa(e.target.value)}
                    placeholder="Ex: Suficiente para despesas correntes do mês"
                    className="w-full p-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-700" />
                    <span>Fundo Obra</span>
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Valor Atual do Fundo (R$)</label>
                  <input
                    type="number"
                    value={fundoObras}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setFundoObras(v);
                      marcarAlteracaoCaixa();
                    }}
                    className="w-full p-2 border rounded-lg font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Frase / Observação do Fundo Obra</span>
                  </label>
                  <input
                    type="text"
                    value={fraseFundoObras}
                    onChange={(e) => setFraseFundoObras(e.target.value)}
                    placeholder="Ex: Reserva para obras de portaria e iluminação"
                    className="w-full p-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-purple-700" />
                    <span>Fundo Pintura</span>
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Valor Atual (R$)</label>
                  <input
                    type="number"
                    value={fundoPintura}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setFundoPintura(v);
                      marcarAlteracaoCaixa();
                    }}
                    className="w-full p-2 border rounded-lg font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Frase / Observação do Fundo Pintura</span>
                  </label>
                  <input
                    type="text"
                    value={fraseFundoPintura}
                    onChange={(e) => setFraseFundoPintura(e.target.value)}
                    placeholder="Ex: Fundo acumulativo para pintura da fachada"
                    className="w-full p-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Fundo Reforma</span>
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Valor Atual do Fundo (R$)</label>
                  <input
                    type="number"
                    value={fundoReforma}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setFundoReforma(v);
                      marcarAlteracaoCaixa();
                    }}
                    className="w-full p-2 border rounded-lg font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Frase / Observação do Fundo Reforma</span>
                  </label>
                  <input
                    type="text"
                    value={fraseFundoReforma}
                    onChange={(e) => setFraseFundoReforma(e.target.value)}
                    placeholder="Ex: Fundo para grandes intervenções prediais"
                    className="w-full p-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#2d5a32]" />
                  <span className="font-bold text-xs text-slate-900">
                    Histórico de Alterações do Caixa (Últimos {historicoCaixa.length}/5 Registros)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => registrarSnapshotHistorico(dataUltimaAlteracaoCaixa, 'Snapshot registrado manualmente')}
                  className="text-[11px] font-bold text-[#2d5a32] bg-[#e8f0e6] hover:bg-[#d5e5d3] px-2.5 py-1 rounded-lg border border-[#2d5a32]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gravar Estado Atual no Histórico</span>
                </button>
              </div>

              {historicoCaixa.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-2">
                  Nenhum registro no histórico.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2">#</th>
                        <th className="p-2">Data & Hora</th>
                        <th className="p-2 font-mono">Livre Caixa</th>
                        <th className="p-2 font-mono">Fundo Obra</th>
                        <th className="p-2 font-mono">Fundo Pintura</th>
                        <th className="p-2 font-mono">Fundo Reforma</th>
                        <th className="p-2 font-mono text-emerald-800">Total Reservas</th>
                        <th className="p-2 text-center">Nota</th>
                        <th className="p-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historicoCaixa.map((item, idx) => (
                        <tr key={item.id || idx} className={`hover:bg-slate-50 transition-colors ${idx === 0 ? 'bg-emerald-50/40 font-medium' : ''}`}>
                          <td className="p-2 text-slate-400 font-mono text-[11px]">
                            {idx === 0 ? (
                              <span className="bg-[#2d5a32] text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full">Atual</span>
                            ) : (
                              `#${idx + 1}`
                            )}
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-800 text-[11px]">
                            {item.dataHora}
                          </td>
                          <td className="p-2 font-mono text-slate-700">{formatarMoeda(item.livreCaixa)}</td>
                          <td className="p-2 font-mono text-slate-700">{formatarMoeda(item.fundoObras)}</td>
                          <td className="p-2 font-mono text-slate-700">{formatarMoeda(item.fundoPintura)}</td>
                          <td className="p-2 font-mono text-slate-700">{formatarMoeda(item.fundoReforma)}</td>
                          <td className="p-2 font-mono font-bold text-emerald-700">{formatarMoeda(item.totalReservas)}</td>
                          <td className="p-2 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-slate-800">
                              {item.saudeScore !== undefined ? `${item.saudeScore}/10` : '-'}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              title="Remover este registro do histórico"
                              onClick={() => {
                                setHistoricoCaixa(prev => prev.filter(h => h.id !== item.id));
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
              <Settings className="w-5 h-5 text-purple-600" />
              <h3>Configurações Avançadas</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Configure regras de auto-preenchimento para geração de relatórios de rateio e emissão de boletos.
            </p>
            <button
              type="button"
              onClick={() => setIsTemplatesModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold transition-colors border border-purple-200 w-full sm:w-auto"
            >
              <Settings className="w-4 h-4" /> Configurar Templates de Relatório
            </button>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#2d5a32] hover:bg-[#1e3d22] text-white font-bold flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{condominio ? 'Salvar Alterações' : 'Cadastrar Condomínio'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* JANELA EXPANDIDA / MODAL DEDICADO DE ANOTAÇÕES DO CONDOMÍNIO              */}
      {/* ========================================================================= */}
      {modalAnotacoesAberto && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden border border-slate-300">
            {/* Header da Janela de Anotações */}
            <div className="bg-[#1c3220] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/60 rounded-lg text-emerald-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      Anotações do Condomínio
                    </h3>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      {nome || idCustom || 'Residencial'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Espaço expandido e livre para registrar particularidades, regras, histórico e instruções operacionais.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAnotacoesAberto(false)}
                className="p-1.5 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Fechar janela de anotações"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Ferramentas */}
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-slate-600 font-medium">
                Digite livremente abaixo todas as particularidades e anotações deste condomínio:
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (anotacoes) {
                      navigator.clipboard.writeText(anotacoes);
                      setCopiadoFeedback(true);
                      setTimeout(() => setCopiadoFeedback(false), 2000);
                    }
                  }}
                  disabled={!anotacoes}
                  className="text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Copiar todo o texto para a área de transferência"
                >
                  {copiadoFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja realmente limpar todas as anotações deste condomínio?')) {
                      setAnotacoes('');
                    }
                  }}
                  disabled={!anotacoes}
                  className="text-[11px] font-medium bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 px-2.5 py-1 rounded-md border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Área de Texto Expandida */}
            <div className="flex-1 p-4 bg-slate-50 overflow-hidden flex flex-col">
              <textarea
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                placeholder="Digite aqui livremente todas as informações, detalhes, particularidades, acordos e orientações pertinentes ao condomínio..."
                className="w-full flex-1 p-4 bg-white border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#2d5a32] focus:border-[#2d5a32] resize-none outline-none font-sans shadow-inner overflow-y-auto"
                autoFocus
              />
            </div>

            {/* Footer da Janela de Anotações */}
            <div className="bg-white px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                <span>
                  <strong>{anotacoes.length}</strong> caracteres
                </span>
                <span>•</span>
                <span>
                  <strong>{anotacoes ? anotacoes.split(/\s+/).filter(Boolean).length : 0}</strong> palavras
                </span>
                <span>•</span>
                <span>
                  <strong>{anotacoes ? anotacoes.split('\n').length : 0}</strong> linhas
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalAnotacoesAberto(false)}
                  className="px-5 py-2 rounded-xl bg-[#2d5a32] hover:bg-[#1e3d22] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Concluir & Aplicar Anotações</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL DE TEMPLATES (MÓDULO 2.5)                                           */}
      {/* ========================================================================= */}
      <TemplatesRelatorioModal 
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templatesRelatorio={templatesRelatorio}
        onSave={(newTemplates) => setTemplatesRelatorio(newTemplates)}
        condominioName={nome || 'Novo Condomínio'}
        quantidadeUnidades={unidades}
      />
    </div>
  );
};
