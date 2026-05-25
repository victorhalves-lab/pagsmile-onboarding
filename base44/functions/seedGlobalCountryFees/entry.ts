import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Seed dos impostos/taxas regulatórias por país (VAT, IOF, GMF, Withholding).
 * Baseado no PDF "Pagsmile Pricing Proposal - Roblox". Admin-only.
 */

const FEES = [
  { country: 'AR', country_name: 'Argentina', tax_type: 'VAT',         tax_code: 'VAT', percentage: 21,  applies_to: 'processing_fee', label_en: 'VAT: 21% of the processing fee',  label_pt: 'IVA: 21% sobre a taxa de processamento',  label_zh: '增值税:处理费的 21%' },
  { country: 'AR', country_name: 'Argentina', tax_type: 'GMF',         tax_code: 'GMF', percentage: 0.6, applies_to: 'total_amount',   label_en: 'GMF: 0.6% to be applied to the total deposit amount', label_pt: 'GMF: 0,6% sobre o valor total do depósito', label_zh: 'GMF:存款总额的 0.6%' },

  { country: 'MX', country_name: 'Mexico',    tax_type: 'VAT', tax_code: 'VAT', percentage: 16, applies_to: 'processing_fee', label_en: 'VAT: 16% of the processing fee', label_pt: 'IVA: 16% sobre a taxa de processamento', label_zh: '增值税:处理费的 16%' },
  { country: 'CO', country_name: 'Colombia',  tax_type: 'VAT', tax_code: 'VAT', percentage: 19, applies_to: 'processing_fee', label_en: 'VAT: 19% of the processing fee', label_pt: 'IVA: 19% sobre a taxa de processamento', label_zh: '增值税:处理费的 19%' },
  { country: 'CL', country_name: 'Chile',     tax_type: 'VAT', tax_code: 'VAT', percentage: 19, applies_to: 'processing_fee', label_en: 'VAT: 19% of the processing fee', label_pt: 'IVA: 19% sobre a taxa de processamento', label_zh: '增值税:处理费的 19%' },
  { country: 'PE', country_name: 'Peru',      tax_type: 'VAT', tax_code: 'VAT', percentage: 18, applies_to: 'processing_fee', label_en: 'VAT: 18% of the processing fee', label_pt: 'IVA: 18% sobre a taxa de processamento', label_zh: '增值税:处理费的 18%' },

  { country: 'EC', country_name: 'Ecuador',   tax_type: 'Withholding', tax_code: 'WH', percentage: 5, applies_to: 'settlement', label_en: '5% withholding tax applied at settlement', label_pt: 'Retenção de 5% aplicada no settlement', label_zh: '结算时扣除 5% 预扣税' },

  { country: 'CR', country_name: 'Costa Rica',tax_type: 'VAT', tax_code: 'VAT', percentage: 13, applies_to: 'processing_fee', label_en: 'VAT: 13% of the processing fee', label_pt: 'IVA: 13% sobre a taxa de processamento', label_zh: '增值税:处理费的 13%' },
  { country: 'BO', country_name: 'Bolivia',   tax_type: 'VAT', tax_code: 'VAT', percentage: 13, applies_to: 'processing_fee', label_en: 'VAT: 13% of the processing fee', label_pt: 'IVA: 13% sobre a taxa de processamento', label_zh: '增值税:处理费的 13%' },
  { country: 'SV', country_name: 'El Salvador',tax_type:'VAT', tax_code: 'VAT', percentage: 13, applies_to: 'processing_fee', label_en: 'VAT: 13% of the processing fee', label_pt: 'IVA: 13% sobre a taxa de processamento', label_zh: '增值税:处理费的 13%' },

  { country: 'GT', country_name: 'Guatemala', tax_type: 'VAT', tax_code: 'VAT', percentage: 12, applies_to: 'processing_fee', label_en: 'VAT: 12% of the processing fee', label_pt: 'IVA: 12% sobre a taxa de processamento', label_zh: '增值税:处理费的 12%' },
  { country: 'PA', country_name: 'Panama',    tax_type: 'VAT', tax_code: 'VAT', percentage: 7,  applies_to: 'processing_fee', label_en: 'VAT: 7% of the processing fee',  label_pt: 'IVA: 7% sobre a taxa de processamento',  label_zh: '增值税:处理费的 7%' },
  { country: 'PY', country_name: 'Paraguay',  tax_type: 'VAT', tax_code: 'VAT', percentage: 10, applies_to: 'processing_fee', label_en: 'VAT: 10% of the processing fee', label_pt: 'IVA: 10% sobre a taxa de processamento', label_zh: '增值税:处理费的 10%' },
  { country: 'UY', country_name: 'Uruguay',   tax_type: 'VAT', tax_code: 'VAT', percentage: 21, applies_to: 'processing_fee', label_en: 'VAT: 21% of the processing fee', label_pt: 'IVA: 21% sobre a taxa de processamento', label_zh: '增值税:处理费的 21%' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    // Limpa existentes
    const existing = await base44.asServiceRole.entities.GlobalCountryFee.list('-created_date', 500);
    for (const e of existing) {
      await base44.asServiceRole.entities.GlobalCountryFee.delete(e.id);
    }

    const records = FEES.map(f => ({ ...f, is_active: true }));
    await base44.asServiceRole.entities.GlobalCountryFee.bulkCreate(records);

    return Response.json({ success: true, inserted: records.length });
  } catch (e) {
    console.error('seedGlobalCountryFees error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
});