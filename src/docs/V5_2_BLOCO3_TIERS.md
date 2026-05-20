# V5.2 — Diagnóstico Bloco 3: Tiers 1, 2, 3 + Subseller PJ + Subseller PF

**Documentos analisados:**
1. `Tier1_V5_1_Microscopico.docx` — Tier 1 (Light) — Onboarding seller direto baixo risco
2. `Tier2_V5_1_Microscopico.docx` — Tier 2 (Standard) — Onboarding seller direto risco moderado
3. `Tier3_V5_1_Microscopico.docx` — Tier 3 (Enhanced) — Onboarding seller direto alto risco
4. `SubsellerPJ_V5_1_Microscopico.docx` — Subseller PJ via agregador (Res. 96/2021)
5. `SubsellerPF_V5_1_Microscopico.md` — Subseller PF (Capítulo 8, V5.1 mais recente)

**Data do diagnóstico:** 2026-05-20

---

## 📐 ESPECIFICAÇÕES CANÔNICAS POR TIER

### TIER 1 — Light (Onboarding MEI/MPE baixo risco)

| Atributo | Valor canônico |
|---|---|
| TPV mensal | <R$ 50.000 |
| Distribuição esperada | 50-65% novos sellers |
| Perguntas visíveis | 11-14 (Tela 0 + 5 blocos) |
| Documentos | 6 obrigatórios + 1 condicional (D7 procuração) |
| Datasets BDC | ~17 datasets PJ + PF + carriers |
| Serviços CAF | 9 serviços (Liveness, FaceMatch, Documentoscopia, KYB, Credit, Sanctions ampliado V5.1) |
| Cross-validations silenciosas | 17 CVs |
| Variáveis Risk Score | 26 variáveis ativas |
| Bloqueios B-series | 10 (B01-B10) + B-CNPJ-NOVO |
| Subfaixas esperadas | 35% 1A + 45% 1B + 15% 2A + 5% outros |
| Tempo médio aprovação | 5-15 min (auto) / até 24h se Revisão Manual |
| Patch Financeiro V5.1 | ❌ Dispensado (EXCETO 4 críticos: Gateway, Marketplace, Dropshipping, Crossborder forçam) |
| Segmentos compatíveis | 7 dos 13 |
| RR típico | 0% (1A/1B) / 2% (2A) / 5% (2B) |
| Frequência revalidação | Anual (PADRÃO) / Semestral (REFORÇADO LEVE) |

**Blocos visuais:**
- Tela 0 (Pré-onboarding): CNPJ + Email + Celular
- Bloco 1 — Empresa (auto-fill Receita)
- Bloco 2 — Rep Legal + Biometria
- Bloco 3 — Negócio (TPV, MCC, descrição)
- Bloco 4 — Bancário
- Bloco 5 — Declarações (PEP, LGPD, origem lícita)

**Segmentos compatíveis Tier 1:** ecommerce, saas, plataforma_vertical (sem fan-out), servicos_b2b, servicos_locais, educacao, link_pagamento (legado V4)

**Segmentos INCOMPATÍVEIS com Tier 1:** gateway, marketplace, dropshipping, infoprodutos, eventos (grandes), turismo, crossborder

---

### TIER 2 — Standard (Onboarding seller direto risco moderado)

| Atributo | Valor canônico |
|---|---|
| TPV mensal | R$ 50.001 - R$ 500.000 |
| Distribuição esperada | 20-30% novos sellers |
| Perguntas visíveis | 16-21 (incremento ~5 sobre Tier 1) |
| Documentos | 7 obrigatórios + 2-3 condicionais (D8-D11) |
| Datasets BDC | ~26 datasets (Tier 1 + 9 adicionais) |
| Serviços CAF | 9 serviços com Screening Internacional para CADA UBO ≥25% |
| Cross-validations silenciosas | 27 CVs (17 Tier 1 + 10 novas) |
| Variáveis Risk Score | 38 variáveis (26 Tier 1 + 12 novas) |
| Bloqueios B-series | 14 (10 Tier 1 + B11/B12/B13/B14 + B-CNPJ-NOVO + B-FIN-1 a B-FIN-4) |
| Subfaixas esperadas | 20% sem RR + 65% com RR 2-5% + 15% outros |
| Tempo médio aprovação | 8-12 min (auto) / até 48h se Revisão Manual |
| Patch Financeiro V5.1 | ✅ OBRIGATÓRIO (Capability cap_financial_capacity_validation sempre ativa) |
| Segmentos compatíveis | 6 + 1 limítrofe (dos 13) |
| RR típico | 2-3% (2A) / 3-5% (2B) / 5-8% (3A) |
| Frequência revalidação | Anual (PADRÃO) / Semestral (REFORÇADO) |

