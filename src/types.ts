export type Complexidade = 'Tranquilo' | 'Moderado' | 'Difícil';

export type Plano = 'Vos Essencial' | 'Vos Pulse' | 'Vos 360' | 'Vos Starter';

export type StatusFunil = 'Cotação' | 'Interessado' | 'Em transição' | 'Cliente Fidelizado' | 'Perdido' | 'Excluído';

export interface RegistroHistoricoCaixa {
  id: string;
  dataHora: string;
  livreCaixa: number;
  fundoObras: number;
  fundoPintura: number;
  fundoReforma: number;
  totalReservas: number;
  saudeScore?: number;
  observacao?: string;
}

export interface TemplateUnidadePadrao {
  unidadeId: number;
  nomeUnidade: string;
  moradores: number;
  fracaoIdeal?: number;
}

export interface TemplateRelatorio {
  despesasPadrao?: string[];
  fundoReservaAliquota?: string;
  fundoReservaValor?: string;
  obrasDescricao?: string;
  obrasPadrao?: string[];
  fundoPinturaValor?: string;
  fundoObrasValor?: string;
  taxaBoletoValor?: string;
  aguaTipoRateio?: string;
  aguaComposicao?: string;
  unidadesPadrao?: TemplateUnidadePadrao[];
}

export interface MoradorCondominio {
  id: string;
  condominioId: string;
  condominioNome?: string;
  bloco: string;
  unidade: string;
  nomeMorador: string;
  email: string;
  whatsapp: string;
  especificidade: 'Morador' | 'Proprietário' | 'Morador e Proprietário' | 'Inquilino';
  vagaGaragem: string;
}

export interface Condominio {
  id: string; // e.g. COND-001
  status: StatusFunil;
  nome: string;
  cnpj: string;
  unidades: number;
  endereco: string;
  cidade?: string;
  bairro?: string;
  rua?: string;
  sindicoResponsavel: string;
  emailCondominio: string;
  numeroCondominio: string; // Telefone
  banco: string;
  agenciaEConta: string;
  senhaBanco?: string;
  moradores?: MoradorCondominio[];
  
  // Precificação / CRM
  complexidade: Complexidade;
  plano: Plano;
  fatorAjuste: number; // e.g. 1.0 (default), 0.9 (10% desconto), 1.1 (10% acréscimo)
  mensalidadeCalculada: number;
  horasEstimadasMes?: number; // Para análise de rentabilidade

  // Saúde Financeira (ERP)
  livreCaixa: number;
  fundoObras: number;
  fundoPintura: number;
  fundoReforma: number;
  gastoMedioMensal: number;
  rendimentoMedioMensal: number;
  saudeScore?: number; // 1 to 10

  // 2.2 Termômetro de Saúde Financeira - Campos Detalhados
  dataUltimaAlteracaoCaixa?: string; // Data e hora da última alteração do caixa
  fraseLivreCaixa?: string;
  fraseFundoObras?: string;
  fraseFundoPintura?: string;
  fraseFundoReforma?: string;
  notaLivreCaixa?: number; // 1 a 5 (legado)
  notaFundoObras?: number; // 1 a 5 (legado)
  notaFundoPintura?: number; // 1 a 5 (legado)
  notaFundoReforma?: number; // 1 a 5 (legado)
  metaLivreCaixaCustom?: number; // Meta Opcional (R$) para Livre Caixa
  metaFundoObrasCustom?: number; // Meta Opcional (R$) para Fundo Obra
  metaFundoPinturaCustom?: number; // Meta Opcional (R$) em aberto para Fundo Pintura
  anotacoes?: string; // Anotações gerais e customizáveis do condomínio
  historicoCaixa?: RegistroHistoricoCaixa[]; // Mantendo os 5 últimos registros para conferência
  templatesRelatorio?: TemplateRelatorio;
}

export interface ServicoExtra {
  id: string;
  nome: string;
  categoria: 'Administrativa' | 'Engenharia' | 'Compras' | 'Assembleia' | 'Laudo';
  valorUnitario: number;
  unidade: 'hora' | 'evento' | 'processo' | 'sob_consulta';
  descricao: string;
}

export interface ServicoPrestado {
  id: string;
  cnpjCliente: string;
  nomeCliente: string;
  servico: string;
  horasTrabalhadas: number;
  valor: number;
  observacao: string;
  data?: string;
}

export interface Inadimplente {
  id: string;
  condominioId: string;
  condominioNome: string;
  unidade: string;
  moradorNome: string;
  valorDevido: number;
  mesesAtraso: number;
  statusCobranca: 'Amigável' | 'Notificação Enviada' | 'Acordo em Andamento' | 'Cobrança Judicial';
  dataUltimoContato: string;
}

export interface TarefaGantt {
  id: string;
  condominioId: string;
  condominioNome: string;
  titulo: string;
  categoria: 'Manutenção' | 'Reforma' | 'Laudo/Vistoria' | 'Financeiro' | 'Outro';
  dataInicio: string;
  dataFim: string;
  progresso: number; // 0 a 100
  status: 'Planejado' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  responsavel: string;
}

export interface TarefaEquipe {
  id: string;
  condominioId: string;
  condominioNome: string;
  titulo: string;
  prioridade: 'Baixa' | 'Média' | 'Alta';
  concluida: boolean;
  dataLimite: string;
  atribuidoPara: string;
}

