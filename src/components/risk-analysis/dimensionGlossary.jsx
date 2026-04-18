/**
 * Dimension Glossary — dictionary for every analysis dimension used in the Risk Analysis page.
 * Used by the Heatmap drill-down, the Dimensional Analysis cards and tooltips.
 *
 * Each entry contains:
 *  - label            : display name
 *  - icon             : emoji (for quick visual anchor — actual icon components come from lucide-react in the UI)
 *  - whatItAnalyses   : technical description of what the dimension measures (compliance analyst tone)
 *  - sources          : data sources used to compute this dimension
 *  - highScoreMeaning : what a high risk score in this dimension means, in business terms
 *  - actionByRange    : recommended analyst action by score range
 */

export const DIMENSION_GLOSSARY = {
  identity: {
    label: 'Identidade & Cadastro',
    icon: '🏢',
    whatItAnalyses:
      'Consistência cadastral da empresa na Receita Federal: situação do CNPJ, CNAE registrado vs atividade declarada, MCC, capital social, endereço fiscal, idade da empresa e regime tributário.',
    sources: ['BDC basic_data', 'BDC registration_data', 'Receita Federal (RFB)'],
    highScoreMeaning:
      'CNPJ inativo/suspenso, CNAE desalinhado com a atividade real, capital social irrisório para o volume declarado, endereço virtual ou empresa recém-aberta. Todos são sinais de alta probabilidade de operação irregular ou shell company.',
    actionByRange: {
      low: 'Dados cadastrais consistentes — prosseguir com avaliação normal.',
      medium: 'Solicitar justificativa para divergência de MCC/CNAE ou comprovação de atividade no endereço.',
      high: 'Investigar ativamente: pedir contrato social atualizado, comprovante de endereço, fotos da operação. Considerar recusa se inconsistência grave.',
    },
  },
  owners: {
    label: 'Quadro Societário (QSA)',
    icon: '👥',
    whatItAnalyses:
      'Sócios e grupo econômico: PEP (Pessoas Politicamente Expostas), sanções internacionais (OFAC, UE, ONU), processos judiciais de sócios, participação em outras empresas, cadeia societária e UBO (beneficiário final).',
    sources: ['BDC owners_kyc', 'BDC pep_international', 'BDC sanctions_international', 'BDC relationships'],
    highScoreMeaning:
      'Sócio em lista de sanções (bloqueante), PEP sem justificativa comercial, histórico de processos judiciais relevantes, participação em outras empresas com problemas de compliance. Risco reputacional e regulatório (PLD/FT).',
    actionByRange: {
      low: 'QSA limpo — sem flags nos bureaus internacionais.',
      medium: 'Validar declaração de PEP no questionário com dados objetivos; revisar processos de sócios.',
      high: 'Recusa por sanção é bloqueante automático. Para PEP sem justificativa ou processos graves, revisão manual obrigatória com parecer jurídico.',
    },
  },
  digital: {
    label: 'Presença Digital',
    icon: '🌐',
    whatItAnalyses:
      'Existência e atividade de domínio próprio, passagens web (quantas vezes a empresa aparece em sites/portais), shell company score, redes sociais e canais de venda online.',
    sources: ['BDC domains', 'BDC activity_indicators', 'BDC web_presence'],
    highScoreMeaning:
      'Empresa sem domínio ativo, zero passagens na web, score de shell company acima de 60%. Forte indicativo de empresa de fachada (especialmente para ecommerce declarado).',
    actionByRange: {
      low: 'Empresa com presença digital ativa coerente com o negócio declarado.',
      medium: 'Domínio inativo ou poucas passagens web — solicitar URL da loja/landing page real.',
      high: 'Sem domínio + sem web presence + operação declarada digital = muito alta probabilidade de fachada. Solicitar comprovação de operação imediatamente.',
    },
  },
  compliance: {
    label: 'Compliance & PLD',
    icon: '🛡️',
    whatItAnalyses:
      'Sanções, dívida ativa (federal, estadual, municipal), protestos, processos judiciais ativos, negativações em bureaus, cobranças extrajudiciais e histórico de descumprimento fiscal/civil.',
    sources: ['BDC sanctions', 'BDC tax_debt', 'BDC lawsuits', 'BDC processes_detailed'],
    highScoreMeaning:
      'Dívida ativa relevante (>R$ 500k é bloqueante), múltiplos processos ativos, protestos recentes ou presença em listas restritivas. Risco de insolvência ou de transacionar com entidade problemática.',
    actionByRange: {
      low: 'Histórico limpo — sem pendências relevantes.',
      medium: 'Pendências de baixo valor ou processos antigos — ponderar no parecer mas não é impeditivo.',
      high: 'Investigar cada processo/dívida individualmente. Acima de R$ 500k em dívida ativa = bloqueio automático (B06).',
    },
  },
  reputation: {
    label: 'Reputação',
    icon: '⭐',
    whatItAnalyses:
      'Mídia adversa (notícias negativas), avaliações em Reclame Aqui, presença em listas de reclamações, certificações (ISO, PCI-DSS, Procon), prêmios e reconhecimentos de mercado.',
    sources: ['BDC adverse_media', 'BDC reputation_scores', 'Reclame Aqui', 'Listas de certificação'],
    highScoreMeaning:
      'Adverse media grave (B07 é bloqueante para temas de fraude/lavagem/corrupção), reclamações massivas, baixa reputação em bureaus de consumo.',
    actionByRange: {
      low: 'Sem mídia adversa relevante. Pode seguir normalmente.',
      medium: 'Reclamações pontuais em canais de consumidor — monitorar pós-aprovação.',
      high: 'Adverse media sobre fraude/lavagem = recusa automática. Reclamações massivas justificam rolling reserve reforçado.',
    },
  },
  financial: {
    label: 'Financeiro',
    icon: '💰',
    whatItAnalyses:
      'Saúde econômica: faixa de receita estimada pela Receita, capital social, score de crédito PJ, histórico de inadimplência, cheques sem fundo, protestos financeiros e compatibilidade do volume declarado com o porte.',
    sources: ['BDC pj_credit_profile', 'BDC financial_indicators', 'Receita faixa_receita', 'Bureaus de crédito'],
    highScoreMeaning:
      'Score de crédito PJ baixo, capital social incompatível com volume declarado, faixa de receita Receita Federal diverge MUITO do TPV declarado, histórico de inadimplência financeira.',
    actionByRange: {
      low: 'Perfil financeiro consistente com a operação declarada.',
      medium: 'Solicitar DRE/balanço dos últimos 12 meses para validar volume declarado.',
      high: 'Capacidade financeira incompatível com o volume declarado → rolling reserve reforçado + monitoramento intenso + revisão trimestral obrigatória.',
    },
  },
  evolution: {
    label: 'Evolução Histórica',
    icon: '📈',
    whatItAnalyses:
      'Mudanças recentes no cadastro: alteração de CNAE, mudança de sócios, alteração de capital social, mudança de endereço, mudança de porte empresarial. Frequência e velocidade dessas mudanças.',
    sources: ['BDC registration_history', 'BDC ownership_changes'],
    highScoreMeaning:
      'Várias alterações cadastrais em curto intervalo (< 12 meses), mudança de CNAE para atividade mais arriscada, troca de sócios suspeita. Pode indicar tentativa de mascarar histórico problemático ou laranja.',
    actionByRange: {
      low: 'Cadastro estável — sem mudanças recentes suspeitas.',
      medium: 'Alterações pontuais justificáveis (expansão, mudança de endereço) — confirmar com o cliente.',
      high: 'Múltiplas alterações em curto prazo + mudança de CNAE para atividade arriscada → revisão manual obrigatória com investigação de laranjas.',
    },
  },
  esg: {
    label: 'ESG & Lista Suja',
    icon: '🌱',
    whatItAnalyses:
      'Presença em Lista Suja do Ministério do Trabalho (trabalho escravo), embargos IBAMA, indicadores de conformidade ambiental e trabalhista.',
    sources: ['MTE Lista Suja', 'IBAMA embargos', 'BDC esg_indicators'],
    highScoreMeaning:
      'Lista Suja MTE é bloqueante absoluto (B08). Embargos ambientais ativos (B09) também bloqueiam.',
    actionByRange: {
      low: 'Sem pendências trabalhistas ou ambientais.',
      medium: 'N/A — essa dimensão tende a ser binária (limpo ou bloqueante).',
      high: 'Lista Suja MTE ou embargo IBAMA ativo = recusa imediata. Fazer negócio pode gerar responsabilidade solidária.',
    },
  },
  contacts: {
    label: 'Validação de Contatos',
    icon: '📞',
    whatItAnalyses:
      'Telefones, e-mails e endereços físicos associados à empresa na BDC vs. os declarados no questionário. Validação de existência e coerência.',
    sources: ['BDC phones', 'BDC emails', 'BDC addresses'],
    highScoreMeaning:
      'Telefones/e-mails declarados não aparecem em nenhum registro da BDC, ou aparecem associados a OUTRAS empresas/CPFs. Endereço declarado é virtual ou incompatível com o CEP da Receita.',
    actionByRange: {
      low: 'Contatos declarados confirmados pela BDC.',
      medium: 'Parte dos contatos não está na BDC — confirmar diretamente com o cliente.',
      high: 'Nenhum contato declarado bate com a BDC → suspeita forte de identidade construída. Exigir comprovação e telefone celular com nome.',
    },
  },
  employeesKyc: {
    label: 'KYC Funcionários',
    icon: '👨‍💼',
    whatItAnalyses:
      'Quantidade de funcionários CLT registrados no eSocial/CAGED. Coerência entre faixa declarada no questionário e faixa real no governo.',
    sources: ['BDC kyc_employees', 'eSocial', 'CAGED'],
    highScoreMeaning:
      'Zero CLT registrado + volume declarado alto = possível operação informal/PJ-PJ. Empresas declarando 50+ funcionários mas com 0 CLT = provavelmente declaração falsa.',
    actionByRange: {
      low: 'Faixa declarada consistente com registros públicos.',
      medium: 'Cliente usa PJ/prestadores → solicitar comprovantes de MEIs contratados ou terceirização formal.',
      high: 'Zero empregados + shell score alto = provável fachada. Solicitar folha de pagamento ou contratos de prestação.',
    },
  },
  sectorial: {
    label: 'Dados Setoriais',
    icon: '📊',
    whatItAnalyses:
      'CNAE detalhado, MCC, registros setoriais obrigatórios (BCB, CVM, Susep), presença em marketplaces, licenças operacionais específicas do setor.',
    sources: ['BDC sectorial_data', 'BDC mcc', 'BCB registros'],
    highScoreMeaning:
      'Empresa declara atividade regulada (fintech, corretora, seguradora) sem registro no órgão regulador correspondente. Ou CNAEs financeiros sem autorização BCB.',
    actionByRange: {
      low: 'Setor claro, sem necessidade de licença específica adicional.',
      medium: 'Validar licenças setoriais específicas (ex: comércio eletrônico alimentício → ANVISA).',
      high: 'Atividade regulada sem registro → recusa ou revisão manual com exigência de licença antes da aprovação.',
    },
  },
  assets: {
    label: 'Ativos Patrimoniais',
    icon: '🏦',
    whatItAnalyses:
      'Propriedade industrial (marcas registradas no INPI), patentes, capital social declarado vs ativos reais, licenças e certificações que compõem o patrimônio.',
    sources: ['BDC intellectual_property', 'INPI', 'BDC assets'],
    highScoreMeaning:
      'Capital social declarado muito alto sem ativos correspondentes. Nenhuma marca/patente associada à empresa declarada como fabricante/titular.',
    actionByRange: {
      low: 'Ativos patrimoniais coerentes com a operação declarada.',
      medium: 'Sem ativos intelectuais — normal para comércio puro, atenção para quem declara fabricação própria.',
      high: 'Incompatibilidades entre capital declarado e ativos reais → investigar movimentação societária.',
    },
  },
  creditRisk: {
    label: 'Análise de Crédito',
    icon: '💳',
    whatItAnalyses:
      'Score de crédito PJ (Serasa/BoaVista), protestos ativos, cheques sem fundo, inadimplência em outras instituições financeiras, histórico de pagamento.',
    sources: ['BDC pj_credit_profile', 'Serasa', 'Boa Vista'],
    highScoreMeaning:
      'Score de crédito baixo, múltiplos protestos recentes, inadimplência em bureau financeiro. Probabilidade maior de chargebacks e inadimplência em antecipações.',
    actionByRange: {
      low: 'Bom histórico de crédito — baixo risco de chargebacks por insolvência.',
      medium: 'Score médio — considerar rolling reserve padrão e evitar antecipações agressivas.',
      high: 'Crédito comprometido → sem antecipação nos primeiros 90 dias e rolling reserve elevado.',
    },
  },
  // SENTINEL-side aliases
  identidade: null, // handled via alias map below
  socios: null,
  reputacao: null,
  financeiro: null,
  biometria: {
    label: 'Biometria & Liveness',
    icon: '📸',
    whatItAnalyses:
      'Resultado da verificação CAF: liveness (prova de vida), facematch (rosto da selfie vs documento), documentoscopia (autenticidade do documento), detecção de deepfake.',
    sources: ['CAF face_liveness', 'CAF face_match', 'CAF document_detector', 'CAF deepfake_detection'],
    highScoreMeaning:
      'Liveness reprovado, facematch baixo (< 70%), deepfake detectado ou documento adulterado. Fraude de identidade objetiva.',
    actionByRange: {
      low: 'Biometria aprovada em todos os testes.',
      medium: 'Liveness com probabilidade média (50-80%) → tentar nova captura com orientações claras ao cliente.',
      high: 'Fraude biométrica confirmada → revisão manual com forte sugestão de recusa.',
    },
  },
};

// Aliases used by the SENTINEL analise_dimensional payload (Portuguese keys)
export const DIMENSION_ALIASES = {
  identidade: 'identity',
  socios: 'owners',
  compliance: 'compliance',
  digital: 'digital',
  reputacao: 'reputation',
  financeiro: 'financial',
  biometria: 'biometria',
};

export function resolveDimension(key) {
  if (!key) return null;
  const alias = DIMENSION_ALIASES[key];
  return DIMENSION_GLOSSARY[alias || key] || null;
}

export function getDimensionAction(dimKey, score) {
  const dim = resolveDimension(dimKey);
  if (!dim) return null;
  if (score < 30) return dim.actionByRange.low;
  if (score < 60) return dim.actionByRange.medium;
  return dim.actionByRange.high;
}