// generateProposalPdf — Backend function that builds a clean, branded PDF of a
// proposal (Custom / Standard / PIX) using jsPDF. NEVER touches the existing UI;
// it's a pure additive endpoint that returns a binary PDF file.
//
// Call patterns:
//   • Admin (authenticated): { type: 'proposal'|'standard_proposal'|'pix_proposal', proposalId: '...' }
//   • Public (anonymous):    { type, token } OR { type, slug }
//
// Public requests authenticate the proposal via tokenPublico OR publicSlug —
// same rules already used by usePublicProposalQuery / publicReadContext, so we
// don't expose anything that wasn't already public on the rendered page.

import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@2.5.2';

// ─── Brand tokens (from index.css / Layout.jsx) ───
const BRAND = {
  blue:        [0, 36, 67],     // #002443
  green:       [43, 193, 150],  // #2bc196
  greenLight:  [92, 247, 207],  // #5cf7cf
  text:        [40, 40, 40],
  muted:       [100, 116, 139],
  hairline:    [226, 232, 240],
  bg:          [244, 244, 244],
  white:       [255, 255, 255],
  amber:       [217, 119, 6],
};

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/df6449845_Logo-modo-escuro.png';

// ─── Utilities ───
const money = (v) =>
  `R$ ${(parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v) =>
  `${(parseFloat(v) || 0).toFixed(2).replace('.', ',')}%`;
const safe = (v, fallback = '—') => (v === null || v === undefined || v === '' ? fallback : v);

const formatCNPJ = (cnpj) => {
  if (!cnpj) return '—';
  const digits = String(cnpj).replace(/\D/g, '');
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cnpj;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
};

// ─── Fetch the logo as a base64 data URL (cached per cold-start) ───
let logoCache = null;
async function fetchLogoBase64() {
  if (logoCache) return logoCache;
  try {
    const res = await fetch(LOGO_URL);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    logoCache = 'data:image/png;base64,' + btoa(bin);
    return logoCache;
  } catch {
    return null;
  }
}

// ─── Page chrome (cover banner + footer on every page) ───
function drawHeaderBand(doc, logoB64) {
  // Top brand band
  doc.setFillColor(...BRAND.blue);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFillColor(...BRAND.green);
  doc.rect(0, 22, 210, 1.2, 'F');
  if (logoB64) {
    try { doc.addImage(logoB64, 'PNG', 14, 6, 30, 10); } catch {}
  } else {
    doc.setTextColor(...BRAND.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Pagsmile', 14, 14);
  }
}

function drawFooter(doc, pageNum, totalPages, codigo) {
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BRAND.hairline);
  doc.setLineWidth(0.2);
  doc.line(14, h - 12, 196, h - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Pagsmile  •  ${codigo || ''}`, 14, h - 7);
  const right = `Página ${pageNum} de ${totalPages}`;
  doc.text(right, 196 - doc.getTextWidth(right), h - 7);
  doc.setFontSize(7);
  doc.text('Documento confidencial — uso exclusivo do destinatário.', 105, h - 3, { align: 'center' });
}

// Ensures we have enough vertical space; otherwise creates a new page.
function ensureSpace(state, needed) {
  const limit = 280; // ~A4 height (297) minus footer area
  if (state.y + needed > limit) {
    state.doc.addPage();
    state.pageCount += 1;
    state.y = 30;
    drawHeaderBand(state.doc, state.logoB64);
  }
}

// Section title (e.g. "Pagamentos Online")
function sectionTitle(state, title, subtitle) {
  ensureSpace(state, subtitle ? 18 : 12);
  const { doc } = state;
  doc.setFillColor(...BRAND.green);
  doc.rect(14, state.y, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.blue);
  doc.text(title, 20, state.y + 5);
  state.y += 8;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    const lines = doc.splitTextToSize(subtitle, 176);
    doc.text(lines, 20, state.y);
    state.y += lines.length * 4 + 2;
  }
  state.y += 1;
}

// Soft card wrapper with title + content height
function card(state, title, contentHeight, render) {
  const totalH = title ? contentHeight + 10 : contentHeight + 6;
  ensureSpace(state, totalH);
  const { doc } = state;
  const x = 14;
  const w = 182;
  doc.setDrawColor(...BRAND.hairline);
  doc.setFillColor(...BRAND.white);
  doc.roundedRect(x, state.y, w, totalH, 2.5, 2.5, 'FD');
  let innerY = state.y + 5;
  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.blue);
    doc.text(title, x + 5, innerY);
    innerY += 5;
  }
  render(x + 5, innerY, w - 10);
  state.y += totalH + 4;
}

