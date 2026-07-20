// ============================================================
// QUESTIONÁRIO DE LEAD PIX v4.0 — DADOS CENTRALIZADOS
// 28 perguntas + condicionais | 11 flags | Score 0-100
// ============================================================

export const TIPO_NEGOCIO_OPTIONS = [
  {
    id: 'merchant',
    label: 'Merchant Direto',
    icon: '🏪',
    description: 'Recebo PIX para minha própria empresa. Não faço split/repasse para terceiros.',
    examples: 'Ex: e-commerce, restaurante, escola, SaaS, salão',
  },
  {
    id: 'intermediario',
    label: 'Intermediário',
    icon: '🔗',
    description: 'Recebo PIX EM NOME de outros (merchants/sellers) e faço split/repasse.',
    examples: 'Ex: gateway, marketplace, plataforma de delivery, PDV com split',
  },
];

export const SEGMENTO_MERCHANT_OPTIONS = [
  'E-commerce', 'Dropshipping', 'Infoprodutos', 'SaaS', 'Educação', 'Foodtech', 'Link de Pagamento', 'MPE'
];

export const SEGMENTO_INTERMEDIARIO_OPTIONS = [
  'Gateway/PSP', 'Marketplace', 'Plataforma Vertical'
];

export const CARGO_OPTIONS = ['Sócio/Proprietário', 'CEO/Diretor', 'Gerente', 'Financeiro', 'TI', 'Outro'];

export const MODELO_COBRANCA_PIX_OPTIONS = [
  'PIX avulso (venda única)',
  'PIX recorrente (mensalidade)',
  'PIX parcelado (PIX Garantido)',
  'Ambos',
];

export const QTD_MERCHANTS_OPTIONS = ['Até 50', '51-200', '201-1k', '1k-5k', '>5k'];

export const FINALIDADE_CONTA_OPTIONS = [
  'Só receber PIX de clientes',
  'Receber + fazer pagamentos (fornecedores, salários)',
  'Receber + split/repasse para merchants',
];

export const HORARIO_PIX_OPTIONS = ['Comercial 8-18h', 'Noturno 18-23h', '24 horas', 'Não sei'];

export const TEMPO_USO_OPTIONS = ['<6 meses', '6-12 meses', '1-2 anos', '>2 anos', 'É o primeiro'];

export const CUSTO_PIX_OPTIONS = [
  'Até R$0,50/PIX', 'R$0,50-R$1,00', 'R$1,00-R$2,00', '>R$2,00', '% sobre valor', 'Não sei / primeiro'
];

export const MOTIVO_BUSCA_OPTIONS = [
  'Taxa alta', 'Instabilidade/quedas', 'Atendimento ruim', 'Falta de funcionalidades',
  'Prazo de liquidação', 'Precisa de split/repasse', 'Primeiro parceiro', 'Outro'
];

export const SERVICOS_PIX_OPTIONS = [
  'PIX Recebimentos', 'PIX Pagamentos (cash-out)', 'PIX QR Code estático',
  'PIX QR Code dinâmico', 'PIX Cobrança (com vencimento)', 'PIX Garantido (parcelado)',
  'Split PIX', 'Conta Digital Pin Bank', 'Outro'
];

export const URGENCIA_OPTIONS = ['Imediato', 'Até 30 dias', '1-3 meses', 'Pesquisando'];
export const COMO_CONHECEU_OPTIONS = ['Google', 'Indicação', 'LinkedIn', 'Evento', 'Parceiro', 'Outro'];

export const FREE_EMAIL_DOMAINS = [
  'gmail.com','hotmail.com','outlook.com','yahoo.com','yahoo.com.br',
  'bol.com.br','uol.com.br','terra.com.br','ig.com.br','live.com',
  'msn.com','icloud.com','me.com','protonmail.com','zoho.com',
];

