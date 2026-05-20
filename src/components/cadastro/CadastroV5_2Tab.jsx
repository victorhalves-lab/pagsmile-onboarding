import React from 'react';
import { Rocket, Layers, BarChart3, ShieldAlert, ShieldCheck, GitCompare, Database, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import V5_2ExceptionWorkflow from './V5_2ExceptionWorkflow';
import V5_2PlanoMonitoramentoCard from './V5_2PlanoMonitoramentoCard';
import SmartSummaryCards from './v5_2/SmartSummaryCards';
import Term from '@/components/v5_2/glossary/Term';
import GlossaryDrawer from '@/components/v5_2/glossary/GlossaryDrawer';

/**
 * [V5.2 Fase 5.11] Aba dedicada V5.2 — renderiza:
 *  - 5 camadas de score V5.2 (segmento+tier, morfologia, variáveis, capabilities, patch financeiro)
 *  - Top 3 alertas priorizados por impact_score
 *  - Top 3 pontos positivos
 *  - Cross-Validation 16 campos (resumo + lista)
 *  - Bloqueios V5.2 ativos detalhados
 *  - Patch Financeiro — 5 dimensões
 *
 * Aparece SOMENTE quando latestCase.framework_version === 'v5.2'.
 * UI V4 segue intocada na aba "Compliance".
 */

const CAMADAS_V5_2 = [
  { key: 'score_camada_1_segmento', label: 'Camada 1 — Base Segmento+Tier', Icon: Layers },
  { key: 'score_camada_2_morfologia', label: 'Camada 2 — Ajuste Morfológico', Icon: Layers },
  { key: 'score_camada_3_variaveis', label: 'Camada 3 — Variáveis V-*', Icon: Layers },
  { key: 'score_camada_4_capabilities', label: 'Camada 4 — Capabilities', Icon: Layers },
  { key: 'score_camada_5_patch', label: 'Camada 5 — Patch Financeiro', Icon: Layers },
];

const PATCH_DIMENSOES = [
  { key: 'tpv_declarado_vs_bdc', label: 'TPV declarado × BDC' },
  { key: 'faturamento_doc_vs_ecf', label: 'Faturamento doc × ECF' },
  { key: 'crc_status', label: 'CRC Status' },
  { key: 'fluxo_caixa_open_finance', label: 'Fluxo de caixa (Open Finance)' },
  { key: 'coerencia_setor', label: 'Coerência de Setor' },
];

const CV_STATUS_COLOR = {
  match: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  divergence: 'bg-amber-50 text-amber-700 border-amber-200',
  mismatch: 'bg-red-50 text-red-700 border-red-200',
  unknown: 'bg-slate-50 text-slate-600 border-slate-200',
};

const SEVERITY_COLOR = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
  LOW: 'bg-blue-100 text-blue-800 border-blue-300',
  INFO: 'bg-slate-100 text-slate-700 border-slate-300',
};

function EmptyState({ children }) {
  return <p className="text-xs text-[#002443]/50 italic">{children}</p>;
}

