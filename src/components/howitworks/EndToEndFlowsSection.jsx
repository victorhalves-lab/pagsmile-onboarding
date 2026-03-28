import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, CircleDot } from 'lucide-react';

function FlowJourney({ title, subtitle, color, badge, steps, entitiesCreated, notificacoes }) {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className={`${color} p-5`}>
        <div className="flex items-center gap-3 mb-1">
          <h4 className="text-lg font-bold text-white">{title}</h4>
          <Badge className="bg-white/20 text-white border-0 text-[10px]">{badge}</Badge>
        </div>
        <p className="text-white/70 text-xs">{subtitle}</p>
      </div>
      <div className="p-5 space-y-4">
        {/* Steps */}
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start relative">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${step.actor === 'Cliente' ? 'bg-[#2bc196]' : step.actor === 'IA' ? 'bg-purple-500' : step.actor === 'Sistema' ? 'bg-slate-500' : 'bg-[#002443]'}`}>
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-px h-full bg-slate-200 min-h-[20px]" />}
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-[#002443]">{step.title}</span>
                  <Badge className={`text-[8px] border-0 ${step.actor === 'Cliente' ? 'bg-[#2bc196]/10 text-[#2bc196]' : step.actor === 'IA' ? 'bg-purple-50 text-purple-600' : step.actor === 'Sistema' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600'}`}>
                    {step.actor}
                  </Badge>
                  {step.page && <span className="text-[8px] text-[#002443]/30 font-mono">{step.page}</span>}
                </div>
                <p className="text-[10px] text-[#002443]/60 leading-relaxed">{step.desc}</p>
                {step.details && (
                  <div className="mt-1 space-y-0.5">
                    {step.details.map((d, j) => (
                      <p key={j} className="text-[9px] text-[#002443]/40 flex items-start gap-1">
                        <CircleDot className="w-2.5 h-2.5 mt-0.5 shrink-0 text-[#2bc196]/50" />{d}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Entidades e Notificações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entitiesCreated && (
            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Entidades Criadas/Atualizadas</p>
              {entitiesCreated.map((e, i) => (
                <p key={i} className="text-[9px] text-blue-800/60 flex items-start gap-1">
                  <ArrowRight className="w-2.5 h-2.5 mt-0.5 shrink-0" />{e}
                </p>
              ))}
            </div>
          )}
          {notificacoes && (
            <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
              <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">Notificações Disparadas</p>
              {notificacoes.map((n, i) => (
                <p key={i} className="text-[9px] text-amber-800/60 flex items-start gap-1">
                  <ArrowRight className="w-2.5 h-2.5 mt-0.5 shrink-0" />{n}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EndToEndFlowsSection() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Jornadas Completas de Ponta a Ponta</h3>
        <p className="text-white/80 text-sm leading-relaxed">
          Cada tipo de entrada de cliente gera uma jornada diferente. Abaixo, os 5 caminhos possíveis — do primeiro contato até o contrato assinado — mostrando cada passo, quem faz, onde faz, e o que acontece automaticamente.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-[#2bc196]/20 text-[#5cf7cf] border-0">Jornada 1: Via Introducer (Landing Page)</Badge>
          <Badge className="bg-blue-500/20 text-blue-300 border-0">Jornada 2: Via Link de Lead (Comercial)</Badge>
          <Badge className="bg-purple-500/20 text-purple-300 border-0">Jornada 3: Via Reunião Manual</Badge>
          <Badge className="bg-pink-500/20 text-pink-300 border-0">Jornada 4: Via Robô IA (Notas)</Badge>
          <Badge className="bg-amber-500/20 text-amber-300 border-0">Jornada 5: Via Proposta Padrão (Link Rápido)</Badge>
        </div>
      </div>

      {/* JORNADA 1 — VIA INTRODUCER */}
      <FlowJourney
        title="Jornada 1 — Cliente vem pelo Introducer"
        subtitle="Landing page co-branded → Questionário → Lead → Pipeline → Proposta → Compliance → Contrato"
        color="bg-gradient-to-r from-purple-700 to-purple-500"
        badge="Introducer → Contrato"
        steps={[
          { title: 'Introducer compartilha link da Landing Page', actor: 'Introducer', page: '/parceiro/:slug', desc: 'O parceiro envia o link /parceiro/meu-parceiro para o potencial cliente via WhatsApp, e-mail ou redes sociais.' },
          { title: 'Cliente acessa Landing Page co-branded', actor: 'Cliente', page: 'IntroducerLandingPage', desc: 'Vê logo do parceiro + Pagsmile, tabela de taxas por segmento, calculadora de taxas interativa e disclaimer de compliance.', details: ['Componentes: LandingHeader, SegmentRatesTable, RateCalculator, ComplianceDisclaimer', 'Taxas configuradas pelo admin em Introducer.standardRates[]'] },
          { title: 'Cliente preenche questionário na landing page', actor: 'Cliente', page: 'LeadQuestionnaire (embutido)', desc: 'Formulário multi-step com autocomplete CNPJ, dados da empresa, volume, tipo de negócio, taxas atuais. O referralCode do Introducer é capturado automaticamente da URL.' },
          { title: 'Sistema cria Lead + dispara IA', actor: 'Sistema', desc: 'Cria entidade Lead com introducerId, introducerReferralCode, introducerName preenchidos. Dispara análise PRISCILA automaticamente. Notifica Slack.', details: ['Lead.status = "questionario_preenchido"', 'Lead.origemLead = referralCode do Introducer', 'Backend: analyzePriscila() → priscilaQualityScore, priscilaRiskLevel, priscilaDecisionPath'] },
          { title: 'PRISCILA + Lead Qualifier analisam', actor: 'IA', desc: 'PRISCILA gera score 0-100 e classifica risco (BAIXO/MEDIO/ALTO/CRITICO). Lead Qualifier classifica maturidade (EXCELENTE→INSUFICIENTE). Análise de Risco Avançada gera iaRiskScore e iaDecision.' },
          { title: 'Lead aparece no Pipeline Comercial', actor: 'Comercial', page: 'PipelineComercial', desc: 'Lead surge na coluna "Leads (Quest. Completo)" do Kanban com badge do Introducer. Card mostra score PRISCILA, TPV e tipo de negócio.' },
          { title: 'Comercial cria e envia Proposta', actor: 'Comercial', page: 'CriarProposta', desc: 'Abre formulário com dados pré-preenchidos do lead. Seleciona parceiro adquirente, define taxas por bandeira, antecipação, PIX, fees. Gera proposta e envia link público ao cliente.' },
          { title: 'Cliente aceita Proposta', actor: 'Cliente', page: 'PropostaPublica', desc: 'Cliente visualiza proposta completa, clica "Aceitar". Status muda para "aceita". Lead.status → "proposta_aceita". Notificação Slack disparada.' },
          { title: 'Cliente completa Compliance/KYC', actor: 'Cliente', page: 'ComplianceDinamico', desc: 'Após aceitar, é direcionado ao questionário de compliance do tipo correto. Preenche dados, envia documentos, faz biometria (Liveness+Facematch).' },
          { title: 'IA SENTINEL analisa compliance', actor: 'IA', desc: 'Fase 1: Score questionário. Fase 2: Validações externas (CAF+BDC). Fase 3: Score composto + recomendação. Se aprovado automaticamente, segue para contrato.', details: ['ComplianceScore criado com score_questionario, score_validacao_externa, score_geral_composto', 'ComplianceFinding criados para cada problema encontrado', 'Se score ≥ threshold → aprovação automática'] },
          { title: 'Sistema gera Contrato por IA', actor: 'Sistema', desc: 'Backend preGenerateContract() usa Lead + Proposta para pré-gerar contrato com todos os campos. Contrato aparece na Gestão de Contratos.', details: ['Contract.status = "pre_generated"', 'Herda taxas da Proposal aceita', 'Módulos, SLAs e cláusulas preenchidos por IA'] },
          { title: 'Comercial revisa e envia Contrato', actor: 'Comercial', page: 'EditorContrato', desc: 'Revisa campos, complementa dados faltantes, envia link público para assinatura.' },
          { title: 'Cliente assina Contrato', actor: 'Cliente', page: 'ContratoPublico', desc: 'Visualiza contrato completo e assina digitalmente. Status → "signed". Revalidação periódica agendada automaticamente.' },
        ]}
        entitiesCreated={[
          'Lead (com introducerId, referralCode)',
          'LeadActivity (cada interação)',
          'Proposal (vinculada ao lead)',
          'OnboardingCase + ComplianceSession',
          'ComplianceScore + ComplianceFinding',
          'Contract (pré-gerado por IA)',
          'AuditLog (cada ação)',
        ]}
        notificacoes={[
          'Slack: novo lead criado (notifyNewLead)',
          'Slack: proposta visualizada (notifyProposalViewed)',
          'Slack: proposta aceita (notifyProposalAccepted)',
          'E-mail: follow-up se lead inativo >7 dias',
        ]}
      />

      {/* JORNADA 2 — VIA LINK DE LEAD */}
      <FlowJourney
        title="Jornada 2 — Comercial envia link de questionário"
        subtitle="Gera link → Envia ao cliente → Lead → Pipeline → Proposta → Compliance → Contrato"
        color="bg-gradient-to-r from-[#002443] to-[#003366]"
        badge="Link → Contrato"
        steps={[
          { title: 'Comercial gera link rastreável', actor: 'Comercial', page: 'LinksQuestionariosLeads', desc: 'Escolhe tipo de questionário (Completo v2.0, Simplificado, PIX). Gera link com uniqueCode, nome do vendedor e UTMs. Copia e envia ao cliente via WhatsApp/e-mail.' },
          { title: 'Cliente preenche questionário público', actor: 'Cliente', page: 'LeadQuestionnaire / LeadQuestionnairePix', desc: 'Questionário multi-step. V2.0: autocomplete CNPJ preenche 14 campos. Inclui: dados empresa, tipo negócio, volume, taxas atuais do concorrente, contato, aceite.' },
          { title: 'Sistema cria Lead + IAs analisam', actor: 'Sistema', desc: 'Lead criado. PRISCILA, Lead Qualifier e Análise de Risco Avançada executam em paralelo. Scores gerados e persistidos no Lead. Slack notificado.', details: ['OnboardingLink.metrics atualizado (submissões +1)', 'OnboardingAnalytics registrado para tracking'] },
          { title: 'Lead aparece na aba Questionários Recebidos', actor: 'Comercial', page: 'QuestionariosLeads', desc: 'Na sub-aba correta (Completo, Simplificado ou PIX). Mostra protocolo, empresa, score PRISCILA, risco, TPV, SLA. Comercial clica "Iniciar Contato".' },
          { title: 'Comercial gerencia no Pipeline', actor: 'Comercial', page: 'PipelineComercial', desc: 'Arrasta lead entre colunas. Cada drag-and-drop atualiza status e cria LeadActivity. Vê métricas de TPV e receita por coluna.' },
          { title: 'Comercial cria Proposta (1 de 3 tipos)', actor: 'Comercial', page: 'CriarProposta / CriarPropostaPadrao / CriarPropostaPix', desc: 'Escolhe tipo: Personalizada (taxas editáveis por bandeira), Padrão (segmento auto-preenchido) ou PIX (taxa PIX + TPV mínimo). Seleciona parceiro adquirente para validação de limites.' },
          { title: 'Cliente recebe, aceita proposta', actor: 'Cliente', page: 'PropostaPublica / PropostaPadraoPublica / PropostaPixPublica', desc: 'Visualiza taxas completas. Pode aceitar, recusar com motivo ou enviar contraproposta.' },
          { title: 'Compliance + Contrato (mesma sequência da Jornada 1)', actor: 'Sistema', desc: 'Compliance → SENTINEL → Contrato IA → Revisão → Assinatura. Mesmos passos 9-12 da Jornada 1.' },
        ]}
        entitiesCreated={['OnboardingLink (link rastreável)', 'OnboardingAnalytics (tracking)', 'Lead + LeadActivity', 'Proposal / StandardProposal / PixProposal', 'Contract']}
        notificacoes={['Slack: novo lead (notifyNewLead)', 'Slack: proposta visualizada/aceita', 'E-mail: follow-up automático', 'Automação: checkLeadSLA, checkExpiringProposals']}
      />

      {/* JORNADA 3 — VIA REUNIÃO MANUAL */}
      <FlowJourney
        title="Jornada 3 — Comercial preenche após reunião"
        subtitle="Reunião → Questionário interno → Lead → Pipeline → Proposta → Compliance → Contrato"
        color="bg-gradient-to-r from-amber-600 to-orange-500"
        badge="Reunião → Contrato"
        steps={[
          { title: 'Comercial tem reunião com cliente', actor: 'Comercial', desc: 'Reunião presencial ou remota. Coleta dados: empresa, CNPJ, volume, taxas atuais, desafios, expectativas.', details: ['Pode ser durante a reunião (preenche em tempo real)', 'Ou após a reunião (preenche de memória/anotações)'] },
          { title: 'Preenche Questionário de Reunião', actor: 'Comercial', page: 'QuestionarioReuniao / QuestionarioReuniaoPix', desc: 'Formulário com 5 seções: Informações do Cliente, Detalhamento do Negócio, Volume e Transações, Taxas e Custos Atuais, Desafios e Oportunidades. Salva em InternalCommercialQuestionnaire e cria Lead automaticamente.', details: ['MeetingFormBasicInfo: nome, CPF/CNPJ, e-mail, telefone, website, tipo negócio, contato', 'MeetingFormBusinessDetails: descrição, canais de venda, revenue breakdown', 'MeetingFormVolume: TPV, ticket médio, transações/mês, crescimento', 'MeetingFormCurrentRates: MDR 1x/2-6x/7-12x, PIX, boleto, antecipação, fee, antifraude', 'MeetingFormChallenges: desafios, funcionalidades críticas, prazo, notas'] },
          { title: 'Lead aparece em Questionários Recebidos', actor: 'Sistema', page: 'QuestionariosLeads → aba Reunião', desc: 'Aparece na sub-aba "Questionário Reunião" com badge de origem. Comercial pode revisar e editar.' },
          { title: 'Segue fluxo normal: Pipeline → Proposta → Compliance → Contrato', actor: 'Comercial', desc: 'Mesma sequência das Jornadas 1/2 a partir do Pipeline.' },
        ]}
        entitiesCreated={['InternalCommercialQuestionnaire (dados da reunião)', 'Lead (criado automaticamente ao salvar)', 'LeadActivity (ação: questionário preenchido)']}
        notificacoes={['Slack: novo lead criado']}
      />

      {/* JORNADA 4 — VIA ROBÔ IA */}
      <FlowJourney
        title="Jornada 4 — Notas de reunião processadas por IA"
        subtitle="Cola texto → IA extrai dados → Revisão → Lead → Pipeline → Proposta → Compliance → Contrato"
        color="bg-gradient-to-r from-pink-600 to-rose-500"
        badge="Robô IA → Contrato"
        steps={[
          { title: 'Comercial cola notas de reunião', actor: 'Comercial', page: 'ProcessMeetingNotes', desc: 'Cole texto livre de anotações, transcrição de reunião, e-mails ou mensagens. Pode ser desestruturado e informal.', details: ['Aceita texto em qualquer formato', 'Suporta anotações parciais ou incompletas'] },
          { title: 'IA processa e extrai dados estruturados', actor: 'IA', desc: 'InvokeLLM analisa o texto e extrai: nome empresa, CNPJ, contato, TPV, taxas atuais, tipo de negócio, desafios, expectativas. Retorna JSON estruturado.', details: ['Backend: processMeetingNotes()', 'response_json_schema com campos do InternalCommercialQuestionnaire', 'Marca origemIA=true no questionário'] },
          { title: 'Comercial revisa dados extraídos', actor: 'Comercial', page: 'QuestionarioReuniao (modo edição)', desc: 'IA gera questionário pré-preenchido com status "ai_preenchido". Comercial revisa, corrige, complementa e salva. Cria Lead ao salvar.' },
          { title: 'Lead aparece em Questionários Recebidos', actor: 'Sistema', page: 'QuestionariosLeads → aba Robô IA', desc: 'Aparece na sub-aba "Questionário com Robô" com badge 🤖 IA. Status: "ai_preenchido" até ser revisado → "preenchido".' },
          { title: 'Segue fluxo normal: Pipeline → Proposta → Compliance → Contrato', actor: 'Comercial', desc: 'Mesma sequência das jornadas anteriores.' },
        ]}
        entitiesCreated={['InternalCommercialQuestionnaire (origemIA=true)', 'Lead (após revisão)']}
        notificacoes={['Nenhuma automática (é processo interno)']}
      />

      {/* JORNADA 5 — VIA PROPOSTA PADRÃO (LINK RÁPIDO) */}
      <FlowJourney
        title="Jornada 5 — Cliente recebe link de Proposta Padrão"
        subtitle="Link rápido por segmento → Cliente visualiza → CTA → Questionário → Lead → Pipeline → ..."
        color="bg-gradient-to-r from-[#2bc196] to-[#36706c]"
        badge="Link Rápido → Lead"
        steps={[
          { title: 'Comercial copia link rápido por segmento', actor: 'Comercial', page: 'GestaoPropostasPadrao', desc: 'Na seção "Links Rápidos por Segmento" no topo da página, clica "Copiar Link" no card do segmento desejado (E-commerce, Educação, Infoprodutos, SaaS, Gateway, Marketplace).', details: ['Cada card identifica automaticamente a StandardProposal com isDefaultForSegment=true', 'Gera URL: /PropostaPadraoPublica?token=xxx'] },
          { title: 'Comercial envia link ao cliente', actor: 'Comercial', desc: 'Envia o link via WhatsApp, e-mail ou qualquer canal. O cliente não precisa preencher nada para ver as taxas.' },
          { title: 'Cliente visualiza Proposta Padrão Pública', actor: 'Cliente', page: 'PropostaPadraoPublica', desc: 'Vê taxas por bandeira, PIX, boleto, fees, antecipação, tabela de parcelas detalhada com simulador, TPV mínimo. Design premium com logo Pagsmile.', details: ['TaxasPorBandeiraPublic: Visa, Master, Elo, Amex, Outras × 4 faixas', 'ParcelasTableDetalhada: simulação de valor líquido por bandeira 1x-21x', 'ExportButtons: PDF/impressão'] },
          { title: 'Cliente clica CTA "Quero proposta personalizada"', actor: 'Cliente', desc: 'Botão CTA redireciona para o questionário de lead. O cliente preenche seus dados para receber uma proposta personalizada com taxas negociadas.' },
          { title: 'Cliente preenche questionário de lead', actor: 'Cliente', page: 'LeadQuestionnaire', desc: 'Formulário multi-step padrão. Cria Lead ao submeter.' },
          { title: 'Segue fluxo normal: IA → Pipeline → Proposta Personalizada → Compliance → Contrato', actor: 'Sistema', desc: 'Lead entra no funil comercial. Comercial pode criar proposta personalizada com taxas negociadas melhores que as do link padrão.' },
        ]}
        entitiesCreated={['Lead (após questionário)', 'Não cria proposta — apenas exibe taxas padrão']}
        notificacoes={['Slack: novo lead (quando preenche questionário)']}
      />

      {/* Tabela Comparativa */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="font-bold text-[#002443] text-sm mb-4">Comparativo: Etapas por Tipo de Entrada</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-[#002443]/50 font-bold uppercase tracking-wider">Etapa</th>
                <th className="text-center py-2 text-purple-600 font-bold">Introducer</th>
                <th className="text-center py-2 text-[#002443] font-bold">Link Lead</th>
                <th className="text-center py-2 text-amber-600 font-bold">Reunião</th>
                <th className="text-center py-2 text-pink-600 font-bold">Robô IA</th>
                <th className="text-center py-2 text-[#2bc196] font-bold">Link Padrão</th>
              </tr>
            </thead>
            <tbody>
              {[
                { etapa: 'Quem inicia', vals: ['Introducer', 'Comercial', 'Comercial', 'Comercial', 'Comercial'] },
                { etapa: 'Primeiro contato', vals: ['Landing Page', 'Link questionário', 'Reunião', 'Notas de reunião', 'Link proposta padrão'] },
                { etapa: 'Quem preenche dados', vals: ['Cliente', 'Cliente', 'Comercial', 'IA + Comercial', 'Cliente (depois)'] },
                { etapa: 'IA automática', vals: ['✅ PRISCILA', '✅ PRISCILA', '❌ Manual', '✅ LLM + PRISCILA', '❌ Só após quest.'] },
                { etapa: 'Introducer vinculado', vals: ['✅ Automático', '❌', '❌', '❌', '❌'] },
                { etapa: 'Lead criado por', vals: ['Sistema', 'Sistema', 'Comercial', 'Comercial', 'Sistema'] },
                { etapa: 'Proposta', vals: ['Personalizada', '3 tipos', '3 tipos', '3 tipos', 'Personalizada'] },
                { etapa: 'Compliance', vals: ['✅', '✅', '✅', '✅', '✅'] },
                { etapa: 'Contrato', vals: ['✅ IA', '✅ IA', '✅ IA', '✅ IA', '✅ IA'] },
              ].map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-[#002443]">{row.etapa}</td>
                  {row.vals.map((v, j) => (
                    <td key={j} className="text-center py-2 text-[#002443]/60">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}