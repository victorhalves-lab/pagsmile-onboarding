// ============================================================
// QUESTIONÁRIO DE LEADS PAGSMILE v5.0 — DADOS CENTRALIZADOS
// 10 segmentos | 45 perguntas + 18 condicionais + 16 flags
// ============================================================

export const SEGMENTS = [
  {
    id: 'gateway',
    label: 'Gateway / PSP',
    description: 'Processa pagamentos para sub-sellers em sites próprios. Seus clientes (merchants) têm checkout no site deles, você processa por trás.',
    group: 'intermediario',
    icon: '🔗',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    description: 'Sub-sellers vendem dentro do mesmo site/app. Compradores compram de vários vendedores em um só lugar (ex: Mercado Livre, Shopee, iFood).',
    group: 'intermediario',
    icon: '🏪',
  },
  {
    id: 'plataforma_vertical',
    label: 'Plataforma Vertical',
    description: 'Foodtech, PDV, agendamento, ticketing, fitness, delivery com split. Software vertical que processa pagamentos para os estabelecimentos da sua rede.',
    group: 'intermediario',
    icon: '📱',
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    description: 'Loja virtual com estoque e entrega. Você vende seus próprios produtos online e faz a logística de envio.',
    group: 'merchant',
    icon: '🛒',
  },
  {
    id: 'dropshipping',
    label: 'Dropshipping',
    description: 'Loja sem estoque, fornecedor envia direto. Você vende online mas o fornecedor cuida do estoque e entrega ao cliente final.',
    group: 'merchant',
    icon: '📦',
  },
  {
    id: 'infoprodutos',
    label: 'Infoprodutos',
    description: 'Cursos, e-books, mentorias, áreas de membros, co-produções com afiliados. Produtos digitais vendidos online, podendo ter rede de afiliados (Hotmart/Eduzz/Kiwify).',
    group: 'merchant',
    icon: '🎓',
  },
  {
    id: 'saas',
    label: 'SaaS',
    description: 'Software por assinatura recorrente. Seus clientes pagam mensalidade para usar seu software/plataforma.',
    group: 'merchant',
    icon: '💻',
  },
  {
    id: 'educacao',
    label: 'Educação',
    description: 'Escola, faculdade, curso presencial. Instituição de ensino com mensalidades e matrículas (presencial ou híbrido).',
    group: 'merchant',
    icon: '🏫',
  },
  {
    id: 'link_pagamento',
    label: 'Link de Pagamento',
    description: 'Vende por Instagram/WhatsApp com links. Não tem loja virtual, envia link de pagamento direto ao cliente por redes sociais ou mensagem.',
    group: 'merchant',
    icon: '🔗',
  },
  {
    id: 'mpe',
    label: 'MPE',
    description: 'Pequeno negócio local. Loja física, prestador de serviço, autônomo. Fatura até R$4,8M/ano.',
    group: 'merchant',
    icon: '🏠',
  },
];

export const CARGO_OPTIONS = [
  'Sócio/Proprietário', 'CEO/Diretor', 'Gerente', 'Financeiro', 'TI', 'Marketing'
];

export const MODELO_COBRANCA_OPTIONS = [
  'Venda única', 'Parcelado 2-12x', 'Assinatura/Recorrência', 'Ambos'
];

export const SUB_SELLERS_OPTIONS = ['Até 50', '51-200', '201-1k', '1k-5k', '>5k'];

export const PLATAFORMA_OPTIONS = {
  ecommerce: ['VTEX', 'Nuvemshop', 'Tray', 'Shopify', 'WooCommerce', 'Magento', 'Bagy', 'Yampi', 'Proprietária', 'Outra'],
  dropshipping: ['VTEX', 'Nuvemshop', 'Tray', 'Shopify', 'WooCommerce', 'Magento', 'Bagy', 'Yampi', 'Proprietária', 'Outra'],
  plataforma_vertical: ['Goomer', 'Cardápio Web', 'Anota AI', 'Saipos', 'Próprio', 'Outro'],
  infoprodutos: ['Hotmart', 'Eduzz', 'Kiwify', 'Monetizze', 'Própria', 'Outro'],
};

export const ANTIFRAUDE_OPTIONS = ['Antifraude + 3DS', 'Só antifraude', 'Só 3DS', 'Não possuo'];
export const ANTIFRAUDE_SEGMENTS = ['gateway', 'marketplace', 'plataforma_vertical', 'ecommerce', 'dropshipping', 'infoprodutos'];

// Condicionais Gateway
export const LICENCA_BCB_OPTIONS = ['Sim, licença própria BCB', 'Sim, via BaaS/parceiro', 'Não, nem BaaS', 'Não sei'];
export const SPLIT_PAGAMENTO_OPTIONS = ['Sim, split automático', 'Sim, manual', 'Não'];

// Condicionais Marketplace
export const TAKE_RATE_OPTIONS = ['<5%', '5-10%', '10-20%', '20-30%', '>30%'];
export const KYC_SUB_SELLERS_OPTIONS = ['Sim, completo', 'Sim, básico', 'Não faço', 'Em implantação'];

