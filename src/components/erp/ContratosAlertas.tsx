import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Bell,
  AlertCircle,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Building2,
  Sparkles,
  X
} from 'lucide-react';
import { formatarMoeda } from '../../utils/pricingEngine';
import { subscribeToCollection, saveCollectionToFirestore } from '../../lib/firebase';
import { Condominio } from '../../types';

interface Contrato {
  id: string;
  condominio_id: string;
  condominio_nome?: string;
  valor_honorarios: number;
  data_vencimento: string;
  meses_vigencia: number;
}

export interface EventoAgendaNotificacao {
  id: string;
  titulo: string;
  descricao: string;
  condominioNome: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  tipo: 'Contrato' | 'Assembleia' | 'Manutenção' | 'Lembrete';
  concluido?: boolean;
}

interface ContratosAlertasProps {
  condominios?: Condominio[];
}

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const getInitialAgenda = (): EventoAgendaNotificacao[] => {
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = String(hoje.getMonth() + 1).padStart(2, '0');
  const d = String(Math.min(28, hoje.getDate() + 2)).padStart(2, '0');
  return [
    {
      id: 'ag-101',
      titulo: 'Renovação de Contrato & Reajuste Anual',
      descricao: 'Apresentar relatório de gestão e cláusula de renovação junto ao Conselho Fiscal.',
      condominioNome: 'Residencial Cabral Cruz',
      data: `${y}-${m}-${d}`,
      horario: '19:00',
      tipo: 'Contrato',
      concluido: false
    }
  ];
};