**Blocos visuais novos vs Tier 1:**
- Bloco 1B — Sócios e UBOs ≥25% (novo)
- Bloco 3A — Histórico Operacional (novo: URL site, distribuição de pagamentos, faturamento, CB declarado, conta encerrada, COAF/BCB)
- Bloco 4 expandido — Faturamento mensal médio (Patch V5.1)

**Documentos novos vs Tier 1:**
- D8 — Contrato Social (obrigatório novo)
- D9 — Comprovante de endereço de cada UBO ≥25% diferente do rep (condicional)
- D10 — Procuração se aplicável (mesma lógica Tier 1)
- D11 — Comprovantes de câmbio se crossborder leve

**Bloqueios novos Tier 2:**
- B11 — PEP em UBO ≥25%
- B12 — Grupo econômico com hit
- B13 — Conta encerrada por processador anterior
- B14 — Notificação COAF/BCB declarada
- B-FIN-1/2/3/4 — Patch Financeiro V5.1

---

### TIER 3 — Enhanced (Onboarding seller direto alto risco)

| Atributo | Valor canônico |
|---|---|
| TPV mensal | >R$ 500.000 OU segmento crítico OU capability OU sinal forte |
| Distribuição esperada | 15-25% novos sellers |
| Escala de score | **0-999** (única escala ampliada) |
| Perguntas visíveis | 25+ Base + 5-15 por módulo (1-3 módulos típicos) |
| Documentos | 8-12 obrigatórios + 5-7 condicionais (D12-D17 novos) |
| Datasets BDC | ~40-58 datasets (varia por segmento + capabilities) |
| Serviços CAF | Pipeline completo + biometria UBOs ≥25% obrigatória em alguns casos |
| Cross-validations silenciosas | 35+ CVs (27 Tier 2 + 8 Base T3 + módulos) |
| Variáveis Risk Score | 52 variáveis Base + 5-15 por módulo |
| Bloqueios B-series | 20 (14 Tier 2 + B15-B20 + B-CNPJ-NOVO + módulos) |
| Subfaixas esperadas | 50% auto-aprovados (2B+3A) + 30% Revisão Manual + 20% outros |
| Tempo médio aprovação | 15-30 min (auto) / 1-5 dias úteis Revisão Manual |
| Patch Financeiro V5.1 | ✅ OBRIGATÓRIO COMPLETO (Balanço + DRE + CRC contador) |
| Segmentos compatíveis | TODOS os 13 (6 são Tier 3-only) |
| RR típico | 0-5% (1B-2A excepcional) / 5-15% (faixas altas) |
| Frequência revalidação | Trimestral / Semestral / Mensal conforme subfaixa |

**8 gatilhos de entrada Tier 3:**
1. TPV mensal >R$ 500.000
2. MCC alto risco (jogos, cripto, bets, nutracêuticos sem licença, telemarketing outbound, pharmacy sem auth)
3. Segmento Tier 3-only (Gateway, Marketplace, Dropshipping, Infoprodutos, Turismo, Eventos grandes)
4. Capability `splits/subseller` (Res. BCB 96/2021)
5. Capability `crossborder` em FATF alto risco OU >30% TPV
6. PEP/sanção/criminal confirmado
7. Histórico CB >1%, conta encerrada, COAF/BCB declarado
8. Rede de empresas-laranja OU grupo econômico com hit OU cadeia PJ-sócia >2 níveis

**Blocos visuais — Base T3:**
- Tela 0 + Bloco 1 + 1B + 2 (igual T2)
- Bloco 3 — Negócio expandido (URL + screenshot fluxos)
- Bloco 3A — Histórico Operacional (igual T2)
- Bloco 4 — Qualificação Financeira EXPANDIDO (faturamento mensal + anual último + penúltimo + upload Balanço + DRE)
- Bloco 5 — Bancário
- **Bloco 6 — Governança (NOVO T3)**: compliance officer, política PLD, BCP, PCI
- Bloco 7 — Declarações Reforçadas (+ 1 declaração regulatória específica do segmento)
- Blocos de Módulo conforme aplicável

