# Auditoria da Documentação KYC/KYB + Documentação Master

**Data:** 27 mai 2026  
**Escopo:** `pages/DocumentoKYCKYB` + `pages/DocumentacaoMaster` e todos os componentes filhos  
**Objetivo:** mapear o que existe, o que falta e definir plano de reescrita auditada (V4 preservado + V5.2 adicionado como camada)

---

## 1. ESTRUTURA ATUAL — Inventário

### 1.A. Documento KYC/KYB (`pages/DocumentoKYCKYB`)
Página com **6 abas**, manual com **20 seções** (Cap. 0 a 19).

| Aba | Conteúdo | Componentes | Status V4 | Lacunas V5.2 + novos fluxos |
|----:|----------|-------------|:---------:|-----------------------------|
| 1. Manual de Processos | 20 seções | 20 componentes Doc* | ✅ rico | ❌ zero V5.2 |
| 2. Templates | Microscópico de cada template | DocTemplatesMicroscopico | ✅ ok | ❌ não mostra subseller_lite_v4, faltam novos modelos V5.2 |
| 3. Modelo Dinâmico KYC | Perguntas comuns vs condicionais | DocModeloDinamicoKYC | ✅ analítico | ❌ não cobre fluxo de tiers V5.2 |
| 4. Risk Scoring | Sellers + Subsellers (PDF para bandeiras) | RiskScoringDocTab | ✅ profundo | ❌ não tem variante V5.2 tier-aware |
| 5. BDC + CAF Microscópico | Datasets + custos | DocBdcCafMicroscopico | ✅ ok | ❌ não cobre 58 datasets V5.2 + dimensões analíticas novas |
| 6. Análise de Risco (olhinho) | 12 blocos da tela | RiskAnalysisDocTab | ✅ ok | ❌ não cobre redesign V5.2 da tela (Hero + 4 abas + Smart Cards) |

**Manual de Processos — 20 seções existentes:**
- 0. Glossário (8 blocos, 100+ termos) ✅
- 1. Visão Geral — Pipeline KYC/KYB ✅
- 2. Segmentação por Tipo de Negócio (11 cartão + 3 PIX + 2 subseller) ✅
- 3. Questionários de Compliance (todas perguntas por modelo) ✅
- 4. Documentos Solicitados (base + condicionais) ✅
- 5. Enriquecimento BDC (~40 datasets, retry queue) ✅
- 6. Validação CAF (SDK + Core API + Connect) ✅
- 7. Risk Scoring V4 (fórmula 3 camadas + 13 dimensões) ✅
- 8. Pipeline Automatizado (11 steps) ✅
- 9. Tabela de Decisão Determinística ✅
- 10. Fluxo Subsellers (PJ paridade + PF BACEN) ✅
- 11. SENTINEL IA (4 chamadas paralelas + JSON schema) ✅
- 12. Monitoramento Contínuo (6 níveis) ✅
- 13. Painel do Analista (13 abas do dossiê) ✅
- 14. Governança de Acesso (perfis + 2FA + auditoria) ✅
- 15. Escalações Questionáveis (taxonomia) ✅
- 16. Parceiros de Compliance Externos ✅
- 17. Link Doc-Only ✅
- 18. Doc Compliance Parceiros + Pré-KYC Bancário ✅
- 19. Funis de Captação (Lead V5 + PIX V4 + Fechamento) ✅

### 1.B. Documentação Master (`pages/DocumentacaoMaster`)
Página com **13 capítulos** divididos em subcomponentes (`ch01/*`, `ch02/*`, `ch03/*`).

