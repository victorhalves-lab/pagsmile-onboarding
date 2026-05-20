# V5.2 — BLOCO 5 (PARTE 4/5 — FINAL): Segmentos SaaS, Serviços B2B, Serviços Locais, Turismo

**Data:** 20/05/2026
**Status:** Diagnóstico microscópico — Parte 4 de 4 (segmentos 10-13 de 13) — **BLOCO 5 COMPLETO**
**Documentos-fonte analisados:**
- `SaaS_V5_1_Microscopico.md` (2.916 linhas)
- `ServicosB2B_V5_1_Microscopico.md` (2.703 linhas)
- `ServicosLocais_V5_1_Microscopico.md` (3.032 linhas)
- `Turismo_V5_1_Microscopico.md` (2.465 linhas)

---

## 0. Tabela de progresso Bloco 5 — FINAL

| # | Segmento | Status | Tier policy | Crítico? |
|---|----------|--------|-------------|----------|
| 1 | Ecommerce | ✅ Parte 1 | Por TPV | Não |
| 2 | Eventos | ✅ Parte 2 | Por TPV | Não (op. sensível) |
| 3 | Infoprodutos | ✅ Parte 1 | Por TPV | Não |
| 4 | Crossborder | ✅ Parte 2 | Tier 3-only | Sim (#4 críticos) |
| 5 | Dropshipping | ✅ Parte 2 | Tier 3-only | Sim (#2 críticos) |
| 6 | Marketplace | ✅ Parte 3 | Tier 2 fixo | Sim (#3 críticos) |
| 7 | Gateway | ✅ Parte 3 | Tier 3-only | Sim (#1 críticos) |
| 8 | Plataforma Vertical | ✅ Parte 3 | Por TPV + complex. | Não (alta densidade reg.) |
| 9 | **Turismo** | ✅ **Parte 4** | **Por TPV** | Não (sensível) |
| 10 | **SaaS** | ✅ **Parte 4** | **Por TPV** | Não (sensível) |
| 11 | **Serviços B2B** | ✅ **Parte 4** | **Por TPV + valor contrato** | Não (estrutural diferente) |
| 12 | **Serviços Locais** | ✅ **Parte 4** | **Por TPV (predomina T1)** | Não (incl. massiva MEI) |

**Progresso:** **13/13 segmentos diagnosticados — BLOCO 5 COMPLETO ✅**

> **Nota:** o usuário enviou 4 documentos finais; o framework V5.1 contava com 13 segmentos. Educação e FoodTech/MPE/Pix/Link Pagamento referenciados no Bloco 1 não tiveram documento Ultra dedicado entregue — ficam para revisão posterior.

---

## 1. SEGMENTO TURISMO (`seg_turismo`)

### 1.1 Identidade
- **Tier policy:** Por TPV
- **Ranking:** Não-crítico regulatoriamente, mas **operacionalmente sensível** (chargeback estrutural alto + risco de falência cascateada + antecipação extrema + sazonalidade)
- **Característica única:** **janela temporal entre pagamento e prestação** medida em meses, não dias

### 1.2 As 5 morfologias canônicas

| Cod | Morfologia | Risk |
|-----|------------|------|
| **A** | Agência consolidadora (B2B+B2C) — CVC, Decolar | Médio-alto |
| **B** | Agência de viagens varejo (B2C) | Médio |
| **C** | Operadora de turismo (criação de produto) | Médio |
| **D** | Hospedagem direta (hotel/pousada/resort/hostel) | Baixo-médio |
| **E** | Experiências locais e tours | Baixo |

### 1.3 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_turismo_morphology` | Morfologia A/B/C/D/E | **Crítica** |
| 2 | `q_seg_turismo_cadastur` | **CADASTUR ativo + categoria** (Lei 11.771/2008) | **CRÍTICA** |
| 3 | `q_seg_turismo_antecipation_window` | Janela média pagamento→viagem | Alta |
| 4 | `q_seg_turismo_supplier_concentration` | Concentração top-5 fornecedores (cias aéreas, hotéis, GDS) | Alta |
| 5 | `q_seg_turismo_chargeback_history` | Histórico de chargeback rate + motivos top | Alta |
| 6 | `q_seg_turismo_consumer_protection` | Mecanismos de proteção consumidor (reserva técnica, seguro, fundo) | Alta |

### 1.4 Subfaixas

| Subfaixa | Critério |
|----------|----------|
| **TUR-Pequena** | TPV < R$ 100k/mês |
| **TUR-Média** | TPV R$ 100k-2M/mês |
| **TUR-Grande** | TPV > R$ 2M/mês |

### 1.5 Os 10 riscos estruturais
1. **Chargeback estruturalmente alto** (1,5-4% — score 480, maior do segmento)
2. **Falência cascateada de fornecedor** (123 Milhas, MaxMilhas, Hurb, Avianca)
3. **Antecipação descasada de capacidade** (Ponzi turística)
4. Agência fantasma
5. Cadastur ausente
6. Sazonalidade extrema mal gerida
7. Concentração de canal de venda
8. LGPD em dados sensíveis de viajantes
9. Compliance fiscal específico (ISS turismo)
10. Fraude de cartão em pacote falso

### 1.6 Detecção "agência fantasma" V5.1 (capability única)
**Triggers:** janela > 365 dias + crescimento > 200%/ano + CNPJ < 24 meses + reserva técnica < 70% do passivo = perfil 123 Milhas → **recusa preventiva**

### 1.7 Marco regulatório
- **Lei 11.771/2008** (Lei do Turismo) — Cadastur obrigatório
- **Decreto 7.381/2010 + Portaria MTur 130/2011** — operacionaliza
- **CDC reforçado** (jurisprudência STJ específica turismo — REsp 1.299.218, 1.378.024, 1.732.626)
- **Lei 14.034/2020** (regulação aviação pandemia)
- **Lei 13.872/2019** (cancelamento por força maior)
- **Resoluções ANAC 400/2016, 542/2019**
- **Circ. BCB 3.978/2020** (Patch V5.1)

### 1.8 B-series específicas Turismo (15+)
B-CAD-TUR-1/2/3, B-CB-TUR-1/2/3, B-TUR-CASCATA-1/2, B-TUR-CONCENTRACAO-1, B-TUR-ANTECIPACAO-1/2/3, B-TUR-FANTASMA-1/2, B-PROTECAO-TUR-1/2/3, B-MORF-TUR-1/2

### 1.9 Capabilities específicas (6)
1. **Dispute Management Reforçado** (auto se chargeback > 3%)
2. **Antifraude Específico Turismo** (3DS > R$ 500)
3. **Monitoramento de Fornecedores** (BDC contínuo top-5)
4. **Reserve Tracking** (ratio reserva/passivo via Patch V5.1)
5. ECAD Tracking (quando híbrido com eventos)
6. Cross-border (quando receita internacional > 30%)

### 1.10 Custo BDC Turismo
- TUR-Pequena (T1): R$ 22-38 inicial + R$ 0,80-1,50/mês
- TUR-Média (T2): R$ 35-58 + R$ 1-2/mês
- TUR-Grande (T3): R$ 55-95 + R$ 2-3/mês

### 1.11 Diferencial V5.1 único — Validação Cadastur em tempo real via API MTUR
Concorrentes pedem upload de PDF; V5.1 consulta API pública MTUR e retorna status instantâneo. Reduz fricção + reduz erro + reduz risco.

---

## 2. SEGMENTO SAAS (`seg_saas`)

### 2.1 Identidade
- **Tier policy:** Por TPV
- **Ranking:** Não-crítico regulatoriamente, **operacionalmente sensível** (cancelamento = ponto de tensão jurídico SENACON; LGPD central; transferência internacional frequente)
- **Característica única:** modelo recorrente (MRR/ARR) + cancelamento como vetor de risco #1

### 2.2 As 6 morfologias canônicas

| Cod | Morfologia | Risk |
|-----|------------|------|
| **A** | B2C produtividade pessoal | Médio |
| **B** | B2B horizontal (CRM, e-mail, gestão) | Baixo-médio |
| **C** | B2B vertical (healthtech, legaltech, etc.) | Baixo |
| **D** | Assinatura tipo Netflix (catálogo) | Médio |
| **E** | Freemium com upgrade pago | Médio-alto |
| **F** | IaaS / PaaS / Cloud infrastructure | Baixo regulatório, médio operacional |

### 2.3 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_saas_morphology` | Morfologia A-F | **Crítica** |
| 2 | `q_seg_saas_revenue_model` | mensalidade/per-seat/usage-based/tiered/freemium | Alta |
| 3 | `q_seg_saas_cancellation_ux` | **UX de cancelamento (SENACON 1/2021)** | **CRÍTICA MÁXIMA** |
| 4 | `q_seg_saas_data_processing` | Tratamento LGPD + transferência internacional | **Crítica** |
| 5 | `q_seg_saas_churn_management` | Churn, LTV/CAC, net retention | Média |
| 6 | `q_seg_saas_regulatory_compliance` | Compliance consolidado | Alta |

### 2.4 Subfaixas

| Subfaixa | Critério |
|----------|----------|
| **SAS-Pequena** | TPV < R$ 100k OU MRR < R$ 80k |
| **SAS-Média** | TPV R$ 100k-1.5M OU MRR R$ 80k-1M |
| **SAS-Grande** | TPV > R$ 1.5M OU MRR > R$ 1M OU IaaS porte |

### 2.5 Os 10 riscos estruturais
1. **UX cancelamento abusiva (SENACON 1/2021 — score 350)**
2. **LGPD não-conformidade material (score 360)**
3. **Transferência internacional inadequada (Art. 33-36 — score 350)**
4. Chargeback assinatura por "esquecimento" (200)
5. Free trial → conversão automática problemática
6. Usage-based fatura surpresa (IaaS)
7. Vazamento de dados (data breach)
8. Falência ou descontinuação do produto (B2B refém)
9. Disputas tributárias (ISS vs ICMS sobre SaaS)
10. Dependência App Store/Google Play (mobile)

### 2.6 Marco regulatório (7 camadas)
1. **CDC (Lei 8.078/1990)** Art. 6, 14, 39, 49
2. **Resolução SENACON 1/2021** (cancelamento = tão fácil quanto contratação)
3. **LGPD (Lei 13.709/2018)** + **Art. 33-36** (transferência internacional) + **Art. 14** (crianças)
4. **Marco Civil da Internet (Lei 12.965/2014)**
5. **Decreto 8.771/2016**
6. **Lei 13.146/2015** (Acessibilidade)
7. **Circ. BCB 3.978/2020** (Patch V5.1)

### 2.7 Detecção "dark patterns" V5.1 (capability única)
4 tipos identificados: **Roach Motel** (fácil entrar, difícil sair), **Disguised Ads**, **Confirmshaming**, **Forced Continuity**

### 2.8 B-series específicas SaaS (15+)
B-MORF-SAS-1/2/3, B-SAS-REV-1/2/3, B-SAS-CANCEL-1/2/3/4, B-SAS-LGPD-1/2/3/4/5, B-SAS-CHURN-1/2/3, B-COMPL-SAS-1/2/3/4

### 2.9 Capabilities específicas (8)
1. **Subscription Cancel UX** (teste trimestral via URL kyc plugin)
2. **LGPD Standard** (Tier 2+ universal)
3. **LGPD Advanced** (Tier 3 com dados sensíveis ou IA)
4. **Subscription Dispute Reforçado** (chargeback > 1%)
5. **LGPD Free Users Analysis** (Morfologia E)
6. **SLA Monitor** (IaaS/PaaS)
7. **Transferência Internacional Validator**
8. **DPA Template Provider** (B2B)

### 2.10 Diferencial V5.1 único — Teste automatizado de UX de cancelamento
URL kyc plugin acessa página declarada, cria conta de teste, executa fluxo de cancelamento, mede cliques + retenção + tempo. Score 0-100. Concorrentes confiam em declaração ou pedem screenshot. **V5.1 mede em vivo.**

### 2.11 Custo BDC SaaS
- SAS-Pequena (T1): R$ 10-18 + R$ 2-4/mês
- SAS-Média (T2): R$ 18-34 + R$ 5-10/mês
- SAS-Grande (T3): R$ 28-50 + R$ 11-22/mês

---

## 3. SEGMENTO SERVIÇOS B2B (`seg_servicos_b2b`)

### 3.1 Identidade
- **Tier policy:** Por TPV + valor médio de contrato (contratos altos podem forçar Tier 2+ por concentração)
- **Ranking:** Não-crítico, **estruturalmente DIFERENTE dos outros 12**: relação B2B reduz aplicação do CDC, deslocando eixo para Direito Civil/Empresarial
- **Característica única:** **contrato bilateral** é instrumento jurídico central + **inadimplência corporativa** substitui chargeback do B2C

### 3.2 As 6 morfologias canônicas

| Cod | Morfologia | Risk |
|-----|------------|------|
| **A** | Consultoria Estratégica de Topo (Falconi, BCG, McKinsey-equivalente) | Médio (concentração alta) |
| **B** | Consultoria Especializada / Boutique | Médio |
| **C** | Agência (Marketing, Branding, Publicidade) | Médio-alto (margens) |
| **D** | Software House / Dev Shop (IP central) | Médio-alto |
| **E** | Outsourcing / Body Shop (CLT vs PJ — risco trabalhista) | Alto trabalhista |
| **F** | Profissionais Regulados B2B (advocacia corporativa, auditoria) | Alto setorial |

### 3.3 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_b2b_morphology` | Morfologia A-F | **Crítica** |
| 2 | `q_seg_b2b_contract_management` | Gestão contratual (escopo, IP, sigilo, rescisão) | **Crítica** |
| 3 | `q_seg_b2b_revenue_concentration` | **Concentração top-N clientes (Risco #1 — score 440)** | **CRÍTICA MÁXIMA** |
| 4 | `q_seg_b2b_lgpd_dpa` | LGPD via DPA (operador-controlador) | Alta |
| 5 | `q_seg_b2b_payment_terms` | DSO + inadimplência (Risco #2 — score 280) | Alta |
| 6 | `q_seg_b2b_regulatory_compliance` | Consolidador | Alta |

### 3.4 Subfaixas

| Subfaixa | Critério |
|----------|----------|
| **B2B-Pequena** | TPV anual < R$ 1M |
| **B2B-Média** | TPV anual R$ 1M-10M |
| **B2B-Grande** | TPV anual > R$ 10M OU clientes Fortune 500 |

### 3.5 Conceito ÚNICO "vendor lock-in inverso"
Operação dependente de 1 cliente top representando > 50% receita; saída desse cliente inviabiliza a empresa. Casos célebres setor.

### 3.6 Os 10 riscos estruturais
1. **Concentração de receita top (score 440 — maior do segmento)**
2. **Inadimplência corporativa material (score 280)**
3. **LGPD via DPA inadequado (score 250)**
4. Disputa contratual sobre escopo/entrega
5. Propriedade intelectual sobre entregáveis
6. Vínculo trabalhista alegado (Morf. E)
7. Quebra de sigilo (NDA violado)
8. Disputas tributárias (ISS, IR)
9. Saída de sócio chave / equipe sênior
10. Reputação por entrega ruim

### 3.7 Marco regulatório (8 camadas)
1. **Código Civil (Lei 10.406/2002)** Art. 593-609 + Art. 421-480 — **CENTRAL**
2. **Lei das S.A. (Lei 6.404/1976)**
3. **CDC** — aplicação **REDUZIDA** (jurisprudência STJ majoritária)
4. **LGPD via DPA** Art. 5 IV/VII, Art. 39, Art. 42-43
5. **Marco Civil**
6. **Estatutos profissionais** (OAB, CRC, CREA, CFP)
7. **Lei 14.133/2021** (Nova Lei de Licitações)
8. **Circ. BCB 3.978/2020** + **CLT** (Morf. E)

### 3.8 B-series específicas Serviços B2B (20+)
B-MORF-B2B-1/2/3/4, B-B2B-CONT-1/2/3/4/5, B-B2B-CONC-1/2/3/4, B-B2B-LGPD-1/2/3/4, B-B2B-PAY-1/2/3/4, B-COMPL-B2B-1/2/3/4

### 3.9 Capabilities específicas (10)
1. **Contract Excellence** (Tier 2+)
2. **IP Framework** (Morf. C e D)
3. **DPA Framework** (Tier 2+)
4. **DPA Framework Avançado** (Tier 3)
5. **Concentration Monitor** (top 1 > 30%)
6. **Concentration Monitor REFORÇADO** (Tier 3 com top 1 > 50%)
7. **Credit Analysis B2B** (DSO > 90d ou inadim > 3%)
8. **Labor Analysis** (Morf. E)
9. **Estatuto Profissional** (Morf. F)
10. **Media Monitor** (Tier 3)

### 3.10 Diferenciais V5.1 únicos
- **Análise de concentração receita** com cross-check Serasa Experian Empresas dos top clientes
- **Distinção CDC vs Código Civil** (regime empresarial)
- **Capability Labor Analysis** específica Morf. E (BR)
- **DPA Framework por morfologia** (templates específicos)
- **Análise de DSO via Balanço** (Patch V5.1)

### 3.11 Custo BDC Serviços B2B
- B2B-Pequena (T1): R$ 12-22 + R$ 2-4/mês
- B2B-Média (T2): R$ 25-45 + R$ 5-10/mês
- B2B-Grande (T3): R$ 50-90 + R$ 12-25/mês (com Serasa Empresas top clientes)

---

## 4. SEGMENTO SERVIÇOS LOCAIS (`seg_servicos_locais`)

### 4.1 Identidade
- **Tier policy:** Por TPV (predomina Tier 1 com fast-track MEI)
- **Ranking:** Não-crítico, **o segmento com MAIOR VOLUME de pequenos sellers** (~25-30% do total quando framework completo) e maior variabilidade operacional
- **Característica única:** estabelecimento físico + canal online complementar + **predominância MEI/Simples Nacional** (60-70%)

### 4.2 As 6 morfologias canônicas

| Cod | Morfologia | Tipo | Risk |
|-----|------------|------|------|
| **A** | Restaurante / Bar / Cafeteria com delivery próprio | ANVISA 216 + AVCB | Médio |
| **B** | Salão de Beleza / Estética / Barbearia | ANVISA 7 + habilitação | Médio |
| **C** | Oficina / Serviço Técnico | INMETRO + Garantia CDC | Médio |
| **D** | Pet Shop / Veterinária | CRMV quando vet | Médio |
| **E** | Pousada / Hotel Pequeno / Casa de Temporada | **AVCB + Cadastur OBRIGATÓRIOS** | Médio-alto |
| **F** | Mercadinho / Comércio Local com delivery | Vigilância sanitária | Médio |

### 4.3 As 6 perguntas canônicas

| # | ID | Tema | Criticidade |
|---|-----|------|-------------|
| 1 | `q_seg_loc_morphology` | Morfologia A-F | **Crítica** |
| 2 | `q_seg_loc_setorial_compliance` | **Alvarás setoriais (Risco #1 — score 320)** | **CRÍTICA** |
| 3 | `q_seg_loc_local_reputation` | Google Reviews + TripAdvisor + Reclame Aqui | Alta |
| 4 | `q_seg_loc_workforce_management` | CLT vs MEI próprio vs PJ (Risco #2 — score 294) | Alta |
| 5 | `q_seg_loc_lgpd_proportional` | LGPD proporcional (Res. ANPD 2/2022) | Média |
| 6 | `q_seg_loc_regulatory_compliance` | Consolidador | Alta |

### 4.4 Subfaixas (4 — única do framework)

| Subfaixa | Critério | Tempo onboarding |
|----------|----------|------------------|
| **SL-Micro (MEI)** | TPV anual < R$ 81k | **15-25 min FAST-TRACK** |
| **SL-Pequena** | TPV R$ 81k-360k | 25-45 min |
| **SL-Média** | TPV R$ 360k-3M | 45-90 min |
| **SL-Grande** | TPV > R$ 3M (rede local) | 90-150 min |

### 4.5 Diferencial ESTRUTURANTE V5.1 — Fast-track MEI
- Onboarding 15-25 min (vs 60+ min padrão)
- Defaults inteligentes baseados em CNAE
- Validação automática via Receita Federal
- Suporte via WhatsApp prioritário (não exige e-mail)
- Análise simplificada Patch V5.1 baseada em DASN-SIMEI

### 4.6 Os 10 riscos estruturais
1. **Ausência ou irregularidade de alvará setorial (score 320 — maior)**
2. **Risco trabalhista (CLT vs PJ disfarçada — score 294)**
3. **Sazonalidade extrema mal-gerida (Morf. E — score 300)**
4. Reputação Google deteriorada (200)
5. Vícios e defeitos CDC Art. 18-26
6. LGPD proporcional inadequada
7. Fluxo de caixa apertado / fechamento abrupto
8. Concorrência local intensa
9. Tributário (DAS/DASN atrasado)
10. Dependência marketplace terceiro (iFood, Booking)

### 4.7 AVCB em Morfologia E — bloqueio crítico
Pousada/hotel sem AVCB = responsabilidade criminal potencial (Boate Kiss). V5.1 trata como **B-LOC-SETOR-CRIT-1 — bloqueio crítico** (aprovação suspensa até regularização).

### 4.8 Marco regulatório (10+ camadas)
1. **CDC** Art. 6, 14, 18-26 (vícios), 30, 35, 39
2. **Marco Civil**
3. **LGPD + Resolução CD/ANPD nº 2/2022 (regime simplificado)**
4. **CLT + Reforma (Lei 13.467/2017)**
5. **LC 123/2006 (Simples) + LC 128/2008 (MEI)**
6. **ANVISA RDC 216/2004** (alimentos) + **RDC 7/2015** (beleza)
7. **Lei 11.771/2008 (Cadastur)** — Morf. E
8. **Decretos AVCB estaduais** (Morf. E crítico)
9. **Lei 5.517/1968 (CRMV)** — Morf. D
10. **INMETRO** (Morf. C)

### 4.9 B-series específicas Serviços Locais (25+)
B-MORF-LOC-1/2/3/4, B-LOC-SETOR-1/2/3/4/5/6, **B-LOC-SETOR-CRIT-1** (bloqueio crítico Morf. E sem AVCB), B-LOC-REP-1/2/3/4/5, B-LOC-LABOR-1/2/3/4/5, B-LOC-LGPD-1/2/3/4, B-COMPL-LOC-1/2/3/4

### 4.10 Capabilities específicas (11)
1. **Setorial Compliance** (todas Morf. com regulação)
2. **Setorial Compliance REFORÇADA** (Morf. E — AVCB)
3. **Local Reputation Monitor** (Google Places API mensal)
4. **Local Reputation Monitor REFORÇADA** (score < 4.0)
5. **Labor Compliance Local** (estabelecimentos com funcionários)
6. **LGPD Proporcional** (templates simplificados por porte)
7. **CDC Local** (políticas devolução por subnicho)
8. **MEI Fast-Track** (regime MEI detectado)
9. **Seasonal Buffer** (Morf. E)
10. **Multi-Unit Monitor** (SL-Grande rede local)
11. **Media Monitor** (Tier 2+)

### 4.11 Diferenciais V5.1 únicos
- **Fast-track MEI** (estrutural — único no mercado)
- **6 morfologias com tratamento setorial específico**
- **Verificação alvará por subnicho** (ANVISA 216 + 7 + AVCB + Cadastur + CRMV + INMETRO)
- **Google Places API contínua** como métrica oficial
- **Suporte via WhatsApp** (canal adequado ao pequeno empreendedor)
- **Reconhecimento LGPD proporcional** explícito
- **Análise trabalhista por subnicho** (aluguel de cadeira + motoboy MEI)

### 4.12 Custo BDC Serviços Locais (O MENOR DO FRAMEWORK em SL-Micro)
- **SL-Micro (MEI fast-track): R$ 12-29/ano** ← MAIS BAIXO DE TODO O FRAMEWORK
- SL-Pequena: R$ 20-49/ano
- SL-Média: R$ 50-152/ano
- SL-Grande T3: R$ 124-262/ano

---

## 5. DIAGNÓSTICO CONSOLIDADO PARTE 4 — gaps de implementação

### 5.1 Entidades — atualizações necessárias

#### 5.1.1 OnboardingCase — campos adicionais (V5.2)
- `turismo_morphology_v5_2` (enum: A-E)
- `turismo_cadastur_status` (objeto: número, categoria, vencimento, status)
- `turismo_antecipation_window_days` (number)
- `turismo_supplier_top5` (array)
- `saas_morphology_v5_2` (enum: A-F)
- `saas_cancel_quality_score` (number 0-100)
- `saas_lgpd_role` (enum: controlador/operador/ambos)
- `saas_intl_transfer_regions` (array)
- `b2b_morphology_v5_2` (enum: A-F)
- `b2b_concentration_top1_pct` (number)
- `b2b_dso_observed` (number)
- `b2b_backlog_months` (number)
- `loc_morphology_v5_2` (enum: A-F)
- `loc_subfaixa_v5_2` (enum: SL-Micro/Pequena/Média/Grande)
- `loc_mei_fasttrack_eligible` (boolean)
- `loc_google_reviews_score` (number 0-5)
- `loc_avcb_status` (objeto: válido, vencimento, em renovação) — **crítico Morf. E**
- `loc_cadastur_status` (objeto) — Morf. E

#### 5.1.2 Bloqueio — catalogar (V5.2)
**Turismo:** 15 códigos (B-CAD-TUR-1/2/3, B-CB-TUR-1/2/3, B-TUR-CASCATA-1/2, B-TUR-CONCENTRACAO-1, B-TUR-ANTECIPACAO-1/2/3, B-TUR-FANTASMA-1/2, B-PROTECAO-TUR-1/2/3, B-MORF-TUR-1/2)

**SaaS:** 17 códigos (B-MORF-SAS-1/2/3, B-SAS-REV-1/2/3, B-SAS-CANCEL-1/2/3/4, B-SAS-LGPD-1/2/3/4/5, B-SAS-CHURN-1/2/3, B-COMPL-SAS-1/2/3/4)

**Serviços B2B:** 22 códigos (B-MORF-B2B-1/2/3/4, B-B2B-CONT-1/2/3/4/5, B-B2B-CONC-1/2/3/4, B-B2B-LGPD-1/2/3/4, B-B2B-PAY-1/2/3/4, B-COMPL-B2B-1/2/3/4)

**Serviços Locais:** 25 códigos (B-MORF-LOC-1/2/3/4, B-LOC-SETOR-1/2/3/4/5/6, **B-LOC-SETOR-CRIT-1** crítico, B-LOC-REP-1/2/3/4/5, B-LOC-LABOR-1/2/3/4/5, B-LOC-LGPD-1/2/3/4, B-COMPL-LOC-1/2/3/4)

**Total Parte 4:** 79 novos Bloqueios.

#### 5.1.3 Capability — catalogar (V5.2)
**Turismo (6):** Dispute Management Reforçado Turismo, Antifraude Turismo, Monitoramento Fornecedores, Reserve Tracking, ECAD Tracking (híbrido), Cross-border (híbrido)

**SaaS (8):** Subscription Cancel UX, LGPD Standard, LGPD Advanced, Subscription Dispute Reforçado, LGPD Free Users Analysis, SLA Monitor IaaS, Transferência Internacional Validator, DPA Template Provider

**Serviços B2B (10):** Contract Excellence, IP Framework, DPA Framework, DPA Framework Avançado, Concentration Monitor, Concentration Monitor REFORÇADO, Credit Analysis B2B, Labor Analysis B2B, Estatuto Profissional, Media Monitor B2B

**Serviços Locais (11):** Setorial Compliance, Setorial Compliance REFORÇADA, Local Reputation Monitor, Local Reputation Monitor REFORÇADA, Labor Compliance Local, LGPD Proporcional, CDC Local, **MEI Fast-Track** (única no mercado), Seasonal Buffer, Multi-Unit Monitor, Media Monitor Local

**Total Parte 4:** 35 capabilities específicas.

#### 5.1.4 Dataset — catalogar (V5.2 específicos Parte 4)
**Turismo:**
- `mtur_cadastur_api` (consulta status + categoria + vencimento — GRATUITO)
- `iata_accreditation_list` (Morf. A)
- `abav_braztoa_fbha_abih_membership` (associações setoriais)

**SaaS:**
- `url_kyc_plugin_cancel_test` (teste UX de cancelamento)
- `app_store_google_play_status` (mobile)
- `anpd_dpo_publico` (cadastro público quando disponível)
- `abes_assespro_membership`

**Serviços B2B:**
- `serasa_experian_empresas` (análise top clientes B2B)
- `processes_pj_trabalhistas` (focus Morf. E)
- `dpa_template_repository` (templates por morfologia)

**Serviços Locais:**
- **`google_places_api`** (uso intensivo — central no segmento)
- `tripadvisor_api` (Morf. E)
- `cadastur_consulta` (compartilhado com Turismo, Morf. E)
- `crmv_consulta` (Morf. D — compartilhado com Plataforma Vertical)
- `bases_publicas_alvara_municipal` (algumas prefeituras)
- `dasn_simei_consulta` (MEI fast-track)

### 5.2 Templates QuestionnaireTemplate (V5.2)

**11 novos templates:**
1. `seg_turismo_T1_pequena`
2. `seg_turismo_T2_media`
3. `seg_turismo_T3_grande`
4. `seg_saas_T1_pequena`
5. `seg_saas_T2_media`
6. `seg_saas_T3_grande`
7. `seg_servicos_b2b_T1_pequena`
8. `seg_servicos_b2b_T2_media`
9. `seg_servicos_b2b_T3_grande`
10. **`seg_servicos_locais_T1_MEI_fasttrack`** (FAST-TRACK 15-25 min)
11. `seg_servicos_locais_T1_pequena`
12. `seg_servicos_locais_T2_media`
13. `seg_servicos_locais_T3_grande`

### 5.3 Questions a criar (V5.2 — 24 novas)

**Turismo (6):** q_seg_turismo_morphology, q_seg_turismo_cadastur, q_seg_turismo_antecipation_window, q_seg_turismo_supplier_concentration, q_seg_turismo_chargeback_history, q_seg_turismo_consumer_protection

**SaaS (6):** q_seg_saas_morphology, q_seg_saas_revenue_model, q_seg_saas_cancellation_ux, q_seg_saas_data_processing, q_seg_saas_churn_management, q_seg_saas_regulatory_compliance

**Serviços B2B (6):** q_seg_b2b_morphology, q_seg_b2b_contract_management, q_seg_b2b_revenue_concentration, q_seg_b2b_lgpd_dpa, q_seg_b2b_payment_terms, q_seg_b2b_regulatory_compliance

**Serviços Locais (6):** q_seg_loc_morphology, q_seg_loc_setorial_compliance, q_seg_loc_local_reputation, q_seg_loc_workforce_management, q_seg_loc_lgpd_proportional, q_seg_loc_regulatory_compliance

### 5.4 Backend functions a criar (V5.2 — 30+)

**Turismo (8):**
1. `mtourCadasturConsult` — API MTUR pública (CRÍTICO)
2. `turSupplierMonitor` — BDC contínuo top-5 fornecedores
3. `turReserveTracker` — ratio reserva/passivo via Patch V5.1
4. `turReclameAquiTurismoMonitor` — cross-check específico
5. `turDisputeManager` — workflow defesa por motivo típico
6. `turAntifraudeReinforced` — 3DS > R$ 500 + velocity rules
7. `turFantasmaDetector` — heurística agência fantasma (Ponzi)
8. `turSeasonalityAnalyzer` — análise sazonal NE BR

**SaaS (8):**
9. **`saasCancellationUxTest`** — URL kyc plugin testa fluxo cancelamento (DIFERENCIAL)
10. `saasLgpdComplianceMonitor` — política + DPA via plugin
11. `saasIntlTransferValidator` — verifica DPA com cloud providers
12. `saasChurnObservedAnalyzer` — declarado vs observado pós-onboarding
13. `saasDpaTemplateProvider` — templates por morfologia
14. `saasFreeUsersLgpdAnalyzer` — Morf. E
15. `saasSlaMonitor` — IaaS uptime
16. `saasSubscriptionDisputeManager` — workflow assinatura

**Serviços B2B (8):**
17. `b2bSerasaEmpresasTopClients` — análise saúde top clientes
18. `b2bConcentrationMonitor` — webhook quando top muda
19. `b2bDsoAnalyzer` — Balanço (idade Contas a Receber)
20. `b2bDpaFrameworkProvider` — templates por morfologia
21. `b2bIpFrameworkProvider` — templates (Morf. C, D)
22. `b2bLaborAnalyzer` — processes PJ + termo autonomia (Morf. E)
23. `b2bCreditAnalyzerB2B` — Serasa Empresas + DSO
24. `b2bContractDisputeManager` — Code Civil + jurisprudência

**Serviços Locais (10):**
25. **`locMeiFastTrack`** — onboarding 15-25 min (DIFERENCIAL ESTRUTURANTE)
26. **`locGooglePlacesMonitor`** — API contínua mensal (DIFERENCIAL)
27. `locTripAdvisorMonitor` — Morf. E
28. `locCadasturConsult` — compartilhado com Turismo (Morf. E)
29. `locCrmvConsult` — compartilhado com Plat. Vertical (Morf. D)
30. `locAlvaraMunicipalConsult` — bases públicas (quando disponível)
31. `locWhatsappSupportRouter` — chat suporte via WhatsApp
32. `locLaborComplianceLocal` — CLT vs MEI próprio
33. `locSeasonalBuffer` — Morf. E sazonalidade
34. `locSetorialComplianceMonitor` — verificação anual alvarás por subnicho

### 5.5 Automations a criar (V5.2 — Parte 4)

1. **Scheduled mensal** — `locGooglePlacesMonitor` para todos os clientes Serviços Locais Tier 1+
2. **Scheduled mensal** — `saasCancellationUxTest` para clientes SaaS Tier 2+ B2C
3. **Scheduled trimestral** — `turSupplierMonitor` BDC top-5 fornecedores Turismo
4. **Scheduled anual** — `mtourCadasturConsult` para clientes Turismo (alerta 60 dias antes vencimento)
5. **Scheduled mensal** — `b2bSerasaEmpresasTopClients` para B2B-Grande Tier 3 com concentração > 50%
6. **Entity automation** — quando seller declara regime MEI → ativa `locMeiFastTrack`
7. **Entity automation** — quando Morfologia Turismo declarada → consulta Cadastur automaticamente
8. **Entity automation** — quando Google Reviews score cai > 0.3 ponto em 3 meses → reanálise antecipada Serviços Locais
9. **Webhook** — quando ANPD publica decisão sobre dados sensíveis → notifica casos SaaS relevantes
10. **Webhook** — quando fornecedor top de Turismo entra em RJ/falência → alerta crítico ao cliente

### 5.6 UI / Páginas

**Atualizar:**
- `pages/AnaliseManual` — adicionar tabs específicas Turismo (Cadastur + fornecedores), SaaS (cancelamento UX teste), B2B (concentração), Serviços Locais (Google Reviews + alvarás)
- `pages/AnaliseCompleta` — visualização morfologias específicas + capabilities ativas
- `pages/CadastroDetalhe` — exibir fast-track MEI quando aplicável

**Novas páginas (V5.2):**
- `pages/TurismoDashboard` — Cadastur + fornecedores + reserva técnica
- `pages/SaaSCancelUxDashboard` — fluxos de cancelamento testados + scores
- `pages/B2BConcentrationDashboard` — top clientes + Serasa Empresas
- `pages/LocalSellersDashboard` — Google Reviews + alvarás + MEI fast-track stats

### 5.7 Microcopy / i18n

24 perguntas novas × 8 estados + skip-logic + glossário extenso. **Destaque:** glossário Serviços Locais com termos simplificados para pequeno empreendedor (MEI, DAS, DASN-SIMEI, alvará, AVCB, Cadastur, Google Business, fidelidade, fluxo de caixa) — diferente do glossário B2B sofisticado (MSA, SOW, DPA, DSO, PCLD, backlog).

---

## 6. Plano de implementação Parte 4

### FASE 1 — Schemas e Catálogos
- [ ] Atualizar `OnboardingCase` (+18 campos Parte 4)
- [ ] Catalogar 79 novos Bloqueios
- [ ] Catalogar 35 novas Capabilities
- [ ] Catalogar 14 novos Datasets (MTUR Cadastur, Google Places API, Serasa Empresas, TripAdvisor)

### FASE 2 — Perguntas e Templates
- [ ] Criar 24 novas Questions
- [ ] Criar 13 novos QuestionnaireTemplates (incluindo `seg_servicos_locais_T1_MEI_fasttrack`)
- [ ] Microcopy completa pt-BR (2 glossários: B2B sofisticado + Serviços Locais simplificado)

### FASE 3 — Backend Functions Críticas
- [ ] **`mtourCadasturConsult`** (Turismo — diferencial UX)
- [ ] **`saasCancellationUxTest`** (SaaS — diferencial técnico principal)
- [ ] **`locMeiFastTrack`** (Serviços Locais — diferencial estrutural)
- [ ] **`locGooglePlacesMonitor`** (Serviços Locais — central)
- [ ] **`b2bSerasaEmpresasTopClients`** (B2B — análise saúde top clientes)
- [ ] Outras 25 funções backend listadas

### FASE 4 — Automations
- [ ] Scheduled mensais (Google Places, SaaS Cancel UX, Reclame Aqui)
- [ ] Scheduled trimestral (Turismo fornecedores, B2B Serasa Empresas)
- [ ] Scheduled anual (Cadastur, alvarás municipais)
- [ ] Entity automations (MEI fast-track, Cadastur auto-consult)
- [ ] Webhooks (ANPD, falência fornecedor Turismo)

### FASE 5 — UI/UX
- [ ] Atualizar AnaliseManual, AnaliseCompleta, CadastroDetalhe
- [ ] Criar TurismoDashboard, SaaSCancelUxDashboard, B2BConcentrationDashboard, LocalSellersDashboard

### FASE 6 — Documentação Master
Adicionar em `pages/DocumentacaoMaster`:
- Cap V5.2 — Turismo (5 morfologias + Cadastur + fornecedores cascateadas)
- Cap V5.2 — SaaS (6 morfologias + SENACON UX + LGPD Art. 33-36)
- Cap V5.2 — Serviços B2B (6 morfologias + concentração + DPA)
- Cap V5.2 — Serviços Locais (6 morfologias + Fast-track MEI + Google Reviews)

---

## 7. Pontos a validar (Q41-Q48 — 8 novos)

| # | Ponto | Recomendação |
|---|-------|--------------|
| **Q41** | API MTUR Cadastur tem SLA público para validação real-time? | **Verificar** disponibilidade + implementar fallback |
| **Q42** | Teste UX cancelamento SaaS via URL kyc plugin: criar conta de teste é viável? | **Sim com fallback** — análise manual de screenshots quando bloqueado |
| **Q43** | Serasa Experian Empresas para top clientes B2B: custo R$ 5-12 por análise viável? | **Sim** — top 3-5 + atualização anual |
| **Q44** | Fast-track MEI 15-25 min: defaults inteligentes por CNAE são tecnicamente viáveis? | **Sim** — mapeamento estruturado |
| **Q45** | Google Places API uso intensivo (R$ 0,20-0,50/consulta × milhares/mês): orçamento OK? | **Sim** — central no segmento mais volumoso |
| **Q46** | Suporte WhatsApp para Serviços Locais é estruturalmente viável? | **Sim** — adequado ao público |
| **Q47** | Resolução ANPD 2/2022 (regime simplificado) será reconhecida explicitamente no contrato PagSmile? | **Sim** — diferencial regulatório |
| **Q48** | Webhook OFAC integrado também com ANPD (incidentes públicos LGPD)? | **Sim** — Capability LGPD Sensitive |

---

## 8. Estatísticas consolidadas FINAIS do Bloco 5

| Item | Total (13 segmentos) |
|------|----------------------|
| Perguntas canônicas | **78** (13 × 6) |
| Bloqueios novos V5.2 catalogados | **~280+** |
| Capabilities específicas | **~110+** |
| Backend functions previstas | **~150+** |
| Datasets novos | **~70+** |
| Normas regulatórias mapeadas | **~120+** |

### Custo BDC por segmento (síntese)

| Segmento | Tier mais comum | Custo anual |
|----------|-----------------|-------------|
| **Serviços Locais SL-Micro (MEI)** | T1 fast-track | **R$ 12-29 (mais baixo)** |
| Ecommerce / Infoprodutos / Eventos pequenos | T1 | R$ 30-80 |
| Plataforma Vertical pequena / SaaS pequeno / B2B pequeno | T1/T2 | R$ 40-100 |
| Turismo médio / SaaS médio / Eventos médio | T2 | R$ 80-180 |
| Plataforma Vertical Morf. A healthtech / B2B grande | T3 | R$ 200-426 |
| **Gateway / Crossborder / Dropshipping (críticos)** | T3-only | **R$ 280-520 (mais alto)** |

---

## 9. RESUMO EXECUTIVO — BLOCO 5 CONSOLIDADO (13/13 segmentos)

### 9.1 Os 4 segmentos CRÍTICOS (Tier 3-only ou Tier 2 fixo)
1. **Gateway** (#1 críticos) — Tier 3-only — assimetria informação extrema
2. **Dropshipping** (#2 críticos) — Tier 3-only — opacidade cadeia fornecimento
3. **Marketplace** (#3 críticos) — **Tier 2 FIXO** (único) — governança visível compensa
4. **Crossborder** (#4 críticos) — Tier 3-only — complexidade regulatória máxima

### 9.2 Os 9 segmentos NÃO-CRÍTICOS (Tier por TPV)
5. **Ecommerce** — varejo digital padrão
6. **Eventos** — operacionalmente sensível (cancelamento massivo)
7. **Infoprodutos** — promessa terapêutica + curadoria
8. **Plataforma Vertical** — maior densidade regulatória setorial (7 camadas) — não-crítico mas pode forçar Tier 2+ por complexidade
9. **Turismo** — antecipação extrema + falência cascateada
10. **SaaS** — UX cancelamento SENACON + LGPD central
11. **Serviços B2B** — Código Civil (CDC reduzido) + concentração + DPA
12. **Serviços Locais** — MAIOR VOLUME de sellers (~25-30%) + fast-track MEI

### 9.3 Diferenciais V5.1/V5.2 únicos por segmento (síntese)

| Segmento | Diferencial técnico principal |
|----------|------------------------------|
| Gateway | KYC delegado auditável + Splits obrigatória |
| Dropshipping | Ghost dropshipping detection (origin × shipping_time) |
| Marketplace | Tier 2 fixo + Notice & Takedown protocolizado |
| Crossborder | Extensão_fx + OFAC contínuo + BCB corretoras |
| Ecommerce | Análise URL próprio + risco MCC |
| Eventos | Capability Overbooking Detector (tempo real) |
| Infoprodutos | URL kyc plugin para análise de promessa terapêutica |
| Plataforma Vertical | Verificação contínua CFM/OAB + LGPD Sensitive (Art. 11) |
| **Turismo** | **API MTUR Cadastur tempo real** + monitoramento fornecedores top-5 |
| **SaaS** | **Teste automatizado UX de cancelamento** via URL kyc plugin |
| **Serviços B2B** | Análise de concentração + Serasa Empresas top clientes + DPA por morfologia |
| **Serviços Locais** | **Fast-track MEI (15-25 min)** + Google Places API contínua |

---

**Próximo:** Bloco 6 — REDESIGN_AnaliseDeRisco + Especificação Datasets Tela (UI/UX).

**Bloco 5 ENCERRADO ✅ — Pronto para fase de implementação consolidada.**