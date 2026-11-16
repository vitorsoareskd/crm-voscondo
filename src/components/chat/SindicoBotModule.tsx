import React, { useState, useEffect, useRef } from 'react';
import { ChamadoBot, Condominio, SindicoBotConfig, UserProfile } from '../../types';
import { subscribeToCollection, saveCollectionToFirestore } from '../../lib/firebase';
import {
  Bot,
  Send,
  UserCog,
  CheckCircle,
  ExternalLink,
  Trash2,
  Phone,
  MessageSquare,
  AlertTriangle,
  Paperclip,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  User,
  Building2,
  Sparkles,
  FileText,
  Copy,
  Share2,
  Link2,
  Headset,
  MessageCircle
} from 'lucide-react';

interface BotProps {
  currentUser: UserProfile;
  condominios?: Condominio[];
}

const INITIAL_CHAMADOS: ChamadoBot[] = [];

const DEFAULT_CONFIG: SindicoBotConfig = {
  id: 'cfg-bot-01',
  condominioId: 'COND-101',
  condominioNome: 'Residencial Cabral Cruz',
  whatsappSindicoBot: '5541999999999',
  nomeAssistente: 'Bot da Sindicância VOS',
  apiStatus: 'conectado',
  autoDisparoWpp: true
};

export const SindicoBotModule: React.FC<BotProps> = ({ currentUser, condominios = [] }) => {
  // =========================================================================
  // 1. ESTADO DOS CHAMADOS (1- FEEDBACK, 2- RECLAMAÇÃO, 3- FALAR COM SÍNDICO)
  // =========================================================================
  const [chamados, setChamados] = useState<ChamadoBot[]>(() => {
    try {
      const saved = localStorage.getItem('vos_chamados_bot');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_CHAMADOS;
    } catch {
      return INITIAL_CHAMADOS;
    }
  });

  useEffect(() => {
    const unsub = subscribeToCollection<ChamadoBot>('chamadosBot', (data) => setChamados(data), INITIAL_CHAMADOS);
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('vos_chamados_bot', JSON.stringify(chamados));
      saveCollectionToFirestore('chamadosBot', chamados);
    } catch {}
  }, [chamados]);

  // =========================================================================
  // 2. CONFIGURAÇÃO DA API WHATSAPP DO SÍNDICO (FORMATO CUSTO R$ 0,00 / WA.ME)
  // =========================================================================
  const [botConfig, setBotConfig] = useState<SindicoBotConfig>(() => {
    try {
      const saved = localStorage.getItem('vos_sindico_bot_config');
      if (saved) {
        return JSON.parse(saved);
      }
      return {
        ...DEFAULT_CONFIG,
        condominioNome: currentUser.condominioNome || 'Residencial Cabral Cruz',
        whatsappSindicoBot: currentUser.whatsapp || '5541999999999'
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [configSavedNotice, setConfigSavedNotice] = useState(false);
  const [copiedLinkNotice, setCopiedLinkNotice] = useState<string | null>(null);

  const handleSaveApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('vos_sindico_bot_config', JSON.stringify(botConfig));
      saveCollectionToFirestore('sindicoBotConfig', [botConfig]);
      setConfigSavedNotice(true);
      setTimeout(() => setConfigSavedNotice(false), 3500);
    } catch {}
  };

  // Links de Acionamento Gratuito (Custo R$ 0,00)
  const linkPortalBotMorador = `${window.location.origin}/?bot=1`;
  const textoConviteGrupoWpp =
    `🤖 *Central Digital do Síndico — ${botConfig.condominioNome}*\n\n` +
    `Olá, moradores! Acesse nosso Chatbot oficial para:\n` +
    `*1️⃣ Feedback* (Sugestões e elogios)\n` +
    `*2️⃣ Reclamação* (Fluxo em 4 passos com evidência e mediação amigável)\n` +
    `*3️⃣ Falar com o Síndico* (Atendimento direto)\n\n` +
    `👉 Acesse aqui: ${linkPortalBotMorador}`;

  const copiarTexto = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedLinkNotice(label);
    setTimeout(() => setCopiedLinkNotice(null), 3000);
  };

  // =========================================================================
  // 3. ESTADO DO CHATBOT INTERATIVO (3 OPÇÕES INICIAIS)
  // =========================================================================
  const [modoChat, setModoChat] = useState<'menu' | 'feedback' | 'reclamacao' | 'falar_sindico'>('menu');
  const [passoReclamacao, setPassoReclamacao] = useState<1 | 2 | 3 | 4>(1);

  // Dados do Remetente (Morador que está enviando)
  const [remetenteNome, setRemetenteNome] = useState(currentUser.nome || 'Morador');
  const [remetenteUnidade, setRemetenteUnidade] = useState(currentUser.unidade || 'Bloco A - Apto 101');
  const [remetenteWhatsapp, setRemetenteWhatsapp] = useState(currentUser.whatsapp || '');

  // Opção 1: Feedback
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [feedbackEnviadoSucesso, setFeedbackEnviadoSucesso] = useState(false);

  // Opção 2: Reclamação em 4 Passos
  // Passo 1: Escrever a mensagem
  const [categoria, setCategoria] = useState<ChamadoBot['categoria']>('Barulho/Silêncio');
  const [relatoReclamacao, setRelatoReclamacao] = useState('');

  // Passo 2: Destinar a alguém (Número e Bloco do destinatário + Nome e WhatsApp)
  const [blocoDestino, setBlocoDestino] = useState('');
  const [numeroDestino, setNumeroDestino] = useState('');
  const [moradorAcusadoNome, setMoradorAcusadoNome] = useState('');
  const [moradorAcusadoWhatsapp, setMoradorAcusadoWhatsapp] = useState('');

  // Todos os moradores importados da planilha Excel dos condomínios
  const todosMoradoresImportados = condominios.flatMap((c) => c.moradores || []);

  // Auto-preencher Nome e WhatsApp do Destinatário quando o morador digita Bloco/Unidade no Passo 2
  useEffect(() => {
    if (!numeroDestino.trim() || todosMoradoresImportados.length === 0) return;
    const encontrado = todosMoradoresImportados.find((m) => {
      const matchUnidade = m.unidade.toLowerCase().trim() === numeroDestino.toLowerCase().trim();
      const matchBloco =
        !blocoDestino.trim() ||
        m.bloco.toLowerCase().includes(blocoDestino.toLowerCase().trim()) ||
        blocoDestino.toLowerCase().trim().includes(m.bloco.toLowerCase().trim());
      return matchUnidade && matchBloco;
    });
    if (encontrado) {
      if (encontrado.nomeMorador) setMoradorAcusadoNome(encontrado.nomeMorador);
      if (encontrado.whatsapp) setMoradorAcusadoWhatsapp(encontrado.whatsapp);
    }
  }, [blocoDestino, numeroDestino, condominios]);

  // Passo 3: Enviar Evidência (Foto, Vídeo, Áudio ou Documento)
  const [evidenciaNome, setEvidenciaNome] = useState('');
  const [evidenciaUrl, setEvidenciaUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Opção 3: Falar com Síndico
  const [assuntoSindico, setAssuntoSindico] = useState('');
  const [urgenciaSindico, setUrgenciaSindico] = useState<'Normal' | 'Urgente'>('Normal');

  // Filtro da Central de Registros
  const [filtroCentral, setFiltroCentral] = useState<'todos' | 'reclamacao' | 'feedback' | 'falar_sindico'>('todos');

  // =========================================================================
  // 4. FUNÇÕES DE MENSAGEM NO WHATSAPP (WA.ME CUSTO R$ 0,00)
  // =========================================================================
  // Aviso amigável para o morador destinatário da reclamação (Opção 2)
  const gerarMensagemAmigavelWhatsApp = (c: ChamadoBot) => {
    const condominio = botConfig.condominioNome || currentUser.condominioNome || 'Residencial Cabral Cruz';
    const destinoFormatado =
      c.blocoDestino || c.numeroDestino
        ? `Bloco ${c.blocoDestino || '-'} • Unidade ${c.numeroDestino || '-'}`
        : c.unidadeAcusada;

    const msg =
      `🤖 *${botConfig.nomeAssistente} — ${condominio}*\n\n` +
      `Olá, *${c.moradorAcusadoNome || 'Morador(a)'}* (${destinoFormatado}), tudo bem?\n\n` +
      `Estamos entrando em contato de forma amigável pois nossa central recebeu um apontamento referente a *${c.categoria}* destinado à sua unidade:\n` +
      `💬 _"${c.relato}"_\n` +
      `${c.evidenciaNome ? `📎 *Evidência anexada para análise:* ${c.evidenciaNome}\n` : ''}\n` +
      `🔍 *Análise da Sindicância:* Informamos que o relato e a evidência enviada passarão por análise cuidadosa da administração/síndico, garantindo sempre o direito de esclarecimento.\n\n` +
      `🤝 *Lembrete Amigável de Convivência:* Contamos com a sua parceria e compreensão para mantermos a harmonia do nosso condomínio! Lembramos gentilmente que a reincidência no descumprimento das normas do Regimento Interno pode gerar advertências formais ou sanções previstas na convenção.\n\n` +
      `Caso queira enviar sua versão ou conversar diretamente com o Síndico (${botConfig.whatsappSindicoBot}), basta responder esta mensagem.`;

    const foneLimpo = (c.moradorAcusadoWhatsapp || botConfig.whatsappSindicoBot).replace(/\D/g, '');
    return `https://wa.me/${foneLimpo}?text=${encodeURIComponent(msg)}`;
  };

  // Resposta do Síndico para o Morador Remetente (Opção 1 ou Opção 3)
  const gerarLinkRespostaAoMorador = (c: ChamadoBot) => {
    const condominio = botConfig.condominioNome || currentUser.condominioNome || 'Residencial Cabral Cruz';
    const msg =
      `👋 Olá, *${c.reclamanteNome}* (${c.reclamanteUnidade})!\n` +
      `Aqui é o Síndico do *${condominio}* referente ao protocolo *${c.id}* enviado no Chatbot:\n` +
      `_"${c.relato}"_\n\n` +
      `Como posso ajudar?`;
    const foneLimpo = (c.reclamanteWhatsapp || '').replace(/\D/g, '');
    return `https://wa.me/${foneLimpo}?text=${encodeURIComponent(msg)}`;
  };

  // Opção 1: Enviar Feedback
  const handleEnviarFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTexto.trim()) return;

    const novoFeedback: ChamadoBot = {
      id: `FB-${Date.now().toString().slice(-4)}`,
      condominioId: currentUser.condominioId || 'COND-101',
      tipo: 'feedback',
      reclamanteNome: remetenteNome.trim() || currentUser.nome,
      reclamanteUnidade: remetenteUnidade.trim() || 'Condômino',
      reclamanteWhatsapp: remetenteWhatsapp.trim(),
      unidadeAcusada: 'Sindicância / Administração',
      moradorAcusadoNome: `Síndico (${botConfig.whatsappSindicoBot})`,
      moradorAcusadoWhatsapp: botConfig.whatsappSindicoBot,
      categoria: 'Feedback/Sugestão',
      relato: feedbackTexto.trim(),
      status: 'aguardando_sindico',
      notificacaoWppEnviada: true,
      precisaAtendimentoHumano: false,
      criadoEm: new Date().toLocaleString('pt-BR')
    };

    setChamados((prev) => [novoFeedback, ...prev]);
    setFeedbackTexto('');
    setFeedbackEnviadoSucesso(true);
    setTimeout(() => {
      setFeedbackEnviadoSucesso(false);
      setModoChat('menu');
    }, 2200);
  };

  // Opção 2: Upload de arquivo de evidência (Passo 3)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenciaNome(file.name);

    if (file.size <= 800 * 1024 && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEvidenciaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setEvidenciaUrl('');
    }
  };

  // Opção 2: Concluir Reclamação no Passo 4
  const handleConcluirReclamacao = (abrirWaMeAgora: boolean) => {
    const unidadeDestinoCompleta = `Bloco ${blocoDestino.trim() || 'Único'} - Unid. ${numeroDestino.trim() || 'S/N'}`;

    const novaReclamacao: ChamadoBot = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      condominioId: currentUser.condominioId || 'COND-101',
      tipo: 'reclamacao',
      reclamanteNome: remetenteNome.trim() || currentUser.nome,
      reclamanteUnidade: remetenteUnidade.trim() || 'Unidade não informada',
      reclamanteWhatsapp: remetenteWhatsapp.trim(),
      blocoDestino: blocoDestino.trim() || 'Único',
      numeroDestino: numeroDestino.trim(),
      unidadeAcusada: unidadeDestinoCompleta,
      moradorAcusadoNome: moradorAcusadoNome.trim() || `Responsável (${unidadeDestinoCompleta})`,
      moradorAcusadoWhatsapp: moradorAcusadoWhatsapp.trim() || botConfig.whatsappSindicoBot,
      categoria,
      relato: relatoReclamacao.trim(),
      evidenciaNome: evidenciaNome.trim() || 'Evidência encaminhada pelo morador',
      evidenciaUrl: evidenciaUrl || undefined,
      status: abrirWaMeAgora ? 'notificado_bot' : 'aguardando_sindico',
      notificacaoWppEnviada: abrirWaMeAgora,
      precisaAtendimentoHumano: !abrirWaMeAgora,
      criadoEm: new Date().toLocaleString('pt-BR')
    };

    setChamados((prev) => [novaReclamacao, ...prev]);

    if (abrirWaMeAgora) {
      window.open(gerarMensagemAmigavelWhatsApp(novaReclamacao), '_blank');
    }

    // Limpar campos e voltar ao menu
    setRelatoReclamacao('');
    setBlocoDestino('');
    setNumeroDestino('');
    setMoradorAcusadoNome('');
    setMoradorAcusadoWhatsapp('');
    setEvidenciaNome('');
    setEvidenciaUrl('');
    setPassoReclamacao(1);
    setModoChat('menu');
  };

  // Opção 3: Falar Diretamente com o Síndico (Registra no Painel e Abre Conversa Direta no WhatsApp do Síndico)
  const handleFalarComSindico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assuntoSindico.trim()) return;

    const novoAtendimento: ChamadoBot = {
      id: `SIND-${Date.now().toString().slice(-4)}`,
      condominioId: currentUser.condominioId || 'COND-101',
      tipo: 'falar_sindico',
      reclamanteNome: remetenteNome.trim() || currentUser.nome,
      reclamanteUnidade: remetenteUnidade.trim() || 'Condômino',
      reclamanteWhatsapp: remetenteWhatsapp.trim(),
      unidadeAcusada: 'Atendimento Direto c/ Síndico',
      moradorAcusadoNome: `Síndico (${botConfig.whatsappSindicoBot})`,
      moradorAcusadoWhatsapp: botConfig.whatsappSindicoBot,
      categoria: 'Atendimento Direto c/ Síndico',
      relato: `[Prioridade: ${urgenciaSindico}] ${assuntoSindico.trim()}`,
      status: 'aguardando_sindico',
      notificacaoWppEnviada: true,
      precisaAtendimentoHumano: true,
      criadoEm: new Date().toLocaleString('pt-BR')
    };

    setChamados((prev) => [novoAtendimento, ...prev]);

    // Abre o WhatsApp do Síndico direto com a identificação do morador e o assunto (Custo R$ 0,00)
    const foneSindico = botConfig.whatsappSindicoBot.replace(/\D/g, '');
    const msgParaSindico =
      `👋 *Atendimento Direto com o Síndico — ${botConfig.condominioNome}*\n\n` +
      `👤 *Morador (Remetente):* ${novoAtendimento.reclamanteNome}\n` +
      `🏢 *Unidade / Bloco:* ${novoAtendimento.reclamanteUnidade}\n` +
      `⚡ *Prioridade:* ${urgenciaSindico}\n` +
      `📋 *Protocolo:* ${novoAtendimento.id}\n\n` +
      `💬 *Assunto:* "${assuntoSindico.trim()}"`;

    window.open(`https://wa.me/${foneSindico}?text=${encodeURIComponent(msgParaSindico)}`, '_blank');

    setAssuntoSindico('');
    setUrgenciaSindico('Normal');
    setModoChat('menu');
  };

  const marcarNotificadoWpp = (id: string) => {
    setChamados((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'notificado_bot', notificacaoWppEnviada: true, precisaAtendimentoHumano: false } : c
      )
    );
  };

  const escalarParaSindico = (id: string) => {
    setChamados((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'aguardando_sindico', precisaAtendimentoHumano: true } : c
      )
    );
  };

  const marcarComoResolvido = (id: string) => {
    setChamados((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'resolvido', precisaAtendimentoHumano: false } : c
      )
    );
  };

  const removerChamado = (id: string) => {
    setChamados((prev) => prev.filter((c) => c.id !== id));
  };

  const chamadosFiltrados = chamados.filter((c) => {
    const tipoItem = c.tipo || 'reclamacao';
    if (filtroCentral === 'todos') return true;
    return tipoItem === filtroCentral;
  });

  const totalReclamacoes = chamados.filter((c) => (c.tipo || 'reclamacao') === 'reclamacao').length;
  const totalFeedbacks = chamados.filter((c) => c.tipo === 'feedback').length;
  const totalFalarSindico = chamados.filter((c) => c.tipo === 'falar_sindico').length;

  return (
    <div className="p-6 bg-white text-slate-900 rounded-2xl shadow-xs border border-slate-200 space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#2d5a32] p-2.5 rounded-xl text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1c3220]">
              Chatbot do Síndico — API WhatsApp (1. Feedback • 2. Reclamação • 3. Falar com Síndico)
            </h2>
            <p className="text-xs text-slate-500">
              Arquitetura completa Custo R$ 0,00 via `wa.me`: recebe Feedbacks, Reclamações em 4 passos (com evidência) e chamados diretos ao Síndico.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#2d5a32] border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            WhatsApp Síndico: {botConfig.whatsappSindicoBot} (Custo R$ 0,00)
          </span>
        </div>
      </div>

      {/* BARRA DE CONFIGURAÇÃO DA API WHATSAPP + LINK DE ACIONAMENTO PARA OS MORADORES */}
      <div className="bg-[#f2f5f1] border border-slate-200 p-4 rounded-2xl space-y-3">
        <form
          onSubmit={handleSaveApiConfig}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
        >
          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-[#1c3220] flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-[#2d5a32]" />
              <span>WhatsApp do Síndico / Bot *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 5541999999999"
              value={botConfig.whatsappSindicoBot}
              onChange={(e) => setBotConfig({ ...botConfig, whatsappSindicoBot: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Nome do Assistente no WhatsApp
            </label>
            <input
              type="text"
              placeholder="Ex: Bot da Sindicância VOS"
              value={botConfig.nomeAssistente}
              onChange={(e) => setBotConfig({ ...botConfig, nomeAssistente: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Condomínio Vinculado
            </label>
            <input
              type="text"
              value={botConfig.condominioNome}
              onChange={(e) => setBotConfig({ ...botConfig, condominioNome: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="w-full bg-[#1c3220] hover:bg-[#2d5a32] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs h-[36px]"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Salvar Número na API</span>
            </button>
          </div>
        </form>

        {/* Barra de Compartilhamento Rápido para os Moradores acionarem o Bot de graça */}
        <div className="pt-3 border-t border-slate-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Link2 className="w-4 h-4 text-[#2d5a32] shrink-0" />
            <span>
              <strong>Acionamento pelos Moradores:</strong> Envie o link do Chatbot no grupo do WhatsApp do condomínio ou na mensagem de saudação automática do WhatsApp.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => copiarTexto(linkPortalBotMorador, 'Link direto do Chatbot copiado!')}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-[#1c3220] border border-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Copy className="w-3.5 h-3.5 text-[#2d5a32]" />
              <span>Copiar Link do Chatbot</span>
            </button>
            <button
              type="button"
              onClick={() => copiarTexto(textoConviteGrupoWpp, 'Convite com as 3 opções copiado para colar no WhatsApp!')}
              className="px-3 py-1.5 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copiar Convite p/ Grupo do WhatsApp</span>
            </button>
          </div>
        </div>

        {(configSavedNotice || copiedLinkNotice) && (
          <div className="bg-emerald-800 text-emerald-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>
              {copiedLinkNotice ||
                `Número de WhatsApp (${botConfig.whatsappSindicoBot}) vinculado com sucesso à API do Chatbot do Síndico!`}
            </span>
          </div>
        )}
      </div>

      {/* ÁREA PRINCIPAL: CHATBOT COM AS 3 OPÇÕES (ESQUERDA) + CENTRAL DO SÍNDICO (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (5 cols): CHATBOT INTERATIVO (3 OPÇÕES INICIAIS)          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-[#f8faf6] border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Topo Estilo WhatsApp do Bot */}
          <div className="bg-[#1c3220] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#2d5a32] flex items-center justify-center border border-emerald-400/40">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{botConfig.nomeAssistente}</span>
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">Online</span>
                </h3>
                <p className="text-[11px] text-emerald-200/80 font-mono">
                  WhatsApp: {botConfig.whatsappSindicoBot}
                </p>
              </div>
            </div>
            {modoChat !== 'menu' && (
              <button
                type="button"
                onClick={() => {
                  setModoChat('menu');
                  setPassoReclamacao(1);
                }}
                className="text-[11px] bg-[#2d5a32] hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Menu Inicial
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Identificação do Remetente (Morador que está usando o Chat) */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-[#2d5a32] uppercase tracking-wider block">
                Identificação do Remetente (Morador)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Seu Nome *</label>
                  <input
                    type="text"
                    value={remetenteNome}
                    onChange={(e) => setRemetenteNome(e.target.value)}
                    placeholder="Ex: Carlos"
                    className="w-full bg-[#f8faf6] border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 outline-hidden focus:ring-1 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Unidade / Bloco *</label>
                  <input
                    type="text"
                    value={remetenteUnidade}
                    onChange={(e) => setRemetenteUnidade(e.target.value)}
                    placeholder="Bloco A - 402"
                    className="w-full bg-[#f8faf6] border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 outline-hidden focus:ring-1 focus:ring-[#2d5a32]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Seu WhatsApp</label>
                  <input
                    type="text"
                    value={remetenteWhatsapp}
                    onChange={(e) => setRemetenteWhatsapp(e.target.value)}
                    placeholder="554199..."
                    className="w-full bg-[#f8faf6] border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-900 outline-hidden focus:ring-1 focus:ring-[#2d5a32]"
                  />
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* MENU INICIAL DO CHATBOT: 3 OPÇÕES (1- FEEDBACK, 2- RECLAMAÇÃO, 3- SÍNDICO) */}
            {/* ===================================================================== */}
            {modoChat === 'menu' && (
              <div className="space-y-3">
                <div className="bg-emerald-50/90 border border-emerald-200 p-3.5 rounded-2xl rounded-tl-xs text-xs text-slate-800 space-y-1">
                  <p className="font-bold text-[#1c3220]">
                    👋 Olá, {remetenteNome || 'Morador'}! Bem-vindo ao atendimento inteligente do {botConfig.condominioNome}.
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Escolha uma das <strong>3 opções</strong> abaixo para iniciar:
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* OPÇÃO 1: FEEDBACK */}
                  <button
                    type="button"
                    onClick={() => setModoChat('feedback')}
                    className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#f2f5f1] border-2 border-slate-200 hover:border-[#2d5a32] text-left transition-all shadow-2xs hover:shadow-md cursor-pointer group flex items-center gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e8f0e6] text-[#2d5a32] flex items-center justify-center group-hover:bg-[#2d5a32] group-hover:text-white transition-colors shrink-0 font-black text-sm">
                      1
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-[#1c3220] flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#2d5a32]" />
                        <span>1 - Feedback</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Escreva elogios, sugestões ou melhorias. Sua mensagem cai direto no módulo do Síndico.
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d5a32] shrink-0" />
                  </button>

                  {/* OPÇÃO 2: RECLAMAÇÃO (4 PASSOS) */}
                  <button
                    type="button"
                    onClick={() => {
                      setModoChat('reclamacao');
                      setPassoReclamacao(1);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#f2f5f1] border-2 border-slate-200 hover:border-[#2d5a32] text-left transition-all shadow-2xs hover:shadow-md cursor-pointer group flex items-center gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:bg-[#1c3220] group-hover:text-amber-300 transition-colors shrink-0 font-black text-sm">
                      2
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-[#1c3220] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>2 - Reclamação (Em 4 Passos)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        1. Mensagem • 2. Bloco/Unidade destino • 3. Evidência p/ análise • 4. Aviso amigável no Wpp.
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d5a32] shrink-0" />
                  </button>

                  {/* OPÇÃO 3: FALAR COM SÍNDICO */}
                  <button
                    type="button"
                    onClick={() => setModoChat('falar_sindico')}
                    className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#f2f5f1] border-2 border-slate-200 hover:border-[#2d5a32] text-left transition-all shadow-2xs hover:shadow-md cursor-pointer group flex items-center gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1c3220] text-emerald-300 flex items-center justify-center group-hover:bg-[#2d5a32] group-hover:text-white transition-colors shrink-0 font-black text-sm">
                      3
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-[#1c3220] flex items-center gap-1.5">
                        <Headset className="w-4 h-4 text-[#2d5a32]" />
                        <span>3 - Falar com Síndico</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Registra o protocolo no painel e abre conversa direta com o WhatsApp do Síndico.
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d5a32] shrink-0" />
                  </button>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* OPÇÃO 1: FLUXO DE FEEDBACK                                            */}
            {/* ===================================================================== */}
            {modoChat === 'feedback' && (
              <form onSubmit={handleEnviarFeedback} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-[#1c3220] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#2d5a32]" />
                    <span>Opção 1 — Enviar Feedback</span>
                  </span>
                  <span className="text-[10px] bg-[#e8f0e6] text-[#2d5a32] font-bold px-2 py-0.5 rounded-full">
                    Vai para a Central
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-[11px] text-slate-700">
                  Escreva abaixo sua sugestão, elogio ou observação. Assim que enviar, sua mensagem constará no módulo do Chatbot do Síndico.
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Seu Feedback *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Digite aqui seu feedback, sugestão de melhoria ou comentário..."
                    value={feedbackTexto}
                    onChange={(e) => setFeedbackTexto(e.target.value)}
                    className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                  />
                </div>

                {feedbackEnviadoSucesso ? (
                  <div className="bg-emerald-800 text-white p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Feedback registrado com sucesso no módulo do Síndico!</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                  >
                    <Send className="w-4 h-4" /> Enviar Feedback
                  </button>
                )}
              </form>
            )}

            {/* ===================================================================== */}
            {/* OPÇÃO 2: FLUXO DE RECLAMAÇÕES DIVIDIDO EM 4 PASSOS                    */}
            {/* ===================================================================== */}
            {modoChat === 'reclamacao' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                {/* Barra de Progresso dos 4 Passos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1c3220]">
                    <span>Opção 2 — Reclamação em 4 Passos</span>
                    <span className="bg-[#e8f0e6] text-[#2d5a32] px-2 py-0.5 rounded-full">
                      Passo {passoReclamacao} de 4
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { num: 1, label: '1. Mensagem' },
                      { num: 2, label: '2. Destino' },
                      { num: 3, label: '3. Evidência' },
                      { num: 4, label: '4. Aviso Wpp' }
                    ].map((p) => (
                      <button
                        key={p.num}
                        type="button"
                        onClick={() => setPassoReclamacao(p.num as 1 | 2 | 3 | 4)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition cursor-pointer border ${
                          passoReclamacao === p.num
                            ? 'bg-[#2d5a32] text-white border-[#1c3220] shadow-xs'
                            : passoReclamacao > p.num
                            ? 'bg-emerald-100 text-[#2d5a32] border-emerald-300'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PASSO 1: O MORADOR ESCREVE A MENSAGEM */}
                {passoReclamacao === 1 && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900">
                      <strong>Passo 1:</strong> Escreva a mensagem relatando o ocorrido. <em>(A evidência será enviada no Passo 3 para análise da sindicância).</em>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Categoria da Reclamação *</label>
                      <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as ChamadoBot['categoria'])}
                        className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                      >
                        <option value="Barulho/Silêncio">Barulho / Lei do Silêncio</option>
                        <option value="Estacionamento">Estacionamento / Vaga de Garagem</option>
                        <option value="Obras fora de horário">Obras fora de horário</option>
                        <option value="Animais/Pets">Animais / Pets nas Áreas Comuns</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Mensagem da Reclamação (enviar evidência abaixo para análise) *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Descreva o ocorrido com detalhes (no Passo 3 você anexará a evidência para análise)..."
                        value={relatoReclamacao}
                        onChange={(e) => setRelatoReclamacao(e.target.value)}
                        className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!relatoReclamacao.trim()}
                      onClick={() => setPassoReclamacao(2)}
                      className="w-full bg-[#2d5a32] disabled:bg-slate-300 hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <span>Passo 2: Destinar a Alguém (Número e Bloco)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* PASSO 2: DESTINA A ALGUÉM (INFORMA O NÚMERO E BLOCO DO DESTINO) */}
                {passoReclamacao === 2 && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900">
                      <strong>Passo 2:</strong> Informe o <strong>Bloco</strong> e o <strong>Número da Unidade</strong> de destino da reclamação (se a planilha Excel do condomínio estiver anexada, os dados de WhatsApp são puxados automaticamente).
                    </div>

                    {todosMoradoresImportados.length > 0 && (
                      <div>
                        <label className="text-[11px] font-bold text-[#2d5a32] block mb-1">
                          Selecionar Unidade da Planilha do Condomínio ({todosMoradoresImportados.length} unidades):
                        </label>
                        <select
                          onChange={(e) => {
                            const mor = todosMoradoresImportados.find((m) => m.id === e.target.value);
                            if (mor) {
                              setBlocoDestino(mor.bloco);
                              setNumeroDestino(mor.unidade);
                              setMoradorAcusadoNome(mor.nomeMorador);
                              setMoradorAcusadoWhatsapp(mor.whatsapp);
                            }
                          }}
                          defaultValue=""
                          className="w-full bg-[#e8f0e6] border border-[#2d5a32]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#1c3220] outline-hidden"
                        >
                          <option value="">-- Escolher unidade cadastrada na planilha (Opcional) --</option>
                          {todosMoradoresImportados.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.bloco} - Unid. {m.unidade} ({m.nomeMorador}) {m.vagaGaragem ? `• Vaga ${m.vagaGaragem}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Bloco de Destino *</label>
                        <input
                          type="text"
                          placeholder="Ex: Bloco A / Torre 1"
                          value={blocoDestino}
                          onChange={(e) => setBlocoDestino(e.target.value)}
                          className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Número / Apto *</label>
                        <input
                          type="text"
                          placeholder="Ex: 302 / Casa 04"
                          value={numeroDestino}
                          onChange={(e) => setNumeroDestino(e.target.value)}
                          className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Destinatário</label>
                        <input
                          type="text"
                          placeholder="Ex: João Silva (Opcional)"
                          value={moradorAcusadoNome}
                          onChange={(e) => setMoradorAcusadoNome(e.target.value)}
                          className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp do Destinatário</label>
                        <input
                          type="text"
                          placeholder="5541999999999"
                          value={moradorAcusadoWhatsapp}
                          onChange={(e) => setMoradorAcusadoWhatsapp(e.target.value)}
                          className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPassoReclamacao(1)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        disabled={!numeroDestino.trim()}
                        onClick={() => setPassoReclamacao(3)}
                        className="flex-1 bg-[#2d5a32] disabled:bg-slate-300 hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <span>Passo 3: Enviar a Evidência</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PASSO 3: ENVIA A EVIDÊNCIA */}
                {passoReclamacao === 3 && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900">
                      <strong>Passo 3:</strong> Envie a evidência (foto, print, áudio ou descrição da prova) para análise da reclamação.
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-700/30 hover:border-[#2d5a32] bg-[#f8faf6] p-4 rounded-xl text-center cursor-pointer transition space-y-1.5"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,audio/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Paperclip className="w-6 h-6 text-[#2d5a32] mx-auto" />
                      <p className="text-xs font-bold text-[#1c3220]">
                        {evidenciaNome ? `Evidência anexada: ${evidenciaNome}` : 'Clique para anexar Foto, Áudio, Vídeo ou PDF'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Ou descreva abaixo o link/detalhe da evidência para análise
                      </p>
                    </div>

                    {evidenciaUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 max-h-32 bg-slate-100 flex items-center justify-center">
                        <img src={evidenciaUrl} alt="Evidência" className="max-h-32 object-contain" />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Descrição / Identificação da Evidência *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Foto do veículo na vaga G1-12 às 22h30 / Áudio de barulho"
                        value={evidenciaNome}
                        onChange={(e) => setEvidenciaNome(e.target.value)}
                        className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPassoReclamacao(2)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPassoReclamacao(4)}
                        className="flex-1 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <span>Passo 4: Aviso Amigável no WhatsApp</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PASSO 4: O BOT INFORMA NO WPP O RESPONSÁVEL DE FORMA AMIGÁVEL */}
                {passoReclamacao === 4 && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-950 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-[#1c3220]">
                        <Sparkles className="w-4 h-4 text-[#2d5a32]" />
                        <span>Passo 4: Bot Informa o Responsável no WhatsApp de Forma Amigável</span>
                      </p>
                      <p className="text-slate-600">
                        O Bot informa ao morador destinatário sobre a reclamação, avisa que a evidência passará por análise e alerta de forma amigável sobre as consequências previstas no Regimento Interno.
                      </p>
                    </div>

                    {/* Prévia da Mensagem Amigável do Bot */}
                    <div className="bg-[#f2f5f1] border border-slate-300 p-3 rounded-xl text-[11px] space-y-1.5 font-sans text-slate-800">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#2d5a32] border-b border-slate-200 pb-1">
                        <span>PRÉVIA DA MENSAGEM AMIGÁVEL NO WHATSAPP</span>
                        <span>Destino: Bloco {blocoDestino || 'Único'} - Unid. {numeroDestino}</span>
                      </div>
                      <p>
                        🤖 <strong>{botConfig.nomeAssistente}</strong>: Olá, <strong>{moradorAcusadoNome || `Morador(a) da Unid. ${numeroDestino}`}</strong>!
                      </p>
                      <p>
                        Recebemos um apontamento sobre <strong>{categoria}</strong>: <em>"{relatoReclamacao}"</em>
                      </p>
                      <p className="text-amber-900 bg-amber-50/80 px-2 py-1 rounded border border-amber-200">
                        📎 <strong>Evidência em análise:</strong> {evidenciaNome || 'Anexada pelo morador'}. Informamos que a reclamação será analisada pela sindicância e alertamos de forma amigável que a reincidência pode gerar advertências ou sanções do Regimento Interno.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleConcluirReclamacao(true)}
                        className="w-full bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                      >
                        <Send className="w-4 h-4" />
                        <span>Registrar e Disparar Aviso Amigável no WhatsApp (R$ 0,00)</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPassoReclamacao(3)}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConcluirReclamacao(false)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#1c3220] border border-slate-300 font-bold py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition"
                        >
                          <span>Apenas Registrar no Painel (Síndico Dispara Depois)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===================================================================== */}
            {/* OPÇÃO 3: FALAR COM SÍNDICO (ATENDIMENTO DIRETO)                       */}
            {/* ===================================================================== */}
            {modoChat === 'falar_sindico' && (
              <form onSubmit={handleFalarComSindico} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-[#1c3220] flex items-center gap-1.5">
                    <Headset className="w-4 h-4 text-[#2d5a32]" />
                    <span>Opção 3 — Falar Diretamente com o Síndico</span>
                  </span>
                  <span className="text-[10px] bg-[#1c3220] text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    WhatsApp Direto
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-[11px] text-slate-700">
                  Informe o assunto abaixo. O chamado ficará registrado na Central do Síndico e abrirá imediatamente a conversa no WhatsApp oficial do Síndico (<strong>{botConfig.whatsappSindicoBot}</strong>).
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nível de Prioridade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Normal', 'Urgente'] as const).map((niv) => (
                      <button
                        key={niv}
                        type="button"
                        onClick={() => setUrgenciaSindico(niv)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          urgenciaSindico === niv
                            ? niv === 'Urgente'
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : 'bg-[#2d5a32] text-white border-[#1c3220] shadow-xs'
                            : 'bg-[#f8faf6] text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {niv === 'Urgente' ? '⚡ Urgente' : '📋 Atendimento Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Motivo do Contato / Mensagem ao Síndico *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Descreva brevemente o assunto que deseja tratar com o Síndico..."
                    value={assuntoSindico}
                    onChange={(e) => setAssuntoSindico(e.target.value)}
                    className="w-full bg-[#f8faf6] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#2d5a32] outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1c3220] hover:bg-[#2d5a32] text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-300" />
                  <span>Registrar e Abrir Conversa c/ Síndico no WhatsApp</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA (7 cols): PAINEL DO SÍNDICO (REMETENTE, DESTINATÁRIO, ETC) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1c3220]">
                Central do Chatbot do Síndico — Histórico Completo ({chamadosFiltrados.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Conste todas as <strong>Reclamações</strong>, <strong>Feedbacks</strong> e <strong>Solicitações ao Síndico</strong> com Remetente e Destinatário
              </p>
            </div>

            {/* Filtros Rápidos das 3 Opções */}
            <div className="flex flex-wrap items-center gap-1 bg-[#f2f5f1] p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setFiltroCentral('todos')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  filtroCentral === 'todos' ? 'bg-[#1c3220] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({chamados.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroCentral('feedback')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  filtroCentral === 'feedback' ? 'bg-[#2d5a32] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Feedbacks ({totalFeedbacks})
              </button>
              <button
                type="button"
                onClick={() => setFiltroCentral('reclamacao')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  filtroCentral === 'reclamacao' ? 'bg-[#2d5a32] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Reclamações ({totalReclamacoes})
              </button>
              <button
                type="button"
                onClick={() => setFiltroCentral('falar_sindico')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  filtroCentral === 'falar_sindico' ? 'bg-[#2d5a32] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Síndico ({totalFalarSindico})
              </button>
            </div>
          </div>

          {chamadosFiltrados.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl bg-[#f8faf6] text-xs text-slate-500">
              Nenhum registro encontrado neste filtro. Utilize o Chatbot ao lado nas opções <strong>1 - Feedback</strong>, <strong>2 - Reclamação</strong> ou <strong>3 - Falar com Síndico</strong>.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {chamadosFiltrados.map((c) => {
                const isFeedback = c.tipo === 'feedback' || c.categoria === 'Feedback/Sugestão';
                const isFalarSindico = c.tipo === 'falar_sindico' || c.categoria === 'Atendimento Direto c/ Síndico';

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border shadow-2xs transition-all space-y-3 ${
                      isFeedback
                        ? 'bg-[#f8faf6] border-emerald-200'
                        : isFalarSindico
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Topo do Card: Tipo, Categoria, Data e Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isFeedback
                              ? 'bg-[#2d5a32] text-white'
                              : isFalarSindico
                              ? 'bg-amber-600 text-white'
                              : 'bg-[#1c3220] text-amber-300'
                          }`}
                        >
                          {isFeedback
                            ? '1️⃣ Feedback'
                            : isFalarSindico
                            ? '3️⃣ Falar com Síndico'
                            : `2️⃣ Reclamação • ${c.categoria}`}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono font-bold">{c.id}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{c.criadoEm}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            c.status === 'aguardando_sindico'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : c.status === 'resolvido'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {c.status === 'aguardando_sindico'
                            ? '📋 Aguardando Síndico'
                            : c.status === 'resolvido'
                            ? '✅ Analisado / Resolvido'
                            : '🤖 Avisado via WhatsApp (Grátis)'}
                        </span>
                        <button
                          onClick={() => removerChamado(c.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Excluir registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quadro Remetente -> Destinatário bem claro */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#f2f5f1] p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-[#2d5a32] shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Remetente (Quem enviou)
                          </span>
                          <p className="font-bold text-slate-900 truncate">
                            {c.reclamanteNome || 'Morador'}
                          </p>
                          <p className="text-[11px] text-[#2d5a32] font-semibold truncate">
                            {c.reclamanteUnidade || 'Unidade não informada'}
                            {c.reclamanteWhatsapp ? ` • Wpp: ${c.reclamanteWhatsapp}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 min-w-0 border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-3">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-[#1c3220] shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Destinatário (Para quem foi)
                          </span>
                          <p className="font-bold text-slate-900 truncate">
                            {c.moradorAcusadoNome || 'Responsável da Unidade'}
                          </p>
                          <p className="text-[11px] text-amber-800 font-semibold truncate">
                            {c.blocoDestino || c.numeroDestino
                              ? `Bloco ${c.blocoDestino || '-'} • Unid. ${c.numeroDestino || '-'}`
                              : c.unidadeAcusada}
                            {c.moradorAcusadoWhatsapp ? ` • Wpp: ${c.moradorAcusadoWhatsapp}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mensagem / Relato */}
                    <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2">
                      <p className="text-xs text-slate-800 leading-relaxed">
                        <strong className="text-[#1c3220]">Mensagem:</strong> "{c.relato}"
                      </p>

                      {/* Evidência Anexada (se houver) */}
                      {(c.evidenciaNome || c.evidenciaUrl) && (
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#2d5a32] font-semibold">
                            {c.evidenciaUrl ? (
                              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>Evidência para análise: {c.evidenciaNome || 'Imagem anexada'}</span>
                          </div>
                          {c.evidenciaUrl && (
                            <a
                              href={c.evidenciaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] bg-[#e8f0e6] text-[#2d5a32] px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-200 transition self-start"
                            >
                              Ver Foto da Evidência
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ações Rápidas do Síndico */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Botão para Reclamação: Enviar Aviso Amigável ao Destinatário via wa.me */}
                      {!isFeedback && !isFalarSindico && (
                        <a
                          href={gerarMensagemAmigavelWhatsApp(c)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => marcarNotificadoWpp(c.id)}
                          className="text-[11px] bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Enviar Aviso Amigável no WhatsApp (R$ 0,00)</span>
                        </a>
                      )}

                      {/* Botão para responder ao Morador Remetente no WhatsApp (se informou WhatsApp) */}
                      {c.reclamanteWhatsapp && (
                        <a
                          href={gerarLinkRespostaAoMorador(c)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] bg-[#1c3220] hover:bg-[#2d5a32] text-emerald-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Responder Morador no WhatsApp</span>
                        </a>
                      )}

                      {!isFeedback && !c.precisaAtendimentoHumano && c.status !== 'resolvido' && (
                        <button
                          type="button"
                          onClick={() => escalarParaSindico(c.id)}
                          className="text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition border border-amber-300"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          <span>Em Análise pelo Síndico</span>
                        </button>
                      )}

                      {c.status !== 'resolvido' && (
                        <button
                          type="button"
                          onClick={() => marcarComoResolvido(c.id)}
                          className="text-[11px] bg-slate-100 hover:bg-emerald-700 text-slate-700 hover:text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition border border-slate-200"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Marcar como Analisado / Resolvido</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
