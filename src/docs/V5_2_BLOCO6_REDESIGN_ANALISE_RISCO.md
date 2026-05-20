# V5.2 — BLOCO 6: REDESIGN AnaliseDeRisco + Especificação Datasets na Tela

**Data:** 20/05/2026
**Status:** Diagnóstico microscópico — Blocos 6+7 consolidados
**Documentos-fonte analisados:**
- `REDESIGN_AnaliseDeRisco.md` (2.629 linhas)
- `04_DELTA_SEGMENTOS_V5_1.md` (1.181 linhas)
- `05_ESPECIFICACAO_DATASETS_NA_TELA_V5_1.md` (1.706 linhas)

---

## 1. CONTEXTO — Por que esses 3 documentos juntos

Os 3 documentos formam o **eixo de implementação final** da V5.1/V5.2:

| Doc | Função | Audiência |
|-----|--------|-----------|
| **REDESIGN_AnaliseDeRisco** | Refatorar a tela `UnifiedRiskAnalysis.jsx` (12 blocos verticais → 4 abas + Hero + Smart Summary) | Frontend + UX + Compliance |
| **04_DELTA_SEGMENTOS** | Sobrescrever cirurgicamente os 13 docs de segmento com nomenclatura canônica de bloqueios + datasets + capabilities | Backend + entidades Base44 |
| **05_ESPECIFICACAO_DATASETS_NA_TELA** | Mapear EXAUSTIVAMENTE onde cada um dos ~58 datasets BDC aparece em cada aba da nova tela | Frontend + Backend (ponte UI↔motor) |

**Os 3 são interdependentes:** o REDESIGN define a estrutura da tela; o DELTA define o que cada segmento popula; a ESPECIFICAÇÃO_DATASETS conecta cada dataset BDC a um local visual específico.

---

## 2. DOCUMENTO 1 — REDESIGN da Aba "Análise de Risco"

### 2.1 O problema diagnosticado

**Estado atual:** `UnifiedRiskAnalysis.jsx` tem **12 blocos verticais sequenciais** com ~12.000-18.000 px de altura em casos Tier 3 críticos.

**Custo operacional:** ~60-100 acessos/dia × ~2 min perdidos por caso = **~15-16 FTE-equivalentes desperdiçados/ano** apenas no time interno.

### 2.2 Os 12 blocos atuais (inventário)

| # | Bloco | Componente | Diagnóstico |
|---|-------|------------|-------------|
| 1 | Veredito | RiskVerdictBanner | Bom mas não-sticky |
| 2 | Score V4 | RiskScorePanel | **Desatualizado** (V5.1 usa 5 escalas por Tier) |
| 3 | Red Flags | RiskRedFlagsPanel | Conceito ótimo, **20-40 cards em Tier 3** |
| 4 | Smart Alerts BDC | BDCSmartAlerts | **Redundante com Bloco 3** |
| 5 | Heatmap | BDCRiskHeatmap | Radar bonito mas **ruim para decisão** |
| 6 | Data Confidence | BDCDataConfidence | **Metadata travestida de bloco principal** |
| 7 | Declarado vs Confirmado | BDCDeclaredVsConfirmed | Excelente mas **só 8 campos (V5.1 tem 16)** |
| 8 | Positivos/Atenção SENTINEL | RiskPositivesAndConcerns | **Parser regex frágil** (deveria ser JSON) |
| 9 | Dimensional BDC | RiskDimensionalAnalysis | **Bloco mais denso — onde a fadiga acontece** |
| 10 | Parecer SENTINEL | RiskFinalVerdict | **Enterrado no bloco 10 — ninguém chega** |
| 11 | Narrativa BDC IA | BDCNarrativeReport | **Redundante com 9+10** |
| 12 | Sumário Fontes | UnifiedSourcesSummary | **Auditoria escondida no fim** |

### 2.3 Os 10 problemas concretos identificados

| # | Problema | Severidade |
|---|----------|------------|
| 1 | ⭐ Scroll vertical infinito (~12-18k px) | ALTA |
| 2 | ⭐ Redundância visível entre blocos 3-4-8-9-10-11 | ALTA |
| 3 | Hierarquia visual chapada | ALTA |
| 4 | Score 0-849 sem contexto (V5.1 usa 5 escalas) | MÉDIA |
| 5 | Heatmap radar ruim para decisão | MÉDIA |
| 6 | Data Confidence sub-utilizado | MÉDIA |
| 7 | Positivos/Atenção descalibrados (parser regex) | ALTA |
| 8 | ⭐ Sem priorização Red Flags por impact_score | ALTA |
| 9 | ⭐ SENTINEL enterrado no Bloco 10 | ALTA |
| 10 | Auditoria escondida no Bloco 12 | ALTA |

### 2.4 5 PERSONAS — dores específicas

| Persona | Casos/dia | Tempo hoje | Tempo desejado | Ganho |
|---------|-----------|------------|----------------|-------|
| **Compliance L1** | 30-50 | 6 min/caso | 3 min | -50% |
| **Compliance Senior** | 8-15 | 16 min | 11 min | -30% |
| **Compliance Officer** | 2-5 | 35 min | 26 min | -25% |
| **Auditoria Interna** | amostragem | 30-90 min | 18-54 min | -40% |
| **Auditoria Externa (BCB/Bandeiras)** | trimestral | 60-120 min | 30-60 min | -50% |

### 2.5 Os 10 PRINCÍPIOS DO REDESIGN

1. **⭐ Decisão Primeiro, Evidência Depois** (Pirâmide Invertida)
2. **Camadas Progressivas de Profundidade** (Level 1-2-3)
3. **⭐ Organização pela Jornada do Analista** (não pela fonte técnica)
4. **Densidade Visual Modulada** (Hero 48px vs metadata 12px)
5. **Drill-down sob Demanda** (não imposto no scroll)
6. **⭐ Glossário e Didática Inline** (~50-60 termos via ⓘ)
7. **Atalhos de Teclado** (`1`,`2`,`3`,`4`,`a`,`r`,`m`,`/`,`?`)
8. **Mobile-aware** (tablet-first para revisão)
9. **WCAG 2.1 AA** (contraste 4.5:1, screen reader)
10. **⭐ Auditoria Preservada em 100%** (zero perda de campos)

