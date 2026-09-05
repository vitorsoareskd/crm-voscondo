import React, { useState, useEffect } from 'react';
import { TarefaEquipe, Condominio, AgendaEvent, TipoRecorrencia, GoogleConfig } from '../../types';
import { apiSaveTarefaEquipe, apiUpdateTarefaEquipe, apiDeleteTarefaEquipe } from '../../services/api';
import { 
  CheckSquare, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Copy, 
  Trash2, 
  CalendarClock, 
  Bell, 
  Repeat, 
  Calendar as CalendarIcon,
  Sparkles,
  Settings,
  RefreshCw,
  ExternalLink,
  Calendar,
  Layers,
  Search,
  Filter,
  X
} from 'lucide-react';
import { useAgendaNotifications } from '../../hooks/useAgendaNotifications';
import { 
  syncEventToGoogle, 
  syncAllAgendaEvents, 
  deleteCalendarEvent,
  generateGoogleCalendarWebUrl,
  downloadIcsFile
} from '../../services/GoogleCalendarService';
import { createOrUpdateGoogleTask, updateGoogleTaskStatus, syncAllTasksToGoogle, deleteGoogleTask } from '../../services/GoogleTasksService';
import { getStoredGoogleConfig, isGoogleTokenValid } from '../../services/googleAuth';
import { GoogleConfigModal } from './GoogleConfigModal';

interface TasksSectionProps {
  tarefas: TarefaEquipe[];
  setTarefas: React.Dispatch<React.SetStateAction<TarefaEquipe[]>>;
  agenda: AgendaEvent[];
  setAgenda: React.Dispatch<React.SetStateAction<AgendaEvent[]>>;
  condominios: Condominio[];
}

