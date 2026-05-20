# V5.2 — Diagnóstico Bloco 5: Sub-Entrega E2 (Parte 1/5)

**Documentos analisados:**
- `Ecommerce_V5_1_Microscopico.md` (~2.700 linhas)
- `Eventos_V5_1_Microscopico.md` (~2.730 linhas)
- `Infoprodutos_V5_1_Microscopico.md` (~2.917 linhas)

**Data:** 2026-05-20

---

## 📐 ESTRUTURA COMUM AOS 3 SEGMENTOS

Cada doc segue padrão Ultra:
1. Princípios editoriais (6-8 por segmento)
2. Morfologias operacionais (5-6 sub-tipos)
3. Subfaixas (Pequena/Média/Grande por TPV)
4. 6 perguntas microscópicas (ficha 12 atributos + 9 camadas)
5. 10 riscos estruturais + matriz P×I
6. Mapeamento regulatório
7. Cobertura BDC com custos por Tier
8. Estudo de caso E2E
9. Capabilities específicas (6-9 por segmento)
10. Postura competitiva vs Stone/PagSeguro/Adyen/Stripe

---

## 🧩 INVENTÁRIO DOS 18 IDS DE PERGUNTAS

### seg_ecommerce — 6 perguntas
| ID | Tema | Criticidade |
|---|---|---|
| q_seg_ecommerce_morphology | Morfologia (A-F: D2C/Multimarca/Nicho/Moda/Alimentos/Eletrônicos) | Crítica |
| q_seg_ecommerce_inventory_logistics | Estoque + logística + tempo entrega | Alta |
| q_seg_ecommerce_return_policy | Devolução + CDC Art. 49 (eixo) | Crítica |
| q_seg_ecommerce_chargeback_management | Antifraude + Visa CMP/Mastercard ECP | Crítica |
| q_seg_ecommerce_seasonality | Black Friday + sazonalidade | Alta |
| q_seg_ecommerce_regulatory_compliance | Consolidadora | Alta |

### seg_eventos — 6 perguntas
| ID | Tema | Criticidade |
|---|---|---|
| q_seg_eventos_morphology | Morfologia (A-E: Plataforma/Promotor/Venue/Feira/Privado) | Crítica |
| q_seg_eventos_category | 8 categorias (música/esportivo/infantil/festas/etc) | Crítica |
| q_seg_eventos_anticipation_pattern | Antecipação + concentração temporal | Alta |
| q_seg_eventos_cancellation_policy | Lei 13.872/2019 + CDC | Alta |
| q_seg_eventos_capacity_venue | Capacidade + AVCB + Estatuto Torcedor | Média |
| q_seg_eventos_regulatory_compliance | Consolidadora (ECAD/AVCB/alvarás) | Alta |

