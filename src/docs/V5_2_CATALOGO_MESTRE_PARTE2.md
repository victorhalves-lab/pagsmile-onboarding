# V5.2 — Catálogo Mestre — PARTE 2 (Segmentos + Bloqueios + Capabilities + Pipeline)

> Continuação de `V5_2_CATALOGO_MESTRE_PARTE1.md`.

---

## CAPÍTULO 7 — OS 15 SEGMENTOS V5.2 (microscópico)

> Cada segmento abaixo tem: descritor, gatilho de detecção, score base, perguntas adicionais T3, documentos adicionais, B-series específicos, capabilities forçadas.

### 7.1 seg_ecommerce — E-commerce (não crítico)
- **Score base T3**: 150
- **Detecção**: CNAE 47.xx + descrição "venda online de produtos" + canais com loja virtual
- **Perguntas T3 (4)**: tipo de produto (físico/digital), modelo de entrega, política de devolução publicada, marketplace de terceiros (sim/não)
- **Documentos adicionais**: nenhum específico além de Tier 3 base
- **B-series específicos**: nenhum

### 7.2 seg_marketplace — Marketplace (CRÍTICO, Tier 2 FIXO — NÃO escala para Tier 3 por volume)
- **Score base T2**: 170 (escala 0-849 V5.2)
- **Detecção**: descrição "marketplace" + capability splits + > 50 sub-merchants
- **Tier**: SEMPRE Tier 2, independente de TPV. Não há "marketplace Tier 3" no V5.2 — o módulo de marketplace é aplicado dentro do Tier 2.
- **Perguntas T2 módulo (8)**: número de sub-merchants ativos, taxa de KYC sub-merchant, take rate, política de PLD sub-merchant, modelo de retenção, base ativa de sellers, política antifraude, integração com bandeiras
- **Documentos adicionais**: D15 (PLD), Política KYC sub-merchant, Termos adesão, Screenshot, Relatório base ativa
- **B-series**: B17 (PLD inadequada), B-MKT-PROD-CRIT-1 (sub-merchants em produtos proibidos)
- **Capabilities forçadas**: `splits/subseller` + `cap_financial_capacity_validation`

### 7.3 seg_gateway — Gateway/PSP (CRÍTICO, T3-only)
- **Score base T3**: 180
- **Detecção**: declaração explícita de operar como facilitador + capability splits + autorização BCB
- **Perguntas T3 módulo (9)**: autorização BCB sub-credenciador, volume de sub-merchants, política KYC, integração com adquirentes, modelo BaaS (sim/não), retenção/repasse, monitoramento sub-merchant, política antifraude, PCI-DSS scope
- **Documentos adicionais**: D15 (PLD), D16 (BCP), D17 (PCI-DSS se PCI-scope), Autorização BCB, Política KYC sub-merchant
- **B-series**: B16 (autorização BCB ausente), B17 (PLD inadequada), B-GW-PCI-CRIT-1 (PCI-scope sem cert)
- **Capabilities forçadas**: `splits/subseller` + `cap_financial_capacity_validation`

### 7.4 seg_plataforma_vertical — Plataforma Vertical (Tier 2+ com fan-out)
- **Score base T3**: 140
- **Detecção**: vertical específica (foodtech, fitness, beauty, healthcare) + splits a prestadores
- **Perguntas T3 módulo (5)**: vertical principal, número de prestadores ativos, modelo de comissão, política de cancelamento, certificações setoriais (sanitário/CRM/CRO se saúde)
- **Documentos adicionais**: depende da vertical (AVCB foodtech, CRM saúde, AVCB beleza)
- **B-series**: B-PV-LGPD-1-CRIT (PV Saúde sem DPO e Política LGPD)
- **Capabilities**: splits/subseller (se fan-out)

### 7.5 seg_dropshipping — Dropshipping (CRÍTICO V5-12)
- **Score base T3**: 260 (mais alto entre não-críticos)
- **Detecção**: descrição "vendo sem estoque, fornecedor envia direto" + origem fornecedores internacional
- **Perguntas T3 módulo (6)**: origem fornecedores (BR/China/EUA/outros), prazo entrega declarado, política de devolução, % importação direta, declaração CDC, gestão de chargeback declarado
- **Documentos adicionais**: comprovantes fornecedores, comprovante alfandega se importação
- **B-series**: B-DS-FORN-CRIT-1 (fornecedor em país FATF alto risco sem mitigação)
- **Capabilities forçadas**: `cap_financial_capacity_validation`

