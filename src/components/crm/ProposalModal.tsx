import React, { useState } from 'react';
import { Condominio, ServicoExtra } from '../../types';
import { calcularMensalidade, formatarMoeda } from '../../utils/pricingEngine';
import { FileText, Printer, Download, Check, X, Building, ShieldCheck, DollarSign, Calendar } from 'lucide-react';
import { VosLogo } from '../VosLogo';

interface ProposalModalProps {
  condominio: Condominio;
  servicosExtras: ServicoExtra[];
  onClose: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ condominio, servicosExtras, onClose }) => {
  const [documentType, setDocumentType] = useState<'proposta' | 'contrato'>('proposta');
  const [copied, setCopied] = useState(false);

  const calc = calcularMensalidade(
    condominio.unidades,
    condominio.complexidade,
    condominio.plano,
    condominio.fatorAjuste
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = document.getElementById('printable-doc')?.innerText || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-900/10">
        
        {/* Header Controls (Hidden on print) */}
        <div className="bg-[#1c3220] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-800/80 p-2 rounded-lg border border-emerald-600/40">
              <FileText className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-50">Gerador de Documentos Oficiais</h2>
              <p className="text-xs text-emerald-200/80">{condominio.nome} • {condominio.unidades} unidades</p>
            </div>
          </div>

          {/* Doc Switcher */}
          <div className="flex items-center gap-2 bg-[#122215] p-1 rounded-lg border border-[#2b4c2f]">
            <button
              onClick={() => setDocumentType('proposta')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                documentType === 'proposta'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              1. Carta Proposta
            </button>
            <button
              onClick={() => setDocumentType('contrato')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                documentType === 'contrato'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              2. Contrato de Prestação de Serviços
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-emerald-100 text-xs px-3 py-1.5 rounded-lg border border-emerald-600/50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200/70 hover:text-white hover:bg-emerald-900/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content Scroll Area */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-[#fafbfc] text-slate-800 flex-1 font-sans text-sm print:p-0 print:bg-white print:overflow-visible">
          <div id="printable-doc" className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 max-w-3xl mx-auto">

            {/* DOCUMENT TYPE 1: CARTA PROPOSTA */}
            {documentType === 'proposta' && (
              <div className="space-y-8">
                {/* Header Logo */}
                <div className="flex items-start justify-between border-b pb-6 border-emerald-900/10">
                  <VosLogo variant="header" onDarkBg={false} size="lg" />
                  <div className="text-right text-xs text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-700">{dataAtual}</p>
                    <p className="font-semibold text-emerald-800">VOS CONDO ADMINISTRADORA</p>
                    <p>CNPJ: 66.072.162/0001-43</p>
                    <p>TEL: (41) 93300-0513</p>
                  </div>
                </div>

                {/* Recipient Box */}
                <div className="bg-[#f4f7f3] p-4 rounded-xl border border-[#d3e2d1] space-y-1">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#2d5a32]">Proposta Comercial Elaborada Para:</p>
                  <h3 className="text-lg font-bold text-slate-900">{condominio.nome}</h3>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">CNPJ:</span> {condominio.cnpj || 'Em cadastro'} • <span className="font-semibold">Unidades:</span> {condominio.unidades} • <span className="font-semibold">Endereço:</span> {condominio.endereco}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Síndico Responsável:</span> {condominio.sindicoResponsavel} ({condominio.emailCondominio})
                  </p>
                </div>

                {/* Plans & Features Grid */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#1c3220] border-b pb-1 border-slate-200">
                    PLANOS DE GESTÃO CONDOMINIAL
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Vos Essencial */}
                    <div className={`p-4 rounded-xl border ${condominio.plano === 'Vos Essencial' ? 'border-[#2d5a32] bg-[#f0f6ef] ring-2 ring-[#2d5a32]/20' : 'border-slate-200 bg-white'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm text-[#1c3220]">Vos Essencial</h4>
                        {condominio.plano === 'Vos Essencial' && <span className="bg-[#2d5a32] text-white px-2 py-0.5 rounded text-[10px] font-bold">SELECIONADO</span>}
                      </div>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        <li>Emissão de boletos e gestão de contas.</li>
                        <li>Conciliação bancária e emissão de balancete mensal.</li>
                        <li>Notificações automáticas de atraso (sistema).</li>
                        <li>Previsão orçamentária anual automática.</li>
                        <li>Cadastro de moradores e organização documental.</li>
                        <li>Orientação jurídica administrativa básica.</li>
                        <li>Acesso ao aplicativo para moradores.</li>
                        <li>Transparência financeira online em tempo real.</li>
                        <li>Suporte ao síndico em nível Básico.</li>
                      </ul>
                    </div>

                    {/* Vos Pulse */}
                    <div className={`p-4 rounded-xl border ${condominio.plano === 'Vos Pulse' ? 'border-[#2d5a32] bg-[#f0f6ef] ring-2 ring-[#2d5a32]/20' : 'border-slate-200 bg-white'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm text-[#1c3220]">Vos Pulse</h4>
                        {condominio.plano === 'Vos Pulse' && <span className="bg-[#2d5a32] text-white px-2 py-0.5 rounded text-[10px] font-bold">SELECIONADO</span>}
                      </div>
                      <p className="font-semibold text-slate-700 mb-1">Contempla todos os serviços do Essencial, mais:</p>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        <li>Controle de vencimento de contratos (seguros, manutenções).</li>
                        <li>Triagem de chamados e moderação de comunicados.</li>
                        <li>Pulse do Condomínio: Relatório mensal de saúde em PDF.</li>
                        <li>Indicação de fornecedores homologados.</li>
                        <li>Apoio técnico remoto (análise de orçamentos).</li>
                        <li>Suporte ao síndico em nível Prioritário.</li>
                      </ul>
                    </div>

                    {/* Vos 360 */}
                    <div className={`p-4 rounded-xl border ${condominio.plano === 'Vos 360' ? 'border-[#2d5a32] bg-[#f0f6ef] ring-2 ring-[#2d5a32]/20' : 'border-slate-200 bg-white'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm text-[#1c3220]">Vos 360</h4>
                        {condominio.plano === 'Vos 360' && <span className="bg-[#2d5a32] text-white px-2 py-0.5 rounded text-[10px] font-bold">SELECIONADO</span>}
                      </div>
                      <p className="font-semibold text-slate-700 mb-1">Contempla todos os serviços do Pulse & Essencial, mais:</p>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        <li>Controle e negociação ativa de inadimplência.</li>
                        <li>Consultoria Financeira Estratégica inclusa.</li>
                        <li>Relatório PDF + Reunião mensal de alinhamento.</li>
                        <li>Apoio na convocação e pauta de assembleias.</li>
                        <li>Registro de atas simples e condução virtual.</li>
                        <li>Suporte ao síndico em nível Dedicado.</li>
                      </ul>
                    </div>

                    {/* Vos Starter */}
                    <div className={`p-4 rounded-xl border ${condominio.plano === 'Vos Starter' ? 'border-[#2d5a32] bg-[#f0f6ef] ring-2 ring-[#2d5a32]/20' : 'border-slate-200 bg-white'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm text-[#1c3220]">Vos Starter</h4>
                        {condominio.plano === 'Vos Starter' && <span className="bg-[#2d5a32] text-white px-2 py-0.5 rounded text-[10px] font-bold">SELECIONADO</span>}
                      </div>
                      <p className="font-semibold text-slate-700 mb-1">Excelente para pequenos condomínios:</p>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        <li>Acesso total ao sistema com todas as funcionalidades.</li>
                        <li>Plataforma digital completa (uCondo).</li>
                        <li>Administração simplificada e direta pelo síndico.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Pricing Table Summary */}
                <div className="bg-[#1c3220] text-white p-6 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">PLANO CONTRATADO</span>
                      <h4 className="text-xl font-black text-white">{condominio.plano}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">MENSALIDADE FIXA</span>
                      <p className="text-2xl font-black text-emerald-300">{formatarMoeda(calc.valorFinal)} <span className="text-xs font-normal text-emerald-100">/mês</span></p>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-200/90 italic border-t border-emerald-800/80 pt-2.5">
                    * Não temos plano de fidelidade obrigatório e não cobramos 13º salário administrativo.
                  </p>
                </div>

                {/* Extra Services Table */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#1c3220] border-b pb-1 border-slate-200">
                    TABELA DE SERVIÇOS EXTRAS E SOB DEMANDA
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#f0f4ef] text-[#1c3220] font-bold">
                        <tr>
                          <th className="p-2.5">Serviço / Rubrica</th>
                          <th className="p-2.5">Categoria</th>
                          <th className="p-2.5">Valor Unitário</th>
                          <th className="p-2.5">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {servicosExtras.map((se) => (
                          <tr key={se.id}>
                            <td className="p-2.5 font-semibold text-slate-900">{se.nome}</td>
                            <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">{se.categoria}</span></td>
                            <td className="p-2.5 font-bold text-emerald-800">
                              {se.valorUnitario > 0 ? `${formatarMoeda(se.valorUnitario)} / ${se.unidade}` : 'Sob Orçamento'}
                            </td>
                            <td className="p-2.5 text-slate-500">{se.descricao}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures placeholder */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
                  <div className="space-y-1">
                    <div className="border-b border-slate-400 w-3/4 mx-auto mb-2"></div>
                    <p className="font-bold text-slate-900">VOS CONDO ADMINISTRADORA LTDA</p>
                    <p>CNPJ: 66.072.162/0001-43</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-b border-slate-400 w-3/4 mx-auto mb-2"></div>
                    <p className="font-bold text-slate-900">CONDOMÍNIO {condominio.nome.toUpperCase()}</p>
                    <p>Síndico: {condominio.sindicoResponsavel}</p>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT TYPE 2: CONTRATO DE PRESTAÇÃO DE SERVIÇOS */}
            {documentType === 'contrato' && (
              <div className="space-y-6 text-xs text-slate-800 leading-relaxed font-sans">
                <div className="text-center space-y-1 border-b pb-4 border-slate-200">
                  <h2 className="text-lg font-black text-[#1c3220] tracking-wide font-serif uppercase">
                    CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ADMINISTRAÇÃO E GESTÃO CONDOMINIAL DIGITAL
                  </h2>
                </div>

                {/* Partes Contratantes */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p>
                    <strong>CONTRATADA:</strong> <strong>VOS CONDO ADMINISTRADORA LTDA</strong>, inscrita no CNPJ sob o nº 66.072.162/0001-43, com sede na cidade de Curitiba/PR, representada neste ato por seu sócio-administrador.
                  </p>
                  <p>
                    <strong>CONTRATANTE:</strong> <strong>CONDOMÍNIO {condominio.nome.toUpperCase()}</strong>, inscrito no CNPJ sob o nº {condominio.cnpj || '__________________'}, situado na {condominio.endereco}, representado neste ato por seu(sua) Síndico(a) eleito(a), Sr(a). <strong>{condominio.sindicoResponsavel}</strong>, conforme Ata de Assembleia de Eleição em vigor.
                  </p>
                </div>

                {/* Cláusula Primeira */}
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1c3220] uppercase text-xs">CLÁUSULA PRIMEIRA – DO OBJETO</h3>
                  <p className="text-slate-700">
                    O presente contrato tem por objeto a prestação de serviços de administração condominial e gestão financeira pela CONTRATADA, através de plataforma de software 100% digital, abrangendo a gestão de contas a pagar e receber, emissão de boletos, disponibilização de prestação de contas mensal e assessoria consultiva operacional, estritamente nos limites do plano contratado no Quadro Resumo.
                  </p>
                </div>

                {/* Cláusula Segunda */}
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1c3220] uppercase text-xs">CLÁUSULA SEGUNDA – DO MODELO OPERACIONAL (100% DIGITAL)</h3>
                  <p className="text-slate-700 mb-1">2.1. A CONTRATADA opera em modelo estritamente digital. A CONTRATANTE declara ter plena ciência e concordância de que:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-2 text-slate-600">
                    <li>Toda a comunicação, avisos, boletos, balancetes, reservas de espaço e aberturas de chamados serão disponibilizados e realizados exclusivamente via aplicativo e plataforma eletrônica terceirizada (uCondo).</li>
                    <li>Não haverá, sob nenhuma hipótese, emissão, impressão ou envio de boletos, relatórios, atas e balancetes em papel, premissa esta que compõe a base de redução de custos do plano ora contratado e a política de sustentabilidade da operação.</li>
                  </ol>
                </div>

                {/* Cláusula Terceira */}
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1c3220] uppercase text-xs">CLÁUSULA TERCEIRA – DOS VALORES, MARCO TEMPORAL DE FATURAMENTO E REAJUSTE</h3>
                  <p className="text-slate-700">3.1. Do Valor Mensal: Pela prestação dos serviços, o CONTRATANTE pagará à CONTRATADA o valor mensal correspondente ao plano selecionado no Quadro Resumo deste contrato.</p>
                  <p className="text-slate-700">3.2. Ausência de 13ª Taxa: Fica expressamente estabelecido que a CONTRATADA não cobrará nenhuma taxa extraordinária ou faturamento adicional a título de "13º salário administrativo".</p>
                  <p className="text-slate-700">3.3. Do Início do Faturamento (Regra dos Atos Vinculados): Este contrato possui validade jurídica imediata a partir da sua assinatura. Contudo, o faturamento da primeira mensalidade cheia ocorrerá obrigatoriamente no mês subsequente à ocorrência do último dos seguintes eventos: (a) A assinatura eletrônica deste instrumento por ambas as partes; E (b) O envio completo da massa de dados por parte da CONTRATANTE.</p>
                  <p className="text-slate-700">3.4. Do Reajuste Anual e Negociação: A cada período de 12 meses de vigência deste contrato, o valor será atualizado com base no índice IPCA/IBGE do período.</p>
                </div>

                {/* Cláusula Quarta */}
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1c3220] uppercase text-xs">CLÁUSULA QUARTA – DOS NÍVEIS DE SERVIÇO (SLA) E DEFINIÇÕES DE ESCOPO</h3>
                  <p className="text-slate-700">4.1. Horário de Atendimento Humano: Dias úteis (segunda a sexta-feira), das 09:00h às 18:00h.</p>
                  <p className="text-slate-700 font-semibold">4.2. Canais e Prazos de Resposta de Suporte ao Síndico:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                    <li><strong>Suporte Básico (Plano Essencial):</strong> Via e-mail ou ticket interno. Prazo de resposta de até 18 horas úteis. Limite de até 02 demandas simultâneas.</li>
                    <li><strong>Suporte Prioritário (Plano Pulse):</strong> Via plataforma ou WhatsApp Business. Prazo de resposta de até 9 horas úteis. Limite de até 04 demandas simultâneas.</li>
                    <li><strong>Suporte Dedicado (Plano 360):</strong> Via WhatsApp direto da gerência. Prazo de resposta de até 04 horas úteis + 01 reunião mensal de alinhamento (60 min).</li>
                  </ul>
                </div>

                {/* Cláusula Quinta */}
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1c3220] uppercase text-xs">CLÁUSULA QUINTA – VIGÊNCIA, RESCISÃO E TRANSIÇÃO (OFFBOARDING)</h3>
                  <p className="text-slate-700">5.1. Vigência: O presente contrato é celebrado por prazo indeterminado, sem multa rescisória, mediante aviso prévio por escrito de 30 (trinta) dias.</p>
                </div>

                {/* Cláusula Sexta, Sétima, Oitava, Nona */}
                <div className="space-y-1">
                  <h3 className="font-bold text-[#1c3220] uppercase text-xs">CLÁUSULAS SEXTA A NONA – LIMITAÇÕES TÉCNICAS, LGPD E FORO</h3>
                  <p className="text-slate-700">
                    As vistorias possuem caráter estritamente consultivo e visual, não constituindo laudo de engenharia pericial (ART/TRT). Ambas as partes cumprem a LGPD (Lei nº 13.709/2018). Fica eleito o foro da Comarca de Curitiba/PR.
                  </p>
                </div>

                {/* Quadro Resumo */}
                <div className="bg-[#f0f6ef] p-4 rounded-xl border border-[#2d5a32]/30 space-y-2 mt-4">
                  <h3 className="font-black text-[#1c3220] text-sm uppercase">QUADRO RESUMO DE SERVIÇOS E VALORES</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-600 block">PLANO SELECIONADO:</span>
                      <span className="font-black text-slate-900 text-sm">{condominio.plano}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 block">VALOR MENSAL FIXO CONTRATADO:</span>
                      <span className="font-black text-[#2d5a32] text-base">{formatarMoeda(calc.valorFinal)} /mês</span>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-10 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-1">
                    <p className="font-bold">Curitiba, {dataAtual}</p>
                    <div className="border-b border-slate-400 w-4/5 mx-auto my-4"></div>
                    <p className="font-bold text-slate-900">VOS CONDO ADMINISTRADORA LTDA</p>
                    <p className="text-slate-500">CNPJ 66.072.162/0001-43</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">CONDOMÍNIO {condominio.nome.toUpperCase()}</p>
                    <div className="border-b border-slate-400 w-4/5 mx-auto my-4"></div>
                    <p className="font-bold text-slate-900">Síndico(a): {condominio.sindicoResponsavel}</p>
                    <p className="text-slate-500">CNPJ: {condominio.cnpj || '__________________'}</p>
                  </div>
                </div>

                {/* Witnesses */}
                <div className="pt-4 text-xs text-slate-600 space-y-2">
                  <p className="font-bold text-slate-800">TESTEMUNHAS:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p>1. _____________________________________________</p>
                      <p className="text-[11px] text-slate-500">Nome: [Funcionário VOS A] • CPF: [XXX.XXX.XXX-XX]</p>
                    </div>
                    <div>
                      <p>2. _____________________________________________</p>
                      <p className="text-[11px] text-slate-500">Nome: [Funcionário VOS B] • CPF: [XXX.XXX.XXX-XX]</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
