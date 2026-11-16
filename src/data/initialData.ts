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

export const CONDOMINIOS_INICIAIS: Condominio[] = [
  {
    id: 'COND-101',
    nome: 'Residencial Cabral Cruz',
    cnpj: '32.964.833/0001-69',
    status: 'Cliente Fidelizado',
    unidades: 12,
    endereco: 'Rua Onze de Junho, 622, Centro, Pinhais - PR',
    cidade: '',
    bairro: '',
    rua: '',
    sindicoResponsavel: 'Natalia',
    emailCondominio: 'residencialcabralcruz@gmail.com',
    numeroCondominio: '41 99850-8290',
    banco: 'sicredi',
    agenciaEConta: 'cabral',
    senhaBanco: '475369',
    complexidade: 'Tranquilo',
    plano: 'Vos 360',
    fatorAjuste: 1,
    mensalidadeCalculada: 342.9,
    horasEstimadasMes: 0,
    livreCaixa: 8400,
    fundoObras: 0.01,
    fundoPintura: 52897.34,
    fundoReforma: 7711.26,
    gastoMedioMensal: 4200,
    rendimentoMedioMensal: 4300,
    saudeScore: 10,
    dataUltimaAlteracaoCaixa: '26/09/2026, 09:50',
    anotacoes: `DADOS BANCÁRIOS
Banco: Sicredi
Agência e Conta: Cabral
Senha do Banco: 475369

CONTAS FIXAS
Honorários VOS CONDO
Internet NIO
Copel Energia
Taxas Bancárias e Integração de Capital (Sicredi)
Seguro Predial Obrigatório

FUNDOS E TAXAS

Fundo Reserva: 10%
Fundo Pintura: 80
Taxa Mínima Sanepar/Concessionária: 96,73

RATEIO (ÁGUA E FRAÇÃO IDEAL)
Unidade 01 - Água: 2 | Fração: 8,596680
Unidade 02 - Água: 3 | Fração: 8,006996
Unidade 03 - Água: 3 | Fração: 8,069960
Unidade 04 - Água: 3 | Fração: 8,596680
Unidade 05 - Água: 2 | Fração: 8,596680
Unidade 06 - Água: 2 | Fração: 8,069960
Unidade 07 - Água: 2 | Fração: 8,069960
Unidade 08 - Água: 3 | Fração: 8,596680
Unidade 09 - Água: 2 | Fração: 8,596680
Unidade 10 - Água: 2 | Fração: 8,069960
Unidade 11 - Água: 3 | Fração: 8,069960
Unidade 12 - Água: 2 | Fração: 8,596680`,
    historicoCaixa: [
      { id: 'HIST-1790427702289', dataHora: '26/09/2026, 09:50', livreCaixa: 8400, fundoObras: 0.01, fundoPintura: 52897.34, fundoReforma: 7711.26, totalReservas: 69008.61, saudeScore: 10, observacao: 'Salvo via formulário' },
      { id: 'HIST-1788306894108', dataHora: '01/09/2026, 20:47', livreCaixa: 8400, fundoObras: 0.01, fundoPintura: 52897.34, fundoReforma: 7711.26, totalReservas: 69008.61, saudeScore: 10, observacao: 'Salvo via formulário' },
      { id: 'HIST-1788306064171', dataHora: '01/09/2026, 20:40', livreCaixa: 8400, fundoObras: 0.01, fundoPintura: 52897.34, fundoReforma: 7711.26, totalReservas: 69008.61, saudeScore: 10, observacao: 'Salvo via formulário' },
      { id: 'HIST-1788305687711', dataHora: '01/09/2026, 20:31', livreCaixa: 8400, fundoObras: 0.01, fundoPintura: 52897.34, fundoReforma: 7711.26, totalReservas: 69008.61, saudeScore: 10, observacao: 'Salvo via formulário' },
      { id: 'HIST-1788304828800', dataHora: '01/09/2026, 20:20', livreCaixa: 8400, fundoObras: 0.01, fundoPintura: 52897.34, fundoReforma: 7711.26, totalReservas: 69008.61, saudeScore: 10, observacao: 'Salvo via formulário' }
    ],
    templatesRelatorio: {
      despesasPadrao: [
        'Honorarios VOS CONDO',
        'Internet NIO',
        'Copel Energia',
        'Taxas Bancárias e Integração de Capital - sicredi',
        'Seguro Predial Obrigatorio',
        'Serviço Diarista - dias: '
      ],
      obrasPadrao: [],
      fundoReservaAliquota: '10',
      fundoPinturaValor: '80',
      fundoObrasValor: '0',
      taxaBoletoValor: '2',
      aguaTipoRateio: 'moradores',
      aguaComposicao: '',
      unidadesPadrao: [
        { unidadeId: 1, nomeUnidade: 'Unidade 1', fracaoIdeal: 8.59668, moradores: 2 },
        { unidadeId: 2, nomeUnidade: 'Unidade 2', fracaoIdeal: 8.006996, moradores: 3 },
        { unidadeId: 3, nomeUnidade: 'Unidade 3', fracaoIdeal: 8.06996, moradores: 3 },
        { unidadeId: 4, nomeUnidade: 'Unidade 4', fracaoIdeal: 8.59668, moradores: 3 },
        { unidadeId: 5, nomeUnidade: 'Unidade 5', fracaoIdeal: 8.59668, moradores: 2 },
        { unidadeId: 6, nomeUnidade: 'Unidade 6', fracaoIdeal: 8.06996, moradores: 2 },
        { unidadeId: 7, nomeUnidade: 'Unidade 7', fracaoIdeal: 8.06996, moradores: 2 },
        { unidadeId: 8, nomeUnidade: 'Unidade 8', fracaoIdeal: 8.59668, moradores: 3 },
        { unidadeId: 9, nomeUnidade: 'Unidade 9', fracaoIdeal: 8.59668, moradores: 2 },
        { unidadeId: 10, nomeUnidade: 'Unidade 10', fracaoIdeal: 8.06996, moradores: 2 },
        { unidadeId: 11, nomeUnidade: 'Unidade 11', fracaoIdeal: 8.06996, moradores: 3 },
        { unidadeId: 12, nomeUnidade: 'Unidade 12', fracaoIdeal: 8.59668, moradores: 2 }
      ]
    }
  },
  {
    id: 'COND-100',
    nome: 'VOS CONDO',
    cnpj: '00.000.000/0001-00',
    status: 'Cliente Fidelizado',
    unidades: 1,
    endereco: 'Curitiba - PR',
    cidade: '',
    bairro: '',
    rua: '',
    sindicoResponsavel: 'A definir',
    emailCondominio: 'contato@condominio.com',
    numeroCondominio: '(41) 90000-0000',
    banco: 'A definir',
    agenciaEConta: 'A definir',
    senhaBanco: '',
    complexidade: 'Tranquilo',
    plano: 'Vos Starter',
    fatorAjuste: 1,
    mensalidadeCalculada: 129.9,
    horasEstimadasMes: 0,
    livreCaixa: 10,
    fundoObras: 10,
    fundoPintura: 10,
    fundoReforma: 10,
    gastoMedioMensal: 1,
    rendimentoMedioMensal: 1,
    saudeScore: 10,
    dataUltimaAlteracaoCaixa: '09/09/2026, 21:39',
    anotacoes: '',
    historicoCaixa: [
      { id: 'HIST-1789000751017', dataHora: '09/09/2026, 21:39', livreCaixa: 10, fundoObras: 10, fundoPintura: 10, fundoReforma: 10, totalReservas: 40, saudeScore: 10, observacao: 'Salvo via formulário' },
      { id: 'HIST-1789000705194-674', dataHora: '09/09/2026, 21:38', livreCaixa: 10, fundoObras: 10, fundoPintura: 10, fundoReforma: 1, totalReservas: 31, saudeScore: 10, observacao: 'Atualização com timestamp de agora' },
      { id: 'HIST-1789000679755-458', dataHora: '09/09/2026, 21:37', livreCaixa: 5000, fundoObras: 5000, fundoPintura: 0, fundoReforma: 0, totalReservas: 10000, saudeScore: 10, observacao: 'Atualização com timestamp de agora' }
    ]
  }
];

