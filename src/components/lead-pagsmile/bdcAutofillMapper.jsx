// ============================================================
// BDC → FORM FIELD MAPPER
// Converte dados BDC em valores das opções do questionário V5
// para autopreencher campos automaticamente.
// ============================================================

import { FATURAMENTO_ANUAL_OPTIONS, FUNCIONARIOS_OPTIONS, PLATAFORMA_OPTIONS } from './pagsmileQuestionnaireData';

/**
 * Mapeia IncomeRange do BDC para opção de FATURAMENTO_ANUAL.
 * BDC retorna strings tipo "UP TO 81 THOUSAND", "BETWEEN 81 THOUSAND AND 360 THOUSAND", etc.
 */
export function mapBdcIncomeRange(incomeRange) {
  if (!incomeRange || typeof incomeRange !== 'string') return null;
  const s = incomeRange.toLowerCase();

  // Mega (checar primeiro — expressões "acima" são mais específicas)
  if (/above 100|over 100|acima.*100|acima.*500mm|above 500|more than 100|>.*100|acima de 500/.test(s)) return 'Acima R$100M';
  // Grande (20M-100M)
  if (/100.*mil(lion|h)|20.*(mm|million|milh).*100|100mm|20.*?-.*?100|entre 20.*100|between 20.*100/.test(s)) return 'R$20M-R$100M';
  // Médio (4,8M-20M)
  if (/20.*mil(lion|h)|4\.?8.*(mm|million|milh).*20|20mm|entre 4\.?8.*20|between 4\.?8.*20/.test(s)) return 'R$4,8M-R$20M';
  // EPP (360k-4,8M)
  if (/4\.?8.*mil(lion|h)|4\.?8mm|4800k|entre 360.*4\.?8|between 360.*4\.?8/.test(s)) return 'Até R$4,8M (EPP)';
  // ME (81k-360k)
  if (/360.*thousand|360.*mil(?!h)|360k|entre 81.*360|between 81.*360/.test(s)) return 'Até R$360k (ME)';
  // MEI (até 81k)
  if (/81.*thousand|81.*mil(?!h)|81k|up to 81|ate 81/.test(s)) return 'Até R$81k (MEI)';

  return null;
}

/**
 * Mapeia EmployeesRange do BDC para opção de FUNCIONARIOS.
 * BDC retorna "1 EMPLOYEE", "2 TO 5", "6 TO 10", etc.
 */
export function mapBdcEmployeesRange(employeesRange) {
  if (!employeesRange || typeof employeesRange !== 'string') return null;
  const s = employeesRange.toLowerCase().trim();

  // Checar maiores primeiro para evitar match ambíguo
  if (/>=?\s*500|above 500|over 500|more than 500|acima.*500/.test(s)) return '>500';
  if (/101.*500|101 to 500|between 101.*500|entre 101.*500/.test(s)) return '101-500';
  if (/21.*100|21 to 50|51.*100|between 21.*100|entre 21.*100/.test(s)) return '21-100';
  if (/6.*20|6 to 10|11.*20|between 6.*20|entre 6.*20/.test(s)) return '6-20';
  if (/^2.*5|between 2.*5|2 to 5|entre 2.*5/.test(s)) return '2-5';
  if (/^1\s*(employee|emp|funcionario)?$|^1 to 1|apenas 1|somente 1/.test(s)) return 'Só eu';

  return null;
}

/**
 * Detecta a plataforma e-commerce a partir dos dados de domains do BDC.
 * Retorna a opção mapeada para o segmento, se encontrar.
 */
export function mapBdcPlatform(domains, segmento) {
  if (!Array.isArray(domains) || domains.length === 0) return null;
  if (!PLATAFORMA_OPTIONS[segmento]) return null;

  const validOptions = PLATAFORMA_OPTIONS[segmento];

  for (const d of domains) {
    const platform = String(d?.platform || '').toLowerCase();
    if (!platform) continue;

    // E-commerce & dropshipping platforms
    if (platform.includes('vtex')) return validOptions.find(o => o === 'VTEX') || null;
    if (platform.includes('shopify')) return validOptions.find(o => o === 'Shopify') || null;
    if (platform.includes('woocommerce') || platform.includes('woo')) return validOptions.find(o => o === 'WooCommerce') || null;
    if (platform.includes('magento')) return validOptions.find(o => o === 'Magento') || null;
    if (platform.includes('nuvemshop') || platform.includes('tiendanube')) return validOptions.find(o => o === 'Nuvemshop') || null;
    if (platform.includes('tray')) return validOptions.find(o => o === 'Tray') || null;
    if (platform.includes('bagy')) return validOptions.find(o => o === 'Bagy') || null;
    if (platform.includes('yampi')) return validOptions.find(o => o === 'Yampi') || null;
    // Infoprodutos
    if (platform.includes('hotmart')) return validOptions.find(o => o === 'Hotmart') || null;
    if (platform.includes('eduzz')) return validOptions.find(o => o === 'Eduzz') || null;
    if (platform.includes('kiwify')) return validOptions.find(o => o === 'Kiwify') || null;
    if (platform.includes('monetizze')) return validOptions.find(o => o === 'Monetizze') || null;
  }

  return null;
}

/**
 * Aplica autocomplete BDC → form, SEM sobrescrever campos já preenchidos pelo cliente.
 * Retorna objeto com as chaves que foram autopreenchidas (para exibir badges "✓ Sugerido via BDC").
 *
 * @param {object} bdc — resposta de bdcEnrichLead (level=quick ou full)
 * @param {object} form — form atual
 * @param {function} updateField — (field, value) => void
 * @returns {object} autofilledKeys — { [fieldName]: true } para campos que foram preenchidos
 */
export function applyBdcAutofill(bdc, form, updateField) {
  const autofilled = {};
  if (!bdc) return autofilled;

  const af = bdc.autoFill || {};
  const ai = bdc.activityIndicators || {};

  // --- Contato (Etapa 3) ---
  if (af.email && !form.email) {
    updateField('email', af.email);
    autofilled.email = true;
  }
  if (af.phone && !form.phone) {
    const digits = String(af.phone).replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 11) {
      updateField('phone', digits);
      autofilled.phone = true;
    }
  }

  // --- Volumetria (Etapa 5) ---
  if (!form.faturamentoAnual) {
    const fat = mapBdcIncomeRange(ai.incomeRange);
    if (fat) {
      updateField('faturamentoAnual', fat);
      autofilled.faturamentoAnual = true;
    }
  }
  if (!form.funcionarios) {
    const func = mapBdcEmployeesRange(ai.employeesRange);
    if (func) {
      updateField('funcionarios', func);
      autofilled.funcionarios = true;
    }
  }

  // --- Plataforma (Etapa 4) — depende do segmento já selecionado ---
  if (!form.plataforma && form.segmento && PLATAFORMA_OPTIONS[form.segmento]) {
    const plat = mapBdcPlatform(bdc.domains, form.segmento);
    if (plat) {
      updateField('plataforma', plat);
      autofilled.plataforma = true;
    }
  }

  return autofilled;
}