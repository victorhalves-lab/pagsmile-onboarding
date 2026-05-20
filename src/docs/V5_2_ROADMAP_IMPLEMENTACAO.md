# V5.2 — ROADMAP MESTRE DE IMPLEMENTAÇÃO

**Documento vivo — atualizado a cada entrega**

> ## ⚠️ REGRA PERMANENTE DE COMUNICAÇÃO (definida pelo usuário em 2026-05-20)
>
> **Ao final de TODA entrega, o assistente DEVE explicitamente declarar qual é a PRÓXIMA entrega.**
>
> - É **obrigatório**, não opcional.
> - Formato exigido: encerrar a resposta com uma linha clara no padrão
>   `▶ Próxima entrega: <Fase X.Y — nome curto + escopo em 1 linha>`
> - Vale para qualquer entrega — feature, refactor, fix, doc. Sempre.
> - Se não houver próxima entrega clara, listar 2-4 opções e pedir ao usuário para escolher.
> - Esta regra está registrada aqui para que QUALQUER assistente futuro a respeite.

| Campo | Conteúdo |
|---|---|
| Versão | 2.0 |
| Data início | 2026-05-20 |
| Versão alvo | **V5.2** (DOC5 V5.2 sobrescreve V5.1) |
| Status | **Implementação em andamento — Fase 5 (UI/integração) entregue** |
| Estratégia | Coexistência total V4↔V5.2 via `framework_version` no caso (DNA imutável) |

---

## 🎯 ESTRATÉGIA DEFINIDA

**Decisão do usuário:** Diagnóstico completo + implementação por camadas. Cada caso carrega `framework_version` (v4.0/v5.1/v5.2) — código V4 nunca é tocado, V5.2 roda em paralelo.

---

## 📊 STATUS DOS BLOCOS DE DIAGNÓSTICO — ✅ TODOS COMPLETOS

| Bloco | Documentos | Status |
|---|---|---|
| 1 | Master Index + Glossário + Mapa Base44 | ✅ |
| 2 | DOC3 Datasets + DOC5 V5.2 Bloqueios | ✅ |
| 3 | Tier 1, 2, 3 + Subseller PJ/PF | ✅ |
| 4 | Questionário Dinâmico E1 | ✅ |
| 5 | Segmentos (13/13) | ✅ |
| 6 | REDESIGN AnáliseDeRisco + DELTA Segmentos | ✅ |
| 7 | Apêndice V5.1 Patch Financeiro | ✅ |

---

## 🗺️ ROADMAP DE IMPLEMENTAÇÃO

### ✅ FASE 1 — Schema & Master Data (CONCLUÍDA)

**1.1 Entidades** — schema V5.2 estabelecido:
- ✅ `Bloqueio` ampliado com `decisao_padrao`, `nucleo_duro_regulatorio`, `tpv_cap_inicial_pct`, `rolling_reserve_adicional_pct`, `gatilhos_off_boarding_agil`
- ✅ `Exception` com `cat_5_monitoramento_intensivo`
- ✅ `OnboardingCase` com `framework_version`, `categoria_decisao_v5_2`, `plano_monitoramento_id`, `grau`
- ✅ `ComplianceScore` com `cross_validation_results`, `impact_score_top_alerts`, `top_positivos`, `cross_validation_summary`
- ✅ `PlanoMonitoramento` criado
- ✅ `TermoAdicionalV5_2` criado
- ✅ `Dataset`, `Capability` ampliados com campos V5.2

**1.2 Constants:**
- ✅ `lib/v5_2/` criado (paralelo a `lib/v5_1/`)
- ✅ Capabilities canônicas: `splits/subseller`, `crossborder`, `recurrence`, `cap_financial_capacity_validation`
- ✅ Segmentos ampliados para 15 (turismo, eventos, servicos_b2b, servicos_locais, crossborder)

**1.3 Seed Master Data:**
- ✅ `seedV5_2MasterData` operacional (datasets, bloqueios, capabilities, exceptions)
- ✅ `seedV5_2Questions` operacional (80 perguntas canônicas)

### ✅ FASE 2 — Score Engine V5.2 (CONCLUÍDA)

- ✅ `lib/v5_2/matrizDecisao.js` — 5 categorias finais
- ✅ `lib/v5_2/scoringV5_2.js` — escalas corrigidas (T1/T2/Sub=850, T3=999)
- ✅ `lib/v5_2/avaliarBloqueios.js`
- ✅ `lib/v5_2/crossValidation16.js`
- ✅ `lib/v5_2/deveConsultarDataset.js`
- ✅ `functions/bdcEnrichCaseV5_2` operacional

### ✅ FASE 3 — Pipeline Steps (CONCLUÍDA)

