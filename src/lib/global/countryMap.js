// Mapa de países usados nas propostas Global e KYC.
// Cada país tem: code (ISO-2), name (em 3 idiomas), flag (emoji), region (US/EU/LATAM/APAC/MEA).
// Lista enxuta — 30 países principais cobrindo +95% do TPV global Pagsmile.

export const COUNTRIES = [
  // Américas
  { code: 'US', flag: '🇺🇸', region: 'NA',   name: { en: 'United States',   pt: 'Estados Unidos', zh: '美国' } },
  { code: 'CA', flag: '🇨🇦', region: 'NA',   name: { en: 'Canada',          pt: 'Canadá',         zh: '加拿大' } },
  { code: 'MX', flag: '🇲🇽', region: 'LATAM',name: { en: 'Mexico',          pt: 'México',         zh: '墨西哥' } },
  { code: 'BR', flag: '🇧🇷', region: 'LATAM',name: { en: 'Brazil',          pt: 'Brasil',         zh: '巴西' } },
  { code: 'AR', flag: '🇦🇷', region: 'LATAM',name: { en: 'Argentina',       pt: 'Argentina',      zh: '阿根廷' } },
  { code: 'CL', flag: '🇨🇱', region: 'LATAM',name: { en: 'Chile',           pt: 'Chile',          zh: '智利' } },
  { code: 'CO', flag: '🇨🇴', region: 'LATAM',name: { en: 'Colombia',        pt: 'Colômbia',       zh: '哥伦比亚' } },
  { code: 'PE', flag: '🇵🇪', region: 'LATAM',name: { en: 'Peru',            pt: 'Peru',           zh: '秘鲁' } },
  { code: 'UY', flag: '🇺🇾', region: 'LATAM',name: { en: 'Uruguay',         pt: 'Uruguai',        zh: '乌拉圭' } },

  // Europa
  { code: 'GB', flag: '🇬🇧', region: 'EU',   name: { en: 'United Kingdom',  pt: 'Reino Unido',    zh: '英国' } },
  { code: 'DE', flag: '🇩🇪', region: 'EU',   name: { en: 'Germany',         pt: 'Alemanha',       zh: '德国' } },
  { code: 'FR', flag: '🇫🇷', region: 'EU',   name: { en: 'France',          pt: 'França',         zh: '法国' } },
  { code: 'ES', flag: '🇪🇸', region: 'EU',   name: { en: 'Spain',           pt: 'Espanha',        zh: '西班牙' } },
  { code: 'IT', flag: '🇮🇹', region: 'EU',   name: { en: 'Italy',           pt: 'Itália',         zh: '意大利' } },
  { code: 'NL', flag: '🇳🇱', region: 'EU',   name: { en: 'Netherlands',     pt: 'Holanda',        zh: '荷兰' } },
  { code: 'PT', flag: '🇵🇹', region: 'EU',   name: { en: 'Portugal',        pt: 'Portugal',       zh: '葡萄牙' } },
  { code: 'IE', flag: '🇮🇪', region: 'EU',   name: { en: 'Ireland',         pt: 'Irlanda',        zh: '爱尔兰' } },

  // Ásia-Pacífico
  { code: 'CN', flag: '🇨🇳', region: 'APAC', name: { en: 'China',           pt: 'China',          zh: '中国' } },
  { code: 'HK', flag: '🇭🇰', region: 'APAC', name: { en: 'Hong Kong',       pt: 'Hong Kong',      zh: '香港' } },
  { code: 'JP', flag: '🇯🇵', region: 'APAC', name: { en: 'Japan',           pt: 'Japão',          zh: '日本' } },
  { code: 'KR', flag: '🇰🇷', region: 'APAC', name: { en: 'South Korea',     pt: 'Coreia do Sul',  zh: '韩国' } },
  { code: 'IN', flag: '🇮🇳', region: 'APAC', name: { en: 'India',           pt: 'Índia',          zh: '印度' } },
  { code: 'SG', flag: '🇸🇬', region: 'APAC', name: { en: 'Singapore',       pt: 'Singapura',      zh: '新加坡' } },
  { code: 'AU', flag: '🇦🇺', region: 'APAC', name: { en: 'Australia',       pt: 'Austrália',      zh: '澳大利亚' } },
  { code: 'TH', flag: '🇹🇭', region: 'APAC', name: { en: 'Thailand',        pt: 'Tailândia',      zh: '泰国' } },
  { code: 'ID', flag: '🇮🇩', region: 'APAC', name: { en: 'Indonesia',       pt: 'Indonésia',      zh: '印度尼西亚' } },
  { code: 'PH', flag: '🇵🇭', region: 'APAC', name: { en: 'Philippines',     pt: 'Filipinas',      zh: '菲律宾' } },
  { code: 'VN', flag: '🇻🇳', region: 'APAC', name: { en: 'Vietnam',         pt: 'Vietnã',         zh: '越南' } },

  // Oriente Médio / África
  { code: 'AE', flag: '🇦🇪', region: 'MEA',  name: { en: 'UAE',             pt: 'Emirados Árabes',zh: '阿联酋' } },
  { code: 'SA', flag: '🇸🇦', region: 'MEA',  name: { en: 'Saudi Arabia',    pt: 'Arábia Saudita', zh: '沙特阿拉伯' } },
  { code: 'ZA', flag: '🇿🇦', region: 'MEA',  name: { en: 'South Africa',    pt: 'África do Sul',  zh: '南非' } },
  { code: 'IL', flag: '🇮🇱', region: 'MEA',  name: { en: 'Israel',          pt: 'Israel',         zh: '以色列' } },
];

// Helpers
export const REGIONS = [
  { code: 'NA',    label: { en: 'North America', pt: 'América do Norte', zh: '北美' } },
  { code: 'LATAM', label: { en: 'Latin America', pt: 'América Latina',   zh: '拉丁美洲' } },
  { code: 'EU',    label: { en: 'Europe',        pt: 'Europa',           zh: '欧洲' } },
  { code: 'APAC',  label: { en: 'Asia-Pacific',  pt: 'Ásia-Pacífico',    zh: '亚太' } },
  { code: 'MEA',   label: { en: 'Middle East & Africa', pt: 'Oriente Médio & África', zh: '中东和非洲' } },
];

// Recebe um nome (string) e devolve o objeto país, tentando match por code OU por name.en/pt/zh.
export function resolveCountry(input) {
  if (!input) return null;
  const norm = String(input).trim().toLowerCase();
  return COUNTRIES.find(c =>
    c.code.toLowerCase() === norm ||
    c.name.en.toLowerCase() === norm ||
    c.name.pt.toLowerCase() === norm ||
    c.name.zh === input
  ) || null;
}

// Devolve nome do país no idioma desejado, com fallback en.
export function countryName(code, lang = 'en') {
  const c = COUNTRIES.find(x => x.code === code);
  if (!c) return code;
  return c.name[lang] || c.name.en;
}

// Lista plana de nomes em idioma — usada pelo seletor de mercados-alvo legado.
export function countryNamesByLang(lang = 'en') {
  return COUNTRIES.map(c => c.name[lang] || c.name.en);
}