export const INADIMPLENTES_INICIAIS: Inadimplente[] = [];
export const TAREFAS_GANTT_INICIAIS: TarefaGantt[] = [];
export const TAREFAS_EQUIPE_INICIAIS: TarefaEquipe[] = [];

export const FORNECEDORES_INICIAIS: Fornecedor[] = [
  {
    id: 'FORN-51',
    nome: 'Mariane - Gerente PJ Sicred',
    cnpj: '00.000.000/0001-00',
    condominioAtendido: 'Residencial Cabral Cruz',
    condominiosAtendidos: ['Residencial Cabral Cruz'],
    segmento: 'Banco',
    avaliacaoServico: 5,
    avaliacaoCustoBeneficio: 5,
    telefone: '41 9929-0005',
    email: '',
    observacoes: '',
    servicosFeitos: []
  }
];

export const PORQUINHOS_INICIAIS: Porquinho[] = [];

export const TRANSACOES_EXTRATO_INICIAIS: TransacaoExtrato[] = [
  {
    id: 'EXT-776',
    data: '2026-09-13',
    mesReferencia: 'Setembro/2026',
    descricao: 'pagamento honorario',
    valor: 342.9,
    tipo: 'entrada',
    condominioId: '',
    condominioNome: 'Residencial Cabral Cruz',
    categoria: 'Honorários de Gestão'
  },
  {
    id: 'EXT-258',
    data: '2026-09-13',
    mesReferencia: 'Setembro/2026',
    descricao: 'ucondo',
    valor: 299.9,
    tipo: 'saida',
    condominioId: '',
    condominioNome: 'Geral VOS (Administradora)',
    categoria: 'Sistemas & TI'
  },
  {
    id: 'EXT-991',
    data: '2026-09-13',
    mesReferencia: 'Setembro/2026',
    descricao: 'mei',
    valor: 86.05,
    tipo: 'saida',
    condominioId: '',
    condominioNome: 'Geral VOS (Administradora)',
    categoria: 'Impostos'
  },
  {
    id: 'EXT-647',
    data: '2026-09-13',
    mesReferencia: 'Setembro/2026',
    descricao: 'google',
    valor: 40.65,
    tipo: 'saida',
    condominioId: '',
    condominioNome: 'Geral VOS (Administradora)',
    categoria: 'Sistemas & TI'
  },
  {
    id: 'EXT-952',
    data: '2026-09-13',
    mesReferencia: 'Setembro/2026',
    descricao: 'credito celular',
    valor: 30,
    tipo: 'saida',
    condominioId: '',
    condominioNome: 'Geral VOS (Administradora)',
    categoria: 'Despesas Operacionais'
  },
  {
    id: 'EXT-545',
    data: '2026-10-14',
    mesReferencia: 'Setembro/2026',
    descricao: 'honorarios vos',
    valor: 342.9,
    tipo: 'entrada',
    condominioId: '',
    condominioNome: 'Residencial Cabral Cruz',
    categoria: 'Honorários de Gestão'
  },
  {
    id: 'EXT-395',
    data: '2026-10-14',
    mesReferencia: 'Setembro/2026',
    descricao: 'credito celular',
    valor: 30,
    tipo: 'saida',
    condominioId: '',
    condominioNome: 'VOS CONDO',
    categoria: 'Despesas Operacionais'
  },
  {
    id: 'EXT-254',
    data: '2026-10-14',
    mesReferencia: 'Setembro/2026',
    descricao: 'workpace',
    valor: 39.2,
    tipo: 'saida',
    condominioId: '',
    condominioNome: 'Geral VOS (Administradora)',
    categoria: 'Sistemas & TI'
  },
  {
    id: 'EXT-567',
    data: '2026-10-14',
    mesReferencia: 'Setembro/2026',
    descricao: 'das/ mei',
    valor: 86.05,
    tipo: 'saida',
    condominioId: '',
    condominioNome: 'Geral VOS (Administradora)',
    categoria: 'Impostos'
  }
];

