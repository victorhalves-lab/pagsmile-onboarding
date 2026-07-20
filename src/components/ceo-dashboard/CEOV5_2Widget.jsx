import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, TrendingUp, ShieldAlert, CheckCircle2, AlertTriangle, Eye, XCircle, Shield } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';

/**
 * [V5.2 Fase 6.4-C] Widget V5.2 do DashboardCEO.
 *
 * Mostra a saúde do framework V5.2 em produção:
 *   • Adoção (V4 vs V5.1 vs V5.2)
 *   • Distribuição por categoria de decisão (cat 1-5)
 *   • Taxa de aprovação por tier
 *   • Quick stats (transitional cases, bloqueios ativos, monitoramento intensivo)
 *
 * Pure render — todos os cálculos memoizados a partir do array `cases`.
 */

const CATEGORIA_CONFIG = {
  cat_1_auto_approve:        { label: 'Auto-Aprovado',     color: '#1356E2', Icon: CheckCircle2 },
  cat_2_conditional:         { label: 'C/ Condições',       color: '#3b82f6', Icon: AlertTriangle },
  cat_3_manual_review:       { label: 'Revisão Manual',     color: '#f59e0b', Icon: Eye },
  cat_4_block:               { label: 'Recusado',           color: '#ef4444', Icon: XCircle },
  cat_5_intensive_monitoring:{ label: 'Monit. Intensivo',  color: '#E84B1C', Icon: ShieldAlert },
};

const TIER_LABELS = {
  tier_1:       'Tier 1',
  tier_2:       'Tier 2',
  tier_3:       'Tier 3',
  subseller_pj: 'Subseller PJ',
  subseller_pf: 'Subseller PF',
};

function buildStats(cases) {
  // Adoção por framework
  const byFramework = { v4: 0, v51: 0, v52: 0, unknown: 0 };
  // Casos V5.2 apenas
  const v52Cases = [];
  for (const c of cases) {
    const fv = c.framework_version;
    if (fv === 'v5.2') { byFramework.v52++; v52Cases.push(c); }
    else if (fv === 'v5.1') byFramework.v51++;
    else if (fv === 'v4.0') byFramework.v4++;
    else byFramework.unknown++;
  }

  // Distribuição V5.2 por categoria
  const byCategoria = Object.keys(CATEGORIA_CONFIG).reduce((acc, k) => ({ ...acc, [k]: 0 }), {});
  let bloqueiosAtivos = 0;
  let monitIntensivo = 0;
  let transitionals = 0;
  for (const c of v52Cases) {
    const cat = c.categoria_decisao_v5_2;
    if (cat && byCategoria[cat] != null) byCategoria[cat]++;
    if (Array.isArray(c.bloqueiosAtivos) && c.bloqueiosAtivos.length > 0) bloqueiosAtivos++;
    if (cat === 'cat_5_intensive_monitoring') monitIntensivo++;
    if (c.is_transitional_case === true) transitionals++;
  }

  // Aprovação por tier (V5.2)
  const tierStats = {};
  for (const c of v52Cases) {
    const t = c.tier;
    if (!t) continue;
    if (!tierStats[t]) tierStats[t] = { total: 0, aprovados: 0, recusados: 0, manual: 0 };
    tierStats[t].total++;
    const cat = c.categoria_decisao_v5_2;
    if (cat === 'cat_1_auto_approve' || cat === 'cat_2_conditional' || cat === 'cat_5_intensive_monitoring') tierStats[t].aprovados++;
    else if (cat === 'cat_4_block') tierStats[t].recusados++;
    else if (cat === 'cat_3_manual_review') tierStats[t].manual++;
  }

  const totalCases = cases.length;
  const adoptionPct = totalCases > 0 ? (byFramework.v52 / totalCases) * 100 : 0;

  return { byFramework, byCategoria, tierStats, totalCases, v52Total: v52Cases.length, adoptionPct, bloqueiosAtivos, monitIntensivo, transitionals };
}

