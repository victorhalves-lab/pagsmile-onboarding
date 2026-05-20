/**
 * [V5.2 Fase 6.5.4] Glossário canônico V5.2 — 50+ termos técnicos.
 *
 * Fonte: DOC6 §2.5.6 (Glossário Mestre V5.2) + DELTA_SEGMENTOS Cap. 2 + DOC5 §49.
 *
 * Estrutura:
 *   - label: nome leg\u00edvel curto (usado como gatilho do tooltip)
 *   - short: defini\u00e7\u00e3o em 1 linha (tooltip header)
 *   - full: explica\u00e7\u00e3o did\u00e1tica (1-3 par\u00e1grafos) renderizada no tooltip body
 *   - category: agrupamento (tiers / morfologias / categorias_decisao / patch_financeiro / capabilities / bloqueios / pld_ft / outros)
 *   - regulatory: fundamenta\u00e7\u00e3o regulat\u00f3ria quando aplic\u00e1vel
 *
 * Uso:
 *   import { getTerm, TERM_CATEGORIES } from '@/lib/v5_2/glossary';
 *   const t = getTerm('tier_1');
 */

export const TERM_CATEGORIES = {
  tiers: { label: 'Tiers', color: '#2bc196' },
  morfologias: { label: 'Morfologias', color: '#8b5cf6' },
  categorias_decisao: { label: 'Categorias de Decis\u00e3o', color: '#0ea5e9' },
  patch_financeiro: { label: 'Patch Financeiro', color: '#f59e0b' },
  capabilities: { label: 'Capabilities', color: '#06b6d4' },
  bloqueios: { label: 'Bloqueios', color: '#ef4444' },
  pld_ft: { label: 'PLD/FT', color: '#a855f7' },
  cross_validation: { label: 'Cross-Validation', color: '#10b981' },
  outros: { label: 'Outros', color: '#64748b' },
};

