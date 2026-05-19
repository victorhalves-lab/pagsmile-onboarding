# lib/v5_1/ — Constantes e helpers do Framework V5.1

**REGRA SUPREMA:** Nada neste diretório é importado por código V4. Tudo aqui só é usado por componentes/funções V5.1 (sufixo `V5_1` ou path `_v5_1`).

## Conteúdo

| Arquivo | Descrição |
|---|---|
| `frameworkConstants.js` | Versão, default version, helpers `isV5_1(case)`, `isV4(case)` |
| `tiers.js` | Definição dos 5 tiers, regras de resolução TPV → tier, marketplace sempre tier_2 |
| `segmentos.js` | 13 segmentos V5.1, segmentos críticos que forçam capabilities, mapping para tier mínimo |
| `morfologias.js` | Morfologias operacionais (PIX-only, Multi-MEI, B2C-cross-border, etc.) |
| `capabilities.js` | 4 capabilities transversais com regras de ativação |
| `subfaixasTierAware.js` | Subfaixas tier-aware (1A-T1, 2A-T2, 1A-SubPJ, etc.) com cores |
| `scoreFormatter.js` | Helper único `formatScore(case)` que renderiza V4 ou V5.1 conforme DNA |
| `matrizDecisao.js` | Matriz Canônica de Decisão V5.1 (5 categorias) |

## Convenção de uso

```jsx
import { isV5_1 } from '@/lib/v5_1/frameworkConstants';

// SEMPRE faça check defensivo:
if (isV5_1(onboardingCase)) {
  return <NovaTela />;
}
return <TelaLegada />;  // V4 = default seguro
``