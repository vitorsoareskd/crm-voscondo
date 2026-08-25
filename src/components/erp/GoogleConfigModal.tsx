import React, { useState } from 'react';
import { GoogleConfig } from '../../types';
import { 
  getStoredGoogleConfig, 
  saveGoogleConfig, 
  requestGoogleAccessToken, 
  logoutGoogle, 
  isGoogleTokenValid 
} from '../../services/googleAuth';
import { 
  X, 
  Calendar, 
  CheckSquare, 
  ShieldCheck, 
  ExternalLink, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface GoogleConfigModalProps {
  onClose: () => void;
  onConfigUpdated?: (config: GoogleConfig) => void;
}

export const GoogleConfigModal: React.FC<GoogleConfigModalProps> = ({ onClose, onConfigUpdated }) => {
  const [config, setConfig] = useState<GoogleConfig>(() => getStoredGoogleConfig());
  const [clientIdInput, setClientIdInput] = useState(config.clientId || '');
  const [manualTokenInput, setManualTokenInput] = useState(config.accessToken || '');
  const [showGuide, setShowGuide] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isValid = isGoogleTokenValid(config);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GoogleConfig = {
      ...config,
      clientId: clientIdInput.trim()
    };
    saveGoogleConfig(updated);
    setConfig(updated);
    if (onConfigUpdated) onConfigUpdated(updated);
    setStatusMessage({ type: 'success', text: 'Client ID salvo com sucesso!' });
  };

  const handleConnectGoogle = async () => {
    const trimmedId = clientIdInput.trim();
    if (!trimmedId) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Por favor, insira o seu Google Client ID antes de conectar.' 
      });
      setShowGuide(true);
      return;
    }

    if (trimmedId.startsWith('AIza')) {
      setStatusMessage({
        type: 'error',
        text: 'Atenção: Você colou uma Chave de API (API Key que começa com "AIza..."). Você precisa colar o "ID do cliente OAuth" (termina com ".apps.googleusercontent.com").'
      });
      setShowGuide(true);
      return;
    }

    if (trimmedId.startsWith('GOCSPX-')) {
      setStatusMessage({
        type: 'error',
        text: 'Atenção: Você colou a Chave Secreta do Cliente (Client Secret "GOCSPX-..."). Você precisa colar o "ID do cliente OAuth" (termina com ".apps.googleusercontent.com").'
      });
      setShowGuide(true);
      return;
    }

    if (!trimmedId.includes('.apps.googleusercontent.com')) {
      setStatusMessage({
        type: 'info',
        text: 'Dica: O ID do Cliente do Google geralmente termina com ".apps.googleusercontent.com". Tentando conectar...'
      });
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      // Save client ID first
      const updatedConfig = { ...config, clientId: trimmedId };
      saveGoogleConfig(updatedConfig);

      const res = await requestGoogleAccessToken(trimmedId);
      setConfig(res);
      if (onConfigUpdated) onConfigUpdated(res);
      setStatusMessage({ 
        type: 'success', 
        text: `Conectado com sucesso à conta Google (${res.userEmail || 'Autorizado'})!` 
      });
    } catch (err: any) {
      console.error('Erro na autenticação Google:', err);
      let msg = 'Erro ao autenticar com o Google.';
      if (err.message === 'CLIENT_ID_MISSING') {
        msg = 'Client ID não configurado.';
      } else if (err.message?.includes('popup_closed_by_user')) {
        msg = 'A janela de login do Google foi fechada antes da autorização.';
      } else if (err.message?.includes('access_denied')) {
        msg = 'Acesso não autorizado. Certifique-se de adicionar seu e-mail como "Usuário de Teste" na Tela de Permissão OAuth do Google Cloud.';
      } else if (err.message?.includes('origin_mismatch') || err.message?.includes('unregistered_origin')) {
        msg = `Origem não autorizada no Google Cloud. Adicione "${window.location.origin}" em "Origens JavaScript autorizadas" no seu Client ID no Google Cloud Console.`;
      } else if (err.message) {
        msg = `Erro: ${err.message}`;
      }
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    const reset = logoutGoogle();
    setConfig(reset);
    if (onConfigUpdated) onConfigUpdated(reset);
    setStatusMessage({ type: 'info', text: 'Conta Google desconectada.' });
  };

  const handleApplyManualToken = () => {
    if (!manualTokenInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Insira um token de acesso válido.' });
      return;
    }

    const updated: GoogleConfig = {
      ...config,
      accessToken: manualTokenInput.trim(),
      tokenExpiresAt: Date.now() + 3600 * 1000,
      userEmail: config.userEmail || 'Modo Manual'
    };

    saveGoogleConfig(updated);
    setConfig(updated);
    if (onConfigUpdated) onConfigUpdated(updated);
    setStatusMessage({ type: 'success', text: 'Token manual aplicado com sucesso!' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#1c3220] text-white p-6 flex items-center justify-between border-b border-[#2d5a32]">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Integração Oficial Google API</h3>
              <p className="text-xs text-emerald-200/80">
                Sincronize com o Google Calendar (Agenda) e Google Tasks (Tarefas)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700 text-xs">
          
          {/* Feedback Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                  isValid
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-200 text-slate-500 border border-slate-300'
                }`}
              >
                {config.userPicture ? (
                  <img
                    src={config.userPicture}
                    alt="Google User"
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Status da Conexão</span>
                  {isValid ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      CONECTADO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full">
                      NÃO CONECTADO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isValid
                    ? `Conta vinculada: ${config.userEmail || 'Google Autorizado'}`
                    : 'Conecte sua conta para habilitar o envio automático para o Google'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {isValid ? (
                <button
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer w-full md:w-auto justify-center"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  disabled={loading}
                  className="px-4 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer w-full md:w-auto justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>Conectar com Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Features Supported Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[#2d5a32] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Google Agenda (Calendar)</h4>
                <p className="text-[11px] text-slate-600">
                  Sincroniza assembleias, vistorias e lembretes com repetições diárias, semanais e mensais.
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5">
              <CheckSquare className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Google Tasks (Tarefas)</h4>
                <p className="text-[11px] text-slate-600">
                  Envia demandas operacionais, prazos e prioridades direto para a lista do Google da equipe.
                </p>
              </div>
            </div>
          </div>

          {/* Google Client ID Form */}
          <form onSubmit={handleSaveClientId} className="space-y-3 bg-white p-4 border border-slate-200 rounded-xl">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Key className="w-3.5 h-3.5 text-slate-600" />
                  Google OAuth Client ID (ID do Cliente)
                </label>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-[#2d5a32] hover:underline flex items-center gap-1 text-[11px] font-semibold"
                >
                  <HelpCircle className="w-3 h-3" />
                  {showGuide ? 'Ocultar Tutorial' : 'Como obter meu Client ID?'}
                  {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: 1234567890-abcdefg.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#2d5a32] focus:border-[#2d5a32] outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shrink-0"
                >
                  Salvar ID
                </button>
              </div>
            </div>
          </form>

          {/* Step-by-Step Guide Accordion */}
          {showGuide && (
            <div className="bg-emerald-900/5 border border-[#2d5a32]/20 rounded-xl p-4 space-y-3 text-slate-700 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-[#2d5a32]/20 pb-2">
                <h4 className="font-bold text-[#1c3220] flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#2d5a32]" />
                  Passo a Passo: Criando suas credenciais no Google Cloud
                </h4>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#2d5a32] hover:underline flex items-center gap-1"
                >
                  <span>Abrir Google Cloud Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-600">
                <li>
                  Acesse o <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-[#2d5a32] underline font-bold">console.cloud.google.com</a>) e selecione ou crie um projeto.
                </li>
                <li>
                  No menu lateral, vá em <strong>APIs e Serviços &gt; Biblioteca</strong> e ative:
                  <ul className="list-disc list-inside ml-4 mt-1 font-semibold text-slate-800">
                    <li>Google Calendar API</li>
                    <li>Google Tasks API</li>
                  </ul>
                </li>
                <li>
                  Vá em <strong>APIs e Serviços &gt; Tela de permissão OAuth</strong>:
                  <ul className="list-disc list-inside ml-4 mt-0.5 text-slate-700">
                    <li>Escolha <strong>Externo</strong> e clique em <em>Criar</em>.</li>
                    <li>Preencha o Nome do App (ex: <code>VOS Condomínios</code>) e seu e-mail.</li>
                    <li>Na etapa <strong>Usuários de teste</strong>, adicione o <strong>seu e-mail do Gmail</strong> que vai conectar ao sistema.</li>
                  </ul>
                </li>
                <li>
                  Vá em <strong>APIs e Serviços &gt; Credenciais &gt; Criar Credenciais &gt; ID do cliente OAuth</strong>.
                </li>
                <li>
                  Selecione o tipo <strong>Aplicativo da Web</strong> (Web application).
                </li>
                <li>
                  Em <strong>Origens JavaScript autorizadas</strong> (URIs), clique em <em>Adicionar URI</em> e cole exatamente:
                  <code className="block bg-white p-1.5 rounded border border-slate-300 text-[#2d5a32] font-mono text-[11px] my-1 font-bold select-all">
                    {window.location.origin}
                  </code>
                </li>
                <li>
                  Clique em <strong>Criar</strong>. O Google exibirá seu <strong>ID do cliente</strong> (que termina com <code>.apps.googleusercontent.com</code>).
                </li>
                <li>
                  Copie esse código, cole no campo acima, clique em <strong>Salvar ID</strong> e depois em <strong>Conectar com Google</strong>!
                </li>
              </ol>
            </div>
          )}

          {/* Advanced / Developer Token Input */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center gap-1"
            >
              <span>{showAdvanced ? '[-] Ocultar Modo Desenvolvedor / Token Manual' : '[+] Modo Desenvolvedor / Inserir Token Manual'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 bg-slate-100 rounded-xl space-y-2 text-xs">
                <label className="block font-bold text-slate-700 text-[11px]">
                  Access Token OAuth 2.0 (Bearer Token)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="ya29.a0AfH6..."
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                  <button
                    onClick={handleApplyManualToken}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
                  >
                    Aplicar Token
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Útil para testes imediatos utilizando tokens gerados via Google OAuth 2.0 Playground.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            {isValid ? '🟢 Integração ativa e pronta para sincronismo.' : '⚪ Conexão pendente de autorização.'}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2d5a32] hover:bg-[#1f4223] text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            Concluir / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