- ✅ `lib/v5_2/tieringEngine.js` com 14 triggers de escalação
- ✅ `lib/v5_2/triggersTier.js`
- ✅ `lib/v5_2/capabilities.js` (resolução completa)
- ✅ `lib/v5_2/segments.js` (13 segmentos × morfologias)
- ✅ `functions/autoEnrichOnboardingV5_2` (roteamento)
- ✅ Cross-Validation 16 campos integrada

### ✅ FASE 3c — Subsellers PJ/PF (CONCLUÍDA)

- ✅ Campo `grau` (A/B/C) em `OnboardingCase`
- ✅ Resolução por TPV (PJ) ou renda mensal (PF)
- ✅ Fator de grau aplicado no score

### ✅ FASE 5 — Questionário Dinâmico V5.2 (CONCLUÍDA)

- ✅ **5.1** Schema `Question` ampliado (9 campos novos)
- ✅ **5.2** Seed 80 perguntas canônicas
- ✅ **5.3** Motor de Tiering Dinâmico (`tieringEngine.js`)
- ✅ **5.4** Microcopy centralizado (`lib/v5_2/microcopy.js`)
- ✅ **5.5** 4 Modalidades A/B/C/D (`ConfirmCard`, `HybridInputCard`, `PureInputCard`, `DerivedCard`, `CompositeCard`, `DocumentUploadCard`)
- ✅ **5.6** B-series real-time (`realtimeBlockEngine.js` + `RealtimeBlocksPanel`)
- ✅ **5.7** Reavaliação tier pós-enriquecimento (`reevaluateTierAfterEnrichment` em `bdcEnrichCaseV5_2`)
- ✅ **5.8** Versionamento por sessão (`framework_version_at_start/_at_submit/_at_decision` + `is_transitional_case`)
- ✅ **5.9** Roteamento de pipeline (V4↔V5.2 em `autoEnrichOnboarding`)
- ✅ **5.10** Banner V5.2 no painel do analista (`CadastroV5_2Banner`)
- ✅ **5.11** Aba dedicada V5.2 (`CadastroV5_2Tab` — 5 camadas + top alertas + CV16 + Patch + Bloqueios)
- ✅ **5.12** Card de geração de link V5.2 em `GerarLinkOnboarding`

---

## 🟡 FASE 6 — UI Refatorada (PARCIAL — em andamento)

Já entregue:
- ✅ Renderer V5.2 público (`ComplianceV5_2Renderer`)
- ✅ Banner + Aba no `CadastroDetalhe`
- ✅ Card de link V5.2

### 🔴 FASE 6 — Próximos itens

#### ✅ **FASE 6.1 — Filtros V5.2 nas listagens (CONCLUÍDA)**
- ✅ `components/v5_2/FrameworkVersionFilter` — componente shared (chips + badge `V5_2Badge`)
- ✅ Filtro framework + contadores em `pages/Cadastro`
- ✅ Filtro framework em `pages/AnaliseManual` (ao lado da busca)
- ✅ Filtro framework em `pages/QuestionariosRecebidos` (limpo via clearFilters)
- ✅ Badge `V5.2` nas linhas (`CadastroRichRow`) e nos cards (`ComplianceCasesCardsGrid`)

#### ✅ **FASE 6.2 — Botão "Reprocessar V4 → V5.2" (CONCLUÍDA)**
- ✅ `functions/reprocessV4AsV5_2` — admin-only, cria caso V5.2 espelho preservando V4 (DNA imutável)
- ✅ Copia QuestionnaireResponse + vincula via `legacyV4CaseId` + idempotente (não duplica espelho)
- ✅ Dispara `autoEnrichOnboardingV5_2` cross-deployment (fire-and-forget)
- ✅ AuditLog `reprocess_v4_to_v5_2` registrado
- ✅ `components/cadastro/ReprocessV4AsV5_2Button` — modal de confirmação + redirect pós-criação
- ✅ Plugado em `pages/CadastroDetalhe` no header (só admin, só V4)

#### ✅ **FASE 6.3 — Workflow de Exceções V5.2 (Cat 1-5) (CONCLUÍDA)**
- ✅ Cat 5 (`cat_5_monitoramento_intensivo`) seedada no catálogo `Exception` (+ marca v5.2 nas cat 1-4 existentes)
- ✅ `functions/applyV5_2Exception` — admin-only, valida bloqueios, atualiza ComplianceScore (overrides_aplicados + bloqueios mitigados removidos)
- ✅ Cat 5 → cria `PlanoMonitoramento` + `TermoAdicionalV5_2` (rascunho aguardando aceite) + atualiza OnboardingCase
- ✅ Snapshot imutável de cada exceção aplicada
- ✅ `functions/acceptTermoAdicionalV5_2` — público (seller via link) com hash SHA-256 de integridade
- ✅ `components/cadastro/V5_2ExceptionWorkflow` — modal multi-step (categoria + bloqueios → config Cat 5 → justificativa → resultado)
- ✅ `components/cadastro/V5_2PlanoMonitoramentoCard` — card com plano + termo + ação de registrar aceite
- ✅ Plugado em `CadastroV5_2Tab` (botão "Aplicar Exceção V5.2" no header de bloqueios + card de plano + histórico de overrides)

