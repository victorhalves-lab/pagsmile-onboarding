import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

const BLUE = [0, 36, 67];
const GREEN = [43, 193, 150];
const GRAY = [100, 116, 139];
const LIGHT_GRAY = [244, 244, 244];
const WHITE = [255, 255, 255];

function addHeader(doc, pageWidth) {
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(0, 28, pageWidth, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAGSMILE', 15, 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('DOSSIÊ DO CLIENTE — CONFIDENCIAL', 15, 22);
}

function addFooter(doc, pageWidth, pageHeight, pageNum, totalPages, genDate) {
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  doc.setTextColor(...GRAY);
  doc.setFontSize(7);
  doc.text(`Página ${pageNum}/${totalPages}`, 15, pageHeight - 9);
  doc.text(`Gerado em ${genDate} | Sistema Pagsmile Onboarding`, pageWidth - 15, pageHeight - 9, { align: 'right' });
}

function checkPage(doc, y, needed, pageWidth) {
  if (y + needed > 270) {
    doc.addPage();
    addHeader(doc, pageWidth);
    return 42;
  }
  return y;
}

function sectionTitle(doc, y, title, pageWidth) {
  y = checkPage(doc, y, 16, pageWidth);
  doc.setFillColor(...GREEN);
  doc.rect(15, y - 1, 3, 10, 'F');
  doc.setTextColor(...BLUE);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 22, y + 6);
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y + 12, pageWidth - 15, y + 12);
  return y + 18;
}

function dataRow(doc, y, label, value, pageWidth) {
  y = checkPage(doc, y, 8, pageWidth);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(label, 18, y);
  doc.setTextColor(...BLUE);
  doc.setFont('helvetica', 'bold');
  const val = value != null && value !== '' ? String(value) : '—';
  const lines = doc.splitTextToSize(val, pageWidth - 90);
  doc.text(lines, 75, y);
  return y + Math.max(7, lines.length * 5);
}

