# V5.2 — Diagnóstico Bloco 1: Fundamentos

**Documentos analisados:**
1. `01_MASTER_INDEX_V5_1.md`
2. `02_GLOSSARIO_UNICO_V5_1.md`
3. `03_MAPA_IMPLEMENTACAO_BASE44_V5_1.md`
4. `TierFramework_V5_1_Parte1_Fundamentos.docx`

**Data do diagnóstico:** 2026-05-19

---

## ✅ JÁ IMPLEMENTADO E CORRETO

### Entidades existentes alinhadas
- `OnboardingCase` com `framework_version`, `tier`, `segmento_v5_1`, `morfologia`, `capabilities_ativas`, `risk_score_v5_1`, `subfaixa_tier_aware`, `patch_financeiro_status`, `v_financial_coherence`, `legacyV4CaseId`
- `ComplianceScore` com 5 scores por camada V5.1, `tier_v5_1`, `morfologia_v5_1`, `categoria_decisao_v5_1`, `cross_validation_16_fields`, `snapshot_id`
- `QuestionnaireTemplate.framework_version` + `tier_v5_1` + `segmento_v5_1`
- `Snapshot` imutável
- `Dataset`, `Capability`, `Bloqueio`, `Exception`
- `BdcMonitoringEvent`

### Bibliotecas V5.1 existentes
- `lib/v5_1/pipelineRouter.js` — despacha V4 vs V5.1 por DNA
- `lib/v5_1/scoringV5_1.js` — 5 camadas implementadas
- `lib/v5_1/tiers.js` — resolução por TPV + marketplace fixo
- `lib/v5_1/segmentos.js` + `morfologias.js` + `capabilities.js`
- `lib/v5_1/subfaixasTierAware.js` — notação `2A-T3`
- `lib/v5_1/matrizDecisao.js` — 5 categorias
- `functions/autoEnrichOnboardingV5_1` — orchestrator
- `functions/bdcEnrichCaseV5_1` — pipeline executa + Snapshot
- `functions/backfillFrameworkVersion` — executado

### Validação E2E
- ✅ Caso real processado em produção: 375/499 → 2A-T1 → cat_1_auto_approve

---

## ❌ ERROS DE IMPLEMENTAÇÃO IDENTIFICADOS

### Erro 1 — Faltam 4 segmentos no enum

**Schema atual `OnboardingCase.segmento_v5_1`:**
```
ecommerce, gateway, marketplace, dropshipping, infoprodutos, educacao, saas, 
plataforma_vertical, link_pagamento, foodtech, mpe, pix_merchant, pix_intermediario
```

**Faltam (precisam ser ADICIONADOS):**
- ❌ `turismo`
- ❌ `eventos`
- ❌ `servicos_b2b`
- ❌ `servicos_locais`
- ❌ `crossborder`

**Mantêm-se por compatibilidade V4 (decisão Q2):**
- ✅ `link_pagamento`, `foodtech`, `mpe`, `pix_merchant`, `pix_intermediario`

---

### Erro 2 — Capabilities desalinhadas

**Estado atual (4 capabilities com nomes inventados):**
- `cap_financial_capacity_validation` ✅ (correto, do Apêndice V5.1)
- `cap_marketplace_kyc` ❌ (deveria ser `splits/subseller`)
- `cap_crossborder_compliance` ❌ (deveria ser `crossborder`)
- `cap_subseller_kyb` ❌ (provavelmente parte de `splits/subseller`)

**Estado alvo V5.2 (canônico):**
- `splits/subseller`
- `crossborder`
- `recurrence` (não existe no código — precisa criar)
- `cap_financial_capacity_validation` (mantém)

---

### Erro 3 — Escala de score V5.1 ERRADA

**Doc canônico (GLOSSARIO §2):**
| Tier | Escala |
|---|---|
| Tier 1 | 0-850 |
| Tier 2 | 0-850 |
| Tier 3 | **0-999** |
| Subseller PJ | 0-850 |
| Subseller PF | 0-850 |

**Código atual em `scoringV5_1.js` (ERRADO):**
| Tier | Escala |
|---|---|
| Tier 1 | 0-499 ❌ |
| Tier 2 | 0-849 ❌ |
| Tier 3 | 0-849 ❌ (deveria ser 0-999) |
| Subseller | 0-999 ❌ (deveria ser 0-850) |

---

### Erro 4 — Subfaixas Tier-aware: ranges precisam validar

**Doc canônico GLOSSARIO §9.1:**

**Tier 3 (escala 0-999):**
| Subfaixa | Range |
|---|---|
| 1A | 0-150 |
| 1B | 151-300 |
| 2A | 301-450 |
| 2B | 451-550 |
| 3A | 551-650 |
| 3B | 651-750 |
| 4 | 751-850 |
| 5 | 851-999 |

**Tier 1/2/SubPJ/SubPF (escala 0-850):**
| Subfaixa | Range |
|---|---|
| 1A | 0-100 |
| 1B | 101-200 |
| 2A | 201-300 |
| 2B | 301-400 |
| 3A | 401-500 |
| 3B | 501-600 |
| 4 | 601-700 |
| 5 | 701-850 |

**Ação:** validar `subfaixasTierAware.js` contra esses ranges.

---

### Erro 5 — Marketplace Tier
**Confirmado Q1:** Marketplace = **Tier 2 fixo** (Errata E1).

Meu código atual segue isso, **não precisa alterar**.

---

## ⬜ NÃO IMPLEMENTADO (faltam itens)

### Crítico
1. **`resolverTier()` com triggers de escalação completos** — TierFramework §3.2 lista vários sinais além de TPV
2. **Regra B-CNPJ-NOVO** — CNPJ < 6 meses → revisão manual obrigatória (TierFramework §3.6)
3. **Pergunta universal `q_t2_revenue_proof`** no questionário (Apêndice V5.1 §A.2)
4. **Capability `cap_financial_capacity_validation`** com pipeline de 5 etapas (Apêndice §A.3)
5. **4 bloqueios B-FIN-1 a B-FIN-4** com triggers reais (Apêndice §A.4)
6. **Cálculo real de `v_financial_coherence`** com 5 dimensões (Apêndice §A.3.3)
7. **Janelas de revalidação por Tier** — 60/24/12 meses (Apêndice §A.5)

### Alto
8. Refatorar UI `pages/AnaliseCompleta` para V5.2 (Hero Verdict + Smart Summary + 4 abas)
9. Refatorar `QuestionnaireResponsesModal` para V5.2
10. Adicionar badges V5.2 nos cards de fila

### Médio
11. Templates V5.2 reais por tier (Tier 1 light, Tier 3 completo)
12. UI de workflow de exceções (4 Cats V5.1 + Cat 5 V5.2)
13. Botão "Reprocessar V4 → V5.2" + criação do caso V5.2 com `legacyV4CaseId`

---

## 📌 DECISÕES TOMADAS NO BLOCO 1

Ver `docs/V5_2_DECISOES_USUARIO.md` (Q1-Q7).