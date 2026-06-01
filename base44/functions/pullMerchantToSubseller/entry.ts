import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Puxa um Merchant existente na plataforma e retorna um objeto subseller
 * pré-preenchido (pronto pra colar num card do SubsellerInfoForm).
 *
 * Body:  { merchantId }
 * Auth:  admin
 * Out:   { ok: true, subseller: {...campos}, sourceCaseId, warnings: [...] }
 */

// ─── Supabase helpers (inlined — backend functions can't import local files) ───
const SUPABASE_URI_PREFIX = 'supabase://';

function isSupabaseUri(uri) {
  return typeof uri === 'string' && uri.startsWith(SUPABASE_URI_PREFIX);
}

function getSupabaseConfig() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_KEY');
  const bucket = Deno.env.get('SUPABASE_BUCKET') || 'compliance-docs';
  if (!url || !serviceKey) throw new Error('SUPABASE_URL/SERVICE_KEY ausentes');
  return { url: url.replace(/\/+$/, ''), serviceKey, bucket };
}

function buildStoragePath(fileName) {
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
    throw new Error(`Supabase upload ${res.status}: ${errText.slice(0, 200)}`);
  }
  return `${SUPABASE_URI_PREFIX}${bucket}/${path}`;
}

async function getSupabaseSignedUrl(fileUri, expiresInSec = 300) {
  if (!isSupabaseUri(fileUri)) return null;
  const { url, serviceKey } = getSupabaseConfig();
  const stripped = fileUri.slice(SUPABASE_URI_PREFIX.length);
  const slashIdx = stripped.indexOf('/');
  if (slashIdx < 0) throw new Error('fileUri Supabase inválido');
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
  if (!res.ok) throw new Error(`Supabase sign ${res.status}`);
  const data = await res.json();
  const signedPath = data?.signedURL || data?.signedUrl;
  if (!signedPath) throw new Error('Sem signedURL');
  const fullUrl = signedPath.startsWith('http') ? signedPath : `${url}/storage/v1${signedPath}`;
  return fullUrl;
}

// ─── Mapping helpers ───
function mapDocTypeToSubsellerSlot(docTypeName, personType) {
  const t = String(docTypeName || '').toLowerCase();
  if (personType === 'PJ') {
    if (t.includes('contrato') && t.includes('social')) return 'contrato_social';
    if (t.includes('endereco') && (t.includes('empresa') || t.includes('pj') || t.includes('comercial')))
      return 'comprovante_endereco_empresa';
    if (t.includes('selfie')) return 'selfie_socio';
    if (t.includes('rg') || t.includes('cnh') || t.includes('identidade') ||
        (t.includes('doc') && t.includes('socio'))) return 'doc_socio';
    return null;
  }
  if (t.includes('selfie')) return 'selfie_documento';
  if (t.includes('endereco') || t.includes('residencia')) return 'comprovante_residencia';
  if (t.includes('rg') || t.includes('cnh') || t.includes('identidade') || t.includes('doc'))
    return 'documento_id';
  return null;
}