#### ✅ **FASE 6.4-A — Smart Summary Cards (CONCLUÍDA)**
- ✅ `components/cadastro/v5_2/SmartSummaryCards.jsx` — Hero Verdict (score + subfaixa + categoria) + 3 cards executivos
- ✅ Card 1: Top Alertas priorizados por impact_score (severidade colorida + why_it_matters)
- ✅ Card 2: Top Pontos Positivos (contexto balanceado)
- ✅ Card 3: Cross-Val 16 Summary (barra visual + 4 counts + top issues)
- ✅ Plugado no topo do `CadastroV5_2Tab` (acima das 5 camadas — DOC6 §3)

#### ✅ **FASE 6.4-B — Refatoração `AnaliseCompleta` 4-abas V5.2 (CONCLUÍDA)**
- ✅ `components/analise-completa/v5_2/HeroVerdictV5_2.jsx` — 5 decisões (cat 1-5) + score grande + chips bloqueios + causa principal
- ✅ `components/analise-completa/v5_2/Tab1ResumoDecisao.jsx` — Smart Summary + Alertas Priorizados + Positivos + Mini-Parecer + Ações
- ✅ `components/analise-completa/v5_2/Tab2Evidencias.jsx` — Cross-Val 16 campos tabela + Patch Financeiro 5 dimensões + Bloqueios + CAF
- ✅ `components/analise-completa/v5_2/Tab3DimensionalBDC.jsx` — Análise dimensional BDC (reusa AnaliseBdcCompleta V4)
- ✅ `components/analise-completa/v5_2/Tab4SentinelAuditoria.jsx` — Parecer SENTINEL completo + Trilha sticky + Timeline
- ✅ `components/analise-completa/v5_2/AnaliseCompletaV5_2.jsx` — Container com tabs + badges contextuais
- ✅ Roteamento condicional em `pages/AnaliseCompleta` por `framework_version` — V4 legado 100% preservado

#### ✅ **FASE 6.4-C — Widget V5.2 no DashboardCEO (CONCLUÍDA)**
- ✅ `components/ceo-dashboard/CEOV5_2Widget.jsx` — Widget executivo no DashboardCEO
- ✅ AdoptionBanner: 4 KPIs (% V5.2, Monit. Intensivo Cat 5, Casos com Bloqueios, Transicionais)
- ✅ FrameworkAdoptionBar: barra empilhada V4 / V5.1 / V5.2 com %s
- ✅ CategoriaPie: distribuição V5.2 por `categoria_decisao_v5_2` (cat 1-5 coloridas)
- ✅ TierApprovalChart: barras empilhadas (aprovados/manual/recusados) por tier + taxa %
- ✅ Plugado em `pages/DashboardCEO.jsx` abaixo de Contratos+Compliance, acima da Auditoria

#### 🟡 **FASE 6.5 — UI complementar V5.2 (em andamento)**

##### ✅ **6.5.1 — Refatorar `AnaliseManual` para V5.2 (CONCLUÍDA)**
- ✅ `components/compliance/AnaliseManualV5_2Stats.jsx` — Chips clicáveis por categoria V5.2 (cat 2/3/4/5) + Bloqueios + indicador de transicionais
- ✅ Filtros V5.2 (`categoriaV5_2Filter` + `bloqueiosV5_2Filter`) só ativam quando `frameworkFilter === 'v5.2'`
- ✅ Reset automático de filtros V5.2 ao sair do contexto V5.2
- ✅ CSV de export ampliado: framework, score V5.2, tier, categoria V5.2, bloqueios ativos

##### ✅ **6.5.2 — Trilho Subseller V5.2 (PJ+PF) (CONCLUÍDA)**
- ✅ Schema `OnboardingLink` ampliado com `framework_version` (v4.0 default — opt-in p/ v5.2)
- ✅ `functions/generateSubsellerLink` aceita `frameworkVersion` e seleciona template V5_2_DYNAMIC quando v5.2; mantém subseller_v2/subseller para v4.0
- ✅ `functions/publicReadContext` expõe `framework_version` no link público
- ✅ `components/subseller/FrameworkVersionPicker.jsx` — seletor V4 vs V5.2 (BETA) no GenerateLinkModal
- ✅ `GenerateLinkModal` reformulado: passo 0 = framework, passo 1 = estilo, passo 2 = branding. Indicador da versão escolhida nas etapas seguintes.
- ✅ `GerenciarSubsellerLinks` mostra badge V4/V5.2 em cada link gerado
- ✅ `pages/SubsellerQuestionnaire` rota automaticamente para template V5_2_DYNAMIC quando `link.framework_version === 'v5.2'`. PF/PJ usam o MESMO template — tier resolvido em runtime pela engine. localStorage `v5_2_subseller_merchant_type` para sinalizar à engine. Trilho V4 100% preservado.

