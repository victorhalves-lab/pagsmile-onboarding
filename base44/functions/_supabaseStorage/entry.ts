/**
 * Supabase Storage helper — uploads e signed URLs SEM consumir créditos Base44.
 *
 * Usado por publicDirectDocUpload (upload) e getPrivateDocumentUrl (signed URL).
 *
 * Importante: ESTE NÃO É UMA FUNÇÃO HTTP — é um módulo utilitário importado por outras
 * functions. Não pode ser invocado diretamente pelo SDK.
 *
 * Convenção do fileUri persistido na entidade DocumentUpload:
 *   - Supabase:        "supabase://<bucket>/<path>"   (novo formato — 2026-05-21+)
 *   - Base44 privado:  "mp/private/..."               (formato antigo — mantido para retrocompat)
 *
 * Funções:
 *   - uploadToSupabase(bytes, fileName, fileType)  → { fileUri, path }
 *   - getSupabaseSignedUrl(fileUri, expiresIn)     → { signed_url } | null se não-supabase
 *   - isSupabaseUri(uri)                            → boolean
 */

const SUPABASE_URI_PREFIX = 'supabase://';

export function isSupabaseUri(uri) {
  return typeof uri === 'string' && uri.startsWith(SUPABASE_URI_PREFIX);
}

function getSupabaseConfig() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_KEY');
  const bucket = Deno.env.get('SUPABASE_BUCKET') || 'compliance-docs';
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados');
  }
  return { url: url.replace(/\/+$/, ''), serviceKey, bucket };
}

/**
 * Gera path único e seguro para o arquivo dentro do bucket.
 * Formato: YYYY/MM/<timestamp>_<random>_<sanitized-filename>
 */
function buildStoragePath(fileName) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ts = now.getTime();
  const rand = Math.random().toString(36).slice(2, 10);
  // Sanitiza nome: remove acentos/especiais, limita 80 chars
  const safe = String(fileName || 'arquivo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  return `${yyyy}/${mm}/${ts}_${rand}_${safe}`;
}

/**
 * Faz upload de bytes para o Supabase Storage.
 * Retorna { fileUri: "supabase://<bucket>/<path>", path }
 */
export async function uploadToSupabase(bytes, fileName, fileType) {
  const { url, serviceKey, bucket } = getSupabaseConfig();
  const path = buildStoragePath(fileName);
  const endpoint = `${url}/storage/v1/object/${bucket}/${encodeURI(path)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': fileType || 'application/octet-stream',
      'x-upsert': 'false',
      'cache-control': '3600',
    },
    body: bytes,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase upload falhou (${res.status}): ${errText.slice(0, 300)}`);
  }

  return {
    fileUri: `${SUPABASE_URI_PREFIX}${bucket}/${path}`,
    path,
    bucket,
  };
}

/**
 * Gera signed URL temporária para download de arquivo armazenado no Supabase.
 * Retorna { signed_url } ou null se fileUri não for do Supabase.
 */
export async function getSupabaseSignedUrl(fileUri, expiresInSec = 600) {
  if (!isSupabaseUri(fileUri)) return null;

  const { url, serviceKey } = getSupabaseConfig();
  // Parse "supabase://<bucket>/<path>"
  const stripped = fileUri.slice(SUPABASE_URI_PREFIX.length);
  const slashIdx = stripped.indexOf('/');
  if (slashIdx < 0) throw new Error('fileUri Supabase inválido (sem path)');
  const bucket = stripped.slice(0, slashIdx);
  const path = stripped.slice(slashIdx + 1);

  const endpoint = `${url}/storage/v1/object/sign/${bucket}/${encodeURI(path)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: expiresInSec }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase signed URL falhou (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  // Supabase retorna { signedURL: "/object/sign/..." } — precisamos prepend da URL base
  const signedPath = data?.signedURL || data?.signedUrl;
  if (!signedPath) throw new Error('Supabase não retornou signedURL');
  const fullUrl = signedPath.startsWith('http') ? signedPath : `${url}/storage/v1${signedPath}`;
  return { signed_url: fullUrl };
}