function pickQR(qr, ...keys) {
  if (!qr) return '';
  for (const k of keys) {
    const v = qr?.[k] ?? qr?.responses?.[k] ?? qr?.answers?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function toNumber(v) {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Resolve qualquer fileUri/fileUrl (Supabase, Base44 privado "mp/private/...",
 * URL HTTP pública/legada) em uma URL HTTP baixável temporária.
 * Retorna null se não souber resolver (ex: string vazia).
 */
async function resolveDownloadUrl(base44, uri) {
  if (!uri || typeof uri !== 'string') return null;

  // Caso 1: Supabase URI → signed URL
  if (isSupabaseUri(uri)) {
    return await getSupabaseSignedUrl(uri, 300);
  }

  // Caso 2: Base44 privado (formato antigo) → usa SDK pra gerar signed URL
  if (uri.startsWith('mp/private/') || uri.includes('/private/')) {
    try {
      const res = await base44.asServiceRole.functions.invoke('getPrivateDocumentUrl', { fileUri: uri });
      const signed = res?.data?.signed_url || res?.signed_url;
      if (signed) return signed;
    } catch { /* cai pro fallback abaixo */ }
    return null;
  }

  // Caso 3: já é HTTP(S) público/legado → baixa direto
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  return null;
}

/**
 * Clona um documento (de qualquer origem) para o namespace `subseller-info/`
 * no Supabase. Sempre retorna um `supabase://` novo, garantindo consistência
 * com o resto do fluxo de coleta de subsellers (que sabe servir esse formato).
 *
 * Origens suportadas:
 *   - supabase://...                       (Supabase atual)
 *   - mp/private/... ou /private/...       (Base44 privado, formato antigo)
 *   - http(s)://...                        (URL pública/legada)
 */
async function cloneDocToSubsellerNamespace(base44, fileUri, fileName) {
  const downloadUrl = await resolveDownloadUrl(base44, fileUri);
  if (!downloadUrl) {
    throw new Error('Origem do arquivo não suportada');
  }
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const ct = res.headers.get('content-type') || 'application/octet-stream';
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0) throw new Error('Arquivo vazio na origem');
  const newUri = await uploadToSupabase(bytes, fileName || 'documento', ct);
  return { fileUri: newUri, copied: true, fileType: ct, fileSize: bytes.length };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const { merchantId } = await req.json().catch(() => ({}));
    if (!merchantId) {
      return Response.json({ ok: false, error: 'merchantId obrigatório' }, { status: 400 });
    }

    const merchant = await base44.asServiceRole.entities.Merchant.get(merchantId).catch(() => null);
    if (!merchant) {
      return Response.json({ ok: false, error: 'Merchant não encontrado' }, { status: 404 });
    }

    const cases = await base44.asServiceRole.entities.OnboardingCase.filter(
      { merchantId },
      '-created_date',
      1,
    );
    const onboardingCase = cases?.[0] || null;

    let qr = null;
    if (onboardingCase?.id) {
      const qrs = await base44.asServiceRole.entities.QuestionnaireResponse.filter(
        { onboardingCaseId: onboardingCase.id },
        '-created_date',
        1,
      ).catch(() => []);
      qr = qrs?.[0] || null;
    }

    const isPJ = (merchant.type || 'PJ') === 'PJ';
    const personType = isPJ ? 'PJ' : 'PF';
    const resp = qr?.responses || qr || {};

    const subseller = {
      person_type: personType,
      company_name: merchant.companyName || merchant.fullName || '',
      cnpj: isPJ ? (merchant.cpfCnpj || '') : '',
      cpf: isPJ ? '' : (merchant.cpfCnpj || ''),
      rg: isPJ ? '' : (pickQR(resp, 'rg', 'documento_rg') || ''),
      cnae: pickQR(resp, 'cnae', 'cnae_principal', 'atividade_principal') || '',
      business_model: pickQR(resp, 'business_model', 'modelo_negocio') || '',
      business_model_other: pickQR(resp, 'business_model_other', 'modelo_negocio_outro') || '',
      what_they_sell: pickQR(resp, 'what_they_sell', 'produtos_servicos', 'o_que_vende') || '',
      offer_url: pickQR(resp, 'offer_url', 'site', 'url_principal', 'website') || '',
      offer_explanation: pickQR(resp, 'offer_explanation', 'descricao_oferta') || '',
      monthly_tpv: toNumber(pickQR(resp, 'monthly_tpv', 'tpv_mensal', 'volume_mensal')) ?? '',
      average_ticket: toNumber(pickQR(resp, 'average_ticket', 'ticket_medio')) ?? '',
      bank_name: pickQR(resp, 'bank_name', 'banco') || '',
      bank_agency: pickQR(resp, 'bank_agency', 'agencia') || '',
      bank_account: pickQR(resp, 'bank_account', 'conta', 'numero_conta') || '',
      bank_account_type: pickQR(resp, 'bank_account_type', 'tipo_conta') || 'corrente',
      bank_holder_name: pickQR(resp, 'bank_holder_name', 'titular_conta') || merchant.fullName || '',
      bank_holder_document: pickQR(resp, 'bank_holder_document', 'cpf_cnpj_titular') || merchant.cpfCnpj || '',
      documents: [],
    };

    const warnings = [];

    if (onboardingCase?.id) {
      const docs = await base44.asServiceRole.entities.DocumentUpload.filter(
        { onboardingCaseId: onboardingCase.id },
        '-created_date',
        200,
      ).catch(() => []);

      const validDocs = docs.filter(d => (d.fileUrl || d.fileUri) && !d.notAvailable);
      const docTypeIds = [...new Set(validDocs.map(d => d.documentTypeId).filter(Boolean))];
      const docTypeMap = {};
      for (const id of docTypeIds) {
        try {
          const dt = await base44.asServiceRole.entities.DocumentType.get(id);
          if (dt) docTypeMap[id] = dt.name;
        } catch {}
      }

      for (const doc of validDocs) {
        const typeName = docTypeMap[doc.documentTypeId] || doc.documentName || '';
        const slot = mapDocTypeToSubsellerSlot(typeName, personType);
        if (!slot) continue;

        try {
          const uri = doc.fileUri || doc.fileUrl;
          const cloned = await cloneDocToSubsellerNamespace(base44, uri, doc.fileName);
          subseller.documents.push({
            doc_type: slot,
            doc_label: typeName,
            file_uri: cloned.fileUri,
            file_name: doc.fileName || typeName,
            file_size: doc.fileSize || cloned.fileSize || 0,
            file_type: doc.fileType || cloned.fileType || '',
            uploaded_at: new Date().toISOString(),
          });
        } catch (err) {
          warnings.push(`Falha ao copiar "${typeName}": ${String(err?.message || err).slice(0, 100)}`);
        }
      }
    } else {
      warnings.push('Cliente sem onboarding case — só dados cadastrais foram puxados.');
    }

    return Response.json({
      ok: true,
      subseller,
      sourceCaseId: onboardingCase?.id || null,
      warnings,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Erro desconhecido' }, { status: 500 });
  }
});