export const PROJECAO_ITEMS_INICIAIS: ProjecaoItem[] = [];

export const RELATORIOS_ORCAMENTO_INICIAIS: any[] = [
  {
    id: 'ORC-1790815365618-293',
    titulo: 'Residencial Cabral Cruz - setembro/ 2026 (R$ 4.502,01)',
    dataSalvamento: '30/09/2026 às 21:42',
    timestamp: 1790815365618,
    condominioId: 'COND-101',
    nomeCondominio: 'Residencial Cabral Cruz',
    mesReferencia: 'Agosto / 2026',
    numeroUnidades: 12,
    vencimentoBoleto: '10/08/2026',
    totalGeral: 4502.0070000000005,
    totalOrdinarias: 1948.27,
    totalFundoReserva: 194.82700000000003,
    totalExtraordinarias: 0,
    totalFundoPintura: 960,
    totalFundoObras: 0,
    totalAgua: 1374.9099999999999,
    observacoes: '',
    despesasOrdinarias: [
      { id: 'muori5macqf5u6lmnkv0', descricao: 'Honorarios VOS CONDO ', vencimentoReferencia: '10/09', valor: 342.9 },
      { id: 'muori5mao76wwbe9jwq1', descricao: 'Internet NIO ', vencimentoReferencia: '10/09', valor: 135.4 },
      { id: 'muori5ma3drvstgo0522', descricao: 'Copel Energia ', vencimentoReferencia: '10/09', valor: 145.07 },
      { id: 'muori5manvwdgq368pk3', descricao: 'Taxas Bancárias e Integração de Capital - sicredi', vencimentoReferencia: '', valor: 20.61 },
      { id: 'muori5mak2zec4lsrem4', descricao: 'Seguro Predial Obrigatorio ', vencimentoReferencia: '10/09', valor: 147 },
      { id: 'muori5ma9mlzy0oi8k5', descricao: 'Serviço Diarista - dias: 02 /09 / 16 /23 /30 - setembro', vencimentoReferencia: '', valor: 650 },
      { id: '1790813446610', descricao: 'Limpeza grama', vencimentoReferencia: '26/09', valor: 150 },
      { id: '1790813447090', descricao: 'Capacho grafite 12mm X 12m ', vencimentoReferencia: '22/09', valor: 102 },
      { id: '1790813447594', descricao: 'Materias de limpeza', vencimentoReferencia: '08/09', valor: 155.29 },
      { id: '1790813448561', descricao: 'concerto controle de acesso', vencimentoReferencia: '08/09', valor: 100 }
    ],
    despesasExtraordinarias: [
      { id: 'muori5mahponpmu2pk7', descricao: 'Rateio Obras', percentualRateio: 100, valor: 0 }
    ],
    unidadesConfig: [
      { unidadeId: 1, nomeUnidade: 'Unidade 1', moradores: 2, fracaoIdeal: 8.59668 },
      { unidadeId: 2, nomeUnidade: 'Unidade 2', moradores: 3, fracaoIdeal: 8.006996 },
      { unidadeId: 3, nomeUnidade: 'Unidade 3', moradores: 3, fracaoIdeal: 8.06996 },
      { unidadeId: 4, nomeUnidade: 'Unidade 4', moradores: 3, fracaoIdeal: 8.59668 },
      { unidadeId: 5, nomeUnidade: 'Unidade 5', moradores: 2, fracaoIdeal: 8.59668 },
      { unidadeId: 6, nomeUnidade: 'Unidade 6', moradores: 2, fracaoIdeal: 8.06996 },
      { unidadeId: 7, nomeUnidade: 'Unidade 7', moradores: 2, fracaoIdeal: 8.06996 },
      { unidadeId: 8, nomeUnidade: 'Unidade 8', moradores: 3, fracaoIdeal: 8.59668 },
      { unidadeId: 9, nomeUnidade: 'Unidade 9', moradores: 2, fracaoIdeal: 8.59668 },
      { unidadeId: 10, nomeUnidade: 'Unidade 10', moradores: 2, fracaoIdeal: 8.06996 },
      { unidadeId: 11, nomeUnidade: 'Unidade 11', moradores: 3, fracaoIdeal: 8.06996 },
      { unidadeId: 12, nomeUnidade: 'Unidade 12', moradores: 2, fracaoIdeal: 8.59668 }
    ],
    taxaMinimaAgua: 917.28,
    excedenteAguaTotal: 457.63,
    escopoRateioAgua: 'total_com_taxa_minima',
    excedentesExtras: [],
    tipoCotaBasica: 'fracao_ideal',
    tipoRateioFundoReserva: 'fracao_ideal',
    tipoDespesaExtra: 'fracao_ideal',
    tipoFundoPintura: 'valor_fixo_unidade',
    tipoFundoObras: 'valor_fixo_unidade',
    tipoRateioAgua: 'moradores',
    tipoRateioTaxaMinAgua: 'divisao_igual',
    tipoRateioExcedente: 'moradores',
    fundoReservaValor: 10,
    fundoPinturaPorUnidade: 80,
    fundoObrasPorUnidade: 0,
    taxaBoletoValor: 2,
    descricaoFundoObras: 'Fundo Permanente de Obras e Manutenção Estrutural Geral',
    composicaoAgua: 'Sanepar/Concessionária'
  },
  {
    id: 'ORC-1788309259845-26',
    titulo: 'Residencial Cabral Cruz - Agosto / 2026 (R$ 4.395,62)',
    dataSalvamento: '01/09/2026 às 21:34',
    timestamp: 1788309259845,
    condominioId: 'COND-101',
    nomeCondominio: 'Residencial Cabral Cruz',
    mesReferencia: 'Agosto / 2026',
    numeroUnidades: 12,
    vencimentoBoleto: '10/08/2026',
    totalGeral: 4395.619,
    totalOrdinarias: 1297.09,
    totalFundoReserva: 129.70899999999997,
    totalExtraordinarias: 551.3,
    totalFundoPintura: 960,
    totalFundoObras: 0,
    totalAgua: 1433.52,
    observacoes: '',
    despesasOrdinarias: [
      { id: 'mtjbrbj03oc5im3n8pm0', descricao: 'Honorarios VOS CONDO', vencimentoReferencia: '10/08', valor: 342.9 },
      { id: 'mtjbrbj09ma2p9qoduq1', descricao: 'Internet NIO', vencimentoReferencia: '17/08', valor: 131.41 },
      { id: 'mtjbrbj0jgw8yyl8f5k2', descricao: 'Copel Energia', vencimentoReferencia: '17/08', valor: 155.17 },
      { id: 'mtjbrbj0wxl9atmx5z3', descricao: 'Taxas Bancárias e Integração de Capital - sicredi', vencimentoReferencia: '', valor: 40.61 },
      { id: 'mtjbrbj04sa69bf74bo4', descricao: 'Seguro Predial Obrigatorio 08/12', vencimentoReferencia: '10/08', valor: 147 },
      { id: '1788308851960', descricao: 'Serviço Diarista - dias: 05/ 12/ 19/ 26 - Agosto', vencimentoReferencia: '', valor: 480 }
    ],
    despesasExtraordinarias: [
      { id: 'mtjbrbj09kbmrfxrhg', descricao: 'obra/ reforma - Parcela: 10/10 troca policarbonato portão pedestre', percentualRateio: 100, valor: 129.5 },
      { id: '1788307104163', descricao: 'conserto interfone 06/08', percentualRateio: 100, valor: 180 },
      { id: '1788307105674', descricao: 'instalação sensor portão 24/08', percentualRateio: 100, valor: 241.8 }
    ],
    unidadesConfig: [
      { unidadeId: 1, nomeUnidade: 'Unidade 1', moradores: 2, fracaoIdeal: 8.59668 },
      { unidadeId: 2, nomeUnidade: 'Unidade 2', moradores: 3, fracaoIdeal: 8.006996 },
      { unidadeId: 3, nomeUnidade: 'Unidade 3', moradores: 3, fracaoIdeal: 8.06996 },
      { unidadeId: 4, nomeUnidade: 'Unidade 4', moradores: 3, fracaoIdeal: 8.59668 },
      { unidadeId: 5, nomeUnidade: 'Unidade 5', moradores: 2, fracaoIdeal: 8.59668 },
      { unidadeId: 6, nomeUnidade: 'Unidade 6', moradores: 2, fracaoIdeal: 8.06996 },
      { unidadeId: 7, nomeUnidade: 'Unidade 7', moradores: 2, fracaoIdeal: 8.06996 },
      { unidadeId: 8, nomeUnidade: 'Unidade 8', moradores: 3, fracaoIdeal: 8.59668 },
      { unidadeId: 9, nomeUnidade: 'Unidade 9', moradores: 2, fracaoIdeal: 8.59668 },
      { unidadeId: 10, nomeUnidade: 'Unidade 10', moradores: 2, fracaoIdeal: 8.06996 },
      { unidadeId: 11, nomeUnidade: 'Unidade 11', moradores: 3, fracaoIdeal: 8.06996 },
      { unidadeId: 12, nomeUnidade: 'Unidade 12', moradores: 2, fracaoIdeal: 8.59668 }
    ],
    taxaMinimaAgua: 1160.81,
    excedenteAguaTotal: 229.81,
    escopoRateioAgua: 'total_com_taxa_minima',
    excedentesExtras: [
      { id: '1788307060193', nome: 'Excedente mes anterior (cobrança errada)', valor: 42.9 }
    ],
    tipoCotaBasica: 'fracao_ideal',
    tipoRateioFundoReserva: 'fracao_ideal',
    tipoDespesaExtra: 'fracao_ideal',
    tipoFundoPintura: 'divisao_igual',
    tipoFundoObras: 'fracao_ideal',
    tipoRateioAgua: 'moradores',
    tipoRateioTaxaMinAgua: 'divisao_igual',
    tipoRateioExcedente: 'moradores',
    fundoReservaValor: 10,
    fundoPinturaPorUnidade: 80,
    fundoObrasPorUnidade: 0,
    taxaBoletoValor: 2,
    descricaoFundoObras: 'Fundo Permanente de Obras e Manutenção Estrutural Geral',
    composicaoAgua: 'Sanepar/Concessionária'
  }
];
