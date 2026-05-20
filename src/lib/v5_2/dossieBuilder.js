/**
 * [V5.2 Fase 6.5.5] Dossiê Auditável V5.2 — builder canônico.
 *
 * Monta um objeto estruturado e DETERMINÍSTICO contendo:
 *   - Identificação do caso (merchant + onboarding case)
 *   - Framework version + datas-chave (start / submit / decision)
 *   - Score V5.2 decomposto em 5 camadas
 *   - Categoria de decisão + subfaixa tier-aware
 *   - Cross-validation 16 campos (resultado)
 *   - Patch Financeiro (5 dimensões)
 *   - Bloqueios ativos + condições aplicadas
 *   - Exceções aplicadas (override trail)
 *   - Plano de Monitoramento (cat 5) + termo aceito
 *   - Snapshot original (referência ao registro imutável)
 *   - Hash SHA-256 de integridade
 *
 * O hash é calculado sobre a serialização canônica (chaves ordenadas) do
 * payload — qualquer mudança posterior é detectável.
 *
 * Fonte regulatória: Circ. BCB 3.978 Art. 17 (rastreabilidade) +
 * Resol. BCB 403/2024 + DOC5 V5.2 §49 (Snapshot imutável).
 */

import { base44 } from '@/api/base44Client';

const DOSSIE_VERSION = 'v5.2.0';

/**
 * Serialização canônica determinística: ordena chaves recursivamente.
 * Garante que dois dossiês com mesmos dados produzam mesmo hash, independente
 * da ordem em que o JS internaliza as propriedades.
 */
function canonicalStringify(obj) {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalStringify).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
}

/**
 * Calcula SHA-256 do payload canônico usando Web Crypto (nativo no browser).
 * Retorna hex string.
 */
async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constrói o dossiê V5.2 completo para um caso.
 *
 * @param {object} params
 * @param {string} params.caseId - ID do OnboardingCase
 * @returns {Promise<{ payload, hash, generated_at, dossie_version }>}
 */
