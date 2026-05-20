# V5.2 — Catálogo Mestre — PARTE 1 (Fundamentos + Tiers + Questionário)

> **Status**: Fonte única da verdade para implementação V5.2.
> **Data**: 2026-05-20
> **Versão**: 1.0 — consolidação inicial a partir de:
> - Tier Framework V5.1 (Parte I — Fundamentos)
> - Questionário Dinâmico E1 V5.1
> - Tier 1 / Tier 2 / Tier 3 Microscópicos V5.1
> - Apêndice V5.1 — Patch Financeiro
> - DECISOES_USUARIO.md (V5.2)
> - BLOCO5 PARTE 1-4 (V5.2 — 5 novos segmentos)
> - `lib/v5_2/constants.js` (catálogo canônico já implementado)
>
> **Decisões de governança V5.2 vigentes (sobrescrevem qualquer ambiguidade do V5.1):**
> 1. Marketplace é **Tier 2 fixo** (não Tier 3-only como o E1 V5.1 sugeria — errata V5.1 já corrigiu)
> 2. **3 segmentos Tier 3-only**: gateway, marketplace (tier 2 fixo, mas com módulo T3-like aplicado), crossborder
> 3. **B-CNPJ-NOVO** é regra transversal a todos os tiers e subsellers (V5.2 mantém)
> 4. **15 segmentos canônicos V5.2** (10 legados V5.1 + 5 novos: turismo, eventos, servicos_b2b, servicos_locais, crossborder)
> 5. Score scale por tier: T1=0-499, T2=0-849, T3=0-999, Subseller=0-999
> 6. Pontos marcados com `// TODO V5.2 — microscópico` exigem refinamento de fichas microscópicas em fase posterior, NÃO bloqueiam implementação inicial.

---

## CAPÍTULO 1 — FUNDAMENTOS REGULATÓRIOS

### 1.1 Base normativa

| Norma | Artigo / Item | Aplicabilidade |
|---|---|---|
| Circ. BCB 3.978/2020 | Art. 2º (proporcionalidade) | Justifica existência dos 3 tiers |
| Circ. BCB 3.978/2020 | Art. 7 (avaliação de risco) | Fundamenta Patch Financeiro |
| Circ. BCB 3.978/2020 | Art. 10 I-II (identificação) | Documentos obrigatórios D1-D6 |
| Circ. BCB 3.978/2020 | Art. 11 II, V (perfil + revalidação) | Janelas de revalidação calibradas |
| Circ. BCB 3.978/2020 | Art. 12 (operações incompatíveis) | B-FIN-1..4 |
| Circ. BCB 3.978/2020 | Art. 24 (procuração) | D7 condicional |
| Res. BCB 80/2021 | Art. integral | Sub-credenciador formal — Módulo Gateway/Splits |
| Res. BCB 96/2021 | Art. 3-4 | KYC compartilhado Subseller |
| Res. BCB 119/2021 | Art. 9 | Países FATF alto risco — Crossborder |
| Res. BCB 518/2024 | Integral | Anti-bolção sub-merchant |
| Lei 9.613/1998 | Art. 9, 11 II | PLD — comunicação COAF |
| Lei 13.709/2018 (LGPD) | Art. 6º III (minimização) | Justifica skip-logic agressiva |
| Lei 12.249/2010 + Res. CFC 1.555/2018 | CRC contador | B-FIN-3 |
| Lei 14.478/2022 | Ativos virtuais | Crossborder cripto |
| Lei 11.771/2008 + Cadastur | Integral | Módulo Turismo |
| Lei 12.933/2013 | Meia-entrada | Módulo Eventos |
| FATF Recommendation 1 | RBA | Fundamento global tiering |
| FATF Recommendation 10 | Verificação independente | Liveness/Facematch |
| Visa Core Rules / Mastercard Rules | PayFac + Subscription | Módulos Splits + Recurrence |
| CDC Art. 39, 49 | Recorrência + arrependimento | Módulo Recurrence |

### 1.2 12 Princípios de Design V5.2

