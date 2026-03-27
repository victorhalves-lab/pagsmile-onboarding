import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    // ═══════════════════════════════════════════════════════
    // CARREGAR PARCEIROS ATIVOS COM CUSTOS
    // ═══════════════════════════════════════════════════════
    const partners = await base44.asServiceRole.entities.Partner.filter({ isActive: true });
    console.log(`[PRISCILA] ${partners.length} parceiros ativos carregados`);

    const FAIXA_MAP = { avista: 'avista', de2a6x: 'de2a6x', de7a12x: 'de7a12x', de13a21x: 'de13a24x' };
    const BANDEIRAS = ['mastercard', 'visa', 'elo', 'amex', 'outras'];
    const FAIXAS = ['avista', 'de2a6x', 'de7a12x', 'de13a21x'];

    // Para cada parceiro, encontrar o bloco MCC relevante e calcular custo + 30%
    const clientMcc = lead.mcc || '';
    
    const partnerCostSummaries = partners.map(partner => {
      const mccBlock = partner.mdrByMcc?.find(m => m.mccCode === clientMcc)
        || partner.mdrByMcc?.find(m => ['Demais', 'demais', 'DEMAIS', 'default'].includes(m.mccCode))
        || partner.mdrByMcc?.[0];

      if (!mccBlock) return null;

      // Extrair taxas por bandeira e faixa
      const taxas = {};
      BANDEIRAS.forEach(bandeira => {
        taxas[bandeira] = {};
        FAIXAS.forEach(faixa => {
          const faixaParceiro = FAIXA_MAP[faixa] || faixa;
          // Tenta bandeira específica, depois "todas"
          let rateDecimal = mccBlock.rates?.[bandeira]?.[faixaParceiro];
          if (rateDecimal === undefined || rateDecimal === null) {
            rateDecimal = mccBlock.rates?.['todas']?.[faixaParceiro];
          }
          const custoPct = (rateDecimal || 0) * 100;
          const sugeridoPct = Math.round(custoPct * 1.30 * 100) / 100; // +30%
          taxas[bandeira][faixa] = { custo: custoPct, sugerido: sugeridoPct };
        });
      });

      return {
        nome: partner.name,
        mccUsado: `${mccBlock.mccCode} (${mccBlock.mccDescription || ''})`,
        transactionFee: partner.transactionFee || 0,
        antifraudCost: partner.antifraudCost || 0,
        threeDSCost: partner.threeDSCost || 0,
        percentualAntecipacao: partner.percentualAntecipacao || 0,
        taxas,
      };
    }).filter(Boolean);

    // Montar texto resumo de custos dos parceiros para o prompt
    let partnerCostText = '';
    if (partnerCostSummaries.length > 0) {
      partnerCostText = partnerCostSummaries.map(p => {
        let lines = `\n── PARCEIRO: ${p.nome} (MCC base: ${p.mccUsado}) ──`;
        lines += `\n  Fees fixas: Transação R$${p.transactionFee.toFixed(2)} | Antifraude R$${p.antifraudCost.toFixed(2)} | 3DS R$${p.threeDSCost.toFixed(2)}`;
        lines += `\n  Antecipação: ${p.percentualAntecipacao}% a.m.`;
        lines += `\n  MDR (custo → sugerido = custo+30%):`;
        BANDEIRAS.forEach(b => {
          const faixaStr = FAIXAS.map(f => {
            const d = p.taxas[b]?.[f];
            return d ? `${f}: ${d.custo.toFixed(2)}%→${d.sugerido.toFixed(2)}%` : '';
          }).filter(Boolean).join(' | ');
          if (faixaStr) lines += `\n    ${b}: ${faixaStr}`;
        });
        return lines;
      }).join('\n');
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
CUSTOS DOS PARCEIROS (ADQUIRENTES/SUBADQUIRENTES)
═══════════════════════════════════════════════════════════

A Pagsmile trabalha com os seguintes parceiros. Os custos abaixo são o que a Pagsmile PAGA ao parceiro.
As taxas que você sugerir para o CLIENTE devem OBRIGATORIAMENTE ser MAIORES que os custos do parceiro.

REGRA DE OURO: Taxa sugerida = Custo do parceiro + 30% (mínimo). Pode ser mais se o risco justificar.

${partnerCostText || 'NENHUM PARCEIRO ATIVO ENCONTRADO - use referências de mercado.'}

═══════════════════════════════════════════════════════════
SUGESTÃO DE PRECIFICAÇÃO COMERCIAL
═══════════════════════════════════════════════════════════

Com base no perfil de risco, TPV, MCC, tipo de negócio, dados declarados, E NOS CUSTOS REAIS DOS PARCEIROS ACIMA, sugira taxas comerciais que garantam margem para a Pagsmile.

REGRAS OBRIGATÓRIAS DE PRECIFICAÇÃO:
1. PARA CADA TAXA MDR: A taxa sugerida DEVE ser >= custo do parceiro mais barato para aquela bandeira/faixa + 30%.
2. PARA FEES FIXAS: Antifraude, Fee Transação e 3DS devem ser >= custo do parceiro + margem razoável.
3. ANTECIPAÇÃO: A taxa sugerida deve ser >= taxa do parceiro + spread.
4. Segmentos de maior risco = taxas AINDA maiores que o mínimo de custo+30%.
5. TPV alto = possibilidade de taxas mais próximas do custo+30% (volume justifica margem menor em %).
6. Gateway vs Merchan vs Marketplace: gateways podem ter taxas mais próximas do custo (maior volume).
7. MCC de alto risco (jogos, cripto, adult) = taxas de custo+50% ou mais.

Sugira TODAS as taxas abaixo:

**Cartão de Crédito (MDR % por bandeira e faixa):**
- Visa, Mastercard, Elo, Amex, Outras
- Para cada bandeira: à vista (1x), 2x a 6x, 7x a 12x, 13x a 21x

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

IMPORTANTE:
- NUNCA sugira uma taxa ABAIXO do custo de qualquer parceiro. A Pagsmile teria prejuízo.
- Justifique as taxas explicando qual parceiro seria o mais adequado e a margem resultante.
- Seja objetivo e baseado em dados concretos.
- Não invente informações. Se um dado não foi fornecido, registre como lacuna e penalize proporcionalmente.
- Para cada ponto de risco, cite a evidência específica dos dados do lead.
- O resumo executivo deve ter no máximo 3 frases.`;

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
          description: "Taxas comerciais sugeridas pela PRISCILA baseadas nos custos reais dos parceiros + margem",
          properties: {
            parceiroRecomendado: { type: "string", description: "Nome do parceiro mais adequado para este lead (baseado em MCC, custo e perfil)" },
            justificativa: { type: "string", description: "Justificativa incluindo custos do parceiro base e margens aplicadas" },
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