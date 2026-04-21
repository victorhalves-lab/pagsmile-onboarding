import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * updateCafFallbackLink — Admin-only: atualiza/cria override de link CAF cadastro.io
 * por modelo de compliance. Salva em ComplianceConfig (category='CAF_FALLBACK_LINKS').
 *
 * Body: { complianceModel, url, description? }
 *
 * Para RESETAR um modelo ao default, envie url=null ou url='' — o override é removido.
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { complianceModel, url, description } = body;

    if (!complianceModel || typeof complianceModel !== 'string') {
      return Response.json({ error: 'complianceModel required' }, { status: 400 });
    }

    const configKey = `caf_fallback_link_${complianceModel}`;

    // Busca override existente
    const existing = await base44.asServiceRole.entities.ComplianceConfig.filter({
      configKey,
      category: 'CAF_FALLBACK_LINKS',
    });
    const current = existing[0];

    // Se url vazia/null → remove override (volta ao default)
    if (!url) {
      if (current) {
        await base44.asServiceRole.entities.ComplianceConfig.delete(current.id);
        return Response.json({ success: true, action: 'reset_to_default', complianceModel });
      }
      return Response.json({ success: true, action: 'already_default', complianceModel });
    }

    // Valida URL básica
    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol)) {
        return Response.json({ error: 'URL deve ser http(s)' }, { status: 400 });
      }
    } catch {
      return Response.json({ error: 'URL inválida' }, { status: 400 });
    }

    const payload = {
      configKey,
      configValue: url,
      configType: 'string',
      category: 'CAF_FALLBACK_LINKS',
      description: description || `Link CAF fallback (cadastro.io) para ${complianceModel}`,
      isActive: true,
    };

    if (current) {
      await base44.asServiceRole.entities.ComplianceConfig.update(current.id, payload);
      return Response.json({ success: true, action: 'updated', complianceModel, url });
    } else {
      const created = await base44.asServiceRole.entities.ComplianceConfig.create(payload);
      return Response.json({ success: true, action: 'created', complianceModel, url, id: created.id });
    }
  } catch (error) {
    console.error('[updateCafFallbackLink] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});