| Cap | Título | Subcomponentes | Status V4 | Lacunas V5.2 + novos fluxos |
|---:|--------|---------------:|:---------:|----------------------------|
| 01 | Arquitetura (stack, bootstrap, routing, auth, design, secrets) | 7 (Ch01_Stack/Bootstrap/Routing/Auth/DesignSystem/Layouts/Secrets) | ✅ excelente | ⚠️ não menciona contexto Brasil ↔ Global ↔ Unificado |
| 02 | Glossário (siglas, termos, enums, red flags, service_types, subfaixas, bloqueios) | 7 (Ch02_*) | ✅ excelente | ❌ falta vocabulário V5.2 (tier, capability, Cat 5, plano monitoramento) |
| 03 | Pipeline `autoEnrichOnboarding` linha-a-linha | 6 (Ch03_*) | ✅ excelente | ❌ falta pipeline `autoEnrichOnboardingV5_2` |
| 04 | Risk Scoring V4 — código fonte com line numbers | inline | ✅ excelente | ❌ falta motor `scoringV5_2.js` |
| 05 | BigDataCorp dataset-by-dataset | inline | ✅ excelente | ❌ não cobre 58 datasets V5.2 e 13 dimensões analíticas |
| 06 | CAF (SDK + Core API + Connect + webhook HMAC) | inline | ✅ excelente | ⚠️ veto biométrico V5.2 é idêntico — OK |
| 07 | SENTINEL IA (4 chamadas paralelas) | inline | ✅ excelente | ⚠️ não menciona `SentinelFeedback` entity (Fase 1 V5.2) |
| 08 | Funis de Captação (5 funis) | inline | ✅ excelente | ❌ não cobre coleta de Subsellers via Gateway (novo!) |
| 09 | Modelo de Dados (8 entidades centrais com schema) | inline | ✅ excelente | ❌ falta: SubsellerInfoCollection, SubsellerInfoSubmission, GlobalCountryChannel, GlobalCountryFee, GlobalProposal, GlobalQuestionnaire, GlobalComplianceQuestionnaire, UnifiedProposalPackage, PlanoMonitoramento, TermoAdicionalV5_2 |
| 10 | Governança & Acessos (AccessProfile + 2FA + Audit) | inline | ✅ excelente | ✅ ok |
| 11 | Parceiros + Doc-Only + Pré-KYC + Bulk Reprocess + Escalações | inline | ✅ excelente | ⚠️ não menciona Compliance Parceiro v2 (Doc Comp Parceiros + Bank Data) |
| 12 | Propostas, Contratos, Kick-Off | inline | ✅ excelente | ❌ falta: Propostas Globais (Brasil + USD), Pacote Unificado (link único multi-tab) |
| 13 | Questionários de Leads (V5 + PIX V4) microscópico | inline | ✅ excelente | ✅ ok |

---

## 2. O QUE FALTA — Mapeamento das lacunas

### 2.A. V5.2 (precisa entrar como **CAMADA ADICIONAL**, não substituir V4)

V5.2 é o framework novo (consolidação V5.1 + recalibragem) que coexiste com V4. Casos antigos continuam V4; novos casos podem nascer V5.2. **Toda a documentação V4 fica como está** — apenas adicionamos seções/blocos paralelos V5.2.

#### Conteúdo V5.2 a documentar:

**Fundamentos:**
- Framework versioning (campos `framework_version`, `framework_version_at_start`, `_at_submit`, `_at_decision`, `is_transitional_case`)
- 3 princípios novos: tier-aware, capabilities transversais, Cat 5 monitoramento intensivo

**Tiers (3 níveis + Subseller PJ/PF):**
- Tier 1 (TPV ≤ R$30k, escala 0-850)
- Tier 2 (TPV R$30k-200k, escala 0-850) — Marketplace fica fixo aqui
- Tier 3 (TPV ≥ R$200k, escala 0-999) — Gateway/Crossborder sobem aqui
- Subseller PJ (graus A/B/C por TPV)
- Subseller PF (graus A/B/C por renda líquida mensal)

**Capabilities transversais (4):**
- `splits/subseller`
- `crossborder`
- `recurrence` (assinaturas/cobrança recorrente)
- `cap_financial_capacity_validation`

**Datasets (58 vs ~40 V4):**
- Renomeação canônica
- 13 dimensões analíticas (vs 7 do SENTINEL V4 e 13 do scoring V4 — esquemas distintos)
- Estados `not_consulted` + 10 razões catalogadas
- Cross-Validation 16 Campos V5.1 estruturada

**Bloqueios (72 códigos vs 10 do V4):**
- B-XXX-NN categorizado por dimensão
- Bloqueios PF subseller específicos
- 10 bloqueios absolutos (não admitem exceção)

**Questionário dinâmico V5.2:**
- Catálogo único de 80 perguntas (PJ) + 65 (PF subseller)
- 5 modalidades (A=BDC confirm, B=BDC híbrido, C=input puro, D=derivado, E=upload)
- Roteamento por tier + segmento + capabilities ativas
- Real-time block engine (avalia bloqueios durante preenchimento)

**Matriz de Decisão V5.2 (5 categorias vs V4):**
- Cat 1 Auto-Approve
- Cat 2 Conditional
- Cat 3 Manual Review
- Cat 4 Block
- **Cat 5 Intensive Monitoring (NOVO)** — em vez de recusar, libera com plano de monitoramento + TPV cap + rolling reserve adicional + gatilhos de off-boarding ágil