### 2.6 Nova ARQUITETURA proposta

```
┌──────────────────────────────────────────────────┐
│  TOP BAR (sticky)                                │
│  Caso #ABC · Tier 3 Gateway · [PDF] [Atalhos]   │
├──────────────────────────────────────────────────┤
│  HERO VERDICT (sticky compacto no scroll)        │
│  🔴 RECUSADO · 5-T3 · 920/999 · 3 bloqueios     │
├──────────────────────────────────────────────────┤
│  SMART SUMMARY (3 cards)                         │
│  [Top 3 Alertas] [Top 3 Positivos] [Cross-Val]  │
├──────────────────────────────────────────────────┤
│  TABS (4 abas horizontais)                       │
│  [1 Resumo & Decisão] [2 Evidências] [3 Dim BDC] │
│  [4 SENTINEL + Auditoria]                        │
└──────────────────────────────────────────────────┘
```

#### 2.6.1 HERO VERDICT (Camada 1)

- **48px** decisão + ícone 64x64
- 5 decisões mapeadas (Aprovado/Cond.Leves/Cond./Manual/Recusado) com gradientes
- **Causa principal** extraída via `getCausaPrincipal()` (bloqueio crítico → escalação SENTINEL → fraude CAF → padrão)
- **Chips de bloqueios ativos** (códigos)
- Botões: Ver Detalhes / Gerar PDF / Decisão Manual ▼
- **Sticky compacto** (56px) no scroll

#### 2.6.2 SMART SUMMARY (3 cards)

1. **Top 3 Alertas** (priorizados por severidade × `impact_score`)
2. **Top 3 Positivos** (contexto balanceado)
3. **Cross-Val Resumo** (16 campos V5.1: X match / Y divergence / Z mismatch)

#### 2.6.3 ABA 1 — "Resumo & Decisão" (padrão)

- Alertas Priorizados (5 campos por alerta: severidade+título / detalhes / por que importa / ação sugerida / fonte)
- Pontos Positivos
- Cross-Val Header (top 4-6 campos críticos)
- **Mini-Parecer SENTINEL** (200-300 palavras — versão executiva)
- Ações Sugeridas (checklist + botões: Concordo / Aprovar c/ Condições / Recusar / Solicitar Docs / Escalar)

#### 2.6.4 ABA 2 — "Evidências & Cross-Validation"

- **Cross-Validation completo 16 campos V5.1** (10 cadastrais + 6 Patch Financeiro)
- **Patch Financeiro V5.1 detalhado** (5 cross-checks: BDC financial_market + ECF + Open Finance + CRC contador)
- **Bloqueios Detalhados** (fichas DOC5 com 14 atributos cada)
- **CAF — Biometria + Screening** (Liveness, FaceMatch, Doc, KYB, Credit, Sanctions)

#### 2.6.5 ABA 3 — "Análise Dimensional BDC"

- **Sidebar** de 13 dimensões (cor da bolinha = risco)
- **Conteúdo principal** por dimensão com drill-down de datasets
- **Heatmap radar OPCIONAL** (botão, não imposto)
- **Glossário inline** reforçado (~30 termos)

#### 2.6.6 ABA 4 — "SENTINEL + Auditoria"

- **Coluna esquerda:** parecer SENTINEL completo (7 seções preservadas) + JSON estruturado
- **Coluna direita (sticky):** trilha auditoria (framework_version, hash, fases, datasets, serviços CAF, export PDF/JSON/XLSX)
- **Diff visual** para revalidações
- **Feedback SENTINEL** (loop estruturado: 👍 acertou / 👎 errou / 🤔 parcialmente)

### 2.7 Mapeamento campo-a-campo (100% preservado)

**Princípio inviolável:** nenhum campo lido pelo `UnifiedRiskAnalysis.jsx` atual é descartado. Tabela master mapeia cada um dos 12 blocos → nova localização com status:
- 🟢 Preservado idêntico
- 🔄 Refatorado (mantém função, muda apresentação)
- 🆕 Adicionado
- ❌ Removido como bloco principal (dados preservados em metadata/sidebar)

### 2.8 14 REGRAS INVIOLÁVEIS preservadas

**6 regras originais (Apêndice A) + 8 V5.1:**

1. Decisão NUNCA recalculada no front — só LIDA do ComplianceScore
2. SENTINEL nunca pode RECUSAR — só sugerir Manual/Condições
3. Bloqueios B01-B09 (e V5.1: ~72 bloqueios) ANULAM o score
4. CAF fraude biométrica SOBRESCREVE V4
5. Cross-validation usa compareValues 4 níveis
6. BDC datasets `required`: identity, owners, compliance, esg
7. **Patch Financeiro V5.1 obrigatório Tier 2+**
8. **5 escalas Subfaixa por Tier** (T1: 0-850, T2: 0-850, T3: 0-999, SubPJ/PF: 0-850)
9. Rolling Reserve composto 4-dim
10. Trilha com framework_version + hash + sentinel_version
11. Catálogo DOC5 de ~72 bloqueios
12. **3 capabilities transversais** (splits/subseller, crossborder, recurrence)
13. SENTINEL especializado por segmento (~25 prompts)
14. Política de exceções (4 categorias)

### 2.9 Ganhos de jornada (3 casos de uso)

| Caso | Tempo ANTES | Tempo DEPOIS | Redução |
|------|-------------|--------------|---------|
| L1 Verde Express (1A-T1) | ~60s | **~8s** | **-85%** |
| Senior Revisão Manual Tier 3 Gateway | ~22-30 min | **~9-11 min** | **-55%** |
| Auditoria Externa BCB | ~30-60 min | **~5-10 min** | **-80%** |

### 2.10 Roadmap 4 fases (12 semanas)

| Fase | Foco | Duração |
|------|------|---------|
| 1 | Foundation + Hero + Smart Summary | 3 sem |
| 2 | Aba 1 + Aba 2 | 3 sem |
| 3 | Aba 3 + Aba 4 | 3 sem |
| 4 | Polish + A11Y + Atalhos + Mobile + Training | 3 sem |

**Plano de rollout:** Soft Launch 10% → 50% → 100% (4 semanas)

---

