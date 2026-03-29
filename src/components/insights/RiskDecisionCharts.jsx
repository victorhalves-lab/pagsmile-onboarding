import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';

const DECISION_COLORS = {
  'Aprovado': '#22c55e',
  'Aprovado com Condições': '#eab308',
  'Revisão Manual': '#f97316',
  'Recusado': '#ef4444',
};

export default function RiskDecisionCharts({ scores }) {
  const data = useMemo(() => {
    // Decision pie
    const decDist = {};
    scores.forEach(s => {
      const d = s.recomendacao_final || 'Pendente';
      decDist[d] = (decDist[d] || 0) + 1;
    });
    const decisionData = Object.entries(decDist).map(([name, value]) => ({
      name, value, fill: DECISION_COLORS[name] || '#94a3b8',
    }));

    // Score histogram (buckets of 50)
    const buckets = {};
    for (let i = 0; i <= 1000; i += 50) buckets[`${i}-${i+49}`] = 0;
    scores.forEach(s => {
      const score = s.score_final ?? 0;
      const bucket = Math.min(Math.floor(score / 50) * 50, 950);
      const key = `${bucket}-${bucket + 49}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const histogramData = Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .map(([range, count]) => {
        const start = parseInt(range);
        const color = start < 100 ? '#22c55e' : start < 200 ? '#4ade80' : start < 300 ? '#3b82f6' : start < 400 ? '#60a5fa' : start < 500 ? '#eab308' : start < 600 ? '#f59e0b' : start < 850 ? '#f97316' : '#ef4444';
        return { range, count, fill: color };
      });

    // RR distribution
    const rrDist = {};
    scores.forEach(s => {
      const rr = `${s.rolling_reserve_percent ?? 0}%`;
      rrDist[rr] = (rrDist[rr] || 0) + 1;
    });
    const rrData = Object.entries(rrDist).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([name, value]) => ({ name, value }));

    // Approval rate
    const approved = scores.filter(s => s.recomendacao_final === 'Aprovado' || s.recomendacao_final === 'Aprovado com Condições').length;
    const approvalRate = scores.length > 0 ? ((approved / scores.length) * 100).toFixed(1) : 0;

    // Auto vs Manual
    const autoApproved = scores.filter(s => s.decisao_automatica === true).length;
    const autoRate = scores.length > 0 ? ((autoApproved / scores.length) * 100).toFixed(1) : 0;

    return { decisionData, histogramData, rrData, approvalRate, autoRate, approved, total: scores.length };
  }, [scores]);

  return (
    <div className="space-y-6">
      {/* Rates Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Taxa de Aprovação', value: `${data.approvalRate}%`, sub: `${data.approved}/${data.total}`, color: '#22c55e' },
          { label: 'Automática', value: `${data.autoRate}%`, sub: 'sem humano', color: '#3b82f6' },
          { label: 'Revisão Manual', value: data.decisionData.find(d => d.name === 'Revisão Manual')?.value || 0, sub: 'Faixa 4', color: '#f97316' },
          { label: 'Bloqueados', value: data.decisionData.find(d => d.name === 'Recusado')?.value || 0, sub: 'Faixa 5', color: '#ef4444' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 text-center">
            <p className="text-2xl font-extrabold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] font-bold text-[#002443]/50 mt-1">{m.label}</p>
            <p className="text-[9px] text-[#002443]/30">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Distribuição de Decisões</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.decisionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {data.decisionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RR Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Distribuição Rolling Reserve</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.rrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Casos" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Score Histogram */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Histograma de Scores (faixas de 50 pontos)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Casos" radius={[4, 4, 0, 0]}>
                {data.histogramData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}