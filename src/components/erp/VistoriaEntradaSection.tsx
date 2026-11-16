import React, { useState, useEffect } from 'react';
import { ItemVistoria } from '../../types';
import { subscribeToCollection, saveCollectionToFirestore } from '../../lib/firebase';
import { FileDown, Plus, Trash2, ClipboardCheck } from 'lucide-react';

const INITIAL_VISTORIAS: ItemVistoria[] = [];

export const VistoriaEntradaSection: React.FC = () => {
  const [itens, setItens] = useState<ItemVistoria[]>(() => {
    try {
      const saved = localStorage.getItem('vos_vistorias_entrada');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_VISTORIAS;
    } catch {
      return INITIAL_VISTORIAS;
    }
  });

  useEffect(() => {
    const unsub = subscribeToCollection<ItemVistoria>('vistoriasEntrada', (data) => setItens(data), INITIAL_VISTORIAS);
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('vos_vistorias_entrada', JSON.stringify(itens));
      saveCollectionToFirestore('vistoriasEntrada', itens);
    } catch {}
  }, [itens]);

  const [condominioNome, setCondominioNome] = useState('Residencial Cabral Cruz');
  const [area, setArea] = useState<ItemVistoria['area']>('Fachada');
  const [descricaoPassivo, setDescricaoPassivo] = useState('');
  const [gravidade, setGravidade] = useState<ItemVistoria['gravidade']>('Médio');
  const [acaoRecomendada, setAcaoRecomendada] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | undefined>();

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const adicionarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricaoPassivo.trim()) return;
    setItens((prev) => [
      {
        id: `v-${Date.now()}`,
        condominioNome: condominioNome.trim() || 'Condomínio',
        area,
        descricaoPassivo: descricaoPassivo.trim(),
        gravidade,
        acaoRecomendada: acaoRecomendada.trim(),
        fotoUrl: fotoPreview,
        dataRegistro: new Date().toLocaleDateString('pt-BR')
      },
      ...prev
    ]);
    setDescricaoPassivo('');
    setAcaoRecomendada('');
    setFotoPreview(undefined);
  };

  const removerItem = (id: string) => {
    setItens((prev) => prev.filter((i) => i.id !== id));
  };

  const exportarLaudoAssembleiaPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 bg-white text-slate-900 rounded-2xl shadow-xs border border-slate-200 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#2d5a32] p-2.5 rounded-xl text-white shadow-xs">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1c3220]">
              Vistoria Técnica de Entrada & Diagnóstico de Passivos
            </h2>
            <p className="text-xs text-slate-500">
              Registra o estado de conservação no início da gestão para resguardo jurídico e apresentação em Assembleia.
            </p>
          </div>
        </div>
        <button
          onClick={exportarLaudoAssembleiaPDF}
          className="bg-[#1c3220] hover:bg-[#2d5a32] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition print:hidden shadow-xs"
        >
          <FileDown className="w-4 h-4 text-emerald-300" /> Gerar Laudo p/ Assembleia (PDF)
        </button>
      </div>

      <form
        onSubmit={adicionarItem}
        className="bg-[#f2f5f1] border border-slate-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden"
      >
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Condomínio Inspecionado *</label>
          <input
            type="text"
            required
            value={condominioNome}
            onChange={(e) => setCondominioNome(e.target.value)}
            placeholder="Nome do Condomínio"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-medium"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Área Inspecionada *</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as any)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-medium"
          >
            <option value="Fachada">Fachada</option>
            <option value="Hidráulica/Bombas">Hidráulica / Bombas / Caixa d'Água</option>
            <option value="Elétrica">Quadros Elétricos / SPDA</option>
            <option value="Garagem">Garagem / Infiltrações</option>
            <option value="Elevadores">Casa de Máquinas / Elevadores</option>
            <option value="Áreas Comuns">Áreas Comuns / Portaria</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Grau de Risco / Passivo *</label>
          <select
            value={gravidade}
            onChange={(e) => setGravidade(e.target.value as any)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-medium"
          >
            <option value="Baixo">Baixo (Estético)</option>
            <option value="Médio">Médio (Manutenção Preventiva)</option>
            <option value="Crítico (Risco Civil)">Crítico (Risco Estrutural/Civil)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Foto da Evidência</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFotoUpload}
            className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#2d5a32] file:text-white file:font-semibold cursor-pointer"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-700 block mb-1">Descrição do Passivo *</label>
          <input
            type="text"
            required
            placeholder="Descreva o passivo estrutural encontrado..."
            value={descricaoPassivo}
            onChange={(e) => setDescricaoPassivo(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
          />
        </div>

        <div className="md:col-span-1">
          <label className="text-xs font-bold text-slate-700 block mb-1">Plano de Ação Recomendado *</label>
          <input
            type="text"
            required
            placeholder="Plano de ação recomendado..."
            value={acaoRecomendada}
            onChange={(e) => setAcaoRecomendada(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 py-2.5 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> Adicionar ao Laudo
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {itens.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-[#f8faf6] text-xs text-slate-500">
            Nenhum apontamento de vistoria cadastrado ainda. Preencha os campos acima para iniciar o laudo técnico.
          </div>
        ) : (
          itens.map((item) => (
            <div
              key={item.id}
              className="bg-[#f8faf6] border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-start justify-between shadow-2xs"
            >
              <div className="flex gap-4 items-start flex-1">
                {item.fotoUrl && (
                  <img
                    src={item.fotoUrl}
                    alt={item.area}
                    className="w-24 h-24 object-cover rounded-lg border border-slate-300 shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.condominioNome && (
                      <span className="text-xs font-bold text-[#2d5a32] bg-[#e8f0e6] px-2.5 py-0.5 rounded-full border border-[#2d5a32]/20">
                        {item.condominioNome}
                      </span>
                    )}
                    <span className="text-xs font-bold bg-[#1c3220] px-2.5 py-0.5 rounded-full text-white">
                      {item.area}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        item.gravidade.includes('Crítico')
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {item.gravidade}
                    </span>
                    {item.dataRegistro && <span className="text-xs text-slate-500 font-mono">{item.dataRegistro}</span>}
                  </div>
                  <p className="text-sm text-slate-900 mt-2 font-semibold">{item.descricaoPassivo}</p>
                  <p className="text-xs text-[#2d5a32] mt-1">
                    <strong>Recomendação Técnica:</strong> {item.acaoRecomendada}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removerItem(item.id)}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer print:hidden"
                title="Remover item do laudo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