## 3. DOCUMENTO 2 — DELTA_SEGMENTOS V5.1

### 3.1 Princípio "delta cirúrgico"

Em vez de rescrever 13 docs de segmento (~2.276 KB), **sobrescreve cirurgicamente** apenas:
- **Nomenclatura canônica** de bloqueios B-segmento-*
- **Datasets BDC** específicos por segmento
- **Capabilities** exigidas

### 3.2 Tabela Master de bloqueios canônicos (38 total)

| Segmento | Bloqueios canônicos | Críticos absolutos sem exceção |
|----------|---------------------|--------------------------------|
| E-commerce | `B-EC-CB-1`, `B-EC-LGPD-1`, `B-EC-LOG-1` | — |
| Marketplace ⭐ | `B-MKT-KYC-1`, `B-MKT-OFFB-1`, `B-MKT-PROD-CRIT-1` | ✅ `B-MKT-PROD-CRIT-1` |
| Gateway ⭐ | `B-GW-PCI-CRIT-1`, `B-GW-BAAS-1`, `B-GW-FRAUD-1` | ✅ `B-GW-PCI-CRIT-1` |
| SaaS | `B-SAAS-CHURN-1`, `B-SAAS-LGPD-1` | — |
| Infoprodutos | `B-INFO-PYR-1`, `B-INFO-AFF-1`, `B-INFO-GAR-1` | — |
| Plataforma Vertical ⭐ | `B-PV-LGPD-1-CRIT`, `B-PV-PROF-1`, `B-PV-MORPH-CRIT` | ✅ `B-PV-LGPD-1-CRIT` |
| Turismo | `B-TUR-CAD-1`, `B-TUR-CB-1` | — |
| Eventos | `B-EVT-CAP-1`, `B-EVT-CANC-1`, `B-EVT-INS-1`, `B-EVT-AVCB-1` | — |
| Serviços B2B | `B-B2B-CONC-1`, `B-B2B-IP-1`, `B-B2B-DPA-1` | — |
| Dropshipping ⭐ | `B-DS-FORN-CRIT-1`, `B-DS-LOG-1`, `B-DS-CB-1` | — (Categoria 4 apenas) |
| Serviços Locais | `B-LOC-SETOR-CRIT-1`, `B-LOC-LABOR-1`, `B-LOC-MED-1` | ✅ `B-LOC-SETOR-CRIT-1` |
| Educação | `B-EDU-MEC-1`, `B-EDU-REF-1`, `B-EDU-CERT-1` | — |
| Crossborder ⭐ | `B-CB-PAIS-CRIT-1`, `B-CB-FOREX-1`, `B-CB-CORR-1` | ✅ `B-CB-PAIS-CRIT-1` |
| **TOTAL** | **38 bloqueios** | **5 absolutos** |

### 3.3 7 mapeamentos de nomenclatura (find & replace)

| Doc original | Nome canônico V5.1 |
|--------------|---------------------|
| `B-MKT-PROD-1` | `B-MKT-PROD-CRIT-1` |
| `B-GW-PCI-1` | `B-GW-PCI-CRIT-1` |
| `B-PV-LGPD-1` | `B-PV-LGPD-1-CRIT` |
| `B-DS-FORN-1` | `B-DS-FORN-CRIT-1` |
| `B-LOC-POUS-1` | `B-LOC-SETOR-CRIT-1` |
| `B-LOC-VET-1` | `B-LOC-MED-1` |
| `B-CB-PAIS-1` | `B-CB-PAIS-CRIT-1` |

### 3.4 Tiers permitidos por segmento

| Segmento | T1 | T2 | T3 |
|----------|----|----|----|
| Marketplace ⭐ | ❌ | ❌ | ✅ ONLY |
| Gateway ⭐ | ❌ | ❌ | ✅ ONLY |
| Crossborder ⭐ | ❌ | ❌ | ✅ ONLY |
| Demais 10 segmentos | ✅ | ✅ | ✅ |

**Pipeline DEVE rejeitar automaticamente** tentativas de Marketplace/Gateway/Crossborder em T1/T2.

### 3.5 Capabilities obrigatórias

| Segmento | Capability obrigatória |
|----------|----------------------|
| Marketplace ⭐ | `splits/subseller` |
| SaaS | `recurrence` |
| Crossborder ⭐ | `crossborder` |

### 3.6 Datasets novos prioritários (negociação BDC)

| Dataset 🆕 | Segmentos dependentes | Prioridade |
|------------|----------------------|------------|
| `cadastur_active` | Turismo (crítico) | **Alta** |
| `avcb_bombeiros` | Eventos Morf. A, Locais Morf. E | **Alta** |
| `crmv_active` | Locais Morf. D | **Alta** |
| `conselhos_profissionais` (CFM/OAB/CRC/CREA/CFP) | PV Morf. D, B2B Morf. D, Patch Financeiro | **Alta** |
| `coaf_reports_history` | Marketplace, Gateway, Crossborder | **Alta** |
| `bcb_pix_anti_bolcao` | Marketplace, Gateway (com splits) | Alta |
| `country_risk_index` | Crossborder | **Alta** |
| `warnings_interpol` | Crossborder, T3 com crossborder | Alta |
| `sanctions_uk_hmt/canada_sema/australia_dfat/switzerland_seco` | Crossborder + qualquer com capability | **Alta** |
| `anvisa_violations_pending` | PV (Saúde, Beleza) | Média |
| `cnj_improbidade` | Universal T2+ | Alta |
| `bcb_med_history` | T2+ com PIX | Média |
| `bank_judicial_blocks` | T2+ | Alta |
| `mte_inspections_pending` | Locais, B2B BPO, Crossborder | Média |
| `second_level_relatives_kyc` | T3 + UBO PEP/sancionado | Baixa |
| `government_debtors_estaduais` | T2+ | Média |

### 3.7 25 SENTINEL Prompts Especializados