| ID | Princípio | Implicação |
|---|---|---|
| V5-1 | Proporcionalidade | Tiers escalonados — KYC modulado por risco |
| V5-2 | Autocomplete editável | BDC pré-preenche; cliente pode editar |
| V5-3 | Transparência ao cliente | Mensagens-padrão de escalação sem revelar gatilho |
| V5-4 | Opacidade do critério | Não revelar quais sinais BDC dispararam escalação |
| V5-5 | Tier nunca regride na sessão | Primeiro sinal "ganha" |
| V5-6 | Skip-logic agressiva | Perguntas só aparecem quando estritamente necessárias |
| V5-7 | Snapshot imutável | Pós-envio, dados são selados (auditoria) |
| V5-8 | Cross-validation silenciosa | BDC roda em background, não fricciona |
| V5-9 | Salvamento contínuo | A cada bloco, snapshot incremental |
| V5-10 | Modularidade por capability/segmento | Tier 3 acumula módulos |
| **V5-11** | **Capacidade financeira é dimensão obrigatória** | Patch Financeiro V5.1 |
| **V5-12** | **Proporcionalidade modulada por risco estrutural** | 4 críticos exigem Patch mesmo em Tier 1 |

### 1.3 Os 4 segmentos críticos (regra V5-12)

`seg_gateway`, `seg_dropshipping`, `seg_marketplace`, `seg_crossborder` — exigem **Patch Financeiro mesmo em Tier 1**, independente de TPV.

---

## CAPÍTULO 2 — TIERS E SUBSELLERS

### 2.1 Os 5 perfis canônicos V5.2

| Perfil | TPV/Trigger | Score scale | Distribuição esperada |
|---|---|---|---|
| **Tier 1** (Light) | TPV ≤ R$ 50k/m + sem capabilities + segmento simples + sem sinais | 0-499 | 50-65% |
| **Tier 2** (Standard) | R$ 50k < TPV ≤ R$ 500k/m OU marketplace (fixo) OU sinais Tier 2 | 0-849 | 20-30% |
| **Tier 3** (Enhanced) | TPV > R$ 500k/m OU segmento T3-only OU capability T3 OU sinais T3 | 0-999 | 15-25% |
| **Subseller PJ** | Via seller mestre Tier 3 c/ splits | 0-999 (3 Graus A/B/C) | (paralelo) |
| **Subseller PF** | Via seller mestre Tier 3 c/ splits + segmento gig/C2C | 0-999 | (paralelo) |

### 2.2 Roteamento de Tier — Sinais que escalam (NUNCA regride na sessão)

#### Tier 1 → Tier 2 (qualquer sinal escala):
- TPV declarado entre R$ 50.001 e R$ 500.000
- PEP confirmado em rep, sócio ou UBO (cross-check BDC)
- Grupo econômico identificado
- Histórico chargeback declarado > 1%
- Segmento compatível com Tier 2 (ver matriz 2.3)
- BDC indica faturamento presumido > 3x TPV declarado (subdeclaração)
- Beneficiário Bolsa Família/BPC + TPV > R$ 20k (perfil incompatível)

#### Tier 1/2 → Tier 3 (qualquer sinal escala):
- TPV declarado > R$ 500.000/mês
- Segmento Tier 3-only: **gateway, crossborder** (marketplace é Tier 2 fixo com módulo T3-like)
- Capability `splits/subseller` solicitada (força T3)
- Capability `crossborder` pesado solicitada
- Chargeback declarado > 3%
- Conta encerrada por processador anterior (B13)
- Notificação COAF/BCB declarada (B14)
- Autodeclaração PEP positiva
- Hit sanção internacional em UBO
- Hit grupo econômico
- MCC em lista alto risco
- Idade CNPJ < 6 meses + TPV > R$ 30k

#### Bloqueios diretos (recusa sem escalação):
- B01 (situação cadastral PJ não-ATIVA), B02 (sanção UBO), B03 (sanção rep), B05 (óbito rep), B06 (CPF irregular), B08 (CNAE blacklist), B10 (face em base fraude)

### 2.3 Matriz Tier × Segmento (15 segmentos V5.2)

