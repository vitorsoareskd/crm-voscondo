import React, { useState, useEffect, useMemo } from 'react';
import { Condominio, CondominioHealthMetrics } from '../../types';
import { subscribeToCollection, saveCollectionToFirestore } from '../../lib/firebase';
import {
  AlertOctagon,
  PlusCircle,
  Trash2,
  Percent,
  Clock,
  Award,
  ThumbsUp,
  Building2,
  CheckCircle2,
  Search,
  Sparkles,
  Mail,
  Link2,
  ExternalLink,
  Copy,
  Check,
  Shuffle,
  Sliders,
  ListChecks,
  Plus
} from 'lucide-react';

export type CSModuleMode = 'inadimplencia' | 'sla' | 'mandato' | 'nps';

interface HealthScoreSectionProps {
  mode?: CSModuleMode;
  condominios?: Condominio[];
}

export interface PerguntaPulseItem {
  id: string;
  segmentoId: number;
  segmentoTitulo: string;
  texto: string;
  selecionada: boolean;
}

const CONDOS_FICTICIOS_REMOVER = [
  'Residencial Jardim Botânico',
  'Condomínio Solar das Araucárias'
];

const CARTEIRA_HEALTH_INICIAL: CondominioHealthMetrics[] = [];

// Banco Oficial de Perguntas PULSE VOS (Extraído integralmente do documento anexo)
const BANCO_PERGUNTAS_PULSE_INICIAL: PerguntaPulseItem[] = [
  // Segmento 1: Gestão e Transparência (Administrativo)
  {
    id: 'p-101',
    segmentoId: 1,
    segmentoTitulo: 'Segmento 1: Gestão e Transparência (Administrativo)',
    texto: 'Clareza nas informações prestadas pela administração.',
    selecionada: true
  },
  {
    id: 'p-102',
    segmentoId: 1,
    segmentoTitulo: 'Segmento 1: Gestão e Transparência (Administrativo)',
    texto: 'Facilidade de utilização da aplicação de gestão (uCondo).',
    selecionada: true
  },
  {
    id: 'p-103',
    segmentoId: 1,
    segmentoTitulo: 'Segmento 1: Gestão e Transparência (Administrativo)',
    texto: 'Confiança na prestação de contas mensal apresentada.',
    selecionada: false
  },
  {
    id: 'p-104',
    segmentoId: 1,
    segmentoTitulo: 'Segmento 1: Gestão e Transparência (Administrativo)',
    texto: 'Rapidez no atendimento de dúvidas ou solicitações administrativas.',
    selecionada: false
  },
  {
    id: 'p-105',
    segmentoId: 1,
    segmentoTitulo: 'Segmento 1: Gestão e Transparência (Administrativo)',
    texto: 'Perceção de economia ou redução de desperdícios no condomínio.',
    selecionada: false
  },

  // Segmento 2: Manutenção e Infraestrutura (Técnico)
  {
    id: 'p-201',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Estado de conservação da pintura das áreas comuns.',
    selecionada: true
  },
  {
    id: 'p-202',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Funcionamento e eficiência da iluminação nos corredores e garagens.',
    selecionada: true
  },
  {
    id: 'p-203',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Conservação e rapidez de resposta dos portões e sistemas de acesso.',
    selecionada: false
  },
  {
    id: 'p-204',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Nível de cuidado e manutenção do jardim ou áreas externas.',
    selecionada: false
  },
  {
    id: 'p-205',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Rapidez na correção de problemas hidráulicos ou elétricos comuns.',
    selecionada: false
  },
  {
    id: 'p-206',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Presença de odores desagradáveis em áreas de resíduos ou esgotos.',
    selecionada: false
  },
  {
    id: 'p-207',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Estado de conservação do telhado e das caleiras (perceção de infiltrações).',
    selecionada: false
  },
  {
    id: 'p-208',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Limpeza das cisternas e perceção da qualidade da água.',
    selecionada: false
  },
  {
    id: 'p-209',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Conservação do pavimento ou piso da garagem.',
    selecionada: false
  },
  {
    id: 'p-210',
    segmentoId: 2,
    segmentoTitulo: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
    texto: 'Funcionamento dos equipamentos de segurança (interfones, câmaras).',
    selecionada: false
  },

  // Segmento 3: Convivência e Bem-estar (Social)
  {
    id: 'p-301',
    segmentoId: 3,
    segmentoTitulo: 'Segmento 3: Convivência e Bem-estar (Social)',
    texto: 'Respeito pelas normas de ruído após o horário estabelecido.',
    selecionada: true
  },
  {
    id: 'p-302',
    segmentoId: 3,
    segmentoTitulo: 'Segmento 3: Convivência e Bem-estar (Social)',
    texto: 'Comportamento e cordialidade dos funcionários do edifício.',
    selecionada: false
  },
  {
    id: 'p-303',
    segmentoId: 3,
    segmentoTitulo: 'Segmento 3: Convivência e Bem-estar (Social)',
    texto: 'Organização e limpeza das áreas de lazer após a utilização por terceiros.',
    selecionada: false
  },
  {
    id: 'p-304',
    segmentoId: 3,
    segmentoTitulo: 'Segmento 3: Convivência e Bem-estar (Social)',
    texto: 'Nível de ruído causado por obras ou reformas de vizinhos.',
    selecionada: false
  },
  {
    id: 'p-305',
    segmentoId: 3,
    segmentoTitulo: 'Segmento 3: Convivência e Bem-estar (Social)',
    texto: 'Respeito pela utilização correta das vagas de garagem.',
    selecionada: false
  },
  {
    id: 'p-306',
    segmentoId: 3,
    segmentoTitulo: 'Segmento 3: Convivência e Bem-estar (Social)',
    texto: 'Cuidado dos moradores com animais de estimação nas áreas comuns.',
    selecionada: false
  },
  {
    id: 'p-307',
    segmentoId: 3,
    segmentoTitulo: 'Segmento 3: Convivência e Bem-estar (Social)',
    texto: 'Sensação de acolhimento e conforto ao entrar no condomínio.',
    selecionada: false
  },

  // Segmento 4: Segurança e Sustentabilidade
  {
    id: 'p-401',
    segmentoId: 4,
    segmentoTitulo: 'Segmento 4: Segurança e Sustentabilidade',
    texto: 'Sensação de segurança ao aceder ao edifício em horários tardios.',
    selecionada: true
  },
  {
    id: 'p-402',
    segmentoId: 4,
    segmentoTitulo: 'Segmento 4: Segurança e Sustentabilidade',
    texto: 'Eficácia do controle de entrada de visitantes e estafetas.',
    selecionada: false
  },
  {
    id: 'p-403',
    segmentoId: 4,
    segmentoTitulo: 'Segmento 4: Segurança e Sustentabilidade',
    texto: 'Consciencialização dos vizinhos sobre a recolha seletiva de resíduos.',
    selecionada: false
  },
  {
    id: 'p-404',
    segmentoId: 4,
    segmentoTitulo: 'Segmento 4: Segurança e Sustentabilidade',
    texto: 'Perceção de economia de energia (sensores de presença, lâmpadas LED).',
    selecionada: false
  },
  {
    id: 'p-405',
    segmentoId: 4,
    segmentoTitulo: 'Segmento 4: Segurança e Sustentabilidade',
    texto: 'Organização e segurança na entrega de correspondências e encomendas.',
    selecionada: false
  },

  // Segmento 5: Satisfação Geral e Lealdade
  {
    id: 'p-501',
    segmentoId: 5,
    segmentoTitulo: 'Segmento 5: Satisfação Geral e Lealdade',
    texto: 'Probabilidade de recomendar o condomínio a um amigo para morar.',
    selecionada: true
  },
  {
    id: 'p-502',
    segmentoId: 5,
    segmentoTitulo: 'Segmento 5: Satisfação Geral e Lealdade',
    texto: 'Orgulho em residir neste empreendimento.',
    selecionada: false
  },
  {
    id: 'p-503',
    segmentoId: 5,
    segmentoTitulo: 'Segmento 5: Satisfação Geral e Lealdade',
    texto: 'Agilidade do administrador do condomínio na resolução de emergências.',
    selecionada: false
  },
  {
    id: 'p-504',
    segmentoId: 5,
    segmentoTitulo: 'Segmento 5: Satisfação Geral e Lealdade',
    texto: 'Nível de estresse ao tratar de assuntos relacionados com o edifício.',
    selecionada: false
  },
  {
    id: 'p-505',
    segmentoId: 5,
    segmentoTitulo: 'Segmento 5: Satisfação Geral e Lealdade',
    texto: 'Qualidade e clareza da comunicação visual (placas, avisos no ecrã).',
    selecionada: false
  },
  {
    id: 'p-506',
    segmentoId: 5,
    segmentoTitulo: 'Segmento 5: Satisfação Geral e Lealdade',
    texto: 'Perceção de valorização do seu imóvel no mercado atual.',
    selecionada: false
  },
  {
    id: 'p-507',
    segmentoId: 5,
    segmentoTitulo: 'Segmento 5: Satisfação Geral e Lealdade',
    texto: 'Grau de inovação tecnológica aplicada na gestão do condomínio.',
    selecionada: false
  },
  {
    id: 'p-508',
    segmentoId: 5,
    segmentoTitulo: 'Segmento 5: Satisfação Geral e Lealdade',
    texto: 'Avaliação geral da experiência de residir aqui neste mês.',
    selecionada: false
  },

  // Segmento 6: Perguntas "Pedágio" (Validação de Atenção)
  {
    id: 'p-601',
    segmentoId: 6,
    segmentoTitulo: 'Segmento 6: Perguntas "Pedágio" (Validação de Atenção)',
    texto: 'Para validar este relatório técnico, selecione a opção "Nota 2".',
    selecionada: true
  },
  {
    id: 'p-602',
    segmentoId: 6,
    segmentoTitulo: 'Segmento 6: Perguntas "Pedágio" (Validação de Atenção)',
    texto: 'Como prova de atenção à leitura, marque agora a opção "Nota 4".',
    selecionada: false
  },
  {
    id: 'p-603',
    segmentoId: 6,
    segmentoTitulo: 'Segmento 6: Perguntas "Pedágio" (Validação de Atenção)',
    texto: 'Esta é uma pergunta de controle: por favor, escolha "Discordo Totalmente".',
    selecionada: false
  },
  {
    id: 'p-604',
    segmentoId: 6,
    segmentoTitulo: 'Segmento 6: Perguntas "Pedágio" (Validação de Atenção)',
    texto: 'Para garantir a precisão dos dados, selecione a opção central (Nota 3).',
    selecionada: false
  },
  {
    id: 'p-605',
    segmentoId: 6,
    segmentoTitulo: 'Segmento 6: Perguntas "Pedágio" (Validação de Atenção)',
    texto: 'Por gentileza, ignore o enunciado e marque apenas a última opção (Nota 5).',
    selecionada: false
  },

  // Segmento 7: Fatos Espelho (Verificação de Realidade)
  {
    id: 'p-701',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'Visualizou o último comunicado sobre manutenção no mural esta semana? (Sim/Não)',
    selecionada: true
  },
  {
    id: 'p-702',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'A iluminação do seu patamar ou bloco estava operacional ontem à noite? (Sim/Não)',
    selecionada: true
  },
  {
    id: 'p-703',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'Recebeu o documento de pagamento deste mês via e-mail ou aplicação? (E-mail / App / Impresso)',
    selecionada: false
  },
  {
    id: 'p-704',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'Notou alguma intervenção ou reparação visível no edifício nos últimos 15 dias? (Sim/Não)',
    selecionada: false
  },
  {
    id: 'p-705',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'Utilizou o sistema de reserva de áreas comuns durante este mês? (Sim/Não)',
    selecionada: false
  },
  {
    id: 'p-706',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'A cor do novo aviso fixado no elevador é: (Verde / Azul / Vermelho / Não vi)',
    selecionada: false
  },
  {
    id: 'p-707',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'Participou na última consulta ou assembleia digital realizada? (Sim/Não)',
    selecionada: false
  },
  {
    id: 'p-708',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'O jardim foi alvo de intervenção (poda/limpeza) recentemente? (Sim/Não)',
    selecionada: false
  },
  {
    id: 'p-709',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'Percebeu a presença de algum técnico de manutenção no edifício esta semana? (Sim/Não)',
    selecionada: false
  },
  {
    id: 'p-710',
    segmentoId: 7,
    segmentoTitulo: 'Segmento 7: Fatos Espelho (Verificação de Realidade)',
    texto: 'O sistema de intercomunicação da sua fração foi utilizado nos últimos dias? (Sim/Não)',
    selecionada: false
  }
];

