# 🔍 AUDITORIA SISTÊMICA — LOG PERSISTENTE

> **REGRA INVIOLÁVEL:** Este arquivo é a ÚNICA fonte de verdade da auditoria.
> O assistente DEVE:
> 1. Ler este arquivo no INÍCIO de cada sessão antes de responder
> 2. Atualizar este arquivo no FIM de cada passo concluído
> 3. NUNCA prometer, estimar ou inferir sem registrar aqui

**Última atualização:** 2026-04-21
**Fase ativa:** 5 (Compliance V4)
**Próximo micro-passo:** 5.1 — Purga de órfãos em ExternalValidationResult, IntegrationLog, BdcRetryQueue, DocumentUpload

---

## 📊 MAPA DE STATUS DAS 10 FASES

| # | Fase | Status | % | Selada? |
|---|------|--------|---|---------|
| 1 | Infraestrutura & Autenticação | 🟡 Parcial | ~60% | ❌ |
| 2 | Captação de Leads (funil entrada) | 🟡 Parcial | ~50% | ❌ |
| 3 | Pipeline Comercial | 🟡 Parcial | ~50% | ❌ |
| 4 | Propostas (geração + aceite) | ✅ Selada | 100% | ✅ |
| 5 | Compliance V4 (KYC/KYB) | 🔵 Em curso | ~70% | ❌ |
| 6 | Análise de Casos (painel analista) | ⚫ Não iniciada | 0% | ❌ |
| 7 | Parceiros de Compliance | 🟡 Parcial | ~50% | ❌ |
| 8 | Contratos | ⚫ Não iniciada | 0% | ❌ |
| 9 | Sub-Contas & Split | ⚫ Não iniciada | 0% | ❌ |
| 10 | Dashboards & Admin | ⚫ Não iniciada | 0% | ❌ |

**Legenda:** ⚫ Não iniciada | 🟡 Trabalho pontual/reativo feito, sem selo | 🔵 Auditoria em curso | ✅ Selada com E2E

---

## 🔴 DESCOBERTAS ABERTAS (issues identificadas, ainda não resolvidas)

_nenhuma no momento_

## 🟢 DESCOBERTAS RESOLVIDAS (registro histórico)

### D-001 — `autoEnrichOnboarding` com 8/13 falhas históricas
- **Descoberta:** 2026-04-21 (inspeção de `list_automations`)
- **Causa:** Falhas eram anteriores aos fixes v9/v10/v11 (21/04) no código
- **Evidência de resolução:** Código atual (linhas 205-271) tem:
  - v9: recovery via recheck quando BDC completa por outra rota
  - v10: re-execução de BDC se queue completou APÓS último score
  - v11: fresh run quando BdcRetryQueue não existe
- **Status:** ✅ Resolvida — falhas históricas são de runs antigos
- **Confirmado pelo usuário:** Sim ("já investigamos")

---

## ✅ FASE 4 — PROPOSTAS [SELADA]

### Entregas confirmadas (com evidência no código/banco):

- ✅ **Aceite público com fila persistente** — `lib/acceptQueue.js`
- ✅ **Race condition testada** — `LeadActivity` com entry "RACE CONDITION TEST" de 2026-04-21
- ✅ **Versionamento** — `version`, `rootProposalId`, `previousVersionId`, `isCurrentVersion` no schema
- ✅ **Slugs públicos auto-gerados** — automation `autoGeneratePublicSlug` ativa em Proposal, PixProposal, StandardProposal, Contract (7+ runs sucesso)
- ✅ **Expiração agendada** — automation `expireProposalsScheduled` (diária 13:00 UTC)
- ✅ **Redirects curtos** — `/p/:slug`, `/pp/:slug`, `/pix/:slug`, `/c/:slug` via `PublicSlugRedirect`
- ✅ **Backfill** — função `backfillPublicSlugs`
- ✅ **Evidência real:** Proposal `PROP-2026-28488` com slug `ossel-funeral-velorio-jardim-avelino-ltda-mjf2`

### Arquivos-chave:
- `functions/publicProposalAction`
- `functions/autoGeneratePublicSlug`
- `functions/expireProposalsScheduled`
- `functions/backfillPublicSlugs`
- `lib/acceptQueue.js`
- `lib/publicSlug.js`
- `pages/PublicSlugRedirect`
- `pages/PropostaPublica`, `pages/PropostaPadraoPublica`, `pages/PropostaPixPublica`

---

## 🔵 FASE 5 — COMPLIANCE V4 [EM CURSO — 70%]

### Já entregue (com evidência):