| Segmento | Tier 1 | Tier 2 | Tier 3 | Tier T3-only? | Crítico V5-12? |
|---|---|---|---|---|---|
| ecommerce | ✅ | ✅ | ✅ | — | — |
| saas | ✅ | ✅ | ✅ | — | — |
| educacao | ✅ | ✅ | ✅ | — | — |
| link_pagamento | ✅ | ✅ | ✅ | — | — |
| mpe | ✅ | ✅ | ✅ | — | — |
| servicos_b2b | ✅ | ✅ | ✅ | — | — |
| servicos_locais | ✅ | ✅ | ✅ | — | — |
| plataforma_vertical | ✅ (limítrofe) | ✅ | ✅ | — | — |
| dropshipping | ✅ (4 crítico) | ✅ | ✅ | — | **✅** |
| infoprodutos | ✅ | ✅ | ✅ | — | — |
| turismo | — | ✅ | ✅ | — | — |
| eventos | — | ✅ | ✅ | — | — |
| **marketplace** | — | **✅ FIXO** | ✅ módulo | (não) | **✅** |
| **gateway** | — | — | ✅ | **✅ T3-only** | **✅** |
| **crossborder** | — | — | ✅ | **✅ T3-only** | **✅** |

### 2.4 Subseller — 3 Graus

| Grau | TPV/mês | Perguntas | Documentos | Biometria | Pipeline |
|---|---|---|---|---|---|
| **A** | ≤ R$ 30k + MCC baixo risco + sem hits BDC | 7 perguntas mínimas | RG/CNH + Selfie | Simplificada | Mínimo |
| **B** | R$ 30k < TPV ≤ R$ 200k | 11 perguntas | + Contrato Social + Owners | Completa | Médio |
| **C** | R$ 200k < TPV ≤ R$ 500k | 16 perguntas | + Faturamento anual + Cadeia PJ | Completa + Owners | Pleno |

Acima de R$ 500k OU com capability splits → **Migrate to Tier 3 direct** (não é subseller, é seller direto)

### 2.5 Tier nunca regride — Exceções

- Seller migrou T2→T3 por capability splits e cancelou + 12 meses sem uso → pode voltar a T2 (revisão manual)
- Fusão/cisão societária com nova entidade — avaliação caso a caso

---

## CAPÍTULO 3 — QUESTIONÁRIO DINÂMICO V5.2 (~145 IDs canônicos)

### 3.1 Convenção de nomenclatura

`q_{escopo}_{descritor}` — onde escopo ∈ `{t1, t2, t3, seg_<segmento>, cap_<capability>, sub_pj, sub_pf, decl}`

### 3.2 Universo total: ~145 IDs

| Bloco | IDs únicos |
|---|---|
| Tier 1 universal | 14 |
| Tier 2 adicional | 16 (+ q_t2_revenue_proof do Patch) = 17 |
| Tier 3 base adicional | 22 |
| Segmentos (média 6/segmento × 13 ativos) | ~78 |
| Capabilities (4 × 5 perguntas) | ~20 |
| Subseller PJ | 16 |
| Subseller PF | 12 |
| Declarações universais | 4 |
| **TOTAL** | **~145** |

### 3.3 Tier 1 — 14 IDs Universais

| ID | Descrição | Categoria | Origem |
|---|---|---|---|
| q_t1_cnpj | CNPJ da empresa | Identificação | Coletado (BDC valida) |
| q_t1_company_confirm | Confirmação Razão Social/CNAE/endereço | Identificação | Pré-preenchido BDC |
| q_t1_rep_cpf | CPF do representante legal | Identificação | Coletado (BDC valida) |
| q_t1_rep_birth | Data nascimento do rep | Identificação | Pré-preenchido BDC |
| q_t1_rep_phone | Telefone do rep (com OTP) | Identificação | Híbrido |
| q_t1_rep_email | Email do rep (com confirmação link) | Identificação | Híbrido |
| q_t1_company_address_confirm | Endereço comercial | Identificação | Pré-preenchido BDC |
| q_t1_segment_sugest | Segmento sugerido (V5.2: 15 opções) | Operacional | Híbrido |
| q_t1_mcc | MCC sugerido (auto derivado) | Operacional | Auto-derivado |
| q_t1_tpv_monthly | TPV mensal esperado | Operacional | Coletado |
| q_t1_ticket_avg | Ticket médio | Operacional | Coletado |
| q_t1_bank_account | Conta bancária para liquidação | Operacional | Coletado |
| q_decl_t1_terms | Declaração termos de uso | Declaração | Checkbox + hash versão |
| q_decl_t1_veracity | Declaração veracidade + origem lícita | Declaração | Checkbox + hash versão |

