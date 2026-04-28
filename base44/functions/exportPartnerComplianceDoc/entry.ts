import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

/**
 * Admin-only: gera XLSX no formato "Pré KYC Pagsmile" com dados de todos os casos selecionados.
 *
 * Estratégia de resolução de dados por cliente (ordem de prioridade):
 *   CNPJ  : Merchant.cpfCnpj (se 14 dígitos e type=PJ) > Lead.cpfCnpj (14d) > Respostas (CNPJ)
 *   Razão Social / Nome Fantasia : Merchant > Respostas > BDC(basic_data)
 *   Endereço (CEP, Rua, Número, Bairro, Cidade, UF) : Respostas (campos específicos) > BDC(addresses)
 *   Email : Merchant.email
 *   Banco / Agência / Conta : BankDataCollection (status=preenchido)
 *
 * Apenas chama BDC quando há buracos (custa créditos).
 *
 * Input : { onboardingCaseIds: [] }
 * Output: { fileBase64, fileName, rowCount, missingBankData, debug? }
 */

const BDC_URL = 'https://plataforma.bigdatacorp.com.br/empresas';

const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const isCnpj = (s) => onlyDigits(s).length === 14;
const isCpf = (s) => onlyDigits(s).length === 11;

function pick(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s && s !== '—' && s !== '-') return s;
  }
  return '';
}

async function bdcQueryByCnpj(cnpj) {
  const tokenId = Deno.env.get('BDC_TOKEN_ID');
  const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
  if (!tokenId || !accessToken) return null;
  const clean = onlyDigits(cnpj);
  if (clean.length !== 14) return null;

  try {
    const res = await fetch(BDC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessToken': accessToken,
        'TokenId': tokenId,
      },
      body: JSON.stringify({
        Datasets: 'basic_data,addresses',
        q: `doc{${clean}}`,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.Result?.[0];
    if (!result) return null;

    const addresses = result?.Addresses?.Addresses || [];
    // Preferir endereço tipo MATRIZ/PRINCIPAL; cair para primeiro
    const primary = addresses.find(a =>
      String(a?.Type || '').toUpperCase().includes('MATRIZ') ||
      String(a?.Type || '').toUpperCase().includes('PRINCIPAL')
    ) || addresses[0] || {};
    const basic = result?.BasicData || {};

    return {
      razaoSocial: basic?.OfficialName || '',
      nomeFantasia: basic?.TradeName || '',
      cep: onlyDigits(primary?.ZipCode || '').replace(/^(\d{5})(\d{3})$/, '$1-$2') || (primary?.ZipCode || ''),
      rua: primary?.Street || primary?.AddressLine1 || '',
      numero: primary?.Number || '',
      bairro: primary?.Neighborhood || '',
      cidade: primary?.City || '',
      estado: primary?.State || '',
    };
  } catch (e) {
    console.warn('bdcQueryByCnpj failed for', cnpj, e.message);
    return null;
  }
}

/**
 * Itera todas as respostas e expõe (questionText, valueText, valueRaw) já normalizados.
 */
function* iterAnswers(responses) {
  for (const r of (responses || [])) {
    const q = String(r.questionText || '').toLowerCase();
    const val = String(
      r.valueText ??
      (r.valueNumber != null ? r.valueNumber : '') ??
      (Array.isArray(r.valueArray) ? r.valueArray.join(', ') : '') ??
      ''
    ).trim();
    if (!q && !val) continue;
    yield { q, val };
  }
}

/**
 * Procura QUALQUER valor de 14 dígitos válido como CNPJ em todas as respostas,
 * mesmo que a pergunta não mencione "cnpj" explicitamente. Útil para campos
 * genéricos tipo "documento da empresa", "ID fiscal", "razão social e CNPJ", etc.
 */
function findCnpjAnywhere(responses) {
  for (const { val } of iterAnswers(responses)) {
    // Tenta valor inteiro primeiro
    if (isCnpj(val)) return onlyDigits(val);
    // Procura padrão de CNPJ no meio do texto (ex: "...CNPJ 12.345.678/0001-99...")
    const matches = String(val).match(/(\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2})/g) || [];
    for (const m of matches) {
      if (isCnpj(m)) return onlyDigits(m);
    }
    // Procura sequência de 14 dígitos consecutivos
    const seq = String(val).match(/\b\d{14}\b/);
    if (seq) return seq[0];
  }
  return '';
}

/** Idem para CPF (11 dígitos). */
function findCpfAnywhere(responses) {
  for (const { val } of iterAnswers(responses)) {
    if (isCpf(val)) return onlyDigits(val);
    const matches = String(val).match(/(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2})/g) || [];
    for (const m of matches) {
      const d = onlyDigits(m);
      if (d.length === 11) return d;
    }
    const seq = String(val).match(/\b\d{11}\b/);
    if (seq) return seq[0];
  }
  return '';
}