### seg_infoprodutos — 6 perguntas
| ID | Tema | Criticidade |
|---|---|---|
| q_seg_info_morphology | Morfologia (A-F: Curso/Mentoria/Comunidade/E-book/Influenciador/Afiliação) | Crítica |
| q_seg_info_marketing_promises | CDC Art. 37 + CONAR (vetor #1, score 400) | Crítica |
| q_seg_info_affiliate_structure | Lei 1.521 vigia pirâmide | Crítica |
| q_seg_info_refund_policy | CDC Art. 49 produto digital | Alta |
| q_seg_info_chargeback_management | Chargeback diferido 60-90 dias | Alta |
| q_seg_info_regulatory_compliance | Consolidadora | Alta |

---

## 🎨 MORFOLOGIAS (17 sub-tipos)

### Ecommerce (6)
- A — D2C (Natura, Reserva)
- B — Multimarca (Magazine Luiza, Americanas)
- C — Nicho (Petlove, Wine.com)
- D — Moda (Dafiti, Renner) — devolução estrutural 15-30%
- E — Alimentos (Pão de Açúcar online) — ANVISA
- F — Eletrônicos (Kabum, Fast Shop) — antifraude reforçado obrigatório

### Eventos (5)
- A — Plataforma 1P (ingressos próprios)
- B — Promotor/Produtor
- C — Casa de shows/Venue (AVCB obrigatório)
- D — Feiras/Congressos B2B
- E — Eventos privados (casamentos, formaturas)

### Infoprodutos (6)
- A — Curso especializado
- B — Mentoria alto ticket (R$5k-50k)
- C — Comunidade paga (SaaS-like)
- D — E-book/template
- E — Influenciador/lifestyle (Media Monitor crítico)
- F — Afiliação profunda (vigia Lei 1.521)

---

## ⚙️ 24 CAPABILITIES IDENTIFICADAS

**Ecommerce (8):** Chargeback Defense, Logística Reversa Estruturada, Sazonalidade Dinâmica, LGPD Standard, ANVISA Tracking, Antifraude Reforçado, Returns Coaching, Reclame Aqui Monitor

**Eventos (6+1):** Dispute Pós-Cancelamento, Antifraude Específico, ECAD Tracking, Overbooking Detector, Sazonalidade Reserve Tracker, LGPD Menores, Cross-border opcional

**Infoprodutos (9):** Promessa Compliance, Affiliate Structure Audit, Refund Coaching, Chargeback Defense Infoprodutos, LGPD Standard, Subscription Cancel UX, Media Monitor, Contract Review, Volatility Buffer

**Únicas (deduplicadas):** ~18 capabilities específicas + 6 já transversais

---

## 🔧 NOVOS DATASETS / INTEGRAÇÕES

| Dataset | Segmentos | Status |
|---|---|---|
| **URL kyc plugin** (análise landing page) | Todos | ❌ Não existe — PRIORITÁRIO |
| Reclame Aqui API | Todos | ❌ |
| ECAD consulta | Eventos | ❌ |
| AVCB Bombeiros estadual | Eventos | ❌ |
| Alvarás municipais | Eventos | ❌ |
| Alvará Juizado Infância | Eventos | ❌ |
| Vigilância sanitária | EC/EV | ❌ |
| Visa/MC Dispute Reports streaming | Todos | ⚠️ Parcial |
| CONAR consulta pública | Infoprodutos | ❌ |
| Hotmart/Eduzz/Kiwify API | Infoprodutos | ❌ |
| Cadastros de venues conhecidos | Eventos | ❌ |
| CONFEA/CREA (ART engenharia) | Eventos | ❌ |
| Google Reviews | Eventos | ❌ |
| ABCEad/ABRACE/ABRAFEC/ABComm | Diversos | ❌ |

---

## 🚨 NORMAS REGULATÓRIAS NOVAS

| Norma | Segmento | Uso |
|---|---|---|
| CDC Art. 37 (publicidade enganosa) | INFO (central), EC | Score promessa |
| CDC Art. 49 (arrependimento 7d) | Todos | Política reembolso |
| CDC Art. 42 (devolução em dobro) | Todos | Penalidade |
| Decreto 7.962/2013 (Lei Comércio Eletrônico) | EC | Transparência |
| Decreto SAC 11.034/2022 | EC (>R$1M) | SAC 24/7 |
| Lei 13.872/2019 (cancelamento força maior) | EV | Remarcação/crédito 12m |
| Lei 10.671/2003 (Estatuto Torcedor) | EV esportivos | Capacidade vinculante |
| Lei 8.069/1990 ECA Art. 75, 149 | EV infantis | Alvará Juizado |
| Lei 9.610/1998 (ECAD) | EV com música | Direitos autorais |
| Lei 12.305/2010 (Resíduos Sólidos) | EC físico | Logística reversa |
| Lei 1.521/1951 Art. 2 IX (Pirâmide) | INFO | Vigia afiliação |
| CONAR | INFO | Diretrizes publicidade |
| Visa CMP / Mastercard ECP | EC/INFO | Thresholds chargeback |

---

## 🆕 ~55 NOVOS B-SERIES SEGMENTO-ESPECÍFICOS

**Ecommerce (~17):** B-MORF-EC-1/4, B-EC-LOG-1/4, B-EC-CDC-1/4, B-EC-CHARGEBACK-1/4, B-EC-SEASON-1/3, B-EC-FANTASMA-1, B-COMPL-EC-1/4

**Eventos (~20):** B-MORF-EV-1/3, B-CAT-EV-1/3, B-EV-ANTECIP-1/3, B-CANC-EV-1/4, B-CAPAC-EV-1/4, B-COMPL-EV-1/4, B-EV-FANTASMA-1/2, B-EV-CANCEL-MASSIVE-1, B-EV-OVERBOOKING-1, B-EV-COMPL-ECAD-1, B-EV-COMPL-ECA-1

**Infoprodutos (~22):** B-MORF-INFO-1/4, B-IP-PROMESSA-1/5, B-IP-PIRAMIDE-1/3, B-IP-AFILIADO-1, B-IP-REFUND-1/5, B-IP-CHARGEBACK-1/5, B-COMPL-INFO-1/4

**Projeção 13 segmentos:** ~234 B-series segmento-específicos (somados aos 72 transversais → ~306 total)

---

## ❌ 20 GAPS CRÍTICOS (Bloco 5)

| # | Gap | Status |
|---|---|---|
| 1 | URL kyc plugin (análise automática landing page) — usado em todos | ❌ |
| 2 | Reclame Aqui API integration | ❌ |
| 3 | ECAD consulta automatizada | ❌ |
| 4 | AVCB estadual consulta | ❌ |
| 5 | Alvarás municipais consulta | ❌ |
| 6 | Visa/MC Dispute Reports streaming mensal | ⚠️ |
| 7 | Morfologias por segmento não modeladas | ❌ |
| 8 | Subfaixas Pequena/Média/Grande por segmento ausente | ❌ |
| 9 | 24 capabilities específicas não catalogadas | ❌ |
| 10 | ~55 B-series específicos não seedados | ❌ |
| 11 | Patch V5.1 sem análise sazonalidade/volatilidade/pico | ❌ |
| 12 | Capability Overbooking Detector (real-time) | ❌ |
| 13 | Reanálise antecipada por evento (Black Friday/Lançamento) | ❌ |
| 14 | Detecção de pirâmide (Lei 1.521) heurística | ❌ |
| 15 | Score transparência publicitária (0-100) | ❌ |
| 16 | Reserva técnica dinâmica calibrada por morfologia | ❌ |
| 17 | Templates fornecidos (políticas, marketing, contratos) | ❌ |
| 18 | Compliance Manager dedicado por morfologia | ⏸️ Organizacional |
| 19 | Visualização regulação aplicável por categoria (Eventos UX) | ❌ |
| 20 | Slider/timeline antecipação visual (Eventos) | ❌ |

---

## 🎯 PLANO DE IMPLEMENTAÇÃO BLOCO 5

### FASE 6.1 — Entidade `Segmento` (catálogo)
- [ ] Schema com morfologias[], subfaixas[], perguntas_ids[], capabilities_default[], b_series_aplicaveis[], normas_regulatorias[], datasets_obrigatorios[]

### FASE 6.2 — Seed 18 perguntas microscópicas (3 segmentos)
- [ ] 6 Ecommerce + 6 Eventos + 6 Infoprodutos com ficha completa de 12 atributos

### FASE 6.3 — Seed ~55 Bloqueios segmento-específicos
- [ ] Estende `Bloqueio` catalog do Bloco 2

### FASE 6.4 — Seed 24 Capabilities específicas
- [ ] Estende `Capability` catalog do Bloco 2

### FASE 6.5 — Classificador de morfologia
- [ ] `lib/v5_1/morphologyClassifier.js` por segmento

### FASE 6.6 — URL kyc plugin (PRIORITÁRIO)
- [ ] Backend function `urlKycPluginAnalyze` — recebe URL + tipo (devolução/marketing/afiliação/cancelamento), retorna score 0-100 + flags
- [ ] Usa scraping + InvokeLLM para análise semântica

### FASE 6.7 — Reclame Aqui via SCRAPING (Q22)
- [ ] Backend function `reclameAquiScrape` (fetch + parsing HTML) com cache mensal de 30 dias

### FASE 6.8 — ECAD/AVCB/Alvarás via UPLOAD MANUAL (Q23)
- [ ] Novos `DocumentType`: ecad_compliance, avcb_bombeiros, alvara_municipal, alvara_juizado_infancia
- [ ] Validação humana por analista no painel de revisão
- [ ] OCR opcional para extrair data de vencimento (nice-to-have)

### FASE 6.9 — Patch V5.1 estendido
- [ ] Análise sazonalidade (Ecommerce/Eventos) — pico mensal
- [ ] Análise volatilidade (Infoprodutos) — desvio padrão
- [ ] Coerência estoque × receita (Ecommerce) — detecção loja-fantasma
- [ ] Chargeback diferido (Infoprodutos) — distribuição temporal

### FASE 6.10 — Capabilities específicas (real-time)
- [ ] ~~Overbooking Detector (Eventos)~~ **Q24 — Removido do escopo**
- [ ] Affiliate Structure Audit (Infoprodutos)
- [ ] Promessa Compliance (INFO/EC)
- [ ] Sazonalidade Dinâmica (EC)

### FASE 6.11 — UX educativa
- [ ] Badges dinâmicas regulação aplicável (Eventos)
- [ ] Slider/timeline antecipação (Eventos)
- [ ] Score URL plugin visível (INFO)

### FASE 6.12 — ~~Templates fornecidos~~ **Q25 — Removido do escopo**

---

## 📊 PROJEÇÃO PARA 13 SEGMENTOS

| Item | Por segmento | Total |
|---|---|---|
| Perguntas microscópicas | 6 | ~78 |
| Morfologias | 5-6 | ~70 |
| Capabilities | 6-9 | ~40 únicas |
| B-series | ~18 | ~234 |
| Subfaixas | 3 | 39 |
| Normas regulatórias | 6-8 | ~30 únicas |
| Datasets externos | 4-6 | ~25 únicos |

---

## ✅ DECISÕES TOMADAS (Q22-Q25) + Q21 EM ESCLARECIMENTO

### ⏳ Q21 — URL kyc plugin: aguardando esclarecimento
Recomendação técnica: backend function própria com `fetch` (scraping) + `InvokeLLM` (análise semântica). Aguardando confirmação.

### ✅ Q22 — Reclame Aqui: SCRAPING
Backend function `reclameAquiScrape` com cache mensal. Sem API paga.

### ✅ Q23 — ECAD/AVCB/Alvarás: UPLOAD MANUAL
Novos `DocumentType`: Comprovante ECAD, AVCB, Alvará Municipal, Alvará Juizado da Infância. Validação humana por analista.

### ✅ Q24 — Overbooking Detector: REMOVIDO DO ESCOPO
Capability não será implementada. Captura declarativa mantém-se, mas sem monitoramento real-time.

### ✅ Q25 — Templates fornecidos: REMOVIDO DO ESCOPO
Sistema valida o que cliente publica; não fornece modelos prontos.

---

## 📌 PRÓXIMO

Aguardando próximo lote de 3 segmentos:
- Marketplace, Gateway, Dropshipping (3 dos 4 críticos)
- OU Educação, SaaS, Plataforma Vertical (não-críticos)
- OU Turismo, Serviços B2B, Serviços Locais

Total restante: 10 segmentos.