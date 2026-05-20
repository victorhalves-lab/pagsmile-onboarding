import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle, Layers, Scale, FileText } from 'lucide-react';
import ComparatorHeader from '@/components/comparator/ComparatorHeader';
import ComparatorMetricRow from '@/components/comparator/ComparatorMetricRow';
import ComparatorBlockagesDiff from '@/components/comparator/ComparatorBlockagesDiff';
import Term from '@/components/v5_2/glossary/Term';
import GlossaryDrawer from '@/components/v5_2/glossary/GlossaryDrawer';

/**
 * [V5.2 Fase 6.5.3] Página Comparator V4↔V5.2 lado a lado.
 *
 * Entrada via URL:
 *   /ComparatorV4V5_2?v4=<v4CaseId>     (resolve V5.2 espelho automaticamente)
 *   /ComparatorV4V5_2?v5=<v5_2CaseId>   (resolve V4 origem via legacyV4CaseId)
 *   /ComparatorV4V5_2?v4=<id>&v5=<id>   (par explícito)
 *
 * A página NÃO modifica nenhum caso — somente leitura para auditoria.
 *
 * Estrutura:
 *  1. Header — identificação merchant + datas dos dois casos
 *  2. Veredito final lado a lado (decisão + categoria + subfaixa)
 *  3. Score breakdown
 *  4. Operacional (rolling reserve + monitoramento)
 *  5. Diff de bloqueios ativos
 *  6. Diff de IA / pareceres
 */