// Condicionais SaaS
export const CHURN_OPTIONS = ['<2%', '2-5%', '5-10%', '>10%', 'Não sei'];
export const PRICING_SAAS_OPTIONS = ['Flat mensal', 'Per-user', 'Tiers/planos', 'Usage-based', 'Freemium + paid'];

// Condicionais Infoprodutos
export const AFILIADOS_OPTIONS = ['Sem afiliados', 'Até 10 afiliados', '10-100 afiliados', '>100 afiliados', 'Rede de afiliados (Hotmart/Eduzz)'];
export const GARANTIA_OPTIONS = ['7 dias (padrão CDC)', '15 dias', '30 dias', 'Sem garantia', 'Garantia condicional'];
export const PCT_AFILIADOS_OPTIONS = ['0% (sem afiliados)', '<20%', '20-50%', '>50%'];

// Condicionais Plataforma Vertical
export const VERTICAL_OPTIONS = ['Foodtech/Delivery', 'PDV/Loja', 'Agendamento/Booking', 'Ticketing/Eventos', 'Fitness/Wellness'];

// Faturamento
export const FATURAMENTO_ANUAL_OPTIONS = [
  'Até R$81k (MEI)', 'Até R$360k (ME)', 'Até R$4,8M (EPP)', 
  'R$4,8M-R$20M', 'R$20M-R$100M', 'Acima R$100M'
];
export const FUNCIONARIOS_OPTIONS = ['Só eu', '2-5', '6-20', '21-100', '101-500', '>500'];

// Processamento atual
export const JA_PROCESSA_OPTIONS = ['Sim, já processo', 'Não, estou começando'];
export const ANTECIPACAO_OPTIONS = ['Sim, D+0/D+1', 'Sim, D+15/D+30', 'Não uso', 'Não sei o que é'];
export const SABE_TAXAS_OPTIONS = ['Sim, sei exatamente', 'Sei mais ou menos', 'Não sei / prefiro não informar'];

export const PROCESSADOR_OPTIONS = [
  'Cielo', 'Rede', 'Stone', 'PagSeguro', 'Mercado Pago', 'Getnet',
  'Adyen', 'Stripe', 'Pagar.me', 'Zoop', 'Juno', 'Vindi', 'Asaas', 'Nenhum'
];

export const SATISFACAO_OPTIONS = ['Muito satisfeito', 'Satisfeito', 'Neutro', 'Insatisfeito', 'Muito insatisfeito'];
export const DOR_ATUAL_OPTIONS = [
  'Taxas altas', 'Suporte ruim', 'Instabilidade/quedas', 
  'Demora na liquidação', 'Falta de funcionalidades', 'Chargeback alto'
];

// Compliance
export const ENCERRADO_OPTIONS = ['Nunca', 'Sim, 1 vez', 'Sim, mais de 1 vez'];
export const CHARGEBACK_OPTIONS = ['<1% (saudável)', '1-2% (atenção)', '>2% (crítico)', 'Não sei', 'N/A - não processo cartão'];
export const MED_PIX_OPTIONS = ['N/A', '<0,3%', '0,3-0,5%', '0,5-1%', '>1%'];

// Fechamento
export const URGENCIA_OPTIONS = ['Imediato (<1 semana)', 'Este mês', 'Próximos 2-3 meses', 'Estou apenas cotando'];
export const CRESCIMENTO_OPTIONS = ['Manter estável', 'Crescer até 30%', 'Crescer 30-100%', 'Mais que dobrar (>100%)'];
export const COMO_CONHECEU_OPTIONS = ['Google/Busca', 'Indicação', 'LinkedIn', 'Evento', 'Parceiro'];

// ============================================================
// FREE EMAIL DOMAINS (para flag PERSONAL_EMAIL)
// ============================================================
export const FREE_EMAIL_DOMAINS = [
  'gmail.com','hotmail.com','outlook.com','yahoo.com','yahoo.com.br',
  'bol.com.br','uol.com.br','terra.com.br','ig.com.br','live.com',
  'msn.com','icloud.com','me.com','protonmail.com','zoho.com',
  'mail.com','aol.com','yandex.com','gmx.com','tutanota.com'
];

