import React, { useState } from 'react';
import { Inadimplente, Condominio } from '../../types';
import { apiSaveInadimplente, apiUpdateInadimplente, apiDeleteInadimplente } from '../../services/api';
import { formatarMoeda } from '../../utils/pricingEngine';
import { AlertCircle, Plus, PhoneCall, ShieldAlert, CheckCircle2, Search, Trash2 } from 'lucide-react';

interface InadimplenciaSectionProps {
  inadimplentes: Inadimplente[];
  setInadimplentes: React.Dispatch<React.SetStateAction<Inadimplente[]>>;
  condominios: Condominio[];
}

export const InadimplenciaSection: React.FC<InadimplenciaSectionProps> = ({
  inadimplentes,
  setInadimplentes,
  condominios
}) => {
  const [busca, setBusca] = useState('');
  const [condoFiltro, setCondoFiltro] = useState('todos');
  const [itemParaExcluir, setItemParaExcluir] = useState<Inadimplente | null>(null);

  // Form
  const [condoId, setCondoId] = useState(condominios[0]?.id || '');
  const [unidade, setUnidade] = useState('');
  const [morador, setMorador] = useState('');
  const [valor, setValor] = useState('');
  const [meses, setMeses] = useState(1);
  const [statusCobranca, setStatusCobranca] = useState<Inadimplente['statusCobranca']>('Amigável');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidade || !morador || !valor) return;

    const condoSelected = condominios.find((c) => c.id === condoId) || condominios[0];

    const novoInad: Inadimplente = {
      id: `INAD-${Math.floor(10 + Math.random() * 90)}`,
      condominioId: condoSelected.id,
      condominioNome: condoSelected.nome,
      unidade,
      moradorNome: morador,
      valorDevido: parseFloat(valor) || 0,
      mesesAtraso: Number(meses),
      statusCobranca,
      dataUltimoContato: new Date().toISOString().split('T')[0]
    };

    setInadimplentes([novoInad, ...inadimplentes]);
    apiSaveInadimplente(novoInad).catch((err) => console.error('Erro ao salvar inadimplente no SQLite:', err));
    setUnidade('');
    setMorador('');
    setValor('');
  };

  const handleAtualizarStatus = (id: string, novoStatus: Inadimplente['statusCobranca']) => {
    setInadimplentes((prev) => {
      const updated = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              statusCobranca: novoStatus,
              dataUltimoContato: new Date().toISOString().split('T')[0]
            }
          : item
      );
      const target = updated.find((i) => i.id === id);
      if (target) {
        apiUpdateInadimplente(id, target).catch((err) => console.error('Erro ao atualizar inadimplente no SQLite:', err));
      }
      return updated;
    });
  };

  const handleConfirmExcluir = () => {
    if (itemParaExcluir) {
      apiDeleteInadimplente(itemParaExcluir.id).catch((err) => console.error('Erro ao excluir inadimplente no SQLite:', err));
      setInadimplentes((prev) => prev.filter((item) => item.id !== itemParaExcluir.id));
      setItemParaExcluir(null);
    }
  };

  const listaFiltrada = inadimplentes.filter((item) => {
    const matchBusca =
      item.moradorNome.toLowerCase().includes(busca.toLowerCase()) ||
      item.unidade.toLowerCase().includes(busca.toLowerCase()) ||
      item.condominioNome.toLowerCase().includes(busca.toLowerCase());
    const matchCondo = condoFiltro === 'todos' || item.condominioId === condoFiltro;
    return matchBusca && matchCondo;
  });

  const totalEmAtraso = listaFiltrada.reduce((acc, curr) => acc + curr.valorDevido, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Total em Atraso Monitorado</span>
            <p className="text-2xl font-black text-red-600 font-mono mt-1">{formatarMoeda(totalEmAtraso)}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-xl text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Ocorrências Ativas</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{listaFiltrada.length} unidades</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Recuperação Extrajudicial</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">SLA Ativo</p>
          </div>
          <div className="bg-[#e8f0e6] p-3 rounded-xl text-[#2d5a32]">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form to Register Inadimplente */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-[#1c3220] text-base">Registrar Novo Atraso</h3>
            <p className="text-xs text-slate-500">Inicie o acompanhamento de cobrança de taxa condominial</p>
          </div>

          <form onSubmit={handleAdd} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Condomínio *</label>
              <select
                value={condoId}
                onChange={(e) => setCondoId(e.target.value)}
                className="w-full p-2 border rounded-lg font-medium"
              >
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1">Unidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apto 302"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Valor Devido (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="1200.00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Nome do Morador / Proprietário *</label>
              <input
                type="text"
                required
                placeholder="Nome completo"
                value={morador}
                onChange={(e) => setMorador(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1">Meses em Atraso</label>
                <input
                  type="number"
                  min={1}
                  value={meses}
                  onChange={(e) => setMeses(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Status da Cobrança</label>
                <select
                  value={statusCobranca}
                  onChange={(e) => setStatusCobranca(e.target.value as Inadimplente['statusCobranca'])}
                  className="w-full p-2 border rounded-lg font-semibold"
                >
                  <option value="Amigável">Amigável</option>
                  <option value="Notificação Enviada">Notificação Enviada</option>
                  <option value="Acordo em Andamento">Acordo em Andamento</option>
                  <option value="Cobrança Judicial">Cobrança Judicial</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar ao Painel</span>
            </button>
          </form>
        </div>

        {/* Table List of Inadimplentes */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <h3 className="font-bold text-[#1c3220] text-base">Painel de Acompanhamento de Cobrança</h3>
            
            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar unidade/morador..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border rounded-lg text-xs w-48"
                />
              </div>

              <select
                value={condoFiltro}
                onChange={(e) => setCondoFiltro(e.target.value)}
                className="py-1.5 px-3 border rounded-lg text-xs font-medium"
              >
                <option value="todos">Todos os Prédios</option>
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f0f4ef] text-[#1c3220] font-bold">
                <tr>
                  <th className="p-3">Condomínio & Unidade</th>
                  <th className="p-3">Morador</th>
                  <th className="p-3">Atraso</th>
                  <th className="p-3">Valor Devido</th>
                  <th className="p-3">Status Cobrança</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaFiltrada.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{item.unidade}</span>
                      <span className="text-[11px] text-slate-500">{item.condominioNome}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{item.moradorNome}</td>
                    <td className="p-3">
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {item.mesesAtraso} {item.mesesAtraso === 1 ? 'mês' : 'meses'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-red-600 text-sm">
                      {formatarMoeda(item.valorDevido)}
                    </td>
                    <td className="p-3">
                      <select
                        value={item.statusCobranca}
                        onChange={(e) => handleAtualizarStatus(item.id, e.target.value as Inadimplente['statusCobranca'])}
                        className={`p-1 rounded font-bold text-[10px] border ${
                          item.statusCobranca === 'Amigável'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : item.statusCobranca === 'Notificação Enviada'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : item.statusCobranca === 'Acordo em Andamento'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        <option value="Amigável">Amigável</option>
                        <option value="Notificação Enviada">Notificação Enviada</option>
                        <option value="Acordo em Andamento">Acordo em Andamento</option>
                        <option value="Cobrança Judicial">Cobrança Judicial</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Último: {item.dataUltimoContato}
                        </span>
                        <button
                          onClick={() => setItemParaExcluir(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir item de cobrança"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Confirmar Exclusao */}
      {itemParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Registro de Cobrança?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tem certeza que deseja remover o registro de <strong className="text-slate-800">{itemParaExcluir.unidade} - {itemParaExcluir.moradorNome}</strong> do painel?
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