export const calcularHealthScore = (m: CondominioHealthMetrics): number => {
  const notaInadimplencia = Math.max(0, 100 - m.inadimplenciaPercentual * 4);
  const notaChamados = Math.max(0, 100 - m.chamadosAbertos * 4);
  const notaMandato = m.diasRestantesMandato < 60 ? 40 : 100;
  const score =
    notaInadimplencia * 0.3 +
    notaChamados * 0.3 +
    m.npsScore * 0.25 +
    notaMandato * 0.15;
  return Math.round(score);
};

export const HealthScoreSection: React.FC<HealthScoreSectionProps> = ({
  mode = 'inadimplencia',
  condominios = []
}) => {
  const [carteira, setCarteira] = useState<CondominioHealthMetrics[]>(() => {
    try {
      const saved = localStorage.getItem('vos_health_score');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => !CONDOS_FICTICIOS_REMOVER.includes(c.condominioNome));
        }
      }
      return CARTEIRA_HEALTH_INICIAL;
    } catch {
      return CARTEIRA_HEALTH_INICIAL;
    }
  });

  const [busca, setBusca] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [valorInput, setValorInput] = useState<string>(
    mode === 'inadimplencia'
      ? '4.5'
      : mode === 'sla'
      ? '2'
      : mode === 'mandato'
      ? '180'
      : '85'
  );

  // =========================================================================
  // ESTADOS DO MÓDULO PULSE VOS (BANCO DE PERGUNTAS, GOOGLE FORMS & DISPARO)
  // =========================================================================
  const [abaPulse, setAbaPulse] = useState<'montador_pulse' | 'notas_pulse'>('montador_pulse');

  const [perguntasPulse, setPerguntasPulse] = useState<PerguntaPulseItem[]>(() => {
    try {
      const saved = localStorage.getItem('vos_pulse_perguntas_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return BANCO_PERGUNTAS_PULSE_INICIAL;
    } catch {
      return BANCO_PERGUNTAS_PULSE_INICIAL;
    }
  });

  // Configuração da Estrutura Mensal (Editável pelo usuário)
  const [qtdDesempenho, setQtdDesempenho] = useState<number>(7);
  const [qtdPedagio, setQtdPedagio] = useState<number>(1);
  const [qtdFatoEspelho, setQtdFatoEspelho] = useState<number>(2);
  const [incluirCaixaTexto, setIncluirCaixaTexto] = useState<boolean>(true);
  const [textoPerguntaAberta, setTextoPerguntaAberta] = useState<string>(
    'Deixe aqui suas sugestões, críticas construtivas ou elogios para a gestão deste mês (Opcional):'
  );

  // Condomínio Destino, E-mail e Link do Google Forms
  const [pulseCondoId, setPulseCondoId] = useState<string>(condominios[0]?.id || 'COND-101');
  const [pulseEmailDestino, setPulseEmailDestino] = useState<string>(
    condominios[0]?.emailCondominio || 'residencialcabralcruz@gmail.com'
  );
  const [googleFormsLink, setGoogleFormsLink] = useState<string>(() => {
    return localStorage.getItem('vos_pulse_google_forms_link') || '';
  });
  const [copiadoSucesso, setCopiadoSucesso] = useState(false);

  // Adicionar nova pergunta personalizada ao banco
  const [novaPerguntaTexto, setNovaPerguntaTexto] = useState('');
  const [novaPerguntaSegmento, setNovaPerguntaSegmento] = useState<number>(1);

  // Atualiza e-mail automaticamente quando troca o condomínio no PULSE VOS
  useEffect(() => {
    const found = condominios.find((c) => c.id === pulseCondoId);
    if (found && found.emailCondominio) {
      setPulseEmailDestino(found.emailCondominio);
    }
  }, [pulseCondoId, condominios]);

  useEffect(() => {
    try {
      localStorage.setItem('vos_pulse_perguntas_v1', JSON.stringify(perguntasPulse));
    } catch {}
  }, [perguntasPulse]);

  useEffect(() => {
    try {
      localStorage.setItem('vos_pulse_google_forms_link', googleFormsLink);
    } catch {}
  }, [googleFormsLink]);

  // Atualiza valor padrão quando o módulo muda
  useEffect(() => {
    if (mode === 'inadimplencia') setValorInput('4.5');
    else if (mode === 'sla') setValorInput('2');
    else if (mode === 'mandato') setValorInput('180');
    else if (mode === 'nps') setValorInput('85');
  }, [mode]);

  useEffect(() => {
    const unsub = subscribeToCollection<CondominioHealthMetrics>(
      'healthScoreMetrics',
      (data) => {
        if (Array.isArray(data)) {
          setCarteira(data.filter((c) => !CONDOS_FICTICIOS_REMOVER.includes(c.condominioNome)));
        }
      },
      CARTEIRA_HEALTH_INICIAL
    );
    return () => unsub();
  }, []);

  const salvarCarteira = (novaCarteira: CondominioHealthMetrics[]) => {
    setCarteira(novaCarteira);
    try {
      localStorage.setItem('vos_health_score', JSON.stringify(novaCarteira));
      saveCollectionToFirestore('healthScoreMetrics', novaCarteira);
    } catch {}
  };

  // Sorteio / Seleção Automática conforme a quantidade de perguntas definida pelo usuário
  const handleSortearMontagemMensal = () => {
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const desempenhoPool = shuffle(perguntasPulse.filter((p) => p.segmentoId >= 1 && p.segmentoId <= 5));
    const pedagioPool = shuffle(perguntasPulse.filter((p) => p.segmentoId === 6));
    const espelhoPool = shuffle(perguntasPulse.filter((p) => p.segmentoId === 7));

    const idsEscolhidos = new Set<string>([
      ...desempenhoPool.slice(0, Math.max(0, qtdDesempenho)).map((p) => p.id),
      ...pedagioPool.slice(0, Math.max(0, qtdPedagio)).map((p) => p.id),
      ...espelhoPool.slice(0, Math.max(0, qtdFatoEspelho)).map((p) => p.id)
    ]);

    setPerguntasPulse((prev) =>
      prev.map((p) => ({
        ...p,
        selecionada: idsEscolhidos.has(p.id)
      }))
    );
  };

  const togglePerguntaSelecionada = (id: string) => {
    setPerguntasPulse((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selecionada: !p.selecionada } : p))
    );
  };

  const handleAdicionarPerguntaBanco = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaPerguntaTexto.trim()) return;

    const mapaTitulos: Record<number, string> = {
      1: 'Segmento 1: Gestão e Transparência (Administrativo)',
      2: 'Segmento 2: Manutenção e Infraestrutura (Técnico)',
      3: 'Segmento 3: Convivência e Bem-estar (Social)',
      4: 'Segmento 4: Segurança e Sustentabilidade',
      5: 'Segmento 5: Satisfação Geral e Lealdade',
      6: 'Segmento 6: Perguntas "Pedágio" (Validação de Atenção)',
      7: 'Segmento 7: Fatos Espelho (Verificação de Realidade)'
    };

    const nova: PerguntaPulseItem = {
      id: `p-custom-${Date.now()}`,
      segmentoId: novaPerguntaSegmento,
      segmentoTitulo: mapaTitulos[novaPerguntaSegmento],
      texto: novaPerguntaTexto.trim(),
      selecionada: true
    };

    setPerguntasPulse((prev) => [...prev, nova]);
    setNovaPerguntaTexto('');
  };

  const perguntasSelecionadas = useMemo(
    () => perguntasPulse.filter((p) => p.selecionada),
    [perguntasPulse]
  );

  const totalPerguntasAtivas =
    perguntasSelecionadas.length + (incluirCaixaTexto ? 1 : 0);

  // Copiar roteiro estruturado para colar direto no Google Formulários e abrir forms.new
  const handleCopiarEAbrirGoogleForms = (abrirNovaAba: boolean) => {
    const condoObj = condominios.find((c) => c.id === pulseCondoId);
    const nomeCondo = condoObj?.nome || 'Condomínio';

    const linhas = [
      `PESQUISA MENSAL PULSE VOS — ${nomeCondo.toUpperCase()}`,
      `Total de Perguntas: ${totalPerguntasAtivas}`,
      `--------------------------------------------------`,
      ...perguntasSelecionadas.map(
        (p, idx) => `${idx + 1}. [${p.segmentoTitulo.split(':')[0]}] ${p.texto}`
      )
    ];

    if (incluirCaixaTexto) {
      linhas.push(
        `${perguntasSelecionadas.length + 1}. [Caixa de Texto Dissertativa] ${textoPerguntaAberta}`
      );
    }

    navigator.clipboard?.writeText(linhas.join('\n'));
    setCopiadoSucesso(true);
    setTimeout(() => setCopiadoSucesso(false), 4000);

    if (abrirNovaAba) {
      window.open('https://docs.google.com/forms/u/0/create', '_blank', 'noopener,noreferrer');
    }
  };

  // Enviar Pesquisa PULSE VOS por E-mail para o Condomínio (Síndico / Moradores)
  const handleEnviarPulsePorEmail = () => {
    const condoObj = condominios.find((c) => c.id === pulseCondoId);
    const nomeCondo = condoObj?.nome || 'Condomínio';

    // Coleta também e-mails dos moradores cadastrados na planilha se existirem
    const emailsMoradores = (condoObj?.moradores || [])
      .map((m) => m.email)
      .filter((em) => em && em.includes('@'));

    const destinatarioPrincipal = pulseEmailDestino.trim() || condoObj?.emailCondominio || '';
    const bccList = emailsMoradores.length > 0 ? `&bcc=${encodeURIComponent(emailsMoradores.join(','))}` : '';

    const assunto = `Pesquisa Mensal PULSE VOS — ${nomeCondo}`;

    const listaPerguntasTexto = perguntasSelecionadas
      .map((p, idx) => `${idx + 1}. ${p.texto}`)
      .join('\n');

    const blocoLink = googleFormsLink.trim()
      ? `\n🔗 RESPONDA PELO LINK DO GOOGLE FORMULÁRIOS:\n${googleFormsLink.trim()}\n`
      : `\n(Cole aqui o link do Google Formulários gerado)\n`;

    const corpo =
      `Olá, moradores e administração do ${nomeCondo}!\n\n` +
      `Estamos enviando o nosso termômetro mensal de qualidade e satisfação **PULSE VOS** (${totalPerguntasAtivas} perguntas rápidas).\n` +
      `Sua participação leva menos de 2 minutos e nos ajuda a priorizar melhorias reais no condomínio.\n` +
      `${blocoLink}\n` +
      `Resumo das perguntas deste mês:\n` +
      `${listaPerguntasTexto}` +
      (incluirCaixaTexto ? `\n${perguntasSelecionadas.length + 1}. ${textoPerguntaAberta}` : '') +
      `\n\nAtenciosamente,\nEquipe VOS Condomínios`;

    window.location.href = `mailto:${encodeURIComponent(destinatarioPrincipal)}?subject=${encodeURIComponent(assunto)}${bccList}&body=${encodeURIComponent(corpo)}`;
  };

  const handleAdicionarOuAtualizar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const numVal = Number(valorInput) || 0;
    const existente = carteira.find(
      (c) => c.condominioNome.toLowerCase() === novoNome.trim().toLowerCase()
    );

    if (existente) {
      const atualizada = carteira.map((c) => {
        if (c.condominioId !== existente.condominioId) return c;
        return {
          ...c,
          inadimplenciaPercentual:
            mode === 'inadimplencia' ? numVal : c.inadimplenciaPercentual,
          chamadosAbertos: mode === 'sla' ? numVal : c.chamadosAbertos,
          diasRestantesMandato:
            mode === 'mandato' ? numVal : c.diasRestantesMandato,
          npsScore: mode === 'nps' ? numVal : c.npsScore
        };
      });
      salvarCarteira(atualizada);
    } else {
      const genId = `cs-${Date.now()}`;
      const novo: CondominioHealthMetrics = {
        id: genId,
        condominioId: genId,
        condominioNome: novoNome.trim(),
        inadimplenciaPercentual: mode === 'inadimplencia' ? numVal : 4.5,
        chamadosAbertos: mode === 'sla' ? numVal : 2,
        diasRestantesMandato: mode === 'mandato' ? numVal : 180,
        npsScore: mode === 'nps' ? numVal : 85
      };
      salvarCarteira([novo, ...carteira]);
    }
    setNovoNome('');
  };

  const handleUpdateCampo = (
    condominioId: string,
    campo: keyof CondominioHealthMetrics,
    novoValor: number
  ) => {
    const atualizada = carteira.map((c) =>
      c.condominioId === condominioId ? { ...c, [campo]: novoValor } : c
    );
    salvarCarteira(atualizada);
  };

  const removerCard = (id: string) => {
    salvarCarteira(carteira.filter((c) => c.condominioId !== id));
  };

  const carteiraFiltrada = carteira.filter((c) =>
    c.condominioNome.toLowerCase().includes(busca.toLowerCase())
  );

  // Configuração visual específica de cada um dos 4 módulos separados
  const configModulo = {
    inadimplencia: {
      titulo: 'Módulo CS 1 — Inadimplência (uCondo)',
      subtitulo:
        'Acompanhamento dedicado do índice de inadimplência mensal por condomínio sincronizado com a régua de cobrança uCondo.',
      icone: <Percent className="w-5 h-5 text-emerald-300" />,
      labelInput: 'Taxa de Inadimplência (%)',
      placeholderInput: 'Ex: 4.5',
      step: '0.1',
      botaoTexto: 'Registrar Inadimplência',
      metaTexto: 'Meta Saudável: Abaixo de 10% ao mês'
    },
    sla: {
      titulo: 'Módulo CS 2 — SLA de Chamados & Atendimento',
      subtitulo:
        'Monitoramento de chamados operacionais em aberto, tempo de resposta da administradora e gargalos de manutenção.',
      icone: <Clock className="w-5 h-5 text-emerald-300" />,
      labelInput: 'Qtd. Chamados em Aberto',
      placeholderInput: 'Ex: 2',
      step: '1',
      botaoTexto: 'Registrar SLA Chamados',
      metaTexto: 'Meta Saudável: Até 5 chamados simultâneos em aberto'
    },
    mandato: {
      titulo: 'Módulo CS 3 — Mandato do Síndico & Sucessão',
      subtitulo:
        'Controle de vigência da ata de eleição do síndico, alertas preventivos de assembleia (60 dias) e retenção de contrato.',
      icone: <Award className="w-5 h-5 text-emerald-300" />,
      labelInput: 'Dias Restantes de Mandato',
      placeholderInput: 'Ex: 180',
      step: '1',
      botaoTexto: 'Registrar Mandato',
      metaTexto: 'Alerta Crítico de Sucessão: Menos de 60 dias restantes'
    },
    nps: {
      titulo: 'Módulo CS 4 — PULSE VOS (Pesquisa Mensal & Google Forms)',
      subtitulo:
        'Banco oficial de perguntas por segmento, ajuste do número de perguntas, integração com Google Formulários e disparo por e-mail ao condomínio.',
      icone: <ThumbsUp className="w-5 h-5 text-emerald-300" />,
      labelInput: 'Nota PULSE VOS (0 a 100)',
      placeholderInput: 'Ex: 85',
      step: '1',
      botaoTexto: 'Registrar Nota PULSE VOS',
      metaTexto: 'Estrutura Recomendada: 7 Desempenho + 1 Pedágio + 2 Fato Espelho + 1 Texto'
    }
  }[mode];

  // Agrupamento das perguntas por segmento (1 a 7)
  const segmentosAgrupados = useMemo(() => {
    const grupos: Record<number, { titulo: string; itens: PerguntaPulseItem[] }> = {};
    perguntasPulse.forEach((p) => {
      if (!grupos[p.segmentoId]) {
        grupos[p.segmentoId] = { titulo: p.segmentoTitulo, itens: [] };
      }
      grupos[p.segmentoId].itens.push(p);
    });
    return Object.entries(grupos).map(([segId, dados]) => ({
      segmentoId: Number(segId),
      ...dados
    }));
  }, [perguntasPulse]);

  return (
    <div className="bg-white text-slate-900 rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Cabeçalho do Módulo Específico */}
      <div className="bg-linear-to-r from-[#1c3220] to-[#2d5a32] px-6 py-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-white/15 p-3 rounded-2xl border border-white/20 shadow-inner">
            {configModulo.icone}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {configModulo.titulo}
              </h2>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-extrabold">
                {mode === 'nps' ? 'PULSE VOS' : 'Customer Success'}
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              {configModulo.subtitulo}
            </p>
          </div>
        </div>

        {mode === 'nps' ? (
          <div className="flex items-center gap-2 bg-black/25 p-1.5 rounded-2xl border border-white/15 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setAbaPulse('montador_pulse')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                abaPulse === 'montador_pulse'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>Montar PULSE & Enviar Pesquisa ({totalPerguntasAtivas} perg.)</span>
            </button>
            <button
              type="button"
              onClick={() => setAbaPulse('notas_pulse')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                abaPulse === 'notas_pulse'
                  ? 'bg-white text-[#1c3220] shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Notas PULSE dos Condomínios ({carteira.length})</span>
            </button>
          </div>
        ) : (
          <div className="bg-black/25 px-3.5 py-2 rounded-2xl border border-white/15 text-xs font-bold text-emerald-200 shrink-0">
            {configModulo.metaTexto}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODO ESPECIAL: PULSE VOS — MONTADOR DE PERGUNTAS, GOOGLE FORMS & E-MAIL   */}
      {/* ========================================================================= */}
      {mode === 'nps' && abaPulse === 'montador_pulse' && (
        <div className="p-6 space-y-6 bg-linear-to-b from-[#f8faf6] to-white">
          {/* Painel 1: Configurar Número de Perguntas (Sugestão de Montagem Mensal) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#1c3220] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#2d5a32]" />
                  <span>1. Configurar Quantidade de Perguntas do PULSE VOS (Montagem Mensal)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sugestão oficial de equilíbrio: <strong>7 Perguntas de Desempenho</strong> (Segmentos 1 a 5), <strong>1 Pergunta Pedágio</strong> (Segmento 6), <strong>2 Fatos Espelho</strong> (Segmento 7) e <strong>1 Caixa de Texto</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSortearMontagemMensal}
                className="px-4 py-2.5 bg-[#2d5a32] hover:bg-[#1c3220] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition shadow-xs shrink-0"
              >
                <Shuffle className="w-4 h-4 text-amber-300" />
                <span>Aplicar Quantidade & Sortear Perguntas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-[#f2f5f1] p-3.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-[#1c3220] block mb-1">
                  Perguntas de Desempenho (Seg. 1 a 5)
                </label>
                <input
                  type="number"
                  min={0}
                  max={35}
                  value={qtdDesempenho}
                  onChange={(e) => setQtdDesempenho(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-[#1c3220]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Recomendado: 7 perguntas</span>
              </div>

              <div className="bg-[#f2f5f1] p-3.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-[#1c3220] block mb-1">
                  Pergunta Pedágio (Seg. 6 - Atenção)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={qtdPedagio}
                  onChange={(e) => setQtdPedagio(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-amber-700"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Recomendado: 1 pergunta</span>
              </div>

              <div className="bg-[#f2f5f1] p-3.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-[#1c3220] block mb-1">
                  Fatos Espelho (Seg. 7 - Realidade)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={qtdFatoEspelho}
                  onChange={(e) => setQtdFatoEspelho(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-blue-700"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Recomendado: 2 perguntas</span>
              </div>

              <div className="bg-[#f2f5f1] p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#1c3220]">
                    Caixa de Texto (Sugestões)
                  </label>
                  <input
                    type="checkbox"
                    checked={incluirCaixaTexto}
                    onChange={(e) => setIncluirCaixaTexto(e.target.checked)}
                    className="w-4 h-4 accent-[#2d5a32] cursor-pointer"
                  />
                </div>
                <div className="mt-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#2d5a32] flex items-center justify-between">
                  <span>Total Selecionado:</span>
                  <span className="font-mono text-sm font-black">{totalPerguntasAtivas} perg.</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Você também pode marcar/desmarcar abaixo
                </span>
              </div>
            </div>
          </div>

          {/* Painel 2: Gerar no Google Formulários, Colar Link da Pesquisa e Enviar por E-mail ao Condomínio */}
          <div className="bg-[#f2f5f1] rounded-2xl border border-[#2d5a32]/30 p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#1c3220] flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#2d5a32]" />
                  <span>2. Google Formulários & Envio por E-mail para o Condomínio</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Gere o formulário no <strong>Google Formulários</strong>, cole o link da pesquisa no campo abaixo e envie por e-mail para o condomínio.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopiarEAbrirGoogleForms(false)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-[#1c3220] border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  {copiadoSucesso ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Perguntas Copiadas!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#2d5a32]" />
                      <span>Copiar {totalPerguntasAtivas} Perguntas Selecionadas</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopiarEAbrirGoogleForms(true)}
                  className="px-4 py-2 bg-[#1c3220] hover:bg-[#2d5a32] text-amber-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  title="Copia as perguntas selecionadas e abre o criador oficial do Google Formulários"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Gerar no Google Formulários</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              {/* Selecionar Condomínio */}
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Condomínio Destinatário *
                </label>
                <select
                  value={pulseCondoId}
                  onChange={(e) => setPulseCondoId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                >
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.id}] {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* E-mail do Condomínio */}
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  E-mail do Condomínio / Síndico *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="condominio@email.com"
                    value={pulseEmailDestino}
                    onChange={(e) => setPulseEmailDestino(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              {/* Campo para Colar o Link da Pesquisa (Google Forms) */}
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Colar Link da Pesquisa (Google Formulários) *
                </label>
                <div className="relative">
                  <Link2 className="w-3.5 h-3.5 text-[#2d5a32] absolute left-3 top-2.5" />
                  <input
                    type="url"
                    placeholder="https://forms.gle/... ou docs.google.com/forms/..."
                    value={googleFormsLink}
                    onChange={(e) => setGoogleFormsLink(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>

              {/* Botão Enviar E-mail */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleEnviarPulsePorEmail}
                  className="w-full py-2 px-3 bg-[#2d5a32] hover:bg-[#1c3220] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm h-[36px]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar p/ E-mail</span>
                </button>
              </div>
            </div>

            {googleFormsLink && (
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-emerald-200 text-xs">
                <span className="text-slate-600 truncate">
                  Link vinculado da pesquisa:{' '}
                  <a
                    href={googleFormsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-[#2d5a32] underline"
                  >
                    {googleFormsLink}
                  </a>
                </span>
                <a
                  href={googleFormsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#1c3220] hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Abrir Formulário</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Painel 3: Banco Salvo de Perguntas PULSE VOS (Segmentos 1 a 7 + Caixa de Texto) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-[#1c3220] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2d5a32]" />
                  <span>3. Banco de Perguntas Salvas do PULSE VOS (Clique para marcar/desmarcar)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Atualmente há <strong>{perguntasSelecionadas.length} perguntas fechadas</strong> marcadas +{' '}
                  <strong>{incluirCaixaTexto ? '1 Caixa de Texto' : '0 Caixa de Texto'}</strong> ={' '}
                  <strong className="text-[#2d5a32]">{totalPerguntasAtivas} perguntas na pesquisa</strong>.
                </p>
              </div>
            </div>

            {/* Adicionar nova pergunta ao banco salvo */}
            <form
              onSubmit={handleAdicionarPerguntaBanco}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-end"
            >
              <div className="w-full sm:w-64">
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Segmento da Nova Pergunta
                </label>
                <select
                  value={novaPerguntaSegmento}
                  onChange={(e) => setNovaPerguntaSegmento(Number(e.target.value))}
                  className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value={1}>Seg. 1: Gestão e Transparência</option>
                  <option value={2}>Seg. 2: Manutenção e Infraestrutura</option>
                  <option value={3}>Seg. 3: Convivência e Bem-estar</option>
                  <option value={4}>Seg. 4: Segurança e Sustentabilidade</option>
                  <option value={5}>Seg. 5: Satisfação Geral e Lealdade</option>
                  <option value={6}>Seg. 6: Pergunta Pedágio (Atenção)</option>
                  <option value={7}>Seg. 7: Fato Espelho (Realidade)</option>
                </select>
              </div>

              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Adicionar Nova Pergunta ao Banco Salvo
                </label>
                <input
                  type="text"
                  placeholder="Digite o enunciado da pergunta para deixá-la salva no banco PULSE VOS..."
                  value={novaPerguntaTexto}
                  onChange={(e) => setNovaPerguntaTexto(e.target.value)}
                  className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#1c3220] hover:bg-[#2d5a32] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 h-[36px]"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Pergunta</span>
              </button>
            </form>

            {/* Listagem dos 7 Segmentos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {segmentosAgrupados.map((seg) => {
                const qtdMarcadasSeg = seg.itens.filter((i) => i.selecionada).length;
                return (
                  <div
                    key={seg.segmentoId}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-extrabold text-[#1c3220]">{seg.titulo}</h4>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#e8f0e6] text-[#2d5a32]">
                        {qtdMarcadasSeg} de {seg.itens.length} selecionadas
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {seg.itens.map((item) => (
                        <label
                          key={item.id}
                          onClick={() => togglePerguntaSelecionada(item.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                            item.selecionada
                              ? 'bg-emerald-50/80 border-emerald-400 text-[#1c3220] font-semibold'
                              : 'bg-[#f8faf6] hover:bg-slate-100 border-slate-200/80 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.selecionada}
                            onChange={() => {}}
                            className="mt-0.5 accent-[#2d5a32] pointer-events-none"
                          />
                          <span className="leading-snug flex-1">{item.texto}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Card da Caixa de Texto Dissertativa */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-extrabold text-[#1c3220]">
                      Caixa de Texto (Para Sugestões Dissertativas)
                    </h4>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#2d5a32] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirCaixaTexto}
                        onChange={(e) => setIncluirCaixaTexto(e.target.checked)}
                        className="accent-[#2d5a32]"
                      />
                      <span>Incluir no Pulse</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Enunciado da pergunta aberta ao final do formulário:
                  </p>
                  <textarea
                    rows={3}
                    value={textoPerguntaAberta}
                    onChange={(e) => setTextoPerguntaAberta(e.target.value)}
                    className="w-full mt-1.5 bg-[#f8faf6] border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
                  />
                </div>

                <div className="bg-[#f2f5f1] p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                  <strong>Dica:</strong> Clique em <strong>"Gerar no Google Formulários"</strong> acima para copiar todas as{' '}
                  <strong>{totalPerguntasAtivas} perguntas</strong> já numeradas e abrir o Google Forms.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAINEL DE MONITORAMENTO DE CARTEIRA (INADIMPLÊNCIA, SLA, MANDATO OU NOTAS PULSE) */}
      {/* ========================================================================= */}
      {(mode !== 'nps' || abaPulse === 'notas_pulse') && (
        <div className="p-6 space-y-6 bg-linear-to-b from-[#f8faf6] to-white">
          {/* Formulário Dedicado ao Módulo Atual */}
          <form
            onSubmit={handleAdicionarOuAtualizar}
            className="bg-[#f2f5f1] border border-slate-200 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end"
          >
            <div className="md:col-span-5">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Selecionar ou Digitar Condomínio *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#2d5a32] absolute left-3 top-2.5" />
                <input
                  type="text"
                  list="lista-condos-cs"
                  required
                  placeholder="Ex: Residencial Cabral Cruz"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                />
                <datalist id="lista-condos-cs">
                  {condominios.map((c) => (
                    <option key={c.id} value={c.nome} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {configModulo.labelInput} *
              </label>
              <input
                type="number"
                step={configModulo.step}
                required
                placeholder={configModulo.placeholderInput}
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-mono font-bold"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full bg-[#2d5a32] hover:bg-[#1c3220] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer h-[36px] shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{configModulo.botaoTexto}</span>
              </button>
            </div>
          </form>

          {/* Barra de Busca Rápida */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar condomínio na carteira..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#2d5a32]"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Monitorando <strong>{carteiraFiltrada.length}</strong> condomínios neste indicador
            </span>
          </div>

          {/* Cards Específicos de acordo com o Módulo Selecionado */}
          {carteiraFiltrada.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white text-xs text-slate-500">
              Nenhum condomínio cadastrado neste indicador. Preencha o formulário acima para iniciar o monitoramento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carteiraFiltrada.map((c) => {
                const isCritico =
                  mode === 'inadimplencia'
                    ? c.inadimplenciaPercentual > 10
                    : mode === 'sla'
                    ? c.chamadosAbertos > 5
                    : mode === 'mandato'
                    ? c.diasRestantesMandato < 60
                    : c.npsScore < 60;

                return (
                  <div
                    key={c.condominioId}
                    className={`p-5 rounded-2xl border shadow-2xs transition ${
                      isCritico
                        ? 'bg-rose-50/50 border-rose-300'
                        : 'bg-white border-slate-200 hover:border-[#2d5a32]/40'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                          ID: {c.condominioId}
                        </span>
                        <h3 className="text-base font-extrabold text-[#1c3220]">
                          {c.condominioNome}
                        </h3>

                        {isCritico ? (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-bold mt-1">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {mode === 'inadimplencia' &&
                              'Inadimplência Acima do Limite (>10%) • Acionar Cobrança uCondo'}
                            {mode === 'sla' &&
                              'Gargalo de SLA (>5 chamados) • Priorizar Força-Tarefa'}
                            {mode === 'mandato' &&
                              'Mandato Próximo ao Fim (<60 dias) • Agendar Assembleia'}
                            {mode === 'nps' &&
                              'PULSE VOS em Zona Crítica (<60 pts) • Visita Presencial CS'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#2d5a32] font-semibold mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {mode === 'inadimplencia' &&
                              'Fluxo de Caixa Saudável • Inadimplência Controlada'}
                            {mode === 'sla' &&
                              'SLA em Dia • Atendimento Operacional Fluido'}
                            {mode === 'mandato' &&
                              'Mandato Vigente Estável • Sem risco imediato de troca'}
                            {mode === 'nps' &&
                              'Nota PULSE VOS Saudável • Satisfação Elevada com a VOS'}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => removerCard(c.condominioId)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Remover condomínio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Painel Central do Indicador */}
                    {mode === 'inadimplencia' && (
                      <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block">
                              Taxa de Inadimplência Atual (uCondo)
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span
                                className={`text-2xl font-black font-mono ${
                                  isCritico ? 'text-rose-600' : 'text-[#1c3220]'
                                }`}
                              >
                                {c.inadimplenciaPercentual}%
                              </span>
                              <span className="text-[11px] text-slate-400">
                                (Meta: &le; 10%)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500">
                              Ajustar %:
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={c.inadimplenciaPercentual}
                              onChange={(e) =>
                                handleUpdateCampo(
                                  c.condominioId,
                                  'inadimplenciaPercentual',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCritico ? 'bg-rose-600' : 'bg-[#2d5a32]'
                            }`}
                            style={{
                              width: `${Math.min(100, c.inadimplenciaPercentual * 4)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'sla' && (
                      <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block">
                              Chamados Pendentes no Condomínio
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span
                                className={`text-2xl font-black font-mono ${
                                  isCritico ? 'text-rose-600' : 'text-[#1c3220]'
                                }`}
                              >
                                {c.chamadosAbertos} chamados
                              </span>
                              <span className="text-[11px] text-slate-400">
                                (SLA Ideal: &le; 5)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500">
                              Qtd:
                            </label>
                            <input
                              type="number"
                              value={c.chamadosAbertos}
                              onChange={(e) =>
                                handleUpdateCampo(
                                  c.condominioId,
                                  'chamadosAbertos',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCritico ? 'bg-rose-600' : 'bg-blue-600'
                            }`}
                            style={{
                              width: `${Math.min(100, c.chamadosAbertos * 10)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'mandato' && (
                      <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block">
                              Contagem Regressiva para Assembleia de Eleição
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span
                                className={`text-2xl font-black font-mono ${
                                  isCritico ? 'text-amber-600' : 'text-[#1c3220]'
                                }`}
                              >
                                Faltam {c.diasRestantesMandato} dias
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500">
                              Dias:
                            </label>
                            <input
                              type="number"
                              value={c.diasRestantesMandato}
                              onChange={(e) =>
                                handleUpdateCampo(
                                  c.condominioId,
                                  'diasRestantesMandato',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCritico ? 'bg-amber-500' : 'bg-[#2d5a32]'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((c.diasRestantesMandato / 365) * 100)
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'nps' && (
                      <div className="bg-[#f8faf6] p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block">
                              Nota Consolidada PULSE VOS
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span
                                className={`text-2xl font-black font-mono ${
                                  isCritico
                                    ? 'text-rose-600'
                                    : c.npsScore >= 75
                                    ? 'text-[#2d5a32]'
                                    : 'text-amber-600'
                                }`}
                              >
                                {c.npsScore} / 100 pts
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                                {c.npsScore >= 75
                                  ? 'Excelente'
                                  : c.npsScore >= 60
                                  ? 'Estável'
                                  : 'Atenção'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500">
                              Nota:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={c.npsScore}
                              onChange={(e) =>
                                handleUpdateCampo(
                                  c.condominioId,
                                  'npsScore',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCritico
                                ? 'bg-rose-600'
                                : c.npsScore >= 75
                                ? 'bg-[#2d5a32]'
                                : 'bg-amber-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, c.npsScore))}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
