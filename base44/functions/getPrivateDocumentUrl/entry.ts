import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * getPrivateDocumentUrl — Gera signed URL temporária para download de documento privado.
 *
 * Uso: analistas internos (admin) precisam baixar documentos KYC para análise.
 * Os documentos foram salvos via UploadPrivateFile (linha 195 DynamicDocumentUploader),
 * então a URL bruta (file_uri) não funciona em download direto — precisa do signed URL.
 *
 * Security:
 *   - Requer autenticação admin
 *   - Aceita file_uri e opcionalmente documentUploadId (para auditoria)
 *   - Signed URL expira em 10min (padrão)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { file_uri, documentUploadId, expiresIn } = await req.json();
    if (!file_uri) return Response.json({ error: 'file_uri required' }, { status: 400 });

    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: typeof expiresIn === 'number' && expiresIn > 0 && expiresIn <= 3600 ? expiresIn : 600,
    });

    // Audit trail — who downloaded what (non-blocking)
    if (documentUploadId) {
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          action: 'document_downloaded',
          userEmail: user.email,
          targetEntity: 'DocumentUpload',
          targetId: documentUploadId,
          details: { file_uri_prefix: String(file_uri).substring(0, 40) },
        });
      } catch { /* non-blocking */ }
    }

    return Response.json({ signed_url });
  } catch (error) {
    console.error('getPrivateDocumentUrl error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});