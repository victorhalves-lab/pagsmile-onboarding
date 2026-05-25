// Catálogo de categorias de método de pagamento Global, com labels trilíngues.

export const METHOD_CATEGORIES = [
  { code: 'cards',          label: { en: 'Debit & Credit Cards', pt: 'Cartão de Débito/Crédito', zh: '借记卡和信用卡' } },
  { code: 'bank_transfer',  label: { en: 'Bank Transfer',        pt: 'Transferência Bancária',   zh: '银行转账' } },
  { code: 'cash',           label: { en: 'Cash Payment',         pt: 'Pagamento em Dinheiro',    zh: '现金支付' } },
  { code: 'qr_code',        label: { en: 'QR Code',              pt: 'QR Code',                  zh: '二维码' } },
  { code: 'wallet',         label: { en: 'E-Wallet',             pt: 'Carteira Digital',         zh: '电子钱包' } },
  { code: 'carrier_billing',label: { en: 'Carrier Billing',      pt: 'Cobrança via Operadora',   zh: '运营商代收' } },
  { code: 'other',          label: { en: 'Other',                pt: 'Outro',                    zh: '其他' } },
];

export function methodLabel(code, lang = 'en') {
  const m = METHOD_CATEGORIES.find(x => x.code === code);
  return m ? (m.label[lang] || m.label.en) : code;
}

// Mapeia texto livre da planilha → category code canônico (heurística).
export function inferMethodCategory(rawMethod) {
  if (!rawMethod) return 'other';
  const s = String(rawMethod).toLowerCase();
  if (/card|webpay|izipay|amex|visa|mastercard|carnet/.test(s)) return 'cards';
  if (/cash|oxxo|paycash|punto|tienda|farmacia|7eleven|walmart|western/.test(s)) return 'cash';
  if (/qr|yape|plin|bre-b|bre b|chek/.test(s)) return 'qr_code';
  if (/wallet|mach|tpaga|daviplata|nequi|todito|movii|dale|truemoney|kakao/.test(s)) return 'wallet';
  if (/transfer|spei|pix|pse|debin|ach|codi|khipu|bank/.test(s)) return 'bank_transfer';
  if (/carrier|etisalat/.test(s)) return 'carrier_billing';
  return 'other';
}