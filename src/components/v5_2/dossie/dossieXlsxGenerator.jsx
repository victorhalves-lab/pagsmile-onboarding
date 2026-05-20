/**
 * [V5.2 Fase 6.5.7] Gerador de XLSX do Dossiê Auditável V5.2.
 *
 * Usa xlsx (já instalado). Layout multi-aba para auditoria:
 *   - Resumo         (capa: identificação + hash + datas)
 *   - Score V5.2     (5 camadas + score final + categoria)
 *   - Bloqueios      (lista de bloqueios ativos + condições)
 *   - Cross-Val 16   (16 campos: declarado vs BDC + status)
 *   - Patch Financ.  (5 dimensões: declarado/observado/divergência/bloqueio)
 *   - SENTINEL       (parecer + top alertas)
 *   - Exceções       (overrides aplicados com email/data)
 *   - Plano Cat 5    (se aplicável)
 *
 * 100% local determinístico, sem network.
 */

import * as XLSX from 'xlsx';

const HEADER_FILL = { fgColor: { rgb: '002443' } };
const HEADER_FONT = { color: { rgb: 'FFFFFF' }, bold: true };

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return iso;
  }
}

function applyColWidths(ws, widths) {
  ws['!cols'] = widths.map((w) => ({ wch: w }));
}

/**
 * Gera o XLSX e retorna um Blob.
 */