// Key-value mini box (used in grids)
function kvBox(doc, x, y, w, h, label, value, accent = false) {
  doc.setDrawColor(...BRAND.hairline);
  doc.setFillColor(...(accent ? [240, 253, 248] : BRAND.white));
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...BRAND.muted);
  doc.text(label.toUpperCase(), x + w / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...(accent ? BRAND.green : BRAND.blue));
  doc.text(String(value), x + w / 2, y + h - 4, { align: 'center' });
}

// ─── Hero section on page 1 ───
function drawHero(state, title, subtitle, badgeText) {
  const { doc } = state;
  // Big hero block
  doc.setFillColor(...BRAND.blue);
  doc.roundedRect(14, state.y, 182, 50, 4, 4, 'F');
  // Accent dot pattern (subtle)
  doc.setFillColor(...BRAND.green);
  if (badgeText) {
    const w = doc.getTextWidth(badgeText) + 8;
    doc.roundedRect(105 - w / 2, state.y + 8, w, 6, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.white);
    doc.text(badgeText, 105, state.y + 12, { align: 'center' });
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.white);
  doc.text(title, 105, state.y + 25, { align: 'center' });
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255, 0.85);
    doc.setTextColor(220, 230, 240);
    const lines = doc.splitTextToSize(subtitle, 160);
    doc.text(lines, 105, state.y + 35, { align: 'center' });
  }
  state.y += 56;
}

// ─── Card-rate table (Visa / Mastercard / Elo / Amex / Outras × ranges) ───
function cardRatesTable(state, rates, hide13a21) {
  const cartao = rates.cartao || {};
  const ranges = [
    { key: 'avista',   label: 'À Vista (1x)' },
    { key: 'de2a6x',   label: '2x a 6x' },
    { key: 'de7a12x',  label: '7x a 12x' },
  ];
  if (!hide13a21) ranges.push({ key: 'de13a21x', label: '13x a 21x' });
  const brands = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
  const headers = ['Faixa', 'Visa', 'Mastercard', 'Elo', 'Amex', 'Outras'];

  const colWidths = [40, 28, 28, 28, 28, 28];
  const rowH = 8;
  const totalH = rowH * (ranges.length + 1) + 4;
  card(state, 'Taxas de Cartão de Crédito', totalH, (x, y, w) => {
    const { doc } = state;
    // Header
    doc.setFillColor(...BRAND.blue);
    doc.rect(x, y, w, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.white);
    let cx = x;
    headers.forEach((h, i) => {
      const align = i === 0 ? 'left' : 'center';
      const tx = i === 0 ? cx + 3 : cx + colWidths[i] / 2;
      doc.text(h, tx, y + 5.5, { align });
      cx += colWidths[i];
    });
    // Rows
    let cy = y + rowH;
    ranges.forEach((r, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(x, cy, w, rowH, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.blue);
      doc.text(r.label, x + 3, cy + 5.5);
      cx = x + colWidths[0];
      brands.forEach((b, i) => {
        const v = parseFloat(cartao?.[b]?.[r.key]) || 0;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...(v > 0 ? BRAND.green : BRAND.muted));
        doc.text(pct(v), cx + colWidths[i + 1] / 2, cy + 5.5, { align: 'center' });
        cx += colWidths[i + 1];
      });
      cy += rowH;
    });
  });
}

