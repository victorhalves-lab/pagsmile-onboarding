import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || text.trim().length < 20) {
      return Response.json({ error: 'Texto muito curto. Forneça anotações ou transcrição mais detalhada.' }, { status: 400 });
    }

    // Use InvokeLLM to extract structured data from meeting notes
    const extractedData = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um assistente especializado em análise de reuniões comerciais de pagamentos (adquirência, gateway, meios de pagamento).

Analise o seguinte texto de anotações/transcrição de reunião e extraia TODAS as informações relevantes para preencher um questionário comercial.

TEXTO DA REUNIÃO:
---
${text}
---

Extraia as seguintes informações do texto. Se uma informação não estiver presente, retorne null para esse campo.
Para campos numéricos, extraia apenas o número (sem R$, %, etc.).
Para businessType, classifique como: "MERCHAN" (loja/e-commerce), "GATEWAY" (processador de pagamentos), ou "MARKETPLACE" (plataforma multi-vendedor).
Para preferredPaymentMethods, use array com opções como: "credit_card", "debit_card", "pix", "boleto".

Seja preciso e extraia apenas o que está explicitamente mencionado no texto.`,
      response_json_schema: {
        type: "object",
        properties: {
          clientFullName: { type: ["string", "null"], description: "Nome da empresa ou razão social" },
          clientCpfCnpj: { type: ["string", "null"], description: "CPF ou CNPJ mencionado" },
          clientEmail: { type: ["string", "null"], description: "Email de contato" },
          clientPhone: { type: ["string", "null"], description: "Telefone de contato" },
          clientWebsite: { type: ["string", "null"], description: "Site da empresa" },
          contactName: { type: ["string", "null"], description: "Nome da pessoa de contato na reunião" },
          contactRole: { type: ["string", "null"], description: "Cargo do contato" },
          businessType: { type: ["string", "null"], enum: ["MERCHAN", "GATEWAY", "MARKETPLACE", null] },
          businessDescription: { type: ["string", "null"], description: "Descrição do negócio" },
          salesChannels: { type: ["string", "null"], description: "Canais de venda" },
          revenueBreakdown: {
            type: ["array", "null"],
            items: { type: "object", properties: { product: { type: "string" }, percentage: { type: "number" } } }
          },
          monthlyTpv: { type: ["number", "null"], description: "TPV mensal em reais" },
          averageTicket: { type: ["number", "null"], description: "Ticket médio em reais" },
          monthlyTransactions: { type: ["number", "null"], description: "Transações por mês" },
          growthExpectation: { type: ["string", "null"] },
          preferredPaymentMethods: { type: ["array", "null"], items: { type: "string" } },
          currentMdr1x: { type: ["number", "null"], description: "MDR crédito 1x em %" },
          currentMdr2to6x: { type: ["number", "null"], description: "MDR crédito 2-6x em %" },
          currentMdr7to12x: { type: ["number", "null"], description: "MDR crédito 7-12x em %" },
          currentPixRate: { type: ["number", "null"], description: "Taxa PIX" },
          currentBoletoRate: { type: ["number", "null"], description: "Taxa boleto" },
          anticipationType: { type: ["string", "null"] },
          anticipationRate: { type: ["number", "null"] },
          transactionFee: { type: ["number", "null"] },
          antiFraudProvider: { type: ["string", "null"] },
          antiFraudCost: { type: ["number", "null"] },
          currentChallenges: { type: ["string", "null"] },
          criticalFeatures: { type: ["string", "null"] },
          implementationTimeline: { type: ["string", "null"] },
          notes: { type: ["string", "null"], description: "Outras observações relevantes extraídas" }
        }
      }
    });

    // Clean null values
    const cleanData = {};
    for (const [key, value] of Object.entries(extractedData)) {
      if (value !== null && value !== undefined && value !== '') {
        cleanData[key] = value;
      }
    }

    // Generate protocol
    const protocolo = `AI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    // Create InternalCommercialQuestionnaire with AI status
    const questionnaireData = {
      ...cleanData,
      protocolo,
      commercialAgentName: user.full_name || 'IA',
      status: 'ai_preenchido',
      origemIA: true,
      textoOriginalIA: text.substring(0, 5000), // limit stored text
    };

    // Ensure required fields have fallbacks
    if (!questionnaireData.clientFullName) questionnaireData.clientFullName = 'A definir (IA)';
    if (!questionnaireData.clientEmail) questionnaireData.clientEmail = 'pendente@revisar.com';
    if (!questionnaireData.businessType) questionnaireData.businessType = 'MERCHAN';

    const questionnaire = await base44.entities.InternalCommercialQuestionnaire.create(questionnaireData);

    return Response.json({
      success: true,
      questionnaireId: questionnaire.id,
      protocolo,
      extractedFields: Object.keys(cleanData).length,
      totalFields: Object.keys(extractedData).length,
    });
  } catch (error) {
    console.error('Error processing meeting notes:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});