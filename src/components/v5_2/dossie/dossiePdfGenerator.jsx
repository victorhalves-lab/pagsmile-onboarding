/**
 * [V5.2 Fase 6.5.5] Gerador de PDF do Dossiê Auditável V5.2.
 *
 * Usa jsPDF (já instalado). Layout em formato regulatório:
 *   - Capa com identificação + hash de integridade
 *   - Seção 1: Identificação & Classificação
 *   - Seção 2: Score V5.2 decomposto
 *   - Seção 3: Patch Financeiro
 *   - Seção 4: Bloqueios & Condições
 *   - Seção 5: Cross-Validation 16 campos
 *   - Seção 6: Plano de Monitoramento Cat 5 (se aplicável)
 *   - Seção 7: Parecer SENTINEL
 *   - Rodapé com hash em cada página
 *
 * NÃO depende de network, NÃO usa LLM — geração 100% local determinística.
 */

import { jsPDF } from 'jspdf';

const COLOR_PRIMARY = [0, 36, 67]; // #002443
const COLOR_ACCENT = [43, 193, 150]; // #2bc196
const COLOR_MUTED = [100, 116, 139];
const COLOR_DANGER = [220, 38, 38];

const PAGE_MARGIN = 15;
const LINE_HEIGHT = 5;

/**
 * Gera o PDF e retorna um Blob.
 */