| Família | # prompts | Exemplo |
|---------|-----------|---------|
| E-commerce | 5 | `sentinel_ecommerce_tier{1,2,3}_v5_1` + recurrence/crossborder variants |
| Marketplace | 2 | `sentinel_marketplace_tier3_splits_v5_1`, `sentinel_marketplace_tier3_splits_crossborder_v5_1` |
| Gateway | 4 | puro / splits / baas / crossborder |
| SaaS | 4 | tier{1,2,3}_recurrence + dpa variant |
| Infoprodutos | 2 | padrão + multilevel |
| Plataforma Vertical | 4 | morfA Saúde / morfD Profissionais / morfE Gig / padrão |
| Turismo | 2 | padrão + crossborder |
| Eventos | 2 | grande Morf. A + padrão |
| Serviços B2B | 3 | morfD Advocacia / morfF BPO / padrão |
| Dropshipping | 2 | padrão + crossborder |
| Serviços Locais | 3 | morfD Veterinária / morfE Pousada / padrão |
| Educação | 2 | ensino superior + padrão |
| Crossborder | 4 | padrão / forex / cripto / splits |

---

## 4. DOCUMENTO 3 — ESPECIFICAÇÃO DATASETS NA TELA

### 4.1 Princípio: cada dataset aparece em até 7 locais

| Local | Renderização |
|-------|--------------|
| 1 | **Aba 3 — Dimensão analítica primária** (drill-down completo) |
| 2 | **Aba 2 — Cross-Validation** (se alimenta um dos 16 campos) |
| 3 | **Aba 4 — Sumário Fontes + Trilha** (sempre — toda consulta registrada) |
| 4 | **Modal questionário** (se há pergunta associada) |
| 5 | **Hero Verdict** (chip de bloqueio crítico) |
| 6 | **Smart Summary Top 3** (se alimentou top alerta) |
| 7 | **Sidebar sticky Auditoria** (modo compacto) |

**Princípio absoluto:** mesmo dataset DEVE ter estado visual idêntico em todos os locais.

### 4.2 Tabela Master — 58 fontes mapeadas

**54 datasets BDC + 4 integrações não-BDC** (ECF Receita Federal, Open Finance, CFC, CAF).

### 4.3 Distribuição por dimensão (Aba 3 — 13 dimensões)

| Dimensão | # datasets | Datasets críticos |
|----------|-----------|-------------------|
| 1. Identidade & Cadastro | 5 | `basic_data` ⭐ |
| 2. Sócios & Beneficiários | 5 | `owners_kyc` ⭐, `first_level_relatives_kyc` 🆕 |
| 3. Estrutura Societária | 3 | `relationships`, `shell_company_score` ⭐ |
| 4. Sanções (Intl & Nac) | 7 | `sanctions_international` ⭐ ampliado, `warnings_interpol` 🆕 |
| 5. Processos & Compliance | 6 | `processes` ⭐, `cnj_improbidade` 🆕 |
| 6. Atividade & Reputação | 5 | `reputations_and_reviews` ⭐ |
| 7. Financeiro & Mercado | 4 | `financial_market` ⭐ (Patch Fin), ECF, Open Finance |
| 8. Trabalho & ESG | 4 | `mte_lista_suja` ⭐, `mte_inspections_pending` 🆕 |
| 9. Compliance Setorial | 9 | `conselhos_profissionais` 🆕, `avcb_bombeiros` 🆕, `crmv_active` 🆕, `cadastur_active` 🆕 |
| **10. PLD/FT 🆕 nova V5.1** | 5 | `coaf_reports_history` 🆕, `bcb_pix_anti_bolcao` 🆕 |
| **11. Risco-País Internacional 🆕** | 1 | `country_risk_index` 🆕 (sob capability crossborder) |
| 12. CAF Biometria & Screening | 6 serviços | Liveness, FaceMatch, Doc, KYB, Credit, Sanctions |
| 13. Outras integrações | 1 | CFC |
| **TOTAL** | **~58** | |

**Mudança importante:** 13 dimensões (não mais 12) — **PLD/FT é dimensão NOVA V5.1** + **Risco-País Internacional** é sub-dimensão condicional (só com capability `crossborder`).

### 4.4 Os 4 ESTADOS VISUAIS — especificação crítica

| Estado | Ícone | Cor | Tailwind | Significado |
|--------|-------|-----|----------|-------------|
| **success** | 🟢 ✅ | Emerald | `bg-emerald-50 border-emerald-200` | Consultado, dados retornados |
| **empty** | 🟡 ⚠️ | Amber | `bg-amber-50 border-amber-200` | Consultado, mas vazio (≠ erro) |
| **error** | 🔴 ❌ | Red | `bg-red-50 border-red-200` | Falha provedor (timeout, 5xx) |
| **not_consulted** | ⊝ ◯ | Gray | `bg-gray-50 border-gray-200 border-dashed` | Não aplicável (condicional não atendida) |

**Distinção crítica:** `empty` ≠ `not_consulted`. O primeiro é informação (consultou e está vazio); o segundo é metadata (nem consultou).

### 4.5 Cross-Validation 16 campos V5.1

| # | Campo | Fonte BDC | Crítico? |
|---|-------|-----------|----------|
| 1-8 | Razão social, situação, endereço, fundação, CNAE, telefone, email, UBO | `basic_data`, `owners_kyc`, `contacts_validation` | V4 mantido |
| **9** ⭐ | TPV mensal declarado | `financial_market` | **Patch Financeiro V5.1** |
| 10 | Quantidade funcionários | `caged_employees` | V5.1 novo |
| **11** ⭐ | Subsellers KYC % | questionário + amostra BDC | **Patch (splits)** |
| **12** ⭐ | Faturamento Patch | ECF Receita Federal | **Patch Financeiro** |
| 13 | Conta encerrada bancária | Open Finance | V5.1 novo |
| 14 | Idade empresa | `basic_data` | V5.1 novo |
| **15** ⭐ | CRC contador status | `conselhos_profissionais` | **Patch Financeiro** |
| 16 | MCC primário | questionário | V5.1 novo |

**5 campos críticos do Patch Financeiro V5.1:** 9, 11, 12, 13, 15.

### 4.6 Lógica condicional — pseudocódigo

