import React, { useState, useEffect } from 'react';
import { Condominio, Complexidade, Plano, ServicoExtra, ServicoPrestado, LeadPreFunil } from '../../types';
import { SERVICOS_PRESTADOS_INICIAIS, LEADS_PRE_FUNIL_INICIAIS } from '../../data/initialData';
import { calcularMensalidade, formatarMoeda } from '../../utils/pricingEngine';
import { ProposalModal } from './ProposalModal';
import { apiSaveCondominio, apiUpdateCondominio, apiDeleteCondominio } from '../../services/api';
import {
  Calculator,
  Plus,
  ArrowRight,
  FileCheck,
  Layers,
  Sparkles,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  XCircle,
  RotateCcw,
  X,
  Search,
  Trash2,
  Clock,
  FileText,
  Building2,
  Filter,
  Edit3,
  Kanban,
  Table,
  MapPin,
  Eye,
  ExternalLink,
  Phone,
  Mail,
  Building,
  Tag,
  Check,
  Sliders,
  Send,
  FileSpreadsheet,
  ClipboardPaste,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const extrairEnderecoPartes = (c: Condominio) => {
  const cidade = c.cidade || 'Curitiba';
  let bairro = c.bairro || '';
  let rua = c.rua || '';

  if (!bairro && !rua && c.endereco) {
    const parts = c.endereco.split('-');
    if (parts.length > 1) {
      rua = parts[0]?.trim() || '';
      bairro = parts[1]?.replace(/,?\s*Curitiba.*$/i, '').trim() || '';
    } else {
      rua = c.endereco;
    }
  }

  return {
    cidade: cidade || 'Curitiba',
    bairro: bairro || 'Centro / Batel',
    rua: rua || c.endereco || 'Endereço não informado'
  };
};

interface CRMModuleProps {
  condominios: Condominio[];
  setCondominios: React.Dispatch<React.SetStateAction<Condominio[]>>;
  servicosExtras: ServicoExtra[];
  setServicosExtras: React.Dispatch<React.SetStateAction<ServicoExtra[]>>;
  subTab: string;
}

export const CRMModule: React.FC<CRMModuleProps> = ({
  condominios,
  setCondominios,
  servicosExtras,
  setServicosExtras,
  subTab
}) => {
  // Simulator State
  const [customId, setCustomId] = useState('');
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [unidades, setUnidades] = useState<number | string>(24);
  const [complexidade, setComplexidade] = useState<Complexidade>('Tranquilo');
  const [plano, setPlano] = useState<Plano>('Vos 360');
  const [fatorAjuste, setFatorAjuste] = useState<number | string>(1.0);
  const [sindico, setSindico] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');

  // Selected proposal modal & ID editing state
  const [selectedCondoForDoc, setSelectedCondoForDoc] = useState<Condominio | null>(null);
  const [editingIdCondo, setEditingIdCondo] = useState<{ id: string; newId: string } | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // 1.4 Funil & Pré-Funil Navigation State
  const [abaFunil, setAbaFunil] = useState<'kanban' | 'pre_funil'>('kanban');
  const [buscaPreFunil, setBuscaPreFunil] = useState('');
  const [leadsPreFunil, setLeadsPreFunil] = useState<LeadPreFunil[]>(() => {
    const saved = localStorage.getItem('vos_pre_funil_leads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar e remover os cadastros criados inicialmente para teste da aplicação (PRE-001 a PRE-005)
          const demoIds = ['PRE-001', 'PRE-002', 'PRE-003', 'PRE-004', 'PRE-005'];
          return parsed.filter((l: LeadPreFunil) => !demoIds.includes(l.id));
        }
      } catch (e) {
        console.error('Erro ao ler vos_pre_funil_leads', e);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('vos_pre_funil_leads', JSON.stringify(leadsPreFunil));
    } catch (e) {
      console.error('Erro ao salvar vos_pre_funil_leads', e);
    }
  }, [leadsPreFunil]);

  // Modal Novo / Editar Lead Pré-Funil
  const [modalPreFunil, setModalPreFunil] = useState(false);
  const [editingPreFunil, setEditingPreFunil] = useState<LeadPreFunil | null>(null);
  const [preCnpj, setPreCnpj] = useState('');
  const [preNome, setPreNome] = useState('');
  const [preCidade, setPreCidade] = useState('Curitiba');
  const [preBairro, setPreBairro] = useState('');
  const [preRua, setPreRua] = useState('');
  const [preUnidades, setPreUnidades] = useState<number | string>(24);
  const [preTelefone, setPreTelefone] = useState('');
  const [preEmail, setPreEmail] = useState('');
  const [preContato, setPreContato] = useState('');
  const [preObservacoes, setPreObservacoes] = useState('');

  // Modal de Visualização Detalhada do Condomínio / Lead do Funil
  const [modalDetalhesCondo, setModalDetalhesCondo] = useState<Condominio | null>(null);

  // Modal Importação em Massa (Excel Ctrl+C / Ctrl+V)
  const [modalImportExcel, setModalImportExcel] = useState(false);
  const [textoColadoExcel, setTextoColadoExcel] = useState('');
  const [leadsParsedExcel, setLeadsParsedExcel] = useState<Omit<LeadPreFunil, 'id'>[]>([]);

  // Filtros Individuais por Coluna do Pré-Funil
  const [filtroColunaCnpj, setFiltroColunaCnpj] = useState('');
  const [filtroColunaNome, setFiltroColunaNome] = useState('');
  const [filtroColunaCidade, setFiltroColunaCidade] = useState('');
  const [filtroColunaBairro, setFiltroColunaBairro] = useState('');
  const [filtroColunaRua, setFiltroColunaRua] = useState('');
  const [filtroColunaTelefone, setFiltroColunaTelefone] = useState('');
  const [filtroColunaEmail, setFiltroColunaEmail] = useState('');

  // Ordenação de Colunas do Pré-Funil
  const [colunaOrdenacao, setColunaOrdenacao] = useState<'cnpj' | 'nome' | 'cidade' | 'bairro' | 'rua' | 'telefone' | 'email' | null>(null);
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');
  const [mostrarFiltrosColunas, setMostrarFiltrosColunas] = useState(true);

  // Servicos Prestados State
  const [servicosPrestados, setServicosPrestados] = useState<ServicoPrestado[]>(SERVICOS_PRESTADOS_INICIAIS);
  const [buscaServico, setBuscaServico] = useState('');
  const [modalNovoServico, setModalNovoServico] = useState(false);

  // New Servico Prestado Form State
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novoCnpj, setNovoCnpj] = useState('');
  const [novoNomeCliente, setNovoNomeCliente] = useState('');
  const [novoServico, setNovoServico] = useState('');
  const [novasHoras, setNovasHoras] = useState<number | ''>('');
  const [novoValor, setNovoValor] = useState<number | ''>('');
  const [novaObservacao, setNovaObservacao] = useState('');

  const handleSelectCondoParaServico = (condoId: string) => {
    const selected = condominios.find(c => c.id === condoId);
    if (selected) {
      setNovoNomeCliente(selected.nome);
      setNovoCnpj(selected.cnpj);
    }
  };

  const handleSalvarServicoPrestado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeCliente.trim() || !novoServico.trim()) return;

    const novoItem: ServicoPrestado = {
      id: `SP-${String(servicosPrestados.length + 1).padStart(3, '0')}`,
      data: novaData || new Date().toISOString().split('T')[0],
      cnpjCliente: novoCnpj || '00.000.000/0001-00',
      nomeCliente: novoNomeCliente,
      servico: novoServico,
      horasTrabalhadas: Number(novasHoras) || 0,
      valor: Number(novoValor) || 0,
      observacao: novaObservacao || 'Sem observações adicionais.'
    };

    setServicosPrestados([novoItem, ...servicosPrestados]);
    setModalNovoServico(false);
    setNovaData(new Date().toISOString().split('T')[0]);
    setNovoCnpj('');
    setNovoNomeCliente('');
    setNovoServico('');
    setNovasHoras('');
    setNovoValor('');
    setNovaObservacao('');
  };

  const handleExcluirServicoPrestado = (id: string) => {
    setServicosPrestados(servicosPrestados.filter(s => s.id !== id));
  };

  const servicosFiltrados = servicosPrestados.filter(s =>
    s.nomeCliente.toLowerCase().includes(buscaServico.toLowerCase()) ||
    s.cnpjCliente.toLowerCase().includes(buscaServico.toLowerCase()) ||
    s.servico.toLowerCase().includes(buscaServico.toLowerCase()) ||
    s.observacao.toLowerCase().includes(buscaServico.toLowerCase())
  );

  const totalHorasGerais = servicosPrestados.reduce((acc, s) => acc + s.horasTrabalhadas, 0);
  const totalValorGeral = servicosPrestados.reduce((acc, s) => acc + s.valor, 0);

  // Safe numeric conversion for calculation motor
  const parseNum = (val: number | string, defaultVal: number): number => {
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    if (!val || typeof val !== 'string') return defaultVal;
    const normalized = val.trim().replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const numUnidades = Math.max(1, Math.round(parseNum(unidades, 24)));
  const numFator = Math.max(0.1, parseNum(fatorAjuste, 1.0));

  // Live calculation output
  const calcResult = calcularMensalidade(numUnidades, complexidade, plano, numFator);

  // Compare all plans live
  const comparativoPlanos = [
    { nome: 'Vos Essencial', calc: calcularMensalidade(numUnidades, complexidade, 'Vos Essencial', numFator) },
    { nome: 'Vos Pulse', calc: calcularMensalidade(numUnidades, complexidade, 'Vos Pulse', numFator) },
    { nome: 'Vos 360', calc: calcularMensalidade(numUnidades, complexidade, 'Vos 360', numFator) },
    { nome: 'Vos Starter', calc: calcularMensalidade(numUnidades, complexidade, 'Vos Starter', numFator) },
  ];

  const gerarProximoIdCondominio = (lista: Condominio[]) => {
    const numeros = lista
      .map((c) => {
        const match = c.id.match(/^COND-(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = numeros.length > 0 ? Math.max(...numeros) : 100;
    const proximo = Math.max(maxNum + 1, 101);
    return `COND-${proximo}`;
  };

  const handleSalvarOrcamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const newId = customId.trim() || gerarProximoIdCondominio(condominios);
    const newCondo: Condominio = {
      id: newId,
      status: 'Cotação',
      nome,
      cnpj: cnpj || '00.000.000/0001-00',
      unidades: numUnidades,
      endereco: endereco || 'Curitiba - PR',
      sindicoResponsavel: sindico || 'A definir',
      emailCondominio: email || 'contato@condominio.com',
      numeroCondominio: '(41) 90000-0000',
      banco: 'A definir',
      agenciaEConta: 'A definir',
      complexidade,
      plano,
      fatorAjuste: numFator,
      mensalidadeCalculada: calcResult.valorFinal,
      livreCaixa: 5000,
      fundoObras: 0,
      fundoPintura: 0,
      fundoReforma: 0,
      gastoMedioMensal: 5000,
      rendimentoMedioMensal: 5500,
      saudeScore: 5
    };

    setCondominios([newCondo, ...condominios]);
    apiSaveCondominio(newCondo).catch((err) => console.error('Erro ao salvar no SQLite:', err));
    setSyncNotice(`Orçamento para "${nome}" cadastrado no Kanban com ID [${newId}] com sucesso!`);
    // Reset form
    setCustomId('');
    setNome('');
    setCnpj('');
    setSindico('');
    setEmail('');
    setEndereco('');
  };

  const handleSaveEditedId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdCondo || !editingIdCondo.newId.trim()) return;

    const targetOldId = editingIdCondo.id;
    const targetNewId = editingIdCondo.newId.trim();

    const condo = condominios.find((c) => c.id === targetOldId);
    if (condo) {
      const updated = { ...condo, id: targetNewId };
      apiDeleteCondominio(targetOldId)
        .then(() => apiSaveCondominio(updated))
        .catch((err) => console.error('Erro ao atualizar ID no SQLite:', err));
    }

    setCondominios((prev) =>
      prev.map((c) => (c.id === targetOldId ? { ...c, id: targetNewId } : c))
    );
    setSyncNotice(`ID atualizado para [${targetNewId}]. Você pode selecioná-lo no Bloco 2 (Perfil Completo)!`);
    setEditingIdCondo(null);
  };

  // Exclusion Modal States
  const [leadParaExcluir, setLeadParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  const [leadParaExcluirDefinitivo, setLeadParaExcluirDefinitivo] = useState<{ id: string; nome: string } | null>(null);

  const handleMoverExcluido = (id: string, nome: string) => {
    setLeadParaExcluir({ id, nome });
  };

  const confirmarMoverExcluido = () => {
    if (leadParaExcluir) {
      handleMoverStatus(leadParaExcluir.id, 'Excluído');
      setSyncNotice(`Lead "${leadParaExcluir.nome}" foi movido para a lista de Excluídos.`);
      setLeadParaExcluir(null);
    }
  };

  const handleExcluirDefinitivoPrompt = (id: string, nome: string) => {
    setLeadParaExcluirDefinitivo({ id, nome });
  };

  const confirmarExclusaoDefinitiva = () => {
    if (leadParaExcluirDefinitivo) {
      apiDeleteCondominio(leadParaExcluirDefinitivo.id).catch((err) =>
        console.error('Erro ao excluir do SQLite:', err)
      );
      setCondominios((prev) => prev.filter((c) => c.id !== leadParaExcluirDefinitivo.id));
      setSyncNotice(`Lead "${leadParaExcluirDefinitivo.nome}" foi excluído definitivamente.`);
      setLeadParaExcluirDefinitivo(null);
    }
  };

  // Pré-Funil Action Handlers
  const handleOpenNovoPreFunil = () => {
    setEditingPreFunil(null);
    setPreCnpj('');
    setPreNome('');
    setPreCidade('Curitiba');
    setPreBairro('');
    setPreRua('');
    setPreUnidades(24);
    setPreTelefone('');
    setPreEmail('');
    setPreContato('');
    setPreObservacoes('');
    setModalPreFunil(true);
  };

  const handleOpenEditPreFunil = (lead: LeadPreFunil) => {
    setEditingPreFunil(lead);
    setPreCnpj(lead.cnpj);
    setPreNome(lead.nome);
    setPreCidade(lead.cidade || 'Curitiba');
    setPreBairro(lead.bairro || '');
    setPreRua(lead.rua || '');
    setPreUnidades(lead.unidades || 24);
    setPreTelefone(lead.telefone || '');
    setPreEmail(lead.email || '');
    setPreContato(lead.contato || '');
    setPreObservacoes(lead.observacoes || '');
    setModalPreFunil(true);
  };

  const handleSalvarPreFunil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preNome.trim()) return;

    if (editingPreFunil) {
      setLeadsPreFunil((prev) =>
        prev.map((l) =>
          l.id === editingPreFunil.id
            ? {
                ...l,
                cnpj: preCnpj.trim() || '00.000.000/0001-00',
                nome: preNome.trim(),
                cidade: preCidade.trim() || 'Curitiba',
                bairro: preBairro.trim(),
                rua: preRua.trim(),
                unidades: Number(preUnidades) || 24,
                telefone: preTelefone.trim(),
                email: preEmail.trim(),
                contato: preContato.trim(),
                observacoes: preObservacoes.trim()
              }
            : l
        )
      );
      setSyncNotice(`Lead Pré-Funil "${preNome.trim()}" atualizado com sucesso!`);
    } else {
      const proximoNum = leadsPreFunil.length + 1;
      const novoId = `PRE-${String(proximoNum).padStart(3, '0')}`;
      const novoLead: LeadPreFunil = {
        id: novoId,
        cnpj: preCnpj.trim() || '00.000.000/0001-00',
        nome: preNome.trim(),
        cidade: preCidade.trim() || 'Curitiba',
        bairro: preBairro.trim(),
        rua: preRua.trim(),
        unidades: Number(preUnidades) || 24,
        telefone: preTelefone.trim(),
        email: preEmail.trim(),
        contato: preContato.trim(),
        observacoes: preObservacoes.trim() || 'Lead cadastrado no Pré-Funil Comercial.',
        dataCadastro: new Date().toISOString().split('T')[0]
      };
      setLeadsPreFunil((prev) => [novoLead, ...prev]);
      setSyncNotice(`Lead "${preNome.trim()}" cadastrado no Pré-Funil com sucesso!`);
    }
    setModalPreFunil(false);
  };

  const handleExcluirPreFunil = (id: string, nomeLead: string) => {
    if (confirm(`Deseja realmente remover o lead "${nomeLead}" do Pré-Funil?`)) {
      setLeadsPreFunil((prev) => prev.filter((l) => l.id !== id));
      setSyncNotice(`Lead "${nomeLead}" removido do Pré-Funil.`);
    }
  };

  const handleLimparTodosLeadsPreFunil = () => {
    if (confirm('Deseja realmente excluir todos os cadastros do Pré-Funil? Esta ação não poderá ser desfeita.')) {
      setLeadsPreFunil([]);
      localStorage.removeItem('vos_pre_funil_leads');
      setSyncNotice('Todos os cadastros do Pré-Funil foram excluídos com sucesso.');
    }
  };

  const handleEnviarParaFunil = (lead: LeadPreFunil) => {
    const newId = gerarProximoIdCondominio(condominios);
    const un = lead.unidades || 24;
    const calc = calcularMensalidade(un, 'Tranquilo', 'Vos 360', 1.0);
    const enderecoFormatado = lead.rua
      ? `${lead.rua}, ${lead.bairro} - ${lead.cidade}`
      : `${lead.bairro ? lead.bairro + ' - ' : ''}${lead.cidade}`;

    const newCondo: Condominio = {
      id: newId,
      status: 'Cotação',
      nome: lead.nome,
      cnpj: lead.cnpj || '00.000.000/0001-00',
      unidades: un,
      endereco: enderecoFormatado,
      cidade: lead.cidade,
      bairro: lead.bairro,
      rua: lead.rua,
      sindicoResponsavel: lead.contato || 'A definir',
      emailCondominio: lead.email || 'contato@condominio.com',
      numeroCondominio: lead.telefone || '(41) 90000-0000',
      banco: 'A definir',
      agenciaEConta: 'A definir',
      complexidade: 'Tranquilo',
      plano: 'Vos 360',
      fatorAjuste: 1.0,
      mensalidadeCalculada: calc.valorFinal,
      livreCaixa: 5000,
      fundoObras: 0,
      fundoPintura: 0,
      fundoReforma: 0,
      gastoMedioMensal: 5000,
      rendimentoMedioMensal: 5500,
      saudeScore: 5,
      anotacoes: lead.observacoes ? `[Origem Pré-Funil]: ${lead.observacoes}` : 'Importado do Pré-Funil Comercial'
    };

    setCondominios((prev) => [newCondo, ...prev]);
    apiSaveCondominio(newCondo).catch((err) => console.error('Erro ao salvar no SQLite:', err));
    setSyncNotice(`Lead "${lead.nome}" enviado para a etapa Prospecção do Funil Comercial com ID [${newId}]!`);
    setAbaFunil('kanban');
  };

  // Parser inteligente para colar dados do Excel (Ctrl+C / Ctrl+V)
  const parsearTextoExcel = (texto: string): Omit<LeadPreFunil, 'id'>[] => {
    if (!texto.trim()) return [];

    const linhas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (linhas.length === 0) return [];

    // Detectar delimitador da primeira linha: tabulação (\t - padrão Excel), ponto e vírgula ou vírgula
    const primeiraLinha = linhas[0];
    let delimitador = '\t';
    if (!primeiraLinha.includes('\t')) {
      if (primeiraLinha.includes(';')) delimitador = ';';
      else if (primeiraLinha.includes(',')) delimitador = ',';
    }

    // Verificar se a primeira linha é cabeçalho
    const headers = primeiraLinha.toLowerCase().split(delimitador).map((h) => h.replace(/["']/g, '').trim());
    const isHeader = headers.some((h) =>
      ['cnpj', 'nome', 'cidade', 'bairro', 'rua', 'logradouro', 'telefone', 'celular', 'email', 'e-mail', 'unidades'].includes(h)
    );

    const linhasDados = isHeader ? linhas.slice(1) : linhas;

    // Mapeamento padrão de colunas
    let idxCnpj = 0;
    let idxNome = 1;
    let idxCidade = 2;
    let idxBairro = 3;
    let idxRua = 4;
    let idxTelefone = 5;
    let idxEmail = 6;
    let idxUnidades = -1;

    if (isHeader) {
      const findCol = (terms: string[]) => headers.findIndex((h) => terms.some((t) => h.includes(t)));
      const fcCnpj = findCol(['cnpj']);
      const fcNome = findCol(['nome', 'condominio', 'edificio']);
      const fcCidade = findCol(['cidade', 'municipio']);
      const fcBairro = findCol(['bairro']);
      const fcRua = findCol(['rua', 'logradouro', 'endereco']);
      const fcTel = findCol(['tel', 'fone', 'celular', 'whatsapp']);
      const fcEmail = findCol(['mail', 'e-mail']);
      const fcUn = findCol(['unid', 'aptos', 'apart']);

      if (fcCnpj !== -1) idxCnpj = fcCnpj;
      if (fcNome !== -1) idxNome = fcNome;
      if (fcCidade !== -1) idxCidade = fcCidade;
      if (fcBairro !== -1) idxBairro = fcBairro;
      if (fcRua !== -1) idxRua = fcRua;
      if (fcTel !== -1) idxTelefone = fcTel;
      if (fcEmail !== -1) idxEmail = fcEmail;
      if (fcUn !== -1) idxUnidades = fcUn;
    }

    const resultado: Omit<LeadPreFunil, 'id'>[] = [];

    for (const linha of linhasDados) {
      const cols = linha.split(delimitador).map((c) => c.replace(/^["']|["']$/g, '').trim());
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      const cnpj = cols[idxCnpj] || '';
      const nome = cols[idxNome] || (cols.length > 0 ? cols[0] : 'Condomínio Sem Nome');
      const cidade = cols[idxCidade] || 'Curitiba';
      const bairro = cols[idxBairro] || 'Centro';
      const rua = cols[idxRua] || '';
      const telefone = cols[idxTelefone] || '';
      const email = cols[idxEmail] || '';
      const unidades = idxUnidades !== -1 && cols[idxUnidades] ? parseInt(cols[idxUnidades], 10) : 24;

      if (nome || cnpj) {
        resultado.push({
          cnpj: cnpj || '00.000.000/0001-00',
          nome: nome || 'Condomínio',
          cidade: cidade || 'Curitiba',
          bairro: bairro || 'Centro',
          rua: rua || 'Não informada',
          telefone: telefone || '',
          email: email || '',
          unidades: isNaN(unidades) ? 24 : unidades,
          dataCadastro: new Date().toISOString().split('T')[0],
          observacoes: 'Importado em massa do Excel'
        });
      }
    }

    return resultado;
  };

  const handleTextoExcelChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextoColadoExcel(val);
    const parsed = parsearTextoExcel(val);
    setLeadsParsedExcel(parsed);
  };

  const handleConfirmarImportacaoExcel = () => {
    if (leadsParsedExcel.length === 0) return;

    let baseNum = leadsPreFunil.length;
    const novosLeads: LeadPreFunil[] = leadsParsedExcel.map((item, idx) => ({
      id: `PRE-${String(baseNum + idx + 1).padStart(3, '0')}`,
      ...item
    }));

    setLeadsPreFunil((prev) => [...novosLeads, ...prev]);
    setSyncNotice(`${novosLeads.length} leads importados do Excel com sucesso para o Pré-Funil!`);
    setTextoColadoExcel('');
    setLeadsParsedExcel([]);
    setModalImportExcel(false);
  };

  // Cidades e Bairros únicos para dropdown de filtros
  const cidadesDisponiveis = Array.from(
    new Set(leadsPreFunil.map((l) => l.cidade || 'Curitiba').filter(Boolean))
  ).sort();

  const bairrosDisponiveis = Array.from(
    new Set(leadsPreFunil.map((l) => l.bairro).filter(Boolean))
  ).sort();

  const handleLimparFiltrosColunas = () => {
    setFiltroColunaCnpj('');
    setFiltroColunaNome('');
    setFiltroColunaCidade('');
    setFiltroColunaBairro('');
    setFiltroColunaRua('');
    setFiltroColunaTelefone('');
    setFiltroColunaEmail('');
    setBuscaPreFunil('');
  };

  const temFiltrosColunasAtivos = Boolean(
    filtroColunaCnpj ||
    filtroColunaNome ||
    filtroColunaCidade ||
    filtroColunaBairro ||
    filtroColunaRua ||
    filtroColunaTelefone ||
    filtroColunaEmail ||
    buscaPreFunil
  );

  const handleOrdenarColuna = (coluna: 'cnpj' | 'nome' | 'cidade' | 'bairro' | 'rua' | 'telefone' | 'email') => {
    if (colunaOrdenacao === coluna) {
      if (direcaoOrdenacao === 'asc') {
        setDirecaoOrdenacao('desc');
      } else {
        setColunaOrdenacao(null);
        setDirecaoOrdenacao('asc');
      }
    } else {
      setColunaOrdenacao(coluna);
      setDirecaoOrdenacao('asc');
    }
  };

  const leadsPreFunilFiltrados = leadsPreFunil
    .filter((l) => {
      // 1. Busca global
      if (buscaPreFunil.trim()) {
        const termo = buscaPreFunil.toLowerCase();
        const matchGlobal = (
          l.nome.toLowerCase().includes(termo) ||
          l.cnpj.toLowerCase().includes(termo) ||
          l.cidade.toLowerCase().includes(termo) ||
          l.bairro.toLowerCase().includes(termo) ||
          l.rua.toLowerCase().includes(termo) ||
          (l.telefone && l.telefone.toLowerCase().includes(termo)) ||
          (l.email && l.email.toLowerCase().includes(termo)) ||
          (l.contato && l.contato.toLowerCase().includes(termo))
        );
        if (!matchGlobal) return false;
      }

      // 2. Filtro de Coluna CNPJ
      if (filtroColunaCnpj.trim() && !l.cnpj.toLowerCase().includes(filtroColunaCnpj.toLowerCase().trim())) {
        return false;
      }

      // 3. Filtro de Coluna Nome
      if (filtroColunaNome.trim() && !l.nome.toLowerCase().includes(filtroColunaNome.toLowerCase().trim())) {
        return false;
      }

      // 4. Filtro de Coluna Cidade
      if (filtroColunaCidade && (l.cidade || 'Curitiba') !== filtroColunaCidade) {
        return false;
      }

      // 5. Filtro de Coluna Bairro
      if (filtroColunaBairro && l.bairro !== filtroColunaBairro) {
        return false;
      }

      // 6. Filtro de Coluna Rua
      if (filtroColunaRua.trim() && !l.rua.toLowerCase().includes(filtroColunaRua.toLowerCase().trim())) {
        return false;
      }

      // 7. Filtro de Coluna Telefone
      if (filtroColunaTelefone.trim() && !(l.telefone && l.telefone.toLowerCase().includes(filtroColunaTelefone.toLowerCase().trim()))) {
        return false;
      }

      // 8. Filtro de Coluna E-mail
      if (filtroColunaEmail.trim() && !(l.email && l.email.toLowerCase().includes(filtroColunaEmail.toLowerCase().trim()))) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (!colunaOrdenacao) return 0;
      const valA = (a[colunaOrdenacao] || '').toString().toLowerCase();
      const valB = (b[colunaOrdenacao] || '').toString().toLowerCase();
      if (valA < valB) return direcaoOrdenacao === 'asc' ? -1 : 1;
      if (valA > valB) return direcaoOrdenacao === 'asc' ? 1 : -1;
      return 0;
    });

  // Base Service Catalog (servicosExtras) Management States
  const [modalNovoServicoBase, setModalNovoServicoBase] = useState(false);
  const [editingServicoBase, setEditingServicoBase] = useState<ServicoExtra | null>(null);
  const [servicoBaseParaExcluir, setServicoBaseParaExcluir] = useState<ServicoExtra | null>(null);

  // Form fields for new or editing Base Service
  const [servicoBaseNome, setServicoBaseNome] = useState('');
  const [servicoBaseCategoria, setServicoBaseCategoria] = useState<ServicoExtra['categoria']>('Administrativa');
  const [servicoBaseValor, setServicoBaseValor] = useState<number>(150);
  const [servicoBaseUnidade, setServicoBaseUnidade] = useState<ServicoExtra['unidade']>('hora');
  const [servicoBaseDescricao, setServicoBaseDescricao] = useState('');

  const handleOpenAddServicoBase = () => {
    setServicoBaseNome('');
    setServicoBaseCategoria('Administrativa');
    setServicoBaseValor(150);
    setServicoBaseUnidade('hora');
    setServicoBaseDescricao('');
    setModalNovoServicoBase(true);
  };

  const handleOpenEditServicoBase = (se: ServicoExtra) => {
    setEditingServicoBase(se);
    setServicoBaseNome(se.nome);
    setServicoBaseCategoria(se.categoria);
    setServicoBaseValor(se.valorUnitario);
    setServicoBaseUnidade(se.unidade);
    setServicoBaseDescricao(se.descricao);
  };

  const handleSaveNovoServicoBase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoBaseNome.trim()) return;

    const nextNumber = servicosExtras.length + 1;
    const newId = `EXT-${String(nextNumber).padStart(3, '0')}`;

    const novoItem: ServicoExtra = {
      id: newId,
      nome: servicoBaseNome.trim(),
      categoria: servicoBaseCategoria,
      valorUnitario: Number(servicoBaseValor),
      unidade: servicoBaseUnidade,
      descricao: servicoBaseDescricao.trim() || 'Serviço prestado sob demanda.'
    };

    setServicosExtras((prev) => [...prev, novoItem]);
    setSyncNotice(`Serviço "${novoItem.nome}" cadastrado no Catálogo Base! Atualizado no Gerador de Carta Proposta.`);
    setModalNovoServicoBase(false);
  };

  const handleSaveEditServicoBase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServicoBase || !servicoBaseNome.trim()) return;

    setServicosExtras((prev) =>
      prev.map((s) =>
        s.id === editingServicoBase.id
          ? {
              ...s,
              nome: servicoBaseNome.trim(),
              categoria: servicoBaseCategoria,
              valorUnitario: Number(servicoBaseValor),
              unidade: servicoBaseUnidade,
              descricao: servicoBaseDescricao.trim()
            }
          : s
      )
    );

    setSyncNotice(`Valor e dados do serviço "${servicoBaseNome}" atualizados! Atualizado no Gerador de Carta Proposta.`);
    setEditingServicoBase(null);
  };

  const handleConfirmDeleteServicoBase = () => {
    if (servicoBaseParaExcluir) {
      setServicosExtras((prev) => prev.filter((s) => s.id !== servicoBaseParaExcluir.id));
      setSyncNotice(`Serviço "${servicoBaseParaExcluir.nome}" foi removido do Catálogo Base.`);
      setServicoBaseParaExcluir(null);
    }
  };

  const handleMoverStatus = (id: string, novoStatus: Condominio['status']) => {
    setCondominios((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, status: novoStatus } : c));
      const target = updated.find((c) => c.id === id);
      if (target) {
        apiUpdateCondominio(id, target).catch((err) => console.error('Erro ao atualizar status no SQLite:', err));
      }
      return updated;
    });
  };

  const orcamentos = condominios.filter((c) => c.status === 'Cotação' || c.status === 'Interessado');
  const emTransicao = condominios.filter((c) => c.status === 'Em transição');
  const finalizados = condominios.filter((c) => c.status === 'Cliente Fidelizado' || (c.status as string) === 'Ativo');
  const perdidos = condominios.filter((c) => c.status === 'Perdido');
  const excluidos = condominios.filter((c) => c.status === 'Excluído');

  return (
    <div className="space-[#1c3220] p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* SubTab 1: Orçamentos & Calculadora & Kanban */}
      {subTab === 'orcamentos' && (
        <>
          {/* TOP SECTION: Calculator & Live Pricing Motor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="bg-[#2d5a32] p-2 rounded-xl text-white">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1c3220]">1.1 Pré-Cadastro & Simulador</h2>
                  <p className="text-xs text-slate-500">Insira as variáveis do condomínio para precificar via Motor VOS</p>
                </div>
              </div>

              <form onSubmit={handleSalvarOrcamento} className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nome do Condomínio *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Condomínio Batel Central"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] focus:border-transparent outline-hidden font-medium"
                    />
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">ID do Condomínio</label>
                      <button
                        type="button"
                        onClick={() => setCustomId(gerarProximoIdCondominio(condominios))}
                        className="text-[10px] text-[#2d5a32] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Gerar ID automático"
                      >
                        <Sparkles className="w-3 h-3" /> Gerar
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={`Ex: ${gerarProximoIdCondominio(condominios)}`}
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Número de Unidades *</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={unidades}
                      onChange={(e) => setUnidades(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Complexidade *</label>
                    <select
                      value={complexidade}
                      onChange={(e) => setComplexidade(e.target.value as Complexidade)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] font-medium"
                    >
                      <option value="Tranquilo">Tranquilo (+ R$ 50,00)</option>
                      <option value="Moderado">Moderado (+ R$ 150,00)</option>
                      <option value="Difícil">Difícil (+ R$ 250,00)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Plano Escolhido *</label>
                    <select
                      value={plano}
                      onChange={(e) => setPlano(e.target.value as Plano)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] font-semibold text-[#2d5a32]"
                    >
                      <option value="Vos Essencial">Vos Essencial (105%)</option>
                      <option value="Vos Pulse">Vos Pulse (125%)</option>
                      <option value="Vos 360">Vos 360 (135%)</option>
                      <option value="Vos Starter">Vos Starter (Fixo R$ 129,90)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fator de Ajuste (Negociação)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="2.0"
                      value={fatorAjuste}
                      onChange={(e) => setFatorAjuste(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32] font-mono"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { label: 'Padrão (1.0)', val: 1.0 },
                        { label: '-10% (0.90)', val: 0.90 },
                        { label: '-5% (0.95)', val: 0.95 },
                        { label: '+5% (1.05)', val: 1.05 },
                        { label: '+10% (1.10)', val: 1.10 },
                      ].map((f) => (
                        <button
                          key={f.val}
                          type="button"
                          onClick={() => setFatorAjuste(f.val)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition-colors ${
                            numFator === f.val
                              ? 'bg-[#2d5a32] text-white border-[#2d5a32]'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CNPJ (Opcional)</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Síndico Responsável</label>
                    <input
                      type="text"
                      placeholder="Nome do Síndico"
                      value={sindico}
                      onChange={(e) => setSindico(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Orçamento no Kanban</span>
                </button>
              </form>
            </div>

            {/* Live Pricing Breakdown Motor */}
            <div className="lg:col-span-6 bg-[#1c3220] text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between border border-[#2d5a32]">
              <div>
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    <h3 className="text-base font-bold text-emerald-50">1.2 Motor de Cálculo da Mensalidade</h3>
                  </div>
                  <span className="bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest font-bold">
                    Equação do Valor
                  </span>
                </div>

                {/* Main Result Display */}
                <div className="bg-[#122215] p-5 rounded-xl border border-emerald-700/50 mb-5 shadow-inner text-center">
                  <span className="text-xs text-emerald-300 uppercase tracking-widest font-semibold">Valor Final Estimado</span>
                  <div className="text-4xl font-black text-emerald-300 my-1 tracking-tight">
                    {formatarMoeda(calcResult.valorFinal)} <span className="text-sm font-normal text-emerald-100">/mês</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 italic">
                    Plano {plano} • {numUnidades} unidades • Complexidade {complexidade} • Fator {numFator}
                  </p>
                </div>

                {/* Sequential Step Breakdown */}
                <div className="space-y-2.5 text-xs">
                  {/* Step A */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#244528]/80 border border-emerald-700/40">
                    <div>
                      <span className="text-emerald-300 font-bold">Passo A (Por Unidade):</span>
                      <p className="text-[11px] text-emerald-100/80">{numUnidades} un x {formatarMoeda(calcResult.taxaPorUnidade)}/un</p>
                    </div>
                    <span className="font-mono font-bold text-white">{formatarMoeda(calcResult.passoA)}</span>
                  </div>

                  {/* Step B */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#244528]/80 border border-emerald-700/40">
                    <div>
                      <span className="text-emerald-300 font-bold">Passo B (Complexidade):</span>
                      <p className="text-[11px] text-emerald-100/80">
                        {formatarMoeda(calcResult.passoA)} + Taxa {complexidade} ({formatarMoeda(calcResult.taxaComplexidade)})
                      </p>
                    </div>
                    <span className="font-mono font-bold text-white">{formatarMoeda(calcResult.passoB)}</span>
                  </div>

                  {/* Step C */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#244528]/80 border border-emerald-700/40">
                    <div>
                      <span className="text-emerald-300 font-bold">Passo C (Multiplicador do Plano):</span>
                      <p className="text-[11px] text-emerald-100/80">
                        {plano === 'Vos Starter' ? 'Plano Starter (Valor Fixo R$ 129,90)' : `${formatarMoeda(calcResult.passoB)} x ${(calcResult.multiplicadorPlano * 100).toFixed(0)}% (${plano})`}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-white">{formatarMoeda(calcResult.subtotalPlano)}</span>
                  </div>

                  {/* Step D / Fator */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#244528]/80 border border-emerald-700/40">
                    <div>
                      <span className="text-emerald-300 font-bold">Passo D (Fator de Ajuste):</span>
                      <p className="text-[11px] text-emerald-100/80">
                        Multiplicador de negociação: {calcResult.fatorAjuste} ({numFator < 1 ? `Desconto de ${((1 - numFator) * 100).toFixed(0)}%` : numFator > 1 ? `Acréscimo de ${((numFator - 1) * 100).toFixed(0)}%` : 'Sem ajuste'})
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-300">{formatarMoeda(calcResult.valorFinal)}</span>
                  </div>
                </div>
              </div>

              {/* Compare Plans Matrix */}
              <div className="mt-6 border-t border-emerald-800/80 pt-4">
                <span className="block text-[11px] font-bold text-emerald-300 mb-2 uppercase tracking-wider">
                  Simulação Comparativa dos 4 Planos (Clique para Selecionar)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  {comparativoPlanos.map((item) => (
                    <div
                      key={item.nome}
                      onClick={() => setPlano(item.nome as Plano)}
                      className={`p-2 rounded-lg cursor-pointer transition-all border ${
                        plano === item.nome
                          ? 'bg-emerald-600 border-white text-white font-bold ring-2 ring-emerald-300/40 shadow-md'
                          : 'bg-[#122215] border-emerald-800/60 text-emerald-200 hover:bg-[#1a331f]'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-semibold">{item.nome}</span>
                      <span className="text-xs font-black font-mono">{formatarMoeda(item.calc.valorFinal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: 1.4 Visualização do Funil & Pré-Funil */}
          <div className="space-y-5">
            {/* Header com Navegação em Abas: Kanban vs Pré-Funil */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#1c3220] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#2d5a32]" />
                    <span>1.4 Funil Comercial & Pré-Funil</span>
                  </h3>
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Pipeline VOS
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerencie a qualificação inicial de novos leads no Pré-Funil e acompanhe a evolução do Kanban até o contrato finalizado
                </p>
              </div>

              {/* Botões de Alternância de Abas (Pré-Funil vs Kanban) */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAbaFunil('kanban')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    abaFunil === 'kanban'
                      ? 'bg-[#1c3220] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Kanban de Orçamentos (5 Etapas)</span>
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {condominios.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaFunil('pre_funil')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    abaFunil === 'pre_funil'
                      ? 'bg-[#1c3220] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Pré-Funil</span>
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {leadsPreFunil.length}
                  </span>
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ABA 1: PRÉ-FUNIL (TABELA: CNPJ, NOME, CIDADE, BAIRRO, RUA) */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {abaFunil === 'pre_funil' && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                {/* Top Actions & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Banco de Leads & Oportunidades (Pré-Funil)</h4>
                      <p className="text-xs text-slate-500">
                        Condomínios mapeados em prospecção preliminar antes da formalização do orçamento e proposta
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar por CNPJ, nome, cidade, bairro, rua, telefone, e-mail..."
                        value={buscaPreFunil}
                        onChange={(e) => setBuscaPreFunil(e.target.value)}
                        className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium w-64 sm:w-72 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2d5a32] outline-none"
                      />
                    </div>

                    {/* Botão Alternar Filtros por Coluna */}
                    <button
                      type="button"
                      onClick={() => setMostrarFiltrosColunas(!mostrarFiltrosColunas)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        mostrarFiltrosColunas
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                      title="Exibir ou ocultar a linha de filtros individuais em cada coluna"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>{mostrarFiltrosColunas ? 'Filtros Ativos' : 'Filtrar Colunas'}</span>
                    </button>

                    {/* Botão Limpar Filtros se houver algum ativo */}
                    {temFiltrosColunasAtivos && (
                      <button
                        type="button"
                        onClick={handleLimparFiltrosColunas}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        title="Limpar todos os filtros aplicados"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Limpar Filtros</span>
                      </button>
                    )}

                    {/* Botão Importar em Massa do Excel (Ctrl+C / Ctrl+V) */}
                    <button
                      type="button"
                      onClick={() => {
                        setTextoColadoExcel('');
                        setLeadsParsedExcel([]);
                        setModalImportExcel(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Cole várias linhas copiadas direto do Excel ou Google Sheets"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                      <span>Colar do Excel (Ctrl+V)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenNovoPreFunil}
                      className="px-3.5 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Novo Lead</span>
                    </button>

                    {/* Botão Esvaziar Pré-Funil se houver leads */}
                    {leadsPreFunil.length > 0 && (
                      <button
                        type="button"
                        onClick={handleLimparTodosLeadsPreFunil}
                        className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Excluir todos os cadastros existentes no Pré-Funil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Esvaziar Pré-Funil</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Summary Strip & Active Filter Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Total no Pré-Funil</span>
                      <span className="text-lg font-black font-mono text-slate-800">{leadsPreFunil.length}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-bold text-emerald-700 block">Cidades</span>
                      <span className="text-lg font-black font-mono text-emerald-900">
                        {cidadesDisponiveis.length}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-bold text-blue-700 block">Bairros</span>
                      <span className="text-lg font-black font-mono text-blue-900">
                        {bairrosDisponiveis.length}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[9px] uppercase font-bold text-amber-800 block">Filtrados</span>
                      <span className="text-lg font-black font-mono text-amber-950">
                        {leadsPreFunilFiltrados.length}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-700 block">
                      Exibindo {leadsPreFunilFiltrados.length} de {leadsPreFunil.length} leads
                    </span>
                    {temFiltrosColunasAtivos && (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1 mt-0.5">
                        <Filter className="w-2.5 h-2.5" /> Filtros ativos nas colunas
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabela do Pré-Funil com Filtros nas Colunas e Ordenação */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      {/* LINHA 1: Títulos das Colunas com Ordenação Clicável */}
                      <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-200 select-none">
                        {/* CNPJ */}
                        <th
                          onClick={() => handleOrdenarColuna('cnpj')}
                          className="py-2.5 px-3 w-36 cursor-pointer hover:bg-slate-200 transition-colors"
                          title="Clique para ordenar por CNPJ"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>CNPJ</span>
                            {colunaOrdenacao === 'cnpj' ? (
                              direcaoOrdenacao === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2d5a32]" /> : <ArrowDown className="w-3 h-3 text-[#2d5a32]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Nome */}
                        <th
                          onClick={() => handleOrdenarColuna('nome')}
                          className="py-2.5 px-3 min-w-[180px] cursor-pointer hover:bg-slate-200 transition-colors"
                          title="Clique para ordenar por Nome"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Nome</span>
                            {colunaOrdenacao === 'nome' ? (
                              direcaoOrdenacao === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2d5a32]" /> : <ArrowDown className="w-3 h-3 text-[#2d5a32]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Cidade */}
                        <th
                          onClick={() => handleOrdenarColuna('cidade')}
                          className="py-2.5 px-3 w-32 cursor-pointer hover:bg-slate-200 transition-colors"
                          title="Clique para ordenar por Cidade"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Cidade</span>
                            {colunaOrdenacao === 'cidade' ? (
                              direcaoOrdenacao === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2d5a32]" /> : <ArrowDown className="w-3 h-3 text-[#2d5a32]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Bairro */}
                        <th
                          onClick={() => handleOrdenarColuna('bairro')}
                          className="py-2.5 px-3 w-36 cursor-pointer hover:bg-slate-200 transition-colors"
                          title="Clique para ordenar por Bairro"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Bairro</span>
                            {colunaOrdenacao === 'bairro' ? (
                              direcaoOrdenacao === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2d5a32]" /> : <ArrowDown className="w-3 h-3 text-[#2d5a32]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Rua */}
                        <th
                          onClick={() => handleOrdenarColuna('rua')}
                          className="py-2.5 px-3 min-w-[170px] cursor-pointer hover:bg-slate-200 transition-colors"
                          title="Clique para ordenar por Rua"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Rua</span>
                            {colunaOrdenacao === 'rua' ? (
                              direcaoOrdenacao === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2d5a32]" /> : <ArrowDown className="w-3 h-3 text-[#2d5a32]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Telefone */}
                        <th
                          onClick={() => handleOrdenarColuna('telefone')}
                          className="py-2.5 px-3 w-36 cursor-pointer hover:bg-slate-200 transition-colors"
                          title="Clique para ordenar por Telefone"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Telefone</span>
                            {colunaOrdenacao === 'telefone' ? (
                              direcaoOrdenacao === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2d5a32]" /> : <ArrowDown className="w-3 h-3 text-[#2d5a32]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* E-mail */}
                        <th
                          onClick={() => handleOrdenarColuna('email')}
                          className="py-2.5 px-3 min-w-[150px] cursor-pointer hover:bg-slate-200 transition-colors"
                          title="Clique para ordenar por E-mail"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>E-mail</span>
                            {colunaOrdenacao === 'email' ? (
                              direcaoOrdenacao === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2d5a32]" /> : <ArrowDown className="w-3 h-3 text-[#2d5a32]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Ações */}
                        <th className="py-2.5 px-3 w-40 text-center">Ações</th>
                      </tr>

                      {/* LINHA 2: Filtros Integrados nas Colunas */}
                      {mostrarFiltrosColunas && (
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                          {/* Filtro CNPJ */}
                          <th className="p-1.5">
                            <input
                              type="text"
                              placeholder="Filtrar CNPJ..."
                              value={filtroColunaCnpj}
                              onChange={(e) => setFiltroColunaCnpj(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-mono text-black font-normal focus:ring-1 focus:ring-[#2d5a32] outline-none"
                            />
                          </th>

                          {/* Filtro Nome */}
                          <th className="p-1.5">
                            <input
                              type="text"
                              placeholder="Filtrar nome..."
                              value={filtroColunaNome}
                              onChange={(e) => setFiltroColunaNome(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-black focus:ring-1 focus:ring-[#2d5a32] outline-none"
                            />
                          </th>

                          {/* Filtro Cidade (Dropdown) */}
                          <th className="p-1.5">
                            <select
                              value={filtroColunaCidade}
                              onChange={(e) => setFiltroColunaCidade(e.target.value)}
                              className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-black focus:ring-1 focus:ring-[#2d5a32] outline-none"
                            >
                              <option value="">Todas</option>
                              {cidadesDisponiveis.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </th>

                          {/* Filtro Bairro (Dropdown) */}
                          <th className="p-1.5">
                            <select
                              value={filtroColunaBairro}
                              onChange={(e) => setFiltroColunaBairro(e.target.value)}
                              className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-black focus:ring-1 focus:ring-[#2d5a32] outline-none"
                            >
                              <option value="">Todos</option>
                              {bairrosDisponiveis.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </th>

                          {/* Filtro Rua */}
                          <th className="p-1.5">
                            <input
                              type="text"
                              placeholder="Filtrar rua..."
                              value={filtroColunaRua}
                              onChange={(e) => setFiltroColunaRua(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-black focus:ring-1 focus:ring-[#2d5a32] outline-none"
                            />
                          </th>

                          {/* Filtro Telefone */}
                          <th className="p-1.5">
                            <input
                              type="text"
                              placeholder="Filtrar telefone..."
                              value={filtroColunaTelefone}
                              onChange={(e) => setFiltroColunaTelefone(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-black focus:ring-1 focus:ring-[#2d5a32] outline-none font-mono"
                            />
                          </th>

                          {/* Filtro E-mail */}
                          <th className="p-1.5">
                            <input
                              type="text"
                              placeholder="Filtrar e-mail..."
                              value={filtroColunaEmail}
                              onChange={(e) => setFiltroColunaEmail(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-medium text-black focus:ring-1 focus:ring-[#2d5a32] outline-none"
                            />
                          </th>

                          {/* Coluna Ações: Botão Limpar Filtros */}
                          <th className="p-1.5 text-center">
                            {temFiltrosColunasAtivos ? (
                              <button
                                type="button"
                                onClick={handleLimparFiltrosColunas}
                                title="Limpar todos os filtros das colunas"
                                className="px-2 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold rounded-md text-[10px] flex items-center justify-center gap-1 w-full transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Limpar</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase block text-center">
                                Filtros
                              </span>
                            )}
                          </th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {leadsPreFunilFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                            Nenhum lead encontrado no Pré-Funil. Clique em "+ Novo Lead" ou "Colar do Excel" para cadastrar em massa.
                          </td>
                        </tr>
                      ) : (
                        leadsPreFunilFiltrados.map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                            {/* Coluna CNPJ */}
                            <td className="py-3 px-3 font-mono font-bold text-black whitespace-nowrap">
                              {lead.cnpj}
                            </td>

                            {/* Coluna Nome */}
                            <td className="py-3 px-3 font-semibold text-black">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-slate-900">{lead.nome}</span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span className="font-mono">{lead.id}</span>
                                  {lead.unidades ? `• ${lead.unidades} un` : ''}
                                  {lead.contato ? `• ${lead.contato}` : ''}
                                </span>
                              </div>
                            </td>

                            {/* Coluna Cidade */}
                            <td className="py-3 px-3 font-medium text-black">
                              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold border border-slate-200 whitespace-nowrap">
                                {lead.cidade || 'Curitiba'}
                              </span>
                            </td>

                            {/* Coluna Bairro */}
                            <td className="py-3 px-3 font-medium text-black">
                              <span className="bg-emerald-50 text-[#1c3220] px-2 py-0.5 rounded-md font-bold border border-emerald-200 whitespace-nowrap">
                                {lead.bairro || 'Centro'}
                              </span>
                            </td>

                            {/* Coluna Rua */}
                            <td className="py-3 px-3 font-medium text-black">
                              <span className="text-slate-800">{lead.rua || 'Não informada'}</span>
                            </td>

                            {/* Coluna Telefone (NOVO) */}
                            <td className="py-3 px-3 font-mono text-black font-semibold whitespace-nowrap">
                              {lead.telefone ? (
                                <span className="flex items-center gap-1 text-slate-800">
                                  <Phone className="w-3 h-3 text-[#2d5a32]" />
                                  <span>{lead.telefone}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">-</span>
                              )}
                            </td>

                            {/* Coluna E-mail (NOVO) */}
                            <td className="py-3 px-3 font-medium text-black truncate max-w-[170px]">
                              {lead.email ? (
                                <a
                                  href={`mailto:${lead.email}`}
                                  title={`Enviar e-mail para ${lead.email}`}
                                  className="flex items-center gap-1 text-blue-700 hover:text-blue-900 hover:underline"
                                >
                                  <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span className="truncate">{lead.email}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">-</span>
                              )}
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEnviarParaFunil(lead)}
                                  title="Enviar para Prospecção no Funil Comercial"
                                  className="px-2.5 py-1.5 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Funil</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPreFunil(lead)}
                                  title="Editar Lead"
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExcluirPreFunil(lead.id, lead.nome)}
                                  title="Remover do Pré-Funil"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ABA 2: KANBAN COM 5 JANELAS DE TAMANHO FIXO E ROLO (SCROLL)*/}
            {/* ═══════════════════════════════════════════════════════════ */}
            {abaFunil === 'kanban' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span className="font-semibold">
                    💡 Clique em qualquer item do funil para abrir a <strong>Janela de Visualização Detalhada</strong> do lead.
                  </span>
                  <span className="font-mono text-slate-400 font-bold">5 Etapas • Rolagem interna individual</span>
                </div>

                {/* 5 Colunas com Altura Fixa (h-[580px]) e Rolo Interno */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
                  
                  {/* ─────────────────────────────────────────────────── */}
                  {/* Coluna 1: Prospecção (Cotação / Interessado)         */}
                  {/* ─────────────────────────────────────────────────── */}
                  <div className="bg-[#f2f5f1] p-3.5 rounded-2xl border border-amber-200 flex flex-col h-[580px] shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5 mb-2.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <h4 className="font-bold text-xs uppercase text-slate-800">1. Prospecção</h4>
                      </div>
                      <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-xs font-mono">
                        {orcamentos.length}
                      </span>
                    </div>

                    {/* Rolo de Rolagem */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                      {orcamentos.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-8">Nenhum lead em prospecção</p>
                      ) : (
                        orcamentos.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setModalDetalhesCondo(item)}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col gap-2 cursor-pointer group"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-slate-400 font-bold">{item.id}</span>
                              <span className="bg-[#e8f0e6] text-[#2d5a32] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.plano}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-amber-800 transition-colors">
                                {item.nome}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.unidades} un • Cmplx: {item.complexidade}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-800 text-xs font-mono">
                                {formatarMoeda(item.mensalidadeCalculada)}/mês
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 group-hover:text-[#2d5a32]">
                                <Eye className="w-3 h-3" /> Detalhes
                              </span>
                            </div>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex gap-1.5 justify-end border-t border-slate-100 pt-2 mt-1"
                            >
                              <button
                                onClick={() => setSelectedCondoForDoc(item)}
                                title="Gerar Proposta Oficial"
                                className="p-1.5 bg-[#1c3220] hover:bg-[#2d5a32] text-white rounded-lg transition-colors flex-1 flex justify-center items-center gap-1 text-[10px] font-bold cursor-pointer"
                              >
                                <FileCheck className="w-3 h-3 text-emerald-300" /> Proposta
                              </button>
                              <button
                                onClick={() => handleMoverStatus(item.id, 'Em transição')}
                                title="Avançar para Negociação"
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg flex items-center justify-center cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoverStatus(item.id, 'Perdido')}
                                title="Marcar como Perdido"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ─────────────────────────────────────────────────── */}
                  {/* Coluna 2: Negociação (Em Transição)                  */}
                  {/* ─────────────────────────────────────────────────── */}
                  <div className="bg-[#f2f5f1] p-3.5 rounded-2xl border border-blue-200 flex flex-col h-[580px] shadow-xs">
                    <div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5 mb-2.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <h4 className="font-bold text-xs uppercase text-slate-800">2. Negociação</h4>
                      </div>
                      <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full text-xs font-mono">
                        {emTransicao.length}
                      </span>
                    </div>

                    {/* Rolo de Rolagem */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                      {emTransicao.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-8">Nenhum lead em negociação</p>
                      ) : (
                        emTransicao.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setModalDetalhesCondo(item)}
                            className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col gap-2 border-l-4 border-l-blue-400 cursor-pointer group"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-slate-400 font-bold">{item.id}</span>
                              <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.plano}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-blue-800 transition-colors">
                                {item.nome}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.unidades} un • Síndico: {item.sindicoResponsavel}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-800 text-xs font-mono">
                                {formatarMoeda(item.mensalidadeCalculada)}/mês
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 group-hover:text-blue-700">
                                <Eye className="w-3 h-3" /> Detalhes
                              </span>
                            </div>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex gap-1.5 justify-end border-t border-slate-100 pt-2 mt-1"
                            >
                              <button
                                onClick={() => setSelectedCondoForDoc(item)}
                                title="Abrir Proposta"
                                className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg flex items-center justify-center cursor-pointer"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoverStatus(item.id, 'Cliente Fidelizado')}
                                title="Fechar Negócio"
                                className="flex-1 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Fechar
                              </button>
                              <button
                                onClick={() => handleMoverStatus(item.id, 'Perdido')}
                                title="Marcar como Perdido"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ─────────────────────────────────────────────────── */}
                  {/* Coluna 3: Fechado (Cliente Fidelizado)              */}
                  {/* ─────────────────────────────────────────────────── */}
                  <div className="bg-[#f2f5f1] p-3.5 rounded-2xl border border-emerald-200 flex flex-col h-[580px] shadow-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5 mb-2.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                        <h4 className="font-bold text-xs uppercase text-slate-800">3. Fechado</h4>
                      </div>
                      <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full text-xs font-mono">
                        {finalizados.length}
                      </span>
                    </div>

                    {/* Rolo de Rolagem */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                      {finalizados.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-8">Nenhum contrato fechado ainda</p>
                      ) : (
                        finalizados.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setModalDetalhesCondo(item)}
                            className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col gap-2 border-l-4 border-l-emerald-500 cursor-pointer group"
                          >
                            <div className="flex justify-between items-start">
                              <span className="bg-slate-900 text-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700 font-bold">
                                {item.id}
                              </span>
                              <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.plano}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-emerald-900 transition-colors">
                                {item.nome}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.unidades} un • CNPJ: {item.cnpj}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#2d5a32] text-xs font-mono">
                                {formatarMoeda(item.mensalidadeCalculada)}/mês
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 group-hover:text-emerald-700">
                                <Eye className="w-3 h-3" /> Detalhes
                              </span>
                            </div>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex gap-1.5 justify-end border-t border-slate-100 pt-2 mt-1"
                            >
                              <button
                                onClick={() => setSelectedCondoForDoc(item)}
                                title="Acessar Contrato / Proposta"
                                className="flex-1 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold cursor-pointer"
                              >
                                <FileCheck className="w-3 h-3 text-emerald-700" /> Contrato
                              </button>
                              <button
                                onClick={() => handleMoverStatus(item.id, 'Perdido')}
                                title="Marcar como Perdido"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ─────────────────────────────────────────────────── */}
                  {/* Coluna 4: Perdidos                                  */}
                  {/* ─────────────────────────────────────────────────── */}
                  <div className="bg-[#f2f5f1] p-3.5 rounded-2xl border border-rose-200 flex flex-col h-[580px] shadow-xs">
                    <div className="flex items-center justify-between border-b border-rose-200/80 pb-2.5 mb-2.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        <h4 className="font-bold text-xs uppercase text-slate-800">4. Perdidos</h4>
                      </div>
                      <span className="bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded-full text-xs font-mono">
                        {perdidos.length}
                      </span>
                    </div>

                    {/* Rolo de Rolagem */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                      {perdidos.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-8">Nenhum orçamento perdido</p>
                      ) : (
                        perdidos.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setModalDetalhesCondo(item)}
                            className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-2xs hover:border-rose-400 hover:shadow-md transition-all flex flex-col gap-2 border-l-4 border-l-rose-400 cursor-pointer group"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-slate-400 font-bold">{item.id}</span>
                              <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.plano}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-rose-900 transition-colors">
                                {item.nome}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.unidades} un • Cmplx: {item.complexidade}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-400 line-through text-xs font-mono">
                                {formatarMoeda(item.mensalidadeCalculada)}/mês
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 group-hover:text-rose-700">
                                <Eye className="w-3 h-3" /> Detalhes
                              </span>
                            </div>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex gap-1.5 justify-end border-t border-slate-100 pt-2 mt-1"
                            >
                              <button
                                onClick={() => handleMoverStatus(item.id, 'Cotação')}
                                title="Reabrir Orçamento no Kanban"
                                className="flex-1 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3 text-slate-600" />
                                <span>Reabrir</span>
                              </button>
                              <button
                                onClick={() => handleMoverExcluido(item.id, item.nome)}
                                title="Excluir Lead (Mover para Leads Excluídos)"
                                className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ─────────────────────────────────────────────────── */}
                  {/* Coluna 5: Leads Excluídos                           */}
                  {/* ─────────────────────────────────────────────────── */}
                  <div className="bg-[#f8faf6] p-3.5 rounded-2xl border border-slate-300 flex flex-col h-[580px] shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-2.5 mb-2.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                        <h4 className="font-bold text-xs uppercase text-slate-700">5. Leads Excluídos</h4>
                      </div>
                      <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-full text-xs font-mono">
                        {excluidos.length}
                      </span>
                    </div>

                    {/* Rolo de Rolagem */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                      {excluidos.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-8">Nenhum lead excluído</p>
                      ) : (
                        excluidos.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setModalDetalhesCondo(item)}
                            className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-md transition-all flex flex-col gap-2 opacity-90 cursor-pointer group"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-slate-400 font-bold">{item.id}</span>
                              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.plano}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-bold text-slate-700 text-sm leading-tight line-through group-hover:text-slate-900 transition-colors">
                                {item.nome}
                              </h5>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {item.unidades} un • Excluído
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-400 line-through text-xs font-mono">
                                {formatarMoeda(item.mensalidadeCalculada)}/mês
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 group-hover:text-slate-800">
                                <Eye className="w-3 h-3" /> Detalhes
                              </span>
                            </div>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex gap-1.5 justify-end border-t border-slate-200 pt-2 mt-1"
                            >
                              <button
                                onClick={() => {
                                  handleMoverStatus(item.id, 'Perdido');
                                  setSyncNotice(`Lead "${item.nome}" restaurado para Perdidos.`);
                                }}
                                title="Restaurar Lead para Perdidos"
                                className="flex-1 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3 text-white" />
                                <span>Restaurar</span>
                              </button>
                              <button
                                onClick={() => handleExcluirDefinitivoPrompt(item.id, item.nome)}
                                title="Excluir Definitivamente"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* SubTab 2: 1.3 Tabela de Serviços Extras */}
      {subTab === 'extras' && (
        <div className="space-y-8">
          {/* Reference Catalog Table Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#1c3220]">Catálogo de Referência de Preços Base</h3>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full hidden md:inline-block">
                    Sincronizado c/ Carta Proposta
                  </span>
                </div>
                <p className="text-xs text-slate-500">Valores de referência da tabela homologada para consultas e Gerador de Documentos Oficiais</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-[#e8f0e6] text-[#2d5a32] font-bold text-[11px] px-2.5 py-1 rounded-md border border-[#2d5a32]/20 hidden sm:inline-block">
                  Tabela Base 2026
                </span>
                <button
                  onClick={handleOpenAddServicoBase}
                  className="px-3 py-1.5 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Serviço Base</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicosExtras.map((se) => (
                <div key={se.id} className="p-4 rounded-xl border border-slate-200 bg-[#fafbfc] space-y-3 text-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="bg-[#e8f0e6] text-[#2d5a32] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {se.categoria}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{se.id}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{se.nome}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">{se.descricao}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[11px] text-slate-500">Tarifa Ref.:</span>
                      <span className="font-bold text-[#2d5a32]">
                        {se.valorUnitario > 0 ? `${formatarMoeda(se.valorUnitario)} / ${se.unidade}` : 'Sob Orçamento'}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEditServicoBase(se)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#2d5a32] border border-slate-200 hover:border-emerald-300 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Alterar Valor / Dados do Serviço"
                      >
                        <Edit3 className="w-3 h-3 text-[#2d5a32]" />
                        <span>Editar Valor</span>
                      </button>
                      <button
                        onClick={() => setServicoBaseParaExcluir(se)}
                        className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-md transition-colors cursor-pointer"
                        title="Remover Serviço do Catálogo Base"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Card: Lista de Serviços Prestados */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2d5a32]" />
                  <h2 className="text-xl font-bold text-[#1c3220]">1.3 Tabela de Serviços Extras Prestados</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Registro e controle de lançamentos de serviços avulsos e horas técnicas faturadas
                </p>
              </div>

              <button
                onClick={() => setModalNovoServico(true)}
                className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Lançar Novo Serviço Prestado</span>
              </button>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Faturado (Extras)
                </span>
                <span className="text-2xl font-black text-[#2d5a32] font-mono">
                  {formatarMoeda(totalValorGeral)}
                </span>
              </div>
              <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Horas Trabalhadas
                </span>
                <span className="text-2xl font-black text-slate-800 font-mono">
                  {totalHorasGerais} h
                </span>
              </div>
              <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total de Atendimentos
                </span>
                <span className="text-2xl font-black text-slate-800 font-mono">
                  {servicosPrestados.length} lançamentos
                </span>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f8faf6] p-3 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, CNPJ ou serviço..."
                  value={buscaServico}
                  onChange={(e) => setBuscaServico(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Exibindo {servicosFiltrados.length} de {servicosPrestados.length} registros
              </span>
            </div>

            {/* MAIN DATA TABLE: SERVIÇOS PRESTADOS */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1c3220] text-emerald-100 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">DATA</th>
                    <th className="p-3.5 whitespace-nowrap">CNPJ CLIENTE</th>
                    <th className="p-3.5 whitespace-nowrap">NOME</th>
                    <th className="p-3.5 whitespace-nowrap">SERVIÇO</th>
                    <th className="p-3.5 whitespace-nowrap text-center">HORAS TRABALHADAS</th>
                    <th className="p-3.5 whitespace-nowrap text-right">VALOR</th>
                    <th className="p-3.5 min-w-[220px]">OBSERVAÇÃO</th>
                    <th className="p-3.5 text-center whitespace-nowrap">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {servicosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Nenhum serviço prestado encontrado com os termos pesquisados.
                      </td>
                    </tr>
                  ) : (
                    servicosFiltrados.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8faf6] transition-colors">
                        {/* 0. Data */}
                        <td className="p-3.5 font-mono text-slate-700 font-bold whitespace-nowrap">
                          {item.data ? new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                        </td>

                        {/* 1. CNPJ Cliente */}
                        <td className="p-3.5 font-mono text-slate-600 font-medium whitespace-nowrap">
                          {item.cnpjCliente}
                        </td>

                        {/* 2. Nome */}
                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {item.nomeCliente}
                        </td>

                        {/* 3. Serviço */}
                        <td className="p-3.5">
                          <span className="bg-emerald-50 text-emerald-900 font-semibold px-2.5 py-1 rounded-md border border-emerald-200 text-[11px] inline-block">
                            {item.servico}
                          </span>
                        </td>

                        {/* 4. Horas Trabalhadas */}
                        <td className="p-3.5 text-center font-bold text-slate-800 font-mono whitespace-nowrap">
                          {item.horasTrabalhadas} h
                        </td>

                        {/* 5. Valor */}
                        <td className="p-3.5 text-right font-black text-emerald-800 font-mono text-sm whitespace-nowrap">
                          {formatarMoeda(item.valor)}
                        </td>

                        {/* 6. OBSERVAÇÃO */}
                        <td className="p-3.5 text-slate-600 text-[11px] leading-relaxed">
                          {item.observacao}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleExcluirServicoPrestado(item.id)}
                            title="Excluir Lançamento"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

      {/* Modal Lançar Novo Serviço Prestado */}
      {modalNovoServico && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2d5a32]" />
                <h3 className="text-base font-bold text-slate-900">Lançar Novo Serviço Prestado</h3>
              </div>
              <button
                onClick={() => setModalNovoServico(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarServicoPrestado} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Selecionar Cliente Existente (Opcional)</label>
                  <select
                    onChange={(e) => handleSelectCondoParaServico(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800"
                  >
                    <option value="">-- Preencher CNPJ e Nome --</option>
                    {condominios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.cnpj})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNPJ Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678/0001-90"
                    value={novoCnpj}
                    onChange={(e) => setNovoCnpj(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Residencial Batel Plaza"
                    value={novoNomeCliente}
                    onChange={(e) => setNovoNomeCliente(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vistoria Técnica de Engenharia"
                  value={novoServico}
                  onChange={(e) => setNovoServico(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horas Trabalhadas *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    placeholder="Ex: 4.0"
                    value={novasHoras}
                    onChange={(e) => setNovasHoras(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Ex: 680.00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">OBSERVAÇÃO *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva detalhes ou observações adicionais..."
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNovoServico(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl font-bold transition-colors shadow-sm"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Document Generator */}
      {selectedCondoForDoc && (
        <ProposalModal
          condominio={selectedCondoForDoc}
          servicosExtras={servicosExtras}
          onClose={() => setSelectedCondoForDoc(null)}
        />
      )}

      {/* Modal to Edit Condominium ID */}
      {editingIdCondo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#1c3220]">
                <Edit3 className="w-5 h-5 text-[#2d5a32]" />
                <h3 className="font-bold text-sm">Personalizar ID do Condomínio</h3>
              </div>
              <button
                onClick={() => setEditingIdCondo(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedId} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ID Atual: <span className="font-mono text-emerald-800 font-black">{editingIdCondo.id}</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Defina o ID do condomínio que será utilizado para vincular e puxar todos os dados no Bloco 2 (Perfil Completo do Cliente).
                </p>
                <label className="block font-bold text-slate-700 mb-1">Novo ID do Condomínio *</label>
                <input
                  type="text"
                  required
                  value={editingIdCondo.newId}
                  onChange={(e) => setEditingIdCondo({ ...editingIdCondo, newId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  placeholder="Ex: COND-2026-BATEL"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingIdCondo(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs"
                >
                  Salvar Novo ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Move to Excluidos */}
      {leadParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Lead?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deseja mover <strong className="text-slate-800">"{leadParaExcluir.nome}"</strong> para a lista de Leads Excluídos? Você poderá restaurá-lo a qualquer momento.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setLeadParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarMoverExcluido}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Excluir Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Permanent Exclusion */}
      {leadParaExcluirDefinitivo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excluir Definitivamente?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Atenção: Tem certeza que deseja apagar permanentemente o lead <strong className="text-slate-800">"{leadParaExcluirDefinitivo.nome}"</strong>? Esta ação removerá totalmente os dados do sistema e não poderá ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setLeadParaExcluirDefinitivo(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoDefinitiva}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Novo Serviço Base */}
      {modalNovoServicoBase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#1c3220]">
                <Plus className="w-5 h-5 text-[#2d5a32]" />
                <h3 className="font-bold text-base">Cadastrar Serviço no Catálogo Base</h3>
              </div>
              <button
                onClick={() => setModalNovoServicoBase(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNovoServicoBase} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Serviço / Rubrica *</label>
                <input
                  type="text"
                  required
                  value={servicoBaseNome}
                  onChange={(e) => setServicoBaseNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  placeholder="Ex: Auditoria Contábil de Transição"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={servicoBaseCategoria}
                    onChange={(e) => setServicoBaseCategoria(e.target.value as ServicoExtra['categoria'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="Administrativa">Administrativa</option>
                    <option value="Engenharia">Engenharia</option>
                    <option value="Compras">Compras</option>
                    <option value="Assembleia">Assembleia</option>
                    <option value="Laudo">Laudo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Ref. (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={servicoBaseValor}
                    onChange={(e) => setServicoBaseValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                    placeholder="0.00"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Use 0 para 'Sob Orçamento'</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade *</label>
                  <select
                    value={servicoBaseUnidade}
                    onChange={(e) => setServicoBaseUnidade(e.target.value as ServicoExtra['unidade'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="hora">Hora</option>
                    <option value="evento">Evento</option>
                    <option value="processo">Processo</option>
                    <option value="sob_consulta">Sob Consulta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Curta *</label>
                <textarea
                  required
                  rows={2}
                  value={servicoBaseDescricao}
                  onChange={(e) => setServicoBaseDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  placeholder="Descrição do serviço exibida na Carta Proposta..."
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Sincronização Automática:
                </span>
                <p>
                  Ao cadastrar este serviço, ele será automaticamente incluído no catálogo e exibido no Gerador de Documentos Oficiais (Carta Proposta).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalNovoServicoBase(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar Serviço Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Valor / Dados do Serviço Base */}
      {editingServicoBase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#1c3220]">
                <Edit3 className="w-5 h-5 text-[#2d5a32]" />
                <h3 className="font-bold text-base">Alterar Valor / Dados do Serviço Base</h3>
              </div>
              <button
                onClick={() => setEditingServicoBase(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditServicoBase} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Serviço / Rubrica *</label>
                <input
                  type="text"
                  required
                  value={servicoBaseNome}
                  onChange={(e) => setServicoBaseNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={servicoBaseCategoria}
                    onChange={(e) => setServicoBaseCategoria(e.target.value as ServicoExtra['categoria'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="Administrativa">Administrativa</option>
                    <option value="Engenharia">Engenharia</option>
                    <option value="Compras">Compras</option>
                    <option value="Assembleia">Assembleia</option>
                    <option value="Laudo">Laudo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Ref. (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={servicoBaseValor}
                    onChange={(e) => setServicoBaseValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Use 0 para 'Sob Orçamento'</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade *</label>
                  <select
                    value={servicoBaseUnidade}
                    onChange={(e) => setServicoBaseUnidade(e.target.value as ServicoExtra['unidade'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                  >
                    <option value="hora">Hora</option>
                    <option value="evento">Evento</option>
                    <option value="processo">Processo</option>
                    <option value="sob_consulta">Sob Consulta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Curta *</label>
                <textarea
                  required
                  rows={2}
                  value={servicoBaseDescricao}
                  onChange={(e) => setServicoBaseDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Atualização em Tempo Real:
                </span>
                <p>
                  Ao salvar, este novo valor/dados será atualizado imediatamente na tabela de Carta Proposta no Gerador de Documentos Oficiais.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingServicoBase(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Atualizar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Exclusion of Base Service */}
      {servicoBaseParaExcluir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Remover Serviço Base?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tem certeza que deseja remover o serviço <strong className="text-slate-800">"{servicoBaseParaExcluir.nome}"</strong> do Catálogo Base?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setServicoBaseParaExcluir(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteServicoBase}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: JANELA DE VISUALIZAÇÃO DETALHADA DO LEAD / ITEM DO FUNIL     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {modalDetalhesCondo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header com Nome, ID e Status */}
            <div className="bg-[#1c3220] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2d5a32] rounded-xl text-emerald-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-emerald-300 font-bold bg-black/30 px-2 py-0.5 rounded">
                      {modalDetalhesCondo.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        modalDetalhesCondo.status === 'Cotação' || modalDetalhesCondo.status === 'Interessado'
                          ? 'bg-amber-400 text-amber-950'
                          : modalDetalhesCondo.status === 'Em transição'
                          ? 'bg-blue-400 text-blue-950'
                          : modalDetalhesCondo.status === 'Cliente Fidelizado'
                          ? 'bg-emerald-400 text-emerald-950'
                          : modalDetalhesCondo.status === 'Perdido'
                          ? 'bg-rose-400 text-rose-950'
                          : 'bg-slate-400 text-slate-950'
                      }`}
                    >
                      Etapa: {modalDetalhesCondo.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1 leading-tight">{modalDetalhesCondo.nome}</h3>
                </div>
              </div>
              <button
                onClick={() => setModalDetalhesCondo(null)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal com Rolagem */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* 4 Cards de Resumo Rápido */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Mensalidade</span>
                  <span className="text-base font-black font-mono text-emerald-800">
                    {formatarMoeda(modalDetalhesCondo.mensalidadeCalculada)}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Plano Atual</span>
                  <span className="text-xs font-bold text-slate-800 block truncate">{modalDetalhesCondo.plano}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Unidades</span>
                  <span className="text-base font-black font-mono text-slate-800">{modalDetalhesCondo.unidades} un</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Complexidade</span>
                  <span className="text-xs font-bold text-slate-800 block truncate">{modalDetalhesCondo.complexidade}</span>
                </div>
              </div>

              {/* Seção 1: Localização & Endereço */}
              {(() => {
                const end = extrairEnderecoPartes(modalDetalhesCondo);
                return (
                  <div className="bg-[#f2f5f1] p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <MapPin className="w-4 h-4 text-[#2d5a32]" />
                      <span>Localização & Endereço</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">Cidade</span>
                        <span className="font-bold text-slate-800">{end.cidade}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">Bairro</span>
                        <span className="font-bold text-slate-800">{end.bairro}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">Rua / Logradouro</span>
                        <span className="font-bold text-slate-800">{end.rua}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Seção 2: Dados de Contato & Gestão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-600" /> Identificação Cadastral
                  </span>
                  <div>
                    <span className="text-slate-500">CNPJ:</span>{' '}
                    <strong className="font-mono text-slate-900">{modalDetalhesCondo.cnpj}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Síndico(a):</span>{' '}
                    <strong className="text-slate-900">{modalDetalhesCondo.sindicoResponsavel || 'Não informado'}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-600" /> Contato Direto
                  </span>
                  <div>
                    <span className="text-slate-500">Telefone:</span>{' '}
                    <strong className="text-slate-900">{modalDetalhesCondo.numeroCondominio || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">E-mail:</span>{' '}
                    <strong className="text-slate-900">{modalDetalhesCondo.emailCondominio || 'Não informado'}</strong>
                  </div>
                </div>
              </div>

              {/* Seção 3: Anotações & Observações do Lead */}
              {modalDetalhesCondo.anotacoes && (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 text-slate-800 space-y-1">
                  <span className="font-bold text-[11px] text-amber-900 block">Anotações do Lead / Orçamento:</span>
                  <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                    {modalDetalhesCondo.anotacoes}
                  </p>
                </div>
              )}

              {/* Seção 4: Alterar Etapa no Funil Diretamente na Janela */}
              <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Mover Lead para Outra Etapa do Funil:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { st: 'Cotação', label: '1. Prospecção', color: 'hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300' },
                    { st: 'Em transição', label: '2. Negociação', color: 'hover:bg-blue-100 hover:text-blue-900 hover:border-blue-300' },
                    { st: 'Cliente Fidelizado', label: '3. Fechado', color: 'hover:bg-emerald-100 hover:text-emerald-900 hover:border-emerald-300' },
                    { st: 'Perdido', label: '4. Perdido', color: 'hover:bg-rose-100 hover:text-rose-900 hover:border-rose-300' },
                    { st: 'Excluído', label: '5. Excluído', color: 'hover:bg-slate-200 hover:text-slate-900 hover:border-slate-400' },
                  ].map((btn) => (
                    <button
                      key={btn.st}
                      type="button"
                      onClick={() => {
                        handleMoverStatus(modalDetalhesCondo.id, btn.st as any);
                        setModalDetalhesCondo({ ...modalDetalhesCondo, status: btn.st as any });
                        setSyncNotice(`Status de "${modalDetalhesCondo.nome}" alterado para ${btn.label}!`);
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                        modalDetalhesCondo.status === btn.st
                          ? 'bg-[#1c3220] text-white border-[#1c3220] shadow-2xs'
                          : `bg-white text-slate-700 border-slate-300 ${btn.color}`
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalDetalhesCondo(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 cursor-pointer"
              >
                Fechar Janela
              </button>
              <button
                type="button"
                onClick={() => {
                  const condo = modalDetalhesCondo;
                  setModalDetalhesCondo(null);
                  setSelectedCondoForDoc(condo);
                }}
                className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-emerald-300" />
                <span>Acessar Carta Proposta / Contrato</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: NOVO / EDITAR LEAD NO PRÉ-FUNIL                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {modalPreFunil && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1c3220] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Table className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">
                  {editingPreFunil ? 'Editar Lead do Pré-Funil' : 'Cadastrar Novo Lead no Pré-Funil'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPreFunil(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPreFunil} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Atalho para importar do Excel */}
              {!editingPreFunil && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-950">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[#2d5a32] shrink-0" />
                    <div>
                      <span className="font-bold block">Quer cadastrar vários condomínios de uma vez?</span>
                      <span className="text-[11px] text-emerald-800">Copie as células do Excel e cole tudo direto com Ctrl+V.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModalPreFunil(false);
                      setTextoColadoExcel('');
                      setLeadsParsedExcel([]);
                      setModalImportExcel(true);
                    }}
                    className="px-3 py-1.5 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-lg text-[11px] shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Colar do Excel</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNPJ do Condomínio *</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={preCnpj}
                    onChange={(e) => setPreCnpj(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidades Estimadas</label>
                  <input
                    type="number"
                    min="1"
                    value={preUnidades}
                    onChange={(e) => setPreUnidades(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Condomínio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Condomínio Edifício Batel Soho"
                  value={preNome}
                  onChange={(e) => setPreNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Curitiba"
                    value={preCidade}
                    onChange={(e) => setPreCidade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Batel, Cabral, Bigorrilho"
                    value={preBairro}
                    onChange={(e) => setPreBairro(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rua / Logradouro com Número *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rua Gonçalves Dias, 1420"
                  value={preRua}
                  onChange={(e) => setPreRua(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contato / Síndico</label>
                  <input
                    type="text"
                    placeholder="Ex: Roberto Silva"
                    value={preContato}
                    onChange={(e) => setPreContato(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(41) 90000-0000"
                    value={preTelefone}
                    onChange={(e) => setPreTelefone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="contato@condo.com"
                    value={preEmail}
                    onChange={(e) => setPreEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações de Pré-Qualificação</label>
                <textarea
                  rows={2}
                  placeholder="Informações colhidas na pré-prospecção, motivo de contato, etc."
                  value={preObservacoes}
                  onChange={(e) => setPreObservacoes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalPreFunil(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingPreFunil ? 'Atualizar Lead' : 'Salvar no Pré-Funil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: IMPORTAÇÃO EM MASSA DO EXCEL (CTRL+C / CTRL+V)               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {modalImportExcel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-[#1c3220] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2d5a32] rounded-xl text-emerald-300">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Importação em Massa do Excel / Google Sheets</h3>
                  <p className="text-xs text-emerald-200/80">
                    Copie as linhas da sua planilha (Ctrl+C) e cole na caixa abaixo (Ctrl+V)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalImportExcel(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Card de Instruções */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <ClipboardPaste className="w-4 h-4 text-[#2d5a32]" />
                    Formato Aceito das Colunas do Excel:
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-[#1c3220] px-2 py-0.5 rounded-full font-bold">
                    Detecção Automática
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Você pode colar diretamente com ou sem cabeçalho. As colunas ideais são:
                </p>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto flex gap-2">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">CNPJ</span>
                  <span>|</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">Nome do Condomínio</span>
                  <span>|</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">Cidade</span>
                  <span>|</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">Bairro</span>
                  <span>|</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">Rua</span>
                  <span>|</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">Telefone</span>
                  <span>|</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">E-mail</span>
                </div>
              </div>

              {/* Área de Colagem (Textarea) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    Cole os dados aqui (pressione Ctrl+V dentro do campo):
                  </label>
                  {textoColadoExcel && (
                    <button
                      type="button"
                      onClick={() => {
                        setTextoColadoExcel('');
                        setLeadsParsedExcel([]);
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Limpar campo
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  placeholder={`Exemplo de dados colados do Excel:
12.345.678/0001-90\tEdifício Solar do Batel\tCuritiba\tBatel\tAv. Sete de Setembro, 4520\t(41) 98877-6655\tcontato@solardobatel.com
98.765.432/0001-10\tResidencial Bosque Cabral\tCuritiba\tCabral\tRua Dr. Manoel Pedro, 310\t(41) 97766-5544\tbosquecabral@gmail.com`}
                  value={textoColadoExcel}
                  onChange={handleTextoExcelChange}
                  className="w-full p-3.5 rounded-2xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-[#2d5a32] bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Pré-visualização em Tempo Real dos Leads Identificados */}
              {leadsParsedExcel.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {leadsParsedExcel.length} {leadsParsedExcel.length === 1 ? 'lead identificado' : 'leads identificados'} para importação:
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Pré-visualização das primeiras linhas
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-48">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px] border-b border-slate-200">
                          <th className="py-2 px-2.5">#</th>
                          <th className="py-2 px-2.5">CNPJ</th>
                          <th className="py-2 px-2.5">Nome</th>
                          <th className="py-2 px-2.5">Cidade</th>
                          <th className="py-2 px-2.5">Bairro</th>
                          <th className="py-2 px-2.5">Rua</th>
                          <th className="py-2 px-2.5">Telefone</th>
                          <th className="py-2 px-2.5">E-mail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leadsParsedExcel.map((l, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 font-mono text-slate-400 font-bold">{i + 1}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-800 whitespace-nowrap">{l.cnpj}</td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-900 whitespace-nowrap">{l.nome}</td>
                            <td className="py-1.5 px-2.5 text-slate-700 whitespace-nowrap">{l.cidade}</td>
                            <td className="py-1.5 px-2.5 text-slate-700 whitespace-nowrap">{l.bairro}</td>
                            <td className="py-1.5 px-2.5 text-slate-600 truncate max-w-[160px]">{l.rua}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-800 whitespace-nowrap">{l.telefone || '-'}</td>
                            <td className="py-1.5 px-2.5 text-blue-700 whitespace-nowrap">{l.email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : textoColadoExcel.trim() ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  Nenhum dado legível identificado. Certifique-se de copiar as células de uma planilha e colar no campo acima.
                </div>
              ) : null}
            </div>

            {/* Rodapé de Ações */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalImportExcel(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={leadsParsedExcel.length === 0}
                onClick={handleConfirmarImportacaoExcel}
                className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xs ${
                  leadsParsedExcel.length > 0
                    ? 'bg-[#2d5a32] hover:bg-[#1f4223] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>
                  Importar {leadsParsedExcel.length > 0 ? `${leadsParsedExcel.length} Leads` : ''} para o Pré-Funil
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
