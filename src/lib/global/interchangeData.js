// Tabelas estáticas de Interchange — Visa & Mastercard, Card Not Present (USD).
// Usadas pelo GlobalInterchangeViewer e pelo seletor da página Criar Proposta Global.
// Fonte: tabelas internas Pagsmile Global 2025.

export const VISA_INTERCHANGE_RATES = [
  { program_name: 'Visa CPS/e-Commerce Basic',     card_type: 'Consumer Credit',  rate_percentage: 1.80, rate_fixed: 0.10 },
  { program_name: 'Visa CPS/e-Commerce Preferred', card_type: 'Consumer Credit',  rate_percentage: 1.90, rate_fixed: 0.10 },
  { program_name: 'Visa CPS/e-Commerce Signature', card_type: 'Consumer Credit',  rate_percentage: 2.30, rate_fixed: 0.10 },
  { program_name: 'Visa CPS/e-Commerce Infinite',  card_type: 'Consumer Credit',  rate_percentage: 2.50, rate_fixed: 0.10 },
  { program_name: 'Visa CPS/Debit Basic',          card_type: 'Consumer Debit',   rate_percentage: 1.65, rate_fixed: 0.15 },
  { program_name: 'Visa CPS/Business Card',        card_type: 'Commercial',       rate_percentage: 2.40, rate_fixed: 0.10 },
  { program_name: 'Visa CPS/Corporate',            card_type: 'Commercial',       rate_percentage: 2.60, rate_fixed: 0.10 },
];

export const MASTERCARD_INTERCHANGE_RATES = [
  { program_name: 'MC Merit I (e-Commerce)',       card_type: 'Consumer Credit',  rate_percentage: 1.89, rate_fixed: 0.10 },
  { program_name: 'MC Enhanced Merit I',           card_type: 'Consumer Credit',  rate_percentage: 1.99, rate_fixed: 0.10 },
  { program_name: 'MC World',                      card_type: 'Consumer Credit',  rate_percentage: 2.20, rate_fixed: 0.10 },
  { program_name: 'MC World Elite',                card_type: 'Consumer Credit',  rate_percentage: 2.50, rate_fixed: 0.10 },
  { program_name: 'MC Merit I Debit',              card_type: 'Consumer Debit',   rate_percentage: 1.70, rate_fixed: 0.15 },
  { program_name: 'MC Business',                   card_type: 'Commercial',       rate_percentage: 2.45, rate_fixed: 0.10 },
  { program_name: 'MC Corporate',                  card_type: 'Commercial',       rate_percentage: 2.65, rate_fixed: 0.10 },
];

// Cálculo dinâmico do resumo (low/avg/high) por bandeira + combinado.
function computeSummary(rates) {
  const pcts = rates.map(r => r.rate_percentage);
  const fixs = rates.map(r => r.rate_fixed);
  const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
  return {
    low:  { percentage: Math.min(...pcts), fixed: Math.min(...fixs) },
    avg:  { percentage: avg(pcts),         fixed: avg(fixs)         },
    high: { percentage: Math.max(...pcts), fixed: Math.max(...fixs) },
  };
}

const visaSum = computeSummary(VISA_INTERCHANGE_RATES);
const masterSum = computeSummary(MASTERCARD_INTERCHANGE_RATES);
const combinedSum = {
  low:  { percentage: (visaSum.low.percentage  + masterSum.low.percentage)  / 2, fixed: (visaSum.low.fixed  + masterSum.low.fixed)  / 2 },
  avg:  { percentage: (visaSum.avg.percentage  + masterSum.avg.percentage)  / 2, fixed: (visaSum.avg.fixed  + masterSum.avg.fixed)  / 2 },
  high: { percentage: (visaSum.high.percentage + masterSum.high.percentage) / 2, fixed: (visaSum.high.fixed + masterSum.high.fixed) / 2 },
};

export const INTERCHANGE_SUMMARY = { visa: visaSum, master: masterSum, combined: combinedSum };

// Opções para o seletor de Interchange na página Criar Proposta.
// Cada opção devolve { percentage, fixed } prontos para somar markup.
export const INTERCHANGE_OPTIONS = [
  { value: 'visa_low',      label: 'Visa — Menor',        data: visaSum.low },
  { value: 'visa_avg',      label: 'Visa — Média',        data: visaSum.avg },
  { value: 'visa_high',     label: 'Visa — Maior',        data: visaSum.high },
  { value: 'master_low',    label: 'Mastercard — Menor',  data: masterSum.low },
  { value: 'master_avg',    label: 'Mastercard — Média',  data: masterSum.avg },
  { value: 'master_high',   label: 'Mastercard — Maior',  data: masterSum.high },
  { value: 'combined_low',  label: 'Combinado — Menor',   data: combinedSum.low },
  { value: 'combined_avg',  label: 'Combinado — Média',   data: combinedSum.avg },
  { value: 'combined_high', label: 'Combinado — Maior',   data: combinedSum.high },
  { value: 'custom',        label: 'Personalizado',       data: { percentage: 0, fixed: 0 } },
];

export const MCC_OPTIONS = [
  '4722 - Travel Agencies',
  '5045 - Computers & Peripherals',
  '5411 - Grocery Stores',
  '5732 - Electronics',
  '5812 - Eating Places',
  '5912 - Drug Stores',
  '5942 - Book Stores',
  '5969 - Direct Marketing',
  '7273 - Dating Services',
  '7311 - Advertising Services',
  '7372 - Software (SaaS)',
  '7399 - Business Services',
  '7995 - Gambling',
  '8011 - Medical Services',
  '8299 - Educational Services',
  '8398 - Charitable Organizations',
];

export const TARGET_MARKETS = [
  'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia',
  'Peru', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands',
  'China', 'Japan', 'India', 'Singapore', 'Australia', 'UAE',
];