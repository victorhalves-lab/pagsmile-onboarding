/**
 * Red Flag Enricher — heuristics that turn a raw red flag string (with or without
 * V4:/CAF:/SENTINEL: prefix) into a rich card with explanation, evidence hints,
 * suggested action and source.
 *
 * Works by keyword matching the flag text against a catalogue. If no catalogue
 * entry matches, we still return a sensible default so the card never looks empty.
 */

// Keyword → enrichment mapping. First match wins (most specific keywords first).
const FLAG_CATALOGUE = [
  // ─── Financial / Credit ──────────────────────────────────────────────
  {
    match: /shell\s*company|empresa\s*de\s*fachada/i,
    title: 'Probabilidade de Empresa de Fachada (Shell Company)',
    severity: 'HIGH',
    dimension: 'financial',
    whyItMatters:
      'O score de Shell Company da BDC combina múltiplos sinais (zero empregados, domínio inativo, capital social baixo, sem passagens web, endereço virtual). Score elevado indica que muito provavelmente não existe operação real por trás da razão social.',
    evidenceHints: [
      'Zero empregados CLT no eSocial',
      'Domínio próprio inativo ou inexistente',
      'Capital social mínimo (< R$ 10k para ecommerce)',
      'Sem passagens web nos últimos 90 dias',
    ],
    suggestedAction:
      'Solicitar comprovação de operação real: fotos do estoque/escritório, contratos com fornecedores ou clientes, extrato bancário dos últimos 3 meses, folha de pagamento ou contratos com prestadores PJ.',
  },
  {
    match: /dívida\s*ativa|divida\s*ativa/i,
    title: 'Dívida Ativa com a Fazenda',
    severity: 'CRITICAL',
    dimension: 'compliance',
    whyItMatters:
      'Dívida ativa é débito tributário inscrito pela Fazenda Pública (federal, estadual ou municipal) cuja cobrança já foi formalizada. Indica grave inadimplência fiscal e risco direto de insolvência. Acima de R$ 500k é bloqueante automático pelo framework.',
    evidenceHints: [
      'Valor inscrito em CDA (Certidão de Dívida Ativa)',
      'Natureza do débito (IRPJ, ICMS, ISS, contribuições)',
      'Data da inscrição',
    ],
    suggestedAction:
      'Solicitar Certidão Positiva de Débitos com Efeitos de Negativa (CPD-EN), comprovante de parcelamento ativo ou quitação. Se ainda litigioso, pedir número do processo e petição inicial.',
  },
  {
    match: /score\s*de\s*crédito|score\s*de\s*credito|credit\s*score\s*baixo/i,
    title: 'Score de Crédito PJ Comprometido',
    severity: 'MEDIUM',
    dimension: 'creditRisk',
    whyItMatters:
      'Score de crédito baixo em bureaus (Serasa, BoaVista) indica histórico de inadimplência financeira. Eleva o risco de chargebacks por insolvência e de inadimplência em antecipações.',
    evidenceHints: ['Faixa do score', 'Protestos ativos', 'Títulos em aberto em outras instituições'],
    suggestedAction:
      'Restringir antecipação nos primeiros 90 dias e aplicar rolling reserve padrão ou reforçado, dependendo da faixa.',
  },
  {
    match: /protesto/i,
    title: 'Protestos Ativos',
    severity: 'HIGH',
    dimension: 'creditRisk',
    whyItMatters:
      'Protestos formalizados em cartório indicam títulos vencidos não pagos. Sinaliza problemas de liquidez recentes e risco elevado de inadimplência.',
    evidenceHints: ['Quantidade de protestos', 'Valor total protestado', 'Data do protesto mais recente'],
    suggestedAction:
      'Solicitar comprovante de quitação ou acordo sobre cada protesto antes de aprovar. Considerar rolling reserve elevado.',
  },

  // ─── Identity / Registration ─────────────────────────────────────────
  {
    match: /cnpj\s*inat|cnpj\s*irreg|situação\s*cadastral|situacao\s*cadastral/i,
    title: 'Situação Cadastral do CNPJ Irregular',
    severity: 'CRITICAL',
    dimension: 'identity',
    whyItMatters:
      'CNPJ com situação "INATIVA", "SUSPENSA" ou "INAPTA" na Receita Federal não pode exercer atividades econômicas legalmente. É bloqueio absoluto pela Circular BCB 3.978/2020.',
    evidenceHints: ['Status exato na Receita', 'Data da alteração do status'],
    suggestedAction:
      'Exigir regularização junto à Receita Federal antes de qualquer aprovação. Solicitar comprovante atualizado do cartão CNPJ.',
  },
  {
    match: /mcc\s*diverg|mcc\s*conflit|cnae\s*diverg|cnae\s*conflit|mcc\s*vs\s*cnae/i,
    title: 'Divergência entre MCC Declarado e CNAE Registrado',
    severity: 'MEDIUM',
    dimension: 'identity',
    whyItMatters:
      'O MCC (Merchant Category Code) classifica a atividade para o adquirente e redes, e o CNAE é a classificação na Receita. Divergências podem indicar enquadramento incorreto (risco de chargeback por categoria errada) ou tentativa de ocultar atividade real.',
    evidenceHints: ['MCC informado no questionário', 'CNAE(s) registrados na Receita'],
    suggestedAction:
      'Pedir justificativa ao cliente. Revisar o enquadramento com o time comercial se a divergência for justificável (ex: marketplace multi-categoria).',
  },
  {
    match: /capital\s*social/i,
    title: 'Capital Social Incompatível',
    severity: 'MEDIUM',
    dimension: 'financial',
    whyItMatters:
      'Capital social muito baixo em relação ao volume declarado sugere subcapitalização. Combinado com shell score elevado, é forte indício de fachada.',
    evidenceHints: ['Valor declarado do capital social', 'TPV mensal declarado', 'Razão TPV/Capital'],
    suggestedAction:
      'Solicitar DRE/balanço ou extratos bancários que justifiquem a capacidade operacional declarada.',
  },
  {
    match: /empresa\s*(nova|recém|recem|muito\s*nova|< ?6\s*meses)/i,
    title: 'Empresa com Pouco Tempo de Operação',
    severity: 'MEDIUM',
    dimension: 'evolution',
    whyItMatters:
      'Empresas com menos de 6 meses não têm histórico suficiente para avaliação de risco. A taxa de mortalidade no primeiro ano é de ~20%. Abaixo de 6 meses é bloqueio automático (B02).',
    evidenceHints: ['Data de abertura', 'Idade em meses'],
    suggestedAction:
      'Aguardar 6 meses de operação OU exigir documentação extensiva (contratos firmados, primeiros pedidos, infraestrutura) para aprovar antes.',
  },

  // ─── Owners / QSA ─────────────────────────────────────────────────────
  {
    match: /sanç|sanc|ofac|interpol|lista\s*de\s*san/i,
    title: 'Presença em Lista de Sanções Internacionais',
    severity: 'BLOQUEANTE',
    dimension: 'owners',
    whyItMatters:
      'Transacionar com entidades em listas de sanções (OFAC, UE, ONU, COAF) é ilegal. Pode gerar multas milionárias e responsabilização criminal. Lei 9.613/1998 Art. 10 (PLD/FT). Bloqueio automático (B03).',
    evidenceHints: ['Nome da lista', 'Data da inclusão', 'Entidade sancionada (empresa ou sócio)'],
    suggestedAction:
      'Recusa imediata e intransigente. Não há possibilidade de aprovação enquanto a sanção estiver ativa. Registrar em comunicação ao COAF quando aplicável.',
  },
  {
    match: /pep|politicamente\s*exposto/i,
    title: 'Pessoa Politicamente Exposta (PEP)',
    severity: 'HIGH',
    dimension: 'owners',
    whyItMatters:
      'PEPs têm risco elevado de envolvimento com corrupção ou lavagem de dinheiro. A Circular BCB 3.978/2020 exige due diligence reforçada (EDD).',
    evidenceHints: ['Nome do sócio PEP', 'Cargo ou função pública', 'Período de exercício'],
    suggestedAction:
      'Exigir declaração formal de PEP + justificativa comercial + parecer do time de PLD antes de aprovar. Monitoramento intenso obrigatório.',
  },
  {
    match: /processo\s*judicial|processos\s*dos?\s*sócio/i,
    title: 'Processos Judiciais Relevantes',
    severity: 'HIGH',
    dimension: 'compliance',
    whyItMatters:
      'Processos ativos (especialmente trabalhistas de grande volume, criminais ou por fraude) sinalizam risco reputacional e operacional.',
    evidenceHints: ['Quantidade', 'Tipo (trabalhista, cível, criminal)', 'Valor total envolvido'],
    suggestedAction:
      'Revisar cada processo individualmente. Processos criminais por fraude/estelionato = recusa; processos trabalhistas em massa = investigar gestão de pessoas.',
  },

  // ─── CAF / Biometry ──────────────────────────────────────────────────
  {
    match: /liveness|prova\s*de\s*vida/i,
    title: 'Liveness Reprovado ou com Baixa Probabilidade',
    severity: 'HIGH',
    dimension: 'biometria',
    whyItMatters:
      'Liveness verifica se a foto é de uma pessoa real no momento da captura (não foto de foto, não deepfake). Reprovação indica possível tentativa de fraude de identidade.',
    evidenceHints: ['Probabilidade retornada pela CAF', 'Quantidade de tentativas'],
    suggestedAction:
      'Solicitar nova captura com orientações claras (boa iluminação, sem óculos, olhar para a câmera). Se persistir, exigir selfie presencial com documento.',
  },
  {
    match: /facematch|face\s*match/i,
    title: 'FaceMatch Abaixo do Limiar',
    severity: 'HIGH',
    dimension: 'biometria',
    whyItMatters:
      'Indica que o rosto da selfie não corresponde suficientemente ao rosto do documento. Pode ser fraude de identidade (documento de terceiros) ou qualidade ruim da captura.',
    evidenceHints: ['Percentual de similaridade', 'Documento utilizado'],
    suggestedAction:
      'Solicitar nova captura. Se o score continuar baixo, pedir documento adicional (CNH) e presencial se necessário.',
  },
  {
    match: /deepfake/i,
    title: 'Deepfake Detectado',
    severity: 'BLOQUEANTE',
    dimension: 'biometria',
    whyItMatters:
      'Deepfake = uso de IA para gerar imagem/vídeo falso. Fraude biométrica objetiva. Não existe cenário legítimo de aprovação.',
    evidenceHints: ['Confiança do detector'],
    suggestedAction: 'Recusa imediata. Registrar tentativa de fraude e bloquear CPF na base.',
  },
  {
    match: /documentoscopia|documento\s*adulter|documento\s*falsificad/i,
    title: 'Documentoscopia — Documento Suspeito',
    severity: 'HIGH',
    dimension: 'biometria',
    whyItMatters:
      'A análise de documentoscopia da CAF detectou inconsistências visuais/estruturais no documento apresentado (possível adulteração, falsificação ou baixa qualidade).',
    evidenceHints: ['Tipo de inconsistência detectada', 'Score de autenticidade'],
    suggestedAction:
      'Solicitar novo upload com foto clara, boa iluminação. Se persistir, exigir documento presencial ou de outra tipologia (CNH).',
  },

  // ─── Reputation ───────────────────────────────────────────────────────
  {
    match: /adverse\s*media|mídia\s*adversa|midia\s*adversa/i,
    title: 'Mídia Adversa Detectada',
    severity: 'HIGH',
    dimension: 'reputation',
    whyItMatters:
      'Presença em notícias com sentimento negativo, especialmente sobre fraude, lavagem ou corrupção, gera risco reputacional para a Pagsmile. Acima de certo limiar é bloqueante (B07).',
    evidenceHints: ['Temas das notícias', 'Quantidade de publicações', 'Veículos envolvidos'],
    suggestedAction:
      'Ler as notícias. Se temas graves (fraude/lavagem/corrupção) = recusa. Se outros temas = ponderar no parecer com contexto.',
  },
  {
    match: /reclame\s*aqui|reclamaç.+massiv|baixa\s*reputaç/i,
    title: 'Reputação Negativa em Canais de Consumidor',
    severity: 'MEDIUM',
    dimension: 'reputation',
    whyItMatters:
      'Reclamações massivas ou nota baixa no Reclame Aqui indicam má experiência de cliente. Correlaciona com alto volume de chargebacks.',
    evidenceHints: ['Nota RA', 'Quantidade de reclamações nos últimos 6 meses'],
    suggestedAction:
      'Aplicar rolling reserve reforçado e monitorar taxa de chargeback nos primeiros 60 dias.',
  },

  // ─── ESG ──────────────────────────────────────────────────────────────
  {
    match: /lista\s*suja|trabalho\s*escravo|mte/i,
    title: 'Lista Suja MTE — Trabalho Análogo à Escravidão',
    severity: 'BLOQUEANTE',
    dimension: 'esg',
    whyItMatters:
      'Empresas na Lista Suja do Ministério do Trabalho por condições análogas à escravidão são bloqueio absoluto (B08). Fazer negócio pode gerar responsabilidade solidária.',
    evidenceHints: ['Data da inclusão', 'Auto de infração'],
    suggestedAction: 'Recusa imediata. Documentar o motivo de forma explícita.',
  },
  {
    match: /ibama|embargo\s*ambient/i,
    title: 'Embargo Ambiental IBAMA',
    severity: 'BLOQUEANTE',
    dimension: 'esg',
    whyItMatters: 'Embargos ambientais ativos indicam infração grave e são bloqueio automático (B09).',
    evidenceHints: ['Número do auto', 'Data', 'Local'],
    suggestedAction: 'Recusa até comprovação de baixa do embargo pelo IBAMA.',
  },

  // ─── Questionnaire inconsistencies (SENTINEL) ────────────────────────
  {
    match: /política.*devoluç|politica.*devoluc|reembolso|refund/i,
    title: 'Políticas de Devolução/Reembolso Insuficientes',
    severity: 'MEDIUM',
    dimension: 'compliance',
    whyItMatters:
      'Política de devolução clara é obrigatória pelo CDC (Código de Defesa do Consumidor) e reduz drasticamente taxa de chargeback.',
    evidenceHints: ['Resposta do cliente no questionário', 'Link da política publicada'],
    suggestedAction:
      'Solicitar URL da política de devolução publicada no site. Se inexistente, exigir criação antes da aprovação.',
  },
  {
    match: /volume\s*(declarado|incompat)|tpv.*incompat|faixa\s*de\s*emprega/i,
    title: 'Volume Declarado Incompatível com Porte',
    severity: 'HIGH',
    dimension: 'financial',
    whyItMatters:
      'TPV declarado muito acima do que a estrutura real da empresa (funcionários, capital, faixa de receita) suporta é sinal clássico de superestimativa ou de operação não declarada.',
    evidenceHints: [
      'TPV declarado no questionário',
      'Faixa de empregados real',
      'Faixa de receita RFB',
      'Capital social',
    ],
    suggestedAction:
      'Solicitar DRE dos últimos 12 meses + extratos bancários. Se justificado, aplicar monitoramento reforçado; se não justificado, revisão manual ou recusa.',
  },
  {
    match: /pld|coaf|lavagem/i,
    title: 'Pontos de Atenção em PLD/FT',
    severity: 'HIGH',
    dimension: 'compliance',
    whyItMatters:
      'Respostas no questionário indicam maturidade insuficiente em Prevenção à Lavagem de Dinheiro e Financiamento ao Terrorismo. Circular BCB 3.978/2020 exige políticas documentadas.',
    evidenceHints: ['Respostas das seções de PLD/FT', 'Declarações sobre COAF', 'Políticas documentadas'],
    suggestedAction:
      'Exigir política de PLD documentada e treinamento de funcionários antes de aprovar. Monitoramento intenso obrigatório nos primeiros 90 dias.',
  },
];

