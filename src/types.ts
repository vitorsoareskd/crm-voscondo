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

export interface Condominio {
  id: string; // e.g. COND-001
  status: StatusFunil;
  nome: string;
  cnpj: string;
  unidades: number;
  endereco: string;
  sindicoResponsavel: string;
  emailCondominio: string;
  numeroCondominio: string; // Telefone
  banco: string;
  agenciaEConta: string;
  senhaBanco?: string;
  
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

