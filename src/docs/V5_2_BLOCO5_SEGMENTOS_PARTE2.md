# V5.2 — BLOCO 5 (PARTE 2/5): Segmentos Crossborder, Dropshipping, Eventos

**Data:** 20/05/2026
**Status:** Diagnóstico microscópico — Parte 2 de 5 (segmentos 4-6 de 13)
**Documentos-fonte analisados:**
- `Crossborder_V5_1_Microscopico.md` (2.090 linhas)
- `Dropshipping_V5_1_Microscopico.docx` (2.193 linhas)
- `Eventos_V5_1_Microscopico.md` (2.730 linhas)

---

## 0. Tabela de progresso Bloco 5

| # | Segmento | Status | Tier policy | Perguntas | Crítico? |
|---|----------|--------|-------------|-----------|----------|
| 1 | Ecommerce | ✅ Parte 1 | Por TPV | 6 | Não |
| 2 | Eventos | ✅ Parte 2 | Por TPV | 6 | Não (op. sensível) |
| 3 | Infoprodutos | ✅ Parte 1 | Por TPV | 6 | Não |
| 4 | **Crossborder** | ✅ **Parte 2** | **Tier 3-only** | **6** | **Sim (#4 críticos)** |
| 5 | **Dropshipping** | ✅ **Parte 2** | **Tier 3-only** | **6** | **Sim (#2 críticos)** |
| 6 | Marketplace | ⏳ Próximo | Tier 2 fixo | 6 | Sim (#3 críticos) |
| 7 | Gateway | ⏳ Pendente | Tier 3-only | 6 | Sim (#1 críticos) |
| 8-13 | Turismo, Educação, SaaS, Plataforma Vertical, Link Pagamento, FoodTech, MPE, Pix | ⏳ Pendente | Por TPV | 6 cada | Não |

**Progresso:** 5/13 segmentos diagnosticados.

---

## 1. SEGMENTO CROSSBORDER (`seg_crossborder`)

### 1.1 Identidade do segmento
- **Tier policy:** Tier 3-only sem exceção (independente de TPV)
- **Ranking:** #4 dos 4 críticos por magnitude; **#1 em complexidade regulatória**
- **Característica única:** envolve travessia de fronteira nacional brasileira em pelo menos uma perna da transação
- **Patch V5.1 com extensão_fx** — única capability transversal que ganha extensão específica

### 1.2 As 3 Morfologias canônicas (NOVA TAXONOMIA)

| Cod | Morfologia | Definição | Risk PagSmile |
|-----|------------|-----------|---------------|
| **A** | Export | Seller BR vende para exterior | Médio |
| **B** | Import | Seller estrangeiro vende para consumidor BR | Alto |
| **C** | Pass-through | Operação Exterior→BR→Exterior | Muito alto |

### 1.3 Distinção CRÍTICA: capability `crossborder` vs segmento `seg_crossborder`
- **capability transversal:** seller de outro segmento ativa para complementar
- **segmento `seg_crossborder`:** modelo de negócio PRINCIPAL é operar crossborder (Tier 3-only)
- **Regra:** > 70% de receita doméstica = segmento doméstico + capability; > 70% crossborder = `seg_crossborder`

### 1.4 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_crossborder_morphology` | Morfologia A/B/C | **Crítica** |
| 2 | `q_seg_crossborder_jurisdictions` | Lista países + % por jurisdição | **Crítica** |
| 3 | `q_seg_crossborder_fx_volume` | Volume USD-eq mensal | Alta |
| 4 | `q_seg_crossborder_settlement_model` | BR-account/conta estrangeira/multi-currency/híbrido | Alta |
| 5 | `q_seg_crossborder_tax_regime` | IOF/IRRF/ISS/ICMS-DIFAL/Drawback (8 regimes) | Alta |
| 6 | `q_seg_crossborder_partner_chain` | Corretora+banco+processadora+custodiante | Alta |

**Total perguntas Crossborder:** 52 universais + 1 q_t2_revenue_proof + 6 segmento = **59 perguntas** (o mais longo do framework V5.1).

### 1.5 Subfaixas operacionais

| Subfaixa | Critério | Tratamento |
|----------|----------|------------|
| **FX-Emergente** | < USD 100k/mês OU CNPJ < 24m OU só FATF tier 1 | Tier 3 base + extensão_fx + análise trimestral |
| **FX-Operacional** | USD 100k-2M + mix FATF tier 1+2 | + parecer cambial inicial + análise mensal |
| **FX-Institucional** | > USD 2M OU > 5 jurisdições OU offshore declarado | + parecer cambial obrigatório + visita técnica + reanálise semestral |

### 1.6 Os 4 regimes cambiais reconhecidos (Lei 14.286/2021)
1. **Câmbio Pronto** (até USD 500k, sem contrato formal abaixo de USD 10k) — ~70% das operações
2. **Câmbio com Liquidação a Termo** (até 360 dias, hedge frequente) — ~20%
3. **Câmbio Simbólico** (sem fluxo financeiro, Art. 21) — ~5%, alto risco regulatório
4. **eFX** (fluxos digitais) — ~5% e crescente

### 1.7 Os 11 riscos estruturais
1. Lavagem por estratificação (layering)
2. Violação de sanções (OFAC/ONU/UE/UK)
3. Evasão fiscal (subdeclaração receita exportada)
4. Sub/super-faturamento (transfer pricing — Lei 14.596/2023)
5. Estrutura offshore opaca
6. Spread cambial anômalo (> 5% acima PTAX)
7. Operações simbólicas sem justificativa
8. Cadeia de bancos correspondentes opaca
9. Compliance OFAC dinâmico
10. IOF-Câmbio recolhido incorretamente
11. Risco país agregado (concentração geográfica)

### 1.8 4 novas B-FX específicas (além das 4 B-FIN do Apêndice V5.1)
- **B-FX-1** — Spread declarado vs PTAX > 5% sistemático
- **B-FX-2** — Operação simbólica sem documentação adequada
- **B-FX-3** — Cadeia bancos correspondentes incompleta
- **B-FX-4** — Cadastro de Exportadores ausente para Morfologia A relevante

### 1.9 Extensão `extensão_fx` da capability `cap_financial_capacity_validation`
Subprocessos quando segmento = seg_crossborder:
- Consulta SISBACEN
- Cross-check Receita Federal ECF
- Análise paridade declarada vs PTAX BCB
- Validação cadeia de bancos (BCB lista corretoras autorizadas)
- OpenCorporates internacional para PJ estrangeiras
- Screening OFAC/ONU/UE/UK contínuo (não pontual!)

### 1.10 38 variáveis V-cb_* específicas (15+ críticas)
Inclui: V-cb_morphology, V-cb_jurisdictions_risk_weighted, V-cb_jurisdictions_offshore_pct, V-cb_jurisdictions_fatf_tier_max, V-cb_ofac_hit, V-cb_fx_volume_usd, V-cb_fx_volume_coherence, V-cb_settlement_jurisdictional_exposure, V-cb_bank_license_verified, V-cb_dcbe_compliant, V-cb_tax_coherence, V-cb_ecf_export_segregated, V-cb_partner_chain_completeness, V-cb_corretora_bcb_licensed, V-cb_partner_ofac_hit, V-cb_economic_group_transnational, V-cb_sisbacen_history, V-cb_offshore_opacity_score, V-cb_export_registered, V-cb_foreign_entity_existence.

### 1.11 Cobertura BDC Crossborder (mais cara do framework)
- **FX-Emergente:** R$ 40-70 inicial + R$ 1,50-3/mês
- **FX-Institucional:** R$ 60-100+ inicial + R$ 1,50-3/mês
- **Datasets novos V5.1:** OFAC SDN, ONU Sanctions, EU Consolidated, UK HMT, FATF High-Risk, Tax Justice Network (offshore index), SISBACEN, Receita Federal ECF + Cadastro Exportadores, BCB lista corretoras, OpenCorporates internacional

### 1.12 Marco regulatório (16+ normas)
- **Lei 14.286/2021** (Novo Marco Cambial — FUNDAMENTAL)
- **Res. BCB 277/2022** (operacionaliza Lei 14.286)
- **Res. BCB 137/2021** (operações até USD 50k)
- **Res. BCB 96/2021 Art. 3** (destinatário final)
- **Circ. BCB 3.978/2020 Art. 7, 11 II, 11 V, 12**
- **Lei 9.613/1998** (Lavagem)
- **Lei 14.596/2023** (Preço de transferência)
- **Lei 14.478/2022** (Marco Legal das Cripto)
- **Res. CVM 175/2022** (Cripto-ativos)
- **FATF Recommendations**
- **OFAC SDN List**
- **UN Security Council Sanctions**
- **OECD CRS**
- **FATCA**
- **CTN Art. 116 § 2º** (anti-elisão)
- **LGPD Art. 33** (transferência internacional de dados)

### 1.13 Princípios editoriais únicos
- **FX-1** — Tier 3-only sem exceção; risco regulatório multidimensional não escala com volume
- **FX-2** — Identificação do beneficiário final estrangeiro é fronteira de bom senso
- **FX-3** — Lista de jurisdições é eixo de risco primário (mais que volume)
- **FX-4** — Extensão `extensão_fx` é obrigatória
- **FX-5** — Cooperação com cliente para fechamento de câmbio (PagSmile não é corretora)

---

## 2. SEGMENTO DROPSHIPPING (`seg_dropshipping`)

### 2.1 Identidade do segmento
- **Tier policy:** Tier 3-only obrigatório (independente do TPV — Princípio DS-1)
- **Ranking:** #2 dos 4 críticos por magnitude estrutural
- **Característica:** varejo sem estoque, sem despacho próprio, sem logística própria — seller responde por storefront + marketing + atendimento + margem

### 2.2 Os 5 modelos operacionais reconhecidos (NOVA TAXONOMIA)

| Modelo | Descrição | Tempo entrega | Risk |
|--------|-----------|---------------|------|
| **1** | Internacional puro (China-dominante) | 25-45 dias | Crítico |
| **2** | Internacional especializado (fornecedor único curado) | 15-30 dias | Alto |
| **3** | Nacional (atacadistas BR) | 3-10 dias | Médio |
| **4** | Híbrido (parte estoque + parte dropshipping) | Variável | Médio-alto |
| **5** | Print-on-demand (POD) | 7-21 dias | Alto (PI) |

**Detecção automática via combinação:** `q_seg_drop_suppliers_origin` + `q_seg_drop_categories` + `q_seg_drop_shipping_time` + `q_t2_product_type` + `q_t2_sales_channels`.

### 2.3 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_drop_suppliers_origin` | Origem fornecedores + plataformas | **Crítica** |
| 2 | `q_seg_drop_categories` | Categorias de produtos | **Crítica** |
| 3 | `q_seg_drop_shipping_time` | Tempo médio de entrega | Alta |
| 4 | `q_seg_drop_return_handling` | Tratamento de devoluções (CDC Art. 49) | Alta |
| 5 | `q_seg_drop_pricing_model` | Modelo de precificação e margem | Média |
| 6 | `q_seg_drop_customs` | Postura aduaneira (PRC IN RFB 2.130) | **Crítica** |

**Total:** 52 universais + 1 q_t2_revenue_proof + 6 segmento = **59 perguntas**.

### 2.4 Subfaixas operacionais

| Subfaixa | Critério |
|----------|----------|
| **DS-Nacional** | suppliers="Apenas Brasil" + tempo ≤ 10 dias |
| **DS-Misto** | mistura BR + Internacional |
| **DS-Internacional** | China dominante + tempo > 25 dias |

### 2.5 Os 9 riscos estruturais
1. **Chargeback "produto não recebido"** (4-8% em DS-Internacional vs 0,3-0,8% em e-commerce padrão)
2. Chargeback "transação não reconhecida" (1,5-3%)
3. Chargeback "produto diferente do anunciado" (1-3%)
4. **Subfaturamento aduaneiro sistemático** (30-50% dos envios China)
5. **Produto contrafeito / violação PI** (20-30% em moda/acessórios chineses; 10-15% em POD)
6. Categorias proibidas vendidas sob disfarce (ANVISA/INMETRO/MAPA)
7. Velocidade de crescimento anômala ("dropshipping millionaire")
8. Lavagem disfarçada
9. Falência operacional / abandono

### 2.6 Conceito "ghost dropshipping" (capability de detecção V5.1)
**Definição:** seller declara dropshipping nacional, mas opera internacional sob fachada.
- **Detecção:** cross-check origin × shipping_time (nacional + > 15 dias = inconsistência matemática)
- **B-GHOST-1** disparado quando inconsistência detectada

### 2.7 B-series específicas de Dropshipping
- **B-CB-DS-1** — Chargeback rate > 15% em 60 dias
- **B-CB-DS-2** — Chargeback "não reconhecido" > 2%
- **B-CUST-1** — Padrão sistemático de subfaturamento (Programa Remessa Conforme)
- **B-CUST-2** — Falta de transparência ao consumidor sobre tributos
- **B-IP-1** — Denúncia formal de violação de PI
- **B-CAT-1** — Categoria proibida identificada no storefront
- **B-CAT-REG-1** — Categoria regulamentada sem certificação (ANVISA/INMETRO)
- **B-VEL-DS-1** — Crescimento > 10x em 60 dias
- **B-LAUNDRY-DS-1** — Padrão de lavagem (markup anômalo + volume + categoria sensível)
- **B-GHOST-1** — Ghost dropshipping detectado
- **B-RET-DS-1** — Política violadora de CDC Art. 49
- **B-RET-DS-2** — Política declarada divergente do storefront

### 2.8 Cobertura BDC Dropshipping
- **DS-Nacional:** R$ 25-35 inicial + R$ 0,80-2/mês
- **DS-Internacional:** R$ 30-45 inicial + R$ 1,50-2,50/mês
- **Datasets críticos:** URL kyc plugin (storefront), Reclame Aqui, tracking codes (amostragem 5%), BDC kyc PJ (atacadistas BR declarados)

### 2.9 Marco regulatório
- **IN RFB 2.130/2023** (Programa Remessa Conforme — FUNDAMENTAL)
- **CDC Art. 12, 14, 30, 31, 49** (responsabilidade + arrependimento 7 dias)
- **Lei 9.279/1996 Art. 189-190** (Propriedade Industrial — contrafação é crime)
- **Lei 9.610/1998 Art. 7, 184** (Direitos Autorais — POD)
- **ANVISA RDC 7/2015** (cosméticos)
- **INMETRO Portaria 371/2009** (eletrônicos com bateria)
- **CONAR + Lei 8.078** (publicidade)
- **MAPA Lei 6.305/1975** (suplementos)
- **LGPD Art. 33** (transferência internacional de dados a fornecedor China)

### 2.10 Princípios editoriais únicos
- **DS-1** — Tier 3 obrigatório por estrutura, não por porte
- **DS-2** — Categoria define risco (cosméticos vs eletrônicos vs moda têm regulações distintas)
- **DS-3** — Tempo de entrega é variável de risco (correlaciona com chargeback rate)
- **DS-4** — Transparência ao consumidor é mitigação primária

---

## 3. SEGMENTO EVENTOS (`seg_eventos`)

### 3.1 Identidade do segmento
- **Tier policy:** Por TPV (Tier 1/2/3 conforme volume)
- **Ranking:** Não-crítico regulatoriamente, mas **operacionalmente sensível**
- **Característica:** existe uma DATA ESPECÍFICA em que a prestação acontece

### 3.2 As 5 Morfologias operacionais (NOVA TAXONOMIA)

| Cod | Morfologia | Característica | Risk |
|-----|------------|----------------|------|
| **A** | Plataforma 1P (próprios + parcerias exclusivas) | Volume alto, ticket R$ 50-300 | Médio |
| **B** | Promotor/Produtor (organiza eventos próprios) | Risco operacional integral | Médio-alto |
| **C** | Casa de shows / Venue / Arena | Operação fixa, AVCB obrigatório | Baixo-médio |
| **D** | Feiras / Congressos / Corporativo B2B | Ticket alto, antecipação longa | Baixo |
| **E** | Eventos privados (casamentos, formaturas) | Ticket R$ 50k-500k, antecipação 6-18 meses | Médio |

**Distinção CRÍTICA:** Morfologia A (1P) ≠ `seg_marketplace` (3P). Regra: > 70% próprio → seg_eventos A; > 70% terceiros → seg_marketplace.

### 3.3 As 8 categorias regulatórias

| Cat | Categoria | Regulação ativada |
|-----|-----------|-------------------|
| 1 | Música ao vivo/recorded | ECAD (Lei 9.610 + Lei 12.853/2013) |
| 2 | Esportivo profissional | Estatuto do Torcedor (Lei 10.671/2003) |
| 3 | Esportivo amador | ART de engenharia + seguro |
| 4 | Festas com bebida alcoólica | Alvará municipal especial |
| 5 | Infantil | ECA (Lei 8.069/1990) + LGPD Art. 14 + alvará Juizado |
| 6 | B2B (feiras/congressos/corporativo) | CDC menos direto + contratos B2B |
| 7 | Festivais multi-atração | Compósita (música+bebida+comida+estruturas) |
| 8 | Privados (casamento/formatura) | LGPD em dados de convidados + alvará venue |

### 3.4 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_eventos_morphology` | Morfologia A/B/C/D/E | **Crítica** |
| 2 | `q_seg_eventos_category` | 8 categorias (multiselect) | **Crítica** |
| 3 | `q_seg_eventos_anticipation_pattern` | Antecipação + concentração temporal | Alta |
| 4 | `q_seg_eventos_cancellation_policy` | Política cancelamento (Lei 13.872) | Alta |
| 5 | `q_seg_eventos_capacity_venue` | Capacidade + propriedade venue | Média |
| 6 | `q_seg_eventos_regulatory_compliance` | Consolidadora 10 dimensões | Alta |

### 3.5 Subfaixas operacionais

| Subfaixa | Critério |
|----------|----------|
| **EV-Pequena** | TPV < R$ 200k/mês OU eventos pontuais pequenos |
| **EV-Média** | TPV R$ 200k-3M/mês |
| **EV-Grande** | TPV > R$ 3M/mês OU casa de shows grande OU plataforma 1P estabelecida |

### 3.6 Os 10 riscos estruturais
1. **Cancelamento massivo + chargeback em onda** (60-80% dos compradores em 2 semanas pós-cancelamento)
2. **Sobrevenda (overbooking)** — crime em esportivo profissional (Estatuto Torcedor Art. 41-G)
3. Cancelamento por motivo externo (clima, segurança, regulatório)
4. **Evento fantasma / Ponzi** (festival com atração impossível)
5. Compliance regulatório falho (ECAD/AVCB/alvarás)
6. Fraude de ingresso (cambismo digital, cartão clonado)
7. Falência cascateada de fornecedor (artista, infraestrutura)
8. Operacional de produção (atraso, falha técnica)
9. **LGPD em dados sensíveis** (score 240 — maior do segmento)
10. **Concentração temporal mal gerida** (score 125 — segundo maior)

### 3.7 B-series específicas de Eventos
- **B-EV-CANCEL-MASSIVE-1** — Taxa cancelamento > 8% rolling 12 meses
- **B-EV-OVERBOOKING-1** — Vendas > capacidade × 0,98
- **B-EV-FANTASMA-1** — Taxa cancelamento > 15% em 12 meses
- **B-EV-FANTASMA-2** — Subprecificação + crescimento anormal + CNPJ jovem
- **B-EV-COMPL-ECAD-1** — Categoria música + ECAD não-declarado em dia
- **B-EV-COMPL-ECA-1** — Categoria infantil + alvará Juizado ausente
- **B-EV-ANTECIP-1** — Antecipação > 180 dias sem reserva técnica adequada
- **B-EV-ANTECIP-2** — Antecipação > 365 dias (atípico — possível Ponzi)
- **B-EV-ANTECIP-3** — Antecipação observada divergente do declarado
- **B-CAPAC-EV-1 a 4** — Sobrevenda + AVCB inválido + alvará vencido
- **B-CANC-EV-1 a 4** — Política inadequada + não publicada + Reclame Aqui ruim + viola CDC Art. 49
- **B-COMPL-EV-1 a 4** — Compliance regulatório
- **B-MORF-EV-1 a 3** — Inconsistência morfologia × CNAE × AVCB

### 3.8 7 capabilities específicas Eventos
1. **Dispute Management Pós-Cancelamento** (Tier 2+)
2. **Antifraude Específico Eventos** (3DS obrigatório > R$ 200; velocity rules)
3. **ECAD Tracking** (mensal automático)
4. **Overbooking Detector** (tempo real Morfologia A/C)
5. **Sazonalidade Reserve Tracker** (concentração > 50%)
6. **LGPD Menores** (categoria infantil)
7. **Cross-border** (artistas internacionais)

### 3.9 Cobertura BDC Eventos
- **Tier 1 EV-Pequena:** R$ 12-18 inicial + R$ 2-4/mês = R$ 36-66/ano
- **Tier 2 EV-Média:** R$ 18-30 inicial + R$ 5-8/mês = R$ 78-126/ano
- **Tier 3 EV-Grande:** R$ 25-45 inicial + R$ 10-18/mês = R$ 145-261/ano
- **Tier 3 + infantil/esportivo prof:** R$ 28-55 inicial + R$ 12-22/mês = R$ 172-319/ano

**Datasets críticos:** URL kyc plugin (política publicada), Reclame Aqui, **ECAD consulta** (NOVO), **AVCB Bombeiros** (NOVO), Alvarás municipais, **Alvará Juizado Infância** (NOVO), Vigilância sanitária estadual, **CONFEA/CREA** (ART de engenharia), **DRT-MTb** (artistas).

### 3.10 Marco regulatório (17+ normas)
- **CDC (Lei 8.078/1990)** Art. 6, 14, 30-31, 39-41, 49
- **Lei 13.872/2019** (Cancelamento por força maior — FUNDAMENTAL)
- **Lei 10.671/2003** (Estatuto do Torcedor)
- **Lei 8.069/1990** (ECA — Art. 70-80, 149)
- **Lei 9.610/1998 + Lei 12.853/2013** (ECAD)
- **Lei 6.533/1978 + DRT-MTb** (Trabalho artistas)
- **Lei 13.146/2015** (LBI — Acessibilidade)
- **Decretos municipais** (alvarás)
- **Normas Estaduais Bombeiros** (AVCB)
- **CONFEA/CREA** (ART de estruturas temporárias)
- **Vigilância sanitária estadual/municipal**
- **Lei 1.521/1951** (Crimes contra economia popular — evento fantasma)
- **Circ. BCB 3.978/2020** (Patch V5.1)
- **LGPD Art. 6, 11, 14** (especialmente crianças)

### 3.11 Princípios editoriais únicos
- **EV-1** — Concentração temporal é informação operacional, não red flag
- **EV-2** — Categoria define compliance específico
- **EV-3** — Política de cancelamento clara é diferencial protetivo
- **EV-4** — Capacidade declarada × ingressos vendidos = teto natural
- **EV-5** — Antecipação é mais previsível em Eventos do que em Turismo

---

## 4. DIAGNÓSTICO CONSOLIDADO: gaps de implementação

### 4.1 Entidades — atualizações necessárias

#### 4.1.1 OnboardingCase
**Já tem:** `segmento_v5_1`, `morfologia`, `tier`, `capabilities_ativas`, `risk_score_v5_1`, `subfaixa_tier_aware`, `patch_financeiro_status`, `v_financial_coherence`.

**Falta adicionar (V5.2):**
- `crossborder_morphology_v5_2` (enum: A/B/C)
- `dropshipping_modelo_v5_2` (enum: 1-5)
- `eventos_morphology_v5_2` (enum: A/B/C/D/E)
- `eventos_categories_v5_2` (array de strings: cat_1 a cat_8)
- `extensao_fx_status` (objeto: sisbacen_check, ecf_check, ptax_spread, ofac_continuous_status)
- `ghost_dropshipping_flag` (boolean)
- `overbooking_detector_status` (objeto: capacidade_declarada, vendas_atuais, alerta_95, bloqueio_100)
- `ecad_status` (objeto: ativo, ultima_consulta, dias_em_mora)

#### 4.1.2 Bloqueio
**Catalogar (V5.2):**
- **Crossborder:** 11 códigos: B-FX-1, B-FX-2, B-FX-3, B-FX-4, B-AML-CB-1, B-AML-CB-2, B-AML-CB-3, B-SANC-CB-1, B-SANC-CB-2, B-SANC-CB-3, B-MORF-CB-1, B-MORF-CB-2, B-FIN-CB-1, B-FIN-CB-2, B-OFF-CB-1, B-TP-CB-1, B-TAX-CB-1, B-GEO-CB-1, B-CHAIN-CB-1, B-CHAIN-CB-2, B-CHAIN-CB-3, B-SETT-CB-1
- **Dropshipping:** 12 códigos: B-CB-DS-1, B-CB-DS-2, B-CUST-1, B-CUST-2, B-IP-1, B-CAT-1, B-CAT-REG-1, B-VEL-DS-1, B-LAUNDRY-DS-1, B-GHOST-1, B-RET-DS-1, B-RET-DS-2
- **Eventos:** 16+ códigos: B-EV-CANCEL-MASSIVE-1, B-EV-OVERBOOKING-1, B-EV-FANTASMA-1, B-EV-FANTASMA-2, B-EV-COMPL-ECAD-1, B-EV-COMPL-ECA-1, B-EV-ANTECIP-1/2/3, B-CAPAC-EV-1/2/3/4, B-CANC-EV-1/2/3/4, B-COMPL-EV-1/2/3/4, B-MORF-EV-1/2/3

#### 4.1.3 Capability
**Catalogar (V5.2):**
- `cap_financial_capacity_validation_extensao_fx` (Crossborder — SISBACEN + ECF + PTAX + OFAC contínuo + BCB corretoras)
- `cap_ghost_dropshipping_detector` (Dropshipping — cross-check origin × shipping_time)
- `cap_overbooking_detector` (Eventos — tempo real ingressos vs capacidade)
- `cap_ecad_tracking` (Eventos categoria música — mensal)
- `cap_dispute_pos_cancelamento` (Eventos Tier 2+)
- `cap_antifraude_eventos` (3DS > R$ 200 + velocity + limite por CPF)
- `cap_sazonalidade_reserve_tracker` (concentração > 50%)
- `cap_lgpd_menores` (categoria infantil)
- `cap_url_kyc_plugin_analyzer` (transversal — política publicada, marketing, transparência)
- `cap_reclame_aqui_scraping` (transversal mensal)
- `cap_ofac_continuous_screening` (Crossborder webhook OFAC)
- `cap_sisbacen_consult` (Crossborder pós-onboarding)

#### 4.1.4 Dataset
**Novos datasets V5.2 (alguns já estavam previstos no Bloco 2):**
- `bcb_corretoras_autorizadas` (CRÍTICO Crossborder — API pública BCB)
- `sisbacen_consult` (Crossborder pós-onboarding)
- `receita_federal_cadastro_exportadores` (Crossborder Morfologia A)
- `receita_federal_ecf` (Crossborder + Patch V5.1)
- `ofac_sdn_list` + `un_sanctions_list` + `eu_consolidated` + `uk_hmt_sanctions` (Crossborder contínuo)
- `fatf_high_risk_jurisdictions` (Crossborder trimestral)
- `tax_justice_network_offshore_index` (Crossborder anual)
- `opencorporates_internacional` (Crossborder Morfologia B/C)
- `ptax_bcb_paridade` (Crossborder mensal)
- `dcbe_bcb_consult` (Crossborder Opção 2 settlement)
- `ecad_status_consult` (Eventos categoria música — NOVO)
- `avcb_bombeiros_estadual` (Eventos Morfologia C — variável por estado, alguns gratuitos)
- `alvara_juizado_infancia` (Eventos categoria infantil)
- `vigilancia_sanitaria_estadual` (Eventos com food&beverage)
- `confea_crea_art` (Eventos com estruturas temporárias)
- `drt_mtb_artistas` (Eventos contratos artistas)
- `reclame_aqui_scraping` (transversal — Q22 já decidido)
- `aliexpress_alibaba_cj_dropshipping_kyc` (Dropshipping plataformas)
- `siscomex_ddi_dde_consult` (Crossborder + Dropshipping comércio formal)

### 4.2 Templates de QuestionnaireTemplate (V5.2)

**Novos templates a criar (segmentos críticos Tier 3-only):**
1. `seg_crossborder_T3` — 59 perguntas (52 universal + 1 V5.1 + 6 segmento)
2. `seg_dropshipping_T3` — 59 perguntas + condicionais por modelo 1-5

**Novos templates Eventos:**
3. `seg_eventos_T1_EV_Pequena` — 30-60 min (template lean)
4. `seg_eventos_T2_EV_Media` — 60-120 min + Patch V5.1
5. `seg_eventos_T3_EV_Grande` — 120-240 min + Patch V5.1 reforçado

### 4.3 Questions a criar/atualizar (V5.2)

**Crossborder (6 novas):**
- `q_seg_crossborder_morphology`, `q_seg_crossborder_jurisdictions`, `q_seg_crossborder_fx_volume`, `q_seg_crossborder_settlement_model`, `q_seg_crossborder_tax_regime`, `q_seg_crossborder_partner_chain`

**Dropshipping (6 novas):**
- `q_seg_drop_suppliers_origin`, `q_seg_drop_categories`, `q_seg_drop_shipping_time`, `q_seg_drop_return_handling`, `q_seg_drop_pricing_model`, `q_seg_drop_customs`

**Eventos (6 novas):**
- `q_seg_eventos_morphology`, `q_seg_eventos_category`, `q_seg_eventos_anticipation_pattern`, `q_seg_eventos_cancellation_policy`, `q_seg_eventos_capacity_venue`, `q_seg_eventos_regulatory_compliance`

Cada uma com: label, helper, tipo de campo, validações, microcopy 8 estados, skip-logic, variáveis de score, B-series potenciais, datasets BDC consumidos.

### 4.4 Backend functions a criar

**Crossborder:**
1. `bcbCorretorasAutorizadas` — consulta lista BCB pública (corretoras de câmbio licenciadas)
2. `ofacContinuousScreening` — webhook diário OFAC + ONU + UE + UK + listas BR (COAF/COPS)
3. `sisbacenConsult` — consulta operações cambiais registradas em nome do CNPJ
4. `ecfReceitaFederalConsult` — verifica receita exportada segregada na ECF
5. `ptaxBcbSpread` — calcula spread declarado vs PTAX mensal
6. `cadastroExportadoresConsult` — Receita Federal Morfologia A
7. `openCorporatesInternacional` — verifica existência e situação de PJ estrangeiras
8. `fatfHighRiskCheck` — atualização trimestral de jurisdições FATF
9. `dcbeConsult` — Declaração Capitais Brasileiros no Exterior (Opção 2 settlement)

**Dropshipping:**
10. `urlKycPluginAnalyze` (já decidido Q21) — 5 analysisTypes
11. `reclameAquiScrape` (já decidido Q22)
12. `trackingCodeSamplingAnalyzer` — amostragem 5% pedidos para cross-check shipping_time
13. `storefrontMonitor` — verifica mudança de categorias publicadas (B-CAT-EV-3 analogo)
14. `subfaturamentoDetector` — analisa tickets médios vs mercado para detectar subfaturamento
15. `ghostDropshippingDetector` — cross-check origin × shipping_time

**Eventos:**
16. `ecadStatusConsult` — consulta mensal status ECAD do cliente
17. `avcbBombeirosConsult` — consulta estadual (variável por UF)
18. `overbookingDetectorRealtime` — monitoramento ingressos vendidos vs capacidade
19. `lei13872TemplateDispute` — gera defesa de chargeback baseado em Lei 13.872/2019
20. `alvaraJuizadoInfanciaCheck` — verifica alvará Vara da Infância para categoria infantil
21. `drtMtbArtistaCheck` — verifica regularidade trabalhista de artistas declarados top
22. `confeaCreaArtCheck` — verifica ART de engenharia para estruturas temporárias

### 4.5 Automations a criar

1. **Scheduled mensal** — `ecadStatusConsult` para todos os casos Eventos com categoria música ativa
2. **Scheduled mensal** — `reclameAquiScrape` para todos os casos
3. **Scheduled trimestral** — `fatfHighRiskCheck` global + reanálise de casos Crossborder
4. **Scheduled semestral** — `avcbBombeirosConsult` Morfologia C
5. **Scheduled diário** — `ofacContinuousScreening` para casos Crossborder ativos
6. **Entity automation** — quando `OnboardingCase.framework_version = 'v5.2'` E `segmento_v5_1 = 'seg_crossborder'` → ativa pipeline `extensao_fx`
7. **Entity automation** — quando ingressos vendidos atingem 95% da capacidade → notifica cliente; 100% → bloqueia novas vendas (`overbookingDetectorRealtime`)
8. **Entity automation** — webhook OFAC update → re-screening de todas as contrapartes declaradas

### 4.6 UI / Páginas

**Atualizar:**
- `pages/AnaliseManual` — adicionar tabs específicas Crossborder (extensão_fx), Dropshipping (ghost detection + customs), Eventos (overbooking + ECAD)
- `pages/AnaliseCompleta` — visualização das morfologias específicas + capabilities ativas V5.2
- `pages/Cadastro` + `pages/CadastroDetalhe` — exibir morfologia + categoria + subfaixa tier-aware
- `pages/EscalationsReview` — categorizar escalações por segmento crítico

**Novas:**
- `pages/CrossborderDashboard` — exposição OFAC + jurisdições + SISBACEN dos clientes Crossborder
- `pages/EventosCalendar` — calendário de eventos com indicadores Overbooking + ECAD + AVCB
- `pages/DropshippingMonitor` — monitor de chargeback rate + ghost detection + subfaturamento por seller

### 4.7 Microcopy / i18n

Toda microcopy das 18 novas perguntas (3 segmentos × 6 perguntas) precisa ser registrada no `lib/i18n/translations/pt.js` com:
- label
- helper
- helper textarea
- 8 estados de erro
- contextuais por opção
- skip-logic messages

---

## 5. Plano de implementação Bloco 5 Parte 2 (após docs completos)

### FASE 1 — Schemas e Catálogos
- [ ] Atualizar entity `OnboardingCase` (+8 campos V5.2 dos 3 segmentos)
- [ ] Catalogar 39 novos Bloqueios (Crossborder 22, Dropshipping 12, Eventos 16)
- [ ] Catalogar 12 novas Capabilities (incluindo extensão_fx, overbooking_detector, ecad_tracking)
- [ ] Catalogar 19 novos Datasets (BCB corretoras, SISBACEN, OFAC contínuo, ECAD, AVCB, etc.)

### FASE 2 — Perguntas e Templates
- [ ] Criar 18 novas Questions (3 segmentos × 6)
- [ ] Criar 5 novos QuestionnaireTemplates (Crossborder T3, Dropshipping T3, Eventos T1/T2/T3)
- [ ] Microcopy completa pt-BR para todas as 18 perguntas

### FASE 3 — Backend Functions Críticas
- [ ] `urlKycPluginAnalyze` (Q21 — transversal — 5 analysisTypes)
- [ ] `reclameAquiScrape` (Q22 — transversal mensal)
- [ ] `bcbCorretorasAutorizadas` (Crossborder)
- [ ] `ofacContinuousScreening` (Crossborder webhook diário)
- [ ] `sisbacenConsult` + `ptaxBcbSpread` + `ecfReceitaFederalConsult` (Crossborder)
- [ ] `ghostDropshippingDetector` (Dropshipping)
- [ ] `ecadStatusConsult` + `avcbBombeirosConsult` (Eventos)
- [ ] `overbookingDetectorRealtime` (Eventos Morfologia A/C)

### FASE 4 — Automations
- [ ] Scheduled mensais (ECAD, Reclame Aqui)
- [ ] Scheduled trimestral (FATF) + semestral (AVCB)
- [ ] Scheduled diário (OFAC)
- [ ] Entity automation extensão_fx Crossborder
- [ ] Entity automation Overbooking Detector

### FASE 5 — UI/UX
- [ ] Atualizar AnaliseManual, AnaliseCompleta, Cadastro, CadastroDetalhe, EscalationsReview
- [ ] Criar CrossborderDashboard, EventosCalendar, DropshippingMonitor
- [ ] Visualização timeline de antecipação Eventos
- [ ] Badge visual de regulação por categoria Eventos

### FASE 6 — Documentação Master
- [ ] Adicionar capítulos específicos em `pages/DocumentacaoMaster`:
  - Cap V5.2 — Crossborder (3 morfologias + extensão_fx + 11 riscos)
  - Cap V5.2 — Dropshipping (5 modelos + ghost detection + PRC)
  - Cap V5.2 — Eventos (5 morfologias + 8 categorias + Lei 13.872)

---

## 6. Pontos a validar com usuário antes da implementação (Parte 2)

| # | Ponto | Padrão recomendado |
|---|-------|--------------------|
| Q26 | OFAC contínuo: webhook real-time (custo + complexidade) ou batch diário? | **Batch diário** (8h UTC-3) — equilíbrio custo/risco |
| Q27 | Overbooking Detector: bloqueio padrão a 100% ou a 98% (margem de segurança)? | **100% configurável por cliente** (default 100%; cliente pode escolher 95-100%) |
| Q28 | SISBACEN consulta: contrato direto BCB ou via terceiro (BDC)? | **Via BDC** (mais barato e padronizado) |
| Q29 | Validação licença BCB corretoras: API pública BCB disponível? Confirmar | **Verificar** disponibilidade de API/lista pública atualizada |
| Q30 | Eventos categoria música: ECAD mensal automático custa ~R$ 0,50-1/cadastro/mês. OK para escala? | **OK** — incluído no pacote Tier 2+ |
| Q31 | Crossborder Tier 3-only: confirmar que NENHUM Crossborder pequeno entra em Tier 1/2? | **Confirmado** — regra absoluta V5.1/V5.2 |
| Q32 | Dropshipping POD (Modelo 5): tratamento de PI é prioridade alta? Notice & Takedown protocolizado? | **Sim** — risco PI é o vetor #1 em POD |

---

**Próximo:** Bloco 5 Parte 3 — segmentos Gateway + Marketplace + (próximo lote a definir). Aguardando 3 documentos adicionais.