# V5.2 — Diagnóstico Bloco 4: Questionário Dinâmico V5.1 (Sub-Entrega E1)

**Documento analisado:** `QuestionarioDinamico_V5_1_Microscopico.docx` (Sub-Entrega E1 — 14 capítulos)

**Data do diagnóstico:** 2026-05-20

---

## 📐 ESPECIFICAÇÕES CANÔNICAS

### Universo total de perguntas — 145 IDs únicos

| Bloco | Quantidade | Status seed atual |
|---|---|---|
| Tier 1 Universal | 14 | ❌ Não seedado |
| Tier 2 Adicional | 16 | ❌ Não seedado |
| Tier 3 Base Adicional | 22 | ❌ Não seedado |
| Segmento-específicas | ~65 (13 × 4-9) | ❌ Detalhe na E2 |
| Subseller PJ | 16 | ❌ Não seedado |
| Subseller PF | 12 | ❌ Não seedado |
| Universal Patch V5.1 | 1 (`q_t2_revenue_proof`) | ❌ Não seedado |

### Convenção de IDs

Formato: `q_<tier>_<descritor>` (ex: `q_t1_cnpj`, `q_t2_owners_25`, `q_t3_annual_revenue`, `q_sub_pj_cnpj`, `q_sub_pf_cpf`, `q_decl_*`, `q_seg_<seg>_<descritor>`).

### 14 IDs Tier 1 Universal (lista completa)
- q_t1_cnpj, q_t1_company_confirm, q_t1_rep_cpf, q_t1_rep_birth, q_t1_rep_phone, q_t1_rep_email, q_t1_company_address_confirm, q_t1_segment_sugest, q_t1_mcc, q_t1_tpv_monthly, q_t1_ticket_avg, q_t1_bank_account, q_decl_t1_terms, q_decl_t1_veracity

### 16 IDs Tier 2 Adicional
- q_t2_owners_25, q_t2_economic_group, q_t2_company_url, q_t2_product_type, q_t2_sales_channels, q_t2_chargeback_history, q_t2_processor_history, q_t2_processor_closed, q_t2_coaf_notified, q_t2_pep_self_declaration, q_t2_pep_relatives, q_t2_capital_origin, q_t2_employees_count, q_t2_physical_address_type, q_t2_revenue_projection, q_t2_business_years

### 22 IDs Tier 3 Base Adicional
- q_t3_annual_revenue, q_t3_revenue_3y, q_t3_balanco, q_t3_dre, q_t3_governance_structure, q_t3_pld_policy, q_t3_bcp_existence, q_t3_pci_compliance, q_t3_audit_external, q_t3_legal_disputes, q_t3_branches_count, q_t3_international_operations, q_t3_currency_operations, q_t3_payment_methods, q_t3_clients_b2b_b2c, q_t3_main_competitors, q_t3_growth_strategy, q_t3_main_suppliers, q_t3_data_retention_policy, q_t3_dpo_existence, q_t3_external_audit_report, q_t3_aml_training

### 16 IDs Subseller PJ
- q_sub_pj_cnpj, q_sub_pj_company_confirm, q_sub_pj_rep_cpf, q_sub_pj_contact, q_sub_pj_tpv, q_sub_pj_ticket, q_sub_pj_bank, q_sub_pj_owners (Grau B+), q_sub_pj_product_type (Grau B+), q_sub_pj_other_channels (Grau B+), q_sub_pj_url (Grau B+), q_sub_pj_annual_revenue (Grau C), q_sub_pj_years_operating (Grau C), q_sub_pj_economic_group (Grau C), q_sub_pj_other_platforms, q_sub_pj_crossborder (Grau C)

### 12 IDs Subseller PF
- q_sub_pf_cpf, q_sub_pf_birth, q_sub_pf_contact, q_sub_pf_address, q_sub_pf_profession, q_sub_pf_tpv, q_sub_pf_ticket, q_sub_pf_bank, q_sub_pf_other_channels, q_sub_pf_pep_self, q_sub_pf_url, q_decl_sub_pf_terms

---

## 🧩 TAXONOMIA

### 4 Categorias funcionais

