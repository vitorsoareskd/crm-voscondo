import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  DollarSign,
  Printer,
  FileCheck,
  Send,
  X,
  Trash2,
  Eye,
  Filter,
  ShieldCheck,
  Edit3,
  RefreshCw,
  Sparkles,
  MapPin,
  Mail,
  Tag,
  Building,
  Check,
  Lock
} from 'lucide-react';
import { Condominio, TransacaoExtrato } from '../../types';
import { formatarMoeda } from '../../utils/pricingEngine';

export type ModeloEmpresa = 'MEI' | 'LTDA' | 'LTDA ME';

export interface NFeItem {
  id: string;
  numero: string;
  condominioNome: string;
  cnpjTomador: string;
  enderecoTomador: string;
  emailTomador: string;
  modeloEmpresa: ModeloEmpresa;
  codigoTributacao: string; // e.g. "17.02"
  descricaoServico: string;
  planoOuServicoPreset?: string;
  dataEmissao: string; // YYYY-MM-DD
  valorTotal: number;
  aliquotaIss: number;
  valorIss: number;
  status: 'Emitida' | 'Pendente' | 'Cancelada';
  codigoVerificacao?: string;
  extratoTransacaoId?: string;
}

const MESES_NOMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const ANOS_OPCOES = ['2026', '2025', '2024'];

// Presets de Descrição solicitados pelo usuário
const PRESETS_PLANOS = [
  {
    key: 'Vos Essencial',
    nome: 'Plano Vos Essencial',
    template:
      'Prestação de serviços de apoio administrativo (Plano Essencial), contemplando processamento de dados para emissão de boletos, organização de cadastros, controle de rotinas de expediente e organização documental para o Condomínio [Nome do Condomínio], ref. ao mês de [Mês/Ano].'
  },
  {
    key: 'Vos Pulse',
    nome: 'Plano Vos Pulse',
    template:
      'Prestação de serviços de infraestrutura administrativa (Plano Pulse), contemplando triagem de comunicados, controle e arquivamento de contratos, elaboração de relatórios de rotina e suporte administrativo contínuo ao Condomínio [Nome do Condomínio], ref. ao mês de [Mês/Ano].'
  },
  {
    key: 'Vos 360',
    nome: 'Plano Vos 360',
    template:
      'Prestação de serviços avançados de apoio administrativo (Plano 360), contemplando secretariado em reuniões, redação e encaminhamento de atas, organização de pautas, e apoio direto nas rotinas financeiras e documentais do Condomínio [Nome do Condomínio], ref. ao mês de [Mês/Ano].'
  },
  {
    key: 'Vos Starter',
    nome: 'Plano Vos Starter',
    template:
      'Serviços de infraestrutura e suporte administrativo, incluindo parametrização e alimentação de dados em sistema de gestão para o Condomínio [Nome do Condomínio], ref. ao mês de [Mês/Ano].'
  }
];

const PRESETS_EXTRAS = [
  {
    key: 'Hora Técnica Adm',
    nome: 'Hora Técnica Adm / Financeira',
    template: 'Serviços extraordinários de apoio administrativo e compilação de dados'
  },
  {
    key: 'Hora Técnica Engenharia',
    nome: 'Hora Técnica Engenharia / Visitas',
    template: 'Serviços extraordinários de apoio administrativo e compilação de dados'
  },
  {
    key: 'Suporte Cotação',
    nome: 'Suporte de Cotação e Compras',
    template: 'Serviço de triagem de orçamentos e organização de processos de compras.'
  },
  {
    key: 'Assembleia Extra',
    nome: 'Assembleia Extraordinária',
    template:
      'Serviços de secretariado, incluindo redação de documentos e apoio na condução de reunião extraordinária'
  },
  {
    key: 'Emissão TRT / ART',
    nome: 'Emissão de TRT / ART (Obras < 80m²)',
    template:
      'Honorários técnicos referentes à emissão de Termo de Responsabilidade Técnica (TRT) para acompanhamento de obra/manutenção no período de [Mês/Ano]'
  }
];

