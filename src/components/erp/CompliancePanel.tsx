import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  FileText,
  Upload,
  Plus,
  Trash2,
  Search,
  Calendar,
  Building2,
  Download,
  Eye,
  Filter,
  X,
  CheckCircle2,
  ListFilter,
  FilePlus2,
  ArrowUpDown
} from 'lucide-react';
import { Condominio } from '../../types';
import { subscribeToCollection, saveCollectionToFirestore } from '../../lib/firebase';

export interface LaudoComplianceDoc {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  condominio_id: string;
  condominio_nome: string;
  arquivo_nome?: string;
  arquivo_pdf_url?: string;
  criado_em?: string;
  // Campos legados
  tipo_laudo?: string;
  data_emissao?: string;
  data_vencimento?: string;
  status?: string;
}

interface CompliancePanelProps {
  condominios?: Condominio[];
}

const LAUDOS_INICIAIS: LaudoComplianceDoc[] = [];

export const CompliancePanel: React.FC<CompliancePanelProps> = ({ condominios = [] }) => {
  const [abaAtiva, setAbaAtiva] = useState<'lista_laudos' | 'preencher_dados'>('lista_laudos');

  const [laudos, setLaudos] = useState<LaudoComplianceDoc[]>(() => {
    try {
      const saved = localStorage.getItem('vos_compliance_laudos_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (l) =>
              l.condominio_nome !== 'Residencial Jardim Botânico' &&
              l.condominio_nome !== 'Condomínio Solar das Araucárias'
          );
        }
      }
      return LAUDOS_INICIAIS;
    } catch {
      return LAUDOS_INICIAIS;
    }
  });

  // Estados da Aba "Preencher Dados (Incluir Laudo PDF)"
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataDoc, setDataDoc] = useState(() => new Date().toISOString().split('T')[0]);
  const [condominioSelecionadoId, setCondominioSelecionadoId] = useState<string>(
    condominios[0]?.id || 'COND-101'
  );
  const [arquivoNome, setArquivoNome] = useState('');
  const [arquivoPdfDataUrl, setArquivoPdfDataUrl] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Estados dos Filtros diretamente nas Colunas da Tabela
  const [colFiltroCondominio, setColFiltroCondominio] = useState<string>('todos');
  const [colFiltroTitulo, setColFiltroTitulo] = useState<string>('');
  const [colFiltroDescricao, setColFiltroDescricao] = useState<string>('');
  const [colFiltroData, setColFiltroData] = useState<string>('');
  const [colFiltroPdf, setColFiltroPdf] = useState<string>('todos'); // 'todos' | 'com_pdf' | 'sem_pdf'
  const [ordenacaoData, setOrdenacaoData] = useState<'desc' | 'asc'>('desc');

  // Modal de visualização de PDF
  const [pdfPreviewItem, setPdfPreviewItem] = useState<LaudoComplianceDoc | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = subscribeToCollection<LaudoComplianceDoc>(
      'complianceLaudos',
      (remoteData) => {
        if (Array.isArray(remoteData)) {
          const filtrados = remoteData.filter(
            (item) =>
              item.condominio_nome !== 'Residencial Jardim Botânico' &&
              item.condominio_nome !== 'Condomínio Solar das Araucárias'
          );
          const normalizados = filtrados.map((item) => ({
            ...item,
            titulo: item.titulo || item.tipo_laudo || 'Laudo Técnico',
            descricao: item.descricao || 'Documento técnico de compliance condominial.',
            data:
              item.data ||
              item.data_vencimento ||
              item.data_emissao ||
              new Date().toISOString().split('T')[0],
            condominio_nome: item.condominio_nome || 'Condomínio Geral'
          }));
          setLaudos(normalizados);
        }
      },
      LAUDOS_INICIAIS
    );
    return () => unsub();
  }, []);

  const persistirLaudos = (novaLista: LaudoComplianceDoc[]) => {
    setLaudos(novaLista);
    try {
      localStorage.setItem('vos_compliance_laudos_v2', JSON.stringify(novaLista));
      const listaParaNuvem = novaLista.map((l) => ({
        ...l,
        arquivo_pdf_url:
          l.arquivo_pdf_url && l.arquivo_pdf_url.length > 700000 ? undefined : l.arquivo_pdf_url
      }));
      saveCollectionToFirestore('complianceLaudos', listaParaNuvem);
    } catch (e) {
      console.warn('Aviso ao salvar laudo localmente:', e);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo em formato PDF (.pdf).');
      return;
    }

    setArquivoNome(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result;
      if (typeof result === 'string') {
        setArquivoPdfDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdicionarLaudo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const condoEncontrado = condominios.find((c) => c.id === condominioSelecionadoId);
    const nomeCondo = condoEncontrado ? condoEncontrado.nome : condominioSelecionadoId;

    const novoLaudo: LaudoComplianceDoc = {
      id: `LAU-${Date.now().toString().slice(-6)}`,
      titulo: titulo.trim(),
      descricao: descricao.trim() || 'Sem descrição complementar.',
      data: dataDoc || new Date().toISOString().split('T')[0],
      condominio_id: condominioSelecionadoId,
      condominio_nome: nomeCondo,
      arquivo_nome: arquivoNome || undefined,
      arquivo_pdf_url: arquivoPdfDataUrl || undefined,
      criado_em: new Date().toISOString()
    };

    const atualizados = [novoLaudo, ...laudos];
    persistirLaudos(atualizados);

    setTitulo('');
    setDescricao('');
    setArquivoNome('');
    setArquivoPdfDataUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    setNotice(`Laudo "${novoLaudo.titulo}" salvo com sucesso para ${nomeCondo}!`);
    setAbaAtiva('lista_laudos');
    setTimeout(() => setNotice(null), 4000);
  };

  const handleRemoverLaudo = (id: string) => {
    const atualizados = laudos.filter((l) => l.id !== id);
    persistirLaudos(atualizados);
  };

  const limparFiltrosColunas = () => {
    setColFiltroCondominio('todos');
    setColFiltroTitulo('');
    setColFiltroDescricao('');
    setColFiltroData('');
    setColFiltroPdf('todos');
  };

  const temFiltroAtivo =
    colFiltroCondominio !== 'todos' ||
    colFiltroTitulo !== '' ||
    colFiltroDescricao !== '' ||
    colFiltroData !== '' ||
    colFiltroPdf !== 'todos';

  // Lista única de condomínios presentes tanto no cadastro quanto nos laudos
  const opcoesCondominios = Array.from(
    new Map(
      [
        ...condominios.map((c) => ({ id: c.id, nome: c.nome })),
        ...laudos.map((l) => ({ id: l.condominio_id, nome: l.condominio_nome }))
      ].map((item) => [item.nome, item])
    ).values()
  );

  const laudosFiltrados = laudos
    .filter((l) => {
      const matchCondo =
        colFiltroCondominio === 'todos' ||
        l.condominio_id === colFiltroCondominio ||
        l.condominio_nome === colFiltroCondominio;

      const matchTitulo =
        !colFiltroTitulo ||
        (l.titulo || '').toLowerCase().includes(colFiltroTitulo.toLowerCase());

      const matchDescricao =
        !colFiltroDescricao ||
        (l.descricao || '').toLowerCase().includes(colFiltroDescricao.toLowerCase());

      const matchData = !colFiltroData || (l.data && l.data.includes(colFiltroData));

      const matchPdf =
        colFiltroPdf === 'todos' ||
        (colFiltroPdf === 'com_pdf' && Boolean(l.arquivo_nome)) ||
        (colFiltroPdf === 'sem_pdf' && !l.arquivo_nome);

      return matchCondo && matchTitulo && matchDescricao && matchData && matchPdf;
    })
    .sort((a, b) => {
      const dA = a.data || '';
      const dB = b.data || '';
      return ordenacaoData === 'desc' ? dB.localeCompare(dA) : dA.localeCompare(dB);
    });

  const formatarDataBr = (isoDate: string) => {
    if (!isoDate) return '—';
    const partes = isoDate.split('-');
    if (partes.length !== 3) return isoDate;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden mt-6">
      {/* Cabeçalho com Abas de Navegação */}
      <div className="bg-linear-to-r from-[#1c3220] to-[#2d5a32] px-6 py-4 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 p-2.5 rounded-2xl border border-white/20">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">
              Compliance e Laudos Técnicos
            </h3>
            <p className="text-xs text-emerald-100/80">
              Consulte a planilha com filtros diretos por coluna ou alterne para a aba de preenchimento de novos laudos em PDF.
            </p>
          </div>
        </div>

        {/* Seletor de Abas Internas */}
        <div className="flex items-center gap-2 bg-black/25 p-1.5 rounded-2xl border border-white/15 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setAbaAtiva('lista_laudos')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              abaAtiva === 'lista_laudos'
                ? 'bg-white text-[#1c3220] shadow-xs'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <ListFilter className="w-4 h-4 text-[#2d5a32]" />
            <span>Planilha & Filtros nas Colunas ({laudos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('preencher_dados')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              abaAtiva === 'preencher_dados'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <FilePlus2 className="w-4 h-4" />
            <span>+ Preencher Dados / Anexar PDF</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {notice && (
          <div className="bg-emerald-900 text-emerald-50 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-emerald-300 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* ABA 1: PLANILHA COM FILTRO DIRETAMENTE NAS COLUNAS */}
        {abaAtiva === 'lista_laudos' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2d5a32]" />
                <span>
                  Use os campos abaixo do título de cada coluna para filtrar por <strong>Condomínio</strong>, <strong>Título</strong>, <strong>Descrição</strong>, <strong>Data</strong> ou <strong>PDF</strong>.
                </span>
              </div>

              <div className="flex items-center gap-2">
                {temFiltroAtivo && (
                  <button
                    type="button"
                    onClick={limparFiltrosColunas}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpar Filtros das Colunas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAbaAtiva('preencher_dados')}
                  className="px-3.5 py-1.5 bg-[#2d5a32] hover:bg-[#1c3220] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Laudo PDF</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#1c3220] text-emerald-100">
                    {/* Linha 1: Títulos das Colunas */}
                    <tr className="font-bold text-[10px] uppercase tracking-wider border-b border-[#2d5a32]">
                      <th className="py-3 px-4 min-w-[200px]">Condomínio</th>
                      <th className="py-3 px-4 min-w-[200px]">Título do Laudo</th>
                      <th className="py-3 px-4 min-w-[240px]">Descrição</th>
                      <th className="py-3 px-4 min-w-[150px]">
                        <button
                          type="button"
                          onClick={() =>
                            setOrdenacaoData((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                          }
                          className="flex items-center gap-1 uppercase font-bold text-emerald-100 hover:text-white cursor-pointer"
                          title="Clique para inverter a ordem de data"
                        >
                          <span>Data</span>
                          <ArrowUpDown className="w-3 h-3 text-emerald-300" />
                        </button>
                      </th>
                      <th className="py-3 px-4 min-w-[180px]">Arquivo em PDF</th>
                      <th className="py-3 px-4 text-right w-20">Ações</th>
                    </tr>

                    {/* Linha 2: Filtros Diretamente em Cada Coluna */}
                    <tr className="bg-[#244229] border-b border-[#2d5a32]">
                      {/* Filtro Coluna 1: Condomínio */}
                      <th className="p-2">
                        <select
                          value={colFiltroCondominio}
                          onChange={(e) => setColFiltroCondominio(e.target.value)}
                          className="w-full bg-white text-slate-800 border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-hidden focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="todos">Todos ({opcoesCondominios.length})</option>
                          {opcoesCondominios.map((c) => (
                            <option key={c.id || c.nome} value={c.nome}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      </th>

                      {/* Filtro Coluna 2: Título */}
                      <th className="p-2">
                        <div className="relative">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            placeholder="Filtrar título..."
                            value={colFiltroTitulo}
                            onChange={(e) => setColFiltroTitulo(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 bg-white text-slate-800 border border-slate-300 rounded-lg text-[11px] font-normal outline-hidden focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                      </th>

                      {/* Filtro Coluna 3: Descrição */}
                      <th className="p-2">
                        <div className="relative">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            placeholder="Filtrar descrição..."
                            value={colFiltroDescricao}
                            onChange={(e) => setColFiltroDescricao(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 bg-white text-slate-800 border border-slate-300 rounded-lg text-[11px] font-normal outline-hidden focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                      </th>

                      {/* Filtro Coluna 4: Data */}
                      <th className="p-2">
                        <input
                          type="date"
                          value={colFiltroData}
                          onChange={(e) => setColFiltroData(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white text-slate-800 border border-slate-300 rounded-lg text-[11px] font-mono outline-hidden focus:ring-2 focus:ring-amber-400"
                        />
                      </th>

                      {/* Filtro Coluna 5: Arquivo PDF */}
                      <th className="p-2">
                        <select
                          value={colFiltroPdf}
                          onChange={(e) => setColFiltroPdf(e.target.value)}
                          className="w-full bg-white text-slate-800 border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-hidden focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="todos">Todos os Arquivos</option>
                          <option value="com_pdf">Com PDF Anexado</option>
                          <option value="sem_pdf">Sem PDF</option>
                        </select>
                      </th>

                      {/* Coluna 6: Contador / Limpar */}
                      <th className="p-2 text-right">
                        <span className="text-[10px] font-mono text-emerald-200 px-2 py-1 bg-black/20 rounded-lg">
                          {laudosFiltrados.length}/{laudos.length}
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {laudosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                          Nenhum documento ou laudo técnico encontrado para os filtros de coluna informados.
                        </td>
                      </tr>
                    ) : (
                      laudosFiltrados.map((laudo) => (
                        <tr key={laudo.id} className="hover:bg-[#f8faf6] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#1c3220] whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#2d5a32] shrink-0" />
                              <span>{laudo.condominio_nome}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {laudo.titulo}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                            <p className="line-clamp-2 leading-relaxed">{laudo.descricao}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              <Calendar className="w-3.5 h-3.5 text-[#2d5a32]" />
                              {formatarDataBr(laudo.data)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {laudo.arquivo_nome ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-medium text-[11px]">
                                  <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span className="max-w-[160px] truncate">{laudo.arquivo_nome}</span>
                                </span>

                                {laudo.arquivo_pdf_url && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setPdfPreviewItem(laudo)}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#2d5a32] rounded-lg border border-emerald-200 cursor-pointer transition"
                                      title="Visualizar PDF"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <a
                                      href={laudo.arquivo_pdf_url}
                                      download={laudo.arquivo_nome}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
                                      title="Baixar PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Sem PDF anexado</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoverLaudo(laudo.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Excluir Laudo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: PREENCHER DADOS & ANEXAR ARQUIVO EM PDF */}
        {abaAtiva === 'preencher_dados' && (
          <form
            onSubmit={handleAdicionarLaudo}
            className="bg-[#f2f5f1] border border-slate-200/90 p-6 rounded-2xl space-y-5 animate-in fade-in duration-150"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-[#1c3220] flex items-center gap-2">
                  <FilePlus2 className="w-4 h-4 text-[#2d5a32]" />
                  <span>Ficha de Cadastro de Laudo Técnico / Compliance</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os campos abaixo e anexe o arquivo em PDF. Ao salvar, o documento irá direto para a planilha principal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAbaAtiva('lista_laudos')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white border border-slate-300 self-start sm:self-auto cursor-pointer"
              >
                ← Voltar para a Planilha
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Condomínio */}
              <div className="md:col-span-5">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Condomínio *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#2d5a32] absolute left-3.5 top-3" />
                  <select
                    value={condominioSelecionadoId}
                    onChange={(e) => setCondominioSelecionadoId(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    {condominios.length > 0 ? (
                      condominios.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{c.id}] {c.nome}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="COND-101">[COND-101] Residencial Cabral Cruz</option>
                        <option value="COND-100">[COND-100] VOS CONDO</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Título */}
              <div className="md:col-span-4">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Título do Laudo / Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AVCB Corpo de Bombeiros 2026 / Laudo SPDA"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              {/* Data */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Data do Laudo / Vencimento *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={dataDoc}
                    onChange={(e) => setDataDoc(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="md:col-span-7">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Descrição Técnica / Observações
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva detalhes da vistoria, número da ART, empresa responsável ou recomendações técnicas..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-hidden focus:ring-2 focus:ring-[#2d5a32] resize-none"
                />
              </div>

              {/* Upload Arquivo em PDF */}
              <div className="md:col-span-5 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Arquivo em PDF (.pdf)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                      arquivoNome
                        ? 'bg-emerald-50 border-emerald-500 text-[#1c3220]'
                        : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-[#2d5a32] mx-auto mb-1" />
                    <span className="text-xs font-bold block truncate">
                      {arquivoNome ? arquivoNome : 'Clique para anexar o arquivo PDF'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Suporta visualização e download direto na tabela
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAbaAtiva('lista_laudos')}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#2d5a32] hover:bg-[#1c3220] text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Laudo na Planilha</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal de Visualização de PDF Integrado */}
      {pdfPreviewItem && pdfPreviewItem.arquivo_pdf_url && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#1c3220] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-300" />
                <div>
                  <h4 className="font-bold text-sm">{pdfPreviewItem.titulo}</h4>
                  <p className="text-[11px] text-emerald-200">
                    {pdfPreviewItem.condominio_nome} • {formatarDataBr(pdfPreviewItem.data)} • {pdfPreviewItem.arquivo_nome}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfPreviewItem.arquivo_pdf_url}
                  download={pdfPreviewItem.arquivo_nome || 'laudo.pdf'}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPdfPreviewItem(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src={pdfPreviewItem.arquivo_pdf_url}
                title={pdfPreviewItem.titulo}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
