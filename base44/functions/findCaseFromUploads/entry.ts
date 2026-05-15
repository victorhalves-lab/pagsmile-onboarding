import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PUBLIC endpoint — recupera o caseId quando o cliente "perdeu" o localStorage.
 *
 * Cenário (caso real Pedro Sperandio / Millions, 14-mai-2026):
 *   1. Cliente fez upload de N documentos com SUCESSO via publicDirectDocUpload.
 *      Cada upload retornou { documentUploadId } que ficou no React state.
 *   2. Por algum motivo (troca de aba, recarregar, cross-device, dev tools clean),
 *      o `created_onboarding_case_id` foi perdido do localStorage.
 *   3. Cliente clica em "Próximo" → handleProceedToCaf bloqueia por case_id_missing
 *      → toast some rápido → cliente acha que o botão "não funciona".
 *
 * Esta função recebe a lista de documentUploadIds que o cliente tem em memória
 * (ou achados via fileUri/fileSize) e retorna o caseId + docLinkToken pra
 * desbloquear o avanço sem precisar de re-upload.
 *
 * Body: { documentUploadIds?: string[], fileUris?: string[] }
 * Returns: { ok, caseId, docLinkToken } | { ok:false, error }
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

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

    const body = await req.json().catch(() => ({}));
    const { documentUploadIds = [], fileUris = [] } = body || {};

    if (!Array.isArray(documentUploadIds) || documentUploadIds.length === 0) {
      if (!Array.isArray(fileUris) || fileUris.length === 0) {
        return Response.json(
          { ok: false, error: 'documentUploadIds ou fileUris é obrigatório' },
          { status: 400 }
        );
      }
    }

    // Try by IDs first (more reliable)
    let foundDocs = [];
    if (documentUploadIds.length > 0) {
      for (const id of documentUploadIds.slice(0, 10)) {
        try {
          const docs = await base44.asServiceRole.entities.DocumentUpload.filter({ id });
          if (docs && docs.length > 0) {
            foundDocs.push(docs[0]);
          }
        } catch (_) { /* ignore individual failures */ }
        if (foundDocs.length > 0) break; // one match is enough to find the case
      }
    }

    // Fallback: by fileUri
    if (foundDocs.length === 0 && fileUris.length > 0) {
      for (const uri of fileUris.slice(0, 5)) {
        try {
          const docs = await base44.asServiceRole.entities.DocumentUpload.filter({ fileUri: uri });
          if (docs && docs.length > 0) {
            foundDocs.push(docs[0]);
            break;
          }
        } catch (_) { /* ignore */ }
      }
    }

    if (foundDocs.length === 0) {
      return Response.json(
        { ok: false, error: 'Nenhum documento encontrado pelos identificadores fornecidos' },
        { status: 404 }
      );
    }

    const caseId = foundDocs[0].onboardingCaseId;
    if (!caseId) {
      return Response.json(
        { ok: false, error: 'Documento sem caso associado' },
        { status: 500 }
      );
    }

    // Get the docLinkToken from the case
    let cases = [];
    try {
      cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    } catch (e) {
      return Response.json(
        { ok: false, error: 'Erro ao buscar caso: ' + e.message },
        { status: 500 }
      );
    }
    if (cases.length === 0) {
      return Response.json({ ok: false, error: 'Caso não encontrado' }, { status: 404 });
    }
    const onboardingCase = cases[0];

    console.log(`[findCaseFromUploads] RECOVERED caseId=${caseId} from ${foundDocs.length} doc(s)`);

    return Response.json({
      ok: true,
      caseId,
      docLinkToken: onboardingCase.docLinkToken || '',
      merchantId: onboardingCase.merchantId || '',
    });
  } catch (error) {
    console.error('[findCaseFromUploads] UNCAUGHT:', error?.message);
    return Response.json(
      { ok: false, error: error?.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
});