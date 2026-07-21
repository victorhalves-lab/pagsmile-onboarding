import { jsPDF } from 'jspdf';
import { PROCESSOS } from './processosData';

const COLORS = {
  blue: [19, 86, 226],
  green: [232, 75, 28],
  white: [255, 255, 255],
  gray: [100, 116, 139],
  lightGray: [241, 245, 249],
  black: [10, 10, 10],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 15;
const MARGIN_R = 15;
const MARGIN_T = 20;
const MARGIN_B = 20;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

function addFooter(doc, pageNum, totalPages) {
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Pin Bank — Processos Modelo v2.0`, MARGIN_L, PAGE_H - 10);
  doc.text(`Página ${pageNum} de ${totalPages}`, PAGE_W - MARGIN_R, PAGE_H - 10, { align: 'right' });
  doc.setDrawColor(...COLORS.green);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_L, PAGE_H - 14, PAGE_W - MARGIN_R, PAGE_H - 14);
}

function checkPage(doc, y, needed = 20) {
  if (y + needed > PAGE_H - MARGIN_B) {
    doc.addPage();
    return MARGIN_T;
  }
  return y;
}

function drawSectionHeader(doc, y, number, title) {
  y = checkPage(doc, y, 14);
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 9, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.blue);
  doc.text(`${number}. ${title}`, MARGIN_L + 3, y + 6.2);
  return y + 13;
}

function drawWrappedText(doc, y, text, fontSize = 8, isBold = false, indent = 0) {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.setTextColor(...COLORS.blue);
  const maxW = CONTENT_W - indent;
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    y = checkPage(doc, y, 5);
    doc.text(line, MARGIN_L + indent, y);
    y += fontSize * 0.45;
  }
  return y;
}

function drawBulletList(doc, y, items) {
  for (const item of items) {
    y = checkPage(doc, y, 6);
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray);
    doc.text('•', MARGIN_L + 3, y);
    
    if (typeof item === 'string') {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.blue);
      const lines = doc.splitTextToSize(item, CONTENT_W - 10);
      for (const line of lines) {
        y = checkPage(doc, y, 4.5);
        doc.text(line, MARGIN_L + 7, y);
        y += 3.5;
      }
    } else {
      const boldText = item.bold || '';
      const normalText = item.text || '';
      const fullText = boldText + normalText;
      const lines = doc.splitTextToSize(fullText, CONTENT_W - 10);
      
      for (let li = 0; li < lines.length; li++) {
        y = checkPage(doc, y, 4.5);
        const line = lines[li];
        
        if (li === 0 && boldText) {
          // First line - measure bold part
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...COLORS.blue);
          const boldW = doc.getTextWidth(boldText);
          
          if (boldW < CONTENT_W - 10) {
            doc.text(boldText, MARGIN_L + 7, y);
            doc.setFont('helvetica', 'normal');
            const rest = line.substring(boldText.length);
            if (rest) {
              doc.text(rest, MARGIN_L + 7 + boldW, y);
            }
          } else {
            doc.text(line, MARGIN_L + 7, y);
          }
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...COLORS.blue);
          doc.text(line, MARGIN_L + 7, y);
        }
        y += 3.5;
      }
    }
    y += 0.5;
  }
  return y;
}

function drawStepTable(doc, y, steps) {
  const colWidths = [8, 20, 52, 30, 10, 10, 38, 12];
  const headers = ['ID', 'Resp.', 'Atividade', 'Decisão', 'Gate', 'SLA', 'Saída', 'Próx.'];
  const startX = MARGIN_L;
  const rowH = 4;
  
  // Header
  y = checkPage(doc, y, 15);
  doc.setFillColor(...COLORS.green);
  doc.rect(startX, y, CONTENT_W, 5, 'F');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  
  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 1, y + 3.5);
    x += colWidths[i];
  }
  y += 6;

  // Rows
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  
  for (const step of steps) {
    const values = [
      step.id,
      step.resp,
      step.atividade,
      step.decisao || '—',
      step.gate || '—',
      step.sla || '—',
      step.saida,
      step.proximo,
    ];
    
    // Calculate row height based on longest wrapped text
    let maxLines = 1;
    const cellLines = values.map((val, i) => {
      const lines = doc.splitTextToSize(String(val), colWidths[i] - 2);
      maxLines = Math.max(maxLines, lines.length);
      return lines;
    });
    
    const thisRowH = Math.max(rowH, maxLines * 3 + 1.5);
    y = checkPage(doc, y, thisRowH + 2);
    
    // Alternate row bg
    if (steps.indexOf(step) % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, y - 0.5, CONTENT_W, thisRowH, 'F');
    }
    
    x = startX;
    doc.setTextColor(...COLORS.blue);
    for (let i = 0; i < cellLines.length; i++) {
      let ly = y + 2.5;
      for (const line of cellLines[i]) {
        doc.text(line, x + 1, ly);
        ly += 3;
      }
      x += colWidths[i];
    }
    
    // Bottom line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(startX, y + thisRowH, startX + CONTENT_W, y + thisRowH);
    
    y += thisRowH + 0.5;
  }
  
  return y + 2;
}

function drawRACITable(doc, y, roles, activities) {
  const nameColW = 45;
  const roleColW = Math.min(25, (CONTENT_W - nameColW) / roles.length);
  
  y = checkPage(doc, y, 15);
  
  // Legend
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.gray);
  doc.text('R = Responsável (executa) · A = Aprovador · C = Consultado · I = Informado', MARGIN_L, y);
  y += 5;
  
  // Header
  doc.setFillColor(...COLORS.green);
  const tableW = nameColW + roleColW * roles.length;
  doc.rect(MARGIN_L, y, tableW, 5, 'F');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Atividade', MARGIN_L + 1, y + 3.5);
  
  let x = MARGIN_L + nameColW;
  for (const role of roles) {
    const truncated = role.length > 12 ? role.substring(0, 11) + '…' : role;
    doc.text(truncated, x + 1, y + 3.5);
    x += roleColW;
  }
  y += 6;

  // Rows
  doc.setFontSize(5.5);
  for (let ai = 0; ai < activities.length; ai++) {
    const a = activities[ai];
    y = checkPage(doc, y, 6);
    
    if (ai % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN_L, y - 0.5, tableW, 5, 'F');
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.blue);
    doc.text(doc.splitTextToSize(a.name, nameColW - 2)[0], MARGIN_L + 1, y + 3);
    
    x = MARGIN_L + nameColW;
    for (let vi = 0; vi < (a.values || []).length; vi++) {
      const v = a.values[vi] || '—';
      const color = v === 'R' ? [220, 38, 38] : v === 'A' ? [37, 99, 235] : v === 'C' ? [217, 119, 6] : v === 'I' ? [22, 163, 74] : COLORS.gray;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      doc.text(v, x + roleColW / 2, y + 3, { align: 'center' });
      x += roleColW;
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(MARGIN_L, y + 4.5, MARGIN_L + tableW, y + 4.5);
    y += 5.5;
  }
  
  return y + 2;
}

function renderProcesso(doc, p, isFirst) {
  if (!isFirst) {
    doc.addPage();
  }
  
  let y = MARGIN_T;
  
  // Process header bar
  doc.setFillColor(...COLORS.blue);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 16, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  
  const titleLines = doc.splitTextToSize(`${p.id} — ${p.nome}`, CONTENT_W - 8);
  let ty = y + 6;
  for (const tl of titleLines) {
    doc.text(tl, MARGIN_L + 4, ty);
    ty += 5;
  }
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(43, 193, 150);
  doc.text(`v${p.versao}  •  ${p.data}  •  ${p.area}`, MARGIN_L + 4, y + 13.5);
  y += 20;

  // 1. Identificação
  y = drawSectionHeader(doc, y, '1', 'Identificação');
  const identItems = [
    ['Processo', p.nome],
    ['Versão', p.versao],
    ['Data', p.data],
    ['Elaborado por', p.elaboradoPor],
    ['Área(s)', p.area],
  ];
  for (const [label, value] of identItems) {
    y = checkPage(doc, y, 5);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.blue);
    doc.text(`${label}:`, MARGIN_L + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(String(value), MARGIN_L + 35, y);
    y += 4.5;
  }
  y += 3;

  // 2. Objetivo
  y = drawSectionHeader(doc, y, '2', 'Objetivo');
  y = drawWrappedText(doc, y, p.objetivo, 7.5, false, 3);
  y += 1;
  if (p.objetivoItens) {
    y = drawBulletList(doc, y, p.objetivoItens);
  }
  y += 3;

  // 3. Escopo
  y = drawSectionHeader(doc, y, '3', 'Escopo');
  y = drawWrappedText(doc, y, '3.1 Inclui', 7.5, true, 3);
  y += 1;
  y = drawBulletList(doc, y, p.escopoInclui);
  y += 2;
  y = drawWrappedText(doc, y, '3.2 Não inclui', 7.5, true, 3);
  y += 1;
  y = drawBulletList(doc, y, p.escopoNaoInclui);
  y += 3;

  // 4. Processo — Passo a Passo
  y = drawSectionHeader(doc, y, '4', 'Processo — Passo a Passo');
  y = drawStepTable(doc, y, p.steps);
  y += 3;

  // 5. Regras de Negócio
  y = drawSectionHeader(doc, y, '5', 'Regras de Negócio');
  y = drawBulletList(doc, y, p.regrasNegocio);
  y += 3;

  // 6. Compliance & Segurança
  y = drawSectionHeader(doc, y, '6', 'Compliance & Segurança');
  if (p.complianceIntro) {
    y = drawWrappedText(doc, y, p.complianceIntro, 7.5, false, 3);
    y += 1;
  }
  y = drawBulletList(doc, y, p.complianceItens);
  y += 3;

  // 7. Governança
  y = drawSectionHeader(doc, y, '7', 'Observações de Governança');
  y = drawBulletList(doc, y, p.governanca);
  y += 3;

  // 8. Matriz RACI
  y = drawSectionHeader(doc, y, '8', 'Matriz RACI');
  y = drawRACITable(doc, y, p.raciRoles, p.raciActivities);
}

function addCoverPage(doc) {
  // Full blue background
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  
  // Green accent line
  doc.setFillColor(...COLORS.green);
  doc.rect(0, 0, PAGE_W, 4, 'F');
  
  // Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Processos Modelo', PAGE_W / 2, 90, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.green);
  doc.text('Documentação Formal v2.0', PAGE_W / 2, 102, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255, 150);
  doc.text(`${PROCESSOS.length} processos documentados`, PAGE_W / 2, 115, { align: 'center' });
  
  // Date
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.green);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PAGE_W / 2, 130, { align: 'center' });
  
  // Sections info
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const sections = 'Identificação • Objetivo • Escopo • Passo a Passo • Regras de Negócio • Compliance • Governança • RACI';
  doc.text(sections, PAGE_W / 2, 145, { align: 'center', maxWidth: 140 });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text('Pin Bank — Compliance & Operações', PAGE_W / 2, PAGE_H - 20, { align: 'center' });
}

function addTableOfContents(doc) {
  doc.addPage();
  let y = MARGIN_T;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.blue);
  doc.text('Índice', MARGIN_L, y);
  y += 10;
  
  doc.setDrawColor(...COLORS.green);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 6;
  
  for (const p of PROCESSOS) {
    y = checkPage(doc, y, 6);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.green);
    doc.text(p.id, MARGIN_L, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.blue);
    const truncatedName = p.nome.length > 80 ? p.nome.substring(0, 77) + '...' : p.nome;
    doc.text(truncatedName, MARGIN_L + 18, y);
    
    doc.setTextColor(...COLORS.gray);
    doc.text(p.area, PAGE_W - MARGIN_R, y, { align: 'right', maxWidth: 50 });
    
    y += 5.5;
  }
}

export function generateProcessosPdf(mode = 'all', processoId = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  let processos;
  if (mode === 'single' && processoId) {
    processos = PROCESSOS.filter(p => p.id === processoId);
    if (processos.length === 0) return;
  } else {
    processos = PROCESSOS;
  }
  
  if (mode === 'all') {
    addCoverPage(doc);
    addTableOfContents(doc);
  }
  
  processos.forEach((p, i) => {
    renderProcesso(doc, p, false);
  });
  
  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (mode === 'all' && i <= 2) continue; // Skip cover + TOC
    addFooter(doc, mode === 'all' ? i - 2 : i, mode === 'all' ? totalPages - 2 : totalPages);
  }
  
  const fileName = mode === 'single' && processoId
    ? `Processo_${processoId}.pdf`
    : `Processos_Modelo_Pagsmile_${new Date().toISOString().slice(0, 10)}.pdf`;
  
  doc.save(fileName);
}