##### ✅ **6.5.3 — Comparator V4↔V5.2 lado-a-lado (CONCLUÍDA)**
- ✅ Página `/ComparatorV4V5_2` (rota lazy + LayoutWrapper)
- ✅ Resolução automática de par via URL: `?v4=<id>`, `?v5=<id>` ou `?v4=&v5=`
- ✅ `ComparatorHeader` — identificação do merchant + datas dos 2 casos + links de retorno/análise individual
- ✅ `ComparatorMetricRow` — linha genérica com 3 modos (numeric/categorical/text), delta automático, indicador visual (Igual/Subiu/Caiu/Mudou/Crítico)
- ✅ `ComparatorBlockagesDiff` — diff inteligente: "Mantidos", "Novos na V5.2", "Removidos pela V5.2"
- ✅ Seções: Veredito final (decisão+categoria+status), Score breakdown (escalas diferentes, anotação), Operacional (rolling reserve+monitoramento+condições), Bloqueios diff, Pareceres SENTINEL lado a lado
- ✅ Estados de erro tratados: caso não especificado, par incompleto (sem mirror), casos não encontrados
- ✅ Disclaimer educativo sobre comparabilidade de escalas V4/V5.2
- ✅ `ReprocessV4AsV5_2Button` atualizado: detecta mirror existente, mostra botão extra "Comparar V4↔V5.2", redireciona ao Comparator após reprocesso

##### ✅ **6.5.5 — Atalhos de teclado DOC6 (15 atalhos) (CONCLUÍDA)**
- ✅ `components/v5_2/shortcuts/shortcutsCatalog.js` — catálogo canônico dos 15 atalhos (DOC6 §5.5 + Princípio 7)
- ✅ `useKeyboardShortcutsV5_2` — hook global com suporte a sequências (`g c`), ignora foco em inputs/textareas/modais, timeout de sequência 1000ms
- ✅ `KeyboardShortcutsPanel` — modal "?" com lista por categoria (Navegação, Ações de Decisão, Ferramentas) e kbd boxes
- ✅ `SearchOverlay` — busca leve "/" com scrollIntoView + ↑↓ entre hits + flash highlight
- ✅ `ShortcutsHintBadge` — badge fixo bottom-right com tooltip "?"
- ✅ `V5_2ShortcutsProvider` — orquestrador: tabs 1-4, j/k navegação entre `[data-shortcut-item]`, Esc com cascata (overlay → cadastro), ações a/c/m/r/s/e roteiam para AnaliseManual, `p` dispara dossiê PDF inline, `g c` copia caseId, `?` abre painel
- ✅ Plugado em `AnaliseCompletaV5_2` (provider + marcação dos 4 TabsContent com `data-shortcut-item`)
- ✅ Resp. WCAG: kbd boxes legíveis, contraste 4.5:1, screen-reader labels nos botões

##### ✅ **6.5.4 — Glossário inline sistemático (CONCLUÍDA — retomada na ordem do roadmap)**
- ✅ `lib/v5_2/glossary.js` — 50+ termos canônicos DOC6 §2.5.6 (Tiers 5 + Morfologias 6 + Categorias Decisão 5 + Patch Financeiro 6 + Capabilities 5 + Bloqueios 8 + PLD/FT 4 + Cross-Val 3 + Outros 5)
- ✅ `components/v5_2/glossary/Term.jsx` — gatilho com sublinhado pontilhado + ícone ⓘ, popover com categoria colorida + short + full + fundamentação regulatória
- ✅ `components/v5_2/glossary/TermBlock.jsx` — wrapper inteligente que resolve códigos dinâmicos (bloqueios B-* / status do Patch) para o termo correto do catálogo via tabela de aliases
- ✅ Plugado em `HeroVerdictV5_2` (tier badge clicável + label "Bloqueios ativos" + cada chip de bloqueio individual com `<TermBlock>`)
- ✅ Plugado em `Tab1ResumoDecisao` (título "Mini-Parecer SENTINEL")
- ✅ Plugado em `Tab2Evidencias` (Cross-Validation 16 título + status "divergence/mismatch" clicáveis + Patch Financeiro título + badge de status do patch + Bloqueios título + cada bloqueio com `<TermBlock>`)
- ✅ Plugado em `Tab4SentinelAuditoria` (Parecer SENTINEL título + sidebar de auditoria: framework_version, tier, morfologia, capabilities, snapshot, categoria, sentinel — todos com tooltip explicativo)
- ✅ Plugado em `SmartSummaryCards` (categoria final clicável + Cross-Val 16 título)
- ✅ Graceful fail: códigos não encontrados renderizam texto sem tooltip — nunca quebra a tela