### 7.6 seg_infoprodutos — Infoprodutos
- **Score base T3**: 240
- **Detecção**: descrição "cursos/ebooks/mentorias" + plataforma Hotmart/Kiwify/Eduzz como canal
- **Perguntas T3 módulo (5)**: modelo afiliados (sim/não + %), política de garantia/reembolso, plataforma usada (própria/Hotmart/Eduzz/Kiwify), coprodução, segmento do conteúdo (educação financeira/idiomas/saúde/etc.)
- **Documentos adicionais**: política de afiliados publicada, termos curso
- **B-series**: nenhum específico (alimenta variáveis de risco)
- **Capabilities**: recurrence (se assinatura)

### 7.7 seg_saas — SaaS
- **Score base T3**: 110
- **Detecção**: descrição "software por assinatura" + modelo recorrente
- **Perguntas T3 módulo (5)**: tipo SaaS (B2B/B2C/B2B2C), churn mensal declarado, modelo pricing (per-seat/feature/usage), free trial sim/não + duração, política cancelamento self-service
- **Documentos adicionais**: política de cancelamento, screenshot fluxo cancelamento (se cap recurrence)
- **Capabilities forçadas**: `recurrence`

### 7.8 seg_educacao — Educação formal
- **Score base T3**: 130
- **Detecção**: CNAE 85.xx + descrição "escola/faculdade/curso presencial"
- **Perguntas T3 módulo (5)**: modalidade (presencial/EAD/híbrido), nível (fundamental/médio/superior/livre), credenciamento MEC, regime (semestre/mensalidade), política de transferência/cancelamento matrícula
- **Documentos adicionais**: comprovante MEC (se EAD reconhecido)
- **Capabilities**: recurrence

### 7.9 seg_link_pagamento — Link de Pagamento
- **Score base T3**: 130
- **Detecção**: descrição "vendo por Instagram/WhatsApp" + sem loja virtual
- **Perguntas T3 módulo (4)**: tipo produto/serviço, canais (Insta/WhatsApp/email/SMS), volume mensal de links, política de devolução
- **Documentos adicionais**: nenhum
- **B-series**: nenhum específico

### 7.10 seg_mpe — Micro/Pequena Empresa local
- **Score base T3**: 120
- **Detecção**: MEI/ME + faturamento ≤ R$ 4,8M + segmento simples (varejo/serviço local)
- **Perguntas T3 módulo (4)**: tipo MPE (loja física/autônomo/prestador), o que vende, modalidade cartão (presencial/online/híbrido), licenciamento municipal
- **Documentos adicionais**: alvará municipal (se exigido)

### 7.11 seg_turismo — Turismo (NOVO V5.2)
- **Score base T3**: 250
- **Detecção**: CNAE 79.xx + descrição "agência/hotel/operadora turística"
- **Perguntas T3 módulo (7)**: tipo operação (agência/OTA/operadora/hotel), Cadastur ativo (número + vigência), pré-venda longa (> 90 dias?), apólice seguro turista, garantia de prestação, parceiros internacionais (FATF check), sazonalidade declarada
- **Documentos adicionais**: Cadastur ativo, Política de cancelamento turístico, Apólice de seguro
- **B-series**: B15 (Cadastur ausente)
- **Regulação**: Lei 11.771/2008 + Cadastur Ministério Turismo

### 7.12 seg_eventos — Eventos/Ticketing (NOVO V5.2)
- **Score base T3**: 220
- **Detecção**: CNAE 90.xx ou 82.30 + descrição "promotor de eventos/ticketing"
- **Perguntas T3 módulo (6)**: tipo evento (show/conferência/feira/festa), horizonte pré-venda (dias antes), capacidade média, AVCB obtido, ECAD pago, regra meia-entrada implementada (Lei 12.933/2013)
- **Documentos adicionais**: AVCB, ECAD comprovante, Apólice seguro evento, Política cancelamento Lei 12.933
- **B-series**: nenhum específico (alimenta variáveis)

### 7.13 seg_servicos_b2b — Serviços B2B (NOVO V5.2)
- **Score base T3**: 110
- **Detecção**: CNAE 70.xx, 71.xx, 73.xx + descrição "consultoria/agência/PJ-PJ"
- **Perguntas T3 módulo (4)**: tipo serviço (consultoria/agência/dev/jurídico/contábil), ticket médio contrato, número clientes B2B ativos, contrato padrão usado
- **Documentos adicionais**: contrato padrão (se ticket > R$ 50k)
- **B-series**: nenhum específico