```python
def deve_consultar_dataset(dataset, tier, segmento, capabilities, morfologia):
    if dataset.tier_minimo > tier:
        return False, f"tier_below_threshold"
    if "all" not in dataset.segmentos_ativam and segmento not in dataset.segmentos_ativam:
        return False, "segment_not_applicable"
    if dataset.capabilities_ativam and not any(c in capabilities for c in dataset.capabilities_ativam):
        return False, f"capability_{dataset.capabilities_ativam[0]}_not_active"
    if dataset.morfologias_ativam and "all" not in dataset.morfologias_ativam and morfologia not in dataset.morfologias_ativam:
        return False, "morfologia_not_applicable"
    if dataset.requires_trigger and not avaliar_trigger(...):
        return False, "trigger_not_met"
    return True, None
```

### 4.7 8 razões de `not_consulted_reason`

1. `tier_1_below_threshold` — dataset T2+ não consultado em T1
2. `tier_2_below_threshold` — dataset T3-only não consultado em T2
3. `capability_crossborder_not_active` — Sanctions UK HMT não consultadas
4. `capability_splits_subseller_not_active` — bcb_pix_anti_bolcao não consultado
5. `segment_not_applicable` — cadastur_active em E-commerce
6. `morfologia_not_applicable` — crmv_active em PV Morf. A
7. `trigger_not_met` — second_level_relatives_kyc aguarda trigger
8. `cost_optimization` — dataset alto custo desabilitado por flag

### 4.8 Datasets consumidos por exemplo

| Caso | # consultados (de ~58) |
|------|------------------------|
| Tier 1 E-commerce sem capabilities | **~10-13** |
| Tier 2 PV Morf. A Saúde | **~28-30** |
| Tier 3 Marketplace + splits + crossborder | **~45-50** |

### 4.9 Glossário inline — cobertura mínima 50 termos

Distribuído por categoria:
- **Tier e Segmentação** (4 termos): Tier, Subfaixa Tier-aware, Capability, Morfologia
- **Bloqueios** (4): B-series, Recusa direta, Revisão Manual obrigatória, Bloqueio sem exceção
- **Datasets** (5): BDC, Dataset, Status, Variável V-*, Dimensão analítica
- **Patch Financeiro V5.1** (5): Patch Financeiro, TPV, ECF, CRC contador, Open Finance
- **SENTINEL** (3): SENTINEL, Prompt especializado, "SENTINEL escala, nunca rebaixa"
- **Auditoria** (4): Framework version, Audit hash, Snapshot, Trilha imutável
- **Capabilities** (3): splits/subseller, crossborder, recurrence

**Total: ~28 termos críticos + ~22 termos descritivos = 50+ termos.**

---

## 5. DIAGNÓSTICO CONSOLIDADO — gaps de implementação

### 5.1 Entidades — atualizações necessárias

#### 5.1.1 `Dataset` (V5.1 — nova entidade)
**Já existe.** Validar campos:
- `codigo` (canônico DOC3)
- `nome_amigavel` (uniforme em toda UI)
- `dimensao_analitica` (1 das 13 — incluindo PLD/FT 🆕 e Risco-País Intl 🆕)
- `tier_minimo`, `segmentos_ativam`, `capabilities_ativam`, `morfologias_ativam`
- `obrigatorio` (boolean — alimenta fail-fast pipeline)
- `requires_trigger` (boolean)
- `glossario_tooltip` (string didática)
- `custo_credito`, `ttl_revalidacao_dias`
- `ativo`, `novo_em_v5_1`

#### 5.1.2 `Bloqueio` — campos canônicos V5.1
**Já existe.** Validar campos para 38 bloqueios B-segmento-*:
- `codigo` (canônico — usar tabela 16.2 do DELTA)
- `datasets_consumidos` (array de IDs canônicos Dataset)
- `variaveis_alimentadoras` (array V-*)
- `segmentos_aplicaveis`, `morfologias_aplicaveis`
- `severidade`, `decisao_associada`
- `tiers_aplicaveis`
- `mensagem_analista`, `mensagem_cliente`
- `exception_categoria` (cat_1 a cat_4 ou nenhuma para os 5 absolutos)

#### 5.1.3 `IntegrationLog` — campos críticos V5.1
**Já existe — adicionar/validar:**
- `status` (enum: success / empty / error / not_consulted)
- `not_consulted_reason` (string — 8 razões catalogadas)
- `elapsed_ms`
- `dimensao_analitica` (denormalizado para queries rápidas)

#### 5.1.4 `ComplianceScore` — campos V5.1
**Já existe — adicionar:**
- `cross_validation_results` (jsonb — 16 campos estruturados)
- `patch_financeiro_dimensoes` (jsonb — 5 cross-checks)
- `impact_score_top_alerts` (jsonb — priorização Smart Summary)

#### 5.1.5 `Snapshot` (V5.1 — imutabilidade)
**Já existe.** Validar `datasets_consumed` array com objetos contendo `dataset_name`, `status`, `query_id`, `elapsed_ms`, `not_consulted_reason`.

### 5.2 Componentes UI a implementar

#### 5.2.1 Estrutura de pastas (~30 componentes)