### 3.4 Tier 2 — 17 IDs Adicionais (sobre T1)

| ID | Descrição | Disparo Patch? |
|---|---|---|
| q_t2_owners_25 | Sócios e UBOs ≥ 25% | — |
| q_t2_economic_group | Grupo econômico (cross-BDC) | — |
| q_t2_company_url | URL/site da empresa | — |
| q_t2_product_type | Tipo de produto/serviço | — |
| q_t2_sales_channels | Canais de venda (multi) | — |
| q_t2_chargeback_history | Histórico CB (autodec) | — |
| q_t2_processor_history | Já processou antes? | — |
| q_t2_processor_closed | Conta encerrada antes? | B13 |
| q_t2_coaf_notified | Já notificado COAF/BCB? | B14 |
| q_t2_pep_self_declaration | PEP em si mesmo? | B04 |
| q_t2_pep_relatives | PEP em familiar 1º grau? | — |
| q_t2_capital_origin | Origem do capital | — |
| q_t2_employees_count | Funcionários | — |
| q_t2_physical_address_type | Tipo endereço comercial | — |
| q_t2_revenue_projection | Projeção faturamento 12m | — |
| q_t2_business_years | Tempo de operação | B-CNPJ-NOVO |
| **q_t2_revenue_proof** | **Declaração de Faturamento + CRC contador** | **B-FIN-1..4** |

### 3.5 Tier 3 — 22 IDs Adicionais (sobre T2)

| ID | Descrição |
|---|---|
| q_t3_annual_revenue | Faturamento anual último exercício |
| q_t3_revenue_3y | Faturamento 3 exercícios |
| q_t3_balanco | Upload Balanço Patrimonial |
| q_t3_dre | Upload DRE |
| q_t3_governance_structure | Tem compliance officer? |
| q_t3_pld_policy | Política PLD/FT formal? + upload |
| q_t3_bcp_existence | Business Continuity Plan? + upload |
| q_t3_pci_compliance | PCI-DSS? + certificado |
| q_t3_audit_external | Auditoria externa? |
| q_t3_legal_disputes | Disputas judiciais relevantes? |
| q_t3_branches_count | Filiais |
| q_t3_international_operations | Vende para exterior? |
| q_t3_currency_operations | Moedas operadas |
| q_t3_payment_methods | Métodos aceitos |
| q_t3_clients_b2b_b2c | Perfil clientes |
| q_t3_main_competitors | Principais concorrentes |
| q_t3_growth_strategy | Estratégia crescimento |
| q_t3_main_suppliers | Principais fornecedores |
| q_t3_data_retention_policy | Política retenção dados LGPD |
| q_t3_dpo_existence | DPO declarado |
| q_t3_external_audit_report | Relatório auditoria (upload) |
| q_t3_aml_training | Treinamento AML/PLD da equipe |

### 3.6 Declarações Universais (4 IDs)

| ID | Aplicabilidade |
|---|---|
| q_decl_t1_terms | T1 + T2 + T3 + Subsellers |
| q_decl_t1_veracity | T1 + T2 + T3 + Subsellers |
| q_decl_lgpd_consent | T1 + T2 + T3 + Subsellers (hash versão) |
| q_decl_sectoral_compliance | T3 com módulos regulados (Cadastur, BCB, ECAD, etc.) |

### 3.7 Subseller PJ — 16 IDs

