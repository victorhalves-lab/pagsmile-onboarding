import React from 'react';
import { X, BookOpen, Calculator, AlertTriangle, Target, Database, ExternalLink } from 'lucide-react';
import { resolveDimension, getDimensionAction } from './dimensionGlossary';

/**
 * HeatmapDrillDown — panel that opens below the radar when the user clicks a dimension.
 * Explains WHAT the dimension analyses, WHY the score is X, what HIGH score means
 * and the recommended ACTION for the analyst.
 */

function pickItemsForDimension(dimKey, analysis, analiseDimensional) {
  // Preference 1: BDC analysis sections (richer — has items with labels + points)
  const section = analysis?.sections?.[dimKey];
  if (section?.items?.length > 0) {
    return { items: section.items, source: 'bdc' };
  }
  // Preference 2: SENTINEL analise_dimensional (leaner)
  const aliasMap = {
    identity: 'identidade', owners: 'socios', digital: 'digital',
    compliance: 'compliance', reputation: 'reputacao', financial: 'financeiro',
    biometria: 'biometria',
  };
  const sentinelKey = aliasMap[dimKey] || dimKey;
  const sentinelData = analiseDimensional?.[sentinelKey];
  if (sentinelData && typeof sentinelData === 'object') {
    const items = [];
    if (sentinelData.achados) {
      (sentinelData.achados || []).forEach(a => {
        items.push({ label: typeof a === 'string' ? a : a.titulo || a.label || 'Achado', points: a.pontos || 0, risk: sentinelData.veredicto });
      });
    }
    return { items, source: 'sentinel', veredicto: sentinelData.veredicto, justificativa: sentinelData.justificativa };
  }
  return { items: [], source: 'none' };
}

export default function HeatmapDrillDown({ dimKey, score, onClose, analysis, analiseDimensional }) {
  const dim = resolveDimension(dimKey);
  if (!dim) return null;

  const { items, source, veredicto, justificativa } = pickItemsForDimension(dimKey, analysis, analiseDimensional);

  const riskLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const riskColor = riskLevel === 'high' ? 'text-red-600' : riskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600';
  const riskBg = riskLevel === 'high' ? 'bg-red-50 border-red-200' : riskLevel === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';

  const action = getDimensionAction(dimKey, score);

  return (
    <div className="mt-4 rounded-xl border-2 border-[#0A0A0A]/10 bg-white overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-[#0A0A0A]/8">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{dim.icon}</span>
          <div>
            <h4 className="text-base font-bold text-[#0A0A0A]">{dim.label}</h4>
            <p className="text-[11px] text-[#0A0A0A]/50">
              Score de risco: <span className={`font-bold ${riskColor}`}>{score}/100</span>
              {' · '}
              {riskLevel === 'high' ? 'Risco Alto' : riskLevel === 'medium' ? 'Risco Moderado' : 'Risco Baixo'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* What it analyses */}
        <DrillSection icon={BookOpen} title="O que esta dimensão avalia" tone="slate">
          <p className="text-[12px] text-[#0A0A0A]/80 leading-relaxed">{dim.whatItAnalyses}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {dim.sources.map((s, i) => (
              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                <Database className="w-2.5 h-2.5 inline mr-0.5" />
                {s}
              </span>
            ))}
          </div>
        </DrillSection>

        {/* Why the score */}
        <DrillSection icon={Calculator} title={`Por que o score é ${score}/100`} tone="blue">
          {items.length > 0 ? (
            <div className="space-y-1.5">
              {items.slice(0, 8).map((it, i) => {
                const points = it.points || 0;
                const isNeg = points > 0;
                return (
                  <div key={i} className="flex items-center gap-2 py-1 text-[12px]">
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[52px] text-center ${isNeg ? 'bg-red-100 text-red-700' : points < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {points > 0 ? `+${points}` : points || '—'} pts
                    </span>
                    <span className="text-[#0A0A0A]/80 flex-1">{it.label}</span>
                    {it.risk && (
                      <span className="text-[9px] uppercase font-bold opacity-60">{it.risk}</span>
                    )}
                  </div>
                );
              })}
              {items.length > 8 && (
                <p className="text-[10px] text-[#0A0A0A]/40 italic">+ {items.length - 8} itens adicionais visíveis no bloco de Análise Dimensional abaixo</p>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-[#0A0A0A]/60 italic">
              {source === 'sentinel' && justificativa
                ? justificativa
                : 'Dados detalhados desta dimensão não estão disponíveis neste caso. Consulte a Análise Dimensional (bloco 9) ou execute um enriquecimento BDC para obter mais dados.'}
            </p>
          )}
          {source === 'sentinel' && veredicto && (
            <p className="mt-2 text-[10px] text-[#0A0A0A]/50">
              Veredito SENTINEL: <strong className="text-[#0A0A0A]/70">{veredicto}</strong>
            </p>
          )}
        </DrillSection>

        {/* What high score means */}
        <DrillSection icon={AlertTriangle} title="O que um score alto significa aqui" tone="amber">
          <p className="text-[12px] text-[#0A0A0A]/80 leading-relaxed">{dim.highScoreMeaning}</p>
        </DrillSection>

        {/* Action by range */}
        {action && (
          <DrillSection icon={Target} title="Ação recomendada para o analista" tone="green" highlight>
            <p className="text-[12px] text-[#0A0A0A] font-medium leading-relaxed">{action}</p>
          </DrillSection>
        )}

        {/* Link to dimensional block */}
        <div className="pt-2 border-t border-[#0A0A0A]/8">
          <a
            href="#risk-dimensional"
            onClick={(e) => {
              e.preventDefault();
              const el = document.querySelector(`[data-dimension-anchor="${dimKey}"]`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1356E2] hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Ver todos os itens BDC desta dimensão (bloco 9)
          </a>
        </div>
      </div>
    </div>
  );
}

function DrillSection({ icon: Icon, title, tone, children, highlight = false }) {
  const toneClass = {
    slate: 'text-slate-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    green: 'text-emerald-600',
  }[tone] || 'text-slate-600';

  return (
    <div className={highlight ? 'p-3 rounded-lg bg-emerald-50/60 border border-emerald-200' : ''}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${toneClass}`} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${toneClass}`}>{title}</span>
      </div>
      {children}
    </div>
  );
}