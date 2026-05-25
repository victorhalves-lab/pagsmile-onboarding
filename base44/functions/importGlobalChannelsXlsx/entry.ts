import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

/**
 * Importa canais Global a partir de XLSX com mesmo formato da planilha
 * "GLOBAL PAYMENTS PUBLIC VERSION". Admin-only.
 *
 * Payload:
 *   { file_url: string, replace_existing: boolean }
 *
 * Espera abas por país (ARGENTINA, MEXICO, etc) + 'SOUTH & CENTRAL AMERICAS' agregada.
 * Brasil é IGNORADO (módulo Global não atende BR).
 */

// Mapa nome de aba → { iso, region }
const SHEET_MAP = {
  'ARGENTINA':    { iso: 'AR', name: 'Argentina',   region: 'LATAM' },
  'BOLIVIA':      { iso: 'BO', name: 'Bolivia',     region: 'LATAM' },
  'BRAZIL':       { iso: 'BR', name: 'Brazil',      region: 'LATAM', skip: true },
  'CHILE':        { iso: 'CL', name: 'Chile',       region: 'LATAM' },
  'COLOMBIA':     { iso: 'CO', name: 'Colombia',    region: 'LATAM' },
  'COSTA RICA':   { iso: 'CR', name: 'Costa Rica',  region: 'CENTRAL_AMERICA' },
  'ECUADOR':      { iso: 'EC', name: 'Ecuador',     region: 'LATAM' },
  'MEXICO':       { iso: 'MX', name: 'Mexico',      region: 'LATAM' },
  'PERU':         { iso: 'PE', name: 'Peru',        region: 'LATAM' },
};

// Mapa de country (texto da aba "SOUTH & CENTRAL AMERICAS") → ISO/region
const COUNTRY_TEXT_MAP = {
  'GUATEMALA':    { iso: 'GT', name: 'Guatemala', region: 'CENTRAL_AMERICA' },
  'PANAMA':       { iso: 'PA', name: 'Panama',    region: 'CENTRAL_AMERICA' },
  'URUGUAY':      { iso: 'UY', name: 'Uruguay',   region: 'LATAM' },
  'PARAGUAY':     { iso: 'PY', name: 'Paraguay',  region: 'LATAM' },
  'EL SALVADOR':  { iso: 'SV', name: 'El Salvador', region: 'CENTRAL_AMERICA' },
};

function inferMethodCategory(raw) {
  if (!raw) return 'other';
  const s = String(raw).toLowerCase();
  if (/card|webpay|izipay|amex|visa|mastercard|carnet/.test(s)) return 'cards';
  if (/cash|oxxo|paycash|punto|tienda|farmacia|7eleven|walmart|western/.test(s)) return 'cash';
  if (/qr|yape|plin|bre-b|bre b|chek/.test(s)) return 'qr_code';
  if (/wallet|mach|tpaga|daviplata|nequi|todito|movii|dale|truemoney|kakao/.test(s)) return 'wallet';
  if (/transfer|spei|pix|pse|debin|ach|codi|khipu|bank/.test(s)) return 'bank_transfer';
  if (/carrier|etisalat/.test(s)) return 'carrier_billing';
  return 'other';
}

function parseHrIndustries(text) {
  if (!text || text === 'N/A') return [];
  const s = String(text).toLowerCase();
  const out = [];
  if (s.includes('forex')) out.push('forex');
  if (s.includes('crypto')) out.push('crypto');
  if (s.includes('betting') || s.includes('sport betting')) out.push('sport_betting');
  if (s.includes('casino')) out.push('casino');
  if (s.includes('microcredit')) out.push('microcredit');
  if (s.includes('adult')) out.push('adult_content');
  return out;
}

function parseEmails(text) {
  if (!text) return [];
  const matches = String(text).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  return matches || [];
}

function inferResponsibleTeam(onboardingType, processText) {
  const t = (onboardingType || '').toLowerCase();
  const p = (processText || '').toLowerCase();
  if (t.includes('api') || p.includes('tech team')) return 'Tech';
  if (t.includes('mid') || t.includes('hr merchants') || p.includes('partnership')) return 'Partnership';
  return 'Multiple';
}