| ID | Grau A | Grau B | Grau C |
|---|---|---|---|
| q_sub_pj_cnpj | ✅ | ✅ | ✅ |
| q_sub_pj_company_confirm | ✅ | ✅ | ✅ |
| q_sub_pj_rep_cpf | ✅ | ✅ | ✅ |
| q_sub_pj_contact | ✅ (OTP simples) | ✅ (OTP completo) | ✅ (OTP completo) |
| q_sub_pj_tpv | ✅ | ✅ | ✅ |
| q_sub_pj_ticket | ✅ | ✅ | ✅ |
| q_sub_pj_bank | ✅ | ✅ | ✅ |
| q_sub_pj_owners | — | ✅ | ✅ |
| q_sub_pj_product_type | — | ✅ | ✅ |
| q_sub_pj_other_channels | — | ✅ | ✅ |
| q_sub_pj_url | — | ✅ | ✅ |
| q_sub_pj_annual_revenue | — | — | ✅ |
| q_sub_pj_years_operating | — | — | ✅ |
| q_sub_pj_economic_group | — | — | ✅ |
| q_sub_pj_other_platforms | — | — | ✅ |
| q_sub_pj_crossborder | — | — | ✅ |

### 3.8 Subseller PF — 12 IDs

`q_sub_pf_cpf`, `q_sub_pf_birth`, `q_sub_pf_contact`, `q_sub_pf_address`, `q_sub_pf_profession`, `q_sub_pf_tpv`, `q_sub_pf_ticket`, `q_sub_pf_bank`, `q_sub_pf_other_channels`, `q_sub_pf_pep_self`, `q_sub_pf_url`, `q_decl_sub_pf_terms`

### 3.9 Modalidades de Origem de Dado

- **A — Pré-preenchido BDC autoritativo** (Receita/CPF): Razão Social, Nome Fantasia, CNAE, capital social, endereço Receita, situação cadastral, nome rep, data nascimento, situação CPF
- **B — Híbrido** (BDC sugere + edição): email/phone (carriers), segmento (CNAE), sócios (Receita + UBOs indiretos)
- **C — Coletado puro**: TPV, ticket, produto/serviço, canais, CB histórico, COAF, PEP, faturamento, política PLD
- **D — Auto-derivado**: MCC (do segmento), tier (das respostas), grau subseller (de TPV), bloco a apresentar

---

## CAPÍTULO 4 — MOTOR DE TIERING (algoritmo formal)

### 4.1 Pseudocódigo formal

```js
function evaluateTier(currentTier, response, allResponses, bdcSignals, capabilities) {
  let newTier = currentTier; // nunca regride
  const seg = response.segment;

  // ── BLOQUEIOS DIRETOS — retorna RECUSA antes de qualquer escalação ──
  if (bdcSignals.face_in_shared_faceset) return 'RECUSA_B10';
  if (bdcSignals.cnpj_situacao !== 'ATIVA') return 'RECUSA_B01';
  if (bdcSignals.sanction_in_rep) return 'RECUSA_B03';
  if (bdcSignals.obito_rep) return 'RECUSA_B05';
  if (bdcSignals.cpf_situacao !== 'REGULAR') return 'RECUSA_B06';
  if (bdcSignals.cnae_blacklist) return 'RECUSA_B08';

  // ── B-CNPJ-NOVO (transversal — não recusa, mas marca revisão manual) ──
  if (bdcSignals.cnpj_idade_dias < 180) {
    response.flags.push('B-CNPJ-NOVO'); // revisão manual obrigatória
  }

  // ── ESCALAÇÃO T1 → T2 ──
  if (currentTier === 'TIER_1') {
    if (response.tpv_monthly > 50_000 && response.tpv_monthly <= 500_000) newTier = 'TIER_2';
    if (TIER_2_SEGMENTS.includes(seg)) newTier = 'TIER_2';
    if (seg === 'marketplace') newTier = 'TIER_2'; // V5.2: marketplace = T2 fixo
    if (bdcSignals.has_pep_in_rep || bdcSignals.has_pep_in_partner) newTier = 'TIER_2';
    if (bdcSignals.has_economic_group_identified) newTier = 'TIER_2';
    if (bdcSignals.chargeback_history_above_1pct) newTier = 'TIER_2';
  }

  // ── ESCALAÇÃO T1/T2 → T3 ──
  if (['TIER_1', 'TIER_2'].includes(currentTier)) {
    if (response.tpv_monthly > 500_000) newTier = 'TIER_3';
    if (TIER_3_ONLY_SEGMENTS.includes(seg)) newTier = 'TIER_3'; // gateway, crossborder
    if (capabilities.includes('splits/subseller')) newTier = 'TIER_3';
    if (capabilities.includes('crossborder_heavy')) newTier = 'TIER_3';
    if (response.chargeback_history > 3) newTier = 'TIER_3';
    if (response.processor_closed === 'YES') newTier = 'TIER_3'; // B13
    if (response.coaf_notified === 'YES') newTier = 'TIER_3'; // B14
    if (response.pep_self_declaration === 'YES') newTier = 'TIER_3';
    if (bdcSignals.sanction_hit_in_ubo) newTier = 'TIER_3';
    if (bdcSignals.economic_group_hit) newTier = 'TIER_3';
    if (response.mcc_high_risk) newTier = 'TIER_3';
  }

  // ── PATCH FINANCEIRO V5-12 (4 críticos forçam Patch mesmo em T1) ──
  if (['gateway', 'dropshipping', 'marketplace', 'crossborder'].includes(seg)) {
    response.capabilities_forced.push('cap_financial_capacity_validation');
  }

  if (newTier < currentTier) newTier = currentTier; // nunca regride
  return newTier;
}

const TIER_2_SEGMENTS = [
  'ecommerce', 'saas', 'infoprodutos', 'dropshipping', 'servicos_b2b',
  'servicos_locais', 'educacao', 'plataforma_vertical', 'turismo', 'eventos'
];
const TIER_3_ONLY_SEGMENTS = ['gateway', 'crossborder']; // marketplace é T2 fixo
```

