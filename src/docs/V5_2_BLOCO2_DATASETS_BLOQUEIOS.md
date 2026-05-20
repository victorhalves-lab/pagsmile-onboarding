# V5.2 — Diagnóstico Bloco 2: Datasets + Bloqueios

**Documentos analisados:**
1. `DOC3_Datasets_BDC.md` (V5.1) — 58 datasets em 9 blocos
2. `DOC5_V5_2_RECALIBRADO.md` (V5.2) — 72 bloqueios recalibrados

**Data do diagnóstico:** 2026-05-20

---

## ✅ JÁ IMPLEMENTADO E ALINHADO

### Entidades base
- ✅ `Dataset` (schema correto)
- ✅ `Bloqueio` (schema MAS faltam 8 campos V5.2)
- ✅ `Capability` (schema correto)
- ✅ `Exception` (schema MAS falta Cat 5)
- ✅ `Snapshot`

### Dados seedados (amostra)
- ✅ ~10 datasets: `bdc_basic_data, bdc_kyc_company, bdc_kyc_owners, bdc_processes, bdc_activity_indicators, cfc_crc_status, ecf_revenue, of_pix_inflows, portal_transparencia_rde`
- ⚠️ ~10 bloqueios com **IDs ERRADOS**: `B-KYB-30/31, B-OPE-10/11/20/21, B-FIN-03/04/05`
- ✅ 4 capabilities (nomes precisam virar canônicos)

---

## ❌ GAPS CRÍTICOS

### Gap 1 — DATASETS: 10 de 58 (faltam ~48)

**Bloco A — Cadastrais (3 faltam):**
- `registration_data`, `history_basic_data`, `company_evolution`

**Bloco B — KYC/Sanções/PLD-FT (7 faltam):**
- `first_level_relatives_kyc`, `pep_international`, `sanctions_international` (escopo ampliado), `warnings_interpol`, `economic_group_kyc`, `kyc`, `sanctions_national`

**Bloco C — Processos/Dívidas (5 faltam):**
- `lawsuits_distribution_data`, `owners_lawsuits`, `owners_lawsuits_distribution`, `government_debtors`, `collections`, `cadin_estaduais`, `cnj_improbidade`

**Bloco D — Sócios/QSA (5 faltam):**
- `relationships`, `configurable_recency_qsa`, `political_involvement`, `owners_influence`, `owners_electoral_donors`, `second_level_relatives_kyc`, `pep_history_5_years`

**Bloco E — Atividade Operacional (4 faltam):**
- `domains`, `phones`, `emails`, `addresses`

**Bloco F — Reputação Digital (6 faltam):**
- `media_profile_and_exposure_pj`, `reputations_and_reviews`, `awards_and_certifications`, `news`, `google_places_api`, `mid_internacional_tier1`

**Bloco G — Financeiro/Grupo (11 faltam):**
- `financial_market`, `economic_group`, `economic_group_relationships`, `merchant_category_data`, `credit_risk`, `credit_report`, `bcb_scr_pj_historico`, `bank_judicial_blocks`, `bcb_med_history`, `bank_account_closure_history`, `bcb_pix_anti_bolcao`, `bank_relationship_history`

**Bloco H — ESG/Setorial (8 faltam):**
- `esg_and_compliance`, `kyb_business_identity`, `anvisa_violations_pending`, `cadastur_active`, `crmv_active`, `avcb_bombeiros`, `conselhos_profissionais`, `mte_inspections_pending`

**Bloco I — PF/Subseller (3 faltam):**
- `scr_positive_score`, `presumed_income`, `labor_dispute_density`

**Decisão Q10:** criar todos com flag `ativo=false` para os não-contratados.

---

### Gap 2 — BLOQUEIOS: 10 com IDs errados, faltam 72 canônicos

**Codigos canônicos DOC5 V5.2:**

**Núcleo duro INTOCÁVEL (9 bloqueios — todos faltam):**
- B03 SANCAO_DIRETA
- B04 FAMILIAR_SANCIONADO_PF
- B08 TRABALHO_ESCRAVO_LISTA_SUJA
- B-PLD-2 SUB_CREDENCIADOR_SEM_KYC_SUBMERCHANTS
- B-PLD-4 CRIPTO_FOREX_SEM_LICENCIAMENTO
- B-CB-1 CROSSBORDER_PAIS_FATF_BLACKLIST
- B-INT-1 INTERPOL_RED_NOTICE
- B-MKT-PROD-CRIT-1 MARKETPLACE_CATEGORIA_PROIBIDA
- B-PV-LGPD-1-CRIT PV_SAUDE_SEM_DPO_ESPECIALIZADO

**Recusa direta complementares (4 faltam):**
- B02 CPF_IRREGULAR
- B10 FAMILIAR_SANCIONADO_SOCIO_PJ
- B-CB-2 FOREX_SEM_LICENCIAMENTO_BCB
- B-GW-PCI-CRIT-1 GATEWAY_SEM_PCI_DSS
- B-LOC-SETOR-CRIT-1 POUSADA_SEM_AVCB
- B-LOC-MED-1 VETERINARIA_SEM_CRMV
- B-CB-PAIS-CRIT-1 CROSSBORDER_PAIS_BLACKLIST (segmento)
- B-CB-FOREX-1 CROSSBORDER_SEM_FOREX_LICENSING

