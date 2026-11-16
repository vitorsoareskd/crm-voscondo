import React, { useState, useEffect } from 'react';
import { B2BLead, B2BLeadStage, Condominio } from '../../types';
import { subscribeToCollection, saveCollectionToFirestore } from '../../lib/firebase';
import { formatarMoeda } from '../../utils/pricingEngine';
import { ProposalModal } from './ProposalModal';
import {
  BellRing,
  CalendarClock,
  ArrowRight,
  PlusCircle,
  MessageCircle,
  CheckSquare,
  Trash2,
  FileCheck,
  ChevronRight,
  CheckCircle2,
  X,
  Edit3,
  Building2,
  RotateCcw,
  Kanban,
  UserCheck
} from 'lucide-react';

const STAGES: { id: B2BLeadStage; label: string; badgeColor: string }[] = [
  { id: 'lead_indicacao', label: 'Lead / Indicação', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'proposta_enviada', label: 'Proposta Comercial', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'assembleia_agendada', label: 'Assembleia Agendada', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'votacao_assembleia', label: 'Votação em Assembleia', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'implantacao_onboarding', label: 'Implantação / Onboarding', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

const INITIAL_B2B_LEADS: B2BLead[] = [];

interface B2BFunnelSectionProps {
  condominios?: Condominio[];
  setCondominios?: React.Dispatch<React.SetStateAction<Condominio[]>>;
  leads?: B2BLead[];
  setLeads?: React.Dispatch<React.SetStateAction<B2BLead[]>>;
  showAdminKanban?: boolean;
}

export const B2BFunnelSection: React.FC<B2BFunnelSectionProps> = ({
  condominios = [],
  setCondominios,
  leads: externalLeads,
  setLeads: setExternalLeads,
  showAdminKanban = true
}) => {
  const [internalLeads, setInternalLeads] = useState<B2BLead[]>(() => {
    try {
      const saved = localStorage.getItem('vos_b2b_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_B2B_LEADS;
    } catch {
      return INITIAL_B2B_LEADS;
    }
  });

  const leads = externalLeads !== undefined ? externalLeads : internalLeads;
  const setLeads = setExternalLeads !== undefined ? setExternalLeads : setInternalLeads;

  useEffect(() => {
    if (externalLeads !== undefined) return;
    const unsub = subscribeToCollection<B2BLead>('b2bLeads', (data) => setInternalLeads(data), INITIAL_B2B_LEADS);
    return () => unsub();
  }, [externalLeads]);

  useEffect(() => {
    if (externalLeads !== undefined) return;
    try {
      localStorage.setItem('vos_b2b_leads', JSON.stringify(internalLeads));
      saveCollectionToFirestore('b2bLeads', internalLeads);
    } catch {}
  }, [internalLeads, externalLeads]);

  // Form states for adding new B2B Lead (Kanban Síndico)
  const [nomeCondominio, setNomeCondominio] = useState('');
  const [unidades, setUnidades] = useState<string>('30');
  const [bairroCidade, setBairroCidade] = useState('Curitiba/PR');
  const [sindicoNome, setSindicoNome] = useState('');
  const [sindicoWhatsapp, setSindicoWhatsapp] = useState('');
  const [valorProposta, setValorProposta] = useState<string>('3200');
  const [dataAssembleia, setDataAssembleia] = useState('');

  // States for 1.4 Funil Comercial (Kanban Administração)
  const [selectedCondoForDoc, setSelectedCondoForDoc] = useState<Condominio | null>(null);
  const [editingIdCondo, setEditingIdCondo] = useState<{ id: string; newId: string } | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [leadParaExcluir, setLeadParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  const [leadParaExcluirDefinitivo, setLeadParaExcluirDefinitivo] = useState<{ id: string; nome: string } | null>(null);

  const adicionarLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCondominio.trim()) return;
    const novo: B2BLead = {
      id: `SIND-${Date.now().toString().slice(-4)}`,
      nomeCondominio: nomeCondominio.trim(),
      unidades: Number(unidades) || 1,
      bairroCidade: bairroCidade.trim() || 'Curitiba/PR',
      sindicoNome: sindicoNome.trim() || 'Síndico',
      sindicoWhatsapp: sindicoWhatsapp.trim() || '5541999999999',
      stage: 'lead_indicacao',
      valorProposta: Number(valorProposta) || undefined,
      dataAssembleia: dataAssembleia || undefined,
      followUpConselhoFeito: false
    };
    setLeads((prev) => [novo, ...prev]);
    setNomeCondominio('');
    setSindicoNome('');
    setSindicoWhatsapp('');
    setDataAssembleia('');
  };

  const avancarEtapa = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        const idx = STAGES.findIndex((s) => s.id === l.stage);
        const nextStage = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1].id : l.stage;
        return { ...l, stage: nextStage };
      })
    );
  };

  const mudarEtapaDireta = (leadId: string, novaStage: B2BLeadStage) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: novaStage } : l)));
  };

  const toggleFollowUpConselho = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, followUpConselhoFeito: !l.followUpConselhoFeito } : l))
    );
  };

  const excluirLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  const handleMoverStatus = (id: string, novoStatus: Condominio['status']) => {
    if (!setCondominios) return;
    setCondominios((prev) => prev.map((c) => (c.id === id ? { ...c, status: novoStatus } : c)));
  };

  const handleSaveEditedId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdCondo || !editingIdCondo.newId.trim() || !setCondominios) return;
    const targetOldId = editingIdCondo.id;
    const targetNewId = editingIdCondo.newId.trim();
    setCondominios((prev) => prev.map((c) => (c.id === targetOldId ? { ...c, id: targetNewId } : c)));
    setSyncNotice(`ID atualizado para [${targetNewId}]. Você pode selecioná-lo no Bloco 2 (Perfil Completo)!`);
    setEditingIdCondo(null);
  };

  const confirmarMoverExcluido = () => {
    if (leadParaExcluir) {
      handleMoverStatus(leadParaExcluir.id, 'Excluído');
      setSyncNotice(`Lead "${leadParaExcluir.nome}" foi movido para a lista de Excluídos.`);
      setLeadParaExcluir(null);
    }
  };

  const confirmarExclusaoDefinitiva = () => {
    if (leadParaExcluirDefinitivo && setCondominios) {
      setCondominios((prev) => prev.filter((c) => c.id !== leadParaExcluirDefinitivo.id));
      setSyncNotice(`Lead "${leadParaExcluirDefinitivo.nome}" foi excluído definitivamente.`);
      setLeadParaExcluirDefinitivo(null);
    }
  };

  const assembleiasDecisivas = leads.filter(
    (l) => l.stage === 'assembleia_agendada' || l.stage === 'votacao_assembleia'
  );

  const orcamentos = condominios.filter((c) => c.status === 'Cotação' || c.status === 'Interessado');
  const emTransicao = condominios.filter((c) => c.status === 'Em transição');
  const finalizados = condominios.filter((c) => c.status === 'Cliente Fidelizado');
  const perdidos = condominios.filter((c) => c.status === 'Perdido');
  const excluidos = condominios.filter((c) => c.status === 'Excluído');

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* BLOCO 1: FUNIL B2B — KANBAN DE SÍNDICOS (5 ETAPAS)                        */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#2d5a32] p-2.5 rounded-xl text-white shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1c3220] flex items-center gap-2">
                <span>Funil B2B — Kanban de Síndicos (5 Etapas)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhamento de oportunidades direcionadas a Síndicos: da Indicação até a Assembleia e Implantação.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#2d5a32] bg-[#e8f0e6] px-3.5 py-1.5 rounded-full border border-[#2d5a32]/20 shrink-0">
            Leads no Kanban Síndico: {leads.length}
          </span>
        </div>

        {/* Alertas de Assembleias Decisivas e Follow-up com Conselho Fiscal */}
        {assembleiasDecisivas.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <BellRing className="w-6 h-6 text-amber-600 animate-pulse shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Alerta de Assembleia Decisiva & Follow-up com Conselho Fiscal
                </h3>
                <p className="text-xs text-amber-800">
                  Você possui {assembleiasDecisivas.length} condomínio(s) em fase de Assembleia. Prepare o Laudo de Vistoria Inicial e agende o alinhamento pós-reunião com o Conselho Fiscal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulário Rápido para Adicionar Lead Direto no Kanban Síndico */}
        <form
          onSubmit={adicionarLead}
          className="bg-[#f2f5f1] border border-slate-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-2 lg:col-span-3 min-w-0">
            <label className="text-xs font-bold text-slate-700 block mb-1 truncate">Nome do Condomínio *</label>
            <input
              type="text"
              required
              placeholder="Ex: Condomínio Residencial Batel"
              value={nomeCondominio}
              onChange={(e) => setNomeCondominio(e.target.value)}
              className="w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-medium"
            />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <label className="text-xs font-bold text-slate-700 block mb-1 truncate">Unid. / Bairro</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                value={unidades}
                onChange={(e) => setUnidades(e.target.value)}
                placeholder="Unid."
                className="w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-semibold"
              />
              <input
                type="text"
                value={bairroCidade}
                onChange={(e) => setBairroCidade(e.target.value)}
                placeholder="Bairro"
                className="w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
              />
            </div>
          </div>
          <div className="lg:col-span-3 min-w-0">
            <label className="text-xs font-bold text-slate-700 block mb-1 truncate">Síndico & WhatsApp</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={sindicoNome}
                onChange={(e) => setSindicoNome(e.target.value)}
                placeholder="Síndico"
                className="w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
              />
              <input
                type="text"
                value={sindicoWhatsapp}
                onChange={(e) => setSindicoWhatsapp(e.target.value)}
                placeholder="554199..."
                className="w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-mono"
              />
            </div>
          </div>
          <div className="lg:col-span-2 min-w-0">
            <label className="text-xs font-bold text-slate-700 block mb-1 truncate">Proposta (R$) & Assembleia</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                value={valorProposta}
                onChange={(e) => setValorProposta(e.target.value)}
                placeholder="R$"
                className="w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-mono"
              />
              <input
                type="date"
                value={dataAssembleia}
                onChange={(e) => setDataAssembleia(e.target.value)}
                className="w-full min-w-0 bg-white border border-slate-300 rounded-lg px-1.5 py-2 text-[11px] text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
              />
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-2 min-w-0">
            <button
              type="submit"
              className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer h-[36px] shadow-xs transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 shrink-0" /> <span>Adicionar Lead</span>
            </button>
          </div>
        </form>

        {/* Kanban de 5 Colunas (Síndico) - Enquadrado com rolagem vertical e cards compactos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            return (
              <div
                key={stage.id}
                className="bg-[#f2f5f1] border border-slate-200 rounded-2xl p-2.5 flex flex-col h-[380px] min-w-0 overflow-hidden"
              >
                <div className="flex justify-between items-center gap-1.5 mb-2 pb-2 border-b border-slate-300 min-w-0 shrink-0">
                  <span className="text-[11px] font-bold text-[#1c3220] uppercase tracking-wide leading-tight break-words min-w-0">
                    {stage.label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${stage.badgeColor}`}>
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 min-w-0 overflow-y-auto pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="h-full min-h-[140px] flex items-center justify-center border border-dashed border-slate-300/80 rounded-xl bg-white/50 p-2.5">
                      <p className="text-[11px] text-slate-400 italic text-center">Nenhum lead nesta etapa</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs hover:shadow-xs transition-all space-y-1.5 min-w-0 overflow-hidden"
                      >
                        <div className="flex justify-between items-start gap-1 min-w-0">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-mono text-slate-400 font-bold block truncate">{lead.id}</span>
                            <h4 className="text-[11px] font-bold text-slate-900 leading-tight break-words">{lead.nomeCondominio}</h4>
                          </div>
                          <button
                            onClick={() => excluirLead(lead.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                            title="Remover lead"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="space-y-0.5 text-[10px] text-slate-600 min-w-0">
                          <p className="font-medium truncate">
                            {lead.unidades} unid. • {lead.bairroCidade}
                          </p>
                          <p className="truncate">
                            Síndico: <strong className="text-slate-900">{lead.sindicoNome}</strong>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1 min-w-0">
                          {lead.plano && (
                            <span className="inline-block bg-[#e8f0e6] text-[#2d5a32] text-[9px] font-bold px-1.5 py-0.5 rounded-full max-w-full truncate">
                              {lead.plano}
                            </span>
                          )}
                          {lead.valorProposta !== undefined && lead.valorProposta > 0 && (
                            <span className="text-[10px] font-bold text-[#2d5a32] font-mono bg-[#f2f5f1] px-1.5 py-0.5 rounded-md border border-slate-200 truncate">
                              {formatarMoeda(lead.valorProposta)}/mês
                            </span>
                          )}
                        </div>

                        {lead.dataAssembleia && (
                          <div className="flex items-center gap-1 text-[9px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-1 rounded-md font-medium min-w-0">
                            <CalendarClock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">Assembleia: {lead.dataAssembleia}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleFollowUpConselho(lead.id)}
                            className={`text-[9px] flex items-center gap-1 cursor-pointer font-medium min-w-0 truncate ${
                              lead.followUpConselhoFeito
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <CheckSquare className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.followUpConselhoFeito ? 'Conselho OK' : 'Follow-up Conselho'}</span>
                          </button>

                          {lead.sindicoWhatsapp && (
                            <a
                              href={`https://wa.me/${lead.sindicoWhatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-1 rounded-md transition-colors shrink-0"
                              title="Chamar Síndico no WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Seletor rápido de etapa e botão Avançar compactos */}
                        <div className="pt-1 border-t border-slate-100 space-y-1 min-w-0">
                          <select
                            value={lead.stage}
                            onChange={(e) => mudarEtapaDireta(lead.id, e.target.value as B2BLeadStage)}
                            className="w-full min-w-0 text-[10px] bg-[#f8faf6] border border-slate-200 rounded-md px-1.5 py-1 font-semibold text-slate-700 focus:ring-1 focus:ring-[#2d5a32] outline-hidden"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>

                          {stage.id !== 'implantacao_onboarding' && (
                            <button
                              type="button"
                              onClick={() => avancarEtapa(lead.id)}
                              title="Avançar para próxima etapa"
                              className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <span>Avançar Etapa</span>
                              <ArrowRight className="w-3 h-3 shrink-0" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BLOCO 2: 1.4 FUNIL COMERCIAL — KANBAN ADMINISTRAÇÃO (ORÇAMENTOS)          */}
      {/* ========================================================================= */}
      {showAdminKanban && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#1c3220] p-2.5 rounded-xl text-white shadow-xs">
                <Kanban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1c3220]">
                  1.4 Funil Comercial — Kanban Administração (Orçamentos)
                </h3>
                <p className="text-xs text-slate-500">
                  Gerencie a transição das negociações da Administração do orçamento até o contrato finalizado
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#2d5a32] bg-[#e8f0e6] px-3.5 py-1.5 rounded-full border border-[#2d5a32]/20 shrink-0">
              Total Oportunidades Administração: {condominios.length}
            </span>
          </div>

          {syncNotice && (
            <div className="bg-emerald-800 text-emerald-100 p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{syncNotice}</span>
              </div>
              <button onClick={() => setSyncNotice(null)} className="p-1 text-emerald-300 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Kanban Stages as Horizontal Rows (compact with vertical scrollbar) */}
          <div className="space-y-4">
            {/* Row 1: Orçamentos / Cotação */}
            <div className="bg-[#f2f5f1] p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">1. Orçamentos & Cotações</h4>
                </div>
                <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] text-center">
                  {orcamentos.length} {orcamentos.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {orcamentos.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">Nenhum orçamento nesta fase</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {orcamentos.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-2.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{item.id}</span>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-slate-900 text-xs truncate">{item.nome}</h5>
                          <p className="text-[11px] text-slate-500">
                            {item.unidades} un • Complexidade {item.complexidade}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <span className="bg-[#e8f0e6] text-[#2d5a32] text-[10px] font-bold px-2 py-0.5 rounded-full text-center shrink-0">
                          {item.plano}
                        </span>
                        <span className="font-bold text-emerald-800 font-mono text-xs shrink-0 min-w-[85px] text-right">
                          {formatarMoeda(item.mensalidadeCalculada)}/mês
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setSelectedCondoForDoc(item)}
                            title="Gerar Carta Proposta e Contrato PDF"
                            className="px-2 py-1 bg-[#1c3220] hover:bg-[#2d5a32] text-white rounded-lg text-[10px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-300 shrink-0" />
                            <span>Proposta</span>
                          </button>
                          <button
                            onClick={() => handleMoverStatus(item.id, 'Em transição')}
                            title="Avançar para Em Transição"
                            className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoverStatus(item.id, 'Perdido')}
                            title="Marcar como Perdido"
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Row 2: Em Transição */}
            <div className="bg-[#f2f5f1] p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    2. Em Transição (Aprovação)
                  </h4>
                </div>
                <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] text-center">
                  {emTransicao.length} {emTransicao.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {emTransicao.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">Nenhum cliente em transição</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {emTransicao.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-2.5 sm:px-3.5 sm:py-2 rounded-xl border border-blue-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{item.id}</span>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-slate-900 text-xs truncate">{item.nome}</h5>
                          <p className="text-[11px] text-slate-500">
                            {item.unidades} un • Síndico: {item.sindicoResponsavel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full text-center shrink-0">
                          {item.plano}
                        </span>
                        <span className="font-bold text-emerald-800 font-mono text-xs shrink-0 min-w-[85px] text-right">
                          {formatarMoeda(item.mensalidadeCalculada)}/mês
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setSelectedCondoForDoc(item)}
                            title="Visualizar Contrato em PDF"
                            className="px-2 py-1 bg-[#1c3220] hover:bg-[#2d5a32] text-white rounded-lg text-[10px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-300 shrink-0" />
                            <span>Ver Contrato</span>
                          </button>
                          <button
                            onClick={() => handleMoverStatus(item.id, 'Cliente Fidelizado')}
                            title="Aprovar e Tornar Cliente Fidelizado"
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold text-[10px] inline-flex items-center justify-center text-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Fechar</span>
                          </button>
                          <button
                            onClick={() => handleMoverStatus(item.id, 'Perdido')}
                            title="Marcar como Perdido"
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3: Finalizados / Clientes Fidelizados */}
            <div className="bg-[#f2f5f1] p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    3. Finalizados / Clientes
                  </h4>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] text-center">
                  {finalizados.length} {finalizados.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {finalizados.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">Nenhum contrato finalizado ainda</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {finalizados.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-2.5 sm:px-3.5 sm:py-2 rounded-xl border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => setEditingIdCondo({ id: item.id, newId: item.id })}
                          title="Clique para editar/personalizar o ID do Condomínio"
                          className="bg-slate-900 hover:bg-slate-800 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                        >
                          <span>{item.id}</span>
                          <Edit3 className="w-2.5 h-2.5 text-slate-400" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-slate-900 text-xs truncate">{item.nome}</h5>
                          <p className="text-[11px] text-slate-500">
                            {item.unidades} un • CNPJ: {item.cnpj}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full text-center shrink-0">
                          {item.plano}
                        </span>
                        <span className="font-bold text-[#2d5a32] font-mono text-xs shrink-0 min-w-[85px] text-right">
                          {formatarMoeda(item.mensalidadeCalculada)}/mês
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setSyncNotice(
                                `Condomínio [${item.id}] ${item.nome} está vinculado! Acesse a aba "ERP -> 2.1 Perfil Completo" para puxar e visualizar os dados.`
                              );
                            }}
                            title="Disponibilizar e puxar dados no Bloco 2 (Perfil Completo do Cliente)"
                            className="px-2 py-1 bg-[#e8f0e6] hover:bg-emerald-200 text-[#2d5a32] rounded-lg text-[10px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors border border-[#2d5a32]/20 cursor-pointer"
                          >
                            <Building2 className="w-3 h-3 text-[#2d5a32] shrink-0" />
                            <span>Puxar p/ Bloco 2</span>
                          </button>
                          <button
                            onClick={() => setSelectedCondoForDoc(item)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>Acessar Doc</span>
                          </button>
                          <button
                            onClick={() => handleMoverStatus(item.id, 'Perdido')}
                            title="Marcar como Perdido"
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Row 4: Perdidos */}
            <div className="bg-[#f2f5f1] p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">4. Perdidos</h4>
                </div>
                <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] text-center">
                  {perdidos.length} {perdidos.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {perdidos.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">Nenhum orçamento perdido</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {perdidos.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-2.5 sm:px-3.5 sm:py-2 rounded-xl border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{item.id}</span>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-slate-900 text-xs truncate">{item.nome}</h5>
                          <p className="text-[11px] text-slate-500">
                            {item.unidades} un • Complexidade {item.complexidade}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full text-center shrink-0">
                          {item.plano}
                        </span>
                        <span className="font-bold text-slate-400 line-through font-mono text-xs shrink-0 min-w-[85px] text-right">
                          {formatarMoeda(item.mensalidadeCalculada)}/mês
                        </span>
                        <button
                          onClick={() => handleMoverStatus(item.id, 'Cotação')}
                          title="Reabrir Orçamento no Kanban"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-600 shrink-0" />
                          <span>Reabrir</span>
                        </button>
                        <button
                          onClick={() => setLeadParaExcluir({ id: item.id, nome: item.nome })}
                          title="Excluir Lead (Mover para Leads Excluídos)"
                          className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-rose-700 shrink-0" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Row 5: Leads Excluídos */}
            <div className="bg-[#f8faf6] p-3.5 rounded-2xl border border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0">
                    <Trash2 className="w-2 h-2" />
                  </span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">5. Leads Excluídos</h4>
                </div>
                <span className="bg-slate-200 text-slate-700 font-bold px-2.5 py-0.5 rounded-full text-[11px] text-center">
                  {excluidos.length} {excluidos.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {excluidos.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">Nenhum lead excluído no momento</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {excluidos.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 p-2.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 opacity-90"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{item.id}</span>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-slate-700 text-xs truncate line-through">{item.nome}</h5>
                          <p className="text-[11px] text-slate-400">{item.unidades} un • Lead Excluído</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200 shrink-0">
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-center shrink-0">
                          {item.plano}
                        </span>
                        <span className="font-bold text-slate-400 line-through font-mono text-xs shrink-0 min-w-[80px] text-right">
                          {formatarMoeda(item.mensalidadeCalculada)}/mês
                        </span>
                        <button
                          onClick={() => {
                            handleMoverStatus(item.id, 'Perdido');
                            setSyncNotice(`Lead "${item.nome}" foi restaurado para a lista de Perdidos.`);
                          }}
                          title="Restaurar Lead para Perdidos"
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-white shrink-0" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          onClick={() => setLeadParaExcluirDefinitivo({ id: item.id, nome: item.nome })}
                          title="Excluir Definitivamente"
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold inline-flex items-center justify-center text-center gap-1 transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Definitivo</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Proposta / Contrato PDF */}
      {selectedCondoForDoc && (
        <ProposalModal
          condominio={selectedCondoForDoc}
          servicosExtras={[]}
          onClose={() => setSelectedCondoForDoc(null)}
        />
      )}

      {/* Modal Editar ID */}
      {editingIdCondo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveEditedId}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200"
          >
            <h3 className="font-bold text-[#1c3220] text-sm">Personalizar ID do Condomínio</h3>
            <input
              type="text"
              required
              value={editingIdCondo.newId}
              onChange={(e) => setEditingIdCondo({ ...editingIdCondo, newId: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingIdCondo(null)}
                className="px-3 py-1.5 border rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#2d5a32] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Salvar ID
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Mover para Excluídos */}
      {leadParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <h3 className="font-bold text-slate-900 text-base">Mover para Leads Excluídos?</h3>
            <p className="text-xs text-slate-500">
              Deseja mover <strong>"{leadParaExcluir.nome}"</strong> para a lista de Leads Excluídos?
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setLeadParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarMoverExcluido}
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Sim, Mover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Definitivo */}
      {leadParaExcluirDefinitivo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <h3 className="font-bold text-slate-900 text-base">Excluir Definitivamente?</h3>
            <p className="text-xs text-slate-500">
              Esta ação removerá <strong>"{leadParaExcluirDefinitivo.nome}"</strong> permanentemente.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setLeadParaExcluirDefinitivo(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoDefinitiva}
                className="px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