- ✅ **Pipeline unificado v7.0 DATA-FIRST** — `autoEnrichOnboarding` com 5 steps determinísticos
- ✅ **V4 = decisor absoluto / SENTINEL = apenas relator** (regra implementada no Step 4)
- ✅ **Subfaixas 1A→3B aprovação automática, 4 = manual, 5 = recusado**
- ✅ **Automation `autoEnrichOnboarding`** com trigger_conditions anti-loop
- ✅ **Evidência real:** Case `69e65d61f5e31d7556f62ebc` com `riskScoreV4: 178, subfaixa: 1B, status: Aprovado`
- ✅ **SENTINEL preservando V4** — score/subfaixa não são sobrescritos
- ✅ **SENTINEL abort em 1s** para casos deletados
- ✅ **LGPD KYC privado** — `UploadPrivateFile` + signed URLs:
  - `cafVerifaiDocs`
  - `cafPostCaptureAnalysis`
  - `CaseDocumentsTab`
  - `getPrivateDocumentUrl` (com audit trail)
- ✅ **DocumentUpload** expandido com `isPrivate` + `fileUri`
- ✅ **Dedup submissions 10min** em `publicComplianceSubmit`
- ✅ **Cleanup daily de ComplianceScore órfãos** — automation ativa (03:00 BRT)
- ✅ **`bdcEnrichCase`** blindado contra acesso anônimo fora de janela
- ✅ **Validação mime-type + tamanho ≥1KB** em uploads
- ✅ **`cafReconcilePendingTransactions`** rodando a cada 10min (83 runs, 100% sucesso)
- ✅ **Webhook CAF com HMAC + idempotência** em `cafWebhookHandler`
- ✅ **BDC retry queue persistente** (`BdcRetryQueue` + `bdcRetryWorker`)
- ✅ **CAF Intelligent Classification v8** — separa fraude confirmada de problema de qualidade (Step 4)
- ✅ **Safety Net** — nunca "Recusado" sem V4 blocks ou CAF fraud

### Falta para selar (ordem de execução):

- ⏳ **5.1** — Purgar órfãos em `ExternalValidationResult`, `IntegrationLog`, `BdcRetryQueue`, `DocumentUpload` + expandir automation daily cleanup
- ⏳ **5.2** — LGPD remaining: auditar `downloadCaseDocuments`, `getCaseDocumentUrls`, `partnerDownloadDocument`, `exportCadastroReport`, `generateCadastroPdf` para não vazar URLs públicas de KYC
- ⏳ **5.3** — Race conditions:
  - `autoEnrichOnboarding` → lock por case_id (flag `_lockedAt` no DB)
  - `bdcRetryWorker` → lock para evitar 2 workers concorrentes
- ⏳ **5.4** — Consistency checks: script de reconciliação `Merchant.onboardingStatus` ↔ `OnboardingCase.status` ↔ `ComplianceScore.recomendacao_final`
- ⏳ **5.5** — Selo E2E: criar case test → compliance → decisão → verificar alinhamento total
- ⏳ **5.6** — Documentar no `backups/compliance-snapshot-2026-04-21.json`

---

## 🟡 FASE 1 — INFRA & AUTH [~60%]

### Feito:
- ✅ **2FA TOTP + PIN + JWT** — `adminLoginScreen`, `twoFactorVerify`, `verifyAdminToken`, `twoFactorEnrollStart/Confirm/VerifyTotp`
- ✅ **Server-role verification** em `App.jsx` (anti-DevTools tampering)
- ✅ **15 secrets configurados** (lista no developer_comments)
- ✅ **AccessProfile + PermissionsProvider** — `adminListProfiles`, `seedAccessProfiles`, `getMyPermissions`
- ✅ **Introducer isolation** — bloqueio de rotas admin para role=introducer
- ✅ **`AuditoriaAcessos` + `AccessAudit` + `TwoFactorAudit` + `AdminLoginAttempt`** entities ativas
- ✅ **Rotas públicas centralizadas** em `lib/publicRoutes.js` (source of truth)

### Falta:
- ⏳ Health check dos 14 secrets (verificar acessibilidade nas funções)
- ⏳ Matriz RLS formal (role=user tenta acessar cada entidade admin)
- ⏳ Health check das 9 automations (incluindo análise de runs antigos)
- ⏳ Teste expiração JWT + refresh flow
- ⏳ Validação: 140 rotas → públicas vs protegidas (auditar `lib/publicRoutes.js` vs realidade)

---

## 🟡 FASE 2 — CAPTAÇÃO DE LEADS [~50%]

