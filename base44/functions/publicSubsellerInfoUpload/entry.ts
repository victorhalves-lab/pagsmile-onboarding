import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Upload público de documentos para o link de coleta de subsellers (Gateway).
 * Valida o `token` da SubsellerInfoCollection e grava o arquivo no Supabase
 * Storage, retornando o `fileUri` para o frontend anexar ao subseller no submit.
 *
 * Body JSON:
 *   { token, fileBase64, fileName, fileType, fileSize }
 * Response:
 *   { ok, fileUri, fileName, fileSize, fileType }
 */

function base64ToBytes(b64) {
  const commaIdx = b64.indexOf(',');
  const raw = commaIdx >= 0 ? b64.slice(commaIdx + 1) : b64;
  const bin = atob(raw);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function buildSupabasePath(fileName) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ts = now.getTime();
  const rand = Math.random().toString(36).slice(2, 10);
  const safe = String(fileName || 'arquivo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  return `subseller-info/${yyyy}/${mm}/${ts}_${rand}_${safe}`;
}

async function uploadToSupabase(bytes, fileName, fileType) {
  const supaUrl = Deno.env.get('SUPABASE_URL');
  const supaKey = Deno.env.get('SUPABASE_SERVICE_KEY');
  const bucket = Deno.env.get('SUPABASE_BUCKET') || 'compliance-docs';
  if (!supaUrl || !supaKey) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY não configurados');
  }
  const base = supaUrl.replace(/\/+$/, '');
  const path = buildSupabasePath(fileName);
  const endpoint = `${base}/storage/v1/object/${bucket}/${encodeURI(path)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supaKey}`,
      'apikey': supaKey,
      'Content-Type': fileType || 'application/octet-stream',
      'x-upsert': 'false',
      'cache-control': '3600',
    },
    body: bytes,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase upload ${res.status}: ${errText.slice(0, 300)}`);
  }
  return `supabase://${bucket}/${path}`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }
    const body = await req.json().catch(() => ({}));
    const { token, fileBase64, fileName, fileType, fileSize } = body || {};

    if (!token) return Response.json({ ok: false, error: 'Token obrigatório' }, { status: 400 });
    if (!fileBase64) return Response.json({ ok: false, error: 'Arquivo obrigatório' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const list = await base44.asServiceRole.entities.SubsellerInfoCollection.filter({ unique_token: token });
    const c = list?.[0];
    if (!c) return Response.json({ ok: false, error: 'Link inválido' }, { status: 404 });
    if (c.is_active === false) return Response.json({ ok: false, error: 'Link desativado' }, { status: 403 });
    if (c.expires_at && new Date(c.expires_at) < new Date()) {
      return Response.json({ ok: false, error: 'Link expirado' }, { status: 403 });
    }

    let bytes;
    try { bytes = base64ToBytes(fileBase64); }
    catch (e) { return Response.json({ ok: false, error: 'Arquivo inválido' }, { status: 400 }); }

    const fileUri = await uploadToSupabase(bytes, fileName, fileType);

    return Response.json({
      ok: true,
      fileUri,
      fileName: fileName || '',
      fileSize: typeof fileSize === 'number' ? fileSize : 0,
      fileType: fileType || '',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Erro desconhecido' }, { status: 500 });
  }
});