import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ShieldAlert, Camera, AlertOctagon, RefreshCw, ChevronRight, TrendingDown, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard for "questionable escalations" — cases where V4 subfaixa says
 * low/medium risk (1A, 1B, 2A, 2B, 3A, 3B) but the case was escalated to
 * Manual. Helps the compliance team spot systemic issues in the escalation
 * rules (e.g. "we're escalating too many 1As because of liveness quality").
 */

const LOW_TO_MEDIUM_SUBFAIXAS = new Set(['1A', '1B', '2A', '2B', '3A', '3B']);

const SOURCE_META = {
  CAF_FRAUD: { label: 'Fraude CAF confirmada', icon: ShieldAlert, color: 'bg-red-100 text-red-700 border-red-200' },
  CAF_QUALITY: { label: 'Qualidade CAF', icon: Camera, color: 'bg-sky-100 text-sky-700 border-sky-200' },
  V4_BLOCK: { label: 'Bloqueio V4', icon: AlertOctagon, color: 'bg-red-100 text-red-700 border-red-200' },
  V4_SUBFAIXA_4: { label: 'Subfaixa 4', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  SAFETY_NET: { label: 'Rebaixamento', icon: RefreshCw, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  NONE: { label: 'Sem motivo técnico', icon: AlertTriangle, color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function EscalationsReview() {
  const { data: cases, isLoading } = useQuery({
    queryKey: ['escalations-review'],
    queryFn: async () => {
      const all = await base44.entities.OnboardingCase.filter({ status: 'Manual' }, '-finalDecisionDate', 500);
      return (all || []).filter(c => LOW_TO_MEDIUM_SUBFAIXAS.has(c.subfaixa));
    },
  });

  const loading = isLoading;
  const list = cases || [];
  const bySource = list.reduce((acc, c) => {
    const k = c.escalationSource || 'NONE';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const bySubfaixa = list.reduce((acc, c) => {
    acc[c.subfaixa] = (acc[c.subfaixa] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-[#002443]">Escalações Questionáveis</h1>
        <p className="text-sm text-[#002443]/60 mt-1">
          Casos com subfaixa de baixo/médio risco (1A–3B) que foram escalados para Revisão Manual.
          Use para identificar padrões e ajustar as regras de escalação.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )}

      {!loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard label="Total escalado" value={list.length} icon={Users} tone="slate" />
            <KPICard
              label="Por qualidade CAF"
              value={bySource.CAF_QUALITY || 0}
              icon={Camera}
              tone="sky"
              hint="Falsos positivos prováveis"
            />
            <KPICard
              label="Por fraude CAF confirmada"
              value={bySource.CAF_FRAUD || 0}
              icon={ShieldAlert}
              tone="red"
              hint="Escalações legítimas"
            />
            <KPICard
              label="Sem motivo técnico"
              value={bySource.NONE || 0}
              icon={TrendingDown}
              tone="amber"
              hint="Casos legados ou safety net"
            />
          </div>

          {/* Distribution by subfaixa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[#002443]">Distribuição por Subfaixa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {['1A', '1B', '2A', '2B', '3A', '3B'].map(sf => {
                  const count = bySubfaixa[sf] || 0;
                  const pct = list.length > 0 ? ((count / list.length) * 100).toFixed(0) : 0;
                  return (
                    <div key={sf} className="rounded-lg border border-slate-200 p-3 text-center">
                      <p className="text-[10px] font-bold text-[#002443]/50 uppercase">{sf}</p>
                      <p className="text-2xl font-black text-[#002443]">{count}</p>
                      <p className="text-[10px] text-[#002443]/40">{pct}% do total</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* List of cases */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[#002443]">
                Casos escalados ({list.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {list.length === 0 ? (
                <p className="text-sm text-[#002443]/50 text-center py-12">
                  Nenhuma escalação questionável encontrada. As regras de escalação estão se comportando bem.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {list.map(c => (
                    <CaseRow key={c.id} caseItem={c} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, icon: Icon, tone, hint }) {
  const toneClasses = {
    slate: 'bg-slate-50 border-slate-200 text-[#002443]',
    sky: 'bg-sky-50 border-sky-200 text-sky-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
  }[tone] || 'bg-slate-50 border-slate-200';

  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 opacity-60" />
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      </div>
      <p className="text-3xl font-black">{value}</p>
      {hint && <p className="text-[10px] opacity-60 mt-1">{hint}</p>}
    </div>
  );
}

function CaseRow({ caseItem }) {
  const meta = SOURCE_META[caseItem.escalationSource] || SOURCE_META.NONE;
  const Icon = meta.icon;
  const date = caseItem.finalDecisionDate ? new Date(caseItem.finalDecisionDate).toLocaleDateString('pt-BR') : '—';

  return (
    <li>
      <Link
        to={`/CadastroDetalhe?id=${caseItem.merchantId}`}
        className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-[#002443]/5 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#002443]/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-[10px] ${meta.color}`}>
              Subfaixa {caseItem.subfaixa}
            </Badge>
            <Badge className={`text-[10px] ${meta.color}`}>
              {meta.label}
            </Badge>
            {caseItem.cafRecaptureRequested && (
              <Badge className="text-[10px] bg-sky-100 text-sky-700 border-sky-200">
                Recaptura solicitada
              </Badge>
            )}
          </div>
          {caseItem.escalationReason && (
            <p className="text-xs text-[#002443]/70 mt-1 line-clamp-2">{caseItem.escalationReason}</p>
          )}
          <p className="text-[10px] text-[#002443]/40 mt-1">
            Score V4: {caseItem.riskScoreV4}/849 • Decidido em {date}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-[#002443]/30 shrink-0" />
      </Link>
    </li>
  );
}