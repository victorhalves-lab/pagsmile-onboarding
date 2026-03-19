import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
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

  // Fetch case, merchant, responses and questions in parallel
  const [cases, responses, merchants] = await Promise.all([
    base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId }),
    base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId }),
    base44.asServiceRole.entities.Merchant.list(),
  ]);

  const caseData = cases[0];
  if (!caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 });
  }

  const merchant = merchants.find(m => m.id === caseData.merchantId);

  // Fetch questions for ordering
  let questions = [];
  if (caseData.questionnaireTemplateId) {
    questions = await base44.asServiceRole.entities.Question.filter({
      questionnaireTemplateId: caseData.questionnaireTemplateId
    });
  }

  // Build question order map
  const questionOrderMap = {};
  questions.forEach(q => {
    questionOrderMap[q.id] = q.order || 999;
  });

  // Sort responses by question order
  const sortedResponses = [...responses].sort((a, b) => {
    const orderA = questionOrderMap[a.questionId] ?? 999;
    const orderB = questionOrderMap[b.questionId] ?? 999;
    return orderA - orderB;
  });

  // Group by section (extract from questionText)
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
    if (!seen.has(key)) {
      seen.set(key, r);
    }
  }
  const dedupedResponses = Array.from(seen.values());

  // Group
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

  // Generate PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  function checkPageBreak(needed) {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  }

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Compliance', marginLeft, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, marginLeft, y);
  y += 8;

  // Merchant info
  if (merchant) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Merchant', marginLeft, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${merchant.fullName || 'N/A'}`, marginLeft, y); y += 5;
    doc.text(`CPF/CNPJ: ${merchant.cpfCnpj || 'N/A'}`, marginLeft, y); y += 5;
    doc.text(`E-mail: ${merchant.email || 'N/A'}`, marginLeft, y); y += 5;
    doc.text(`Tipo: ${merchant.type || 'N/A'}`, marginLeft, y); y += 5;
    doc.text(`Status: ${caseData.status || 'N/A'}`, marginLeft, y); y += 5;
    if (caseData.riskScore !== undefined) {
      doc.text(`Score de Risco: ${caseData.riskScore}`, marginLeft, y); y += 5;
    }
  }

  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  // Sections & responses
  for (const section of sectionOrder) {
    const items = grouped[section];

    checkPageBreak(20);

    // Section header
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 36, 67); // Pagsmile blue
    doc.text(section, marginLeft, y);
    y += 2;
    doc.setDrawColor(43, 193, 150); // Pagsmile green
    doc.setLineWidth(0.8);
    doc.line(marginLeft, y, marginLeft + 40, y);
    doc.setLineWidth(0.2);
    y += 7;

    doc.setTextColor(0, 0, 0);

    for (const r of items) {
      const question = getDisplayQuestion(r);
      const value = getDisplayValue(r);

      // Wrap question text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const qLines = doc.splitTextToSize(question, contentWidth);
      const neededHeight = qLines.length * 4 + 7;
      checkPageBreak(neededHeight + 10);

      doc.setTextColor(80, 80, 80);
      doc.text(qLines, marginLeft, y);
      y += qLines.length * 4 + 1;

      // Wrap value text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const vLines = doc.splitTextToSize(value, contentWidth);
      checkPageBreak(vLines.length * 5);
      doc.text(vLines, marginLeft, y);
      y += vLines.length * 5 + 4;
    }

    y += 3;
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} — Pagsmile Compliance`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const pdfBytes = doc.output('arraybuffer');

  const merchantName = (merchant?.fullName || 'merchant').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="compliance_${merchantName}.pdf"`,
    },
  });
});