const INITIAL_NFES: NFeItem[] = [
  {
    id: 'nf-101',
    numero: '2026/0048',
    condominioNome: 'Condomínio Solar das Acácias',
    cnpjTomador: '12.345.678/0001-90',
    enderecoTomador: 'Av. das Acácias, 1000 - Centro, Curitiba - PR, 80000-000',
    emailTomador: 'contato@solardasacacias.com.br',
    modeloEmpresa: 'LTDA',
    codigoTributacao: '17.02',
    descricaoServico:
      'Prestação de serviços de apoio administrativo (Plano Essencial), contemplando processamento de dados para emissão de boletos, organização de cadastros, controle de rotinas de expediente e organização documental para o Condomínio Solar das Acácias, ref. ao mês de Julho/2026.',
    planoOuServicoPreset: 'Vos Essencial',
    dataEmissao: '2026-07-05',
    valorTotal: 4500.0,
    aliquotaIss: 5,
    valorIss: 225.0,
    status: 'Emitida',
    codigoVerificacao: 'VOS-9821-A'
  },
  {
    id: 'nf-102',
    numero: '2026/0049',
    condominioNome: 'Residencial Batel Plaza',
    cnpjTomador: '98.765.432/0001-10',
    enderecoTomador: 'Rua Bispo Dom José, 2050 - Batel, Curitiba - PR, 80440-000',
    emailTomador: 'sindico@batelplaza.com.br',
    modeloEmpresa: 'LTDA ME',
    codigoTributacao: '17.02',
    descricaoServico:
      'Prestação de serviços avançados de apoio administrativo (Plano 360), contemplando secretariado em reuniões, redação e encaminhamento de atas, organização de pautas, e apoio direto nas rotinas financeiras e documentais do Condomínio Residencial Batel Plaza, ref. ao mês de Julho/2026.',
    planoOuServicoPreset: 'Vos 360',
    dataEmissao: '2026-07-10',
    valorTotal: 5800.0,
    aliquotaIss: 5,
    valorIss: 290.0,
    status: 'Emitida',
    codigoVerificacao: 'VOS-7712-B'
  },
  {
    id: 'nf-103',
    numero: '2026/0050',
    condominioNome: 'Edifício Horizon Tower',
    cnpjTomador: '45.112.890/0001-33',
    enderecoTomador: 'Rua Marechal Deodoro, 500 - Centro, Curitiba - PR',
    emailTomador: 'adm@horizontower.com.br',
    modeloEmpresa: 'LTDA',
    codigoTributacao: '17.02',
    descricaoServico:
      'Serviços extraordinários de apoio administrativo e compilação de dados referentes a Vistoria e Acompanhamento de Obras para o Condomínio Edifício Horizon Tower, ref. ao mês de Julho/2026.',
    planoOuServicoPreset: 'Hora Técnica Engenharia / Visitas',
    dataEmissao: '2026-07-15',
    valorTotal: 3200.0,
    aliquotaIss: 5,
    valorIss: 160.0,
    status: 'Pendente'
  },
  {
    id: 'nf-104',
    numero: '2026/0051',
    condominioNome: 'Condomínio Vila Verde',
    cnpjTomador: '33.444.555/0001-22',
    enderecoTomador: 'Rua XV de Novembro, 1200 - Centro, Curitiba - PR',
    emailTomador: 'financeiro@vilaverde.com.br',
    modeloEmpresa: 'MEI',
    codigoTributacao: '17.02',
    descricaoServico:
      'Prestação de serviços de infraestrutura administrativa (Plano Pulse), contemplando triagem de comunicados, controle e arquivamento de contratos, elaboração de relatórios de rotina e suporte administrativo contínuo ao Condomínio Condomínio Vila Verde, ref. ao mês de Julho/2026.',
    planoOuServicoPreset: 'Vos Pulse',
    dataEmissao: '2026-07-20',
    valorTotal: 2900.0,
    aliquotaIss: 5,
    valorIss: 145.0,
    status: 'Emitida',
    codigoVerificacao: 'VOS-3301-C'
  }
];

interface NFeSectionProps {
  condominios?: Condominio[];
  transacoes?: TransacaoExtrato[];
}