```
src/components/risk-analysis-v2/
├── UnifiedRiskAnalysisV2.jsx                [Root]
├── HeroVerdict/
│   ├── HeroVerdict.jsx
│   ├── CausaPrincipal.jsx
│   ├── BloqueiosChips.jsx
│   ├── ActionButtons.jsx
│   └── StickyCompact.jsx
├── SmartSummary/
│   ├── SmartSummary.jsx
│   ├── TopAlertsCard.jsx
│   ├── TopPositivesCard.jsx
│   └── CrossValSummaryCard.jsx
├── TabsContainer/
│   ├── TabsContainer.jsx
│   ├── Tab1ResumoDecisao/
│   │   ├── Tab1.jsx
│   │   ├── AlertasPriorizados.jsx
│   │   ├── PontosPositivos.jsx
│   │   ├── CrossValHeader.jsx
│   │   ├── MiniParecerSentinel.jsx
│   │   └── AcoesSugeridas.jsx
│   ├── Tab2Evidencias/
│   │   ├── Tab2.jsx
│   │   ├── CrossValTable16.jsx          [16 campos V5.1]
│   │   ├── PatchFinanceiroPanel.jsx     [5 cross-checks]
│   │   ├── BloqueiosDetalhados.jsx      [Fichas DOC5]
│   │   └── CAFBiometriaScreening.jsx
│   ├── Tab3DimensionalBDC/
│   │   ├── Tab3.jsx
│   │   ├── DimensoesSidebar.jsx         [13 dimensões]
│   │   ├── DimensaoContent.jsx
│   │   ├── DatasetCard.jsx              [⭐ 4 estados visuais]
│   │   ├── DatasetStatusBadge.jsx
│   │   ├── DatasetDetailModal.jsx
│   │   ├── LawsuitsList.jsx              [Preservado]
│   │   └── HeatmapOpcional.jsx           [Opcional]
│   └── Tab4SentinelAuditoria/
│       ├── Tab4.jsx
│       ├── SentinelParecerCompleto.jsx   [7 seções]
│       ├── TrilhaAuditoriaSidebar.jsx    [Sticky]
│       ├── SumarioFontesPanel.jsx
│       ├── DatasetsConsumedList.jsx
│       └── ExportAuditoria.jsx           [PDF/JSON/XLSX]
├── shared/
│   ├── TopBar.jsx
│   ├── KeyboardShortcuts.jsx             [15+ atalhos]
│   ├── UniversalSearch.jsx               [Cmd+F]
│   ├── DiffBanner.jsx                    [Revalidações]
│   ├── FeedbackSentinelPanel.jsx         [Loop estruturado]
│   └── GlossarioPopover.jsx              [50+ termos]
└── utils/
    ├── getCausaPrincipal.js
    ├── getSmartSummary.js
    ├── compareValues.js                   [Preservado + expandido 16 campos]
    ├── enrichRedFlag.js                   [Preservado + impact_score]
    ├── glossario.js                       [Centralizado — 50+ termos]
    └── deveConsultarDataset.js            [Lógica condicional]
```

### 5.3 Backend functions a implementar/atualizar

| Função | Status atual | Ação |
|--------|--------------|------|
| `deveConsultarDataset(dataset, tier, segmento, capabilities, morfologia)` | Não existe | **Criar** |
| `montarListaDatasets(tier, segmento, capabilities, morfologia)` | Lógica espalhada | **Consolidar em função única** |
| `executarConsultaBDC(dataset_id, query_payload)` | Existe parcial em `bdcEnrichCase` | **Refatorar para suportar 58 datasets** |
| `calcularCrossValidation16(questionnaireData, bdcAnalysis, ecf, openFinance)` | Existe versão 8 campos | **Expandir para 16 campos V5.1** |
| `agregarDatasetsPorDimensao(integration_logs)` | Não existe | **Criar (13 dimensões incluindo PLD/FT + Risco-País)** |
| `gerarSumarioFontes(snapshot)` | Existe parcial | **Refatorar para Aba 4** |
| `selecionarPromptSentinel(segmento, tier, morfologia, capabilities)` | Lógica espalhada | **Consolidar — 25 prompts canônicos** |
| `resolverSegmentoMorfologia(questionnaire)` | Existe em `lib/v5_1/segmentos.js` | **Validar nomenclatura canônica** |
| `extrairImpactScore(red_flag)` | Não existe | **Criar (priorização Smart Summary)** |
| `gerarFeedbackSentinel(case_id, feedback_type, comment)` | Não existe | **Criar (loop estruturado V5.1)** |
| `exportAuditoriaCompleta(case_id, formato)` | Existe `generateCompliancePdf` parcial | **Expandir para JSON/XLSX + link expirável** |

### 5.4 Análises de impacto

#### 5.4.1 Mudanças cirúrgicas em código existente

| Arquivo | Tipo de mudança |
|---------|-----------------|
| `pages/AnaliseManual.jsx` | **Substituir** `<UnifiedRiskAnalysis>` por `<UnifiedRiskAnalysisV2>` (feature flag) |
| `pages/AnaliseCompleta.jsx` | Idem |
| `pages/CadastroDetalhe.jsx` | Idem |
| `components/case-analysis/UnifiedRiskAnalysis.jsx` | **DEPRECAR** após rollout 100% — manter por 90 dias |
| `lib/v5_1/segmentos.js` | Validar nomenclatura canônica (7 find&replace) |
| `lib/v5_1/scoringV5_1.js` | Garantir 5 escalas por Tier |
| `functions/bdcEnrichCaseV5_1.js` | Suportar 58 datasets + status not_consulted |
| `functions/generateCompliancePdf.js` | Refatorar template — estrutura 1:1 com nova tela |

#### 5.4.2 Mudanças em entidades (apenas adições — nada destruído)

- `Dataset`: validar 16 campos + seed inicial completo
- `Bloqueio`: validar 38 B-segmento-* + 7 mapeamentos nomenclatura
- `IntegrationLog`: adicionar `status` + `not_consulted_reason`
- `ComplianceScore`: adicionar `cross_validation_results` + `patch_financeiro_dimensoes`
- `Snapshot`: validar `datasets_consumed` array

### 5.5 Atalhos de teclado (15 atalhos)

| Atalho | Ação |
|--------|------|
| `1`, `2`, `3`, `4` | Pular entre abas |
| `j`, `k` | Próximo/anterior item |
| `Esc` | Voltar um nível |
| `/` | Buscar no caso |
| `a` | Aprovar |
| `c` | Aprovar c/ Condições |
| `m` | Revisão Manual |
| `r` | Recusar |
| `s` | Solicitar docs adic. |
| `e` | Escalar Senior |
| `p` | Gerar PDF |
| `g c` | Copiar ID do caso |
| `?` | Painel de atalhos |

---

## 6. PLANO DE IMPLEMENTAÇÃO CONSOLIDADO (Blocos 6+7)

### FASE 1 — Fundação (semanas 1-3)

**Backend:**
- [ ] Validar entidade `Dataset` (seed 58 datasets)
- [ ] Validar entidade `Bloqueio` (38 B-segmento-* canônicos)
- [ ] Adicionar campos `status` + `not_consulted_reason` em `IntegrationLog`
- [ ] Adicionar `cross_validation_results` em `ComplianceScore`
- [ ] Criar função `deveConsultarDataset()` + `montarListaDatasets()`
- [ ] Aplicar 7 mapeamentos de nomenclatura (find&replace)

