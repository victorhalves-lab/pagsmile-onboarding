import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Gera signed URL Supabase para fileUris "supabase://<bucket>/<path>"
async function getSupabaseSignedUrl(fileUri, expiresInSec) {
  const supaUrl = Deno.env.get('SUPABASE_URL');
  const supaKey = Deno.env.get('SUPABASE_SERVICE_KEY');
  if (!supaUrl || !supaKey) throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY ausentes');
  const base = supaUrl.replace(/\/+$/, '');
  const stripped = fileUri.slice('supabase://'.length);
  const slashIdx = stripped.indexOf('/');
  if (slashIdx < 0) throw new Error('fileUri Supabase inválido');
  const bucket = stripped.slice(0, slashIdx);
  const path = stripped.slice(slashIdx + 1);
  const res = await fetch(`${base}/storage/v1/object/sign/${bucket}/${encodeURI(path)}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${supaKey}`, 'apikey': supaKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: expiresInSec }),
  });
  if (!res.ok) throw new Error(`Supabase signed URL ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const signedPath = data?.signedURL || data?.signedUrl;
  if (!signedPath) throw new Error('Supabase não retornou signedURL');
  return signedPath.startsWith('http') ? signedPath : `${base}/storage/v1${signedPath}`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { onboardingCaseId } = await req.json();
  if (!onboardingCaseId) {
    return Response.json({ error: 'onboardingCaseId is required' }, { status: 400 });
  }

  const documents = await base44.asServiceRole.entities.DocumentUpload.filter({
    onboardingCaseId
  });

  if (!documents || documents.length === 0) {
    return Response.json({ error: 'No documents found' }, { status: 404 });
  }

  const results = [];

  for (const doc of documents) {
    if (!doc.fileUrl) continue;

    const fileName = doc.fileName || doc.documentName || 'documento';

    try {
      let downloadUrl = doc.fileUrl;
      const uri = doc.fileUri || doc.fileUrl;

      if (typeof uri === 'string' && uri.startsWith('supabase://')) {
        // Novo storage Supabase (sem custo Base44)
        downloadUrl = await getSupabaseSignedUrl(uri, 120);
      } else if (doc.fileUrl.startsWith('b44s://') || doc.fileUrl.includes('/private/')) {
        // Legacy Base44 private storage
        const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
          file_uri: doc.fileUrl,
          expires_in: 120
        });
        downloadUrl = signed_url;
      }

      results.push({ fileName, url: downloadUrl, docId: doc.id });
    } catch (err) {
      console.error(`Error getting URL for ${fileName}:`, err.message);
    }
  }

  return Response.json({ documents: results });
});