##### ✅ **6.5.6 — FeedbackSentinelPanel estruturado (CONCLUÍDA)**
- ✅ `feedbackCategoriesCatalog.js` — catálogo canônico dos 3 tipos de feedback (acertou/parcialmente/errou) + 9 categorias mapeadas 1:1 ao enum `SentinelFeedback.feedback_categories`
- ✅ `FeedbackSentinelPanel.jsx` — fluxo 3 passos: (1) botões 👍🤔👎 com cores/descrições, (2) categorias específicas com checkboxes filtradas por tipo de feedback, (3) textarea com obrigatoriedade quando errou/parcial (mín. 5 chars)
- ✅ Persistência via `base44.entities.SentinelFeedback.create` denormalizando contexto (sentinel_version, framework_version, tier, segmento, morfologia, decision_match calculado)
- ✅ Histórico de feedbacks anteriores do mesmo caso renderizado inline (`FeedbackHistoryItem` com emoji, autor, timestamp, comentário e tags de categoria)
- ✅ Validação client-side com mensagens inline + estado `touched` + spinner de envio + toasts de sucesso/erro
- ✅ Marcado com `data-shortcut-item` (integra com atalhos j/k da Fase 6.5.5)
- ✅ Plugado em `Tab4SentinelAuditoria` abaixo do parecer SENTINEL — null-safe (oculta se não houver `sentinel_recommendation`)

##### ✅ **6.5.7 — Export Auditoria PDF/JSON/XLSX (CONCLUÍDA — último item da Fase 6)**
- ✅ PDF Regulatório já existia (Fase 6.5.5): capa com hash SHA-256 + 9 seções (Identificação, Classificação, Score 5 camadas, Patch Financeiro, Bloqueios, Cross-Val 16, Plano Cat 5, SENTINEL, Exceções, Snapshot ref) com rodapé hash em todas as páginas
- ✅ JSON Imutável já existia (Fase 6.5.5): envelope canônico ordenado + hash SHA-256 determinístico + fundamento regulatório
- ✅ **NOVO: XLSX Auditoria** — `components/v5_2/dossie/dossieXlsxGenerator.js` — workbook multi-aba (Resumo / Score V5.2 / Bloqueios / Cross-Val 16 / Patch Financ. / SENTINEL / Exceções / Plano Cat 5 / Snapshot ref.) com colunas dimensionadas, ideal para auditores que trabalham em planilhas. Abas Exceções/Plano/Snapshot só aparecem quando há dados
- ✅ Plugado no `DossieV5_2Button` (Aba 4 / SENTINEL & Auditoria) como terceira opção do dropdown junto com PDF e JSON
- ✅ Naming canônico: `dossie-v5_2_${slug}_${timestamp}.xlsx` — slug do merchant + ISO timestamp
- ✅ Mesmo hash SHA-256 nos 3 formatos (PDF/JSON/XLSX compartilham `buildDossieV5_2`) → verificação cruzada de integridade

##### **▶ Fase 6 V5.2 100% concluída.**
- Próximas frentes: Fase 7 (Pós-Decisão & Monitoramento Contínuo) e Fase 8 (Off-Boarding Ágil 24-48h)
- [ ] `components/cadastro/ExceptionWorkflow.jsx` — aplicar exceção a um bloqueio
- [ ] Cat 5 → cria `PlanoMonitoramento` + `TermoAdicionalV5_2`
- [ ] Workflow de aceite do termo pelo seller

#### **FASE 6.4 — Smart Summary Cards (DOC6)**
- [ ] 3 cards executivos no topo da aba V5.2 (top alertas / top positivos / cross-val summary)
- [ ] Hero Verdict V5.2 (categoria + score destacados)

#### **FASE 6.5 — Refatorar `pages/AnaliseCompleta` para V5.2**
- [ ] Roteamento condicional V4 vs V5.2
- [ ] Layout 4 abas DOC6 (Geral, Bloqueios, Dimensões 13, Cross-Val)

---

## ✅ FASE 3b — Tier 3 com 9 Módulos Especializados (CONCLUÍDA)

