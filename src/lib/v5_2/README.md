# lib/v5_2 — Framework V5.2 (consolidação V5.1 + recalibragem)

Single source of truth para o framework V5.2 de Compliance/Risk Scoring.

## 📚 Documentação de referência

Todos os documentos de diagnóstico estão em `docs/V5_2_*`:

- `V5_2_BLOCO1_FUNDAMENTOS.md` — entidades, princípios, framework versioning
- `V5_2_BLOCO2_DATASETS_BLOQUEIOS.md` — catálogo 58 datasets + 72 bloqueios
- `V5_2_BLOCO3_TIERS.md` — Tiers 1/2/3 + Subseller PJ/PF + 9 módulos Tier 3
- `V5_2_BLOCO4_QUESTIONARIO.md` — questionário dinâmico V5.2 (80+65 perguntas)
- `V5_2_BLOCO5_SEGMENTOS_PARTE{1,2,3,4}.md` — 13 segmentos diagnosticados
- `V5_2_BLOCO6_REDESIGN_ANALISE_RISCO.md` — UI/UX nova tela (Hero + 4 abas + 58 datasets mapeados)
- `V5_2_ROADMAP_IMPLEMENTACAO.md` — roadmap 4 fases
- `V5_2_DECISOES_USUARIO.md` — decisões confirmadas

## 📁 Estrutura

```
lib/v5_2/
├── README.md                    ← este arquivo
├── constants.js                 ← constantes canônicas (13 dimensões, 4 estados, 10 absolutos, etc.)
└── deveConsultarDataset.js      ← lógica condicional unificada
```

## 🚀 Fases de implementação (status)

- ✅ **FASE 1 — Fundação (em andamento)**
  - ✅ Schemas atualizados: Dataset, Bloqueio, IntegrationLog, Capability, ComplianceScore
  - ✅ Nova entidade: `SentinelFeedback` (Q55)
  - ✅ Constantes canônicas V5.2 (`lib/v5_2/constants.js`)
  - ✅ Função `deveConsultarDataset` + `montarListaDatasets`
  - ✅ Feature flag `risk_analysis_v2` (via localStorage override)
  - ⏳ Seed master data (58 datasets + 72 bloqueios + 4 capabilities)
  - ⏳ Componentes shared (TopBar/HeroVerdict/SmartSummary)
- ⏳ **FASE 2 — Abas 1 + 2** (Cross-Validation 16 + Patch Financeiro + Bloqueios DOC5 + CAF)
- ⏳ **FASE 3 — Abas 3 + 4** (Dimensional BDC com 13 dimensões + SENTINEL + Trilha Auditoria)
- ⏳ **FASE 4 — Polish + A11Y + Atalhos + Mobile + Training**
- ⏳ **FASE 5 — Rollout soft launch 10% → 50% → 100%**

## 🔑 Princípios invioláveis

1. **Decisão NUNCA é recalculada no front** — só LIDA do ComplianceScore
2. **SENTINEL nunca pode RECUSAR** — só sugerir Manual/Condições
3. **CAF fraude biométrica SOBRESCREVE V5.2**
4. **10 bloqueios absolutos sem exceção** — nem Compliance Officer pode liberar
5. **5 escalas de score por Tier** (T3: 0-999; demais: 0-850)
6. **100% dos campos do `UnifiedRiskAnalysis` atual preservados** no V2
7. **Datasets `not_consulted` devem ser exibidos** (não ocultados) com explicação

## 🎯 Feature flag

```js
import { isFeatureEnabled } from '@/lib/v5_2/constants';

if (isFeatureEnabled('risk_analysis_v2', user)) {
  // renderiza UnifiedRiskAnalysisV2
} else {
  // renderiza UnifiedRiskAnalysis legado
}
```

Override local para desenvolvimento:
```js
localStorage.setItem('feature_risk_analysis_v2', 'true');
``