### 7.14 seg_servicos_locais — Serviços Locais (NOVO V5.2)
- **Score base T3**: 120
- **Detecção**: CNAE 96.xx, 88.xx, 86.xx + descrição "salão/oficina/clínica/profissional liberal"
- **Perguntas T3 módulo (4)**: tipo serviço, conselho profissional ativo (CRM/CRO/CRC/OAB), modalidade (presencial/online), alvará municipal
- **Documentos adicionais**: Conselho profissional ativo (se obrigatório)
- **B-series**: B-LOC-SETOR-CRIT-1 (conselho profissional obrigatório ausente)

### 7.15 seg_crossborder — Crossborder (NOVO V5.2, CRÍTICO, T3-only)
- **Score base T3**: 280
- **Detecção**: capability crossborder + países FATF alto risco OU > 30% TPV cross
- **Perguntas T3 módulo (7)**: países origem/destino, % crossborder do TPV, moedas operadas, licença câmbio BCB, screening FATF/OFAC/UK HMT, finalidade econômica, monitoramento de remessas
- **Documentos adicionais**: Licença câmbio BCB (se aplicável), Declaração países, Sanções consultadas
- **B-series**: B-CB-PAIS-CRIT-1 (origem/destino FATF alto risco sem mitigação), B-CB-1 (sanção internacional hit)
- **Capabilities forçadas**: `crossborder` + `cap_financial_capacity_validation`

---

## CAPÍTULO 8 — CAPABILITIES TRANSVERSAIS V5.2 (4 canônicas)

### 8.1 cap_splits_subseller
- **Quando ativa**: declaração explícita + segmento marketplace/gateway/plataforma_vertical com fan-out
- **Força tier**: T3 (exceto marketplace que é T2 fixo + módulo T3-like)
- **Datasets**: + Receita PGFN, + base de sub-merchants
- **Documentos**: + Política KYC sub-merchant, Termos adesão, Screenshot, Relatório base
- **Variáveis V*: V-base_ativa_sellers, V-kyc_merchant_policy, V-bcb_authorization
- **B-series**: B16, B17, B-SUB-1, B-SUB-2, B-SUB-3

### 8.2 cap_crossborder
- **Quando ativa**: declaração + países FATF/% cross > limite
- **Força tier**: T2 (leve) ou T3 (pesado)
- **Datasets**: + sanctions_uk_hmt, country_risk_index, FATF lists, OFAC
- **Documentos**: + Licença câmbio, Declaração de países
- **B-series**: B-CB-1, B-CB-PAIS-CRIT-1

### 8.3 cap_recurrence
- **Quando ativa**: segmento SaaS/Educação/Assinaturas físicas + modelo recorrente
- **Força tier**: nenhum (transversal)
- **Documentos**: + Política cancelamento, Política devolução, Screenshot fluxo cancelamento (T3)
- **Variáveis**: V-churn, V-cancel_friction
- **B-series**: nenhum específico (alimenta variáveis)

### 8.4 cap_financial_capacity_validation
- **Quando ativa**: T2+ universalmente + T1 nos 4 críticos (V5-12)
- **Pipeline**: 5 etapas (ver Cap. 5)
- **Datasets**: + financial_market (BDC), ECF, Open Finance (T3), CFC API
- **Documentos**: + Declaração Faturamento + CRC contador (T2), + Balanço/DRE (T3)
- **Variáveis**: V-financial_coherence (0-100)
- **B-series**: B-FIN-1, B-FIN-2, B-FIN-3, B-FIN-4

---

## CAPÍTULO 9 — CATÁLOGO DE BLOQUEIOS V5.2 (~72)

### 9.1 Universais (B01-B14) — herdados V4

| Código | Severidade | Disparo | Decisão |
|---|---|---|---|
| B01 | Recusa | CNPJ situação ≠ ATIVA | Recusa imediata |
| B02 | Recusa | UBO sancionado | Recusa imediata |
| B03 | Recusa | Rep sancionado | Recusa imediata |
| B04 | Escala T3 + EDD | PEP confirmado | Escala (não recusa) |
| B05 | Recusa | Rep falecido | Recusa imediata |
| B06 | Recusa | CPF situação ≠ REGULAR | Recusa imediata |
| B07 | Recusa | Conta bancária ≠ titular CNPJ | Recusa (cliente pode corrigir) |
| B08 | Recusa | CNAE em blacklist | Recusa imediata |
| B09 | Manual | Deepfake detectado | Revisão manual obrigatória |
| B10 | Recusa | Face em sharedFaceset (base fraude) | Recusa imediata |
| B11 | Escala T3 + EDD | PEP em UBO | Escala |
| B12 | Manual | Grupo econômico com hit | Manual obrigatória |
| B13 | Manual | Conta encerrada por processador anterior | Manual obrigatória (escala T3) |
| B14 | Manual | Notificação COAF/BCB declarada | Manual obrigatória (escala T3) |