**Patch Financeiro (5 dimensões):**
- tpv_declarado_vs_bdc
- faturamento_doc_vs_ecf
- crc_status
- fluxo_caixa_open_finance
- coerencia_setor
- Status: verde/amarelo/laranja/vermelho

**Entidades novas:**
- `PlanoMonitoramento`
- `TermoAdicionalV5_2`
- `SentinelFeedback`
- `BdcMonitoringEvent`
- `Snapshot` (imutável)
- `Exception` (ampliada com Cat 5)
- `Capability`
- `Dataset` (catálogo)
- `Bloqueio` (catálogo)

**UI Redesign V5.2 (Aba 6 atual):**
- Hero Verdict
- 3 Smart Summary Cards (Top alertas, Top positivos, Cross-val resumo)
- 4 abas (Resumo/Evidências/Dimensional BDC/SENTINEL+Auditoria)
- Dossiê PDF V5.2

### 2.B. Coleta de Subsellers via Gateway (NOVO — fluxo recém-criado)

Esse fluxo foi criado ontem mas **ainda não está em NENHUM documento**:
- `SubsellerInfoCollection` (link gerado por nós para Gateway)
- `SubsellerInfoSubmission` (submissões do Gateway)
- Página admin `/GestaoSubsellerInfoLinks` (criação de links + fluxo "Cliente já fechado" / "Novo cliente")
- Página admin `/SubsellerInfoRecebidos` (inbox com export XLSX)
- Página pública `/SubsellerInfoForm` (formulário do Gateway)
- Função pública `publicSubsellerInfoSubmit`

### 2.C. Propostas Globais (Brasil + USD trilíngue)

Mundo Global inteiro fora do KYC/KYB e da Documentação Master:
- Entidades: `GlobalCountryChannel`, `GlobalCountryFee`, `GlobalProposal`, `GlobalQuestionnaire`, `GlobalComplianceQuestionnaire`, `GlobalInterchangeRate`
- Sidebar separada com contexto Brasil ↔ Global ↔ Unificado (`SidebarContextSwitch`)
- Pricing model: cross_border_interchange | local_payments | hybrid
- Country pricing builder (por país × canal × método)
- KYC global trilíngue (en/pt/zh)
- Suporte a 30+ países (LATAM, APAC, AFRICA, MEA, TURKEY)

### 2.D. Propostas Unificadas (link único multi-tab)

Junta Brasil + Global em uma URL pública só:
- Entidade `UnifiedProposalPackage`
- Página `/CriarPropostaUnificada` (admin)
- Página pública `/u/:slug` (cliente vê tabs Brasil e Global)
- Função pública `publicUnifiedProposal`

### 2.E. Compliance Parceiros v2 (DocCompParceiros + BankData)

A Seção 18 do KYC/KYB cobre, mas o capítulo 11 da Documentação Master menciona só de passagem. Está OK no KYC mas **falta no Master Ch.11**.

---

## 3. PLANO DE AÇÃO PRIORIZADO

A reescrita não pode ser feita em um único turno — são ~50 arquivos, alguns com 600+ linhas. Proposta de execução em **4 fases iterativas**, cada fase entregável e revisável.

### FASE 1 — Camada V5.2 Adicionada em Ambos (MAIOR IMPACTO REGULATÓRIO)

Cria seções **novas** ao lado das V4 existentes, sem mexer no V4. Onde adiciono em cada doc:

**Documento KYC/KYB:**
- Nova seção 7-bis (Risk Scoring V5.2 Tier-Aware) — paralela à seção 7 V4
- Nova seção 8-bis (Pipeline V5.2 — `autoEnrichOnboardingV5_2`) — paralela à seção 8
- Nova seção 9-bis (Matriz Decisão V5.2 com 5 categorias) — paralela à seção 9
- Nova seção 20 (Framework V5.2 — Conceitos Gerais: tiers, capabilities, segmentos canônicos, Cat 5)
- Nova seção 21 (Cat 5 Monitoramento Intensivo — PlanoMonitoramento + TermoAdicionalV5_2)
- Atualização Aba 6 "Análise de Risco" para incluir redesign V5.2 (Hero + Smart Cards + 4 abas)

