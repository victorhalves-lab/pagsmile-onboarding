# V5.2 — BLOCO 5 (PARTE 3/5): Segmentos Gateway, Marketplace, Plataforma Vertical

**Data:** 20/05/2026
**Status:** Diagnóstico microscópico — Parte 3 de 5 (segmentos 7-9 de 13)
**Documentos-fonte analisados:**
- `Gateway_V5_1_Microscopico.docx` (1.791 linhas)
- `Marketplace_V5_1_Microscopico.docx` (2.551 linhas)
- `PlataformaVertical_V5_1_Microscopico.md` (2.986 linhas)

---

## 0. Tabela de progresso Bloco 5

| # | Segmento | Status | Tier policy | Crítico? |
|---|----------|--------|-------------|----------|
| 1 | Ecommerce | ✅ Parte 1 | Por TPV | Não |
| 2 | Eventos | ✅ Parte 2 | Por TPV | Não (op. sensível) |
| 3 | Infoprodutos | ✅ Parte 1 | Por TPV | Não |
| 4 | Crossborder | ✅ Parte 2 | Tier 3-only | Sim (#4 críticos) |
| 5 | Dropshipping | ✅ Parte 2 | Tier 3-only | Sim (#2 críticos) |
| 6 | **Marketplace** | ✅ **Parte 3** | **Tier 2 fixo** | **Sim (#3 críticos)** |
| 7 | **Gateway** | ✅ **Parte 3** | **Tier 3-only** | **Sim (#1 críticos)** |
| 8 | **Plataforma Vertical** | ✅ **Parte 3** | **Por TPV + complexidade** | Não (alta densidade reg.) |
| 9-13 | Turismo, Educação, SaaS, FoodTech, MPE, Pix, Link Pagamento, Serviços B2B/Locais | ⏳ Pendente | Por TPV | Não |

**Progresso:** 8/13 segmentos diagnosticados. **TODOS OS 4 CRÍTICOS COMPLETOS.**

---

## 1. SEGMENTO GATEWAY (`seg_gateway`)

### 1.1 Identidade do segmento
- **Tier policy:** Tier 3-only obrigatório (Princípio GW-1)
- **Ranking:** **#1 dos 4 críticos** — segmento de MAIOR risco estrutural do framework
- **Característica única:** **assimetria de informação extrema** — PagSmile vê 1 entidade (gateway), processa transações de N sub-merchants opacos
- **Princípios:** GW-1 (Tier 3 sem exceções) + GW-2 (visibilidade sub-merchants não-negociável) + GW-3 (monitoramento contínuo) + GW-4 (KYC delegado mas auditado)

### 1.2 Distinção crítica Gateway vs outros segmentos

| Critério | Gateway | E-commerce | Marketplace |
|----------|---------|------------|-------------|
| Visibilidade PagSmile | 1 entidade processando transações de N opacas | 1 entidade | 1 entidade com governança visível |
| Marca consumer-facing | NÃO (sub-merchant é o rosto) | SIM | SIM (marketplace) |
| KYC delegado | Sim (Art. 4 BCB) — auditável | N/A | Sim (parcial) |
| Autorização BCB | NÃO precisa | N/A | N/A |
| PCI-DSS | NÃO precisa (PagSmile faz) | N/A | N/A |

### 1.3 Os 5 modelos operacionais (NOVA TAXONOMIA)

| Modelo | Definição | Risco |
|--------|-----------|-------|
| **1** | Gateway puro (Payment Infrastructure as a Service) | Alto |
| **2** | Gateway vertical (especializado em nicho — clínicas, escolas, imobiliárias) | Médio-alto |
| **3** | Gateway de plataforma (SaaS com pagamento embutido) | Médio |
| **4** | Gateway white-label (cliente revende marca) | Alto |
| **5** | Gateway de marketplace (atende marketplaces como sub-merchants — triple-layer KYC) | Crítico (raro) |

### 1.4 As 6 perguntas canônicas (MUDANÇA DE V5.0)

**Removidas 3 perguntas do V5.0:**
- ~~q_seg_gateway_authorization_bcb~~ (gateway não é sub-credenciador)
- ~~q_seg_gateway_pci_compliance~~ (PagSmile faz PCI; gateway não toca PAN)
- ~~q_seg_gateway_tokenization~~ (tokenização é da PagSmile)
- ~~q_seg_gateway_white_label~~ (deslocada para capability)

**6 perguntas finais V5.1:**

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_gateway_sub_merchants_count` | Número de sub-merchants ativos | **Crítica** |
| 2 | `q_seg_gateway_kyc_sub_merchants` | Política KYC sobre sub-merchants (Art. 4 BCB 96/2021) | **CRÍTICA MÁXIMA** |
| 3 | `q_seg_gateway_commission_model` | Modelo de comissionamento (take rate / fee fixo / revenue share) | Alta |
| 4 | `q_seg_gateway_settlement_model` | Modelo de liquidação aos sub-merchants | Alta |
| 5 | `q_seg_gateway_fraud_engine` | Engine antifraude | Alta |
| 6 | `q_seg_gateway_chargeback_management` | Gestão de chargebacks | Alta |

**Total Gateway:** 52 universais + 1 q_t2_revenue_proof + 6 = **59 perguntas**.

### 1.5 Subfaixas operacionais

| Subfaixa | Critério | Tratamento |
|----------|----------|------------|
| **GW-Embrionário** | < 10 sub-merchants OU TPV baixo | Tier 3 base + diligência intensiva (gateway pequeno é vetor entrada fraude) |
| **GW-Operacional** | 10-100 sub-merchants + TPV médio | Tier 3 + capability Splits OBRIGATÓRIA |
| **GW-Institucional** | > 100 sub-merchants | Tier 3 + auditoria externa obrigatória + Compliance Manager dedicado |

### 1.6 Os 8 riscos estruturais
1. **Sub-merchants fictícios** (10-15% gateways novos)
2. **Transaction laundering / MCC laundering** (5-10% gateways)
3. **Bust-out fraud** (20% gateways imaturos)
4. **Concentração suspeita de UBOs** (30% gateways grandes)
5. **Sub-merchants com PEP/lista restritiva** (0,5-2%)
6. **Velocidade anômala de crescimento** (10-15%)
7. **Engine antifraude inadequado** (40% GW-Embrionário)
8. **KYC delegado mas ineficaz** (20-30% gateways novos — Risco #1 por P×I)

### 1.7 Conceito "fake gateway" — 4 tipos
- **Tipo A:** otimização tributária (mudança enquadramento intermediação)
- **Tipo B:** layering em lavagem (sub-merchants fictícios + agregação)
- **Tipo C:** esconder originador real (PEP, sancionado)
- **Tipo D:** fraude predatória (6-18 meses + crescimento agressivo + sumiço)

### 1.8 Particularidade central — Res. BCB 96/2021 Art. 3-4 (FUNDAMENTAL)

**Art. 3** — PagSmile (sub-adquirente) tem dever de identificar destinatário final (sub-merchant).

**Art. 4** — Delegação permitida ao agregador (gateway), com **5 condições obrigatórias:**
1. Política formal de KYC documentada
2. Identificação prévia (KYC antes de processar transações)
3. Trilha de auditoria mantida 5 anos
4. Fiscalização pela PagSmile (poder de auditoria)
5. Contrato formal prevendo delegação + fiscalização

**Implicação:** sem KYC adequado do gateway, a delegação colapsa — PagSmile teria que fazer KYC direto sobre cada sub-merchant (10x mais caro: R$ 800-1.500/mês vs R$ 80-150/mês delegação).

### 1.9 B-series específicas Gateway
- **B-SUB-1** — Sub-merchant duplicado em outro gateway/marketplace PagSmile
- **B-TL-1** — Transaction laundering pattern detectado
- **B-BUST-1** — Padrão bust-out detectado
- **B-AML-1** — Concentração UBOs > 50% + outros sinais
- **B-VEL-1** — Velocidade anômala de crescimento
- **B-FE-1** — Engine antifraude inadequado em GW-Operacional+
- **B-FE-2** — Engine declarada mas inadequada (apenas blacklist)
- **B-KYC-1** — KYC inadequado em gateway
- **B-KYC-2** — KYC manual com > 50 sub-merchants (inviabilidade matemática)
- **B-CB-1** — Sem processo formal de gestão CB em GW-Operacional+
- **B-RET-1** — Retenção abusiva (prazo mensal + 10% + sem diferenciação)
- **B-FAKE-1** — Fake gateway detectado (take rate < 1% + concentração UBOs > 30%)
- **B-PRED-1** — Modelo predatório (take rate > 30%)

### 1.10 Cobertura BDC Gateway
- **Cadastro inicial:** ~R$ 38 estimado
- **Por sub-merchant em diligência completa:** R$ 8-12
- **Delegação adequada (gateway com 100 sub-merchants):** R$ 80-150/mês
- **PagSmile assume KYC direto (KYC inadequado):** R$ 800-1.200/mês (10x mais caro)

### 1.11 Capabilities obrigatórias Gateway
- **Splits** — obrigatória em GW-Operacional+
- **Crossborder Heavy** — se aplicável (q_t3_international_operations = Sim + TPV crossborder > R$ 100k)
- **White-Label** — se modelo white-label declarado
- **Antecipação para Sub-merchants** — se modelo de antecipação ativo

---

## 2. SEGMENTO MARKETPLACE (`seg_marketplace`)

### 2.1 Identidade do segmento
- **Tier policy:** **Tier 2 FIXO** (Princípio MKT-1) — único segmento com Tier intermediário fixo
- **Ranking:** **#3 dos 4 críticos**
- **Justificativa Tier 2 fixo:** mitigações estruturais inerentes (governança visível + sistema de disputas + rating + catálogo público + KYC consolidado) reduzem risco residual abaixo de Tier 3

### 2.2 Distinção Marketplace vs Gateway (FUNDAMENTAL)

| Critério | Marketplace | Gateway |
|----------|-------------|---------|
| Marca consumer-facing | **SIM** (rating, sistema disputas) | Não |
| Governança visível | **SIM** | Não |
| Quem consumidor percebe? | Marketplace + seller identificável | Não percebe |
| Sistema de disputas formal | SIM | N/A |
| Catálogo público | SIM | N/A |
| Tier policy | Tier 2 fixo | Tier 3-only |

### 2.3 Os 5 modelos operacionais (NOVA TAXONOMIA)

| Modelo | Tipo | Risco |
|--------|------|-------|
| **1** | Horizontal (multi-categoria — Mercado Livre, Amazon BR, Magalu) | Médio |
| **2** | Vertical (nicho — moda sustentável, peças automotivas) | Baixo-médio |
| **3** | Serviços (Workana, GetNinjas, Udemy) | Médio-alto |
| **4** | C2C peer-to-peer (OLX, Enjoei, Elo7) | Alto |
| **5** | Híbrido 1P+3P (Amazon-like) | Médio |

### 2.4 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_mkt_sellers_count` | Número de sellers ativos | **Crítica** |
| 2 | `q_seg_mkt_kyc_sellers` | Política KYC sobre sellers (Art. 4 BCB 96/2021) | **CRÍTICA** |
| 3 | `q_seg_mkt_categories_allowed` | Categorias permitidas no catálogo | **CRÍTICA** |
| 4 | `q_seg_mkt_dispute_system` | Sistema de resolução de disputas | Alta |
| 5 | `q_seg_mkt_commission_model` | Modelo de comissionamento dos sellers | Alta |
| 6 | `q_seg_mkt_governance_maturity` | Maturidade de governança (consolidadora) | Alta |

**Marketplace NÃO responde Tier 3 base** — recebe Tier 2 fixo. Total: 52 universais (T1+T2) + 1 q_t2_revenue_proof + 6 segmento = **58 perguntas**.

### 2.5 Subfaixas operacionais

| Subfaixa | Critério |
|----------|----------|
| **MKT-Embrionário** | < 50 sellers OU TPV baixo |
| **MKT-Operacional** | 50-2.000 sellers |
| **MKT-Institucional** | > 2.000 sellers (Mercado Livre-scale) |

### 2.6 Os 9 riscos estruturais
1. Sellers fictícios / laranjas
2. **Categorias proibidas listadas por sellers** (score 600 — risco #1 do segmento)
3. Produtos contrafeitos / violação PI
4. Concentração suspeita UBOs
5. Sellers com PEP / lista restritiva
6. Sistema de disputas inadequado
7. Velocidade anômala crescimento sellers
8. Fake marketplace (lavagem disfarçada)
9. Abandono operacional

### 2.7 Marco regulatório Marketplace
- **Marco Civil da Internet Art. 19 e 21** (responsabilidade subsidiária + notice & takedown)
- **STJ Tema 950** (Recurso Especial 1.660.821) — solidariedade com seller em mediação ativa
- **Res. BCB 96/2021 Art. 3-4** (delegação Art. 4 com Tier 2 fixo)
- **Lei 14.063/2020** (Marketplace fiscal — ICMS-DIFAL + ISS + IRRF)
- **CDC Art. 12, 14, 30-31, 49** (responsabilidade + arrependimento)
- **Lei 9.279/1996** (PI — contrafação)

### 2.8 B-series específicas Marketplace
- **B-SELLER-1** — Seller duplicado
- **B-CAT-MKT-1** — Categoria proibida detectada no catálogo
- **B-CAT-MKT-2** — Categoria proibida declarada explicitamente (recusa)
- **B-CAT-MKT-3** — Fiscalização inadequada em MKT-Operacional+
- **B-PI-MKT-1** — Denúncia formal de violação PI
- **B-AML-MKT-1** — Concentração UBOs > 40%
- **B-AML-MKT-2** — Fake marketplace detectado
- **B-DISP-MKT-1** — Sem sistema mediação formal em MKT-Operacional+
- **B-DISP-MKT-2** — Sistema declarado divergente de Reclame Aqui
- **B-VEL-MKT-1** — Velocidade anômala crescimento sellers
- **B-KYC-MKT-1/2** — KYC inadequado ou manual com volume incompatível
- **B-FAKE-MKT-1/2** — Volume implausível + concentração UBOs
- **B-MKT-PRED-1** — Modelo predatório
- **B-MKT-SUST-1** — Take rate insustentável
- **B-GOV-MKT-1/2/3** — Governança imatura / sem auditoria / declaração inflada
- **B-RATING-1** — Rating sem visibilidade pública

### 2.9 Capabilities Marketplace
- **Splits** — obrigatória MKT-Operacional+
- **Notice & Takedown** — obrigatória MKT-Institucional
- **KYC Delegado Auditável** — obrigatória MKT-Operacional+
- **Antifraude Reforçada** — recomendada Modelos 1 e 5
- **Retenção Financeira até Disputa** — recomendada Modelo 3 (Serviços)
- **Crossborder** — se aplicável

### 2.10 Cobertura BDC Marketplace
- **MKT-Embrionário:** R$ 18-26 inicial + R$ 0,30-1,50/mês
- **MKT-Operacional:** R$ 22-32 + R$ 0,80-2/mês
- **MKT-Institucional:** R$ 28-38 + R$ 1,50-3/mês
- **Datasets críticos:** URL kyc plugin (catálogo público + política), Reclame Aqui (mensal), Google Reviews (mensal), consumidor.gov.br

---

## 3. SEGMENTO PLATAFORMA VERTICAL (`seg_plataforma_vertical`)

### 3.1 Identidade do segmento
- **Tier policy:** **Por TPV + Complexidade Regulatória** — algumas verticais (saúde) podem forçar Tier 2+ independente do TPV
- **Ranking:** Não-crítico estruturalmente, **mas o segmento de MAIOR DENSIDADE REGULATÓRIA SETORIAL entre os 13**
- **Característica única:** **7 camadas regulatórias simultâneas** (CDC + Marco Civil + LGPD + LGPD Art. 11 + Resoluções dos conselhos + ANVISA + Patch V5.1)

### 3.2 As 6 morfologias operacionais (NOVA TAXONOMIA — específica)

| Cod | Morfologia | Sub-vertical predominante | Risco |
|-----|------------|---------------------------|-------|
| **A** | HealthTech | Médicos (CFM), Dentistas (CRO), Psicólogos (CFP), Nutricionistas (CFN), Fonoaudiólogos (CFFa), Enfermeiros (COREN) | **Máximo regulatório** |
| **B** | Wellness (Wellhub-like) | Academias, yoga, pilates, meditação | Moderado |
| **C** | BeautyTech (Singu-like) | Cabelo, manicure, depilação, estética | Moderado + ANVISA |
| **D** | Profissionais Regulados | Advogados (OAB), Contadores (CRC), Engenheiros (CREA), Arquitetos (CAU) | Alto setorial |
| **E** | Gig Economy Serviços | Encanador, eletricista, faxineira, pet sitter | Alto trabalhista |
| **F** | Terapias Alternativas | Reiki, acupuntura, terapia floral, astrologia, tarô | Ambíguo regulatoriamente |

### 3.3 Plataforma Vertical vs Marketplace vs SaaS (FUNDAMENTAL)

| Critério | Plataforma Vertical | Marketplace | SaaS B2B Vertical |
|----------|---------------------|-------------|--------------------|
| Quem é "fornecedor"? | Profissional autônomo (PF/MEI) | Empresa estabelecida PJ | Empresas usuárias |
| Tipo de produto | Serviço profissional regulado | Produto físico/comoditizado | Acesso a software |
| Regulação setorial | **CENTRAL** (CFM, OAB, etc.) | Periférica (CDC predomina) | Setorial só do software |
| Verificação profissional | **OBRIGATÓRIA E CONTÍNUA** | Cadastral básica | N/A |
| Tier policy | Por TPV + complexidade | Tier 2-only | Por TPV |
| Risco LGPD | **MÁXIMO** (sensíveis em A) | Moderado | Moderado-alto |

### 3.4 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_pv_morphology` | Morfologia A-F + sub-vertical | **Crítica** |
| 2 | `q_seg_pv_professional_verification` | Verificação habilitação profissional (RISCO #1 — score 360) | **CRÍTICA MÁXIMA** |
| 3 | `q_seg_pv_data_sensitive` | Tratamento dados sensíveis LGPD Art. 11 | **CRÍTICA Morf. A** |
| 4 | `q_seg_pv_splits_management` | Gestão de splits financeiros | Alta |
| 5 | `q_seg_pv_consumer_protection` | Proteção consumerista (CDC Art. 7º Parágrafo único) | **Alta (Risco #2 score 210)** |
| 6 | `q_seg_pv_regulatory_compliance` | Compliance regulatório setorial consolidado (12 dimensões) | Crítica |

### 3.5 Subfaixas operacionais

| Subfaixa | Critério |
|----------|----------|
| **PV-Pequena** | TPV < R$ 200k OU operação inicial |
| **PV-Média** | TPV R$ 200k-3M OU operação organizada |
| **PV-Grande** | TPV > R$ 3M OU operação institucional (100+ funcionários, healthtech estabelecida) |

### 3.6 Os 10 riscos estruturais
1. **Profissional sem habilitação válida (score 360 — MAIOR DO SEGMENTO)** — 40-60% Tier 1/2 sem sistema contínuo
2. Vazamento dados sensíveis (LGPD Art. 11) — crítico se materializar
3. **Solidariedade consumerista (score 210)** — CDC Art. 7º Parágrafo único
4. Telemedicina mal-implementada (Resolução CFM 2.314/2022)
5. Disputa de splits
6. Vínculo trabalhista (Morf. E gig economy)
7. **Promessa terapêutica em Morf. F (score 175)** — CDC Art. 37
8. Ineficiência splits
9. **Risco reputacional setorial (score 175)** — caso individual viraliza
10. Conflito com plano de saúde (Morf. A)

### 3.7 Marco regulatório — 7 camadas simultâneas
1. **CDC (Lei 8.078/1990)** — especialmente **Art. 7º Parágrafo único (SOLIDARIEDADE)** + Art. 14, 30-31, 39
2. **Marco Civil da Internet (Lei 12.965/2014)** — Art. 19 (responsabilidade conteúdo terceiros)
3. **LGPD (Lei 13.709/2018)** — toda
4. **LGPD Art. 11 (dados sensíveis)** — saúde, religião, vida sexual, biométrico
5. **Resoluções setoriais:**
   - CFM 2.314/2022 (telemedicina) + 2.222/2018 (publicidade médica)
   - OAB Provimento 205/2021 + 218/2024 (intermediação digital)
   - CFP 11/2018 (atendimento online psicológico)
   - CRO, CFN, CFFa, COREN, CRC, CREA, CAU
6. **ANVISA + Vigilância Sanitária** — quando produtos cosméticos/medicamentos
7. **Circ. BCB 3.978/2020 (Patch V5.1)**
+ **CLT** (vínculo trabalhista em gig economy)

### 3.8 B-series específicas Plataforma Vertical
- **B-MORF-PV-1/2/3/4** — Inconsistências morfologia/sub-vertical/CNAE + promessa terapêutica
- **B-PV-VERIF-1** — Sistema apenas inicial sem reverificação
- **B-PV-VERIF-2** — Sem documentação
- **B-PV-VERIF-3** — Auditoria revela > 5% profissionais sem habilitação
- **B-PV-VERIF-4** — Histórico de incidente material
- **B-PV-LGPD-1** — Morf. A sem DPO especializado
- **B-PV-LGPD-2** — Sem plano de incidentes específico
- **B-PV-LGPD-3** — Transferência internacional sensíveis problemática
- **B-PV-LGPD-4** — Incidente público sensível mal-gerido
- **B-PV-SPLIT-1** — Manual em Tier 2+
- **B-PV-SPLIT-2** — Sem documentação contratual
- **B-PV-SPLIT-3** — Divergência declarado × observado > 10%
- **B-PV-SPLIT-4** — Timing > D+30
- **B-PV-SPLIT-5** — Histórico de disputa trabalhista
- **B-PV-CDC-1** — Sem mecanismos
- **B-PV-CDC-2** — Política não publicada
- **B-PV-CDC-3** — Ação coletiva material
- **B-PV-CDC-4** — Reclame Aqui revela violação operacional
- **B-PV-CDC-5** — Sem seguro civil em Tier 3
- **B-COMPL-PV-1/2/3/4** — Compliance setorial insuficiente/inconsistente/sem capability/inflado

### 3.9 12 Capabilities específicas Plataforma Vertical (mais que qualquer outro segmento)
1. **Professional Verification** (Tier 2+ todas)
2. **LGPD Standard** (Tier 2+ todas)
3. **LGPD Sensitive** (obrigatória Morf. A Tier 2+)
4. **LGPD Advanced** (Tier 3 Morf. A com IA/biometria/telemedicina)
5. **Vertical Compliance** (Tier 2+ todas — atualização de regulações setoriais)
6. **Splits Validation** (Tier 2+ todas)
7. **Labor Analysis** (Morf. E gig economy)
8. **Consumer Protection** (Tier 2+ todas)
9. **DPA Template** (Morf. B wellness B2B2C)
10. **Procedure Habilitation** (Morf. C com procedimentos invasivos)
11. **Therapeutic Disclaimer** (Morf. F terapias)
12. **Media Monitor** (Tier 3 todas + opcional Tier 2 Morf. A/E)

### 3.10 Cobertura BDC Plataforma Vertical
- **Tier 1 simples (B/C/E):** R$ 12-18 + R$ 3-5/mês = R$ 48-78/ano
- **Tier 1 A (healthtech inicial):** R$ 16-24 + R$ 4-6/mês = R$ 64-96/ano
- **Tier 2 média:** R$ 22-46 + R$ 6-16/mês
- **Tier 3 grande:** R$ 32-66 + R$ 12-30/mês
- **Tier 3 A (healthtech grande):** R$ 46-66 inicial + R$ 18-30/mês = **R$ 262-426/ano**

### 3.11 Datasets específicos Plataforma Vertical
- **API CFM** (médicos — parcial, alguns disponíveis via partners)
- **Consulta OAB** (cada seccional — manual)
- **CRO, CFP, CFN, CFFa, COREN, CRC, CREA, CAU** (variável, mostly portal-only)
- **Cadastro ANPD** (DPO + incidentes públicos)
- **URL kyc plugin** (intensivo — políticas LGPD + DPA + termos)
- **Reclame Aqui + Google Reviews + consumidor.gov.br**
- **ANVISA + Vigilância Sanitária** (Morf. C com produtos)
- **media_profile_and_exposure_pj** (Tier 3 + Morf. A/E)

### 3.12 Princípios editoriais Plataforma Vertical
- **PV-1** — Densidade regulatória setorial é estrutural
- **PV-2** — Verificação profissional é contínua, não pontual
- **PV-3** — Dados sensíveis (LGPD Art. 11) exigem regime próprio
- **PV-4** — Solidariedade consumerista exige proteção (diligência mitiga, não isenta)
- **PV-5** — Splits são padrão; análise é estrutural
- **PV-6** — Risco reputacional setorial alto

---

## 4. DIAGNÓSTICO CONSOLIDADO: gaps de implementação

### 4.1 Entidades — atualizações necessárias

#### 4.1.1 OnboardingCase — campos adicionais (V5.2)
**Já existem campos V5.1:** segmento_v5_1, morfologia, tier, capabilities_ativas, etc.

**Adicionar (V5.2 — Bloco 3):**
- `gateway_modelo_v5_2` (enum: 1-5)
- `gateway_subfaixa_v5_2` (enum: GW-Embrionário/Operacional/Institucional)
- `marketplace_modelo_v5_2` (enum: 1-5)
- `marketplace_subfaixa_v5_2` (enum: MKT-Embrionário/Operacional/Institucional)
- `plataforma_vertical_morphology_v5_2` (enum: A-F)
- `plataforma_vertical_subvertical` (array — médicos/dentistas/psicólogos/advogados/contadores/etc.)
- `plataforma_vertical_subfaixa` (enum: PV-Pequena/Média/Grande)
- `sub_merchants_count_observed` (number — observado pós-onboarding)
- `sellers_count_observed` (number — observado pós-onboarding)
- `professional_verification_method` (enum: api/portal_periodic/manual/declarative_only)
- `kyc_delegation_status` (enum: delegated_adequate/delegated_inadequate/pagsmile_direct)
- `lgpd_sensitive_regime_status` (objeto: dpo_specialized, incident_plan_tested, sensitive_policy_published, intl_transfer_safeguards)
- `splits_governance_score` (number 0-100)

#### 4.1.2 Bloqueio — catalogar (V5.2)
**Gateway (13 códigos novos):** B-SUB-1, B-TL-1, B-BUST-1, B-AML-1, B-VEL-1, B-FE-1, B-FE-2, B-KYC-1, B-KYC-2, B-CB-1, B-RET-1, B-FAKE-1, B-PRED-1

**Marketplace (18 códigos novos):** B-SELLER-1, B-CAT-MKT-1/2/3, B-PI-MKT-1, B-AML-MKT-1/2, B-DISP-MKT-1/2, B-VEL-MKT-1, B-KYC-MKT-1/2, B-FAKE-MKT-1/2, B-MKT-PRED-1, B-MKT-SUST-1, B-GOV-MKT-1/2/3, B-RATING-1

**Plataforma Vertical (25 códigos novos):** B-MORF-PV-1/2/3/4, B-PV-VERIF-1/2/3/4, B-PV-LGPD-1/2/3/4, B-PV-SPLIT-1/2/3/4/5, B-PV-CDC-1/2/3/4/5, B-COMPL-PV-1/2/3/4

**Total Parte 3:** 56 novos Bloqueios.

#### 4.1.3 Capability — catalogar (V5.2)
**Gateway:** `cap_gateway_kyc_delegation_audit`, `cap_gateway_sub_merchants_webhook`, `cap_gateway_ubo_concentration_monitor`, `cap_white_label`, `cap_antecipacao_sub_merchants`

**Marketplace:** `cap_mkt_notice_takedown`, `cap_mkt_kyc_delegado_auditavel`, `cap_mkt_catalog_monitor` (URL kyc plugin para catálogo público), `cap_mkt_dispute_system_monitor`, `cap_mkt_retention_until_dispute` (Modelo 3)

**Plataforma Vertical (12 capabilities — todas novas em V5.2):**
1. `cap_pv_professional_verification` (com integração CFM/OAB quando disponível)
2. `cap_pv_lgpd_standard`
3. `cap_pv_lgpd_sensitive` (obrigatória Morf. A)
4. `cap_pv_lgpd_advanced` (Tier 3 Morf. A complexa)
5. `cap_pv_vertical_compliance` (atualização de regulações setoriais)
6. `cap_pv_splits_validation`
7. `cap_pv_labor_analysis` (Morf. E)
8. `cap_pv_consumer_protection`
9. `cap_pv_dpa_template` (Morf. B)
10. `cap_pv_procedure_habilitation` (Morf. C)
11. `cap_pv_therapeutic_disclaimer` (Morf. F)
12. `cap_pv_media_monitor`

#### 4.1.4 Dataset — catalogar (V5.2 — específicos Parte 3)
- `cfm_consulta` (API parcial — médicos)
- `oab_seccionais` (consulta web por seccional — advogados)
- `crp_consulta` (psicólogos — portal por CRP regional)
- `cro_consulta` (odontologistas)
- `cfn_consulta` (nutricionistas)
- `cffa_consulta` (fonoaudiólogos)
- `coren_consulta` (enfermeiros)
- `crc_consulta` (contadores)
- `crea_consulta` (engenheiros)
- `cau_consulta` (arquitetos)
- `anpd_publicacoes_incidentes` (LGPD)
- `tribunais_tst_decisoes_gig` (jurisprudência trabalhista gig economy)
- `iso_27001_27701_certificacao_check`
- `sub_merchants_cross_check_pagsmile` (interno — detectar duplicatas Gateway/Marketplace)
- `google_reviews_api`
- `consumidor_gov_br_api`

### 4.2 Templates de QuestionnaireTemplate (V5.2)

**Novos templates (8):**
1. `seg_gateway_T3_embrionario`
2. `seg_gateway_T3_operacional`
3. `seg_gateway_T3_institucional`
4. `seg_marketplace_T2_embrionario`
5. `seg_marketplace_T2_operacional`
6. `seg_marketplace_T2_institucional`
7. `seg_plataforma_vertical_T1_pequena` (Morf. B/C/E)
8. `seg_plataforma_vertical_T2_media` (todas Morf.)
9. `seg_plataforma_vertical_T3_grande_healthtech` (Morf. A — healthtech)
10. `seg_plataforma_vertical_T3_grande_outras` (Morf. B/C/D/E/F grande)

### 4.3 Questions a criar (18 novas — 3 segmentos × 6)

**Gateway:** q_seg_gateway_sub_merchants_count, q_seg_gateway_kyc_sub_merchants, q_seg_gateway_commission_model, q_seg_gateway_settlement_model, q_seg_gateway_fraud_engine, q_seg_gateway_chargeback_management

**Marketplace:** q_seg_mkt_sellers_count, q_seg_mkt_kyc_sellers, q_seg_mkt_categories_allowed, q_seg_mkt_dispute_system, q_seg_mkt_commission_model, q_seg_mkt_governance_maturity

**Plataforma Vertical:** q_seg_pv_morphology, q_seg_pv_professional_verification, q_seg_pv_data_sensitive, q_seg_pv_splits_management, q_seg_pv_consumer_protection, q_seg_pv_regulatory_compliance

### 4.4 Backend functions a criar

**Gateway (10 funções):**
1. `gatewaySubMerchantsWebhook` — recebe webhook a cada cadastro de sub-merchant; faz BDC + cross-check de UBOs
2. `gatewayUboConcentrationMonitor` — monitora concentração de UBOs nos top sub-merchants
3. `gatewayKycAuditSample` — auditoria amostral periódica de cadastros KYC
4. `gatewayTransactionLaunderingDetector` — analisa padrões de transação (ticket médio, frequência, geografia) por sub-merchant
5. `gatewayBustOutDetector` — detecta padrão crescente seguido de pico (bust-out)
6. `gatewayVelocityAnomalyDetector` — detecta crescimento > 3 sigmas
7. `gatewayFakeGatewayDetector` — combinação take rate × concentração UBOs
8. `gatewayCommissionCoherenceCheck` — coerência take rate × TPV × receita declarada
9. `gatewaySubMerchantUrlKycPlugin` — análise de URLs de checkout dos sub-merchants
10. `gatewaySubMerchantPepScreening` — screening contínuo PEP/sanção dos UBOs dos sub-merchants

**Marketplace (11 funções):**
11. `marketplaceCatalogMonitor` — URL kyc plugin scanea catálogo público periodicamente
12. `marketplaceSellersWebhook` — recebe webhook a cada cadastro de seller; faz BDC
13. `marketplaceReclameAquiCorrelation` — correlaciona declaração × Reclame Aqui
14. `marketplaceGoogleReviewsAnalyzer` — análise Google Reviews mensal
15. `marketplaceConsumerGovBrCheck` — verificação consumidor.gov.br
16. `marketplaceFakeMarketplaceDetector` — take rate × UBO × coerência financeira
17. `marketplaceCategoryProhibitedScanner` — detecta categorias proibidas no catálogo via NLP
18. `marketplaceNoticeAndTakedownWorkflow` — workflow Marco Civil Art. 19/21
19. `marketplacePiInfringementDetector` — heurística de PI (marcas reconhecidas em preços anômalos)
20. `marketplaceDisputeSystemAuditCheck` — auditoria do sistema declarado
21. `marketplaceGovernanceMaturityScorer` — score consolidado de governança

**Plataforma Vertical (16 funções — mais que qualquer outro segmento):**
22. `pvProfessionalVerificationApiCfm` — integração API CFM (médicos)
23. `pvProfessionalVerificationOabSeccional` — consulta OAB por seccional
24. `pvProfessionalVerificationOtherCouncils` — CRP, CRO, CFN, CFFa, COREN, CRC, CREA, CAU
25. `pvProfessionalAuditSampling` — auditoria amostral periódica (≥ 5% anual)
26. `pvLgpdSensitivePolicyCheck` — URL kyc plugin verifica política específica para sensíveis
27. `pvDpoAnpdRegistryCheck` — verifica DPO cadastrado ANPD
28. `pvIncidentPlanValidation` — verifica plano de incidentes específico documentado
29. `pvSplitsObservedVsDeclared` — análise transacional de proporções
30. `pvLaborDisputeMonitor` — processes PJ trabalhistas (Morf. E)
31. `pvConsumerProtectionPolicyCheck` — URL kyc plugin política consumerista
32. `pvCollectiveActionsMonitor` — processes PJ ações coletivas
33. `pvAnpdIncidentHistoryCheck` — histórico ANPD
34. `pvTherapeuticDisclaimerCheck` — URL kyc plugin análise de promessa terapêutica (Morf. F)
35. `pvMediaMonitorVertical` — media_profile_and_exposure_pj contínuo (Tier 3)
36. `pvAnvisaComplianceCheck` — Morf. C com produtos
37. `pvCommissionBenchmarkCheck` — comissão declarada vs benchmark por sub-vertical

**TOTAL Parte 3:** 37 novas backend functions.

### 4.5 Automations a criar (V5.2 — Parte 3)

1. **Entity automation Gateway** — webhook a cada cadastro de sub-merchant → BDC + cross-check
2. **Scheduled mensal** — `gatewayUboConcentrationMonitor` para todos os gateways Tier 3
3. **Scheduled mensal** — `marketplaceCatalogMonitor` (URL kyc plugin) para todos os marketplaces
4. **Scheduled mensal** — `pvProfessionalVerification*` (semestral CFP/CFM; trimestral OAB)
5. **Scheduled diário** — `pvMediaMonitorVertical` para Tier 3 Morf. A
6. **Entity automation** — quando seller cadastra no marketplace → cross-check
7. **Scheduled trimestral** — auditoria amostral profissional (`pvProfessionalAuditSampling`)
8. **Scheduled mensal** — `pvSplitsObservedVsDeclared` para todos Tier 2+
9. **Entity automation** — quando ANPD publica decisão sobre dados sensíveis → notifica casos relevantes

### 4.6 UI / Páginas

**Atualizar:**
- `pages/AnaliseManual` — adicionar tabs específicas Gateway (sub-merchants concentration), Marketplace (catálogo monitor), Plataforma Vertical (verificação profissional + LGPD Sensitive)
- `pages/AnaliseCompleta` — visualização das morfologias + sub-verticais + capabilities ativas
- `pages/CadastroDetalhe` — exibir KYC delegation status + professional verification method
- `pages/EscalationsReview` — categorizar por segmento crítico

**Novas páginas (V5.2):**
- `pages/GatewayDashboard` — visualização de sub-merchants + UBO concentration + bust-out alerts
- `pages/MarketplaceCatalogMonitor` — catálogo público analisado + categorias proibidas + PI infringement
- `pages/PlataformaVerticalDashboard` — verificação profissional (CFM/OAB status) + LGPD Sensitive status + Media Monitor

### 4.7 Microcopy / i18n

18 perguntas × 8 estados + skip-logic messages + glossário extenso (especialmente para Plataforma Vertical — 30+ termos técnicos: CFM, CRP, CFP, OAB, CREA, CRC, CAU, Resolução CFM 2.314/2022, Resolução CFP 11/2018, Provimento OAB 205/2021 + 218/2024, LGPD Art. 11, sigilo médico, telemedicina, ANPD, ISO 27001, ISO 27701, HIPAA, gig economy, vínculo trabalhista, termo de autônomo, splits, Marco Civil Art. 19, CDC Art. 7º Parágrafo único, solidariedade, etc.).

---

## 5. Plano de implementação Bloco 5 Parte 3 (após docs completos)

### FASE 1 — Schemas e Catálogos
- [ ] Atualizar entity `OnboardingCase` (+13 campos V5.2 Parte 3)
- [ ] Catalogar 56 novos Bloqueios (Gateway 13, Marketplace 18, Plataforma Vertical 25)
- [ ] Catalogar 22 novas Capabilities (Gateway 5, Marketplace 5, Plataforma Vertical 12)
- [ ] Catalogar 16 novos Datasets (APIs conselhos profissionais + ANPD + ISO check + Google Reviews + consumidor.gov.br)

### FASE 2 — Perguntas e Templates
- [ ] Criar 18 novas Questions
- [ ] Criar 10 novos QuestionnaireTemplates
- [ ] Microcopy completa pt-BR com glossário extenso de termos setoriais

### FASE 3 — Backend Functions Críticas
- [ ] Gateway: 10 funções (KYC audit, UBO monitor, bust-out, fake detector)
- [ ] Marketplace: 11 funções (catalog monitor, fake detector, notice & takedown workflow)
- [ ] Plataforma Vertical: 16 funções (verificação CFM/OAB + LGPD Sensitive + Media Monitor)

### FASE 4 — Automations
- [ ] Webhook a cada cadastro de sub-merchant (Gateway)
- [ ] Webhook a cada cadastro de seller (Marketplace)
- [ ] Scheduled mensal: catalog monitor (Marketplace), professional verification (PV), splits observed (PV)
- [ ] Scheduled trimestral: auditoria amostral profissional (PV)
- [ ] Scheduled diário: Media Monitor Tier 3 Morf. A (PV)
- [ ] Entity automation: ANPD publicação → notifica casos relevantes

### FASE 5 — UI/UX
- [ ] Atualizar AnaliseManual, AnaliseCompleta, CadastroDetalhe, EscalationsReview
- [ ] Criar GatewayDashboard, MarketplaceCatalogMonitor, PlataformaVerticalDashboard

### FASE 6 — Documentação Master
- [ ] Adicionar capítulos em `pages/DocumentacaoMaster`:
  - Cap V5.2 — Gateway (5 modelos + Art. 4 BCB + 8 riscos + fake gateway)
  - Cap V5.2 — Marketplace (5 modelos + Tier 2 fixo + 9 riscos + STJ Tema 950)
  - Cap V5.2 — Plataforma Vertical (6 morfologias + 7 camadas regulatórias + LGPD Art. 11 + verificação profissional)

---

## 6. Pontos a validar com usuário (Q33-Q40)

| # | Ponto | Recomendação |
|---|-------|--------------|
| Q33 | KYC delegado Gateway/Marketplace: contratos com cláusula de revogação são template padrão? | **Sim** — template contratual padrão V5.2 |
| Q34 | Auditoria amostral KYC delegado: ≥ 5% anual é viável? | **Sim** (padrão de mercado) |
| Q35 | Verificação profissional via API CFM: contrato específico ou via web scraping? | **Híbrido** — API quando disponível; portal por seccional quando não |
| Q36 | LGPD Sensitive Morf. A: DPO especializado CLT integral é exigência ou recomendação? | **Recomendação Tier 2; exigência Tier 3** |
| Q37 | Notice & Takedown Marketplace: SLA padrão 48h aceitável? | **Sim** (padrão Marco Civil Art. 19) |
| Q38 | Marketplace Tier 2 fixo: alguma exceção pode forçar Tier 3? (ex: marketplace de armas) | **Sim** — categoria proibida explícita → recusa direta |
| Q39 | Gateway pequeno (GW-Embrionário < 10 sub-merchants): diligência intensiva é proporcional ou exagerada? | **Proporcional** — gateway pequeno é vetor de entrada de fraude (princípio invertido) |
| Q40 | Seguro de responsabilidade civil em Tier 3 PV: cobertura mínima R$ 1M? | **R$ 1-2M por evento** (benchmark) |

---

## 7. Estatísticas consolidadas — Bloco 5 (Partes 1+2+3 = 8/13 segmentos)

| Item | Total Parte 1+2+3 |
|------|-------------------|
| Perguntas canônicas | 48 (8 segmentos × 6) |
| Bloqueios novos catalogados | ~150+ |
| Capabilities específicas | ~40+ |
| Datasets novos | ~50+ |
| Backend functions previstas | ~80+ |
| Normas regulatórias mapeadas | ~80+ |

---

**Próximo:** Bloco 5 Parte 4/5 — segmentos restantes (Turismo, Educação, SaaS, FoodTech/MPE/Pix, Link Pagamento, Serviços B2B/Locais). Restam **5 segmentos**.