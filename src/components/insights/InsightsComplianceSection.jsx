import React from 'react';
import { Card } from '@/components/ui/card';
import StatCard from './StatCard';
import MinMaxMedianTable from './MinMaxMedianTable';
import { calcStats, formatNumber } from './insightsUtils';
import { Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#2bc196', '#002443', '#f59e0b', '#ef4444', '#94a3b8', '#8b5cf6'];

export default function InsightsComplianceSection({ cases, complianceScores }) {
  // Case status distribution
  const statusMap = {};
  cases.forEach(c => {
    const s = c.status || 'N/A';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // IA Decision distribution
  const iaMap = {};
  cases.forEach(c => {
    const d = c.iaDecision || 'N/A';
    iaMap[d] = (iaMap[d] || 0) + 1;
  });
  const iaData = Object.entries(iaMap).map(([name, value]) => ({ name, value }));

  // Risk scores
  const riskScoreStats = calcStats(cases.map(c => c.riskScore));

  // Red flags frequency
  const flagMap = {};
  cases.forEach(c => {
    (c.redFlags || []).forEach(f => {
      const key = f.substring(0, 60);
      flagMap[key] = (flagMap[key] || 0) + 1;
    });
  });
  const topFlags = Object.entries(flagMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Compliance Scores from SENTINEL
  const sqStats = calcStats(complianceScores.map(s => s.score_questionario));
  const sveStats = calcStats(complianceScores.map(s => s.score_validacao_externa));
  const sgcStats = calcStats(complianceScores.map(s => s.score_geral_composto));
  const confidenceStats = calcStats(complianceScores.map(s => s.nivel_confianca_ia));

  // Recommendation distribution
  const recMap = {};
  complianceScores.forEach(s => {
    const r = s.recomendacao_final || 'N/A';
    recMap[r] = (recMap[r] || 0) + 1;
  });
  const recData = Object.entries(recMap).map(([name, value]) => ({ name, value }));

  // Priority distribution
  const priorMap = {};
  cases.forEach(c => {
    const p = c.priority || 'medium';
    priorMap[p] = (priorMap[p] || 0) + 1;
  });

  // KPIs
  const totalCases = cases.length;
  const approved = statusMap['Aprovado'] || 0;
  const rejected = statusMap['Recusado'] || 0;
  const manual = statusMap['Manual'] || 0;
  const approvalRate = totalCases > 0 ? ((approved / totalCases) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-5 mt-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total de Casos" value={totalCases} subtitle={`${approved} aprovados`} icon={Shield} />
        <StatCard label="Taxa de Aprovação" value={`${approvalRate}%`} subtitle={`${rejected} recusados`} icon={CheckCircle2} />
        <StatCard label="Em Revisão Manual" value={manual} subtitle={`${totalCases > 0 ? ((manual / totalCases) * 100).toFixed(1) : 0}% do total`} icon={Clock} />
        <StatCard label="Risk Score Mediano" value={formatNumber(riskScoreStats.median)} subtitle={`Min: ${formatNumber(riskScoreStats.min)} / Max: ${formatNumber(riskScoreStats.max)}`} icon={AlertTriangle} />
      </div>

      {/* SENTINEL Scores */}
      {complianceScores.length > 0 && (
        <MinMaxMedianTable
          title="Scores SENTINEL (Compliance IA) — Mín / Mediana / Média / Máx"
          rows={[
            { label: 'Score Questionário (SQ) 0-1000', stats: sqStats },
            { label: 'Score Validação Externa (SVE) 0-1000', stats: sveStats },
            { label: 'Score Geral Composto (SGC) 0-1000', stats: sgcStats },
            { label: 'Nível de Confiança IA (0-100)', stats: confidenceStats },
          ].filter(r => r.stats.count > 0)}
          formatter={formatNumber}
        />
      )}

      <MinMaxMedianTable
        title="Risk Score dos Casos — Mín / Mediana / Média / Máx"
        rows={[{ label: 'Risk Score (0-100)', stats: riskScoreStats }].filter(r => r.stats.count > 0)}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Status pie */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Status dos Casos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {statusData.map((entry, i) => {
                  const colorMap = { Aprovado: '#2bc196', Recusado: '#ef4444', Manual: '#f59e0b', Pendente: '#94a3b8', 'Em Processamento': '#002443', 'Docs Solicitados': '#8b5cf6' };
                  return <Cell key={i} fill={colorMap[entry.name] || COLORS[i % COLORS.length]} />;
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* IA Decision pie */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Decisão da IA</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={iaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {iaData.map((entry, i) => {
                  const colorMap = { Aprovado: '#2bc196', Recusado: '#ef4444', 'Revisão Manual': '#f59e0b', 'Aprovado com Condições': '#36706c' };
                  return <Cell key={i} fill={colorMap[entry.name] || COLORS[i % COLORS.length]} />;
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Recommendation */}
        {recData.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-[#002443] mb-3">Recomendação SENTINEL</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={recData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {recData.map((entry, i) => {
                    const colorMap = { Aprovado: '#2bc196', 'Aprovado com Condições': '#36706c', 'Revisão Manual': '#f59e0b', Recusado: '#ef4444' };
                    return <Cell key={i} fill={colorMap[entry.name] || COLORS[i % COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Top Red Flags */}
      {topFlags.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Top Red Flags Mais Frequentes</h3>
          <div className="space-y-2">
            {topFlags.map(([flag, count], i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-xs text-red-800 flex-1 mr-4">{flag}...</span>
                <span className="text-xs font-bold text-red-600 flex-shrink-0">{count}x</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}