**V4 evoluídos (faltam recalibrados V5.2):**
- B01 CNPJ_INAPTO
- B05 SHELL_COMPANY_SEVERO (recalibrado — saiu de Recusa)
- B06 DIVIDA_ATIVA_CRITICA (recalibrado — thresholds dobrados)
- B07 MIDIA_NEGATIVA_GRAVE (Tier 1/2 vai pra Cond.)
- B09 EMBARGO_AMBIENTAL

**Família B-FIN (4 — meus IDs estão errados, são B-FIN-03/04/05):**
- B-FIN-1 DIVERGENCIA_TPV_CRITICA (recalibrado V5.2)
- B-FIN-2 TPV_VS_ECF_DIVERGENTE
- B-FIN-3 CRC_CONTADOR_INATIVO
- B-FIN-4 FLUXO_BANCARIO_INCOMPATIVEL (recalibrado V5.2)

**Família B-PLD (8 faltam):**
- B-PLD-1 SUB_CREDENCIADOR_SEM_POLITICA_PLD (recalibrado V5.2)
- B-PLD-3 SUB_CREDENCIADOR_SEM_CO
- B-PLD-5 HISTORICO_COAF_RECORRENTE
- B-PLD-6 ANTI_BOLCAO_PIX_AUSENTE
- B-PLD-7 BLOQUEIO_JUDICIAL_BANCARIO
- B-PLD-8 MED_PIX_RECORRENTE

**Capabilities transversais (faltam):**
- B-CAP-SPLITS-1 KYC_SUBMERCHANTS_INCOMPLETO
- B-CNJ-IMPROB-1 CONDENACAO_IMPROBIDADE (recalibrado V5.2)

**Segmento-específicos (~45 faltam):**
- E-commerce: B-EC-CB-1 (Cond.+Mon), B-EC-LOG-1 (Cond.+Mon), B-EC-LGPD-1
- Marketplace: B-MKT-KYC-1, B-MKT-OFFB-1
- Gateway: B-GW-BAAS-1, B-GW-FRAUD-1
- SaaS: B-SAAS-CHURN-1 (Cond.+Mon), B-SAAS-LGPD-1
- Infoprodutos: B-INFO-PYR-1, B-INFO-AFF-1 (Cond.+Mon), B-INFO-GAR-1 (Cond.)
- Plataforma Vertical: B-PV-PROF-1 (recalibrado), B-PV-MORPH-CRIT
- Turismo: B-TUR-CAD-1, B-TUR-CB-1 (Cond.+Mon)
- Eventos: B-EVT-CAP-1 (recalibrado), B-EVT-CANC-1 (Cond.+Mon), B-EVT-INS-1, B-EVT-AVCB-1
- Serviços B2B: B-B2B-CONC-1 (Cond.+Mon), B-B2B-IP-1, B-B2B-DPA-1
- Dropshipping: B-DS-FORN-CRIT-1 (recalibrado), B-DS-LOG-1 (Cond.+Mon), B-DS-CB-1 (Cond.+Mon)
- Serviços Locais: B-LOC-LABOR-1
- Educação: B-EDU-MEC-1, B-EDU-REF-1 (Cond.+Mon), B-EDU-CERT-1 (Cond.+Mon)
- Crossborder: B-CB-CORR-1

**Decisão Q11:** deletar todos os 10 atuais e recriar com IDs canônicos.

---

### Gap 3 — Schema `Bloqueio` precisa 8 campos novos V5.2

**Adicionar:**
- `decisao_padrao` (enum: `recusa_direta`, `revisao_manual`, `aprovado_condicoes_monitoramento`, `aprovado_condicoes`, `aprovado`)
- `decisao_v5_1_anterior` (enum — rastreabilidade da recalibragem)
- `nucleo_duro_regulatorio` (bool — true para 9 bloqueios INTOCÁVEIS)
- `admite_categoria_5` (bool)
- `plano_monitoramento_template` (objeto JSON)
- `tpv_cap_inicial_pct` (number)
- `rolling_reserve_adicional_pct` (number)
- `gatilhos_off_boarding_agil` (array de strings)

**Severidade atual:** `[BLOQUEIO, ESCALACAO, CONDICAO, ALERTA]` — manter mas garantir mapeamento para `decisao_padrao` canônica V5.2.

---

### Gap 4 — Schema `Exception` precisa Categoria 5

**Adicionar no enum `categoria`:**
- `cat_5_monitoramento_intensivo`

**Adicionar campos para Cat 5:**
- `plano_monitoramento_id` (FK → nova entidade `PlanoMonitoramento`)
- `termo_adicional_v5_2_hash`
- `tpv_cap_inicial_pct`
- `rolling_reserve_adicional_pct`
- `kpis_monitorados` (array)
- `gatilhos_off_boarding_agil` (array)
- `condicoes_para_saida` (array)
- `mesa_monitoramento_atribuida` (objeto)

---