| # | Categoria | Função | Fonte | ~Quantidade |
|---|---|---|---|---|
| 1 | Identificação cadastral | Confirmar quem é a entidade | BDC autoritativo | ~25 |
| 2 | Caracterização operacional | O que faz, como vende, porte | Coletado / híbrido | ~40 |
| 3 | Governança e compliance | Maturidade compliance | Coletado + docs | ~30 |
| 4 | Sinalização de risco | Sinais para Risk Score | Autodeclaração + cross-check | ~50 |

### 5 Categorias estruturais
- Universal Tier 1
- Adicional Tier 2
- Adicional Tier 3 base
- Segmento-específica
- Capability-específica

### 4 Modalidades de origem do dado

| Modalidade | UX |
|---|---|
| **A — BDC autoritativo** | Card visual + "Confirmar" + "Reportar divergência" |
| **B — Híbrido (sugere+edita)** | Campo pré-preenchido + "Sugerido por X" + "Editar" |
| **C — Coletado puro** | Input padrão |
| **D — Auto-derivado** | Oculto ou info readonly |

---

## ⚙️ MOTOR DE TIERING DINÂMICO

### 4 Princípios fundamentais
1. **"Tier crescente único"** — nunca regride
2. **"Primeiro sinal escala"** — basta um trigger forte
3. **"Tier inicial padrão = Tier 1"** (exceto Subseller e segmento T3-only declarado)
4. **"Feedback transparente, motivo opaco"**

### Pseudocódigo formal `evaluateTier()`

**Triggers T1 → T2:**
- TPV >R$50k e ≤R$500k
- Segmento em TIER_2_SEGMENTS
- BDC: PEP em rep ou sócio
- BDC: grupo econômico identificado
- BDC: chargeback histórico >1%

**Triggers T1/T2 → T3:**
- TPV >R$500k
- Segmento T3-only (marketplace, gateway, crossborder)
- Capability splits/crossborder pesado
- CB declarado >3%
- Processador encerrou conta (B13)
- COAF notificado (B14)
- PEP autodeclarado
- BDC: sanção em UBO
- BDC: grupo econômico hit
- BDC: face em shared faceset → **RECUSA imediata (B10)**

**Regra invariante:** `newTier = max(newTier, currentTier)` — nunca regride.

### Algoritmo Subseller Grau A/B/C

```
classifySubsellerGrau(tpv, mcc, capabilities, bdcSignals):
  Pré-eliminação (migra para Tier 3 direto):
    - tpv > R$500k
    - splits OR crossborder ativos
    - mcc em TIER_3_ONLY_MCCS
  Classificação:
    - tpv ≤ R$30k AND low_risk_mcc AND sem hit → GRAU_A
    - tpv ≤ R$200k → GRAU_B
    - tpv ≤ R$500k → GRAU_C
```

### Snapshot de estado por sessão

```json
{
  "session_id": "uuid",
  "current_tier": "TIER_2",
  "tier_history": [
    {"tier": "TIER_1", "timestamp": "...", "trigger": "initial"},
    {"tier": "TIER_2", "timestamp": "...", "trigger": "tpv_above_50k"}
  ],
  "current_grau": null,
  "segments_detected": ["seg_ecommerce"],
  "capabilities_requested": [],
  "bdc_signals_so_far": {...},
  "pending_questions": [...],
  "completed_questions": [...],
  "blocks_to_apply": [],
  "framework_version": "v5.1"
}
```

### Reavaliação pós-envio (CRÍTICO)

1. Pipeline BDC + CAF completo
2. **Re-evaluateTier com dados enriquecidos** (pode escalar)
3. B-series determinísticos
4. Risk Score V5
5. Subfaixa
6. Decisão

**Se tier escala pós-submit** → solicita info adicional via email (re-engagement) OU revisão manual direta.

---

## 🎨 MICROCOPY OFICIAL — princípios

### Tom de voz
- Direto, empático, profissional, "você" sempre

### Palavras a EVITAR
- "Apenas", "Por favor", "Atenção!", "Erro" sem contexto, "Caro cliente", "Prezado"
- Pontuação exclamativa em erros

### Mensagens-tipo
- Erro: explica o que está errado + como corrigir
- Sucesso: "Tudo certo, [Nome]"
- Recusa: sem revelar motivo específico (proteção do framework)
- Escalação tier: transparente sobre fato, opaca sobre motivo

### Subseller usa placeholder `[Nome do seller mestre]`

---

## 📜 MAPA REGULATÓRIO (Cap. 11)