// ─── Consolidated installments table (all anticipation terms side by side) ───
function installmentsTable(state, rates, taxaRAV, fallbackPrazo) {
  const baseByInstallment = (n) => {
    const c = rates.cartao?.mastercard || {};
    if (n === 1) return parseFloat(c.avista) || 0;
    if (n <= 6) return parseFloat(c.de2a6x) || 0;
    if (n <= 12) return parseFloat(c.de7a12x) || 0;
    return parseFloat(c.de13a21x) || 0;
  };
  const prazos = [
    { label: 'D+2',  days: 2 },
    { label: 'D+7',  days: 7 },
    { label: 'D+15', days: 15 },
    { label: 'D+30', days: 30 },
  ];
  const rav = parseFloat(taxaRAV) || 0;
  const computeFinal = (n, days) => {
    const base = baseByInstallment(n);
    if (rav <= 0) return base;
    // Approximation: monthly rate spread across (n-1) installments + days holding period
    const totalDays = ((n - 1) * 30) + Math.max(0, days);
    const ant = (rav / 30) * totalDays;
    return base + ant;
  };

  const installments = [];
  for (let i = 1; i <= 21; i++) installments.push(i);
  const rowH = 5.4;
  const totalH = rowH * (installments.length + 1) + 4;

  card(state, `Tabela de Parcelas — ${fallbackPrazo || 'D+30'}  •  Antecipação ${pct(rav)} a.m.`, totalH, (x, y, w) => {
    const { doc } = state;
    const cols = ['Parcela', 'Base'].concat(prazos.map(p => p.label));
    const colW = [22, 22, 28, 28, 28, 28];
    // distribute remainder
    const totalW = colW.reduce((a, b) => a + b, 0);
    const scale = w / totalW;
    const widths = colW.map(c => c * scale);

    doc.setFillColor(...BRAND.blue);
    doc.rect(x, y, w, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.white);
    let cx = x;
    cols.forEach((c, i) => {
      const align = i === 0 ? 'left' : 'center';
      const tx = i === 0 ? cx + 2 : cx + widths[i] / 2;
      doc.text(c, tx, y + 3.7, { align });
      cx += widths[i];
    });

    let cy = y + rowH;
    installments.forEach((n, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(x, cy, w, rowH, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...BRAND.blue);
      doc.text(`${n}x`, x + 2, cy + 3.7);
      const base = baseByInstallment(n);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BRAND.muted);
      cx = x + widths[0];
      doc.text(pct(base), cx + widths[1] / 2, cy + 3.7, { align: 'center' });
      cx += widths[1];
      prazos.forEach((p, i) => {
        const v = computeFinal(n, p.days);
        doc.setFont('helvetica', base > 0 || v > 0 ? 'bold' : 'normal');
        doc.setTextColor(...(v > 0 ? BRAND.green : BRAND.muted));
        doc.text(pct(v), cx + widths[i + 2] / 2, cy + 3.7, { align: 'center' });
        cx += widths[i + 2];
      });
      cy += rowH;
    });
  });
}

// ─── Common: client info card on page 1 ───
function clientCard(state, p) {
  card(state, 'Dados do Cliente', 22, (x, y, w) => {
    const { doc } = state;
    const col = w / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.blue);
    doc.text(safe(p.clienteNome || p.templateName || 'Cliente'), x, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    if (p.clienteCnpj) doc.text(`CNPJ: ${formatCNPJ(p.clienteCnpj)}`, x, y + 10);
    if (p.clienteContato) doc.text(`Contato: ${p.clienteContato}`, x, y + 15);
    if (p.clienteMcc) doc.text(`MCC: ${p.clienteMcc}`, x + col, y + 10);
    if (p.clienteEmail) doc.text(`E-mail: ${p.clienteEmail}`, x + col, y + 15);
  });
}

// ─── Validity + code card ───
function validityCard(state, p) {
  card(state, null, 16, (x, y, w) => {
    const { doc } = state;
    const col = w / 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    doc.text('CÓDIGO', x, y + 2);
    doc.text('EMITIDA EM', x + col, y + 2);
    doc.text('VÁLIDA ATÉ', x + col * 2, y + 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.blue);
    doc.text(safe(p.codigo), x, y + 9);
    doc.text(formatDate(p.created_date || p.sentDate), x + col, y + 9);
    doc.setTextColor(...BRAND.amber);
    doc.text(formatDate(p.validUntil), x + col * 2, y + 9);
  });
}

// ─── Online additional costs grid ───
function onlineCostsGrid(state, rates) {
  card(state, 'Custos Adicionais por Transação', 26, (x, y, w) => {
    const cellW = (w - 6) / 4;
    kvBox(state.doc, x,                    y, cellW, 18, 'Fee Transação',  money(rates.feeTransacao));
    kvBox(state.doc, x + cellW + 2,        y, cellW, 18, 'Antifraude',     money(rates.antifraude));
    kvBox(state.doc, x + (cellW + 2) * 2,  y, cellW, 18, '3DS',            money(rates.taxa3ds));
    kvBox(state.doc, x + (cellW + 2) * 3,  y, cellW, 18, 'Pré-chargeback', money(rates.alertaPreChargeback));
  });
}

// ─── Receivable + anticipation row ───
function recebimentoGrid(state, rates) {
  const taxaRAV = parseFloat(rates.rav?.taxa) || 0;
  const prazo = rates.rav?.prazo || 'D+1';
  const volAnt = parseFloat(rates.percentualAntecipacao) || 0;
  card(state, 'Recebimento e Antecipação', 22, (x, y, w) => {
    const cellW = (w - 4) / 3;
    kvBox(state.doc, x,                  y, cellW, 16, 'Prazo',            prazo);
    kvBox(state.doc, x + cellW + 2,      y, cellW, 16, 'Taxa Antecipação', `${pct(taxaRAV)} a.m.`);
    kvBox(state.doc, x + (cellW + 2) * 2,y, cellW, 16, 'Volume Antecipado', volAnt > 0 ? `${volAnt}%` : '—', true);
  });
}

