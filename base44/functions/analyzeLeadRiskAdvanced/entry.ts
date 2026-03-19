import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * ANÁLISE DE RISCO AVANÇADA COM IA
 * 
 * Evolução do Lead Qualifier - faz análise profunda de risco comercial,
 * sugere prioridade de atendimento e ações específicas para o time de vendas.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    let leadId = payload.leadId;
    
    // Suporte a automação de entidade
    if (!leadId && payload.event?.entity_id) {
      leadId = payload.event.entity_id;
    }
    if (!leadId && payload.data?.id) {
      leadId = payload.data.id;
    }
    
    if (!leadId) {
      return Response.json({ error: "leadId não fornecido" }, { status: 400 });
    }
    
    console.log(`[IA RISK ADVANCED] Iniciando análise do lead: ${leadId}`);
    
    const [lead] = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    
    if (!lead) {
      return Response.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    
    // Se já tem análise recente (últimas 6h), pular
    if (lead.iaAnalysisDate) {
      const lastAnalysis = new Date(lead.iaAnalysisDate);
      const hoursSince = (Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 6) {
        console.log(`[IA RISK ADVANCED] Análise recente (${hoursSince.toFixed(1)}h). Pulando.`);
        return Response.json({ 
          success: true, 
          message: "Análise recente já existe",
          score: lead.iaRiskScore,
          decision: lead.iaDecision
        });
      }
    }
    
    // Buscar dados do Introducer se existir
    let introducerInfo = '';
    if (lead.introducerId) {
      const [introducer] = await base44.asServiceRole.entities.Introducer.filter({ id: lead.introducerId });
      if (introducer) {
        introducerInfo = `
**Canal de Origem - Introducer:**
- Nome do Parceiro: ${introducer.name}
- Código: ${introducer.referralCode}
- Status do Parceiro: ${introducer.status}`;
      }
    }
    
    // Buscar histórico de propostas deste lead
    let proposalInfo = '';
    const proposals = await base44.asServiceRole.entities.Proposal.filter({ leadId: leadId });
    if (proposals.length > 0) {
      proposalInfo = `
**Histórico de Propostas:**
${proposals.map(p => `- ${p.codigo || 'S/C'}: Status ${p.status}, Receita est. R$${p.estimatedRevenue || 0}`).join('\n')}`;
    }
    
    const prompt = `Você é o ANALISTA DE RISCO AVANÇADO da Pagsmile, uma processadora de pagamentos. Faça uma análise PROFUNDA de risco comercial deste lead.

═══════════════════════════════════════════════════════════
DADOS COMPLETOS DO LEAD
═══════════════════════════════════════════════════════════

**Identificação:**
- Nome/Razão Social: ${lead.fullName || 'NÃO INFORMADO'}
- Nome Fantasia: ${lead.companyName || 'NÃO INFORMADO'}
- CPF/CNPJ: ${lead.cpfCnpj || 'NÃO INFORMADO'}
- Email: ${lead.email || 'NÃO INFORMADO'}
- Telefone: ${lead.phone || 'NÃO INFORMADO'}
- Website: ${lead.website || 'NÃO INFORMADO'}
- MCC: ${lead.mcc || 'NÃO INFORMADO'}

**Dados de Negócio:**
- Tipo: ${lead.businessSubCategory || 'NÃO INFORMADO'}
- TPV Mensal: ${lead.tpvMensal ? 'R$ ' + Number(lead.tpvMensal).toLocaleString('pt-BR') : 'NÃO INFORMADO'}
- Ticket Médio: ${lead.ticketMedio ? 'R$ ' + Number(lead.ticketMedio).toLocaleString('pt-BR') : 'NÃO INFORMADO'}
- Transações/Mês: ${lead.transacoesMes || 'NÃO INFORMADO'}
- Expectativa Crescimento: ${lead.expectativaCrescimento || 'NÃO INFORMADO'}

**Score Lead Qualifier:** ${lead.leadQualifierScore || 'NÃO ANALISADO'} (${lead.leadQualifierLevel || 'PENDENTE'})
**Score PRISCILA:** ${lead.priscilaQualityScore || 'NÃO ANALISADO'} (Risco: ${lead.priscilaRiskLevel || 'N/A'})
${introducerInfo}
${proposalInfo}

**Respostas do Questionário:**
${lead.questionnaireData ? JSON.stringify(lead.questionnaireData, null, 2) : 'SEM DADOS'}

**Taxas Esperadas pelo Lead:**
${lead.expectedRates ? JSON.stringify(lead.expectedRates, null, 2) : 'NÃO INFORMADO'}

═══════════════════════════════════════════════════════════
INSTRUÇÕES DE ANÁLISE
═══════════════════════════════════════════════════════════

Analise em 4 eixos:

1. **RISCO OPERACIONAL** (0-25): Fraude, PLD/FT, compliance, tipo de negócio
2. **POTENCIAL DE RECEITA** (0-25): TPV, ticket, margens, crescimento
3. **VIABILIDADE COMERCIAL** (0-25): Taxas esperadas vs praticáveis, competitividade
4. **MATURIDADE DO LEAD** (0-25): Completude, coerência, prontidão

Score total: 0-100 (maior = melhor / menor risco)

Decisão:
- Score >= 75: AUTO_APROVAR (lead excelente, priorizar)
- Score 50-74: REVISAO_MANUAL (bom potencial, necessita validação)
- Score < 50: REJEITAR (alto risco ou baixo potencial)

Prioridade de atendimento:
- URGENTE: Lead com alto TPV e baixo risco, pronto para fechar
- ALTA: Bom potencial, precisa de atenção rápida
- MEDIA: Potencial moderado, follow-up normal
- BAIXA: Baixo potencial ou muitas pendências

IMPORTANTE: Forneça sugestões ESPECÍFICAS e ACIONÁVEIS para o vendedor. Não seja genérico.`;

    const responseSchema = {
      type: "object",
      properties: {
        iaRiskScore: { type: "number", description: "Score final 0-100" },
        iaDecision: { type: "string", enum: ["AUTO_APROVAR", "REVISAO_MANUAL", "REJEITAR"] },
        iaPriority: { type: "string", enum: ["URGENTE", "ALTA", "MEDIA", "BAIXA"] },
        resumoExecutivo: { type: "string", description: "Resumo de 2-3 frases sobre o lead" },
        eixos: {
          type: "object",
          properties: {
            riscoOperacional: { type: "object", properties: { score: { type: "number" }, analise: { type: "string" } } },
            potencialReceita: { type: "object", properties: { score: { type: "number" }, analise: { type: "string" } } },
            viabilidadeComercial: { type: "object", properties: { score: { type: "number" }, analise: { type: "string" } } },
            maturidadeLead: { type: "object", properties: { score: { type: "number" }, analise: { type: "string" } } }
          }
        },
        sugestoesVendedor: {
          type: "array",
          items: { type: "string" },
          description: "3-5 sugestões específicas e acionáveis para o vendedor"
        },
        pontosDeAtencao: {
          type: "array",
          items: { type: "string" },
          description: "Red flags ou pontos que precisam de atenção"
        },
        proximosPassos: {
          type: "string",
          description: "Recomendação clara do próximo passo a ser feito"
        },
        relatorioCompleto: {
          type: "string",
          description: "Relatório narrativo detalhado da análise"
        }
      },
      required: ["iaRiskScore", "iaDecision", "iaPriority", "resumoExecutivo", "sugestoesVendedor", "pontosDeAtencao", "proximosPassos"]
    };
    
    console.log(`[IA RISK ADVANCED] Invocando LLM com modelo avançado...`);
    
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseSchema,
      model: "gemini_3_pro"
    });
    
    console.log(`[IA RISK ADVANCED] Score: ${llmResponse.iaRiskScore}, Decisão: ${llmResponse.iaDecision}, Prioridade: ${llmResponse.iaPriority}`);
    
    const now = new Date().toISOString();
    
    await base44.asServiceRole.entities.Lead.update(leadId, {
      iaRiskScore: llmResponse.iaRiskScore,
      iaDecision: llmResponse.iaDecision,
      iaPriority: llmResponse.iaPriority,
      iaSuggestions: llmResponse.sugestoesVendedor,
      iaAnalysisReport: llmResponse.relatorioCompleto || llmResponse.resumoExecutivo,
      iaAnalysisDate: now
    });
    
    // Registrar atividade
    await base44.asServiceRole.entities.LeadActivity.create({
      leadId,
      activityType: 'analisado_priscila',
      description: `IA Risk Advanced: Score ${llmResponse.iaRiskScore}/100 (${llmResponse.iaDecision}) | Prioridade: ${llmResponse.iaPriority}. ${llmResponse.resumoExecutivo}`,
      performedBy: 'IA Risk Advanced',
      activityDate: now
    });
    
    const duration = Date.now() - startTime;
    console.log(`[IA RISK ADVANCED] Concluído em ${duration}ms`);
    
    return Response.json({
      success: true,
      leadId,
      score: llmResponse.iaRiskScore,
      decision: llmResponse.iaDecision,
      priority: llmResponse.iaPriority,
      resumo: llmResponse.resumoExecutivo,
      suggestions: llmResponse.sugestoesVendedor,
      duration_ms: duration
    });
    
  } catch (error) {
    console.error(`[IA RISK ADVANCED] Erro:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});