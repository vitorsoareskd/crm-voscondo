import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Save, FileText, Settings, Droplets, Building2, Users, ClipboardPaste, CheckCircle2, AlertCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Excel paste state
  const [mostrarAreaExcel, setMostrarAreaExcel] = useState(false);
  const [textoExcel, setTextoExcel] = useState('');
  const [feedbackExcel, setFeedbackExcel] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);
  const [feedbackCopy, setFeedbackCopy] = useState(false);

  const totalFracaoIdeal = useMemo(() => {
    return unidadesPadrao.reduce((acc, u) => acc + (Number(u.fracaoIdeal) || 0), 0);
  }, [unidadesPadrao]);

  const totalMoradores = useMemo(() => {
    return unidadesPadrao.reduce((acc, u) => acc + (Number(u.moradores) || 0), 0);
  }, [unidadesPadrao]);

  // Sincroniza TODOS os campos do modal sempre que for aberto ou quando o template mudar.
  // Sem isso, campos inicializados com useState mostrariam valores stale do primeiro render.
  useEffect(() => {
    if (!isOpen) return;

    // 1. Despesas Ordinárias
    setDespesasPadrao(
      templatesRelatorio?.despesasPadrao && templatesRelatorio.despesasPadrao.length > 0
        ? templatesRelatorio.despesasPadrao
        : ['']
    );

    // 2. Obras Extraordinárias
    setObrasPadrao(
      templatesRelatorio?.obrasPadrao && templatesRelatorio.obrasPadrao.length > 0
        ? templatesRelatorio.obrasPadrao
        : ['']
    );

    // 3. Fundos e Boleto
    setFundoReservaAliquota(templatesRelatorio?.fundoReservaAliquota || '');
    setFundoPinturaValor(templatesRelatorio?.fundoPinturaValor || '');
    setFundoObrasValor(templatesRelatorio?.fundoObrasValor || '');
    setTaxaBoletoValor(templatesRelatorio?.taxaBoletoValor || '');

    // 4. Água
    setAguaTipoRateio(templatesRelatorio?.aguaTipoRateio || 'moradores');
    setAguaComposicao(templatesRelatorio?.aguaComposicao || '');

    // Reset Excel paste area
    setMostrarAreaExcel(false);
    setTextoExcel('');
    setFeedbackExcel(null);

    // 5. Unidades Pré-Configuradas
    if (templatesRelatorio?.unidadesPadrao && templatesRelatorio.unidadesPadrao.length > 0) {
      let unidadesAtuais = [...templatesRelatorio.unidadesPadrao];
      if (quantidadeUnidades > unidadesAtuais.length) {
        for (let i = unidadesAtuais.length; i < quantidadeUnidades; i++) {
          unidadesAtuais.push({ 
            unidadeId: i + 1, 
            nomeUnidade: `Unidade ${i + 1}`, 
            moradores: 2,
            fracaoIdeal: Number((100 / quantidadeUnidades).toFixed(7))
          });
        }
      } else if (quantidadeUnidades < unidadesAtuais.length) {
        unidadesAtuais = unidadesAtuais.slice(0, quantidadeUnidades);
      }
      setUnidadesPadrao(unidadesAtuais);
    } else {
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

  // ─── Handlers de Despesas e Obras ─────────────────────────────────────────
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

  // ─── Excel Paste ──────────────────────────────────────────────────────────
  /**
   * Processa texto colado do Excel.
   * Formato esperado (colunas separadas por Tab, linhas por \n):
   *   Nome da Unidade  [TAB]  Fração Ideal (%)  [TAB]  Nº Moradores
   *
   * Também aceita apenas 2 colunas (Nome + Fração) ou 1 coluna (só Nome).
   * Se a primeira linha parecer um cabeçalho (texto), é ignorada automaticamente.
   */
  const processarExcel = () => {
    if (!textoExcel.trim()) {
      setFeedbackExcel({ tipo: 'erro', msg: 'Cole o conteúdo do Excel antes de importar.' });
      return;
    }

    const linhas = textoExcel
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    if (linhas.length === 0) {
      setFeedbackExcel({ tipo: 'erro', msg: 'Nenhuma linha detectada. Verifique o conteúdo colado.' });
      return;
    }

    const novasUnidades: TemplateUnidadePadrao[] = [];

    for (const linha of linhas) {
      // Divide por Tab (Excel padrão), ponto-e-vírgula ou espaços duplos
      let cols = linha.split('\t');
      if (cols.length < 2) cols = linha.split(';');
      if (cols.length < 2) cols = linha.split(/\s{2,}/);

      const col0 = cols[0]?.trim() ?? '';
      const col1 = cols[1]?.trim().replace('%', '').replace(',', '.') ?? '';
      const col2 = cols[2]?.trim() ?? '';

      // Ignora linha de cabeçalho: se col1 não for numérico e for texto como "Fração"
      const fracao = parseFloat(col1);
      if (col0 === '' || (isNaN(fracao) && col1 !== '')) continue;

      const moradores = parseInt(col2) || 2;
      novasUnidades.push({
        unidadeId: novasUnidades.length + 1,
        nomeUnidade: col0 || `Unidade ${novasUnidades.length + 1}`,
        fracaoIdeal: isNaN(fracao) ? Number((100 / linhas.length).toFixed(7)) : fracao,
        moradores: moradores > 0 ? moradores : 2
      });
    }

    if (novasUnidades.length === 0) {
      setFeedbackExcel({ tipo: 'erro', msg: 'Nenhuma unidade válida encontrada. Verifique o formato das colunas.' });
      return;
    }

    setUnidadesPadrao(novasUnidades);
    setTextoExcel('');
    setMostrarAreaExcel(false);
    setFeedbackExcel({
      tipo: 'sucesso',
      msg: `✓ ${novasUnidades.length} unidades importadas com sucesso do Excel!`
    });
    setTimeout(() => setFeedbackExcel(null), 4000);
  };

  // ─── Copiar tabela atual para Excel ──────────────────────────────────────
  const copiarParaExcel = () => {
    const header = 'Nome da Unidade\tFração Ideal (%)\tNº Moradores';
    const rows = unidadesPadrao.map(u =>
      `${u.nomeUnidade}\t${u.fracaoIdeal}\t${u.moradores}`
    );
    const texto = [header, ...rows].join('\n');
    navigator.clipboard.writeText(texto).then(() => {
      setFeedbackCopy(true);
      setTimeout(() => setFeedbackCopy(false), 2500);
    });
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
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

            {/* Toolbar: ações e botão Excel */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                A quantidade de linhas é determinada pelo número de unidades do condomínio ({quantidadeUnidades}).
              </p>
              <div className="flex items-center gap-2">
                {/* Copiar para Excel */}
                <button
                  type="button"
                  onClick={copiarParaExcel}
                  title="Copiar tabela atual para o Excel (Ctrl+C)"
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    feedbackCopy
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  {feedbackCopy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {feedbackCopy ? 'Copiado!' : 'Copiar p/ Excel'}
                </button>

                {/* Colar do Excel */}
                <button
                  type="button"
                  onClick={() => { setMostrarAreaExcel(v => !v); setFeedbackExcel(null); }}
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    mostrarAreaExcel
                      ? 'bg-violet-600 text-white border-violet-700 shadow-sm'
                      : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Colar do Excel
                  {mostrarAreaExcel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {/* Setar 2 moradores */}
                <button
                  type="button"
                  onClick={() => {
                    setUnidadesPadrao(prev => prev.map(u => ({ ...u, moradores: 2 })));
                  }}
                  className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                >
                  2 Moradores p/ Todos
                </button>
              </div>
            </div>

            {/* Área de colagem do Excel (expansível) */}
            {mostrarAreaExcel && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-start gap-2">
                  <ClipboardPaste className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-violet-800">Cole aqui os dados copiados do Excel</p>
                    <p className="text-[11px] text-violet-600 mt-0.5">
                      Formato esperado: <span className="font-mono bg-white/70 px-1 rounded">Nome da Unidade [Tab] Fração Ideal (%) [Tab] Nº Moradores</span>
                    </p>
                    <p className="text-[10px] text-violet-500 mt-1">
                      • Linhas de cabeçalho são ignoradas automaticamente &nbsp;•&nbsp; Coluna de Moradores é opcional (padrão: 2)
                    </p>
                  </div>
                </div>

                <textarea
                  value={textoExcel}
                  onChange={(e) => setTextoExcel(e.target.value)}
                  onKeyDown={(e) => {
                    // Ctrl+Enter para importar rapidamente
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      processarExcel();
                    }
                  }}
                  placeholder={`Apt 101\t4.1667\t3\nApt 102\t4.1667\t2\nApt 103\t4.1667\t4\n...`}
                  rows={6}
                  className="w-full px-3 py-2.5 border border-violet-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-y"
                  autoFocus
                />

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-violet-500">
                    Dica: após colar, clique em <strong>Importar</strong> ou pressione <kbd className="px-1 py-0.5 bg-white border border-violet-300 rounded text-[10px] font-mono">Ctrl+Enter</kbd>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setMostrarAreaExcel(false); setTextoExcel(''); setFeedbackExcel(null); }}
                      className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={processarExcel}
                      className="px-4 py-1.5 text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      Importar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback de importação */}
            {feedbackExcel && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold ${
                feedbackExcel.tipo === 'sucesso'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {feedbackExcel.tipo === 'sucesso'
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {feedbackExcel.msg}
              </div>
            )}
            
            {/* Tabela de unidades */}
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
                <tfoot className="sticky bottom-0 bg-slate-100/95 font-bold text-slate-800 border-t-2 border-slate-300 text-xs z-10 shadow-xs">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-4 text-right uppercase text-slate-600 font-extrabold">
                      Total ({unidadesPadrao.length} Unidades):
                    </td>
                    <td className={`py-2.5 px-4 text-center font-mono font-black ${
                      Math.abs(totalFracaoIdeal - 100) < 0.01 
                        ? 'text-emerald-700 bg-emerald-50/80' 
                        : 'text-amber-700 bg-amber-50/80'
                    }`}>
                      {totalFracaoIdeal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-black text-amber-900 bg-amber-100/80">
                      {totalMoradores} hab.
                    </td>
                  </tr>
                </tfoot>
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
