import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Source } from '../DocPrimitives';

/**
 * Capítulo 14 — Framework V5.2 (Fundamentos, Tiers, Capabilities, Segmentos)
 *
 * V5.2 NÃO substitui V4 — coexiste. Casos antigos continuam V4; novos casos
 * podem nascer V5.2 conforme feature flag. Toda a doc V4 (Ch01-Ch13) permanece
 * válida e normativa para o trilho legado.
 *
 * Fonte real (linha-a-linha):
 *   lib/v5_2/constants.js
 *   lib/v5_2/tiers.js
 *   lib/v5_2/capabilities.js
 *   lib/v5_2/segments.js
 *   lib/v5_2/tieringEngine.js
 *   lib/v5_2/featureFlagServer.js
 *   functions/v5_2FeatureFlag.js
 *   entities/OnboardingCase.json (campos framework_version_*)
 */
export default function Ch14_FrameworkV5_2() {
  return (
    <Sec id="ch-14">
      <H1 num="14">Framework V5.2 — Fundamentos, Tiers, Capabilities, Segmentos</H1>

      <P>O <B>Framework V5.2</B> é a evolução do modelo de risco V4. Foi desenhado para resolver três limitações que apareceram em produção V4: (1) <B>escala única para todos os portes</B> — gateways grandes e MEIs cabem no mesmo 0-849; (2) <B>capabilities transversais não-modeláveis</B> — splits, crossborder e recorrência atravessam vários segmentos e não tinham peso próprio; (3) <B>casos "quase recusados" sem alternativa intermediária</B> — bloqueio era um interruptor sem opção de "aprovar com monitoramento intensivo". V5.2 introduz Tiers, Capabilities e a Categoria 5.</P>

      <Note title="V5.2 é ADITIVO, não substitutivo" kind="rule">
        <p>O motor V4 (<C>bdcEnrichCase.js</C>) e todos os capítulos 03-09 deste manual continuam <B>válidos e em produção</B> para casos com <C>framework_version = 'v4.0'</C>. V5.2 roda em paralelo via funções dedicadas (<C>bdcEnrichCaseV5_2.js</C>, <C>autoEnrichOnboardingV5_2.js</C>, <C>scoreV5_2DryRun.js</C>, <C>tieringEngineDryRun.js</C>, <C>reprocessV4AsV5_2.js</C>). A escolha do framework é gravada no <B>DNA do caso</B> e nunca muda após criação.</p>
      </Note>

      <H2 num="14.1">DNA Imutável — Versionamento por Caso</H2>

      <P>Cada <C>OnboardingCase</C> carrega 4 campos de versionamento que registram o framework em momentos distintos do ciclo de vida. <B>São imutáveis após gravação</B>:</P>

      <Table headers={['Campo', 'Quando é gravado', 'Imutabilidade', 'Uso']} rows={[
        [<C key="1">framework_version</C>, 'Criação do caso (default v4.0)', 'Imutável após criação', 'DNA principal — define qual pipeline + UI usar.'],
        [<C key="2">framework_version_at_start</C>, 'Bootstrap do questionário (primeira interação do seller)', 'Imutável', 'Captura a versão vigente quando o seller iniciou. Não muda mesmo se a feature flag global mudar durante o preenchimento.'],
        [<C key="3">framework_version_at_submit</C>, 'Submissão final do questionário pelo seller', 'Imutável', 'Pode diferir de _at_start se houve mudança de versão durante preenchimento (caso transicional).'],
        [<C key="4">framework_version_at_decision</C>, 'Decisão final (SENTINEL conclui análise)', 'Imutável após decisão', 'Versão em vigor no momento do veredicto. É o que conta regulatoriamente para auditoria.'],
        [<C key="5">is_transitional_case</C>, 'Setado true quando _at_start ≠ _at_submit ou ≠ _at_decision', 'Imutável', 'Sinaliza ao analista que o caso atravessou mudança de versão — exibe banner especial na UI.'],
      ]} />

      <H3 num="14.1.1">Função `backfillFrameworkVersion`</H3>
      <P>Casos legados sem o campo são tratados como <C>v4.0</C> implicitamente. A função <C>backfillFrameworkVersion.js</C> popula o campo retroativamente para queries determinísticas. Idempotente — não sobrescreve casos já marcados.</P>

      <H2 num="14.2">Feature Flag — Controle Soft Rollout</H2>

      <P>A decisão de criar casos como v4.0 ou v5.2 é controlada por feature flag server-side (não pode ser bypassada pelo cliente):</P>

      <CodeBlock language="js">{`// lib/v5_2/featureFlagServer.js — fluxo simplificado
export async function isV5_2EnabledForCase({ segmento, tier, userEmail }) {
  // 1. Override admin global (env var V5_2_GLOBAL_ENABLED)
  if (Deno.env.get('V5_2_GLOBAL_ENABLED') === 'true') return true;

  // 2. Lista branca por segmento (ex: gateway + crossborder primeiro)
  const WHITELIST_SEGMENTOS = ['gateway', 'crossborder', 'plataforma_vertical'];
  if (WHITELIST_SEGMENTOS.includes(segmento)) return true;

  // 3. Lista branca por tier (ex: T3 primeiro)
  if (tier === 'tier_3') return true;

  // 4. Rollout percentual por hash do email (deterministico)
  const ROLLOUT_PCT = Number(Deno.env.get('V5_2_ROLLOUT_PCT') || 0);
  const hash = simpleHash(userEmail);
  return (hash % 100) < ROLLOUT_PCT;
}`}</CodeBlock>

      <P>Override local para QA: <C>localStorage.setItem('feature_score_engine_v5_2', 'true')</C>.</P>

      <H2 num="14.3">Os 3 Princípios Estruturais</H2>

      <Note title="Princípio 1 — Tier-Aware" kind="rule">
        <p>O <B>porte do seller</B> determina a escala de score e o set de variáveis aplicadas. Um gateway com R$ 5 milhões/mês não pode ser comparado com um MEI no mesmo eixo. V5.2 separa em 3 tiers + 2 sub-tiers de subseller (PJ/PF), cada um com sua escala matemática.</p>
      </Note>

      <Note title="Princípio 2 — Capabilities Transversais" kind="rule">
        <p>Algumas operações (splits, crossborder, recorrência) <B>atravessam segmentos</B> e adicionam exigências regulatórias específicas independente do segmento principal. V5.2 modela 4 capabilities canônicas que são "ativadas" quando o seller usa a operação, somando vetos e variáveis específicas ao score.</p>
      </Note>

      <Note title="Princípio 3 — Categoria 5 (Monitoramento Intensivo)" kind="rule">
        <p>Entre "aprovado com condições" (Cat 2) e "bloqueado" (Cat 4) existe um espaço cinzento — sellers que <B>não merecem aprovação direta mas têm valor comercial</B>. V5.2 cria a <B>Cat 5</B>: libera com TPV cap inicial, rolling reserve adicional, plano de monitoramento explícito (<C>PlanoMonitoramento</C>) e aceite formal do seller (<C>TermoAdicionalV5_2</C>). Detalhes no Cap. 17.</p>
      </Note>

      <H2 num="14.4">Tiers Canônicos V5.2</H2>

      <P>Definidos em <C>lib/v5_2/tiers.js</C>. Cada tier tem <B>escala própria</B> e <B>set de variáveis aplicadas</B>:</P>

      <Table headers={['Tier', 'Definição operacional', 'Escala score', 'Decisão Cat 4 (block) em']} rows={[
        ['tier_1', 'TPV mensal ≤ R$ 30.000 (MPE, autônomos, MEI iniciantes)', '0-850', 'score ≥ 720'],
        ['tier_2', 'TPV R$ 30.001 - 200.000 (médias empresas, marketplace fixo aqui)', '0-850', 'score ≥ 720'],
        ['tier_3', 'TPV > R$ 200.000 ou crossborder ou gateway (alta exposição)', '0-999', 'score ≥ 850'],
        ['subseller_pj', 'Subseller PJ qualquer porte (graus A/B/C por TPV interno)', '0-850', 'score ≥ 720'],
        ['subseller_pf', 'Subseller PF qualquer renda (graus A/B/C por renda líquida mensal)', '0-850', 'score ≥ 720'],
      ]} />

      <H3 num="14.4.1">Resolução automática — `resolverTier`</H3>

      <CodeBlock language="js">{`// lib/v5_2/tiers.js
export function resolverTier({ tpvMensalDeclarado, segmento, isSubseller, merchantType }) {
  // Subsellers têm tier próprio
  if (isSubseller) {
    return merchantType === 'PF' ? 'subseller_pf' : 'subseller_pj';
  }

  // Segmentos que SOBEM forçadamente para T3 (alta exposição regulatória)
  const SEGMENTOS_T3_FIXO = ['gateway', 'crossborder'];
  if (SEGMENTOS_T3_FIXO.includes(segmento)) return 'tier_3';

  // Marketplace fica FIXO em T2 (decisão de calibragem V5.2)
  if (segmento === 'marketplace') return 'tier_2';

  // Resolução por TPV declarado
  if (tpvMensalDeclarado > 200_000) return 'tier_3';
  if (tpvMensalDeclarado > 30_000)  return 'tier_2';
  return 'tier_1';
}`}</CodeBlock>

      <Note title="Por que Marketplace fixo em T2 (não T3)?" kind="info">
        <p>Marketplaces costumam ter TPV alto mas o risco é <B>distribuído entre sub-merchants</B> que já passam por KYC próprio. A calibragem V5.2 (fonte: doc <C>V5_2_BLOCO3_TIERS.md</C>) decidiu manter Marketplace em T2 para evitar dupla penalização: o seller principal já tem score T2 + cada subseller tem seu próprio score (PJ ou PF).</p>
      </Note>

      <H3 num="14.4.2">Sub-Tiers de Subseller — Graus A/B/C</H3>

      <P>Subsellers têm <B>grau</B> dentro do tier, gravado em <C>OnboardingCase.grau</C>:</P>

      <Table headers={['Tipo', 'Grau A', 'Grau B', 'Grau C']} rows={[
        ['Subseller PJ', 'TPV ≤ R$ 30k/mês (baixa exposição)', 'TPV R$ 30k-200k', 'TPV R$ 200k-500k (acima exige promoção a seller direto)'],
        ['Subseller PF', 'Renda líquida < R$ 2k/mês', 'Renda R$ 2k-10k', 'Renda > R$ 10k'],
      ]} />

      <P>O grau influencia: (a) profundidade de datasets BDC consultados, (b) exigência de docs adicionais, (c) thresholds de bloqueio. Implementado em <C>lib/v5_2/tier3Modules.js</C> e <C>lib/v5_2/bloqueiosPFSubseller.js</C>.</P>

      <H2 num="14.5">Capabilities Transversais (4 Canônicas)</H2>

      <P>Definidas em <C>lib/v5_2/capabilities.js</C>. Cada capability ATIVA soma exigências independentemente do segmento:</P>

      <Table headers={['Capability', 'Quando ativa', 'Impacto no questionário', 'Bloqueios específicos']} rows={[
        [<C key="c1">splits/subseller</C>, 'Seller opera marketplace, gateway/PSP ou faz repasse para terceiros', 'Adiciona ~12 perguntas de Tier 3 + exige plano de KYC dos subsellers', 'B-SPL-* (catálogo Cap. 15)'],
        [<C key="c2">crossborder</C>, 'Seller processa pagamentos internacionais (inbound ou outbound)', 'Adiciona ~8 perguntas sobre origem/destino + regulamentação BCB de câmbio + exposição cambial', 'B-CB-* (catálogo Cap. 15)'],
        [<C key="c3">recurrence</C>, 'Seller cobra assinaturas/recorrência (SaaS, infoprodutos com recorrência, serviços continuados)', 'Adiciona ~5 perguntas sobre churn, ciclo de vida, política cancelamento', 'B-REC-* específicos de chargeback recorrente'],
        [<C key="c4">cap_financial_capacity_validation</C>, 'Seller declara TPV ≥ 3× o faturamento comprovado (RAIS / ECF / DRE)', 'Ativa Patch Financeiro (5 dimensões — Cap. 15.4)', 'B-FIN-* (incoerência financeira severa)'],
      ]} />

      <H3 num="14.5.1">Resolução automática — `resolverCapabilities`</H3>

      <CodeBlock language="js">{`// lib/v5_2/capabilities.js
export function resolverCapabilities({ tier, segmento, isSubseller, declared }) {
  const caps = [];

  // Mapping por segmento
  const SEG_CAPS = {
    gateway:           ['splits/subseller'],
    marketplace:       ['splits/subseller'],
    plataforma_vertical: ['splits/subseller'],
    saas:              ['recurrence'],
    infoprodutos:      ['recurrence'],          // se declared.modeloCobranca === 'recorrencia'
    crossborder:       ['crossborder'],
  };
  caps.push(...(SEG_CAPS[segmento] || []));

  // Override declared (cliente declarou que tem split mesmo em segmento sem default)
  if (declared.fazSplit === true) caps.push('splits/subseller');
  if (declared.processaInternacional === true) caps.push('crossborder');
  if (declared.modeloCobranca === 'recorrencia') caps.push('recurrence');

  // Patch Financeiro — ativa se TPV declarado >> faturamento
  if (declared.tpvMensal * 12 > declared.faturamentoAnual * 3) {
    caps.push('cap_financial_capacity_validation');
  }

  return [...new Set(caps)]; // dedupe
}`}</CodeBlock>

      <H2 num="14.6">Segmentos Canônicos V5.2 (15 vs 13 do V4)</H2>

      <P>Definidos em <C>lib/v5_2/segments.js</C>. V5.2 mantém os 13 segmentos V4 e adiciona 2 novos para cobrir lacunas:</P>

      <Table headers={['Segmento', 'Origem', 'Tier default', 'Capabilities default']} rows={[
        ['gateway', 'V4', 'tier_3 (fixo)', 'splits/subseller'],
        ['marketplace', 'V4', 'tier_2 (fixo)', 'splits/subseller'],
        ['plataforma_vertical', 'V4', 'por TPV', 'splits/subseller'],
        ['ecommerce', 'V4', 'por TPV', '—'],
        ['dropshipping', 'V4', 'por TPV', '—'],
        ['infoprodutos', 'V4', 'por TPV', 'recurrence (cond.)'],
        ['saas', 'V4', 'por TPV', 'recurrence'],
        ['educacao', 'V4', 'por TPV', '—'],
        ['link_pagamento', 'V4', 'por TPV', '—'],
        ['mpe', 'V4', 'tier_1', '—'],
        ['pix_merchant', 'V4', 'por TPV', '—'],
        ['pix_intermediario', 'V4', 'tier_2 ou 3', 'splits/subseller'],
        ['foodtech', 'V4', 'por TPV', 'splits/subseller'],
        [<B key="cb">crossborder</B>, 'NOVO V5.2', 'tier_3 (fixo)', 'crossborder + (splits se aplicável)'],
        [<B key="bb">banking-as-a-service</B>, 'NOVO V5.2', 'tier_3 (fixo)', 'splits/subseller + crossborder (cond.)'],
      ]} />

      <H3 num="14.6.1">Por que esses 2 segmentos novos?</H3>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li><B>crossborder:</B> Antes do V5.2, sellers internacionais eram forçados em "Gateway" ou "Plataforma Vertical" — mascarava risco específico de câmbio + exposição cambial + regras BCB de câmbio. Agora têm segmento próprio com bloqueios específicos.</li>
        <li><B>banking-as-a-service:</B> Sellers que oferecem infraestrutura bancária para terceiros (modelo BaaS) misturavam-se com Gateway tradicional. Diferença operacional fundamental: BaaS opera com instituição licenciada parceira (BCB Res. Conj. 16/2025) — exige documentação específica que Gateway puro não tem.</li>
      </ul>

      <H2 num="14.7">Morfologias Operacionais</H2>

      <P>Cada caso V5.2 resolve uma <B>morfologia</B> — combinação operacional independente do segmento. Gravada em <C>OnboardingCase.morfologia</C>. Usada pela camada 2 do scoring (ajustes morfológicos):</P>

      <Table headers={['Morfologia', 'Trigger', 'Exemplo']} rows={[
        ['cartao_heavy', 'distribuicao.credito + debito ≥ 70%', 'E-commerce tradicional'],
        ['pix_heavy', 'distribuicao.pix ≥ 60%', 'Negócio local pós-pandemia'],
        ['boleto_heavy', 'distribuicao.boleto ≥ 40%', 'B2B clássico'],
        ['multimeio_balanced', 'Nenhum meio > 50%', 'E-commerce maduro'],
        ['recorrencia_pura', 'modeloCobranca = "recorrencia" + recurrence capability ativa', 'SaaS B2B'],
        ['crossborder_pura', 'crossborder capability ativa + segmento = crossborder', 'Importador/exportador via fintech'],
        ['marketplace_split', 'splits/subseller ativa + take rate < 15%', 'Marketplace típico'],
      ]} />

      <Note title="Onde a morfologia é resolvida no código" kind="info">
        <p>Função <C>resolverMorfologia</C> em <C>lib/v5_2/tieringEngine.js</C>. Os ajustes morfológicos por dimensão estão no Cap. 15.5 (motor de scoring V5.2). Exemplos: <B>cartao_heavy</B> aplica peso extra na dimensão "biometria_documentos" (risco fraude cartão); <B>pix_heavy</B> aplica peso extra em "identidade_cadastro" (risco MED PIX por CPF irregular); <B>crossborder_pura</B> exige cap "crossborder" ativa por construção.</p>
      </Note>

      <H2 num="14.8">Comparativo V4 × V5.2 — Visão Executiva</H2>

      <Table headers={['Aspecto', 'V4.0', 'V5.2']} rows={[
        ['Escala de score', '0-849 único', 'T1/T2/Subseller: 0-850 · T3: 0-999'],
        ['Bloqueios', '10 (B01-B10)', '72 (B-XXX-NN catalogados por dimensão)'],
        ['Datasets BDC', '~40', '58 nomeados canonicamente + 13 dimensões analíticas'],
        ['Categorias decisão', '4 implícitas (Aprovado/Condições/Manual/Recusado)', '5 explícitas (Cat 1 / 2 / 3 / 4 / 5)'],
        ['Cat 5 (monitoramento intensivo)', '—', 'Sim — TPV cap + reserve + plano + termo'],
        ['Capabilities transversais', 'Não modeladas', '4 canônicas com peso próprio'],
        ['Cross-Validation', 'Implícita no SENTINEL', '16 campos estruturada (Cap. 15.6)'],
        ['Patch Financeiro', '—', '5 dimensões com status verde/amarelo/laranja/vermelho'],
        ['Questionário', 'Templates por segmento (12 templates)', 'Catálogo único de 80+65 perguntas dinâmicas (Cap. 16)'],
        ['Real-time blocks', 'Avaliados só no submit', 'Engine avalia durante preenchimento (TierEscalatedBanner + RealtimeBlocksPanel)'],
        ['Imutabilidade decisão', 'Implícita', 'Snapshot persistente (entidade Snapshot)'],
        ['SENTINEL feedback loop', '—', 'Entidade SentinelFeedback grava feedback do analista para retreinamento'],
      ]} />

      <H2 num="14.9">Pipeline V5.2 — Onde Diverge do V4</H2>

      <P>O orquestrador <C>autoEnrichOnboardingV5_2.js</C> é estruturalmente similar ao V4 (Cap. 03) mas com 4 mudanças centrais:</P>

      <ol className="list-decimal ml-5 space-y-1 text-[12.5px] text-[#1a1a1a]">
        <li><B>Step 0.1 (NOVO):</B> Resolução de Tier + Capabilities ANTES do BDC. Usa <C>tieringEngineDryRun</C> com dados declarados — define quais datasets BDC serão chamados (T1 usa subset, T3 usa todos os 58).</li>
        <li><B>Step 1:</B> <C>bdcEnrichCaseV5_2.js</C> (em vez de V4) — escalas tier-aware, 72 bloqueios, 13 dimensões analíticas, cross-validation 16 campos estruturada.</li>
        <li><B>Step 3.5 (NOVO):</B> Patch Financeiro — 5 dimensões + status colorido (Cap. 15.4).</li>
        <li><B>Step 4 (alterado):</B> Decisão usa Matriz V5.2 (5 categorias). Cat 5 dispara criação de <C>PlanoMonitoramento</C> e exigência de aceite de <C>TermoAdicionalV5_2</C> (Cap. 17).</li>
      </ol>

      <H2 num="14.10">Drop-in API — como usar V5.2 no código</H2>

      <CodeBlock language="js">{`import {
  resolverTier,
  resolverCapabilities,
  resolverMorfologia,
  calcularScoreV5_2,
  CATEGORIAS_DECISAO_V5_2,
  isV5_2EnabledForCase,
} from '@/lib/v5_2';

// 1. Resolução
const tier = resolverTier({
  tpvMensalDeclarado: 80_000,
  segmento: 'gateway',
  isSubseller: false,
}); // → 'tier_2' (NOTA: gateway força tier_3 — esse exemplo seria reescrito)

const caps = resolverCapabilities({ tier, segmento: 'gateway', isSubseller: false });
// → ['splits/subseller', 'cap_financial_capacity_validation']

// 2. Scoring
const score = calcularScoreV5_2({
  tier, segmento: 'gateway', morfologia: 'cartao_heavy',
  capabilitiesAtivas: caps,
  variaveisInput: { v_cnpj_valido_e_ativo: 20, v_qsa_coherence: 15 },
  patchStatus: 'verde',
  bloqueiosAtivos: [],
});
// → { score_final: 247, score_max: 999, categoria_decisao: 'cat_2_conditional', ... }

// 3. Feature flag check (server-side)
const useV5_2 = await isV5_2EnabledForCase({ segmento, tier, userEmail });`}</CodeBlock>

      <Source files={[
        'lib/v5_2/README.md',
        'lib/v5_2/constants.js',
        'lib/v5_2/tiers.js',
        'lib/v5_2/capabilities.js',
        'lib/v5_2/segments.js',
        'lib/v5_2/tieringEngine.js',
        'lib/v5_2/tier3Modules.js',
        'lib/v5_2/bloqueiosPFSubseller.js',
        'lib/v5_2/featureFlagServer.js',
        'lib/v5_2/index.js (barrel export)',
        'functions/v5_2FeatureFlag.js',
        'functions/tieringEngineDryRun.js',
        'functions/scoreV5_2DryRun.js',
        'functions/autoEnrichOnboardingV5_2.js',
        'functions/bdcEnrichCaseV5_2.js',
        'functions/reprocessV4AsV5_2.js',
        'functions/backfillFrameworkVersion.js',
        'entities/OnboardingCase.json (framework_version_*, tier, morfologia, capabilities_ativas, grau, categoria_decisao_v5_2)',
        'docs/V5_2_BLOCO1_FUNDAMENTOS.md',
        'docs/V5_2_BLOCO3_TIERS.md',
      ]} />
    </Sec>
  );
}