// ============================================================
// CÁLCULO DE SCORE (0-100)
// ============================================================
export function calculateLeadScore(form, flags) {
  let score = 40; // Base

  // Bônus
  if (form.email) {
    const domain = form.email.split('@')[1]?.toLowerCase();
    if (domain && !FREE_EMAIL_DOMAINS.includes(domain)) score += 10; // E-mail corporativo
  }
  const cargosDecisores = ['Sócio/Proprietário', 'CEO/Diretor'];
  if (cargosDecisores.includes(form.cargo)) score += 10;
  
  const tpv = parseFloat(form.tpvMensal) || 0;
  if (tpv >= 200000) score += 10;

  const subSellers = form.qtdSubSellers;
  if (['1k-5k', '>5k'].includes(subSellers)) score += 5;

  if (form.urgencia === 'Imediato (<1 semana)') score += 15;
  if (form.crescimento === 'Mais que dobrar (>100%)') score += 5;
  if (['Insatisfeito', 'Muito insatisfeito'].includes(form.satisfacao)) score += 5;

  // Penalidades
  if (flags.TERMINATED_BEFORE) score -= 15;
  if (flags.HIGH_CHARGEBACK) score -= 10;
  if (flags.HIGH_MED_PIX) score -= 10;
  if (flags.HIGH_REFUND_POLICY) score -= 5;
  if (flags.JUST_QUOTING) score -= 5;

  return Math.max(0, Math.min(100, score));
}

// ============================================================
// FLAGS SILENCIOSAS (16)
// ============================================================
export function calculateSilentFlags(form, cnpjData) {
  const flags = {};
  
  // 1. PERSONAL_EMAIL
  if (form.email) {
    const domain = form.email.split('@')[1]?.toLowerCase();
    flags.PERSONAL_EMAIL = domain ? FREE_EMAIL_DOMAINS.includes(domain) : false;
  }

  // 2. NO_WEBSITE
  flags.NO_WEBSITE = form.presencaDigital === 'Não possuo' || !form.presencaDigital;

  // 3. NO_ANTIFRAUDE
  const tpv = parseFloat(form.tpvMensal) || 0;
  const segWithAntifraude = ['ecommerce', 'dropshipping'];
  flags.NO_ANTIFRAUDE = form.antifraude === 'Não possuo' && segWithAntifraude.includes(form.segmento) && tpv > 100000;

  // 4. HIGH_CHARGEBACK
  flags.HIGH_CHARGEBACK = form.chargeback === '>2% (crítico)';

  // 5. HIGH_MED_PIX
  flags.HIGH_MED_PIX = form.medPix === '>1%';

  // 6. TERMINATED_BEFORE
  flags.TERMINATED_BEFORE = form.encerrado !== 'Nunca' && !!form.encerrado;

  // 7. TPV_EXCEEDS_REVENUE
  const faturamentoMap = {
    'Até R$81k (MEI)': 81000,
    'Até R$360k (ME)': 360000,
    'Até R$4,8M (EPP)': 4800000,
    'R$4,8M-R$20M': 20000000,
    'R$20M-R$100M': 100000000,
    'Acima R$100M': 999999999,
  };
  const fatAnual = faturamentoMap[form.faturamentoAnual] || 0;
  flags.TPV_EXCEEDS_REVENUE = fatAnual > 0 && (tpv * 12) > fatAnual;

  // 8. NEW_MERCHANT
  flags.NEW_MERCHANT = form.jaProcessa === 'Não, estou começando';

  // 9. CNPJ_SITUACAO_IRREGULAR
  if (cnpjData) {
    flags.CNPJ_SITUACAO_IRREGULAR = cnpjData.situacao_cadastral && 
      !String(cnpjData.situacao_cadastral).toLowerCase().includes('ativa');
  }

  // 10. EMPRESA_NOVA
  if (cnpjData?.data_abertura) {
    const abertura = new Date(cnpjData.data_abertura);
    const hoje = new Date();
    const meses = (hoje.getFullYear() - abertura.getFullYear()) * 12 + (hoje.getMonth() - abertura.getMonth());
    flags.EMPRESA_NOVA = meses < 6;
  }

  // 11. SETOR_REGULADO
  if (cnpjData?.cnae_fiscal) {
    const divisao = String(cnpjData.cnae_fiscal).substring(0, 2);
    flags.SETOR_REGULADO = ['64', '65', '66'].includes(divisao);
  }

  // 12. CNAE_MISMATCH
  flags.CNAE_MISMATCH = false; // Set by CnaeCoherenceAlert

  // 13. VOLUME_INCOMPATIVEL
  flags.VOLUME_INCOMPATIVEL = false; // Complex: requires porte vs volume mapping

  // 14. JUST_QUOTING
  flags.JUST_QUOTING = form.urgencia === 'Estou apenas cotando';

  // 15. LOW_TICKET
  const ticket = parseFloat(form.ticketMedio) || 0;
  flags.LOW_TICKET = ticket > 0 && ticket < 10;

  // 16. HIGH_REFUND_POLICY
  flags.HIGH_REFUND_POLICY = ['30 dias', 'Garantia condicional'].includes(form.garantia);

  return flags;
}

// Score label
export function getScoreLabel(score) {
  if (score >= 80) return { label: 'Muito Quente', color: 'text-red-600', bg: 'bg-red-100' };
  if (score >= 60) return { label: 'Quente', color: 'text-orange-600', bg: 'bg-orange-100' };
  if (score >= 40) return { label: 'Morno', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { label: 'Frio', color: 'text-blue-600', bg: 'bg-blue-100' };
}