/**
 * Monta um mapa determinístico a partir das respostas do questionário, usando
 * matching baseado em palavras-chave SEM falsos positivos.
 */
function buildAnswerIndex(responses) {
  const index = {
    cnpj: '', razaoSocial: '', nomeFantasia: '',
    cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '',
    banco: '', agencia: '', digitoAgencia: '', conta: '', digitoConta: '',
  };

  for (const { q, val } of iterAnswers(responses)) {
    if (!q || !val) continue;

    // CNPJ — pergunta explícita
    if (!index.cnpj && /\bcnpj\b/.test(q) && isCnpj(val)) {
      index.cnpj = onlyDigits(val);
    }

    // Razão Social
    if (!index.razaoSocial && /raz[aã]o\s*social/.test(q)) {
      index.razaoSocial = val;
    }

    // Nome Fantasia
    if (!index.nomeFantasia && /nome\s*fantasia/.test(q)) {
      index.nomeFantasia = val;
    }

    // CEP
    if (!index.cep && /\bcep\b/.test(q)) {
      index.cep = val;
    }

    // Rua / Logradouro
    if (!index.rua && /(logradouro|^rua|endere[çc]o\s*.*rua|endere[çc]o\s*completo)/.test(q)) {
      index.rua = val;
    }

    // Número — restrito a contexto de endereço
    if (!index.numero &&
        /(n[úu]mero)/.test(q) &&
        /(endere[çc]o|logradouro|casa|im[óo]vel|pr[ée]dio)/.test(q) &&
        !/(s[óo]cios?|funcion[áa]rios?|cnpj|cpf|transa|telefone|celular)/.test(q)) {
      index.numero = val;
    }

    if (!index.bairro && /bairro/.test(q)) index.bairro = val;
    if (!index.cidade && /(cidade|munic[íi]pio)/.test(q)) index.cidade = val;
    if (!index.estado && /\b(estado|uf)\b/.test(q)) index.estado = val;

    // ── Dados bancários nas respostas ──
    if (!index.banco && /\bbanco\b/.test(q) && !/banc[áa]rio/.test(q)) index.banco = val;
    if (!index.agencia && /ag[êe]ncia/.test(q) && !/d[íi]gito/.test(q)) index.agencia = val;
    if (!index.digitoAgencia && /d[íi]gito.*ag[êe]ncia/.test(q)) index.digitoAgencia = val;
    if (!index.conta && /\bconta\b/.test(q) && !/d[íi]gito/.test(q) && !/tipo/.test(q)) index.conta = val;
    if (!index.digitoConta && /d[íi]gito.*conta/.test(q)) index.digitoConta = val;
  }

  return index;
}

/**
 * BUSCA MICROSCÓPICA do CNPJ em TODAS as fontes possíveis.
 * Retorna { cnpj: '14digits or empty', source: '...' }
 */