// ─── PIX & Boleto card ───
function pixBoletoCard(state, rates) {
  if (!rates.pix && !rates.boleto) return;
  const pixVal = rates.pix?.tipo === 'fixo'
    ? money(rates.pix?.valor)
    : pct(rates.pix?.valor);
  card(state, 'PIX e Boleto', 22, (x, y, w) => {
    const cellW = (w - 2) / 2;
    kvBox(state.doc, x,             y, cellW, 16, 'PIX',    pixVal, true);
    kvBox(state.doc, x + cellW + 2, y, cellW, 16, 'Boleto', money(rates.boleto));
  });
}

// ─── General conditions (setup, forex, min revenue) ───
function condicoesGeraisCard(state, rates) {
  const setup = parseFloat(rates.setup) || 0;
  const forex = parseFloat(rates.forex) || 0;
  const min = rates.minimoGarantido || {};
  const hasMin = (parseFloat(min.mes1) || 0) > 0 || (parseFloat(min.mes2) || 0) > 0 || (parseFloat(min.mes3) || 0) > 0;
  if (setup === 0 && forex === 0 && !hasMin) return;

  const lines = [];
  if (setup > 0) lines.push({ label: 'Setup',                  value: money(setup) });
  if (forex > 0) lines.push({ label: 'Forex (Internacional)',  value: pct(forex) });
  if (hasMin) {
    lines.push({ label: 'Faturamento Mínimo Mês 1',  value: money(min.mes1) });
    lines.push({ label: 'Faturamento Mínimo Mês 2',  value: money(min.mes2) });
    lines.push({ label: 'Faturamento Mínimo Mês 3+', value: money(min.mes3) });
  }

  const rowH = 7;
  const totalH = rowH * lines.length + 2;
  card(state, 'Condições Comerciais Gerais', totalH, (x, y, w) => {
    const { doc } = state;
    lines.forEach((l, i) => {
      const cy = y + i * rowH;
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(x - 1, cy - 1, w + 2, rowH, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.muted);
      doc.text(l.label, x, cy + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BRAND.blue);
      doc.text(l.value, x + w, cy + 4.5, { align: 'right' });
    });
  });
}

// ─── PIX-only proposal: hero rate ───
function pixHero(state, rates) {
  const val = rates.pix?.tipo === 'fixo' ? money(rates.pix?.valor) : pct(rates.pix?.valor);
  const sub = rates.pix?.tipo === 'fixo' ? 'Por transação processada' : 'Sobre o valor da transação';
  ensureSpace(state, 40);
  const { doc } = state;
  doc.setFillColor(240, 253, 248);
  doc.setDrawColor(...BRAND.green);
  doc.roundedRect(14, state.y, 182, 35, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text('TAXA PIX', 105, state.y + 9, { align: 'center' });
  doc.setFontSize(28);
  doc.setTextColor(...BRAND.green);
  doc.text(val, 105, state.y + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(sub, 105, state.y + 30, { align: 'center' });
  state.y += 40;
}

// ─── Acceptance footer (only filled if proposal already accepted) ───
function acceptanceFooter(state, p) {
  if (p.status !== 'aceita' || !p.acceptedDate) return;
  ensureSpace(state, 22);
  const { doc } = state;
  doc.setDrawColor(...BRAND.green);
  doc.setFillColor(240, 253, 248);
  doc.roundedRect(14, state.y, 182, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.green);
  doc.text('PROPOSTA ACEITA', 18, state.y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.blue);
  doc.text(`Data do aceite: ${formatDate(p.acceptedDate)}`, 18, state.y + 13);
  state.y += 22;
}

// ═══════════════════════════════════════════════════════════
// PDF builders per type
// ═══════════════════════════════════════════════════════════

async function buildCustomProposalPdf(p) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoB64 = await fetchLogoBase64();
  const state = { doc, y: 30, pageCount: 1, logoB64 };
  drawHeaderBand(doc, logoB64);

  drawHero(state, 'Proposta Comercial', `Condições preparadas para ${safe(p.clienteNome, 'sua empresa')}`, 'PROPOSTA EXCLUSIVA');
  clientCard(state, p);
  validityCard(state, p);

  // Page 2 — Online section
  sectionTitle(state, 'Pagamentos Online', 'Taxas e custos aplicados em vendas processadas pelo checkout, link de pagamento ou e-commerce.');
  cardRatesTable(state, p.rates || {}, p.hideRange13a21);
  installmentsTable(state, p.rates || {}, parseFloat(p.rates?.rav?.taxa) || 0, p.rates?.rav?.prazo);
  onlineCostsGrid(state, p.rates || {});
  recebimentoGrid(state, p.rates || {});

  // Other services
  sectionTitle(state, 'Outros Serviços e Condições', 'PIX, Boleto e condições gerais aplicáveis ao contrato.');
  pixBoletoCard(state, p.rates || {});
  condicoesGeraisCard(state, p.rates || {});

  acceptanceFooter(state, p);

  return finalize(doc, state, p.codigo);
}

async function buildStandardProposalPdf(p) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoB64 = await fetchLogoBase64();
  const state = { doc, y: 30, pageCount: 1, logoB64 };
  drawHeaderBand(doc, logoB64);

  drawHero(state, 'Condições Comerciais', `Taxas padrão para o segmento ${safe(p.segment, '—')}`, 'PROPOSTA PADRÃO');
  clientCard(state, p);
  validityCard(state, p);

  sectionTitle(state, 'Pagamentos Online', 'Taxas e custos aplicados em vendas processadas pelo checkout, link de pagamento ou e-commerce.');
  cardRatesTable(state, p.rates || {}, false);
  installmentsTable(state, p.rates || {}, parseFloat(p.rates?.rav?.taxa) || 0, p.rates?.rav?.prazo);
  onlineCostsGrid(state, p.rates || {});
  recebimentoGrid(state, p.rates || {});

  sectionTitle(state, 'Outros Serviços e Condições', 'PIX, Boleto e condições gerais aplicáveis ao contrato.');
  pixBoletoCard(state, p.rates || {});
  condicoesGeraisCard(state, p.rates || {});

  return finalize(doc, state, p.codigo);
}