export function generateDossieXlsx(dossie) {
  const { payload, hash, generated_at, dossie_version } = dossie;
  const wb = XLSX.utils.book_new();

  // ════════════════════════════════════════
  // Aba 1: Resumo / Capa
  // ════════════════════════════════════════
  const resumoRows = [
    ['DOSSIÊ AUDITÁVEL V5.2'],
    [],
    ['Campo', 'Valor'],
    ['Versão do dossiê', dossie_version],
    ['Framework', payload.framework_version],
    ['Gerado em', fmtDate(generated_at)],
    ['Hash SHA-256', hash],
    [],
    ['IDENTIFICAÇÃO'],
    ['Merchant', payload.identificacao.merchant_nome || ''],
    ['Documento', payload.identificacao.merchant_documento || ''],
    ['Tipo', payload.identificacao.merchant_tipo || ''],
    ['Case ID', payload.identificacao.case_id || ''],
    ['Merchant ID', payload.identificacao.merchant_id || ''],
    ['Link origem', payload.identificacao.onboarding_link_code || ''],
    [],
    ['DATAS'],
    ['Submissão', fmtDate(payload.datas.submission_date)],
    ['Framework no início', payload.datas.framework_version_at_start || ''],
    ['Framework na submissão', payload.datas.framework_version_at_submit || ''],
    ['Framework na decisão', payload.datas.framework_version_at_decision || ''],
    ['Decisão final', fmtDate(payload.datas.final_decision_date)],
    ['Caso transicional', payload.datas.is_transitional_case ? 'SIM' : 'Não'],
    [],
    ['CLASSIFICAÇÃO'],
    ['Tier', payload.classificacao.tier || ''],
    ['Segmento', payload.classificacao.segmento || ''],
    ['Morfologia', payload.classificacao.morfologia || ''],
    ['Grau (subseller)', payload.classificacao.grau || ''],
    ['Capabilities ativas', (payload.classificacao.capabilities_ativas || []).join(', ')],
    [],
    ['FUNDAMENTO REGULATÓRIO'],
    ['Base legal', 'Circ. BCB 3.978 Art. 17 + Resol. BCB 403/2024 + DOC5 V5.2 §49'],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows);
  applyColWidths(wsResumo, [32, 80]);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // ════════════════════════════════════════
  // Aba 2: Score V5.2
  // ════════════════════════════════════════
  const s = payload.score_v5_2 || {};
  const camadas = s.camadas || {};
  const scoreRows = [
    ['SCORE V5.2 — DECOMPOSIÇÃO EM 5 CAMADAS'],
    [],
    ['Métrica', 'Valor'],
    ['Score final', s.score_final ?? ''],
    ['Subfaixa tier-aware', s.subfaixa_tier_aware ?? ''],
    ['Categoria de decisão', s.categoria_decisao ?? ''],
    ['V-Financial Coherence', s.v_financial_coherence ?? ''],
    [],
    ['CAMADA', 'CONTRIBUIÇÃO'],
    ['Camada 1 — Base Segmento+Tier', camadas.camada_1_segmento ?? ''],
    ['Camada 2 — Ajuste Morfológico', camadas.camada_2_morfologia ?? ''],
    ['Camada 3 — Variáveis V-*', camadas.camada_3_variaveis ?? ''],
    ['Camada 4 — Capabilities', camadas.camada_4_capabilities ?? ''],
    ['Camada 5 — Patch Financeiro', camadas.camada_5_patch ?? ''],
  ];
  const wsScore = XLSX.utils.aoa_to_sheet(scoreRows);
  applyColWidths(wsScore, [40, 30]);
  XLSX.utils.book_append_sheet(wb, wsScore, 'Score V5.2');

  // ════════════════════════════════════════
  // Aba 3: Bloqueios
  // ════════════════════════════════════════
  const blocos = payload.bloqueios.ativos || [];
  const condicoes = payload.bloqueios.condicoes_automaticas || [];
  const bloqRows = [
    ['BLOQUEIOS & CONDIÇÕES'],
    [],
    ['Nível de monitoramento', payload.bloqueios.monitoramento_nivel || ''],
    ['Rolling Reserve %', payload.bloqueios.rolling_reserve_percent ?? ''],
    [],
    ['Bloqueios ativos (' + blocos.length + ')'],
    ['#', 'Código'],
    ...blocos.map((b, i) => [i + 1, b]),
    [],
    ['Condições automáticas (' + condicoes.length + ')'],
    ['#', 'Condição'],
    ...condicoes.map((c, i) => [i + 1, c]),
  ];
  const wsBloq = XLSX.utils.aoa_to_sheet(bloqRows);
  applyColWidths(wsBloq, [10, 80]);
  XLSX.utils.book_append_sheet(wb, wsBloq, 'Bloqueios');

  // ════════════════════════════════════════
  // Aba 4: Cross-Validation 16 campos
  // ════════════════════════════════════════
  const cv = payload.cross_validation_16 || {};
  const cvSummary = cv.summary || {};
  const cvFields = Array.isArray(cv.fields) ? cv.fields : [];
  const cvRows = [
    ['CROSS-VALIDATION 16 CAMPOS V5.2'],
    [],
    ['Sumário'],
    ['Match', cvSummary.match_count ?? ''],
    ['Divergence', cvSummary.divergence_count ?? ''],
    ['Mismatch', cvSummary.mismatch_count ?? ''],
    ['Unknown', cvSummary.unknown_count ?? ''],
    ['Score cross-val', cvSummary.score_cross_val ?? ''],
    [],
    ['Detalhamento por campo'],
    ['#', 'Campo', 'Declarado', 'BDC', 'Status', 'Divergência %', 'Peso V5.1', 'Bloqueio disparado'],
    ...cvFields.map((f, i) => [
      i + 1,
      f.label || f.field_id || '',
      String(f.declared_value ?? ''),
      String(f.bdc_value ?? ''),
      f.status || 'unknown',
      f.divergence_pct ?? '',
      f.peso_v5_1 ?? '',
      f.bloqueio_disparado || '',
    ]),
  ];
  const wsCv = XLSX.utils.aoa_to_sheet(cvRows);
  applyColWidths(wsCv, [6, 32, 30, 30, 15, 15, 12, 25]);
  XLSX.utils.book_append_sheet(wb, wsCv, 'Cross-Val 16');

  // ════════════════════════════════════════
  // Aba 5: Patch Financeiro
  // ════════════════════════════════════════
  const patch = payload.patch_financeiro || {};
  const dims = patch.dimensoes || {};
  const patchRows = [
    ['PATCH FINANCEIRO V5.1 — 5 DIMENSÕES'],
    [],
    ['Status consolidado', patch.status || ''],
    [],
    ['Dimensão', 'Declarado', 'Observado', 'Divergência %', 'Bloqueio'],
    ...Object.entries(dims).map(([key, d]) => [
      key,
      d?.valor_declarado ?? '',
      d?.valor_observado ?? '',
      d?.divergencia_pct ?? '',
      d?.bloqueio_disparado ? 'SIM' : '',
    ]),
  ];
  const wsPatch = XLSX.utils.aoa_to_sheet(patchRows);
  applyColWidths(wsPatch, [40, 20, 20, 18, 12]);
  XLSX.utils.book_append_sheet(wb, wsPatch, 'Patch Financ.');

  // ════════════════════════════════════════
  // Aba 6: SENTINEL
  // ════════════════════════════════════════
  const sent = payload.parecer_sentinel;
  if (sent) {
    const alerts = sent.impact_score_top_alerts || [];
    const sentRows = [
      ['PARECER SENTINEL'],
      [],
      ['Campo', 'Valor'],
      ['Recomendação final', sent.recomendacao_final || ''],
      ['Recomendação inicial SENTINEL', sent.sentinel_recommendation || ''],
      ['Decisão escalada', sent.decisao_escalada_sentinel ? 'SIM' : 'Não'],
      [
        'Nível de confiança IA',
        sent.nivel_confianca_ia != null ? (sent.nivel_confianca_ia * 100).toFixed(1) + '%' : '',
      ],
      [],
      ['Justificativa de escalação'],
      [sent.escalation_justification || ''],
      [],
      ['Sumário executivo'],
      [sent.sumario_executivo || ''],
      [],
      ['Parecer final'],
      [sent.parecer_final || ''],
      [],
      ['Top alertas (impact score)'],
      ['#', 'Severidade', 'Título', 'Impact', 'Por que importa', 'Ação sugerida'],
      ...alerts.map((a, i) => [
        i + 1,
        a.severity || '',
        a.title || a.red_flag_id || '',
        a.impact_score ?? '',
        a.why_it_matters || '',
        a.suggested_action || '',
      ]),
    ];
    const wsSent = XLSX.utils.aoa_to_sheet(sentRows);
    applyColWidths(wsSent, [6, 12, 30, 10, 50, 40]);
    XLSX.utils.book_append_sheet(wb, wsSent, 'SENTINEL');
  }

  // ════════════════════════════════════════
  // Aba 7: Exceções aplicadas
  // ════════════════════════════════════════
  const excecoes = payload.excecoes_aplicadas || [];
  if (excecoes.length > 0) {
    const exRows = [
      ['EXCEÇÕES APLICADAS (OVERRIDE TRAIL)'],
      [],
      ['#', 'Código', 'Bloqueios mitigados', 'Aplicada por', 'Data'],
      ...excecoes.map((o, i) => {
        const [codigo, blocos, email, data] = String(o).split(':');
        return [i + 1, codigo || '', blocos || '', email || '', data ? fmtDate(data) : ''];
      }),
    ];
    const wsEx = XLSX.utils.aoa_to_sheet(exRows);
    applyColWidths(wsEx, [6, 25, 40, 35, 25]);
    XLSX.utils.book_append_sheet(wb, wsEx, 'Exceções');
  }

  // ════════════════════════════════════════
  // Aba 8: Plano Cat 5
  // ════════════════════════════════════════
  const plano = payload.plano_monitoramento_cat5;
  if (plano) {
    const termo = payload.termo_adicional_seller;
    const planoRows = [
      ['PLANO DE MONITORAMENTO INTENSIVO (CAT 5)'],
      [],
      ['Campo', 'Valor'],
      ['Status', plano.status || ''],
      ['Bloqueios mitigados', (plano.bloqueios_mitigados || []).join(', ')],
      ['TPV cap inicial %', plano.tpv_cap_inicial_pct ?? ''],
      ['TPV cap valor absoluto', plano.tpv_cap_valor_absoluto ?? ''],
      ['Rolling Reserve adicional %', plano.rolling_reserve_adicional_pct ?? ''],
      ['Frequência de revisão (dias)', plano.frequencia_revisao_dias ?? ''],
      ['Próxima revisão', fmtDate(plano.data_proxima_revisao)],
      ['Aprovado por papel', plano.papel_aprovador || ''],
      ['Criado por', plano.criado_por || ''],
      ['Termo aceito pelo seller', plano.termo_aceito ? 'SIM' : 'NÃO'],
      ['Aceito em', fmtDate(plano.termo_aceito_em)],
      [],
      ['Gatilhos de off-boarding ágil 24-48h'],
      ...(plano.gatilhos_off_boarding_agil || []).map((g) => ['', g]),
    ];
    if (termo) {
      planoRows.push(
        [],
        ['Termo aceito pelo seller'],
        ['Versão', termo.versao_termo || ''],
        ['Aceitante (nome)', termo.aceito_por_nome || ''],
        ['Aceitante (CPF)', termo.aceito_por_cpf || ''],
        ['Aceitante (email)', termo.aceito_por_email || ''],
        ['Hash do termo', termo.hash_integridade || '']
      );
    }
    const wsPlano = XLSX.utils.aoa_to_sheet(planoRows);
    applyColWidths(wsPlano, [40, 60]);
    XLSX.utils.book_append_sheet(wb, wsPlano, 'Plano Cat 5');
  }

  // ════════════════════════════════════════
  // Aba 9: Snapshot referência
  // ════════════════════════════════════════
  if (payload.snapshot_referencia) {
    const sn = payload.snapshot_referencia;
    const snRows = [
      ['SNAPSHOT IMUTÁVEL — REFERÊNCIA'],
      [],
      ['Campo', 'Valor'],
      ['Snapshot ID', sn.id || ''],
      ['Tipo', sn.tipo || ''],
      ['Hash do snapshot', sn.hash_integridade || ''],
      ['Imutável', sn.imutavel ? 'SIM' : 'Não'],
      ['Criado em', fmtDate(sn.created_date)],
    ];
    const wsSn = XLSX.utils.aoa_to_sheet(snRows);
    applyColWidths(wsSn, [25, 80]);
    XLSX.utils.book_append_sheet(wb, wsSn, 'Snapshot ref.');
  }

  // ════════════════════════════════════════
  // Gera blob
  // ════════════════════════════════════════
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}