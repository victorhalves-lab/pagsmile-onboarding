/**
 * Glossário completo de explicações didáticas para todos os campos e conceitos BDC/compliance.
 * Usado pelo BdcSectionInterpreter para dar contexto a cada item de análise.
 */

// Risk level explanations
export const RISK_EXPLANATIONS = {
  CRITICO: 'Este item representa um risco crítico que normalmente impede a aprovação. Requer ação imediata e revisão de compliance sênior.',
  ALTO: 'Risco elevado que demanda investigação aprofundada antes de qualquer decisão. Pode resultar em recusa ou condições restritivas.',
  MEDIO: 'Ponto de atenção que não bloqueia a operação mas deve ser monitorado e documentado no dossiê.',
  BAIXO: 'Risco menor, dentro de parâmetros aceitáveis, mas registrado para transparência.',
  OK: 'Resultado positivo — dentro dos parâmetros esperados de compliance.',
  INFO: 'Informação factual sem impacto direto no score de risco, usada para contexto.',
};

// Field-specific deep explanations
export const FIELD_EXPLANATIONS = {
  // ─── IDENTITY ───
  'Idade da empresa': {
    what: 'Tempo desde a abertura do CNPJ na Receita Federal.',
    why: 'Empresas muito novas (< 2 anos) têm taxa de mortalidade de ~20% no primeiro ano (dados SEBRAE 2023). Para pagamentos, representam risco maior de chargeback, fraude e abandono.',
    regulation: 'Circular BCB 3.978/2020 Art. 2º — exige avaliação do perfil de risco considerando tempo de existência.',
    thresholds: '< 6 meses: bloqueio automático | 6-12 meses: risco alto | 1-2 anos: risco médio | 2-5 anos: risco baixo | > 5 anos: OK',
  },
  'Situação cadastral': {
    what: 'Status oficial do CNPJ perante a Receita Federal do Brasil.',
    why: 'CNPJ com status diferente de ATIVA (suspensa, inapta, baixada) não pode legalmente exercer atividades comerciais nem processar transações financeiras.',
    regulation: 'IN RFB 1.863/2018 — define situações cadastrais. Circular BCB 3.978/2020 Art. 2º — veda operações com CNPJs inativos.',
    thresholds: 'ATIVA: OK | Qualquer outro status: bloqueio automático (B01)',
  },
  'Capital social': {
    what: 'Valor declarado pelos sócios como investimento inicial na empresa, registrado no Contrato Social e na Receita Federal.',
    why: 'Capital social muito baixo (< R$1.000) combinado com alto TPV declarado indica desproporcionalidade operacional. Pode ser indicativo de empresa de fachada ou lavagem de dinheiro.',
    regulation: 'Art. 1.055 do Código Civil — capital deve ser proporcional ao objeto social.',
    thresholds: '< R$1.000: risco alto (+15 pts) | R$1.000-R$10.000: risco médio (+5 pts) | > R$10.000: OK',
  },
  'CNAE principal': {
    what: 'Classificação Nacional de Atividades Econômicas — código que identifica a atividade principal da empresa.',
    why: 'Certos CNAEs são de alto risco para processamento de pagamentos: jogos de azar (9200), armas (4789004), tabaco (1220), serviços financeiros não regulados (6499). Divergência entre CNAE e atividade declarada pode indicar evasão regulatória.',
    regulation: 'Resolução CMN 4.893/2021 — classifica atividades por nível de risco para instituições de pagamento.',
  },
  'Shell Company score': {
    what: 'Probabilidade calculada pela BDC de que a empresa seja uma "empresa de fachada" — sem atividade real.',
    why: 'O score combina indicadores como: zero empregados + sem domínio ativo + sem passagens web + endereço virtual + capital mínimo + CNAE genérico. Empresas de fachada são comumente usadas para lavagem de dinheiro.',
    regulation: 'Lei 9.613/1998 Art. 10 — obrigação de identificar e reportar operações suspeitas de lavagem.',
    thresholds: '> 80%: bloqueio automático (B05) | 50-80%: risco crítico | 30-50%: risco alto | < 30%: OK',
  },
  'Nível de atividade': {
    what: 'Indicador BDC que mede o quanto a empresa demonstra sinais de operação real: emissão de NFs, movimentação web, participação em licitações, etc.',
    why: 'Empresas com baixo nível de atividade podem não ter operação real. Combinado com TPV alto declarado, indica inconsistência grave.',
    thresholds: '> 60%: OK | 30-60%: risco médio (+10 pts) | < 30%: risco alto (+20 pts)',
  },
  // ─── COMPLIANCE ───
  'Sanções empresa': {
    what: 'Verificação se a empresa consta em listas de sanções nacionais e internacionais: OFAC SDN (EUA), EU Consolidated List, UN Security Council, COAF, CEIS (CGU), CNEP (CGU).',
    why: 'Transacionar com entidade sancionada é ilegal e pode resultar em multas milionárias, bloqueio de ativos e responsabilização criminal dos administradores.',
    regulation: 'Lei 9.613/1998 Art. 10 (PLD/FT) + Circular BCB 3.978/2020 Art. 16 + OFAC Sanctions Compliance.',
  },
  'PEP empresa': {
    what: 'PEP = Pessoa Politicamente Exposta. Verifica se a empresa ou seus representantes ocupam ou ocuparam cargos públicos relevantes.',
    why: 'PEPs são considerados de risco elevado para lavagem de dinheiro e corrupção. Exigem Enhanced Due Diligence (EDD), aprovação em nível superior, e monitoramento reforçado.',
    regulation: 'Circular BCB 3.978/2020 Art. 14 — obrigatoriedade de EDD para PEPs.',
  },
  'Dívida ativa': {
    what: 'Inscrição em Dívida Ativa da União, Estados ou Municípios — dívidas tributárias não pagas que foram inscritas para cobrança judicial.',
    why: 'Dívida ativa indica inadimplência fiscal grave. Empresas com dívida ativa superior a R$500k demonstram incapacidade de honrar obrigações fiscais, o que é um proxy de risco financeiro.',
    regulation: 'Lei 6.830/1980 (Execuções Fiscais) — dívidas inscritas geram certidão positiva e podem levar à penhora de bens.',
    thresholds: '> R$500k: bloqueio (B06) +80 pts | R$100k-R$500k: +40 pts | < R$100k: +20 pts | R$0: OK',
  },
  'Processos judiciais': {
    what: 'Processos judiciais em que a empresa é parte (autora ou ré) em todas as esferas: cível, criminal, trabalhista e administrativa.',
    why: 'Processos criminais indicam risco direto. Processos trabalhistas massivos podem indicar práticas trabalhistas irregulares. Processos cíveis de alto valor indicam risco financeiro.',
    regulation: 'Circular BCB 3.978/2020 Art. 2º §2 — processos judiciais devem ser considerados na avaliação de risco.',
  },
  'Em cobrança': {
    what: 'Registros de negativação em bureaus de crédito (Serasa, SPC, SCPC, Boa Vista) indicando inadimplência.',
    why: 'Empresa negativada demonstra incapacidade de honrar compromissos financeiros. Para processamento de pagamentos, representa risco de chargeback e abandono.',
  },
  // ─── OWNERS ───
  'PEP identificado(s)': {
    what: 'Um ou mais sócios são Pessoas Politicamente Expostas — ocupam ou ocuparam cargos públicos de relevância.',
    why: 'A presença de PEP no QSA eleva automaticamente o risco de compliance. Requer aprovação de nível superior, monitoramento mensal e revisão anual da relação comercial.',
    regulation: 'Circular BCB 3.978/2020 Art. 14 + Resolução COAF 29/2017.',
  },
  'Processos dos sócios': {
    what: 'Processos judiciais individuais de cada sócio da empresa.',
    why: 'Sócios com processos criminais representam risco direto. Se o sócio majoritário tem múltiplos processos de execução fiscal, isso pode afetar a empresa.',
  },
  // ─── DIGITAL ───
  'Passagens web': {
    what: 'Número de vezes que a empresa foi mencionada em websites, diretórios, redes sociais e outras fontes online.',
    why: 'Empresa sem NENHUMA passagem web é extremamente suspeita — indica ausência total de presença digital, o que não é esperado para qualquer empresa que processa pagamentos. Zero passagens = +30 pts de risco.',
    thresholds: '0 total: risco crítico (+30 pts) | < 5 nos últimos 12m: risco alto (+15 pts) | > 5: OK',
  },
  // ─── ESG ───
  'Lista Suja MTE — Trabalho Escravo': {
    what: 'Cadastro de Empregadores que submeteram trabalhadores a condições análogas à escravidão, mantido pelo Ministério do Trabalho e Emprego.',
    why: 'Fazer negócio com empresa na Lista Suja pode resultar em responsabilização solidária. REJEIÇÃO AUTOMÁTICA IMEDIATA.',
    regulation: 'Portaria MTE 1.293/2017 + Art. 149 do Código Penal.',
  },
  'Embargo IBAMA': {
    what: 'Embargo ambiental imposto pelo IBAMA — Instituto Brasileiro do Meio Ambiente.',
    why: 'Indica infração ambiental grave (desmatamento ilegal, poluição, etc). Empresa com embargo ativo tem restrições operacionais e risco reputacional elevado.',
  },
  // ─── OWNERS ───
  'Total sócios/QSA': {
    what: 'Número de sócios e administradores registrados no Quadro de Sócios e Administradores (QSA) da Receita Federal.',
    why: 'Empresa sem sócios registrados é irregular. Muitos sócios PF com participações mínimas pode indicar estrutura para diluir responsabilidade.',
    regulation: 'Circular BCB 3.978/2020 Art. 16 — exige identificação de todos os beneficiários finais com participação ≥ 25%.',
  },
  'Divergência QSA padrão vs tempo real': {
    what: 'Diferença entre o QSA na base padrão BDC e o QSA consultado em tempo real na Receita Federal.',
    why: 'Indica alteração societária recente que pode não estar refletida nos dados históricos. Pode significar saída de sócio problemático ou entrada de laranja.',
  },
  'Doações eleitorais': {
    what: 'Valor total de doações eleitorais registradas no TSE (Tribunal Superior Eleitoral) por sócios da empresa.',
    why: 'Doações elevadas indicam exposição política indireta. Acima de R$100k requer atenção especial.',
    regulation: 'Lei 9.504/1997 — limites de doações eleitorais.',
  },
  'Envolvimento político': {
    what: 'Sócios com vínculos políticos: candidatura a cargos, filiação partidária, cargos públicos.',
    why: 'Vínculos políticos elevam o risco PEP e requerem monitoramento reforçado.',
    regulation: 'Circular BCB 3.978/2020 Art. 14.',
  },
  // ─── DIGITAL ───
  'Domínio': {
    what: 'Site oficial da empresa na internet, incluindo idade do domínio, certificado SSL e plataforma tecnológica.',
    why: 'Site sem SSL (https) indica baixa maturidade digital. Domínio com menos de 1 ano é suspeito para empresas que declaram grande volume de transações.',
    thresholds: 'Sem SSL: +15 pts | Domínio < 1 ano: +10 pts',
  },
  // ─── FINANCIAL ───
  'Grupo econômico': {
    what: 'Conjunto de empresas vinculadas por participações societárias comuns.',
    why: 'Grupos com mais de 20 empresas são complexos e difíceis de monitorar. Participações circulares podem indicar lavagem de dinheiro.',
    regulation: 'Circular BCB 3.978/2020 Art. 16 §§1-4.',
  },
  'Participação circular detectada': {
    what: 'Empresa A tem participação na B, que tem participação na C, que tem participação na A — formando um ciclo.',
    why: 'Estrutura clássica de lavagem de dinheiro ou ocultação de beneficiários finais. Risco CRÍTICO.',
    regulation: 'Lei 9.613/1998 Art. 10.',
  },
  // ─── REPUTATION ───
  'Mídia muito negativa': {
    what: 'Menções na mídia com sentimento classificado como MUITO NEGATIVO pelo algoritmo BDC de NLP.',
    why: 'Se associada a fraude, lavagem ou corrupção, gera bloqueio automático (B07). Mesmo sem bloqueio, adverse media severa indica risco reputacional grave.',
  },
  // ─── EVOLUTION ───
  'Queda de capital social': {
    what: 'Redução de mais de 50% no capital social registrado ao longo do tempo.',
    why: 'Possível esvaziamento patrimonial — técnica usada antes de falência ou para proteger bens de execuções judiciais.',
    thresholds: 'Queda > 50%: +20 pts',
  },
  'Queda drástica de funcionários': {
    what: 'Redução de mais de 80% no número de funcionários em relação ao pico histórico.',
    why: 'Indica crise operacional grave, possível encerramento de atividades, ou demissão em massa.',
    thresholds: 'Queda > 80%: +15 pts',
  },
  // ─── CREDIT RISK ───
  'Score de crédito PJ': {
    what: 'Score de crédito calculado por bureaus (Serasa/SPC/Boa Vista) baseado no histórico de pagamentos da empresa.',
    why: 'Score baixo indica alto risco de inadimplência. Para processamento de pagamentos, empresas inadimplentes geram risco de chargeback e abandono de operação.',
    thresholds: '< 300: Crítico (+40 pts, inadimplente provável) | 300-500: Alto (+20 pts) | 500-700: Médio (+5 pts) | > 700: Bom (-10 pts)',
  },
  'Protestos': {
    what: 'Títulos protestados em cartórios — dívidas levadas a protesto por credores por falta de pagamento.',
    why: 'Protestos indicam inadimplência real confirmada. Muitos protestos indicam padrão de não-pagamento.',
    thresholds: '> 5 protestos: Alto risco (+20 pts) | 1-5: Médio (+10 pts)',
  },
  'Cheques devolvidos': {
    what: 'Registro de cheques sem fundos devolvidos pelo banco (CCF — Cadastro de Emitentes de Cheques sem Fundos).',
    why: 'Indica histórico de inadimplência bancária e má gestão financeira.',
  },
  'Falências/Recuperações judiciais': {
    what: 'Registros de falência decretada ou recuperação judicial em andamento.',
    why: 'Risco financeiro extremo — empresa em falência não pode honrar compromissos. Recuperação judicial indica grave crise financeira.',
  },
  'Alterações cadastrais recentes': {
    what: 'Mais de 3 alterações no cadastro da empresa nos últimos 12 meses.',
    why: 'Instabilidade cadastral frequente pode indicar tentativa de mascarar atividade irregular ou evasão de fiscalização.',
    thresholds: '> 3 alterações em 12 meses: +15 pts',
  },
};