export default function ComparatorV4V5_2() {
  const urlParams = new URLSearchParams(window.location.search);
  const v4Param = urlParams.get('v4');
  const v5Param = urlParams.get('v5');

  // Resolve os 2 IDs a partir do que veio no URL
  const { data: caseIds, isLoading: loadingResolve } = useQuery({
    queryKey: ['comparator-resolve', v4Param, v5Param],
    queryFn: async () => {
      let v4Id = v4Param;
      let v5Id = v5Param;

      // Se só tem v4, busca o mirror V5.2
      if (v4Id && !v5Id) {
        const mirrors = await base44.entities.OnboardingCase.filter({ legacyV4CaseId: v4Id });
        if (mirrors.length > 0) v5Id = mirrors[0].id;
      }

      // Se só tem v5, busca o V4 origem
      if (v5Id && !v4Id) {
        const [v5Case] = await base44.entities.OnboardingCase.filter({ id: v5Id });
        if (v5Case?.legacyV4CaseId) v4Id = v5Case.legacyV4CaseId;
      }

      return { v4Id, v5Id };
    },
    enabled: !!(v4Param || v5Param),
  });

  const v4Id = caseIds?.v4Id;
  const v5Id = caseIds?.v5Id;

  // Busca os dois casos + scores em paralelo
  const { data, isLoading: loadingData } = useQuery({
    queryKey: ['comparator-data', v4Id, v5Id],
    queryFn: async () => {
      const [v4Case] = v4Id ? await base44.entities.OnboardingCase.filter({ id: v4Id }) : [null];
      const [v5_2Case] = v5Id ? await base44.entities.OnboardingCase.filter({ id: v5Id }) : [null];

      const merchantId = v4Case?.merchantId || v5_2Case?.merchantId;
      const [merchant] = merchantId ? await base44.entities.Merchant.filter({ id: merchantId }) : [null];

      // Compliance scores (1 por caso, pega o mais recente)
      const v4Scores = v4Id
        ? await base44.entities.ComplianceScore.filter({ onboarding_case_id: v4Id }, '-created_date', 1)
        : [];
      const v5_2Scores = v5Id
        ? await base44.entities.ComplianceScore.filter({ onboarding_case_id: v5Id }, '-created_date', 1)
        : [];

      return {
        v4Case,
        v5_2Case,
        merchant,
        v4Score: v4Scores[0] || null,
        v5_2Score: v5_2Scores[0] || null,
      };
    },
    enabled: !!(v4Id || v5Id),
  });

  // Estados de loading / erro
  if (!v4Param && !v5Param) {
    return (
      <ErrorState
        title="Caso não especificado"
        description="Passe um ID de caso V4 (?v4=...) ou V5.2 (?v5=...) na URL."
      />
    );
  }

  if (loadingResolve || loadingData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
        <span className="ml-3 text-[#002443]/70">Carregando comparação…</span>
      </div>
    );
  }

  const { v4Case, v5_2Case, merchant, v4Score, v5_2Score } = data || {};

  if (!v4Case && !v5_2Case) {
    return <ErrorState title="Casos não encontrados" description="Nenhum dos IDs informados retornou dados." />;
  }

  if (!v4Case || !v5_2Case) {
    return (
      <ErrorState
        title="Par incompleto"
        description={
          v4Case
            ? 'Esse caso V4 ainda não tem um espelho V5.2. Reprocesse o caso a partir de "Reprocessar como V5.2" no cadastro.'
            : 'Esse caso V5.2 não está vinculado a um caso V4 origem (legacyV4CaseId vazio).'
        }
      />
    );
  }

  // ── Derivações para as métricas ──
  const v4ScoreFinal = v4Score?.score_final ?? v4Case?.riskScoreV4 ?? v4Case?.riskScore;
  const v5_2ScoreFinal = v5_2Score?.score_v5_1_final ?? v5_2Case?.risk_score_v5_1;

  const v4Subfaixa = v4Score?.subfaixa || v4Case?.subfaixa;
  const v5_2Subfaixa = v5_2Score?.subfaixa_tier_aware || v5_2Case?.subfaixa_tier_aware;
  const v5_2Categoria = v5_2Score?.categoria_decisao_v5_1 || v5_2Case?.categoria_decisao_v5_2;

  const v4Decision = v4Case?.iaDecision || v4Score?.recomendacao_final;
  const v5_2Decision = v5_2Case?.iaDecision || v5_2Score?.recomendacao_final;

  const v4Rolling = v4Score?.rolling_reserve_percent ?? v4Case?.rollingReservePercent;
  const v5_2Rolling = v5_2Score?.rolling_reserve_percent ?? v5_2Case?.rollingReservePercent;

  const v4Monit = v4Score?.monitoramento_nivel || v4Case?.monitoramentoNivel;
  const v5_2Monit = v5_2Score?.monitoramento_nivel || v5_2Case?.monitoramentoNivel;

  const v4Blocks = v4Score?.bloqueios_ativos || v4Case?.bloqueiosAtivos || [];
  const v5_2Blocks = v5_2Score?.bloqueios_v5_1_ativos || v5_2Score?.bloqueios_ativos || v5_2Case?.bloqueiosAtivos || [];

  const v4Conditions = v4Score?.condicoes_automaticas || v4Case?.condicoesAutomaticas || [];
  const v5_2Conditions = v5_2Score?.condicoes_automaticas || v5_2Case?.condicoesAutomaticas || [];

  // V5.2-only context
  const v5_2Tier = v5_2Score?.tier_v5_1 || v5_2Case?.tier;
  const v5_2Morf = v5_2Score?.morfologia_v5_1 || v5_2Case?.morfologia;
  const v5_2PatchStatus = v5_2Score?.patch_financeiro_status || v5_2Case?.patch_financeiro_status;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Toolbar — abre o Glossário V5.2 */}
      <div className="flex items-center justify-end gap-2">
        <GlossaryDrawer />
      </div>

      <ComparatorHeader merchant={merchant} v4Case={v4Case} v5_2Case={v5_2Case} />

      {/* ── Veredito Final ── */}
      <Section title="Veredito final" icon={Scale} description="Decisão da IA + categoria/subfaixa de cada framework">
        <ComparatorMetricRow
          label="Decisão IA"
          hint="Recomendação automática do framework antes da revisão manual"
          v4Value={v4Decision}
          v5_2Value={v5_2Decision}
          divergenceMode="categorical"
          critical={v4Decision === 'Aprovado' && v5_2Decision === 'Recusado'}
        />
        <ComparatorMetricRow
          label={<>Subfaixa V4 / <Term code="cat_1_auto_approve" inline>Categoria V5.2</Term></>}
          hint="V4 usa 8 subfaixas (1A-5). V5.2 usa 5 categorias (cat_1 a cat_5)."
          v4Value={v4Subfaixa}
          v5_2Value={v5_2Categoria || v5_2Subfaixa}
        />
        <ComparatorMetricRow
          label="Status do caso"
          v4Value={v4Case?.status}
          v5_2Value={v5_2Case?.status}
          divergenceMode="text"
        />
      </Section>

      {/* ── Score Breakdown ── */}
      <Section title="Score breakdown" icon={Layers} description="Escalas V4 (0-849) e V5.2 (tier-aware) NÃO são diretamente comparáveis em valor absoluto, mas a posição relativa importa">
        <ComparatorMetricRow
          label="Score final"
          hint="V4: 0-849 fixo. V5.2: escala depende do tier (T1/T2/Sub=850, T3=999)."
          v4Value={v4ScoreFinal}
          v5_2Value={v5_2ScoreFinal}
          divergenceMode="text"
        />
        <ComparatorMetricRow
          label={<><Term code="tier_1" inline>Tier resolvido</Term> (V5.2 apenas)</>}
          hint="V4 não tem conceito de tier — usa segmento fixo. V5.2 resolve tier em runtime."
          v4Value="N/A (V4 não tem tier)"
          v5_2Value={v5_2Tier}
          divergenceMode="text"
        />
        <ComparatorMetricRow
          label={<><Term code="morfologia_a" inline>Morfologia</Term> (V5.2 apenas)</>}
          v4Value="N/A"
          v5_2Value={v5_2Morf}
          divergenceMode="text"
        />
        <ComparatorMetricRow
          label={<><Term code="patch_financeiro" inline>Patch Financeiro</Term> (V5.2 apenas)</>}
          hint="Cross-check declarado vs observado (TPV, faturamento, CRC, fluxo de caixa, coerência setorial)"
          v4Value="N/A"
          v5_2Value={v5_2PatchStatus}
          divergenceMode="text"
          critical={['vermelho', 'laranja'].includes(v5_2PatchStatus)}
        />
      </Section>

      {/* ── Operacional ── */}
      <Section title="Configuração operacional" icon={FileText} description="Parâmetros que governam o relacionamento pós-aprovação">
        <ComparatorMetricRow
          label={<Term code="rolling_reserve" inline>Rolling Reserve</Term>}
          hint="% de retenção sobre o TPV"
          v4Value={v4Rolling != null ? `${v4Rolling}%` : null}
          v5_2Value={v5_2Rolling != null ? `${v5_2Rolling}%` : null}
        />
        <ComparatorMetricRow
          label="Nível de monitoramento"
          v4Value={v4Monit}
          v5_2Value={v5_2Monit}
        />
        <ComparatorMetricRow
          label="Condições automáticas"
          v4Value={v4Conditions}
          v5_2Value={v5_2Conditions}
          divergenceMode="text"
        />
      </Section>

      {/* ── Diff de Bloqueios ── */}
      <ComparatorBlockagesDiff v4Blocks={v4Blocks} v5_2Blocks={v5_2Blocks} />

      {/* ── Pareceres IA ── */}
      <Section title="Pareceres da IA (SENTINEL)" icon={FileText} description="Resumo executivo de cada framework — útil para entender o raciocínio">
        <SentinelPareceresPair v4Score={v4Score} v5_2Score={v5_2Score} />
      </Section>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
        <p className="font-semibold mb-1">⚠️ Sobre a comparação</p>
        <p className="opacity-80">
          O caso V5.2 aqui é um <strong>espelho de sandbox</strong> criado a partir do caso V4 original via "Reprocessar como V5.2".
          Os scores numéricos não são diretamente comparáveis porque usam escalas diferentes — observe as <strong>decisões finais</strong>,
          as <strong>categorias</strong> e os <strong>bloqueios disparados</strong>. A análise V4 permanece a oficial até a virada formal de framework.
        </p>
      </div>
    </div>
  );
}

