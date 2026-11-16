import React, { useState, useEffect, useMemo } from 'react';
import { Condominio, UserProfile, VagaDisponivel } from '../../types';
import { subscribeToCollection, saveCollectionToFirestore } from '../../lib/firebase';
import {
  Car,
  Calendar as CalendarIcon,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Building2
} from 'lucide-react';

interface ParkingProps {
  currentUser: UserProfile;
  condominios?: Condominio[];
}

// Vagas iniciais do condomínio (sem dados fictícios)
const NOMES_FICTICIOS_REMOVER = ['Carlos Eduardo', 'Fernanda Lima', 'Roberto Alves'];

const getInitialVagas = (): VagaDisponivel[] => {
  return [];
};

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

const formatDateISO = (year: number, monthZeroBased: number, day: number): string => {
  return `${year}-${String(monthZeroBased + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const formatDateBR = (iso: string): string => {
  if (!iso) return '-';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const calcularDiasEntre = (inicio: string, fim: string): number => {
  if (!inicio || !fim) return 1;
  const d1 = new Date(inicio + 'T00:00:00');
  const d2 = new Date(fim + 'T00:00:00');
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
};

export const ParkingRentalModule: React.FC<ParkingProps> = ({ currentUser, condominios = [] }) => {
  const [vagas, setVagas] = useState<VagaDisponivel[]>(() => {
    try {
      const saved = localStorage.getItem('vos_vagas_estacionamento');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((v) => !NOMES_FICTICIOS_REMOVER.includes(v.proprietarioNome));
        }
      }
      return getInitialVagas();
    } catch {
      return getInitialVagas();
    }
  });

  useEffect(() => {
    const unsub = subscribeToCollection<VagaDisponivel>(
      'vagasEstacionamento',
      (data) => {
        if (Array.isArray(data)) {
          setVagas(data.filter((v) => !NOMES_FICTICIOS_REMOVER.includes(v.proprietarioNome)));
        }
      },
      getInitialVagas()
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('vos_vagas_estacionamento', JSON.stringify(vagas));
      saveCollectionToFirestore('vagasEstacionamento', vagas);
    } catch {}
  }, [vagas]);

  // =========================================================================
  // CALENDÁRIO ESTILO AIRBNB (SELEÇÃO DE CHECK-IN E CHECK-OUT)
  // =========================================================================
  const hoje = new Date();
  const [mesCalendario, setMesCalendario] = useState<number>(hoje.getMonth());
  const [anoCalendario, setAnoCalendario] = useState<number>(hoje.getFullYear());

  // Intervalo selecionado pelo morador que precisa de vaga
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [filtroModalidade, setFiltroModalidade] = useState<'todas' | 'Aluguel' | 'Empréstimo Gratuito'>('todas');

  const handleCliqueDiaCalendario = (isoDate: string) => {
    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Inicia nova seleção (1º clique = Check-in)
      setCheckInDate(isoDate);
      setCheckOutDate('');
    } else {
      // 2º clique = Check-out
      if (isoDate < checkInDate) {
        setCheckOutDate(checkInDate);
        setCheckInDate(isoDate);
      } else {
        setCheckOutDate(isoDate);
      }
    }
  };

  const limparSelecaoCalendario = () => {
    setCheckInDate('');
    setCheckOutDate('');
  };

  const irMesAnterior = () => {
    if (mesCalendario === 0) {
      setMesCalendario(11);
      setAnoCalendario((a) => a - 1);
    } else {
      setMesCalendario((m) => m - 1);
    }
  };

  const irProximoMes = () => {
    if (mesCalendario === 11) {
      setMesCalendario(0);
      setAnoCalendario((a) => a + 1);
    } else {
      setMesCalendario((m) => m + 1);
    }
  };

  // Gerar dias de um mês para o calendário Airbnb
  const gerarDiasDoMes = (year: number, month: number) => {
    const primeiroDiaSemana = new Date(year, month, 1).getDay();
    const totalDiasMes = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];

    for (let i = 0; i < primeiroDiaSemana; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDiasMes; d++) {
      cells.push(formatDateISO(year, month, d));
    }
    return cells;
  };

  const mesSecundario = mesCalendario === 11 ? 0 : mesCalendario + 1;
  const anoSecundario = mesCalendario === 11 ? anoCalendario + 1 : anoCalendario;

  const diasMes1 = useMemo(() => gerarDiasDoMes(anoCalendario, mesCalendario), [anoCalendario, mesCalendario]);
  const diasMes2 = useMemo(() => gerarDiasDoMes(anoSecundario, mesSecundario), [anoSecundario, mesSecundario]);

  // Quantas vagas estão disponíveis em uma data específica (para mostrar bolinha no calendário)
  const contarVagasNoDia = (isoDate: string): number => {
    return vagas.filter(
      (v) => v.status === 'disponivel' && v.dataInicio <= isoDate && v.dataFim >= isoDate
    ).length;
  };

  // Vagas disponíveis filtradas pelo período selecionado no calendário Airbnb
  const dataInicioFiltro = checkInDate;
  const dataFimFiltro = checkOutDate || checkInDate;
  const quantidadeDiarias = dataInicioFiltro ? calcularDiasEntre(dataInicioFiltro, dataFimFiltro) : 1;

  const vagasMuralDisponiveis = useMemo(() => {
    return vagas.filter((v) => {
      if (v.status !== 'disponivel') return false;
      if (filtroModalidade !== 'todas' && v.tipoModalidade !== filtroModalidade) return false;

      // Se o morador selecionou datas no calendário, mostra as vagas que cobrem ou têm interseção com os dias escolhidos
      if (dataInicioFiltro) {
        const cobrePeriodo = v.dataInicio <= dataFimFiltro && v.dataFim >= dataInicioFiltro;
        return cobrePeriodo;
      }
      return true;
    });
  }, [vagas, dataInicioFiltro, dataFimFiltro, filtroModalidade]);

  // Vagas cadastradas na planilha Excel do condomínio (para sugestão rápida)
  const vagasDaPlanilha = useMemo(() => {
    return condominios
      .flatMap((c) => c.moradores || [])
      .filter((m) => m.vagaGaragem && m.vagaGaragem.trim() !== '');
  }, [condominios]);

  // =========================================================================
  // ESTADOS PARA LIBERAR A PRÓPRIA VAGA E ENVIAR PROPOSTA
  // =========================================================================
  const [modalPropostaVaga, setModalPropostaVaga] = useState<VagaDisponivel | null>(null);
  const [placa, setPlaca] = useState('');
  const [obsProposta, setObsProposta] = useState('');
  const [ mostrarFormLiberarVaga, setMostrarFormLiberarVaga] = useState(false);

  const [novaDataInicio, setNovaDataInicio] = useState('');
  const [novaDataFim, setNovaDataFim] = useState('');
  const [novaModalidade, setNovaModalidade] = useState<'Aluguel' | 'Empréstimo Gratuito'>('Aluguel');
  const [novoValor, setNovoValor] = useState<string>('25');
  const [numeroVagaCustom, setNumeroVagaCustom] = useState(currentUser.vagaVinculada || 'G1-18');
  const [proprietarioCustomNome, setProprietarioCustomNome] = useState(currentUser.nome || '');
  const [proprietarioCustomUnidade, setProprietarioCustomUnidade] = useState(currentUser.unidade || 'Bloco A - Apto 402');
  const [proprietarioCustomWpp, setProprietarioCustomWpp] = useState(currentUser.whatsapp || '5541988887777');

  const gerarLinkWhatsAppNegociacao = (vaga: VagaDisponivel) => {
    const periodoTexto = dataInicioFiltro
      ? `de ${formatDateBR(dataInicioFiltro)} até ${formatDateBR(dataFimFiltro)} (${quantidadeDiarias} ${quantidadeDiarias === 1 ? 'diária' : 'diárias'})`
      : `de ${formatDateBR(vaga.dataInicio)} até ${formatDateBR(vaga.dataFim)}`;

    const totalEstimado =
      vaga.tipoModalidade === 'Aluguel' && vaga.valorDiaria
        ? ` • Total estimado: R$ ${(vaga.valorDiaria * quantidadeDiarias).toFixed(2)}`
        : ' • Modalidade: Empréstimo Gratuito';

    const texto =
      `🚗 *Reserva de Vaga — VosCondo*\n\n` +
      `Olá, *${vaga.proprietarioNome}*! Tudo bem?\n` +
      `Sou *${currentUser.nome}* (${currentUser.unidade || 'Morador'}).\n` +
      `Selecionei no calendário do condomínio os dias *${periodoTexto}* e vi que sua vaga *${vaga.numeroVaga}* está disponível${totalEstimado}.\n\n` +
      `Podemos confirmar a utilização da vaga para esses dias?`;

    return `https://wa.me/${vaga.proprietarioWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
  };

  const enviarPropostaSistema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPropostaVaga) return;

    const periodoEscolhido = dataInicioFiltro
      ? `[Período solicitado: ${formatDateBR(dataInicioFiltro)} a ${formatDateBR(dataFimFiltro)} - ${quantidadeDiarias} dia(s)] `
      : '';

    setVagas((prev) =>
      prev.map((v) =>
        v.id === modalPropostaVaga.id
          ? {
              ...v,
              status: 'proposta_pendente',
              propostaAtual: {
                solicitanteNome: currentUser.nome,
                solicitanteUnidade: currentUser.unidade || 'Condômino',
                solicitanteWhatsapp: currentUser.whatsapp || '5541999999999',
                placaVeiculo: placa.toUpperCase(),
                mensagemProposta: `${periodoEscolhido}${obsProposta}`
              }
            }
          : v
      )
    );
    setModalPropostaVaga(null);
    setPlaca('');
    setObsProposta('');
  };

  const aprovarLiberacaoVaga = (vagaId: string) => {
    setVagas((prev) => prev.map((v) => (v.id === vagaId ? { ...v, status: 'ocupada' } : v)));
  };

  const recusarProposta = (vagaId: string) => {
    setVagas((prev) =>
      prev.map((v) => (v.id === vagaId ? { ...v, status: 'disponivel', propostaAtual: undefined } : v))
    );
  };

  const removerVaga = (vagaId: string) => {
    setVagas((prev) => prev.filter((v) => v.id !== vagaId));
  };

  const disponibilizarMinhaVaga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDataInicio || !novaDataFim) return;

    const nova: VagaDisponivel = {
      id: `vaga-${Date.now()}`,
      condominioId: currentUser.condominioId || 'COND-101',
      numeroVaga: numeroVagaCustom.trim() || 'G1-01',
      proprietarioId: currentUser.uid,
      proprietarioNome: proprietarioCustomNome.trim() || currentUser.nome,
      proprietarioUnidade: proprietarioCustomUnidade.trim() || 'Residencial Cabral Cruz',
      proprietarioWhatsapp: proprietarioCustomWpp.trim() || '5541998508290',
      tipoModalidade: novaModalidade,
      valorDiaria: novaModalidade === 'Aluguel' ? Number(novoValor) || 0 : 0,
      dataInicio: novaDataInicio,
      dataFim: novaDataFim,
      status: 'disponivel'
    };

    setVagas((prev) => [nova, ...prev]);
    setNovaDataInicio('');
    setNovaDataFim('');
    setMostrarFormLiberarVaga(false);
  };

  const vagasComPendenciaAprovacao = vagas.filter((v) => v.status === 'proposta_pendente');
  const vagasJaAlugadasHistorico = vagas.filter((v) => v.status === 'ocupada');

  // Renderizador de 1 grade mensal estilo Airbnb
  const renderMesCalendario = (tituloMes: string, cells: (string | null)[]) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
      <div className="text-center font-bold text-xs text-[#1c3220] mb-2.5 pb-1.5 border-b border-slate-100">
        {tituloMes}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, idx) => {
          if (!iso) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }

          const diaNum = Number(iso.split('-')[2]);
          const qtdVagasDia = contarVagasNoDia(iso);
          const isStart = checkInDate === iso;
          const isEnd = checkOutDate === iso;
          const isInRange =
            checkInDate && checkOutDate && iso > checkInDate && iso < checkOutDate;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => handleCliqueDiaCalendario(iso)}
              className={`h-9 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all cursor-pointer border ${
                isStart || isEnd
                  ? 'bg-[#1c3220] text-white border-[#1c3220] shadow-md scale-105 z-10'
                  : isInRange
                  ? 'bg-[#e8f0e6] text-[#1c3220] border-emerald-300'
                  : qtdVagasDia > 0
                  ? 'bg-[#f8faf6] hover:bg-emerald-50 text-slate-800 border-slate-200'
                  : 'bg-white hover:bg-slate-100 text-slate-400 border-transparent'
              }`}
              title={
                qtdVagasDia > 0
                  ? `${qtdVagasDia} vaga(s) disponível(is) em ${formatDateBR(iso)}`
                  : `Selecionar ${formatDateBR(iso)}`
              }
            >
              <span>{diaNum}</span>
              {qtdVagasDia > 0 && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isStart || isEnd ? 'bg-amber-300' : 'bg-[#2d5a32]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-white text-slate-900 rounded-2xl shadow-xs border border-slate-200">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#2d5a32] p-2.5 rounded-xl text-white shadow-xs">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1c3220]">
              Agenda & Aluguel de Vagas de Estacionamento (Estilo Airbnb)
            </h2>
            <p className="text-xs text-slate-500">
              Selecione no calendário os dias em que precisa de vaga (Check-in e Check-out) para ver na hora as opções disponíveis e o cálculo de diárias.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMostrarFormLiberarVaga((prev) => !prev)}
            className="px-4 py-2 bg-[#1c3220] hover:bg-[#2d5a32] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            <span>{mostrarFormLiberarVaga ? 'Fechar Cadastro de Vaga' : 'Disponibilizar Minha Vaga'}</span>
          </button>
        </div>
      </div>

      {/* FORMULÁRIO EXPANSÍVEL PARA O PROPRIETÁRIO DISPONIBILIZAR SUA VAGA */}
      {mostrarFormLiberarVaga && (
        <form
          onSubmit={disponibilizarMinhaVaga}
          className="bg-[#f2f5f1] border border-slate-300 p-4 rounded-2xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-[#1c3220] uppercase tracking-wider">
              Anunciar / Liberar Vaga no Calendário do Condomínio
            </span>
            {vagasDaPlanilha.length > 0 && (
              <select
                onChange={(e) => {
                  const m = vagasDaPlanilha.find((item) => item.id === e.target.value);
                  if (m) {
                    setNumeroVagaCustom(m.vagaGaragem);
                    setProprietarioCustomNome(m.nomeMorador);
                    setProprietarioCustomUnidade(`${m.bloco} - Unid. ${m.unidade}`);
                    setProprietarioCustomWpp(m.whatsapp);
                  }
                }}
                defaultValue=""
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#2d5a32]"
              >
                <option value="">-- Puxar Morador/Vaga da Planilha Excel --</option>
                {vagasDaPlanilha.map((m) => (
                  <option key={m.id} value={m.id}>
                    Vaga {m.vagaGaragem} — {m.nomeMorador} ({m.bloco} - {m.unidade})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Nº da Vaga *</label>
              <input
                type="text"
                value={numeroVagaCustom}
                onChange={(e) => setNumeroVagaCustom(e.target.value)}
                placeholder="Ex: G1-18"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Proprietário & Unidade</label>
              <input
                type="text"
                value={proprietarioCustomNome}
                onChange={(e) => setProprietarioCustomNome(e.target.value)}
                placeholder="Seu Nome"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Data Início *</label>
              <input
                type="date"
                value={novaDataInicio}
                onChange={(e) => setNovaDataInicio(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Data Fim *</label>
              <input
                type="date"
                value={novaDataFim}
                onChange={(e) => setNovaDataFim(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Modalidade & Diária (R$)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={novaModalidade}
                  onChange={(e) => setNovaModalidade(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 font-medium"
                >
                  <option value="Aluguel">Aluguel</option>
                  <option value="Empréstimo Gratuito">Gratuito</option>
                </select>
                <input
                  type="number"
                  disabled={novaModalidade === 'Empréstimo Gratuito'}
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  placeholder="R$"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 font-mono disabled:opacity-40"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition h-[36px] shadow-xs"
            >
              <PlusCircle className="w-4 h-4" /> Publicar Vaga
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: CALENDÁRIO AIRBNB (ESQUERDA) + VAGAS FILTRADAS (DIREITA) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA (5 cols): PEQUENO CALENDÁRIO INTERATIVO ESTILO AIRBNB */}
        <div className="lg:col-span-5 bg-[#f2f5f1] border border-slate-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#1c3220] uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[#2d5a32]" />
                <span>Selecione os Dias no Calendário</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Clique no dia de <strong>Entrada (Check-in)</strong> e no dia de <strong>Saída (Check-out)</strong>
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={irMesAnterior}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={irProximoMes}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra Resumo estilo Airbnb (Check-in | Check-out | Diárias) */}
          <div className="bg-white border border-slate-300 rounded-2xl p-2.5 grid grid-cols-3 gap-2 items-center shadow-2xs">
            <div className="px-2.5 py-1 border-r border-slate-200">
              <span className="text-[9px] font-bold uppercase text-slate-400 block">1º Dia (Check-in)</span>
              <span className="text-xs font-bold text-[#1c3220]">
                {checkInDate ? formatDateBR(checkInDate) : 'Selecionar'}
              </span>
            </div>
            <div className="px-2.5 py-1 border-r border-slate-200">
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Último Dia (Check-out)</span>
              <span className="text-xs font-bold text-[#1c3220]">
                {checkOutDate ? formatDateBR(checkOutDate) : checkInDate ? formatDateBR(checkInDate) : 'Selecionar'}
              </span>
            </div>
            <div className="px-2 py-1 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Período</span>
                <span className="text-xs font-black text-[#2d5a32]">
                  {checkInDate ? `${quantidadeDiarias} ${quantidadeDiarias === 1 ? 'dia' : 'dias'}` : 'Todos'}
                </span>
              </div>
              {checkInDate && (
                <button
                  type="button"
                  onClick={limparSelecaoCalendario}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Limpar datas selecionadas"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Grades Mensais (Mês Atual + Próximo Mês) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            {renderMesCalendario(`${NOMES_MESES[mesCalendario]} ${anoCalendario}`, diasMes1)}
            {renderMesCalendario(`${NOMES_MESES[mesSecundario]} ${anoSecundario}`, diasMes2)}
          </div>

          {/* Legenda do Calendário */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2d5a32]" />
              <span>Dias com vagas livres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#1c3220] inline-block" />
              <span>Check-in / Check-out</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#e8f0e6] border border-emerald-300 inline-block" />
              <span>Intervalo escolhido</span>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (7 cols): OPÇÕES E VAGAS DISPONÍVEIS PARA OS DIAS SELECIONADOS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1c3220] flex items-center gap-2">
                <span>Vagas Disponíveis ({vagasMuralDisponiveis.length})</span>
                {checkInDate && (
                  <span className="text-[11px] bg-[#e8f0e6] text-[#2d5a32] px-2.5 py-0.5 rounded-full font-bold">
                    {formatDateBR(dataInicioFiltro)} até {formatDateBR(dataFimFiltro)} ({quantidadeDiarias}d)
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                {checkInDate
                  ? `Mostrando opções disponíveis para os ${quantidadeDiarias} dia(s) selecionados no calendário`
                  : 'Clique nos dias desejados no calendário ao lado para filtrar e calcular o valor total das diárias'}
              </p>
            </div>

            {/* Filtro Rápido de Modalidade (Aluguel vs Empréstimo Gratuito) */}
            <div className="flex items-center gap-1 bg-[#f2f5f1] p-1 rounded-xl border border-slate-200 shrink-0">
              {(['todas', 'Aluguel', 'Empréstimo Gratuito'] as const).map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setFiltroModalidade(mod)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                    filtroModalidade === mod
                      ? 'bg-[#1c3220] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mod === 'todas' ? 'Todas' : mod === 'Aluguel' ? 'Aluguel' : 'Gratuitas'}
                </button>
              ))}
            </div>
          </div>

          {vagasMuralDisponiveis.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl bg-[#f8faf6] space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Nenhuma vaga disponível para o filtro/período selecionado.
              </p>
              <p className="text-[11px] text-slate-500">
                Experimente selecionar outras datas no calendário ao lado ou clique em <strong>"Disponibilizar Minha Vaga"</strong> no topo.
              </p>
              {checkInDate && (
                <button
                  type="button"
                  onClick={limparSelecaoCalendario}
                  className="mt-2 px-3 py-1.5 bg-[#2d5a32] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Ver Todas as Datas
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[540px] overflow-y-auto pr-1">
              {vagasMuralDisponiveis.map((vaga) => {
                const valorTotalPeriodo =
                  vaga.tipoModalidade === 'Aluguel' && vaga.valorDiaria
                    ? vaga.valorDiaria * quantidadeDiarias
                    : 0;

                return (
                  <div
                    key={vaga.id}
                    className="bg-[#f8faf6] border border-slate-200 hover:border-[#2d5a32] rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-white bg-[#1c3220] px-3 py-1 rounded-xl">
                          Vaga {vaga.numeroVaga}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                              vaga.tipoModalidade === 'Aluguel'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {vaga.tipoModalidade === 'Aluguel'
                              ? `R$ ${vaga.valorDiaria}/dia`
                              : 'Empréstimo Gratuito'}
                          </span>
                          <button
                            onClick={() => removerVaga(vaga.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Remover vaga"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-slate-900 font-bold">{vaga.proprietarioNome}</p>
                        <p className="text-xs text-slate-500">{vaga.proprietarioUnidade}</p>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200 font-medium">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#2d5a32] shrink-0" />
                        <span>
                          Livre de <strong>{formatDateBR(vaga.dataInicio)}</strong> até{' '}
                          <strong>{formatDateBR(vaga.dataFim)}</strong>
                        </span>
                      </div>

                      {/* Cálculo estilo Airbnb quando o morador seleciona os dias no calendário */}
                      <div className="bg-[#e8f0e6] border border-[#2d5a32]/20 p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#1c3220] font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-[#2d5a32]" />
                          <span>
                            {checkInDate
                              ? `${quantidadeDiarias} ${quantidadeDiarias === 1 ? 'diária selecionada' : 'diárias selecionadas'}`
                              : 'Valor por diária'}
                          </span>
                        </div>
                        <span className="font-black text-[#2d5a32] font-mono text-sm">
                          {vaga.tipoModalidade === 'Aluguel'
                            ? `R$ ${valorTotalPeriodo.toFixed(2)}`
                            : 'R$ 0,00 (Grátis)'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                      <a
                        href={gerarLinkWhatsAppNegociacao(vaga)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-2xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          {checkInDate
                            ? `Reservar (${quantidadeDiarias}d) via WhatsApp`
                            : 'Negociar Vaga no WhatsApp'}
                        </span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setModalPropostaVaga(vaga)}
                        className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold py-1.5 px-3 rounded-xl transition cursor-pointer"
                      >
                        Reservar / Subir Proposta no Sistema
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PAINEL DE PENDÊNCIAS DO PROPRIETÁRIO (Aprovar Proposta) */}
      {vagasComPendenciaAprovacao.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" /> Propostas Pendentes de Liberação do Proprietário
          </h3>
          {vagasComPendenciaAprovacao.map((vaga) => (
            <div
              key={vaga.id}
              className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs"
            >
              <div>
                <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                  Vaga {vaga.numeroVaga} ({formatDateBR(vaga.dataInicio)} a {formatDateBR(vaga.dataFim)})
                </span>
                <p className="text-sm font-medium mt-1.5 text-slate-800">
                  Solicitante: <strong className="text-slate-900">{vaga.propostaAtual?.solicitanteNome}</strong> (
                  {vaga.propostaAtual?.solicitanteUnidade}) — Placa:{' '}
                  <span className="text-[#2d5a32] font-mono font-bold">{vaga.propostaAtual?.placaVeiculo}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5 italic">"{vaga.propostaAtual?.mensagemProposta}"</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => aprovarLiberacaoVaga(vaga.id)}
                  className="bg-[#2d5a32] hover:bg-[#1f4223] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                >
                  <CheckCircle2 className="w-4 h-4" /> Aprovar Reserva
                </button>
                <button
                  onClick={() => recusarProposta(vaga.id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                >
                  <XCircle className="w-4 h-4" /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HISTÓRICO DE VAGAS APROVADAS */}
      {vagasJaAlugadasHistorico.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
            Vagas Reservadas / Indisponíveis (Portaria Notificada)
          </h4>
          <div className="space-y-2">
            {vagasJaAlugadasHistorico.map((v) => (
              <div
                key={v.id}
                className="text-xs bg-[#f2f5f1] border border-slate-200 p-3 rounded-xl flex justify-between items-center text-slate-700"
              >
                <span>
                  <strong>Vaga {v.numeroVaga}</strong> reservada para{' '}
                  <strong>{v.propostaAtual?.solicitanteNome}</strong> (Placa: {v.propostaAtual?.placaVeiculo})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#2d5a32] font-bold">
                    Aprovada ({formatDateBR(v.dataInicio)} a {formatDateBR(v.dataFim)})
                  </span>
                  <button
                    onClick={() => removerVaga(v.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                    title="Remover registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PARA SUBIR PROPOSTA NO SISTEMA */}
      {modalPropostaVaga && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={enviarPropostaSistema}
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-[#1c3220]">
              Reservar Vaga — {modalPropostaVaga.numeroVaga}
            </h3>
            <p className="text-xs text-slate-600">
              Proprietário: <strong className="text-slate-900">{modalPropostaVaga.proprietarioNome}</strong> (
              {modalPropostaVaga.proprietarioUnidade})
              {checkInDate && (
                <span className="block mt-1 text-[#2d5a32] font-bold">
                  Período selecionado: {formatDateBR(dataInicioFiltro)} até {formatDateBR(dataFimFiltro)} ({quantidadeDiarias} dia(s))
                </span>
              )}
            </p>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Placa do Veículo (Para controle da Portaria) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: ABC-1D23"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className="w-full bg-[#f8faf6] border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono uppercase focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Observações / Horários *</label>
              <textarea
                required
                rows={3}
                placeholder="Ex: Preciso usar nos dias selecionados no calendário. Pagamento via PIX."
                value={obsProposta}
                onChange={(e) => setObsProposta(e.target.value)}
                className="w-full bg-[#f8faf6] border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalPropostaVaga(null)}
                className="px-4 py-2 text-xs font-bold border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#2d5a32] hover:bg-[#1f4223] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition"
              >
                Enviar Reserva p/ Aprovação
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