**Documentos novos T3 Base (D12-D17):**
- D12 — Balanço Patrimonial (obrigatório >R$500k)
- D13 — DRE (obrigatório >R$500k)
- D14 — Demonstrativo 3 exercícios (condicional >R$2M/mês)
- D15 — Política PLD/FT (obrigatório com splits/subseller)
- D16 — BCP (obrigatório sub-credenciador autorizado BCB)
- D17 — PCI-DSS (condicional — só se checkout próprio)

**Bloqueios novos T3 (B15-B20):**
- B15 — Cadastur ausente (Turismo)
- B16 — Autorização BCB ausente em sub-credenciador formal
- B17 — Política PLD/KYC sub-merchant inadequada
- B18 — (outros segmento-específicos)
- B19 — Categoria proibida marketplace
- B20 — (outros)

**9 Módulos do Tier 3 (Parte B):**
1. **Módulo Gateway/PSP/Sub-credenciador** (seg_gateway): +5 perguntas, +4 docs, +5 CVs, +6 variáveis, B16/B17, +8-12 min
2. **Módulo Marketplace** (seg_marketplace): +6 perguntas, +3 docs, +4 CVs, +5 variáveis, B17, +7-10 min
3. **Módulo Plataforma Vertical com fan-out** (>50 prestadores): +5 perguntas, +3 docs, +3 CVs, +4 variáveis, +5-8 min
4. **Módulo Dropshipping** (seg_dropshipping, score base 260): +5 perguntas, +2 docs, +4 CVs, +5 variáveis, +5-8 min
5. **Módulo Infoprodutos** (seg_infoprodutos, score base 240): +5 perguntas, +2 docs, +3 CVs, +4 variáveis, +5-7 min
6. **Módulo Turismo** (seg_turismo, score base 250): +6 perguntas, +3-4 docs, +5 CVs, +6 variáveis, B15, +10-14 min
7. **Módulo Eventos grande** (seg_eventos, score base 220): +5 perguntas, +3 docs, +4 CVs, +5 variáveis, +6-9 min
8. **Módulo Capability Splits/Subseller**: +7 perguntas, +5 docs, +6 CVs, +8 variáveis, B16/B17, +10-15 min
9. **Módulo Capability Crossborder pesado**: +6 perguntas, +3 docs, +5 CVs, +6 variáveis, +8-12 min

**Score base por segmento Tier 3:**
| Segmento | Score base |
|---|---|
| seg_saas | 110 |
| seg_plataforma_vertical | 140 |
| seg_ecommerce | 150 |
| seg_servicos_b2b | 160 |
| seg_marketplace | 170 |
| seg_gateway | 180 |
| seg_eventos | 220 |
| seg_infoprodutos | 240 |
| seg_turismo | 250 |
| seg_dropshipping | 260 |
| seg_crossborder | (alto, exato no DOC4) |

**NÃO existe Tier 4** — sellers extremamente grandes (>R$50M/mês) ficam em Tier 3 com monitoramento intensificado.

---

### SUBSELLER PJ — Mediado por Tier 3 com splits/subseller

| Atributo | Valor canônico |
|---|---|
| Tipo de entidade | Pessoa Jurídica (CNPJ) — sub-merchant de Tier 3 |
| Estrutura | **3 GRAUS de Robustez** (A/B/C) — NÃO escalonados como Tiers |
| Distribuição esperada | 60-70% Grau A, 25-30% Grau B, 5-10% Grau C |
| Escala de score | 0-850 |
| Composição score | `Score_subseller = Score_base_seller_mestre × fator_grau + Σ(variáveis)` |
| Fator_grau | A=0.4, B=0.6, C=0.8 |
| Frequência revalidação | A=Anual, B=12m, C=9m |
| Cadastro | Compartilhado (seller mestre faz KYC primário via API/SDK/white-label) |

**Faixas TPV por Grau:**
- Grau A — Pequeno: ≤R$ 30k/mês
- Grau B — Médio: R$ 30k - R$ 200k/mês
- Grau C — Grande: R$ 200k - R$ 500k/mês
- Acima de R$ 500k → vira seller direto Tier 3

**Grau A (Pequeno):**
- ~8-10 perguntas total (70% pré-preenchidas via Receita)
- 4 documentos: Cartão CNPJ + comprovante endereço + RG/CNH rep + comprovante titularidade bancária
- Biometria CAF rep: Liveness + Facematch básico
- ~10 datasets BDC
- Decisão automática <30 min
- RR 0% em casos com score baixo
- Tempo total: 5-30 min via SDK/white-label