### 9.2 Tier 3 específicos (B15-B20)

| Código | Severidade | Disparo |
|---|---|---|
| B15 | Manual | Cadastur ausente em seg_turismo |
| B16 | Manual | Autorização BCB ausente em seller que declara ser sub-credenciador formal |
| B17 | Manual | Política PLD/KYC sub-merchant inadequada (NLP) |
| B18 | Manual | BCP ausente em sub-credenciador autorizado |
| B19 | Manual | PCI-DSS ausente em seller com checkout próprio captura cartão |
| B20 | Manual | Divergência > 50% entre Balanço e q_t3_annual_revenue |

### 9.3 Patch Financeiro V5.1 (B-FIN-1..4)
Ver Capítulo 5.4.

### 9.4 Transversal (B-CNPJ-NOVO)

- **Disparo**: `data_atual - data_abertura_cnpj < 180 dias`
- **Severidade**: Manual obrigatória (não recusa)
- **Aplicabilidade**: T1 + T2 + T3 + Subseller PJ
- **Estimativa de impacto**: 8-15% T1, 3-7% T2, 1-3% T3
- **Decisão típica**: aprovação com RR adicional (+2 a +8pp) + cap TPV + revalidação trimestral 1º ano

### 9.5 Subseller (B-SUB-1..3)

| Código | Disparo |
|---|---|
| B-SUB-1 | CNPJ já cadastrado em outro seller mestre PagSmile |
| B-SUB-2 | MCC do subseller incompatível com MCC do seller mestre |
| B-SUB-3 | Seller mestre suspenso/sancionado |

### 9.6 Segmento-específicos (10 críticos absolutos + ~30 não-críticos)

**Núcleo Duro Regulatório (10 absolutos — não admitem exceção de NENHUM papel):**

| Código | Segmento | Disparo |
|---|---|---|
| B03 | Universal | Rep sancionado |
| B04 (variante CRIT) | Universal | PEP de alto risco (chefe de Estado, ditador) |
| B10 | Universal | Face em base de fraude compartilhada |
| B-CB-1 | Crossborder | Hit em sanção FATF/OFAC/UK HMT |
| B-INT-1 | Universal | Insolvência declarada formal |
| B-MKT-PROD-CRIT-1 | Marketplace | Sub-merchants vendendo produtos proibidos (drogas, armas, conteúdo ilegal) |
| B-PV-LGPD-1-CRIT | PV Saúde | Plataforma de saúde sem DPO e Política LGPD |
| B-GW-PCI-CRIT-1 | Gateway | PCI-scope com checkout próprio sem certificado válido |
| B-LOC-SETOR-CRIT-1 | Serviços Locais | Conselho profissional regulado ausente (médico, dentista, advogado) |
| B-CB-PAIS-CRIT-1 | Crossborder | Origem/destino em país FATF Black/Grey list |

**Não-críticos (~30):**
- B-DS-FORN-CRIT-1 (Dropshipping fornecedor país FATF — admite mitigação)
- B-EVT-AVCB-1 (Eventos sem AVCB > 500 pessoas)
- B-EDU-MEC-1 (Educação EAD sem credenciamento MEC)
- B-B2B-CONT-1 (B2B sem contrato padrão > R$ 50k)
- + outros por segmento (V5.2 — refinamento microscópico)

---

## CAPÍTULO 10 — CROSS-VALIDATION 16 CAMPOS V5.2

> Comparação declarado vs. BDC para 16 campos canônicos. Resultado: `match | divergence | mismatch | unknown` por campo.