// ============================================================
// FLAGS SILENCIOSAS PIX (11)
// ============================================================
export function calculatePixSilentFlags(form, cnpjData) {
  const flags = {};
  
  // 1. ACCOUNT_TERMINATED
  flags.ACCOUNT_TERMINATED = form.contaEncerrada === 'Sim';

  // 2. TPV_EXCEEDS_REVENUE
  const tpv = parseFloat(form.tpvPix) || 0;
  const porteMap = { 'MEI': 81000, 'ME': 360000, 'EPP': 4800000 };
  const porte = cnpjData?.porte;
  const limiteAnual = porteMap[porte] || 999999999;
  flags.TPV_EXCEEDS_REVENUE = limiteAnual < 999999999 && (tpv * 12) > (limiteAnual * 1.3);

  // 3. YOUNG_COMPANY
  if (cnpjData?.data_inicio_atividade || cnpjData?.data_abertura) {
    const dt = cnpjData.data_inicio_atividade || cnpjData.data_abertura;
    const start = new Date(dt);
    const now = new Date();
    const years = (now - start) / (365.25 * 24 * 60 * 60 * 1000);
    flags.YOUNG_COMPANY = years < 1;
  }

  // 4. SPECIAL_SITUATION
  if (cnpjData?.situacao_especial) {
    flags.SPECIAL_SITUATION = !!cnpjData.situacao_especial && cnpjData.situacao_especial !== '';
  }

  // 5. PERSONAL_EMAIL
  if (form.email) {
    const domain = form.email.split('@')[1]?.toLowerCase();
    flags.PERSONAL_EMAIL = domain ? FREE_EMAIL_DOMAINS.includes(domain) : false;
  }

  // 6. REGULATED_SECTOR
  if (cnpjData?.cnae_fiscal) {
    const divisao = String(cnpjData.cnae_fiscal).substring(0, 2);
    flags.REGULATED_SECTOR = ['64', '65', '66'].includes(divisao) && form.tipoNegocio === 'merchant';
  }

  // 7. RESTRICTED_ACTIVITY
  flags.RESTRICTED_ACTIVITY = false; // Would need Anexo I check

  // 8. CNAE_SEGMENT_MISMATCH
  flags.CNAE_SEGMENT_MISMATCH = false; // Set by CnaeCoherenceAlert

  // 9. MEI_AS_INTERMEDIARY
  flags.MEI_AS_INTERMEDIARY = form.tipoNegocio === 'intermediario' && porte === 'MEI';

  // 10. HIGH_PIX_VOLUME_MEI
  flags.HIGH_PIX_VOLUME_MEI = tpv > 6750 && porte === 'MEI';

  // 11. INTERMEDIARY_WANTS_SPLIT
  flags.INTERMEDIARY_WANTS_SPLIT = form.tipoNegocio === 'intermediario' && 
    (form.servicosPix || []).includes('Split PIX');

  return flags;
}

// ============================================================
// LEAD SCORE PIX (0-100)
// ============================================================
export function calculatePixLeadScore(form, cnpjData, flags) {
  let score = 40;

  const tpv = parseFloat(form.tpvPix) || 0;
  if (tpv >= 1000000) score += 15;
  else if (tpv >= 500000) score += 10;
  else if (tpv >= 100000) score += 5;

  const capital = cnpjData?.capital_social || 0;
  if (capital >= 1000000) score += 10;
  else if (capital >= 100000) score += 5;

  if (cnpjData?.data_inicio_atividade || cnpjData?.data_abertura) {
    const dt = cnpjData.data_inicio_atividade || cnpjData.data_abertura;
    const years = (new Date() - new Date(dt)) / (365.25 * 24 * 60 * 60 * 1000);
    if (years >= 5) score += 10;
    else if (years >= 2) score += 5;
  }

  const cargosDecisores = ['Sócio/Proprietário', 'CEO/Diretor'];
  if (cargosDecisores.includes(form.cargo)) score += 10;

  if (form.email) {
    const domain = form.email.split('@')[1]?.toLowerCase();
    if (domain && !FREE_EMAIL_DOMAINS.includes(domain)) score += 10;
  }

  if (form.presencaDigital && form.presencaDigital !== 'Não possuo') score += 5;

  const porte = cnpjData?.porte;
  if (porte === 'DEMAIS') score += 5;
  else if (porte === 'EPP') score += 3;

  if (form.tipoNegocio === 'intermediario') score += 10;

  const qtd = form.qtdMerchants;
  if (['1k-5k', '>5k'].includes(qtd)) score += 5;

  // Penalties
  if (flags.ACCOUNT_TERMINATED) score -= 15;
  if (flags.HIGH_PIX_VOLUME_MEI) score -= 10;

  return Math.max(0, Math.min(100, score));
}

export function getPixScoreLabel(score) {
  if (score >= 80) return { label: 'Muito Quente', color: 'text-red-600', bg: 'bg-red-100' };
  if (score >= 60) return { label: 'Quente', color: 'text-orange-600', bg: 'bg-orange-100' };
  if (score >= 40) return { label: 'Morno', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { label: 'Frio', color: 'text-blue-600', bg: 'bg-blue-100' };
}