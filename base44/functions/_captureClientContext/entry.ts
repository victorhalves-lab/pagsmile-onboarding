// ────────────────────────────────────────────────────────────────────────────
// Helper INTERNO — não exposto como endpoint HTTP.
//
// IMPORTANTE: a plataforma Base44 não permite imports relativos entre functions/.
// Por isso este helper precisa ser COPY-PASTED em cada função que o usa
// (publicComplianceSubmit, publicComplianceCaseUpdate, publicDirectDocUpload,
//  cafVerifyResult, publicProposalAction).
//
// Mantemos esta cópia mestre aqui apenas como documentação — qualquer melhoria
// deve ser propagada manualmente para as funções que o utilizam.
//
// Função: extrai IP, geo aproximada, UA, referer e timezone do cliente a partir
// dos headers da request HTTP. Tudo opt-in, falha silenciosa.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Captura contexto do cliente da request HTTP.
 * Retorna um objeto que pode ser passado direto para entities.AccessTrail.create.
 *
 * @param {Request} req - A request HTTP do Deno.serve handler
 * @param {object} extra - Campos extras (eventType, onboardingCaseId, etc) que serão mesclados
 * @returns {object} - Objeto pronto para persistir em AccessTrail
 */
export function captureClientContext(req, extra = {}) {
  try {
    const headers = req.headers;
    // IP: tentar cf-connecting-ip (Cloudflare) → x-forwarded-for (primeira IP) → x-real-ip
    const cfIp = headers.get('cf-connecting-ip');
    const xff = headers.get('x-forwarded-for');
    const xri = headers.get('x-real-ip');
    const ip = cfIp || (xff ? xff.split(',')[0].trim() : null) || xri || null;

    // Geo: Cloudflare adiciona estes headers automaticamente quando rodando atrás dele
    const country = headers.get('cf-ipcountry') || null;
    const region = headers.get('cf-region') || headers.get('cf-region-code') || null;
    const city = headers.get('cf-ipcity') || null;
    const timezone = headers.get('cf-timezone') || null;

    const userAgent = headers.get('user-agent') || null;
    const referer = headers.get('referer') || headers.get('referrer') || null;

    return {
      ip,
      country,
      region,
      city,
      timezone,
      userAgent: userAgent ? userAgent.slice(0, 500) : null,
      referer: referer ? referer.slice(0, 500) : null,
      serverTimestamp: new Date().toISOString(),
      ...extra,
    };
  } catch (_) {
    // Nunca quebra a request original — falha silenciosa.
    return { serverTimestamp: new Date().toISOString(), ...extra };
  }
}

/**
 * Faz o registro em AccessTrail de forma fire-and-forget (não bloqueia).
 * Recebe o base44 client já inicializado.
 */
export function persistAccessTrail(base44, ctx) {
  try {
    // fire-and-forget — não awaitar
    base44.asServiceRole.entities.AccessTrail.create(ctx).catch(() => {});
  } catch (_) { /* silent */ }
}

// Serve as HTTP for sanity check (não usado por outras funções, só evita 404 se chamada)
Deno.serve(() => Response.json({ ok: true, note: 'internal helper only' }));