**Grau B (Médio):**
- ~12-15 perguntas (+5 sobre Grau A)
- 5 documentos: +Contrato Social
- UBOs ≥25% identificados e screenados (não apenas rep legal)
- ~17 datasets BDC
- Biometria CAF padrão completa
- Decisão automática 1-4h
- RR 2-3%
- Tempo total: 15-45 min

**Grau C (Grande):**
- ~18-22 perguntas (próximo Tier 2)
- 6 documentos: +Comprovante endereço cada UBO ≥25%
- ~22 datasets BDC (Tier 1 ampliado + alguns Tier 2 incluindo economic_group_kyc, owners_lawsuits_distribution)
- Cross-validations: owners_kyc por UBO + economic_group_kyc
- Decisão: muitas vezes Revisão Manual leve (4-24h úteis)
- RR 3-5% maioria casos
- Monitoramento reforçado leve
- Tempo total: 30-90 min

**3 Modos de integração técnica:**
1. **API direta** — seller mestre envia JSON; PagSmile valida
2. **SDK/widget Drop-in** — componente PagSmile incorporado no app do seller mestre
3. **Cadastro white-label hosted** — UI 100% PagSmile com branding do seller mestre

**3 B-series específicos:**
- B-SUB-1 — Subseller duplicado (CNPJ já cadastrado em outro seller mestre PagSmile)
- B-SUB-2 — MCC declarado incompatível com seller mestre
- B-SUB-3 — Seller mestre suspenso

**Subseller PJ herda bloqueios universais B01-B10 + B-FIN-* aplicáveis ao subseller (não ao seller mestre).**

**Não tem capability splits/subseller próprios** — subseller não pode subsubdividir.

**Sanções progressivas ao seller mestre por KYC inadequado:**
- 10% de subsellers com hits → alerta + RR +1pp no seller mestre
- 20% → revalidação obrigatória do seller mestre
- 30% → desativação temporária da capability splits

---

### SUBSELLER PF — Pessoa Física mediada por Tier 3

| Atributo | Valor canônico |
|---|---|
| Tipo de entidade | Pessoa Física (CPF) — sub-merchant de Tier 3 |
| Estrutura | **3 GRAUS de Robustez** (A/B/C) — análogo Subseller PJ |
| Distribuição esperada | 60-70% Grau A, 20-30% Grau B, 5-10% Grau C |
| Escala de score | 0-850 |
| Subfaixa notação | sufixo `-SubPF` (ex: `1A-SubPF`, `2A-SubPF`, `5-SubPF`) |
| Distribuição subfaixas | 30-40% 1A + 25-30% 1B + 15-20% 2A + outros |
| Frequência revalidação | A=Anual, B=Anual/Semestral, C=Semestral/Trimestral |

**Faixas RENDA MENSAL LÍQUIDA por Grau** (NÃO TPV — renda líquida após split):
- Grau A — Pequeno: <R$ 2.000/mês
- Grau B — Médio: R$ 2.000 - R$ 10.000/mês
- Grau C — Grande: >R$ 10.000/mês (>R$20k = alerta para formalizar PJ)

**Datasets PF (menos profundo que PJ — ~25-30 totais):**

**Grau A (~8-10 datasets PF essenciais):**
- `kyc` (PF), `sanctions_international` (PF), `sanctions_national`, `pep`, `processes` (criminal scope only), `mte_lista_suja` (PF — CPF antigo empregador escravista), `contacts_validation`, **`pix_recebedor_titularidade` ⭐ crítico**, `first_level_relatives_kyc` (PF, sob trigger), `domains` (opcional)

**Grau B (~15-18 datasets):**
- Grau A + `processes` (cível ampliado), `tax_debt` PF, `media_mentions` PF, `bcb_med_history` PF, `judicial_recovery_history`, `caged_employees` (cross-check inverso — CPF aparece como empregado?), `vehicles_registration` PF, `domains` ampliado