function AdoptionBanner({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-xl bg-[#1356E2]/10 border border-[#1356E2]/30 p-3">
        <p className="text-[10px] uppercase font-bold text-[#1356E2] tracking-wide">Adoção V5.2</p>
        <p className="text-2xl font-bold font-mono text-[#0A0A0A] mt-1">{stats.adoptionPct.toFixed(1)}%</p>
        <p className="text-[10px] text-[#0A0A0A]/50">{stats.v52Total} de {stats.totalCases} casos</p>
      </div>
      <div className="rounded-xl bg-purple-50 border border-purple-200 p-3">
        <p className="text-[10px] uppercase font-bold text-purple-700 tracking-wide">Monit. Intensivo</p>
        <p className="text-2xl font-bold font-mono text-[#0A0A0A] mt-1">{stats.monitIntensivo}</p>
        <p className="text-[10px] text-[#0A0A0A]/50">Cat 5 ativos</p>
      </div>
      <div className="rounded-xl bg-red-50 border border-red-200 p-3">
        <p className="text-[10px] uppercase font-bold text-red-700 tracking-wide">Com Bloqueios</p>
        <p className="text-2xl font-bold font-mono text-[#0A0A0A] mt-1">{stats.bloqueiosAtivos}</p>
        <p className="text-[10px] text-[#0A0A0A]/50">Casos V5.2</p>
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
        <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wide">Transicionais</p>
        <p className="text-2xl font-bold font-mono text-[#0A0A0A] mt-1">{stats.transitionals}</p>
        <p className="text-[10px] text-[#0A0A0A]/50">Mudaram de framework</p>
      </div>
    </div>
  );
}

function CategoriaPie({ byCategoria }) {
  const data = Object.entries(byCategoria)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: CATEGORIA_CONFIG[k]?.label || k,
      value: v,
      color: CATEGORIA_CONFIG[k]?.color || '#94a3b8',
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1356E2]" />
            Distribuição por Categoria V5.2
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-[#0A0A0A]/50 italic">Sem casos V5.2 decididos ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#1356E2]" />
          Distribuição por Categoria V5.2
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => [`${value} caso(s)`, name]}
            />
            <Legend
              verticalAlign="bottom"
              iconSize={8}
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function TierApprovalChart({ tierStats }) {
  const data = Object.entries(tierStats).map(([tier, s]) => {
    const aprovRate = s.total > 0 ? (s.aprovados / s.total) * 100 : 0;
    return {
      tier: TIER_LABELS[tier] || tier,
      aprovados: s.aprovados,
      manual: s.manual,
      recusados: s.recusados,
      total: s.total,
      taxa: parseFloat(aprovRate.toFixed(1)),
    };
  });

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Aprovação por Tier (V5.2)
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-[#0A0A0A]/50 italic">Sem casos V5.2 com tier definido ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Aprovação por Tier (V5.2)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="tier" tick={{ fontSize: 10, fill: '#0A0A0A' }} />
            <YAxis tick={{ fontSize: 10, fill: '#0A0A0A' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => {
                if (name === 'taxa') return [`${value}%`, 'Taxa de aprovação'];
                return [value, name];
              }}
            />
            <Bar dataKey="aprovados" stackId="a" fill="#1356E2" name="Aprovados" />
            <Bar dataKey="manual" stackId="a" fill="#f59e0b" name="Revisão Manual" />
            <Bar dataKey="recusados" stackId="a" fill="#ef4444" name="Recusados" />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#0A0A0A]/8">
          {data.map((d) => (
            <div key={d.tier} className="text-center">
              <p className="text-[9px] uppercase text-[#0A0A0A]/50 font-bold">{d.tier}</p>
              <p className="text-sm font-bold font-mono text-emerald-600">{d.taxa}%</p>
              <p className="text-[9px] text-[#0A0A0A]/40">{d.total} casos</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FrameworkAdoptionBar({ byFramework, total }) {
  if (total === 0) return null;
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Rocket className="w-4 h-4 text-[#1356E2]" />
          Coexistência de Frameworks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
          {byFramework.v52 > 0 && <div className="bg-[#1356E2]" style={{ width: `${pct(byFramework.v52)}%` }} />}
          {byFramework.v51 > 0 && <div className="bg-blue-400" style={{ width: `${pct(byFramework.v51)}%` }} />}
          {byFramework.v4 > 0 && <div className="bg-slate-400" style={{ width: `${pct(byFramework.v4)}%` }} />}
          {byFramework.unknown > 0 && <div className="bg-slate-200" style={{ width: `${pct(byFramework.unknown)}%` }} />}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1356E2]" />
            <div>
              <p className="text-[10px] text-[#0A0A0A]/50 uppercase font-bold">V5.2</p>
              <p className="text-xs font-mono text-[#0A0A0A]">{byFramework.v52} ({pct(byFramework.v52).toFixed(1)}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <div>
              <p className="text-[10px] text-[#0A0A0A]/50 uppercase font-bold">V5.1</p>
              <p className="text-xs font-mono text-[#0A0A0A]">{byFramework.v51} ({pct(byFramework.v51).toFixed(1)}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <div>
              <p className="text-[10px] text-[#0A0A0A]/50 uppercase font-bold">V4</p>
              <p className="text-xs font-mono text-[#0A0A0A]">{byFramework.v4} ({pct(byFramework.v4).toFixed(1)}%)</p>
            </div>
          </div>
          {byFramework.unknown > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <div>
                <p className="text-[10px] text-[#0A0A0A]/50 uppercase font-bold">S/ versão</p>
                <p className="text-xs font-mono text-[#0A0A0A]">{byFramework.unknown}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CEOV5_2Widget({ cases = [] }) {
  const stats = useMemo(() => buildStats(cases), [cases]);

  // Não esconder o widget — sempre exibir para dar visibilidade da adoção (mesmo zero).

  return (
    <Card className="border border-[#1356E2]/30 bg-gradient-to-br from-[#1356E2]/[0.03] to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#1356E2]/15">
              <Rocket className="w-4 h-4 text-[#1356E2]" />
            </div>
            Framework V5.2 — Adoção & Decisões
          </CardTitle>
          <Badge className="bg-[#1356E2]/10 text-[#1356E2] border border-[#1356E2]/30 text-[10px]">
            BETA
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdoptionBanner stats={stats} />
        <FrameworkAdoptionBar byFramework={stats.byFramework} total={stats.totalCases} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoriaPie byCategoria={stats.byCategoria} />
          <TierApprovalChart tierStats={stats.tierStats} />
        </div>
      </CardContent>
    </Card>
  );
}