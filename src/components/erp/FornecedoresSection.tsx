import React, { useState } from 'react';
import { Fornecedor, Condominio } from '../../types';
import { Plus, Star, Users, Search, Filter, Trash2, Building2, Tag, X, Check, Settings, Phone, Mail, FileText, AlertCircle, Sparkles, Pencil } from 'lucide-react';

interface FornecedoresSectionProps {
  fornecedores: Fornecedor[];
  setFornecedores: React.Dispatch<React.SetStateAction<Fornecedor[]>>;
  condominios: Condominio[];
}

export const FornecedoresSection: React.FC<FornecedoresSectionProps> = ({
  fornecedores,
  setFornecedores,
  condominios = []
}) => {
  // Segment Management State
  const [segmentos, setSegmentos] = useState<string[]>([
    'Limpeza',
    'Portaria',
    'Manutenção Geral',
    'Elevadores',
    'Segurança',
    'Jardinagem',
    'Engenharia'
  ]);
  const [novoSegmento, setNovoSegmento] = useState('');
  const [showGerenciarSegmentos, setShowGerenciarSegmentos] = useState(false);
  const [segmentoSucessoMsg, setSegmentoSucessoMsg] = useState<string | null>(null);

  // Filters State for Ranking
  const [busca, setBusca] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('todos');
  const [filtroCondominio, setFiltroCondominio] = useState('todos');
  const [filtroMinServico, setFiltroMinServico] = useState<number>(0);
  const [filtroMinCusto, setFiltroMinCusto] = useState<number>(0);

  // New Supplier Form State
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segmento, setSegmento] = useState('Limpeza');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [avaliacaoServico, setAvaliacaoServico] = useState(5);
  const [avaliacaoCustoBeneficio, setAvaliacaoCustoBeneficio] = useState(5);
  const [observacoes, setObservacoes] = useState('');

  // Multiple Condominiums Selection for Supplier
  const [selectedCondoIds, setSelectedCondoIds] = useState<string[]>([]);
  const [customCondoInput, setCustomCondoInput] = useState('');
  const [outrosCondominios, setOutrosCondominios] = useState<string[]>([]);

  // Toggle Condominium selection
  const handleToggleCondo = (condoNome: string) => {
    if (selectedCondoIds.includes(condoNome)) {
      setSelectedCondoIds(selectedCondoIds.filter((c) => c !== condoNome));
    } else {
      setSelectedCondoIds([...selectedCondoIds, condoNome]);
    }
  };

  const handleAddCustomCondo = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = customCondoInput.trim();
    if (val && !outrosCondominios.includes(val) && !selectedCondoIds.includes(val)) {
      setOutrosCondominios([...outrosCondominios, val]);
      setSelectedCondoIds([...selectedCondoIds, val]);
      setCustomCondoInput('');
    }
  };

  const handleRemoveCustomCondo = (cNome: string) => {
    setOutrosCondominios(outrosCondominios.filter((c) => c !== cNome));
    setSelectedCondoIds(selectedCondoIds.filter((c) => c !== cNome));
  };

  // Add Segment
  const handleAddSegmento = (e: React.FormEvent) => {
    e.preventDefault();
    const segTrim = novoSegmento.trim();
    if (!segTrim) return;

    if (segmentos.some((s) => s.toLowerCase() === segTrim.toLowerCase())) {
      alert('Este segmento já existe na lista!');
      return;
    }

    setSegmentos([...segmentos, segTrim]);
    setSegmento(segTrim);
    setNovoSegmento('');
    setSegmentoSucessoMsg(`Segmento "${segTrim}" adicionado com sucesso!`);
    setTimeout(() => setSegmentoSucessoMsg(null), 3000);
  };

  // Delete Confirmation States
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  const [segmentoParaExcluir, setSegmentoParaExcluir] = useState<string | null>(null);

  // Edit Supplier States
  const [fornecedorParaEditar, setFornecedorParaEditar] = useState<Fornecedor | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editSegmento, setEditSegmento] = useState('Limpeza');
  const [editTelefone, setEditTelefone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvaliacaoServico, setEditAvaliacaoServico] = useState(5);
  const [editAvaliacaoCustoBeneficio, setEditAvaliacaoCustoBeneficio] = useState(5);
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editSelectedCondoIds, setEditSelectedCondoIds] = useState<string[]>([]);
  const [editCustomCondoInput, setEditCustomCondoInput] = useState('');
  const [editOutrosCondominios, setEditOutrosCondominios] = useState<string[]>([]);

  const handleOpenEditModal = (f: Fornecedor) => {
    setFornecedorParaEditar(f);
    setEditNome(f.nome);
    setEditCnpj(f.cnpj || '');
    setEditSegmento(f.segmento);
    setEditTelefone(f.telefone || '');
    setEditEmail(f.email || '');
    setEditAvaliacaoServico(f.avaliacaoServico || 5);
    setEditAvaliacaoCustoBeneficio(f.avaliacaoCustoBeneficio || 5);
    setEditObservacoes(f.observacoes || '');

    const condList =
      f.condominiosAtendidos && f.condominiosAtendidos.length > 0
        ? f.condominiosAtendidos
        : f.condominioAtendido
        ? f.condominioAtendido.split(' / ')
        : [];

    setEditSelectedCondoIds(condList);
    setEditOutrosCondominios([]);
    setEditCustomCondoInput('');
  };

  const handleToggleEditCondo = (condoNome: string) => {
    if (editSelectedCondoIds.includes(condoNome)) {
      setEditSelectedCondoIds(editSelectedCondoIds.filter((c) => c !== condoNome));
    } else {
      setEditSelectedCondoIds([...editSelectedCondoIds, condoNome]);
    }
  };

  const handleAddEditCustomCondo = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = editCustomCondoInput.trim();
    if (val && !editOutrosCondominios.includes(val) && !editSelectedCondoIds.includes(val)) {
      setEditOutrosCondominios([...editOutrosCondominios, val]);
      setEditSelectedCondoIds([...editSelectedCondoIds, val]);
      setEditCustomCondoInput('');
    }
  };

  const handleRemoveEditCustomCondo = (cNome: string) => {
    setEditOutrosCondominios(editOutrosCondominios.filter((c) => c !== cNome));
    setEditSelectedCondoIds(editSelectedCondoIds.filter((c) => c !== cNome));
  };

  const handleSaveEditFornecedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedorParaEditar || !editNome.trim()) return;

    const condsList = editSelectedCondoIds.length > 0 ? editSelectedCondoIds : ['Vários Prédios'];
    const condStr = condsList.join(' / ');

    const updatedForn: Fornecedor = {
      ...fornecedorParaEditar,
      nome: editNome.trim(),
      cnpj: editCnpj.trim() || '00.000.000/0001-00',
      condominioAtendido: condStr,
      condominiosAtendidos: condsList,
      segmento: editSegmento,
      avaliacaoServico: editAvaliacaoServico,
      avaliacaoCustoBeneficio: editAvaliacaoCustoBeneficio,
      telefone: editTelefone.trim() || '(41) 90000-0000',
      email: editEmail.trim() || undefined,
      observacoes: editObservacoes.trim() || undefined
    };

    setFornecedores((prev) => prev.map((item) => (item.id === fornecedorParaEditar.id ? updatedForn : item)));
    setFornecedorParaEditar(null);
  };

  // Delete Segment
  const handleDeleteSegmento = (segToDelete: string) => {
    if (segmentos.length <= 1) {
      return;
    }
    setSegmentoParaExcluir(segToDelete);
  };

  const confirmarExclusaoSegmento = () => {
    if (segmentoParaExcluir) {
      const segToDelete = segmentoParaExcluir;
      setSegmentos(segmentos.filter((s) => s !== segToDelete));
      if (segmento === segToDelete) {
        setSegmento(segmentos.find((s) => s !== segToDelete) || '');
      }
      if (filtroSegmento === segToDelete) {
        setFiltroSegmento('todos');
      }
      setSegmentoParaExcluir(null);
    }
  };

  // Create Supplier Submit
  const handleAddFornecedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const condsList = selectedCondoIds.length > 0 ? selectedCondoIds : ['Vários Prédios'];
    const condStr = condsList.join(' / ');

    const newForn: Fornecedor = {
      id: `FORN-${Math.floor(10 + Math.random() * 90)}`,
      nome: nome.trim(),
      cnpj: cnpj.trim() || '00.000.000/0001-00',
      condominioAtendido: condStr,
      condominiosAtendidos: condsList,
      segmento,
      avaliacaoServico,
      avaliacaoCustoBeneficio,
      telefone: telefone.trim() || '(41) 90000-0000',
      email: email.trim() || undefined,
      observacoes: observacoes.trim() || undefined
    };

    setFornecedores([newForn, ...fornecedores]);

    // Reset Form
    setNome('');
    setCnpj('');
    setTelefone('');
    setEmail('');
    setObservacoes('');
    setSelectedCondoIds([]);
    setOutrosCondominios([]);
    setAvaliacaoServico(5);
    setAvaliacaoCustoBeneficio(5);
  };

  // Delete Supplier
  const handleDeleteFornecedor = (id: string, nomeForn: string) => {
    setFornecedorParaExcluir({ id, nome: nomeForn });
  };

  const confirmarExclusaoFornecedor = () => {
    if (fornecedorParaExcluir) {
      setFornecedores((prev) => prev.filter((f) => f.id !== fornecedorParaExcluir.id));
      setFornecedorParaExcluir(null);
    }
  };

  // Filtered Suppliers Logic
  const fornecedoresFiltrados = fornecedores.filter((f) => {
    // Search query
    const searchLower = busca.toLowerCase();
    const condsStr = (f.condominiosAtendidos ? f.condominiosAtendidos.join(' ') : f.condominioAtendido).toLowerCase();
    const matchBusca =
      f.nome.toLowerCase().includes(searchLower) ||
      f.cnpj.toLowerCase().includes(searchLower) ||
      f.segmento.toLowerCase().includes(searchLower) ||
      condsStr.includes(searchLower);

    // Segment filter
    const matchSegmento = filtroSegmento === 'todos' || f.segmento === filtroSegmento;

    // Condominium filter
    let matchCondominio = true;
    if (filtroCondominio !== 'todos') {
      if (f.condominiosAtendidos && f.condominiosAtendidos.length > 0) {
        matchCondominio = f.condominiosAtendidos.some(
          (c) => c.toLowerCase() === filtroCondominio.toLowerCase()
        );
      } else {
        matchCondominio = f.condominioAtendido.toLowerCase().includes(filtroCondominio.toLowerCase());
      }
    }

    // Service Rating filter
    const matchServico = filtroMinServico === 0 || f.avaliacaoServico >= filtroMinServico;

    // Cost-Benefit Rating filter
    const matchCusto = filtroMinCusto === 0 || f.avaliacaoCustoBeneficio >= filtroMinCusto;

    return matchBusca && matchSegmento && matchCondominio && matchServico && matchCusto;
  });

  const temFiltroAtivo =
    busca || filtroSegmento !== 'todos' || filtroCondominio !== 'todos' || filtroMinServico > 0 || filtroMinCusto > 0;

  const handleLimparFiltros = () => {
    setBusca('');
    setFiltroSegmento('todos');
    setFiltroCondominio('todos');
    setFiltroMinServico(0);
    setFiltroMinCusto(0);
  };

  // Collect unique list of all condominiums present across database + registered
  const todosCondominiosNomes = Array.from(
    new Set([
      ...condominios.map((c) => c.nome),
      ...fornecedores.flatMap((f) => f.condominiosAtendidos || [f.condominioAtendido])
    ])
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form to Homologate New Supplier */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-[#1c3220] text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2d5a32]" />
              <span>Homologar Fornecedor</span>
            </h3>
            <button
              onClick={() => setShowGerenciarSegmentos(!showGerenciarSegmentos)}
              className="text-xs text-[#2d5a32] hover:text-[#1f4223] font-bold flex items-center gap-1 bg-[#e8f0e6] px-2.5 py-1 rounded-lg border border-[#2d5a32]/20 transition-colors"
              title="Gerenciar lista de segmentos"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Segmentos</span>
            </button>
          </div>

          {/* Manage Segments Drawer / Expander */}
          {showGerenciarSegmentos && (
            <div className="bg-[#f8faf6] p-4 rounded-xl border border-[#2d5a32]/30 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-[#1c3220]">
                <span>Gerenciar Segmentos ({segmentos.length})</span>
                <button
                  onClick={() => setShowGerenciarSegmentos(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form to Add New Segment */}
              <form onSubmit={handleAddSegmento} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do novo segmento..."
                  value={novoSegmento}
                  onChange={(e) => setNovoSegmento(e.target.value)}
                  className="flex-1 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2d5a32]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-lg shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir</span>
                </button>
              </form>

              {segmentoSucessoMsg && (
                <p className="text-[11px] font-bold text-emerald-800 bg-emerald-100 p-2 rounded-lg">
                  {segmentoSucessoMsg}
                </p>
              )}

              {/* Segment Badges list with Delete Option */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {segmentos.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 font-medium text-slate-800"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSegmento(s)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                      title={`Excluir segmento ${s}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Supplier Form */}
          <form onSubmit={handleAddFornecedor} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-700">Nome da Empresa / Parceiro *</label>
              <input
                type="text"
                required
                placeholder="Ex: HidroClean Sanitizações"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-[#2d5a32] font-semibold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700">CNPJ</label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">Segmento *</label>
                <select
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#2d5a32]"
                >
                  {segmentos.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SELEÇÃO DE MÚLTIPLOS CONDOMÍNIOS ATENDIDOS */}
            <div className="space-y-2 bg-[#f8faf6] p-3.5 rounded-xl border border-[#2d5a32]/20">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1c3220] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#2d5a32]" />
                  <span>Condomínios Atendidos ({selectedCondoIds.length}) *</span>
                </label>
                <span className="text-[10px] text-slate-500">Selecione um ou mais</span>
              </div>

              <p className="text-[11px] text-slate-600">
                Marque os prédios atendidos por este fornecedor para que ele apareça nas buscas específicas:
              </p>

              {/* Checkbox list of system condominiums */}
              {condominios.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                  {condominios.map((c) => {
                    const isChecked = selectedCondoIds.includes(c.nome);
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                          isChecked ? 'bg-[#e8f0e6] text-[#1c3220] font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCondo(c.nome)}
                          className="rounded text-[#2d5a32] focus:ring-[#2d5a32] accent-[#2d5a32]"
                        />
                        <span>{c.nome}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Input for custom / external condominiums */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Ou adicione outro condomínio/prédio extra:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Residencial Batel Plaza"
                    value={customCondoInput}
                    onChange={(e) => setCustomCondoInput(e.target.value)}
                    onKeyDown={handleAddCustomCondo}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#2d5a32]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCondo}
                    className="px-3 py-1.5 bg-[#2d5a32] text-white font-bold rounded-lg text-xs"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Badges of currently selected condominiums */}
              {selectedCondoIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200">
                  {selectedCondoIds.map((cNome) => (
                    <span
                      key={cNome}
                      className="bg-[#2d5a32] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5"
                    >
                      <span>{cNome}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleCondo(cNome)}
                        className="hover:text-rose-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Telefone de Contato</label>
                <input
                  type="text"
                  placeholder="(41) 90000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">E-mail Corporativo</label>
                <input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>
            </div>

            {/* Avaliação em Estrelas */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block font-bold text-[11px] text-slate-700 mb-1">Qualidade do Serviço</label>
                <select
                  value={avaliacaoServico}
                  onChange={(e) => setAvaliacaoServico(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-amber-600 bg-white"
                >
                  <option value={5}>5 Estrelas ★★★★★ (Excelente)</option>
                  <option value={4}>4 Estrelas ★★★★☆ (Muito Bom)</option>
                  <option value={3}>3 Estrelas ★★★☆☆ (Regular)</option>
                  <option value={2}>2 Estrelas ★★☆☆☆ (Abaixo)</option>
                  <option value={1}>1 Estrela ★☆☆☆☆ (Insatisfeito)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[11px] text-slate-700 mb-1">Custo Benefício</label>
                <select
                  value={avaliacaoCustoBeneficio}
                  onChange={(e) => setAvaliacaoCustoBeneficio(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-amber-600 bg-white"
                >
                  <option value={5}>5 Estrelas ★★★★★ (Excelente)</option>
                  <option value={4}>4 Estrelas ★★★★☆ (Muito Bom)</option>
                  <option value={3}>3 Estrelas ★★★☆☆ (Regular)</option>
                  <option value={2}>2 Estrelas ★★☆☆☆ (Abaixo)</option>
                  <option value={1}>1 Estrela ★☆☆☆☆ (Insatisfeito)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700">Observações / Histórico</label>
              <textarea
                rows={2}
                placeholder="Detalhes sobre contratos, referências e historico de serviços..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Fornecedor no Ranking</span>
            </button>
          </form>
        </div>

        {/* Right Column: Suppliers Ranking & Advanced Filters */}
        <div className="lg:col-span-7 space-y-5">
          {/* Header & Advanced Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-bold text-[#1c3220] text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>Ranking de Fornecedores Homologados</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {fornecedoresFiltrados.length} de {fornecedores.length} fornecedores exibidos
                </p>
              </div>

              {temFiltroAtivo && (
                <button
                  onClick={handleLimparFiltros}
                  className="text-xs text-rose-700 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>

            {/* Painel de Filtros Avançados */}
            <div className="space-y-3 text-xs">
              {/* Search Text Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por nome do fornecedor, CNPJ ou serviço..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#2d5a32] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Filtro Por Segmento */}
                <div>
                  <label className="block font-bold text-[11px] text-slate-600 mb-1">Segmento</label>
                  <select
                    value={filtroSegmento}
                    onChange={(e) => setFiltroSegmento(e.target.value)}
                    className="w-full p-2 border rounded-xl font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="todos">Todos Segmentos</option>
                    {segmentos.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Filtro Por Condomínio */}
                <div>
                  <label className="block font-bold text-[11px] text-slate-600 mb-1">Condomínio Atendido</label>
                  <select
                    value={filtroCondominio}
                    onChange={(e) => setFiltroCondominio(e.target.value)}
                    className="w-full p-2 border rounded-xl font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="todos">Todos Condomínios</option>
                    {todosCondominiosNomes.map((cNome) => (
                      <option key={cNome} value={cNome}>
                        {cNome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Filtro Por Nível de Serviço */}
                <div>
                  <label className="block font-bold text-[11px] text-slate-600 mb-1">Mín. Qualidade Serviço</label>
                  <select
                    value={filtroMinServico}
                    onChange={(e) => setFiltroMinServico(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-xl font-semibold text-amber-700 bg-slate-50 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value={0}>Qualquer Nota</option>
                    <option value={5}>5 Estrelas ★★★★★</option>
                    <option value={4}>4+ Estrelas ★★★★☆</option>
                    <option value={3}>3+ Estrelas ★★★☆☆</option>
                  </select>
                </div>

                {/* 4. Filtro Por Custo Benefício */}
                <div>
                  <label className="block font-bold text-[11px] text-slate-600 mb-1">Mín. Custo Benefício</label>
                  <select
                    value={filtroMinCusto}
                    onChange={(e) => setFiltroMinCusto(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-xl font-semibold text-amber-700 bg-slate-50 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value={0}>Qualquer Nota</option>
                    <option value={5}>5 Estrelas ★★★★★</option>
                    <option value={4}>4+ Estrelas ★★★★☆</option>
                    <option value={3}>3+ Estrelas ★★★☆☆</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers Cards Grid */}
          <div className="space-y-3">
            {fornecedoresFiltrados.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">Nenhum fornecedor encontrado</p>
                <p className="text-xs">Tente ajustar seus termos de pesquisa ou resetar os filtros selecionados.</p>
                {temFiltroAtivo && (
                  <button
                    onClick={handleLimparFiltros}
                    className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            ) : (
              fornecedoresFiltrados.map((f) => {
                const condsAtendidosList =
                  f.condominiosAtendidos && f.condominiosAtendidos.length > 0
                    ? f.condominiosAtendidos
                    : f.condominioAtendido.split(' / ');

                return (
                  <div
                    key={f.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-[#2d5a32]/40 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#e8f0e6] text-[#2d5a32] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border border-[#2d5a32]/20">
                            {f.segmento}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                            {f.id}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{f.nome}</h4>
                        <p className="text-xs font-mono text-slate-500">CNPJ: {f.cnpj}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(f)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar Fornecedor"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFornecedor(f.id, f.nome)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover Fornecedor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Multiple Condominiums Badge List */}
                    <div className="bg-[#f8faf6] p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Condomínio(s) Atendido(s) ({condsAtendidosList.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {condsAtendidosList.map((cNome, idx) => (
                          <span
                            key={idx}
                            className="bg-white text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1"
                          >
                            <Building2 className="w-3 h-3 text-[#2d5a32]" />
                            <span>{cNome.trim()}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rating and Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Qualidade Serviço</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <span>{'★'.repeat(f.avaliacaoServico)}</span>
                          <span className="text-slate-600 text-[11px]">({f.avaliacaoServico}/5)</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Custo Benefício</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <span>{'★'.repeat(f.avaliacaoCustoBeneficio)}</span>
                          <span className="text-slate-600 text-[11px]">({f.avaliacaoCustoBeneficio}/5)</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Contato Direct</span>
                        <div className="flex items-center gap-1 text-slate-800 font-medium font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-[#2d5a32]" />
                          <span>{f.telefone}</span>
                        </div>
                      </div>
                    </div>

                    {f.observacoes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                        "{f.observacoes}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* Modal Confirm Supplier Exclusion */}
      {fornecedorParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Remover Fornecedor?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deseja remover <strong className="text-slate-800">"{fornecedorParaExcluir.nome}"</strong> do ranking?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setFornecedorParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoFornecedor}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Segment Exclusion */}
      {segmentoParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Segmento?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tem certeza que deseja excluir o segmento <strong className="text-slate-800">"{segmentoParaExcluir}"</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setSegmentoParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoSegmento}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Fornecedor */}
      {fornecedorParaEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full my-8 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Editar Fornecedor</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {fornecedorParaEditar.id}</p>
                </div>
              </div>
              <button
                onClick={() => setFornecedorParaEditar(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFornecedor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Empresa / Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={editCnpj}
                    onChange={(e) => setEditCnpj(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Segmento</label>
                  <select
                    value={editSegmento}
                    onChange={(e) => setEditSegmento(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    {segmentos.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={editTelefone}
                    onChange={(e) => setEditTelefone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              {/* Condominios Atendidos */}
              <div className="bg-[#f8faf6] p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Condomínios Atendidos ({editSelectedCondoIds.length})
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                  {condominios.map((c) => {
                    const checked = editSelectedCondoIds.includes(c.nome);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleEditCondo(c.nome)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          checked
                            ? 'bg-[#2d5a32] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                        <span>{c.nome}</span>
                      </button>
                    );
                  })}
                  {editOutrosCondominios.map((cNome) => (
                    <span
                      key={cNome}
                      className="bg-[#2d5a32] text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <span>{cNome}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditCustomCondo(cNome)}
                        className="hover:text-rose-300 ml-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Adicionar outro condomínio..."
                    value={editCustomCondoInput}
                    onChange={(e) => setEditCustomCondoInput(e.target.value)}
                    onKeyDown={handleAddEditCustomCondo}
                    className="p-1.5 border rounded-lg text-xs flex-1 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditCustomCondo}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Avaliações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qualidade do Serviço</label>
                  <select
                    value={editAvaliacaoServico}
                    onChange={(e) => setEditAvaliacaoServico(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-xl text-xs font-semibold text-amber-700 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value={5}>5 Estrelas ★★★★★</option>
                    <option value={4}>4 Estrelas ★★★★☆</option>
                    <option value={3}>3 Estrelas ★★★☆☆</option>
                    <option value={2}>2 Estrelas ★★☆☆☆</option>
                    <option value={1}>1 Estrela ★☆☆☆☆</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custo Benefício</label>
                  <select
                    value={editAvaliacaoCustoBeneficio}
                    onChange={(e) => setEditAvaliacaoCustoBeneficio(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-xl text-xs font-semibold text-amber-700 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value={5}>5 Estrelas ★★★★★</option>
                    <option value={4}>4 Estrelas ★★★★☆</option>
                    <option value={3}>3 Estrelas ★★★☆☆</option>
                    <option value={2}>2 Estrelas ★★☆☆☆</option>
                    <option value={1}>1 Estrela ★☆☆☆☆</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={editObservacoes}
                  onChange={(e) => setEditObservacoes(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setFornecedorParaEditar(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2d5a32] hover:bg-[#1f3f23] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