**Grau C (~25-30 datasets):**
- Grau B + `cnj_improbidade` PF, `bank_judicial_blocks` PF, `government_debtors_estaduais` PF, `mte_inspections_pending` PF, `real_estate_registration` PF, `intellectual_property` PF, `coaf_reports_history` PF, `second_level_relatives_kyc` (sob trigger), `country_risk_index` (sob crossborder), `warnings_interpol` PF, `conselhos_profissionais` (CFP/CFM/CRC/CREA/OAB/CRMV se profissão regulada), listas internacionais ampliadas (UK HMT/Canada SEMA/Australia DFAT/Switzerland SECO)

**Biometria CAF — sempre obrigatória 100%:**
- Liveness threshold: A=≥75, B=≥80, C=≥85
- FaceMatch: A=≥85%, B=≥90%, C=≥92%
- Documentoscopia: <50=fraude direta, 50-70=revisão manual, ≥70=aceito
- Sanctions Screening: escopo padrão A/B; ampliado V5.1 (UK HMT/CA SEMA/AU DFAT/CH SECO/Interpol) em C
- Credit Analysis CAF: NÃO em A, ✅ em B e C

**Patch Financeiro PF adaptado (3 fontes em vez de 4):**
1. Renda declarada × Volume Pix recebedor (substituí financial_market PJ)
2. DIRPF declarada (substituí ECF) — upload OBRIGATÓRIO em Grau C
3. Fluxo Pix recebedor completo (Open Finance ou extrato — substituí fluxo bancário + CRC contador)

→ **Não há equivalente do CRC contador em PF** (em geral, PF não usa contador)

**Bloqueios novos específicos PF:**
- `B-FIN-PF-1` — Divergência renda × Pix recebedor >50%
- `B-FIN-PF-2` — DIRPF omissa com renda >mínimo isento OU divergência >40%
- `B-FIN-PF-3` — Fluxo Pix com padrões anômalos
- `B-PIX-PF-1` ⭐ — Pix recebedor com titularidade ≠ subseller PF (sem vínculo familiar) — RECUSA DIRETA
- `B-PF-PROFCONS-1` — Profissão regulada sem registro ativo no conselho
- `B-PF-IDADE-1` — Idade × profissão incompatível
- `B-CB-PAIS-PF-1` — Subseller PF recebe Pix de país FATF blacklist
- `B-LGPDPF-SAUDE-1` — Subseller PF Saúde (PV Morf. A) sem framework LGPD reforçado

**6 bloqueios absolutos PF sem exceção:**
- B02, B03, B04, B-INT-1, B-CB-PAIS-PF-1, B-PIX-PF-1

**6 Vetores de risco específicos Subseller PF:**
1. Fraude de identidade (CPF roubado, deepfake)
2. Lavagem de dinheiro de baixo escalão ("mula")
3. Evasão fiscal (renda >mínimo isento sem DIRPF)
4. Vínculo empregatício disfarçado (mitigado no seller mestre, não no subseller individual)
5. LGPD breach (dados pessoais sensíveis)
6. Risco reputacional caso famoso

**Cross-Validation 16 campos adaptados PF:**
- 8 campos aplicam diretamente, alguns adaptados, 4 não aplicam
- 6 cross-checks ADICIONAIS específicos PF:
  - `cross_pix_titularidade` (crítico)
  - `cross_idade_profissao`
  - `cross_renda_patrimonio`
  - `cross_exclusividade_caged`
  - `cross_familia_pep`
  - `cross_profissao_conselho`

**Tempo de aprovação:**
- Grau A: 2-5 min
- Grau B: 5-15 min
- Grau C: 30 min - 2h (+ Revisão Manual em 20-30% casos)

**Caminhos de decisão (5):**
1. Aprovação automática (70-80%)
2. Aprovado com Condições (15-20%)
3. Revisão Manual (5-10%)
4. Recusa direta (1-3%)
5. Erro técnico (<1%)

**RR Composto 4-dim PF:**
- RR_base_subfaixa + ajuste_segmento_seller_mestre (±0-3%) + ajuste_capability (+1-2% crossborder) + ajuste_risco_pf (+0-5%)
- Range típico: 0% - 25%

**Princípios reforçados PF:**
- V5-10 Inclusão Financeira (reforçado — Subseller PF é foco primário)
- V5-11 Capacidade Financeira (adaptado — Grau B leve, Grau C completo)

**Documentação UX mobile-first absoluto:**
- 99% acessos via smartphone
- Tempos máximos: A=5min, B=15min, C=45min
- Linguagem sem jargão ("KYC", "PLD")
- Comunicação respeitosa em recusas
- Suporte humano acessível

---