export const TasksSection: React.FC<TasksSectionProps> = ({ tarefas, setTarefas, agenda, setAgenda, condominios }) => {
  const [condoId, setCondoId] = useState(condominios[0]?.id || '');
  const [titulo, setTitulo] = useState('');
  const [prioridade, setPrioridade] = useState<TarefaEquipe['prioridade']>('Média');
  const [atribuido, setAtribuido] = useState('Equipe VOS');
  const [dataLimite, setDataLimite] = useState('2026-07-30');
  const [copiado, setCopiado] = useState(false);

  // ─── Filter State: Tarefas ────────────────────────────────────────────────
  const [filtroTarefaBusca, setFiltroTarefaBusca] = useState('');
  const [filtroTarefaCondo, setFiltroTarefaCondo] = useState('Todos');
  const [filtroTarefaPrioridade, setFiltroTarefaPrioridade] = useState('Todas');
  const [filtroTarefaStatus, setFiltroTarefaStatus] = useState('Todas');

  // ─── Filter State: Agenda ─────────────────────────────────────────────────
  const [filtroAgendaBusca, setFiltroAgendaBusca] = useState('');
  const [filtroAgendaCondo, setFiltroAgendaCondo] = useState('Todos');
  const [filtroAgendaPeriodo, setFiltroAgendaPeriodo] = useState('Todos');
  const [filtroAgendaRecorrencia, setFiltroAgendaRecorrencia] = useState('Todas');

  // ─── Google Integration State ─────────────────────────────────────────────
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig>(() => getStoredGoogleConfig());
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [syncingTasks, setSyncingTasks] = useState(false);
  const [syncingAgenda, setSyncingAgenda] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Agenda State
  const [activeTab, setActiveTab] = useState<'tarefas' | 'agenda'>('tarefas');
  const [agendaTitulo, setAgendaTitulo] = useState('');
  const [agendaDescricao, setAgendaDescricao] = useState('');
  const [agendaData, setAgendaData] = useState('');
  const [agendaHora, setAgendaHora] = useState('');
  const [agendaRecorrencia, setAgendaRecorrencia] = useState<TipoRecorrencia>('Nenhuma');
  const [agendaDataFinal, setAgendaDataFinal] = useState('');

  // Initialize background notifications hook
  useAgendaNotifications(agenda, setAgenda);

  const isGoogleConnected = isGoogleTokenValid(googleConfig);

  // ─── Derived filtered lists ───────────────────────────────────────────────
  const tarefasFiltradas = tarefas.filter(t => {
    const buscaOk = !filtroTarefaBusca ||
      t.titulo.toLowerCase().includes(filtroTarefaBusca.toLowerCase()) ||
      t.atribuidoPara.toLowerCase().includes(filtroTarefaBusca.toLowerCase()) ||
      t.condominioNome.toLowerCase().includes(filtroTarefaBusca.toLowerCase());
    const condoOk = filtroTarefaCondo === 'Todos' || t.condominioNome === filtroTarefaCondo;
    const priorOk = filtroTarefaPrioridade === 'Todas' || t.prioridade === filtroTarefaPrioridade;
    const statusOk = filtroTarefaStatus === 'Todas' ||
      (filtroTarefaStatus === 'Pendentes' && !t.concluida) ||
      (filtroTarefaStatus === 'Concluídas' && t.concluida) ||
      (filtroTarefaStatus === 'Google Tasks' && !!t.googleTaskId);
    return buscaOk && condoOk && priorOk && statusOk;
  });

  const agendaFiltrada = agenda.filter(ev => {
    const buscaOk = !filtroAgendaBusca ||
      ev.titulo.toLowerCase().includes(filtroAgendaBusca.toLowerCase()) ||
      (ev.descricao || '').toLowerCase().includes(filtroAgendaBusca.toLowerCase()) ||
      (ev.condominioNome || '').toLowerCase().includes(filtroAgendaBusca.toLowerCase());
    const condoOk = filtroAgendaCondo === 'Todos' || ev.condominioNome === filtroAgendaCondo;
    const recorrOk = filtroAgendaRecorrencia === 'Todas' || ev.recorrencia === filtroAgendaRecorrencia;
    const now = new Date();
    const evDate = new Date(ev.dataHora);
    const periodoOk = filtroAgendaPeriodo === 'Todos' ||
      (filtroAgendaPeriodo === 'Próximos 7 dias' && evDate >= now && evDate <= new Date(now.getTime() + 7 * 86400000)) ||
      (filtroAgendaPeriodo === 'Próximos 30 dias' && evDate >= now && evDate <= new Date(now.getTime() + 30 * 86400000)) ||
      (filtroAgendaPeriodo === 'Futuros' && evDate >= now) ||
      (filtroAgendaPeriodo === 'Passados' && evDate < now) ||
      (filtroAgendaPeriodo === 'Google Calendar' && !!ev.googleEventId);
    return buscaOk && condoOk && recorrOk && periodoOk;
  });

  const condosUnicos = ['Todos', ...Array.from(new Set(condominios.map(c => c.nome)))];
  const condosUnicosAgenda = ['Todos', ...Array.from(new Set(agenda.map(e => e.condominioNome || 'Geral')))];

  const hasFiltreTarefas = filtroTarefaBusca || filtroTarefaCondo !== 'Todos' || filtroTarefaPrioridade !== 'Todas' || filtroTarefaStatus !== 'Todas';
  const hasFiltreAgenda = filtroAgendaBusca || filtroAgendaCondo !== 'Todos' || filtroAgendaPeriodo !== 'Todos' || filtroAgendaRecorrencia !== 'Todas';

  const clearFiltrosTarefas = () => { setFiltroTarefaBusca(''); setFiltroTarefaCondo('Todos'); setFiltroTarefaPrioridade('Todas'); setFiltroTarefaStatus('Todas'); };
  const clearFiltrosAgenda = () => { setFiltroAgendaBusca(''); setFiltroAgendaCondo('Todos'); setFiltroAgendaPeriodo('Todos'); setFiltroAgendaRecorrencia('Todas'); };

  const showToast = (message: string) => {
    setSyncFeedback(message);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo) return;

    const condoObj = condominios.find((c) => c.id === condoId) || condominios[0];

    const nova: TarefaEquipe = {
      id: `TASK-${Math.floor(10 + Math.random() * 90)}`,
      condominioId: condoObj.id,
      condominioNome: condoObj.nome,
      titulo,
      prioridade,
      concluida: false,
      dataLimite,
      atribuidoPara: atribuido || 'Equipe VOS'
    };

    setTarefas([nova, ...tarefas]);
    apiSaveTarefaEquipe(nova).catch((err) => console.error('Erro ao salvar tarefa no SQLite:', err));
    setTitulo('');
  };

  const handleToggle = async (id: string) => {
    const task = tarefas.find(t => t.id === id);
    if (!task) return;

    const novoStatus = !task.concluida;

    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, concluida: novoStatus } : t))
    );
    apiUpdateTarefaEquipe(id, { ...task, concluida: novoStatus }).catch((err) =>
      console.error('Erro ao atualizar tarefa no SQLite:', err)
    );

    // Sync status change to Google Tasks in background if connected
    if (task.googleTaskId && isGoogleConnected && googleConfig.accessToken) {
      try {
        await updateGoogleTaskStatus(task.googleTaskId, novoStatus, googleConfig.accessToken);
      } catch (err) {
        console.warn('Falha ao atualizar status no Google Tasks:', err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const task = tarefas.find(t => t.id === id);
    if (task?.googleTaskId && isGoogleConnected && googleConfig.accessToken) {
      try {
        await deleteGoogleTask(task.googleTaskId, googleConfig.accessToken);
      } catch (err) {
        console.warn('Falha ao excluir do Google Tasks:', err);
      }
    }
    apiDeleteTarefaEquipe(id).catch((err) => console.error('Erro ao excluir tarefa do SQLite:', err));
    setTarefas((prev) => prev.filter((t) => t.id !== id));
  };

  // Google Tasks: Sync Single Task
  const handleSyncSingleTask = async (task: TarefaEquipe) => {
    if (!isGoogleConnected || !googleConfig.accessToken) {
      setShowGoogleModal(true);
      return;
    }

    try {
      const gTaskId = await createOrUpdateGoogleTask(task, googleConfig.accessToken);
      setTarefas(prev => prev.map(t => t.id === task.id ? { ...t, googleTaskId: gTaskId } : t));
      showToast(`Tarefa "${task.titulo}" sincronizada no Google Tasks!`);
    } catch (err: any) {
      alert(`Erro ao sincronizar com Google Tasks: ${err.message || err}`);
    }
  };

  // Google Tasks: Batch Sync All Tasks
  const handleSyncAllTasks = async () => {
    if (!isGoogleConnected || !googleConfig.accessToken) {
      setShowGoogleModal(true);
      return;
    }

    setSyncingTasks(true);
    try {
      const result = await syncAllTasksToGoogle(tarefas, googleConfig.accessToken);
      setTarefas(result.updatedTasks);
      showToast(`${result.countSuccess} tarefa(s) sincronizada(s) no Google Tasks com sucesso!`);
    } catch (err: any) {
      alert(`Erro no sincronismo em lote: ${err.message || err}`);
    } finally {
      setSyncingTasks(false);
    }
  };

  const handleAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitulo || !agendaData || !agendaHora) return;

    const condoObj = condominios.find((c) => c.id === condoId) || condominios[0];
    const dataHoraIso = `${agendaData}T${agendaHora}:00`;

    const novoEvento: AgendaEvent = {
      id: `AGENDA-${Math.floor(100 + Math.random() * 900)}`,
      condominioId: condoObj.id,
      condominioNome: condoObj.nome,
      titulo: agendaTitulo,
      descricao: agendaDescricao,
      dataHora: dataHoraIso,
      recorrencia: agendaRecorrencia,
      dataFinalRecorrencia: agendaRecorrencia !== 'Nenhuma' && agendaDataFinal ? agendaDataFinal : undefined,
      notificacaoEnviada5Dias: false,
      notificacaoEnviada1Dia: false,
      notificacaoEnviada2Horas: false,
    };

    setAgenda([novoEvento, ...agenda]);
    setAgendaTitulo('');
    setAgendaDescricao('');
    setAgendaData('');
    setAgendaHora('');
    setAgendaRecorrencia('Nenhuma');
    setAgendaDataFinal('');
  };

  const handleDeleteAgenda = async (id: string) => {
    const evento = agenda.find(e => e.id === id);
    if (evento?.googleEventId && isGoogleConnected && googleConfig.accessToken) {
      try {
        await deleteCalendarEvent(evento.googleEventId, googleConfig.accessToken);
      } catch (err) {
        console.warn('Falha ao excluir do Google Calendar:', err);
      }
    }
    setAgenda((prev) => prev.filter((ev) => ev.id !== id));
  };

  // Google Calendar: Sync Single Event
  const handleSyncGoogleCalendar = async (evento: AgendaEvent) => {
    if (!isGoogleConnected || !googleConfig.accessToken) {
      setShowGoogleModal(true);
      return;
    }

    try {
      const gEventId = await syncEventToGoogle(evento, googleConfig.accessToken);
      setAgenda(prev => prev.map(e => e.id === evento.id ? { ...e, googleEventId: gEventId } : e));
      showToast(`Evento "${evento.titulo}" sincronizado no Google Calendar!`);
    } catch (err: any) {
      alert(`Erro ao sincronizar com Google Calendar: ${err.message || err}`);
    }
  };

  // Google Calendar: Batch Sync All Events
  const handleSyncAllAgenda = async () => {
    if (!isGoogleConnected || !googleConfig.accessToken) {
      setShowGoogleModal(true);
      return;
    }

    setSyncingAgenda(true);
    try {
      const result = await syncAllAgendaEvents(agenda, googleConfig.accessToken);
      setAgenda(result.updatedEvents);
      showToast(`${result.countSuccess} evento(s) sincronizado(s) no Google Calendar!`);
    } catch (err: any) {
      alert(`Erro no sincronismo do Google Calendar: ${err.message || err}`);
    } finally {
      setSyncingAgenda(false);
    }
  };

  const handleCopiarParaGoogleTasks = () => {
    const pendentes = tarefas.filter((t) => !t.concluida);
    const texto = pendentes
      .map(
        (t) =>
          `[${t.prioridade}] ${t.titulo} (${t.condominioNome}) - Até: ${t.dataLimite} - Resp: ${t.atribuidoPara}`
      )
      .join('\n');

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback Notification */}
      {syncFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c3220] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{syncFeedback}</span>
        </div>
      )}

      {/* Top Banner with Google API Integration Bar */}
      <div className="bg-[#1c3220] text-white p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-[#2d5a32] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#2d5a32] p-3 rounded-xl shadow-xs">
            <CheckSquare className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Anotações, Tarefas & Agenda Inteligente</h3>
              {isGoogleConnected ? (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Google Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-bold rounded-full border border-white/20">
                  Google Desconectado
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Gerencie demandas operacionais e sincronize em tempo real com o Google Calendar & Google Tasks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Google Connection / Config Button */}
          <button
            onClick={() => setShowGoogleModal(true)}
            className={`text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              isGoogleConnected
                ? 'bg-[#2d5a32] hover:bg-[#254b29] text-white border border-emerald-400/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold animate-pulse'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>
              {isGoogleConnected 
                ? (googleConfig.userEmail ? `${googleConfig.userEmail.split('@')[0]} (Config API)` : 'Google Conectado')
                : 'Conectar Google API'}
            </span>
          </button>

          {/* Quick Copy Text Button */}
          <button
            onClick={handleCopiarParaGoogleTasks}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 border border-white/15 transition-all cursor-pointer"
            title="Copiar lista de tarefas para a área de transferência"
          >
            <Copy className="w-4 h-4" />
            <span>{copiado ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4 flex-wrap pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tarefas')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tarefas' 
                ? 'border-[#2d5a32] text-[#2d5a32]' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tarefas Operacionais ({tarefas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'agenda' 
                ? 'border-amber-600 text-amber-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Agenda Inteligente ({agenda.length})</span>
          </button>
        </div>

        {/* Action Button for Current Tab */}
        <div>
          {activeTab === 'tarefas' && (
            <button
              onClick={handleSyncAllTasks}
              disabled={syncingTasks}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {syncingTasks ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
              <span>Sincronizar Todas no Google Tasks</span>
            </button>
          )}

          {activeTab === 'agenda' && (
            <button
              onClick={handleSyncAllAgenda}
              disabled={syncingAgenda}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {syncingAgenda ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
              <span>Sincronizar Todos no Google Calendar</span>
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: TAREFAS OPERACIONAIS */}
      {activeTab === 'tarefas' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 border-b pb-2 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#2d5a32]" />
            Criar Nova Demanda Operacional
          </h4>

          <form onSubmit={handleAdd} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700">Condomínio *</label>
              <select
                value={condoId}
                onChange={(e) => setCondoId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs bg-white font-medium"
              >
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700">Descrição da Tarefa *</label>
              <textarea
                required
                rows={2}
                placeholder="Ex: Emitir balancete, verificar caixa d'água, agendar assembleia..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as TarefaEquipe['prioridade'])}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs bg-white font-medium"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">Data Limite</label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700">Atribuído Para</label>
              <input
                type="text"
                value={atribuido}
                onChange={(e) => setAtribuido(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Tarefa Operacional</span>
            </button>
          </form>
        </div>

        {/* Task Checklist List */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              Lista de Demandas da Operação
              <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full text-[11px]">
                {tarefasFiltradas.length}/{tarefas.length}
              </span>
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Concluídas: {tarefas.filter((t) => t.concluida).length} / {tarefas.length}
            </span>
          </div>

          {/* ── Filtros Tarefas ── */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Filter className="w-3.5 h-3.5" />
                Filtros
              </div>
              {hasFiltreTarefas && (
                <button
                  onClick={clearFiltrosTarefas}
                  className="text-[11px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Limpar Filtros
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Busca por Texto */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar tarefa, responsável..."
                  value={filtroTarefaBusca}
                  onChange={e => setFiltroTarefaBusca(e.target.value)}
                  className="text-xs outline-hidden bg-transparent flex-1 text-slate-700 placeholder:text-slate-400"
                />
                {filtroTarefaBusca && (
                  <button onClick={() => setFiltroTarefaBusca('')} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filtro Condomínio */}
              <select
                value={filtroTarefaCondo}
                onChange={e => setFiltroTarefaCondo(e.target.value)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-hidden cursor-pointer transition-colors ${
                  filtroTarefaCondo !== 'Todos' ? 'bg-[#e8f0e6] border-[#2d5a32] text-[#2d5a32]' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {condosUnicos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Filtro Prioridade */}
              <select
                value={filtroTarefaPrioridade}
                onChange={e => setFiltroTarefaPrioridade(e.target.value)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-hidden cursor-pointer transition-colors ${
                  filtroTarefaPrioridade !== 'Todas' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="Todas">Todas Prioridades</option>
                <option value="Alta">🔴 Alta</option>
                <option value="Média">🟡 Média</option>
                <option value="Baixa">🟢 Baixa</option>
              </select>

              {/* Filtro Status */}
              <select
                value={filtroTarefaStatus}
                onChange={e => setFiltroTarefaStatus(e.target.value)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-hidden cursor-pointer transition-colors ${
                  filtroTarefaStatus !== 'Todas' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="Todas">Todos Status</option>
                <option value="Pendentes">⏳ Pendentes</option>
                <option value="Concluídas">✅ Concluídas</option>
                <option value="Google Tasks">🔵 No Google Tasks</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {tarefasFiltradas.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400">
                <CheckSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                {tarefas.length === 0 ? (
                  <p>Nenhuma tarefa cadastrada ainda.</p>
                ) : (
                  <>
                    <p className="font-bold text-slate-500">Nenhuma tarefa corresponde aos filtros.</p>
                    <button onClick={clearFiltrosTarefas} className="text-xs text-[#2d5a32] font-bold mt-1 hover:underline cursor-pointer">Limpar filtros</button>
                  </>
                )}
              </div>
            ) : (
              tarefasFiltradas.map((t) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    t.concluida 
                      ? 'bg-slate-50/80 border-slate-200 opacity-60' 
                      : 'bg-white border-slate-200 hover:border-emerald-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button 
                      onClick={() => handleToggle(t.id)} 
                      className="text-emerald-700 focus:outline-hidden cursor-pointer shrink-0"
                      title={t.concluida ? 'Marcar como pendente' : 'Concluir tarefa'}
                    >
                      {t.concluida ? <CheckCircle2 className="w-5 h-5 fill-emerald-100" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className={`font-semibold text-xs text-slate-900 block truncate ${t.concluida ? 'line-through' : ''}`}>
                        {t.titulo}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-bold text-[#2d5a32] bg-[#e8f0e6] px-1.5 py-0.5 rounded">
                          {t.condominioNome}
                        </span>
                        <span>•</span>
                        <span>Resp: {t.atribuidoPara}</span>
                        <span>•</span>
                        <span>Até: {t.dataLimite}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Google Tasks Sync Indicator / Button */}
                    <button
                      onClick={() => handleSyncSingleTask(t)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                        t.googleTaskId
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={t.googleTaskId ? 'Sincronizada com o Google Tasks' : 'Clique para enviar ao Google Tasks'}
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>{t.googleTaskId ? 'No Google Tasks' : 'Sincronizar'}</span>
                    </button>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.prioridade === 'Alta'
                          ? 'bg-red-100 text-red-800'
                          : t.prioridade === 'Média'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.prioridade}
                    </span>
                    <button 
                      onClick={() => handleDelete(t.id)} 
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* SUBTAB 2: AGENDA INTELIGENTE */}
      {activeTab === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Agenda Form */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 border-b pb-2 text-sm flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-600" /> 
              Novo Lembrete / Evento
            </h4>
            <form onSubmit={handleAddAgenda} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Condomínio *</label>
                <select 
                  value={condoId} 
                  onChange={(e) => setCondoId(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-xs bg-white font-medium"
                >
                  {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block font-bold mb-1 text-slate-700">Título do Evento *</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: Assembleia Geral Ordinária, Vistoria AVCB..." 
                  value={agendaTitulo} 
                  onChange={(e) => setAgendaTitulo(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-xs" 
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">Descrição / Pauta</label>
                <textarea 
                  rows={2} 
                  placeholder="Pauta da reunião, fornecedor responsável ou detalhes..." 
                  value={agendaDescricao} 
                  onChange={(e) => setAgendaDescricao(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Data *</label>
                  <input 
                    required 
                    type="date" 
                    value={agendaData} 
                    onChange={(e) => setAgendaData(e.target.value)} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-xs bg-white font-medium" 
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Hora *</label>
                  <input 
                    required 
                    type="time" 
                    value={agendaHora} 
                    onChange={(e) => setAgendaHora(e.target.value)} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-xs bg-white font-medium" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 flex items-center gap-1">
                    <Repeat className="w-3 h-3 text-slate-500"/> Repetição
                  </label>
                  <select 
                    value={agendaRecorrencia} 
                    onChange={(e) => setAgendaRecorrencia(e.target.value as TipoRecorrencia)} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden text-xs bg-white font-medium"
                  >
                    <option value="Nenhuma">Nenhuma</option>
                    <option value="Diária">Diária</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
                
                {agendaRecorrencia !== 'Nenhuma' && (
                  <div>
                    <label className="block font-bold mb-1 text-slate-700">Data Final</label>
                    <input 
                      type="date" 
                      value={agendaDataFinal} 
                      onChange={(e) => setAgendaDataFinal(e.target.value)} 
                      min={agendaData}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden text-xs font-medium" 
                    />
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> 
                <span>Adicionar à Agenda</span>
              </button>
            </form>
          </div>

          {/* Agenda List */}
          <div className="lg:col-span-8 space-y-4">

            {/* ── Filtros Agenda ── */}
            {agenda.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <Filter className="w-3.5 h-3.5" />
                    Filtros da Agenda
                    <span className="bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                      {agendaFiltrada.length}/{agenda.length}
                    </span>
                  </div>
                  {hasFiltreAgenda && (
                    <button
                      onClick={clearFiltrosAgenda}
                      className="text-[11px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Limpar Filtros
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Busca por Texto */}
                  <div className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 flex-1 min-w-[160px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar evento, condomínio..."
                      value={filtroAgendaBusca}
                      onChange={e => setFiltroAgendaBusca(e.target.value)}
                      className="text-xs outline-hidden bg-transparent flex-1 text-slate-700 placeholder:text-slate-400"
                    />
                    {filtroAgendaBusca && (
                      <button onClick={() => setFiltroAgendaBusca('')} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filtro Condomínio */}
                  <select
                    value={filtroAgendaCondo}
                    onChange={e => setFiltroAgendaCondo(e.target.value)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-hidden cursor-pointer transition-colors ${
                      filtroAgendaCondo !== 'Todos' ? 'bg-[#e8f0e6] border-[#2d5a32] text-[#2d5a32]' : 'bg-white border-amber-200 text-slate-700'
                    }`}
                  >
                    {condosUnicosAgenda.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  {/* Filtro Período */}
                  <select
                    value={filtroAgendaPeriodo}
                    onChange={e => setFiltroAgendaPeriodo(e.target.value)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-hidden cursor-pointer transition-colors ${
                      filtroAgendaPeriodo !== 'Todos' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-amber-200 text-slate-700'
                    }`}
                  >
                    <option value="Todos">📅 Todos os Períodos</option>
                    <option value="Próximos 7 dias">⚡ Próximos 7 dias</option>
                    <option value="Próximos 30 dias">🗓️ Próximos 30 dias</option>
                    <option value="Futuros">🔮 Eventos Futuros</option>
                    <option value="Passados">📚 Eventos Passados</option>
                    <option value="Google Calendar">📌 No Google Calendar</option>
                  </select>

                  {/* Filtro Recorrência */}
                  <select
                    value={filtroAgendaRecorrencia}
                    onChange={e => setFiltroAgendaRecorrencia(e.target.value)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-hidden cursor-pointer transition-colors ${
                      filtroAgendaRecorrencia !== 'Todas' ? 'bg-amber-100 border-amber-400 text-amber-800' : 'bg-white border-amber-200 text-slate-700'
                    }`}
                  >
                    <option value="Todas">🔁 Toda Recorrência</option>
                    <option value="Nenhuma">— Sem Repetição</option>
                    <option value="Diária">📆 Diária</option>
                    <option value="Semanal">🗓️ Semanal</option>
                    <option value="Mensal">📅 Mensal</option>
                    <option value="Anual">🗓️ Anual</option>
                  </select>
                </div>
              </div>
            )}

            {agendaFiltrada.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                <CalendarClock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                {agenda.length === 0 ? (
                  <>
                    <h5 className="font-bold text-slate-700 text-sm">Nenhum evento na agenda</h5>
                    <p className="text-xs text-slate-500 mt-1">Cadastre reuniões, vistorias e compromissos para receber alertas automáticos.</p>
                  </>
                ) : (
                  <>
                    <h5 className="font-bold text-slate-700 text-sm">Nenhum evento corresponde aos filtros</h5>
                    <button onClick={clearFiltrosAgenda} className="text-xs text-amber-600 font-bold mt-2 hover:underline cursor-pointer">Limpar filtros</button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
                {agendaFiltrada.map((evento) => (
                  <div 
                    key={evento.id} 
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{evento.titulo}</h4>
                        <button 
                          onClick={() => handleDeleteAgenda(evento.id)} 
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Excluir evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mb-2">
                        <span className="font-bold text-[#2d5a32] bg-[#e8f0e6] px-2 py-0.5 rounded text-[10px]">
                          {evento.condominioNome || 'Geral'}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Data: <strong>{new Date(evento.dataHora).toLocaleString('pt-BR')}</strong></span>
                        </div>
                        {evento.recorrencia !== 'Nenhuma' && (
                          <div className="flex items-center gap-1.5 text-amber-700">
                            <Repeat className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Repete: <strong>{evento.recorrencia}</strong>
                              {evento.dataFinalRecorrencia && ` (Até: ${new Date(evento.dataFinalRecorrencia + 'T12:00:00').toLocaleDateString('pt-BR')})`}
                            </span>
                          </div>
                        )}
                        {evento.descricao && (
                          <p className="text-xs font-sans text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1.5 break-words">
                            {evento.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5" title="Status dos alertas automáticos (5d, 1d, 2h)">
                        <Bell className={`w-3.5 h-3.5 ${evento.notificacaoEnviada5Dias ? 'text-emerald-500 fill-emerald-100' : 'text-slate-300'}`} title="Alerta 5 dias antes" />
                        <Bell className={`w-3.5 h-3.5 ${evento.notificacaoEnviada1Dia ? 'text-emerald-500 fill-emerald-100' : 'text-slate-300'}`} title="Alerta 1 dia antes" />
                        <Bell className={`w-3.5 h-3.5 ${evento.notificacaoEnviada2Horas ? 'text-amber-500 fill-amber-100' : 'text-slate-300'}`} title="Alerta 2 horas antes" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Direct Google Calendar Web Link (Zero setup required) */}
                        <a
                          href={generateGoogleCalendarWebUrl(evento)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                          title="Abrir e salvar diretamente no seu Google Agenda Web (sem precisar de chaves)"
                        >
                          <ExternalLink className="w-3 h-3 text-[#2d5a32]" />
                          <span>Google Web</span>
                        </a>

                        {/* API Sync Button */}
                        <button
                          onClick={() => handleSyncGoogleCalendar(evento)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                            evento.googleEventId 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="Sincronizar via API oficial em segundo plano"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{evento.googleEventId ? 'No Calendar API' : 'Sincronizar API'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Config Modal */}
      {showGoogleModal && (
        <GoogleConfigModal 
          onClose={() => setShowGoogleModal(false)} 
          onConfigUpdated={(cfg) => setGoogleConfig(cfg)}
        />
      )}

    </div>
  );
};
