import { Condominio, ServicoExtra, ServicoPrestado, Fornecedor, Porquinho, Inadimplente, TarefaGantt, TarefaEquipe, TransacaoExtrato, ProjecaoItem } from '../types';

export const SERVICOS_EXTRAS_INICIAIS: ServicoExtra[] = [
  {
    id: 'SE-01',
    nome: 'Hora Técnica Adm / Financeira',
    categoria: 'Administrativa',
    valorUnitario: 80.00,
    unidade: 'hora',
    descricao: 'Consultoria financeira adicional, emissão de certidões especiais e reuniões extraordinárias.'
  },
  {
    id: 'SE-02',
    nome: 'Hora Técnica Engenharia / Visitas',
    categoria: 'Engenharia',
    valorUnitario: 170.00,
    unidade: 'hora',
    descricao: 'Acompanhamento e diagnóstico técnico presencial por engenheiro para obras e vistorias.'
  },
  {
    id: 'SE-03',
    nome: 'Suporte de Cotação e Compras',
    categoria: 'Compras',
    valorUnitario: 100.00,
    unidade: 'processo',
    descricao: 'Processo completo de cotação e intermediação de aquisições com fornecedores homologados.'
  },
  {
    id: 'SE-04',
    nome: 'Assembleia Extraordinária',
    categoria: 'Assembleia',
    valorUnitario: 150.00,
    unidade: 'evento',
    descricao: 'Organização, convocação, condução e registro de atas para assembleias adicionais.'
  },
  {
    id: 'SE-05',
    nome: 'Emissão de TRT / ART (Obras < 80m²)',
    categoria: 'Laudo',
    valorUnitario: 0,
    unidade: 'sob_consulta',
    descricao: 'Emissão de responsabilidade técnica de engenharia sob orçamento autônomo prévio.'
  }
];

export const SERVICOS_PRESTADOS_INICIAIS: ServicoPrestado[] = [];
export const CONDOMINIOS_INICIAIS: Condominio[] = [];
export const INADIMPLENTES_INICIAIS: Inadimplente[] = [];
export const TAREFAS_GANTT_INICIAIS: TarefaGantt[] = [];
export const TAREFAS_EQUIPE_INICIAIS: TarefaEquipe[] = [];
export const FORNECEDORES_INICIAIS: Fornecedor[] = [];
export const PORQUINHOS_INICIAIS: Porquinho[] = [];
export const TRANSACOES_EXTRATO_INICIAIS: TransacaoExtrato[] = [];
export const PROJECAO_ITEMS_INICIAIS: ProjecaoItem[] = [];