## ✅ JÁ IMPLEMENTADO E ALINHADO

### Lib v5_1 — taxonomia tier
- ✅ Identifica 5 tiers: tier_1, tier_2, tier_3, subseller_pj, subseller_pf
- ✅ Resolução básica por TPV
- ✅ Marketplace fixo em Tier 2

### Entidades
- ✅ `OnboardingCase.tier` com enum correto
- ✅ `ComplianceScore.tier_v5_1`
- ✅ Subfaixa tier-aware com sufixo (ex: 2A-T3, 1A-SubPF)

### Pipeline router
- ✅ Despacha V4 vs V5.1 por DNA imutável

---

## ❌ GAPS CRÍTICOS DO BLOCO 3

### Gap 1 — Resolução de Tier incompleta

**Doc Tier 1 §4.2.2 lista 8+ gatilhos de escalação automática.** Meu código atual em `lib/v5_1/tiers.js` resolve **somente por TPV**. Faltam triggers:

| Trigger | Status |
|---|---|
| TPV mensal | ✅ Implementado |
| MCC alto risco | ❌ Falta |
| Segmento Tier 3-only (6 segmentos) | ❌ Falta |
| Capability `splits/subseller` (força T3) | ❌ Falta |
| Capability `crossborder` em FATF alto risco / >30% TPV | ❌ Falta |
| PEP em rep/sócio/UBO/familiar 1º grau | ❌ Falta |
| Sanção internacional | ❌ Falta |
| Histórico criminal grave em rep ou UBOs | ❌ Falta |
| Histórico CB declarado >1% | ❌ Falta |
| Conta encerrada por processador anterior | ❌ Falta |
| Notificação COAF/BCB declarada | ❌ Falta |
| Rede de empresas-laranja | ❌ Falta |
| Cadeia PJ-sócia >2 níveis | ❌ Falta |
| **B-CNPJ-NOVO** (CNPJ <6 meses → revisão manual) | ❌ Falta |

### Gap 2 — Composição de score Subseller PJ/PF errada

**Doc Subseller PJ §7.10.2 define fórmula específica:**
```
Score_subseller = Score_base_seller_mestre × fator_grau + Σ(variáveis)
```
- Fator_grau: A=0.4, B=0.6, C=0.8

**Meu `scoringV5_1.js` atual:** trata Subseller como tier normal com score 0-999. **Está errado em 2 pontos:**
1. Escala deveria ser 0-850 (não 0-999)
2. Score base deveria HERDAR do seller mestre, não usar tabela própria

### Gap 3 — Graus A/B/C não implementados

**Subseller PJ e Subseller PF têm 3 GRAUS, não tiers escalonados.** Meu schema `OnboardingCase` tem `tier="subseller_pj"` mas **não tem campo `grau`**.

**Falta:**
- Campo `grau` no `OnboardingCase` (enum: A, B, C)
- Campo `seller_mestre_id` (FK obrigatória para subseller)
- Resolução de Grau por:
  - Subseller PJ: TPV mensal
  - Subseller PF: **renda mensal líquida** (não TPV)
- Cálculo de score com fator_grau

### Gap 4 — Modos de integração subseller ausentes

**3 modos de integração definidos:** API direta / SDK Drop-in / White-label.

**Meu código não tem:**
- Distinção entre os modos
- SDK PagSmile para incorporação
- White-label com branding customizável por seller mestre
- Webhook back para seller mestre com decisão

### Gap 5 — Score base por segmento Tier 3 errado

**Doc Tier 3 §6.4.2 define tabela canônica:**
```
seg_saas → 110
seg_plataforma_vertical → 140
seg_ecommerce → 150
seg_servicos_b2b → 160
seg_marketplace → 170
seg_gateway → 180
seg_eventos → 220
seg_infoprodutos → 240
seg_turismo → 250
seg_dropshipping → 260
seg_crossborder → (alto)
```

**Meu `scoringV5_1.js`** usa valores diferentes. Precisa ser corrigido para essa tabela canônica.

### Gap 6 — Módulos do Tier 3 ausentes

**Doc Tier 3 Parte B lista 9 módulos (6.19-6.27).** Cada módulo adiciona:
- 5-15 perguntas
- 3-10 documentos
- 5-15 cross-validations
- 5-15 variáveis Risk Scoring
- 1-5 B-series específicos

