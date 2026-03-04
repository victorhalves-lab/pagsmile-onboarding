import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * PRISCILA - Análise de Risco Pré-Compliance para Leads
 * 
 * Avalia o lead sob a ótica de risco e compliance ANTES do KYC formal.
 * Diferente do Lead Qualifier (comercial), a PRISCILA foca em:
 * - Sinais de risco nos dados declarados
 * - Coerência PLD/AML
 * - Viabilidade regulatória
 * - Decisão de caminho (auto-aprovar, flag, revisão manual, rejeitar)
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
    
    console.log(`[PRISCILA] Iniciando análise do lead: ${leadId}`);
    
    // Carregar lead
    const [lead] = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    
    if (!lead) {
      return Response.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    
    // Construir prompt com todos os dados do lead
    const prompt = `Você é a PRISCILA (Plataforma de Risco Inteligente e Score Consolidado para Leads e Aprovações), a analista de risco pré-compliance mais experiente da Pagsmile.

Sua missão: avaliar leads ANTES do processo formal de KYC/compliance, identificando sinais de risco, inconsistências e bandeiras vermelhas nos dados declarados pelo lead no questionário comercial.

Você NÃO é a analista comercial (esse é o Lead Qualifier). Você é a analista de RISCO que determina se o lead é seguro para avançar no funil comercial.

═══════════════════════════════════════════════════════════
DADOS DO LEAD PARA ANÁLISE
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
- Tipo: ${lead.businessSubCategory || 'NÃO INFORMADO'} (MERCHAN = venda direta, GATEWAY = integrador, MARKETPLACE = intermediário)

**Dados Financeiros Declarados:**
- TPV Mensal: ${lead.tpvMensal ? 'R$ ' + Number(lead.tpvMensal).toLocaleString('pt-BR') : 'NÃO INFORMADO'}
- Ticket Médio: ${lead.ticketMedio ? 'R$ ' + Number(lead.ticketMedio).toLocaleString('pt-BR') : 'NÃO INFORMADO'}
- Transações/Mês: ${lead.transacoesMes || 'NÃO INFORMADO'}
- Expectativa Crescimento: ${lead.expectativaCrescimento || 'NÃO INFORMADO'}

**Respostas Completas do Questionário:**
${lead.questionnaireData ? JSON.stringify(lead.questionnaireData, null, 2) : 'NENHUM DADO DE QUESTIONÁRIO DISPONÍVEL'}

═══════════════════════════════════════════════════════════
DIMENSÕES DE ANÁLISE DE RISCO
═══════════════════════════════════════════════════════════

Avalie as seguintes dimensões (score de 0 a 100, onde 100 = risco mínimo):

1. **RISCO CADASTRAL (25%)**: CPF/CNPJ presente e válido, email corporativo vs genérico, website compatível com porte, dados do responsável completos.

2. **RISCO FINANCEIRO (25%)**: TPV coerente com porte, ticket médio razoável para o segmento, volumes declarados fazem sentido, expectativa de crescimento realista.

3. **RISCO OPERACIONAL (20%)**: Tipo de negócio vs descrição, canais de venda declarados, modelo de entrega, estrutura de chargeback/cancelamento mencionada.

4. **RISCO PLD/AML (20%)**: Segmentos de alto risco (jogos, cripto, adult, farmacêutico), presença de sinais de lavagem (volumes incompatíveis, estruturas complexas sem justificativa), uso de intermediários sem necessidade clara.

5. **RISCO REPUTACIONAL (10%)**: Website com conteúdo duvidoso, email de domínio gratuito para empresa de grande porte, inconsistências entre nome fantasia e atividade.

CLASSIFICAÇÃO FINAL:
- 80-100: BAIXO risco → AUTO_APROVAR (pode seguir no funil sem restrições)
- 60-79: MEDIO risco → AUTO_COM_FLAG (pode seguir mas com alertas para o comercial)
- 40-59: ALTO risco → REVISAO_MANUAL (precisa de análise humana antes de avançar)
- 0-39: CRITICO risco → REJEITAR (não deve avançar no funil)

═══════════════════════════════════════════════════════════
SUGESTÃO DE PRECIFICAÇÃO COMERCIAL
═══════════════════════════════════════════════════════════

Com base no perfil de risco, TPV, MCC, tipo de negócio e dados declarados, sugira taxas comerciais competitivas que equilibrem margem e atratividade. 

Considere:
- Segmentos de maior risco = taxas maiores
- TPV alto = possibilidade de taxas menores (volume justifica)
- Gateway vs Merchan vs Marketplace (gateways geralmente têm taxas menores por volume)
- MCC de alto risco (jogos, cripto, adult) = taxas premium

Sugira TODAS as taxas abaixo:

**Cartão de Crédito (MDR % por bandeira e faixa):**
- Visa, Mastercard, Elo, Amex, Outras
- Para cada bandeira: à vista (1x), 2x a 6x, 7x a 12x, 13x a 21x

**Débito (% por bandeira):**
- Visa, Mastercard, Elo, Outras

**Pix:**
- Tipo: percentual ou fixo
- Valor sugerido

**Boleto:** valor fixo por boleto (R$)
**Antifraude:** valor por transação (R$)
**Fee por Transação:** valor por transação (R$)
**Alerta Pré-Chargeback:** valor por alerta (R$)
**Antecipação:** percentual ao mês (%)
**RAV (prazo de recebimento):** D+1, D+2, D+15, D+30
**Mínimo Garantido:** valor mensal sugerido para os 3 primeiros meses (R$)

As taxas sugeridas devem ser REALISTAS para o mercado brasileiro de pagamentos.
Referências típicas do mercado:
- Crédito à vista: 1.8% a 4.5%
- Crédito 2-6x: 2.5% a 6%
- Crédito 7-12x: 3% a 8%
- Crédito 13-21x: 4% a 10%
- Débito: 1% a 2.5%
- Pix: 0.5% a 1.5% ou R$ 0.50 a R$ 2.00 fixo
- Boleto: R$ 2.00 a R$ 5.00
- Antifraude: R$ 0.05 a R$ 0.50
- Fee transação: R$ 0.10 a R$ 0.50
- Antecipação: 1% a 3% a.m.
- Mínimo garantido: R$ 500 a R$ 10.000/mês

IMPORTANTE:
- Seja objetivo e baseado em dados concretos.
- Não invente informações. Se um dado não foi fornecido, registre como lacuna e penalize proporcionalmente.
- Para cada ponto de risco, cite a evidência específica dos dados do lead.
- O resumo executivo deve ter no máximo 3 frases.
- As taxas sugeridas devem ser justificadas pelo perfil de risco e dados do lead.`;

    const responseSchema = {
      type: "object",
      properties: {
        score: { type: "number", description: "Score de qualidade 0-100 (100 = risco mínimo)" },
        riskLevel: { type: "string", enum: ["BAIXO", "MEDIO", "ALTO", "CRITICO"] },
        decisionPath: { type: "string", enum: ["AUTO_APROVAR", "AUTO_COM_FLAG", "REVISAO_MANUAL", "REJEITAR"] },
        resumoExecutivo: { type: "string", description: "2-3 frases diretas sobre o risco" },
        dimensoes: {
          type: "object",
          properties: {
            riscoCadastral: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                flags: { type: "array", items: { type: "string" } }
              }
            },
            riscoFinanceiro: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                flags: { type: "array", items: { type: "string" } }
              }
            },
            riscoOperacional: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                flags: { type: "array", items: { type: "string" } }
              }
            },
            riscoPLD: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                flags: { type: "array", items: { type: "string" } }
              }
            },
            riscoReputacional: {
              type: "object",
              properties: {
                score: { type: "number" },
                detalhes: { type: "string" },
                flags: { type: "array", items: { type: "string" } }
              }
            }
          }
        },
        pontosFortes: { 
          type: "array", 
          items: { 
            type: "object",
            properties: {
              descricao: { type: "string" }
            }
          }
        },
        pontosDeAtencao: { 
          type: "array", 
          items: { 
            type: "object",
            properties: {
              descricao: { type: "string" }
            }
          }
        },
        pontosDeRisco: { 
          type: "array", 
          items: { 
            type: "object",
            properties: {
              descricao: { type: "string" },
              severidade: { type: "string", enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"] }
            }
          }
        },
        recomendacao: { type: "string", description: "Recomendação para o time sobre como proceder" },
        taxasSugeridas: {
          type: "object",
          description: "Taxas comerciais sugeridas pela PRISCILA",
          properties: {
            justificativa: { type: "string", description: "Justificativa geral para as taxas sugeridas" },
            cartao: {
              type: "object",
              properties: {
                visa: { type: "object", properties: { avista: { type: "number" }, de2a6x: { type: "number" }, de7a12x: { type: "number" }, de13a21x: { type: "number" } } },
                mastercard: { type: "object", properties: { avista: { type: "number" }, de2a6x: { type: "number" }, de7a12x: { type: "number" }, de13a21x: { type: "number" } } },
                elo: { type: "object", properties: { avista: { type: "number" }, de2a6x: { type: "number" }, de7a12x: { type: "number" }, de13a21x: { type: "number" } } },
                amex: { type: "object", properties: { avista: { type: "number" }, de2a6x: { type: "number" }, de7a12x: { type: "number" }, de13a21x: { type: "number" } } },
                outras: { type: "object", properties: { avista: { type: "number" }, de2a6x: { type: "number" }, de7a12x: { type: "number" }, de13a21x: { type: "number" } } }
              }
            },
            debito: {
              type: "object",
              properties: {
                visa: { type: "number" },
                mastercard: { type: "number" },
                elo: { type: "number" },
                outras: { type: "number" }
              }
            },
            pix: { type: "object", properties: { tipo: { type: "string", enum: ["percentual", "fixo"] }, valor: { type: "number" } } },
            boleto: { type: "number", description: "Valor fixo por boleto (R$)" },
            antifraude: { type: "number", description: "Valor por transação (R$)" },
            feeTransacao: { type: "number", description: "Fee por transação (R$)" },
            alertaPreChargeback: { type: "number", description: "Valor por alerta (R$)" },
            percentualAntecipacao: { type: "number", description: "% ao mês" },
            rav: { type: "object", properties: { taxa: { type: "number" }, prazo: { type: "string" } } },
            minimoGarantido: { type: "object", properties: { mes1: { type: "number" }, mes2: { type: "number" }, mes3: { type: "number" } } }
          }
        }
      },
      required: ["score", "riskLevel", "decisionPath", "resumoExecutivo", "dimensoes", "pontosFortes", "pontosDeAtencao", "pontosDeRisco", "recomendacao", "taxasSugeridas"]
    };
    
    console.log(`[PRISCILA] Invocando LLM...`);
    
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseSchema
    });
    
    console.log(`[PRISCILA] Resposta recebida. Score: ${llmResponse.score}, Risk: ${llmResponse.riskLevel}, Decision: ${llmResponse.decisionPath}`);
    
    // Salvar resultados no Lead
    const now = new Date().toISOString();
    
    await base44.asServiceRole.entities.Lead.update(leadId, {
      priscilaQualityScore: llmResponse.score,
      priscilaRiskLevel: llmResponse.riskLevel,
      priscilaDecisionPath: llmResponse.decisionPath,
      priscilaAnalysisReport: llmResponse
    });
    
    // Registrar atividade
    await base44.asServiceRole.entities.LeadActivity.create({
      leadId,
      activityType: 'analisado_priscila',
      description: `PRISCILA: Score ${llmResponse.score}/100 | Risco ${llmResponse.riskLevel} | ${llmResponse.decisionPath}. ${llmResponse.resumoExecutivo}`,
      performedBy: 'PRISCILA IA',
      activityDate: now
    });
    
    // Se não está mais como "EM_ANALISE", atualizar status do lead se ainda estiver em questionario_preenchido
    const [freshLead] = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (freshLead && freshLead.status === 'questionario_preenchido') {
      await base44.asServiceRole.entities.Lead.update(leadId, {
        status: 'analisado_priscila'
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[PRISCILA] Concluído em ${duration}ms`);
    
    return Response.json({
      success: true,
      leadId,
      score: llmResponse.score,
      riskLevel: llmResponse.riskLevel,
      decisionPath: llmResponse.decisionPath,
      resumo: llmResponse.resumoExecutivo,
      duration_ms: duration
    });
    
  } catch (error) {
    console.error(`[PRISCILA] Erro:`, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});