- ✅ `lib/v5_2/tier3Modules.js` — catálogo declarativo dos 9 módulos canônicos T3 (DOC4 Bloco 3 §3.3):
  - **M_GW** Gateway/PSP/BaaS (splits/subseller + financial_capacity)
  - **M_MKT** Marketplace (splits/subseller)
  - **M_PV** Plataforma Vertical (fan-out por vertical: saúde/foodtech/educação)
  - **M_DS** Dropshipping (financial_capacity + crossborder)
  - **M_INFO** Infoprodutos (chargeback + afiliados + CVM)
  - **M_TUR** Turismo (CADASTUR + sazonalidade + financial_capacity)
  - **M_EVT** Eventos (AVCB + meia-entrada + overbooking)
  - **M_SPL** Splits/Subseller (transversal — qualquer segmento com splits)
  - **M_CB** Crossborder pesado (FATF + OFAC + UK HMT + UN + EU + país risco)
- ✅ Cada módulo declara: fundamentação regulatória, segmentos elegíveis, capabilities requeridas, datasets requeridos, bloqueios possíveis, variável de score que alimenta, penalidades configuráveis (fail/warning)
- ✅ `resolverModulosT3Ativos()` — função pura que decide quais módulos rodam por (tier, segmento, capabilities_ativas)
- ✅ `aplicarPenalidadesT3()` — calcula impacto agregado dos módulos T3 ativos baseado nos resultados das capabilities (pass/warning/fail)
- ✅ Tabela base segmento+tier já tinha Tier 3 canônico (escala 0-999) em `scoringV5_2.js` desde Fase 2
- ✅ **Integrado em scoringV5_2.js**: Camada 4 agora chama `resolverModulosT3Ativos` + `aplicarPenalidadesT3` e expõe `modulos_t3_ativos` + `modulos_t3_detalhes` na resposta — analista vê quais módulos foram avaliados e penalidades de cada um
- ✅ `bloqueiosPossiveisT3()` + `datasetsRequeridosT3()` — helpers para o pipeline pré-filtrar catálogo de bloqueios e validar consultas obrigatórias

---

## ✅ FASE 4 — Capabilities Executáveis (CONCLUÍDA)

- ✅ `lib/v5_2/financialCapacityValidation.js`:
  - **PJ — 5 dimensões** (`avaliarCapacidadeFinanceiraPJ`):
    1. TPV declarado vs BDC (verde ≤20% / amarelo 20-50% / laranja 50-100% / **vermelho >100% E TPV > capital×12 → B-FIN-1**)
    2. Faturamento DOC vs ECF (>100% → **B-FIN-2**)
    3. CRC ativo do contador (inativo em segmentos regulados → **B-FIN-3**)
    4. Fluxo de caixa Open Finance (cobertura saldo/TPV <10% → **B-FIN-4**)
    5. Coerência setorial (TPV vs P90 do segmento)
  - **PF — 4 dimensões** (`avaliarCapacidadeFinanceiraPF`):
    1. Renda declarada vs score crédito PF (score <300 + renda >10k → **B-PF-1**)
    2. Comprometimento de renda (TPV >50× renda → **B-PF-2**)
    3. Idade do CPF (menor de idade → **B-PF-FRAUDE-1**)
    4. Restrições financeiras (>R$50k → **B-PF-3**)
  - `consolidarStatusPatch()` → status verde/amarelo/laranja/vermelho (regra V5.2 §17)
  - `calcularVFinancialCoherence()` → v ∈ {+20, -10, -40, -100} alimenta C3
  - `avaliarCapacidadeFinanceira()` — dispatcher PJ/PF por merchantType
- ✅ `lib/v5_2/bloqueiosPFSubseller.js` — **catálogo canônico V5.2** de 11 bloqueios novos:
  - **8 Bloqueios PF**: B-PF-1 (score+renda), B-PF-2 (comprometimento), B-PF-3 (restrições R$50k+), B-PF-PEP-1 (PEP/sancionado), B-PF-SANC-1 (sanção internacional — **núcleo duro regulatório**), B-PF-FRAUDE-1 (menor de idade / CPF inválido — **núcleo duro**), B-PF-DOC-1 (docs ausentes 48h+), B-PF-CB-1 (cross-border sem capability)
  - **3 Bloqueios Subseller PJ**: B-SUB-PJ-1 (excede teto grau C >R$500k), B-SUB-PJ-2 (seller mestre sem splits/subseller), B-SUB-PJ-3 (UBO já recusado em outro subseller — anti-fraude)
  - Cada bloqueio declara: severidade, decisão padrão, categoria de exceção, fundamentação regulatória (Lei 13.810/2019, Resol. BCB 80/2021, Circ. BCB 3.978, etc.), núcleo duro sim/não
  - `avaliarBloqueiosPFSubseller()` — função pura que avalia contexto (tier, isSubseller, grau, resultado financeiro, BDC, seller mestre, UBO já recusado) e retorna disparados
  - `bloqueiosPFSubsellerComoCatalogo()` — helper para reaproveitar com o engine `avaliarBloqueios.js` já existente
- ✅ Tudo exportado pelo barrel `lib/v5_2/index.js` — disponível para o pipeline (`autoEnrichOnboardingV5_2`, `bdcEnrichCaseV5_2`) puxar em uma chamada

