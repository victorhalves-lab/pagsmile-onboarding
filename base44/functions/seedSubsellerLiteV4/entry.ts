// ─────────────────────────────────────────────────────────────────────
// SEED — Subseller Lite V4 (PF + PJ)
// ─────────────────────────────────────────────────────────────────────
// Cria 2 novos templates V4 enxutos para subsellers, exatamente conforme
// a "Visão Final" acordada com o usuário (PF ~32 perguntas, PJ ~28 visíveis).
//
// Estratégia:
//   1. Arquiva os templates antigos `subseller_pf` (55q) e `subseller_v2` (52q)
//      → isArchived=true + isActive=false. Casos antigos continuam funcionando.
//   2. Cria os novos `subseller_pf_lite_v4` e `subseller_pj_lite_v4` com
//      perguntas e requiredDocuments definidos abaixo.
//   3. Idempotente: se rodar 2x, atualiza em vez de duplicar.
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Perguntas PF (~32) ──────────────────────────────────────────────
function buildPFQuestions(templateId) {
  return [
    // Bloco 1 — Identificação (5)
    { templateId, order: 1, text: 'Nome completo', type: 'TEXT', isRequired: true },
    { templateId, order: 2, text: 'CPF', type: 'CPF_CNPJ', isRequired: true },
    { templateId, order: 3, text: 'Data de nascimento', type: 'DATE', isRequired: true },
    { templateId, order: 4, text: 'Nome da mãe', type: 'TEXT', isRequired: true },
    { templateId, order: 5, text: 'Nacionalidade', type: 'SELECT', isRequired: true,
      options: ['Brasileira', 'Estrangeira'] },

    // Bloco 2 — Endereço residencial (autocomplete via CEP)
    { templateId, order: 6, text: 'CEP', type: 'TEXT', isRequired: true,
      helpText: 'Digite o CEP para preencher automaticamente seu endereço.' },
    { templateId, order: 7, text: 'Número', type: 'TEXT', isRequired: true },
    { templateId, order: 8, text: 'Complemento', type: 'TEXT', isRequired: false },

    // Bloco 3 — Atividade de negócio (5)
    { templateId, order: 9, text: 'Qual o tipo de negócio?', type: 'SELECT', isRequired: true,
      options: [
        'E-commerce — Produtos físicos com estoque próprio',
        'E-commerce — Serviços',
        'Infoprodutos (cursos, e-books, mentorias)',
        'Assinaturas / Recorrência',
        'Marketplace (vende em sites de terceiros)',
        'Dropshipping (vende estoque de terceiros)',
        'Outro',
      ] },
    { templateId, order: 10, text: 'Descreva os produtos e/ou serviços comercializados', type: 'TEXT', isRequired: true,
      helpText: 'Ex: Vendo roupas femininas importadas, Curso de inglês online, etc.' },
    { templateId, order: 11, text: 'Site, Instagram ou canal principal de vendas', type: 'TEXT', isRequired: false },
    { templateId, order: 12, text: 'Há quanto tempo atua nesta atividade?', type: 'SELECT', isRequired: true,
      options: ['Menos de 6 meses', '6 a 12 meses', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos'] },
    { templateId, order: 13, text: 'Segmento detalhado', type: 'TEXT', isRequired: false,
      helpText: 'Detalhe seu nicho se quiser (opcional).' },

    // Bloco 5 — Perfil transacional (3 — sem sazonalidade nem forma de pagamento)
    { templateId, order: 14, text: 'TPV mensal estimado (R$)', type: 'NUMBER', isRequired: true,
      helpText: 'Volume total de transações em reais por mês.' },
    { templateId, order: 15, text: 'Ticket médio (R$)', type: 'NUMBER', isRequired: true },
    { templateId, order: 16, text: 'Volume estimado de transações por mês', type: 'NUMBER', isRequired: true },

    // Bloco 6 — PEP & sanções (6 — regulatório BACEN)
    { templateId, order: 17, text: 'É Pessoa Politicamente Exposta (PEP)?', type: 'BOOLEAN', isRequired: true,
      helpText: 'PEP são agentes públicos ou pessoas com cargos políticos relevantes.' },
    { templateId, order: 18, text: 'Possui relacionamento próximo com PEP?', type: 'BOOLEAN', isRequired: true,
      helpText: 'Familiar ou pessoa próxima que seja Pessoa Politicamente Exposta.' },
    { templateId, order: 19, text: 'Opera com recursos de terceiros?', type: 'BOOLEAN', isRequired: true,
      helpText: 'Se você movimenta dinheiro de outras pessoas ou empresas.' },
    { templateId, order: 20, text: 'Possui pendência judicial ou restrição cadastral?', type: 'BOOLEAN', isRequired: true },
    { templateId, order: 21, text: 'Já foi alvo de sanções (OFAC, ONU, UE)?', type: 'BOOLEAN', isRequired: true },
    { templateId, order: 22, text: 'Já teve conta bancária encerrada por irregularidade?', type: 'BOOLEAN', isRequired: true },

    // Bloco 7 — Termo único final
    { templateId, order: 23, text: 'Declaro, sob as penas da lei, que: (i) todas as informações prestadas são verdadeiras; (ii) autorizo a consulta e validação dos meus dados junto a bureaus de crédito e bases públicas; (iii) concordo com a Política de Privacidade e Termos de Uso (LGPD - Lei 13.709/2018); (iv) estou ciente das obrigações de Prevenção à Lavagem de Dinheiro (PLD/FT); (v) comprometo-me a manter meu cadastro atualizado; (vi) aceito o monitoramento contínuo das minhas transações.',
      type: 'BOOLEAN', isRequired: true,
      helpText: 'Marque para aceitar todas as declarações regulatórias acima.' },
  ];
}

// ─── Perguntas PJ (~28 visíveis) ─────────────────────────────────────
function buildPJQuestions(templateId) {
  return [
    // Bloco 1 — Identificação empresa (1 — só CNPJ; BDC enriquece silenciosamente)
    { templateId, order: 1, text: 'CNPJ', type: 'CPF_CNPJ', isRequired: true,
      helpText: 'Após digitar o CNPJ, os dados públicos da empresa serão validados automaticamente pelo nosso sistema.' },

    // Bloco 2 — Endereço operacional (CEP autocomplete)
    { templateId, order: 2, text: 'CEP da operação', type: 'TEXT', isRequired: true,
      helpText: 'Digite o CEP para preencher automaticamente seu endereço operacional.' },
    { templateId, order: 3, text: 'Número', type: 'TEXT', isRequired: true },
    { templateId, order: 4, text: 'Complemento', type: 'TEXT', isRequired: false },
    { templateId, order: 5, text: 'Tipo de instalação', type: 'SELECT', isRequired: true,
      options: ['Escritório próprio', 'Coworking', 'Endereço virtual', 'Residencial', 'Armazém / Galpão'] },

    // Bloco 3 — Atividade econômica (3)
    { templateId, order: 6, text: 'Descreva, em poucas linhas, o que sua empresa faz', type: 'TEXT', isRequired: true,
      helpText: 'Conte como sua empresa gera receita.' },
    { templateId, order: 7, text: 'Quais são os produtos ou serviços principais?', type: 'TEXT', isRequired: true },
    { templateId, order: 8, text: 'Site oficial, loja ou redes sociais', type: 'TEXT', isRequired: false },

    // Bloco 4 — Modelo operacional (5)
    { templateId, order: 9, text: 'Como sua empresa vende?', type: 'SELECT', isRequired: true,
      options: ['E-commerce', 'Dropshipping', 'Infoprodutos', 'SaaS'] },
    { templateId, order: 10, text: 'Quais são os canais de venda?', type: 'MULTI_SELECT', isRequired: true,
      options: ['E-commerce próprio', 'Marketplace (Mercado Livre, Shopee, etc.)', 'Loja física',
                'Redes sociais', 'Aplicativo próprio', 'Televendas', 'Link de pagamento', 'Outro'] },
    { templateId, order: 11, text: 'Como é a entrega ou cumprimento da venda?', type: 'TEXT', isRequired: true },
    { templateId, order: 12, text: 'Possui estoque próprio?', type: 'BOOLEAN', isRequired: true },
    { templateId, order: 13, text: 'Modelo de receita', type: 'SELECT', isRequired: true,
      options: ['Transacional (compra avulsa)', 'Recorrente (assinatura)', 'Misto'] },

    // Bloco 5 — Representante legal (2)
    { templateId, order: 14, text: 'Nome do representante legal', type: 'TEXT', isRequired: true },
    { templateId, order: 15, text: 'CPF e cargo do representante legal', type: 'TEXT', isRequired: true,
      helpText: 'Ex: 123.456.789-00 — Sócio-Administrador' },

    // Bloco 6 — Perfil transacional (4)
    { templateId, order: 16, text: 'TPV mensal estimado (R$)', type: 'NUMBER', isRequired: true },
    { templateId, order: 17, text: 'Ticket médio (R$)', type: 'NUMBER', isRequired: true },
    { templateId, order: 18, text: 'Volume estimado de transações por mês', type: 'NUMBER', isRequired: true },
    { templateId, order: 19, text: 'Forma de pagamento que pretende usar', type: 'MULTI_SELECT', isRequired: true,
      options: ['Cartão de crédito', 'Cartão de débito', 'Pix', 'Boleto'] },

    // Bloco 7 — Compliance regulatório (6)
    { templateId, order: 20, text: 'Algum sócio ou representante legal é Pessoa Politicamente Exposta (PEP)?',
      type: 'BOOLEAN', isRequired: true },
    { templateId, order: 21, text: 'A empresa ou sócios já foram alvo de sanções (OFAC, ONU, UE)?',
      type: 'BOOLEAN', isRequired: true },
    { templateId, order: 22, text: 'A empresa já teve conta encerrada em outra instituição financeira?',
      type: 'BOOLEAN', isRequired: true },
    { templateId, order: 23, text: 'A empresa já teve taxa de chargeback superior a 2%?',
      type: 'BOOLEAN', isRequired: true },
    { templateId, order: 24, text: 'Já houve reclamações graves no Procon ou Reclame Aqui?',
      type: 'BOOLEAN', isRequired: true },
    { templateId, order: 25, text: 'Existe processo judicial em curso contra a empresa ou sócios?',
      type: 'BOOLEAN', isRequired: true },

    // Bloco 8 — Específico do segmento (condicionais ao Q9 "Como sua empresa vende?")
    // 8a — E-commerce
    { templateId, order: 30, text: 'Qual o tempo médio de entrega?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'E-commerce' } },
    { templateId, order: 31, text: 'Quais transportadoras parceiras você utiliza?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'E-commerce' } },
    { templateId, order: 32, text: 'Qual a política de troca e reembolso?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'E-commerce' } },
    { templateId, order: 33, text: 'Emite nota fiscal eletrônica?', type: 'BOOLEAN', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'E-commerce' } },

    // 8b — Dropshipping (sem reclamações Procon nem margem)
    { templateId, order: 40, text: 'Quem é o fornecedor principal?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },
    { templateId, order: 41, text: 'Possui contrato formal com esse fornecedor?', type: 'BOOLEAN', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },
    { templateId, order: 42, text: 'Qual o tempo médio de entrega real?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },
    { templateId, order: 43, text: 'Qual a política de reembolso? (Prazo e condições)', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },

    // 8c — Infoprodutos
    { templateId, order: 50, text: 'Qual o tipo de conteúdo vendido?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Infoprodutos' },
      helpText: 'Ex: cursos em vídeo, e-books, mentorias ao vivo.' },
    { templateId, order: 51, text: 'Como o cliente recebe ou acessa o conteúdo?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Infoprodutos' } },
    { templateId, order: 52, text: 'Oferece garantia de reembolso?', type: 'BOOLEAN', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Infoprodutos' } },
    { templateId, order: 53, text: 'Vende com afiliados?', type: 'BOOLEAN', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Infoprodutos' } },

    // 8d — SaaS
    { templateId, order: 60, text: 'Qual o modelo de assinatura?', type: 'SELECT', isRequired: true,
      options: ['Mensal', 'Anual', 'Mensal e Anual', 'Vitalícia', 'Outro'],
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'SaaS' } },
    { templateId, order: 61, text: 'Oferece período de trial gratuito?', type: 'BOOLEAN', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'SaaS' } },
    { templateId, order: 62, text: 'Qual a política de cancelamento?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'SaaS' } },
    { templateId, order: 63, text: 'Como é feito o onboarding do cliente?', type: 'TEXT', isRequired: true,
      conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'SaaS' } },

    // Bloco 9 — Termo único final
    { templateId, order: 70, text: 'Declaramos, sob as penas da lei, que: (i) todas as informações são verdadeiras; (ii) autorizamos a consulta e validação dos dados junto a bureaus e bases públicas; (iii) concordamos com a Política de Privacidade e Termos de Uso (LGPD - Lei 13.709/2018); (iv) estamos cientes das obrigações de PLD/FT (Lei 9.613/1998); (v) comprometemo-nos a manter o cadastro atualizado; (vi) aceitamos o monitoramento contínuo das transações.',
      type: 'BOOLEAN', isRequired: true,
      helpText: 'Marque para aceitar todas as declarações regulatórias acima.' },
  ];
}

// ─── Documentos PF ───────────────────────────────────────────────────
const PF_REQUIRED_DOCUMENTS = [
  { documentTypeId: 'doc_caf_face_liveness_pf', label: 'Validação biométrica (RG/CNH + selfie via CAF)', required: true, conditionalLogic: null },
  { documentTypeId: 'doc_pf_comprovante_endereco', label: 'Comprovante de Endereço Residencial', required: true, conditionalLogic: null },
];

// ─── Documentos PJ ───────────────────────────────────────────────────
// Universais (3) + condicionais por segmento.
// Marcadores especiais: dependsOn `segmento_pj` → mapeado em runtime para o id da Q9 real.
const PJ_REQUIRED_DOCUMENTS = [
  // Universais
  { documentTypeId: 'doc_caf_face_liveness_repleg', label: 'Validação biométrica do Representante Legal (RG/CNH + selfie via CAF)', required: true, conditionalLogic: null },
  { documentTypeId: 'doc_base_contrato_social', label: 'Contrato Social / Estatuto', required: true, conditionalLogic: null },
  { documentTypeId: 'doc_base_comprovante_endereco', label: 'Comprovante de Endereço da Empresa', required: true, conditionalLogic: null,
    helpText: 'Necessário se o endereço operacional for diferente do registrado na Receita.' },

  // E-commerce
  { documentTypeId: 'doc_ecommerce_loja_online', label: 'Print da Loja Online', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'E-commerce' } },
  { documentTypeId: 'doc_ecommerce_comprovante_envio', label: 'Comprovante de Envio Recente', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'E-commerce' } },
  { documentTypeId: 'doc_ecommerce_nota_fiscal', label: 'Nota Fiscal de Compra de Mercadoria (amostra)', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'E-commerce' } },

  // Dropshipping
  { documentTypeId: 'doc_dropshipping_loja_oferta', label: 'Print da Loja / Plataforma / Oferta', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },
  { documentTypeId: 'doc_ds_comprovante_fornecedor', label: 'Comprovante do Fornecedor (Contrato ou Invoice)', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },
  { documentTypeId: 'doc_dropshipping_rastreamento', label: 'Print de Rastreamento de Pedido Recente', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },
  { documentTypeId: 'doc_dropshipping_politica_reembolso', label: 'Política de Reembolso Publicada', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },
  { documentTypeId: 'doc_ds_nota_fiscal_fornecedor', label: 'Nota Fiscal de Compra (Fornecedor)', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },
  { documentTypeId: 'doc_ds_balanco_dre', label: 'Balanço Patrimonial + DRE (opcional)', required: false,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Dropshipping' } },

  // Infoprodutos
  { documentTypeId: 'doc_infoprodutos_entrega', label: 'Print de Entrega do Produto Digital', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Infoprodutos' } },
  { documentTypeId: 'doc_infoprodutos_pagina_vendas', label: 'Print da Página de Vendas', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Infoprodutos' } },
  { documentTypeId: 'doc_infoprodutos_politica_garantia', label: 'Política de Reembolso / Garantia Publicada', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'Infoprodutos' } },

  // SaaS
  { documentTypeId: 'doc_saas_painel_dashboard', label: 'Print do Painel / Dashboard da Plataforma', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'SaaS' } },
  { documentTypeId: 'doc_saas_termos_uso', label: 'Termos de Uso Publicados', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'SaaS' } },
  { documentTypeId: 'doc_saas_comprovante_entrega', label: 'Comprovante de Entrega e Gestão de Assinatura', required: true,
    conditionalLogic: { dependsOn: 'segmento_pj', operator: 'equals', value: 'SaaS' } },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = !!body.dryRun;

    const summary = { pf: {}, pj: {}, archived: [] };

    // ── 1. Arquiva templates antigos ──
    const oldModels = ['subseller_pf', 'subseller_v2', 'subseller'];
    for (const model of oldModels) {
      const existing = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ model });
      for (const t of existing) {
        if (t.isArchived && !t.isActive) continue;
        if (!dryRun) {
          await base44.asServiceRole.entities.QuestionnaireTemplate.update(t.id, {
            isActive: false,
            isArchived: true,
          });
        }
        summary.archived.push({ id: t.id, model: t.model, name: t.name });
      }
    }

    // ── 2. PF — upsert template + perguntas ──
    let pfTemplate = (await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ model: 'subseller_pf_lite_v4' }))[0];
    const pfData = {
      name: 'Subseller PF — V4 Simplificado',
      description: 'Versão enxuta do questionário de subseller PF V4 (~23 perguntas + 1 termo de aceite). Endereço via ViaCEP. Identidade via CAF FaceLiveness. Sem bloco de perfil profissional. Sem sazonalidade. BACEN-aderente.',
      merchantType: 'PF',
      category: 'COMPLIANCE',
      subCategory: 'GENERAL',
      model: 'subseller_pf_lite_v4',
      framework_version: 'v4.0',
      isActive: true,
      isArchived: false,
      version: 1,
      requiredDocuments: PF_REQUIRED_DOCUMENTS,
    };

    if (!dryRun) {
      if (pfTemplate) {
        await base44.asServiceRole.entities.QuestionnaireTemplate.update(pfTemplate.id, pfData);
      } else {
        pfTemplate = await base44.asServiceRole.entities.QuestionnaireTemplate.create(pfData);
      }

      // Limpa perguntas antigas deste template (idempotência)
      const oldPfQs = await base44.asServiceRole.entities.Question.filter({ questionnaireTemplateId: pfTemplate.id });
      for (const q of oldPfQs) {
        await base44.asServiceRole.entities.Question.delete(q.id);
      }

      // Cria perguntas
      const pfQs = buildPFQuestions(pfTemplate.id);
      for (const q of pfQs) {
        await base44.asServiceRole.entities.Question.create({
          questionnaireTemplateId: q.templateId,
          order: q.order,
          text: q.text,
          type: q.type,
          isRequired: !!q.isRequired,
          options: q.options || [],
          helpText: q.helpText || null,
          conditionalLogic: q.conditionalLogic || null,
        });
      }
      summary.pf = { templateId: pfTemplate.id, questions: pfQs.length, documents: PF_REQUIRED_DOCUMENTS.length };
    } else {
      summary.pf = { dryRun: true, questions: buildPFQuestions('preview').length, documents: PF_REQUIRED_DOCUMENTS.length };
    }

    // ── 3. PJ — upsert template + perguntas ──
    let pjTemplate = (await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ model: 'subseller_pj_lite_v4' }))[0];
    const pjData = {
      name: 'Subseller PJ — V4 Simplificado',
      description: 'Versão enxuta do questionário de subseller PJ V4 (~28 perguntas visíveis). CNPJ dispara BDC silenciosamente — razão social, capital social, QSA e endereço Receita ficam apenas no painel do analista. Endereço operacional via ViaCEP. Identidade do representante via CAF FaceLiveness. Sem nome fantasia, sem confirmação visual de dados Receita pelo cliente. 4 segmentos condicionais: E-commerce, Dropshipping, Infoprodutos, SaaS.',
      merchantType: 'PJ',
      category: 'COMPLIANCE',
      subCategory: 'GENERAL',
      model: 'subseller_pj_lite_v4',
      framework_version: 'v4.0',
      isActive: true,
      isArchived: false,
      version: 1,
      requiredDocuments: PJ_REQUIRED_DOCUMENTS,
    };

    if (!dryRun) {
      if (pjTemplate) {
        await base44.asServiceRole.entities.QuestionnaireTemplate.update(pjTemplate.id, pjData);
      } else {
        pjTemplate = await base44.asServiceRole.entities.QuestionnaireTemplate.create(pjData);
      }

      // Limpa perguntas antigas deste template
      const oldPjQs = await base44.asServiceRole.entities.Question.filter({ questionnaireTemplateId: pjTemplate.id });
      for (const q of oldPjQs) {
        await base44.asServiceRole.entities.Question.delete(q.id);
      }

      // Cria perguntas; precisamos resolver o `dependsOn=segmento_pj` para o id real da Q9
      const pjQs = buildPJQuestions(pjTemplate.id);
      const createdQs = {};
      // 1ª passada: cria perguntas SEM conditionalLogic (apenas as não-condicionais)
      for (const q of pjQs.filter(x => !x.conditionalLogic)) {
        const created = await base44.asServiceRole.entities.Question.create({
          questionnaireTemplateId: q.templateId,
          order: q.order,
          text: q.text,
          type: q.type,
          isRequired: !!q.isRequired,
          options: q.options || [],
          helpText: q.helpText || null,
        });
        // Guarda o id da pergunta de segmento (order=9 = "Como sua empresa vende?")
        if (q.order === 9) createdQs.segmento_pj = created.id;
      }
      // 2ª passada: cria perguntas condicionais, resolvendo o dependsOn
      for (const q of pjQs.filter(x => x.conditionalLogic)) {
        const resolved = {
          ...q.conditionalLogic,
          dependsOn: createdQs[q.conditionalLogic.dependsOn] || q.conditionalLogic.dependsOn,
        };
        await base44.asServiceRole.entities.Question.create({
          questionnaireTemplateId: q.templateId,
          order: q.order,
          text: q.text,
          type: q.type,
          isRequired: !!q.isRequired,
          options: q.options || [],
          helpText: q.helpText || null,
          conditionalLogic: resolved,
        });
      }

      // Atualiza requiredDocuments do template resolvendo dependsOn=segmento_pj
      const resolvedDocs = PJ_REQUIRED_DOCUMENTS.map(d => ({
        ...d,
        conditionalLogic: d.conditionalLogic
          ? { ...d.conditionalLogic, dependsOn: createdQs.segmento_pj || d.conditionalLogic.dependsOn }
          : null,
      }));
      await base44.asServiceRole.entities.QuestionnaireTemplate.update(pjTemplate.id, {
        requiredDocuments: resolvedDocs,
      });

      summary.pj = { templateId: pjTemplate.id, questions: pjQs.length, documents: PJ_REQUIRED_DOCUMENTS.length, segmentoQuestionId: createdQs.segmento_pj };
    } else {
      summary.pj = { dryRun: true, questions: buildPJQuestions('preview').length, documents: PJ_REQUIRED_DOCUMENTS.length };
    }

    // ── 4. AuditLog ──
    if (!dryRun) {
      await base44.asServiceRole.entities.AuditLog.create({
        entityName: 'QuestionnaireTemplate',
        entityId: pjTemplate?.id || pfTemplate?.id || 'multi',
        actionType: 'CREATE',
        actionDescription: `Seed Subseller Lite V4 executado por ${user.email} — PF: ${summary.pf.questions || 0} perguntas, PJ: ${summary.pj.questions || 0} perguntas`,
        changedBy: user.email,
        changeDate: new Date().toISOString(),
        details: summary,
      });
    }

    return Response.json({ success: true, dryRun, summary });
  } catch (error) {
    console.error('seedSubsellerLiteV4 error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});