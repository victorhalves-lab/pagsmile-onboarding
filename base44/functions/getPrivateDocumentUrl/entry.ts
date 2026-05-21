import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * getPrivateDocumentUrl — Gera signed URL temporária para download de documento privado.
 *
 * Suporta DOIS storages (decidido pelo prefixo do fileUri):
 *   1. "supabase://<bucket>/<path>"  → Supabase Storage (uploads novos, sem custo Base44)
 *   2. "mp/private/..." (ou outro)   → Base44 storage legado (uploads antigos antes de 2026-05-21)
 *
 * Security:
 *   - Requer autenticação admin
 *   - Signed URL expira em 10min (default)
 */

async function getSupabaseSignedUrl(fileUri, expiresInSec) {
  const supaUrl = Deno.env.get('SUPABASE_URL');
  const supaKey = Deno.env.get('SUPABASE_SERVICE_KEY');
  if (!supaUrl || !supaKey) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY não configurados');
  }
  const base = supaUrl.replace(/\/+$/, '');
  // Parse "supabase://<bucket>/<path>"
  const stripped = fileUri.slice('supabase://'.length);
  const slashIdx = stripped.indexOf('/');
  if (slashIdx < 0) throw new Error('fileUri Supabase inválido (sem path)');
  const bucket = stripped.slice(0, slashIdx);
  const path = stripped.slice(slashIdx + 1);

  const endpoint = `${base}/storage/v1/object/sign/${bucket}/${encodeURI(path)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supaKey}`,
      'apikey': supaKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: expiresInSec }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase signed URL ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const signedPath = data?.signedURL || data?.signedUrl;
  if (!signedPath) throw new Error('Supabase não retornou signedURL');
  return signedPath.startsWith('http') ? signedPath : `${base}/storage/v1${signedPath}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { file_uri, documentUploadId, expiresIn } = await req.json();
    if (!file_uri) return Response.json({ error: 'file_uri required' }, { status: 400 });

    const expSec = typeof expiresIn === 'number' && expiresIn > 0 && expiresIn <= 3600 ? expiresIn : 600;

    // Roteamento: Supabase (novo) vs Base44 (legado)
    let signed_url;
    if (typeof file_uri === 'string' && file_uri.startsWith('supabase://')) {
      signed_url = await getSupabaseSignedUrl(file_uri, expSec);
    } else {
      // Legacy: Base44 storage (consome créditos, mas só para docs antigos)
      const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri,
        expires_in: expSec,
      });
      signed_url = result?.signed_url;
    }

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