function formatCurrency(v) {
  if (v == null) return '—';
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDoc(d) {
  if (!d) return '—';
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return d;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { merchantId } = await req.json();
    if (!merchantId) return Response.json({ error: 'merchantId required' }, { status: 400 });

    // Fetch all data
    const [merchantList] = await Promise.all([
      base44.asServiceRole.entities.Merchant.filter({ id: merchantId })
    ]);
    const merchant = merchantList[0];
    if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 });

    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ merchantId });
    const caseIds = cases.map(c => c.id);

    const [allLeadsByCnpj, allLeadsByEmail] = await Promise.all([
      merchant.cpfCnpj ? base44.asServiceRole.entities.Lead.filter({ cpfCnpj: merchant.cpfCnpj }) : [],
      merchant.email ? base44.asServiceRole.entities.Lead.filter({ email: merchant.email }) : [],
    ]);
    const leadMap = new Map();
    [...allLeadsByCnpj, ...allLeadsByEmail].forEach(l => leadMap.set(l.id, l));
    const leads = Array.from(leadMap.values());
    const lead = leads[0] || null;

    const [responses, documents, scores, validations, integrationLogs, subsellers] = await Promise.all([
      caseIds.length ? Promise.all(caseIds.map(id => base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: id }))).then(r => r.flat()) : [],
      caseIds.length ? Promise.all(caseIds.map(id => base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId: id }))).then(r => r.flat()) : [],
      caseIds.length ? Promise.all(caseIds.map(id => base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: id }))).then(r => r.flat()) : [],
      caseIds.length ? Promise.all(caseIds.map(id => base44.asServiceRole.entities.ExternalValidationResult.filter({ onboardingCaseId: id }))).then(r => r.flat()) : [],
      caseIds.length ? Promise.all(caseIds.map(id => base44.asServiceRole.entities.IntegrationLog.filter({ onboarding_case_id: id }))).then(r => r.flat()) : [],
      merchant.isSubseller ? [] : base44.asServiceRole.entities.Merchant.filter({ parentMerchantId: merchantId }),
    ]);

    const leadIds = leads.map(l => l.id);
    const [proposalsByLeads, proposalsByCnpj] = await Promise.all([
      leadIds.length ? Promise.all(leadIds.map(id => base44.asServiceRole.entities.Proposal.filter({ leadId: id }))).then(r => r.flat()) : [],
      merchant.cpfCnpj ? base44.asServiceRole.entities.Proposal.filter({ clienteCnpj: merchant.cpfCnpj }) : [],
    ]);
    const propMap = new Map();
    [...proposalsByLeads, ...proposalsByCnpj].forEach(p => propMap.set(p.id, p));
    const proposals = Array.from(propMap.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const [contractsByCnpj, contractsByMerchant] = await Promise.all([
      merchant.cpfCnpj ? base44.asServiceRole.entities.Contract.filter({ clientCnpj: merchant.cpfCnpj }).catch(() => []) : [],
      base44.asServiceRole.entities.Contract.filter({ merchantId }).catch(() => []),
    ]);
    const contMap = new Map();
    [...contractsByCnpj, ...contractsByMerchant].forEach(c => contMap.set(c.id, c));
    const contracts = Array.from(contMap.values());

    const latestCase = cases.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null;
    const latestScore = scores.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null;

    // Build PDF
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const genDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // COVER PAGE
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, pageWidth, 297, 'F');
    doc.setFillColor(...GREEN);
    doc.rect(0, 120, pageWidth, 5, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PAGSMILE', pageWidth / 2, 60, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Plataforma de Onboarding & Compliance', pageWidth / 2, 72, { align: 'center' });
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DOSSIÊ DO CLIENTE', pageWidth / 2, 145, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(...GREEN);
    doc.text(merchant.companyName || merchant.fullName || '—', pageWidth / 2, 160, { align: 'center' });
    doc.setTextColor(...WHITE);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDoc(merchant.cpfCnpj), pageWidth / 2, 172, { align: 'center' });
    doc.text(`Status: ${merchant.onboardingStatus || 'Pendente'}`, pageWidth / 2, 182, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(150, 170, 190);
    doc.text(`Gerado em ${genDate}`, pageWidth / 2, 240, { align: 'center' });
    doc.text('DOCUMENTO CONFIDENCIAL', pageWidth / 2, 250, { align: 'center' });

    // PAGE 2+
    doc.addPage();
    addHeader(doc, pageWidth);
    let y = 42;

    // 1. DADOS CADASTRAIS
    y = sectionTitle(doc, y, '1. DADOS CADASTRAIS', pageWidth);
    y = dataRow(doc, y, 'Nome / Razão Social', merchant.fullName, pageWidth);
    if (merchant.companyName) y = dataRow(doc, y, 'Nome Fantasia', merchant.companyName, pageWidth);
    y = dataRow(doc, y, 'Tipo', merchant.type, pageWidth);
    y = dataRow(doc, y, 'CPF/CNPJ', formatDoc(merchant.cpfCnpj), pageWidth);
    y = dataRow(doc, y, 'E-mail', merchant.email, pageWidth);
    y = dataRow(doc, y, 'Telefone', merchant.phone, pageWidth);
    if (merchant.dateOfBirth) y = dataRow(doc, y, 'Data Nascimento', merchant.dateOfBirth, pageWidth);
    if (merchant.nationality) y = dataRow(doc, y, 'Nacionalidade', merchant.nationality, pageWidth);
    if (merchant.motherName) y = dataRow(doc, y, 'Nome da Mãe', merchant.motherName, pageWidth);
    y = dataRow(doc, y, 'Status Onboarding', merchant.onboardingStatus, pageWidth);
    y += 5;

    // 2. DADOS COMERCIAIS
    if (lead) {
      y = sectionTitle(doc, y, '2. DADOS COMERCIAIS (LEAD)', pageWidth);
      if (lead.tpvMensal) y = dataRow(doc, y, 'TPV Mensal', formatCurrency(lead.tpvMensal), pageWidth);
      if (lead.ticketMedio) y = dataRow(doc, y, 'Ticket Médio', formatCurrency(lead.ticketMedio), pageWidth);
      if (lead.transacoesMes) y = dataRow(doc, y, 'Transações/Mês', lead.transacoesMes, pageWidth);
      if (lead.businessSubCategory) y = dataRow(doc, y, 'Segmento', lead.businessSubCategory, pageWidth);
      if (lead.priscilaRiskLevel) y = dataRow(doc, y, 'Risco PRISCILA', lead.priscilaRiskLevel, pageWidth);
      if (lead.priscilaQualityScore) y = dataRow(doc, y, 'Score PRISCILA', lead.priscilaQualityScore, pageWidth);
      if (lead.leadQualifierScore) y = dataRow(doc, y, 'Lead Qualifier', `${lead.leadQualifierScore} (${lead.leadQualifierLevel || '—'})`, pageWidth);
      if (lead.commercialAgentName) y = dataRow(doc, y, 'Agente Comercial', lead.commercialAgentName, pageWidth);
      if (lead.introducerName) y = dataRow(doc, y, 'Introducer', lead.introducerName, pageWidth);
      y += 5;
    }

    // 3. RESPOSTAS DO QUESTIONÁRIO
    if (responses.length > 0) {
      y = sectionTitle(doc, y, '3. RESPOSTAS DO QUESTIONÁRIO', pageWidth);
      for (const r of responses) {
        const q = r.questionText || `Pergunta ${r.questionId}`;
        const a = r.valueText || r.valueNumber || (r.valueBoolean != null ? (r.valueBoolean ? 'Sim' : 'Não') : null) || (r.valueArray?.join(', ')) || '—';
        y = dataRow(doc, y, q, a, pageWidth);
      }
      y += 5;
    }

    // 4. PROPOSTAS
    if (proposals.length > 0) {
      y = sectionTitle(doc, y, `4. PROPOSTAS (${proposals.length})`, pageWidth);
      for (const p of proposals) {
        y = checkPage(doc, y, 30, pageWidth);
        doc.setFillColor(...LIGHT_GRAY);
        doc.rect(15, y - 2, pageWidth - 30, 8, 'F');
        doc.setTextColor(...BLUE);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${p.codigo || 'Proposta'} — ${p.status}${p.isCurrentVersion ? ' (Atual)' : ''}`, 18, y + 3);
        y += 12;
        const rates = p.rates || {};
        if (rates.cartao?.visa?.avista) y = dataRow(doc, y, 'Visa À Vista', `${rates.cartao.visa.avista}%`, pageWidth);
        if (rates.cartao?.visa?.de2a6x) y = dataRow(doc, y, 'Visa 2-6x', `${rates.cartao.visa.de2a6x}%`, pageWidth);
        if (rates.cartao?.visa?.de7a12x) y = dataRow(doc, y, 'Visa 7-12x', `${rates.cartao.visa.de7a12x}%`, pageWidth);
        if (rates.cartao?.mastercard?.avista) y = dataRow(doc, y, 'MC À Vista', `${rates.cartao.mastercard.avista}%`, pageWidth);
        if (rates.pix?.valor) y = dataRow(doc, y, 'PIX', rates.pix.tipo === 'percentual' ? `${rates.pix.valor}%` : `R$ ${rates.pix.valor}`, pageWidth);
        if (rates.antifraude) y = dataRow(doc, y, 'Antifraude', `R$ ${rates.antifraude}`, pageWidth);
        if (rates.feeTransacao) y = dataRow(doc, y, 'Fee/Transação', `R$ ${rates.feeTransacao}`, pageWidth);
        if (rates.percentualAntecipacao) y = dataRow(doc, y, 'Antecipação', `${rates.percentualAntecipacao}%`, pageWidth);
        if (p.estimatedRevenue) y = dataRow(doc, y, 'Receita Estimada', formatCurrency(p.estimatedRevenue), pageWidth);
        if (p.estimatedMargin) y = dataRow(doc, y, 'Margem Estimada', formatCurrency(p.estimatedMargin), pageWidth);
        y += 4;
      }
      y += 3;
    }

    // 5. CONTRATOS
    if (contracts.length > 0) {
      y = sectionTitle(doc, y, `5. CONTRATOS (${contracts.length})`, pageWidth);
      for (const c of contracts) {
        y = checkPage(doc, y, 20, pageWidth);
        doc.setFillColor(...LIGHT_GRAY);
        doc.rect(15, y - 2, pageWidth - 30, 8, 'F');
        doc.setTextColor(...BLUE);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${c.codigo || 'Contrato'} — ${c.status || '—'}`, 18, y + 3);
        y += 12;
        if (c.contractDurationMonths) y = dataRow(doc, y, 'Duração', `${c.contractDurationMonths} meses`, pageWidth);
        if (c.paymentTerm) y = dataRow(doc, y, 'Prazo Liquidação', c.paymentTerm, pageWidth);
        y += 4;
      }
    }

    // 6. COMPLIANCE & RISCO
    if (latestScore || latestCase) {
      y = sectionTitle(doc, y, '6. COMPLIANCE & RISCO', pageWidth);
      if (latestScore) {
        y = dataRow(doc, y, 'Score Final V4', latestScore.score_final ?? latestScore.score_geral_composto ?? '—', pageWidth);
        y = dataRow(doc, y, 'Subfaixa', `${latestScore.subfaixa || '—'} (${latestScore.subfaixa_nome || '—'})`, pageWidth);
        y = dataRow(doc, y, 'Recomendação', latestScore.recomendacao_final || '—', pageWidth);
        y = dataRow(doc, y, 'Monitoramento', latestScore.monitoramento_nivel || '—', pageWidth);
        if (latestScore.rolling_reserve_percent) y = dataRow(doc, y, 'Rolling Reserve', `${latestScore.rolling_reserve_percent}%`, pageWidth);
        if (latestScore.bloqueios_ativos?.length) y = dataRow(doc, y, 'Bloqueios', latestScore.bloqueios_ativos.join(', '), pageWidth);
        if (latestScore.pontos_positivos?.length) y = dataRow(doc, y, 'Pontos Positivos', latestScore.pontos_positivos.join('; '), pageWidth);
        if (latestScore.pontos_atencao?.length) y = dataRow(doc, y, 'Pontos de Atenção', latestScore.pontos_atencao.join('; '), pageWidth);
        if (latestScore.red_flags?.length) y = dataRow(doc, y, 'Red Flags', latestScore.red_flags.join('; '), pageWidth);
      }
      if (latestCase?.iaDecision) y = dataRow(doc, y, 'Decisão IA', latestCase.iaDecision, pageWidth);
      if (latestCase?.iaExplanation) {
        y = checkPage(doc, y, 20, pageWidth);
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text('Parecer IA:', 18, y);
        y += 5;
        doc.setTextColor(...BLUE);
        doc.setFont('helvetica', 'normal');
        const iaLines = doc.splitTextToSize(latestCase.iaExplanation, pageWidth - 36);
        for (const line of iaLines.slice(0, 20)) {
          y = checkPage(doc, y, 5, pageWidth);
          doc.text(line, 18, y);
          y += 4;
        }
      }
      y += 5;
    }

    // 7. DOCUMENTOS
    if (documents.length > 0) {
      y = sectionTitle(doc, y, `7. DOCUMENTOS (${documents.length})`, pageWidth);
      for (const d of documents) {
        y = dataRow(doc, y, d.documentName || d.fileName || 'Doc', `${d.validationStatus || 'Pendente'} — ${d.uploadDate ? new Date(d.uploadDate).toLocaleDateString('pt-BR') : '—'}`, pageWidth);
      }
      y += 5;
    }

    // 8. ENRIQUECIMENTO
    const bdcResults = validations.filter(v => v.provider === 'BigDataCorp');
    const cafResults = validations.filter(v => v.provider === 'CAF');
    if (bdcResults.length || cafResults.length || integrationLogs.length) {
      y = sectionTitle(doc, y, '8. ENRIQUECIMENTO EXTERNO', pageWidth);
      if (bdcResults.length) y = dataRow(doc, y, 'BigDataCorp', `${bdcResults.length} consulta(s) — Último: ${bdcResults[0]?.status || '—'}`, pageWidth);
      if (cafResults.length) y = dataRow(doc, y, 'CAF', `${cafResults.length} verificação(ões) — Último: ${cafResults[0]?.status || '—'}`, pageWidth);
      for (const il of integrationLogs.slice(0, 10)) {
        y = dataRow(doc, y, `${il.provider} / ${il.service_type}`, `${il.status} ${il.score != null ? `Score: ${il.score}` : ''} ${il.similarity != null ? `Sim: ${(il.similarity * 100).toFixed(1)}%` : ''}`, pageWidth);
      }
      y += 5;
    }

    // 9. SUBSELLERS
    if (subsellers.length > 0) {
      y = sectionTitle(doc, y, `9. SUBSELLERS (${subsellers.length})`, pageWidth);
      for (const s of subsellers) {
        y = dataRow(doc, y, s.companyName || s.fullName || '—', `${formatDoc(s.cpfCnpj)} | ${s.type} | ${s.onboardingStatus || 'Pendente'}`, pageWidth);
      }
    }

    // Add page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, pageWidth, 297, i - 1, totalPages - 1, genDate);
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=dossie_${merchant.cpfCnpj || merchant.id}.pdf`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});