async function buildPixProposalPdf(p) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoB64 = await fetchLogoBase64();
  const state = { doc, y: 30, pageCount: 1, logoB64 };
  drawHeaderBand(doc, logoB64);

  drawHero(state, 'Proposta PIX', `Condições PIX preparadas para ${safe(p.clienteNome, 'sua empresa')}`, 'PROPOSTA PIX');
  clientCard(state, p);
  validityCard(state, p);

  sectionTitle(state, 'Taxa PIX Acordada', 'Tarifa única aplicada em todas as transações PIX recebidas via Pagsmile.');
  pixHero(state, p.rates || {});
  condicoesGeraisCard(state, p.rates || {});

  acceptanceFooter(state, p);

  return finalize(doc, state, p.codigo);
}

function finalize(doc, state, codigo) {
  // Footer on every page
  const total = state.pageCount;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total, codigo);
  }
  return doc.output('arraybuffer');
}

// ═══════════════════════════════════════════════════════════
// HTTP handler
// ═══════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    // Allow both authenticated (admin) and anonymous (public) callers.
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch {
      base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
        requiresAuth: false,
      });
    }
    const body = await req.json();
    const { type, proposalId, token, slug } = body || {};

    if (!type || !['proposal', 'standard_proposal', 'pix_proposal'].includes(type)) {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (!proposalId && !token && !slug) {
      return Response.json({ error: 'Missing proposalId / token / slug' }, { status: 400 });
    }

    const entityName = type === 'proposal'
      ? 'Proposal'
      : type === 'standard_proposal'
      ? 'StandardProposal'
      : 'PixProposal';

    // Resolve proposal as service role (we already validate access via id+token)
    let proposal = null;
    if (proposalId) {
      // Authenticated admin path: requires the user to actually be authenticated.
      try {
        const me = await base44.auth.me();
        if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      } catch {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const list = await base44.asServiceRole.entities[entityName].filter({ id: proposalId });
      proposal = list?.[0] || null;
    } else if (token) {
      const list = await base44.asServiceRole.entities[entityName].filter({ tokenPublico: token });
      proposal = list?.[0] || null;
    } else if (slug) {
      const list = await base44.asServiceRole.entities[entityName].filter({ publicSlug: slug });
      proposal = list?.[0] || null;
    }

    if (!proposal) return Response.json({ error: 'Proposal not found' }, { status: 404 });

    // Build PDF
    let pdfBytes;
    if (type === 'proposal') pdfBytes = await buildCustomProposalPdf(proposal);
    else if (type === 'standard_proposal') pdfBytes = await buildStandardProposalPdf(proposal);
    else pdfBytes = await buildPixProposalPdf(proposal);

    const filename = `Pagsmile-${(proposal.codigo || 'proposta').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('generateProposalPdf error', error);
    return Response.json({ error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
});