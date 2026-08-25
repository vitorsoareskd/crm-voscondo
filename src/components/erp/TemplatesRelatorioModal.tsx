import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, FileText, Settings, Droplets, Building2, Users } from 'lucide-react';
import { TemplateRelatorio, TemplateUnidadePadrao } from '../../types';

interface TemplatesRelatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  templatesRelatorio?: TemplateRelatorio;
  onSave: (templates: TemplateRelatorio) => void;
  condominioName: string;
  quantidadeUnidades: number;
}

export default function TemplatesRelatorioModal({ isOpen, onClose, templatesRelatorio, onSave, condominioName, quantidadeUnidades }: TemplatesRelatorioModalProps) {
  const [despesasPadrao, setDespesasPadrao] = useState<string[]>(
    templatesRelatorio?.despesasPadrao && templatesRelatorio.despesasPadrao.length > 0 
      ? templatesRelatorio.despesasPadrao 
      : ['']
  );
  
  const [obrasPadrao, setObrasPadrao] = useState<string[]>(
    templatesRelatorio?.obrasPadrao && templatesRelatorio.obrasPadrao.length > 0
      ? templatesRelatorio.obrasPadrao
      : ['']
  );

  const [fundoReservaAliquota, setFundoReservaAliquota] = useState(templatesRelatorio?.fundoReservaAliquota || '');
  const [fundoPinturaValor, setFundoPinturaValor] = useState(templatesRelatorio?.fundoPinturaValor || '');
  const [fundoObrasValor, setFundoObrasValor] = useState(templatesRelatorio?.fundoObrasValor || '');
  const [taxaBoletoValor, setTaxaBoletoValor] = useState(templatesRelatorio?.taxaBoletoValor || '');
  const [aguaTipoRateio, setAguaTipoRateio] = useState(templatesRelatorio?.aguaTipoRateio || 'moradores');
  const [aguaComposicao, setAguaComposicao] = useState(templatesRelatorio?.aguaComposicao || '');

  // Gerenciamento das Unidades Pré-Configuradas
  const [unidadesPadrao, setUnidadesPadrao] = useState<TemplateUnidadePadrao[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (templatesRelatorio?.unidadesPadrao && templatesRelatorio.unidadesPadrao.length > 0) {
      // Se já houver configuração salva, carrega (mas ajusta se a quantidade de unidades mudou)
      let unidadesAtuais = [...templatesRelatorio.unidadesPadrao];
      if (quantidadeUnidades > unidadesAtuais.length) {
        // Precisa adicionar mais
        for (let i = unidadesAtuais.length; i < quantidadeUnidades; i++) {
          unidadesAtuais.push({ 
            unidadeId: i + 1, 
            nomeUnidade: `Unidade ${i + 1}`, 
            moradores: 2,
            fracaoIdeal: Number((100 / quantidadeUnidades).toFixed(7))
          });
        }
      } else if (quantidadeUnidades < unidadesAtuais.length) {
        // Truncar
        unidadesAtuais = unidadesAtuais.slice(0, quantidadeUnidades);
      }
      setUnidadesPadrao(unidadesAtuais);
    } else {
      // Gera do zero baseado na quantidade
      const novasUnidades: TemplateUnidadePadrao[] = Array.from({ length: quantidadeUnidades }).map((_, i) => ({
        unidadeId: i + 1,
        nomeUnidade: `Unidade ${i + 1}`,
        moradores: 2,
        fracaoIdeal: Number((100 / quantidadeUnidades).toFixed(7))
      }));
      setUnidadesPadrao(novasUnidades);
    }
  }, [isOpen, quantidadeUnidades, templatesRelatorio]);

  if (!isOpen) return null;

  const handleAddDespesa = () => setDespesasPadrao([...despesasPadrao, '']);
  const handleRemoveDespesa = (index: number) => {
    const updated = despesasPadrao.filter((_, i) => i !== index);
    setDespesasPadrao(updated.length === 0 ? [''] : updated);
  };
  const handleDespesaChange = (index: number, value: string) => {
    const updated = [...despesasPadrao];
    updated[index] = value;
    setDespesasPadrao(updated);
  };

  const handleAddObra = () => setObrasPadrao([...obrasPadrao, '']);
  const handleRemoveObra = (index: number) => {
    const updated = obrasPadrao.filter((_, i) => i !== index);
    setObrasPadrao(updated.length === 0 ? [''] : updated);
  };
  const handleObraChange = (index: number, value: string) => {
    const updated = [...obrasPadrao];
    updated[index] = value;
    setObrasPadrao(updated);
  };

  const handleSave = () => {
    onSave({
      despesasPadrao: despesasPadrao.filter(d => d.trim() !== ''),
      obrasPadrao: obrasPadrao.filter(o => o.trim() !== ''),
      fundoReservaAliquota,
      fundoPinturaValor,
      fundoObrasValor,
      taxaBoletoValor,
      aguaTipoRateio,
      aguaComposicao,
      unidadesPadrao
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-50 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Templates de Relatório</h2>
              <p className="text-xs text-slate-500 mt-0.5">Módulo 2.5 • {condominioName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* 1. Despesas Ordinárias */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg border-b border-slate-200 pb-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h3>Descrição Padrão das Despesas Ordinárias</h3>
            </div>
            <p className="text-xs text-slate-500">
              Adicione múltiplas linhas para a Cota Básica. Elas aparecerão pré-carregadas no relatório.
            </p>
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              {despesasPadrao.map((despesa, index) => (
                <div key={`despesa-${index}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={despesa}
                    onChange={(e) => handleDespesaChange(index, e.target.value)}
                    placeholder={`Ex: Folha de Pagamento...`}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDespesa(index)}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                    title="Remover linha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddDespesa}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Adicionar Linha de Despesa Ordinária
              </button>
            </div>
          </div>

          {/* 1.1 Despesas Extraordinárias e Obras */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg border-b border-slate-200 pb-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <h3>Descrição Padrão das Obras Extraordinárias</h3>
            </div>
            <p className="text-xs text-slate-500">
              Adicione múltiplas linhas para Obras e Reformas. Elas aparecerão pré-carregadas na seção Extraordinárias do relatório.
            </p>
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              {obrasPadrao.map((obra, index) => (
                <div key={`obra-${index}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={obra}
                    onChange={(e) => handleObraChange(index, e.target.value)}
                    placeholder={`Ex: Reforma da Fachada...`}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveObra(index)}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                    title="Remover linha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddObra}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Adicionar Linha de Obra Extraordinária
              </button>
            </div>
          </div>

          {/* 2. Fundos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg border-b border-slate-200 pb-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <h3>Fundos Diversos (Reserva, Pintura, Obras)</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Fundo Reserva (Alíquota %)</label>
                <input
                  type="text"
                  value={fundoReservaAliquota}
                  onChange={(e) => setFundoReservaAliquota(e.target.value.replace('%', ''))}
                  placeholder="Ex: 10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Fundo Pintura (Valor R$/Un)</label>
                <input
                  type="text"
                  value={fundoPinturaValor}
                  onChange={(e) => setFundoPinturaValor(e.target.value)}
                  placeholder="Ex: 100,00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Fundo Obras (Valor R$/Un)</label>
                <input
                  type="text"
                  value={fundoObrasValor}
                  onChange={(e) => setFundoObrasValor(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Taxa de Boleto (Valor R$/Un)</label>
                <input
                  type="text"
                  value={taxaBoletoValor}
                  onChange={(e) => setTaxaBoletoValor(e.target.value)}
                  placeholder="Ex: 3,50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Água e Saneamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg border-b border-slate-200 pb-2">
              <Droplets className="w-5 h-5 text-sky-500" />
              <h3>Rateio de Água e Saneamento</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-sky-50 p-4 rounded-xl border border-sky-100">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Tipo de Rateio</label>
                <select
                  value={aguaTipoRateio}
                  onChange={(e) => setAguaTipoRateio(e.target.value)}
                  className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none bg-white font-medium text-slate-700"
                >
                  <option value="fracao_ideal">Fração Ideal</option>
                  <option value="divisao_igual">Divisão Igualitária</option>
                  <option value="moradores">Por Nº de Moradores</option>
                  <option value="consumo_medido">Consumo Medido (Individual)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Composição Padrão</label>
                <input
                  type="text"
                  value={aguaComposicao}
                  onChange={(e) => setAguaComposicao(e.target.value)}
                  placeholder="Ex: Sanepar/Concessionária"
                  className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* 4. Pré-Configuração de Unidades e Moradores */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg border-b border-slate-200 pb-2">
              <Users className="w-5 h-5 text-amber-600" />
              <h3>Pré-Configuração de Unidades (Aptos) e Moradores</h3>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                A quantidade de linhas é determinada pelo número de unidades do condomínio ({quantidadeUnidades}).
              </p>
              <button
                type="button"
                onClick={() => {
                  setUnidadesPadrao(prev => prev.map(u => ({ ...u, moradores: 2 })));
                }}
                className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
              >
                Setar 2 Moradores p/ Todos
              </button>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto shadow-inner">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-bold text-slate-600 border-b border-slate-200 w-16 text-center">ID</th>
                    <th className="py-2.5 px-4 font-bold text-slate-600 border-b border-slate-200">Nome da Unidade</th>
                    <th className="py-2.5 px-4 font-bold text-slate-600 border-b border-slate-200 w-32 text-center">Fração Ideal (%)</th>
                    <th className="py-2.5 px-4 font-bold text-slate-600 border-b border-slate-200 w-32 text-center">Nº Moradores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unidadesPadrao.map((u, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-4 text-center font-mono text-xs text-slate-400 font-bold bg-slate-50/50">
                        {u.unidadeId}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={u.nomeUnidade}
                          onChange={(e) => {
                            const newUnidades = [...unidadesPadrao];
                            newUnidades[index].nomeUnidade = e.target.value;
                            setUnidadesPadrao(newUnidades);
                          }}
                          className="w-full px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded bg-transparent focus:bg-white transition-all font-semibold text-slate-800"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          step="0.0001"
                          value={u.fracaoIdeal !== undefined ? u.fracaoIdeal : ''}
                          onChange={(e) => {
                            const newUnidades = [...unidadesPadrao];
                            newUnidades[index].fracaoIdeal = parseFloat(e.target.value) || 0;
                            setUnidadesPadrao(newUnidades);
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-center font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          value={u.moradores}
                          min="0"
                          onChange={(e) => {
                            const newUnidades = [...unidadesPadrao];
                            newUnidades[index].moradores = Number(e.target.value) || 0;
                            setUnidadesPadrao(newUnidades);
                          }}
                          className="w-full px-2 py-1 text-center border border-transparent hover:border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded bg-amber-50/50 focus:bg-white transition-all font-mono font-bold text-amber-900"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-10">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" /> Salvar Templates
          </button>
        </div>
      </div>
    </div>
  );
}