export const GLOSSARY_V5_2 = {
  // ========================================
  // TIERS (5 termos)
  // ========================================
  tier_1: {
    label: 'Tier 1',
    category: 'tiers',
    short: 'Seller principal de baixa complexidade.',
    full: 'Seller PJ com TPV anual declarado at\u00e9 R$ 1,2M, modelo de neg\u00f3cio simples, sem capabilities transversais ativas (splits, crossborder, recurrence). Pipeline V5.2 mais leve: enrichment b\u00e1sico, score escala 0-850, Patch Financeiro opcional. Auto-approve t\u00edpico em cat_1.',
    regulatory: 'BCB 4.658/2018 \u00a76 (perfil de risco simplificado)',
  },
  tier_2: {
    label: 'Tier 2',
    category: 'tiers',
    short: 'Seller principal de m\u00e9dia complexidade.',
    full: 'Seller PJ com TPV anual entre R$ 1,2M e R$ 50M, ou que ativa pelo menos 1 capability transversal. Patch Financeiro OBRIGAT\u00d3RIO (cap_financial_capacity_validation). Score escala 0-850 com pesos diferentes do Tier 1. Maior parte dos casos vai pra cat_2 (condicional) ou cat_3 (revis\u00e3o manual).',
    regulatory: 'Circ. BCB 3.978 Art. 19',
  },
  tier_3: {
    label: 'Tier 3',
    category: 'tiers',
    short: 'Seller institucional/alta complexidade.',
    full: 'TPV anual > R$ 50M ou segmento institucional (Marketplace, Gateway BaaS, Crossborder grandes). Escala de score 0-999 (mais granular). Todas as capabilities ativas. Patch Financeiro com 5 dimens\u00f5es. SENTINEL especializado por segmento. Decis\u00e3o sempre passa por humano (Compliance Senior+).',
    regulatory: 'Resol. BCB 403/2024 + Circ. BCB 3.978 Art. 16-19',
  },
  subseller_pj: {
    label: 'Subseller PJ',
    category: 'tiers',
    short: 'Vendedor PJ vinculado a um seller principal.',
    full: 'PJ que vende atrav\u00e9s da estrutura de um seller principal (marketplace, gateway). Tem KYB simplificado, mas herda a responsabilidade PLD/FT do seller-m\u00e3e. Score escala 0-850. Resolu\u00e7\u00e3o de grau (A/B/C) por TPV declarado: A \u2264 R$ 30k, B at\u00e9 R$ 200k, C at\u00e9 R$ 500k.',
    regulatory: 'Circ. BCB 3.978 Art. 16 (KYC indireto)',
  },
  subseller_pf: {
    label: 'Subseller PF',
    category: 'tiers',
    short: 'Vendedor pessoa f\u00edsica vinculado a um seller.',
    full: 'Pessoa f\u00edsica vendendo via marketplace/gateway. KYC b\u00e1sico + valida\u00e7\u00e3o de renda. Grau (A/B/C) resolvido por renda mensal l\u00edquida: A < R$ 2k, B at\u00e9 R$ 10k, C > R$ 10k. Bloqueios espec\u00edficos PF (B-PF-*) avaliados.',
    regulatory: 'Lei 9.613/1998 Art. 11 + BCB 3.978',
  },

  // ========================================
  // MORFOLOGIAS (6 termos)
  // ========================================
  morfologia_a: {
    label: 'Morfologia A',
    category: 'morfologias',
    short: 'Opera\u00e7\u00e3o tradicional — produto/servi\u00e7o direto.',
    full: 'Modelo simples: empresa vende seus pr\u00f3prios produtos ou servi\u00e7os diretamente ao consumidor. Sem intermedia\u00e7\u00e3o de terceiros, sem splits, sem recorr\u00eancia complexa. Ex: e-commerce pr\u00f3prio, lojas locais. Pipeline mais leve.',
  },
  morfologia_b: {
    label: 'Morfologia B',
    category: 'morfologias',
    short: 'Recorr\u00eancia/assinatura.',
    full: 'Modelo de receita recorrente: assinaturas, mensalidades, SaaS. Ativa capability "recurrence". Avalia\u00e7\u00e3o adicional de churn, MRR, cancelamento, reembolso. Bloqueios B-REC-* aplic\u00e1veis.',
  },
  morfologia_c: {
    label: 'Morfologia C',
    category: 'morfologias',
    short: 'Marketplace/agregador com splits.',
    full: 'Empresa opera como intermedi\u00e1ria entre vendedores e compradores, com splits de pagamento. Ativa capability "splits/subseller". KYC obrigat\u00f3rio de subsellers. Bloqueios B-MKT-* aplic\u00e1veis. Patch Financeiro com pesos extras.',
    regulatory: 'BCB 4.658/2018 + Resol. BCB 80/2021',
  },
  morfologia_d: {
    label: 'Morfologia D',
    category: 'morfologias',
    short: 'Gateway/PSP — processa para terceiros.',
    full: 'Empresa processa pagamentos em nome de outras empresas (BaaS, gateway PSP). PCI-DSS obrigat\u00f3rio. Responsabilidade compartilhada PLD/FT. Bloqueios B-GW-* aplic\u00e1veis, incluindo B-GW-PCI-CRIT-1 (absoluto).',
    regulatory: 'PCI-DSS v4.0 + BCB 3.978',
  },
  morfologia_e: {
    label: 'Morfologia E',
    category: 'morfologias',
    short: 'Crossborder/internacional.',
    full: 'Receita ou pagamentos envolvem fronteira (entrada de divisas, c\u00e2mbio, exportadores). Ativa capability "crossborder". Consulta a sanctions internacionais (OFAC, UE, ONU, UK HMT). Bloqueios B-CB-* aplic\u00e1veis, incluindo B-CB-PAIS-CRIT-1 (pa\u00edses sancionados).',
    regulatory: 'Lei 13.810/2019 + COAF + Lei 14.286/2021',
  },
  morfologia_f: {
    label: 'Morfologia F',
    category: 'morfologias',
    short: 'Plataforma vertical regulada.',
    full: 'Atua\u00e7\u00e3o em setor altamente regulado: sa\u00fade, educa\u00e7\u00e3o, financeiro, ap+ostas. Exige licen\u00e7a setorial (CRM, MEC, BCB, CVM, etc). LGPD reads de sensibilidade adicional. Bloqueios B-PV-* aplic\u00e1veis.',
    regulatory: 'LGPD + Marco Regulat\u00f3rio por setor',
  },

  // ========================================
  // CATEGORIAS DE DECIS\u00c3O (5 termos)
  // ========================================
  cat_1_auto_approve: {
    label: 'Categoria 1 — Aprova\u00e7\u00e3o Autom\u00e1tica',
    category: 'categorias_decisao',
    short: 'Aprovado sem interven\u00e7\u00e3o humana.',
    full: 'Score alto, sem bloqueios ativos, todas as cross-validations OK, Patch Financeiro verde. Decis\u00e3o tomada 100% pelo motor V5.2. Cliente \u00e9 liberado imediatamente. Apenas monitoramento padr\u00e3o aplicado.',
  },
  cat_2_conditional: {
    label: 'Categoria 2 — Aprovado com Condi\u00e7\u00f5es',
    category: 'categorias_decisao',
    short: 'Aprovado, mas com restri\u00e7\u00f5es contratuais.',
    full: 'Score m\u00e9dio-alto. Pode ter rolling reserve adicional, cap de TPV inicial, monitoramento refor\u00e7ado. SENTINEL recomenda condi\u00e7\u00f5es espec\u00edficas (ex: revisar em 90 dias). N\u00e3o exige aprova\u00e7\u00e3o humana padr\u00e3o, mas an\u00e1lise registra.',
  },
  cat_3_manual_review: {
    label: 'Categoria 3 — Revis\u00e3o Manual',
    category: 'categorias_decisao',
    short: 'Exige decis\u00e3o humana (analista L1+).',
    full: 'Score m\u00e9dio ou cross-validation com diverg\u00eancias. SENTINEL prepara dossi\u00ea anal\u00edtico mas N\u00c3O decide. Analista de Compliance avalia e bate o martelo. Pode promover pra cat_1/2, rebaixar pra cat_4/5 ou pedir pend\u00eancias adicionais.',
    regulatory: 'BCB 4.658/2018 \u00a78 (avalia\u00e7\u00e3o assistida)',
  },
  cat_4_block: {
    label: 'Categoria 4 — Recusa Direta',
    category: 'categorias_decisao',
    short: 'Recusa autom\u00e1tica sem possibilidade de exce\u00e7\u00e3o.',
    full: 'Bloqueio ABSOLUTO disparado (n\u00facleo duro regulat\u00f3rio) ou score muito baixo. Os 10 bloqueios absolutos N\u00c3O admitem exce\u00e7\u00e3o de nenhum papel (nem CCO). Ex: pa\u00eds sancionado, atividade proibida pela BCB, PCI cr\u00edtico.',
    regulatory: 'Lei 13.810/2019 + Circ. BCB 3.978',
  },
  cat_5_intensive_monitoring: {
    label: 'Categoria 5 — Monitoramento Intensivo',
    category: 'categorias_decisao',
    short: 'Aprovado com plano de off-boarding \u00e1gil pr\u00e9-acordado.',
    full: 'Caso de alto risco mas mitig\u00e1vel. Em vez de recusar, cria um PlanoMonitoramento com: TPV cap inicial baixo, rolling reserve adicional, gatilhos de off-boarding em 24-48h, revis\u00e3o frequente. Exige aceite formal do seller (TermoAdicionalV5_2) e aprova\u00e7\u00e3o m\u00ednima de head_compliance.',
    regulatory: 'DOC5 V5.2 \u00a750 + Resol. BCB 403/2024',
  },

  // ========================================
  // PATCH FINANCEIRO (6 termos)
  // ========================================
  patch_financeiro: {
    label: 'Patch Financeiro',
    category: 'patch_financeiro',
    short: 'Bateria de 5 valida\u00e7\u00f5es de capacidade financeira.',
    full: 'Conjunto de 5 dimens\u00f5es que validam se o TPV declarado pelo seller \u00e9 coerente com sua realidade financeira: TPV declarado vs BDC, faturamento ECF vs documenta\u00e7\u00e3o, status CRC, fluxo de caixa via Open Finance, coer\u00eancia setorial. Resultado consolidado em verde/amarelo/laranja/vermelho.',
    regulatory: 'DOC5 V5.2 \u00a721 + Resol. BCB 403/2024',
  },
  patch_verde: {
    label: 'Patch Verde',
    category: 'patch_financeiro',
    short: 'Coer\u00eancia financeira total.',
    full: 'Todas as 5 dimens\u00f5es do Patch Financeiro confirmaram o TPV declarado. Diverg\u00eancia \u2264 10% em todas as fontes. Caso elegivel para cat_1/cat_2 sem ressalvas financeiras.',
  },
  patch_amarelo: {
    label: 'Patch Amarelo',
    category: 'patch_financeiro',
    short: 'Pequenas diverg\u00eancias toler\u00e1veis.',
    full: 'Diverg\u00eancia de 10-30% em pelo menos 1 das 5 dimens\u00f5es. Aprova\u00e7\u00e3o poss\u00edvel mas exige monitoramento refor\u00e7ado e cap de TPV no primeiro ciclo. T\u00edpico de cat_2.',
  },
  patch_laranja: {
    label: 'Patch Laranja',
    category: 'patch_financeiro',
    short: 'Diverg\u00eancia significativa — revis\u00e3o manual.',
    full: 'Diverg\u00eancia 30-50% em 1+ dimens\u00f5es, ou m\u00faltiplas dimens\u00f5es amarelas. SENTINEL escala para cat_3. Analista solicita documenta\u00e7\u00e3o complementar (CRC, ECF, extrato banc\u00e1rio).',
  },
  patch_vermelho: {
    label: 'Patch Vermelho',
    category: 'patch_financeiro',
    short: 'Inconsist\u00eancia grave — bloqueio.',
    full: 'Diverg\u00eancia > 50% ou m\u00faltiplas dimens\u00f5es cr\u00edticas. Dispara B-FIN-1 (incoer\u00eancia financeira). T\u00edpico de cat_4 ou cat_5 (com plano de off-boarding \u00e1gil).',
  },
  v_financial_coherence: {
    label: 'V-Financial Coherence',
    category: 'patch_financeiro',
    short: 'Vari\u00e1vel-resumo do Patch Financeiro.',
    full: 'Vari\u00e1vel num\u00e9rica (0-100) que sumariza o resultado das 5 dimens\u00f5es. Entra na f\u00f3rmula do risk_score V5.2 com peso m\u00e9dio. Abaixo de 40 dispara B-FIN-1.',
  },

  // ========================================
  // CAPABILITIES (5 termos)
  // ========================================
  cap_financial_capacity_validation: {
    label: 'cap_financial_capacity_validation',
    category: 'capabilities',
    short: 'Capability que dispara o Patch Financeiro.',
    full: 'Capability transversal V5.2 obrigat\u00f3ria em Tier 2+ e for\u00e7ada em segmentos sens\u00edveis (dropshipping, gateway, infoprodutos) mesmo em Tier 1. Quando ativa, dispara automaticamente o Patch Financeiro com suas 5 dimens\u00f5es. Variante PF: cap_financial_capacity_validation_pf usa renda mensal l\u00edquida.',
    regulatory: 'Resol. BCB 403/2024 \u00a73',
  },
  capability_splits_subseller: {
    label: 'Capability splits/subseller',
    category: 'capabilities',
    short: 'Modelo marketplace/agregador com splits.',
    full: 'Capability ativada quando o seller opera com m\u00faltiplos subsellers ou splits de pagamento. Obriga KYC completo de subsellers, valida\u00e7\u00e3o de RLs por subseller, monitoramento de concentra\u00e7\u00e3o. Bloqueios B-MKT-* e B-SUB-* aplic\u00e1veis.',
  },
  capability_crossborder: {
    label: 'Capability crossborder',
    category: 'capabilities',
    short: 'Recebe/envia divisas internacionais.',
    full: 'Capability ativada por receita internacional declarada > 5% ou opera\u00e7\u00e3o de c\u00e2mbio. Consulta a sanctions internacionais (OFAC, UE, ONU, UK), valida\u00e7\u00e3o de pa\u00edses de origem/destino, contrato de c\u00e2mbio. Bloqueios B-CB-* aplic\u00e1veis.',
    regulatory: 'Lei 14.286/2021 + Circ. BCB 3.691',
  },
  capability_recurrence: {
    label: 'Capability recurrence',
    category: 'capabilities',
    short: 'Modelo de receita recorrente.',
    full: 'Capability ativada para SaaS, assinaturas, mensalidades. Avalia churn rate, MRR, pol\u00edtica de cancelamento, reembolso, dunning. Bloqueios B-REC-* aplic\u00e1veis. Necess\u00e1rio em todos os SaaS e plataformas verticais com mensalidade.',
  },
  capabilities_ativas: {
    label: 'Capabilities Ativas',
    category: 'capabilities',
    short: 'Lista de capabilities transversais resolvidas.',
    full: 'Array de capabilities V5.2 ativadas para este caso espec\u00edfico. Resolvidas em runtime baseado em: tier, segmento, morfologia e respostas do question\u00e1rio. Cada capability ativa pode adicionar datasets BDC, perguntas, vari\u00e1veis V-* e bloqueios B-* avalia\u00e1veis.',
  },

  // ========================================
  // BLOQUEIOS (8 termos)
  // ========================================
  bloqueio_absoluto: {
    label: 'Bloqueio Absoluto',
    category: 'bloqueios',
    short: 'N\u00facleo duro regulat\u00f3rio — sem exce\u00e7\u00e3o.',
    full: '10 bloqueios da V5.2 que N\u00c3O admitem exce\u00e7\u00e3o de nenhum papel (nem CCO/Comit\u00ea). Ex: B03 (CPF/CNPJ inv\u00e1lido), B-CB-1 (pa\u00eds sancionado), B-MKT-PROD-CRIT-1 (atividade proibida no marketplace). Sempre cat_4.',
    regulatory: 'Lei 13.810/2019 + Lei 9.613/1998 Art. 11',
  },
  bloqueio_escalavel: {
    label: 'Bloqueio Escal\u00e1vel',
    category: 'bloqueios',
    short: 'Bloqueio mitig\u00e1vel via exce\u00e7\u00e3o.',
    full: 'Bloqueio que pode ser liberado mediante aprova\u00e7\u00e3o documentada (exception_categoria 1-4) ou mitigado via cat_5 (monitoramento intensivo). Cada exce\u00e7\u00e3o exige papel m\u00ednimo (analista, head_compliance, CCO, comit\u00ea) e documenta\u00e7\u00e3o.',
  },
  b_fin_1: {
    label: 'B-FIN-1',
    category: 'bloqueios',
    short: 'Incoer\u00eancia Financeira Cr\u00edtica.',
    full: 'Disparado quando o Patch Financeiro est\u00e1 vermelho (diverg\u00eancia > 50% entre TPV declarado e fontes externas). Mitig\u00e1vel via Cat 5 com cap de TPV inicial baixo + rolling reserve refor\u00e7ada.',
  },
  b_03: {
    label: 'B03',
    category: 'bloqueios',
    short: 'Documento (CPF/CNPJ) inv\u00e1lido — ABSOLUTO.',
    full: 'Documento da empresa ou representante n\u00e3o existe na Receita Federal, est\u00e1 baixado, ou inativo. Bloqueio absoluto (n\u00facleo duro). N\u00e3o admite exce\u00e7\u00e3o.',
    regulatory: 'BCB 3.978 Art. 11',
  },
  b_10: {
    label: 'B10',
    category: 'bloqueios',
    short: 'PEP/Sancionado sem mitigante — ABSOLUTO.',
    full: 'S\u00f3cio ou representante \u00e9 PEP (Pessoa Politicamente Exposta) ativo OU consta em lista de san\u00e7\u00f5es nacional/internacional. Quando absoluto (n\u00facleo duro), n\u00e3o admite exce\u00e7\u00e3o.',
    regulatory: 'Lei 12.846/2013 + COAF + OFAC',
  },
  b_cb_1: {
    label: 'B-CB-1',
    category: 'bloqueios',
    short: 'Pa\u00eds sancionado — ABSOLUTO.',
    full: 'Capability crossborder ativa e o pa\u00eds de origem ou destino consta em listas OFAC/UE/ONU. Bloqueio absoluto.',
    regulatory: 'Lei 13.810/2019',
  },
  b_pv_lgpd_1_crit: {
    label: 'B-PV-LGPD-1-CRIT',
    category: 'bloqueios',
    short: 'PV Sa\u00fade sem prote\u00e7\u00e3o LGPD — ABSOLUTO.',
    full: 'Plataforma vertical de sa\u00fade (Morfologia F com segmento sa\u00fade) sem DPO, sem encarregado LGPD, sem ROPA. Bloqueio absoluto por trata-se de dado pessoal sens\u00edvel.',
    regulatory: 'LGPD Art. 5\u00ba II + Art. 23',
  },
  b_gw_pci_crit_1: {
    label: 'B-GW-PCI-CRIT-1',
    category: 'bloqueios',
    short: 'Gateway sem PCI-DSS v\u00e1lido — ABSOLUTO.',
    full: 'Empresa opera como gateway (Morfologia D) mas n\u00e3o possui certifica\u00e7\u00e3o PCI-DSS v\u00e1lida ou vence em < 30 dias. Bloqueio absoluto por dado de cart\u00e3o.',
    regulatory: 'PCI-DSS v4.0',
  },

  // ========================================
  // PLD/FT (4 termos)
  // ========================================
  pld_ft: {
    label: 'PLD/FT',
    category: 'pld_ft',
    short: 'Preven\u00e7\u00e3o \u00e0 Lavagem de Dinheiro e ao Financiamento do Terrorismo.',
    full: 'Conjunto de pol\u00edticas, controles e an\u00e1lises requeridas pela legisla\u00e7\u00e3o brasileira e internacional. V5.2 tem 8 bloqueios B-PLD-* dedicados, al\u00e9m de consultas a sanctions, PEP, COAF, listas internacionais.',
    regulatory: 'Lei 9.613/1998 + Circ. BCB 3.978 + Resol. COAF 36/2021',
  },
  pep: {
    label: 'PEP',
    category: 'pld_ft',
    short: 'Pessoa Politicamente Exposta.',
    full: 'Pessoa que ocupa ou ocupou nos \u00faltimos 5 anos cargo p\u00fablico relevante (Senador, Ministro, Prefeito, etc) ou seus familiares pr\u00f3ximos. Exige due diligence refor\u00e7ada. Consultado em todos os representantes legais e UBOs.',
    regulatory: 'Resol. COAF 29/2017',
  },
  ubo: {
    label: 'UBO',
    category: 'pld_ft',
    short: 'Ultimate Beneficial Owner — Benefici\u00e1rio Final.',
    full: 'Pessoa f\u00edsica que, em \u00faltima inst\u00e2ncia, det\u00e9m, controla ou se beneficia da empresa (cadeia de propriedade > 25%). KYC obrigat\u00f3rio. Em V5.2, cadeia QSA \u00e9 cruzada com QSA hist\u00f3rico via dataset configurable_recency_qsa.',
    regulatory: 'Receita Federal IN 1.863/2018 + Circ. BCB 3.978',
  },
  sanctions: {
    label: 'Sanctions Screening',
    category: 'pld_ft',
    short: 'Consulta a listas de san\u00e7\u00f5es nacionais e internacionais.',
    full: 'Cruzamento autom\u00e1tico de CPF/CNPJ + nome contra: COAF, CADE, Receita Federal, OFAC (EUA), UE, ONU, UK HMT, Interpol. Em V5.2, datasets internacionais s\u00f3 s\u00e3o consultados se capability crossborder est\u00e1 ativa.',
    regulatory: 'Lei 13.810/2019 + Resol. COAF 36/2021',
  },

  // ========================================
  // CROSS-VALIDATION (3 termos)
  // ========================================
  cross_validation_16: {
    label: 'Cross-Validation 16 Campos',
    category: 'cross_validation',
    short: 'Confronto de 16 campos declarados vs BDC.',
    full: 'V5.2 valida 16 campos can\u00f4nicos do question\u00e1rio contra fontes externas BDC: raz\u00e3o social, nome fantasia, CNPJ, capital social, endere\u00e7o, telefone, e-mail, QSA, CNAE, situa\u00e7\u00e3o, data de abertura, faturamento, TPV, regime tribut\u00e1rio, n\u00famero de funcion\u00e1rios, atividade declarada. Cada campo tem peso e gera status: match/divergence/mismatch/unknown.',
    regulatory: 'DOC5 V5.2 \u00a722',
  },
  divergence: {
    label: 'Divergence',
    category: 'cross_validation',
    short: 'Diverg\u00eancia toler\u00e1vel entre declarado e BDC.',
    full: 'Status quando o campo declarado difere do BDC em uma margem aceit\u00e1vel (definida por campo, t\u00edpico 10-30%). Gera ponto de aten\u00e7\u00e3o mas n\u00e3o bloqueia. Acumulado de m\u00faltiplas divergences pode escalar para cat_3.',
  },
  mismatch: {
    label: 'Mismatch',
    category: 'cross_validation',
    short: 'Inconsist\u00eancia grave entre declarado e BDC.',
    full: 'Status quando o campo difere ALEM da toler\u00e2ncia (> 30%) ou \u00e9 estruturalmente diferente. Ex: CNPJ declarado n\u00e3o bate com BDC, raz\u00e3o social totalmente diversa. Dispara red flag de alta severidade.',
  },

  // ========================================
  // OUTROS (5 termos)
  // ========================================
  framework_version: {
    label: 'framework_version',
    category: 'outros',
    short: 'DNA imut\u00e1vel do caso.',
    full: 'Campo que identifica qual vers\u00e3o do framework foi usada para analisar o caso: v4.0 (legado), v5.1 (intermedi\u00e1rio, n\u00e3o usado em prod) ou v5.2 (padr\u00e3o atual). NUNCA \u00e9 alterado ap\u00f3s a cria\u00e7\u00e3o do caso. Casos V4 e V5.2 podem coexistir.',
  },
  snapshot: {
    label: 'Snapshot V5.2',
    category: 'outros',
    short: 'Registro imut\u00e1vel da an\u00e1lise.',
    full: 'Arquiva todo o input (question\u00e1rio + datasets) e output (score, bloqueios, decis\u00e3o) de cada execu\u00e7\u00e3o do pipeline V5.2. Permite reconstruir exatamente "o que a IA viu" em qualquer momento futuro para auditoria regulat\u00f3ria. Inclui hash de integridade.',
    regulatory: 'Circ. BCB 3.978 Art. 17 (rastreabilidade)',
  },
  sentinel: {
    label: 'SENTINEL',
    category: 'outros',
    short: 'Agente de IA que prepara o dossi\u00ea anal\u00edtico.',
    full: 'Sistema de IA especializado por segmento + tier que analisa o caso, identifica red flags, prop\u00f5e categoria de decis\u00e3o e gera parecer textual. Em cat_3+ NUNCA decide sozinho — apenas instrui o analista humano. Versionado por prompt (ex: sentinel_marketplace_tier3_splits_v5_1).',
  },
  rolling_reserve: {
    label: 'Rolling Reserve',
    category: 'outros',
    short: 'Reten\u00e7\u00e3o de % do TPV por per\u00edodo.',
    full: 'Mecanismo de prote\u00e7\u00e3o financeira: a Pagsmile ret\u00e9m % do faturamento do seller por X dias (t\u00edpico 90-180) para cobrir chargebacks e fraudes. Em cat_2/5, pode ser adicional (al\u00e9m do padr\u00e3o do segmento).',
  },
  tpv_cap: {
    label: 'TPV Cap',
    category: 'outros',
    short: 'Teto de volume operacional inicial.',
    full: 'Limite m\u00e1ximo de TPV mensal definido no in\u00edcio da rela\u00e7\u00e3o. T\u00edpico de cat_5 (monitoramento intensivo) ou cat_2 com Patch amarelo. Cap inicial pode ser % do TPV declarado (ex: 50%). Promovido por bom comportamento ou revogado por gatilho.',
  },
};

/**
 * Retorna o termo do gloss\u00e1rio pelo c\u00f3digo, ou null se n\u00e3o existir.
 */
export function getTerm(code) {
  return GLOSSARY_V5_2[code] || null;
}

/**
 * Lista todos os termos agrupados por categoria.
 */
export function getTermsByCategory() {
  const grouped = {};
  Object.entries(GLOSSARY_V5_2).forEach(([code, term]) => {
    const cat = term.category || 'outros';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ code, ...term });
  });
  return grouped;
}

/**
 * Busca termos por texto (em label, short, full).
 */
export function searchTerms(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  return Object.entries(GLOSSARY_V5_2)
    .filter(([code, term]) =>
      code.toLowerCase().includes(q) ||
      term.label.toLowerCase().includes(q) ||
      term.short.toLowerCase().includes(q) ||
      term.full.toLowerCase().includes(q)
    )
    .map(([code, term]) => ({ code, ...term }));
}

export const GLOSSARY_TERM_COUNT = Object.keys(GLOSSARY_V5_2).length;