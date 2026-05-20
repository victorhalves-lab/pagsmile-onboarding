/**
 * V5.2 — Catálogo Canônico dos 15 Segmentos
 * ──────────────────────────────────────────
 * Fonte da verdade única. Importe de cá em TODA tela/componente que
 * lida com segmento (Lead, Proposal, Subseller, Compliance, Insights).
 *
 * Fonte documental: docs/V5_2_BLOCO5_SEGMENTOS_PARTE1-4.md
 *
 * Os 5 segmentos NOVOS em V5.2 estão marcados com `isNewInV5_2: true`.
 * Os 10 segmentos legados continuam funcionando 1:1 com V4/V5.1.
 *
 * IMPORTANTE: o id é o valor canônico salvo no banco. NUNCA alterar os ids
 * dos 10 legados (compatibilidade com Lead/Proposal antigos).
 */

export const V5_2_SEGMENTS = [
  // ── INTERMEDIÁRIOS ──
  {
    id: 'gateway',
    label: 'Gateway / PSP',
    shortLabel: 'Gateway',
    description: 'Processa pagamentos para sub-sellers em sites próprios.',
    longDescription: 'Seus clientes (merchants) têm checkout no site deles, você processa por trás. Pode atuar como BaaS, sub-credenciador ou facilitador.',
    group: 'intermediario',
    icon: '🔗',
    color: 'indigo',
    isNewInV5_2: false,
    requiresCapabilities: ['splits/subseller', 'cap_financial_capacity_validation'],
    defaultTier: 'tier_2',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    shortLabel: 'Marketplace',
    description: 'Sub-sellers vendem dentro do mesmo site/app.',
    longDescription: 'Compradores compram de vários vendedores em um só lugar (ex: Mercado Livre, Shopee, iFood). Marketplace é SEMPRE Tier 2 fixo em V5.2.',
    group: 'intermediario',
    icon: '🏪',
    color: 'violet',
    isNewInV5_2: false,
    requiresCapabilities: ['splits/subseller'],
    defaultTier: 'tier_2',
    fixedTier: true, // marketplace SEMPRE tier_2 (decisão de negócio V5.2)
  },
  {
    id: 'plataforma_vertical',
    label: 'Plataforma Vertical',
    shortLabel: 'Plat. Vertical',
    description: 'Foodtech, PDV, agendamento, ticketing, fitness, delivery com split.',
    longDescription: 'Software vertical que processa pagamentos para os estabelecimentos da sua rede.',
    group: 'intermediario',
    icon: '📱',
    color: 'blue',
    isNewInV5_2: false,
    requiresCapabilities: ['splits/subseller'],
    defaultTier: 'tier_2',
  },

  // ── MERCHANTS DIRETOS ──
  {
    id: 'ecommerce',
    label: 'E-commerce',
    shortLabel: 'E-commerce',
    description: 'Loja virtual com estoque e entrega.',
    longDescription: 'Você vende seus próprios produtos online e faz a logística de envio.',
    group: 'merchant',
    icon: '🛒',
    color: 'emerald',
    isNewInV5_2: false,
    requiresCapabilities: [],
    defaultTier: 'tier_1',
  },
  {
    id: 'dropshipping',
    label: 'Dropshipping',
    shortLabel: 'Dropshipping',
    description: 'Loja sem estoque, fornecedor envia direto.',
    longDescription: 'Você vende online mas o fornecedor cuida do estoque e entrega ao cliente final.',
    group: 'merchant',
    icon: '📦',
    color: 'orange',
    isNewInV5_2: false,
    requiresCapabilities: ['cap_financial_capacity_validation'],
    defaultTier: 'tier_1',
  },
  {
    id: 'infoprodutos',
    label: 'Infoprodutos',
    shortLabel: 'Infoprodutos',
    description: 'Cursos, e-books, mentorias, co-produções com afiliados.',
    longDescription: 'Produtos digitais vendidos online, podendo ter rede de afiliados (Hotmart/Eduzz/Kiwify).',
    group: 'merchant',
    icon: '🎓',
    color: 'amber',
    isNewInV5_2: false,
    requiresCapabilities: [],
    defaultTier: 'tier_1',
  },
  {
    id: 'saas',
    label: 'SaaS',
    shortLabel: 'SaaS',
    description: 'Software por assinatura recorrente.',
    longDescription: 'Seus clientes pagam mensalidade para usar seu software/plataforma.',
    group: 'merchant',
    icon: '💻',
    color: 'cyan',
    isNewInV5_2: false,
    requiresCapabilities: ['recurrence'],
    defaultTier: 'tier_1',
  },
  {
    id: 'educacao',
    label: 'Educação',
    shortLabel: 'Educação',
    description: 'Escola, faculdade, curso presencial.',
    longDescription: 'Instituição de ensino com mensalidades e matrículas (presencial ou híbrido).',
    group: 'merchant',
    icon: '🏫',
    color: 'indigo',
    isNewInV5_2: false,
    requiresCapabilities: ['recurrence'],
    defaultTier: 'tier_1',
  },
  {
    id: 'link_pagamento',
    label: 'Link de Pagamento',
    shortLabel: 'Link Pag.',
    description: 'Vende por Instagram/WhatsApp com links.',
    longDescription: 'Não tem loja virtual, envia link de pagamento direto ao cliente por redes sociais ou mensagem.',
    group: 'merchant',
    icon: '🔗',
    color: 'rose',
    isNewInV5_2: false,
    requiresCapabilities: [],
    defaultTier: 'tier_1',
  },
  {
    id: 'mpe',
    label: 'MPE',
    shortLabel: 'MPE',
    description: 'Pequeno negócio local.',
    longDescription: 'Loja física, prestador de serviço, autônomo. Fatura até R$4,8M/ano.',
    group: 'merchant',
    icon: '🏠',
    color: 'slate',
    isNewInV5_2: false,
    requiresCapabilities: [],
    defaultTier: 'tier_1',
  },

  // ── 5 NOVOS V5.2 ──
  {
    id: 'turismo',
    label: 'Turismo',
    shortLabel: 'Turismo',
    description: 'Agências, OTAs, hotéis, operadoras turísticas.',
    longDescription: 'Operadoras, agências e plataformas turísticas. Sujeito a Lei 11.771/2008 e regulação CADASTUR.',
    group: 'merchant',
    icon: '✈️',
    color: 'sky',
    isNewInV5_2: true,
    requiresCapabilities: ['cap_financial_capacity_validation'],
    defaultTier: 'tier_2',
    regulatoryNotes: 'CADASTUR obrigatório; alta sazonalidade exige Patch Financeiro.',
  },
  {
    id: 'eventos',
    label: 'Eventos',
    shortLabel: 'Eventos',
    description: 'Promotores, ticketing, shows, conferências.',
    longDescription: 'Venda de ingressos e produção de eventos. Sujeito a AVCB, ECAD e regras de meia-entrada (Lei 12.933/2013).',
    group: 'merchant',
    icon: '🎫',
    color: 'fuchsia',
    isNewInV5_2: true,
    requiresCapabilities: ['cap_financial_capacity_validation'],
    defaultTier: 'tier_2',
    regulatoryNotes: 'AVCB + ECAD + meia-entrada; alto risco de overbooking.',
  },
  {
    id: 'servicos_b2b',
    label: 'Serviços B2B',
    shortLabel: 'Serv. B2B',
    description: 'Consultoria, agências, prestadores PJ-PJ.',
    longDescription: 'Empresas que vendem serviços profissionais para outras empresas. Ticket alto, baixo volume.',
    group: 'merchant',
    icon: '💼',
    color: 'zinc',
    isNewInV5_2: true,
    requiresCapabilities: [],
    defaultTier: 'tier_1',
  },
  {
    id: 'servicos_locais',
    label: 'Serviços Locais',
    shortLabel: 'Serv. Locais',
    description: 'Salões, oficinas, autônomos, profissionais liberais.',
    longDescription: 'Prestadores de serviço presenciais locais. Pode exigir registro em conselho profissional (CRM, CRO, CRC).',
    group: 'merchant',
    icon: '🛠️',
    color: 'teal',
    isNewInV5_2: true,
    requiresCapabilities: [],
    defaultTier: 'tier_1',
    regulatoryNotes: 'Pode exigir conselho profissional ativo (CRM/CRO/CRC etc.).',
  },
  {
    id: 'crossborder',
    label: 'Crossborder',
    shortLabel: 'Crossborder',
    description: 'Operação internacional, importação/exportação digital.',
    longDescription: 'Vende para fora do Brasil ou recebe pagamentos de fora. Sujeito a FATF, OFAC, sanctions internacionais.',
    group: 'merchant',
    icon: '🌍',
    color: 'red',
    isNewInV5_2: true,
    requiresCapabilities: ['crossborder', 'cap_financial_capacity_validation'],
    defaultTier: 'tier_3',
    regulatoryNotes: 'FATF + OFAC + UK HMT + sanctions internacionais obrigatórios.',
  },
];