**Meu código:**
- ❌ Não implementa o conceito de "módulo" no Tier 3
- ❌ Tier 3 atual é tratado como agnóstico ao segmento
- ❌ Não há perguntas/documentos/CVs módulo-específicas

**Necessário:** repensar arquitetura do Tier 3 para suportar Base + Módulos.

### Gap 7 — Patch Financeiro PF adaptado ausente

**Doc Subseller PF §8.A define Patch Financeiro PF com 3 fontes** (não 4 como PJ — sem CRC contador):
1. Renda declarada × Volume Pix recebedor
2. DIRPF declarada
3. Fluxo Pix recebedor completo

**Meu código** tem o Patch PJ (`cap_financial_capacity_validation`) mas **não tem versão adaptada PF**. Precisa criar `cap_financial_capacity_validation_pf` separada.

### Gap 8 — Bloqueios PF-específicos ausentes

**Doc Subseller PF §8.19 lista 8 bloqueios PF-específicos:**
- B-FIN-PF-1, B-FIN-PF-2, B-FIN-PF-3
- B-PIX-PF-1 ⭐
- B-PF-PROFCONS-1
- B-PF-IDADE-1
- B-CB-PAIS-PF-1
- B-LGPDPF-SAUDE-1

**Meu seed atual:** 0 deles existem. Precisam ser adicionados ao `Bloqueio` entity.

### Gap 9 — Dataset `pix_recebedor_titularidade` crítico ausente

**Doc Subseller PF §8.15.3** afirma que `pix_recebedor_titularidade` é **dataset crítico em QUALQUER Grau (mesmo A)** — defesa primária anti-fraude PF.

**Meu seed atual de Dataset:** ❌ Não existe esse dataset registrado.

### Gap 10 — Bloqueios Subseller PJ específicos ausentes

**Doc Subseller PJ §7.19** lista 3 bloqueios próprios:
- B-SUB-1 — Subseller duplicado (CNPJ em outro seller mestre)
- B-SUB-2 — MCC incompatível com seller mestre
- B-SUB-3 — Seller mestre suspenso

**Meu seed atual:** 0 deles existem.

### Gap 11 — Sanções progressivas ao seller mestre ausentes

**Doc Subseller PJ §7.3.3** define mecanismo de **sanções progressivas ao seller mestre** por KYC inadequado dos subsellers:
- 10% subsellers com hits → alerta + RR +1pp no seller mestre
- 20% → revalidação obrigatória do seller mestre
- 30% → desativação temporária da capability splits

**Meu código:** ❌ Não tem nada disso. Precisa de função `evaluateSellerMestreSubsellerKYCQuality()`.

### Gap 12 — Cross-Validations específicas PF ausentes

**Doc Subseller PF §8.17.3** lista 6 cross-checks específicos PF além dos 16 canônicos V5.1:
- `cross_pix_titularidade` (crítico)
- `cross_idade_profissao`
- `cross_renda_patrimonio`
- `cross_exclusividade_caged`
- `cross_familia_pep`
- `cross_profissao_conselho`

**Meu código:** ❌ Não implementa nenhum.

### Gap 13 — Subfaixas Tier 3 com escala 0-999 não validadas

**Doc Tier 3** confirma escala 0-999 com subfaixas específicas (DOC2 §9.1 do GLOSSARIO):
- 1A: 0-150 / 1B: 151-300 / 2A: 301-450 / 2B: 451-550 / 3A: 551-650 / 3B: 651-750 / 4: 751-850 / 5: **851-999**

**Meu `subfaixasTierAware.js`:** Precisa ser validado se segue essa tabela. (Marcado para correção desde Bloco 1 — Q4 confirmada.)

### Gap 14 — `seller_mestre_id` ausente em OnboardingCase

**Subseller (PJ ou PF) precisa de FK obrigatória ao seller mestre.** Meu schema `OnboardingCase` não tem campo `seller_mestre_id` nem `seller_mestre_segmento`.

### Gap 15 — Pipeline de webhook ao seller mestre

**Doc Subseller PJ §7.2.4** e §7.21 definem que **toda decisão de subseller deve disparar webhook ao seller mestre** com:
- Resultado (Aprovado/Aprovado c/ Condições/Revisão Manual/Recusado)
- Bloqueios acionados (com mensagem-padrão)
- Próximas ações

**Meu código:** ❌ Não há infraestrutura de webhook back para seller mestre.

### Gap 16 — Política de revalidação periódica por subfaixa