// Section-level explanations
export const SECTION_EXPLANATIONS = {
  identity: {
    title: 'Identificação Cadastral',
    desc: 'Dados oficiais da empresa na Receita Federal: razão social, nome fantasia, data de abertura, situação cadastral, porte, capital social, natureza jurídica e classificação econômica (CNAE).',
    importance: 'A identificação cadastral é a base de toda análise KYC (Know Your Customer). Divergências aqui indicam problemas fundamentais.',
  },
  owners: {
    title: 'Quadro Societário & UBOs',
    desc: 'Sócios, administradores e beneficiários finais (UBOs). Inclui verificação de PEPs, sanções, processos judiciais individuais e participações cruzadas.',
    importance: 'A Circular BCB 3.978/2020 exige identificação de todos os beneficiários finais com participação ≥ 25%. PEPs e sancionados são bloqueantes.',
  },
  digital: {
    title: 'Pegada Digital',
    desc: 'Presença online da empresa: domínios web, idade do site, SSL, passagens web, marketplaces, anúncios. Indica se a empresa tem operação digital real.',
    importance: 'Para empresas de pagamentos, ausência de pegada digital é um forte indicador de empresa de fachada ou shell company.',
  },
  compliance: {
    title: 'Compliance & Regulatório',
    desc: 'Sanções (OFAC, EU, UN, CEIS, CNEP), PEPs, dívida ativa, processos judiciais (cível, criminal, trabalhista), negativação/cobrança e registro em órgãos reguladores.',
    importance: 'Dimensão mais crítica — gera bloqueios automáticos e tem o maior peso no score V4 (22%).',
  },
  reputation: {
    title: 'Reputação & Mídia',
    desc: 'Exposição na mídia (positiva, neutra, negativa), avaliações em plataformas de consumidores (Reclame Aqui), prêmios e certificações.',
    importance: 'Mídia muito negativa associada a fraude ou corrupção gera bloqueio automático (B07). Boa reputação reduz o score.',
  },
  financial: {
    title: 'Financeiro & Grupo Econômico',
    desc: 'Grupo econômico, participações cruzadas, MCC real, licenças, patentes, marcas registradas e propriedade industrial.',
    importance: 'Participações circulares no grupo econômico podem indicar lavagem de dinheiro. MCC divergente indica possível evasão regulatória.',
  },
  evolution: {
    title: 'Evolução Cadastral',
    desc: 'Série temporal de mudanças: capital social, funcionários, CNAEs, razão social. Detecta instabilidade e esvaziamento patrimonial.',
    importance: 'Queda abrupta de capital ou funcionários indica crise. Múltiplas alterações de CNAE podem indicar tentativa de mascarar atividade irregular.',
  },
  esg: {
    title: 'ESG & Trabalho',
    desc: 'Lista Suja MTE (trabalho escravo), embargos IBAMA, alertas de desmatamento e scores ESG (ambiental, social, governança).',
    importance: 'Lista Suja MTE é bloqueante. Embargo IBAMA indica infração ambiental grave.',
  },
  contacts: {
    title: 'Canais de Contato',
    desc: 'Telefones, e-mails e endereços associados ao CNPJ e a pessoas vinculadas, com verificação de atividade.',
    importance: 'Todos os e-mails genéricos (Gmail) sem e-mail corporativo é um flag. Telefones inativos indicam abandono.',
  },
  employeesKyc: {
    title: 'KYC de Funcionários',
    desc: 'Verificação de compliance dos funcionários-chave e representantes legais.',
    importance: 'Funcionários em listas de sanções ou com processos criminais representam risco indireto.',
  },
  sectorial: {
    title: 'Análise Setorial',
    desc: 'Indicadores específicos do setor de atuação: regulamentação, sazonalidade, risco inerente.',
    importance: 'Setores com regulamentação específica (saúde, educação, jogos) requerem licenças adicionais.',
  },
  assets: {
    title: 'Ativos & Propriedade',
    desc: 'Propriedade intelectual (patentes, marcas), licenças e autorizações regulatórias.',
    importance: 'Ativos registrados indicam empresa com operação real e investimento.',
  },
  creditRisk: {
    title: 'Risco de Crédito',
    desc: 'Score de crédito, protestos, cheques devolvidos, falências, recuperações judiciais, probabilidade de inadimplência e comportamento de pagamento.',
    importance: 'Dimensão financeira direta — empresas com score baixo ou falências representam risco alto de chargeback e abandono. Peso: 9% no score V4.',
  },
};

