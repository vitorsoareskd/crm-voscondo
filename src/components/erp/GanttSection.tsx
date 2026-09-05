import React, { useState } from 'react';
import { TarefaGantt, Condominio } from '../../types';
import { apiSaveTarefaGantt, apiUpdateTarefaGantt, apiDeleteTarefaGantt } from '../../services/api';
import { Calendar, Plus, Clock, CheckCircle2, AlertTriangle, Layers, Printer, FileText, Download, Check, X, Building2, Sparkles, BarChart3, ShieldCheck, Trash2 } from 'lucide-react';
import { VosLogo } from '../VosLogo';

interface GanttSectionProps {
  tarefas: TarefaGantt[];
  setTarefas: React.Dispatch<React.SetStateAction<TarefaGantt[]>>;
  condominios: Condominio[];
}

export const GanttSection: React.FC<GanttSectionProps> = ({ tarefas, setTarefas, condominios }) => {
  const [condoFiltro, setCondoFiltro] = useState('todos');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<TarefaGantt | null>(null);

  const handleConfirmExcluir = () => {
    if (itemParaExcluir) {
      apiDeleteTarefaGantt(itemParaExcluir.id).catch((err) => console.error('Erro ao excluir tarefa Gantt do SQLite:', err));
      setTarefas((prev) => prev.filter((t) => t.id !== itemParaExcluir.id));
      setItemParaExcluir(null);
    }
  };

  // New task form state
  const [condoId, setCondoId] = useState(condominios[0]?.id || '');
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<TarefaGantt['categoria']>('Reforma');
  const [inicio, setInicio] = useState('2026-08-01');
  const [fim, setFim] = useState('2026-09-30');
  const [responsavel, setResponsavel] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo) return;

    const condoObj = condominios.find((c) => c.id === condoId) || condominios[0];

    const novaTarefa: TarefaGantt = {
      id: `GANTT-${Math.floor(10 + Math.random() * 90)}`,
      condominioId: condoObj.id,
      condominioNome: condoObj.nome,
      titulo,
      categoria,
      dataInicio: inicio,
      dataFim: fim,
      progresso: 0,
      status: 'Planejado',
      responsavel: responsavel || 'Equipe VOS'
    };

    setTarefas([novaTarefa, ...tarefas]);
    apiSaveTarefaGantt(novaTarefa).catch((err) => console.error('Erro ao salvar tarefa Gantt no SQLite:', err));
    setTitulo('');
    setResponsavel('');
  };

  const handleUpdateProgresso = (id: string, novoProgresso: number) => {
    setTarefas((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          let status = t.status;
          if (novoProgresso === 100) status = 'Concluído';
          else if (novoProgresso > 0) status = 'Em Andamento';
          return { ...t, progresso: novoProgresso, status };
        }
        return t;
      });
      const target = updated.find((t) => t.id === id);
      if (target) {
        apiUpdateTarefaGantt(id, target).catch((err) => console.error('Erro ao atualizar tarefa Gantt no SQLite:', err));
      }
      return updated;
    });
  };

  const tarefasFiltradas = tarefas.filter(
    (t) => condoFiltro === 'todos' || t.condominioId === condoFiltro
  );

  const condoSelecionadoObj = condominios.find((c) => c.id === condoFiltro);
  const condoFiltroNome = condoFiltro === 'todos' ? 'Todos os Condomínios' : (condoSelecionadoObj?.nome || 'Condomínio Selecionado');

  // Stats calculation
  const totalTarefas = tarefasFiltradas.length;
  const concluidas = tarefasFiltradas.filter((t) => t.status === 'Concluído').length;
  const emAndamento = tarefasFiltradas.filter((t) => t.status === 'Em Andamento').length;
  const progressoMedio = totalTarefas > 0
    ? Math.round(tarefasFiltradas.reduce((acc, curr) => acc + curr.progresso, 0) / totalTarefas)
    : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const el = document.getElementById('printable-gantt-doc');
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-[#1c3220] text-base">Cronograma de Obras & Reformas (Gráfico de Gantt)</h3>
          <p className="text-xs text-slate-500">Planejamento financeiro e execução de longo prazo para os prédios</p>
        </div>

        <select
          value={condoFiltro}
          onChange={(e) => setCondoFiltro(e.target.value)}
          className="p-2 border rounded-xl text-xs font-semibold bg-slate-50"
        >
          <option value="todos">Todos os Condomínios</option>
          {condominios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form to Add New Gantt Event */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 border-b pb-2 text-sm">Nova Ocorrência no Cronograma</h4>

          <form onSubmit={handleAdd} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Condomínio *</label>
              <select
                value={condoId}
                onChange={(e) => setCondoId(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Título da Obra / Serviço *</label>
              <input
                type="text"
                required
                placeholder="Ex: Pintura de Fachada / AVCB"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as TarefaGantt['categoria'])}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Reforma">Reforma</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Laudo/Vistoria">Laudo/Vistoria</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Empresa / Responsável</label>
                <input
                  type="text"
                  placeholder="Nome do Engenheiro/Empresa"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1">Data Início *</label>
                <input
                  type="date"
                  required
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Data Previsão Fim *</label>
                <input
                  type="date"
                  required
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl shadow-xs"
            >
              Adicionar ao Gantt
            </button>
          </form>
        </div>

        {/* Visual Gantt Chart List */}
        <div className="lg:col-span-8 space-y-4">
          {tarefasFiltradas.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 italic">
              Nenhum item encontrado no cronograma para o filtro selecionado.
            </div>
          ) : (
            tarefasFiltradas.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-[#2d5a32] bg-[#e8f0e6] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {item.categoria} • {item.condominioNome}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{item.titulo}</h4>
                    <p className="text-xs text-slate-500">
                      Responsável: <strong className="text-slate-700">{item.responsavel}</strong>
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-right">
                    <div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          item.status === 'Concluído'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Em Andamento'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                        {item.dataInicio} até {item.dataFim}
                      </span>
                    </div>
                    <button
                      onClick={() => setItemParaExcluir(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir ocorrência do cronograma"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress & Gantt Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Progresso da Execução</span>
                    <span className="font-mono font-bold text-[#2d5a32]">{item.progresso}%</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border">
                    <div
                      className="bg-[#2d5a32] h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.progresso}%` }}
                    ></div>
                  </div>

                  {/* Quick Slider to update progress */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-[10px] text-slate-400">Atualizar %:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={item.progresso}
                      onChange={(e) => handleUpdateProgresso(item.id, parseInt(e.target.value))}
                      className="w-32 accent-[#2d5a32]"
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* BOTÃO ABAIXO DO ÚLTIMO ITEM NO CRONOGRAMA DE GANTT PARA GERAR PDF */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-[#1c3220] to-[#2d5a32] p-4 sm:p-5 rounded-2xl shadow-md text-white border border-emerald-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-800/80 rounded-xl text-emerald-200 border border-emerald-600/50">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-50">Relatório de Cronograma em PDF</h4>
                <p className="text-xs text-emerald-200/80">
                  Exportar documento do gráfico de Gantt ({condoFiltroNome})
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPdfModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Gerar PDF do Cronograma</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL / DOCUMENTO DE IMPRESSÃO EM PDF DO GANTT */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-900/10">
            
            {/* Header Controls (Hidden on print) */}
            <div className="bg-[#1c3220] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-800/80 p-2 rounded-lg border border-emerald-600/40">
                  <FileText className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-50">Relatório Oficial de Cronograma Gantt</h2>
                  <p className="text-xs text-emerald-200/80">{condoFiltroNome} • Emitido em {dataAtual}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-emerald-100 text-xs px-3 py-1.5 rounded-lg border border-emerald-600/50 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs px-4 py-1.5 rounded-lg font-bold shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 text-emerald-200/70 hover:text-white hover:bg-emerald-900/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content Scroll Area */}
            <div className="p-6 sm:p-10 overflow-y-auto bg-[#fafbfc] text-slate-800 flex-1 font-sans text-sm print:p-0 print:bg-white print:overflow-visible">
              <div id="printable-gantt-doc" className="bg-white p-8 sm:p-12 rounded-xl shadow-xs border border-slate-200 print:border-none print:shadow-none print:p-0 max-w-3xl mx-auto space-y-8">
                
                {/* Header Logo & Document Title */}
                <div className="flex items-start justify-between border-b pb-6 border-emerald-900/10">
                  <VosLogo variant="header" onDarkBg={false} size="lg" />
                  <div className="text-right text-xs text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-700">Data de Emissão: {dataAtual}</p>
                    <p className="font-semibold text-emerald-800">VOS CONDO ADMINISTRADORA</p>
                    <p>CNPJ: 66.072.162/0001-43</p>
                  </div>
                </div>

                <div className="text-center space-y-2 py-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#2d5a32] bg-[#e8f0e6] px-3 py-1 rounded-full">
                    Relatório Físico-Financeiro de Engenharia & Obras
                  </span>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    CRONOGRAMA DE GANTT DE OBRAS & REFORMAS
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold">
                    Filtro / Condomínio: <span className="text-[#2d5a32] font-bold">{condoFiltroNome}</span>
                  </p>
                </div>

                {/* KPI Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8faf6] p-4 rounded-xl border border-[#2d5a32]/20">
                  <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Total Ocorrências</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{totalTarefas}</span>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Concluídas</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">{concluidas}</span>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Em Andamento</span>
                    <span className="text-lg font-black text-blue-700 font-mono">{emAndamento}</span>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Progresso Médio</span>
                    <span className="text-lg font-black text-[#2d5a32] font-mono">{progressoMedio}%</span>
                  </div>
                </div>

                {/* Detailed Gantt Schedule Table */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm border-b pb-2 flex items-center justify-between">
                    <span>Atividades & Obras Mapeadas</span>
                    <span className="text-xs font-normal text-slate-500">{tarefasFiltradas.length} itens no cronograma</span>
                  </h3>

                  {tarefasFiltradas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum item listado para este relatório.</p>
                  ) : (
                    <div className="space-y-4">
                      {tarefasFiltradas.map((item, index) => (
                        <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-slate-400">#{index + 1}</span>
                                <span className="text-[10px] font-bold text-[#2d5a32] bg-[#e8f0e6] px-2 py-0.5 rounded-md uppercase">
                                  {item.categoria}
                                </span>
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {item.condominioNome}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm mt-1">{item.titulo}</h4>
                              <p className="text-xs text-slate-500">
                                Responsável / Executor: <strong className="text-slate-800">{item.responsavel}</strong>
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
                                {item.status}
                              </span>
                              <span className="block text-[11px] font-mono text-slate-500 mt-1">
                                {item.dataInicio} ~ {item.dataFim}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar in PDF */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500">Progresso físico de execução:</span>
                              <span className="font-mono font-bold text-[#2d5a32]">{item.progresso}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border">
                              <div
                                className="bg-[#2d5a32] h-full rounded-full"
                                style={{ width: `${item.progresso}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Signatures Block */}
                <div className="pt-10 grid grid-cols-2 gap-8 border-t border-slate-200 text-center text-xs text-slate-600">
                  <div className="space-y-2">
                    <div className="border-b border-slate-400 w-48 mx-auto h-8"></div>
                    <p className="font-bold text-slate-900">Engenheiro / Responsável Técnico</p>
                    <p className="text-[11px] text-slate-400">CREA / A.R.T. da Obra</p>
                  </div>
                  <div className="space-y-2">
                    <div className="border-b border-slate-400 w-48 mx-auto h-8"></div>
                    <p className="font-bold text-slate-900">Síndico / VOS Administradora</p>
                    <p className="text-[11px] text-slate-400">Aprovação do Cronograma</p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                  <p>VOS CONDO ADMINISTRADORA DE CONDOMÍNIOS • Relatório Gerado em {dataAtual}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão de Ocorrência no Cronograma Gantt */}
      {itemParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Ocorrência do Cronograma?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tem certeza que deseja remover <strong className="text-slate-800">"{itemParaExcluir.titulo}"</strong> ({itemParaExcluir.condominioNome}) do gráfico de Gantt?
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
                onClick={handleConfirmExcluir}
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
