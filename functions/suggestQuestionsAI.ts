import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, merchantType, model, existingQuestions } = await req.json();

    const existingList = (existingQuestions || [])
      .map((q, i) => `${i + 1}. ${q.text} (tipo: ${q.type})`)
      .join('\n');

    const prompt = `Você é um especialista em compliance financeiro e onboarding de merchants para processadoras de pagamento no Brasil.

Contexto:
- Categoria do questionário: ${category || 'COMPLIANCE'}
- Tipo de merchant: ${merchantType || 'PJ'}
- Modelo: ${model || 'geral'}

Perguntas já existentes no questionário:
${existingList || 'Nenhuma pergunta ainda.'}

Sugira 5 perguntas adicionais relevantes que NÃO estejam já no questionário. Considere:
- Requisitos regulatórios do Banco Central do Brasil
- Prevenção à lavagem de dinheiro (PLD/FT)
- Conhecimento do cliente (KYC/KYB)
- Perfil transacional e operacional
- Riscos específicos do modelo de negócio

Para cada pergunta, defina:
- text: o texto da pergunta em português
- type: o tipo de campo (TEXT, NUMBER, SELECT, MULTI_SELECT, BOOLEAN, DATE, EMAIL, PHONE, CPF_CNPJ)
- options: array de opções (somente para SELECT e MULTI_SELECT)
- isRequired: se é obrigatória (boolean)
- helpText: texto de ajuda curto
- riskWeight: peso no cálculo de risco (0-100)`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                type: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                isRequired: { type: 'boolean' },
                helpText: { type: 'string' },
                riskWeight: { type: 'number' }
              }
            }
          }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});