export function generateDossiePdf(dossie) {
  const { payload, hash, generated_at, dossie_version } = dossie;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  let y = PAGE_MARGIN;

  // Helper: nova página com header/footer
  const newPage = () => {
    doc.addPage();
    y = PAGE_MARGIN;
    drawFooter();
  };

  // Helper: garante espaço; se não couber, quebra página
  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 20) newPage();
  };

  const drawFooter = () => {
    const total = doc.internal.getNumberOfPages();
    const current = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(
      `Dossiê V5.2 · Hash SHA-256: ${hash.substring(0, 32)}…  ·  Página ${current}/${total}`,
      PAGE_MARGIN,
      pageHeight - 8
    );
  };

  const heading = (text, size = 14, color = COLOR_PRIMARY) => {
    ensureSpace(10);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(text, PAGE_MARGIN, y);
    y += size * 0.5 + 2;
  };

  const subheading = (text) => {
    ensureSpace(8);
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_ACCENT);
    doc.setFont('helvetica', 'bold');
    doc.text(text, PAGE_MARGIN, y);
    y += 5;
    doc.setDrawColor(...COLOR_ACCENT);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + 40, y);
    y += 3;
  };

  const body = (text, opts = {}) => {
    const size = opts.size || 9;
    const color = opts.color || COLOR_PRIMARY;
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(String(text || '—'), contentWidth);
    lines.forEach((line) => {
      ensureSpace(LINE_HEIGHT);
      doc.text(line, PAGE_MARGIN, y);
      y += LINE_HEIGHT;
    });
  };

  const kv = (label, value) => {
    ensureSpace(LINE_HEIGHT);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text(label + ':', PAGE_MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED);
    const labelWidth = doc.getTextWidth(label + ': ') + 1;
    const valueText = String(value ?? '—');
    const lines = doc.splitTextToSize(valueText, contentWidth - labelWidth);
    doc.text(lines[0], PAGE_MARGIN + labelWidth, y);
    y += LINE_HEIGHT;
    for (let i = 1; i < lines.length; i++) {
      ensureSpace(LINE_HEIGHT);
      doc.text(lines[i], PAGE_MARGIN + labelWidth, y);
      y += LINE_HEIGHT;
    }
  };

  const spacer = (n = 3) => {
    y += n;
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return iso;
    }
  };

  // ════════════════════════════════════════
  // CAPA
  // ════════════════════════════════════════
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Dossiê Auditável V5.2', PAGE_MARGIN, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PagSmile · Framework de Compliance V5.2', PAGE_MARGIN, 26);
  doc.setFontSize(8);
  doc.text(`Versão do dossiê: ${dossie_version}`, PAGE_MARGIN, 32);

  y = 50;

  heading('Identificação do Caso', 12);
  kv('Merchant', payload.identificacao.merchant_nome);
  kv('Documento', payload.identificacao.merchant_documento);
  kv('Tipo', payload.identificacao.merchant_tipo);
  kv('Case ID', payload.identificacao.case_id);
  kv('Merchant ID', payload.identificacao.merchant_id);
  kv('Link origem', payload.identificacao.onboarding_link_code);
  spacer(5);

  heading('Integridade do Dossiê', 12);
  kv('Gerado em', fmtDate(generated_at));
  kv('Framework', payload.framework_version);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('Hash SHA-256:', PAGE_MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_ACCENT);
  const hashLines = doc.splitTextToSize(hash, contentWidth);
  hashLines.forEach((line) => {
    ensureSpace(LINE_HEIGHT);
    doc.text(line, PAGE_MARGIN, y);
    y += LINE_HEIGHT;
  });
  spacer(5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR_MUTED);
  const disclaimer = doc.splitTextToSize(
    'Este dossiê é uma representação determinística do estado do caso no momento da geração. O hash SHA-256 acima garante integridade — qualquer alteração no payload original invalidará a verificação. Fundamento regulatório: Circ. BCB 3.978 Art. 17 (rastreabilidade) + Resol. BCB 403/2024 + DOC5 V5.2 §49.',
    contentWidth
  );
  disclaimer.forEach((line) => {
    ensureSpace(LINE_HEIGHT);
    doc.text(line, PAGE_MARGIN, y);
    y += LINE_HEIGHT;
  });

  drawFooter();

  // ════════════════════════════════════════
  // SEÇÃO 1: Classificação V5.2
  // ════════════════════════════════════════
  newPage();
  heading('1. Classificação V5.2');
  kv('Tier', payload.classificacao.tier);
  kv('Segmento', payload.classificacao.segmento);
  kv('Morfologia', payload.classificacao.morfologia);
  kv('Grau (subseller)', payload.classificacao.grau);
  kv(
    'Capabilities ativas',
    (payload.classificacao.capabilities_ativas || []).join(', ') || 'Nenhuma'
  );
  spacer();

  subheading('Datas-chave & Versão do framework');
  kv('Submissão', fmtDate(payload.datas.submission_date));
  kv('Framework no início', payload.datas.framework_version_at_start);
  kv('Framework na submissão', payload.datas.framework_version_at_submit);
  kv('Framework na decisão', payload.datas.framework_version_at_decision);
  kv('Decisão final', fmtDate(payload.datas.final_decision_date));
  kv('Caso transicional', payload.datas.is_transitional_case ? 'SIM ⚠️' : 'Não');

  // ════════════════════════════════════════
  // SEÇÃO 2: Score V5.2
  // ════════════════════════════════════════
  spacer(5);
  heading('2. Score V5.2 — Decomposição em 5 Camadas');
  if (payload.score_v5_2) {
    kv('Score final', payload.score_v5_2.score_final);
    kv('Subfaixa tier-aware', payload.score_v5_2.subfaixa_tier_aware);
    kv('Categoria de decisão', payload.score_v5_2.categoria_decisao);
    spacer();
    subheading('Camadas');
    const c = payload.score_v5_2.camadas || {};
    kv('Camada 1 — Base Segmento+Tier', c.camada_1_segmento);
    kv('Camada 2 — Ajuste Morfológico', c.camada_2_morfologia);
    kv('Camada 3 — Variáveis V-*', c.camada_3_variaveis);
    kv('Camada 4 — Capabilities', c.camada_4_capabilities);
    kv('Camada 5 — Patch Financeiro', c.camada_5_patch);
    kv('V-Financial Coherence', payload.score_v5_2.v_financial_coherence);
  } else {
    body('Score V5.2 não disponível neste caso.');
  }

  // ════════════════════════════════════════
  // SEÇÃO 3: Patch Financeiro
  // ════════════════════════════════════════
  spacer(5);
  heading('3. Patch Financeiro');
  kv('Status consolidado', payload.patch_financeiro.status);
  const dims = payload.patch_financeiro.dimensoes || {};
  if (Object.keys(dims).length > 0) {
    spacer();
    subheading('5 Dimensões');
    Object.entries(dims).forEach(([key, dim]) => {
      if (!dim) return;
      kv(
        key,
        `declarado=${dim.valor_declarado ?? '—'}  observado=${dim.valor_observado ?? '—'}  divergência=${dim.divergencia_pct != null ? dim.divergencia_pct + '%' : '—'}${dim.bloqueio_disparado ? '  ⚠ BLOQUEIO' : ''}`
      );
    });
  } else {
    body('Sem dimensões registradas.');
  }

  // ════════════════════════════════════════
  // SEÇÃO 4: Bloqueios & Condições
  // ════════════════════════════════════════
  spacer(5);
  heading('4. Bloqueios & Condições');
  const blocks = payload.bloqueios.ativos || [];
  if (blocks.length === 0) {
    body('Nenhum bloqueio ativo. ✓');
  } else {
    subheading(`Bloqueios ativos (${blocks.length})`);
    blocks.forEach((b) => body('• ' + b, { color: COLOR_DANGER }));
  }
  spacer();
  const conds = payload.bloqueios.condicoes_automaticas || [];
  if (conds.length > 0) {
    subheading('Condições automáticas');
    conds.forEach((c) => body('• ' + c));
  }
  spacer();
  kv('Nível de monitoramento', payload.bloqueios.monitoramento_nivel);
  kv(
    'Rolling Reserve',
    payload.bloqueios.rolling_reserve_percent != null
      ? payload.bloqueios.rolling_reserve_percent + '%'
      : '—'
  );

  // ════════════════════════════════════════
  // SEÇÃO 5: Cross-Validation
  // ════════════════════════════════════════
  spacer(5);
  heading('5. Cross-Validation 16 Campos V5.2');
  const cv = payload.cross_validation_16;
  if (cv?.summary) {
    kv('Match', cv.summary.match_count);
    kv('Divergence', cv.summary.divergence_count);
    kv('Mismatch', cv.summary.mismatch_count);
    kv('Unknown', cv.summary.unknown_count);
    kv('Score cross-val', cv.summary.score_cross_val);
  }
  if (cv?.fields?.length > 0) {
    spacer();
    subheading('Detalhamento por campo');
    cv.fields.forEach((f) => {
      kv(
        f.label || f.field_id,
        `decl="${String(f.declared_value ?? '—').slice(0, 40)}" bdc="${String(f.bdc_value ?? '—').slice(0, 40)}" → ${f.status || 'unknown'}`
      );
    });
  } else if (!cv) {
    body('Cross-validation não calculada para este caso.');
  }

  // ════════════════════════════════════════
  // SEÇÃO 6: Plano de Monitoramento Cat 5
  // ════════════════════════════════════════
  if (payload.plano_monitoramento_cat5) {
    spacer(5);
    heading('6. Plano de Monitoramento Intensivo (Cat 5)');
    const p = payload.plano_monitoramento_cat5;
    kv('Status', p.status);
    kv('Bloqueios mitigados', (p.bloqueios_mitigados || []).join(', ') || '—');
    kv('TPV cap inicial', p.tpv_cap_inicial_pct != null ? p.tpv_cap_inicial_pct + '%' : '—');
    kv('TPV cap valor absoluto', p.tpv_cap_valor_absoluto);
    kv(
      'Rolling Reserve adicional',
      p.rolling_reserve_adicional_pct != null ? p.rolling_reserve_adicional_pct + '%' : '—'
    );
    kv('Frequência de revisão', p.frequencia_revisao_dias + ' dias');
    kv('Próxima revisão', fmtDate(p.data_proxima_revisao));
    kv('Aprovado por papel', p.papel_aprovador);
    kv('Criado por', p.criado_por);
    kv('Termo aceito pelo seller', p.termo_aceito ? 'SIM ✓' : 'NÃO ⚠');
    if (p.termo_aceito_em) kv('Aceito em', fmtDate(p.termo_aceito_em));
    if ((p.gatilhos_off_boarding_agil || []).length > 0) {
      spacer();
      subheading('Gatilhos de off-boarding ágil 24-48h');
      p.gatilhos_off_boarding_agil.forEach((g) => body('• ' + g));
    }

    if (payload.termo_adicional_seller) {
      spacer(4);
      subheading('Termo aceito pelo seller');
      const t = payload.termo_adicional_seller;
      kv('Aceitante (nome)', t.aceito_por_nome);
      kv('Aceitante (CPF)', t.aceito_por_cpf);
      kv('Aceitante (email)', t.aceito_por_email);
      kv('Hash do termo', t.hash_integridade);
    }
  }

  // ════════════════════════════════════════
  // SEÇÃO 7: Parecer SENTINEL
  // ════════════════════════════════════════
  if (payload.parecer_sentinel) {
    spacer(5);
    heading('7. Parecer SENTINEL');
    const s = payload.parecer_sentinel;
    kv('Recomendação final', s.recomendacao_final);
    kv('Recomendação inicial SENTINEL', s.sentinel_recommendation);
    kv('Decisão escalada', s.decisao_escalada_sentinel ? 'SIM' : 'Não');
    kv(
      'Nível de confiança IA',
      s.nivel_confianca_ia != null ? (s.nivel_confianca_ia * 100).toFixed(1) + '%' : '—'
    );
    if (s.escalation_justification) {
      spacer();
      subheading('Justificativa de escalação');
      body(s.escalation_justification);
    }
    if (s.sumario_executivo) {
      spacer();
      subheading('Sumário executivo');
      body(s.sumario_executivo);
    }
    if (s.parecer_final) {
      spacer();
      subheading('Parecer final');
      body(s.parecer_final);
    }
    if ((s.impact_score_top_alerts || []).length > 0) {
      spacer();
      subheading('Top alertas (impact score)');
      s.impact_score_top_alerts.forEach((a, i) => {
        body(
          `${i + 1}. [${a.severity || 'INFO'}] ${a.title || a.red_flag_id || ''} (impact=${a.impact_score ?? '—'})`,
          { bold: true }
        );
        if (a.why_it_matters) body(a.why_it_matters);
        if (a.suggested_action) body('→ ' + a.suggested_action, { color: COLOR_MUTED });
      });
    }
  }

  // ════════════════════════════════════════
  // SEÇÃO 8: Exceções aplicadas
  // ════════════════════════════════════════
  if ((payload.excecoes_aplicadas || []).length > 0) {
    spacer(5);
    heading('8. Exceções aplicadas');
    payload.excecoes_aplicadas.forEach((o, i) => {
      const [codigo, blocos, email, data] = String(o).split(':');
      body(`${i + 1}. ${codigo} — bloqueios: ${blocos || '—'}`, { bold: true });
      body(`   por ${email || '—'} em ${data ? fmtDate(data) : '—'}`, { color: COLOR_MUTED });
    });
  }

  // ════════════════════════════════════════
  // SEÇÃO 9: Referência ao Snapshot imutável
  // ════════════════════════════════════════
  if (payload.snapshot_referencia) {
    spacer(5);
    heading('9. Snapshot Imutável (referência)');
    const sn = payload.snapshot_referencia;
    kv('Snapshot ID', sn.id);
    kv('Tipo', sn.tipo);
    kv('Hash do snapshot', sn.hash_integridade);
    kv('Imutável', sn.imutavel ? 'SIM ✓' : 'Não');
    kv('Criado em', fmtDate(sn.created_date));
  }

  // ════════════════════════════════════════
  // Atualiza footer em todas as páginas (após saber total)
  // ════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(
      `Dossiê V5.2 · Hash SHA-256: ${hash.substring(0, 32)}…  ·  Página ${i}/${totalPages}`,
      PAGE_MARGIN,
      pageHeight - 8
    );
  }

  return doc.output('blob');
}