### 4.2 Classificação Subseller (Graus A/B/C)

```js
function classifySubsellerGrau(tpv, mcc, capabilities, bdcSignals) {
  if (tpv > 500_000) return 'MIGRATE_TO_TIER_3_DIRECT';
  if (capabilities.includes('splits/subseller')) return 'MIGRATE_TO_TIER_3_DIRECT';
  if (capabilities.includes('crossborder_heavy')) return 'MIGRATE_TO_TIER_3_DIRECT';
  if (TIER_3_ONLY_MCCS.includes(mcc)) return 'MIGRATE_TO_TIER_3_DIRECT';

  if (tpv <= 30_000 && LOW_RISK_MCCS.includes(mcc) && !bdcSignals.has_any_hit) return 'GRAU_A';
  if (tpv <= 200_000) return 'GRAU_B';
  if (tpv <= 500_000) return 'GRAU_C';
  return 'MIGRATE_TO_TIER_3_DIRECT';
}
```

---

## CAPÍTULO 5 — PATCH FINANCEIRO V5.1 (capacidade financeira)

### 5.1 Pergunta universal q_t2_revenue_proof

- **Quando aplica**: Tier 2+ universalmente + Tier 1 SE segmento ∈ {gateway, dropshipping, marketplace, crossborder} (regra V5-12)
- **O que coleta**: Declaração de Faturamento assinada por contador com CRC ativo + upload PDF + ECF se aplicável
- **Validação**: capability `cap_financial_capacity_validation` (automática, não opt-in)

### 5.2 Pipeline em 5 etapas

1. Cliente faz upload da Declaração de Faturamento
2. OCR extrai: valor faturamento anual, CRC contador, período
3. Cross-check 1: CRC consulta CFC API → ativo? (senão B-FIN-3)
4. Cross-check 2: faturamento declarado vs BDC `financial_market` → divergência > 20%? (senão B-FIN-1)
5. Cross-check 3: TPV declarado anual / faturamento declarado > 50%? (senão B-FIN-2)
6. Cross-check 4 (Tier 3): fluxo bancário Open Finance vs faturamento → divergência > 30%? (senão B-FIN-4)
7. Cálculo V-financial_coherence (0-100)

### 5.3 Cálculo V-financial_coherence

5 dimensões (peso igual = 20 cada):

| Dimensão | Cálculo | Threshold |
|---|---|---|
| tpv_declarado_vs_bdc | 100 - min(100, divergencia_pct) | div > 50% → 0 |
| faturamento_doc_vs_ecf | 100 - min(100, divergencia_pct × 2) | div > 30% → 40 |
| crc_status | ATIVO → 100; outros → 0 | binário |
| fluxo_caixa_open_finance | 100 - min(100, divergencia_pct × 1.5) | aplica só T3 |
| coerencia_setor | benchmark setorial (LLM/heurística) | |