async function resolveCnpj(base44, caseRecord, merchant, responses) {
  // 1) Merchant
  if (isCnpj(merchant?.cpfCnpj)) {
    return { cnpj: onlyDigits(merchant.cpfCnpj), source: 'merchant' };
  }

  // 2) OnboardingCase
  if (isCnpj(caseRecord?.cpfCnpj)) {
    return { cnpj: onlyDigits(caseRecord.cpfCnpj), source: 'case' };
  }

  // 3) Respostas — pergunta explícita
  const answers = buildAnswerIndex(responses);
  if (isCnpj(answers.cnpj)) {
    return { cnpj: answers.cnpj, source: 'answers_explicit' };
  }

  // 4) Respostas — busca microscópica em qualquer texto
  const cnpjAnywhere = findCnpjAnywhere(responses);
  if (isCnpj(cnpjAnywhere)) {
    return { cnpj: cnpjAnywhere, source: 'answers_anywhere' };
  }

  // 5) Lead vinculado por email/cpfCnpj
  try {
    const candidateLeads = [];
    if (merchant?.email) {
      const byEmail = await base44.asServiceRole.entities.Lead.filter({ email: merchant.email }).catch(() => []);
      candidateLeads.push(...(byEmail || []));
    }
    if (merchant?.cpfCnpj) {
      const byDoc = await base44.asServiceRole.entities.Lead.filter({ cpfCnpj: merchant.cpfCnpj }).catch(() => []);
      candidateLeads.push(...(byDoc || []));
    }
    if (caseRecord?.id) {
      const byCase = await base44.asServiceRole.entities.Lead.filter({ onboardingCaseId: caseRecord.id }).catch(() => []);
      candidateLeads.push(...(byCase || []));
    }

    for (const l of candidateLeads) {
      if (isCnpj(l?.cpfCnpj)) {
        return { cnpj: onlyDigits(l.cpfCnpj), source: 'lead' };
      }
      // Lead pode ter CNPJ dentro de bdcEnrichmentData ou questionnaireData
      const bdcData = l?.bdcEnrichmentData || {};
      const flatBdc = JSON.stringify(bdcData);
      const bdcMatch = flatBdc.match(/\b\d{14}\b/);
      if (bdcMatch && isCnpj(bdcMatch[0])) {
        return { cnpj: bdcMatch[0], source: 'lead_bdc' };
      }
      const qData = l?.questionnaireData || {};
      const flatQ = JSON.stringify(qData);
      const qMatch = flatQ.match(/\b\d{14}\b/);
      if (qMatch && isCnpj(qMatch[0])) {
        return { cnpj: qMatch[0], source: 'lead_questionnaire_data' };
      }
    }
  } catch (_) { /* ignore */ }

  // 6) ExternalValidationResult — BDC pode ter retornado dados com CNPJ
  try {
    const validations = await base44.asServiceRole.entities.ExternalValidationResult
      .filter({ onboardingCaseId: caseRecord?.id })
      .catch(() => []);
    for (const v of (validations || [])) {
      const flat = JSON.stringify(v?.resultData || {});
      const match = flat.match(/\b\d{14}\b/);
      if (match && isCnpj(match[0])) {
        return { cnpj: match[0], source: 'external_validation' };
      }
    }
  } catch (_) { /* ignore */ }

  // 7) Parent merchant (caso seja subseller, herda CNPJ do seller-pai)
  try {
    if (merchant?.parentMerchantId) {
      const parent = await base44.asServiceRole.entities.Merchant.get(merchant.parentMerchantId).catch(() => null);
      if (isCnpj(parent?.cpfCnpj)) {
        return { cnpj: onlyDigits(parent.cpfCnpj), source: 'parent_merchant' };
      }
    }
  } catch (_) { /* ignore */ }

  return { cnpj: '', source: 'none' };
}

