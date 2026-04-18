/**
 * Red Flag Enricher v2 — DATA-FIRST, NO GENERIC FALLBACKS.
 *
 * Cada flag tem:
 *  - title: não é truncado, texto completo
 *  - whyItMatters: contexto real + risco regulatório + risco operacional
 *  - evidenceHints: dados específicos a procurar (com a fonte exata)
 *  - suggestedAction: ação concreta que o analista deve tomar
 *
 * Quando não há match no catálogo, o raw text é usado como título completo
 * e o whyItMatters é construído a partir dos metadados da flag (nunca um
 * placeholder dizendo "veja o texto acima").
 */

// ── Catálogo de enriquecimento por palavra-chave ──
const FLAG_CATALOGUE = [
  // ═════════════ FINANCEIRO / CRÉDITO ═════════════
  {
    match: /shell\s*company|empresa\s*de\s*fachada/i,
    title: 'Probabilidade elevada de empresa de fachada (Shell Company)',
    severity: 'HIGH',
    dimension: 'financial',
    whyItMatters:
      'O score de Shell Company da Big Data Corp combina múltiplos sinais de ausência de operação real: zero empregados no eSocial, domínio de internet inativo, capital social mínimo, sem passagens web nos últimos 90 dias e endereço potencialmente virtual. Um score acima de 50% indica que muito provavelmente não existe negócio real por trás da razão social. Isso fere o dever de KYC previsto na Circular BCB 3.978/2020 Art. 16 e expõe a Pagsmile a responsabilização solidária em caso de uso para PLD/FT. Risco operacional: aprovar shell companies vira porta de entrada para lavagem de dinheiro, pix de origem ilícita e chargebacks em massa.',
    evidenceHints: [
      'ShellCompanyLikelyhood score (fonte: BDC ActivityIndicators)',
      'Quantidade de empregados CLT (fonte: BDC BasicData.Employees)',
      'Domínio próprio ativo (fonte: BDC Domains)',
      'Capital social declarado vs TPV (fonte: BDC BasicData.CapitalSocial)',
      'Presença web nos últimos 90 dias (fonte: BDC WebPresence)',
    ],
    suggestedAction:
      'Solicitar comprovação de operação real: fotos datadas do escritório/estoque, 3 últimos extratos bancários da PJ, folha de pagamento ou contratos com prestadores PJ, e 3 contratos firmados com clientes. Se score > 70% e sem comprovação = recusar.',
  },
  {
    match: /dívida\s*ativa|divida\s*ativa|cda/i,
    title: 'Dívida ativa inscrita com a Fazenda Pública',
    severity: 'CRITICAL',
    dimension: 'compliance',
    whyItMatters:
      'Dívida ativa é débito tributário formalmente inscrito pela Fazenda (federal, estadual ou municipal) cuja cobrança judicial já foi iniciada. Sinaliza inadimplência fiscal consolidada. Acima de R$ 500k aciona bloqueio automático (B06) pelo framework V4. Fundamentação: Lei 6.830/80 (Execução Fiscal). Risco operacional direto: empresa com dívida ativa elevada provavelmente não tem liquidez para honrar antecipações e tem risco alto de penhora em contas bancárias, inviabilizando o settlement.',
    evidenceHints: [
      'Valor total inscrito em CDA (fonte: BDC KYC.ActiveDebts)',
      'Natureza do débito: IRPJ, ICMS, ISS, contribuições previdenciárias',
      'Data mais antiga de inscrição',
      'Existência de parcelamento ativo',
    ],
    suggestedAction:
      'Exigir Certidão Positiva de Débitos com Efeitos de Negativa (CPD-EN) ou comprovante de parcelamento ativo com 3 parcelas pagas em dia. Se valor > R$ 500k e sem parcelamento ativo = recusar automaticamente.',
  },
  {
    match: /capital\s*social/i,
    title: 'Capital social incompatível com o volume operacional declarado',
    severity: 'HIGH',
    dimension: 'financial',
    whyItMatters:
      'Capital social muito baixo frente ao TPV declarado sugere subcapitalização — a empresa não tem reserva patrimonial para cobrir chargebacks, estornos, contingências trabalhistas ou fiscais. Combinado com shell score elevado, é forte indício de operação não lastreada. Para atuar como gateway/marketplace, a Resolução BCB 4.282/2013 exige lastro proporcional ao volume intermediado. Risco operacional: em caso de inadimplência massiva ou chargeback storm, a Pagsmile assume prejuízo direto.',
    evidenceHints: [
      'Valor do capital social (fonte: BDC BasicData.CapitalSocial)',
      'TPV mensal declarado (fonte: Questionário — seção volumetria)',
      'Razão TPV/Capital (valor acima de 500x é crítico para gateway)',
      'Porte declarado (ME/EPP vs TPV de R$ 1M+ é incompatível)',
    ],
    suggestedAction:
      'Solicitar DRE ou balanço patrimonial dos últimos 2 exercícios + 3 últimos extratos bancários da PJ. Exigir aumento de capital social formalizado na Junta Comercial antes da aprovação quando a razão TPV/Capital for superior a 100x.',
  },
  {
    match: /score\s*de\s*crédito|score\s*de\s*credito|credit\s*score\s*baixo/i,
    title: 'Score de crédito PJ comprometido',
    severity: 'MEDIUM',
    dimension: 'creditRisk',
    whyItMatters:
      'Score de crédito baixo em bureaus (Serasa, BoaVista, Quod) indica histórico de inadimplência financeira — títulos protestados, SCR comprometido, cheques devolvidos ou endividamento acima da capacidade. Eleva o risco de chargeback por insolvência e inadimplência em antecipações. Não é bloqueante, mas exige rolling reserve reforçado.',
    evidenceHints: [
      'Faixa do score (fonte: BDC CreditRisk)',
      'Protestos ativos',
      'Títulos em aberto em outras instituições (SCR Bacen)',
      'Histórico de cheques devolvidos',
    ],
    suggestedAction:
      'Restringir antecipação nos primeiros 90 dias. Aplicar rolling reserve de 10-15% a depender da faixa. Monitorar chargebacks nos primeiros 60 dias.',
  },
  {
    match: /protesto/i,
    title: 'Protestos formalizados em cartório',
    severity: 'HIGH',
    dimension: 'creditRisk',
    whyItMatters:
      'Protestos formalizados em cartório indicam títulos vencidos e não pagos cuja cobrança judicial foi encaminhada. Diferente de negativação simples, o protesto tem efeito público e probatório. Sinaliza problemas de liquidez recentes e risco elevado de inadimplência junto a fornecedores — que é exatamente a situação em que uma empresa começa a sacar antecipações para cobrir obrigações vencidas, gerando risco direto para a Pagsmile.',
    evidenceHints: [
      'Quantidade de protestos ativos (fonte: BDC KYC.Protests)',
      'Valor total protestado',
      'Data do protesto mais recente',
      'Cartório de registro',
    ],
    suggestedAction:
      'Solicitar comprovante de quitação ou acordo formalizado de cada protesto. Se protestos > 3 ou valor > R$ 50k, aplicar rolling reserve de 20% e bloquear antecipação pelos primeiros 90 dias.',
  },

  // ═════════════ IDENTIDADE / CADASTRO ═════════════
  {
    match: /cnpj\s*inat|cnpj\s*irreg|situação\s*cadastral|situacao\s*cadastral/i,
    title: 'CNPJ com situação cadastral irregular na Receita Federal',
    severity: 'BLOQUEANTE',
    dimension: 'identity',
    whyItMatters:
      'CNPJ com status INATIVA, SUSPENSA, INAPTA ou BAIXADA na Receita Federal NÃO PODE exercer atividades econômicas legalmente. Qualquer transação processada em nome dessa PJ é tecnicamente nula e pode gerar autuação fiscal solidária. Bloqueio absoluto pela Circular BCB 3.978/2020 Art. 12 c/c IN RFB 2.119/2022. Não há cenário de aprovação enquanto a situação estiver irregular.',
    evidenceHints: [
      'Status exato (fonte: BDC BasicData.TaxIdStatus)',
      'Data da alteração do status',
      'Motivo registrado pela RFB (quando disponível)',
    ],
    suggestedAction:
      'Recusa imediata. Exigir regularização junto à Receita Federal e cartão CNPJ atualizado com status ATIVA antes de reapreciar o caso.',
  },
  {
    match: /mcc\s*diverg|mcc\s*conflit|cnae\s*diverg|cnae\s*conflit|mcc\s*vs\s*cnae|cnae.*incompatível|cnae.*incompativ/i,
    title: 'Divergência entre MCC declarado e CNAE registrado',
    severity: 'MEDIUM',
    dimension: 'identity',
    whyItMatters:
      'O MCC (Merchant Category Code) classifica a atividade perante bandeiras e adquirentes, definindo limites de chargeback, taxas interchange e regras antifraude específicas. O CNAE é a classificação oficial na Receita. Divergências significativas entre os dois podem indicar: (1) tentativa de transaction laundering (processar categoria de alto risco em enquadramento de baixo risco para pagar menos MDR ou fugir de monitoramento); (2) enquadramento errado que vai gerar chargeback em massa por categoria incorreta; (3) atividade real diferente da declarada. As regras das bandeiras Visa/Mastercard obrigam o adquirente a enquadrar corretamente o MCC — enquadramento doloso incorreto gera multa (MATCH).',
    evidenceHints: [
      'MCC informado no questionário',
      'CNAE principal registrado (fonte: BDC BasicData.Activities.IsMain=true)',
      'CNAEs secundários (pode indicar múltiplas atividades)',
      'Atividade descrita textualmente pelo cliente',
    ],
    suggestedAction:
      'Pedir justificativa formal ao cliente. Se a divergência for entre categorias de risco muito diferentes (ex: varejo geral vs gambling), recusar. Se for técnica/justificável (marketplace multi-categoria), revisar o enquadramento com o time comercial antes de aprovar.',
  },
  {
    match: /empresa\s*(nova|recém|recem|muito\s*nova|< ?6\s*meses|recém[-\s]constituíd|recem[-\s]constituid|idade\s*0|age\s*:\s*0|founded|data\s*de\s*abertura\s*recente)/i,
    title: 'Empresa com menos de 6 meses de operação',
    severity: 'HIGH',
    dimension: 'evolution',
    whyItMatters:
      'Empresas com menos de 6 meses não possuem histórico suficiente para avaliação de risco de crédito, reputação ou capacidade operacional. A taxa de mortalidade empresarial brasileira no primeiro ano (SEBRAE) é de ~20%, e entre empresas constituídas para fraude, a maioria encerra operação nos primeiros 3 meses. Abaixo de 6 meses é bloqueio automático (B02) no framework V4. Aprovar empresa de 0-6 meses sem documentação extensiva = assumir risco de fraude de startup shell.',
    evidenceHints: [
      'Data de abertura (fonte: BDC BasicData.FoundedDate)',
      'Idade em meses',
      'Data do primeiro empregado CLT (fonte: eSocial)',
      'Data de primeira movimentação bancária (se disponível)',
    ],
    suggestedAction:
      'Aguardar 6 meses de operação para reapresentar OU exigir documentação extensiva: contrato social registrado, 3 contratos firmados com clientes/fornecedores, infraestrutura (escritório, CNPJ próprio, folha) e responsável financeiro identificado via biometria.',
  },
  {
    match: /(data\s*de\s*entrada|data\s*declarada|entrada\s*declarad).*(futura|incompat|incons|erro)/i,
    title: 'Data declarada no questionário é inconsistente com a realidade temporal',
    severity: 'HIGH',
    dimension: 'identity',
    whyItMatters:
      'Uma data declarada no questionário (entrada de sócio, início de operação, etc.) que seja posterior à data da análise, ou que seja muito divergente da data registrada na Receita Federal via BDC, indica uma de três situações: (1) erro material de preenchimento — o que já compromete a confiabilidade de todo o questionário e fere o dever de fidedignidade em KYC (Circular BCB 3.978/2020 Art. 16); (2) tentativa deliberada de ocultar histórico real de composição societária ou operação; (3) dado fabricado para burlar trava antifraude. Em qualquer cenário, inviabiliza a validação cruzada com dados oficiais e gera fundamento para escalação manual ou recusa. Risco operacional: aprovar empresa com datas inconsistentes expõe a Pagsmile a responsabilização solidária em caso de fraude, PLD ou sanções aplicadas a sócios ocultos.',
    evidenceHints: [
      'Valor declarado no questionário (campo específico)',
      'Valor confirmado (fonte: BDC RelationshipsV2.PartnersEntryDate ou BasicData.FoundedDate)',
      'Divergência em meses/anos',
      'Data da análise em curso',
    ],
    suggestedAction:
      'Solicitar cópia atualizada e registrada do contrato social na Junta Comercial via upload/CAF. Confirmar em call de vídeo com o UBO. Se confirmado como fabricação deliberada, recusar e registrar como tentativa de falsificação documental.',
  },

  // ═════════════ SÓCIOS / QSA ═════════════
  {
    match: /sanç|sanc|ofac|interpol|lista\s*de\s*san/i,
    title: 'Presença em lista de sanções internacionais',
    severity: 'BLOQUEANTE',
    dimension: 'owners',
    whyItMatters:
      'Transacionar com entidades ou pessoas em listas de sanções (OFAC SDN, União Europeia, ONU, COAF, CEIS, CNEP) é ILEGAL. Gera multas milionárias, inclusão em watchlists de correspondentes internacionais (risco de perda de relacionamento com adquirentes) e responsabilização criminal dos administradores. Fundamentação: Lei 9.613/1998 Art. 10 (PLD/FT) c/c Lei 13.810/2019. Bloqueio automático (B03) sem exceção.',
    evidenceHints: [
      'Nome da lista que gerou o hit',
      'Data da inclusão na lista',
      'Entidade sancionada: empresa ou sócio?',
      'MatchRate do sistema (apenas hits ≥ 80% são válidos)',
    ],
    suggestedAction:
      'Recusa imediata e intransigente. Registrar a tentativa em comunicação ao COAF quando aplicável (Lei 9.613/98 Art. 11). Não há possibilidade de aprovação enquanto a sanção estiver ativa.',
  },
  {
    match: /pep|politicamente\s*exposto/i,
    title: 'Pessoa Politicamente Exposta (PEP) na composição societária',
    severity: 'HIGH',
    dimension: 'owners',
    whyItMatters:
      'PEPs são agentes públicos de alto escalão ou pessoas relacionadas a eles. Têm risco elevado de envolvimento com corrupção ou lavagem de capitais originados de propina. A Circular BCB 3.978/2020 exige due diligence reforçada (EDD), com monitoramento contínuo, aprovação por instância superior e revisão anual obrigatória. Não é bloqueante, mas exige parecer formal do time de PLD antes da aprovação.',
    evidenceHints: [
      'Nome do sócio identificado como PEP (fonte: BDC PEP / CAF PEP)',
      'Cargo ou função pública exercida',
      'Período de exercício (ativo, ex-PEP < 5 anos, ex-PEP > 5 anos)',
      'Grau de parentesco (próprio PEP ou familiar/associado)',
    ],
    suggestedAction:
      'Exigir declaração formal de PEP assinada + justificativa comercial + parecer formal do time de PLD. Aprovação só com monitoramento intenso (nível REFORÇADO+) e revisão trimestral obrigatória nos primeiros 12 meses.',
  },
  {
    match: /processo\s*judicial|processos\s*dos?\s*sócio/i,
    title: 'Processos judiciais relevantes na empresa ou sócios',
    severity: 'HIGH',
    dimension: 'compliance',
    whyItMatters:
      'Processos ativos sinalizam risco reputacional e operacional. Processos trabalhistas em grande volume indicam má gestão de pessoas e contingência elevada. Processos cíveis por fraude, execução fiscal ou estelionato apontam risco de solvência e caráter. Processos criminais por fraude financeira, sonegação ou lavagem são bloqueio direto. Circular BCB 3.978/2020 Art. 16 exige avaliação criteriosa de passivo judicial.',
    evidenceHints: [
      'Quantidade total (fonte: BDC KYC.Lawsuits)',
      'Tipo: trabalhista / cível / criminal / execução fiscal',
      'Valor total envolvido nas ações',
      'Papel nos processos (réu ativo, autor, reconvinte)',
    ],
    suggestedAction:
      'Revisar cada processo individualmente. Processos criminais por fraude/estelionato/lavagem na cadeia societária = recusa automática. Processos trabalhistas em massa (> 20 ativos) = investigar gestão e aplicar rolling reserve reforçado.',
  },

  // ═════════════ CAF / BIOMETRIA ═════════════
  {
    match: /liveness|prova\s*de\s*vida/i,
    title: 'Liveness reprovado ou com baixa probabilidade',
    severity: 'HIGH',
    dimension: 'biometria',
    whyItMatters:
      'O liveness (prova de vida) verifica se a foto/vídeo da selfie é de uma pessoa REAL presente no momento da captura — não uma foto de foto, máscara, deepfake ou vídeo pré-gravado. Reprovação indica possível tentativa de fraude de identidade: o verdadeiro titular do documento não está executando a verificação. Em operações de pagamento, isso é um dos indicadores mais fortes de fraude de onboarding. Em caso de chargeback por fraude de identidade pós-aprovação, a Pagsmile assume o prejuízo sem chance de reversão.',
    evidenceHints: [
      'Probabilidade retornada pela CAF (abaixo de 80% é suspeito)',
      'Quantidade de tentativas realizadas',
      'Score específico do face_liveness no IntegrationLog',
      'Qualidade técnica da captura (iluminação, nitidez)',
    ],
    suggestedAction:
      'Solicitar nova captura com orientações claras ao cliente (boa iluminação, sem óculos, olhar direto para a câmera, ambiente sem contraluz). Se persistir após 2 tentativas, exigir selfie presencial com documento em call de vídeo.',
  },
  {
    match: /facematch|face\s*match/i,
    title: 'FaceMatch abaixo do limiar de similaridade',
    severity: 'HIGH',
    dimension: 'biometria',
    whyItMatters:
      'FaceMatch compara o rosto da selfie com o rosto extraído do documento enviado (RG/CNH). Score de similaridade abaixo do limiar (tipicamente 80%) indica que: (1) a selfie é de pessoa diferente do documento apresentado = fraude de identidade; (2) qualidade ruim da foto do documento ou da selfie; (3) documento de terceiro sendo usado por impostor. É um dos sinais mais objetivos de fraude documental em onboarding digital.',
    evidenceHints: [
      'Percentual de similaridade retornado pela CAF',
      'Tipo do documento usado na comparação (RG, CNH, Passaporte)',
      'Resultado individual de face_liveness (o outro lado da análise)',
    ],
    suggestedAction:
      'Solicitar nova captura do documento com boa qualidade (CNH é preferível por ter foto melhor). Se o score continuar baixo após 2 tentativas, exigir presença em call com documento físico mostrado à câmera.',
  },
  {
    match: /deepfake/i,
    title: 'Deepfake detectado na verificação biométrica',
    severity: 'BLOQUEANTE',
    dimension: 'biometria',
    whyItMatters:
      'Deepfake é o uso de IA generativa para produzir imagem ou vídeo sintético do rosto de uma pessoa. É fraude biométrica objetiva e deliberada — não existe cenário legítimo de aprovação. Atacantes usam deepfake para burlar liveness tradicional em larga escala. A detecção específica de deepfake pela CAF é um indicador de altíssima confiança. Bloqueio direto.',
    evidenceHints: [
      'Confiança do detector de deepfake retornada pela CAF',
      'Tentativas anteriores do mesmo CPF',
    ],
    suggestedAction:
      'Recusa imediata sem possibilidade de revisão. Registrar tentativa de fraude, bloquear o CPF na base interna e reportar ao time de antifraude para inclusão em blacklist compartilhada.',
  },
  {
    match: /documentoscopia|documento\s*adulter|documento\s*falsificad|documento\s*suspeito/i,
    title: 'Documentoscopia — documento apresenta inconsistências estruturais',
    severity: 'HIGH',
    dimension: 'biometria',
    whyItMatters:
      'A análise de documentoscopia da CAF detectou inconsistências visuais ou estruturais no documento apresentado (fontes adulteradas, fotos recolocadas, holograma ausente, MRZ inválido, padrões de segurança faltantes). Pode indicar adulteração deliberada (fraude), uso de documento falso ou baixa qualidade da captura. A simples apresentação de documento adulterado em processo de KYC caracteriza falsidade ideológica (Art. 299 CP) e uso de documento falso (Art. 304 CP).',
    evidenceHints: [
      'Tipo específico de inconsistência detectada',
      'Score de autenticidade retornado',
      'Tipo do documento (RG antigo tem mais falsos positivos que CNH)',
    ],
    suggestedAction:
      'Solicitar novo upload em boa qualidade (foto nítida, boa iluminação, sem reflexo). Preferir CNH. Se persistir após 2 tentativas, exigir documento físico em call de vídeo com zoom nos elementos de segurança. Se confirmado como falso = recusa e registro.',
  },

  // ═════════════ REPUTAÇÃO ═════════════
  {
    match: /adverse\s*media|mídia\s*adversa|midia\s*adversa/i,
    title: 'Mídia adversa detectada associada à empresa ou sócios',
    severity: 'HIGH',
    dimension: 'reputation',
    whyItMatters:
      'Presença em matérias jornalísticas com sentimento negativo, especialmente sobre temas sensíveis (fraude, lavagem de dinheiro, corrupção, esquemas Ponzi, estelionato) gera risco reputacional imediato para a Pagsmile como processadora. Acima de certo limiar (tipicamente 3+ notícias de veículos distintos) é bloqueante (B07). Além do risco à reputação, há risco regulatório: o BACEN monitora exposição de IPs a nomes negativados em mídia e pode exigir justificativa formal.',
    evidenceHints: [
      'Temas das notícias (fonte: BDC AdverseMedia ou BusinessSanctions)',
      'Quantidade de publicações distintas nos últimos 24 meses',
      'Veículos envolvidos (grande imprensa vs blogs)',
      'Sentimento calculado das matérias',
    ],
    suggestedAction:
      'Ler as notícias originalmente. Se temas graves (fraude/lavagem/corrupção/estelionato) com 2+ fontes distintas = recusa. Se temas menores (trabalhistas isoladas, disputa contratual) = ponderar no parecer e aplicar rolling reserve reforçado.',
  },
  {
    match: /reclame\s*aqui|reclamaç.+massiv|baixa\s*reputaç/i,
    title: 'Reputação negativa em canais de consumidor',
    severity: 'MEDIUM',
    dimension: 'reputation',
    whyItMatters:
      'Reclamações massivas ou nota baixa no Reclame Aqui/ProconRJ/SP indicam experiência de cliente ruim, o que correlaciona diretamente com alto volume de chargebacks futuros e disputas de cliente. Empresas com índice de solução abaixo de 50% no RA geram 3x mais chargebacks que a média.',
    evidenceHints: [
      'Nota no Reclame Aqui',
      'Quantidade de reclamações nos últimos 6 meses',
      'Índice de solução (%)',
      'Taxa de resposta',
    ],
    suggestedAction:
      'Aplicar rolling reserve reforçado (15-20%) e monitorar taxa de chargeback nos primeiros 60 dias. Se taxa de chargeback superior a 1% nos primeiros 30 dias, suspender automação de antecipação.',
  },

  // ═════════════ ESG ═════════════
  {
    match: /lista\s*suja|trabalho\s*escravo|mte/i,
    title: 'Lista Suja do Ministério do Trabalho — trabalho análogo à escravidão',
    severity: 'BLOQUEANTE',
    dimension: 'esg',
    whyItMatters:
      'Empresas constantes na Lista Suja do Ministério do Trabalho e Emprego por condições análogas à escravidão são bloqueio ABSOLUTO (B08). Manter relacionamento comercial com empresa na Lista Suja pode gerar responsabilização solidária trabalhista e violação de compromissos ESG da Pagsmile e de seus adquirentes parceiros. Fundamentação: Portaria MTE 1.293/2017 + Pacto Nacional pela Erradicação do Trabalho Escravo.',
    evidenceHints: ['Data da inclusão na lista', 'Número do auto de infração', 'Município/UF da ocorrência'],
    suggestedAction:
      'Recusa imediata. Documentar motivo explicitamente. Aguardar remoção formal da lista + 2 anos de carência antes de reapreciar.',
  },
  {
    match: /ibama|embargo\s*ambient/i,
    title: 'Embargo ambiental IBAMA ativo',
    severity: 'BLOQUEANTE',
    dimension: 'esg',
    whyItMatters:
      'Embargos ambientais ativos do IBAMA indicam infração ambiental grave (desmatamento, poluição, atividade sem licença). Bloqueio automático (B09) pelo framework V4 em razão de risco ESG e compromissos internacionais da Pagsmile.',
    evidenceHints: ['Número do auto', 'Data de lavratura', 'Local/bioma', 'Tipo de infração'],
    suggestedAction: 'Recusa até comprovação de baixa formal do embargo pelo IBAMA.',
  },

  // ═════════════ INCONSISTÊNCIAS DE QUESTIONÁRIO (SENTINEL) ═════════════
  {
    match: /e-?mail.*(proton|anonimato|anónimo|anonimo|divergente|diferente)|proton\.me|protonmail/i,
    title: 'E-mail de contato em provedor de anonimato ou divergente do cadastro oficial',
    severity: 'MEDIUM',
    dimension: 'identity',
    whyItMatters:
      'O uso de provedores focados em anonimato (ProtonMail, Tutanota, Guerrilla Mail) para contato comercial ou compliance em operação financeira é atípico e suspeito. Provedores gratuitos podem ser aceitáveis (Gmail, Outlook), mas os voltados a privacidade extrema dificultam rastreabilidade em caso de fraude ou disputa — o que fere o princípio da rastreabilidade exigido pela Circular BCB 3.978/2020 Art. 16. Divergência entre e-mail declarado e o e-mail registrado oficialmente na Receita é sinal adicional de contorno de controle. Risco operacional: em caso de fraude, não há como rastrear ou responsabilizar a comunicação oficial do cliente.',
    evidenceHints: [
      'E-mail declarado no questionário',
      'E-mail oficial (fonte: BDC RegistrationData.Emails.Primary)',
      'Provedor do e-mail declarado (domínio)',
    ],
    suggestedAction:
      'Exigir troca para e-mail corporativo com domínio próprio ativo (ex: nome@suaempresa.com.br) OU para provedor não-anonimizado (Gmail, Outlook). Validar que o domínio próprio tem MX records ativos e pertence à empresa.',
  },
  {
    match: /url.*(subdomínio|subdominio|gratuit|framer|wix|webflow|wordpress\.com|blogspot)/i,
    title: 'Site declarado usa subdomínio gratuito ou plataforma no-code',
    severity: 'MEDIUM',
    dimension: 'identity',
    whyItMatters:
      'Sites hospedados em subdomínios gratuitos (framer.website, wix.com, wordpress.com, blogspot.com) ou plataformas no-code sem domínio próprio são atípicos para empresas que declaram operação comercial consolidada. Além da ausência de investimento mínimo em infraestrutura (~R$ 40/ano para domínio próprio), isso sinaliza: (1) empresa nova ou não profissionalizada; (2) facilidade de descontinuidade (basta cancelar o plano); (3) ausência de rastreabilidade de proprietário via WHOIS próprio. Risco operacional: em caso de fraude ou saída abrupta, não há ativo digital associado para rastreamento.',
    evidenceHints: [
      'URL declarada (fonte: Questionário — seção site/canais)',
      'Domínio próprio ativo (fonte: BDC Domains)',
      'WHOIS do domínio',
      'Tempo de existência do site',
    ],
    suggestedAction:
      'Exigir domínio próprio registrado em nome da PJ com pelo menos 6 meses de existência. Se operação já ativa sem domínio próprio, bloquear até regularização.',
  },
  {
    match: /política.*devoluç|politica.*devoluc|reembolso|refund/i,
    title: 'Políticas de devolução/reembolso insuficientes ou inexistentes',
    severity: 'MEDIUM',
    dimension: 'compliance',
    whyItMatters:
      'Política de devolução clara e publicada é obrigatória pelo CDC (Art. 49 — direito de arrependimento em 7 dias para compras online). A ausência ou insuficiência dessa política correlaciona diretamente com taxa elevada de chargeback por disputa de consumidor, que é o tipo mais caro para o adquirente. Empresas com política clara e publicada têm até 40% menos chargebacks que a média.',
    evidenceHints: [
      'Resposta do cliente no questionário (seção políticas)',
      'URL da política publicada no site',
      'Clareza das regras (prazo, condições, forma)',
    ],
    suggestedAction:
      'Solicitar URL da política de devolução publicada visivelmente no site. Se inexistente, exigir criação antes da aprovação. Validar aderência ao CDC Art. 49.',
  },
  {
    match: /volume\s*(declarado|incompat)|tpv.*incompat|faixa\s*de\s*emprega/i,
    title: 'Volume declarado incompatível com o porte real da empresa',
    severity: 'HIGH',
    dimension: 'financial',
    whyItMatters:
      'TPV declarado muito acima do que a estrutura real da empresa (funcionários registrados, capital social, faixa de receita RFB, infraestrutura) suporta é sinal clássico de: (1) superestimativa para obter melhores taxas; (2) operação efetivamente não declarada; (3) intenção de lavagem por fracionamento de valores reais. Um gateway declarando R$ 20M/mês com capital social de R$ 5k e 0 empregados é caso de livro — não existe lastro operacional possível.',
    evidenceHints: [
      'TPV declarado no questionário',
      'Faixa de empregados real (fonte: BDC eSocial)',
      'Faixa de receita RFB (fonte: BDC RevenueRange)',
      'Capital social (fonte: BDC BasicData.CapitalSocial)',
      'Razão TPV/Capital',
    ],
    suggestedAction:
      'Solicitar DRE dos últimos 12 meses + 3 extratos bancários + faturamento mensal dos últimos 6 meses. Se justificado = aplicar monitoramento reforçado; se não justificado = revisão manual com forte tendência à recusa.',
  },
  {
    match: /pld|coaf|lavagem/i,
    title: 'Pontos de atenção em maturidade PLD/FT',
    severity: 'HIGH',
    dimension: 'compliance',
    whyItMatters:
      'Respostas no questionário indicam maturidade insuficiente em Prevenção à Lavagem de Dinheiro e Financiamento ao Terrorismo: ausência de Compliance Officer formal, falta de políticas documentadas, sem treinamento de funcionários, sem monitoramento transacional. A Circular BCB 3.978/2020 exige todos esses elementos documentados e operacionais — sua ausência é risco regulatório direto para a Pagsmile como instituição intermediária.',
    evidenceHints: [
      'Respostas das seções de PLD/FT no questionário',
      'Declarações sobre comunicação ao COAF',
      'Existência de Compliance Officer nomeado',
      'Periodicidade de auditoria declarada',
    ],
    suggestedAction:
      'Exigir política de PLD documentada (arquivo anexo), nomeação formal de Compliance Officer em registro público e treinamento anual. Aplicar monitoramento intenso obrigatório nos primeiros 90 dias.',
  },
  {
    match: /subfaixa\s*5|bloqueio|b0[0-9]|b1[0-9]/i,
    title: 'Bloqueio objetivo ativo no framework V4',
    severity: 'BLOQUEANTE',
    dimension: 'compliance',
    whyItMatters:
      'Bloqueios (B01 a B10) são condições ABSOLUTAS no framework V4, acionadas por dados objetivos da Big Data Corp (Receita Federal, listas de sanções, IBAMA, MTE, dívida ativa). Quando um bloqueio é ativo, o score V4 é anulado e a decisão é automaticamente RECUSADO — sem possibilidade de aprovação manual, sem escalação ao SENTINEL. É proteção de última linha contra aprovação indevida por erro humano.',
    evidenceHints: [
      'Código do bloqueio (B01-B10)',
      'Dado objetivo que acionou (fonte e valor)',
      'Subfaixa V4 calculada (sempre será 5 quando houver bloqueio)',
    ],
    suggestedAction:
      'Recusa automática imediata. A única forma de reapreciar é remover a condição objetiva que acionou o bloqueio (regularizar CNPJ, quitar dívida ativa, sair da lista de sanções, etc).',
  },
];