const SOURCE_FROM_PREFIX = {
  'V4:': { label: 'Big Data Corp (dados objetivos)', tone: 'blue', badge: 'BDC' },
  'CAF:': { label: 'CAF — Verificação de Identidade', tone: 'purple', badge: 'CAF' },
  'SENTINEL:': { label: 'SENTINEL IA — Análise Qualitativa', tone: 'amber', badge: 'SENTINEL' },
};

function cleanText(flag) {
  return flag
    .replace(/^(V4|CAF|SENTINEL):\s*/i, '')
    .replace(/\[FONTE:\s*[^\]]+\]\s*/gi, '')
    .trim();
}

function extractExplicitSource(flag) {
  const m = flag.match(/\[FONTE:\s*([^\]]+)\]/i);
  return m ? m[1].trim() : null;
}

function inferPrefixSource(flag) {
  for (const [prefix, meta] of Object.entries(SOURCE_FROM_PREFIX)) {
    if (flag.toUpperCase().startsWith(prefix)) return meta;
  }
  return { label: 'Sistema de análise', tone: 'slate', badge: 'GERAL' };
}

/**
 * Enriches a single red flag string into a rich descriptor.
 */
export function enrichRedFlag(rawFlag) {
  const text = cleanText(rawFlag);
  const entry = FLAG_CATALOGUE.find(e => e.match.test(text));
  const explicitSource = extractExplicitSource(rawFlag);
  const prefixSource = inferPrefixSource(rawFlag);

  if (entry) {
    return {
      raw: rawFlag,
      text,
      title: entry.title,
      severity: entry.severity,
      dimension: entry.dimension,
      whyItMatters: entry.whyItMatters,
      evidenceHints: entry.evidenceHints,
      suggestedAction: entry.suggestedAction,
      source: explicitSource || prefixSource.label,
      sourceBadge: prefixSource.badge,
      sourceTone: prefixSource.tone,
      matched: true,
    };
  }

  // Fallback — no catalogue match but we still produce a complete card
  return {
    raw: rawFlag,
    text,
    title: text.length > 80 ? text.slice(0, 77) + '…' : text,
    severity: 'MEDIUM',
    dimension: null,
    whyItMatters:
      'Este alerta foi sinalizado pelo sistema de análise de risco. Revise o texto literal do alerta acima e cruze com os dados do questionário, BDC e CAF nas seções abaixo para entender o contexto completo.',
    evidenceHints: ['Ver texto completo do alerta acima', 'Consultar Análise Dimensional (bloco 9)'],
    suggestedAction:
      'Caso não esteja claro de onde veio o alerta, consulte o parecer SENTINEL completo (bloco 10) ou a aba Histórico (logs de integração).',
    source: explicitSource || prefixSource.label,
    sourceBadge: prefixSource.badge,
    sourceTone: prefixSource.tone,
    matched: false,
  };
}

export function enrichRedFlags(flags = []) {
  return flags.map(enrichRedFlag);
}