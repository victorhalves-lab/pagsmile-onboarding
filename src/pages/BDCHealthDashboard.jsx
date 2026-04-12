import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import {
  Database, CheckCircle2, AlertTriangle, XCircle, Clock,
  BarChart3, Users, Activity, Shield, TrendingUp, RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#94a3b8'];

export default function BDCHealthDashboard() {
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['bdc-health-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 200),
  });

  const { data: scores = [], isLoading: scoresLoading } = useQuery({
    queryKey: ['bdc-health-scores'],
    queryFn: () => base44.entities.ComplianceScore.list('-created_date', 200),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['bdc-health-alerts'],
    queryFn: async () => {
      const logs = await base44.entities.IntegrationLog.filter({ provider: 'BigDataCorp' }, '-created_date', 50);
      return logs.filter(l => l.request_payload?.alert === 'SCORE_DELTA_ALERT');
    },
  });

  const stats = useMemo(() => {
    const total = cases.length;
    const bdcComplete = cases.filter(c => c.bigDataCorpCompleted).length;
    const bdcPending = total - bdcComplete;
    const scoreMap = new Map(scores.map(s => [s.onboarding_case_id, s]));
    
    let fullDataCount = 0;
    let partialDataCount = 0;
    let noDataCount = 0;
    const subfaixaCounts = {};
    const scoreBuckets = { '0-100': 0, '101-200': 0, '201-400': 0, '401-600': 0, '601-849': 0, '850+': 0 };

    for (const c of cases) {
      const score = scoreMap.get(c.id);
      if (!score || !score.fase_2_completa) {
        noDataCount++;
        continue;
      }
      
      const vars = score.variaveis_aplicadas;
      if (vars && typeof vars === 'object') {
        const sectionCount = Object.keys(vars).filter(k => vars[k]?.items?.length > 0).length;
        if (sectionCount >= 4) fullDataCount++;
        else if (sectionCount >= 2) partialDataCount++;
        else noDataCount++;
      } else {
        noDataCount++;
      }

      const sf = score.subfaixa || 'N/D';
      subfaixaCounts[sf] = (subfaixaCounts[sf] || 0) + 1;

      const sv = score.score_final || 0;
      if (sv >= 850) scoreBuckets['850+']++;
      else if (sv >= 601) scoreBuckets['601-849']++;
      else if (sv >= 401) scoreBuckets['401-600']++;
      else if (sv >= 201) scoreBuckets['201-400']++;
      else if (sv >= 101) scoreBuckets['101-200']++;
      else scoreBuckets['0-100']++;
    }

    return {
      total, bdcComplete, bdcPending,
      completionRate: total > 0 ? Math.round((bdcComplete / total) * 100) : 0,
      fullDataCount, partialDataCount, noDataCount,
      subfaixaCounts, scoreBuckets,
    };
  }, [cases, scores]);

  const isLoading = casesLoading || scoresLoading;

  const healthPie = [
    { name: 'Completo', value: stats.fullDataCount },
    { name: 'Parcial', value: stats.partialDataCount },
    { name: 'Sem Dados', value: stats.noDataCount },
  ].filter(d => d.value > 0);

  const scoreDistribution = Object.entries(stats.scoreBuckets).map(([range, count]) => ({ range, count }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-[#002443]/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#002443]">Saúde dos Dados BDC</h1>
        <p className="text-sm text-[#002443]/50">Visão geral de completude e qualidade dos enriquecimentos Big Data Corp</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard icon={Users} label="Total Merchants" value={stats.total} color="blue" />
        <KPICard icon={CheckCircle2} label="BDC Completo" value={stats.bdcComplete} color="green" />
        <KPICard icon={Clock} label="BDC Pendente" value={stats.bdcPending} color="amber" />
        <KPICard icon={Activity} label="Taxa Completude" value={`${stats.completionRate}%`} color="indigo" />
        <KPICard icon={AlertTriangle} label="Alertas Delta" value={alerts.length} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-[#002443] mb-4">Qualidade dos Dados</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={healthPie} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" stroke="none">
                  {healthPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {healthPie.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-[#002443]">{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-[#002443] mb-4">Distribuição de Scores</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fill: '#002443', fontSize: 10 }} />
              <YAxis tick={{ fill: '#002443', fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2bc196" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Delta Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alertas de Mudança de Score (&gt;100 pts entre consultas)
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 20).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-xs font-semibold text-red-800">
                      {a.response_payload?.merchantName || a.merchant_id} — {a.response_payload?.document}
                    </p>
                    <p className="text-[11px] text-red-600/70">{a.response_payload?.alert}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`text-[10px] ${
                    a.red_flags?.[0]?.includes('CRITICAL') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {a.response_payload?.oldSubfaixa} → {a.response_payload?.newSubfaixa}
                  </Badge>
                  <p className="text-[10px] text-[#002443]/40 mt-1">
                    {new Date(a.created_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subfaixa Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-[#002443] mb-3">Distribuição por Subfaixa</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.subfaixaCounts).sort().map(([sf, count]) => {
            const colors = {
              '1A': 'bg-emerald-100 text-emerald-700', '1B': 'bg-emerald-50 text-emerald-600',
              '2A': 'bg-blue-100 text-blue-700', '2B': 'bg-blue-50 text-blue-600',
              '3A': 'bg-amber-100 text-amber-700', '3B': 'bg-orange-100 text-orange-700',
              '4': 'bg-red-100 text-red-700', '5': 'bg-red-200 text-red-800',
            };
            return (
              <div key={sf} className={`px-4 py-3 rounded-xl ${colors[sf] || 'bg-slate-100 text-slate-700'} text-center min-w-[80px]`}>
                <p className="text-xl font-black">{count}</p>
                <p className="text-[10px] font-bold">{sf}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 text-${color}-500`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40">{label}</span>
      </div>
      <p className={`text-2xl font-black text-${color}-600`}>{value}</p>
    </div>
  );
}