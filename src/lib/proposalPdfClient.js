/**
 * Gerador de PDF client-side para propostas Pagsmile.
 *
 * Substitui a backend function `generateProposalPdf` com duas correções:
 *  1. Fórmula de antecipação CORRETA (igual ao ParcelasTable.jsx):
 *     Para cada parcela N e prazo D: média de max(0, i*30 - D)/30 * RAV
 *     sobre i=1..N. O backend usava ((n-1)*30 + days) — invertido.
 *  2. Suporte Multi-MCC: renderiza tabela de taxas + parcelas por MCC.
 */

import { jsPDF } from 'jspdf';
import { callPublicFunction } from '@/lib/publicApi';

// ─── Brand tokens ───
const BRAND = {
  blue: [19, 86, 226], green: [232, 75, 28], greenLight: [255, 184, 28],
  text: [10, 10, 10], muted: [100, 116, 139], hairline: [226, 232, 240],
  bg: [247, 245, 240], white: [255, 255, 255], amber: [217, 119, 6],
};

const LOGO_URL = 'https://media.base44.com/images/public/6983b65f017b96d5f695f9bb/c0c42c436_01-pinbank-logo-sunset.png';

// ─── Utilities ───
const money = (v) => `R$ ${(parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v) => `${(parseFloat(v) || 0).toFixed(2).replace('.', ',')}%`;
const safe = (v, f = '—') => (v === null || v === undefined || v === '' ? f : v);

function formatCNPJ(cnpj) {
  const d = String(cnpj || '').replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return cnpj || '—';
}

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return '—'; }
}

// ─── Logo cache ───
let logoCache = null;
async function fetchLogoBase64() {
  if (logoCache !== null) return logoCache;
  try {
    const res = await fetch(LOGO_URL);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    logoCache = 'data:image/png;base64,' + btoa(bin);
    return logoCache;
  } catch { logoCache = false; return false; }
}

// ─── Page chrome ───
function drawHeaderBand(doc, logoB64) {
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
    doc.text('Pin Bank', 14, 14);
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
  doc.text(`Pin Bank  •  ${codigo || ''}`, 14, h - 7);
  const right = `Página ${pageNum} de ${totalPages}`;
  doc.text(right, 196 - doc.getTextWidth(right), h - 7);
  doc.setFontSize(7);
  doc.text('Documento confidencial — uso exclusivo do destinatário.', 105, h - 3, { align: 'center' });
}

function ensureSpace(state, needed) {
  if (state.y + needed > 280) {
    state.doc.addPage();
    state.pageCount += 1;
    state.y = 30;
    drawHeaderBand(state.doc, state.logoB64);
  }
}

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

function card(state, title, contentHeight, render) {
  const totalH = title ? contentHeight + 10 : contentHeight + 6;
  ensureSpace(state, totalH);
  const { doc } = state;
  const x = 14, w = 182;
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

// ─── Hero ───
function drawHero(state, title, subtitle, badgeText) {
  const { doc } = state;
  doc.setFillColor(...BRAND.blue);
  doc.roundedRect(14, state.y, 182, 50, 4, 4, 'F');
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
    doc.setTextColor(220, 230, 240);
    const lines = doc.splitTextToSize(subtitle, 160);
    doc.text(lines, 105, state.y + 35, { align: 'center' });
  }
  state.y += 56;
}

// ─── Card rates table (supports Multi-MCC) ───
function cardRatesTable(state, rates, hide13a21, mccLabel) {
  // Se Multi-MCC, renderiza uma tabela por MCC
  const mccList = Array.isArray(rates.cartaoPorMcc) && rates.cartaoPorMcc.length > 0
    ? rates.cartaoPorMcc
    : [{ mcc: '', mccLabel: '', cartao: rates.cartao || {} }];

  mccList.forEach((mccEntry, mccIdx) => {
    const cartao = mccEntry.cartao || {};
    const ranges = [
      { key: 'avista', label: 'À Vista (1x)' },
      { key: 'de2a6x', label: '2x a 6x' },
      { key: 'de7a12x', label: '7x a 12x' },
    ];
    if (!hide13a21) ranges.push({ key: 'de13a21x', label: '13x a 21x' });
    const brands = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
    const headers = ['Faixa', 'Visa', 'Mastercard', 'Elo', 'Amex', 'Outras'];
    const colWidths = [40, 28, 28, 28, 28, 28];
    const rowH = 8;
    const title = mccList.length > 1
      ? `Taxas de Cartão — MCC ${mccEntry.mcc}${mccEntry.mccLabel ? ` (${mccEntry.mccLabel})` : ''}`
      : 'Taxas de Cartão de Crédito';
    const totalH = rowH * (ranges.length + 1) + 4;

    card(state, title, totalH, (x, y, w) => {
      const { doc } = state;
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
      let cy = y + rowH;
      ranges.forEach((r, idx) => {
        if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(x, cy, w, rowH, 'F'); }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...BRAND.blue);
        doc.text(r.label, x + 3, cy + 5.5);
        cx = x + colWidths[0];
        brands.forEach((b) => {
          const v = parseFloat(cartao?.[b]?.[r.key]) || 0;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...(v > 0 ? BRAND.green : BRAND.muted));
          doc.text(pct(v), cx + colWidths[1] / 2, cy + 5.5, { align: 'center' });
          cx += colWidths[1];
        });
        cy += rowH;
      });
    });
  });
}

// ─── Installments table (CORRECT calculation + Multi-MCC) ───
function installmentsTable(state, rates, taxaRAV, fallbackPrazo) {
  const rav = parseFloat(taxaRAV) || 0;
  const prazos = [
    { label: 'D+1', days: 1 },
    { label: 'D+2', days: 2 },
    { label: 'D+7', days: 7 },
    { label: 'D+15', days: 15 },
    { label: 'D+30', days: 30 },
  ];

  // Se Multi-MCC, renderiza uma tabela por MCC
  const mccList = Array.isArray(rates.cartaoPorMcc) && rates.cartaoPorMcc.length > 0
    ? rates.cartaoPorMcc
    : [{ mcc: '', mccLabel: '', cartao: rates.cartao || {} }];

  mccList.forEach((mccEntry) => {
    const cartao = mccEntry.cartao || {};
    const baseByInstallment = (n) => {
      const c = cartao.mastercard || {};
      if (n === 1) return parseFloat(c.avista) || 0;
      if (n <= 6) return parseFloat(c.de2a6x) || 0;
      if (n <= 12) return parseFloat(c.de7a12x) || 0;
      return parseFloat(c.de13a21x) || 0;
    };

    // CORRETO: média de max(0, i*30 - prazo) / 30 * RAV sobre i=1..N
    const computeFinal = (n, days) => {
      const base = baseByInstallment(n);
      if (rav <= 0) return base;
      let somaAntecip = 0;
      for (let i = 1; i <= n; i++) {
        const diasVencimento = i * 30;
        const diasAntecipados = diasVencimento - days;
        if (diasAntecipados > 0) somaAntecip += (diasAntecipados / 30) * rav;
      }
      return base + (somaAntecip / n);
    };

    const maxParcelas = mccList.length > 1 && fallbackPrazo && rates.hideRange13a21 ? 12 : 21;
    const installments = [];
    for (let i = 1; i <= maxParcelas; i++) installments.push(i);
    const rowH = 5.4;
    const totalH = rowH * (installments.length + 1) + 4;
    const title = mccList.length > 1
      ? `Parcelas — MCC ${mccEntry.mcc}  •  Antecipação ${pct(rav)} a.m.`
      : `Tabela de Parcelas — ${fallbackPrazo || 'D+30'}  •  Antecipação ${pct(rav)} a.m.`;

    card(state, title, totalH, (x, y, w) => {
      const { doc } = state;
      const cols = ['Parcela', 'Base'].concat(prazos.map(p => p.label));
      const colW = [22, 22, 28, 28, 28, 28, 28];
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
        if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(x, cy, w, rowH, 'F'); }
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
  });
}

// ─── Other sections (same layout as backend) ───
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

function validityCard(state, p) {
  card(state, null, 16, (x, y) => {
    const { doc } = state;
    const col = 172 / 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    doc.text('CÓDIGO', x, y + 2);
    doc.text('EMITIDA EM', x + col, y + 2);
    doc.text('VÁLIDA ATÉ', x + col * 2, y + 2);
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.blue);
    doc.text(safe(p.codigo), x, y + 9);
    doc.text(formatDate(p.created_date || p.sentDate), x + col, y + 9);
    doc.setTextColor(...BRAND.amber);
    doc.text(formatDate(p.validUntil), x + col * 2, y + 9);
  });
}

function onlineCostsGrid(state, rates) {
  card(state, 'Custos Adicionais por Transação', 26, (x, y, w) => {
    const cellW = (w - 6) / 4;
    kvBox(state.doc, x, y, cellW, 18, 'Fee Transação', money(rates.feeTransacao));
    kvBox(state.doc, x + cellW + 2, y, cellW, 18, 'Antifraude', money(rates.antifraude));
    kvBox(state.doc, x + (cellW + 2) * 2, y, cellW, 18, '3DS', money(rates.taxa3ds));
    kvBox(state.doc, x + (cellW + 2) * 3, y, cellW, 18, 'Pré-chargeback', money(rates.alertaPreChargeback));
  });
}

function recebimentoGrid(state, rates) {
  const taxaRAV = parseFloat(rates.rav?.taxa) || 0;
  const prazo = rates.rav?.prazo || 'D+1';
  const volAnt = parseFloat(rates.percentualAntecipacao) || 0;
  card(state, 'Recebimento e Antecipação', 22, (x, y, w) => {
    const cellW = (w - 4) / 3;
    kvBox(state.doc, x, y, cellW, 16, 'Prazo', prazo);
    kvBox(state.doc, x + cellW + 2, y, cellW, 16, 'Taxa Antecipação', `${pct(taxaRAV)} a.m.`);
    kvBox(state.doc, x + (cellW + 2) * 2, y, cellW, 16, 'Volume Antecipado', volAnt > 0 ? `${volAnt}%` : '—', true);
  });
}

function pixBoletoCard(state, rates) {
  if (!rates.pix && !rates.boleto) return;
  const pixVal = rates.pix?.tipo === 'fixo' ? money(rates.pix?.valor) : pct(rates.pix?.valor);
  card(state, 'PIX e Boleto', 22, (x, y, w) => {
    const cellW = (w - 2) / 2;
    kvBox(state.doc, x, y, cellW, 16, 'PIX', pixVal, true);
    kvBox(state.doc, x + cellW + 2, y, cellW, 16, 'Boleto', money(rates.boleto));
  });
}

function condicoesGeraisCard(state, rates) {
  const setup = parseFloat(rates.setup) || 0;
  const forex = parseFloat(rates.forex) || 0;
  const min = rates.minimoGarantido || {};
  const hasMin = (parseFloat(min.mes1) || 0) > 0 || (parseFloat(min.mes2) || 0) > 0 || (parseFloat(min.mes3) || 0) > 0;
  if (setup === 0 && forex === 0 && !hasMin) return;
  const lines = [];
  if (setup > 0) lines.push({ label: 'Setup', value: money(setup) });
  if (forex > 0) lines.push({ label: 'Forex (Internacional)', value: pct(forex) });
  if (hasMin) {
    lines.push({ label: 'Faturamento Mínimo Mês 1', value: money(min.mes1) });
    lines.push({ label: 'Faturamento Mínimo Mês 2', value: money(min.mes2) });
    lines.push({ label: 'Faturamento Mínimo Mês 3+', value: money(min.mes3) });
  }
  const rowH = 7;
  card(state, 'Condições Comerciais Gerais', rowH * lines.length + 2, (x, y, w) => {
    const { doc } = state;
    lines.forEach((l, i) => {
      const cy = y + i * rowH;
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(x - 1, cy - 1, w + 2, rowH, 'F'); }
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

function pixHero(state, rates) {
  const val = rates.pix?.tipo === 'fixo' ? money(rates.pix?.valor) : pct(rates.pix?.valor);
  const sub = rates.pix?.tipo === 'fixo' ? 'Por transação processada' : 'Sobre o valor da transação';
  ensureSpace(state, 40);
  const { doc } = state;
  doc.setFillColor(237, 242, 253);
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

function mcc8999Disclaimer(state, mccEsperado, gatewayRates) {
  if (!gatewayRates) return;
  const lines = [
    `MDR à vista: ${pct(gatewayRates.mdrAvista)}`,
    `MDR 2-6x: ${pct(gatewayRates.mdr2a6x)}`,
    `MDR 7-12x: ${pct(gatewayRates.mdr7a12x)}`,
    `MDR 13-21x: ${pct(gatewayRates.mdr13a21x)}`,
    `Antecipação: ${pct(gatewayRates.percentualAntecipacao)} a.m.`,
    `PIX: ${pct(gatewayRates.pixTaxaPercentual)} + ${money(gatewayRates.pixTaxaFixa)}`,
    `Boleto: ${money(gatewayRates.boleto)}`,
    `Antifraude: ${money(gatewayRates.antifraude)}`,
    `Fee transação: ${money(gatewayRates.feeTransacao)}`,
    `3DS: ${money(gatewayRates.taxa3ds)}`,
  ];
  const rowsCount = Math.ceil(lines.length / 2);
  const totalH = 16 + rowsCount * 5 + 4;
  ensureSpace(state, totalH + 4);
  const { doc } = state;
  const x = 14, w = 182;
  doc.setDrawColor(217, 119, 6);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(x, state.y, w, totalH, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.amber);
  doc.text('Aviso sobre reclassificação de MCC', x + 5, state.y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.text);
  const mccTxt = mccEsperado
    ? `As taxas desta proposta foram dimensionadas para o MCC ${mccEsperado} do seu segmento.`
    : 'As taxas desta proposta foram dimensionadas para o MCC contratado do seu segmento.';
  const body = `${mccTxt} Caso a Pin Bank identifique transações operadas em MCCs incompatíveis com o segmento contratado, essas transações específicas serão reclassificadas automaticamente para o MCC 8999 e cobradas com as taxas padrão abaixo:`;
  const bodyLines = doc.splitTextToSize(body, w - 10);
  doc.text(bodyLines, x + 5, state.y + 11);
  let cy = state.y + 11 + bodyLines.length * 3.5 + 2;
  const colW = (w - 10) / 2;
  doc.setFontSize(8);
  lines.forEach((line, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    doc.setTextColor(...BRAND.amber);
    doc.text('•', x + 5 + col * colW, cy + row * 5);
    doc.setTextColor(...BRAND.blue);
    doc.text(line, x + 9 + col * colW, cy + row * 5);
  });
  state.y += totalH + 4;
}

function acceptanceFooter(state, p) {
  if (p.status !== 'aceita' || !p.acceptedDate) return;
  ensureSpace(state, 22);
  const { doc } = state;
  doc.setDrawColor(...BRAND.green);
  doc.setFillColor(237, 242, 253);
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

// ─── PDF builders ───
async function buildCustomProposalPdf(p, gatewayRates) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoB64 = await fetchLogoBase64();
  const state = { doc, y: 30, pageCount: 1, logoB64 };
  drawHeaderBand(doc, logoB64);

  drawHero(state, 'Proposta Comercial', `Condições preparadas para ${safe(p.clienteNome, 'sua empresa')}`, 'PROPOSTA EXCLUSIVA');
  clientCard(state, p);
  validityCard(state, p);

  sectionTitle(state, 'Pagamentos Online', 'Taxas e custos aplicados em vendas processadas pelo checkout, link de pagamento ou e-commerce.');
  cardRatesTable(state, p.rates || {}, p.hideRange13a21);
  installmentsTable(state, p.rates || {}, parseFloat(p.rates?.rav?.taxa) || 0, p.rates?.rav?.prazo);
  onlineCostsGrid(state, p.rates || {});
  recebimentoGrid(state, p.rates || {});
  if (String(p.businessSubCategory || '').toLowerCase() !== 'gateway') {
    mcc8999Disclaimer(state, p.clienteMcc, gatewayRates);
  }

  sectionTitle(state, 'Outros Serviços e Condições', 'PIX, Boleto e condições gerais aplicáveis ao contrato.');
  pixBoletoCard(state, p.rates || {});
  condicoesGeraisCard(state, p.rates || {});
  acceptanceFooter(state, p);

  finalize(doc, state, p.codigo);
  return doc;
}

async function buildStandardProposalPdf(p, gatewayRates) {
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
  if (!/gateway/i.test(String(p.segment || ''))) {
    mcc8999Disclaimer(state, p.mcc || p.clienteMcc, gatewayRates);
  }

  sectionTitle(state, 'Outros Serviços e Condições', 'PIX, Boleto e condições gerais aplicáveis ao contrato.');
  pixBoletoCard(state, p.rates || {});
  condicoesGeraisCard(state, p.rates || {});

  finalize(doc, state, p.codigo);
  return doc;
}

async function buildPixProposalPdf(p) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoB64 = await fetchLogoBase64();
  const state = { doc, y: 30, pageCount: 1, logoB64 };
  drawHeaderBand(doc, logoB64);

  drawHero(state, 'Proposta PIX', `Condições PIX preparadas para ${safe(p.clienteNome, 'sua empresa')}`, 'PROPOSTA PIX');
  clientCard(state, p);
  validityCard(state, p);

  sectionTitle(state, 'Taxa PIX Acordada', 'Tarifa única aplicada em todas as transações PIX recebidas via Pin Bank.');
  pixHero(state, p.rates || {});
  condicoesGeraisCard(state, p.rates || {});
  acceptanceFooter(state, p);

  finalize(doc, state, p.codigo);
  return doc;
}

function finalize(doc, state, codigo) {
  const total = state.pageCount;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total, codigo);
  }
}

// ─── Data fetching ───
const ENTITY_BY_TYPE = {
  proposal: 'Proposal',
  standard_proposal: 'StandardProposal',
  pix_proposal: 'PixProposal',
};

const KIND_BY_TYPE = {
  proposal: 'proposal_by_token',
  pix_proposal: 'pix_proposal_by_token',
  standard_proposal: 'standard_proposal_by_token',
};

const SLUG_ENTITY_BY_TYPE = {
  proposal: 'proposal',
  pix_proposal: 'pixProposal',
  standard_proposal: 'standardProposal',
};

async function fetchProposalAuthenticated(type, proposalId) {
  const { base44 } = await import('@/api/base44Client');
  const entityName = ENTITY_BY_TYPE[type];
  const list = await base44.entities[entityName].filter({ id: proposalId });
  const proposal = list?.[0] || null;
  if (!proposal) return { proposal: null, gatewayRates: null };

  let gatewayRates = null;
  try {
    const gList = await base44.entities.SegmentDefaultRates.filter({ segmentName: 'Gateway' });
    if (gList?.[0]) {
      const g = gList[0];
      gatewayRates = {
        mdrAvista: g.mdrAvista, mdr2a6x: g.mdr2a6x, mdr7a12x: g.mdr7a12x, mdr13a21x: g.mdr13a21x,
        percentualAntecipacao: g.percentualAntecipacao, pixTaxaPercentual: g.pixTaxaPercentual,
        pixTaxaFixa: g.pixTaxaFixa, boleto: g.boleto, antifraude: g.antifraude,
        feeTransacao: g.feeTransacao, taxa3ds: g.taxa3ds,
      };
    }
  } catch {}
  return { proposal, gatewayRates };
}

async function fetchProposalPublic(type, token, slug) {
  const kind = KIND_BY_TYPE[type];
  let result = null;

  if (token) {
    const res = await callPublicFunction('publicReadContext', { kind, token });
    if (res?.proposal) {
      return { proposal: res.proposal, gatewayRates: res.mcc8999Rates || null };
    }
  }

  if (slug) {
    const slugRes = await callPublicFunction('publicReadContext', {
      kind: 'resolve_public_slug',
      entityType: SLUG_ENTITY_BY_TYPE[type],
      slug,
    });
    const redirectTo = slugRes?.redirectTo;
    if (redirectTo) {
      const url = new URL(redirectTo, window.location.origin);
      const newToken = url.searchParams.get('token');
      if (newToken) {
        const res = await callPublicFunction('publicReadContext', { kind, token: newToken });
        if (res?.proposal) {
          return { proposal: res.proposal, gatewayRates: res.mcc8999Rates || null };
        }
      }
    }
  }

  return { proposal: null, gatewayRates: null };
}

// ─── Main entry point ───
export async function downloadProposalPdf({ type, proposalId, token, slug, codigo, publicMode }) {
  let proposal, gatewayRates;

  if (publicMode) {
    ({ proposal, gatewayRates } = await fetchProposalPublic(type, token, slug));
  } else {
    ({ proposal, gatewayRates } = await fetchProposalAuthenticated(type, proposalId));
  }

  if (!proposal) throw new Error('Proposta não encontrada');

  let doc;
  if (type === 'pix_proposal') {
    doc = await buildPixProposalPdf(proposal);
  } else if (type === 'standard_proposal') {
    doc = await buildStandardProposalPdf(proposal, gatewayRates);
  } else {
    doc = await buildCustomProposalPdf(proposal, gatewayRates);
  }

  const filename = `PinBank-${(codigo || proposal.codigo || 'proposta').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
  doc.save(filename);
}