# V5.2 — ROADMAP MESTRE DE IMPLEMENTAÇÃO

**Documento vivo — atualizado a cada bloco de diagnóstico**

| Campo | Conteúdo |
|---|---|
| Versão | 1.0 |
| Data início | 2026-05-20 |
| Versão alvo | **V5.2** (DOC5 V5.2 sobrescreve V5.1) |
| Status | Diagnóstico em andamento — implementação NÃO iniciada |
| Estratégia | Diagnóstico completo por blocos → implementação consolidada no final |

---

## 🎯 ESTRATÉGIA DEFINIDA

**Decisão do usuário (2026-05-20):** Concluir TODOS os blocos de diagnóstico primeiro, salvando tudo em `docs/`, e só depois fazer a implementação completa e consistente — em vez de implementar pedaço a pedaço.

**Por quê:** garante coerência arquitetural, evita retrabalho, e o agente pode ler os docs salvos a qualquer momento para retomar contexto.

---

## 📊 STATUS DOS BLOCOS

| Bloco | Documentos | Status | Arquivo de diagnóstico |
|---|---|---|---|
| 1 | Master Index + Glossário + Mapa Base44 + Tier Framework Pt1 | ✅ Diagnosticado | `docs/V5_2_BLOCO1_FUNDAMENTOS.md` |
| 2 | DOC3 Datasets + DOC5 V5.2 Bloqueios | ✅ Diagnosticado | `docs/V5_2_BLOCO2_DATASETS_BLOQUEIOS.md` |
| 3 | Tier 1, 2, 3 + Subseller PJ/PF (5 docs microscópicos) | ✅ Diagnosticado | `docs/V5_2_BLOCO3_TIERS.md` |
| 4 | Questionário Dinâmico E1 | ⏳ Pendente | — |
| 5 | Segmentos (13 docs) — pode ser dividido em 5a/5b/5c | ⏳ Pendente | — |
| 6 | REDESIGN_AnaliseDeRisco + Especificação Datasets Tela | ⏳ Pendente | — |
| 7 | DELTA Segmentos + Apêndice V5.1 | ⏳ Pendente | — |

---

## 🏗️ ARQUITETURA ALVO V5.2 (consolidada dos Blocos 1+2)

### Framework version
- **V5.2** (não V5.1) — sobrescreve V5.1 com recalibragem de apetite ao risco

### Entidades necessárias

| Entidade | Estado atual | Estado alvo V5.2 |
|---|---|---|
| `OnboardingCase` | ✅ Existe com campos V5.1 | 🔄 Adicionar campos V5.2 (categoria_decisao_v5_2, plano_monitoramento_id) |
| `ComplianceScore` | ✅ Existe com campos V5.1 | 🔄 Renomear `categoria_decisao_v5_1` → `_v5_2` + 5 categorias finais |
| `Dataset` | ✅ Existe — 10 seedados | 🆕 Seedar 58 datasets DOC3 (Parte 1+2+3) |
| `Bloqueio` | ⚠️ Existe — 10 seedados com IDs ERRADOS | 🔄 Refazer com 72 bloqueios DOC5 V5.2 + códigos canônicos + 8 campos novos |
| `Capability` | ⚠️ Existe — 4 com nomes não-canônicos | 🔄 Renomear para canônicos: splits/subseller, crossborder, recurrence, cap_financial_capacity_validation |
| `Exception` | ⚠️ Existe — 4 categorias | 🔄 Adicionar `cat_5_monitoramento_intensivo` + 8 campos |
| `Snapshot` | ✅ Existe | ✅ Manter |
| `PlanoMonitoramento` | ❌ Não existe | 🆕 Criar (estrutura DOC5 V5.2 §50) |
| `TermoAdicionalV5_2` | ❌ Não existe | 🆕 Criar (aceite formal do seller para Cat 5) |
| `BdcMonitoringEvent` | ✅ Existe | ✅ Manter |

### Score Engine V5.2

**Camadas (idênticas V5.1):**
1. Score Base por Segmento × Tier × Morfologia
2. Variáveis BDC (V01-V60+)
3. Enriquecimento Qualitativo (SENTINEL)
4. Cross-Validation 16 campos
5. Ajuste Final + Bloqueios

**Escalas de score (CORRIGIR — meu código está errado):**
- Tier 1: 0-850
- Tier 2: 0-850
- Tier 3: **0-999** ⚠️
- Subseller PJ: 0-850
- Subseller PF: 0-850

**Matriz de Decisão V5.2 (4 categorias finais):**
1. 🔴 Recusa direta — ~13 bloqueios núcleo duro (5% dos casos)
2. 🟡 Revisão Manual obrigatória — ~30 bloqueios (40% dos casos)
3. 🟠 Aprovado c/ Cond. + Monitoramento (Cat 5) — ~28 bloqueios (40% dos casos)
4. 🟢 Aprovado — sem bloqueios