**Documentação Master:**
- Novo Cap. 14 — V5.2 Framework Geral (composto por Ch14_Fundamentos, Ch14_Tiers, Ch14_Capabilities, Ch14_Segmentos)
- Novo Cap. 15 — V5.2 Engine (Ch15_Datasets58, Ch15_Bloqueios72, Ch15_CrossValidation16, Ch15_ScoringV5_2, Ch15_MatrizDecisao)
- Novo Cap. 16 — V5.2 Questionário Dinâmico (Ch16_Catalogo, Ch16_Modalidades, Ch16_RealtimeBlocks)
- Novo Cap. 17 — V5.2 Cat 5 + Exceções Avançadas (Ch17_Cat5_Monitoramento, Ch17_TermoAdicional, Ch17_PlanoMonitoramento)
- Adicionar nos capítulos existentes:
  - Ch02 (Glossário): bloco V5.2 com termos novos
  - Ch07 (Sentinel): bloco SentinelFeedback
  - Ch09 (Modelo de Dados): schemas das entidades V5.2 (PlanoMonitoramento, TermoAdicionalV5_2, SentinelFeedback, etc.)

### FASE 2 — Coleta de Subsellers Gateway (NOVO FLUXO RECÉM-CRIADO)

**Documento KYC/KYB:**
- Nova seção 18-bis (Coleta de Subsellers via Gateway) — paralela à 18 Pré-KYC Bancário

**Documentação Master:**
- Novo Cap. 8.6 (extensão do Ch08_FunisCaptacao) — Funil 6: Subseller Info Collection
- Adicionar entidades em Ch09: SubsellerInfoCollection, SubsellerInfoSubmission

### FASE 3 — Mundo Global + Propostas Unificadas

**Documento KYC/KYB:**
- Nova seção 22 (Compliance Global — KYB Trilíngue + 30+ países)

**Documentação Master:**
- Novo Cap. 18 — Mundo Global (Ch18_Catalogo_Paises, Ch18_Pricing, Ch18_KYB_Global, Ch18_Simulador)
- Novo Cap. 19 — Propostas Unificadas (Ch19_Pacote, Ch19_LinkPublico_MultiTab)
- Ch12 (Propostas): adicionar bloco "Variante 4 — GlobalProposal" e "Variante 5 — UnifiedProposalPackage"
- Ch01 (Arquitetura): adicionar bloco sobre `SidebarContextSwitch` e contexto Brasil/Global/Unificado

### FASE 4 — Atualizações Cirúrgicas em Conteúdo V4 Existente

Pequenas atualizações de coerência (não reescrita):
- Doc KYC Seção 10 (Subsellers): adicionar nota sobre nova coleta Gateway
- Doc KYC Capa: atualizar versão (v4.0 + v5.2 add-on)
- Master Ch01: mencionar arquitetura multi-contexto
- Master Ch11: corrigir blocos sobre Compliance Parceiros para refletir mudanças recentes (PartnerAssignmentActivity v2, visibility levels, etc.)

---

## 4. ARQUIVOS A CRIAR / EDITAR — Catálogo

### Fase 1 (V5.2) — **~12 arquivos novos + 4 edits**

**Doc KYC/KYB:**
- ✏️ `pages/DocumentoKYCKYB.jsx` — adicionar seções 20, 21 no TOC + imports
- 🆕 `components/kyc-doc/DocFrameworkV5_2.jsx`
- 🆕 `components/kyc-doc/DocCategoria5Monitoramento.jsx`
- ✏️ `components/kyc-doc/DocScoring.jsx` — adicionar bloco 7-bis V5.2 ao final
- ✏️ `components/kyc-doc/DocPipeline.jsx` — adicionar bloco 8-bis V5.2 ao final
- ✏️ `components/kyc-doc/DocDecisao.jsx` — adicionar bloco 9-bis (5 categorias)
- ✏️ `components/kyc-doc/risk-analysis/RiskAnalysisDocTab.jsx` — atualizar bloco UI V5.2

**Doc Master:**
- 🆕 `components/doc-master/chapters/Ch14_FrameworkV5_2.jsx`
- 🆕 `components/doc-master/chapters/Ch15_EngineV5_2.jsx`
- 🆕 `components/doc-master/chapters/Ch16_QuestionarioV5_2.jsx`
- 🆕 `components/doc-master/chapters/Ch17_Cat5_Excecoes.jsx`
- ✏️ `pages/DocumentacaoMaster.jsx` — adicionar 4 caps no array CHAPTERS
- ✏️ `components/doc-master/chapters/Ch02_Glossario.jsx` — adicionar bloco V5.2
- ✏️ `components/doc-master/chapters/Ch07_Sentinel.jsx` — adicionar SentinelFeedback
- ✏️ `components/doc-master/chapters/Ch09_ModeloDados.jsx` — adicionar 6 schemas V5.2