export interface ServicoFeitoFornecedor {
  id: string;
  data: string;
  condominio: string;
  descricao: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  condominioAtendido: string;
  condominiosAtendidos?: string[];
  segmento: string;
  avaliacaoServico: number; // 1 a 5 estrelas
  avaliacaoCustoBeneficio: number; // 1 a 5 estrelas
  telefone: string;
  email?: string;
  observacoes?: string;
  servicosFeitos?: ServicoFeitoFornecedor[];
}

export interface Porquinho {
  id: string;
  nome: string;
  descricao: string;
  saldoAtual: number;
  metaAnual?: number;
  cor: string;
}

export interface TransacaoPorquinho {
  id: string;
  porquinhoId: string;
  tipo: 'aporte' | 'retirada';
  valor: number;
  descricao: string;
  data: string;
}

export interface TransacaoExtrato {
  id: string;
  data: string; // YYYY-MM-DD
  mesReferencia: string; // e.g. "Julho/2026"
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  condominioId?: string;
  condominioNome: string; // e.g. "Residencial Batel Plaza" or "Geral VOS (Administradora)"
  categoria?: string;
}

export interface ProjecaoItem {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'ganho' | 'despesa';
  categoria: string;
  condominioNome?: string;
  probabilidade?: 'Confirmado' | 'Provável' | 'Estimado';
  horizonteTempo?: string; // e.g. "Próximo Mês", "Próximo Trimestre", "Projeção Anual"
  isImposto?: boolean;
}

// ==========================================
// NOVOS TIPOS: RBAC, Funil B2B, Vistorias, Health Score, Chatbot e Vagas
// ==========================================

export type UserRole = 'vos_adm' | 'sindico' | 'morador';

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  role: UserRole;
  condominioId?: string;
  condominioNome?: string;
  unidade?: string; // Ex: "Bloco A - Apto 302"
  whatsapp?: string; // Formato: 5541999999999
  vagaVinculada?: string; // Ex: "G1-42"
}

// 5 Etapas do Funil Síndico (B2B Condominial)
export type B2BLeadStage =
  | 'lead_indicacao'
  | 'proposta_enviada'
  | 'assembleia_agendada'
  | 'votacao_assembleia'
  | 'implantacao_onboarding';

export interface B2BLead {
  id: string;
  nomeCondominio: string;
  cnpj?: string;
  unidades: number;
  bairroCidade: string;
  sindicoNome: string;
  sindicoWhatsapp: string;
  stage: B2BLeadStage;
  valorProposta?: number;
  plano?: Plano;
  complexidade?: Complexidade;
  dataAssembleia?: string; // YYYY-MM-DD
  followUpConselhoFeito?: boolean;
  observacoes?: string;
}

// Vistoria Técnica de Entrada
export interface ItemVistoria {
  id: string;
  condominioNome?: string;
  area: 'Fachada' | 'Hidráulica/Bombas' | 'Elétrica' | 'Garagem' | 'Elevadores' | 'Áreas Comuns';
  descricaoPassivo: string;
  gravidade: 'Baixo' | 'Médio' | 'Crítico (Risco Civil)';
  fotoUrl?: string;
  acaoRecomendada: string;
  dataRegistro?: string;
}

// Health Score & Customer Success
export interface CondominioHealthMetrics {
  id: string;
  condominioId: string;
  condominioNome: string;
  inadimplenciaPercentual: number; // Capturado uCondo
  chamadosAbertos: number;
  diasRestantesMandato: number;
  npsScore: number; // -100 a 100 ou 0 a 100
}

// Chatbot & Mediação de Ocorrências (API WhatsApp do Síndico: 1- Feedback, 2- Reclamação em 4 Passos, 3- Falar com Síndico)
export interface ChamadoBot {
  id: string;
  condominioId: string;
  tipo?: 'feedback' | 'reclamacao' | 'falar_sindico';
  reclamanteUnidade: string;
  reclamanteNome: string;
  reclamanteWhatsapp?: string;
  blocoDestino?: string;
  numeroDestino?: string;
  unidadeAcusada: string;
  moradorAcusadoNome: string;
  moradorAcusadoWhatsapp: string;
  categoria:
    | 'Barulho/Silêncio'
    | 'Estacionamento'
    | 'Obras fora de horário'
    | 'Animais/Pets'
    | 'Outros'
    | 'Feedback/Sugestão'
    | 'Atendimento Direto c/ Síndico';
  relato: string;
  evidenciaNome?: string;
  evidenciaUrl?: string;
  status: 'notificado_bot' | 'aguardando_sindico' | 'resolvido';
  notificacaoWppEnviada: boolean;
  precisaAtendimentoHumano: boolean;
  criadoEm: string;
}

export interface SindicoBotConfig {
  id: string;
  condominioId: string;
  condominioNome: string;
  whatsappSindicoBot: string;
  nomeAssistente: string;
  apiStatus: 'conectado' | 'desconectado';
  autoDisparoWpp: boolean;
}

// Agenda e Aluguel de Vagas
export interface VagaDisponivel {
  id: string;
  condominioId: string;
  numeroVaga: string;
  proprietarioId: string;
  proprietarioNome: string;
  proprietarioUnidade: string;
  proprietarioWhatsapp: string;
  tipoModalidade: 'Aluguel' | 'Empréstimo Gratuito';
  valorDiaria?: number;
  dataInicio: string;
  dataFim: string;
  status: 'disponivel' | 'proposta_pendente' | 'ocupada';
  propostaAtual?: {
    solicitanteNome: string;
    solicitanteUnidade: string;
    solicitanteWhatsapp: string;
    placaVeiculo: string;
    mensagemProposta: string;
  };
}