**Doc Tier 3 §6.17** define revalidação MAIS FREQUENTE que Tiers 1/2:
- Subfaixa 1B-2A: 12 meses
- Subfaixa 2B-3A: 6 meses
- Subfaixa 3B+: 3 meses ou contínuo

**Subseller PJ §7.23.1:**
- Grau A: 18 meses
- Grau B: 12 meses
- Grau C: 9 meses

**Subseller PF §8.23.1:** varia conforme Grau e monitoramento.

**Meu código:** ❌ Não tem worker de revalidação por subfaixa/Grau.

### Gap 17 — Caminho UX White-label para subseller

**Doc Subseller PJ §7.2.3** define modo white-label com:
- URL própria do seller mestre redirecionando para landing PagSmile
- Identidade visual customizada por seller mestre
- Integração via webhook

**Meu código:** ❌ Não tem rota nem mecanismo de branding customizável.

### Gap 18 — `B-CNPJ-NOVO` transversal ausente

**Regra TRANSVERSAL aplicada em TODOS os tiers + Subsellers** (Tier 1 §4.13.1, Tier 2 §5.13.1, Tier 3 §6.13.1):

"CNPJ <6 meses → REVISÃO MANUAL OBRIGATÓRIA independente do score V5"

**Estimativa de impacto:** 8-15% Tier 1, 3-7% Tier 2, 1-3% Tier 3.

**Meu código:** ❌ Não implementa B-CNPJ-NOVO em lugar nenhum.

---

## 📌 DECISÕES TOMADAS (2026-05-20)

### ⚠️ DIRETIVA CRÍTICA — Subseller segue modelo atual

**Não inventar nova arquitetura para Subseller.** O modelo OPERACIONAL continua igual ao V4:
- Painel admin gera **link de subseller** segmentado por cliente fechado
- Cliente compartilha link com seus subsellers (PJ ou PF)
- Subseller preenche questionário, faz upload de docs
- PagSmile valida + enriquece + decide
- Funcionalidade já existe em `pages/GerenciarSubsellerLinks`, `pages/SubsellerQuestionnaire`, `pages/SubsellerDocUpload`, `functions/generateSubsellerLink`, `functions/scoreSubseller`

**O que muda no V5.2:**
- ✅ Perguntas do questionário (V5 tier-aware por Grau)
- ✅ Lista de documentos
- ⚠️ Algumas queries BDC (datasets PF novos)
- ❌ CAF segue exatamente igual
- ❌ Não criar webhooks, SDKs, ou "modos de integração"

### Q13 e Q14 — DESCARTADAS (inventei conceitos que não existem no V4 atual)

### ✅ Q15 — Pix recebedor titularidade: **BDC**
### ✅ Q16 — DIRPF Grau C: **Upload pelo cliente** (sem integração Receita)

---

## 📊 Resumo Bloco 3

| Item | Status | Volume |
|---|---|---|
| Resolução de Tier completa (todos os triggers) | ❌ Falta | 14 triggers a implementar |
| Conceito de Graus A/B/C para subsellers | ❌ Falta | Schema + lógica |
| Score com fator_grau para subsellers | ❌ Falta | Fórmula adaptada |
| Tier 3 com 9 módulos | ❌ Falta | Refactor arquitetural |
| Patch Financeiro PF adaptado | ❌ Falta | Capability nova |
| Bloqueios PF-específicos (8) | ❌ Falta | Seed + lógica |
| Bloqueios Subseller PJ específicos (3) | ❌ Falta | Seed |
| Dataset `pix_recebedor_titularidade` crítico | ❌ Falta | Seed + integração |
| Sanções progressivas ao seller mestre | ❌ Falta | Worker novo |
| Cross-validations PF específicas (6) | ❌ Falta | Funções |
| `seller_mestre_id` em OnboardingCase | ❌ Falta | Schema |
| Webhook subseller → seller mestre | ❌ Falta | Infra nova |
| Revalidação periódica por subfaixa/Grau | ❌ Falta | Worker novo |
| White-label hosted para subseller | ❌ Falta | Rota + branding |
| Regra B-CNPJ-NOVO transversal | ❌ Falta | Função em pipeline |
| Score base segmento Tier 3 | ⚠️ Parcial | Validar/corrigir valores |
| Subfaixas Tier 3 escala 0-999 | ⚠️ Já flagado Bloco 1 | Validar/corrigir |