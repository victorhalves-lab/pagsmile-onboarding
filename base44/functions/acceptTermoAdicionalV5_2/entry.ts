/**
 * [V5.2 Fase 6.3] acceptTermoAdicionalV5_2
 *
 * Endpoint para o seller aceitar formalmente o Termo Adicional V5.2 vinculado a um
 * PlanoMonitoramento (categoria_decisao_v5_2 = cat_5_intensive_monitoring).
 *
 * Pode ser chamado tanto pelo admin (representando o aceite) quanto pelo próprio seller
 * via link público — por isso é tolerante a autenticação.
 *
 * Payload:
 *  {
 *    termoAdicionalId: string,
 *    aceitoPorNome: string,
 *    aceitoPorEmail: string,
 *    aceitoPorCpf?: string
 *  }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let actingUser = null;
    try {
      actingUser = await base44.auth.me();
    } catch (_e) {
      // tolerante — pode ser aceite via link público
    }

    const body = await req.json();
    const { termoAdicionalId, aceitoPorNome, aceitoPorEmail, aceitoPorCpf } = body || {};

    if (!termoAdicionalId || !aceitoPorNome || !aceitoPorEmail) {
      return Response.json({
        error: 'Missing required fields: termoAdicionalId, aceitoPorNome, aceitoPorEmail',
      }, { status: 400 });
    }

    const termo = await base44.asServiceRole.entities.TermoAdicionalV5_2.get(termoAdicionalId);
    if (!termo) {
      return Response.json({ error: 'TermoAdicionalV5_2 not found' }, { status: 404 });
    }
    if (termo.aceito_em) {
      return Response.json({
        error: 'Termo já aceito anteriormente',
        aceito_em: termo.aceito_em,
        aceito_por_email: termo.aceito_por_email,
      }, { status: 409 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const aceitoEm = new Date().toISOString();

    const hashSource = `${termo.conteudo_termo_html}|${aceitoPorEmail}|${aceitoPorNome}|${aceitoEm}|${ip}`;
    const hashIntegridade = await sha256Hex(hashSource);

    await base44.asServiceRole.entities.TermoAdicionalV5_2.update(termoAdicionalId, {
      aceito_em: aceitoEm,
      aceito_por_email: aceitoPorEmail,
      aceito_por_nome: aceitoPorNome,
      aceito_por_cpf: aceitoPorCpf,
      ip_aceite: ip,
      user_agent_aceite: userAgent,
      hash_integridade: hashIntegridade,
    });

    // Atualiza PlanoMonitoramento vinculado
    if (termo.plano_monitoramento_id) {
      await base44.asServiceRole.entities.PlanoMonitoramento.update(termo.plano_monitoramento_id, {
        termo_aceito: true,
        termo_aceito_em: aceitoEm,
      });
    }

    // AuditLog
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'v5_2_termo_adicional_aceito',
      entity_type: 'TermoAdicionalV5_2',
      entity_id: termoAdicionalId,
      user_email: actingUser?.email || aceitoPorEmail,
      details: {
        aceitoPorNome,
        aceitoPorEmail,
        ip,
        plano_monitoramento_id: termo.plano_monitoramento_id,
        onboarding_case_id: termo.onboarding_case_id,
        hashIntegridade,
      },
    }).catch(() => null);

    return Response.json({
      success: true,
      termoAdicionalId,
      aceitoEm,
      hashIntegridade,
    });
  } catch (error) {
    console.error('[acceptTermoAdicionalV5_2] error:', error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});