| # | Campo | Fonte declarada | Fonte BDC | Peso V5.2 | Bloqueio se mismatch crítico |
|---|---|---|---|---|---|
| 1 | razao_social | q_t1_company_confirm | basic_data | 5 | — |
| 2 | nome_fantasia | q_t1_company_confirm | basic_data | 3 | — |
| 3 | cnae_principal | q_t1_company_confirm | basic_data | 8 | B08 se blacklist |
| 4 | capital_social | q_t2_employees_count contexto | basic_data | 5 | — |
| 5 | endereco_receita | q_t1_company_address_confirm | basic_data | 7 | — |
| 6 | situacao_cadastral_pj | (auto) | basic_data | 10 | B01 |
| 7 | data_abertura_cnpj | (auto) | basic_data | 10 | B-CNPJ-NOVO |
| 8 | qsa_socios | q_t2_owners_25 | owners_kyc | 10 | B02 se sancionado |
| 9 | nome_rep_legal | q_t1_rep_cpf | kyc PF | 7 | — |
| 10 | situacao_cpf_rep | (auto) | kyc PF | 10 | B05 (óbito), B06 (irregular) |
| 11 | pep_status_rep | q_t2_pep_self_declaration | kyc PF + pep_international | 9 | B04 |
| 12 | pep_status_ubos | q_t2_pep_relatives | owners_kyc + pep | 9 | B11 |
| 13 | grupo_economico | q_t2_economic_group | economic_group_kyc | 8 | B12 |
| 14 | tpv_mensal_declarado | q_t1_tpv_monthly | financial_market | 8 | B-FIN-1, B-FIN-2 |
| 15 | faturamento_anual_declarado | q_t2_revenue_proof | financial_market + ECF | 9 | B-FIN-1 |
| 16 | endereco_residencial_rep | (D5 upload) | OCR + base CPF | 5 | — |

**Score Cross-Val** = Σ(peso × {match=1, divergence=0.5, mismatch=0, unknown=0.3}) / Σ(pesos) × 100

---

## CAPÍTULO 11 — PIPELINE BDC + CAF (catálogo)

### 11.1 Datasets BDC consumidos (~58 V5.2)

**Tier 1 (17 datasets):**
- PJ: basic_data, kyc PJ, owners_kyc (lista), media_profile PJ, domains, carriers_phone, carriers_email, financial_market (presunção)
- PF: kyc PF, media_profile PF, pep_international, sanctions_international, criminal_general, credit_profile_PF, carriers_phone PF, carriers_email PF, address_geocoding

**Tier 2 adiciona (+10):**
- owners_kyc DEEP (UBOs ≥ 25%), economic_group_kyc, company_group_owners, processes_PJ, processes_PF (cada UBO), warnings_interpol, pep_international (cada UBO), sanctions (cada UBO), credit_profile_PJ, mte_lista_suja

**Tier 3 adiciona (+12):**
- balanco_validation (cross-OCR), dre_validation, pld_policy_nlp (LLM analisa qualidade), bcp_nlp, pci_validation_api, license_match (BCB sub-credenciador / Cadastur), bcb_credenciados_lista, fatf_country_risk_index, sanctions_uk_hmt, ofac_sdn, properties_PF, properties_PJ

**Capabilities adicionam (+19):**
- splits/subseller: + sub_merchant_lookup, kyc_merchant_quality
- crossborder: + sanctions_uk_hmt, ofac_sdn, country_risk_index, fatf_lists
- recurrence: + cancel_friction_check (web crawl)
- financial_capacity: + ECF, Open Finance (T3), CFC API, cnpj_pgfn

### 11.2 Serviços CAF (9 padrão + condicionais)

| Serviço | T1 | T2 | T3 |
|---|---|---|---|
| DocumentDetector | ✅ | ✅ | ✅ |
| VerifAI Docs | ✅ | ✅ | ✅ (extensão) |
| Liveness | ✅ | ✅ | ✅ |
| Facematch | ✅ | ✅ | ✅ |
| sharedFaceset | ✅ | ✅ | ✅ |
| privateFaceset | ✅ | ✅ | ✅ |
| officialData | ✅ | ✅ | ✅ |
| CPF Cross-Validation | ✅ | ✅ | ✅ |
| Screening Internacional | 1 (rep) | 1 + UBOs ≥ 25% | 1 + UBOs + Compliance Officer |

**T3 biometria de UBOs obrigatória se**: módulo Splits ativa OU módulo Crossborder ativa OU UBO com hit BDC

---

## CAPÍTULO 12 — IMPLEMENTAÇÃO V5.2 (mapa para código)

### 12.1 Tabela de mapeamento Catálogo → Código