Cada pergunta deve ter `norma_regulatoria` com:
- Norma específica (Circ. BCB 3.978/2020)
- Artigo/inciso exato (Art. 11, I)
- Objetivo regulatório

**Normativos consolidados:**
- BCB/CMN: Circ. 3.978/2020, Res. 96/2021, Res. 80/2021
- PLD/FT: Lei 9.613/1998, Res. COAF 36/2021, Res. CFC 1.555/2018
- Proteção de dados: LGPD Lei 13.709/2018, ANPD Res. CD/ANPD nº 2/2022
- Outras: Lei 12.249/2010 (CFC), FATF Recommendations

---

## 🔀 SKIP-LOGIC (Cap. 14) — 5 tipos

1. Skip por tier
2. Skip por segmento
3. Skip por capability
4. Skip por resposta anterior
5. Skip por sinal BDC (raro)

### Tempos-alvo P8 (skip-logic agressiva)
- Tier 1 com pré-fill: 4-7 min
- Tier 2: 8-15 min
- Tier 3 sem segmento sensível: 15-25 min
- Subseller PJ Grau A: 3-5 min

---

## 📦 VERSIONAMENTO

### Semver V5.minor.patch
- Major: estrutural (V4→V5)
- Minor: adição/remoção pergunta, skip-logic
- Patch: microcopy, validação

### 3 timestamps por sessão
- `framework_version_at_start`
- `framework_version_at_submit`
- `framework_version_at_decision`

Se divergem → flag `is_transitional_case` + revisão.

### Pontos de retomada por tier
- Subseller PJ: 15 dias
- Tier 1/2: 30 dias
- Tier 3: 45 dias

---

## ✅ JÁ IMPLEMENTADO E ALINHADO

- ✅ Entity `Question` (mas faltam 9 campos novos)
- ✅ Entity `QuestionnaireTemplate` com `framework_version`, `tier_v5_1`, `segmento_v5_1`
- ✅ Entity `QuestionnaireResponse`
- ✅ Tela `pages/EditorQuestionario`
- ✅ Componente `components/compliance/DynamicQuestionnaire`
- ✅ Componente `components/compliance/DynamicQuestionRenderer`
- ✅ 13 segmentos suportados no enum
- ✅ Skip-logic básica via `conditionalLogic`
- ✅ Pipeline V5.1 (`bdcEnrichCaseV5_1`)
- ✅ `pipelineRouter.js` (V4 vs V5.1)
- ✅ Auto-fill BDC parcial via `brasilApiCnpj`, `bdcQueryCompany`, `bdcQueryPerson`
- ✅ `ComplianceSession` com `formData` (mas sem `tier_history`)

---

## ❌ GAPS CRÍTICOS — 15 itens

| # | Gap | Status |
|---|---|---|
| 1 | 145 IDs canônicos não seedados como `Question` records | ❌ |
| 2 | Ficha microscópica de 12 atributos — faltam 9 campos no schema `Question` | ❌ |
| 3 | Motor de Tiering Dinâmico real-time (`evaluateTierDuringFlow`) ausente | ❌ |
| 4 | Snapshot de estado durante fluxo (`tier_history`, `bdc_signals_so_far`) ausente em `ComplianceSession` | ❌ |
| 5 | Reavaliação de tier pós-enriquecimento ausente | ❌ |
| 6 | Catálogo de microcopy oficial centralizado ausente (`lib/v5_1/microcopy.js`) | ❌ |
| 7 | Campo `norma_regulatoria` por pergunta ausente | ❌ |
| 8 | 4 Modalidades A/B/C/D na UX não implementadas (todo input usa renderer único) | ❌ |
| 9 | Princípio P2 (autocomplete editável + "Reportar divergência") parcial | ⚠️ |
| 10 | Workflow formal de mudanças (RFC + comitê) | ⏸️ Processo organizacional |
| 11 | 3 timestamps de framework_version por sessão | ❌ |
| 12 | TTL de retomada calibrado por tier (15d/30d/45d) | ❌ |
| 13 | Pergunta `q_t2_revenue_proof` transversal (Tier 1 nos 4 críticos) | ❌ |
| 14 | B-series determinísticos disparados durante fluxo (não só pós-submit) | ❌ |
| 15 | Métricas-alvo P8 (tempos por tier) instrumentadas | ❌ |

---