---

## ⏸️ FASE 7 — Não implementar agora (usuário cuida)

- ⏸️ Mesa de Monitoramento Transacional (infra real-time)
- ⏸️ Dashboard real-time
- ⏸️ Workflow off-boarding ágil 24-48h

---

## 📌 PRÓXIMA ENTREGA: **FASE 6.3 — a definir**

Possíveis próximos passos (escolher com o usuário):
- **A)** Comparador lado-a-lado V4 ↔ V5.2 (quando o caso tem `legacyV4CaseId`)
- **B)** Workflow de Exceções V5.2 (cat_5 — Categoria 5 com TermoAdicionalV5_2 + PlanoMonitoramento)
- **C)** Widget executivo V5.2 no DashboardCEO (distribuição por categoria de decisão)
- **D)** Aba V5.2 na tela `AnaliseManual` com triagem por categoria_decisao_v5_2

---

## 📜 HISTÓRICO DE VERSÕES

| Versão | Data | Mudanças |
|---|---|---|
| 1.0 | 2026-05-20 | Criação — diagnóstico Blocos 1+2 |
| 2.0 | 2026-05-20 | Atualização pós-implementação: Fases 1, 2, 3, 3c, 5 (5.1-5.12) marcadas como concluídas. Próxima: Fase 6.1 (Filtros V5.2). |
| 2.1 | 2026-05-20 | Fase 6.1 concluída (filtros + badge V5.2 em Cadastro, AnaliseManual, QuestionariosRecebidos). Próxima: Fase 6.2 (Reprocessar V4→V5.2). |
| 2.2 | 2026-05-20 | Fase 6.2 concluída (reprocessV4AsV5_2 + ReprocessV4AsV5_2Button em CadastroDetalhe). Próxima: Fase 6.3 (a definir). |
| 2.3 | 2026-05-20 | **Regra permanente registrada**: ao final de toda entrega, o assistente sempre declara a próxima. Adicionada ao topo do roadmap. |
| 2.4 | 2026-05-20 | Fase 6.3 concluída (Workflow de Exceções V5.2 Cat 1-5 + PlanoMonitoramento + TermoAdicionalV5_2 com hash de integridade). Próxima: Fase 6.4 (a definir). |
| 2.5 | 2026-05-20 | Fase 6.4-A concluída (Smart Summary Cards: Hero Verdict + Top Alertas + Top Positivos + Cross-Val Summary no topo da aba V5.2). Opção D (Planos de Monitoramento) removida do roadmap a pedido do usuário (monitoramento vive em outro sistema). Próxima: 6.4-B ou 6.4-C. |
| 2.6 | 2026-05-20 | Fase 6.4-B concluída (refatoração `AnaliseCompleta` com layout DOC6 4-abas — Hero Verdict V5.2 + Tab1 Resumo&Decisão + Tab2 Evidências (Cross-Val 16 + Patch Financeiro 5 dim + Bloqueios + CAF) + Tab3 Dimensional BDC + Tab4 SENTINEL+Auditoria sticky). Roteamento condicional por `framework_version` — layout V4 legado 100% preservado para casos antigos. Próxima: 6.4-C (Widget V5.2 no DashboardCEO). |
| 2.7 | 2026-05-20 | Fase 6.4-C concluída (Widget V5.2 no DashboardCEO: AdoptionBanner 4 KPIs + FrameworkAdoptionBar V4/V5.1/V5.2 + CategoriaPie cat 1-5 + TierApprovalChart por tier com taxa de aprovação). Toda Fase 6.4 (A+B+C) concluída. Próxima: 6.5 (a definir). |
| 2.8 | 2026-05-20 | Fase 6.5.1 concluída (refator `AnaliseManual` para V5.2: chips de categoria V5.2 + filtro de bloqueios ativos + CSV ampliado com framework/score V5.2/tier/categoria/bloqueios + indicador de casos transicionais). Próxima: 6.5.2 — Trilho Subseller V5.2 (PJ+PF). |
| 2.9 | 2026-05-20 | Fase 6.5.2 concluída (Trilho Subseller V5.2 — Schema OnboardingLink + generateSubsellerLink + publicReadContext + FrameworkVersionPicker + GenerateLinkModal reformulado + badge V4/V5.2 em GerenciarSubsellerLinks + SubsellerQuestionnaire com roteamento condicional). Trilho V4 100% preservado — opt-in explícito p/ V5.2 pelo admin. Próxima: 6.5.3 — Comparator V4↔V5.2. |
| 2.10 | 2026-05-20 | Fase 6.5.3 concluída (Comparator V4↔V5.2 — página dedicada `/ComparatorV4V5_2`, 3 componentes focados (Header/MetricRow/BlockagesDiff), resolução automática de par via URL, diff inteligente de bloqueios em 3 baldes (Mantidos/Novos/Removidos), pareceres SENTINEL lado a lado, ReprocessButton com atalho direto pro Comparator). Próxima: 6.5.4 — Glossário inline. |
| 2.11 | 2026-05-20 | Fase 6.5.5 concluída (15 atalhos canônicos DOC6 §5.5 — shortcutsCatalog + useKeyboardShortcutsV5_2 com sequências/ignora inputs/modais, KeyboardShortcutsPanel "?", SearchOverlay "/", ShortcutsHintBadge sticky, V5_2ShortcutsProvider orquestrando tabs 1-4 + j/k + Esc cascata + ações a/c/m/r/s/e roteadas para AnaliseManual + p dispara dossiê PDF inline + g c copia caseId. Plugado em AnaliseCompletaV5_2 com data-shortcut-item nos 4 TabsContent). Próxima: 6.5.6 — FeedbackSentinelPanel estruturado. |
| 2.12 | 2026-05-20 | Fase 6.5.6 concluída (FeedbackSentinelPanel estruturado DOC4 §19.8 + DOC6 §2.6.6 + Q55 — catálogo canônico de 3 tipos + 9 categorias mapeadas ao enum SentinelFeedback, fluxo de 3 passos com filtro condicional de categorias por tipo, comentário obrigatório quando errou/parcial, persistência denormalizando contexto SENTINEL/framework/tier/segmento/morfologia, histórico inline de feedbacks anteriores. Plugado em Tab4SentinelAuditoria com data-shortcut-item). Próxima: 6.5.7 — Export Auditoria (PDF/JSON/XLSX). |
| 2.13 | 2026-05-20 | Fase 6.5.4 concluída (Glossário inline sistemático DOC6 §2.5.6 — 50+ termos canônicos no GLOSSARY_V5_2, componente Term com popover categorizado + fundamentação regulatória, TermBlock wrapper inteligente para bloqueios dinâmicos via aliases. Plugado em HeroVerdictV5_2 + Tab1/Tab2/Tab4 + SmartSummaryCards: tier badges, categorias de decisão, status do Patch, bloqueios B-*, cross-val status, SENTINEL, framework_version, capabilities, snapshot, morfologias, divergence/mismatch). Próxima: 6.5.7 — Export Auditoria (último item da Fase 6). |
| 2.14 | 2026-05-20 | Fase 6.5.7 concluída — ÚLTIMO ITEM DA FASE 6 (Export Auditoria XLSX adicionado ao DossieV5_2Button: workbook multi-aba determinístico — Resumo, Score V5.2, Bloqueios, Cross-Val 16, Patch Financ., SENTINEL, Exceções, Plano Cat 5, Snapshot ref. PDF e JSON já existiam da Fase 6.5.5, agora os 3 formatos compartilham mesmo hash SHA-256 via buildDossieV5_2). **FASE 6 V5.2 100% CONCLUÍDA.** Próximas frentes: Fase 7 (Pós-Decisão & Monitoramento Contínuo) e Fase 8 (Off-Boarding Ágil 24-48h). |
| 2.15 | 2026-05-20 | Fase 3b concluída (Tier 3 com 9 Módulos especializados — `lib/v5_2/tier3Modules.js` com catálogo declarativo: M_GW Gateway / M_MKT Marketplace / M_PV Plat. Vertical fan-out / M_DS Dropshipping / M_INFO Infoprodutos / M_TUR Turismo / M_EVT Eventos / M_SPL Splits transversal / M_CB Crossborder pesado. Cada módulo declara fundamentação regulatória, datasets requeridos, bloqueios possíveis, penalidades. Integrado na Camada 4 do scoringV5_2 — analista vê quais módulos rodaram e impacto de cada um). Próxima: Fase 4. |
| 2.16 | 2026-05-20 | Fase 4 concluída (Capabilities Executáveis — `lib/v5_2/financialCapacityValidation.js` com PJ 5 dimensões + PF 4 dimensões, consolidando status do Patch Financeiro V5.1 e calculando v_financial_coherence. `lib/v5_2/bloqueiosPFSubseller.js` com 11 bloqueios canônicos: 8 PF (B-PF-1..3, PEP, SANC núcleo-duro, FRAUDE-1 núcleo-duro, DOC-1, CB-1) + 3 Subseller PJ (B-SUB-PJ-1 teto grau C, B-SUB-PJ-2 seller sem splits, B-SUB-PJ-3 UBO já recusado anti-fraude). Avaliador puro `avaliarBloqueiosPFSubseller()` + helper para reaproveitar catálogo no engine `avaliarBloqueios.js`. Exportado via barrel). **FASES 3b + 4 V5.2 CONCLUÍDAS.** |