export const NFeSection: React.FC<NFeSectionProps> = ({
  condominios = [],
  transacoes = []
}) => {
  // State for NFes list persisted in localStorage
  const [nfes, setNfes] = useState<NFeItem[]>(() => {
    try {
      const saved = localStorage.getItem('vos_treasury_nfes');
      return saved ? JSON.parse(saved) : INITIAL_NFES;
    } catch {
      return INITIAL_NFES;
    }
  });

  // Global Filters
  const [anoFiltro, setAnoFiltro] = useState<string>('2026');
  const [mesFiltro, setMesFiltro] = useState<string>('Julho');
  const [statusFiltro, setStatusFiltro] = useState<'Todos' | 'Emitida' | 'Pendente' | 'Cancelada'>('Todos');
  const [busca, setBusca] = useState('');

  // Modal State (Creation / Editing)
  const [showModal, setShowModal] = useState(false);
  const [editingNFe, setEditingNFe] = useState<NFeItem | null>(null);

  // Modal State (Preview / Espelho)
  const [selectedNFePreview, setSelectedNFePreview] = useState<NFeItem | null>(null);

  // Form Fields State
  const [formNumero, setFormNumero] = useState('');
  const [formCondominio, setFormCondominio] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formModeloEmpresa, setFormModeloEmpresa] = useState<ModeloEmpresa>('LTDA');
  const [formCodigoTributacao, setFormCodigoTributacao] = useState('17.02');
  const [formServico, setFormServico] = useState('');
  const [formValor, setFormValor] = useState('');
  const [formIss, setFormIss] = useState('5');
  const [formDataEmissao, setFormDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Emitida' | 'Pendente' | 'Cancelada'>('Emitida');
  const [formExtratoVinculo, setFormExtratoVinculo] = useState<string>('');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('vos_treasury_nfes', JSON.stringify(nfes));
  }, [nfes]);

  // Format Helper for Presets
  const formatPresetText = (template: string, condoNome: string) => {
    const nomeUso = condoNome.trim() || '[Nome do Condomínio]';
    const mesAnoUso = `${mesFiltro !== 'Todos' ? mesFiltro : 'Julho'}/${anoFiltro !== 'Todos' ? anoFiltro : '2026'}`;
    return template
      .replace(/\[Nome do Condomínio\]/g, nomeUso)
      .replace(/\[Mês\/Ano\]/g, mesAnoUso);
  };

  // Open Modal for New NFe
  const handleOpenNewModal = () => {
    setEditingNFe(null);
    const proxNumero = `2026/00${(nfes.length + 50).toString().padStart(2, '0')}`;
    setFormNumero(proxNumero);
    setFormCondominio('');
    setFormCnpj('');
    setFormEndereco('');
    setFormEmail('');
    setFormModeloEmpresa('LTDA');
    setFormCodigoTributacao('17.02');
    setFormServico('');
    setFormValor('');
    setFormIss('5');
    setFormDataEmissao(new Date().toISOString().split('T')[0]);
    setFormStatus('Emitida');
    setFormExtratoVinculo('');
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: NFeItem) => {
    setEditingNFe(item);
    setFormNumero(item.numero);
    setFormCondominio(item.condominioNome);
    setFormCnpj(item.cnpjTomador || '');
    setFormEndereco(item.enderecoTomador || '');
    setFormEmail(item.emailTomador || '');
    setFormModeloEmpresa(item.modeloEmpresa || 'LTDA');
    setFormCodigoTributacao(item.codigoTributacao || '17.02');
    setFormServico(item.descricaoServico);
    setFormValor(item.valorTotal.toString());
    setFormIss(item.aliquotaIss ? item.aliquotaIss.toString() : '5');
    setFormDataEmissao(item.dataEmissao);
    setFormStatus(item.status);
    setFormExtratoVinculo(item.extratoTransacaoId || '');
    setShowModal(true);
  };

  // Auto-fill Condominium details
  const handleSelectCondominio = (nome: string) => {
    setFormCondominio(nome);
    const cond = condominios.find((c) => c.nome === nome);
    if (cond) {
      setFormCnpj(cond.cnpj || '00.000.000/0001-00');
      setFormEndereco(cond.endereco || 'Endereço Comercial do Condomínio');
      setFormEmail(cond.emailCondominio || 'contato@condominio.com.br');

      // Auto-preset description if plano exists and service description is empty
      if (cond.plano) {
        const presetObj = PRESETS_PLANOS.find((p) => p.key === cond.plano);
        if (presetObj && !formServico) {
          setFormServico(formatPresetText(presetObj.template, cond.nome));
        }
      }

      // Auto-fill value from mensalidade if empty
      if (cond.mensalidadeCalculada && (!formValor || parseFloat(formValor) === 0)) {
        setFormValor(cond.mensalidadeCalculada.toString());
      }
    }
  };

  // Select Preset Description
  const handleApplyPreset = (template: string) => {
    const textFormatted = formatPresetText(template, formCondominio);
    setFormServico(textFormatted);
  };

  // Select Extrato Entry
  const handleSelectExtratoTransacao = (transId: string) => {
    setFormExtratoVinculo(transId);
    const tr = transacoes.find((t) => t.id === transId);
    if (tr) {
      setFormValor(tr.valor.toString());
      if (tr.condominioNome) {
        handleSelectCondominio(tr.condominioNome);
      }
      if (tr.data) {
        setFormDataEmissao(tr.data);
      }
    }
  };

  // Submit Handler
  const handleSaveNFe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCondominio || !formValor || parseFloat(formValor) <= 0) {
      alert('Por favor, informe o Condomínio e o Valor do serviço.');
      return;
    }

    const val = parseFloat(formValor);
    const aliq = parseFloat(formIss) || 0;
    const valIss = (val * aliq) / 100;

    if (editingNFe) {
      // Update
      const updatedList = nfes.map((item) =>
        item.id === editingNFe.id
          ? {
              ...item,
              numero: formNumero,
              condominioNome: formCondominio,
              cnpjTomador: formCnpj || '00.000.000/0001-00',
              enderecoTomador: formEndereco,
              emailTomador: formEmail,
              modeloEmpresa: formModeloEmpresa,
              codigoTributacao: formCodigoTributacao || '17.02',
              descricaoServico: formServico,
              dataEmissao: formDataEmissao,
              valorTotal: val,
              aliquotaIss: aliq,
              valorIss: valIss,
              status: formStatus,
              extratoTransacaoId: formExtratoVinculo
            }
          : item
      );
      setNfes(updatedList);
    } else {
      // Create New
      const novaNFe: NFeItem = {
        id: `nf_${Date.now()}`,
        numero: formNumero || `2026/00${(nfes.length + 50).toString().padStart(2, '0')}`,
        condominioNome: formCondominio,
        cnpjTomador: formCnpj || '00.000.000/0001-00',
        enderecoTomador: formEndereco || 'Endereço Comercial do Condomínio',
        emailTomador: formEmail || 'contato@condominio.com.br',
        modeloEmpresa: formModeloEmpresa,
        codigoTributacao: formCodigoTributacao || '17.02',
        descricaoServico: formServico || 'Serviços de Gestão e Administração Condominial',
        dataEmissao: formDataEmissao,
        valorTotal: val,
        aliquotaIss: aliq,
        valorIss: valIss,
        status: formStatus,
        codigoVerificacao: `VOS-${Math.floor(1000 + Math.random() * 9000)}-NF`,
        extratoTransacaoId: formExtratoVinculo
      };
      setNfes([novaNFe, ...nfes]);
    }

    setShowModal(false);
  };

  // Bulk Import / Sync from Extrato Financeiro
  const handleImportExtratoDoMes = () => {
    // Filter entries (tipo === 'entrada') from transacoes for the selected Month and Year
    const entradasDoMes = transacoes.filter((t) => {
      if (t.tipo !== 'entrada') return false;

      // Check year
      if (anoFiltro !== 'Todos') {
        const trAno = t.data ? t.data.substring(0, 4) : '2026';
        if (trAno !== anoFiltro) return false;
      }

      // Check month
      if (mesFiltro !== 'Todos') {
        const idxMes = MESES_NOMES.indexOf(mesFiltro);
        if (idxMes !== -1) {
          const mesNum = (idxMes + 1).toString().padStart(2, '0');
          const trMes = t.data ? t.data.substring(5, 7) : '';
          const matchMesRef = t.mesReferencia ? t.mesReferencia.toLowerCase().includes(mesFiltro.toLowerCase()) : false;
          if (trMes !== mesNum && !matchMesRef) return false;
        }
      }

      return true;
    });

    if (entradasDoMes.length === 0) {
      alert(
        `Nenhuma receita/entrada encontrada no Extrato Financeiro para ${
          mesFiltro !== 'Todos' ? mesFiltro : 'todos os meses'
        }/${anoFiltro !== 'Todos' ? anoFiltro : 'todos os anos'}.`
      );
      return;
    }

    let adicionadas = 0;
    const novasNfes: NFeItem[] = [...nfes];

    entradasDoMes.forEach((tr, index) => {
      // Check if NFe already created for this extrato ID or similar description/date
      const jaExiste = novasNfes.some(
        (n) =>
          n.extratoTransacaoId === tr.id ||
          (n.condominioNome === tr.condominioNome &&
            n.valorTotal === tr.valor &&
            n.dataEmissao === tr.data)
      );

      if (!jaExiste) {
        adicionadas++;
        const condObj = condominios.find((c) => c.nome === tr.condominioNome);
        const plano = condObj?.plano || 'Vos Essencial';
        const presetObj = PRESETS_PLANOS.find((p) => p.key === plano) || PRESETS_PLANOS[0];
        const descServico = formatPresetText(presetObj.template, tr.condominioNome);

        const aliq = 5;
        const valIss = (tr.valor * aliq) / 100;

        const novaNfe: NFeItem = {
          id: `nf_ext_${tr.id}_${Date.now()}`,
          numero: `2026/00${(novasNfes.length + 51 + index).toString().padStart(2, '0')}`,
          condominioNome: tr.condominioNome,
          cnpjTomador: condObj?.cnpj || '00.000.000/0001-00',
          enderecoTomador: condObj?.endereco || 'Endereço Comercial do Condomínio',
          emailTomador: condObj?.emailCondominio || 'contato@condominio.com.br',
          modeloEmpresa: 'LTDA',
          codigoTributacao: '17.02',
          descricaoServico: tr.descricao || descServico,
          planoOuServicoPreset: plano,
          dataEmissao: tr.data || new Date().toISOString().split('T')[0],
          valorTotal: tr.valor,
          aliquotaIss: aliq,
          valorIss: valIss,
          status: 'Emitida',
          codigoVerificacao: `VOS-${Math.floor(1000 + Math.random() * 9000)}-EXT`,
          extratoTransacaoId: tr.id
        };

        novasNfes.unshift(novaNfe);
      }
    });

    if (adicionadas > 0) {
      setNfes(novasNfes);
      alert(
        `Sucesso! ${adicionadas} Nota(s) Fiscal(is) gerada(s) automaticamente a partir das entradas do Extrato Financeiro de ${mesFiltro}/${anoFiltro}.`
      );
    } else {
      alert(
        `Todas as entradas do Extrato Financeiro de ${mesFiltro}/${anoFiltro} já possuem Nota Fiscal correspondente registrada.`
      );
    }
  };

  const handleCancelarNFe = (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta Nota Fiscal Eletrônica?')) {
      setNfes(
        nfes.map((item) =>
          item.id === id ? { ...item, status: 'Cancelada' as const } : item
        )
      );
    }
  };

  const handleExcluirNFe = (id: string) => {
    if (window.confirm('Excluir este registro de Nota Fiscal do sistema?')) {
      setNfes(nfes.filter((item) => item.id !== id));
    }
  };

  // Filter Logic
  const nfesFiltradas = nfes.filter((nfe) => {
    // Year filter
    if (anoFiltro !== 'Todos') {
      const nfeAno = nfe.dataEmissao ? nfe.dataEmissao.substring(0, 4) : '2026';
      if (nfeAno !== anoFiltro) return false;
    }

    // Month filter
    if (mesFiltro !== 'Todos') {
      const idxMes = MESES_NOMES.indexOf(mesFiltro);
      if (idxMes !== -1) {
        const mesNum = (idxMes + 1).toString().padStart(2, '0');
        const nfeMes = nfe.dataEmissao ? nfe.dataEmissao.substring(5, 7) : '';
        if (nfeMes !== mesNum && !nfe.descricaoServico.toLowerCase().includes(mesFiltro.toLowerCase())) {
          return false;
        }
      }
    }

    // Status filter
    if (statusFiltro !== 'Todos' && nfe.status !== statusFiltro) {
      return false;
    }

    // Search query
    if (busca) {
      const b = busca.toLowerCase();
      const matchBusca =
        nfe.condominioNome.toLowerCase().includes(b) ||
        nfe.numero.toLowerCase().includes(b) ||
        nfe.descricaoServico.toLowerCase().includes(b) ||
        nfe.cnpjTomador.includes(b) ||
        (nfe.modeloEmpresa && nfe.modeloEmpresa.toLowerCase().includes(b));
      if (!matchBusca) return false;
    }

    return true;
  });

  // KPI Calculations
  const totalEmitidas = nfesFiltradas.filter((n) => n.status === 'Emitida');
  const valorTotalEmitido = totalEmitidas.reduce((acc, n) => acc + n.valorTotal, 0);
  const totalIssRecolhido = totalEmitidas.reduce((acc, n) => acc + n.valorIss, 0);
  const qtdPendentes = nfesFiltradas.filter((n) => n.status === 'Pendente').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1c3220] to-[#25482e] rounded-2xl p-6 text-white shadow-lg border border-emerald-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Módulo NFe / NFS-e
              </span>
              <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Código Nacional: 17.02
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Gestão de Notas Fiscais Eletrônicas (NFe)
            </h1>
            <p className="text-emerald-100/80 text-xs mt-1 max-w-2xl">
              Emissão, controle e importação direta das receitas do Extrato Financeiro com modelos de empresa (MEI, LTDA, LTDA ME) e modelos predefinidos de planos VOS.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <button
              onClick={handleImportExtratoDoMes}
              className="px-3.5 py-2.5 bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 border border-emerald-600/50 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Criar NFes a partir de todas as entradas do Extrato Financeiro do mês/ano filtrado"
            >
              <RefreshCw className="w-4 h-4 text-emerald-300" />
              <span>Importar Entradas do Extrato ({mesFiltro}/{anoFiltro})</span>
            </button>

            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Nova NFe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Dual Filter Row (Ano & Mês References) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Year Filter & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#2d5a32]" /> Referência Ano:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setAnoFiltro('Todos')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  anoFiltro === 'Todos'
                    ? 'bg-white text-[#1c3220] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos os Anos
              </button>
              {ANOS_OPCOES.map((ano) => (
                <button
                  key={ano}
                  onClick={() => setAnoFiltro(ano)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    anoFiltro === ano
                      ? 'bg-[#1c3220] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ano}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por NFe, condomínio, CNPJ ou regime..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-medium text-xs w-64 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Row 2: Month Reference Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap mr-1">
            Referência Mês:
          </span>
          <button
            onClick={() => setMesFiltro('Todos')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              mesFiltro === 'Todos'
                ? 'bg-[#2d5a32] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os Meses
          </button>
          {MESES_NOMES.map((m) => (
            <button
              key={m}
              onClick={() => setMesFiltro(m)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                mesFiltro === m
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emitido */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Total Faturado NFe ({mesFiltro}/{anoFiltro})</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight font-mono">
            {formatarMoeda(valorTotalEmitido)}
          </div>
          <div className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalEmitidas.length} NFes Emitidas neste filtro</span>
          </div>
        </div>

        {/* Quantidade Pendente */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">NFes em Transmissão</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 tracking-tight font-mono">
            {qtdPendentes}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {qtdPendentes > 0 ? 'Aguardando lote na Prefeitura' : 'Todas NFes transmitidas'}
          </div>
        </div>

        {/* Total ISS Estimado */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">ISS Retido / Tributos</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 tracking-tight font-mono">
            {formatarMoeda(totalIssRecolhido)}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Código 17.02 (Alíquota 5%)
          </div>
        </div>

        {/* Entradas no Extrato Disponíveis */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">Receitas no Extrato</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-800 tracking-tight font-mono">
            {transacoes.filter((t) => t.tipo === 'entrada').length} Entradas
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Inclusão automática disponível
          </div>
        </div>
      </div>

      {/* NFe List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-[#1c3220] text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2d5a32]" />
              <span>Registro de Notas Fiscais Eletrônicas</span>
            </h3>
            <p className="text-xs text-slate-500">
              {nfesFiltradas.length} notas exibidas para o período de {mesFiltro}/{anoFiltro}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['Todos', 'Emitida', 'Pendente', 'Cancelada'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFiltro(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFiltro === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8faf6] text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Nº NFe</th>
                <th className="py-3 px-3">Condomínio / Tomador</th>
                <th className="py-3 px-3">Modelo Empresa</th>
                <th className="py-3 px-3">Cód. Tributação</th>
                <th className="py-3 px-3">Descrição do Serviço</th>
                <th className="py-3 px-3">Data Emissão</th>
                <th className="py-3 px-3 text-right">Valor Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nfesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    Nenhuma Nota Fiscal encontrada para os filtros selecionados ({mesFiltro}/{anoFiltro}).
                  </td>
                </tr>
              ) : (
                nfesFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Número */}
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.numero}
                      </span>
                    </td>

                    {/* Condomínio / Tomador */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#2d5a32]" />
                        <span>{item.condominioNome}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">CNPJ: {item.cnpjTomador}</div>
                    </td>

                    {/* Modelo Empresa */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200/80 text-[10px]">
                        {item.modeloEmpresa || 'LTDA'}
                      </span>
                    </td>

                    {/* Código Tributação */}
                    <td className="py-3.5 px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {item.codigoTributacao || '17.02'}
                    </td>

                    {/* Descrição */}
                    <td className="py-3.5 px-3 max-w-xs text-slate-700 truncate font-medium">
                      {item.descricaoServico}
                    </td>

                    {/* Data */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-600">
                      {item.dataEmissao ? item.dataEmissao.split('-').reverse().join('/') : '-'}
                    </td>

                    {/* Valor Total */}
                    <td className="py-3.5 px-3 font-mono font-black text-slate-900 text-right whitespace-nowrap">
                      {formatarMoeda(item.valorTotal)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {item.status === 'Emitida' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Emitida</span>
                        </span>
                      )}
                      {item.status === 'Pendente' && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-700" />
                          <span>Transmissão</span>
                        </span>
                      )}
                      {item.status === 'Cancelada' && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Cancelada</span>
                        </span>
                      )}
                    </td>

                    {/* Ações: Visualizar, EDITAR, Cancelar, Excluir */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Visualizar Espelho */}
                        <button
                          onClick={() => setSelectedNFePreview(item)}
                          className="p-1.5 text-slate-500 hover:text-[#2d5a32] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Visualizar Espelho DANFE"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* EDITAR */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-[#2d5a32] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1"
                          title="Editar NFe (Dados do Cliente, Tributação, Descrição, Valor)"
                        >
                          <Edit3 className="w-4 h-4 text-[#2d5a32]" />
                          <span className="text-[10px] hidden sm:inline">Editar</span>
                        </button>

                        {/* Cancelar */}
                        {item.status === 'Emitida' && (
                          <button
                            onClick={() => handleCancelarNFe(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Cancelar NFe"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Excluir */}
                        <button
                          onClick={() => handleExcluirNFe(item.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover do Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Emitir / EDITAR NFe */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingNFe ? `Editar Nota Fiscal Nº ${formNumero}` : 'Emitir Nova Nota Fiscal Eletrônica'}
                  </h3>
                  <p className="text-slate-500 text-xs">VOS Treasury NFe Engine - NFS-e Prefeitura</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNFe} className="space-y-4 text-xs">
              {/* Vínculo / Puxar Dados do Extrato Financeiro */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <label className="block font-bold text-emerald-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs">
                    <RefreshCw className="w-4 h-4 text-emerald-700" />
                    <span>Puxar Dados do Extrato Financeiro (Entradas / Receitas)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    Sincronização Automática
                  </span>
                </label>
                <select
                  value={formExtratoVinculo}
                  onChange={(e) => handleSelectExtratoTransacao(e.target.value)}
                  className="w-full p-2.5 border border-emerald-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs cursor-pointer"
                >
                  <option value="">Selecione uma receita do Extrato para puxar o Condomínio e Valor...</option>
                  {transacoes
                    .filter((t) => t.tipo === 'entrada')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.data}] {t.condominioNome} — {t.descricao} ({formatarMoeda(t.valor)})
                      </option>
                    ))}
                </select>
              </div>

              {/* Seção 1: Dados do Cliente / Tomador */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Building className="w-4 h-4 text-[#2d5a32]" />
                  <span>Dados do Cliente / Tomador</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Condomínio / Nome - ITEM NÃO EDITÁVEL QUE PUXA DO EXTRATO FINANCEIRO */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between flex-wrap gap-1">
                      <span className="flex items-center gap-1 text-slate-800">
                        <Lock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Nome do Condomínio / Cliente *</span>
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        <span>Item Não Editável — Dado do Extrato Financeiro</span>
                      </span>
                    </label>

                    {formCondominio ? (
                      <div className="relative flex items-center gap-2">
                        <div className="relative w-full">
                          <input
                            type="text"
                            value={formCondominio}
                            readOnly
                            required
                            className="w-full p-2.5 pl-3 pr-28 border border-slate-300 rounded-xl font-black text-slate-900 bg-slate-100/90 cursor-not-allowed outline-hidden shadow-2xs"
                          />
                          <span className="absolute right-2.5 top-2.5 text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-300 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Bloqueado</span>
                          </span>
                        </div>
                        {!editingNFe && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormCondominio('');
                              setFormExtratoVinculo('');
                            }}
                            className="px-3 py-2.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold cursor-pointer whitespace-nowrap transition-colors"
                            title="Limpar e selecionar outro condomínio do extrato"
                          >
                            Trocar
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        value={formCondominio}
                        onChange={(e) => handleSelectCondominio(e.target.value)}
                        required
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs"
                      >
                        <option value="">Selecione o Condomínio registrado no Extrato Financeiro...</option>
                        {condominios.map((c) => (
                          <option key={c.id} value={c.nome}>
                            {c.nome} {c.plano ? `(${c.plano})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1 italic flex items-center gap-1">
                      <span>ℹ️ O nome do condomínio é um dado fixo do Extrato Financeiro, garantindo a conformidade dos dados contábeis da NFe.</span>
                    </p>
                  </div>

                  {/* CNPJ */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CNPJ do Cliente</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={formCnpj}
                      onChange={(e) => setFormCnpj(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                    />
                  </div>

                  {/* Modelo de Empresa */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Modelo de Empresa</label>
                    <select
                      value={formModeloEmpresa}
                      onChange={(e) => setFormModeloEmpresa(e.target.value as ModeloEmpresa)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-bold text-emerald-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                    >
                      <option value="MEI">MEI (Microempreendedor Individual)</option>
                      <option value="LTDA">LTDA (Sociedade Limitada)</option>
                      <option value="LTDA ME">LTDA ME (Microempresa)</option>
                    </select>
                  </div>

                  {/* Endereço Completo */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Endereço Completo do Cliente</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Rua/Av., Número, Bairro, Cidade - UF, CEP"
                      value={formEndereco}
                      onChange={(e) => setFormEndereco(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                    />
                  </div>

                  {/* E-mail */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>E-mail do Cliente</span>
                    </label>
                    <input
                      type="email"
                      placeholder="financeiro@condominio.com.br"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Código de Tributação Nacional & Valores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Código de Tributação Nacional */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cód. Tributação Nacional *
                  </label>
                  <input
                    type="text"
                    value={formCodigoTributacao}
                    onChange={(e) => setFormCodigoTributacao(e.target.value)}
                    required
                    placeholder="17.02"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                  />
                </div>

                {/* Valor do Serviço */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor do Serviço (R$) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0,00"
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 text-base focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                  />
                </div>

                {/* Alíquota ISS */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alíquota ISS (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={formIss}
                    onChange={(e) => setFormIss(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                  />
                </div>
              </div>

              {/* Data de Emissão & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data de Emissão</label>
                  <input
                    type="date"
                    value={formDataEmissao}
                    onChange={(e) => setFormDataEmissao(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status da NFe</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Emitida' | 'Pendente' | 'Cancelada')}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#2d5a32] outline-hidden bg-white"
                  >
                    <option value="Emitida">Emitida</option>
                    <option value="Pendente">Transmissão / Pendente</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Seção 3: Descrições e Presets de Planos / Serviços Extras */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <label className="block font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Modelos de Descrição Pré-Configurados</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Clique para aplicar o texto automático
                  </span>
                </label>

                {/* Presets - Planos Mensais */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Planos Mensais VOS:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS_PLANOS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handleApplyPreset(p.template)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3 text-emerald-700" />
                        <span>{p.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets - Serviços Extras */}
                <div className="space-y-1 pt-1 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                    Serviços Extras (Sob Demanda):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS_EXTRAS.map((e) => (
                      <button
                        key={e.key}
                        type="button"
                        onClick={() => handleApplyPreset(e.template)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3 text-blue-700" />
                        <span>{e.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea Editável */}
                <div className="pt-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Descrição do Serviço (100% Editável) *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Digite ou selecione um modelo de descrição acima..."
                    value={formServico}
                    onChange={(e) => setFormServico(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#2d5a32] outline-hidden text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1c3220] hover:bg-[#25482e] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingNFe ? 'Salvar Alterações' : 'Transmitir & Emitir NFe'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizar Espelho NFe */}
      {selectedNFePreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  NFS-e Prefeitura VOS
                </span>
                <h3 className="font-black text-slate-900 text-lg mt-1">
                  Nota Fiscal Eletrônica Nº {selectedNFePreview.numero}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNFePreview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500 font-semibold">Prestador de Serviços</div>
                <div className="font-bold text-slate-900 text-sm">VOS Administradora de Condomínios LTDA</div>
                <div className="text-slate-600 font-mono text-[11px]">CNPJ: 00.123.456/0001-88 - Inscrição Municipal: 987654</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500 font-semibold flex items-center justify-between">
                  <span>Tomador do Serviço</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Modelo: {selectedNFePreview.modeloEmpresa || 'LTDA'}
                  </span>
                </div>
                <div className="font-bold text-slate-900">{selectedNFePreview.condominioNome}</div>
                <div className="text-slate-600 font-mono text-[11px]">CNPJ: {selectedNFePreview.cnpjTomador}</div>
                {selectedNFePreview.enderecoTomador && (
                  <div className="text-slate-600 text-[11px]">Endereço: {selectedNFePreview.enderecoTomador}</div>
                )}
                {selectedNFePreview.emailTomador && (
                  <div className="text-slate-600 text-[11px]">E-mail: {selectedNFePreview.emailTomador}</div>
                )}
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <div className="text-slate-500 font-semibold flex items-center justify-between">
                  <span>Discriminação dos Serviços</span>
                  <span className="text-[10px] font-bold text-slate-600 font-mono">
                    Cód. Trib.: {selectedNFePreview.codigoTributacao || '17.02'}
                  </span>
                </div>
                <div className="text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                  {selectedNFePreview.descricaoServico}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Valor Total NFe</span>
                  <span className="text-base font-black text-emerald-800">{formatarMoeda(selectedNFePreview.valorTotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">ISS ({selectedNFePreview.aliquotaIss}%)</span>
                  <span className="text-base font-bold text-amber-700">{formatarMoeda(selectedNFePreview.valorIss)}</span>
                </div>
              </div>

              {selectedNFePreview.codigoVerificacao && (
                <div className="text-center pt-2 font-mono text-[11px] text-slate-500 border-t border-slate-100">
                  Código de Autenticidade: <strong>{selectedNFePreview.codigoVerificacao}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-5">
              <button
                onClick={() => {
                  alert(`Iniciando download do espelho em PDF da NFe ${selectedNFePreview.numero}...`);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>

              <button
                onClick={() => setSelectedNFePreview(null)}
                className="px-4 py-2 bg-[#1c3220] text-white font-bold rounded-xl text-xs hover:bg-[#25482e] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