| Conceito do catálogo | Onde mora no código |
|---|---|
| 15 segmentos canônicos | `lib/v5_2/segments.js` ✅ (já implementado) |
| Constantes (DIMENSOES_ANALITICAS, BLOQUEIOS_ABSOLUTOS, SEGMENTOS_CANONICOS) | `lib/v5_2/constants.js` ✅ |
| Catálogo de perguntas (~145 IDs) | `lib/v5_2/questionsCatalog/*.js` ⏳ TODO Fase B |
| Motor de tiering (`evaluateTier`) | `lib/v5_2/tieringEngine.js` ⏳ TODO Fase B |
| Engine de questionário dinâmico | `lib/v5_2/questionnaireEngine.js` ⏳ TODO Fase B |
| Classificador subseller (Graus) | `lib/v5_2/subsellerClassifier.js` ⏳ TODO Fase I |
| Patch Financeiro (V-financial_coherence) | `lib/v5_2/financialCapacityValidator.js` ⏳ TODO Fase F |
| Cross-Val 16 campos | `lib/v5_2/crossValidation16.js` ⏳ TODO Fase F |
| Catálogo de bloqueios (~72) | Entity `Bloqueio` (já existe) + seed `seedV5_2MasterData` (já existe) |
| Catálogo de capabilities (4) | Entity `Capability` (já existe) + seed |
| Catálogo de datasets (~58) | Entity `Dataset` (já existe) + seed |
| Pipeline BDC/CAF V5.2 | `functions/bdcEnrichCaseV5_1.js` (existe — refatorar para V5.2) |
| Scoring V5.2 (5 camadas) | `lib/v5_1/scoringV5_1.js` (existe — adaptar para V5.2 tier-aware) |
| UI tela de análise V5.2 | `components/case-analysis/UnifiedRiskAnalysisV2.jsx` ⏳ TODO Fase G |

### 12.2 Fases de implementação (resumo do roadmap)

| Fase | Escopo | Status |
|---|---|---|
| **A** | Fundação: schemas + 15 segmentos + cleanup | ✅ Concluída |
| **B** | Catálogo de perguntas + engine dinâmico (`questionnaireEngine.js`) | ⏳ Em andamento |
| **C** | Motor de tiering + roteamento | ⏳ Próximo |
| **D** | Patch Financeiro + Cross-Val 16 | ⏳ |
| **E** | Catálogo de bloqueios (~72) + seed atualizado | ⏳ |
| **F** | Pipeline BDC/CAF V5.2 + datasets condicionais | ⏳ |
| **G** | UI Análise de Risco V2 (4 abas + Smart Cards) | ⏳ |
| **H** | Sentinel V5.2 (prompts especializados por segmento × tier × capability) | ⏳ |
| **I** | Subseller V5.2 (3-Grau + dinâmico) | ⏳ |
| **J** | Migração + paridade + go-live + monitoramento | ⏳ |

---

## CAPÍTULO 13 — DECISÕES V5.2 PENDENTES (`// TODO V5.2 — microscópico`)

Estes pontos precisam validação fina contra os 14 docs microscópicos restantes ANTES do go-live de produção, mas NÃO bloqueiam a implementação inicial:

1. **Microcopy oficial de cada uma das ~145 perguntas** (labels, helper text, mensagens de erro) — texto final pelo UX Writer com base nos docs E1 microscópicos
2. **Pesos exatos das 26 (T1) + 38 (T2) + 52 (T3) variáveis V-*** — calibração pelo time de Risco com base no V4 histórico
3. **Refinamento microscópico de cada um dos 13 segmentos não-críticos** — perguntas exatas, documentos, scoring base — atualmente temos estrutura, falta refinar microcopy/thresholds
4. **Lista exata de MCCs alto risco / blacklist** (atualmente herdamos do V4)
5. **Threshold exato de FATF Black/Grey list por país** (atualizar trimestralmente da FATF)
6. **Microcopy de mensagens de escalação de tier** (templates por gatilho)
7. **Cadastur API integração técnica** — endpoint, autenticação, refresh
8. **Política PLD NLP analyzer** — LLM prompt + threshold de aprovação
9. **Refinamento da matriz de exceções** (5 categorias × papel requerido)
10. **Lista exata dos 10 absolutos finais** — atualmente 10 catalogados mas validar conformidade com decisão de Compliance Officer

---

> **FIM DA PARTE 2.**
>
> Este catálogo (Parte 1 + Parte 2) é a **fonte única da verdade V5.2**. Qualquer divergência entre o que está aqui e o código deve ser resolvida em favor deste documento — ou, se este documento estiver errado, atualizar este documento PRIMEIRO antes de mexer no código.
>
> Próximo passo: implementar **Fase B (catálogo de perguntas + engine dinâmico)** baseado neste catálogo mestre.