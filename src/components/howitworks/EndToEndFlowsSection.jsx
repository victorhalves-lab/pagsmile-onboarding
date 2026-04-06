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
          { title: 'Cliente visualiza proposta completa', actor: 'Cliente', page: 'PropostaPublica', desc: 'Proposta carregada pelo token. Primeira visualização: status → "visualizada", Slack notificado (notifyProposalViewed). Exibe tabela por bandeira × 4 faixas, PIX, boleto, fees, antecipação, parcelas 1x-21x, TPV mínimo.', details: ['ParcelasTableDetalhada: simulação valor líquido por bandeira', 'ExportButtons: PDF e impressão'] },
          { title: 'Cliente aceita Proposta', actor: 'Cliente', desc: 'Clica "Aceitar" → AceiteModal confirma aceite digital. Proposal.status = "aceita", acceptedDate registrada. Lead.status → "proposta_aceita". Slack notificado (notifyProposalAccepted). Redirect automático para ComplianceDinamico do segmento.', details: ['Se recusar: motivo obrigatório via RecusaModal', 'Se contrapropor: sugestão de taxas via ContrapropostaModal'] },
          { title: 'Após aceite → Cliente preenche Compliance/KYC', actor: 'Cliente', page: 'ComplianceDinamico', desc: 'Template compliance v4 carregado conforme segmento do Lead (via segmentToComplianceV4Map). useLeadPrefill pré-preenche campos com dados do Lead + CNPJ enriquecido. Perguntas agrupadas em steps de 4. Lógica condicional. Auto-save em ComplianceSession + localStorage.', details: ['Perguntas específicas por segmento (Gateway: sub-merchants, PCI DSS; E-commerce: plataforma, entrega)', 'ComplianceFieldAlerts: alertas visuais para respostas de risco em tempo real'] },
          { title: 'Upload de documentos obrigatórios', actor: 'Cliente', page: 'DocumentUploadFull', desc: 'DynamicDocumentUploader exibe documentos obrigatórios do template (Contrato Social, Comprovante CNPJ, etc.). Upload com validação de formato (PDF/JPG/PNG) e tamanho (max 10MB). Progress bar de envio. DocumentUpload[] criados com validationStatus=Pendente.' },
          { title: 'Redirect para CAF: Liveness + Facematch', actor: 'Cliente + CAF', desc: 'Após upload, redirect para CAF com URL específica por segmento. Subseller completa Liveness (prova de vida) + Facematch (comparação facial com documento). ExternalValidationResult registrado.', details: ['10 URLs CAF diferentes por segmento'] },
          { title: 'Merchant + OnboardingCase criados', actor: 'Sistema', desc: 'createMerchantAndCase(): Merchant (type=PJ, cpfCnpj, fullName, companyName, email) + OnboardingCase (merchantId, templateId, status=Pendente, commercialAgentId) + QuestionnaireResponse[]. Lead.onboardingCaseId atualizado. Lead.status=kyc_iniciado.' },
          { title: 'Motor Risk Scoring v4 executa scoring quantitativo', actor: 'Sistema', desc: 'C1 (base por segmento) + C2 (variáveis V01-V53 conforme respostas) + C3 (enriquecimento E01-E11 se BDC/CAF disponível). Verifica bloqueios B01-B10. Score 0-1000 → subfaixa (1A-5) → Rolling Reserve (0-20%) → nível monitoramento.', details: ['ComplianceScore persistido com detalhamento de cada camada', 'variaveis_aplicadas, variaveis_positivas, variaveis_negativas registradas'] },
          { title: 'IA SENTINEL gera parecer qualitativo em 3 fases', actor: 'IA', desc: 'Fase 1: Análise do questionário. Fase 2: Validações externas (CAF + BigDataCorp). Fase 3: Score composto + findings + quality assessment + parecer final. OnboardingCase atualizado: riskScoreV4, subfaixa, rollingReservePercent, monitoramentoNivel, iaDecision.', details: ['ComplianceFinding[] por severidade', '1A-3B: Aprovado automático', '4: Revisão Manual obrigatória', '5: Bloqueio automático'] },
          { title: 'Sistema pré-gera Contrato por IA', actor: 'Sistema', desc: 'preGenerateContract() usa Lead + Proposal aceita + OnboardingCase para pré-gerar Contract: dados cliente, taxas herdadas, módulos (cartão+PIX+boleto), SLAs, Rolling Reserve do scoring v4, cláusulas (27 seções). Contract.status = "pre_generated".', details: ['Módulos definidos pelo tipo de proposta', 'Cláusula Rolling Reserve baseada na subfaixa'] },
          { title: 'Comercial revisa e envia Contrato', actor: 'Comercial', page: 'EditorContrato', desc: 'Revisa campos pré-preenchidos pela IA, complementa representante legal, dados bancários, testemunhas. Define cláusulas adicionais. Envia link /ContratoPublico?code=xxx. Contract.status → "sent". AuditLog registrado.' },
          { title: 'Cliente assina Contrato digitalmente', actor: 'Cliente', page: 'ContratoPublico', desc: 'Visualiza contrato completo com 27 seções de cláusulas. Assina digitalmente com registro de IP, data/hora e nome do signatário. Contract.status → "signed", signedDate registrada. Lead.status → "ativado". RevalidationSchedule agendada automaticamente conforme subfaixa.', details: ['AuditLog + LeadActivity registram assinatura', 'Revalidação: 1A-1B=12 meses, 2A-2B=9 meses, 3A-3B=6 meses, 4=3 meses'] },
        ]}
        entitiesCreated={[
          'LandingPageEvent (page_view, segment_view, calculator_interact, cta_contratar)',
          'Lead (introducerId, referralCode, introducerName, scores 3 IAs)',
          'LeadActivity (cada interação registrada)',
          'Proposal (taxas por bandeira, parceiro, versionamento, tokenPublico)',
          'Merchant (type=PJ, dados empresa, onboardingStatus)',
          'OnboardingCase (merchantId, templateId, status, scores v4)',
          'ComplianceSession (sessão retomável)',
          'QuestionnaireResponse[] (respostas compliance)',
          'DocumentUpload[] (docs obrigatórios, validationStatus=Pendente)',
          'ExternalValidationResult (resultado CAF)',
          'ComplianceScore (motor v4: C1+C2+C3, subfaixa, RR, monitoramento)',
          'ComplianceFinding[] (findings por severidade)',
          'Contract (pré-gerado IA, taxas herdadas, módulos, SLAs, RR)',
          'RevalidationSchedule (revalidação periódica)',
          'AuditLog (cada ação rastreada)',
        ]}
        notificacoes={[
          'Slack: novo lead criado (notifyNewLead)',
          'Slack: proposta visualizada (notifyProposalViewed)',
          'Slack: proposta aceita (notifyProposalAccepted)',
          'Slack: landing page lead (notifyLandingPageLead)',
          'E-mail: follow-up se lead inativo >7 dias (sendFollowUpEmail)',
          'Automação: onLeadCreatedEnrich (enriquecimento automático)',
          'Automação: checkLeadSLA (verificação diária SLAs)',
        ]}
      />

      {/* JORNADA 2 — VIA LINK DE LEAD */}
      <FlowJourney
        title="Jornada 2 — Comercial envia link de questionário"
        subtitle="Gera link → Envia ao cliente → Lead → Pipeline → Proposta → Compliance → Risk Scoring → SENTINEL → Contrato → Assinatura"
        color="bg-gradient-to-r from-[#002443] to-[#003366]"
        badge="Link → Contrato"
        steps={[
          { title: 'Comercial gera link rastreável', actor: 'Comercial', page: 'LinksQuestionariosLeads', desc: 'Escolhe tipo de questionário (Pagsmile v5, Completo v2.0, Simplificado, PIX). Gera link com uniqueCode, nome do vendedor e UTMs. Copia e envia ao cliente via WhatsApp/e-mail.', details: ['OnboardingLink criado com uniqueCode, commercialAgentId, UTMs', 'Link: /QuestionarioLeadsPagsmile?ref=xxx ou /LeadQuestionnaire?ref=xxx'] },
          { title: 'Cliente preenche questionário público', actor: 'Cliente', page: 'QuestionarioLeadsPagsmile / LeadQuestionnaire', desc: 'Questionário multi-step. Pagsmile v5: 11 etapas, 10 segmentos, autocomplete CNPJ (14+ campos), slider distribuição TPV, taxas do concorrente, compliance/risco. V2.0: 10 etapas com autocomplete. Simplificado: dados mínimos.', details: ['Autocomplete CNPJ via BrasilAPI (3 APIs cascata)', 'Validação e-mail (MX check), telefone (DDD), site (HTTP check)', '16 flags silenciosas calculadas (v5) ou 11 flags (PIX v4)'] },
          { title: 'Sistema cria Lead + 3 IAs analisam em paralelo', actor: 'Sistema', desc: 'Lead criado com protocolo LEAD-YYYY-NNNNN, status="questionario_preenchido", questionnaireData completo. PRISCILA, Lead Qualifier e Análise de Risco Avançada executam simultaneamente.', details: ['PRISCILA: priscilaQualityScore (0-100), priscilaRiskLevel, priscilaDecisionPath', 'Lead Qualifier: leadQualifierLevel (EXCELENTE→INSUFICIENTE)', 'Risco Avançado: iaRiskScore, iaDecision, iaSuggestions[]', 'OnboardingLink.submissionCount incrementado', 'Slack notificado (notifyNewLead)'] },
          { title: 'Lead aparece na aba Questionários Recebidos', actor: 'Comercial', page: 'QuestionariosLeads', desc: 'Na sub-aba correta (Pagsmile v5, Completo, Simplificado ou PIX). Mostra protocolo, empresa, score PRISCILA com badge colorido, risco, TPV, SLA com indicador visual. Comercial clica "Iniciar Contato" → Lead.status = "em_contato_comercial".', details: ['LeadSLAIndicator: verde/amarelo/vermelho conforme tempo sem contato', 'LeadQualifierBadge: EXCELENTE (verde) → INSUFICIENTE (vermelho)', 'LeadQuickActions: Iniciar Contato, Gerar Proposta, Ver Detalhes'] },
          { title: 'Comercial gerencia no Pipeline Kanban', actor: 'Comercial', page: 'PipelineComercial', desc: 'Lead aparece na coluna correspondente ao status. Board Kanban com 7 colunas: Leads Quest. Completo, Em Contato + Simplificado, Proposta Enviada, Proposta Aceita, Compliance KYC, Contrato Gerado, Perdido.', details: ['Drag-and-drop: cada movimento atualiza Lead.status + cria LeadActivity', 'Métricas por coluna: TPV/mês, TPV/ano, Receita estimada/mês', 'PipelineAgingAlerts: alertas para leads parados acima do limite', 'PipelineConversionChart: gráfico de conversão entre estágios'] },
          { title: 'Comercial cria Proposta (1 de 3 tipos)', actor: 'Comercial', page: 'CriarProposta / CriarPropostaPadrao / CriarPropostaPix', desc: 'Escolhe tipo de proposta: Personalizada (taxas editáveis por bandeira × 4 faixas, antecipação, PIX, boleto, fees, setup), Padrão por Segmento (taxas fixas do SegmentDefaultRates) ou PIX (taxa % ou fixo + TPV mínimo 3 meses).', details: ['PartnerSelector: seleciona parceiro adquirente para validação de limites', 'CardTaxasCartao: Visa, Master, Elo, Amex, Outras × 1x/2-6x/7-12x/13-21x', 'ProfitabilityPanel: simulação receita MDR + antecipação + fees - custos = margem', 'Código gerado: PROP-YYYY-NNNNN + tokenPublico (64 chars)', 'Validação obrigatória: nome, CNPJ 14 dígitos, MCC, contato, ≥1 taxa'] },
          { title: 'Comercial envia link público da proposta ao cliente', actor: 'Comercial', desc: 'Copia link /PropostaPublica?token=xxx (ou PropostaPadraoPublica ou PropostaPixPublica) e envia ao cliente via WhatsApp, e-mail ou qualquer canal. Lead.status → "proposta_enviada". LeadActivity registrada.', details: ['AuditLog criado: código proposta, responsável, data', 'Lead.currentProposalId atualizado'] },
          { title: 'Cliente visualiza proposta completa', actor: 'Cliente', page: 'PropostaPublica / PropostaPadraoPublica / PropostaPixPublica', desc: 'Proposta carregada pelo token. Status → "visualizada" na primeira visualização (idempotente via sessionStorage). Notificação Slack disparada (notifyProposalViewed).', details: ['TaxasPorBandeiraPublic: tabela completa por bandeira e faixa', 'ParcelasTableDetalhada: simulação valor líquido 1x-21x por bandeira', 'ExportButtons: PDF e impressão'] },
          { title: 'Cliente decide: Aceitar, Recusar ou Contrapropor', actor: 'Cliente', desc: 'Três opções via modais: AceiteModal (aceite digital), RecusaModal (motivo obrigatório), ContrapropostaModal (sugestão de novas taxas). Se expirada → ações bloqueadas.', details: ['Aceitar: status=aceita, acceptedDate, Lead.status=proposta_aceita, Slack notificado', 'Recusar: status=recusada, rejectedDate, rejectedReason, Lead.status=proposta_recusada', 'Contrapropor: status=contraproposta, counterProposalDetails, Lead.status=em_contato_comercial'] },
          { title: 'Após aceite → Cliente redireciona para Compliance/KYC', actor: 'Sistema', page: 'ComplianceDinamico', desc: 'Sistema resolve o template de compliance correto via segmentToComplianceV4Map (ex: ecommerce → ComplianceEcommerceV4). useLeadPrefill pré-preenche campos com dados do Lead. CNPJ e endereço já enriquecidos.', details: ['DynamicQuestionnaire carrega perguntas da entidade Question filtradas por templateId', 'Agrupamento automático em steps de 4 perguntas', 'Auto-save: ComplianceSession (banco) + localStorage', 'ComplianceFieldAlerts: alertas visuais para respostas de risco'] },
          { title: 'Cliente preenche questionário de compliance', actor: 'Cliente', desc: 'Preenche perguntas restantes não pré-preenchidas: estrutura societária, UBOs, PLD/AML, sanções, atividade específica do segmento. Lógica condicional ativa/desativa perguntas conforme respostas.' },
          { title: 'Cliente faz upload de documentos obrigatórios', actor: 'Cliente', page: 'DocumentUploadFull', desc: 'DocumentUploadFull com DynamicDocumentUploader. Documentos por template: Contrato Social, Comprovante CNPJ, Comprovante Endereço, etc. Validação de formato (PDF/JPG/PNG) e tamanho (max 10MB). Progress bar.', details: ['DocumentUpload[] criados com validationStatus=Pendente', 'Documentos condicionais ativados por respostas do questionário'] },
          { title: 'Redirect para CAF: Liveness + Facematch (biometria)', actor: 'Cliente + CAF', desc: 'Após upload, redirect para CAF com URL por segmento. Subseller completa verificação biométrica: Liveness (prova de vida) + Facematch (comparação com documento). Resultado registrado.', details: ['10 URLs de CAF diferentes por segmento', 'ExternalValidationResult registrado com resultado'] },
          { title: 'Merchant + OnboardingCase criados', actor: 'Sistema', desc: 'createMerchantAndCase() cria Merchant (type=PJ, cpfCnpj, fullName, companyName, email, onboardingStatus="Em Análise") + OnboardingCase (merchantId, templateId, status=Pendente) + QuestionnaireResponse[]. IDs persistidos.', details: ['Se Lead existente: Lead.onboardingCaseId atualizado, Lead.status=kyc_iniciado', 'ComplianceSession.status=completed'] },
          { title: 'Motor Risk Scoring v4 executa scoring quantitativo', actor: 'Sistema', desc: 'calculateRiskScoreV4: C1 (score base por segmento) + C2 (variáveis V01-V53 conforme respostas) + C3 (enriquecimento E01-E11 se BDC/CAF disponível). Verifica bloqueios B01-B10.', details: ['Score final = max(0, min(849, C1+C2+C3)). Bloqueios → score=1000', 'Subfaixa: 1A(0-149) → 4(650-849) → 5(850+ bloqueio)', 'Rolling Reserve: 0% (1A-1B) → 20% (3B-4)', 'Monitoramento: PADRÃO (1A) → MÁXIMO (4)', 'ComplianceScore persistido com detalhamento completo'] },
          { title: 'IA SENTINEL gera parecer qualitativo em 3 fases', actor: 'IA', desc: 'Fase 1: Score questionário (análise respostas). Fase 2: Validações externas (CAF + BigDataCorp). Fase 3: Score composto + findings + quality assessment + parecer final. OnboardingCase atualizado com riskScoreV4, subfaixa, rollingReservePercent, monitoramentoNivel.', details: ['ComplianceFinding[] criados por severidade', 'Decisão: 1A-3B → Aprovado automático, 4 → Revisão Manual, 5 → Bloqueio', 'nivel_confianca_ia registrado (0-100)'] },
          { title: 'Sistema pré-gera Contrato por IA', actor: 'Sistema', desc: 'preGenerateContract() usa Lead + Proposal aceita + OnboardingCase para pré-gerar Contract com todos os campos: dados cliente, taxas herdadas da proposta, módulos (cartão+PIX+boleto), SLAs, Rolling Reserve do scoring v4, cláusulas.', details: ['Contract.status = "pre_generated"', 'Contract.ratesSourceType = "proposal"', 'Módulos definidos pelo tipo de proposta aceita'] },
          { title: 'Comercial revisa e envia Contrato', actor: 'Comercial', page: 'EditorContrato', desc: 'Revisa campos pré-preenchidos, complementa dados faltantes (representante legal, dados bancários, testemunhas). Define cláusulas adicionais se necessário. Envia link público /ContratoPublico?code=xxx ao cliente.', details: ['Contract.status = "ready" → "sent"', 'AuditLog registra envio'] },
          { title: 'Cliente assina Contrato digitalmente', actor: 'Cliente', page: 'ContratoPublico', desc: 'Visualiza contrato completo com todas as cláusulas (27 seções). Assina digitalmente com registro de IP, data/hora e nome. Contract.status → "signed", signedDate registrada. Lead.status → "ativado".', details: ['AuditLog + LeadActivity registram assinatura', 'RevalidationSchedule agendada automaticamente baseada na subfaixa', 'Frequência: 1A-1B=12 meses, 2A-2B=9 meses, 3A-3B=6 meses, 4=3 meses'] },
        ]}
        entitiesCreated={['OnboardingLink (link rastreável com UTMs)', 'OnboardingAnalytics (tracking de acessos)', 'Lead (protocolo, scores 3 IAs, questionnaireData)', 'LeadActivity (cada interação registrada)', 'Proposal / PixProposal (com versionamento e tokenPublico)', 'Merchant (type=PJ, dados empresa)', 'OnboardingCase (status, scores, subfaixa)', 'ComplianceSession (sessão retomável)', 'QuestionnaireResponse[] (respostas)', 'DocumentUpload[] (docs obrigatórios)', 'ComplianceScore (motor v4 detalhado)', 'ComplianceFinding[] (por severidade)', 'Contract (pré-gerado IA, taxas herdadas)', 'RevalidationSchedule (revalidação periódica)', 'AuditLog (cada ação)']}
        notificacoes={['Slack: novo lead (notifyNewLead)', 'Slack: proposta visualizada (notifyProposalViewed)', 'Slack: proposta aceita (notifyProposalAccepted)', 'E-mail: follow-up se lead inativo >7 dias (sendFollowUpEmail)', 'Automação: checkLeadSLA (verificação diária)', 'Automação: checkExpiringProposals (propostas vencendo)', 'Automação: onLeadCreatedEnrich (enriquecimento automático)']}
      />

      {/* JORNADA 3 — VIA REUNIÃO MANUAL */}
      <FlowJourney
        title="Jornada 3 — Comercial preenche após reunião"
        subtitle="Reunião → Questionário interno → Lead → Pipeline → Proposta → Aceite → Compliance → Risk Scoring → SENTINEL → Contrato → Assinatura"
        color="bg-gradient-to-r from-amber-600 to-orange-500"
        badge="Reunião → Contrato"
        steps={[
          { title: 'Comercial tem reunião com cliente', actor: 'Comercial', desc: 'Reunião presencial ou remota. Coleta dados: empresa, CNPJ, volume, taxas atuais, desafios, expectativas.', details: ['Pode ser durante a reunião (preenche em tempo real)', 'Ou após a reunião (preenche de memória/anotações)'] },
          { title: 'Preenche Questionário de Reunião', actor: 'Comercial', page: 'QuestionarioReuniao / QuestionarioReuniaoPix', desc: 'Formulário com 5 seções: Informações do Cliente, Detalhamento do Negócio, Volume e Transações, Taxas e Custos Atuais, Desafios e Oportunidades.', details: ['MeetingFormBasicInfo: nome, CPF/CNPJ, e-mail, telefone, website, tipo negócio, contato', 'MeetingFormBusinessDetails: descrição, canais de venda, revenue breakdown', 'MeetingFormVolume: TPV, ticket médio, transações/mês, crescimento', 'MeetingFormCurrentRates: MDR 1x/2-6x/7-12x, PIX, boleto, antecipação, fee, antifraude', 'MeetingFormChallenges: desafios, funcionalidades críticas, prazo, notas'] },
          { title: 'Ao salvar → InternalCommercialQuestionnaire + Lead criados', actor: 'Sistema', desc: 'InternalCommercialQuestionnaire persistido com todos os dados. Lead criado automaticamente com protocolo LEAD-YYYY-NNNNN, dados extraídos do formulário (empresa, CNPJ, contato, TPV). Lead.status = "questionario_preenchido".', details: ['LeadActivity criada: origem "questionário_reunião"', 'Slack notificado (notifyNewLead)', 'PRISCILA e Lead Qualifier NÃO executam automaticamente neste fluxo (preenchimento interno)'] },
          { title: 'Lead aparece em Questionários Recebidos', actor: 'Comercial', page: 'QuestionariosLeads → aba Reunião', desc: 'Aparece na sub-aba "Questionário Reunião" com badge de origem. Mostra empresa, CNPJ, TPV, data. Comercial pode revisar e editar os dados antes de prosseguir.' },
          { title: 'Comercial gerencia no Pipeline Kanban', actor: 'Comercial', page: 'PipelineComercial', desc: 'Lead aparece na coluna "Leads Quest. Completo". Comercial arrasta entre 7 colunas conforme o avanço. Cada drag-and-drop atualiza Lead.status e cria LeadActivity. Métricas de TPV e receita por coluna visíveis.', details: ['PipelineAgingAlerts: alertas para leads parados', 'PipelineConversionChart: gráfico de conversão'] },
          { title: 'Comercial cria Proposta (1 de 3 tipos)', actor: 'Comercial', page: 'CriarProposta / CriarPropostaPadrao / CriarPropostaPix', desc: 'Escolhe tipo: Personalizada (taxas editáveis por bandeira × 4 faixas), Padrão por Segmento (taxas fixas) ou PIX (taxa % ou fixo + TPV mínimo). Seleciona parceiro adquirente. Preenche taxas. Simula rentabilidade (ProfitabilityPanel).', details: ['PartnerSelector: validação de taxa vs custo (visual vermelho se abaixo)', 'Código PROP-YYYY-NNNNN + tokenPublico (64 chars) gerados', 'AuditLog registrado', 'Lead.currentProposalId atualizado, Lead.status → "proposta_enviada"'] },
          { title: 'Comercial envia link público da proposta ao cliente', actor: 'Comercial', desc: 'Copia link /PropostaPublica?token=xxx e envia via WhatsApp/e-mail. O cliente pode visualizar as taxas completas sem autenticação.' },
          { title: 'Cliente visualiza proposta', actor: 'Cliente', page: 'PropostaPublica', desc: 'Proposta carregada pelo token. Na primeira visualização: Proposal.status → "visualizada", Slack notificado (notifyProposalViewed). Exibe tabela por bandeira, parcelas 1x-21x, PIX, boleto, fees, antecipação, mínimo garantido.' },
          { title: 'Cliente decide: Aceitar, Recusar ou Contrapropor', actor: 'Cliente', desc: 'AceiteModal: aceite digital → status=aceita, Lead.status=proposta_aceita, Slack (notifyProposalAccepted). RecusaModal: motivo obrigatório → status=recusada. ContrapropostaModal: sugestão de novas taxas → status=contraproposta.', details: ['Se aceite: redirect automático para ComplianceDinamico com model do segmento correto', 'Se recusa: Lead.status=proposta_recusada, Comercial notificado', 'Se contraproposta: Lead.status=em_contato_comercial, Comercial renegocia'] },
          { title: 'Após aceite → Cliente preenche Compliance/KYC', actor: 'Cliente', page: 'ComplianceDinamico', desc: 'Template de compliance v4 carregado conforme segmento (via segmentToComplianceV4Map). useLeadPrefill pré-preenche campos. Perguntas agrupadas em steps de 4 com lógica condicional. Auto-save ativo.', details: ['ComplianceSession criada para retomada', 'ComplianceFieldAlerts exibe alertas de risco em tempo real'] },
          { title: 'Cliente faz upload de documentos + Biometria CAF', actor: 'Cliente', page: 'DocumentUploadFull + CAF', desc: 'Upload de documentos obrigatórios do template (Contrato Social, Comprovante CNPJ, etc.) na plataforma. Após upload: redirect para CAF (Liveness + Facematch). Resultado biometria registrado.', details: ['DocumentUpload[] criados com validationStatus=Pendente', 'ExternalValidationResult registrado com resultado CAF'] },
          { title: 'Merchant + OnboardingCase criados', actor: 'Sistema', desc: 'createMerchantAndCase(): Merchant (type=PJ, dados empresa) + OnboardingCase (status=Pendente) + QuestionnaireResponse[]. Lead.onboardingCaseId atualizado. Lead.status=kyc_iniciado.' },
          { title: 'Motor Risk Scoring v4 executa', actor: 'Sistema', desc: 'C1 (base segmento) + C2 (variáveis V01-V53) + C3 (enriquecimento E01-E11). Verifica bloqueios B01-B10. Score 0-1000 → subfaixa → Rolling Reserve → nível monitoramento. ComplianceScore persistido.', details: ['Decisão automática: 1A-3B Aprovado, 4 Revisão Manual, 5 Bloqueio'] },
          { title: 'IA SENTINEL gera parecer qualitativo', actor: 'IA', desc: 'Análise em 3 fases: questionário, validações externas, score composto. ComplianceFinding[] criados. Quality assessment. Parecer final com recomendação e nível de confiança. OnboardingCase atualizado.' },
          { title: 'Sistema pré-gera Contrato por IA', actor: 'Sistema', desc: 'preGenerateContract(): Contract com dados do Lead + Proposal aceita + OnboardingCase. Taxas herdadas, módulos, SLAs, Rolling Reserve. Contract.status = "pre_generated".', details: ['Cláusulas preenchidas por IA', 'Módulos definidos pelo tipo de proposta'] },
          { title: 'Comercial revisa e envia Contrato', actor: 'Comercial', page: 'EditorContrato', desc: 'Revisa campos, complementa representante legal, dados bancários, testemunhas. Envia link /ContratoPublico?code=xxx. Contract.status → "sent".' },
          { title: 'Cliente assina Contrato digitalmente', actor: 'Cliente', page: 'ContratoPublico', desc: 'Visualiza 27 seções de cláusulas. Assina com registro de IP/data/hora/nome. Contract.status → "signed". Lead.status → "ativado". RevalidationSchedule agendada automaticamente.' },
        ]}
        entitiesCreated={['InternalCommercialQuestionnaire (dados reunião)', 'Lead (protocolo, questionnaireData)', 'LeadActivity (cada interação)', 'Proposal (taxas, parceiro, versionamento)', 'Merchant + OnboardingCase', 'ComplianceSession + QuestionnaireResponse[]', 'DocumentUpload[] + ExternalValidationResult', 'ComplianceScore + ComplianceFinding[]', 'Contract (pré-gerado IA)', 'RevalidationSchedule', 'AuditLog (cada ação)']}
        notificacoes={['Slack: novo lead (notifyNewLead)', 'Slack: proposta visualizada (notifyProposalViewed)', 'Slack: proposta aceita (notifyProposalAccepted)', 'E-mail: follow-up se inativo >7 dias (sendFollowUpEmail)']}
      />

      {/* JORNADA 4 — VIA ROBÔ IA */}
      <FlowJourney
        title="Jornada 4 — Notas de reunião processadas por IA"
        subtitle="Cola texto → IA extrai dados → Revisão → Lead → Pipeline → Proposta → Aceite → Compliance → Risk Scoring → SENTINEL → Contrato → Assinatura"
        color="bg-gradient-to-r from-pink-600 to-rose-500"
        badge="Robô IA → Contrato"
        steps={[
          { title: 'Comercial cola notas de reunião', actor: 'Comercial', page: 'ProcessMeetingNotes', desc: 'Cole texto livre de anotações, transcrição de reunião, e-mails ou mensagens. Pode ser desestruturado e informal — abreviações, mistura de idiomas, formato livre.', details: ['Campo de texto grande para colar conteúdo', 'Botão "Processar com IA" dispara análise'] },
          { title: 'IA processa e extrai dados estruturados', actor: 'IA', desc: 'InvokeLLM (backend processMeetingNotes) analisa texto e extrai 15+ campos: nome empresa, CNPJ, contato (nome, e-mail, telefone, cargo), TPV, ticket médio, taxas atuais (MDR 1x/2-6x/7-12x, PIX, antecipação), tipo negócio, desafios, expectativas. Retorna JSON.', details: ['response_json_schema garante estrutura correta', 'origemIA=true marcado no questionário gerado', 'Processamento em < 30 segundos'] },
          { title: 'Comercial revisa dados extraídos pela IA', actor: 'Comercial', page: 'QuestionarioReuniao (modo edição)', desc: 'IA gera InternalCommercialQuestionnaire pré-preenchido com status "ai_preenchido". Formulário com 5 abas (Dados Básicos, Negócio, Volume, Taxas, Desafios) exibe campos pré-preenchidos. Comercial OBRIGATORIAMENTE revisa, corrige e complementa antes de salvar.', details: ['Revisão humana obrigatória (human-in-the-loop)', 'Comercial assume responsabilidade ao clicar Salvar', 'Campos com baixa confiança da IA ficam vazios'] },
          { title: 'Ao salvar → Lead criado automaticamente', actor: 'Sistema', desc: 'InternalCommercialQuestionnaire persistido com origemIA=true. Lead criado com dados extraídos: protocolo LEAD-YYYY-NNNNN, empresa, CNPJ, contato, TPV, status="questionario_preenchido". LeadActivity registra origem "robô_ia".', details: ['Slack notificado (notifyNewLead)', 'Lead aparece em QuestionariosLeads → aba "Robô IA" com badge 🤖'] },
          { title: 'Lead aparece em Questionários Recebidos', actor: 'Comercial', page: 'QuestionariosLeads → aba Robô IA', desc: 'Na sub-aba "Questionário com Robô" com badge 🤖 IA. Exibe empresa, CNPJ, TPV, data. Status: "ai_preenchido" até revisado → "preenchido". Comercial pode expandir para ver todas as respostas.' },
          { title: 'Comercial gerencia no Pipeline Kanban', actor: 'Comercial', page: 'PipelineComercial', desc: 'Lead aparece na coluna correspondente. Comercial arrasta entre 7 colunas. Cada drag-and-drop atualiza Lead.status + cria LeadActivity. Métricas de TPV e receita por coluna visíveis.', details: ['PipelineAgingAlerts: alertas para leads parados', 'PipelineConversionChart: gráfico de conversão entre estágios'] },
          { title: 'Comercial cria Proposta (1 de 3 tipos)', actor: 'Comercial', page: 'CriarProposta / CriarPropostaPadrao / CriarPropostaPix', desc: 'Dados do lead pré-preenchidos no formulário. Seleciona parceiro adquirente, define taxas por bandeira × 4 faixas, antecipação, PIX, boleto, fees. Simula rentabilidade. Gera código PROP-YYYY-NNNNN + token público.', details: ['Validação obrigatória: nome, CNPJ 14 dígitos, MCC, contato, ≥1 taxa', 'Lead.currentProposalId atualizado, Lead.status → "proposta_enviada"', 'AuditLog registrado'] },
          { title: 'Comercial envia link público da proposta', actor: 'Comercial', desc: 'Copia link /PropostaPublica?token=xxx e envia ao cliente via WhatsApp/e-mail.' },
          { title: 'Cliente visualiza proposta completa', actor: 'Cliente', page: 'PropostaPublica', desc: 'Proposta carregada pelo token. Primeira visualização: status → "visualizada", Slack notificado. Exibe tabela por bandeira, parcelas 1x-21x, PIX, boleto, fees, antecipação, TPV mínimo.', details: ['ExportButtons: PDF e impressão disponíveis'] },
          { title: 'Cliente decide: Aceitar, Recusar ou Contrapropor', actor: 'Cliente', desc: 'AceiteModal: aceite digital → status=aceita, Lead.status=proposta_aceita, Slack notificado. RecusaModal: motivo obrigatório. ContrapropostaModal: sugestão de novas taxas. Propostas expiradas: ações bloqueadas.', details: ['Se aceite: redirect automático para ComplianceDinamico do segmento correto'] },
          { title: 'Após aceite → Cliente preenche Compliance/KYC', actor: 'Cliente', page: 'ComplianceDinamico', desc: 'Template compliance v4 carregado conforme segmento. useLeadPrefill pré-preenche campos com dados do Lead. Perguntas em steps de 4 com lógica condicional. Auto-save em ComplianceSession + localStorage.' },
          { title: 'Upload de documentos + Biometria CAF', actor: 'Cliente', page: 'DocumentUploadFull + CAF', desc: 'Upload de documentos obrigatórios (Contrato Social, etc.) na plataforma. Após upload: redirect CAF (Liveness + Facematch). DocumentUpload[] criados. ExternalValidationResult registrado.' },
          { title: 'Merchant + OnboardingCase criados', actor: 'Sistema', desc: 'Merchant (type=PJ) + OnboardingCase (status=Pendente) + QuestionnaireResponse[]. Lead.onboardingCaseId atualizado. Lead.status=kyc_iniciado.' },
          { title: 'Motor Risk Scoring v4 + IA SENTINEL', actor: 'Sistema + IA', desc: 'Risk Scoring v4: C1+C2+C3 → score 0-1000 → subfaixa → Rolling Reserve → monitoramento. SENTINEL: 3 fases → findings + parecer final. ComplianceScore persistido. OnboardingCase atualizado com iaDecision.', details: ['1A-3B: Aprovado automático', '4: Revisão Manual obrigatória', '5: Bloqueio automático'] },
          { title: 'Sistema pré-gera Contrato por IA', actor: 'Sistema', desc: 'preGenerateContract(): Contract com dados Lead + Proposal + OnboardingCase. Taxas herdadas, módulos, SLAs, Rolling Reserve do scoring. Contract.status = "pre_generated".' },
          { title: 'Comercial revisa e envia Contrato', actor: 'Comercial', page: 'EditorContrato', desc: 'Revisa campos pré-preenchidos, complementa representante legal, dados bancários, testemunhas. Envia link /ContratoPublico?code=xxx. Contract.status → "sent".' },
          { title: 'Cliente assina Contrato digitalmente', actor: 'Cliente', page: 'ContratoPublico', desc: 'Visualiza contrato completo (27 seções). Assina com IP/data/hora/nome. Contract.status → "signed". Lead.status → "ativado". RevalidationSchedule agendada automaticamente.' },
        ]}
        entitiesCreated={['InternalCommercialQuestionnaire (origemIA=true)', 'Lead (protocolo, questionnaireData)', 'LeadActivity (cada interação)', 'Proposal (taxas, parceiro, versionamento)', 'Merchant + OnboardingCase', 'ComplianceSession + QuestionnaireResponse[]', 'DocumentUpload[] + ExternalValidationResult', 'ComplianceScore + ComplianceFinding[]', 'Contract (pré-gerado IA)', 'RevalidationSchedule', 'AuditLog (cada ação)']}
        notificacoes={['Slack: novo lead (notifyNewLead)', 'Slack: proposta visualizada (notifyProposalViewed)', 'Slack: proposta aceita (notifyProposalAccepted)', 'E-mail: follow-up se inativo >7 dias']}
      />

      {/* JORNADA 5 — VIA PROPOSTA PADRÃO (LINK RÁPIDO) */}
      <FlowJourney
        title="Jornada 5 — Cliente recebe link de Proposta Padrão"
        subtitle="Link rápido por segmento → Visualiza taxas → CTA → Questionário → Lead → IAs → Pipeline → Proposta Personalizada → Aceite → Compliance → Risk Scoring → SENTINEL → Contrato → Assinatura"
        color="bg-gradient-to-r from-[#2bc196] to-[#36706c]"
        badge="Link Rápido → Contrato"
        steps={[
          { title: 'Comercial copia link rápido por segmento', actor: 'Comercial', page: 'GestaoPropostasPadrao', desc: 'Na seção "Links Rápidos por Segmento" no topo da página, clica "Copiar Link" no card do segmento desejado (E-commerce, Educação, Infoprodutos, SaaS, Gateway, Marketplace, MPE, Dropshipping, Plataformas Verticais, Link de Pagamento).', details: ['Cada card identifica a StandardProposal com isDefaultForSegment=true para aquele segmento', 'URL gerada: /PropostaPadraoPublica?token=xxx', 'Admin pode criar/editar StandardProposal em CriarPropostaPadrao'] },
          { title: 'Comercial envia link ao cliente', actor: 'Comercial', desc: 'Envia o link via WhatsApp, e-mail ou qualquer canal. O cliente não precisa preencher nada para visualizar as taxas — é um catálogo público por segmento.' },
          { title: 'Cliente visualiza Proposta Padrão Pública', actor: 'Cliente', page: 'PropostaPadraoPublica', desc: 'Vê taxas completas por bandeira (Visa, Master, Elo, Amex, Outras) × 4 faixas (1x, 2-6x, 7-12x, 13-21x), taxa PIX (% ou fixo), boleto, antifraude, fee transação, 3DS, setup, antecipação (RAV), TPV mínimo garantido (3 meses). Design premium com logo Pagsmile.', details: ['TaxasPorBandeiraPublic: tabela completa por bandeira e faixa', 'ParcelasTableDetalhada: simulação valor líquido por bandeira de 1x até 21x', 'ExportButtons: gerar PDF ou imprimir proposta', 'Proposta apenas informativa — não gera lead automaticamente'] },
          { title: 'Cliente clica CTA "Quero Contratar"', actor: 'Cliente', desc: 'Botão CTA na proposta redireciona para o formulário de fechamento (FechamentoLandingPage) ou questionário de lead. O cliente preenche seus dados para receber uma proposta personalizada com taxas potencialmente melhores.' },
          { title: 'Cliente preenche formulário/questionário', actor: 'Cliente', page: 'FechamentoLandingPage / LeadQuestionnaire', desc: 'Formulário multi-step: dados da empresa (CNPJ autocomplete BrasilAPI), contato, volumetria (TPV, distribuição cartão/PIX/boleto), modelo de negócio. Submete dados completos.', details: ['CNPJ autocomplete preenche 14+ campos automaticamente', 'StandardProposalLead criado com referência à StandardProposal'] },
          { title: 'Sistema cria Lead + Proposal + dispara IAs', actor: 'Sistema', desc: 'Lead criado com protocolo LEAD-YYYY-NNNNN, sourceFlow="standard_proposal_link", businessSubCategory do segmento. Proposal criada automaticamente com taxas do SegmentDefaultRates. PRISCILA + Lead Qualifier + Risco Avançado executam em paralelo.', details: ['Lead.status = "proposta_enviada" (proposta já vinculada)', 'Lead.currentProposalId preenchido', 'Slack notificado (notifyNewLead + notifyStdProposalLead)', 'Redirect para ComplianceDinamico com model do segmento'] },
          { title: 'Lead aparece em Questionários Recebidos', actor: 'Comercial', page: 'QuestionariosLeads → aba Proposta Padrão', desc: 'Na sub-aba "Proposta Padrão" com badge do segmento. Mostra empresa, CNPJ, scores PRISCILA, TPV, SLA. Comercial pode criar proposta personalizada com taxas melhores.', details: ['StandardProposalResponsesModal: ver respostas completas', 'LeadQuickActions: Iniciar Contato, Gerar Proposta personalizada'] },
          { title: 'Comercial gerencia no Pipeline Kanban', actor: 'Comercial', page: 'PipelineComercial', desc: 'Lead já aparece na coluna "Proposta Enviada" (pois proposta foi criada automaticamente). Comercial pode criar proposta personalizada (taxas negociadas) ou manter a proposta padrão. Arrasta entre colunas conforme avanço.', details: ['Métricas por coluna: TPV/mês, TPV/ano, Receita estimada', 'PipelineAgingAlerts + PipelineConversionChart'] },
          { title: 'Se Comercial cria Proposta Personalizada (opcional)', actor: 'Comercial', page: 'CriarProposta', desc: 'Se o Comercial quer oferecer taxas negociadas melhores, cria Proposta Personalizada com taxas editáveis. Seleciona parceiro, simula rentabilidade. Gera código PROP-YYYY-NNNNN + token. Envia novo link ao cliente.', details: ['Proposta anterior (padrão) pode ser mantida ou substituída', 'Versionamento: nova proposta com previousVersionId'] },
          { title: 'Cliente aceita Proposta (padrão ou personalizada)', actor: 'Cliente', page: 'PropostaPublica / PropostaPadraoPublica', desc: 'Se proposta padrão: cliente já foi redirecionado após formulário. Se personalizada: cliente visualiza, aceita via AceiteModal. Status → "aceita", Lead.status → "proposta_aceita", Slack notificado.', details: ['Recusa: motivo obrigatório via RecusaModal', 'Contraproposta: sugestão de taxas via ContrapropostaModal'] },
          { title: 'Após aceite → Cliente preenche Compliance/KYC', actor: 'Cliente', page: 'ComplianceDinamico', desc: 'Template compliance v4 carregado conforme segmento. useLeadPrefill pré-preenche com dados do Lead. Perguntas em steps de 4. Lógica condicional. Auto-save em ComplianceSession + localStorage.' },
          { title: 'Upload de documentos + Biometria CAF', actor: 'Cliente', page: 'DocumentUploadFull + CAF', desc: 'Upload de documentos obrigatórios do template. Após upload: redirect para CAF (Liveness + Facematch). DocumentUpload[] criados com validationStatus=Pendente. ExternalValidationResult registrado.' },
          { title: 'Merchant + OnboardingCase criados', actor: 'Sistema', desc: 'Merchant (type=PJ) + OnboardingCase (status=Pendente) + QuestionnaireResponse[]. IDs salvos em localStorage para evitar duplicação. Lead.onboardingCaseId atualizado. Lead.status=kyc_iniciado.' },
          { title: 'Motor Risk Scoring v4 + IA SENTINEL', actor: 'Sistema + IA', desc: 'Risk Scoring v4: C1 (base segmento) + C2 (variáveis V01-V53) + C3 (enriquecimento E01-E11). Bloqueios B01-B10. Score 0-1000 → subfaixa → Rolling Reserve → monitoramento. SENTINEL: 3 fases → findings + parecer + recomendação. ComplianceScore persistido.', details: ['1A-3B: Aprovado automático', '4: Revisão Manual', '5: Bloqueio'] },
          { title: 'Sistema pré-gera Contrato por IA', actor: 'Sistema', desc: 'preGenerateContract(): Contract com dados Lead + Proposal aceita + OnboardingCase. Taxas herdadas da proposta (padrão ou personalizada), módulos, SLAs, Rolling Reserve. Contract.status = "pre_generated".' },
          { title: 'Comercial revisa e envia Contrato', actor: 'Comercial', page: 'EditorContrato', desc: 'Revisa todos os campos, complementa representante legal, dados bancários, testemunhas. Define cláusulas adicionais se necessário. Envia link /ContratoPublico?code=xxx. Contract.status → "sent".' },
          { title: 'Cliente assina Contrato digitalmente', actor: 'Cliente', page: 'ContratoPublico', desc: 'Visualiza contrato completo com 27 seções de cláusulas. Assina digitalmente com registro de IP, data/hora e nome. Contract.status → "signed", signedDate registrada. Lead.status → "ativado". RevalidationSchedule agendada automaticamente.', details: ['Frequência revalidação baseada na subfaixa: 1A-1B=12 meses, 2A-2B=9 meses, 3A-3B=6 meses, 4=3 meses', 'AuditLog + LeadActivity registram assinatura'] },
        ]}
        entitiesCreated={['StandardProposalLead (dados do formulário)', 'Lead (protocolo, scores IAs, sourceFlow=standard_proposal_link)', 'LeadActivity (cada interação)', 'Proposal (automática com taxas segmento OU personalizada)', 'Merchant + OnboardingCase', 'ComplianceSession + QuestionnaireResponse[]', 'DocumentUpload[] + ExternalValidationResult', 'ComplianceScore + ComplianceFinding[]', 'Contract (pré-gerado IA, taxas herdadas)', 'RevalidationSchedule', 'AuditLog']}
        notificacoes={['Slack: novo lead (notifyNewLead)', 'Slack: lead via proposta padrão (notifyStdProposalLead)', 'Slack: proposta visualizada (notifyProposalViewed)', 'Slack: proposta aceita (notifyProposalAccepted)', 'E-mail: follow-up se inativo >7 dias']}
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