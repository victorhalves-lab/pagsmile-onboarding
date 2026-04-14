/**
 * BDCItemExplanations — Contextual explanations for every BDC analysis item.
 * Maps item labels to detailed, human-readable explanations.
 * Each explanation answers: What is this? Why does it matter? What does the value mean?
 */

const EXPLANATIONS = {
  // ═══ IDENTITY ═══
  'Razão social': 'A Razão Social é o nome oficial da empresa registrado na Receita Federal. É o nome jurídico usado em contratos, notas fiscais e processos. Diferente do Nome Fantasia (nome comercial), a razão social identifica formalmente a empresa.',
  'Nome fantasia': 'O Nome Fantasia é o nome comercial pelo qual a empresa é conhecida no mercado. Nem toda empresa tem nome fantasia. Se não tiver, pode indicar que a empresa não tem operação voltada ao público.',
  'Idade da empresa': 'A idade da empresa é um dos indicadores mais importantes de risco. Empresas com menos de 1 ano têm taxa de falência muito alta (~20%). Menos de 2 anos ainda é considerado risco elevado. Empresas com mais de 5 anos são consideradas mais estáveis. Empresas com menos de 6 meses podem ser bloqueadas automaticamente (bloqueio B02) por não terem histórico suficiente para avaliação.',
  'Situação cadastral': 'A situação cadastral junto à Receita Federal indica se a empresa está Ativa, Inapta, Suspensa, Baixada ou Nula. Empresas com situação diferente de "Ativa" são automaticamente bloqueadas (bloqueio B01) pois não podem exercer atividades econômicas legalmente.',
  'Porte': 'O porte da empresa (MEI, ME, EPP, Demais) é definido pelo faturamento anual. MEI = até R$81k/ano. ME = até R$360k/ano. EPP = até R$4.8M/ano. "Demais" = acima de R$4.8M/ano. O porte deve ser compatível com o volume de transações que o merchant pretende processar. Um MEI processando R$500k/mês é uma inconsistência grave.',
  'Regime tributário': 'O regime tributário (Simples Nacional, Lucro Presumido, Lucro Real) indica o enquadramento fiscal. Simples Nacional é para empresas menores. Lucro Real geralmente indica empresas maiores e mais complexas. MEI tem regime simplificado. O regime tributário ajuda a validar se o porte declarado é consistente.',
  'Capital social': 'O Capital Social é o valor que os sócios declararam investir na empresa. Capital muito baixo (< R$1.000) pode indicar empresa de fachada ou falta de comprometimento dos sócios. Capital social deve ser proporcional ao volume de negócios — uma empresa que quer processar milhões por mês com capital de R$1.000 é uma red flag grave.',
  'Natureza jurídica': 'A Natureza Jurídica define o tipo legal da empresa: LTDA (Limitada), S.A. (Sociedade Anônima), EIRELI (Empresa Individual), SLU (Sociedade Limitada Unipessoal), etc. Cada tipo tem regras diferentes de responsabilidade dos sócios. Algumas naturezas jurídicas (como associações e cooperativas) podem indicar riscos específicos dependendo do contexto.',
  'CNAE principal': 'O CNAE (Classificação Nacional de Atividades Econômicas) identifica oficialmente o ramo de atividade da empresa. Alguns CNAEs são considerados de alto risco para compliance: jogos/apostas (9200), serviços financeiros não classificados (6499), intermediação financeira (6619), comércio de armas (4789004). Se o CNAE não corresponde ao que a empresa diz fazer, é uma red flag.',
  'Endereço principal': 'O endereço principal registrado na Receita Federal. Deve ser verificado se é um endereço real ou um escritório virtual/coworking. Endereços em escritórios virtuais podem indicar empresa sem operação física real, o que é uma característica comum de empresas de fachada.',
  'E-mail principal': 'O e-mail principal registrado para a empresa. E-mails genéricos (@gmail, @hotmail) podem indicar menor formalização. E-mails corporativos (@empresa.com.br) indicam maior estruturação. A ausência de e-mail registrado pode ser um indicador negativo.',
  'Telefone principal': 'O telefone principal registrado para a empresa. A ausência de telefone pode indicar empresa sem operação real.',
  'Empregados (RAIS)': 'Número de empregados declarados na RAIS (Relação Anual de Informações Sociais). Empresa sem nenhum empregado pode ser um forte indicador de empresa de fachada (shell company), especialmente se declara alto volume de transações. Empresas de tecnologia podem ter poucos empregados e ainda ser legítimas, mas zero empregados combinado com outros indicadores negativos é uma red flag.',
  'Inscrição estadual': 'A Inscrição Estadual é o registro da empresa na Secretaria da Fazenda estadual. É obrigatória para empresas que comercializam produtos. A ausência de IE para uma empresa de comércio pode indicar irregularidade fiscal.',
  'Situação especial': 'Situação especial indica que a empresa está em processo de recuperação judicial, liquidação extrajudicial, intervenção ou falência. Qualquer situação especial é uma red flag grave e pode ser motivo de bloqueio, pois indica que a empresa está em dificuldades financeiras severas.',

  // ═══ OWNERS ═══
  'Total sócios/QSA': 'O QSA (Quadro de Sócios e Administradores) lista todas as pessoas físicas e jurídicas que são sócias ou administradoras da empresa. Uma empresa sem nenhum sócio registrado é uma anomalia grave. A análise individual de cada sócio (PEP, sanções, processos) é essencial para uma due diligence completa.',
  'PEP identificado(s)': 'PEP (Pessoa Politicamente Exposta) é qualquer pessoa que exerce ou exerceu nos últimos 5 anos um cargo público relevante: deputados, senadores, governadores, prefeitos, juízes, diretores de estatais, militares de alta patente, e seus FAMILIARES DIRETOS e PESSOAS PRÓXIMAS. PEPs representam risco maior de lavagem de dinheiro e corrupção por terem acesso a recursos públicos. A Circular BCB 3.978/2020 exige monitoramento reforçado de PEPs.',
  'PEP': 'PEP (Pessoa Politicamente Exposta) é qualquer pessoa que exerce ou exerceu nos últimos 5 anos um cargo público relevante. Inclui familiares e pessoas próximas. A presença de PEP não é automaticamente um impedimento, mas exige diligência reforçada e monitoramento contínuo conforme a Circular BCB 3.978/2020.',
  'Sócios em sanções': 'Sócios que aparecem em listas internacionais de sanções (OFAC, EU, UN, CEIS, CNEP) são BLOQUEIO AUTOMÁTICO. Fazer negócio com pessoa/empresa sancionada pode resultar em multas pesadíssimas e responsabilização criminal para a Pagsmile. O MatchRate indica o grau de correspondência — valores altos (>80) são matches quase certos, valores baixos podem ser homônimos.',
  'Processos dos sócios': 'Os processos judiciais dos sócios são uma extensão da análise da empresa. Sócios com processos criminais (fraude, estelionato, lavagem de dinheiro) representam risco direto para a operação. Processos cíveis (cobranças, indenizações) são menos graves mas indicam o perfil de litígio. A quantidade, natureza e valores dos processos devem ser analisados em conjunto.',
  'Influência do QSA': 'O nível de influência dos sócios mede suas conexões com outras empresas, políticos e organizações. Alta influência pode ser positiva (networking legítimo) ou negativa (exposição a riscos regulatórios). Deve ser analisada junto com outros indicadores.',
  'Doações eleitorais': 'Doações eleitorais dos sócios não são ilegais, mas doações de alto valor ou para partidos específicos podem indicar exposição política e exigem monitoramento reforçado. A legislação brasileira permite doações de pessoas físicas de até 10% da renda bruta do ano anterior.',
  'Envolvimento político': 'Envolvimento político do quadro societário com partidos, campanhas ou cargos públicos. Não é ilegal, mas exige atenção redobrada no compliance, pois pode indicar riscos de corrupção, tráfico de influência ou lavagem de dinheiro relacionados a atividades políticas.',

  // ═══ DIGITAL FOOTPRINT ═══
  'Domínio': 'O domínio da internet da empresa. Domínios muito novos (< 1 ano) combinados com empresa nova podem indicar operação recente não estabelecida. Ausência de SSL (certificado HTTPS) indica falta de segurança básica, o que é preocupante para qualquer empresa que processa pagamentos.',
  'Passagens web': 'Passagens web medem quantas vezes a empresa foi mencionada/encontrada em sites, diretórios, redes sociais e outros locais na internet. ZERO passagens web é um indicador MUITO FORTE de empresa de fachada — significa que a empresa não tem presença alguma na internet. Empresas legítimas, mesmo pequenas, geralmente têm alguma presença web.',
  'Nível de atividade': 'O Nível de Atividade é um score calculado pela Big Data Corp que indica se a empresa tem sinais reais de operação. Combina múltiplos indicadores: emissão de notas fiscais, participação em licitações, presença web, empregados, etc. Valores abaixo de 30% indicam empresa com pouca ou nenhuma atividade real. Abaixo de 10% é forte indicativo de empresa inativa ou de fachada.',
  'Shell Company score': 'O Shell Company Score (Score de Empresa de Fachada) é uma probabilidade calculada pela BDC de que a empresa seja uma "shell company" — uma empresa que existe legalmente mas NÃO tem operações reais. Acima de 30% = preocupante. Acima de 50% = grave. Acima de 80% = BLOQUEIO AUTOMÁTICO (B05). Indicadores: sem empregados, sem domínio, sem passagens web, endereço virtual, capital mínimo.',
  'Faixa de empregados': 'Estimativa da quantidade de funcionários da empresa com base em dados da RAIS, CAGED e outras fontes. Deve ser compatível com o porte e a atividade declarada. Uma empresa de tecnologia com 0 funcionários que diz processar milhões é uma inconsistência.',
  'Faixa de receita': 'Estimativa do faturamento anual da empresa com base em dados públicos e modelos estatísticos. Permite validar se o volume de transações declarado é compatível com o porte real da empresa.',
  'Domínio ativo': 'Indica se a empresa possui pelo menos um domínio de internet ativo e funcionando. Empresas sem domínio ativo podem ser mais difíceis de verificar e representam risco maior. Para empresas de e-commerce ou tecnologia, não ter domínio é uma red flag severa.',
  'Presença em marketplaces': 'Presença em marketplaces reconhecidos (Mercado Livre, Amazon, Shopee, Magazine Luiza) é um indicador POSITIVO de atividade real. Esses marketplaces fazem suas próprias verificações, então a presença neles adiciona uma camada de validação externa.',
  'Anúncios online': 'Anúncios online encontrados indicam que a empresa investe em marketing digital, o que é um sinal positivo de operação ativa.',

  // ═══ COMPLIANCE ═══
  'Sanções empresa': 'Verificação da empresa contra listas internacionais de sanções: OFAC (EUA), EU (União Europeia), UN (Nações Unidas), COAF (Brasil), CEIS/CNEP (CGU). Qualquer match confirmado é BLOQUEIO IMEDIATO. Fazer negócio com entidade sancionada pode resultar em multas de milhões de dólares e processo criminal.',
  'PEP empresa': 'Indica se a própria empresa é classificada como Pessoa Politicamente Exposta. Diferente de ter sócios PEP, a empresa PEP indica que ela própria tem vínculo direto com atividades governamentais.',
  'Dívida ativa': 'Dívida Ativa é quando a empresa deve impostos ou taxas ao governo e o débito foi inscrito em dívida ativa para cobrança judicial. Acima de R$100k já é preocupante. Acima de R$500k é BLOQUEIO AUTOMÁTICO (B06). Indica que a empresa não está cumprindo obrigações fiscais, o que aumenta o risco de irregularidades.',
  'Processos judiciais': 'Os processos judiciais da empresa mostram seu histórico de litígios. Processos CRIMINAIS são os mais graves (fraude, estelionato, crimes financeiros). Processos TRABALHISTAS em grande quantidade indicam problemas de gestão. Processos CÍVEIS de cobrança indicam inadimplência. A BDC retorna cada processo com: número CNJ, tribunal, tipo, assunto, status, valor da causa, partes envolvidas e movimentações.',
  'Em cobrança': 'Indica se a empresa está negativada — tem nome sujo em bureaus de crédito como Serasa, SPC, SCPC, ou tem protestos em cartório. A negativação indica que a empresa não está pagando suas dívidas, o que é um forte indicador de risco financeiro.',
  'Registro BCB/CVM/SUSEP': 'Registro no Banco Central (BCB), CVM (Comissão de Valores Mobiliários) ou SUSEP (Superintendência de Seguros) indica que a empresa é regulada. Isso é POSITIVO pois significa que está sujeita a supervisão e regras de compliance.',

  // ═══ REPUTATION ═══
  'Mídia muito negativa': 'Mídia muito negativa são notícias que associam a empresa a temas como FRAUDE, LAVAGEM DE DINHEIRO, CRIME, CORRUPÇÃO, ESCÂNDALO. Este é um dos indicadores mais graves de risco reputacional. A BDC analisa o sentimento das notícias usando IA e classifica como Very Negative quando há associação com temas criminais ou de extrema gravidade.',
  'Mídia negativa': 'Mídia negativa são notícias com sentimento negativo mas não necessariamente criminal — pode ser reclamações de clientes, problemas com produtos, processos publicados, etc. É um indicador de risco reputacional que deve ser analisado em contexto.',
  'Mídia neutra/positiva': 'Presença em mídia com sentimento neutro ou positivo indica exposição normal de mercado. É um indicador de operação ativa e transparente.',
  'Exposição na mídia': 'Indica se a empresa tem menções na mídia. A ausência total de menções na mídia pode indicar empresa com operação muito pequena ou pouco transparente.',
  'Prêmios/Certificações': 'Prêmios e certificações são indicadores POSITIVOS de qualidade e reconhecimento do mercado. Diminuem o score de risco.',

  // ═══ FINANCIAL ═══
  'Grupo econômico': 'O grupo econômico mostra quantas e quais empresas estão conectadas à empresa analisada através de vínculos societários diretos e indiretos. Grupos grandes (>20 empresas) exigem análise mais aprofundada pois a complexidade societária pode esconder atividades ilícitas.',
  'MCC real': 'O MCC (Merchant Category Code) é o código de 4 dígitos atribuído pelas bandeiras de cartão para classificar o tipo de negócio. O MCC "real" encontrado pela BDC deve corresponder ao MCC declarado pelo merchant. Divergências indicam que a empresa pode estar processando transações em categorias diferentes das declaradas.',
  'Licenças': 'Licenças e autorizações de funcionamento (ANVISA, Licença Ambiental, Alvará, etc.) são indicadores POSITIVOS de conformidade regulatória.',

  // ═══ EVOLUTION & HISTORY — NEW ═══
  'Queda de capital social': 'O capital social da empresa sofreu uma redução significativa ao longo do tempo. Isso pode indicar esvaziamento patrimonial — quando sócios retiram capital da empresa antes de encerrá-la ou antes de usar a empresa para atividades fraudulentas. Uma queda de mais de 50% é um sinal de alerta grave que exige investigação.',
  'Evolução do capital social': 'Série temporal do capital social da empresa ao longo do tempo. Capital estável ou crescente indica empresa saudável. Capital que sobe e desce pode indicar instabilidade.',
  'Queda drástica de funcionários': 'A empresa perdeu mais de 80% dos funcionários em relação ao pico histórico. Isso é um sinal extremamente grave de que a empresa pode estar encerrando operações, enfrentando crise severa, ou se tornando uma empresa de fachada (shell company). Empresas legítimas raramente perdem tantos funcionários sem motivo.',
  'Evolução de funcionários': 'Série temporal do número de funcionários ao longo do tempo. Permite verificar se a empresa está crescendo, estável ou encolhendo.',
  'Alterações cadastrais recentes': 'Quantidade de mudanças nos dados cadastrais da empresa nos últimos 12 meses. Mais de 3 alterações recentes pode indicar instabilidade organizacional ou tentativa de mascarar informações (como mudança de CNAE para atividade de menor risco). A Circular BCB 3.978/2020 exige monitoramento de alterações relevantes.',
  'Histórico de alterações cadastrais': 'Registro completo de todas as mudanças que a empresa fez em seus dados na Receita Federal ao longo da vida. Inclui mudanças de nome, endereço, CNAE, regime tributário, capital social, etc.',
  'Mudanças de CNAE': 'A empresa alterou sua atividade econômica principal (CNAE) uma ou mais vezes. Múltiplas mudanças de CNAE podem indicar que a empresa está tentando se enquadrar em categorias de menor risco ou que não tem uma atividade definida. Uma mudança recente de CNAE para atividade de maior risco é especialmente preocupante.',
  'Mudanças de razão social': 'A empresa mudou seu nome oficial. Isso é normal em fusões, aquisições ou rebranding, mas múltiplas mudanças de nome podem indicar tentativa de se desvincular de histórico negativo.',

  // ═══ ESG — NEW ═══
  'Lista Suja MTE — Trabalho Escravo': 'A Lista Suja do Ministério do Trabalho e Emprego registra empregadores que foram autuados pela prática de trabalho em condições análogas à escravidão. A presença nesta lista é BLOQUEIO AUTOMÁTICO IMEDIATO sem exceção. A legislação brasileira proíbe qualquer relação comercial com empresas na Lista Suja. A Pagsmile pode ser responsabilizada como cúmplice se processar pagamentos para essas empresas.',
  'Lista Suja MTE': 'Verificação contra a Lista Suja do Ministério do Trabalho e Emprego, que registra empresas flagradas com trabalho escravo. Resultado "NÃO encontrada" significa que a empresa está limpa nesta verificação.',
  'ESG / Lista Suja MTE': 'Verificação ESG (Environmental, Social, Governance) da empresa, incluindo a crítica verificação contra a Lista Suja do Ministério do Trabalho.',
  'Score Ambiental ESG': 'Pontuação ambiental que avalia o impacto da empresa no meio ambiente. Scores baixos (abaixo de 30) indicam problemas ambientais significativos.',
  'Score Social ESG': 'Pontuação social que avalia práticas da empresa em relação a trabalhadores, comunidade e direitos humanos.',
  'Score Governança ESG': 'Pontuação de governança que avalia transparência, ética corporativa e práticas de gestão.',
  'Embargo IBAMA': 'Embargo ambiental aplicado pelo IBAMA (Instituto Brasileiro do Meio Ambiente). Indica que a empresa cometeu infração ambiental grave o suficiente para ter atividades embargadas. É um sinal de risco ambiental severo.',
  'Alerta de desmatamento': 'A empresa ou suas propriedades estão associadas a alertas de desmatamento. Relevante para compliance ambiental e ESG.',

  // ═══ CONTACTS — NEW ═══
  'Telefones encontrados': 'Telefones associados à empresa na base da Big Data Corp. Permite validar se o telefone declarado no cadastro corresponde aos telefones encontrados. Telefones inativos, pré-pagos, ou em nome de terceiros são sinais de atenção.',
  'E-mails encontrados': 'E-mails associados à empresa. E-mails apenas em domínios genéricos (gmail, hotmail) para uma empresa de grande porte indicam menor formalização. E-mails corporativos (com domínio próprio) são esperados para empresas estabelecidas.',
  'Endereços associados': 'Endereços vinculados à empresa em bases públicas e privadas. Permite validar se o endereço declarado corresponde a um endereço real e se há múltiplos endereços associados.',

  // ═══ OWNERS EXPANDED — NEW ═══
  'QSA tempo real (Receita Federal)': 'QSA consultado em TEMPO REAL diretamente na base da Receita Federal, diferente do QSA padrão que pode ter atraso de dias ou semanas. Permite detectar alterações societárias recentes que ainda não apareceram nas bases consolidadas.',
  'Divergência QSA padrão vs tempo real': 'Número de sócios no QSA padrão (bases consolidadas) difere do QSA em tempo real da Receita Federal. Isso pode indicar uma alteração societária recente — entrada ou saída de sócio — que merece atenção. Sócios que acabaram de sair podem ter sido removidos para ocultar vínculos problemáticos.',
  'Sanções no grupo econômico': 'Uma ou mais entidades do GRUPO ECONÔMICO da empresa (não os sócios diretos, mas empresas relacionadas por vínculos societários indiretos) foram encontradas em listas de sanções. Circular BCB 3.978/2020 Art. 16 §§1-4 exige verificação de toda cadeia societária, incluindo participações indiretas.',
  'PEP no grupo econômico': 'Pessoas Politicamente Expostas identificadas no grupo econômico (participações indiretas). Mesmo que os sócios diretos não sejam PEP, a presença de PEPs no grupo econômico indica exposição política indireta que requer monitoramento.',
  'KYC grupo econômico': 'Resultado da verificação de KYC (Know Your Customer) de todas as entidades do grupo econômico da empresa — verificação de PEP e sanções em toda a cadeia societária.',
  'Empresas do grupo econômico': 'Lista de todas as empresas que fazem parte do mesmo grupo econômico, identificadas por vínculos societários diretos e indiretos. Permite mapear a estrutura corporativa completa e identificar holdings intermediárias.',
  'Participação circular detectada': 'A estrutura societária possui participações cruzadas — empresa A é sócia da empresa B que é sócia da empresa A (ou mais complexo). Participações circulares são um forte indicativo de estruturas criadas para ocultar beneficiários finais e podem estar associadas a lavagem de dinheiro.',
  'Distribuição processos empresa': 'Visão agregada e estatística dos processos judiciais da empresa, mostrando a distribuição por tipo (criminal, cível, trabalhista, administrativo). É uma pré-triagem rápida que permite avaliar o perfil de litígio da empresa sem precisar analisar cada processo individualmente.',
  'Distribuição processos sócios': 'Visão agregada dos processos judiciais de todos os sócios, com distribuição por tipo. Permite uma avaliação rápida do perfil de litígio do quadro societário.',
  'Risco PF — Em cobrança': 'A pessoa física possui registros de cobrança ou negativação (Serasa, SPC, protestos). Indica que o sócio tem dificuldades financeiras pessoais, o que pode afetar a empresa.',
  'Nível de risco PF': 'Classificação de nível de risco da pessoa física calculada pela BDC, combinando múltiplos indicadores financeiros e comportamentais.',

  // ═══ INDUSTRIAL PROPERTY — NEW ═══
  'Patentes registradas': 'A empresa possui patentes registradas no INPI (Instituto Nacional da Propriedade Industrial). Patentes são um indicador POSITIVO de inovação e atividade real — empresas de fachada raramente possuem patentes.',
  'Marcas registradas': 'A empresa possui marcas registradas no INPI. Marcas são indicadores de atividade comercial legítima e investimento em branding.',
  'Propriedade industrial': 'Registros de propriedade industrial (patentes, marcas, desenhos industriais) associados à empresa no INPI.',
  'Propriedade industrial dos sócios': 'Registros de propriedade industrial (patentes, marcas) associados individualmente aos sócios da empresa. Pode indicar atividade empreendedora e inovação.',

  // ═══ RELATED PEOPLE CONTACTS — NEW ═══
  'Telefones de pessoas vinculadas': 'Telefones de pessoas relacionadas à empresa (sócios, representantes, procuradores). Permite cross-validation com os contatos declarados.',
  'E-mails de pessoas vinculadas': 'E-mails de pessoas relacionadas à empresa. Útil para verificar se os contatos declarados no cadastro correspondem às pessoas vinculadas.',
  'Endereços de pessoas vinculadas': 'Endereços de pessoas relacionadas à empresa. Permite verificar se sócios residem no mesmo endereço da empresa (possível home office ou empresa residencial).',
};

// Add CNAEs secondary explanation
EXPLANATIONS['CNAEs secundários'] = 'CNAEs secundários são atividades adicionais que a empresa pode exercer além da atividade principal. CNAEs secundários de alto risco (jogos, armas, serviços financeiros não classificados) indicam que a empresa tem autorização para atuar em segmentos sensíveis, mesmo que a atividade principal seja diferente.';

/**
 * Returns the contextual explanation for a given item label.
 * Falls back to partial matches if exact match not found.
 */
export function getItemExplanation(label) {
  if (!label) return null;
  // Exact match
  if (EXPLANATIONS[label]) return EXPLANATIONS[label];
  // Partial match (e.g. "CNAEs secundários (15)" should match "CNAEs secundários")
  for (const key of Object.keys(EXPLANATIONS)) {
    if (label.startsWith(key)) return EXPLANATIONS[key];
  }
  return null;
}

export default EXPLANATIONS;