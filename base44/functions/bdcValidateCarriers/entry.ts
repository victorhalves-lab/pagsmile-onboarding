/**
 * bdcValidateCarriers — GAP 1
 * Plugin BDC "carriers validations": cross-validation barata de CPF × dados declarados
 * (telefone, email, endereço) contra as bases das 4 maiores operadoras de telefonia.
 *
 * Permite substituir comprovante de endereço em tiers ≤ AZUL.
 *
 * Body esperado:
 *   { cpf: "12345678901", phone?: "+5511...", email?: "x@y.com",
 *     address?: { cep: "01310100", number: "123" } }
 *
 * Retorna:
 *   { matchRate: 0-100, validations: [{ field, source, matched, confidence }],
 *     summary: 'Telefone e endereço confirmados em 3 operadoras' }
 *
 * Cada item validado conta como evidência para reduzir fricção no onboarding.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';
const VALIDATIONS_ENDPOINT = '/pessoas/validations';

async function callBdcValidation(accessToken, tokenId, dataset, body) {
  const start = Date.now();
  try {
    const r = await fetch(`${BDC_BASE_URL}${VALIDATIONS_ENDPOINT}`, {
      method: 'POST',
      headers: { 'AccessToken': accessToken, 'TokenId': tokenId, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ Datasets: dataset, ...body }),
    });
    const txt = await r.text();
    const elapsed = Date.now() - start;
    if (r.status >= 400) return { success: false, error: `HTTP ${r.status}: ${txt.substring(0, 200)}`, elapsed };
    const data = JSON.parse(txt);
    return { success: true, data, elapsed };
  } catch (e) {
    return { success: false, error: e.message, elapsed: Date.now() - start };
  }
}

function extractMatchRate(bdcResp, dataset) {
  // BDC validations retorna estrutura tipo:
  //   { Result: [{ <DatasetKey>: { MatchRate: 95, MatchedSources: [...], Confidence: 0.9 } }] }
  const r = bdcResp?.Result?.[0] || {};
  const datasetKey = Object.keys(r).find(k => k.toLowerCase().includes(dataset.replace(/_/g, '').toLowerCase())) || dataset;
  const block = r[datasetKey];
  if (!block) return null;
  const items = Array.isArray(block) ? block : [block];
  let bestMatch = 0; let confidence = 0; const sources = [];
  for (const it of items) {
    const m = Number(it?.MatchRate ?? it?.Match ?? it?.MatchPercentage ?? 0);
    if (m > bestMatch) bestMatch = m;
    const c = Number(it?.Confidence ?? 0);
    if (c > confidence) confidence = c;
    const src = it?.MatchedSources || it?.Sources || it?.Carriers || [];
    if (Array.isArray(src)) sources.push(...src);
    else if (typeof src === 'string') sources.push(src);
  }
  return { matchRate: bestMatch, confidence, sources: [...new Set(sources)] };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);

    // Authorization: admin OR service-role chain (chamado por autoEnrichOnboarding)
    let authorized = false;
    try { const u = await base44.auth.me(); if (u?.role === 'admin') authorized = true; } catch {}
    if (!authorized) { try { await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1); authorized = true; } catch {} }
    if (!authorized) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { cpf, phone, email, address, onboardingCaseId } = body;
    if (!cpf) return Response.json({ error: 'cpf is required' }, { status: 400 });
    const cleanCpf = String(cpf).replace(/\D/g, '');
    if (cleanCpf.length !== 11) return Response.json({ error: 'cpf must have 11 digits' }, { status: 400 });

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });

    const validations = [];
    const startedAt = Date.now();

    // Phone × CPF
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      const r = await callBdcValidation(accessToken, tokenId, 'carriers_phone_validation', { q: `doc{${cleanCpf}};phone{${cleanPhone}}` });
      if (r.success) {
        const ex = extractMatchRate(r.data, 'carriers_phone_validation');
        if (ex) validations.push({ field: 'phone', value: cleanPhone, dataset: 'carriers_phone_validation', ...ex, elapsedMs: r.elapsed });
      } else {
        validations.push({ field: 'phone', value: cleanPhone, dataset: 'carriers_phone_validation', error: r.error });
      }
    }

    // Email × CPF
    if (email) {
      const r = await callBdcValidation(accessToken, tokenId, 'carriers_email_validation', { q: `doc{${cleanCpf}};email{${email}}` });
      if (r.success) {
        const ex = extractMatchRate(r.data, 'carriers_email_validation');
        if (ex) validations.push({ field: 'email', value: email, dataset: 'carriers_email_validation', ...ex, elapsedMs: r.elapsed });
      } else {
        validations.push({ field: 'email', value: email, dataset: 'carriers_email_validation', error: r.error });
      }
    }

    // Address × CPF (cep + número)
    if (address?.cep) {
      const cleanCep = String(address.cep).replace(/\D/g, '');
      const num = String(address.number || '').trim();
      const r = await callBdcValidation(accessToken, tokenId, 'carriers_address_validation', { q: `doc{${cleanCpf}};zipcode{${cleanCep}}${num ? `;number{${num}}` : ''}` });
      if (r.success) {
        const ex = extractMatchRate(r.data, 'carriers_address_validation');
        if (ex) validations.push({ field: 'address', value: `${cleanCep}${num ? `, ${num}` : ''}`, dataset: 'carriers_address_validation', ...ex, elapsedMs: r.elapsed });
      } else {
        validations.push({ field: 'address', value: `${cleanCep}${num ? `, ${num}` : ''}`, dataset: 'carriers_address_validation', error: r.error });
      }
    }

    if (validations.length === 0) return Response.json({ error: 'No fields provided to validate (phone, email or address)' }, { status: 400 });

    // Aggregate
    const validResults = validations.filter(v => !v.error && typeof v.matchRate === 'number');
    const avgMatchRate = validResults.length > 0
      ? Math.round(validResults.reduce((s, v) => s + (v.matchRate || 0), 0) / validResults.length)
      : 0;
    const allSources = [...new Set(validResults.flatMap(v => v.sources || []))];

    const summaryParts = [];
    for (const v of validResults) {
      if (v.matchRate >= 80) summaryParts.push(`${v.field}: confirmado (${v.matchRate}%)`);
      else if (v.matchRate >= 50) summaryParts.push(`${v.field}: parcial (${v.matchRate}%)`);
      else summaryParts.push(`${v.field}: divergente (${v.matchRate}%)`);
    }
    const errored = validations.filter(v => v.error);
    if (errored.length > 0) summaryParts.push(`${errored.length} validação(ões) com erro`);

    const result = {
      success: true,
      cpf: cleanCpf,
      validations,
      avgMatchRate,
      sources: allSources,
      summary: summaryParts.join('; '),
      totalElapsedMs: Date.now() - startedAt,
    };

    // Persiste em ExternalValidationResult se houver onboardingCaseId
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId, provider: 'BigDataCorp',
          validationType: `Carriers Validations — ${validations.map(v => v.field).join(', ')}`,
          endpoint: `${BDC_BASE_URL}${VALIDATIONS_ENDPOINT}`,
          resultData: result,
          score: avgMatchRate,
          status: avgMatchRate >= 50 ? 'Sucesso' : 'Atenção',
          timestamp: new Date().toISOString(),
          responseTime: result.totalElapsedMs,
        });
      } catch (e) { console.warn('[bdcValidateCarriers] persist error:', e.message); }
    }

    return Response.json(result);
  } catch (error) {
    console.error('[bdcValidateCarriers] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});