// Extrai um canal por linha do sheet padrão LATAM (13 colunas)
function parseLatamRow(row, country) {
  const provider = row.CHANNEL || row['Provider (Confidential)'] || '';
  const method = row.col_1 || row['Payment method'] || '';
  if (!provider && !method) return null;

  return {
    country: country.iso,
    country_name: country.name,
    region: country.region,
    provider: String(provider || 'Unknown').trim(),
    payment_method: String(method || '').trim(),
    method_category: inferMethodCategory(method),
    integration_type: String(row.col_2 || row['Integration Type'] || '').trim() || 'Direct',
    payin_or_payout: String(row.col_3 || row['Payin / Payout'] || 'PAYIN').trim().toUpperCase(),
    collection_points: String(row.col_4 || row['Collection Points'] || '').trim(),
    transaction_limits: String(row['COMMERCIAL TERMS'] || row['Transaction Limits'] || '').trim(),
    confirmation_time: String(row.col_6 || row['Confirmation time'] || '').trim(),
    operational_status: String(row.col_7 || row['Operational Status'] || 'ONLINE').trim().toUpperCase(),
    usage_status: String(row.col_8 || row['Usage Status'] || 'PRIMARY').trim().toUpperCase(),
    requires_onboarding: String(row['RISK AND COMPLIANCE'] || row.Onboarding || '').trim().toUpperCase() === 'YES',
    onboarding_type: String(row.col_10 || row['Type '] || row.Type || 'N/A').trim(),
    allowed_hr_industries: parseHrIndustries(row.col_11 || row['Allowed HR Industries '] || row['Allowed Industries ']),
    regulatory_requirements: String(row.col_12 || row.Comments || '').trim(),
    comments: String(row.col_12 || row.Comments || '').trim(),
    internal_responsible_team: inferResponsibleTeam(row.col_10, row['ONBOARDING PROCESS']),
    internal_responsible_emails: parseEmails(row['ONBOARDING PROCESS']),
    is_active: true,
  };
}

// Aba "SOUTH & CENTRAL AMERICAS" tem 1 coluna extra (Country na primeira posição)
function parseSouthCentralRow(row) {
  const countryText = String(row.CHANNEL || '').trim().toUpperCase();
  if (!countryText || !COUNTRY_TEXT_MAP[countryText]) return null;
  const country = COUNTRY_TEXT_MAP[countryText];
  const provider = row.col_1 || '';
  const method = row.col_2 || '';
  if (!provider && !method) return null;

  return {
    country: country.iso,
    country_name: country.name,
    region: country.region,
    provider: String(provider || 'Unknown').trim(),
    payment_method: String(method || '').trim(),
    method_category: inferMethodCategory(method),
    integration_type: String(row.col_3 || '').trim() || 'Direct',
    payin_or_payout: String(row.col_4 || 'PAYIN').trim().toUpperCase(),
    collection_points: String(row.col_5 || '').trim(),
    transaction_limits: String(row['COMMERCIAL TERMS'] || '').trim(),
    confirmation_time: String(row.col_7 || '').trim(),
    operational_status: String(row.col_8 || 'ONLINE').trim().toUpperCase(),
    usage_status: String(row.col_9 || 'PRIMARY').trim().toUpperCase(),
    requires_onboarding: String(row['RISK AND COMPLIANCE'] || '').trim().toUpperCase() === 'YES',
    onboarding_type: String(row.col_11 || 'N/A').trim(),
    allowed_hr_industries: parseHrIndustries(row.col_12),
    regulatory_requirements: String(row.col_13 || '').trim(),
    comments: String(row.col_13 || '').trim(),
    internal_responsible_team: inferResponsibleTeam(row.col_11, row['ONBOARDING PROCESS']),
    internal_responsible_emails: parseEmails(row['ONBOARDING PROCESS']),
    is_active: true,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { file_url, replace_existing = false } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // Baixa o XLSX
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) return Response.json({ error: 'Failed to download file' }, { status: 400 });
    const buf = await fileRes.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });

    // Limpa existentes se requisitado
    if (replace_existing) {
      const existing = await base44.asServiceRole.entities.GlobalCountryChannel.list('-created_date', 5000);
      for (const e of existing) {
        await base44.asServiceRole.entities.GlobalCountryChannel.delete(e.id);
      }
    }

    const stamp = new Date().toISOString();
    const allRecords = [];
    const stats = {};

    // Itera abas LATAM padrão
    for (const [sheetName, country] of Object.entries(SHEET_MAP)) {
      if (country.skip) { stats[sheetName] = 'skipped (Brazil)'; continue; }
      const sheet = wb.Sheets[sheetName];
      if (!sheet) { stats[sheetName] = 'not found'; continue; }

      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
      const records = rows
        .map(r => parseLatamRow(r, country))
        .filter(r => r && r.provider !== 'Provider (Confidential)' && r.payment_method !== 'Payment method');

      for (const rec of records) {
        rec.imported_from = `xlsx@${stamp}`;
        allRecords.push(rec);
      }
      stats[sheetName] = records.length;
    }

    // Aba agregada
    const aggSheet = wb.Sheets['SOUTH & CENTRAL AMERICAS'];
    if (aggSheet) {
      const rows = XLSX.utils.sheet_to_json(aggSheet, { defval: null });
      const records = rows.map(parseSouthCentralRow).filter(Boolean);
      for (const rec of records) {
        rec.imported_from = `xlsx@${stamp}`;
        allRecords.push(rec);
      }
      stats['SOUTH & CENTRAL AMERICAS'] = records.length;
    }

    // Insere em lotes de 50
    let inserted = 0;
    for (let i = 0; i < allRecords.length; i += 50) {
      const batch = allRecords.slice(i, i + 50);
      await base44.asServiceRole.entities.GlobalCountryChannel.bulkCreate(batch);
      inserted += batch.length;
    }

    return Response.json({
      success: true,
      inserted,
      replaced: replace_existing,
      stats,
      timestamp: stamp,
    });
  } catch (e) {
    console.error('importGlobalChannelsXlsx error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
});