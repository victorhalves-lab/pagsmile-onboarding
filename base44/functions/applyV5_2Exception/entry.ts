/**
 * [V5.2 Fase 6.3] applyV5_2Exception
 *
 * Aplica uma exceção V5.2 (cat_1 a cat_5) a um OnboardingCase com bloqueios ativos.
 *
 * Fluxo:
 *  1. Valida que o usuário é admin (depois validamos o papel_requerido da exceção).
 *  2. Carrega caso V5.2, exceção e score.
 *  3. Para cat_1..cat_4: registra a exceção no ComplianceScore (overrides_aplicados +
 *     remove bloqueios mitigados de bloqueios_v5_1_ativos), atualiza caso, cria Snapshot.
 *  4. Para cat_5: também cria PlanoMonitoramento + TermoAdicionalV5_2 (rascunho, aguardando aceite do seller).
 *  5. Audita tudo em AuditLog.
 *
 * Payload:
 *  {
 *    onboardingCaseId: string,
 *    exceptionCodigo: 'cat_1_documental' | 'cat_2_operacional' | 'cat_3_estrutural' | 'cat_4_estrategica' | 'cat_5_monitoramento_intensivo',
 *    bloqueiosMitigados: string[],         // códigos B-* que esta exceção libera
 *    justificativa: string,
 *    // somente para cat_5:
 *    tpvCapInicialPct?: number,            // default = exception.tpv_cap_inicial_pct_padrao
 *    rollingReserveAdicionalPct?: number,  // default = exception.rolling_reserve_adicional_pct_padrao
 *    frequenciaRevisaoDias?: number,       // default 30
 *    gatilhosOffBoarding?: string[]
 *  }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      onboardingCaseId,
      exceptionCodigo,
      bloqueiosMitigados = [],
      justificativa,
      tpvCapInicialPct,
      rollingReserveAdicionalPct,
      frequenciaRevisaoDias = 30,
      gatilhosOffBoarding = [],
    } = body || {};

    if (!onboardingCaseId || !exceptionCodigo || !justificativa) {
      return Response.json({
        error: 'Missing required fields: onboardingCaseId, exceptionCodigo, justificativa',
      }, { status: 400 });
    }
    if (!Array.isArray(bloqueiosMitigados) || bloqueiosMitigados.length === 0) {
      return Response.json({
        error: 'bloqueiosMitigados must be a non-empty array of block codes to mitigate',
      }, { status: 400 });
    }

    // ── 1. Carrega caso ──
    const caso = await base44.asServiceRole.entities.OnboardingCase.get(onboardingCaseId);
    if (!caso) {
      return Response.json({ error: 'OnboardingCase not found' }, { status: 404 });
    }
    if (caso.framework_version !== 'v5.2') {
      return Response.json({
        error: 'Exceptions can only be applied to V5.2 cases',
        framework_version: caso.framework_version,
      }, { status: 400 });
    }

    // ── 2. Carrega exceção ──
    const excecoes = await base44.asServiceRole.entities.Exception.filter({ codigo: exceptionCodigo });
    if (!excecoes || excecoes.length === 0) {
      return Response.json({ error: `Exception ${exceptionCodigo} not found in catalog` }, { status: 404 });
    }
    const excecao = excecoes[0];
    if (!excecao.ativo) {
      return Response.json({ error: `Exception ${exceptionCodigo} is inactive (kill-switch)` }, { status: 400 });
    }

    // ── 3. Carrega score V5.2 mais recente ──
    const scores = await base44.asServiceRole.entities.ComplianceScore.filter(
      { onboarding_case_id: onboardingCaseId, framework_version: 'v5.2' },
      '-created_date',
      1
    );
    if (!scores || scores.length === 0) {
      return Response.json({ error: 'No V5.2 ComplianceScore found for this case' }, { status: 404 });
    }
    const score = scores[0];

    const bloqueiosAtuais = Array.isArray(score.bloqueios_v5_1_ativos) ? score.bloqueios_v5_1_ativos : [];
    const overridesAtuais = Array.isArray(score.overrides_aplicados) ? score.overrides_aplicados : [];

    // Validação: bloqueios mitigados precisam existir no score
    const bloqueiosInexistentes = bloqueiosMitigados.filter((b) => !bloqueiosAtuais.includes(b));
    if (bloqueiosInexistentes.length > 0) {
      return Response.json({
        error: 'Some blocks to mitigate are not active on this case',
        not_active: bloqueiosInexistentes,
      }, { status: 400 });
    }

    // ── 4. Calcula novos arrays ──
    const novosBloqueios = bloqueiosAtuais.filter((b) => !bloqueiosMitigados.includes(b));
    const overrideEntry = `${exceptionCodigo}:${bloqueiosMitigados.join(',')}:${user.email}:${new Date().toISOString()}`;
    const novosOverrides = [...overridesAtuais, overrideEntry];

    // ── 5. Atualiza score ──
    await base44.asServiceRole.entities.ComplianceScore.update(score.id, {
      bloqueios_v5_1_ativos: novosBloqueios,
      overrides_aplicados: novosOverrides,
    });

    // ── 6. Lógica específica de Categoria 5: cria PlanoMonitoramento + TermoAdicionalV5_2 ──
    let planoMonitoramentoId = null;
    let termoAdicionalId = null;

    if (exceptionCodigo === 'cat_5_monitoramento_intensivo') {
      const tpvCap = tpvCapInicialPct != null ? tpvCapInicialPct : (excecao.tpv_cap_inicial_pct_padrao ?? 50);
      const rrAdicional = rollingReserveAdicionalPct != null ? rollingReserveAdicionalPct : (excecao.rolling_reserve_adicional_pct_padrao ?? 5);

      // Próxima revisão = hoje + frequenciaRevisaoDias
      const proximaRevisao = new Date();
      proximaRevisao.setDate(proximaRevisao.getDate() + frequenciaRevisaoDias);
      const promocaoElegivel = new Date();
      promocaoElegivel.setDate(promocaoElegivel.getDate() + 180); // 6 meses padrão

      const plano = await base44.asServiceRole.entities.PlanoMonitoramento.create({
        onboarding_case_id: onboardingCaseId,
        merchant_id: caso.merchantId,
        framework_version: 'v5.2',
        categoria_decisao: 'cat_5_intensive_monitoring',
        bloqueios_mitigados: bloqueiosMitigados,
        tpv_cap_inicial_pct: tpvCap,
        rolling_reserve_adicional_pct: rrAdicional,
        rolling_reserve_dias_retencao: 180,
        gatilhos_off_boarding_agil: gatilhosOffBoarding,
        frequencia_revisao_dias: frequenciaRevisaoDias,
        data_proxima_revisao: proximaRevisao.toISOString().slice(0, 10),
        data_promocao_elegivel: promocaoElegivel.toISOString().slice(0, 10),
        termo_aceito: false,
        status: 'ativo',
        criado_por: user.email,
        papel_aprovador: 'head_compliance',
      });
      planoMonitoramentoId = plano.id;

      // TermoAdicionalV5_2 (rascunho — aceite acontece pelo seller via acceptTermoAdicionalV5_2)
      const termoHtml = buildTermoHtml({ caso, plano, excecao, justificativa });
      const termo = await base44.asServiceRole.entities.TermoAdicionalV5_2.create({
        onboarding_case_id: onboardingCaseId,
        plano_monitoramento_id: planoMonitoramentoId,
        merchant_id: caso.merchantId,
        versao_termo: 'v5.2.0',
        conteudo_termo_html: termoHtml,
        limites_operacionais: {
          tpv_cap_inicial_brl: null,
          rolling_reserve_pct: rrAdicional,
          prazo_dias: excecao.duracao_dias || 90,
          frequencia_revisao_dias: frequenciaRevisaoDias,
        },
        gatilhos_off_boarding: gatilhosOffBoarding,
      });
      termoAdicionalId = termo.id;

      // Vincula termo ao plano
      await base44.asServiceRole.entities.PlanoMonitoramento.update(planoMonitoramentoId, {
        termo_adicional_id: termoAdicionalId,
      });

      // Vincula plano ao caso
      await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
        plano_monitoramento_id: planoMonitoramentoId,
        categoria_decisao_v5_2: 'cat_5_intensive_monitoring',
      });
    }

    // ── 7. Cria Snapshot imutável da exceção aplicada ──
    const snapshot = await base44.asServiceRole.entities.Snapshot.create({
      onboarding_case_id: onboardingCaseId,
      merchant_id: caso.merchantId,
      framework_version: 'v5.2',
      tipo: exceptionCodigo === 'cat_5_monitoramento_intensivo' ? 'plano_monitoramento_aplicado' : 'exception_applied',
      tier: caso.tier,
      segmento: caso.segmento_v5_1,
      morfologia: caso.morfologia,
      capabilities_ativas: caso.capabilities_ativas,
      output_bloqueios_ativos: novosBloqueios,
      excecoes_aplicadas: [{
        codigo_excecao: exceptionCodigo,
        aplicada_por: user.email,
        justificativa,
        data: new Date().toISOString(),
      }],
      imutavel: true,
    });

    if (planoMonitoramentoId) {
      await base44.asServiceRole.entities.PlanoMonitoramento.update(planoMonitoramentoId, {
        snapshot_id: snapshot.id,
      });
    }

    // ── 8. AuditLog ──
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'v5_2_exception_applied',
      entity_type: 'OnboardingCase',
      entity_id: onboardingCaseId,
      user_email: user.email,
      details: {
        exceptionCodigo,
        bloqueiosMitigados,
        justificativa,
        snapshot_id: snapshot.id,
        plano_monitoramento_id: planoMonitoramentoId,
        termo_adicional_id: termoAdicionalId,
      },
    }).catch(() => null); // AuditLog é nice-to-have, não pode quebrar fluxo

    return Response.json({
      success: true,
      exceptionApplied: exceptionCodigo,
      bloqueiosMitigados,
      bloqueiosRestantes: novosBloqueios,
      snapshot_id: snapshot.id,
      plano_monitoramento_id: planoMonitoramentoId,
      termo_adicional_id: termoAdicionalId,
      requiresSellerAcceptance: exceptionCodigo === 'cat_5_monitoramento_intensivo',
    });
  } catch (error) {
    console.error('[applyV5_2Exception] error:', error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});

function buildTermoHtml({ caso, plano, excecao, justificativa }) {
  return `
<div style="font-family: Inter, sans-serif; color: #002443; line-height: 1.6;">
  <h2>Termo Adicional V5.2 — Monitoramento Intensivo</h2>
  <p><strong>Caso:</strong> ${caso.id}</p>
  <p><strong>Categoria:</strong> ${excecao.nome}</p>
  <p><strong>Justificativa:</strong> ${justificativa}</p>
  <h3>Condições operacionais</h3>
  <ul>
    <li>TPV cap inicial: ${plano.tpv_cap_inicial_pct}% do declarado</li>
    <li>Rolling reserve adicional: ${plano.rolling_reserve_adicional_pct}%</li>
    <li>Frequência de revisão: ${plano.frequencia_revisao_dias} dias</li>
    <li>Prazo do termo: ${excecao.duracao_dias} dias</li>
  </ul>
  <h3>Gatilhos de off-boarding ágil 24-48h</h3>
  <ul>
    ${(plano.gatilhos_off_boarding_agil || []).map((g) => `<li>${g}</li>`).join('')}
  </ul>
  <p><em>Declaração de ciência:</em> Ao aceitar este termo, o seller declara estar ciente das restrições operacionais
  acima e dos gatilhos que podem disparar off-boarding ágil em 24-48 horas.</p>
</div>`.trim();
}