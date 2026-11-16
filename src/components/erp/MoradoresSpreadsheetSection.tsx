import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Condominio, MoradorCondominio } from '../../types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  Search,
  Users,
  CheckCircle2,
  Building2,
  Car,
  Mail,
  Phone,
  UserCheck,
  LayoutGrid,
  Table as TableIcon,
  Home,
  KeyRound,
  Sparkles
} from 'lucide-react';

interface MoradoresSpreadsheetSectionProps {
  condominios: Condominio[];
  setCondominios: React.Dispatch<React.SetStateAction<Condominio[]>>;
  selectedCondoId?: string;
}

export const MoradoresSpreadsheetSection: React.FC<MoradoresSpreadsheetSectionProps> = ({
  condominios,
  setCondominios,
  selectedCondoId: initialCondoId
}) => {
  const [condominioSelecionadoId, setCondominioSelecionadoId] = useState<string>(
    initialCondoId || condominios[0]?.id || 'COND-101'
  );
  const [buscaMorador, setBuscaMorador] = useState('');
  const [filtroEspecificidade, setFiltroEspecificidade] = useState<string>('todos');
  const [filtroBloco, setFiltroBloco] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Formulário para adicionar morador manualmente
  const [bloco, setBloco] = useState('');
  const [unidade, setUnidade] = useState('');
  const [nomeMorador, setNomeMorador] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [especificidade, setEspecificidade] = useState<MoradorCondominio['especificidade']>('Morador');
  const [vagaGaragem, setVagaGaragem] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const condominioAtual =
    condominios.find((c) => c.id === condominioSelecionadoId) || condominios[0];

  const moradoresAtuais: MoradorCondominio[] = condominioAtual?.moradores || [];

  // Estatísticas Rápidas (KPIs)
  const totalUnidades = moradoresAtuais.length;
  const totalProprietarios = moradoresAtuais.filter(
    (m) => m.especificidade === 'Proprietário' || m.especificidade === 'Morador e Proprietário'
  ).length;
  const totalMoradoresInquilinos = moradoresAtuais.filter(
    (m) => m.especificidade === 'Morador' || m.especificidade === 'Inquilino'
  ).length;
  const totalVagasCadastradas = moradoresAtuais.filter((m) => m.vagaGaragem && m.vagaGaragem.trim() !== '').length;

  const blocosUnicos = Array.from(new Set(moradoresAtuais.map((m) => m.bloco || 'Único')));

  const salvarMoradoresNoCondominio = (novaLista: MoradorCondominio[]) => {
    if (!condominioAtual) return;
    setCondominios((prev) =>
      prev.map((c) => (c.id === condominioAtual.id ? { ...c, moradores: novaLista } : c))
    );
  };

  // Adicionar manualmente 1 morador
  const handleAddMoradorManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidade.trim() || !condominioAtual) return;

    const novo: MoradorCondominio = {
      id: `MOR-${Date.now().toString().slice(-5)}`,
      condominioId: condominioAtual.id,
      condominioNome: condominioAtual.nome,
      bloco: bloco.trim() || 'Único',
      unidade: unidade.trim(),
      nomeMorador: nomeMorador.trim() || `Morador Unid. ${unidade.trim()}`,
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      especificidade,
      vagaGaragem: vagaGaragem.trim()
    };

    const atualizados = [...moradoresAtuais, novo];
    salvarMoradoresNoCondominio(atualizados);

    setBloco('');
    setUnidade('');
    setNomeMorador('');
    setEmail('');
    setWhatsapp('');
    setVagaGaragem('');
    setNotice(`Morador da unidade ${novo.bloco} - ${novo.unidade} adicionado com sucesso!`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleRemoverMorador = (id: string) => {
    const atualizados = moradoresAtuais.filter((m) => m.id !== id);
    salvarMoradoresNoCondominio(atualizados);
  };

  const handleLimparTodosMoradores = () => {
    if (!condominioAtual) return;
    if (window.confirm(`Deseja realmente limpar todos os moradores importados de "${condominioAtual.nome}"?`)) {
      salvarMoradoresNoCondominio([]);
      setNotice('Lista de moradores limpa.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  // Normalizar especificidade vinda do Excel
  const normalizarEspecificidade = (valorBruto: string): MoradorCondominio['especificidade'] => {
    const v = (valorBruto || '').toLowerCase().trim();
    if (v.includes('ambos') || (v.includes('morador') && v.includes('propriet'))) {
      return 'Morador e Proprietário';
    }
    if (v.includes('propriet')) return 'Proprietário';
    if (v.includes('inquilino') || v.includes('locat')) return 'Inquilino';
    return 'Morador';
  };

  // Importar Planilha Excel (.xlsx, .xls, .csv)
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !condominioAtual) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          alert('A planilha selecionada está vazia.');
          return;
        }

        const novosImportados: MoradorCondominio[] = jsonRows
          .map((row, index) => {
            const keys = Object.keys(row);
            const findVal = (termos: string[]) => {
              const foundKey = keys.find((k) => {
                const normKey = k
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '');
                return termos.some((t) => normKey.includes(t));
              });
              return foundKey ? String(row[foundKey] ?? '').trim() : '';
            };

            const colBloco = findVal(['bloco', 'torre', 'quadra']) || 'Único';
            const colUnidade = findVal(['unidade', 'apto', 'apartamento', 'casa', 'lote']);
            const colNome = findVal(['nome', 'morador', 'condomino', 'proprietario', 'responsavel']);
            const colEmail = findVal(['email', 'e-mail', 'correio']);
            const colNumero = findVal(['numero', 'telefone', 'whatsapp', 'celular', 'fone', 'contato', 'wpp']);
            const colEspec = findVal(['especificidade', 'especidade', 'tipo', 'perfil', 'vinculo', 'categoria']);
            const colVaga = findVal(['vaga', 'garagem', 'estacionamento', 'box']);

            if (!colUnidade && !colNome && !colEmail && !colNumero) return null;

            return {
              id: `IMP-${Date.now()}-${index}`,
              condominioId: condominioAtual.id,
              condominioNome: condominioAtual.nome,
              bloco: colBloco,
              unidade: colUnidade || String(index + 1),
              nomeMorador: colNome || `Morador Unid. ${colUnidade || index + 1}`,
              email: colEmail,
              whatsapp: colNumero,
              especificidade: normalizarEspecificidade(colEspec),
              vagaGaragem: colVaga
            } as MoradorCondominio;
          })
          .filter((item): item is MoradorCondominio => item !== null);

        if (novosImportados.length === 0) {
          alert('Não foi possível identificar linhas válidas na planilha.');
          return;
        }

        salvarMoradoresNoCondominio([...moradoresAtuais, ...novosImportados]);
        setNotice(
          `Planilha Excel importada com sucesso! ${novosImportados.length} moradores vinculados ao condomínio "${condominioAtual.nome}".`
        );
        setTimeout(() => setNotice(null), 5000);
      } catch (err) {
        console.error('Erro ao ler arquivo Excel:', err);
        alert('Erro ao processar a planilha Excel. Verifique se o arquivo é .xlsx, .xls ou .csv.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Baixar Modelo Excel (.xlsx) pronto para preenchimento
  const handleDownloadModeloExcel = () => {
    const dadosExemplo = [
      {
        Bloco: 'Bloco A',
        Unidade: '101',
        'Nome do Morador': '',
        'E-mail': '',
        'Número / WhatsApp': '',
        Especificidade: 'Morador',
        'Vaga de Garagem': 'G1-01'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(dadosExemplo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Moradores_Condominio');
    XLSX.writeFile(wb, `Modelo_Moradores_${condominioAtual?.id || 'Condominio'}.xlsx`);
  };

  // Exportar tabela atual em Excel (.xlsx)
  const handleExportarTabelaExcel = () => {
    if (!condominioAtual || moradoresAtuais.length === 0) return;

    const dadosExport = moradoresAtuais.map((m) => ({
      Condomínio: condominioAtual.nome,
      Bloco: m.bloco,
      Unidade: m.unidade,
      'Nome do Morador': m.nomeMorador,
      'E-mail': m.email,
      'Número / WhatsApp': m.whatsapp,
      Especificidade: m.especificidade,
      'Vaga de Garagem': m.vagaGaragem
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Moradores');
    XLSX.writeFile(wb, `Base_Moradores_${condominioAtual.nome.replace(/\s+/g, '_')}.xlsx`);
  };

  const getIniciais = (nome: string) => {
    const partes = (nome || 'M').trim().split(' ');
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0] || ''}${partes[partes.length - 1][0] || ''}`.toUpperCase();
  };

  const moradoresFiltrados = moradoresAtuais.filter((m) => {
    const termo = buscaMorador.toLowerCase();
    const matchBusca =
      m.bloco.toLowerCase().includes(termo) ||
      m.unidade.toLowerCase().includes(termo) ||
      m.nomeMorador.toLowerCase().includes(termo) ||
      m.email.toLowerCase().includes(termo) ||
      m.whatsapp.toLowerCase().includes(termo) ||
      m.vagaGaragem.toLowerCase().includes(termo);

    const matchEspec =
      filtroEspecificidade === 'todos' || m.especificidade === filtroEspecificidade;

    const matchBloco = filtroBloco === 'todos' || m.bloco === filtroBloco;

    return matchBusca && matchEspec && matchBloco;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Banner Superior Premium */}
      <div className="bg-linear-to-r from-[#1c3220] via-[#234228] to-[#2d5a32] px-6 py-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-inner shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Base de Unidades, Moradores, Proprietários & Vagas
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold border border-emerald-300/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Sincronizado c/ Chatbot & Garagem
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Importação inteligente via Excel (`.xlsx`, `.xls`, `.csv`) com vínculo automático de Blocos, Unidades, Contatos e Vagas.
              </p>
            </div>
          </div>

          {/* Seletor de Condomínio Destacado */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/15">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider text-emerald-200 font-bold">
                  Condomínio Ativo
                </span>
                <select
                  value={condominioAtual?.id || ''}
                  onChange={(e) => setCondominioSelecionadoId(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-white outline-hidden cursor-pointer pr-2"
                >
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900 font-semibold">
                      [{c.id}] {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Excel</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadModeloExcel}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              title="Baixar planilha modelo pronta para preencher no Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Modelo</span>
            </button>

            {moradoresAtuais.length > 0 && (
              <button
                type="button"
                onClick={handleExportarTabelaExcel}
                className="px-3.5 py-2.5 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-200 border border-emerald-500/30 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar ({moradoresAtuais.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 bg-linear-to-b from-[#f8faf6] to-white">
        {notice && (
          <div className="bg-emerald-900 text-emerald-50 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm border border-emerald-700 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-emerald-300 hover:text-white text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Cards de KPIs Estéticos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Unidades Mapeadas
              </span>
              <span className="text-2xl font-black text-[#1c3220] font-mono mt-0.5 block">
                {totalUnidades}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {blocosUnicos.length} {blocosUnicos.length === 1 ? 'bloco ativo' : 'blocos ativos'}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#e8f0e6] text-[#2d5a32] flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Proprietários
              </span>
              <span className="text-2xl font-black text-amber-600 font-mono mt-0.5 block">
                {totalProprietarios}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Titulares / Condôminos
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Moradores / Inquilinos
              </span>
              <span className="text-2xl font-black text-blue-600 font-mono mt-0.5 block">
                {totalMoradoresInquilinos}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Residentes ativos
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Vagas Vinculadas
              </span>
              <span className="text-2xl font-black text-[#2d5a32] font-mono mt-0.5 block">
                {totalVagasCadastradas}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Boxes de estacionamento
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#2d5a32] border border-emerald-200/60 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Barra de Controles: Busca, Filtros, Alternador Cards/Tabela e Botão Novo */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar unidade, morador, vaga, WhatsApp..."
                value={buscaMorador}
                onChange={(e) => setBuscaMorador(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#f8faf6] rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-[#2d5a32] focus:bg-white transition"
              />
            </div>

            {/* Filtro por Bloco */}
            {blocosUnicos.length > 1 && (
              <select
                value={filtroBloco}
                onChange={(e) => setFiltroBloco(e.target.value)}
                className="px-3 py-2 bg-[#f8faf6] border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              >
                <option value="todos">Todos os Blocos ({blocosUnicos.length})</option>
                {blocosUnicos.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            {/* Pills de Especificidade */}
            <div className="flex items-center bg-[#f2f5f1] p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'Morador', label: 'Moradores' },
                { id: 'Proprietário', label: 'Proprietários' },
                { id: 'Morador e Proprietário', label: 'Morador & Prop.' },
                { id: 'Inquilino', label: 'Inquilinos' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroEspecificidade(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                    filtroEspecificidade === tab.id
                      ? 'bg-[#1c3220] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Alternador de Visualização (Tabela vs Cards) */}
            <div className="flex items-center bg-[#f2f5f1] p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                  viewMode === 'table'
                    ? 'bg-white text-[#1c3220] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visualizar em Planilha Moderna"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Planilha</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#1c3220] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visualizar em Cartões de Unidades"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border ${
                showAddForm
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-[#2d5a32] hover:bg-[#1c3220] text-white border-[#2d5a32]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Fechar Cadastro' : 'Nova Unidade'}</span>
            </button>

            {moradoresAtuais.length > 0 && (
              <button
                type="button"
                onClick={handleLimparTodosMoradores}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition cursor-pointer"
                title="Limpar toda a tabela deste condomínio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Formulário Expansível para Adicionar Manualmente */}
        {showAddForm && (
          <form
            onSubmit={handleAddMoradorManual}
            className="bg-[#f2f5f1] border border-[#2d5a32]/25 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end shadow-inner animate-in fade-in duration-150"
          >
            <div className="lg:col-span-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Bloco *</label>
              <input
                type="text"
                placeholder="Bloco A"
                value={bloco}
                onChange={(e) => setBloco(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Unidade *</label>
              <input
                type="text"
                required
                placeholder="101"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Nome do Morador</label>
              <input
                type="text"
                placeholder="Nome completo"
                value={nomeMorador}
                onChange={(e) => setNomeMorador(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">E-mail</label>
              <input
                type="email"
                placeholder="morador@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">WhatsApp</label>
              <input
                type="text"
                placeholder="5541999999999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Especificidade</label>
              <select
                value={especificidade}
                onChange={(e) => setEspecificidade(e.target.value as MoradorCondominio['especificidade'])}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              >
                <option value="Morador">Morador</option>
                <option value="Proprietário">Proprietário</option>
                <option value="Morador e Proprietário">Morador e Proprietário</option>
                <option value="Inquilino">Inquilino</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Vaga</label>
              <input
                type="text"
                placeholder="G1-12"
                value={vagaGaragem}
                onChange={(e) => setVagaGaragem(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>

            <div className="lg:col-span-1">
              <button
                type="submit"
                className="w-full bg-[#1c3220] hover:bg-[#2d5a32] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </form>
        )}

        {/* Estado Vazio Estilizado (Dropzone Visual) */}
        {moradoresFiltrados.length === 0 ? (
          <div className="border-2 border-dashed border-slate-300 hover:border-[#2d5a32] rounded-3xl p-10 text-center bg-white transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-[#e8f0e6] text-[#2d5a32] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-extrabold text-[#1c3220]">
              {moradoresAtuais.length === 0
                ? `Nenhuma planilha importada para ${condominioAtual?.nome}`
                : 'Nenhum morador encontrado para os filtros aplicados'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Importe sua planilha `.xlsx` ou `.csv` contendo Blocos, Unidades, E-mail, WhatsApp, Especificidade (Morador/Proprietário) e Vagas de Garagem.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-[#2d5a32] hover:bg-[#1c3220] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition"
              >
                <Upload className="w-4 h-4" />
                <span>Selecionar Planilha Excel (.xlsx / .csv)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Manualmente</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* Visualização 1: Tabela Moderna Elegante */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#1c3220] text-emerald-100 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-3.5 px-4 border-b border-[#2d5a32]">Bloco & Unidade</th>
                    <th className="py-3.5 px-4 border-b border-[#2d5a32]">Morador / Responsável</th>
                    <th className="py-3.5 px-4 border-b border-[#2d5a32]">Perfil / Vínculo</th>
                    <th className="py-3.5 px-4 border-b border-[#2d5a32]">Contato Rápido (WhatsApp & E-mail)</th>
                    <th className="py-3.5 px-4 border-b border-[#2d5a32]">Vaga de Garagem</th>
                    <th className="py-3.5 px-4 border-b border-[#2d5a32] text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {moradoresFiltrados.map((m) => (
                    <tr key={m.id} className="hover:bg-[#f4f8f3] transition-colors group">
                      {/* Bloco & Unidade */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="px-2.5 py-1.5 rounded-xl bg-[#f2f5f1] border border-slate-200 text-center min-w-[64px]">
                            <span className="block text-[9px] font-bold uppercase text-slate-400 leading-none">
                              {m.bloco}
                            </span>
                            <span className="text-sm font-black text-[#1c3220] font-mono">
                              {m.unidade}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Morador com Avatar de Iniciais */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#2d5a32] to-[#1c3220] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                            {getIniciais(m.nomeMorador)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {m.nomeMorador}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {condominioAtual?.nome}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Especificidade Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            m.especificidade === 'Proprietário'
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : m.especificidade === 'Morador e Proprietário'
                              ? 'bg-emerald-50 text-[#1c3220] border-emerald-200'
                              : m.especificidade === 'Inquilino'
                              ? 'bg-purple-50 text-purple-900 border-purple-200'
                              : 'bg-blue-50 text-blue-900 border-blue-200'
                          }`}
                        >
                          <UserCheck className="w-3 h-3 opacity-75" />
                          {m.especificidade}
                        </span>
                      </td>

                      {/* Contatos (Pills Clicáveis) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {m.whatsapp ? (
                            <a
                              href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#2d5a32] border border-emerald-200/80 font-mono text-[11px] font-bold transition"
                              title="Chamar no WhatsApp"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{m.whatsapp}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sem telefone</span>
                          )}

                          {m.email && (
                            <a
                              href={`mailto:${m.email}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition"
                              title="Enviar E-mail"
                            >
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="max-w-[160px] truncate">{m.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Vaga de Garagem */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {m.vagaGaragem ? (
                          <span className="inline-flex items-center gap-1.5 bg-[#f2f5f1] text-[#1c3220] px-3 py-1 rounded-xl border border-slate-300 font-mono font-bold text-xs shadow-2xs">
                            <Car className="w-3.5 h-3.5 text-[#2d5a32]" />
                            <span>{m.vagaGaragem}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoverMorador(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer transition"
                          title="Excluir unidade da lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Visualização 2: Cards Modernos de Unidades */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
            {moradoresFiltrados.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-[#2d5a32]/40 transition flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#1c3220] text-white flex flex-col items-center justify-center font-mono shrink-0">
                      <span className="text-[8px] uppercase text-emerald-300 font-bold leading-none">
                        {m.bloco.replace('Bloco ', 'BL ')}
                      </span>
                      <span className="text-xs font-black leading-tight">{m.unidade}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        {m.nomeMorador}
                      </h4>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          m.especificidade === 'Proprietário'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : m.especificidade === 'Morador e Proprietário'
                            ? 'bg-emerald-50 text-[#2d5a32] border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {m.especificidade}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoverMorador(m.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3 h-3" /> WhatsApp:
                    </span>
                    {m.whatsapp ? (
                      <a
                        href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-bold text-[#2d5a32] hover:underline"
                      >
                        {m.whatsapp}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3 h-3" /> E-mail:
                    </span>
                    <span className="font-mono text-slate-700 truncate max-w-[160px]">
                      {m.email || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Car className="w-3 h-3" /> Vaga Garagem:
                    </span>
                    {m.vagaGaragem ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#f2f5f1] border border-slate-200 font-mono font-bold text-[#1c3220] text-[10px]">
                        {m.vagaGaragem}
                      </span>
                    ) : (
                      <span className="text-slate-400">Sem vaga</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé Informativo da Tabela */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
          <span>
            Exibindo <strong>{moradoresFiltrados.length}</strong> de <strong>{moradoresAtuais.length}</strong> registros vinculados a{' '}
            <strong className="text-[#1c3220]">{condominioAtual?.nome}</strong>
          </span>
          <span className="text-slate-400">
            Colunas aceitas no Excel: Bloco, Unidade, Nome, E-mail, Número/WhatsApp, Especificidade e Vaga
          </span>
        </div>
      </div>
    </div>
  );
};