**Frontend:**
- [ ] Design tokens (cores, tipografia, espaçamento)
- [ ] `TopBar.jsx`, `HeroVerdict.jsx` (com sticky), `SmartSummary.jsx` (3 cards)
- [ ] Estrutura de 4 abas vazias
- [ ] Feature flag `risk_analysis_v2`

### FASE 2 — Abas 1 + 2 (semanas 4-6)

- [ ] Aba 1 completa (AlertasPriorizados, PontosPositivos, CrossValHeader, MiniParecerSentinel, AcoesSugeridas)
- [ ] Aba 2 completa (CrossValTable16, PatchFinanceiroPanel, BloqueiosDetalhados, CAFBiometriaScreening)
- [ ] Sistema de busca universal (Cmd+F)
- [ ] Glossário inline (`GlossarioPopover.jsx` + 50 termos em `glossario.js`)
- [ ] Função backend `calcularCrossValidation16`

### FASE 3 — Abas 3 + 4 (semanas 7-9)

- [ ] Aba 3 com Sidebar 13 dimensões (incluindo PLD/FT 🆕 e Risco-País Intl 🆕)
- [ ] `DatasetCard.jsx` com 4 estados visuais consistentes
- [ ] `DatasetDetailModal.jsx` consumindo entity Dataset
- [ ] `LawsuitsList.jsx` preservado
- [ ] Heatmap opcional
- [ ] Aba 4 com SentinelParecerCompleto + TrilhaAuditoriaSidebar sticky
- [ ] **Refatoração SENTINEL output → JSON estruturado** (backend)
- [ ] `ExportAuditoria.jsx` (PDF/JSON/XLSX + link expirável)
- [ ] `DiffBanner.jsx` para revalidações
- [ ] Função backend `agregarDatasetsPorDimensao` + `gerarSumarioFontes`

### FASE 4 — Polish + A11Y + Atalhos + Mobile (semanas 10-12)

- [ ] 15 atalhos de teclado (`KeyboardShortcuts.jsx`)
- [ ] Audit WCAG 2.1 AA (Lighthouse ≥95)
- [ ] Responsivo tablet + mobile
- [ ] Microinterações (fade, slide, shake, rotation)
- [ ] `FeedbackSentinelPanel.jsx` (loop estruturado V5.1)
- [ ] Testes Cypress/Playwright (cobertura ≥80%)
- [ ] Training do time (L1, Senior, Officer)

### FASE 5 — Rollout (semanas 13-19)

- [ ] Soft launch 10% (semanas 13-14)
- [ ] Ajustes baseados em feedback (semana 15)
- [ ] Rollout 50% (semanas 16-17)
- [ ] Rollout 100% (semanas 18-19)
- [ ] Deprecação tela antiga (semana 20)

---

## 7. CHECKLIST DE VALIDAÇÃO PRÉ GO-LIVE

### 7.1 Entidades (seed + integridade)
- [ ] `Dataset.find({})` retorna ~58 registros ativos
- [ ] `Bloqueio.find({})` retorna ~72 registros (universais + 38 B-segmento-*)
- [ ] `Bloqueio.find({severidade: 'BLOQUEIO', exception_categoria: 'nenhuma'})` retorna **7 absolutos** (B03, B04, B10, B-CB-1, B-INT-1, B-MKT-PROD-CRIT-1, B-PV-LGPD-1-CRIT) + os 4 críticos absolutos dos segmentos (`B-GW-PCI-CRIT-1`, `B-LOC-SETOR-CRIT-1`, `B-CB-PAIS-CRIT-1`)
- [ ] `Capability.find({})` retorna 3 (splits/subseller, crossborder, recurrence)

### 7.2 Pipeline
- [ ] Pipeline rejeita Marketplace/Gateway/Crossborder em T1/T2
- [ ] `deveConsultarDataset` retorna `(False, reason)` corretamente para 8 razões
- [ ] Caso T1 E-commerce sem capabilities consulta ~10-13 datasets
- [ ] Caso T3 Marketplace splits+crossborder consulta ~45-50 datasets
- [ ] `selecionarPromptSentinel` retorna 1 dos ~25 prompts canônicos

### 7.3 UI
- [ ] Hero Verdict renderiza 5 decisões com cores corretas
- [ ] Smart Summary 3 cards com priorização por impact_score
- [ ] Aba 1 ativa por padrão; sub-componentes funcionais
- [ ] Aba 2 com 16 campos cross-val + 5 cross-checks Patch Financeiro
- [ ] Aba 3 com 13 dimensões (incluindo PLD/FT e Risco-País Intl condicional)
- [ ] DatasetCard renderiza 4 estados visuais (success/empty/error/not_consulted)
- [ ] Datasets `not_consulted` aparecem com opacity 0.4 + explicação
- [ ] Aba 4 com SENTINEL completo + Trilha sticky + Export
- [ ] 15 atalhos teclado funcionais
- [ ] Glossário inline em ≥50 termos
- [ ] Mobile responsivo testado
- [ ] Lighthouse Accessibility ≥95

### 7.4 Auditoria
- [ ] 100% campos lidos pelo `UnifiedRiskAnalysis` atual preservados
- [ ] PDF do parecer 1:1 com estrutura da tela
- [ ] Export JSON com campo `status` para cada dataset
- [ ] Diff visual em revalidações funcional
- [ ] Hash + framework_version + sentinel_version visíveis na Aba 4

### 7.5 Métricas (baseline 2 semanas antes + comparação 3 meses)
- [ ] Tempo médio L1: 6 min → meta 3 min (-50%)
- [ ] Tempo médio Senior: 16 min → meta 11 min (-30%)
- [ ] Tempo médio Officer: 35 min → meta 26 min (-25%)
- [ ] NPS analistas: 5/10 → meta 7/10
- [ ] % casos arquivados sem leitura completa: 25% → meta 10%

---

## 8. PONTOS PARA VALIDAÇÃO (Q49-Q56)