const SOURCE_FROM_PREFIX = {
  'V4:': { label: 'Big Data Corp — Dados Objetivos', tone: 'blue', badge: 'BDC' },
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
  return { label: 'Sistema de análise de risco', tone: 'slate', badge: 'GERAL' };
}

/**
 * When there's no catalogue match, we still produce a useful, DATA-FIRST card
 * using the raw text as title (without truncation) and building a reasoned
 * `whyItMatters` from the flag's metadata — never a generic placeholder.
 */
function buildFallback(rawFlag, cleanedText, prefixSource, explicitSource) {
  const sourceLabel = explicitSource || prefixSource.label;
  const isSentinel = prefixSource.badge === 'SENTINEL';
  const isBdc = prefixSource.badge === 'BDC';
  const isCaf = prefixSource.badge === 'CAF';

  let whyItMatters;
  if (isSentinel) {
    whyItMatters =
      `Este alerta foi gerado pelo SENTINEL (IA analítica) com base em cruzamento entre o questionário respondido, ` +
      `dados objetivos da Big Data Corp e resultados da CAF. O texto completo acima descreve a inconsistência específica ` +
      `identificada. Como o SENTINEL opera como relator (não decisor), este ponto não causou recusa automática, mas deve ` +
      `ser considerado no parecer qualitativo. O fato de constar como red flag indica que a severidade foi avaliada como ` +
      `relevante o suficiente para documentação obrigatória do caso.`;
  } else if (isBdc) {
    whyItMatters =
      `Este alerta foi gerado com base em dados objetivos da Big Data Corp (fonte oficial da Receita Federal, bureaus ` +
      `de crédito, listas públicas). Dados objetivos têm valor probatório direto: diferente de declarações, são verificáveis ` +
      `de forma independente. Red flags de origem BDC entram diretamente no cálculo do score V4 e afetam a subfaixa atribuída ` +
      `ao caso, conforme o framework V4 documentado.`;
  } else if (isCaf) {
    whyItMatters =
      `Este alerta foi gerado pela CAF (Combate à Fraude) durante a verificação de identidade/biometria. ` +
      `Resultados da CAF são indicadores objetivos de autenticidade do processo de onboarding digital. Alertas CAF ` +
      `sobre liveness, facematch, documentoscopia ou detecção de deepfake têm peso alto porque evidenciam falhas ` +
      `objetivas no processo, não divergências interpretáveis.`;
  } else {
    whyItMatters =
      `Alerta gerado pelo sistema de análise de risco. A descrição completa consta no título acima. ` +
      `Este tipo de apontamento exige validação cruzada entre o questionário respondido, enriquecimento BDC e resultado CAF ` +
      `antes de conclusão. O texto do alerta deve ser lido na íntegra para compreensão do risco específico levantado.`;
  }

  return {
    raw: rawFlag,
    text: cleanedText,
    title: cleanedText, // texto completo SEM truncar
    severity: 'MEDIUM',
    dimension: null,
    whyItMatters,
    evidenceHints: [
      `Texto completo do alerta: "${cleanedText}"`,
      `Fonte declarada: ${sourceLabel}`,
      'Cruzamento com as respostas do questionário (aba Respostas)',
      'Cruzamento com os dados BDC (aba Enriquecimento BDC)',
      'Cruzamento com resultados CAF (aba CAF)',
    ],
    suggestedAction:
      'Ler o texto completo do alerta acima e validar cada dado mencionado nas fontes indicadas. ' +
      'Se a evidência confirmar risco, abrir diligência adicional ou escalar para revisão manual. ' +
      'Se for falso positivo (ex: homonímia em sanções, MatchRate baixo), registrar override com justificativa.',
    source: sourceLabel,
    sourceBadge: prefixSource.badge,
    sourceTone: prefixSource.tone,
    matched: false,
  };
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

  return buildFallback(rawFlag, text, prefixSource, explicitSource);
}

export function enrichRedFlags(flags = []) {
  return flags.map(enrichRedFlag);
}