## 🎯 PLANO DE IMPLEMENTAÇÃO BLOCO 4

### FASE 4.1 — Schema `Question` ampliado
- [ ] Adicionar 9 campos: `categoria_funcional`, `modalidade_origem`, `cross_check_bdc`, `variaveis_risk_score`, `b_series_disparados`, `norma_regulatoria`, `documentos_relacionados`, `framework_version_intro`, `framework_version_removed`

### FASE 4.2 — Seed de 80 perguntas canônicas
- [ ] 14 perguntas Tier 1 universal com ficha completa
- [ ] 16 perguntas Tier 2 adicional
- [ ] 22 perguntas Tier 3 base
- [ ] 16 perguntas Subseller PJ
- [ ] 12 perguntas Subseller PF
- [ ] 1 pergunta `q_t2_revenue_proof` transversal
- (Segmentos = 65 perguntas vão na Sub-Entrega E2 / Bloco 5)

### FASE 4.3 — Motor de Tiering Dinâmico
- [ ] `lib/v5_1/tieringEngine.js` com `evaluateTierDuringFlow()`
- [ ] `classifySubsellerGrauDuringFlow()` para subsellers
- [ ] Expandir `ComplianceSession` com `tier_history`, `bdc_signals_so_far`, `segments_detected`, `capabilities_requested`
- [ ] Re-render do questionário quando tier escala

### FASE 4.4 — Microcopy oficial centralizado
- [ ] `lib/v5_1/microcopy.js` com constantes por tipo
- [ ] Helper `getMicrocopy(key, context)` com substituição de `[Nome do seller mestre]`
- [ ] Refatorar componentes

### FASE 4.5 — Modalidades A/B/C/D na UX
- [ ] `<ConfirmCard>` (A — autoritativo)
- [ ] `<HybridField>` (B — sugestão editável)
- [ ] `<CollectedField>` (C — input padrão) — provavelmente já existe parcialmente
- [ ] `<DerivedInfo>` (D — readonly)
- [ ] Botão "Reportar divergência" em A → `AuditLog`

### FASE 4.6 — B-series durante fluxo
- [ ] `lib/v5_1/blocksEvaluator.js` com `evaluateBlocksDuringFlow(questionId, response, bdcSignals)`
- [ ] Hook após cada resposta
- [ ] UX de B-series imediato (mensagem-padrão)

### FASE 4.7 — Reavaliação pós-enriquecimento
- [ ] Atualizar `bdcEnrichCaseV5_1` com `reevaluateTierAfterEnrichment()`
- [ ] Se escala pós-submit: criar `PendencyRequest` OU Revisão Manual
- [ ] Email de re-engagement

### FASE 4.8 — Versionamento por sessão
- [ ] 3 campos em `OnboardingCase`: `framework_version_at_start`, `framework_version_at_submit`, `framework_version_at_decision`
- [ ] Flag `is_transitional_case`
- [ ] Worker de detecção

### FASE 4.9 — TTL de retomada por tier
- [ ] `ComplianceSession.expires_at` calibrado por tier

### FASE 4.10 — Mapa regulatório consultável
- [ ] `pages/MapaRegulatorio` para auditores
- [ ] Filtros por norma, tier, segmento
- [ ] Export PDF

---

## ❓ PERGUNTAS EM ABERTO (Q17-Q20)

### Q17 — Reavaliação dinâmica de tier durante o fluxo
**Pergunta:** Implementar real-time (escala enquanto cliente preenche) ou só pós-submit?
- **Real-time:** UX mais complexa, mas alinha com doc § Cap 9
- **Pós-submit:** Mais simples; cliente preenche tudo, depois sistema decide
**Status:** ⏳ Aguardando

### Q18 — Modalidade A "Reportar divergência"
**Pergunta:** Quando cliente reportar divergência em dado autoritativo, vai para Revisão Manual ou só registra em auditoria?
**Status:** ⏳ Aguardando

### Q19 — `q_t2_revenue_proof` em Tier 1 dos 4 críticos
**Pergunta:** Upload obrigatório no momento OU declaração inicial + envio do doc em até 15 dias?
**Status:** ⏳ Aguardando

### Q20 — Workflow formal de mudanças (RFC + comitê)
**Pergunta:** Está OK assumir que vocês cuidam disso fora do sistema (processo organizacional, não código)?
**Status:** ⏳ Aguardando