export const ContratosAlertas: React.FC<ContratosAlertasProps> = ({ condominios = [] }) => {
  const [abaInterna, setAbaInterna] = useState<'notificacoes_iphone' | 'agenda_calendario'>('notificacoes_iphone');

  // Contratos do banco
  const [contratos, setContratos] = useState<Contrato[]>(() => {
    try {
      const saved = localStorage.getItem('vos_contratos_alertas');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    const unsub = subscribeToCollection<Contrato>('contratos', (data) => {
      if (data && data.length > 0) setContratos(data);
    }, []);
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('vos_contratos_alertas', JSON.stringify(contratos));
      saveCollectionToFirestore('contratos', contratos);
    } catch {}
  }, [contratos]);

  // Eventos da Agenda do Calendário com Notificação
  const [eventosAgenda, setEventosAgenda] = useState<EventoAgendaNotificacao[]>(() => {
    try {
      const saved = localStorage.getItem('vos_eventos_agenda_contratos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return getInitialAgenda();
    } catch {
      return getInitialAgenda();
    }
  });

  useEffect(() => {
    const unsub = subscribeToCollection<EventoAgendaNotificacao>(
      'eventosAgendaContratos',
      (data) => {
        if (data && data.length > 0) setEventosAgenda(data);
      },
      getInitialAgenda()
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('vos_eventos_agenda_contratos', JSON.stringify(eventosAgenda));
      saveCollectionToFirestore('eventosAgendaContratos', eventosAgenda);
    } catch {}
  }, [eventosAgenda]);

  // Modal/Formulário para novo Contrato ou Evento na Agenda
  const [modalNovoContrato, setModalNovoContrato] = useState(false);
  const [novoCondoId, setNovoCondoId] = useState(condominios[0]?.id || 'COND-101');
  const [novoValorHon, setNovoValorHon] = useState('1650');
  const [novaDataVenc, setNovaDataVenc] = useState('');
  const [novosMesesVig, setNovosMesesVig] = useState('12');

  // Estados do Calendário de Agenda
  const hoje = new Date();
  const [mesCal, setMesCal] = useState(hoje.getMonth());
  const [anoCal, setAnoCal] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<string>(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
  );

  const [tituloEvento, setTituloEvento] = useState('');
  const [descricaoEvento, setDescricaoEvento] = useState('');
  const [condominioEvento, setCondominioEvento] = useState(condominios[0]?.nome || 'Residencial Cabral Cruz');
  const [horarioEvento, setHorarioEvento] = useState('09:00');
  const [tipoEvento, setTipoEvento] = useState<EventoAgendaNotificacao['tipo']>('Contrato');

  const getDiasParaVencer = (dataStr: string) => {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    const v = new Date(dataStr + 'T00:00:00');
    const diffTime = v.getTime() - h.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMesesParaVencer = (dataVencimento: string) => {
    return Math.floor(getDiasParaVencer(dataVencimento) / 30);
  };

  const handleAdicionarContrato = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDataVenc) return;
    const condoObj = condominios.find((c) => c.id === novoCondoId);
    const novo: Contrato = {
      id: `CTR-${Date.now().toString().slice(-4)}`,
      condominio_id: novoCondoId,
      condominio_nome: condoObj?.nome || novoCondoId,
      valor_honorarios: Number(novoValorHon) || 0,
      data_vencimento: novaDataVenc,
      meses_vigencia: Number(novosMesesVig) || 12
    };
    setContratos((prev) => [novo, ...prev]);
    setModalNovoContrato(false);
    setNovaDataVenc('');
  };

  const handleAdicionarEventoAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloEvento.trim() || !diaSelecionado) return;
    const novoEv: EventoAgendaNotificacao = {
      id: `AG-${Date.now().toString().slice(-4)}`,
      titulo: tituloEvento.trim(),
      descricao: descricaoEvento.trim() || 'Agendamento registrado no calendário de contratos.',
      condominioNome: condominioEvento,
      data: diaSelecionado,
      horario: horarioEvento || '09:00',
      tipo: tipoEvento,
      concluido: false
    };
    setEventosAgenda((prev) => [novoEv, ...prev]);
    setTituloEvento('');
    setDescricaoEvento('');
  };

  const handleRemoverContrato = (id: string) => {
    setContratos((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRemoverEvento = (id: string) => {
    setEventosAgenda((prev) => prev.filter((ev) => ev.id !== id));
  };

  const toggleConcluirEvento = (id: string) => {
    setEventosAgenda((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, concluido: !ev.concluido } : ev))
    );
  };

  // Unificar Notificações para a Barra Estilo iPhone (iOS Notification Center)
  const notificacoesIphone = useMemo(() => {
    const itemsContratos = contratos.map((c) => {
      const dias = getDiasParaVencer(c.data_vencimento);
      const meses = getMesesParaVencer(c.data_vencimento);
      const condoNome =
        c.condominio_nome ||
        condominios.find((cd) => cd.id === c.condominio_id)?.nome ||
        `Condomínio ${c.condominio_id}`;
      const urgente = dias <= 60;

      return {
        id: `notif-ctr-${c.id}`,
        rawId: c.id,
        origem: 'contrato' as const,
        appTitle: 'VOS CONTRATOS • ALERTA',
        tempoLabel:
          dias < 0
            ? `Vencido há ${Math.abs(dias)}d`
            : dias === 0
            ? 'Vence Hoje'
            : meses <= 2
            ? `Faltam ${dias} dias`
            : `Em ${meses} meses`,
        titulo: `${condoNome} (Contrato #${c.id})`,
        subtitulo: `Honorários: ${formatarMoeda(c.valor_honorarios)} • Vencimento: ${c.data_vencimento.split('-').reverse().join('/')}`,
        detalhe: urgente
          ? '⚠️ Atenção: Prazo de renovação próximo. Agende alinhamento com o Síndico e Conselho.'
          : 'Vigência ativa e monitorada automaticamente pela central.',
        urgente,
        corIcone: urgente ? 'bg-amber-500 text-slate-950' : 'bg-[#2d5a32] text-white'
      };
    });

    const itemsAgenda = eventosAgenda.map((ev) => {
      const dias = getDiasParaVencer(ev.data);
      const urgente = dias >= 0 && dias <= 7 && !ev.concluido;

      return {
        id: `notif-ag-${ev.id}`,
        rawId: ev.id,
        origem: 'agenda' as const,
        appTitle: `VOS AGENDA • ${ev.tipo.toUpperCase()}`,
        tempoLabel:
          ev.concluido
            ? 'Concluído'
            : dias === 0
            ? `Hoje às ${ev.horario}`
            : dias === 1
            ? `Amanhã às ${ev.horario}`
            : dias < 0
            ? `${Math.abs(dias)}d atrás`
            : `Em ${dias} dias (${ev.horario})`,
        titulo: `${ev.titulo} — ${ev.condominioNome}`,
        subtitulo: `Data: ${ev.data.split('-').reverse().join('/')} às ${ev.horario}`,
        detalhe: ev.descricao,
        urgente,
        concluido: ev.concluido,
        corIcone: ev.concluido
          ? 'bg-emerald-600 text-white'
          : urgente
          ? 'bg-rose-500 text-white'
          : 'bg-[#1c3220] text-amber-300'
      };
    });

    return [...itemsAgenda, ...itemsContratos];
  }, [contratos, eventosAgenda, condominios]);

  // Geração da grade do calendário
  const diasDoMes = useMemo(() => {
    const primeiroDia = new Date(anoCal, mesCal, 1).getDay();
    const totalDias = new Date(anoCal, mesCal + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < primeiroDia; i++) cells.push(null);
    for (let d = 1; d <= totalDias; d++) {
      cells.push(`${anoCal}-${String(mesCal + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }, [anoCal, mesCal]);

  const contarEventosNoDia = (iso: string) => {
    const ctrs = contratos.filter((c) => c.data_vencimento === iso).length;
    const evs = eventosAgenda.filter((e) => e.data === iso).length;
    return ctrs + evs;
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mt-6 space-y-5">
      {/* CABEÇALHO E SELETOR DE ABAS (BARRA IPHONE VS AGENDA NO CALENDÁRIO) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1c3220] p-2.5 rounded-2xl text-amber-300 shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#1c3220] flex items-center gap-2">
              <span>Gestão e Alertas de Contratos & Agenda</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold border border-amber-300">
                {notificacoesIphone.length} Notificações Ativas
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Central estilo Barra de Notificações do iPhone sincronizada com a Agenda de Contratos e Lembretes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Abas Internas */}
          <div className="bg-[#f2f5f1] p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAbaInterna('notificacoes_iphone')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                abaInterna === 'notificacoes_iphone'
                  ? 'bg-[#1c3220] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#1c3220]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Barra de Notificações (Estilo iPhone)</span>
            </button>
            <button
              type="button"
              onClick={() => setAbaInterna('agenda_calendario')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                abaInterna === 'agenda_calendario'
                  ? 'bg-[#2d5a32] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#1c3220]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Agenda no Calendário</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModalNovoContrato(true)}
            className="px-3.5 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Contrato</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: BARRA DE NOTIFICAÇÕES ESTILO IPHONE (iOS NOTIFICATION CENTER)      */}
      {/* ========================================================================= */}
      {abaInterna === 'notificacoes_iphone' && (
        <div className="bg-gradient-to-b from-[#132417] via-[#1c3220] to-[#0f1d12] rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800/60 space-y-4">
          {/* Topo estilo Lock Screen / Dynamic Island do iPhone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="bg-black/60 border border-white/15 px-3.5 py-1 rounded-full flex items-center gap-2 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[11px] font-bold tracking-wide text-emerald-100">
                  Central de Notificações VOS
                </span>
              </div>
              <span className="text-xs text-emerald-200/80 hidden sm:inline">
                Toque para gerenciar ou agendar lembretes
              </span>
            </div>

            <button
              type="button"
              onClick={() => setAbaInterna('agenda_calendario')}
              className="text-[11px] bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Agendar Nova Notificação no Calendário</span>
            </button>
          </div>

          {/* Lista de Banners translúcidos estilo iOS */}
          {notificacoesIphone.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-8 text-center text-xs text-emerald-100/80">
              Nenhuma notificação ativa no momento. Clique em <strong>"Agenda no Calendário"</strong> ou <strong>"Novo Contrato"</strong> para criar alertas.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {notificacoesIphone.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-3xl p-4 backdrop-blur-xl transition-all duration-200 border shadow-lg hover:scale-[1.005] ${
                    item.urgente
                      ? 'bg-white/95 text-slate-900 border-amber-300/90'
                      : 'bg-white/90 text-slate-900 border-white/40'
                  }`}
                >
                  {/* Linha Superior Estilo iOS: Ícone do App + Nome do App + Horário/Prazo */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-xs ${item.corIcone}`}>
                        {item.origem === 'contrato' ? (
                          <FileText className="w-3.5 h-3.5" />
                        ) : (
                          <Bell className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        {item.appTitle}
                      </span>
                      {item.urgente && (
                        <span className="text-[9px] bg-amber-400/30 text-amber-900 border border-amber-400 px-2 py-0.5 rounded-full font-bold">
                          Prioridade
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold ${
                          item.urgente ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {item.tempoLabel}
                      </span>

                      {item.origem === 'agenda' && (
                        <button
                          type="button"
                          onClick={() => toggleConcluirEvento(item.rawId)}
                          className={`p-1 rounded-full transition cursor-pointer ${
                            item.concluido
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700'
                          }`}
                          title="Marcar lembrete como concluído"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          item.origem === 'contrato'
                            ? handleRemoverContrato(item.rawId)
                            : handleRemoverEvento(item.rawId)
                        }
                        className="p-1 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Dispensar notificação"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Corpo da Notificação iPhone */}
                  <div className="pl-8 space-y-0.5">
                    <h4
                      className={`text-sm font-bold text-slate-900 leading-snug ${
                        item.concluido ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {item.titulo}
                    </h4>
                    <p className="text-xs font-semibold text-[#2d5a32]">{item.subtitulo}</p>
                    <p className="text-xs text-slate-600 leading-relaxed pt-0.5">{item.detalhe}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: AGENDA NO CALENDÁRIO COM NOTIFICAÇÃO                               */}
      {/* ========================================================================= */}
      {abaInterna === 'agenda_calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda (5 cols): Calendário Interativo */}
          <div className="lg:col-span-5 bg-[#f2f5f1] border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c3220] uppercase tracking-wider">
                {NOMES_MESES[mesCal]} {anoCal}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (mesCal === 0) {
                      setMesCal(11);
                      setAnoCal((a) => a - 1);
                    } else {
                      setMesCal((m) => m - 1);
                    }
                  }}
                  className="p-1.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mesCal === 11) {
                      setMesCal(0);
                      setAnoCal((a) => a + 1);
                    } else {
                      setMesCal((m) => m + 1);
                    }
                  }}
                  className="p-1.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3">
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DIAS_SEMANA.map((d) => (
                  <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasDoMes.map((iso, idx) => {
                  if (!iso) return <div key={`empty-${idx}`} className="h-9" />;
                  const diaNumero = Number(iso.split('-')[2]);
                  const selecionado = diaSelecionado === iso;
                  const totalEv = contarEventosNoDia(iso);

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setDiaSelecionado(iso)}
                      className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition cursor-pointer border ${
                        selecionado
                          ? 'bg-[#1c3220] text-white border-[#1c3220] shadow-md scale-105'
                          : totalEv > 0
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-transparent'
                      }`}
                    >
                      <span>{diaNumero}</span>
                      {totalEv > 0 && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                            selecionado ? 'bg-amber-300' : 'bg-amber-600'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Dia selecionado: <strong className="text-[#1c3220]">{diaSelecionado.split('-').reverse().join('/')}</strong>
            </p>
          </div>

          {/* Coluna Direita (7 cols): Formulário para Agendar Lembrete/Notificação no Dia */}
          <div className="lg:col-span-7 space-y-4">
            <form
              onSubmit={handleAdicionarEventoAgenda}
              className="bg-[#f8faf6] border border-slate-200 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-[#1c3220] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#2d5a32]" />
                  <span>Agendar Notificação para {diaSelecionado.split('-').reverse().join('/')}</span>
                </h4>
                <span className="text-[10px] bg-[#e8f0e6] text-[#2d5a32] font-bold px-2.5 py-0.5 rounded-full">
                  Aparece na Barra estilo iPhone
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Título do Alerta / Compromisso *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vencimento Contrato Elevadores / Assembleia Ordinária"
                    value={tituloEvento}
                    onChange={(e) => setTituloEvento(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={tipoEvento}
                    onChange={(e) => setTipoEvento(e.target.value as EventoAgendaNotificacao['tipo'])}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="Contrato">Contrato</option>
                    <option value="Assembleia">Assembleia</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Lembrete">Lembrete</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Condomínio *</label>
                  <select
                    value={condominioEvento}
                    onChange={(e) => setCondominioEvento(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {condominios.map((c) => (
                      <option key={c.id} value={c.nome}>
                        [{c.id}] {c.nome}
                      </option>
                    ))}
                    <option value="Carteira Geral VOS">Carteira Geral VOS</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Horário do Alerta</label>
                  <input
                    type="time"
                    value={horarioEvento}
                    onChange={(e) => setHorarioEvento(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Descrição / Detalhes da Notificação</label>
                <input
                  type="text"
                  placeholder="Ex: Enviar aviso de renovação com 30 dias de antecedência..."
                  value={descricaoEvento}
                  onChange={(e) => setDescricaoEvento(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
              >
                <Bell className="w-4 h-4" />
                <span>Incluir na Agenda & Ativar na Barra de Notificações</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA ADICIONAR CONTRATO FORMAL */}
      {modalNovoContrato && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAdicionarContrato}
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-[#1c3220]">Cadastrar Contrato para Monitoramento</h4>
              <button
                type="button"
                onClick={() => setModalNovoContrato(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Condomínio *</label>
                <select
                  value={novoCondoId}
                  onChange={(e) => setNovoCondoId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                >
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.id}] {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Honorários (R$) *</label>
                  <input
                    type="number"
                    required
                    value={novoValorHon}
                    onChange={(e) => setNovoValorHon(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={novaDataVenc}
                    onChange={(e) => setNovaDataVenc(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNovoContrato(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#2d5a32] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Salvar Contrato
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