/** BUSCA MICROSCÓPICA do CPF em todas as fontes (para PF). */
async function resolveCpf(base44, caseRecord, merchant, responses) {
  if (isCpf(merchant?.cpfCnpj)) {
    return { cpf: onlyDigits(merchant.cpfCnpj), source: 'merchant' };
  }
  if (isCpf(caseRecord?.cpfCnpj)) {
    return { cpf: onlyDigits(caseRecord.cpfCnpj), source: 'case' };
  }
  const cpfFromAnswers = findCpfAnywhere(responses);
  if (isCpf(cpfFromAnswers)) {
    return { cpf: cpfFromAnswers, source: 'answers' };
  }
  try {
    if (merchant?.email) {
      const leads = await base44.asServiceRole.entities.Lead.filter({ email: merchant.email }).catch(() => []);
      for (const l of (leads || [])) {
        if (isCpf(l?.cpfCnpj)) return { cpf: onlyDigits(l.cpfCnpj), source: 'lead' };
      }
    }
  } catch (_) { /* ignore */ }
  return { cpf: '', source: 'none' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { onboardingCaseIds } = await req.json();
    if (!Array.isArray(onboardingCaseIds) || onboardingCaseIds.length === 0) {
      return Response.json({ error: 'onboardingCaseIds required' }, { status: 400 });
    }

    const rows = [];
    const missingBankData = [];
    const debug = [];

    for (const caseId of onboardingCaseIds) {
      const caseRecord = await base44.asServiceRole.entities.OnboardingCase.get(caseId).catch(() => null);
      if (!caseRecord) continue;

      const merchant = caseRecord.merchantId
        ? await base44.asServiceRole.entities.Merchant.get(caseRecord.merchantId).catch(() => null)
        : null;

      const responses = await base44.asServiceRole.entities.QuestionnaireResponse
        .filter({ onboardingCaseId: caseId })
        .catch(() => []);

      // ── Banco de respostas (indexado, sem falsos positivos) ──
      const answers = buildAnswerIndex(responses);

      // ── Resolver CNPJ correto ──
      const isPJ = merchant?.type === 'PJ' || isCnpj(merchant?.cpfCnpj) || isCnpj(caseRecord?.cpfCnpj);
      let finalDoc = '';
      let docSource = 'none';

      if (isPJ) {
        const r = await resolveCnpj(base44, caseRecord, merchant, responses);
        finalDoc = r.cnpj;
        docSource = r.source;
      } else {
        // PF — busca microscópica de CPF
        const r = await resolveCpf(base44, caseRecord, merchant, responses);
        finalDoc = r.cpf;
        docSource = `pf_${r.source}`;
      }

      // ── Dados bancários: BankDataCollection > respostas do questionário ──
      const bankRecords = await base44.asServiceRole.entities.BankDataCollection
        .filter({ onboardingCaseId: caseId, status: 'preenchido' }, '-filledAt', 1)
        .catch(() => []);
      const bank = bankRecords?.[0] || null;

      // ── Monta linha — banco prioriza BankDataCollection, cai pra respostas ──
      let row = {
        'CPF/ CNPJ': finalDoc,
        'Nome Fantasia': pick(merchant?.companyName, answers.nomeFantasia),
        'Razão Social': pick(merchant?.fullName, answers.razaoSocial),
        'Agencia': pick(bank?.agencia, answers.agencia),
        'Digito': pick(bank?.digitoAgencia, answers.digitoAgencia),
        'Conta': pick(bank?.conta, answers.conta),
        'Digito Conta': pick(bank?.digitoConta, answers.digitoConta),
        'Banco': pick(bank?.banco, answers.banco),
        'Email': pick(merchant?.email),
        'CEP': pick(answers.cep),
        'Cidade': pick(answers.cidade),
        'Rua': pick(answers.rua),
        'Numero': pick(answers.numero),
        'Bairro': pick(answers.bairro),
        'Estado': pick(answers.estado),
      };

      // ── Enriquecimento BDC: só se PJ, só se temos CNPJ válido, só se faltam campos ──
      const needsEnrich = isPJ && isCnpj(finalDoc) && (
        !row['Razão Social'] || !row['Nome Fantasia'] ||
        !row['CEP'] || !row['Rua'] || !row['Cidade'] || !row['Estado']
      );

      if (needsEnrich) {
        const bdc = await bdcQueryByCnpj(finalDoc);
        if (bdc) {
          row['Razão Social'] = row['Razão Social'] || bdc.razaoSocial;
          row['Nome Fantasia'] = row['Nome Fantasia'] || bdc.nomeFantasia;
          row['CEP'] = row['CEP'] || bdc.cep;
          row['Rua'] = row['Rua'] || bdc.rua;
          row['Numero'] = row['Numero'] || bdc.numero;
          row['Bairro'] = row['Bairro'] || bdc.bairro;
          row['Cidade'] = row['Cidade'] || bdc.cidade;
          row['Estado'] = row['Estado'] || bdc.estado;
          docSource += '+bdc';
        }
      }

      // ── Sanity-check: nunca deixar o CEP receber um CNPJ, nem o Número receber um CNPJ ──
      if (row['CEP'] && isCnpj(row['CEP'])) row['CEP'] = '';
      if (row['Numero'] && isCnpj(row['Numero'])) row['Numero'] = '';
      if (row['Rua'] && isCnpj(row['Rua'])) row['Rua'] = '';

      // ── Rastreia pendências de banco ──
      if (!row['Banco'] || !row['Agencia'] || !row['Conta']) {
        missingBankData.push({
          caseId,
          companyName: row['Nome Fantasia'] || row['Razão Social'] || finalDoc,
          cpfCnpj: finalDoc,
        });
      }

      rows.push(row);
      debug.push({ caseId, finalDoc, docSource, isPJ });
    }

    // ── Gera XLSX ──
    const headers = ['CPF/ CNPJ', 'Nome Fantasia', 'Razão Social', 'Agencia', 'Digito', 'Conta', 'Digito Conta', 'Banco', 'Email', 'CEP', 'Cidade', 'Rua', 'Numero', 'Bairro', 'Estado'];
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pré KYC');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const fileBase64 = btoa(binary);

    const fileName = `PreKYC-Pagsmile-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return Response.json({
      fileBase64,
      fileName,
      rowCount: rows.length,
      missingBankData,
      debug,
    });
  } catch (error) {
    console.error('exportPartnerComplianceDoc error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});