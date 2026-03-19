import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * LEAD QUALIFIER - Análise automática de qualidade de leads
 * 
 * Recebe um leadId e executa análise completa via LLM,
 * salvando score e relatório diretamente no Lead.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    let leadId = payload.leadId;
    
    // Se é evento de automação de entidade
    if (!leadId && payload.event?.entity_id) {
      leadId = payload.event.entity_id;
    }
    if (!leadId && payload.data?.id) {
      leadId = payload.data.id;
    }
    
    if (!leadId) {
      return Response.json({ error: "leadId não fornecido" }, { status: 400 });
    }
    
    console.log(`[LEAD QUALIFIER] Iniciando análise do lead: ${leadId}`);
    
    // Carregar lead
    const [lead] = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    
    if (!lead) {
      return Response.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    
    // Se já tem análise recente (últimas 12h), pular
    if (lead.leadQualifierDate) {
      const lastAnalysis = new Date(lead.leadQualifierDate);
      const hoursSince = (Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 12) {
        console.log(`[LEAD QUALIFIER] Análise recente encontrada (${hoursSince.toFixed(1)}h). Pulando.`);
        return Response.json({ 
          success: true, 
          message: "Análise recente já existe",
          score: lead.leadQualifierScore,
          level: lead.leadQualifierLevel
        });
      }
    }
    
    // Construir prompt com todos os dados do lead
    const prompt = `Você é o LEAD QUALIFIER da Pagsmile. Analise este lead comercial com rigor e produza um relatório completo.

═══════════════════════════════════════════════════════════
DADOS DO LEAD
═══════════════════════════════════════════════════════════

**Identificação:**
- Nome/Razão Social: ${lead.fullName || 'NÃO INFORMADO'}
- Nome Fantasia: ${lead.companyName || 'NÃO INFORMADO'}
- CPF/CNPJ: ${lead.cpfCnpj || 'NÃO INFORMADO'}
- Email: ${lead.email || 'NÃO INFORMADO'}
- Telefone: ${lead.phone || 'NÃO INFORMADO'}
- Website: ${lead.website || 'NÃO INFORMADO'}
- MCC: ${lead.mcc || 'NÃO INFORMADO'}
- Protocolo: ${lead.protocolo || 'N/A'}
- Origem: ${lead.origemLead || 'N/A'}

**Contato:**
- Nome do Contato: ${lead.contactName || 'NÃO INFORMADO'}
- Cargo do Contato: ${lead.contactRole || 'NÃO INFORMADO'}

**Negócio:**
- Tipo: ${lead.businessSubCategory || 'NÃO INFORMADO'} (MERCHAN = venda direta, GATEWAY = integrador, MARKETPLACE = intermediário multi-sellers)

**Dados Financeiros Declarados:**
- TPV Mensal: ${lead.tpvMensal ? 'R$ ' + lead.tpvMensal.toLocaleString('pt-BR') : 'NÃO INFORMADO'}
- Ticket Médio: ${lead.ticketMedio ? 'R$ ' + lead.ticketMedio.toLocaleString('pt-BR') : 'NÃO INFORMADO'}
- Transações/Mês: ${lead.transacoesMes || 'NÃO INFORMADO'}
- Expectativa Crescimento: ${lead.expectativaCrescimento || 'NÃO INFORMADO'}

**Respostas Completas do Questionário:**
${lead.questionnaireData ? JSON.stringify(lead.questionnaireData, null, 2) : 'NENHUM DADO DE QUESTIONÁRIO DISPONÍVEL'}

═══════════════════════════════════════════════════════════
INSTRUÇÕES
═══════════════════════════════════════════════════════════

Analise este lead em 5 dimensões:

1. COMPLETUDE (20 pontos): Quão completo foi o preenchimento
2. QUALIDADE DAS RESPOSTAS (20 pontos): Profundidade e especificidade das respostas
3. POTENCIAL COMERCIAL (25 pontos): TPV, ticket, segmento, tipo de negócio
4. COERÊNCIA (20 pontos): Os dados fazem sentido cruzados entre si
5. PRONTIDÃO (15 pontos): O lead parece pronto para avançar

Score total: 0-100
Classificação:
- 85-100: EXCELENTE
- 70-84: BOM
- 55-69: REGULAR
- 40-54: FRACO
- 0-39: INSUFICIENTE

IMPORTANTE: Seja específico nas recomendações comerciais. Não genérico.
IMPORTANTE: As perguntas sugeridas devem ser específicas para ESTE lead.
IMPORTANTE: O resumo executivo deve ter no máximo 3 frases, direto e acionável.`;

    const responseSchema = {
      type: "object",
      properties: {
        score: { type: "number", description: "Score final 0-100" },
        level: { type: "string", enum: ["EXCELENTE", "BOM", "REGULAR", "FRACO", "INSUFICIENTE"] },
        resumoExecutivo: { type: "string", description: "2-3 frases diretas" },
        dimensoes: {
          type: "object",
          properties: {
            completude: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                camposFaltantes: { type: "array", items: { type: "string" } }
              }
            },
            qualidade: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                destaquesPositivos: { type: "array", items: { type: "string" } },
                destaquesNegativos: { type: "array", items: { type: "string" } }
              }
            },
            potencialComercial: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                tpvAvaliacao: { type: "string" },
                segmentoAvaliacao: { type: "string" }
              }
            },
            coerencia: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                inconsistencias: { type: "array", items: { type: "string" } }
              }
            },
            prontidao: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                sinaisPositivos: { type: "array", items: { type: "string" } },
                sinaisNegativos: { type: "array", items: { type: "string" } }
              }
            }
          }
        },
        pontosFortes: { type: "array", items: { type: "string" } },
        pontosDeAtencao: { type: "array", items: { type: "string" } },
        recomendacaoComercial: { type: "string" },
        perguntasSugeridas: { type: "array", items: { type: "string" } }
      },
      required: ["score", "level", "resumoExecutivo", "dimensoes", "pontosFortes", "pontosDeAtencao", "recomendacaoComercial", "perguntasSugeridas"]
    };
    
    console.log(`[LEAD QUALIFIER] Invocando LLM...`);
    
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseSchema
    });
    
    console.log(`[LEAD QUALIFIER] Resposta recebida. Score: ${llmResponse.score}, Level: ${llmResponse.level}`);
    
    // Salvar resultados no Lead
    const now = new Date().toISOString();
    
    await base44.asServiceRole.entities.Lead.update(leadId, {
      leadQualifierScore: llmResponse.score,
      leadQualifierLevel: llmResponse.level,
      leadQualifierReport: llmResponse,
      leadQualifierDate: now
    });
    
    // Registrar atividade
    await base44.asServiceRole.entities.LeadActivity.create({
      leadId,
      activityType: 'analisado_priscila',
      description: `Lead Qualifier IA: Score ${llmResponse.score}/100 (${llmResponse.level}). ${llmResponse.resumoExecutivo}`,
      performedBy: 'Lead Qualifier IA',
      activityDate: now
    });
    
    const duration = Date.now() - startTime;
    console.log(`[LEAD QUALIFIER] Concluído em ${duration}ms`);
    
    return Response.json({
      success: true,
      leadId,
      score: llmResponse.score,
      level: llmResponse.level,
      resumo: llmResponse.resumoExecutivo,
      duration_ms: duration
    });
    
  } catch (error) {
    console.error(`[LEAD QUALIFIER] Erro:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});