### Pipeline 12 Steps (DOC4 — aguardando Bloco 5)
0. Recepção questionário
1. Resolução de Tier
2. Resolução de Capabilities
3. Resolução de Segmento/Morfologia
4. Coleta BDC condicional
5. Coleta CAF
6-10. Camadas 1-5
11. Decisão + Snapshot + Persistência

---

## 🗺️ ROADMAP DE IMPLEMENTAÇÃO (a executar APÓS todos os blocos diagnosticados)

### FASE 1 — Schema & Master Data (semana 1)

**1.1 Entidades — alterações de schema:**
- [ ] `Bloqueio`: adicionar `decisao_padrao` (enum), `nucleo_duro_regulatorio` (bool), `admite_categoria_5` (bool), `tpv_cap_inicial_pct`, `rolling_reserve_adicional_pct`, `gatilhos_off_boarding_agil` (array)
- [ ] `Exception`: adicionar `cat_5_monitoramento_intensivo` no enum + campos Cat 5
- [ ] `OnboardingCase`: adicionar `framework_version: "v5.2"` como padrão para casos novos
- [ ] `ComplianceScore`: renomear `categoria_decisao_v5_1` → `categoria_decisao_v5_2`, ampliar enum
- [ ] Criar `PlanoMonitoramento` (nova entidade)
- [ ] Criar `TermoAdicionalV5_2` (nova entidade)

**1.2 Constants — alinhamento canônico:**
- [ ] `lib/v5_1/` → renomear para `lib/v5_2/`
- [ ] Renomear capabilities para nomes canônicos: `cap_marketplace_kyc` → `splits/subseller`, `cap_crossborder_compliance` → `crossborder`, `cap_subseller_kyb` → manter + adicionar `recurrence`
- [ ] Corrigir escalas de score em `scoringV5_1.js` → `scoringV5_2.js`
- [ ] Adicionar segmentos faltantes no enum `OnboardingCase.segmento_v5_1`: turismo, eventos, servicos_b2b, servicos_locais, crossborder

**1.3 Seed Master Data:**
- [ ] Seedar 58 datasets do DOC3 (com `ativo=false` para os não-contratados ainda)
- [ ] Seedar 72 bloqueios do DOC5 V5.2 (códigos canônicos + decisao_padrao + 8 atributos novos)
- [ ] Atualizar 3 capabilities canônicas + adicionar `recurrence`
- [ ] Deletar bloqueios antigos com códigos errados (B-FIN-03, B-OPE-10, etc.)

### FASE 2 — Score Engine V5.2 (semana 2)

- [ ] Implementar `aplicar_matriz_decisao_v5_2()` com 3 listas canônicas hardcoded (NUCLEO_DURO, OPERACIONAIS_CLIENTE, REVISAO_MANUAL)
- [ ] Implementar `verificar_nucleo_duro_v5_2()` (curto-circuita pipeline se ativa)
- [ ] Atualizar `bdcEnrichCaseV5_1` → `bdcEnrichCaseV5_2` com:
  - Escalas de score corrigidas
  - 16 variáveis canônicas alimentadas (não vazio)
  - Cálculo real de `v_financial_coherence` (5 dimensões DOC3+Apêndice)
  - Status Patch Financeiro real (verde/amarelo/laranja/vermelho)
  - Aplicação dos ~72 bloqueios via entidade `Bloqueio`
- [ ] Política de retry CRITICAL/IMPORTANT/COMPLEMENTARY no `bdcRetryWorker`

### FASE 3 — Pipeline Steps Completos (semana 3)

- [ ] Step 1: `resolverTier()` com **TODOS os 14 triggers** de escalação (Bloco 3):
  - TPV mensal, MCC alto risco, segmento T3-only (6), capability splits/crossborder, PEP, sanção, criminal, CB declarado >1%, conta encerrada, COAF/BCB declarado, rede laranja, cadeia PJ-sócia >2 níveis
- [ ] Regra **B-CNPJ-NOVO transversal** (CNPJ <6 meses → revisão manual em TODOS os tiers + subsellers)
- [ ] Step 2: `resolverCapabilities()` completo (splits/subseller, crossborder, recurrence, cap_financial_capacity_validation, cap_financial_capacity_validation_pf)
- [ ] Step 3: `resolverSegmentoMorfologia()` para 13 segmentos × 6 morfologias
- [ ] Step 9: Cross-Validation 16 campos V5.1 (não 8)
- [ ] Cross-Validations PF específicas (6 novas — pix_titularidade crítico)

### FASE 3b — Refactor Tier 3 com Módulos (Bloco 3)