**Soma final**: ≥75 → aprovação; 50-74 → condicional + manual; <50 → bloqueio + manual obrigatória

### 5.4 4 B-FIN-* bloqueios

| Código | Disparo | Severidade T2 | Severidade T3/4 críticos |
|---|---|---|---|
| B-FIN-1 | \|declarado − BDC\| / BDC > 20% | Aprovação condicional + esclarecimento | Bloqueio cautelar + manual |
| B-FIN-2 | (TPV × 12) / faturamento_anual > 50% | Bloqueio cautelar (exceto gateway/marketplace/crossborder que aceitam até 200%) | idem |
| B-FIN-3 | CRC contador ≠ ATIVO | Bloqueio cautelar imediato | idem |
| B-FIN-4 | Fluxo bancário vs faturamento divergência > 30% | (não aplica) | Manual obrigatória + possível COAF |

### 5.5 Janelas de revalidação

| Tier | Periodicidade padrão | 4 críticos |
|---|---|---|
| Tier 1 | 24 meses | **12 meses fixos** |
| Tier 2 | 18 meses | **12 meses fixos** |
| Tier 3 | 12 meses | **12 meses fixos** |
| Subseller PJ | 18 meses | — |
| Subseller PF | 24 meses | — |

---

## CAPÍTULO 6 — DOCUMENTOS POR TIER

### 6.1 Tier 1 — 6 obrigatórios + 1 condicional

| ID | Documento | Obrigatório? |
|---|---|---|
| D1 | RG/CNH frente | ✅ |
| D2 | RG/CNH verso | ✅ |
| D3 | Liveness/Selfie (CAF) | ✅ |
| D4 | Comprovante endereço empresa | ✅ |
| D5 | Comprovante endereço rep | ✅ |
| D6 | Comprovante titularidade bancária | ✅ |
| D7 | Procuração | condicional (vínculo ≠ sócio/diretor) |

### 6.2 Tier 2 — herda T1 + adiciona 4

| ID | Documento | Obrigatório? |
|---|---|---|
| D8 | Contrato Social atualizado | ✅ |
| D9 | Comprovante endereço UBOs ≥ 25% (não-rep) | condicional |
| D10 | Procuração estendida (poderes pluri-pessoa) | condicional |
| D11 | Comprovante câmbio (se crossborder leve) | condicional |
| **D-Patch** | **Declaração de Faturamento + CRC contador (q_t2_revenue_proof)** | **✅ (T2 universal + 4 críticos T1)** |

### 6.3 Tier 3 — herda T2 + adiciona 6

| ID | Documento | Obrigatório? |
|---|---|---|
| D12 | Balanço Patrimonial | ✅ |
| D13 | DRE | ✅ |
| D14 | Demonstrativos 3 exercícios | condicional (TPV > R$ 2M) |
| D15 | Política PLD/FT formal | condicional (módulos Gateway/Splits) |
| D16 | BCP (Business Continuity Plan) | condicional (sub-credenciador autorizado) |
| D17 | Certificado PCI-DSS | condicional (checkout próprio captura cartão) |

### 6.4 Documentos por capability/segmento (adicionais)

- **Cap splits/subseller**: + Política KYC sub-merchant, Termos adesão sub-merchant, Screenshot plataforma, Relatório base ativa
- **Cap crossborder**: + Declaração de moedas operadas, Comprovante regulatório câmbio
- **Cap recurrence**: + Política cancelamento publicada, Screenshot fluxo cancelamento, Política devolução
- **seg_turismo**: + Cadastur ativo, Comprovante operadora
- **seg_eventos**: + AVCB, ECAD, Apólice seguro evento
- **seg_servicos_locais**: + Conselho profissional ativo (CRM/CRO/CRC/OAB)
- **seg_crossborder**: + Sanções FATF/OFAC/UK HMT consultadas

---

> **FIM DA PARTE 1**.
> A PARTE 2 cobre: 13 segmentos detalhados + 4 capabilities + ~72 bloqueios + cross-validation 16 campos + pipeline BDC/CAF.