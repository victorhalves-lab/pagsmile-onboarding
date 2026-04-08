import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { onboardingCaseId } = await req.json();
  if (!onboardingCaseId) {
    return Response.json({ error: 'onboardingCaseId is required' }, { status: 400 });
  }

  // Fetch case
  const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
  const caseData = cases[0];
  if (!caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 });
  }

  // Fetch responses, merchant, documents in parallel
  const [responses, merchants, documents] = await Promise.all([
    base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId }),
    caseData.merchantId
      ? base44.asServiceRole.entities.Merchant.filter({ id: caseData.merchantId })
      : Promise.resolve([]),
    base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId }),
  ]);

  const merchant = merchants[0] || null;

  // Fetch questions for ordering
  let questions = [];
  if (caseData.questionnaireTemplateId) {
    questions = await base44.asServiceRole.entities.Question.filter({
      questionnaireTemplateId: caseData.questionnaireTemplateId
    });
  }

  // Build question order map
  const questionOrderMap = {};
  questions.forEach(q => { questionOrderMap[q.id] = q.order || 999; });

  // Sort responses by question order
  const sortedResponses = [...responses].sort((a, b) => {
    return (questionOrderMap[a.questionId] ?? 999) - (questionOrderMap[b.questionId] ?? 999);
  });

  // Helpers
  function extractSection(text) {
    if (!text) return 'Geral';
    const dashSplit = text.split(' - ');
    if (dashSplit.length > 1) {
      let name = dashSplit[0].replace(/^\d+[\.\-\s]*/, '').trim();
      if (name) return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Geral';
  }

  function getDisplayValue(r) {
    if (r.valueText) return r.valueText;
    if (r.valueNumber !== undefined && r.valueNumber !== null) return String(r.valueNumber);
    if (r.valueBoolean !== undefined && r.valueBoolean !== null) return r.valueBoolean ? 'Sim' : 'Não';
    if (r.valueArray && r.valueArray.length > 0) return r.valueArray.join(', ');
    return 'Não informado';
  }

  function getDisplayQuestion(r) {
    const q = r.questionText || 'Pergunta';
    const dashSplit = q.split(' - ');
    if (dashSplit.length > 1) return dashSplit.slice(1).join(' - ').trim();
    return q;
  }

  // Deduplicate
  const seen = new Map();
  for (const r of sortedResponses) {
    const key = (r.questionText || '').toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, r);
  }
  const dedupedResponses = Array.from(seen.values());

  // Group by section
  const grouped = {};
  const sectionOrder = [];
  for (const r of dedupedResponses) {
    const section = extractSection(r.questionText);
    if (!grouped[section]) {
      grouped[section] = [];
      sectionOrder.push(section);
    }
    grouped[section].push(r);
  }

  // ── Generate PDF ──
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const mL = 20;
  const mR = 20;
  const cW = pageWidth - mL - mR;
  let y = 20;

  function checkBreak(needed) {
    if (y + needed > pageHeight - 25) { doc.addPage(); y = 20; }
  }

  // ── Header bar ──
  doc.setFillColor(0, 36, 67);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setFillColor(43, 193, 150);
  doc.rect(0, 35, pageWidth, 2, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Relatório de Compliance', mL, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 240);
  const isPF = merchant?.type === 'PF';
  doc.text(`${isPF ? 'Pessoa Física' : 'Pessoa Jurídica'} • Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, mL, 26);

  y = 45;
  doc.setTextColor(0, 0, 0);

  // ── Merchant info box ──
  if (merchant) {
    doc.setFillColor(244, 244, 244);
    doc.roundedRect(mL, y, cW, isPF ? 42 : 35, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 36, 67);
    doc.text(merchant.fullName || 'N/A', mL + 6, y + 9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const col1X = mL + 6;
    const col2X = mL + cW / 2;
    let infoY = y + 17;

    doc.text(`CPF/CNPJ: ${merchant.cpfCnpj || 'N/A'}`, col1X, infoY);
    doc.text(`E-mail: ${merchant.email || 'N/A'}`, col2X, infoY);
    infoY += 6;
    doc.text(`Telefone: ${merchant.phone || 'N/A'}`, col1X, infoY);
    doc.text(`Status: ${caseData.status || 'N/A'}`, col2X, infoY);

    if (isPF) {
      infoY += 6;
      if (merchant.dateOfBirth) doc.text(`Nascimento: ${merchant.dateOfBirth}`, col1X, infoY);
      if (merchant.motherName) doc.text(`Mãe: ${merchant.motherName}`, col2X, infoY);
    }

    if (caseData.riskScoreV4 !== undefined) {
      infoY += 6;
      doc.text(`Score V4: ${caseData.riskScoreV4} | Subfaixa: ${caseData.subfaixaNome || caseData.subfaixa || 'N/A'}`, col1X, infoY);
    }

    y += isPF ? 50 : 43;
  }

  // ── Responses ──
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 36, 67);
  checkBreak(15);
  doc.text('Respostas do Questionário', mL, y);
  y += 3;
  doc.setDrawColor(43, 193, 150);
  doc.setLineWidth(1);
  doc.line(mL, y, mL + 60, y);
  y += 10;

  for (const section of sectionOrder) {
    const items = grouped[section];
    checkBreak(18);

    // Section header
    doc.setFillColor(0, 36, 67);
    doc.roundedRect(mL, y - 4, cW, 9, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(section, mL + 4, y + 2);
    y += 10;

    doc.setTextColor(0, 0, 0);

    for (const r of items) {
      const question = getDisplayQuestion(r);
      const value = getDisplayValue(r);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      const qLines = doc.splitTextToSize(question, cW - 4);
      checkBreak(qLines.length * 3.5 + 12);
      doc.text(qLines, mL + 2, y);
      y += qLines.length * 3.5 + 1;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 36, 67);
      const vLines = doc.splitTextToSize(value, cW - 4);
      checkBreak(vLines.length * 4.5);
      doc.text(vLines, mL + 2, y);
      y += vLines.length * 4.5 + 4;
    }
    y += 3;
  }

  // ── Documents Section ──
  if (documents.length > 0) {
    checkBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 36, 67);
    doc.text('Documentos Enviados', mL, y);
    y += 3;
    doc.setDrawColor(43, 193, 150);
    doc.setLineWidth(1);
    doc.line(mL, y, mL + 50, y);
    y += 10;

    // Table header
    checkBreak(10);
    doc.setFillColor(0, 36, 67);
    doc.rect(mL, y - 4, cW, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Documento', mL + 3, y + 1);
    doc.text('Arquivo', mL + 65, y + 1);
    doc.text('Status', mL + 120, y + 1);
    doc.text('Data', mL + 145, y + 1);
    y += 8;

    doc.setTextColor(0, 0, 0);
    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      checkBreak(8);

      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(mL, y - 4, cW, 7, 'F');
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 36, 67);

      const docName = (d.documentName || 'Documento').slice(0, 35);
      const fileName = (d.fileName || '-').slice(0, 30);
      const status = d.validationStatus || 'Pendente';
      const date = d.uploadDate ? new Date(d.uploadDate).toLocaleDateString('pt-BR') : (d.created_date ? new Date(d.created_date).toLocaleDateString('pt-BR') : '-');

      doc.text(docName, mL + 3, y);
      doc.text(fileName, mL + 65, y);

      // Status color
      if (status === 'Validado') doc.setTextColor(22, 163, 74);
      else if (status === 'Rejeitado') doc.setTextColor(220, 38, 38);
      else doc.setTextColor(180, 130, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(status, mL + 120, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(date, mL + 145, y);

      y += 7;
    }

    y += 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(`Total: ${documents.length} documento(s) enviado(s)`, mL, y);
    y += 8;
  }

  // ── Footer on all pages ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Bottom bar
    doc.setFillColor(0, 36, 67);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 200, 220);
    doc.text(`Página ${i} de ${totalPages}`, mL, pageHeight - 4);
    doc.text('Pagsmile Compliance', pageWidth - mR, pageHeight - 4, { align: 'right' });
  }

  const pdfBytes = doc.output('arraybuffer');
  const safeName = (merchant?.fullName || 'case').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 30);

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="compliance_${safeName}.pdf"`,
    },
  });
});