- [ ] Implementar conceito **Base Tier 3 + 9 Módulos** (Gateway, Marketplace, PV fan-out, Dropshipping, Infoprodutos, Turismo, Eventos, Splits/Subseller, Crossborder pesado)
- [ ] Cada módulo: +5-15 perguntas, +3-10 docs, +5-15 CVs, +5-15 variáveis, +1-5 B-series
- [ ] Score base por segmento Tier 3 com tabela canônica (saas=110, ecommerce=150, marketplace=170, gateway=180, eventos=220, infoprodutos=240, turismo=250, dropshipping=260)

### FASE 3c — Subsellers PJ/PF (Bloco 3)

- [ ] Adicionar campo `grau` (enum A/B/C) ao `OnboardingCase`
- [ ] Adicionar campo `seller_mestre_id` (FK Tier 3) + `seller_mestre_segmento`
- [ ] Resolver Grau:
  - Subseller PJ: por TPV (A: ≤R$30k / B: R$30k-200k / C: R$200k-500k)
  - Subseller PF: por **renda mensal líquida** (A: <R$2k / B: R$2k-10k / C: >R$10k)
- [ ] Implementar fórmula: `Score_subseller = Score_base_seller_mestre × fator_grau + Σ(variáveis)` (fator A=0.4, B=0.6, C=0.8)
- [ ] Capability nova `cap_financial_capacity_validation_pf` (3 fontes — Renda × Pix + DIRPF + Fluxo Pix)
- [ ] Bloqueios PF-específicos (8 novos): B-FIN-PF-1/2/3, B-PIX-PF-1, B-PF-PROFCONS-1, B-PF-IDADE-1, B-CB-PAIS-PF-1, B-LGPDPF-SAUDE-1
- [ ] Bloqueios Subseller PJ específicos (3 novos): B-SUB-1, B-SUB-2, B-SUB-3
- [ ] Dataset crítico `pix_recebedor_titularidade` (mesmo em Grau A)
- [ ] Sanções progressivas ao seller mestre por KYC inadequado (10%/20%/30%)
- [ ] 3 modos de integração subseller (API direta / SDK Drop-in / White-label hosted)
- [ ] Webhook subseller → seller mestre com decisão

### FASE 4 — Capabilities Executáveis (semana 4)

- [ ] `cap_financial_capacity_validation` — pipeline 5 etapas (Apêndice V5.1 §A.3)
- [ ] `splits/subseller` (renomeado de cap_marketplace_kyc)
- [ ] `crossborder` (renomeado de cap_crossborder_compliance)
- [ ] `recurrence` (nova)

### FASE 5 — Questionário V5.2 (semana 5+)

- [ ] Pergunta universal `q_t2_revenue_proof` no questionário (Apêndice §A.2)
- [ ] Templates V5.2 por Tier (Tier 1 light / Tier 3 completo)
- [ ] Steps de Patch Financeiro (Tier 2+)
- [ ] Steps de Capabilities
- [ ] Steps segmento-específicos
- **Detalhes virão no Bloco 4 (QuestionarioDinamico_V5_1_Microscopico)**

### FASE 6 — UI Refatorada (semana 6+)

- [ ] Refatorar `pages/AnaliseCompleta` para V5.2 (Hero Verdict + Smart Summary + 4 abas)
- [ ] Refatorar `QuestionnaireResponsesModal` para V5.2
- [ ] Atualizar cards de fila com badges V5.2
- [ ] Botão "Reprocessar V4 → V5.2" (criar caso V5.2 com `legacyV4CaseId`)
- [ ] UI de workflow de exceções (Cat 1-5)
- **Detalhes virão no Bloco 6 (REDESIGN_AnaliseDeRisco)**

### FASE 7 — Pendente (não implementar agora — usuário já cuida)

- ⏸️ Mesa de Monitoramento Transacional (infra real-time) — **usuário já tem isso encaminhado**
- ⏸️ Dashboard real-time para Mesa de Monitoramento
- ⏸️ Workflow off-boarding ágil 24-48h

---

## ❓ Q&A — DECISÕES CONFIRMADAS PELO USUÁRIO

Ver arquivo separado: `docs/V5_2_DECISOES_USUARIO.md`

---

## 📌 PRÓXIMO PASSO

**Aguardando usuário enviar Bloco 4:**
- `QuestionarioDinamico_V5_1_Microscopico` (Sub-Entrega E1)

Depois Bloco 5 (13 segmentos) + Bloco 6 (REDESIGN) + Bloco 7 (DELTA + Apêndice).

---

## 📜 HISTÓRICO DE VERSÕES

| Versão | Data | Mudanças |
|---|---|---|
| 1.0 | 2026-05-20 | Criação inicial — consolida diagnóstico Blocos 1+2 |