/** Lookup rápido por id. */
export const V5_2_SEGMENTS_BY_ID = Object.fromEntries(V5_2_SEGMENTS.map(s => [s.id, s]));

/** Apenas os 15 ids canônicos (para validação de enum). */
export const V5_2_SEGMENT_IDS = V5_2_SEGMENTS.map(s => s.id);

/** Helpers de filtragem. */
export const getSegmentsByGroup = (group) => V5_2_SEGMENTS.filter(s => s.group === group);
export const getNewSegmentsV5_2 = () => V5_2_SEGMENTS.filter(s => s.isNewInV5_2);
export const getSegmentById = (id) => V5_2_SEGMENTS_BY_ID[id] || null;
export const getSegmentLabel = (id) => V5_2_SEGMENTS_BY_ID[id]?.label || id;

/** Normalização de aliases legados que possam aparecer em dados antigos. */
const LEGACY_ALIAS_MAP = {
  plataformas_verticais: 'plataforma_vertical',
  GATEWAY: 'gateway',
  MARKETPLACE: 'marketplace',
  MERCHAN: 'ecommerce',
  GENERAL: 'ecommerce',
};

export function normalizeSegmentId(rawId) {
  if (!rawId) return null;
  if (V5_2_SEGMENTS_BY_ID[rawId]) return rawId;
  return LEGACY_ALIAS_MAP[rawId] || rawId;
}