| # | Ponto | Recomendação |
|---|-------|--------------|
| **Q49** | Arquivos atuais (`UnifiedRiskAnalysis.jsx`, etc.) ficam coexistindo via feature flag durante rollout? | **Sim** — feature flag por usuário (gradual L1 → Senior → Officer) |
| **Q50** | Refatoração SENTINEL para JSON estruturado: prompts atualizados ou consumir output atual + parser fallback? | **Atualizar prompts** + manter parser como fallback transitório |
| **Q51** | Dimensão "PLD/FT" 🆕: aparece para T1 sem capability splits? | **Sim, mas vazia** (apenas `coaf_history` consultado; demais `not_consulted`) |
| **Q52** | Dimensão "Risco-País Internacional" 🆕: oculta sem `crossborder` ou só vazia? | **Oculta visualmente** (não renderizar na sidebar) |
| **Q53** | Datasets BDC novos (cadastur, avcb, crmv, conselhos, country_risk): contratos BDC já em negociação? | **Validar status comercial** antes de FASE 1 — alguns podem precisar fallback manual |
| **Q54** | `impact_score` para priorização Top 3: cálculo determinístico (regras) ou ML? | **Determinístico** (severidade × peso regulatório × custo financeiro estimado) |
| **Q55** | Feedback SENTINEL loop: persiste em entidade nova ou reaproveita existente? | **Nova entidade `SentinelFeedback`** (decision_match, comment, analyst_id, sentinel_version) |
| **Q56** | Link compartilhável Export Auditoria: TTL configurável quanto? | **7 dias padrão** (configurável 1-30 dias via env var); HMAC-signed |

---

## 9. ESTATÍSTICAS CONSOLIDADAS FINAIS V5.2

### 9.1 Inventário completo

| Categoria | Total |
|-----------|-------|
| **Segmentos canônicos** | 13 |
| **Perguntas canônicas (Bloco 5)** | 78 (13 × 6) |
| **Bloqueios universais + B-segmento-*** | ~72 (universais V4 evoluídos + 38 B-segmento-*) |
| **Bloqueios absolutos sem exceção** | **5** (4 segmento-críticos + B03/B04/B10/B-CB-1/B-INT-1) |
| **Datasets BDC + integrações externas** | **58** (54 BDC + ECF + Open Finance + CFC + CAF) |
| **Dimensões analíticas Aba 3** | **13** (incluindo PLD/FT 🆕 + Risco-País Intl 🆕) |
| **Capabilities transversais** | 3 (splits/subseller, crossborder, recurrence) |
| **Variáveis V-*** | ~60 |
| **SENTINEL prompts especializados** | ~25 |
| **Cross-Validation campos** | **16** (10 cadastrais V4 + 6 Patch Financeiro V5.1) |
| **Estados visuais dataset** | **4** (success/empty/error/not_consulted) |
| **Razões not_consulted catalogadas** | 8 |
| **Glossário inline mínimo** | 50+ termos |
| **Atalhos de teclado** | 15 |
| **Personas analistas** | 5 |
| **Regras invioláveis preservadas** | 14 (6 originais + 8 V5.1) |

### 9.2 Custos operacionais (projeção)

| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| FTE-equivalentes desperdiçados/ano | ~15-16 | ~3-5 | **~70% economia** |
| Tempo médio Verde Express (L1) | 60s | 8s | **-85%** |
| Tempo médio Senior Tier 3 | 22-30 min | 9-11 min | **-55%** |
| Tempo Auditoria Externa BCB | 30-60 min | 5-10 min | **-80%** |

### 9.3 Bloqueios críticos absolutos (sem exceção) — total 7

1. **B03** — Sanção direta em sócio (universal)
2. **B04** — Familiar de sancionado (universal)
3. **B10** — Trabalho escravo confirmado (universal)
4. **B-CB-1** — País FATF blacklist (capability crossborder)
5. **B-INT-1** — Interpol Red Notice (universal T3)
6. **B-MKT-PROD-CRIT-1** — Marketplace com categoria proibida (armas/drogas/pirataria)
7. **B-PV-LGPD-1-CRIT** — Plataforma Vertical Saúde sem DPO especializado

**Mais 3 críticos segmento-específicos:**
- **B-GW-PCI-CRIT-1** — Gateway sem PCI-DSS
- **B-LOC-SETOR-CRIT-1** — Pousada/Restaurante sem AVCB
- **B-CB-PAIS-CRIT-1** — Crossborder em país FATF blacklist

**Total absoluto:** **10 bloqueios** que nem Compliance Officer pode aplicar exceção.

---

## 10. STATUS GERAL V5.2 — CONSOLIDADO

| Bloco | Status |
|-------|--------|
| 1 — Fundamentos | ✅ Completo |
| 2 — Datasets/Bloqueios | ✅ Completo |
| 3 — Tiers | ✅ Completo |
| 4 — Questionário Dinâmico | ✅ Completo |
| **5 — Segmentos (13)** | ✅ **Completo (13/13)** |
| **6 — REDESIGN AnaliseDeRisco + DELTA Segmentos + Espec. Datasets** | ✅ **Completo (este doc)** |
| 7 — Apêndice V5.1 Patch Financeiro | ✅ Embarcado nos docs anteriores |

**TODOS OS 7 BLOCOS DE DIAGNÓSTICO COMPLETOS ✅**

---

## 11. PRÓXIMOS PASSOS

A fase de **diagnóstico arquitetural está completa**. Os documentos `docs/V5_2_*` contêm:

- ✅ 13 segmentos diagnosticados microscopicamente
- ✅ ~72 bloqueios catalogados (universais + 38 B-segmento-*)
- ✅ 58 datasets BDC mapeados em 13 dimensões analíticas
- ✅ 3 capabilities transversais definidas
- ✅ 25 SENTINEL prompts especializados identificados
- ✅ Cross-Validation 16 campos V5.1 estruturado
- ✅ 4 estados visuais dataset especificados (consistência absoluta)
- ✅ Tela `AnaliseDeRisco` completamente redesenhada (Hero + 4 abas)
- ✅ 14 regras invioláveis preservadas
- ✅ Roadmap 12 semanas em 4 fases + rollout 4 semanas

**Total de páginas de diagnóstico:** 7 documentos × ~600 linhas média = **~4.200 linhas de especificação** prontas para implementação.

**Fase seguinte:** quando você der o "OK" para iniciar implementação, começamos pela **FASE 1 (semanas 1-3)**: validação de entidades (Dataset, Bloqueio, IntegrationLog, ComplianceScore, Snapshot) + componentes shared (TopBar, HeroVerdict, SmartSummary) + feature flag.