### Gap 5 — Função `aplicar_matriz_decisao_v5_2()` não existe

**Pseudocódigo canônico DOC5 V5.2 §56.4:**

```
1. NÚCLEO_DURO_V5_2 (~17 bloqueios) → Recusa direta sem exceção
2. BLOQUEIOS_OPERACIONAIS_CLIENTE_V5_2 (~14 bloqueios) → Cat 5 automática
3. BLOQUEIOS_REVISAO_MANUAL_V5_2 (~30 bloqueios) → Revisão Manual
4. Aprovado c/ Cond. padrão
5. Aprovado (default)
```

**3 listas canônicas HARDCODED** no código (DOC5 V5.2 §2.1 + §56):
- `NUCLEO_DURO_V5_2` = {B02, B03, B04, B08, B10, B-PLD-2, B-PLD-4, B-CB-1, B-CB-2, B-CB-PAIS-CRIT-1, B-CB-FOREX-1, B-INT-1, B-MKT-PROD-CRIT-1, B-GW-PCI-CRIT-1, B-PV-LGPD-1-CRIT, B-LOC-SETOR-CRIT-1, B-LOC-MED-1}
- `BLOQUEIOS_OPERACIONAIS_CLIENTE_V5_2` = {B-EC-LOG-1, B-EC-CB-1, B-SAAS-CHURN-1, B-INFO-AFF-1, B-INFO-GAR-1, B-B2B-CONC-1, B-EDU-REF-1, B-EDU-CERT-1, B-EVT-CANC-1, B-DS-LOG-1, B-DS-CB-1, B-TUR-CB-1, B07_tier_1_2, B09_sob_recurso, B-PLD-8_volume_baixo}
- `BLOQUEIOS_REVISAO_MANUAL_V5_2` = ~30 bloqueios (lista em §56.2)

---

### Gap 6 — Entidade `PlanoMonitoramento` ausente

Estrutura DOC5 V5.2 §50:
- `plano_monitoramento_id`, `framework_version`, `categoria_excecao=5`, `case_id`, `seller_id`, `bloqueio_origem`
- `data_inicio_monitoramento`, `duracao_meses`, `data_revalidacao_proxima`
- `compromissos_seller` (objeto: tpv_cap_inicial_pct, rolling_reserve_adicional_pct, obrigacoes_operacionais, termo_adicional_v5_2_assinado)
- `kpis_monitorados` (array — cada KPI com frequencia + threshold_alerta + threshold_critico)
- `gatilhos_escalacao_revisao_manual` (array)
- `gatilhos_off_boarding_agil` (array)
- `responsavel_aprovacao` (objeto)
- `mesa_monitoramento_atribuida` (objeto)
- `condicoes_para_saida_do_monitoramento` (array)
- `historico_eventos` (array)
- `audit_hash`

**Retenção:** 10 anos.

---

### Gap 7 — Entidade `TermoAdicionalV5_2` ausente

Sem assinatura digital do seller, "a aprovação Categoria 5 não é completada" (§50.3).

Campos mínimos:
- `id`, `case_id`, `seller_id`, `plano_monitoramento_id`
- `reconhecimento_monitoramento` (bool)
- `compromissos_operacionais` (array)
- `tpv_cap_inicial_pct_aceito`
- `rolling_reserve_adicional_pct_aceito`
- `aceite_revalidacao_trimestral` (bool)
- `aceite_gatilhos_off_boarding` (bool)
- `data_assinatura`
- `ip_assinatura`
- `hash_integridade` (SHA-256)

---

### Gap 8 — Mesa de Monitoramento Transacional

**Decisão Q9:** ⏸️ **Usuário já cuida disso fora do escopo de código** — NÃO implementar:
- Dashboard real-time
- Workflow off-boarding ágil 24-48h
- Sistema de alertas tempo-real

**Mas SIM implementar estrutura de dados** (`PlanoMonitoramento`, `TermoAdicionalV5_2`) para suportar quando a Mesa precisar consumir/gravar.

---

### Gap 9 — Mapeamento dataset → bloqueio → variável incompleto

DOC3 detalha 12 atributos por dataset incluindo `bloqueios_alimentados` e `variaveis_alimentadas`. Maioria dos meus datasets seedados está vazia nesses campos.

---

### Gap 10 — Política de retry CRITICAL/IMPORTANT/COMPLEMENTARY ausente

DOC3 §26 define 3 prioridades:
- CRITICAL: 5min, 10 tentativas, timeout 24h
- IMPORTANT: 30min, 8 tentativas, timeout 72h
- COMPLEMENTARY: 2h, 6 tentativas, timeout 7 dias

`bdcRetryWorker` atual é genérico — não diferencia.

---

## 📌 DECISÕES TOMADAS NO BLOCO 2

Ver `docs/V5_2_DECISOES_USUARIO.md` (Q8-Q12).

**Resumo:**
- Q8: Migrar para V5.2
- Q9: Mesa de Monitoramento já tem (não implementar)
- Q10: Criar 58 datasets (ativo=false para não-contratados)
- Q11: Renomear bloqueios para canônicos
- Q12: Só diagnóstico, implementar tudo no fim