### Fase 2 (Coleta Subsellers Gateway) — **2 arquivos novos + 2 edits**
- 🆕 `components/kyc-doc/DocColetaSubsellersGateway.jsx`
- ✏️ `pages/DocumentoKYCKYB.jsx` — adicionar seção 18-bis
- 🆕 sub-bloco em `Ch08_FunisCaptacao.jsx` (ou novo `Ch08_FunilSubsellerCollection.jsx`)
- ✏️ `Ch09_ModeloDados.jsx` — adicionar SubsellerInfoCollection + Submission

### Fase 3 (Global + Unificado) — **5 arquivos novos + 3 edits**
- 🆕 `components/kyc-doc/DocComplianceGlobal.jsx`
- 🆕 `components/doc-master/chapters/Ch18_MundoGlobal.jsx`
- 🆕 `components/doc-master/chapters/Ch19_PropostasUnificadas.jsx`
- ✏️ `pages/DocumentoKYCKYB.jsx` — adicionar seção 22
- ✏️ `pages/DocumentacaoMaster.jsx` — adicionar caps 18, 19
- ✏️ `Ch12_PropostasContratos.jsx` — variantes 4 e 5
- ✏️ `Ch01_VisaoArquitetura.jsx` (ou subcomponente) — bloco multi-contexto

### Fase 4 (Correções cirúrgicas) — **~6 edits curtos**
- ✏️ `DocSubsellers.jsx` — nota sobre coleta Gateway
- ✏️ `DocCapa.jsx` — versão atualizada
- ✏️ `Ch11_Parceiros.jsx` — micro-updates DocComp Parceiros
- ✏️ outros pequenos ajustes de coerência

---

## 5. CONVENÇÕES DE ESCRITA QUE VAMOS SEGUIR

Para manter consistência com o estilo existente (que é excelente):

1. **Densidade de detalhes mantida** — cada threshold, peso, código de bloqueio, nome de função, line number quando aplicável
2. **V4 preservado integralmente** — adicionar blocos V5.2 em paralelo ao V4 com headers claros "[V4]" vs "[V5.2]"
3. **Tabelas estruturadas** — usar os helpers `Table`, `Pipeline`, `Threshold`, `Endpoint`, `Schema` já existentes
4. **CodeBlock com line refs** — citar `bdcEnrichCase.js linha XXX` quando aplicável
5. **InfoBox para alertas** — diferenciar `info`, `warn`, `rule`, `danger` consistentemente
6. **Citar entidades reais** — sempre referenciar campos do banco com snake_case quando legacy, camelCase quando V5.2
7. **Não inventar** — se a info não existe no código, marcar como "ainda não implementado" ou omitir

---

## 6. ESTIMATIVA DE ESFORÇO

| Fase | Arquivos | Linhas estimadas | Turnos sugeridos |
|-----:|---------:|-----------------:|:----------------:|
| 1 — V5.2 | 12 novos + 4 edits | ~3.500 | 4-6 turnos |
| 2 — Subsellers Gateway | 2 novos + 2 edits | ~800 | 1-2 turnos |
| 3 — Global + Unificado | 5 novos + 3 edits | ~1.800 | 3-4 turnos |
| 4 — Correções | 6 edits curtos | ~400 | 1 turno |
| **TOTAL** | **~30 arquivos** | **~6.500 linhas** | **9-13 turnos** |

---

## 7. RECOMENDAÇÃO

**Comecemos pela Fase 1 (V5.2)** porque:
1. É a maior lacuna regulatória (framework atual em produção sem doc oficial)
2. V5.2 já tem código + entidades + tudo pronto — só falta documentar
3. É o que mais agrega valor regulatório no curto prazo (auditorias do BCB)

Para a Fase 1, sugiro **começar pelos 4 capítulos novos da Documentação Master** (Ch14-Ch17) porque eles concentram quase 80% do conteúdo V5.2 e depois propagar resumos para o Documento KYC/KYB.

**Próximo turno proposto:** criar `Ch14_FrameworkV5_2.jsx` completo (fundamentos + tiers + capabilities + segmentos), depois você revisa e seguimos.