function Section({ title, description, icon: Icon, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-2 mb-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-[#002443]/5 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#002443]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#002443]">{title}</h3>
          {description && <p className="text-[11px] text-[#002443]/55 mt-0.5">{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SentinelPareceresPair({ v4Score, v5_2Score }) {
  const v4Text = v4Score?.parecer_final || v4Score?.sumario_executivo || v4Score?.analise_completa_ia;
  const v5Text = v5_2Score?.parecer_final || v5_2Score?.sumario_executivo || v5_2Score?.analise_completa_ia;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="p-3 rounded-lg bg-blue-50/40 border border-blue-100">
        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700 mb-1.5">SENTINEL · V4</p>
        {v4Text ? (
          <p className="text-xs text-[#002443]/85 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {v4Text}
          </p>
        ) : (
          <p className="text-xs text-[#002443]/50 italic">Sem parecer registrado.</p>
        )}
      </div>
      <div className="p-3 rounded-lg bg-[#2bc196]/5 border border-[#2bc196]/20">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[#2bc196] mb-1.5">SENTINEL · V5.2</p>
        {v5Text ? (
          <p className="text-xs text-[#002443]/85 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {v5Text}
          </p>
        ) : (
          <p className="text-xs text-[#002443]/50 italic">Sem parecer registrado (talvez o pipeline V5.2 ainda esteja processando).</p>
        )}
      </div>
    </div>
  );
}

function ErrorState({ title, description }) {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-600" />
      </div>
      <h2 className="text-lg font-bold text-[#002443] mb-2">{title}</h2>
      <p className="text-sm text-[#002443]/70">{description}</p>
    </div>
  );
}