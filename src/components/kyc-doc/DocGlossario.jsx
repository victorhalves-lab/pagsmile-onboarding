import React from 'react';
import { S, H1, H2, H3, P, Table, InfoBox, Bold } from './DocHelpers';

/**
 * Seção 0 — Glossário MICROSCÓPICO
 * Normativo: definição registrada aqui prevalece sobre qualquer paráfrase
 * ao longo do manual. Dividido em 7 blocos temáticos para consulta direta.
 */
export default function DocGlossario() {
  return (
    <S>
      <H1>0. Glossário — Termos Técnicos, Regulatórios e Operacionais</H1>

      <P>Este glossário é normativo. A definição aqui registrada prevalece sobre qualquer paráfrase ao longo do manual. Ele está dividido em 8 blocos temáticos para consulta dirigida: regulatórias, framework interno, bloqueios V4, subfaixas V4, dimensões de risco, CAF/SDK, grupos BDC, entidades do banco.</P>

      <H2>0.1. Siglas e Entes Regulatórios</H2>
      <Table headers={['Sigla', 'Expansão', 'Função operacional no sistema', 'Base legal']} rows={[
        ['KYC', 'Know Your Customer', 'Identificação de pessoas físicas (titulares, sócios, representantes).', 'Circ. BCB 3.978/2020 Art. 15.'],
        ['KYB', 'Know Your Business', 'Identificação de pessoas jurídicas (razão social, CNPJ, QSA, UBO).', 'Circ. BCB 3.978/2020 Art. 16 + Res. BCB 119/2021.'],
        ['CDD', 'Customer Due Diligence', 'Diligência padrão — grupo STANDARD BDC.', 'FATF Recommendation 10.'],
        ['EDD', 'Enhanced Due Diligence', 'Diligência reforçada: owners_kyc + economic_group. Obrigatória para PEP/sancionado/subfaixa 3+.', 'Circ. BCB 3.978/2020 Art. 27-29.'],
        ['PEP', 'Pessoa Politicamente Exposta', 'Agente público ou parente 2º grau / cônjuge. Não é impeditivo; exige EDD + aprovação alta administração.', 'Circ. BCB 3.978/2020 Art. 27-28 + Res. BCB 44/2020.'],
        ['UBO', 'Ultimate Beneficial Owner (Beneficiário Final)', 'Pessoa física com ≥25% da PJ (direto/indireto) OU controle efetivo.', 'Circ. BCB 3.978/2020 Art. 16, FATF Rec. 24-25.'],
        ['PLD/FT', 'Prevenção à Lavagem + Financiamento ao Terrorismo', 'Monitoramento transacional + comunicação COAF quando suspeito.', 'Lei 9.613/1998 + Circ. BCB 3.978/2020.'],
        ['RBA', 'Risk-Based Approach', 'Intensidade da diligência proporcional ao risco identificado.', 'Res. BCB 119/2021.'],
        ['CNAE', 'Classificação Nacional de Atividades Econômicas', 'Código IBGE/CONCLA. 6619-3, 6434-4, 6613-4 são PLD sensíveis.', 'IBGE + RFB.'],
        ['QSA', 'Quadro de Sócios e Administradores', 'Lista com qualificação + percentual. Validada via BDC kyc dataset.', 'Receita Federal.'],
        ['MCC', 'Merchant Category Code', 'Código 4 dígitos Visa/Mastercard.', 'ISO 18245.'],
        ['TPV', 'Total Payment Volume', 'Volume declarado no questionário × validado contra movimentação real.', '—'],
        ['OFAC', 'Office of Foreign Assets Control (EUA)', 'Lista SDN (Specially Designated Nationals). Match = B03.', 'US Treasury.'],
        ['COAF', 'Conselho de Controle de Atividades Financeiras', 'Unidade de inteligência financeira BR. Recebe COS (comunicação de operação suspeita).', 'Lei 9.613/1998.'],
        ['CEIS', 'Cadastro de Empresas Inidôneas e Suspensas', 'CGU. Contratação pública proibida → B03.', 'Lei 12.846/2013.'],
        ['CNEP', 'Cadastro Nacional de Empresas Punidas', 'CGU. Ato lesivo à administração pública.', 'Lei 12.846/2013.'],
        ['MTE (Lista Suja)', 'Ministério do Trabalho e Emprego', 'Cadastro de trabalho escravo contemporâneo → B08.', 'Portaria Interministerial 4/2016.'],
        ['SCR', 'Sistema de Informações de Crédito', 'BCB. Gold standard de histórico financeiro PF (operações ≥ R$200).', 'Res. BCB 4.571/2017.'],
        ['FATF/GAFI', 'Financial Action Task Force', '40 Recommendations — espinha dorsal do framework.', 'OECD.'],
        ['LGPD', 'Lei Geral de Proteção de Dados', 'Docs KYC = dados sensíveis → storage privado + signed URL 5min.', 'Lei 13.709/2018.'],
        ['BaaS', 'Banking-as-a-Service', 'Modelo onde instituição licenciada cede infra bancária via API.', 'Res. BCB Conj. 16/2025.'],
      ]} />

      <H2>0.2. Framework Interno — Princípios e Arquitetura</H2>
      <Table headers={['Termo', 'Definição precisa']} rows={[
        ['Data-First v7.0', 'Princípio arquitetural vigente: decisão BASEADA EXCLUSIVAMENTE em dados verificados (BDC, CAF). IA é relatora, nunca decisora.'],
        ['Pipeline (autoEnrichOnboarding)', 'Função backend orquestradora que roda 11 steps não-bloqueantes: CAF post-capture → BDC → CAF full → credit → screening → CPF validation → VerifAI → SENTINEL → decisão → Slack → update status.'],
        ['Score V4', 'Número 0-849 calculado por bdcEnrichCase. 0 = melhor, 849 = pior, 850 = bloqueado (subfaixa 5).'],
        ['Fonte Única do Score', 'bdcEnrichCase é o único produtor legítimo de ComplianceScore.score_final. Outro valor = override manual ou bug histórico.'],
        ['Safety Net', 'Trava: se decisão = Recusado MAS sem bloqueio V4 ativo E sem fraude CAF → rebaixa para Revisão Manual. Filosofia "na dúvida, humano decide".'],
        ['Veto Biométrico CAF', 'Única exceção ao veredito V4: fraude confirmada (liveness REPROVED, deepfake DETECTED, documentoscopia REPROVED) força Revisão Manual.'],
        ['SENTINEL v7', 'Agente IA (gemini_3_1_pro) — 4 relatórios paralelos (questionário + BDC + CAF + consolidação). Output = narrativa, nunca decisão.'],
        ['Fire-and-forget', 'Padrão de execução: front retorna sucesso em <2s, processamento pesado (VerifAI, SENTINEL) em background.'],
        ['VerifAI', 'Serviço CAF: detecta manipulação digital, legibilidade, conformidade de layout. Fire-and-forget em todo upload.'],
        ['BigID', 'API BDC de validação de identidade. Fallback quando CAF SDK falha.'],
        ['Fallback CAF→BDC', 'BdcFallbackVerification: documentoscopia + facematch + liveness via BigID quando SDK CAF não inicializa.'],
        ['Escalação Questionável', 'Caso em Revisão Manual com subfaixa 1A-3B — possível escalação desnecessária. Listado em /EscalationsReview.'],
        ['Pré-preenchimento (autocomplete)', 'Respostas herdadas de Lead v5 / Lead PIX v4 ao abrir /ComplianceDinamico — reduz fricção e garante consistência.'],
        ['Template Model', 'String identificadora (ex: ComplianceEcommerceV4). Mapeada em complianceModelRegistry.js para storageKey, documentUploadPage, flowType, badgeLabel.'],
        ['Lead Pin Bank V5', 'Funil público de captação (cartão) com 12 etapas: Tipo de Negócio → Dados da Empresa → Endereço → Contato → Modelo de Negócio → Composição da Operação → Volumetria → Distribuição → Taxas Atuais → Processador → Compliance → Fechamento. Hospedado em /QuestionarioLeadsPagsmile.'],
        ['Lead PIX V4', 'Funil público de captação (PIX) com 7 etapas: Tipo PIX → Dados da Empresa → Modelo de Negócio → Volume PIX → Situação Atual → Serviços Complementares → Contato. Hospedado em /LeadPixV4.'],
        ['Fechamento Landing', 'Funil público acoplado a propostas padrão (URL /pp/:slug). 3 blocos consolidados (Empresa + Volumetria + Modelo) — gera Lead + Proposal + OnboardingCase rascunho de uma vez.'],
        ['mixOperacao', 'Composição percentual do que o cliente vende: { ecommerce, dropshipping, infoproduto, saas, educacao, outros: [{nome, percentual}] }. Soma OBRIGATORIAMENTE 100%. Renderizado pelo MixOperacaoSlider na Etapa 6 (não 2 — reorganizado em 2026) do Lead V5.'],
        ['Distribuição', 'Composição percentual dos meios de pagamento usados: { credito, debito, pix, boleto } (se já processa) ou distribuicaoDesejada (se está começando). Etapa 8 do Lead V5. Soma 100% obrigatoriamente.'],
        ['Distribuicao Parcelamento', 'Composição percentual das parcelas do crédito: { avista, de2a6x, de7a12x, de13a21x }. Soma 100%. Coletada na Etapa 8 quando jaProcessa="Sim, já processo".'],
        ['Lead Qualifier', 'Score 0-100 calculado client-side no submit do Lead V5/PIX V4 + ajustes BDC server-side. Mapeado para leadQualifierLevel ∈ {EXCELENTE, BOM, REGULAR, FRACO, INSUFICIENTE, PENDENTE}. Persistido em Lead.leadQualifierScore e Lead.leadQualifierLevel.'],
        ['BDC Lead Score', 'Variante do score qualificador que aplica ajustes a partir do bdcEnrichmentData (Shell Company, atividade, idade da empresa, RAIS). Persistido em Lead.bdcLeadScore. Calculado por calculateBDCEnrichedScore.'],
        ['Flags Silenciosas', '16 booleanos calculados pelo calculateSilentFlags ao submeter Lead V5: PERSONAL_EMAIL, NO_WEBSITE, NO_ANTIFRAUDE, HIGH_CHARGEBACK, HIGH_MED_PIX, TERMINATED_BEFORE, TPV_EXCEEDS_REVENUE, NEW_MERCHANT, CNPJ_SITUACAO_IRREGULAR, EMPRESA_NOVA, SETOR_REGULADO, CNAE_MISMATCH, VOLUME_INCOMPATIVEL, JUST_QUOTING, LOW_TICKET, HIGH_REFUND_POLICY. Não bloqueiam submit — alimentam ranking comercial.'],
      ]} />

      <H2>0.3. Bloqueios V4 — B01 a B10</H2>
      <P>Condições que forçam Score = 850, colocam o caso na subfaixa 5 e resultam em Recusado automático. São mutuamente independentes — basta um ativo para bloquear.</P>
      <Table headers={['Código', 'Nome', 'Condição exata', 'Origem do dado']} rows={[
        ['B01', 'CNPJ INAPTO', 'BDC basic_data.TaxRegime.Status ≠ "ATIVA" (INAPTA/SUSPENSA/BAIXADA/NULA).', 'BDC basic_data'],
        ['B02', 'CPF IRREGULAR', 'BDC pessoas_kyc.CPFStatus ≠ "REGULAR" (SUSPENSO/CANCELADO/TITULAR FALECIDO).', 'BDC pessoas_kyc'],
        ['B03', 'SANÇÃO DIRETA', 'Match em OFAC/SDN, CEIS, CNEP, Interpol, lista BCB (exato OU fuzzy ≥90%).', 'BDC kyc + CAF sanctions_international'],
        ['B04', 'FAMILIAR SANCIONADO (PF)', 'Parente direto (pai/mãe/cônjuge) em lista de sanções. Casos PF.', 'BDC pessoas_kyc relationships'],
        ['B05', 'SHELL COMPANY SEVERO', 'BDC activity_indicators.ShellCompanyScore > 80% E ausência simultânea de domínio + passagens web + RAIS.', 'BDC activity_indicators + domains'],
        ['B06', 'DÍVIDA ATIVA CRÍTICA', 'Soma PGFN/Receita > R$500.000 OU execução fiscal ativa.', 'BDC processes + collections'],
        ['B07', 'MÍDIA NEGATIVA GRAVE', 'Menção em mídia tier-1 (Valor/Estadão/Folha/Globo) com keywords "fraude", "estelionato", "pirâmide" nos 24 meses.', 'BDC news (tier-1)'],
        ['B08', 'TRABALHO ESCRAVO (Lista Suja MTE)', 'Empregador listado nos últimos 2 anos.', 'BDC kyc (government lists)'],
        ['B09', 'EMBARGO AMBIENTAL IBAMA', 'Empresa ou sócios com embargo ambiental ativo.', 'BDC environmental'],
        ['B10', 'FAMILIAR SANCIONADO (sócio PJ)', 'Sócio >25% com parente direto sancionado.', 'BDC owners_kyc + relationships'],
      ]} />

      <H2>0.4. Subfaixas V4 — Classificação do Score</H2>
      <P>Score V4 (0-850) mapeado para subfaixa que dita decisão, monitoramento e rolling reserve. Códigos abaixo = valores exatos do enum <code>OnboardingCase.subfaixa</code>.</P>
      <Table headers={['Subfaixa', 'Nome interno', 'Range', 'Decisão', 'Rolling Reserve', 'Monitoramento']} rows={[
        ['1A', 'VERDE EXPRESS', '0 – 99', 'Aprovado (fast-track)', '0%', 'PADRÃO'],
        ['1B', 'VERDE', '100 – 199', 'Aprovado', '0%', 'PADRÃO'],
        ['2A', 'AZUL', '200 – 299', 'Aprovado', '0-5%', 'REFORÇADO_LEVE'],
        ['2B', 'AZUL AMARELADO', '300 – 399', 'Aprovado com Condições', '5-10%', 'REFORÇADO'],
        ['3A', 'AMARELO', '400 – 499', 'Aprovado com Condições', '10-15%', 'INTENSO'],
        ['3B', 'LARANJA', '500 – 599', 'Revisão Manual (política)', '15%', 'INTENSO_PLUS'],
        ['4', 'VERMELHO', '600 – 849', 'Revisão Manual', '20%', 'MÁXIMO'],
        ['5', 'BLOQUEADO', '850', 'Recusado (por bloqueio V4)', 'N/A', 'N/A'],
      ]} />

      <H2>0.5. Dimensões do Risk Scoring V4 — Camada 2</H2>
      <P>Cada dimensão contribui com pontos ponderados ao score. Camada 2 é a que o SENTINEL mais analisa para produzir a narrativa dimensional.</P>
      <Table headers={['#', 'Dimensão', 'Datasets BDC que alimentam', 'Exemplos de variáveis']} rows={[
        ['1', 'Identidade & Situação Cadastral', 'basic_data, kyc', 'CNPJ ativo, idade, natureza jurídica, capital proporcional.'],
        ['2', 'Quadro Societário (QSA)', 'kyc, owners_kyc', 'UBO identificado, sócios ativos × declarados, laranjas detectados.'],
        ['3', 'Atividade Operacional Real', 'activity_indicators, domains, phones, emails', 'Shell score, RAIS empregados, site ativo, telefone fixo válido.'],
        ['4', 'Grupo Econômico', 'economic_group, economic_group_kyc', 'Controladoras/controladas identificadas, exposição cruzada.'],
        ['5', 'Reputação Digital', 'news, reputation', 'Menções mídia tier-1/tier-2, reclamações ReclameAqui, pegada social.'],
        ['6', 'Saúde Financeira', 'credit_profile (PJ/PF), collections', 'Score de crédito, dívidas, protestos.'],
        ['7', 'Compliance Regulatório', 'processes, sanctions, kyc', 'Processos, sanções, PEP, CEIS/CNEP.'],
        ['8', 'Estrutura Trabalhista (PJ)', 'activity_indicators', 'RAIS positivo/zero, proporção salários × capital.'],
        ['9', 'ESG', 'environmental, labor (IBAMA, MTE)', 'Embargo ambiental, lista MTE, autuações.'],
        ['10', 'Transacional Declarado', 'QuestionnaireResponse', 'TPV, ticket médio, coerência com segmento.'],
        ['11', 'Geografia Operacional', 'addresses', 'Endereços virtuais, match com CEP declarado, concentração regional.'],
        ['12', 'Histórico Bancário PF', 'SCR via credit_profile', 'Operações ativas, carteira de crédito, inadimplência.'],
        ['13', 'Cross-validation Declarado × Confirmado', 'comparativo QuestionnaireResponse × BDC', 'CNPJ declarado ≠ resolvido, faturamento declarado 3× RAIS esperado, MCC incompatível com CNAE.'],
      ]} />

      <H2>0.6. CAF — Serviços, SDKs e Status</H2>

      <H3>0.6.1. Tipos de CAF SDK (<code>DocumentType.cafSdk</code>)</H3>
      <Table headers={['Valor', 'Serviço CAF', 'O que captura', 'Quando aplicado']} rows={[
        ['FaceLiveness', 'Liveness + Facematch', 'Selfie com prova de vida (vídeo curto). Compara com documento.', 'Obrigatório em PF e em PJ que exige representante legal.'],
        ['DocumentDetector', 'OCR + document_detector', 'Front/back de RG/CNH com guias de enquadramento.', 'Documentos de identidade PF e representante legal PJ.'],
        ['SelfieWithDocument', 'Selfie estática', 'Usuário segurando documento ao lado do rosto (sem vídeo).', 'Fallback quando FaceLiveness falha ou requisito suplementar.'],
        ['— (vazio)', 'Upload nativo', 'Input file direto. Sem fluxo CAF.', 'Contrato social, comprovante endereço, balanço DRE.'],
      ]} />

      <H3>0.6.2. Status (<code>IntegrationLog.result_status</code>)</H3>
      <Table headers={['Status', 'Significado', 'Consequência no pipeline']} rows={[
        ['APPROVED', 'Serviço OK + validação positiva.', 'Continua para próximo step.'],
        ['REPROVED', 'Validação negativa (liveness REPROVED, facematch similarity < 75%).', 'Se "Veto Biométrico" → força Revisão Manual. Senão, red flag ao SENTINEL.'],
        ['PENDING_REVIEW', 'Resultado ambíguo — olhar humano.', 'Finding SENTINEL severidade média.'],
        ['NOT_APPLICABLE', 'Não se aplicava ao caso.', 'Step marcado como pulado; sem ação.'],
      ]} />

      <H3>0.6.3. Serviços CAF por step do pipeline</H3>
      <Table headers={['service_type', 'Propósito']} rows={[
        ['onboarding_web', 'Captura inicial do documento + selfie no SDK (pré-pipeline).'],
        ['document_liveness', 'Prova de vida sobre o documento.'],
        ['face_liveness', 'Prova de vida da selfie.'],
        ['face_authentication', 'Comparação selfie × documento (facematch).'],
        ['deepfake_detection', 'Detecta manipulação por GAN / Stable Diffusion.'],
        ['documentscopy', 'Autenticidade do documento (hologramas, texturas, OCR cross-check).'],
        ['caf_post_capture_full', 'Consolidado pós-captura (step 1 do pipeline backend).'],
        ['kyb_company_search / kyb_business_identity', 'Verificação CNPJ em fontes governamentais.'],
        ['kyb_credit_report / pj_credit_profile / pf_credit_profile', 'Análise de crédito (PJ ou PF).'],
        ['pep_international / sanctions_international / warnings_interpol', 'Screenings internacionais.'],
        ['cpf_cross_validation', 'Cross-check CPF × nome × nascimento × nome da mãe.'],
        ['verifai_docs', 'Autenticação de documentos uploadados (fire-and-forget).'],
        ['private_faceset / shared_faceset', 'Match contra base de faces (detecção de duplicatas).'],
        ['face_register', 'Registra face do aprovado no private_faceset.'],
      ]} />

      <H2>0.7. BDC — Grupos de Datasets e Fila de Retry</H2>

      <H3>0.7.1. Grupos (dataset groups)</H3>
      <Table headers={['Grupo', 'Uso', 'Datasets típicos']} rows={[
        ['STANDARD', 'Default para baixo risco (subfaixa 1-2).', 'basic_data, kyc, addresses, phones, emails, activity_indicators.'],
        ['FULL', 'Alto risco ou manual review (subfaixa 3+).', 'STANDARD + owners_kyc, economic_group, processes, collections, sanctions, news, reputation.'],
        ['LITE', 'Baixa exigência (link de docs, revalidação leve).', 'basic_data + kyc + addresses apenas.'],
        ['PIX_MERCHANT', 'Templates PIX Merchants V4.', 'basic_data + kyc + addresses + domains + activity_indicators.'],
      ]} />

      <H3>0.7.2. Prioridades de retry (<code>BdcRetryQueue.priority</code>)</H3>
      <Table headers={['Prioridade', 'Datasets enquadrados', 'Política do worker']} rows={[
        ['CRITICAL', 'basic_data, kyc, sanctions', 'Retry a cada 5min, máx 10 tentativas, timeout 24h.'],
        ['IMPORTANT', 'owners_kyc, processes, economic_group', 'Retry a cada 30min, máx 8 tentativas, timeout 72h.'],
        ['COMPLEMENTARY', 'news, reputation, environmental', 'Retry a cada 2h, máx 6 tentativas, timeout 7 dias. Sucesso tardio recalcula score.'],
      ]} />

      <H2>0.8. Entidades do Banco — Papel e Relações</H2>
      <Table headers={['Entidade', 'Finalidade', 'Relações-chave']} rows={[
        ['OnboardingCase', 'Registro raiz do ciclo KYC/KYB.', 'merchantId → Merchant; questionnaireTemplateId → QuestionnaireTemplate.'],
        ['Merchant', 'Cliente PJ/PF. Quando subseller, parentMerchantId → seller.', 'parentMerchantId; isSubseller boolean.'],
        ['QuestionnaireTemplate', 'Template de questionário. model, requiredDocuments[], riskThresholds.', 'Mapeado em complianceModelRegistry.js.'],
        ['Question', 'Pergunta individual. type, options, riskWeight, conditionalLogic.', 'questionnaireTemplateId → QuestionnaireTemplate.'],
        ['QuestionnaireResponse', 'Resposta por pergunta.', '(onboardingCaseId + questionId) chave lógica.'],
        ['DocumentUpload', 'Arquivo do cliente. fileUri privado (LGPD), VerifAI notes.', 'onboardingCaseId + documentTypeId. notAvailable + notAvailableReason quando declarado ausente.'],
        ['DocumentType', 'Catálogo — name, formats, maxSize, cafSdk, conditionalLogic, instructions.', 'Referenciado em QuestionnaireTemplate.requiredDocuments[].'],
        ['ComplianceScore', 'Resultado V4 + SENTINEL.', '1:1 com OnboardingCase.'],
        ['ExternalValidationResult', 'Resultado bruto de cada dataset/serviço por caso.', 'onboardingCaseId + provider + service_type.'],
        ['IntegrationLog', 'Log técnico de cada chamada API.', 'onboarding_case_id + provider + service_type.'],
        ['BankDataCollection', 'Coleta de conta bancária via token público — alimenta export Pré-KYC.', 'onboardingCaseId + token único 192-bit.'],
        ['PartnerAssignment', 'Atribuição de caso a parceiro externo.', 'onboardingCaseId + partnerId → CompliancePartner.'],
        ['CompliancePartner', 'Empresa parceira externa (bureau, auditoria).', '1:N com CompliancePartnerUser.'],
        ['AccessProfile', 'Perfil granular de permissões admin.', '1:N com User via UserProfileAssignment.'],
        ['AccessAudit', 'Log de navegação e ações (retenção 5 anos).', 'userId + action + resource.'],
        ['TwoFactorAudit', 'Log específico 2FA.', 'userId + event.'],
        ['AdminLoginAttempt', 'Tentativas de login admin (anti brute-force).', 'userId + success + ip.'],
        ['BdcRetryQueue', 'Fila de datasets BDC que falharam inline.', 'onboardingCaseId + dataset + attempts + priority.'],
      ]} />

      <InfoBox title="Como usar este glossário">
        <p>Todo termo em negrito ou sigla ao longo do manual é <strong>normativamente definido aqui</strong>. Termos introduzidos por evoluções do produto devem ser registrados nesta seção primeiro, antes de aparecerem em qualquer outra. Ordem de precedência: <em>Base legal &gt; Definição operacional &gt; Convenção interna</em>.</p>
      </InfoBox>
    </S>
  );
}