export default function CadastroV5_2Tab({ latestCase, latestScore, onRefetch }) {
  if (!latestCase || latestCase.framework_version !== 'v5.2') {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-sm text-slate-500">
        Este caso não usa o framework V5.2.
      </div>
    );
  }

  if (!latestScore) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-sm text-slate-500">
        Análise V5.2 ainda não disponível — pipeline em processamento.
      </div>
    );
  }

  const camadas = CAMADAS_V5_2.map((c) => ({ ...c, value: latestScore[c.key] }));
  const scoreFinal = latestScore.score_v5_1_final;
  const topAlerts = Array.isArray(latestScore.impact_score_top_alerts) ? latestScore.impact_score_top_alerts : [];
  const topPositivos = Array.isArray(latestScore.top_positivos) ? latestScore.top_positivos : [];
  const cvSummary = latestScore.cross_validation_summary || {};
  const cvResults = latestScore.cross_validation_results || {};
  const cvFields = Array.isArray(cvResults.fields) ? cvResults.fields : [];
  const bloqueios = Array.isArray(latestScore.bloqueios_v5_1_ativos) ? latestScore.bloqueios_v5_1_ativos : [];
  const patchDimensoes = latestScore.patch_financeiro_dimensoes || {};

  return (
    <div className="space-y-4">
      {/* Toolbar V5.2 — link p/ Glossário */}
      <div className="flex items-center justify-end">
        <GlossaryDrawer variant="icon" />
      </div>

      {/* Smart Summary Cards [Fase 6.4-A] — veredicto + 3 cards executivos no topo */}
      <SmartSummaryCards latestScore={latestScore} />

      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#2bc196]" />
            Análise <Term code="framework_version" inline>V5.2</Term> — Score <Term code="tier_1" inline>Tier-Aware</Term>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] uppercase text-[#002443]/50 font-semibold tracking-wide mb-1">Score Final V5.2</p>
              <p className="text-3xl font-bold text-[#002443] font-mono">
                {scoreFinal != null ? scoreFinal : '—'}
              </p>
              {latestScore.subfaixa_tier_aware && (
                <p className="text-xs text-[#002443]/60 mt-1">Subfaixa: {latestScore.subfaixa_tier_aware}</p>
              )}
            </div>
            {latestScore.categoria_decisao_v5_1 && (
              <Term code={latestScore.categoria_decisao_v5_1} inline>
                <Badge className="bg-[#2bc196]/15 text-[#36706c] border-0 text-xs cursor-help">
                  {latestScore.categoria_decisao_v5_1}
                </Badge>
              </Term>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5 Camadas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#002443]/60" />
            Decomposição em 5 Camadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {camadas.map((c) => (
              <div key={c.key} className="flex items-center justify-between border-b border-[#002443]/5 last:border-0 py-1.5">
                <span className="text-xs text-[#002443]/75 flex items-center gap-1.5">
                  <c.Icon className="w-3 h-3 text-[#002443]/40" />
                  {c.label}
                </span>
                <span className={`text-sm font-mono font-semibold ${c.value > 0 ? 'text-emerald-700' : c.value < 0 ? 'text-red-700' : 'text-[#002443]/40'}`}>
                  {c.value != null ? (c.value > 0 ? '+' : '') + c.value : '—'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Alertas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Top Alertas (priorizados por impact_score)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topAlerts.length === 0 ? (
            <EmptyState>Nenhum alerta priorizado.</EmptyState>
          ) : (
            <div className="space-y-3">
              {topAlerts.map((a, idx) => (
                <div key={a.red_flag_id || idx} className="border border-[#002443]/8 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <span className="text-sm font-semibold text-[#002443]">{a.title || a.red_flag_id || `Alerta #${idx + 1}`}</span>
                    {a.severity && (
                      <Badge className={`text-[10px] border ${SEVERITY_COLOR[a.severity] || SEVERITY_COLOR.INFO}`}>
                        {a.severity}
                      </Badge>
                    )}
                  </div>
                  {a.why_it_matters && <p className="text-xs text-[#002443]/70 mb-1">{a.why_it_matters}</p>}
                  {a.suggested_action && (
                    <p className="text-xs text-[#002443]/55 italic">→ {a.suggested_action}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#002443]/40">
                    {a.source && <span>Fonte: {a.source}</span>}
                    {a.impact_score != null && <span>Impact: {a.impact_score}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Positivos */}
      {topPositivos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Pontos Positivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {topPositivos.map((p, idx) => (
                <li key={idx} className="text-xs text-[#002443]/75 flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>{p.title || p.description || JSON.stringify(p)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Cross-Validation 16 campos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#002443]/60" />
            <Term code="cross_validation_16" inline>Cross-Validation 16 Campos V5.2</Term>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cvFields.length === 0 ? (
            <EmptyState>Cross-validation ainda não calculada.</EmptyState>
          ) : (
            <>
              {/* Summary chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {cvSummary.match_count != null && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">✓ Match: {cvSummary.match_count}</Badge>}
                {cvSummary.divergence_count != null && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">⚠ Divergência: {cvSummary.divergence_count}</Badge>}
                {cvSummary.mismatch_count != null && <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">✗ Mismatch: {cvSummary.mismatch_count}</Badge>}
                {cvSummary.unknown_count != null && <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">? Sem dado: {cvSummary.unknown_count}</Badge>}
              </div>
              {/* Tabela compacta */}
              <div className="border border-[#002443]/8 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#002443]/4">
                    <tr>
                      <th className="text-left p-2 font-semibold text-[#002443]/60">Campo</th>
                      <th className="text-left p-2 font-semibold text-[#002443]/60">Declarado</th>
                      <th className="text-left p-2 font-semibold text-[#002443]/60">BDC</th>
                      <th className="text-left p-2 font-semibold text-[#002443]/60">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cvFields.map((f, idx) => (
                      <tr key={f.field_id || idx} className="border-t border-[#002443]/5">
                        <td className="p-2 text-[#002443]/75">{f.label || f.field_id}</td>
                        <td className="p-2 text-[#002443]/60 font-mono">{String(f.declared_value ?? '—').slice(0, 30)}</td>
                        <td className="p-2 text-[#002443]/60 font-mono">{String(f.bdc_value ?? '—').slice(0, 30)}</td>
                        <td className="p-2">
                          <Badge className={`text-[10px] border ${CV_STATUS_COLOR[f.status] || CV_STATUS_COLOR.unknown}`}>
                            {f.status || 'unknown'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Patch Financeiro */}
      {Object.keys(patchDimensoes).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-[#002443]/60" />
              <Term code="patch_financeiro" inline>Patch Financeiro — 5 Dimensões</Term>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PATCH_DIMENSOES.map((d) => {
                const dim = patchDimensoes[d.key];
                if (!dim) return null;
                return (
                  <div key={d.key} className="border border-[#002443]/8 rounded-md p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#002443]">{d.label}</span>
                      {dim.bloqueio_disparado && (
                        <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">Bloqueio</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-[#002443]/60 font-mono">
                      <div>Declarado: {dim.valor_declarado ?? '—'}</div>
                      <div>Observado: {dim.valor_observado ?? '—'}</div>
                      <div>Divergência: {dim.divergencia_pct != null ? dim.divergencia_pct + '%' : '—'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bloqueios ativos detalhados + Aplicar Exceção V5.2 */}
      {bloqueios.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <Term code="bloqueio_absoluto" inline>Bloqueios V5.2 Ativos</Term> ({bloqueios.length})
              </CardTitle>
              <V5_2ExceptionWorkflow
                caseId={latestCase.id}
                bloqueiosAtivos={bloqueios}
                onApplied={onRefetch}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {bloqueios.map((b) => (
                <Badge key={b} className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-mono">
                  {b}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plano de Monitoramento (Cat 5) — só renderiza se existir */}
      <V5_2PlanoMonitoramentoCard caseId={latestCase.id} />

      {/* Overrides aplicados (exceções históricas) */}
      {Array.isArray(latestScore.overrides_aplicados) && latestScore.overrides_aplicados.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Exceções Aplicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {latestScore.overrides_aplicados.map((o, idx) => {
                const [codigo, blocos, email, data] = String(o).split(':');
                return (
                  <li key={idx} className="text-[11px] border-l-2 border-amber-300 pl-2 py-1">
                    <p className="font-semibold text-[#002443]">{codigo}</p>
                    <p className="text-[#002443]/60">Bloqueios: <code className="font-mono">{blocos}</code></p>
                    <p className="text-[#002443]/50">Por {email} em {data ? new Date(data).toLocaleString('pt-BR') : '—'}</p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}