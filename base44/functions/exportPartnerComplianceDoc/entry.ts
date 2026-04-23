import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

// Admin-only: gera XLSX no formato "Pré KYC Pagsmile" com dados de todos os casos selecionados.
// Estratégia: usa dados locais primeiro; chama BDC SÓ para os buracos.
// Input: { onboardingCaseIds: [] }
// Output: { fileBase64, fileName, missingBankData: [{caseId, companyName, cpfCnpj}] }

const BDC_URL = 'https://plataforma.bigdatacorp.com.br/empresas';

async function bdcQueryAddress(cnpj) {
  const tokenId = Deno.env.get('BDC_TOKEN_ID');
  const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
  if (!tokenId || !accessToken || !cnpj) return null;

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
        q: `doc{${cnpj.replace(/\D/g, '')}}`,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.Result?.[0];
    if (!result) return null;

    const addresses = result?.Addresses?.Addresses || [];
    const primary = addresses[0] || {};
    const basic = result?.BasicData || {};

    return {
      razaoSocial: basic?.OfficialName || '',
      nomeFantasia: basic?.TradeName || '',
      cep: primary?.ZipCode || '',
      rua: primary?.Street || primary?.AddressLine1 || '',
      numero: primary?.Number || '',
      bairro: primary?.Neighborhood || '',
      cidade: primary?.City || '',
      estado: primary?.State || '',
    };
  } catch (e) {
    console.warn('bdcQueryAddress failed for', cnpj, e.message);
    return null;
  }
}

function pick(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
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

    for (const caseId of onboardingCaseIds) {
      const caseRecord = await base44.asServiceRole.entities.OnboardingCase.get(caseId).catch(() => null);
      if (!caseRecord) continue;

      const merchant = caseRecord.merchantId
        ? await base44.asServiceRole.entities.Merchant.get(caseRecord.merchantId).catch(() => null)
        : null;

      // Respostas do questionário (endereço pode estar aí)
      const responses = await base44.asServiceRole.entities.QuestionnaireResponse
        .filter({ onboardingCaseId: caseId })
        .catch(() => []);

      const answerMap = {};
      for (const r of (responses || [])) {
        const key = (r.questionText || '').toLowerCase();
        const val = r.valueText || r.valueNumber || (Array.isArray(r.valueArray) ? r.valueArray.join(', ') : '') || '';
        if (key && val) answerMap[key] = val;
      }

      const findAnswer = (...keywords) => {
        for (const k of Object.keys(answerMap)) {
          for (const kw of keywords) {
            if (k.includes(kw.toLowerCase())) return answerMap[k];
          }
        }
        return '';
      };

      // Dados bancários
      const bankRecords = await base44.asServiceRole.entities.BankDataCollection
        .filter({ onboardingCaseId: caseId, status: 'preenchido' }, '-filledAt', 1)
        .catch(() => []);
      const bank = bankRecords?.[0] || null;

      // Monta base com o que já temos
      const cpfCnpj = pick(caseRecord.cpfCnpj, merchant?.cpfCnpj);
      let row = {
        'CPF/ CNPJ': cpfCnpj,
        'Nome Fantasia': pick(merchant?.companyName, findAnswer('nome fantasia')),
        'Razão Social': pick(merchant?.fullName, findAnswer('razão social', 'razao social')),
        'Agencia': pick(bank?.agencia),
        'Digito': pick(bank?.digitoAgencia),
        'Conta': pick(bank?.conta),
        'Digito Conta': pick(bank?.digitoConta),
        'Banco': pick(bank?.banco),
        'Email': pick(merchant?.email),
        'CEP': pick(findAnswer('cep')),
        'Cidade': pick(findAnswer('cidade')),
        'Rua': pick(findAnswer('logradouro', 'rua', 'endereço')),
        'Numero': pick(findAnswer('número', 'numero')),
        'Bairro': pick(findAnswer('bairro')),
        'Estado': pick(findAnswer('estado', 'uf')),
      };

      // Se falta razão social OU endereço e é PJ → busca BDC
      const isPJ = cpfCnpj.replace(/\D/g, '').length === 14;
      const needsEnrich = isPJ && (
        !row['Razão Social'] || !row['CEP'] || !row['Rua'] || !row['Cidade'] || !row['Estado']
      );

      if (needsEnrich) {
        const bdc = await bdcQueryAddress(cpfCnpj);
        if (bdc) {
          row['Razão Social'] = row['Razão Social'] || bdc.razaoSocial;
          row['Nome Fantasia'] = row['Nome Fantasia'] || bdc.nomeFantasia;
          row['CEP'] = row['CEP'] || bdc.cep;
          row['Rua'] = row['Rua'] || bdc.rua;
          row['Numero'] = row['Numero'] || bdc.numero;
          row['Bairro'] = row['Bairro'] || bdc.bairro;
          row['Cidade'] = row['Cidade'] || bdc.cidade;
          row['Estado'] = row['Estado'] || bdc.estado;
        }
      }

      // Rastreia quem está sem dados bancários
      if (!row['Banco'] || !row['Agencia'] || !row['Conta']) {
        missingBankData.push({
          caseId,
          companyName: row['Nome Fantasia'] || row['Razão Social'] || cpfCnpj,
          cpfCnpj,
        });
      }

      rows.push(row);
    }

    // Gera XLSX
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ['CPF/ CNPJ', 'Nome Fantasia', 'Razão Social', 'Agencia', 'Digito', 'Conta', 'Digito Conta', 'Banco', 'Email', 'CEP', 'Cidade', 'Rua', 'Numero', 'Bairro', 'Estado'],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pré KYC');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const fileBase64 = btoa(binary);

    const now = new Date();
    const fileName = `PreKYC-Pagsmile-${now.toISOString().slice(0, 10)}.xlsx`;

    return Response.json({
      fileBase64,
      fileName,
      rowCount: rows.length,
      missingBankData,
    });
  } catch (error) {
    console.error('exportPartnerComplianceDoc error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});