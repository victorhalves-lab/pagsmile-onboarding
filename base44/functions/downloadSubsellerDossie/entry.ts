import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import JSZip from 'npm:jszip@3.10.1';
import * as XLSX from 'npm:xlsx@0.18.5';

// Gera signed URL Supabase para fileUris "supabase://<bucket>/<path>"
async function getSupabaseSignedUrl(fileUri, expiresInSec = 120) {
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
  if (!res.ok) throw new Error(`Supabase signed URL ${res.status}`);
  const data = await res.json();
  const signedPath = data?.signedURL || data?.signedUrl;
  if (!signedPath) throw new Error('Supabase não retornou signedURL');
  return signedPath.startsWith('http') ? signedPath : `${base}/storage/v1${signedPath}`;
}

function sanitize(name) {
  return String(name || 'arquivo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function buildSubsellerRow(gateway, sub, s, STATUS_LABELS) {
  return {
    'Gateway': gateway,
    'Data Envio': sub.created_date ? new Date(sub.created_date).toLocaleString('pt-BR') : '',
    'Preenchido por': sub.submitter_name || '',
    'Email preenchedor': sub.submitter_email || '',
    'Status': STATUS_LABELS[sub.status] || sub.status,
    'Tipo': s.person_type || 'PJ',
    'Nome / Razão Social': s.company_name || '',
    'CNPJ': s.cnpj || '',
    'CPF': s.cpf || '',
    'RG': s.rg || '',
    'CNAE': s.cnae || '',
    'Modelo de Negócio': s.business_model === 'outro' ? `outro: ${s.business_model_other || ''}` : (s.business_model || ''),
    'O que vende': s.what_they_sell || '',
    'Site / Link da oferta': s.offer_url || '',
    'Explicação da oferta': s.offer_explanation || '',
    'TPV Mensal (R$)': s.monthly_tpv || '',
    'Ticket Médio (R$)': s.average_ticket || '',
    'Banco': s.bank_name || '',
    'Agência': s.bank_agency || '',
    'Conta': s.bank_account || '',
    'Tipo Conta': s.bank_account_type || '',
    'Titular': s.bank_holder_name || '',
    'CPF/CNPJ Titular': s.bank_holder_document || '',
    'Documentos enviados': (s.documents || []).length,
  };
}

const STATUS_LABELS = {
  pending: 'Pendente',
  in_review: 'Em revisão',
  processed: 'Processado',
  archived: 'Arquivado',
};

async function addDocsToFolder(zip, folderPath, documents) {
  if (!documents || documents.length === 0) return { added: 0, failed: 0 };
  let added = 0;
  let failed = 0;
  const usedNames = new Set();

  for (const doc of documents) {
    if (!doc.file_uri) { failed++; continue; }
    try {
      const url = await getSupabaseSignedUrl(doc.file_uri, 180);
      const resp = await fetch(url);
      if (!resp.ok) { failed++; continue; }
      const buf = await resp.arrayBuffer();
      if (!buf || buf.byteLength === 0) { failed++; continue; }

      // Nome amigável: "contrato_social__arquivo-original.pdf"
      const docType = sanitize(doc.doc_type || 'documento');
      const original = sanitize(doc.file_name || 'arquivo');
      let fileName = `${docType}__${original}`;

      // Evita colisões
      let suffix = 1;
      let finalName = fileName;
      while (usedNames.has(finalName)) {
        const parts = fileName.split('.');
        if (parts.length > 1) {
          const ext = parts.pop();
          finalName = `${parts.join('.')}_${suffix}.${ext}`;
        } else {
          finalName = `${fileName}_${suffix}`;
        }
        suffix++;
      }
      usedNames.add(finalName);

      zip.file(`${folderPath}/${finalName}`, new Uint8Array(buf));
      added++;
    } catch (err) {
      console.error(`Erro baixando doc ${doc.file_name}:`, err.message);
      failed++;
    }
  }
  return { added, failed };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { scope, gateway_name, submission_id, subseller_index } = body;

    // ─── Escopo: subseller individual ───
    if (scope === 'subseller') {
      if (!submission_id || subseller_index === undefined) {
        return Response.json({ error: 'submission_id e subseller_index são obrigatórios' }, { status: 400 });
      }
      const sub = await base44.asServiceRole.entities.SubsellerInfoSubmission.get(submission_id);
      if (!sub) return Response.json({ error: 'Submissão não encontrada' }, { status: 404 });
      const s = (sub.subsellers || [])[subseller_index];
      if (!s) return Response.json({ error: 'Subseller não encontrado nessa submissão' }, { status: 404 });

      const zip = new JSZip();
      const docId = s.cnpj || s.cpf || `idx${subseller_index + 1}`;
      const folder = `Subseller_${sanitize(s.company_name || `n${subseller_index + 1}`)}_${sanitize(docId)}`;

      // Planilha só desse subseller
      const row = buildSubsellerRow(sub.gateway_name, sub, s, STATUS_LABELS);
      const ws = XLSX.utils.json_to_sheet([row]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subseller');
      const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      zip.file(`${folder}/dados.xlsx`, new Uint8Array(xlsxBuf));

      // Documentos
      const { added, failed } = await addDocsToFolder(zip, `${folder}/documentos`, s.documents || []);

      const zipB64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
      const fileName = `${folder}.zip`;
      return Response.json({
        zip_base64: zipB64,
        file_name: fileName,
        docs_added: added,
        docs_failed: failed,
      });
    }

    // ─── Escopo: Gateway inteiro (default) ───
    if (!gateway_name) {
      return Response.json({ error: 'gateway_name é obrigatório' }, { status: 400 });
    }

    const allSubs = await base44.asServiceRole.entities.SubsellerInfoSubmission.filter({
      gateway_name,
    });
    if (!allSubs || allSubs.length === 0) {
      return Response.json({ error: 'Nenhuma submissão para este Gateway' }, { status: 404 });
    }

    const zip = new JSZip();
    const allRows = [];
    let totalAdded = 0;
    let totalFailed = 0;
    let subsellerCounter = 0;

    for (const sub of allSubs) {
      for (let i = 0; i < (sub.subsellers || []).length; i++) {
        const s = sub.subsellers[i];
        subsellerCounter++;
        allRows.push(buildSubsellerRow(gateway_name, sub, s, STATUS_LABELS));

        // Pasta por subseller dentro da pasta do Gateway
        const docId = s.cnpj || s.cpf || `idx${subsellerCounter}`;
        const folder = `${sanitize(gateway_name)}/Subseller_${String(subsellerCounter).padStart(2, '0')}_${sanitize(s.company_name || 'sem_nome')}_${sanitize(docId)}`;
        const { added, failed } = await addDocsToFolder(zip, `${folder}/documentos`, s.documents || []);
        totalAdded += added;
        totalFailed += failed;
      }
    }

    // Planilha consolidada na raiz
    if (allRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(allRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subsellers');
      const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      zip.file(`${sanitize(gateway_name)}/planilha_subsellers.xlsx`, new Uint8Array(xlsxBuf));
    }

    const zipB64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
    const fileName = `Dossie_${sanitize(gateway_name)}_${new Date().toISOString().slice(0, 10)}.zip`;
    return Response.json({
      zip_base64: zipB64,
      file_name: fileName,
      docs_added: totalAdded,
      docs_failed: totalFailed,
      subsellers: subsellerCounter,
    });
  } catch (err) {
    console.error('downloadSubsellerDossie error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});