// Block code explanations
export const BLOCK_EXPLANATIONS = {
  B01: { title: 'CNPJ Inativo', desc: 'A empresa não possui situação cadastral ATIVA na Receita Federal. Pode estar suspensa, inapta ou baixada.', consequence: 'Bloqueio automático — empresa não pode legalmente exercer atividades econômicas.', regulation: 'Circular BCB 3.978/2020 Art. 2º + IN RFB 1.863/2018' },
  B02: { title: 'Empresa muito nova', desc: 'Empresa com menos de 6 meses de existência desde a abertura do CNPJ.', consequence: 'Bloqueio automático — sem histórico suficiente para avaliação de risco.', regulation: 'Política interna — taxa de mortalidade no 1º ano: ~20% (SEBRAE)' },
  B03: { title: 'Sanções', desc: 'Empresa ou sócio encontrado em listas de sanções nacionais ou internacionais (OFAC, EU, UN, CEIS, CNEP).', consequence: 'Bloqueio automático — transacionar com entidade sancionada é ilegal.', regulation: 'Lei 9.613/1998 Art. 10 + Circular BCB 3.978/2020 Art. 16' },
  B05: { title: 'Shell Company', desc: 'Probabilidade > 80% de ser empresa de fachada segundo algoritmo BDC.', consequence: 'Bloqueio automático — risco de lavagem de dinheiro.', regulation: 'Lei 9.613/1998 (PLD/FT)' },
  B06: { title: 'Dívida Ativa elevada', desc: 'Total inscrito em dívida ativa superior a R$500.000.', consequence: 'Bloqueio automático — inadimplência fiscal grave.', regulation: 'Lei 6.830/1980' },
  B07: { title: 'Adverse Media grave', desc: 'Menções na mídia com sentimento MUITO NEGATIVO associadas a fraude, lavagem ou corrupção.', consequence: 'Bloqueio automático — risco reputacional e regulatório extremo.', regulation: 'Circular BCB 3.978/2020 Art. 2º §2' },
  B08: { title: 'Lista Suja MTE', desc: 'Empresa encontrada no Cadastro de Empregadores com Trabalho Escravo.', consequence: 'Bloqueio automático — legislação trabalhista brasileira.', regulation: 'Portaria MTE 1.293/2017 + Art. 149 CP' },
  B09: { title: 'Embargo IBAMA', desc: 'Empresa com embargo ambiental ativo do IBAMA.', consequence: 'Bloqueio automático — infração ambiental grave.', regulation: 'Lei 9.605/1998 (Crimes Ambientais)' },
};