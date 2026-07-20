import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, GitCompare, TrendingUp, TrendingDown } from 'lucide-react';
import Term from '@/components/v5_2/glossary/Term';

/**
 * [V5.2 Fase 6.4-A] Smart Summary Cards — 3 cards executivos no topo da aba V5.2.
 *
 * Conforme DOC6 (Redesign Análise de Risco):
 *  • Card 1 — Top Alertas priorizados por impact_score (severidade × peso × custo)
 *  • Card 2 — Top Pontos Positivos (contexto balanceado)
 *  • Card 3 — Cross-Validation Summary (compacto, 4 counts)
 *
 * Pure render — recebe dados já normalizados do CadastroV5_2Tab.
 */

const SEVERITY_STYLE = {
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  HIGH:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  MEDIUM:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  LOW:      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  INFO:     { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
};

function HeroVerdict({ score, subfaixa, categoria }) {
  if (score == null && !categoria) return null;
  const cat = categoria || '';
  const color =
    cat.includes('cat_1') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    cat.includes('cat_2') ? 'bg-blue-50 text-blue-700 border-blue-200' :
    cat.includes('cat_3') ? 'bg-amber-50 text-amber-700 border-amber-200' :
    cat.includes('cat_4') ? 'bg-red-50 text-red-700 border-red-200' :
    cat.includes('cat_5') ? 'bg-purple-50 text-purple-700 border-purple-200' :
    'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <Card className={`border-2 ${color.split(' ')[2]}`}>
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#0A0A0A]/50 mb-1">
              Veredicto V5.2
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold font-mono text-[#0A0A0A]">{score != null ? score : '—'}</p>
              {subfaixa && (
                <p className="text-xs font-semibold text-[#0A0A0A]/60">{subfaixa}</p>
              )}
            </div>
          </div>
          {categoria && (
            <Term
              code={categoria}
              inline
              className={`${color} text-xs font-bold border px-3 py-1.5 rounded`}
            >
              {categoria.replace(/_/g, ' ').toUpperCase()}
            </Term>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TopAlertsCard({ alerts }) {
  const sty = (sev) => SEVERITY_STYLE[sev] || SEVERITY_STYLE.INFO;
  return (
    <Card className="border border-red-100">
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#0A0A0A]/5">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#0A0A0A]">Top Alertas</h3>
          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] ml-auto">{alerts.length}</Badge>
        </div>
        {alerts.length === 0 ? (
          <p className="text-[11px] text-[#0A0A0A]/50 italic py-3 text-center">Sem alertas priorizados.</p>
        ) : (
          <ul className="space-y-2.5">
            {alerts.slice(0, 3).map((a, idx) => {
              const s = sty(a.severity);
              return (
                <li key={a.red_flag_id || idx} className="text-xs leading-tight">
                  <div className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0A0A0A] truncate">
                        {a.title || a.red_flag_id || `Alerta #${idx + 1}`}
                      </p>
                      {a.why_it_matters && (
                        <p className="text-[10px] text-[#0A0A0A]/60 line-clamp-2 mt-0.5">{a.why_it_matters}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {a.severity && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${s.bg} ${s.text} font-semibold`}>
                            {a.severity}
                          </span>
                        )}
                        {a.impact_score != null && (
                          <span className="text-[9px] text-[#0A0A0A]/40 font-mono">impact: {a.impact_score}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TopPositivesCard({ positives }) {
  return (
    <Card className="border border-emerald-100">
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#0A0A0A]/5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#0A0A0A]">Top Positivos</h3>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] ml-auto">
            {positives.length}
          </Badge>
        </div>
        {positives.length === 0 ? (
          <p className="text-[11px] text-[#0A0A0A]/50 italic py-3 text-center">Sem pontos positivos destacados.</p>
        ) : (
          <ul className="space-y-2.5">
            {positives.slice(0, 3).map((p, idx) => (
              <li key={idx} className="text-xs leading-tight">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0A0A0A] truncate">
                      {p.title || p.description || `Positivo #${idx + 1}`}
                    </p>
                    {p.description && p.title && (
                      <p className="text-[10px] text-[#0A0A0A]/60 line-clamp-2 mt-0.5">{p.description}</p>
                    )}
                    {p.source && (
                      <span className="text-[9px] text-[#0A0A0A]/40 font-mono mt-1 inline-block">
                        fonte: {p.source}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CrossValSummaryCard({ summary, divergencias, mismatches }) {
  const m  = summary?.match_count ?? 0;
  const d  = summary?.divergence_count ?? 0;
  const mm = summary?.mismatch_count ?? 0;
  const u  = summary?.unknown_count ?? 0;
  const total = m + d + mm + u;
  const issues = d + mm;
  const issuesList = [
    ...(Array.isArray(divergencias) ? divergencias.map((x) => ({ ...x, status: 'divergence' })) : []),
    ...(Array.isArray(mismatches) ? mismatches.map((x) => ({ ...x, status: 'mismatch' })) : []),
  ].slice(0, 3);

  return (
    <Card className="border border-blue-100">
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#0A0A0A]/5">
          <GitCompare className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#0A0A0A]">
            <Term code="cross_validation_16" inline>Cross-Val 16</Term>
          </h3>
          {total > 0 && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] ml-auto">
              {m}/{total} match
            </Badge>
          )}
        </div>

        {total === 0 ? (
          <p className="text-[11px] text-[#0A0A0A]/50 italic py-3 text-center">Cross-validation ainda não calculada.</p>
        ) : (
          <>
            {/* Bar */}
            <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-slate-100">
              {m > 0  && <div className="bg-emerald-400" style={{ width: `${(m / total) * 100}%` }} />}
              {d > 0  && <div className="bg-amber-400"   style={{ width: `${(d / total) * 100}%` }} />}
              {mm > 0 && <div className="bg-red-400"     style={{ width: `${(mm / total) * 100}%` }} />}
              {u > 0  && <div className="bg-slate-300"   style={{ width: `${(u / total) * 100}%` }} />}
            </div>

            {/* Counts */}
            <div className="grid grid-cols-4 gap-1 text-center mb-2">
              <div><p className="text-sm font-bold text-emerald-600 font-mono">{m}</p><p className="text-[9px] text-[#0A0A0A]/50 uppercase">match</p></div>
              <div><p className="text-sm font-bold text-amber-600 font-mono">{d}</p><p className="text-[9px] text-[#0A0A0A]/50 uppercase">diverg.</p></div>
              <div><p className="text-sm font-bold text-red-600 font-mono">{mm}</p><p className="text-[9px] text-[#0A0A0A]/50 uppercase">mismatch</p></div>
              <div><p className="text-sm font-bold text-slate-500 font-mono">{u}</p><p className="text-[9px] text-[#0A0A0A]/50 uppercase">s/ dado</p></div>
            </div>

            {/* Top issues */}
            {issues > 0 && issuesList.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#0A0A0A]/5">
                <p className="text-[9px] uppercase font-semibold text-[#0A0A0A]/40 mb-1">Issues a verificar</p>
                <ul className="space-y-0.5">
                  {issuesList.map((f, idx) => (
                    <li key={idx} className="text-[10px] flex items-center gap-1.5">
                      {f.status === 'mismatch'
                        ? <TrendingDown className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
                        : <TrendingUp className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />}
                      <span className="truncate text-[#0A0A0A]/75">{f.label || f.field_id}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SmartSummaryCards({ latestScore }) {
  if (!latestScore) return null;

  const topAlerts = Array.isArray(latestScore.impact_score_top_alerts) ? latestScore.impact_score_top_alerts : [];
  const topPositivos = Array.isArray(latestScore.top_positivos) ? latestScore.top_positivos : [];
  const cvSummary = latestScore.cross_validation_summary || {};
  const cvResults = latestScore.cross_validation_results || {};
  const cvFields = Array.isArray(cvResults.fields) ? cvResults.fields : [];
  const divergencias = cvFields.filter((f) => f.status === 'divergence');
  const mismatches = cvFields.filter((f) => f.status === 'mismatch');

  return (
    <div className="space-y-3">
      <HeroVerdict
        score={latestScore.score_v5_1_final}
        subfaixa={latestScore.subfaixa_tier_aware}
        categoria={latestScore.categoria_decisao_v5_1}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TopAlertsCard alerts={topAlerts} />
        <TopPositivesCard positives={topPositivos} />
        <CrossValSummaryCard
          summary={cvSummary}
          divergencias={divergencias}
          mismatches={mismatches}
        />
      </div>
    </div>
  );
}