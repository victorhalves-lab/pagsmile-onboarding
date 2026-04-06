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
          Cada tipo de entrada de cliente gera uma jornada diferente. Abaixo, os 7 caminhos possíveis — do primeiro contato até a conclusão do onboarding — mostrando cada passo, quem faz, onde faz, e o que acontece automaticamente.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-[#2bc196]/20 text-[#5cf7cf] border-0">Jornada 1: Via Introducer (Landing Page)</Badge>
          <Badge className="bg-blue-500/20 text-blue-300 border-0">Jornada 2: Via Link de Lead (Comercial)</Badge>
          <Badge className="bg-purple-500/20 text-purple-300 border-0">Jornada 3: Via Reunião Manual</Badge>
          <Badge className="bg-pink-500/20 text-pink-300 border-0">Jornada 4: Via Robô IA (Notas)</Badge>
          <Badge className="bg-amber-500/20 text-amber-300 border-0">Jornada 5: Via Proposta Padrão (Link Rápido)</Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-0">Jornada 6: Via Lead PIX v4 (Merchant/Intermediário)</Badge>
          <Badge className="bg-pink-500/20 text-pink-300 border-0">Jornada 7: Subseller PF (Pessoa Física — sem CAF)</Badge>
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

      {/* JORNADA 6 — VIA LEAD PIX v4 */}
      <FlowJourney
        title="Jornada 6 — Cliente PIX vem pelo Lead PIX v4"
        subtitle="Questionário PIX v4 → Lead (com flags + score) → Pipeline → Proposta PIX → Compliance PIX → Risk Scoring v4 → Contrato"
        color="bg-gradient-to-r from-emerald-700 to-teal-600"
        badge="PIX v4 → Contrato"
        steps={[
          { title: 'Comercial gera link LeadPixV4 ou Lead chega organicamente', actor: 'Comercial', page: 'LinksQuestionariosLeads', desc: 'Link com UTMs e referralCode (Introducer opcional). URL: /LeadPixV4?utm_source=xxx&referralCode=yyy', details: ['Também pode ser acessado via landing page do Introducer ou link direto'] },
          { title: 'Lead seleciona perfil PIX: Merchant Direto ou Intermediário', actor: 'Cliente', page: 'LeadPixV4 → StepTipoNegocio', desc: '2 cards visuais: 🏪 Merchant Direto (recebe PIX para própria empresa) ou 🔗 Intermediário (faz split/repasse). Esta escolha determina quais perguntas condicionais aparecem nos passos seguintes.', details: ['Intermediário: perguntas adicionais sobre qty merchants, split, repasse', 'Merchant: perguntas sobre modelo de cobrança, presença digital'] },
          { title: 'Lead preenche CNPJ → autocomplete BrasilAPI', actor: 'Cliente', page: 'LeadPixV4 → StepDadosEmpresa', desc: 'CNPJ autocomplete preenche 14+ campos (Razão Social, Nome Fantasia, CNAE, Capital Social, Situação Cadastral, UF, Município, Data Abertura, Porte, Natureza Jurídica, Sócios). Dispara flags silenciosas: YOUNG_COMPANY (<1 ano), SPECIAL_SITUATION, REGULATED_SECTOR, CNAE_SEGMENT_MISMATCH.', details: ['E-mail: detecta domínio pessoal → flag PERSONAL_EMAIL', 'Cargo: Sócio/CEO/Diretor → +10 score'] },
          { title: 'Lead preenche modelo de negócio PIX (condicional)', actor: 'Cliente', page: 'LeadPixV4 → StepModeloNegocio', desc: 'Perguntas condicionais baseadas no tipo selecionado. Merchant: modelo cobrança (avulso/recorrente/parcelado/ambos), presença digital, conta encerrada. Intermediário: quantidade merchants, finalidade Split PIX.', details: ['Flag ACCOUNT_TERMINATED se conta encerrada = Sim (-15 score)', 'Flag MEI_AS_INTERMEDIARY se porte=MEI + tipo=intermediário', 'Flag INTERMEDIARY_WANTS_SPLIT se intermediário + Split PIX'] },
          { title: 'Lead informa volume PIX', actor: 'Cliente', page: 'LeadPixV4 → StepVolumePix', desc: 'TPV mensal (CurrencyNumberInput), ticket médio, transações calculadas automaticamente (TPV÷Ticket), horário pico.', details: ['Flag HIGH_PIX_VOLUME_MEI se TPV>R$6.750 + porte MEI (-10 score)', 'Flag TPV_EXCEEDS_REVENUE se TPV×12 > limite porte × 1.3', 'TPV ≥ R$1M: +15 score, ≥R$500k: +10, ≥R$100k: +5'] },
          { title: 'Lead completa serviços desejados e fechamento', actor: 'Cliente', page: 'LeadPixV4 → Steps 5-7', desc: 'Situação atual (parceiro PIX, custo, motivo busca), 9 serviços PIX (QR estático/dinâmico, Cobrança, Garantido, Split, Conta Digital), urgência, canal, upload proposta concorrente.', details: ['Score finalizado: base 40 + bônus - penalidades (0-100)', 'Label atribuído: Muito Quente (≥80), Quente (≥60), Morno (≥40), Frio (<40)'] },
          { title: 'Sistema cria Lead PIX com 11 flags + score', actor: 'Sistema', desc: 'Lead criado com: protocolo PIX4-YYYY-NNNNN, status="questionario_preenchido", businessSubCategory baseado no tipo, 11 flags calculadas, score 0-100, label de temperatura.', details: ['Lead.questionnaireData contém todas as respostas + flags + score + cnpjData', 'Introducer vinculado automaticamente se URL contém referralCode', 'Slack notificado (notifyNewLead)', 'PRISCILA + Lead Qualifier executam em paralelo'] },
          { title: 'Lead no Pipeline → Proposta PIX', actor: 'Comercial', page: 'PipelineComercial → CriarPropostaPix', desc: 'Lead aparece no Pipeline com badge PIX e score. Comercial cria PixProposal: taxa PIX (% ou fixo), TPV mínimo garantido (3 meses). Envia link público.', details: ['Dados do lead pré-preenchidos na proposta', 'Taxa sugerida baseada no volume declarado'] },
          { title: 'Cliente aceita Proposta PIX', actor: 'Cliente', page: 'PropostaPixPublica', desc: 'Visualiza taxa PIX e TPV mínimo. Aceita, recusa com motivo ou envia contraproposta. Status → "aceita". Notificação Slack.' },
          { title: 'Compliance PIX (CompliancePixOnly ou ComplianceDinamico)', actor: 'Cliente', page: 'ComplianceDinamico?model=CompliancePixV4', desc: 'Questionário de compliance específico para PIX. Perguntas sobre: identificação, atividade econômica, volume PIX, clientes atendidos, responsável pela conta, SAC, PLD/sanções, confirmação.', details: ['useLeadPrefill pré-preenche campos com dados do Lead PIX v4', 'CNPJ já enriquecido → dados confirmados sem redigitar', 'Documentos obrigatórios solicitados ao final'] },
          { title: 'Motor Risk Scoring v4 executa', actor: 'Sistema', desc: 'calculateRiskScoreV4 dispara: C1 (segmento=pix_merchant base 80 ou pix_intermediario base 205) + C2 (variáveis V01-V53 ativas por segmento) + C3 (enriquecimento E01-E11 se BDC/CAF disponível). Verifica bloqueios B01-B10.', details: ['Se bloqueio ativo → Score=1000, Subfaixa=5 (BLOQUEIO)', 'Se sem bloqueio → Score=max(0,min(849,C1+C2+C3))', 'Mapeia para subfaixa 1A-4, define Rolling Reserve (0-20%)', 'Define nível de monitoramento (PADRÃO → MÁXIMO)', 'Salva ComplianceScore com detalhamento completo'] },
          { title: 'IA SENTINEL gera parecer qualitativo', actor: 'IA', desc: 'SENTINEL usa score v4 como base quantitativa + análise qualitativa: findings, quality assessment, parecer final. OnboardingCase atualizado: riskScoreV4, subfaixa, rollingReservePercent, monitoramentoNivel, iaDecision.', details: ['Decisão: subfaixas 1A-3B → Aprovado automático', 'Subfaixa 4 → Revisão Manual obrigatória', 'Subfaixa 5 → Bloqueio (recusa automática)'] },
          { title: 'Contrato PIX gerado e assinado', actor: 'Sistema + Comercial + Cliente', desc: 'preGenerateContract() → Contract com módulos PIX habilitados, taxa PIX da proposta, RR do scoring v4, SLAs. Revisão pelo comercial → link público → assinatura digital.', details: ['Módulos: pixRecebimentos=true, pixPagamentos conforme serviços solicitados', 'Cláusula de Rolling Reserve baseada na subfaixa'] },
        ]}
        entitiesCreated={[
          'Lead (protocolo PIX4-xxx, 11 flags, score 0-100, questionnaireData completo)',
          'LeadActivity (cada interação registrada)',
          'PixProposal (taxa PIX + TPV mínimo + versionamento)',
          'OnboardingCase + ComplianceSession (sessão PIX)',
          'ComplianceScore (framework v4: score_base 80/205 + variáveis + enriquecimento + subfaixa + RR + monitoramento)',
          'ComplianceFinding[] (findings por severidade)',
          'Contract (módulos PIX, RR da subfaixa, SLAs)',
          'AuditLog (cada operação rastreada)',
        ]}
        notificacoes={[
          'Slack: novo lead PIX v4 (notifyNewLead com badge PIX)',
          'Slack: proposta PIX visualizada (notifyProposalViewed)',
          'Slack: proposta PIX aceita (notifyProposalAccepted)',
          'E-mail: follow-up se lead inativo >7 dias (sendFollowUpEmail)',
          'Automação: onLeadCreatedEnrich (enriquecimento automático)',
          'Automação: calculateRiskScoreV4 (ao criar OnboardingCase)',
        ]}
      />

      {/* JORNADA 7 — SUBSELLER PF (PESSOA FÍSICA) */}
      <FlowJourney
        title="Jornada 7 — Subseller Pessoa Física (PF) via Link de Subconta"
        subtitle="Link subseller → Seleção PF → Questionário 33 perguntas → Upload documentos na plataforma (sem CAF) → Análise"
        color="bg-gradient-to-r from-pink-700 to-rose-600"
        badge="Subseller PF → Onboarding"
        steps={[
          { title: 'Admin gera link de subconta para merchant aprovado', actor: 'Admin', page: 'GerenciarSubsellerLinks', desc: 'Seleciona merchant principal, configura branding (PagSmile ou white-label: logo, cores, nome), gera OnboardingLink tipo SUBSELLER_COMPLIANCE com parentMerchantId.', details: ['Slug curto opcional para URL amigável /s/{slug}', 'Métricas rastreadas: clicks, submissions, completions'] },
          { title: 'Merchant distribui link aos seus subsellers PF', actor: 'Merchant', desc: 'Envia link /SubsellerQuestionnaire?ref=xxx ou /s/{slug} via WhatsApp, e-mail ou sistema interno.' },
          { title: 'Subseller PF acessa link e vê MerchantTypeSelector', actor: 'Subseller PF', page: 'SubsellerQuestionnaire', desc: 'Página carrega branding do merchant. MerchantTypeSelector exibe 2 cards: "Pessoa Física (CPF)" e "Pessoa Jurídica (CNPJ)". Subseller seleciona PF.', details: ['Branding: logo, cores primária/secundária, nome do merchant', 'Se link inválido/expirado/inativo → mensagem de erro'] },
          { title: 'Sistema carrega template subseller_pf (33 perguntas)', actor: 'Sistema', desc: 'DynamicQuestionnaire renderiza com template PF (merchantType=PF). Perguntas agrupadas em steps de 4. Branding white-label aplicado em progress bar, botões, steps, badges.', details: ['Template subseller_pf: 33 perguntas obrigatórias', 'Campo "Complemento" configurado como opcional (isRequired=false)', 'Auto-save ativo: localStorage + ComplianceSession no backend'] },
          { title: 'Subseller PF preenche dados pessoais e compliance', actor: 'Subseller PF', desc: 'CPF, Nome Completo, Data de Nascimento, Nacionalidade, Nome da Mãe, E-mail, Telefone, Endereço (CEP autocomplete via ViaCEP), atividade econômica, renda, PEP/sanções, fonte de renda, confirmação.', details: ['Dados PF exclusivos: dateOfBirth, nationality, motherName', 'Painel de enriquecimento CNPJ oculto (isPublicView=true)', 'ComplianceFieldAlerts ativo para respostas de risco'] },
          { title: 'Ao finalizar questionário → cria Merchant PF + OnboardingCase', actor: 'Sistema', desc: 'createMerchantAndCase() cria: Merchant (type=PF, dateOfBirth, nationality, motherName, isSubseller=true, parentMerchantId) + OnboardingCase (isSubsellerCase=true) + QuestionnaireResponse[]. IDs salvos em localStorage (created_merchant_id, created_onboarding_case_id).', details: ['Merchant.type = "PF"', 'Merchant.isSubseller = true', 'Merchant.parentMerchantId = ID do seller principal', 'OnboardingCase.isSubsellerCase = true', 'Sem redirect para CAF — fluxo PF vai direto para upload'] },
          { title: 'Redirect para DocumentUploadFull (upload direto, SEM CAF)', actor: 'Subseller PF', page: 'DocumentUploadFull', desc: 'DynamicDocumentUploadPage detecta IDs existentes via localStorage (created_onboarding_case_id). NÃO cria novo Merchant/Case (evita duplicação). Exibe 4 documentos obrigatórios para upload.', details: ['Documento 1: Selfie com Documento de Identificação', 'Documento 2: RG ou CNH (Frente)', 'Documento 3: RG ou CNH (Verso)', 'Documento 4: Comprovante de Endereço', 'Formatos aceitos: PDF, JPG, PNG. Max: 10MB por arquivo', 'Progress bar: X de 4 documentos obrigatórios enviados'] },
          { title: 'Subseller PF faz upload dos 4 documentos', actor: 'Subseller PF', desc: 'Seleciona arquivo para cada documento. Upload via base44.integrations.Core.UploadFile. Barra de progresso atualiza em tempo real. Ao concluir todos os obrigatórios, botão "Concluir Submissão" habilita.' },
          { title: 'Concluir → DocumentUpload[] criados + redirect OnboardingCompletion', actor: 'Sistema', desc: 'DocumentUpload[] criados vinculados ao OnboardingCase existente (documentName, fileUrl, fileName, fileSize, fileType, uploadDate, validationStatus=Pendente). localStorage limpo (created_merchant_id, created_onboarding_case_id, current_template_id, etc.).', details: ['Redirect: /OnboardingCompletion?caseId=xxx', 'ComplianceSession.status = completed', 'Analytics tracked: compliance_stage_completed (stage=documents)'] },
          { title: 'Caso aparece na aba Subsellers (sub-aba PF)', actor: 'Sistema', page: 'QuestionariosRecebidos → SubsellerCasesTab', desc: 'SubsellerCasesTab exibe sub-abas PF e PJ. Caso PF aparece com badge 🟣 "PF" e informações: nome, CPF, status, data de submissão. Agrupado por merchant principal.', details: ['Busca por nome ou CPF disponível', 'Ícone de olho → SubsellerPFResponsesModal', 'Botão "Analisar" → AnaliseDeCasos'] },
          { title: 'Admin visualiza respostas PF e documentos', actor: 'Admin', page: 'AnaliseDeCasos', desc: 'SubsellerPFResponsesModal: respostas organizadas em 6 categorias (Identificação, Contato, Endereço, Atividade, Compliance, Confirmação). Aba "Documentos" do caso: CaseDocumentsTab exibe todos os uploads com documentName, fileType, fileSize, uploadDate, validationStatus (Pendente/Validado/Rejeitado), botão "Ver" (abre URL) e "Baixar Todos (ZIP)".', details: ['Analista pode aprovar, enviar para revisão manual ou recusar', 'Cada ação registrada em AuditLog', 'Merchant e OnboardingCase atualizados com decisão'] },
        ]}
        entitiesCreated={[
          'OnboardingLink (tipo SUBSELLER_COMPLIANCE, parentMerchantId, branding)',
          'Merchant (type=PF, isSubseller=true, parentMerchantId, dateOfBirth, nationality, motherName)',
          'OnboardingCase (isSubsellerCase=true, questionnaireTemplateId)',
          'QuestionnaireResponse[] (33 respostas do template PF)',
          'DocumentUpload[] (4 docs: selfie, RG frente, RG verso, comprovante endereço)',
          'ComplianceSession (sessão retomável)',
          'AuditLog (cada ação do analista)',
        ]}
        notificacoes={[
          'Nenhuma automática por padrão (subseller é processo B2B interno)',
          'Caso visível imediatamente em QuestionariosRecebidos → Subsellers → PF',
        ]}
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
                <th className="text-center py-2 text-emerald-600 font-bold">Lead PIX v4</th>
                <th className="text-center py-2 text-rose-600 font-bold">Subseller PF</th>
              </tr>
            </thead>
            <tbody>
              {[
                { etapa: 'Quem inicia', vals: ['Introducer', 'Comercial', 'Comercial', 'Comercial', 'Comercial', 'Comercial/Lead', 'Merchant/Admin'] },
                { etapa: 'Primeiro contato', vals: ['Landing Page', 'Link questionário', 'Reunião', 'Notas de reunião', 'Link proposta padrão', 'Link PIX v4', 'Link subconta'] },
                { etapa: 'Quem preenche dados', vals: ['Cliente', 'Cliente', 'Comercial', 'IA + Comercial', 'Cliente (depois)', 'Cliente', 'Subseller PF'] },
                { etapa: 'Seleção PF/PJ', vals: ['❌', '❌', '❌', '❌', '❌', '❌', '✅ MerchantTypeSelector'] },
                { etapa: 'IA automática', vals: ['✅ PRISCILA', '✅ PRISCILA', '❌ Manual', '✅ LLM + PRISCILA', '❌ Só após quest.', '✅ 11 flags + Score', '❌ Scoring pós'] },
                { etapa: 'Introducer vinculado', vals: ['✅ Automático', '❌', '❌', '❌', '❌', '✅ Se URL params', '❌'] },
                { etapa: 'Lead criado por', vals: ['Sistema', 'Sistema', 'Comercial', 'Comercial', 'Sistema', 'Sistema', 'N/A (direto)'] },
                { etapa: 'Proposta', vals: ['Personalizada', '3 tipos', '3 tipos', '3 tipos', 'Personalizada', 'PIX', 'N/A'] },
                { etapa: 'Biometria CAF', vals: ['✅ PJ', '✅ PJ', '✅ PJ', '✅ PJ', '✅ PJ', '✅ PJ', '❌ Upload direto'] },
                { etapa: 'Upload docs plataforma', vals: ['✅', '✅', '✅', '✅', '✅', '✅', '✅ 4 docs obrigatórios'] },
                { etapa: 'Risk Scoring', vals: ['Legado', 'Legado', 'Legado', 'Legado', 'Legado', '✅ v4.0 Motor', '✅ v4.0 Motor'] },
                { etapa: 'Compliance', vals: ['✅', '✅', '✅', '✅', '✅', '✅ PIX v4', '✅ PF (33 perguntas)'] },
                { etapa: 'Contrato', vals: ['✅ IA', '✅ IA', '✅ IA', '✅ IA', '✅ IA', '✅ IA + RR v4', 'N/A (subseller)'] },
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