### Feito (funcional):
- ✅ **QuestionarioLeadsPagsmile V5** — 13 steps (evidência: Lead real BCK PAGAMENTOS com `origem: questionario_leads_pagsmile_v5`)
- ✅ **LeadPixV4** — 8 steps
- ✅ **LeadQuestionnaire** — simplificado
- ✅ **Landing Introducer** `/parceiro/:slug`
- ✅ **FechamentoLandingPage** (CTA proposta padrão)
- ✅ **Enrichment automático** — `enrichLeadData`, `brasilApiCnpj`, `bdcEnrichLead`
- ✅ **PRISCILA** — `analyzePriscila` (evidência: relatório completo em Lead real)
- ✅ **Lead Qualifier** — `analyzeLeadQualifier` (evidência: score 67 em Lead real)
- ✅ **BDC Lead Scoring** — `bdc_analyzeKycRisk` (evidência: flags BDC_SHELL_COMPANY ativa)

### Falta (auditoria microscópica formal):
- ⏳ Camada 1 (Backend): testar payloads em `publicLeadSubmit`, `analyzePriscila`, `analyzeLeadQualifier`, `enrichLeadData`, `validateLeadFields`, `onLeadCreatedEnrich`, `checkLeadSLA`, `sendFollowUpEmail`
- ⏳ Camada 2 (Dados): órfãos em `Lead`, `LeadActivity`, `LandingPageLead`, `IntroducerLead`, `SimplifiedLead`, `StandardProposalLead`
- ⏳ Camada 3 (UI): screenshot dos formulários V5/PixV4/Simplificado
- ⏳ Camada 4 (E2E): lead cai → enrich → PRISCILA → pipeline

---

## 🟡 FASE 3 — PIPELINE COMERCIAL [~50%]

### Feito:
- ✅ **Kanban** — `PipelineComercial` com @hello-pangea/dnd
- ✅ **PipelineAgingAlerts + PipelineMetrics**
- ✅ **`checkLeadSLA`** (função existe)
- ✅ **`sendFollowUpEmail`** (função existe)
- ✅ **Modais:** `FollowUpModal`, `StatusUpdateModal`, `ReassignComplianceModal`
- ✅ **LeadActivity** gerando entries (evidência: entry de 2026-04-21 no banco)

### Falta:
- ⏳ Camada 1: testar `checkLeadSLA`, `sendFollowUpEmail`, `checkIncompleteLeads`
- ⏳ Camada 2: `LeadActivity` órfãos (sem Lead correspondente)
- ⏳ Camada 3: drag-drop stability, filtros, ordenação
- ⏳ Camada 4: E2E status change → activity → email

---

## 🟡 FASE 7 — PARCEIROS DE COMPLIANCE [~50%]

### Feito:
- ✅ **`AdminGestaoParceiros`**, **`ComplianceParceiro`**, **`ComplianceParceiroDetalhe`** (portal externo)
- ✅ **SLA monitor** — automation `Partner SLA Monitor` (35 runs, 100% sucesso)
- ✅ **Funções:** `adminAssignCaseToPartner`, `adminBulkAssignPartner`, `adminRevokeAssignment`, `partnerDownloadDocument`, `partnerGetCaseDetail`, `partnerListMyCases`, `partnerSlaMonitor`, `partnerSubmitRecommendation`
- ✅ **Entities:** `CompliancePartner`, `CompliancePartnerUser`, `PartnerAssignment`, `PartnerAssignmentActivity`

### Falta:
- ⏳ Mascaramento completo de dados sensíveis para parceiros
- ⏳ SLA Slack notifications testadas
- ⏳ Recomendação E2E (partner submete → admin recebe)
- ⏳ Isolation test: partner A não pode ver casos de partner B

---

## ⚫ FASES NÃO INICIADAS

### FASE 6 — Análise de Casos
Pages: `AnaliseDeCasos`, `AnaliseCompleta`, `Cadastro`, `CadastroDetalhe`, `RiskScoringV4`, `RiskScoringSubcontas`, `EscalationsReview`, `BulkReprocess`, `GestaoRevalidacao`

### FASE 8 — Contratos
Pages: `CriarContrato`, `EditorContrato`, `GestaoContratos`, `ContratoPublico`, `PreviewContrato`
Functions: `preGenerateContract`

### FASE 9 — Sub-Contas & Split
Pages: `SubsellerQuestionnaire`, `SubsellerDocUpload`, `GerenciarSubsellerLinks`
Functions: `generateSubsellerLink`, `scoreSubseller`
Entities: `SubsellerScore`

### FASE 10 — Dashboards & Admin
Pages: `DashboardCEO`, `DashboardComercial`, `AdminDashboard`, `DadosInsights`, `GestaoUsuarios`, `GestaoPerfis`, `EditorPerfil`, `AuditoriaAcessos`, `Configuracoes`, `IntegracoesExternas`, `HelenaIA`, `CafTestLab`

---

## 📜 HISTÓRICO DE PASSOS EXECUTADOS

### Sessão 2026-04-21 (atual)
- Criação deste arquivo de log persistente — primeiro registro

_(todos os passos futuros serão registrados aqui)_