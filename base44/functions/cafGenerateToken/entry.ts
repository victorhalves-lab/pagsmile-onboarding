import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGenerateToken — Fornece o Mobile Token estático da CAF para o Web SDK.
 *
 * 💡 VERDADE TÉCNICA (validada em 2026-04-18 via testes ao vivo):
 *   - Nossas credenciais CAF são um "Mobile Token" estático (JWT) emitido no
 *     painel Trust da CAF. Esse mesmo token é usado:
 *       a) Como Bearer para chamar Core API (/v1/transactions, /v1/faces, etc).
 *       b) Como "sdkToken" (aka "access token") que o SDK Web precisa no init.
 *   - O endpoint /v1/sdk-tokens da Core API exige AWS SigV4 (IAM creds), NÃO
 *     Bearer. Nós NÃO temos IAM creds. Retorno 403: "Invalid key=value pair
 *     in Authorization header (hashed with SHA-256)".
 *   - Tentativas anteriores de "gerar token via API" sempre falhavam e caíam
 *     em fallback silencioso, travando o facematch. REMOVIDO.
 *
 * ✅ FLUXO ATUAL (simples e correto):
 *   1. Retorna CAF_CLIENT_SECRET como sdkToken (é o Mobile Token estático).
 *   2. personId = CPF limpo se disponível (exigência do SDK para associar captura).
 *   3. Face authentication via SDK fica DESABILITADO (exige /v1/faces pré-registrado
 *      com imageUrl pública, o que não faz sentido no nosso fluxo).
 *   4. O match facial REAL roda server-side via cafFaceMatchTransaction
 *      (POST /v1/transactions com peopleFaceAuthenticator), que JÁ FUNCIONA.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { personCpf, onboardingCaseId } = body;

    const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');
    if (!clientSecret) {
      return Response.json({
        error: 'CAF_CLIENT_SECRET não configurado. Configure em Secrets.',
      }, { status: 500 });
    }

    const cleanCpf = (personCpf || '').replace(/\D/g, '');
    const hasValidCpf = cleanCpf.length === 11;
    const personId = hasValidCpf ? cleanCpf : 'anonymous';

    // Log da emissão — auditoria
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'sdk_token_generation',
          status: 'success',
          result_status: 'APPROVED',
          request_payload: {
            hasCpf: hasValidCpf,
            personId: hasValidCpf ? `${cleanCpf.substring(0, 3)}***` : 'anonymous',
          },
          response_payload: {
            strategy: 'static_mobile_token',
            tokenLength: clientSecret.length,
            canUseFaceAuth: hasValidCpf,
          },
          duration_ms: Date.now() - startTime,
        });
      } catch (e) {
        console.warn('[CAF-Token] Log error:', e.message);
      }
    }

    console.log(`[CAF-Token] Emitted static mobile token (${clientSecret.length} chars), personId=${personId}`);

    return Response.json({
      sdkToken: clientSecret,
      personId,
      tokenType: 'session',
      tokenStrategy: 'static_mobile_token',
      canUseFaceAuth: hasValidCpf, // apenas informativo — face auth via SDK segue OFF (usamos cafFaceMatchTransaction)
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[CAF-Token] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});