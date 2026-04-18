import React, { useState, useMemo } from 'react';
import { Flag, ChevronDown, ChevronUp, Database, Brain, Shield, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import RedFlagCard from './RedFlagCard';
import { enrichRedFlags } from './redFlagEnricher';

/**
 * RiskRedFlagsPanel v3 — each red flag is now a rich dossier (RedFlagCard)
 * grouped by source (BDC / CAF / SENTINEL), with severity, dimension,
 * why-it-matters, evidence, action and source.
 */

export default function RiskRedFlagsPanel({ onboardingCase, complianceScore }) {
  const [expanded, setExpanded] = useState(true);
  const allFlags = onboardingCase?.redFlags || complianceScore?.red_flags || [];

  const enriched = useMemo(() => enrichRedFlags(allFlags), [allFlags]);

  if (allFlags.length === 0) return null;

  const bdcFlags = enriched.filter(f => f.sourceBadge === 'BDC');
  const cafFlags = enriched.filter(f => f.sourceBadge === 'CAF');
  const sentinelFlags = enriched.filter(f => f.sourceBadge === 'SENTINEL');
  const otherFlags = enriched.filter(f => !['BDC', 'CAF', 'SENTINEL'].includes(f.sourceBadge));

  // Count by severity for the header summary
  const bySev = { BLOQUEANTE: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  enriched.forEach(f => { bySev[f.severity] = (bySev[f.severity] || 0) + 1; });

  return (
    <div data-red-flags-panel className="bg-white rounded-2xl border border-red-200 overflow-hidden scroll-mt-20">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-5 hover:bg-red-50/30 transition-colors text-left"
      >
        <div className="p-2.5 rounded-xl bg-red-50">
          <Flag className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#002443]">
            {allFlags.length} Alerta(s) Identificado(s)
          </h4>
          <p className="text-[10px] text-[#002443]/40 mt-0.5">
            Cada alerta mostra severidade, por que importa, evidências a verificar, ação sugerida e fonte.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {bdcFlags.length > 0 && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-[10px]">
              {bdcFlags.length} BDC
            </Badge>
          )}
          {cafFlags.length > 0 && (
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 border text-[10px]">
              {cafFlags.length} CAF
            </Badge>
          )}
          {sentinelFlags.length > 0 && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[10px]">
              {sentinelFlags.length} SENTINEL
            </Badge>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-red-100 p-5 space-y-5">
          {/* Summary pill row */}
          <div className="flex flex-wrap gap-2">
            {bySev.BLOQUEANTE > 0 && <SummaryPill label="Bloqueante" count={bySev.BLOQUEANTE} tone="bg-red-700 text-white" />}
            {bySev.CRITICAL > 0 && <SummaryPill label="Crítico" count={bySev.CRITICAL} tone="bg-red-100 text-red-700" />}
            {bySev.HIGH > 0 && <SummaryPill label="Alto" count={bySev.HIGH} tone="bg-orange-100 text-orange-700" />}
            {bySev.MEDIUM > 0 && <SummaryPill label="Médio" count={bySev.MEDIUM} tone="bg-amber-100 text-amber-700" />}
            {bySev.LOW > 0 && <SummaryPill label="Baixo" count={bySev.LOW} tone="bg-blue-100 text-blue-700" />}
            {bySev.INFO > 0 && <SummaryPill label="Info" count={bySev.INFO} tone="bg-slate-100 text-slate-700" />}
          </div>

          {/* Reading guide */}
          <div className="rounded-xl p-3 bg-slate-50/70 border border-slate-200 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#002443]/40 shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#002443]/60 leading-relaxed">
              <strong className="text-blue-700">BDC (azul)</strong> e <strong className="text-purple-700">CAF (roxo)</strong> são dados objetivos verificáveis — têm peso direto na decisão automática.{' '}
              <strong className="text-amber-700">SENTINEL (amarelo)</strong> é análise qualitativa da IA baseada no questionário — pode escalar para revisão manual, mas nunca recusa sozinho.
              Clique em cada alerta para ver detalhes.
            </p>
          </div>

          {/* Groups */}
          {bdcFlags.length > 0 && (
            <SourceGroup
              icon={Database}
              title="Dados Objetivos — Big Data Corp"
              subtitle="Dados verificáveis da Receita, processos, bureaus e registros públicos"
              count={bdcFlags.length}
              tone="blue"
            >
              {bdcFlags.map((f, i) => <RedFlagCard key={`bdc-${i}`} flag={f} defaultOpen={i === 0} />)}
            </SourceGroup>
          )}

          {cafFlags.length > 0 && (
            <SourceGroup
              icon={Shield}
              title="Biometria & Identidade — CAF"
              subtitle="Verificação de identidade: liveness, facematch, documentoscopia, deepfake"
              count={cafFlags.length}
              tone="purple"
            >
              {cafFlags.map((f, i) => <RedFlagCard key={`caf-${i}`} flag={f} defaultOpen={i === 0 && bdcFlags.length === 0} />)}
            </SourceGroup>
          )}

          {sentinelFlags.length > 0 && (
            <SourceGroup
              icon={Brain}
              title="Análise Qualitativa — SENTINEL IA"
              subtitle="Achados da IA a partir do questionário e cruzamento de fontes"
              count={sentinelFlags.length}
              tone="amber"
            >
              {sentinelFlags.map((f, i) => <RedFlagCard key={`sentinel-${i}`} flag={f} defaultOpen={i === 0 && bdcFlags.length === 0 && cafFlags.length === 0} />)}
            </SourceGroup>
          )}

          {otherFlags.length > 0 && (
            <SourceGroup
              icon={Flag}
              title="Outros Alertas"
              subtitle="Alertas sem fonte explícita"
              count={otherFlags.length}
              tone="slate"
            >
              {otherFlags.map((f, i) => <RedFlagCard key={`other-${i}`} flag={f} />)}
            </SourceGroup>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, count, tone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${tone}`}>
      <span className="text-sm font-black">{count}</span>
      <span className="uppercase tracking-wide text-[10px]">{label}</span>
    </span>
  );
}

function SourceGroup({ icon: Icon, title, subtitle, count, tone, children }) {
  const toneClasses = {
    blue: 'text-blue-700 bg-blue-50/40 border-blue-100',
    purple: 'text-purple-700 bg-purple-50/40 border-purple-100',
    amber: 'text-amber-700 bg-amber-50/40 border-amber-100',
    slate: 'text-slate-700 bg-slate-50/40 border-slate-100',
  }[tone] || 'text-slate-700 bg-slate-50/40 border-slate-100';

  return (
    <div className={`rounded-xl border p-3 ${toneClasses}`}>
      <div className="flex items-start gap-2 mb-3 pb-2 border-b border-current/10">
        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-bold uppercase tracking-wider">{title}</p>
            <span className="text-[10px] opacity-60">({count})</span>
          </div>
          <p className="text-[10px] opacity-70 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}