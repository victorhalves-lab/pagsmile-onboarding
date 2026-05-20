import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * generateMultiCafLinks — gera 1 link CAF para cada representante adicional do caso.
 *
 * Pode ser chamada por:
 *  - Admin (do dashboard) — para enviar links para cada representante.
 *  - Cliente público (durante o fluxo de onboarding) — para gerar links que ele
 *    mesmo vai enviar para os outros representantes que precisam fazer CAF.
 *    Nesse caso, é necessário o docLinkToken do caso.
 *
 * Body:
 *   { caseId, docLinkToken?, baseUrl?, representatives? }
 *
 *   - caseId: obrigatório
 *   - docLinkToken: obrigatório quando chamado por cliente público (não-admin)
 *   - baseUrl: ex 'https://app.base44.com' — fallback usa app.base44.com
 *   - representatives: opcional — se fornecido, sobrescreve a lista do caso
 *
 * Persiste em OnboardingCase.cafLinksPorRepresentante:
 *   [{ cpf, nome, email, url, token, status: 'pending', generatedAt }]
 *
 * Idempotente: se o representante já tem link gerado, reaproveita o token.
 */

function generateToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // SDK tolerante a clientes anônimos
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      const { createClient } = await import('npm:@base44/sdk@0.8.25');
      base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
        requiresAuth: false,
      });
    }

    const body = await req.json();
    const { caseId, docLinkToken, baseUrl, representatives: clientReps } = body;
    if (!caseId) {
      return Response.json({ error: 'caseId is required' }, { status: 400 });
    }

    // Auth: ou é admin, ou apresenta um docLinkToken válido
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch (_) { /* anonymous */ }

    let cases = [];
    try {
      cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    } catch (_) {
      return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    }
    if (cases.length === 0) {
      return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    }
    const onboardingCase = cases[0];

    if (!isAdmin) {
      if (!onboardingCase.docLinkToken || onboardingCase.docLinkToken !== docLinkToken) {
        return Response.json({ error: 'Token inválido ou ausente' }, { status: 403 });
      }
    }

    // ── POLÍTICA V5.2 — UM ÚNICO REPRESENTANTE LEGAL (decisão 2026-05-20):
    // Não geramos mais links CAF para representantes adicionais. KYC é coletado
    // apenas do representante principal no fluxo do próprio caso (PublicOnboarding).
    // Esta função fica como NO-OP por compatibilidade — chamadas existentes não quebram,
    // mas nenhum link é gerado. Os links já gerados antes desta data continuam válidos.
    console.log('[generateMultiCafLinks] V5.2 policy: single representative — no-op');
    return Response.json({
      success: true,
      links: [],
      count: 0,
      note: 'V5.2 policy: KYC coletado apenas do representante principal. Links múltiplos descontinuados.',
    });

    // ─────── CÓDIGO LEGADO ABAIXO — preservado para reativação futura ─────────
    // eslint-disable-next-line no-unreachable
    const repsRaw = Array.isArray(clientReps) && clientReps.length > 0
      ? clientReps
      : (Array.isArray(onboardingCase.additionalRepresentatives) ? onboardingCase.additionalRepresentatives : []);

    if (repsRaw.length === 0) {
      return Response.json({ error: 'Nenhum representante adicional definido' }, { status: 400 });
    }

    // Existing links (para idempotência)
    const existing = Array.isArray(onboardingCase.cafLinksPorRepresentante)
      ? onboardingCase.cafLinksPorRepresentante : [];
    const existingByCpf = new Map();
    for (const e of existing) {
      const k = (e?.cpf || '').replace(/\D/g, '');
      if (k) existingByCpf.set(k, e);
    }

    const origin = (baseUrl || '').replace(/\/+$/, '') || 'https://app.base44.com';

    const generated = repsRaw.map(rep => {
      const cpfClean = (rep?.cpf || '').replace(/\D/g, '');
      const nome = (rep?.nome || rep?.name || '').trim();
      const email = (rep?.email || '').trim();
      const phone = (rep?.phone || rep?.telefone || '').trim();
      const cargo = (rep?.cargo || rep?.role || '').trim();

      // Reusa token se já existir (idempotência)
      const prev = existingByCpf.get(cpfClean);
      const token = prev?.token || generateToken();

      // O link aponta para PublicOnboarding com mode=caf_only_rep + repToken
      // (não usa docLinkToken do caso para isolar permissões — cada representante
      // só pode fazer SEU caf, não escrever no caso inteiro)
      const url = `${origin}/PublicOnboarding?case=${encodeURIComponent(caseId)}&token=${encodeURIComponent(onboardingCase.docLinkToken || '')}&mode=caf_only&rep=${encodeURIComponent(token)}&repCpf=${encodeURIComponent(cpfClean)}`;

      return {
        cpf: cpfClean,
        nome,
        email,
        phone,
        cargo,
        url,
        token,
        status: prev?.status || 'pending', // pending | completed | failed
        generatedAt: prev?.generatedAt || new Date().toISOString(),
        completedAt: prev?.completedAt || null,
      };
    });

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      cafLinksPorRepresentante: generated,
    });

    return Response.json({
      success: true,
      links: generated,
      count: generated.length,
    });
  } catch (error) {
    console.error('[generateMultiCafLinks] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});