export async function buildDossieV5_2({ caseId }) {
  if (!caseId) throw new Error('caseId obrigatório para gerar dossiê V5.2');

  // 1) Caso + merchant
  const [onboardingCase] = await base44.entities.OnboardingCase.filter({ id: caseId });
  if (!onboardingCase) throw new Error('Caso não encontrado: ' + caseId);

  if (onboardingCase.framework_version !== 'v5.2') {
    throw new Error(
      `Este caso usa framework_version=${onboardingCase.framework_version || 'v4.0'}. O dossiê auditável é exclusivo para casos V5.2.`
    );
  }

  const [merchant] = onboardingCase.merchantId
    ? await base44.entities.Merchant.filter({ id: onboardingCase.merchantId })
    : [null];

  // 2) ComplianceScore (pega o mais recente)
  const scores = await base44.entities.ComplianceScore.filter(
    { onboarding_case_id: caseId },
    '-created_date',
    1
  );
  const score = scores[0] || null;

  // 3) Snapshot original (se existir)
  let snapshot = null;
  try {
    const snaps = await base44.entities.Snapshot.filter(
      { onboarding_case_id: caseId },
      '-created_date',
      1
    );
    snapshot = snaps[0] || null;
  } catch {
    /* Snapshot pode não existir ainda */
  }

  // 4) Plano de Monitoramento (Cat 5, se aplicável)
  let planoMonitoramento = null;
  let termoAdicional = null;
  try {
    const planos = await base44.entities.PlanoMonitoramento.filter(
      { onboarding_case_id: caseId },
      '-created_date',
      1
    );
    planoMonitoramento = planos[0] || null;

    if (planoMonitoramento?.termo_adicional_id) {
      const [t] = await base44.entities.TermoAdicionalV5_2.filter({
        id: planoMonitoramento.termo_adicional_id,
      });
      termoAdicional = t || null;
    }
  } catch {
    /* opcional */
  }

  // 5) Monta payload canônico
  const payload = {
    dossie_version: DOSSIE_VERSION,
    framework_version: onboardingCase.framework_version,

    identificacao: {
      case_id: onboardingCase.id,
      merchant_id: onboardingCase.merchantId,
      merchant_nome: merchant?.fullName || null,
      merchant_documento: merchant?.cpfCnpj || null,
      merchant_tipo: merchant?.type || null,
      onboarding_link_code: onboardingCase.onboardingLinkCode || null,
    },

    datas: {
      submission_date: onboardingCase.submissionDate || null,
      framework_version_at_start: onboardingCase.framework_version_at_start || null,
      framework_version_at_submit: onboardingCase.framework_version_at_submit || null,
      framework_version_at_decision: onboardingCase.framework_version_at_decision || null,
      final_decision_date: onboardingCase.finalDecisionDate || null,
      is_transitional_case: !!onboardingCase.is_transitional_case,
    },

    classificacao: {
      tier: onboardingCase.tier || score?.tier_v5_1 || null,
      segmento: onboardingCase.segmento_v5_1 || score?.segmento || null,
      morfologia: onboardingCase.morfologia || score?.morfologia_v5_1 || null,
      capabilities_ativas:
        onboardingCase.capabilities_ativas || score?.capabilities_ativas_v5_1 || [],
      grau: onboardingCase.grau || null,
    },

    score_v5_2: score
      ? {
          score_final: score.score_v5_1_final ?? null,
          subfaixa_tier_aware: score.subfaixa_tier_aware ?? null,
          categoria_decisao: score.categoria_decisao_v5_1 ?? null,
          camadas: {
            camada_1_segmento: score.score_camada_1_segmento ?? null,
            camada_2_morfologia: score.score_camada_2_morfologia ?? null,
            camada_3_variaveis: score.score_camada_3_variaveis ?? null,
            camada_4_capabilities: score.score_camada_4_capabilities ?? null,
            camada_5_patch: score.score_camada_5_patch ?? null,
          },
          v_financial_coherence: score.v_financial_coherence ?? null,
        }
      : null,

    patch_financeiro: {
      status: score?.patch_financeiro_status || onboardingCase.patch_financeiro_status || null,
      dimensoes: score?.patch_financeiro_dimensoes || {},
    },

    cross_validation_16: score?.cross_validation_results || null,

    bloqueios: {
      ativos: score?.bloqueios_v5_1_ativos || onboardingCase.bloqueiosAtivos || [],
      condicoes_automaticas:
        score?.condicoes_automaticas || onboardingCase.condicoesAutomaticas || [],
      monitoramento_nivel: score?.monitoramento_nivel || onboardingCase.monitoramentoNivel || null,
      rolling_reserve_percent:
        score?.rolling_reserve_percent ?? onboardingCase.rollingReservePercent ?? null,
    },

    excecoes_aplicadas: score?.overrides_aplicados || [],

    plano_monitoramento_cat5: planoMonitoramento
      ? {
          id: planoMonitoramento.id,
          status: planoMonitoramento.status,
          bloqueios_mitigados: planoMonitoramento.bloqueios_mitigados || [],
          tpv_cap_inicial_pct: planoMonitoramento.tpv_cap_inicial_pct ?? null,
          tpv_cap_valor_absoluto: planoMonitoramento.tpv_cap_valor_absoluto ?? null,
          rolling_reserve_adicional_pct: planoMonitoramento.rolling_reserve_adicional_pct ?? null,
          gatilhos_off_boarding_agil: planoMonitoramento.gatilhos_off_boarding_agil || [],
          frequencia_revisao_dias: planoMonitoramento.frequencia_revisao_dias ?? null,
          data_proxima_revisao: planoMonitoramento.data_proxima_revisao || null,
          criado_por: planoMonitoramento.criado_por || null,
          papel_aprovador: planoMonitoramento.papel_aprovador || null,
          termo_aceito: !!planoMonitoramento.termo_aceito,
          termo_aceito_em: planoMonitoramento.termo_aceito_em || null,
        }
      : null,

    termo_adicional_seller: termoAdicional
      ? {
          versao_termo: termoAdicional.versao_termo,
          aceito_por_nome: termoAdicional.aceito_por_nome,
          aceito_por_email: termoAdicional.aceito_por_email,
          aceito_por_cpf: termoAdicional.aceito_por_cpf,
          aceito_em: termoAdicional.aceito_em,
          hash_integridade: termoAdicional.hash_integridade || null,
        }
      : null,

    parecer_sentinel: score
      ? {
          recomendacao_final: score.recomendacao_final || null,
          sentinel_recommendation: score.sentinel_recommendation || null,
          decisao_escalada_sentinel: !!score.decisao_escalada_sentinel,
          escalation_justification: score.escalation_justification || null,
          sumario_executivo: score.sumario_executivo || null,
          parecer_final: score.parecer_final || null,
          nivel_confianca_ia: score.nivel_confianca_ia ?? null,
          impact_score_top_alerts: score.impact_score_top_alerts || [],
        }
      : null,

    snapshot_referencia: snapshot
      ? {
          id: snapshot.id,
          tipo: snapshot.tipo,
          hash_integridade: snapshot.hash_integridade || null,
          imutavel: snapshot.imutavel !== false,
          created_date: snapshot.created_date || null,
        }
      : null,
  };

  // 6) Hash de integridade
  const canonical = canonicalStringify(payload);
  const hash = await sha256Hex(canonical);
  const generated_at = new Date().toISOString();

  return {
    payload,
    hash,
    generated_at,
    dossie_version: DOSSIE_VERSION,
  };
}

/**
 * Gera o JSON pronto para download (com envelope contendo hash + metadata).
 */
export function dossieToJson(dossie) {
  return JSON.stringify(
    {
      _envelope: {
        dossie_version: dossie.dossie_version,
        generated_at: dossie.generated_at,
        hash_sha256: dossie.hash,
        framework: 'PagSmile Compliance V5.2',
        regulatory_basis: 'Circ. BCB 3.978 Art. 17 + Resol. BCB 403/2024 + DOC5 V5.2 §49',
      },
      payload: dossie.payload,
    },
    null,
    2
  );
}

/**
 * Helper: dispara download de blob no navegador.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}