import React, { useState } from 'react';
import { TarefaEquipe, Condominio } from '../../types';
import { CheckSquare, Plus, CheckCircle2, Circle, ExternalLink, Share2, Copy, Trash2 } from 'lucide-react';

interface TasksSectionProps {
  tarefas: TarefaEquipe[];
  setTarefas: React.Dispatch<React.SetStateAction<TarefaEquipe[]>>;
  condominios: Condominio[];
}

export const TasksSection: React.FC<TasksSectionProps> = ({ tarefas, setTarefas, condominios }) => {
  const [condoId, setCondoId] = useState(condominios[0]?.id || '');
  const [titulo, setTitulo] = useState('');
  const [prioridade, setPrioridade] = useState<TarefaEquipe['prioridade']>('Média');
  const [atribuido, setAtribuido] = useState('Equipe VOS');
  const [dataLimite, setDataLimite] = useState('2026-07-30');
  const [copiado, setCopiado] = useState(false);

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
    setTitulo('');
  };

  const handleToggle = (id: string) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t))
    );
  };

  const handleDelete = (id: string) => {
    setTarefas((prev) => prev.filter((t) => t.id !== id));
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
      {/* Top Banner with Google Tasks Export */}
      <div className="bg-[#1c3220] text-white p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-[#2d5a32]">
        <div className="flex items-center gap-3">
          <div className="bg-[#2d5a32] p-3 rounded-xl">
            <CheckSquare className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Anotações & Tarefas da Operação</h3>
            <p className="text-xs text-emerald-200/80">
              Gerencie demandas do condomínio e sincronize diretamente com o Google Tasks da equipe
            </p>
          </div>
        </div>

        <button
          onClick={handleCopiarParaGoogleTasks}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all"
        >
          <Copy className="w-4 h-4" />
          <span>{copiado ? 'Copiado para Google Tasks!' : 'Exportar para Google Tasks'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 border-b pb-2 text-sm">Criar Nova Demanda Operacional</h4>

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
              <label className="block font-bold mb-1">Descrição da Tarefa *</label>
              <textarea
                required
                rows={2}
                placeholder="Ex: Emitir balancete, verificar caixa d'água..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as TarefaEquipe['prioridade'])}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Data Limite</label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Atribuído Para</label>
              <input
                type="text"
                value={atribuido}
                onChange={(e) => setAtribuido(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl shadow-xs"
            >
              Criar Tarefa Operacional
            </button>
          </form>
        </div>

        {/* Task Checklist List */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h4 className="font-bold text-slate-900 text-sm">Lista de Checklist da Operação ({tarefas.length})</h4>
            <span className="text-xs text-slate-500 font-medium">
              Concluídas: {tarefas.filter((t) => t.concluida).length} / {tarefas.length}
            </span>
          </div>

          <div className="space-y-2">
            {tarefas.map((t) => (
              <div
                key={t.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  t.concluida ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggle(t.id)} className="text-emerald-700 focus:outline-hidden">
                    {t.concluida ? <CheckCircle2 className="w-5 h-5 fill-emerald-100" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div>
                    <span className={`font-semibold text-xs text-slate-900 ${t.concluida ? 'line-through' : ''}`}>
                      {t.titulo}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-bold text-[#2d5a32]">{t.condominioNome}</span>
                      <span>•</span>
                      <span>Resp: {t.atribuidoPara}</span>
                      <span>•</span>
                      <span>Até: {t.dataLimite}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                  <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
