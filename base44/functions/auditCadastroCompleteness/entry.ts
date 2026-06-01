import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Audita TODAS as entidades do sistema relacionadas a um Merchant e reporta
 * quais têm dados, onde aparecem no Cadastro e onde estão as lacunas.
 *
 * Saída:
 * {
 *   merchantId,
 *   merchantName,
 *   sections: [
 *     {
 *       id, title, description,
 *       entities: [
 *         {
 *           name,                  // nome da entidade (ex: "Lead")
 *           description,           // o que é
 *           recordsFound,          // quantos registros existem
 *           records: [...],        // amostra para debug
 *           displayedIn,           // aba onde é exibido (ou null)
 *           status,                // 'ok' | 'gap' | 'empty'
 *           note                   // observação
 *         }
 *       ]
 *     }
 *   ],
 *   summary: { total, ok, gap, empty, percentComplete }
 * }
 */

async function safeQuery(fn) {
  try {
    const result = await fn();
    return Array.isArray(result) ? result : [];
  } catch (e) {
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { merchantId } = await req.json();
    if (!merchantId) {
      return Response.json({ error: 'merchantId obrigatório' }, { status: 400 });
    }

    // ── 1) Fetch the merchant ──
    const merchants = await safeQuery(() => base44.asServiceRole.entities.Merchant.filter({ id: merchantId }));
    const merchant = merchants[0];
    if (!merchant) {
      return Response.json({ error: 'Merchant não encontrado' }, { status: 404 });
    }

    const cpfCnpj = merchant.cpfCnpj;
    const email = merchant.email;
    const merchantName = merchant.companyName || merchant.fullName;

    // ── 2) Fetch core relations (cases, leads, etc) ──
    const cases = await safeQuery(() => base44.asServiceRole.entities.OnboardingCase.filter({ merchantId }));
    const caseIds = cases.map(c => c.id);

    const leadsByCnpj = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.Lead.filter({ cpfCnpj })) : [];
    const leadsByEmail = email ? await safeQuery(() => base44.asServiceRole.entities.Lead.filter({ email })) : [];
    const allLeadsMap = new Map();
    [...leadsByCnpj, ...leadsByEmail].forEach(l => allLeadsMap.set(l.id, l));
    const allLeads = Array.from(allLeadsMap.values());
    const leadIds = allLeads.map(l => l.id);

    const proposalsByCnpj = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.Proposal.filter({ clienteCnpj: cpfCnpj })) : [];
    const proposalsByLead = leadIds.length > 0
      ? (await Promise.all(leadIds.map(id => safeQuery(() => base44.asServiceRole.entities.Proposal.filter({ leadId: id }))))).flat()
      : [];
    const allPropMap = new Map();
    [...proposalsByCnpj, ...proposalsByLead].forEach(p => allPropMap.set(p.id, p));
    const allProposals = Array.from(allPropMap.values());

    const contractsByCnpj = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.Contract.filter({ clientCnpj: cpfCnpj })) : [];
    const contractsByMerchant = await safeQuery(() => base44.asServiceRole.entities.Contract.filter({ merchantId }));
    const allContractsMap = new Map();
    [...contractsByCnpj, ...contractsByMerchant].forEach(c => allContractsMap.set(c.id, c));
    const allContracts = Array.from(allContractsMap.values());

    // ── 3) Build report by section ──
    const report = [];

    // ┌─────────────────────────────────────────┐
    // │ Seção 1: Identidade & Cadastro          │
    // └─────────────────────────────────────────┘
    report.push({
      id: 'identidade',
      title: 'Identidade & Cadastro',
      description: 'Dados básicos do merchant',
      entities: [
        {
          name: 'Merchant',
          description: 'Registro principal do cliente',
          recordsFound: 1,
          displayedIn: 'Aba "Dados Cadastrais"',
          status: 'ok',
          note: 'Sempre exibido',
        },
      ],
    });

    // ┌─────────────────────────────────────────┐
    // │ Seção 2: Origem & Captação              │
    // └─────────────────────────────────────────┘
    const landingLeadsByCnpj = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.LandingPageLead.filter({ cpfCnpj })) : [];
    const landingLeadsByEmail = email ? await safeQuery(() => base44.asServiceRole.entities.LandingPageLead.filter({ email })) : [];
    const landingLeadIds = [...new Set([...landingLeadsByCnpj, ...landingLeadsByEmail].map(x => x.id))];

    const simplifiedLeads = email ? await safeQuery(() => base44.asServiceRole.entities.SimplifiedLead.filter({ email })) : [];
    const introducerLeadsByEmail = email ? await safeQuery(() => base44.asServiceRole.entities.IntroducerLead.filter({ email })) : [];
    const introducerLeadsByCnpj = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.IntroducerLead.filter({ cpfCnpj })) : [];
    const stdProposalLeads = email ? await safeQuery(() => base44.asServiceRole.entities.StandardProposalLead.filter({ email })) : [];
    const landingEvents = email ? await safeQuery(() => base44.asServiceRole.entities.LandingPageEvent.filter({ email })) : [];

    report.push({
      id: 'origem',
      title: 'Origem & Captação',
      description: 'Por onde o cliente entrou no funil',
      entities: [
        { name: 'Lead', description: 'Lead principal (questionário Pagsmile)', recordsFound: allLeads.length, displayedIn: 'Abas "Comercial" e "Lead & IA"', status: allLeads.length > 0 ? 'ok' : 'empty' },
        { name: 'LandingPageLead', description: 'Lead via landing page de parceiro', recordsFound: landingLeadIds.length, displayedIn: null, status: landingLeadIds.length > 0 ? 'gap' : 'empty', note: landingLeadIds.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'SimplifiedLead', description: 'Lead via formulário simplificado', recordsFound: simplifiedLeads.length, displayedIn: null, status: simplifiedLeads.length > 0 ? 'gap' : 'empty', note: simplifiedLeads.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'IntroducerLead', description: 'Lead vindo de parceiro/introducer', recordsFound: introducerLeadsByEmail.length + introducerLeadsByCnpj.length, displayedIn: null, status: (introducerLeadsByEmail.length + introducerLeadsByCnpj.length) > 0 ? 'gap' : 'empty', note: (introducerLeadsByEmail.length + introducerLeadsByCnpj.length) > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'StandardProposalLead', description: 'Lead que veio de proposta padrão', recordsFound: stdProposalLeads.length, displayedIn: null, status: stdProposalLeads.length > 0 ? 'gap' : 'empty', note: stdProposalLeads.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'LandingPageEvent', description: 'Eventos de tracking em landing pages', recordsFound: landingEvents.length, displayedIn: null, status: landingEvents.length > 0 ? 'gap' : 'empty', note: landingEvents.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'LeadActivity', description: 'Atividades/interações comerciais com o lead', recordsFound: leadIds.length > 0 ? (await Promise.all(leadIds.map(id => safeQuery(() => base44.asServiceRole.entities.LeadActivity.filter({ leadId: id }))))).flat().length : 0, displayedIn: 'Aba "Comercial" (parcial)', status: 'ok' },
      ],
    });

    // ┌─────────────────────────────────────────┐
    // │ Seção 3: Coletas Gateway (subsellers)   │
    // └─────────────────────────────────────────┘
    const subsellerCollections = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.SubsellerInfoCollection.filter({ gateway_cnpj: cpfCnpj })) : [];
    const submissionsByGateway = subsellerCollections.length > 0
      ? (await Promise.all(subsellerCollections.map(c => safeQuery(() => base44.asServiceRole.entities.SubsellerInfoSubmission.filter({ collection_id: c.id }))))).flat()
      : [];

    report.push({
      id: 'gateway',
      title: 'Coletas Gateway (Subsellers)',
      description: 'Submissões recebidas via links de coleta para gateways',
      entities: [
        { name: 'SubsellerInfoCollection', description: 'Links de coleta gerados para este gateway', recordsFound: subsellerCollections.length, displayedIn: null, status: subsellerCollections.length > 0 ? 'gap' : 'empty', note: subsellerCollections.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'SubsellerInfoSubmission', description: 'Submissões com lista de subsellers recebidas', recordsFound: submissionsByGateway.length, displayedIn: null, status: submissionsByGateway.length > 0 ? 'gap' : 'empty', note: submissionsByGateway.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'Subsellers (Merchant filhos)', description: 'Subsellers criados a partir deste gateway', recordsFound: (await safeQuery(() => base44.asServiceRole.entities.Merchant.filter({ parentMerchantId: merchantId }))).length, displayedIn: 'Aba "Subsellers"', status: 'ok' },
      ],
    });

    // ┌─────────────────────────────────────────┐
    // │ Seção 4: Compliance & Onboarding        │
    // └─────────────────────────────────────────┘
    const responses = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: id }))))).flat()
      : [];
    const scores = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: id }))))).flat()
      : [];
    const findings = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.ComplianceFinding.filter({ onboarding_case_id: id }))))).flat()
      : [];
    const helenaAnalyses = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.HelenaAnalysis.filter({ onboardingCaseId: id }))))).flat()
      : [];
    const snapshots = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.Snapshot.filter({ onboarding_case_id: id }))))).flat()
      : [];
    const sentinelFeedback = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.SentinelFeedback.filter({ onboarding_case_id: id }))))).flat()
      : [];
    const qualityAssessments = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.QualityAssessment.filter({ onboardingCaseId: id }))))).flat()
      : [];
    const subsellerScores = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.SubsellerScore.filter({ onboardingCaseId: id }))))).flat()
      : [];
    const complianceSessions = email ? await safeQuery(() => base44.asServiceRole.entities.ComplianceSession.filter({ email })) : [];
    const planosMonitoramento = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.PlanoMonitoramento.filter({ onboarding_case_id: id }))))).flat()
      : [];
    const termosV52 = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.TermoAdicionalV5_2.filter({ onboarding_case_id: id }))))).flat()
      : [];

    report.push({
      id: 'compliance',
      title: 'Compliance & Risco',
      description: 'Análise, scores, findings e auditoria do Sentinel',
      entities: [
        { name: 'OnboardingCase', description: 'Caso(s) de onboarding', recordsFound: cases.length, displayedIn: 'Aba "Compliance"', status: 'ok' },
        { name: 'QuestionnaireResponse', description: 'Respostas dos questionários', recordsFound: responses.length, displayedIn: 'Aba "Dados Cadastrais"', status: 'ok' },
        { name: 'ComplianceScore', description: 'Scores e classificações', recordsFound: scores.length, displayedIn: 'Aba "Compliance"', status: 'ok' },
        { name: 'ComplianceFinding', description: 'Findings detalhados do Sentinel', recordsFound: findings.length, displayedIn: 'Aba "Compliance" (parcial)', status: findings.length > 0 ? 'ok' : 'empty' },
        { name: 'HelenaAnalysis', description: 'Análises da Helena IA', recordsFound: helenaAnalyses.length, displayedIn: 'Aba "Compliance"', status: helenaAnalyses.length > 0 ? 'ok' : 'empty' },
        { name: 'Snapshot (V5.1/V5.2)', description: 'Snapshots imutáveis de análise', recordsFound: snapshots.length, displayedIn: 'Aba "V5.2" (só V5.2)', status: snapshots.length > 0 ? 'gap' : 'empty', note: snapshots.length > 0 ? 'Aparece só na aba V5.2' : null },
        { name: 'SentinelFeedback', description: 'Feedback dos analistas sobre o Sentinel', recordsFound: sentinelFeedback.length, displayedIn: 'Aba "V5.2" (só V5.2)', status: sentinelFeedback.length > 0 ? 'gap' : 'empty', note: sentinelFeedback.length > 0 ? 'Aparece só na aba V5.2' : null },
        { name: 'QualityAssessment', description: 'Avaliação de qualidade do caso', recordsFound: qualityAssessments.length, displayedIn: null, status: qualityAssessments.length > 0 ? 'gap' : 'empty', note: qualityAssessments.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'SubsellerScore', description: 'Scores específicos de subsellers', recordsFound: subsellerScores.length, displayedIn: null, status: subsellerScores.length > 0 ? 'gap' : 'empty', note: subsellerScores.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'ComplianceSession', description: 'Drafts/sessões de preenchimento', recordsFound: complianceSessions.length, displayedIn: 'Aba "Compliance" (parcial)', status: 'ok' },
        { name: 'PlanoMonitoramento', description: 'Planos de monitoramento V5.2 (Cat 5)', recordsFound: planosMonitoramento.length, displayedIn: 'Aba "V5.2"', status: 'ok' },
        { name: 'TermoAdicionalV5_2', description: 'Termos adicionais V5.2 aceitos', recordsFound: termosV52.length, displayedIn: 'Aba "V5.2"', status: 'ok' },
      ],
    });

    // ┌─────────────────────────────────────────┐
    // │ Seção 5: Integrações & Enriquecimento   │
    // └─────────────────────────────────────────┘
    const integrationLogs = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.IntegrationLog.filter({ onboarding_case_id: id }))))).flat()
      : [];
    const validations = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.ExternalValidationResult.filter({ onboardingCaseId: id }))))).flat()
      : [];
    const bdcMonitoringEvents = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.BdcMonitoringEvent.filter({ document: cpfCnpj })) : [];
    const bdcLookups = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.BdcLookupQueryLog.filter({ document: cpfCnpj })) : [];
    const bdcRetryQueue = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.BdcRetryQueue.filter({ onboarding_case_id: id }))))).flat()
      : [];
    const revalidations = await safeQuery(() => base44.asServiceRole.entities.RevalidationSchedule.filter({ merchantId }));

    report.push({
      id: 'integrations',
      title: 'Integrações & Enriquecimento',
      description: 'Dados do BDC, CAF e validações externas',
      entities: [
        { name: 'IntegrationLog', description: 'Logs de chamadas BDC/CAF', recordsFound: integrationLogs.length, displayedIn: 'Aba "BDC / CAF"', status: 'ok' },
        { name: 'ExternalValidationResult', description: 'Resultados de validação externa', recordsFound: validations.length, displayedIn: 'Aba "BDC / CAF"', status: 'ok' },
        { name: 'BdcMonitoringEvent', description: 'Eventos de monitoramento contínuo BDC', recordsFound: bdcMonitoringEvents.length, displayedIn: 'Aba "Regulatório" (parcial)', status: bdcMonitoringEvents.length > 0 ? 'ok' : 'empty' },
        { name: 'BdcLookupQueryLog', description: 'Consultas manuais ao BDC', recordsFound: bdcLookups.length, displayedIn: null, status: bdcLookups.length > 0 ? 'gap' : 'empty', note: bdcLookups.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'BdcRetryQueue', description: 'Tentativas falhas em retry', recordsFound: bdcRetryQueue.length, displayedIn: null, status: bdcRetryQueue.length > 0 ? 'gap' : 'empty', note: bdcRetryQueue.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'RevalidationSchedule', description: 'Próximas revalidações programadas', recordsFound: revalidations.length, displayedIn: 'Aba "Compliance"', status: 'ok' },
      ],
    });

    // ┌─────────────────────────────────────────┐
    // │ Seção 6: Documentos                     │
    // └─────────────────────────────────────────┘
    const documents = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId: id }))))).flat()
      : [];
    const pendencyRequests = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.PendencyRequest.filter({ onboardingCaseId: id }))))).flat()
      : [];
    const bankData = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.BankDataCollection.filter({ onboardingCaseId: id }))))).flat()
      : [];

    // Documentos em SubsellerInfoSubmission do próprio merchant (quando é subseller submetido)
    const subsellerDocsCount = submissionsByGateway.reduce((acc, sub) => {
      return acc + (sub.subsellers || []).reduce((a, s) => a + (s.documents?.length || 0), 0);
    }, 0);

    report.push({
      id: 'documentos',
      title: 'Documentos',
      description: 'Todos os arquivos enviados pelo cliente',
      entities: [
        { name: 'DocumentUpload', description: 'Documentos KYC/KYB do caso', recordsFound: documents.length, displayedIn: 'Aba "Documentos"', status: 'ok' },
        { name: 'PendencyRequest', description: 'Pendências abertas (com docs)', recordsFound: pendencyRequests.length, displayedIn: 'Aba "Pendências"', status: 'ok' },
        { name: 'BankDataCollection', description: 'Coleta de dados bancários', recordsFound: bankData.length, displayedIn: 'Aba "Dados Cadastrais"', status: 'ok' },
        { name: 'SubsellerInfoSubmission.documents', description: 'Docs enviados via Pagsmile Direto/Gateway', recordsFound: subsellerDocsCount, displayedIn: null, status: subsellerDocsCount > 0 ? 'gap' : 'empty', note: subsellerDocsCount > 0 ? 'Existe mas não aparece no Cadastro' : null },
      ],
    });

    // ┌─────────────────────────────────────────┐
    // │ Seção 7: Propostas & Contratos          │
    // └─────────────────────────────────────────┘
    const stdProposalsByCnpj = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.StandardProposal.filter({ clienteCnpj: cpfCnpj })) : [];
    const pixProposalsByCnpj = cpfCnpj ? await safeQuery(() => base44.asServiceRole.entities.PixProposal.filter({ clienteCnpj: cpfCnpj })) : [];
    const globalProposals = email ? await safeQuery(() => base44.asServiceRole.entities.GlobalProposal.filter({ contact_email: email })) : [];
    const unifiedPackages = email ? await safeQuery(() => base44.asServiceRole.entities.UnifiedProposalPackage.filter({ contact_email: email })) : [];
    const kickoffs = email ? await safeQuery(() => base44.asServiceRole.entities.KickOffPresentation.filter({ contact_email: email })) : [];

    report.push({
      id: 'comercial',
      title: 'Propostas & Contratos',
      description: 'Tudo que foi enviado/assinado comercialmente',
      entities: [
        { name: 'Proposal', description: 'Propostas customizadas Brasil', recordsFound: allProposals.length, displayedIn: 'Aba "Propostas"', status: 'ok' },
        { name: 'StandardProposal', description: 'Propostas padrão Brasil', recordsFound: stdProposalsByCnpj.length, displayedIn: 'Aba "Propostas"', status: stdProposalsByCnpj.length > 0 ? 'ok' : 'empty' },
        { name: 'PixProposal', description: 'Propostas Pix', recordsFound: pixProposalsByCnpj.length, displayedIn: 'Aba "Propostas"', status: pixProposalsByCnpj.length > 0 ? 'ok' : 'empty' },
        { name: 'GlobalProposal', description: 'Propostas Global (USD)', recordsFound: globalProposals.length, displayedIn: null, status: globalProposals.length > 0 ? 'gap' : 'empty', note: globalProposals.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'UnifiedProposalPackage', description: 'Pacotes unificados Brasil+Global', recordsFound: unifiedPackages.length, displayedIn: null, status: unifiedPackages.length > 0 ? 'gap' : 'empty', note: unifiedPackages.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
        { name: 'Contract', description: 'Contratos assinados', recordsFound: allContracts.length, displayedIn: 'Aba "Contratos"', status: 'ok' },
        { name: 'KickOffPresentation', description: 'Apresentações de kick-off', recordsFound: kickoffs.length, displayedIn: null, status: kickoffs.length > 0 ? 'gap' : 'empty', note: kickoffs.length > 0 ? 'Existe mas não aparece no Cadastro' : null },
      ],
    });

    // ┌─────────────────────────────────────────┐
    // │ Seção 8: Auditoria & Histórico          │
    // └─────────────────────────────────────────┘
    const auditEntityIds = [merchantId, ...caseIds, ...allProposals.map(p => p.id), ...allContracts.map(c => c.id)];
    const auditLogs = auditEntityIds.length > 0
      ? (await Promise.all(auditEntityIds.map(id => safeQuery(() => base44.asServiceRole.entities.AuditLog.filter({ entityId: id }))))).flat()
      : [];
    const accessTrails = await safeQuery(() => base44.asServiceRole.entities.AccessTrail.filter({ merchantId }));
    const accessAudits = await safeQuery(() => base44.asServiceRole.entities.AccessAudit.filter({ merchantId }));

    report.push({
      id: 'auditoria',
      title: 'Auditoria & Histórico',
      description: 'Trilha completa de eventos e acessos',
      entities: [
        { name: 'AuditLog', description: 'Log de mudanças nas entidades', recordsFound: auditLogs.length, displayedIn: 'Aba "Histórico"', status: 'ok' },
        { name: 'AccessTrail', description: 'Trilha de acesso LGPD', recordsFound: accessTrails.length, displayedIn: 'Aba "Auditoria LGPD"', status: 'ok' },
        { name: 'AccessAudit', description: 'Auditoria de acessos administrativos', recordsFound: accessAudits.length, displayedIn: 'Aba "Auditoria LGPD"', status: 'ok' },
      ],
    });

    // ┌─────────────────────────────────────────┐
    // │ Seção 9: Parceiros de Compliance        │
    // └─────────────────────────────────────────┘
    const partnerAssignments = caseIds.length > 0
      ? (await Promise.all(caseIds.map(id => safeQuery(() => base44.asServiceRole.entities.PartnerAssignment.filter({ onboardingCaseId: id }))))).flat()
      : [];
    const partnerActivities = partnerAssignments.length > 0
      ? (await Promise.all(partnerAssignments.map(p => safeQuery(() => base44.asServiceRole.entities.PartnerAssignmentActivity.filter({ assignmentId: p.id }))))).flat()
      : [];

    report.push({
      id: 'parceiros',
      title: 'Parceiros de Compliance',
      description: 'Atribuições a parceiros externos',
      entities: [
        { name: 'PartnerAssignment', description: 'Atribuições do caso a parceiros', recordsFound: partnerAssignments.length, displayedIn: 'Aba "Parceiros"', status: 'ok' },
        { name: 'PartnerAssignmentActivity', description: 'Atividades dos parceiros', recordsFound: partnerActivities.length, displayedIn: 'Aba "Parceiros"', status: 'ok' },
      ],
    });

    // ── Compute summary ──
    let total = 0, ok = 0, gap = 0, empty = 0;
    report.forEach(section => {
      section.entities.forEach(e => {
        total++;
        if (e.status === 'ok') ok++;
        else if (e.status === 'gap') gap++;
        else empty++;
      });
    });

    // % de completude entre as entidades QUE TÊM DADOS (ok / (ok + gap))
    const withData = ok + gap;
    const percentComplete = withData > 0 ? Math.round((ok / withData) * 100) : 100;

    return Response.json({
      merchantId,
      merchantName,
      cpfCnpj,
      email,
      auditedAt: new Date().toISOString(),
      sections: report,
      summary: { total, ok, gap, empty, withData, percentComplete },
    });
  } catch (error) {
    console.error('[auditCadastroCompleteness]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});