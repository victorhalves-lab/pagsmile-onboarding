// Catálogo de alertas regulatórios automáticos por país × indústria HR.
// Usado pelo Proposal Builder quando o lead declara uma indústria sensível.

// Cada regra define: país, indústrias gatilho, severidade, mensagem.
export const REGULATORY_ALERTS = [
  // Argentina
  { country: 'AR', triggers: ['casino', 'sport_betting'],         severity: 'critical', message: 'Casino, Betting and Microcredit MUST HAVE local license in Argentina.' },
  { country: 'AR', triggers: ['microcredit'],                     severity: 'critical', message: 'Microcredit requires local license in Argentina.' },

  // Colombia
  { country: 'CO', triggers: ['casino', 'sport_betting'],         severity: 'critical', message: 'Casino and Betting MUST HAVE COLJUEGOS license to operate in Colombia.' },
  { country: 'CO', triggers: ['adult_content', 'crypto'],         severity: 'critical', message: 'Adult Content and Crypto are strictly prohibited in most Colombian channels.' },

  // Peru
  { country: 'PE', triggers: ['casino', 'sport_betting'],         severity: 'critical', message: 'Casino and Sports Betting must be registered with MINCETUR in Peru.' },
  { country: 'PE', triggers: ['microcredit', 'adult_content'],    severity: 'critical', message: 'Microcredit, Crypto and Adult Content are strictly prohibited in Peru.' },

  // Mexico
  { country: 'MX', triggers: ['casino', 'microcredit'],           severity: 'critical', message: 'Casino and Microcredit must have CNVB authorization in Mexico.' },
  { country: 'MX', triggers: ['crypto', 'adult_content'],         severity: 'high',     message: 'Crypto and Adult Content have very limited channel availability in Mexico.' },

  // Chile
  { country: 'CL', triggers: ['microcredit', 'crypto'],           severity: 'critical', message: 'Microcredit and Crypto are strictly prohibited in some Chilean channels (ETPAY).' },

  // Ecuador
  { country: 'EC', triggers: ['casino', 'sport_betting', 'forex'],severity: 'critical', message: 'Casino, Betting and Forex are strictly prohibited in Ecuador (KUSHKI channel).' },
  { country: 'EC', triggers: ['microcredit'],                     severity: 'high',     message: 'Microcredit merchants should have local license in Ecuador.' },

  // Costa Rica
  { country: 'CR', triggers: ['forex', 'crypto'],                 severity: 'critical', message: 'Forex Trading and Crypto merchants are not supported in Costa Rica.' },

  // Guatemala
  { country: 'GT', triggers: ['forex', 'crypto', 'adult_content'],severity: 'critical', message: 'Forex, Crypto and Adult Content are strictly prohibited in Guatemala.' },

  // Panama
  { country: 'PA', triggers: ['forex', 'crypto'],                 severity: 'critical', message: 'Forex Trading and Crypto merchants are not supported in Panama.' },

  // Bolivia
  { country: 'BO', triggers: ['casino', 'sport_betting', 'microcredit', 'adult_content'], severity: 'critical', message: 'Casino, Betting, Microcredit and Adult Content are strictly prohibited in Bolivia.' },

  // Uruguay
  { country: 'UY', triggers: ['microcredit', 'adult_content'],    severity: 'critical', message: 'Microcredit and Adult Content are strictly prohibited in Uruguay.' },

  // El Salvador
  { country: 'SV', triggers: ['forex', 'crypto', 'adult_content'],severity: 'high',     message: 'Forex, Crypto and Adult Content have very limited availability in El Salvador.' },

  // Paraguay
  { country: 'PY', triggers: ['casino', 'sport_betting'],         severity: 'high',     message: 'Casino and Betting require local license in Paraguay.' },

  // Nigeria / Kenya / Ghana (Africa)
  { country: 'NG', triggers: ['forex', 'casino', 'sport_betting', 'crypto'], severity: 'high', message: 'Nigeria: separate account and pricing for high-risk merchants. Channel onboarding mandatory.' },
  { country: 'KE', triggers: ['forex', 'casino', 'sport_betting', 'crypto'], severity: 'high', message: 'Kenya: separate account/pricing for high-risk merchants. Channel onboarding mandatory.' },
  { country: 'GH', triggers: ['forex', 'casino', 'sport_betting', 'crypto'], severity: 'high', message: 'Ghana: separate account/pricing for high-risk merchants. Channel onboarding mandatory.' },

  // Middle East
  { country: 'SA', triggers: ['casino', 'sport_betting', 'adult_content', 'crypto'], severity: 'critical', message: 'Saudi Arabia: Casino, Betting, Crypto and Adult Content strictly prohibited by Sharia law.' },
  { country: 'AE', triggers: ['casino', 'sport_betting', 'adult_content'],  severity: 'critical', message: 'UAE: Casino, Betting and Adult Content strictly prohibited.' },

  // Asia
  { country: 'KR', triggers: ['crypto', 'adult_content'],         severity: 'high',     message: 'South Korea: Crypto and Adult Content have strict regulatory limits.' },
  { country: 'TH', triggers: ['casino', 'sport_betting'],         severity: 'high',     message: 'Thailand: Casino and Betting are highly regulated; TrueMoney does not support H5 checkout (desktop/app only).' },
];

// Avalia alertas relevantes para uma combinação de country + industries declarados.
export function getAlertsForCountry(country, industries = []) {
  if (!country || !industries.length) return [];
  const set = new Set(industries.map(x => String(x).toLowerCase()));
  return REGULATORY_ALERTS
    .filter(r => r.country === country)
    .filter(r => r.triggers.some(t => set.has(t)));
}

// Avalia alertas para múltiplos países (proposta cobre vários mercados).
export function getAlertsForCountries(countries = [], industries = []) {
  return countries.flatMap(c => getAlertsForCountry(c, industries));
}

export const HR_INDUSTRIES = [
  { code: 'forex',         label: 'Forex' },
  { code: 'crypto',        label: 'Crypto' },
  { code: 'sport_betting', label: 'Sports Betting' },
  { code: 'casino',        label: 'Casino / Gambling' },
  { code: 'microcredit',   label: 'Microcredit' },
  { code: 'adult_content', label: 'Adult Content' },
];